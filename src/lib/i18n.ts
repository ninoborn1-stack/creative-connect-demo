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

// Seiten der Marketing-Seite, angegeben über ihre ID (= deutscher Slug). Die meisten Slugs sind in beiden Sprachen gleich.
// Ausnahmen mit eigenem englischen Slug: Impressum (/en/imprint/), Datenschutz (/en/privacy/) und die Danke-Seite
// nach der Double-Opt-in-Bestätigung (/de/bestaetigt/, /en/confirmed/, nicht in der Sitemap).
export const PAGES = ["", "artists", "veranstalter", "unternehmen", "backstage", "download", "warteliste", "presse", "impressum", "datenschutz"] as const;
export type PageSlug = (typeof PAGES)[number] | "bestaetigt";

const LOCAL_SLUGS: Partial<Record<PageSlug, Record<Locale, string>>> = {
  impressum: { de: "impressum", en: "imprint" },
  datenschutz: { de: "datenschutz", en: "privacy" },
  bestaetigt: { de: "bestaetigt", en: "confirmed" },
};
export const CONFIRM_SLUG = LOCAL_SLUGS.bestaetigt!;
export const slugFor = (lang: Locale, page: PageSlug) => LOCAL_SLUGS[page]?.[lang] ?? page;

export function href(lang: Locale, page: PageSlug = "", hash?: string, query?: Record<string, string>) {
  const q = query ? `?${new URLSearchParams(query)}` : "";
  const slug = slugFor(lang, page);
  return `/${lang}/${slug ? `${slug}/` : ""}${q}${hash ? `#${hash}` : ""}`;
}

// Gleiche Seite in der anderen Sprache (für den Sprachwechsel), auch bei Seiten mit eigenem Slug je Sprache
export function switchLang(pathname: string, to: Locale) {
  const m = pathname.match(/^\/(de|en)(?:\/([^/]+))?(\/.*)?$/);
  if (!m) return `/${to}/`;
  const [, , slug = "", rest = "/"] = m;
  const entry = Object.entries(LOCAL_SLUGS).find(([, v]) => v && Object.values(v).includes(slug));
  const target = entry ? entry[1]![to] : slug;
  return `/${to}/${target ? `${target}${rest}` : ""}`;
}

// Seiten mit eigenem Slug je Sprache gibt es nur in der passenden Sprache (z. B. /de/impressum/, /en/imprint/)
export const onlyLang = (lang: Locale) => () => [{ lang }];

export const staticLangParams = () => LOCALES.map((lang) => ({ lang }));
