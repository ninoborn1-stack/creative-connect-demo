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
