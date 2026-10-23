import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { getFees } from "@/lib/settings";
import { csvAmount, csvResponse, forbidden } from "@/components/admin/csv";

// KSK-Übersicht für Managed Crews: Bei Managed Crews beauftragt Creative Connect die Kreativen selbst
// und ist damit ggf. abgabepflichtig. Kein Rechtsrat – nur Übersicht.
export async function GET() {
  const user = await getCurrentUser();
  if (!user?.isAdmin) return forbidden();

  const fees = await getFees();
  const projects = await db.project.findMany({
    where: { type: "managed" },
    include: { owner: true, roles: { include: { assignee: { include: { profile: true } } }, orderBy: { sort: "asc" } } },
    orderBy: { startDate: "asc" },
  });

  const rows: (string | number)[][] = [
    ["Projekt", "Auftraggeber:in", "Start", "Rolle", "Kreative:r", "KSK-Mitglied", "Honorar (EUR)", `Mögliche Abgabe ${csvAmount(fees.kskRatePct)} % (EUR)`],
  ];
  let total = 0;
  for (const p of projects) {
    for (const r of p.roles) {
      if (!r.assignee) continue;
      total += r.budget;
      rows.push([
        p.title,
        p.owner.company ?? p.owner.name,
        p.startDate.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" }),
        r.title,
        r.assignee.name,
        r.assignee.profile?.kskMember ? "ja" : "nein",
        csvAmount(r.budget),
        csvAmount((r.budget * fees.kskRatePct) / 100),
      ]);
    }
  }
  rows.push(["Summe", "", "", "", "", "", csvAmount(total), csvAmount((total * fees.kskRatePct) / 100)]);
  rows.push([]);
  rows.push([
    `Bagatellgrenze ${csvAmount(fees.kskThresholdEur)} EUR/Jahr ${total > fees.kskThresholdEur ? "überschritten – Abgabe voraussichtlich fällig" : "nicht überschritten"}.`,
  ]);
  rows.push(["Hinweis: Demo mit fiktiven Daten, kein Rechtsrat."]);
  return csvResponse(`ksk-uebersicht-managed-crews-${new Date().getFullYear()}.csv`, rows);
}
