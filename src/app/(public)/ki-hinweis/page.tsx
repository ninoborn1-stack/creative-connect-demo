import type { Metadata } from "next";
import { AiNotice } from "@/components/badges";
import { LegalPage, LegalSection } from "@/components/public/legal-page";

export const metadata: Metadata = { title: "Hinweis zur KI-Nutzung" };

export default function KiHinweisPage() {
  return (
    <LegalPage
      title="Hinweis zur KI-Nutzung"
      updated="01.10.2026"
      intro="KI organisiert, Menschen gestalten. Hier erklären wir offen, wo bei Creative Connect künstliche Intelligenz im Spiel ist – und wo nicht."
    >
      <AiNotice />
      <LegalSection title="Transparenz nach EU AI Act (Art. 50)">
        <p>Wenn du mit einem KI-System interagierst oder Inhalte siehst, die von KI erzeugt wurden, kennzeichnen wir das sichtbar – mit dem Hinweis „KI-Vorschlag – du entscheidest“ oder einem KI-Label.</p>
      </LegalSection>
      <LegalSection title="Wofür wir KI nutzen">
        <ul>
          <li><strong>Briefing-Assistent:</strong> strukturiert deinen Freitext oder deine Sprachnachricht in Ziel, Format, Termine, Ort, Stil und Budget.</li>
          <li><strong>Rollen- und Budgetvorschlag:</strong> schlägt vor, welche Rollen ein Projekt braucht und wie sich das Budget aufteilen könnte.</li>
          <li><strong>Crew-Vorschläge:</strong> nennt pro Rolle passende Mitglieder mit einer nachvollziehbaren Begründung („passt, weil …“).</li>
          <li><strong>Transkription</strong> von Sprachnachrichten im Briefing.</li>
        </ul>
      </LegalSection>
      <LegalSection title="Wofür wir KI nicht nutzen">
        <ul>
          <li>Keine automatischen Buchungen, Absagen oder Sperren.</li>
          <li>Keine Bewertung oder Steuerung der Arbeit von Kreativen.</li>
          <li>Keine Preisfestsetzung – Tagessätze bestimmen die Kreativen selbst.</li>
        </ul>
      </LegalSection>
      <LegalSection title="Die Entscheidung bleibt beim Menschen">
        <p>Alle KI-Vorschläge sind bearbeitbar. Wer angefragt, gebucht oder bezahlt wird, entscheidest immer du. Kreative entscheiden selbst, ob sie eine Anfrage annehmen.</p>
      </LegalSection>
      <LegalSection title="KI-generierte Portfolio-Inhalte">
        <p>Mitglieder müssen Portfolio-Arbeiten, die ganz oder wesentlich mit KI erstellt wurden, beim Hochladen kennzeichnen. Diese Arbeiten tragen dann ein sichtbares KI-Label.</p>
      </LegalSection>
      <LegalSection title="Daten">
        <p>An den KI-Dienst übermitteln wir nur Briefing-Inhalte, keine Kontodaten. Die Inhalte werden nicht zum Training fremder Modelle verwendet.</p>
      </LegalSection>
    </LegalPage>
  );
}
