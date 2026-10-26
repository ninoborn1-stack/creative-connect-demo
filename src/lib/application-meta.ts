// Gemeinsame, clientfähige Bausteine der Bewerbung (Wizard, Admin, Auto-Analyse-Service).

export const LINK_FIELDS = [
  { key: "website", label: "Website", placeholder: "https://deine-seite.de" },
  { key: "instagram", label: "Instagram", placeholder: "@deinname oder instagram.com/…" },
  { key: "spotify", label: "Spotify", placeholder: "open.spotify.com/artist/…" },
  { key: "youtube", label: "YouTube / Vimeo", placeholder: "youtube.com/@… oder vimeo.com/…" },
  { key: "linkedin", label: "LinkedIn", placeholder: "linkedin.com/in/…" },
  { key: "portfolio", label: "Portfolio (Behance, ArtStation …)", placeholder: "behance.net/… oder artstation.com/…" },
] as const;

export type LinkKey = (typeof LINK_FIELDS)[number]["key"];
export type ApplicationLinks = Partial<Record<LinkKey, string>>;

export type ExtractedProfile = {
  skills: string[];
  credits: string[];
  industries: string[];
  dayRate: [number, number];
  experienceYears: number;
  headline?: string;
  source?: "mock" | "claude";
};

export type ApplicationCheck = { key?: string; label: string; ok: boolean; hint: string; points?: number; max?: number };

export type NetworkContext = { track: "standard" | "netzwerk"; referrerName?: string | null; code?: string | null; verified: boolean };

const LINK_PATTERNS: Record<LinkKey, RegExp> = {
  website: /^(https?:\/\/)?([\w-]+\.)+[a-z]{2,}(\/\S*)?$/i,
  instagram: /^(@[\w.]{2,30}|(https?:\/\/)?(www\.)?instagram\.com\/[\w.]{2,30}\/?)$/i,
  spotify: /^(https?:\/\/)?(open\.)?spotify\.com\/(artist|album|track|playlist|user|show)\/\S+$/i,
  youtube: /^(https?:\/\/)?(www\.|m\.)?(youtube\.com\/(@[\w.-]+|channel\/\S+|watch\?v=\S+|c\/\S+)|youtu\.be\/\S+|vimeo\.com\/\S+)$/i,
  linkedin: /^(https?:\/\/)?([a-z]{2,3}\.)?linkedin\.com\/(in|company)\/[\w%-]+\/?$/i,
  portfolio: /^(https?:\/\/)?(www\.)?(behance\.net|artstation\.com|dribbble\.com|soundcloud\.com|bandcamp\.com|([\w-]+\.)+[a-z]{2,})\/?\S*$/i,
};

export function checkLink(key: LinkKey, value: string) {
  return LINK_PATTERNS[key].test(value.trim());
}

export function linkHref(key: LinkKey, value: string) {
  const v = value.trim();
  if (key === "instagram" && v.startsWith("@")) return `https://instagram.com/${v.slice(1)}`;
  return /^https?:\/\//i.test(v) ? v : `https://${v}`;
}

export const ANALYSIS_STEPS = ["Links prüfen", "Credits erkennen", "Skills auslesen", "Branchen zuordnen", "Preisrahmen schätzen", "Vorprüfung berechnen"];

export function scoreTone(score: number) {
  return score >= 80 ? "text-emerald-500" : score >= 60 ? "text-amber-500" : "text-destructive";
}

export const APPLICATION_STATUS_TONE: Record<string, string> = {
  eingereicht: "bg-sky-500/15 text-sky-600 dark:text-sky-300",
  in_pruefung: "bg-amber-500/15 text-amber-600 dark:text-amber-300",
  angenommen: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300",
  abgelehnt: "bg-destructive/15 text-destructive",
};
