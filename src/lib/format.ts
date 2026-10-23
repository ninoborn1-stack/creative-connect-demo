import { format, formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";

const eur = new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
const eurCents = new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", minimumFractionDigits: 2 });

export const formatEur = (value: number) => eur.format(value);
export const formatEurExact = (value: number) => eurCents.format(value);
export const formatNumber = (value: number) => new Intl.NumberFormat("de-DE").format(value);

export const formatDate = (d: Date | string) => format(new Date(d), "dd.MM.yyyy", { locale: de });
export const formatDateLong = (d: Date | string) => format(new Date(d), "EEEE, d. MMMM yyyy", { locale: de });
export const formatDateTime = (d: Date | string) => format(new Date(d), "dd.MM.yyyy, HH:mm 'Uhr'", { locale: de });
export const formatMonth = (d: Date | string) => format(new Date(d), "MMM yy", { locale: de });
export const formatRelative = (d: Date | string) =>
  formatDistanceToNow(new Date(d), { addSuffix: true, locale: de });

export function parseJson<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(x)));
}
