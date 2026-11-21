// Alle Seiten je Sprache (Impressum und Datenschutz haben im Englischen eigene Slugs)
const COMMON = ["", "artists/", "veranstalter/", "unternehmen/", "backstage/", "download/", "warteliste/", "presse/"];
export const PAGES_BY_LANG: Record<"de" | "en", string[]> = {
  de: [...COMMON, "impressum/", "datenschutz/", "bestaetigt/", "confirmed/"],
  en: [...COMMON, "imprint/", "privacy/", "bestaetigt/", "confirmed/"],
};
export const LEGAL_PATHS = { de: { imprint: "de/impressum/", privacy: "de/datenschutz/" }, en: { imprint: "en/imprint/", privacy: "en/privacy/" } } as const;
