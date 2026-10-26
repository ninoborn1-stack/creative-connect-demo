// Lizenz-Katalog: Preislogik und Hilfsfunktionen (rein, ohne DB – läuft auf Server und im Client-Konfigurator).
import { addMonths, differenceInCalendarDays } from "date-fns";
import { LICENSE_MEDIA, LICENSE_TIERS, TERRITORIES, WORK_TYPES } from "@/lib/constants";

export type LicenseTier = keyof typeof LICENSE_TIERS;
export const TIER_KEYS = Object.keys(LICENSE_TIERS) as LicenseTier[];
export const MEDIA_KEYS = Object.keys(LICENSE_MEDIA);
export const TERRITORY_KEYS = Object.keys(TERRITORIES);

export const AUDIO_TYPES = ["track", "beat", "sfx", "stems", "voice"] as const;
export const isAudioType = (type: string) => (AUDIO_TYPES as readonly string[]).includes(type);
export const workTypeLabel = (type: string) => WORK_TYPES[type]?.label ?? type;

// Laufzeit-Optionen im Konfigurator (null = unbefristet)
export const DURATION_OPTIONS: { value: number | null; label: string }[] = [
  { value: 12, label: "12 Monate" },
  { value: 24, label: "24 Monate" },
  { value: 36, label: "36 Monate" },
  { value: 60, label: "60 Monate" },
  { value: null, label: "Unbefristet" },
];
export const durationLabel = (months: number | null) => (months == null ? "Unbefristet" : `${months} Monate`);

// Aufschläge (in % des Stufen-Basispreises)
export const MEDIA_SURCHARGE_PCT: Record<string, number> = { online: 10, social: 10, print: 15, events: 10, tv: 25, games: 25, kino: 35 };
export const TERRITORY_FACTOR: Record<string, number> = { DE: 1, EU: 1.3, weltweit: 1.6 };
export const DURATION_SURCHARGE_PER_YEAR_PCT = 15; // je weitere 12 Monate über der Stufe
export const UNLIMITED_SURCHARGE_PCT = 60; // unbefristet bei Standard/Erweitert

// Reservierte Pfade unter /lizenzen – dürfen kein Werk-Slug sein
export const RESERVED_SLUGS = ["meine", "werke", "zertifikat", "neu"];

export type LicenseConfig = {
  tier: LicenseTier;
  media: string[];
  territory: string;
  durationMonths: number | null;
};

export type PricedWork = { priceStandard: number; priceExtended: number; priceExclusive: number | null };

export type PriceLine = { label: string; amount: number };
export type LicensePrice = {
  base: number;
  lines: PriceLine[]; // Basis + Aufschläge
  licenseFee: number; // geht zu 100 % an die:den Kreative:n
  serviceFee: number; // Plattform, zahlt Lizenznehmer:in
  serviceFeePct: number;
  total: number;
};

export function tierBase(work: PricedWork, tier: LicenseTier) {
  if (tier === "exklusiv") return work.priceExclusive;
  return tier === "erweitert" ? work.priceExtended : work.priceStandard;
}

export function defaultConfig(tier: LicenseTier): LicenseConfig {
  const t = LICENSE_TIERS[tier];
  return { tier, media: [...t.media], territory: t.territory, durationMonths: t.durationMonths };
}

// Exklusiv/Buyout ist immer: alle Medien, weltweit, unbefristet
export function normalizeConfig(config: LicenseConfig): LicenseConfig {
  if (config.tier === "exklusiv") return defaultConfig("exklusiv");
  const media = MEDIA_KEYS.filter((m) => config.media.includes(m));
  const territory = TERRITORY_KEYS.includes(config.territory) ? config.territory : LICENSE_TIERS[config.tier].territory;
  const durationMonths = DURATION_OPTIONS.some((d) => d.value === config.durationMonths) ? config.durationMonths : LICENSE_TIERS[config.tier].durationMonths;
  return { tier: config.tier, media, territory, durationMonths };
}

const roundTo5 = (v: number) => Math.round(v / 5) * 5;

/**
 * Lizenzpreis berechnen.
 * Basis = Preis der gewählten Stufe. Aufschläge (je auf die Basis):
 *  - jedes Medium außerhalb des Stufenumfangs: MEDIA_SURCHARGE_PCT
 *  - größeres Gebiet als in der Stufe enthalten: Verhältnis der TERRITORY_FACTORs
 *  - längere Laufzeit: +15 % je weitere 12 Monate, unbefristet +60 %
 * Kleinerer Umfang als die Stufe ergibt keinen Rabatt (dann die günstigere Stufe wählen).
 * Lizenzgebühr auf 5 € gerundet, Servicegebühr laut getFees().serviceFeePct obendrauf.
 */
export function calcLicensePrice(work: PricedWork, raw: LicenseConfig, serviceFeePct: number): LicensePrice | null {
  const config = normalizeConfig(raw);
  const base = tierBase(work, config.tier);
  if (base == null) return null;
  const tier = LICENSE_TIERS[config.tier];
  const lines: PriceLine[] = [{ label: `Basis ${tier.label} (${tier.summary})`, amount: base }];

  if (config.tier !== "exklusiv") {
    const included = tier.media as readonly string[];
    for (const m of config.media) {
      if (included.includes(m)) continue;
      lines.push({ label: `Zusätzliches Medium: ${LICENSE_MEDIA[m]} (+${MEDIA_SURCHARGE_PCT[m]} %)`, amount: Math.round((base * MEDIA_SURCHARGE_PCT[m]) / 100) });
    }
    const fIncluded = TERRITORY_FACTOR[tier.territory];
    const fChosen = TERRITORY_FACTOR[config.territory];
    if (fChosen > fIncluded) {
      const pct = Math.round((fChosen / fIncluded - 1) * 100);
      lines.push({ label: `Gebiet ${TERRITORIES[config.territory]} statt ${TERRITORIES[tier.territory]} (+${pct} %)`, amount: Math.round((base * pct) / 100) });
    }
    const incMonths = tier.durationMonths ?? Infinity;
    if (config.durationMonths == null && incMonths !== Infinity) {
      lines.push({ label: `Laufzeit unbefristet (+${UNLIMITED_SURCHARGE_PCT} %)`, amount: Math.round((base * UNLIMITED_SURCHARGE_PCT) / 100) });
    } else if (config.durationMonths != null && config.durationMonths > incMonths) {
      const years = Math.ceil((config.durationMonths - incMonths) / 12);
      const pct = years * DURATION_SURCHARGE_PER_YEAR_PCT;
      lines.push({ label: `Laufzeit ${config.durationMonths} statt ${incMonths} Monate (+${pct} %)`, amount: Math.round((base * pct) / 100) });
    }
  }

  const licenseFee = roundTo5(lines.reduce((s, l) => s + l.amount, 0));
  const serviceFee = Math.round((licenseFee * serviceFeePct) / 100);
  return { base, lines, licenseFee, serviceFee, serviceFeePct, total: licenseFee + serviceFee };
}

// ---------- Laufzeit & Status ----------
export function licenseEndDate(createdAt: Date | string, durationMonths: number | null) {
  return durationMonths == null ? null : addMonths(new Date(createdAt), durationMonths);
}

export type LicenseState = { status: "aktiv" | "abgelaufen" | "widerrufen"; endsAt: Date | null; daysLeft: number | null; expiringSoon: boolean };

export function licenseState(l: { createdAt: Date | string; durationMonths: number | null; status: string }, now = new Date()): LicenseState {
  const endsAt = licenseEndDate(l.createdAt, l.durationMonths);
  const daysLeft = endsAt ? differenceInCalendarDays(endsAt, now) : null;
  if (l.status === "widerrufen") return { status: "widerrufen", endsAt, daysLeft, expiringSoon: false };
  if (daysLeft != null && daysLeft < 0) return { status: "abgelaufen", endsAt, daysLeft, expiringSoon: false };
  return { status: "aktiv", endsAt, daysLeft, expiringSoon: daysLeft != null && daysLeft <= 60 };
}

// Exklusiv vergeben = es gibt eine nicht widerrufene Exklusiv-Lizenz
export function isExclusivelyTaken(licenses: { tier: string; status: string }[]) {
  return licenses.some((l) => l.tier === "exklusiv" && l.status !== "widerrufen");
}

export function formatDuration(sec: number | null | undefined) {
  if (!sec) return null;
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;
}

export function slugifyTitle(s: string) {
  return s
    .toLowerCase()
    .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);
}
