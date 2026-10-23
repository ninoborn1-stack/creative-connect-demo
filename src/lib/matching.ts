import "server-only";
import { db } from "@/lib/db";
import { CITIES } from "@/lib/constants";
import { distanceKm, parseJson } from "@/lib/format";

// Crew-Vorschlag per transparentem Scoring (keine Blackbox, AGB „Ranking-Kriterien“):
// Bereich passt (Pflicht) · Tagessatz im Rollenbudget · Nähe zum Ort · Verfügbarkeit · Bewertung · Verifizierung.
export async function suggestCrew(category: string, roleBudget: number, location: string, excludeIds: string[] = []) {
  const city = CITIES.find((c) => c.name === location);
  const profiles = await db.profile.findMany({
    where: { categories: { contains: `"${category}"` }, user: { status: { not: "gesperrt" }, isCreative: true, id: { notIn: excludeIds } } },
    include: { user: true },
  });

  return profiles
    .map((p) => {
      const reasons: string[] = [];
      let score = 0;
      if (p.dayRateMin <= roleBudget) {
        score += 30;
        reasons.push(`Tagessatz ab ${p.dayRateMin} € passt ins Rollenbudget`);
      } else {
        score -= 20;
      }
      if (city) {
        const km = distanceKm(city, p);
        if (km < 30) {
          score += 25;
          reasons.push(`sitzt in ${p.city}`);
        } else if (km <= p.travelRadiusKm) {
          score += 12;
          reasons.push(`reist bis ${p.travelRadiusKm} km (${km} km entfernt)`);
        }
      }
      if (p.availability === "verfuegbar") {
        score += 15;
        reasons.push("aktuell verfügbar");
      } else if (p.availability === "teilweise") score += 5;
      score += p.ratingAvg * 4;
      if (p.ratingCount > 0) reasons.push(`${p.ratingAvg.toFixed(1)} ★ aus ${p.ratingCount} Projekten`);
      if (p.verified) {
        score += 5;
        reasons.push("verifiziert");
      }
      const skills = parseJson<string[]>(p.skills, []);
      return { profile: p, user: p.user, score, reasons: reasons.slice(0, 3), skills };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}
