export const CATEGORIES = [
  { slug: "musikproduktion", name: "Musikproduktion", short: "Musik", icon: "Music", description: "Beat, Songwriting, Recording, Mix & Mastering" },
  { slug: "tonstudio", name: "Tonstudio", short: "Studio", icon: "Mic", description: "Studios stunden- oder tageweise, Engineering" },
  { slug: "videografie", name: "Videografie", short: "Video", icon: "Video", description: "Konzept, Dreh, Schnitt, Color Grading" },
  { slug: "fotografie", name: "Fotografie", short: "Foto", icon: "Camera", description: "Shootings, Artwork, Kampagnen" },
  { slug: "booking", name: "Booking", short: "Booking", icon: "CalendarCheck", description: "Locations, Events, Künstlerkartei" },
  { slug: "schauspiel", name: "Schauspiel", short: "Schauspiel", icon: "Drama", description: "Musikvideos, Werbung, Kurzfilm" },
  { slug: "grafikdesign", name: "Grafikdesign", short: "Design", icon: "PenTool", description: "Cover, Branding, Merch" },
] as const;

export type CategorySlug = (typeof CATEGORIES)[number]["slug"];

export function categoryName(slug: string) {
  return CATEGORIES.find((c) => c.slug === slug)?.name ?? slug;
}

// Stadtkoordinaten für die SVG-Deutschlandkarte und Umkreissuche
export const CITIES = [
  { name: "Berlin", state: "Berlin", lat: 52.52, lng: 13.405 },
  { name: "Hamburg", state: "Hamburg", lat: 53.551, lng: 9.993 },
  { name: "Köln", state: "Nordrhein-Westfalen", lat: 50.938, lng: 6.96 },
  { name: "München", state: "Bayern", lat: 48.137, lng: 11.575 },
  { name: "Frankfurt", state: "Hessen", lat: 50.11, lng: 8.682 },
  { name: "Leipzig", state: "Sachsen", lat: 51.34, lng: 12.375 },
  { name: "Stuttgart", state: "Baden-Württemberg", lat: 48.775, lng: 9.182 },
  { name: "Düsseldorf", state: "Nordrhein-Westfalen", lat: 51.227, lng: 6.773 },
  { name: "Dortmund", state: "Nordrhein-Westfalen", lat: 51.514, lng: 7.468 },
  { name: "Hannover", state: "Niedersachsen", lat: 52.375, lng: 9.732 },
  { name: "Bremen", state: "Bremen", lat: 53.079, lng: 8.801 },
  { name: "Dresden", state: "Sachsen", lat: 51.05, lng: 13.738 },
  { name: "Nürnberg", state: "Bayern", lat: 49.452, lng: 11.077 },
  { name: "Mannheim", state: "Baden-Württemberg", lat: 49.488, lng: 8.466 },
  { name: "Essen", state: "Nordrhein-Westfalen", lat: 51.456, lng: 7.012 },
] as const;

export const AVAILABILITY = {
  verfuegbar: { label: "Verfügbar", dot: "bg-emerald-500" },
  teilweise: { label: "Teilweise verfügbar", dot: "bg-amber-400" },
  ausgebucht: { label: "Ausgebucht", dot: "bg-zinc-400" },
} as const;

export const PROJECT_STATUS = [
  { key: "entwurf", label: "Entwurf" },
  { key: "anfragen", label: "Anfragen offen" },
  { key: "bestaetigt", label: "Crew bestätigt" },
  { key: "produktion", label: "In Produktion" },
  { key: "abnahme", label: "Abnahme" },
  { key: "abgeschlossen", label: "Abgeschlossen" },
] as const;

export const PROJECT_STATUS_LABEL: Record<string, string> = {
  ...Object.fromEntries(PROJECT_STATUS.map((s) => [s.key, s.label])),
  storniert: "Storniert",
};

export const REQUEST_STATUS_LABEL: Record<string, string> = {
  offen: "Offen",
  angenommen: "Angenommen",
  abgelehnt: "Abgelehnt",
  gegenangebot: "Gegenangebot",
  zurueckgezogen: "Zurückgezogen",
};

export const PAYMENT_STATUS = [
  { key: "reserviert", label: "Reserviert" },
  { key: "freigegeben", label: "Freigegeben" },
  { key: "ausgezahlt", label: "Ausgezahlt" },
] as const;

export const PAYMENT_STATUS_LABEL: Record<string, string> = {
  reserviert: "Reserviert",
  freigegeben: "Freigegeben",
  ausgezahlt: "Ausgezahlt",
  erstattet: "Erstattet",
};

export const MANAGED_STAGES = [
  { key: "anfrage", label: "Anfrage" },
  { key: "angebot", label: "Angebot" },
  { key: "crew", label: "Crew" },
  { key: "produktion", label: "Produktion" },
] as const;

export const VENUE_TYPES: Record<string, string> = {
  tonstudio: "Tonstudio",
  fotostudio: "Foto-/Videostudio",
  location: "Location",
  proberaum: "Proberaum",
};

export const CONTRACT_TEMPLATES: Record<string, { title: string; summary: string }> = {
  werkvertrag: { title: "Werkvertrag Produktion", summary: "Herstellung eines Werks (z. B. Song, Video) mit Abnahme." },
  nutzungsrechte: { title: "Foto-/Video-Nutzungsrechte", summary: "Einräumung von Nutzungsrechten nach Umfang, Dauer, Gebiet." },
  studiomiete: { title: "Studio-Miete", summary: "Überlassung eines Studios inkl. Ausstattung für einen Zeitraum." },
  booking: { title: "Booking-Vereinbarung", summary: "Auftritt oder Mitwirkung zu festem Termin und Honorar." },
};

// Geschäftsmodell (Businessplan 2026, Kap. 6.1) – im Admin änderbar, hier die Standardwerte
export const DEFAULT_FEES = {
  serviceFeePct: 10,
  creativeCommissionPct: 0,
  proPriceEur: 12,
  managedMarginPct: 18,
  kskRatePct: 4.9,
  kskThresholdEur: 1000,
};

export type MarketplaceMode = "closed" | "clients" | "open";

export const MARKETPLACE_MODES: { key: MarketplaceMode; label: string; description: string }[] = [
  { key: "closed", label: "Geschlossen (Phase 1)", description: "Nur eingeladene Mitglieder. Mitglieder buchen sich gegenseitig." },
  { key: "clients", label: "Auftraggeber:innen (Phase 2)", description: "Externe Auftraggeber:innen können sich registrieren und Projekte starten." },
  { key: "open", label: "Offen (Phase 3)", description: "Öffentliches Verzeichnis, Profile sind ohne Login sichtbar." },
];

// ---------- Community: Sessions mit Nesto & Punkte ----------
export const SESSION_TYPES: Record<string, { label: string; short: string; points: number; description: string }> = {
  beat: { label: "Beat-Session", short: "Beats", points: 50, description: "Gemeinsam an Beats bauen – du bringst Ideen oder Samples mit." },
  songwriting: { label: "Songwriting-Session", short: "Songwriting", points: 50, description: "Topline, Hook, Text: zusammen an deinem Song schreiben." },
  "mix-feedback": { label: "Mix-Feedback", short: "Feedback", points: 30, description: "Nesto hört deinen Mix an und gibt konkrete Tipps (30–60 Min.)." },
  "open-studio": { label: "Open Studio", short: "Open Studio", points: 25, description: "Offener Studio-Abend für die Community – vorbeikommen, mitjammen, vernetzen." },
  podcast: { label: "Podcast & Talk", short: "Talk", points: 25, description: "Aufnahme für den Netzwerk-Podcast oder ein Interview-Format." },
  workshop: { label: "Workshop", short: "Workshop", points: 40, description: "Kleine Gruppe, ein Thema: z. B. Vocal-Recording oder Arrangement." },
};

// Punkte für Aktivitäten im Netzwerk (Ergänzung zu den Session-Punkten)
export const POINT_RULES = {
  projekt: { points: 40, label: "Projekt als Crew abgeschlossen" },
  event: { points: 15, label: "Zusage zu einem Community-Event" },
  einladung: { points: 30, label: "Eingeladenes Mitglied ist beigetreten" },
  bewertung: { points: 10, label: "Bewertung geschrieben" },
  post: { points: 5, label: "Beitrag im Feed" },
  studio: { points: 15, label: "Studio im Netzwerk gebucht" },
  lizenz: { points: 20, label: "Eigenes Werk wurde lizenziert" },
  auftrag: { points: 40, label: "Zusage auf eine Ausschreibung" },
} as const;

export const LEVELS = [
  { key: "newcomer", label: "Newcomer", min: 0 },
  { key: "regular", label: "Regular", min: 250 },
  { key: "insider", label: "Insider", min: 750 },
  { key: "family", label: "Nesto Family", min: 1500 },
] as const;

export function levelFor(points: number) {
  const idx = LEVELS.findLastIndex((l) => points >= l.min);
  const level = LEVELS[Math.max(0, idx)];
  const next = LEVELS[idx + 1] ?? null;
  const progress = next ? Math.round(((points - level.min) / (next.min - level.min)) * 100) : 100;
  return { level, next, progress };
}

// ---------- Corporate: Branchen, Licensing, Ausschreibungen ----------
export const INDUSTRIES = [
  { slug: "gaming", name: "Gaming", icon: "Gamepad2", tagline: "Soundtrack, Sounddesign, Voice Acting, Concept Art und Trailer für Studios jeder Größe.", needs: ["Game-Audio & Soundtrack", "Sounddesign & SFX", "Voice Acting", "Concept Art & Key Visuals", "Trailer & Capture"] },
  { slug: "werbung", name: "Marken & Werbung", icon: "Megaphone", tagline: "Kampagnen, Social Content und Sound-Branding – produziert und rechtssicher lizenziert.", needs: ["Kampagnenfilm", "Social Content", "Sound-Branding", "Fotografie", "Models & Talents"] },
  { slug: "film-tv", name: "Film, TV & Streaming", icon: "Clapperboard", tagline: "Score, Sync-Lizenzen, Crew und Postproduktion für Film, Serie und Doku.", needs: ["Score & Sync", "Kamera & Licht", "Schnitt & Color", "Casting", "Sounddesign"] },
  { slug: "musik", name: "Musik & Labels", icon: "Disc3", tagline: "Produktion, Artwork, Videos und Release-Kampagnen für Labels und Artists.", needs: ["Produktion & Mix", "Musikvideo", "Cover-Artwork", "Pressefotos", "Live-Booking"] },
  { slug: "corporate", name: "Corporate & B2B", icon: "Building2", tagline: "Imagefilm, Employer Branding, Podcasts und Corporate Design für Unternehmen.", needs: ["Imagefilm", "Employer Branding", "Podcast-Produktion", "Corporate Design", "Event-Content"] },
  { slug: "events", name: "Events & Live", icon: "Ticket", tagline: "Booking, Locations, Visuals und Dokumentation für Events und Messen.", needs: ["Booking & Locations", "Live-Visuals", "Eventfotografie", "Aftermovie", "Moderation"] },
] as const;

export function industryName(slug: string) {
  return INDUSTRIES.find((i) => i.slug === slug)?.name ?? slug;
}

export const COMPANY_SIZES = ["1-10", "11-50", "51-200", "201-1000", "1000+"] as const;

export const WORK_TYPES: Record<string, { label: string; plural: string }> = {
  track: { label: "Track", plural: "Tracks" },
  beat: { label: "Beat", plural: "Beats" },
  sfx: { label: "Sound-Pack", plural: "Sounds & SFX" },
  stems: { label: "Stems", plural: "Stems" },
  voice: { label: "Voice", plural: "Voice" },
  artwork: { label: "Artwork", plural: "Artwork & Concept Art" },
  foto: { label: "Foto", plural: "Fotos" },
  footage: { label: "Footage", plural: "Footage" },
};

// Lizenzstufen – Standardumfang je Stufe (im Konfigurator anpassbar)
export const LICENSE_TIERS = {
  standard: { label: "Standard", summary: "Online & Social, Deutschland, 12 Monate", media: ["online", "social"], territory: "DE", durationMonths: 12 },
  erweitert: { label: "Erweitert", summary: "Alle Medien inkl. TV & Games, EU, 36 Monate", media: ["online", "social", "tv", "games", "print", "events"], territory: "EU", durationMonths: 36 },
  exklusiv: { label: "Exklusiv / Buyout", summary: "Alle Medien, weltweit, unbefristet, exklusiv", media: ["online", "social", "tv", "games", "print", "events", "kino"], territory: "weltweit", durationMonths: null },
} as const;

export const LICENSE_MEDIA: Record<string, string> = {
  online: "Website & Online", social: "Social Media", tv: "TV & Streaming", games: "Games & Apps", print: "Print & OOH", events: "Events & Messen", kino: "Kino",
};

export const TERRITORIES: Record<string, string> = { DE: "Deutschland", EU: "Europäische Union", weltweit: "Weltweit" };

export const OPPORTUNITY_STATUS: Record<string, string> = { offen: "Offen für Pitches", in_auswahl: "In Auswahl", vergeben: "Vergeben", geschlossen: "Geschlossen" };
export const PITCH_STATUS: Record<string, string> = { eingereicht: "Eingereicht", shortlist: "Shortlist", abgelehnt: "Abgelehnt", angenommen: "Zusage", zurueckgezogen: "Zurückgezogen" };
export const APPLICATION_STATUS: Record<string, string> = { eingereicht: "Eingereicht", in_pruefung: "In Prüfung", angenommen: "Aufgenommen", abgelehnt: "Abgelehnt" };
