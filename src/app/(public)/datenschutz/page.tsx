import type { Metadata } from "next";
import { CompanyAddress, LegalPage, LegalSection } from "@/components/public/legal-page";

export const metadata: Metadata = { title: "Datenschutz" };

export default function DatenschutzPage() {
  return (
    <LegalPage
      title="Datenschutzerklärung"
      updated="01.10.2026"
      intro="Wir verarbeiten nur die Daten, die wir für ein funktionierendes Netzwerk brauchen – und erklären hier, welche das sind."
    >
      <LegalSection title="1. Verantwortliche Stelle">
        <CompanyAddress />
      </LegalSection>
      <LegalSection title="2. Welche Daten wir verarbeiten">
        <ul>
          <li><strong>Konto:</strong> Name, E-Mail-Adresse, Passwort (verschlüsselt gespeichert), Rolle(n).</li>
          <li><strong>Profil:</strong> Bereiche, Skills, Stadt, Tagessatz-Rahmen, Portfolio, Bewertungen.</li>
          <li><strong>Projekte:</strong> Briefings, Nachrichten, Dateien, Verträge und Zahlungsstatus.</li>
          <li><strong>Steuer:</strong> nur ob eine Steuer-ID hinterlegt ist (für die DAC7-Meldung), die Nummer selbst beim Zahlungsdienstleister.</li>
        </ul>
      </LegalSection>
      <LegalSection title="3. Zwecke und Rechtsgrundlagen">
        <p>
          Vertragserfüllung (Art. 6 Abs. 1 lit. b DSGVO) für Konto, Vermittlung und Projektabwicklung; gesetzliche Pflichten
          (lit. c) für Steuer- und Meldepflichten; berechtigtes Interesse (lit. f) für Sicherheit und Missbrauchsschutz.
        </p>
      </LegalSection>
      <LegalSection title="4. Empfänger">
        <ul>
          <li>Lizenzierter Zahlungsdienstleister für Zahlungen und Auszahlungen.</li>
          <li>E-Mail-Dienstleister mit Sitz in der EU.</li>
          <li>Hosting und Speicher in Rechenzentren in der EU.</li>
          <li>KI-Dienst für den Briefing-Assistenten – nur Briefing-Texte, keine Kontodaten.</li>
        </ul>
      </LegalSection>
      <LegalSection title="5. Speicherdauer">
        <p>Profildaten löschen wir mit dem Konto. Rechnungs- und Zahlungsdaten bewahren wir für die gesetzlichen Fristen auf (bis zu zehn Jahre).</p>
      </LegalSection>
      <LegalSection title="6. Deine Rechte">
        <p>Auskunft, Berichtigung, Löschung, Einschränkung, Datenübertragbarkeit und Widerspruch – sowie Beschwerde bei einer Datenschutz-Aufsichtsbehörde.</p>
      </LegalSection>
      <LegalSection title="7. Cookies">
        <p>Wir setzen nur ein technisch notwendiges Sitzungs-Cookie für die Anmeldung. Keine Tracking- oder Werbe-Cookies.</p>
      </LegalSection>
    </LegalPage>
  );
}
