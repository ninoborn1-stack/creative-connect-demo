import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/brand";
import { href, LOCALES, PAGES } from "@/lib/i18n";

// sitemap.xml mit allen Seiten in beiden Sprachen und hreflang-Varianten (absolute URLs inkl. Unterordner)
export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  return PAGES.flatMap((page) =>
    LOCALES.map((lang) => ({
      url: SITE_URL + href(lang, page),
      changeFrequency: "monthly" as const,
      priority: page === "" ? 1 : page === "impressum" || page === "datenschutz" ? 0.2 : 0.7,
      alternates: { languages: Object.fromEntries(LOCALES.map((l) => [l, SITE_URL + href(l, page)])) },
    })),
  );
}
