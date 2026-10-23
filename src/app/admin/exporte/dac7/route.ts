import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { csvAmount, csvResponse, forbidden } from "@/components/admin/csv";

// DAC7-Vorbereitung (Plattformen-Steuertransparenzgesetz): Umsätze je Anbieter:in und Quartal.
// Demo: fiktive Daten, keine Meldung an das BZSt.
export async function GET() {
  const user = await getCurrentUser();
  if (!user?.isAdmin) return forbidden();

  const year = new Date().getFullYear();
  const from = new Date(year, 0, 1);
  const to = new Date(year + 1, 0, 1);
  const paid = await db.payment.findMany({
    where: { status: "ausgezahlt", payeeId: { not: null }, paidOutAt: { gte: from, lt: to } },
    include: { payee: { include: { profile: true } } },
  });

  const byPayee = new Map<string, { name: string; email: string; city: string; taxId: boolean; count: number; q: number[] }>();
  for (const p of paid) {
    if (!p.payee || !p.paidOutAt) continue;
    const row = byPayee.get(p.payee.id) ?? {
      name: p.payee.name,
      email: p.payee.email,
      city: p.payee.profile?.city ?? "",
      taxId: p.payee.profile?.taxIdProvided ?? false,
      count: 0,
      q: [0, 0, 0, 0],
    };
    row.count += 1;
    row.q[Math.floor(p.paidOutAt.getMonth() / 3)] += p.amount;
    byPayee.set(p.payee.id, row);
  }

  const rows: (string | number)[][] = [
    ["Name", "E-Mail", "Stadt", "Steuer-ID hinterlegt", "Anzahl Transaktionen", `Umsatz Q1 ${year} (EUR)`, `Umsatz Q2 ${year} (EUR)`, `Umsatz Q3 ${year} (EUR)`, `Umsatz Q4 ${year} (EUR)`, "Summe (EUR)"],
  ];
  for (const r of [...byPayee.values()].sort((a, b) => a.name.localeCompare(b.name, "de"))) {
    rows.push([r.name, r.email, r.city, r.taxId ? "ja" : "nein", r.count, ...r.q.map(csvAmount), csvAmount(r.q.reduce((s, v) => s + v, 0))]);
  }
  rows.push([]);
  rows.push(["Hinweis: Demo mit fiktiven Daten – keine Meldung an das BZSt."]);
  return csvResponse(`dac7-vorbereitung-${year}.csv`, rows);
}
