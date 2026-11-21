import type { Metadata } from "next";
import { SITE_URL } from "@/lib/brand";
import { getDict, hasLocale, href, type Locale } from "@/lib/i18n";
import { ConfirmContent } from "@/components/site/confirm-page";

// Ziel der Brevo-Weiterleitung nach der Double-Opt-in-Bestätigung (DE: /de/bestaetigt/, EN: /en/confirmed/).
// Nicht in der Sitemap, noindex. Der jeweils andere Slug existiert ebenfalls, damit keine Adresse ins Leere führt.
export async function generateMetadata({ params }: PageProps<"/[lang]/confirmed">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  return {
    title: getDict(lang).confirmPage.metaTitle,
    robots: { index: false, follow: false },
    alternates: { canonical: SITE_URL + href(lang, "bestaetigt") },
  };
}

export default async function ConfirmPage({ params }: PageProps<"/[lang]/confirmed">) {
  const lang = (await params).lang as Locale;
  return <ConfirmContent lang={lang} t={getDict(lang).confirmPage} />;
}
