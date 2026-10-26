import { Building2, Clapperboard, Disc3, Gamepad2, Megaphone, Ticket, type LucideIcon } from "lucide-react";
import { parseJson } from "@/lib/format";

// Öffentliche Branchen-Seiten: Zuordnung Branche → passende Gewerke/Skills, Ablauf und Rechte-Hinweise.
// Reine Daten + Hilfsfunktionen (keine Node-APIs), damit sie auch im statischen Pages-Build laufen.

export const INDUSTRY_ICONS: Record<string, LucideIcon> = { Gamepad2, Megaphone, Clapperboard, Disc3, Building2, Ticket };

type IndustryDetail = {
  categories: string[];
  skills: string[];
  imageSeed: string;
  process: { title: string; text: string }[];
  rights: string[];
};

export const INDUSTRY_DETAILS: Record<string, IndustryDetail> = {
  gaming: {
    categories: ["musikproduktion", "tonstudio", "schauspiel", "grafikdesign", "videografie"],
    skills: ["Game-Audio", "Adaptive Music (Wwise/FMOD)", "Voice Acting", "Voice-Recording für Games", "Concept Art", "Game-Trailer", "UI für Games", "3D & Key Visuals", "Foley", "Sounddesign", "Motion Capture", "Synchron"],
    imageSeed: "id:96",
    process: [
      { title: "Scope & Pipeline", text: "Ihr beschreibt Spiel, Engine und Middleware (Wwise, FMOD, Unity, Unreal). Wir übersetzen das in Rollen, Lieferformate und Meilensteine." },
      { title: "Crew oder Ausschreibung", text: "Direkt beauftragen, eine Ausschreibung veröffentlichen oder Nesto stellt die Crew zusammen – inklusive Casting für Voice-Rollen." },
      { title: "Produktion in Sprints", text: "Lieferungen pro Milestone (Vertical Slice, Beta, Gold), Feedback im Projektraum, Dateien versioniert." },
      { title: "Buyout & Rechtekette", text: "Nutzungsrechte weltweit, unbefristet und plattformübergreifend – dokumentiert pro Asset, mit Lizenzzertifikat." },
    ],
    rights: [
      "Buyouts für Voice Acting: weltweit, unbefristet, alle Plattformen inkl. DLCs, Trailer und Marketing.",
      "Musik wahlweise als Auftragskomposition mit Buyout oder als Katalog-Lizenz (Stufe „Erweitert“ deckt Games & Apps ab).",
      "Stems und adaptive Layer werden mitgeliefert – für Implementierung in Wwise oder FMOD.",
      "Hinweise zu Verwertungsgesellschaften (z. B. GEMA-freie Werke) stehen an jedem Werk.",
    ],
  },
  werbung: {
    categories: ["fotografie", "videografie", "grafikdesign", "schauspiel", "musikproduktion"],
    skills: ["Werbung", "Fashion", "Produkt", "Reels", "Branding", "Sounddesign", "Social-Templates", "Studio-Licht", "Retusche", "Sync & Licensing"],
    imageSeed: "id:823",
    process: [
      { title: "Briefing", text: "Kampagnenziel, Kanäle und Budget – der Assistent schlägt Rollen und Budgetaufteilung vor." },
      { title: "Crew & Casting", text: "Fotograf:innen, Videocrews, Models und Sound aus einem kuratierten Netzwerk." },
      { title: "Produktion & Freigabe", text: "Shooting, Schnitt, Freigaberunden im Projektraum." },
      { title: "Rechte", text: "Buyout nach Medien, Gebiet und Laufzeit – sauber dokumentiert." },
    ],
    rights: [
      "Nutzungsrechte nach Medium (Online, Social, TV, Print/OOH), Gebiet und Laufzeit.",
      "Model-Releases und Location-Freigaben liegen im Projektraum.",
      "Verlängerungen und Erweiterungen der Lizenz mit einem Klick.",
    ],
  },
  "film-tv": {
    categories: ["videografie", "musikproduktion", "tonstudio", "schauspiel"],
    skills: ["Film-Scoring", "Sync & Licensing", "Kurzfilm", "Color Grading", "Schnitt", "Kamera", "Drohne", "Foley", "Dolby Atmos", "Synchron", "DaVinci Resolve"],
    imageSeed: "id:435",
    process: [
      { title: "Bedarf", text: "Score, Sync oder Crew – ihr beschreibt Format, Laufzeit und Auswertung." },
      { title: "Auswahl", text: "Vorschläge aus dem Netzwerk oder Pitches über eine Ausschreibung." },
      { title: "Produktion & Post", text: "Dreh, Schnitt, Color, Mischung bis Dolby Atmos." },
      { title: "Cue Sheets & Rechte", text: "Cue Sheets, Sync-Lizenzen und Rechtekette für Sender und Streamer." },
    ],
    rights: [
      "Sync-Lizenzen für Serie, Trailer und Promo in einem Paket.",
      "Cue Sheets und Werkmeldungen werden mitgeliefert.",
      "Territorien und Auswertungsfenster pro Lizenz festgelegt.",
    ],
  },
  musik: {
    categories: ["musikproduktion", "tonstudio", "videografie", "fotografie", "grafikdesign", "booking"],
    skills: ["Albumcover", "Musikvideo", "Musikvideos", "Mixing", "Mastering", "Songwriting", "Recording", "Beats", "Vocal-Recording", "Merch", "Tourplanung"],
    imageSeed: "id:39",
    process: [
      { title: "Release-Plan", text: "Single, EP oder Album – Gewerke und Termine im Überblick." },
      { title: "Crew", text: "Produktion, Mix, Video, Artwork und Pressefotos aus einer Hand." },
      { title: "Produktion", text: "Studio-Buchung, Dreh, Feedback im Projektraum." },
      { title: "Release", text: "Rechte, Credits und Abrechnung sauber dokumentiert." },
    ],
    rights: [
      "Produzent:innen-Anteile und Credits werden im Vertrag festgehalten.",
      "Beat-Lizenzen in Stufen – vom Standard bis zum exklusiven Buyout.",
      "Artwork-Nutzung für Streaming, Merch und Kampagne.",
    ],
  },
  corporate: {
    categories: ["videografie", "fotografie", "tonstudio", "grafikdesign", "musikproduktion"],
    skills: ["Imagefilm", "Podcast-Aufnahme", "Branding", "Portrait", "Typografie", "Drohne", "Moderation", "Kamera", "Schnitt", "Mixing"],
    imageSeed: "id:180",
    process: [
      { title: "Anfrage & Einkauf", text: "Rahmenvertrag, Bestellnummern und Freigabewege – wir passen uns eurem Einkauf an." },
      { title: "Managed Crew", text: "Nesto und das Team stellen die Crew zusammen, ein Ansprechpartner für alles." },
      { title: "Produktion", text: "Dreh an euren Standorten, Freigaben durch Kommunikation und Recht." },
      { title: "Abrechnung", text: "Sammelrechnung pro Monat oder Kostenstelle, KSK-Übersicht inklusive." },
    ],
    rights: [
      "Nutzungsrechte für interne und externe Kommunikation, Recruiting und Messen.",
      "Persönlichkeitsrechte von Mitarbeitenden über Einwilligungs-Vorlagen.",
      "Lizenzzertifikate für Revision und Rechtsabteilung.",
    ],
  },
  events: {
    categories: ["booking", "fotografie", "videografie", "grafikdesign"],
    skills: ["Event", "Event-Planung", "Location-Scouting", "Tourplanung", "Künstlerkartei", "Live-Recording", "Moderation", "Genehmigungen", "Catering-Koordination"],
    imageSeed: "id:158",
    process: [
      { title: "Konzept", text: "Format, Ort, Termin und Zielgruppe – Booking und Locations aus dem Netzwerk." },
      { title: "Crew", text: "Visuals, Foto, Aftermovie und Moderation in einem Team." },
      { title: "Durchführung", text: "Ablaufplan, Kontakte und Dateien im Projektraum." },
      { title: "Content", text: "Fotos und Aftermovie mit klaren Nutzungsrechten für Social und PR." },
    ],
    rights: [
      "Rechte an Event-Content für Social, PR und Folgekampagnen.",
      "Künstler:innen-Verträge und Gagen transparent abgerechnet.",
      "Hinweise zur Künstlersozialabgabe pro Booking.",
    ],
  },
};

type ScorableProfile = { categories: string; user: { id: string } } & { skills: string };

// Profile nach Passung zur Branche sortieren: Skill-Treffer zählen doppelt, Kategorie-Treffer einfach
export function rankProfilesForIndustry<T extends ScorableProfile>(profiles: T[], slug: string, take = 6): T[] {
  const detail = INDUSTRY_DETAILS[slug];
  if (!detail) return [];
  const skillSet = new Set(detail.skills.map((s) => s.toLowerCase()));
  return profiles
    .map((p) => {
      const skills = parseJson<string[]>(p.skills, []);
      const cats = parseJson<string[]>(p.categories, []);
      const score = skills.filter((s) => skillSet.has(s.toLowerCase())).length * 2 + cats.filter((c) => detail.categories.includes(c)).length;
      return { p, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, take)
    .map((x) => x.p);
}

export function worksForIndustry<T extends { industries: string }>(works: T[], slug: string) {
  return works.filter((w) => parseJson<string[]>(w.industries, []).includes(slug));
}
