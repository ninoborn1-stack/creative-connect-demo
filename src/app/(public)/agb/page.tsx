import type { Metadata } from "next";
import Link from "next/link";
import { getFees } from "@/lib/settings";
import { LegalPage, LegalSection } from "@/components/public/legal-page";

export const metadata: Metadata = { title: "AGB" };

const TOC = [
  { id: "geltung", label: "Geltungsbereich" },
  { id: "rolle", label: "Rolle der Plattform" },
  { id: "selbststaendigkeit", label: "Selbstständigkeit" },
  { id: "gebuehren", label: "Gebühren" },
  { id: "zahlung", label: "Zahlungsabwicklung" },
  { id: "ranking", label: "Ranking-Kriterien" },
  { id: "sperre", label: "Sperrgründe" },
  { id: "beschwerden", label: "Beschwerden" },
];

export default async function AgbPage() {
  const fees = await getFees();
  return (
    <LegalPage title="Allgemeine Geschäftsbedingungen" updated="01.10.2026">
      <nav aria-label="Inhalt" className="grid gap-4 border-b py-10 lg:grid-cols-12 lg:gap-10">
        <p className="meta text-muted-foreground lg:col-span-3">Inhalt</p>
        <ol className="grid border-t text-sm sm:grid-cols-2 sm:gap-x-10 lg:col-span-9">
          {TOC.map((t, i) => (
            <li key={t.id} className="border-b">
              <Link href={`#${t.id}`} className="flex items-baseline gap-4 py-3 text-muted-foreground transition-colors hover:text-primary">
                <span className="meta w-8 shrink-0 text-primary">§ {i + 1}</span>{t.label}
              </Link>
            </li>
          ))}
        </ol>
      </nav>

      <LegalSection id="geltung" title="§ 1 Geltungsbereich">
        <p>Diese AGB gelten für alle Mitglieder (Kreative und Auftraggeber:innen) von Creative Connect. Die Plattform richtet sich ausschließlich an Unternehmer:innen im Sinne des § 14 BGB.</p>
      </LegalSection>

      <LegalSection id="rolle" title="§ 2 Rolle der Plattform">
        <p>Creative Connect vermittelt Kontakte und stellt Werkzeuge für Briefing, Buchung, Vertrag und Abrechnung bereit. Verträge über kreative Leistungen kommen direkt zwischen Auftraggeber:in und Kreativen zustande.</p>
        <p>Beim Angebot <strong>Managed Crew</strong> stellt Creative Connect auf Wunsch ein Team zusammen und koordiniert das Projekt; die Kreativen bleiben eigenständige Vertragspartner:innen.</p>
      </LegalSection>

      <LegalSection id="selbststaendigkeit" title="§ 3 Selbstständigkeit, keine Weisungen">
        <ul>
          <li>Kreative legen ihre Preise selbst fest und können Anfragen jederzeit ohne Begründung ablehnen.</li>
          <li>Creative Connect erteilt keine Weisungen zu Art, Ort oder Zeit der Leistung und steuert oder bewertet die Arbeit nicht algorithmisch.</li>
          <li>Kreative arbeiten mit eigenen Arbeitsmitteln und dürfen für beliebig viele weitere Auftraggeber:innen tätig sein.</li>
          <li>Das Dashboard zeigt zur Orientierung den „Anteil größter Auftraggeber“, damit eine einseitige Abhängigkeit früh sichtbar wird.</li>
        </ul>
      </LegalSection>

      <LegalSection id="gebuehren" title="§ 4 Gebühren">
        <ul>
          <li>Für Kreative ist die Vermittlung provisionsfrei ({fees.creativeCommissionPct} %).</li>
          <li>Auftraggeber:innen zahlen eine Servicegebühr von {fees.serviceFeePct} % auf das Honorar, separat ausgewiesen.</li>
          <li>Optional: Pro-Mitgliedschaft für Kreative ({fees.proPriceEur} € / Monat, monatlich kündbar). Pro verbessert nicht die Platzierung in Suchergebnissen.</li>
          <li>Managed Crew: Projektpauschale mit einer Marge von {fees.managedMarginPct} %, im Angebot transparent ausgewiesen.</li>
        </ul>
      </LegalSection>

      <LegalSection id="zahlung" title="§ 5 Zahlungsabwicklung">
        <p>
          Zahlungen laufen ausschließlich über einen lizenzierten Zahlungsdienstleister. Creative Connect nimmt selbst keine Kundengelder an und führt kein eigenes Treuhandkonto.
          Das Honorar wird bei Buchung reserviert, nach Abnahme freigegeben und anschließend an die Kreativen ausgezahlt.
        </p>
      </LegalSection>

      <LegalSection id="ranking" title="§ 6 Ranking-Kriterien">
        <p>Die Reihenfolge von Profilen in Suche und Crew-Vorschlägen ergibt sich aus folgenden Hauptparametern (Art. 5 P2B-Verordnung):</p>
        <ul>
          <li><strong>Bereich und Skills</strong> – passen sie zur gesuchten Rolle?</li>
          <li><strong>Tagessatz im Budget</strong> – liegt der Tagessatz-Rahmen innerhalb des Rollenbudgets?</li>
          <li><strong>Nähe</strong> – Entfernung zum Projektort und angegebene Reisebereitschaft.</li>
          <li><strong>Verfügbarkeit</strong> im angefragten Zeitraum.</li>
          <li><strong>Bewertung</strong> – Durchschnitt und Anzahl der Bewertungen aus abgeschlossenen Projekten.</li>
          <li><strong>Verifizierung</strong> durch das Creative-Connect-Team.</li>
        </ul>
        <p><strong>Gründerprofil:</strong> Das Profil von Gründer Nesto wird in der Standard-Sortierung unter den ersten Treffern angezeigt. Bei eigener Sortierung (Preis, neu) gilt das nicht.</p>
        <p><strong>Keine bezahlte Platzierung:</strong> Niemand kann sich ein besseres Ranking kaufen – auch nicht mit der Pro-Mitgliedschaft.</p>
      </LegalSection>

      <LegalSection id="sperre" title="§ 7 Sperrgründe">
        <p>Wir können Konten einschränken oder sperren, insbesondere bei:</p>
        <ul>
          <li>falschen Angaben zu Identität, Qualifikation oder Portfolio,</li>
          <li>Umgehung der Zahlungsabwicklung nach Vermittlung über die Plattform,</li>
          <li>Belästigung, Diskriminierung oder Bedrohung anderer Mitglieder,</li>
          <li>wiederholten Nichterscheinen oder Nichtleistung ohne Absage,</li>
          <li>Verletzung von Urheber- oder Persönlichkeitsrechten,</li>
          <li>nicht gekennzeichneten KI-generierten Portfolio-Inhalten.</li>
        </ul>
        <p>Eine Sperre teilen wir mit Begründung vorab mit (bei schweren Verstößen spätestens zeitgleich). Jede Entscheidung wird dokumentiert und kann über das Beschwerdemanagement angefochten werden.</p>
      </LegalSection>

      <LegalSection id="beschwerden" title="§ 8 Beschwerden und Streitfälle">
        <p>Bei Streit über eine Leistung kann jede Seite im Projektraum einen Streitfall eröffnen. Das Team prüft den Verlauf und entscheidet über Freigabe oder Erstattung der reservierten Zahlung.</p>
      </LegalSection>
    </LegalPage>
  );
}
