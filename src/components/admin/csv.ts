// CSV-Helfer für Admin-Exporte: Semikolon, UTF-8 mit BOM (Excel-kompatibel), deutsches Zahlenformat.
const num = new Intl.NumberFormat("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2, useGrouping: false });

export const csvAmount = (value: number) => num.format(value);

function cell(value: string | number) {
  const s = typeof value === "number" ? String(value) : value;
  return /[;"\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function csvResponse(filename: string, rows: (string | number)[][]) {
  const body = "﻿" + rows.map((r) => r.map(cell).join(";")).join("\r\n") + "\r\n";
  return new Response(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}

export function forbidden() {
  return new Response("Nur für Admins.", { status: 403, headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
