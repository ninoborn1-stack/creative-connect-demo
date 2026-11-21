import { APP_NAME } from "@/lib/brand";
import { de } from "@/content/de";
import { en } from "@/content/en";

// Zwei Sprachen über den ersten URL-Teil: /de/… und /en/… (statisch exportiert, siehe app/[lang]).
export const LOCALES = ["de", "en"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "de";

const DICTS = { de, en } as const;
export type Dict = typeof de;

export const hasLocale = (value: string): value is Locale => (LOCALES as readonly string[]).includes(value);
// {app} in allen Texten durch den aktuellen App-Namen ersetzen
const withName = (d: Dict): Dict => JSON.parse(JSON.stringify(d).replaceAll("{app}", APP_NAME));
const CACHE = new Map<Locale, Dict>();
export function getDict(lang: Locale): Dict {
  if (!CACHE.has(lang)) CACHE.set(lang, withName(DICTS[lang]));
  return CACHE.get(lang)!;
}

// Seiten der Marketing-Seite. Slugs sind in beiden Sprachen gleich, damit der Sprachwechsel trivial bleibt.
// Ausnahme: die Danke-Seite nach der Double-Opt-in-Bestätigung (/de/bestaetigt/, /en/confirmed/), nicht in der Sitemap.
export const PAGES = ["", "artists", "veranstalter", "unternehmen", "backstage", "download", "warteliste", "presse", "impressum", "datenschutz"] as const;
export const CONFIRM_SLUG = { de: "bestaetigt", en: "confirmed" } as const;
export type PageSlug = (typeof PAGES)[number] | (typeof CONFIRM_SLUG)[Locale];

export function href(lang: Locale, page: PageSlug = "", hash?: string, query?: Record<string, string>) {
  const q = query ? `?${new URLSearchParams(query)}` : "";
  return `/${lang}/${page ? `${page}/` : ""}${q}${hash ? `#${hash}` : ""}`;
}

// Gleiche Seite in der anderen Sprache (für den Sprachwechsel und hreflang)
export function switchLang(pathname: string, to: Locale) {
  const swapped = pathname.replace(/\/(bestaetigt|confirmed)\//, `/${CONFIRM_SLUG[to]}/`);
  return swapped.replace(/^\/(de|en)(?=\/|$)/, `/${to}`);
}

export const staticLangParams = () => LOCALES.map((lang) => ({ lang }));
