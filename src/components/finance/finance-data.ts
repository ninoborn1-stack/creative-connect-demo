import "server-only";
import { db } from "@/lib/db";

// Maßgebliches Datum einer Zahlung: Auszahlung › Freigabe › Reservierung
export function paymentDate(p: { createdAt: Date; releasedAt: Date | null; paidOutAt: Date | null }) {
  return p.paidOutAt ?? p.releasedAt ?? p.createdAt;
}

// Vereinfachte Einordnung für die Demo: künstlerische/publizistische Leistungen sind i. d. R. abgabepflichtig,
// reine Raummiete nicht. Kein Rechtsrat.
export function kskLiability(category: string | undefined): { liable: boolean; note: string } {
  if (category === "tonstudio") return { liable: false, note: "nein (Raum-/Studiomiete, ggf. prüfen)" };
  return { liable: true, note: "ja (künstlerische Leistung)" };
}

export interface HonorarRow {
  id: string;
  date: Date;
  project: string;
  payee: string;
  service: string;
  category?: string;
  amount: number;
  liable: boolean;
  liabilityNote: string;
}

// Honorare an Kreative aus Projekten des Auftraggebers im Kalenderjahr (ohne Erstattungen)
export async function getClientHonorare(ownerId: string, year: number): Promise<HonorarRow[]> {
  const payments = await db.payment.findMany({
    where: { project: { ownerId }, status: { not: "erstattet" } },
    include: {
      payee: { select: { name: true } },
      project: { select: { title: true, roles: { select: { title: true, category: true } } } },
    },
    orderBy: { createdAt: "asc" },
  });
  return payments
    .filter((p) => paymentDate(p).getFullYear() === year)
    .map((p) => {
      const category = p.project?.roles.find((r) => r.title === p.label)?.category;
      const l = kskLiability(category);
      return {
        id: p.id,
        date: paymentDate(p),
        project: p.project?.title ?? "–",
        payee: p.payee?.name ?? "offen",
        service: p.label,
        category,
        amount: p.amount,
        liable: l.liable,
        liabilityNote: l.note,
      };
    })
    .sort((a, b) => a.date.getTime() - b.date.getTime());
}

export function kskSummary(rows: HonorarRow[], ratePct: number, thresholdEur: number) {
  const total = rows.reduce((s, r) => s + r.amount, 0);
  const liableTotal = rows.filter((r) => r.liable).reduce((s, r) => s + r.amount, 0);
  const aboveThreshold = liableTotal > thresholdEur;
  const levy = aboveThreshold ? Math.round(liableTotal * ratePct) / 100 : 0;
  return { total, liableTotal, aboveThreshold, levy };
}
