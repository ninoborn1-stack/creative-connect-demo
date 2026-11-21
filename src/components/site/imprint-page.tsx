import { LEGAL, telHref } from "@/lib/brand";
import { getDict, type Locale } from "@/lib/i18n";
import { IMAGE_CREDITS } from "@/content/image-credits";
import { LegalPage, LegalSection, LegalSections, OwnerAddress } from "@/components/site/legal";
import { Rich } from "@/components/site/rich";

// Impressum nach § 5 DDG, DE unter /de/impressum/, EN unter /en/imprint/. Alle Angaben aus LEGAL in brand.ts.
export function ImprintContent({ lang }: { lang: Locale }) {
  const d = getDict(lang);
  const t = d.imprint;
  const link = "underline underline-offset-4 hover:text-foreground";
  return (
    <LegalPage lang={lang} t={d.legal} title={t.title}>
      <LegalSection id="anbieter" title={t.provider}><OwnerAddress t={d.legal} /></LegalSection>
      <LegalSection id="kontakt" title={t.contact}>
        <p>
          {t.email}: <a href={`mailto:${LEGAL.email}`} className={`${link} [overflow-wrap:anywhere]`}>{LEGAL.email}</a>
          <br />
          {LEGAL.phone ? <>{t.phone}: <a href={telHref(LEGAL.phone)} className={`${link} whitespace-nowrap`}>{LEGAL.phone}</a></> : t.noPhone}
        </p>
      </LegalSection>
      {LEGAL.vatId && (
        <LegalSection id="ust" title={t.vat}><p>{t.vatLabel}: {LEGAL.vatId}</p></LegalSection>
      )}
      <LegalSection id="verantwortlich" title={t.responsible}><p>{LEGAL.owner}, {t.sameAddress}</p></LegalSection>
      <LegalSections sections={t.sections} t={d.legal} />
      <LegalSection id="bildnachweise" title={t.credits}>
        <p><Rich text={t.creditsIntro} /></p>
        <ul className="space-y-1.5 text-sm" data-testid="image-credits">
          {IMAGE_CREDITS.map((c) => (
            <li key={c.file}>
              {c.shows[lang]}: {t.creditsPhoto} {t.creditsBy} <a href={c.url} className={link} rel="noopener">{c.author}</a>, {c.source}
            </li>
          ))}
        </ul>
      </LegalSection>
    </LegalPage>
  );
}
