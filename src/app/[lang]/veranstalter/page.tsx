import type { Metadata } from "next";
import { LEGAL } from "@/lib/brand";
import { getDict, hasLocale, href, type Locale } from "@/lib/i18n";
import { pageMeta } from "@/lib/meta";
import { AudiencePage } from "@/components/site/audience-page";

export async function generateMetadata({ params }: PageProps<"/[lang]/veranstalter">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const t = getDict(lang).organizersPage;
  return pageMeta(lang, "veranstalter", t.metaTitle, t.text);
}

export default async function OrganizersPage({ params }: PageProps<"/[lang]/veranstalter">) {
  const lang = (await params).lang as Locale;
  const t = getDict(lang).organizersPage;
  return <AudiencePage {...t} access={{ title: t.accessTitle, text: t.accessText, cta: t.accessCta, href: href(lang, "backstage") }} image="organizers" cta={{ href: `mailto:${LEGAL.email}?subject=${encodeURIComponent(t.metaTitle)}`, label: t.cta }} />;
}
