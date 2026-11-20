import type { Metadata } from "next";
import { APP_NAME, SITE_URL } from "@/lib/brand";
import { getDict, href, LOCALES, type Locale, type PageSlug } from "@/lib/i18n";

// Seitentitel, Beschreibung und Sprachvarianten (hreflang) für jede Seite
export function pageMeta(lang: Locale, page: PageSlug, title?: string, description?: string): Metadata {
  const t = getDict(lang);
  return {
    title: title ?? { absolute: t.meta.title },
    description: description ?? t.meta.description,
    // absolute URLs (inkl. Unterordner bei GitHub Pages), relative werden von Suchmaschinen nicht akzeptiert
    alternates: {
      canonical: SITE_URL + href(lang, page),
      languages: { ...Object.fromEntries(LOCALES.map((l) => [l, SITE_URL + href(l, page)])), "x-default": SITE_URL + href("de", page) },
    },
    openGraph: { siteName: APP_NAME, locale: lang === "de" ? "de_DE" : "en_US", type: "website", url: SITE_URL + href(lang, page) },
  };
}
