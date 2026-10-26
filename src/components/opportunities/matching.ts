import { categoryName } from "@/lib/constants";
import { parseJson } from "@/lib/format";

const norm = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").trim();

// Passung Ausschreibung ↔ Profil: Kategorien zählen am meisten, dazu Skills (auch Teilwörter, z. B. „Game-Audio“ ↔ „Audio“)
export function matchOpportunity(
  profile: { categories: string; skills: string } | null | undefined,
  opp: { categories: string; skills: string },
): { score: number; reason: string | null } {
  if (!profile) return { score: 0, reason: null };
  const myCats = parseJson<string[]>(profile.categories, []);
  const mySkills = parseJson<string[]>(profile.skills, []).map(norm);
  const cats = parseJson<string[]>(opp.categories, []);
  const skills = parseJson<string[]>(opp.skills, []);
  const catHits = cats.filter((c) => myCats.includes(c));
  const skillHits = skills.filter((s) => {
    const n = norm(s);
    return mySkills.some((m) => m === n || (m.length > 3 && n.includes(m)) || (n.length > 3 && m.includes(n)));
  });
  const score = catHits.length * 10 + skillHits.length * 4;
  if (!score) return { score: 0, reason: null };
  const parts = [
    catHits.length ? categoryName(catHits[0]) : null,
    skillHits.length ? `${skillHits.length} passende${skillHits.length === 1 ? "r Skill" : " Skills"}` : null,
  ].filter(Boolean);
  return { score, reason: `Passt zu dir: ${parts.join(" · ")}` };
}
