// Auto-Analyse für Bewerbungen von Kreativen.
// Standard: regelbasierter Mock (Schlüsselwörter aus Freitext, Lebenslauf/Portfolio-Text und Links).
// Mit ANTHROPIC_API_KEY: echter Aufruf an die Claude API mit strukturierter Ausgabe (zod), bei Fehlern Mock.
// Die Vorprüfung (Score) ist immer regelbasiert und nachvollziehbar – sie empfiehlt nur, die Entscheidung
// trifft das Team (EU AI Act: automatisierte Vorprüfung ist gekennzeichnet, Mensch entscheidet).
import { z } from "zod";
import { INDUSTRIES, categoryName, industryName } from "@/lib/constants";
import {
  LINK_FIELDS, checkLink,
  type ApplicationCheck, type ApplicationLinks, type ExtractedProfile, type LinkKey, type NetworkContext,
} from "@/lib/application-meta";

export * from "@/lib/application-meta";

// ---------------------------------------------------------------- Typen

export type ApplicationInput = {
  name: string;
  email: string;
  city: string;
  categories: string[];
  links: ApplicationLinks;
  pitch: string;
  cvText?: string | null;
};

// ---------------------------------------------------------------- Wissensbasis

// Skill-Bibliothek je Bereich (entspricht den Skills im Verzeichnis) mit Schlüsselwörtern zur Erkennung
const SKILL_LIBRARY: Record<string, { skill: string; keys: RegExp }[]> = {
  musikproduktion: [
    { skill: "Beats", keys: /\bbeats?\b|beatmak/i },
    { skill: "Songwriting", keys: /songwrit|topline|hook|texte?r?\b|lyrics/i },
    { skill: "Recording", keys: /\brecording|aufnahme/i },
    { skill: "Mixing", keys: /\bmix(ing|e|t)?\b|mischung/i },
    { skill: "Mastering", keys: /master(ing|t)?\b/i },
    { skill: "Ableton", keys: /ableton/i },
    { skill: "Pro Tools", keys: /pro ?tools/i },
    { skill: "Vocal-Editing", keys: /vocal[- ]?edit|melodyne|tuning/i },
    { skill: "Sounddesign", keys: /sound ?design|sfx|soundeffekt/i },
    { skill: "Film-Scoring", keys: /scor(e|ing)|filmmusik|soundtrack/i },
    { skill: "Game-Audio", keys: /game[- ]?audio|spielesound|audio für games/i },
    { skill: "Sync & Licensing", keys: /\bsync\b|licens|lizenz/i },
    { skill: "Adaptive Music (Wwise/FMOD)", keys: /wwise|fmod|adaptive music|interaktive musik/i },
  ],
  tonstudio: [
    { skill: "Studio-Engineering", keys: /engineer|toningenieur|tonmeister/i },
    { skill: "Vocal-Recording", keys: /vocal[- ]?(recording|aufnahme)|gesangsaufnahme/i },
    { skill: "Live-Recording", keys: /live[- ]?(recording|mitschnitt|aufnahme)/i },
    { skill: "Podcast-Aufnahme", keys: /podcast/i },
    { skill: "Dolby Atmos", keys: /atmos|immersive|spatial/i },
    { skill: "Analog-Outboard", keys: /analog|outboard|neve|ssl\b/i },
    { skill: "Foley", keys: /foley|geräusch/i },
    { skill: "Voice-Recording für Games", keys: /voice[- ]?(recording|over)|sprachaufnahme|vo[- ]session/i },
  ],
  videografie: [
    { skill: "Regie", keys: /regie|director|regisseur/i },
    { skill: "Kamera", keys: /kamera|camera|\bdop\b|kameramann|kamerafrau/i },
    { skill: "Drohne", keys: /drohne|drone|fpv/i },
    { skill: "Schnitt", keys: /schnitt|editing|cutter|premiere/i },
    { skill: "Color Grading", keys: /color|grading|farbkorrektur/i },
    { skill: "DaVinci Resolve", keys: /davinci|resolve/i },
    { skill: "Gimbal", keys: /gimbal|ronin/i },
    { skill: "Musikvideos", keys: /musikvideo|music ?video/i },
    { skill: "Reels", keys: /\breels?\b|tiktok|shorts/i },
    { skill: "Game-Trailer", keys: /(game|launch|gameplay)[- ]?trailer|trailer für (ein|das)/i },
    { skill: "Imagefilm", keys: /imagefilm|employer branding|unternehmensfilm/i },
  ],
  fotografie: [
    { skill: "Portrait", keys: /portr(ai|ä)t/i },
    { skill: "Fashion", keys: /fashion|mode|lookbook/i },
    { skill: "Produkt", keys: /produkt(foto|fotografie|shooting)?|packshot/i },
    { skill: "Event", keys: /event|konzert|festival/i },
    { skill: "Analog", keys: /analog|mittelformat|film(rolle|kamera)/i },
    { skill: "Studio-Licht", keys: /studio[- ]?licht|blitz|lichtsetzung/i },
    { skill: "Retusche", keys: /retusche|photoshop|lightroom/i },
    { skill: "Albumcover", keys: /album ?cover|cover[- ]?(art|foto)/i },
  ],
  booking: [
    { skill: "Location-Scouting", keys: /location|scouting/i },
    { skill: "Event-Planung", keys: /event|veranstaltung|planung/i },
    { skill: "Künstlerkartei", keys: /künstler|artist|roster|kartei/i },
    { skill: "Tourplanung", keys: /tour/i },
    { skill: "Genehmigungen", keys: /genehmigung|behörde|permit/i },
    { skill: "Catering-Koordination", keys: /catering/i },
  ],
  schauspiel: [
    { skill: "Musikvideo", keys: /musikvideo/i },
    { skill: "Werbung", keys: /werbung|werbespot|commercial|kampagne/i },
    { skill: "Kurzfilm", keys: /kurzfilm|short ?film/i },
    { skill: "Improvisation", keys: /improvis/i },
    { skill: "Tanz", keys: /tanz|dance|choreo/i },
    { skill: "Moderation", keys: /moderat|host/i },
    { skill: "Synchron", keys: /synchron|dubbing|hörspiel|hörbuch/i },
    { skill: "Voice Acting", keys: /voice ?act|sprecher|stimme|voice[- ]?over/i },
    { skill: "Motion Capture", keys: /motion ?capture|mocap|performance capture/i },
  ],
  grafikdesign: [
    { skill: "Albumcover", keys: /album ?cover|cover[- ]?art|artwork/i },
    { skill: "Branding", keys: /branding|corporate design|logo|brand/i },
    { skill: "Merch", keys: /merch/i },
    { skill: "Typografie", keys: /typo/i },
    { skill: "Motion Design", keys: /motion ?design|after effects|animation/i },
    { skill: "Illustration", keys: /illustrat/i },
    { skill: "Social-Templates", keys: /social[- ]?(templates|media|content)/i },
    { skill: "Concept Art", keys: /concept ?art|konzeptzeichnung|environment/i },
    { skill: "3D & Key Visuals", keys: /\b3d\b|blender|cinema ?4d|key ?visual/i },
    { skill: "UI für Games", keys: /\bui\b|hud|interface/i },
  ],
};

// Branchen-Signale (Schlüssel aus INDUSTRIES)
const INDUSTRY_SIGNALS: Record<string, RegExp[]> = {
  gaming: [/\bgam(e|es|ing)\b/i, /games?-?(studio|audio|trailer)|indie-?(studio|game)/i, /wwise|fmod|unity|unreal/i, /\brpg\b|mobile-?game|steam|playstation|xbox|nintendo|e-?sport|twitch/i, /concept ?art|voice ?act|motion ?capture|artstation/i],
  werbung: [/werbung|werbespot|commercial/i, /kampagne|campaign/i, /\bmarke|brand|agentur/i, /social[- ]?content|influencer|sound-?branding/i],
  "film-tv": [/\bfilm\b|kurzfilm|spielfilm|kino/i, /\bserie|doku|\btv\b|fernseh|streaming|netflix/i, /\bscore\b|synchron|hörspiel|foley/i, /festival(film)?|berlinale/i],
  musik: [/\blabel\b|release|single|album|\bep\b/i, /musikvideo|spotify|artist|künstler:?in/i, /\brap\b|hip-?hop|pop|techno|house|r&b|indie/i, /mix|master|beats?\b|produzent|producer/i],
  corporate: [/imagefilm|corporate|unternehmen|\bb2b\b/i, /employer|recruiting|geschäftsbericht|konferenz/i, /podcast|industrie|mittelstand/i],
  events: [/\bevents?\b|veranstaltung|messe/i, /festival|konzert|club|tour/i, /booking|location|live/i],
};

const CATEGORY_INDUSTRY: Record<string, string[]> = {
  musikproduktion: ["musik"], tonstudio: ["musik", "film-tv"], videografie: ["musik", "werbung"], fotografie: ["werbung", "musik"],
  booking: ["events"], schauspiel: ["film-tv", "werbung"], grafikdesign: ["musik", "werbung"],
};

// Tagessatz-Spannen je Bereich (entspricht den Marktwerten im Seed)
const RATES: Record<string, [number, number]> = {
  musikproduktion: [250, 900], tonstudio: [300, 800], videografie: [400, 1400], fotografie: [350, 1200],
  booking: [250, 700], schauspiel: [200, 800], grafikdesign: [250, 800],
};

// ---------------------------------------------------------------- Hilfen

const uniq = <T,>(arr: T[]) => [...new Set(arr)];
const round10 = (n: number) => Math.round(n / 10) * 10;
const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

function corpus(input: ApplicationInput) {
  const links = Object.values(input.links ?? {}).filter(Boolean).join(" ");
  return [input.pitch, input.cvText ?? "", links].join("\n");
}

function detectSkills(input: ApplicationInput, text: string) {
  const cats = input.categories.length ? input.categories : Object.keys(SKILL_LIBRARY);
  const found: string[] = [];
  // Zuerst die gewählten Bereiche, dann alle anderen (z. B. Game-Audio bei Grafikdesign wird trotzdem erkannt)
  const order = uniq([...cats, ...Object.keys(SKILL_LIBRARY)]);
  for (const cat of order) {
    for (const { skill, keys } of SKILL_LIBRARY[cat] ?? []) {
      const primary = cats.includes(cat);
      // In fremden Bereichen nur starke Signale (Skillname selbst) übernehmen
      if (primary ? keys.test(text) : new RegExp(skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i").test(text)) found.push(skill);
    }
  }
  const links = input.links ?? {};
  if (links.spotify && cats.some((c) => c === "musikproduktion" || c === "tonstudio")) found.push("Recording");
  if (links.portfolio && /artstation/i.test(links.portfolio)) found.push("Concept Art");
  if (links.youtube && cats.includes("videografie")) found.push("Schnitt");
  let skills = uniq(found);
  // Zu wenig Signale: Basis-Skills der gewählten Bereiche vorschlagen
  if (skills.length < 3) for (const cat of cats.slice(0, 2)) skills = uniq([...skills, ...(SKILL_LIBRARY[cat] ?? []).slice(0, 2).map((s) => s.skill)]);
  return skills.slice(0, 12);
}

// Credits: „Titel“-Zitate, Aufzählungen mit Jahreszahl, „für <Firma>“
export function detectCredits(text: string) {
  const credits: string[] = [];
  const sentences = text.split(/\n|(?<=[.!?;])\s+(?=[A-ZÄÖÜ„"•\-–*])/).map((s) => s.trim()).filter(Boolean);
  const titleRe = /(?:([A-ZÄÖÜ][\w\-äöüß]*(?:[- ][A-ZÄÖÜ][\w\-äöüß]+){0,2})\s+)?[„"“»]([^"“”«»„]{2,60})[“”"«]/g;
  const forRe = /\b[Ff]ür\s+(?:die\s+|den\s+|das\s+|eine?n?\s+)?([A-ZÄÖÜ][\w&.\-äöüß]+(?:\s+[A-ZÄÖÜ][\w&.\-äöüß]+){0,3})/g;
  const kindRe = /(Kampagne|Trailer|Musikvideo|Imagefilm|Soundtrack|Score|Album|EP|Single|Spot|Werbespot|Shooting|Cover|Doku|Serie|Podcast|Branding|Key Visual|Concept Art|Sounddesign|Synchron|Hörspiel|Game|Spiel|Lookbook|Editorial|Tour|Festival|Musikvideo)\w*/gi;
  const STOP = /^(Der|Die|Das|Ich|Wir|Mein|Meine|Unser|Und|Mit|Für|Bei|Am|Im|Zuletzt|Außerdem|Auch|Dann|Seit)$/;
  const yearAfter = (s: string, pos: number) => s.slice(pos).match(/\b(19[89]\d|20[0-3]\d)\b/)?.[1] ?? s.match(/\b(19[89]\d|20[0-3]\d)\b/)?.[1];
  for (const s of sentences) {
    const used = new Set<string>();
    for (const m of s.matchAll(titleRe)) {
      const kind = m[1] && !STOP.test(m[1]) ? m[1] : "";
      const year = yearAfter(s, m.index ?? 0);
      // „für <Firma>“ direkt hinter dem Titel
      const after = s.slice((m.index ?? 0) + m[0].length, (m.index ?? 0) + m[0].length + 60).match(/^\s*(?:\(\d{4}\)\s*)?[Ff]ür\s+(?:die\s+|den\s+|das\s+)?([A-ZÄÖÜ][\w&.\-äöüß]+(?:\s+[A-ZÄÖÜ][\w&.\-äöüß]+){0,3})/);
      if (after) used.add(after[1]);
      if (kind) used.add(kind);
      credits.push(`${kind ? `${kind} ` : ""}„${m[2].trim()}“${after ? ` für ${after[1]}` : ""}${year ? ` (${year})` : ""}`);
    }
    for (const m of s.matchAll(forRe)) {
      const company = m[1];
      if (used.has(company) || /^(Kampagne|Trailer|Musikvideo|Imagefilm|Soundtrack|Album|EP|Single|Spot|Werbespot|Shooting|Cover|Doku|Serie|Podcast|Game|Spiel|Launch|Indie)\b/i.test(company)) continue;
      const pos = m.index ?? 0;
      const year = yearAfter(s, pos);
      const verb = /(produziert|gedreht|gearbeitet|realisiert|gestaltet|komponiert|gemischt|fotografiert|gesprochen|entwickelt|umgesetzt|geschrieben|kreiert|betreut|aufgenommen)/i.test(s);
      if (!year && !verb) continue;
      const before = [...s.slice(0, pos).matchAll(kindRe)].at(-1)?.[0];
      const afterKind = before ? undefined : [...s.slice(pos + m[0].length).matchAll(kindRe)][0]?.[0];
      credits.push(`${before ?? afterKind ?? "Projekt"} für ${company}${year ? ` (${year})` : ""}`);
      used.add(company);
    }
    if (!used.size && /^[-•*–]\s*/.test(s) && /\b(19[89]\d|20[0-3]\d)\b/.test(s)) credits.push(s.replace(/^[-•*–]\s*/, "").replace(/\s+/g, " ").slice(0, 90));
  }
  return [...new Set(credits.map((c) => c.replace(/\s+/g, " ").trim()))].slice(0, 8);
}

function detectIndustries(input: ApplicationInput, text: string) {
  const scores = Object.entries(INDUSTRY_SIGNALS)
    .map(([slug, res]) => ({ slug, hits: res.reduce((n, re) => n + (re.test(text) ? 1 : 0), 0) }))
    .filter((s) => s.hits > 0)
    .sort((a, b) => b.hits - a.hits);
  let industries = scores.map((s) => s.slug);
  const links = input.links ?? {};
  if (links.spotify) industries.push("musik");
  if (links.portfolio && /artstation/i.test(links.portfolio)) industries.push("gaming");
  if (!industries.length) industries = input.categories.flatMap((c) => CATEGORY_INDUSTRY[c] ?? []);
  return uniq(industries).filter((s) => INDUSTRIES.some((i) => i.slug === s)).slice(0, 4);
}

function detectExperience(text: string, credits: string[]) {
  const now = new Date().getFullYear();
  const explicit = text.match(/(\d{1,2})\s*(?:\+\s*)?jahre?n?\s*(?:berufs)?erfahrung|seit\s+(?:über\s+|mehr als\s+)?(\d{1,2})\s+jahren|(\d{1,2})\s+jahre\s+(?:lang|im\s+geschäft|selbstständig|freiberuflich)/i);
  if (explicit) return clamp(Number(explicit[1] ?? explicit[2] ?? explicit[3]), 0, 40);
  const since = text.match(/seit\s+(19[89]\d|20[0-3]\d)/i);
  if (since) return clamp(now - Number(since[1]), 0, 40);
  const years = [...text.matchAll(/\b(19[89]\d|20[0-3]\d)\b/g), ...credits.join(" ").matchAll(/\b(19[89]\d|20[0-3]\d)\b/g)]
    .map((m) => Number(m[1]))
    .filter((y) => y <= now);
  if (years.length) return clamp(now - Math.min(...years) + 1, 1, 40);
  return credits.length >= 2 ? 3 : 1;
}

export function suggestDayRate(categories: string[], experienceYears: number, industries: string[]): [number, number] {
  const [lo, hi] = RATES[categories[0]] ?? [250, 800];
  const span = hi - lo;
  const pos = clamp(experienceYears / 12, 0, 1);
  const premium = industries.some((i) => i === "gaming" || i === "werbung" || i === "film-tv") ? 1.08 : 1;
  const min = round10((lo + span * pos * 0.55) * premium);
  const max = round10(Math.min(hi * 1.15, (min + span * 0.4) * premium));
  return [min, Math.max(min + 50, max)];
}

function headlineFor(categories: string[], skills: string[], industries: string[], city: string) {
  const cat = categories[0] ? categoryName(categories[0]) : "Kreativ";
  const focus = industries.includes("gaming") ? " für Games" : industries[0] ? ` · ${industryName(industries[0])}` : "";
  const lead = skills.slice(0, 2).join(" & ");
  return `${lead || cat}${focus}${city ? ` aus ${city}` : ""}`.slice(0, 80);
}

// ---------------------------------------------------------------- Mock-Extraktion

export function mockExtract(input: ApplicationInput): ExtractedProfile {
  const text = corpus(input);
  const credits = detectCredits([input.pitch, input.cvText ?? ""].join("\n"));
  const skills = detectSkills(input, text);
  const industries = detectIndustries(input, text);
  const experienceYears = detectExperience([input.pitch, input.cvText ?? ""].join("\n"), credits);
  return {
    skills,
    credits,
    industries,
    experienceYears,
    dayRate: suggestDayRate(input.categories, experienceYears, industries),
    headline: headlineFor(input.categories, skills, industries, input.city),
    source: "mock",
  };
}

// ---------------------------------------------------------------- Claude (optional)

const industrySlugs = INDUSTRIES.map((i) => i.slug) as unknown as [string, ...string[]];

const ExtractSchema = z.object({
  skills: z.array(z.string()),
  credits: z.array(z.string()),
  industries: z.array(z.enum(industrySlugs)),
  experienceYears: z.number().int(),
  dayRateMin: z.number().int(),
  dayRateMax: z.number().int(),
  headline: z.string(),
});

export async function extractProfile(input: ApplicationInput): Promise<ExtractedProfile> {
  const mock = mockExtract(input);
  if (!process.env.ANTHROPIC_API_KEY) return mock;
  try {
    const { default: Anthropic } = await import("@anthropic-ai/sdk");
    const { zodOutputFormat } = await import("@anthropic-ai/sdk/helpers/zod");
    const client = new Anthropic();
    const skillHints = input.categories.flatMap((c) => (SKILL_LIBRARY[c] ?? []).map((s) => s.skill));
    const response = await client.messages.parse({
      model: process.env.ANTHROPIC_MODEL || "claude-opus-5-5",
      max_tokens: 3000,
      output_config: { effort: "low", format: zodOutputFormat(ExtractSchema) },
      system:
        "Du liest Bewerbungen von Kreativen (Musik, Film, Foto, Design, Schauspiel, Booking) für ein deutsches Netzwerk aus. " +
        "Antworte auf Deutsch. Erfinde nichts: Credits nur, wenn sie im Text stehen (Format: Art „Titel“ für Firma (Jahr)). " +
        `Skills bevorzugt aus dieser Liste: ${skillHints.join(", ")}. Maximal 12 Skills, 8 Credits. ` +
        `Branchen nur aus: ${INDUSTRIES.map((i) => `${i.slug} (${i.name})`).join(", ")}. ` +
        "Tagessatz in EUR netto als realistische Spanne für den deutschen Markt. Headline max. 80 Zeichen.",
      messages: [
        {
          role: "user",
          content: [
            `Name: ${input.name}`, `Stadt: ${input.city}`, `Bereiche: ${input.categories.map(categoryName).join(", ")}`,
            `Links: ${Object.entries(input.links ?? {}).filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`).join(" | ") || "keine"}`,
            `Selbstbeschreibung:\n${input.pitch}`, input.cvText ? `Lebenslauf/Portfolio:\n${input.cvText.slice(0, 12000)}` : "",
          ].join("\n\n"),
        },
      ],
    });
    const out = response.parsed_output;
    if (!out) return mock;
    const min = clamp(out.dayRateMin, 50, 5000);
    return {
      skills: uniq(out.skills.map((s) => s.trim()).filter(Boolean)).slice(0, 12),
      credits: uniq(out.credits.map((s) => s.trim()).filter(Boolean)).slice(0, 8),
      industries: uniq(out.industries).slice(0, 4),
      experienceYears: clamp(out.experienceYears, 0, 40),
      dayRate: [min, Math.max(min, clamp(out.dayRateMax, 50, 5000))],
      headline: out.headline.slice(0, 80),
      source: "claude",
    };
  } catch (error) {
    console.error("Claude API nicht erreichbar, nutze Mock:", error);
    return mock;
  }
}

// ---------------------------------------------------------------- Vorprüfung & Score

export type ScoreResult = { score: number; checks: ApplicationCheck[]; summary: string };

export function scoreApplication(input: ApplicationInput, extracted: ExtractedProfile, network: NetworkContext): ScoreResult {
  const checks: ApplicationCheck[] = [];

  // 1) Vollständigkeit (15)
  const linkEntries = Object.entries(input.links ?? {}).filter(([, v]) => v && v.trim()) as [LinkKey, string][];
  const parts = [
    input.name.trim().length >= 2, /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email), input.city.trim().length >= 2,
    input.categories.length > 0, input.pitch.trim().length >= 80, linkEntries.length >= 2,
  ];
  const complete = parts.filter(Boolean).length;
  checks.push({
    key: "vollstaendig", label: "Vollständigkeit", ok: complete >= 5, points: Math.round((complete / parts.length) * 15), max: 15,
    hint: complete === parts.length ? "Alle Angaben vorhanden" : [!parts[4] && "Beschreibung ausführlicher (mind. 80 Zeichen)", !parts[5] && "mind. 2 Links"].filter(Boolean).join(", ") || "Angaben unvollständig",
  });

  // 2) Links plausibel (15) – Format je Plattform; der echte Betrieb ruft die Seiten zusätzlich ab
  const plausible = linkEntries.filter(([k, v]) => checkLink(k, v));
  const linkPts = linkEntries.length ? Math.round((plausible.length / linkEntries.length) * Math.min(1, linkEntries.length / 2) * 15) : 0;
  checks.push({
    key: "links", label: "Links erreichbar & plausibel", ok: linkEntries.length > 0 && plausible.length === linkEntries.length, points: linkPts, max: 15,
    hint: linkEntries.length
      ? `${plausible.length} von ${linkEntries.length} Links plausibel${plausible.length < linkEntries.length ? ` – prüfen: ${linkEntries.filter(([k, v]) => !checkLink(k, v)).map(([k]) => LINK_FIELDS.find((f) => f.key === k)?.label).join(", ")}` : ""}`
      : "Keine Links angegeben",
  });

  // 3) Referenzen (20)
  const nCredits = extracted.credits.length;
  checks.push({
    key: "credits", label: "Referenzen / Credits", ok: nCredits >= 2, points: Math.round((Math.min(nCredits, 4) / 4) * 20), max: 20,
    hint: nCredits ? `${nCredits} ${nCredits === 1 ? "Credit" : "Credits"} erkannt` : "Keine Credits erkannt – nenne Projekte mit Titel und Jahr",
  });

  // 4) Branchenfit (15) – Bonus für stark nachgefragte Corporate-Branchen
  const demand = extracted.industries.filter((i) => ["gaming", "werbung", "film-tv", "corporate"].includes(i));
  const indPts = extracted.industries.length === 0 ? 0 : Math.min(15, 8 + demand.length * 4 + (extracted.industries.length > 1 ? 1 : 0));
  checks.push({
    key: "branchen", label: "Branchenfit", ok: extracted.industries.length > 0, points: indPts, max: 15,
    hint: extracted.industries.length ? extracted.industries.map(industryName).join(", ") + (demand.length ? " – aktuell gefragt bei Unternehmen" : "") : "Keine Branche erkennbar",
  });

  // 5) Erfahrung (10)
  checks.push({
    key: "erfahrung", label: "Erfahrung", ok: extracted.experienceYears >= 2, points: Math.round((Math.min(extracted.experienceYears, 10) / 10) * 10), max: 10,
    hint: `ca. ${extracted.experienceYears} ${extracted.experienceYears === 1 ? "Jahr" : "Jahre"}`,
  });

  // 6) Netzwerk-Bezug (15)
  const netPts = network.track === "netzwerk" ? (network.verified ? 15 : 5) : 0;
  checks.push({
    key: "netzwerk", label: "Netzwerk-Bezug", ok: network.track === "netzwerk" && network.verified, points: netPts, max: 15,
    hint: network.track === "netzwerk"
      ? network.verified
        ? `Fast-Track${network.referrerName ? ` – empfohlen von ${network.referrerName}` : ""}${network.code ? ` (Code ${network.code})` : ""}`
        : "Empfehlung angegeben, aber nicht bestätigt"
      : "Selbstbewerbung ohne Empfehlung",
  });

  // 7) Preisrahmen plausibel (10)
  const [lo, hi] = RATES[input.categories[0]] ?? [150, 1500];
  const [min, max] = extracted.dayRate;
  const rateOk = min >= lo * 0.6 && max <= hi * 1.6 && max >= min;
  checks.push({
    key: "preis", label: "Preisrahmen plausibel", ok: rateOk, points: rateOk ? 10 : 4, max: 10,
    hint: `${min}–${max} € Tagessatz (Markt ${categoryName(input.categories[0] ?? "")}: ${lo}–${hi} €)`,
  });

  const score = clamp(checks.reduce((s, c) => s + (c.points ?? 0), 0), 0, 100);
  const strong = checks.filter((c) => c.ok).map((c) => c.label);
  const weak = checks.filter((c) => !c.ok).map((c) => c.label);
  const summary =
    (score >= 80 ? "Starkes Profil." : score >= 60 ? "Solides Profil mit Potenzial." : "Profil noch dünn.") +
    (strong.length ? ` Stark: ${strong.join(", ")}.` : "") +
    (weak.length ? ` Ausbaufähig: ${weak.join(", ")}.` : "");
  return { score, checks, summary };
}

