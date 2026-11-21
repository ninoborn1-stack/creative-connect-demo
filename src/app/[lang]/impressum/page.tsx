import type { Metadata } from "next";
import { COMPANY } from "@/lib/brand";
import { getDict, hasLocale, type Locale } from "@/lib/i18n";
import { pageMeta } from "@/lib/meta";
import { LegalPage, LegalSection } from "@/components/site/legal";

export async function generateMetadata({ params }: PageProps<"/[lang]/impressum">): Promise<Metadata> {
  const { lang } = await params;
  return hasLocale(lang) ? pageMeta(lang, "impressum", getDict(lang).imprint.metaTitle) : {};
}

export default async function ImprintPage({ params }: PageProps<"/[lang]/impressum">) {
  const lang = (await params).lang as Locale;
  const d = getDict(lang);
  const t = d.imprint;
  return (
    <LegalPage t={d.legal} title={t.title} updated="20.11.2026">
      <LegalSection title={t.sections.provider}>
        <address className="not-italic">{COMPANY.name}<br />{COMPANY.street}<br />{COMPANY.city}<br />{COMPANY.country}</address>
      </LegalSection>
      <LegalSection title={t.sections.represented}><p>{COMPANY.representative}</p></LegalSection>
      <LegalSection title={t.sections.contact}>
        <p>{t.phone}: {COMPANY.phone}<br />{t.email}: <a href={`mailto:${COMPANY.email}`} className="underline underline-offset-4 [overflow-wrap:anywhere]">{COMPANY.email}</a></p>
      </LegalSection>
      <LegalSection title={t.sections.register}><p>{COMPANY.register}</p></LegalSection>
      <LegalSection title={t.sections.vat}><p>{COMPANY.vatId}</p></LegalSection>
      <LegalSection title={t.sections.responsible}><p>{COMPANY.representative}, {t.sameAddress}</p></LegalSection>
      <LegalSection title={t.sections.dispute}><p>{t.disputeText}</p></LegalSection>
    </LegalPage>
  );
}
