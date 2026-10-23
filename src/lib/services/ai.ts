// Briefing-Assistent. Standard: regelbasierter Mock (Keywords, Budgetschlüssel).
// Mit ANTHROPIC_API_KEY: echter Aufruf an die Claude API mit strukturierter JSON-Ausgabe.
// Der Assistent schlägt nur vor – entschieden wird immer von Menschen (EU AI Act, Art. 50: als KI gekennzeichnet).
import { z } from "zod";
import { CATEGORIES, CITIES } from "@/lib/constants";

const categorySlugs = CATEGORIES.map((c) => c.slug) as [string, ...string[]];

export const StructuredBriefingSchema = z.object({
  title: z.string(),
  goal: z.string(),
  format: z.string(),
  dates: z.string(),
  location: z.string(),
  style: z.string(),
  budget: z.number().int(),
  roles: z.array(
    z.object({
      title: z.string(),
      category: z.enum(categorySlugs),
      sharePct: z.number(),
      reason: z.string(),
    }),
  ),
});

export type StructuredBriefing = z.infer<typeof StructuredBriefingSchema> & { source: "mock" | "claude" };

type Template = { match: RegExp; title: string; format: string; roles: { title: string; category: string; sharePct: number; reason: string }[] };

const TEMPLATES: Template[] = [
  {
    match: /musikvideo|video ?clip|single|release|music ?video/i,
    title: "Musikvideo",
    format: "Musikvideo, 3–4 Min., plus 3 Vertical Cuts für Social Media",
    roles: [
      { title: "Regie & Videografie", category: "videografie", sharePct: 40, reason: "Konzept, Dreh und Schnitt sind der größte Block." },
      { title: "Schauspiel / Darsteller:in", category: "schauspiel", sharePct: 15, reason: "Story-Szenen brauchen eine zweite Person vor der Kamera." },
      { title: "Set- & Coverfotografie", category: "fotografie", sharePct: 15, reason: "Stills für Cover, Presse und Release-Posts direkt am Set." },
      { title: "Location-Booking", category: "booking", sharePct: 15, reason: "Drehort und Genehmigungen organisieren." },
      { title: "Cover & Social-Design", category: "grafikdesign", sharePct: 15, reason: "Einheitlicher Look für Release-Kampagne." },
    ],
  },
  {
    match: /shooting|kampagne|lookbook|produkt|streetwear|fashion|kollektion/i,
    title: "Produktshooting",
    format: "Lookbook mit 30 Motiven + 6 Kurzvideos (9:16)",
    roles: [
      { title: "Fotografie", category: "fotografie", sharePct: 40, reason: "Kern der Kampagne sind die Lookbook-Motive." },
      { title: "Video (Reels)", category: "videografie", sharePct: 25, reason: "Kurzvideos für Instagram und TikTok parallel zum Shooting." },
      { title: "Models / Darsteller:innen", category: "schauspiel", sharePct: 15, reason: "Mehrere Looks brauchen zwei Gesichter." },
      { title: "Studio", category: "tonstudio", sharePct: 0, reason: "" },
      { title: "Art Direction & Layout", category: "grafikdesign", sharePct: 20, reason: "Bildsprache und Lookbook-Layout aus einer Hand." },
    ].filter((r) => r.sharePct > 0),
  },
  {
    match: /podcast|folge|episode|interview|hörbuch/i,
    title: "Podcast-Produktion",
    format: "10 Folgen à 45 Min., Audio + Video-Podcast",
    roles: [
      { title: "Studio & Aufnahme", category: "tonstudio", sharePct: 35, reason: "Zehn Aufnahmetermine mit Engineer im Studio." },
      { title: "Schnitt, Mix & Mastering", category: "musikproduktion", sharePct: 25, reason: "Jede Folge braucht Schnitt und Lautheitsanpassung." },
      { title: "Intro-Jingle", category: "musikproduktion", sharePct: 10, reason: "Wiedererkennbarer Sound für alle Folgen." },
      { title: "Video-Podcast", category: "videografie", sharePct: 20, reason: "Zwei Kameras für YouTube-Fassung und Clips." },
      { title: "Cover-Artwork", category: "grafikdesign", sharePct: 10, reason: "Podcast-Cover und Folgen-Thumbnails." },
    ],
  },
];

const GENERIC: Template = {
  match: /.*/,
  title: "Kreativprojekt",
  format: "Nach Absprache",
  roles: [
    { title: "Musikproduktion", category: "musikproduktion", sharePct: 35, reason: "Audio ist im Briefing zentral." },
    { title: "Videografie", category: "videografie", sharePct: 35, reason: "Bewegtbild für Social Media." },
    { title: "Grafikdesign", category: "grafikdesign", sharePct: 30, reason: "Visueller Auftritt." },
  ],
};

function extractBudget(text: string) {
  const k = text.match(/(\d+(?:[.,]\d+)?)\s*(?:k|tsd|tausend)\b/i);
  if (k) return Math.round(parseFloat(k[1].replace(",", ".")) * 1000);
  const eur = text.match(/(\d{1,3}(?:[.\s]\d{3})+|\d{3,6})\s*(?:€|eur|euro)/i);
  if (eur) return parseInt(eur[1].replace(/[.\s]/g, ""), 10);
  return 5000;
}

function extractDates(text: string) {
  const d = text.match(/\b(\d{1,2}\.\d{1,2}\.(?:\d{2,4})?)/g);
  if (d) return d.join(" – ");
  const month = text.match(/\b(januar|februar|märz|april|mai|juni|juli|august|september|oktober|november|dezember)\b/i);
  if (month) return `${month[1][0].toUpperCase()}${month[1].slice(1)} (genaue Tage offen)`;
  if (/wochenende/i.test(text)) return "Ein Wochenende (Termin offen)";
  return "Noch offen";
}

function extractStyle(text: string) {
  const styles = ["düster", "analog", "retro", "minimalistisch", "urban", "cinematic", "bunt", "roh", "edgy", "clean", "90er", "y2k", "neon", "natürlich"];
  const found = styles.filter((s) => text.toLowerCase().includes(s));
  return found.length ? found.map((s) => s[0].toUpperCase() + s.slice(1)).join(", ") : "Noch offen – im Projektraum klären";
}

export function mockBriefing(raw: string): StructuredBriefing {
  const tpl = TEMPLATES.find((t) => t.match.test(raw)) ?? GENERIC;
  const budget = extractBudget(raw);
  const city = CITIES.find((c) => raw.toLowerCase().includes(c.name.toLowerCase()))?.name ?? "Deutschlandweit";
  const firstSentence = raw.split(/[.!?\n]/)[0]?.trim() || tpl.title;
  return {
    source: "mock",
    title: `${tpl.title}${city !== "Deutschlandweit" ? ` in ${city}` : ""}`,
    goal: firstSentence.length > 140 ? `${firstSentence.slice(0, 137)}…` : firstSentence,
    format: tpl.format,
    dates: extractDates(raw),
    location: city,
    style: extractStyle(raw),
    budget,
    roles: tpl.roles,
  };
}

export async function structureBriefing(raw: string): Promise<StructuredBriefing> {
  if (!process.env.ANTHROPIC_API_KEY) return mockBriefing(raw);
  try {
    const { default: Anthropic } = await import("@anthropic-ai/sdk");
    const { zodOutputFormat } = await import("@anthropic-ai/sdk/helpers/zod");
    const client = new Anthropic();
    const response = await client.messages.parse({
      model: process.env.ANTHROPIC_MODEL || "claude-opus-5-5",
      max_tokens: 4000,
      output_config: { effort: "low", format: zodOutputFormat(StructuredBriefingSchema) },
      system:
        "Du strukturierst Projekt-Briefings für eine deutsche Crew-Plattform der Kreativbranche. " +
        "Antworte auf Deutsch. Verteile das Budget (EUR, ganzzahlig) auf 2–6 Rollen; sharePct summiert sich auf 100. " +
        "Erfinde keine Termine oder Orte: Was fehlt, ist „Noch offen“.",
      messages: [{ role: "user", content: raw }],
    });
    if (!response.parsed_output) return mockBriefing(raw);
    return { ...response.parsed_output, source: "claude" };
  } catch (error) {
    console.error("Claude API nicht erreichbar, nutze Mock:", error);
    return mockBriefing(raw);
  }
}

// Spracheingabe im Mock: feste Beispiel-Transkription
export const MOCK_TRANSCRIPT =
  "Hey, ich bin Mara, ich bringe im März meine Single raus und brauche dafür ein Musikvideo in Leipzig. " +
  "Eher düster und analog, so 90er-Vibe. Budget sind so 6.000 Euro, gedreht werden soll an einem Wochenende.";

export const DEMO_BRIEFINGS = [
  {
    label: "Musikvideo für Single-Release",
    text: "Musikvideo für meine neue Single „Nachtfahrt“, Release am 14.03. Dreh in Hamburg an einem Wochenende, Stil cinematic und düster mit Neon. Budget 8.000 €.",
  },
  {
    label: "Produktshooting Streetwear-Label",
    text: "Wir sind ein kleines Streetwear-Label aus Köln und brauchen ein Lookbook-Shooting für die Frühjahrskollektion plus Reels. Urban, clean, natürliches Licht. Budget 12k.",
  },
  {
    label: "Podcast-Studio für 10 Folgen",
    text: "Für unseren Interview-Podcast suchen wir ein Studio in Berlin für 10 Folgen inkl. Schnitt, Jingle und Video-Version für YouTube. Budget 9.500 Euro, Start im Februar.",
  },
];
