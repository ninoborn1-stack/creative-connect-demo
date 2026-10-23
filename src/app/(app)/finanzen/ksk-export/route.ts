import { getCurrentUser } from "@/lib/session";
import { getFees } from "@/lib/settings";
import { formatDate } from "@/lib/format";
import { getClientHonorare, kskSummary } from "@/components/finance/finance-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const num = (v: number) => v.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function cell(value: string) {
  return /[;"\n\r]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

// Jahresübersicht der Honorare an Kreative (Vorbereitung Künstlersozialabgabe) – Demo, kein Rechtsrat
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return new Response("Nicht angemeldet", { status: 401 });

  const year = new Date().getFullYear();
  const fees = await getFees();
  const rows = await getClientHonorare(user.id, year);
  const sum = kskSummary(rows, fees.kskRatePct, fees.kskThresholdEur);
  const rate = fees.kskRatePct.toLocaleString("de-DE");

  const lines: string[][] = [
    ["Datum", "Projekt", "Empfänger:in", "Leistung", "Honorar netto (EUR)", "KSK-pflichtig", `mögliche Abgabe ${rate} % (EUR)`],
    ...rows.map((r) => [
      formatDate(r.date),
      r.project,
      r.payee,
      r.service,
      num(r.amount),
      r.liabilityNote,
      num(r.liable ? Math.round(r.amount * fees.kskRatePct) / 100 : 0),
    ]),
    [],
    ["Summe", "", "", "", num(sum.total), `abgabepflichtig: ${num(sum.liableTotal)}`, num(sum.levy)],
    [
      "Hinweis",
      sum.aboveThreshold
        ? `Abgabepflichtige Honorare über der Bagatellgrenze von ${num(fees.kskThresholdEur)} EUR/Jahr.`
        : `Abgabepflichtige Honorare unter der Bagatellgrenze von ${num(fees.kskThresholdEur)} EUR/Jahr – voraussichtlich keine Abgabe.`,
    ],
    ["Hinweis", `Demo – fiktive Daten, kein Rechtsrat. Erstellt am ${formatDate(new Date())} für ${user.company ?? user.name}.`],
  ];

  const csv = "﻿" + lines.map((l) => l.map(cell).join(";")).join("\r\n") + "\r\n";
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="ksk-jahresuebersicht-${year}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
