import type { Metadata } from "next";
import { COMPANY, CompanyAddress, LegalPage, LegalSection } from "@/components/public/legal-page";

export const metadata: Metadata = { title: "Impressum" };

export default function ImpressumPage() {
  return (
    <LegalPage title="Impressum" updated="01.10.2026">
      <LegalSection title="Angaben gemäß § 5 DDG">
        <CompanyAddress />
      </LegalSection>
      <LegalSection title="Vertreten durch">
        <p>Geschäftsführung: Nesto von Drabich (fiktiv)</p>
      </LegalSection>
      <LegalSection title="Kontakt">
        <p>Telefon: {COMPANY.phone}<br />E-Mail: {COMPANY.email}</p>
      </LegalSection>
      <LegalSection title="Registereintrag">
        <p>Die Gesellschaft befindet sich in Gründung. Registergericht und Registernummer werden nach Eintragung ergänzt.</p>
      </LegalSection>
      <LegalSection title="Umsatzsteuer-ID">
        <p>Wird nach Erteilung ergänzt.</p>
      </LegalSection>
      <LegalSection title="Verantwortlich für den Inhalt">
        <p>Nesto von Drabich, Anschrift wie oben.</p>
      </LegalSection>
      <LegalSection title="Streitbeilegung">
        <p>
          Wir sind nicht verpflichtet und nicht bereit, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.
          Streitfälle zwischen Mitgliedern klären wir über unser internes Beschwerdemanagement (siehe AGB).
        </p>
      </LegalSection>
    </LegalPage>
  );
}
