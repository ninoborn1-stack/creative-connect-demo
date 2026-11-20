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

// Seiten der Marketing-Seite, Slugs sind in beiden Sprachen gleich, damit der Sprachwechsel trivial bleibt
export const PAGES = ["", "artists", "veranstalter", "unternehmen", "download", "warteliste", "presse", "impressum", "datenschutz"] as const;
export type PageSlug = (typeof PAGES)[number];

export function href(lang: Locale, page: PageSlug = "", hash?: string) {
  return `/${lang}/${page ? `${page}/` : ""}${hash ? `#${hash}` : ""}`;
}

export const staticLangParams = () => LOCALES.map((lang) => ({ lang }));
