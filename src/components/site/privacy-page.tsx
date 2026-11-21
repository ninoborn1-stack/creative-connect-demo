import { getDict, type Locale } from "@/lib/i18n";
import { LegalPage, LegalSections } from "@/components/site/legal";

// Datenschutzerklärung, DE unter /de/datenschutz/, EN unter /en/privacy/. Beschreibt nur, was die Seite wirklich tut
// (gemessen mit scripts/datenfluss.mjs, Ergebnis in docs/legal/datenfluss.md, abgesichert durch e2e/legal.spec.ts).
export function PrivacyContent({ lang }: { lang: Locale }) {
  const d = getDict(lang);
  return (
    <LegalPage lang={lang} t={d.legal} title={d.privacy.title}>
      <LegalSections sections={d.privacy.sections} t={d.legal} />
    </LegalPage>
  );
}
