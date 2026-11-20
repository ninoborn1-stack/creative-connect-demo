import type { Metadata } from "next";
import { COMPANY } from "@/lib/brand";
import { getDict, hasLocale, type Locale } from "@/lib/i18n";
import { pageMeta } from "@/lib/meta";
import { AudiencePage } from "@/components/site/audience-page";

export async function generateMetadata({ params }: PageProps<"/[lang]/unternehmen">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const t = getDict(lang).businessPage;
  return pageMeta(lang, "unternehmen", t.metaTitle, t.text);
}

export default async function BusinessPage({ params }: PageProps<"/[lang]/unternehmen">) {
  const lang = (await params).lang as Locale;
  const t = getDict(lang).businessPage;
  return <AudiencePage {...t} image="business" cta={{ href: `mailto:${COMPANY.email}?subject=${encodeURIComponent(t.metaTitle)}`, label: t.cta }} />;
}
