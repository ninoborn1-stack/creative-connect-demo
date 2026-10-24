# Businessplan-Kontext für die Demo

Beide Pläne liegen nur lokal in `docs/businessplaene/` (vertraulich, nicht im öffentlichen Repo):

- **`Businessplan-2023-alt.pdf`** – Nestos erster Plan (Planungszeitraum Feb. 2023 – Jan. 2026). Bleibt als Referenz für das, was Nesto ursprünglich im Kopf hatte.
- **`Businessplan-2026-neu.pdf`** – überarbeiteter Plan inkl. Prüfbericht zum alten Plan. **Grundlage der Demo.**

## Was Nesto 2023 im Kopf hatte – und wo es in der Demo steckt

| Idee aus dem Plan 2023 | Umsetzung in der Demo |
| --- | --- |
| „Creative Connect“ als Vermittler/Agentur zwischen Künstler:innen und Unternehmen, Labels, Agenturen | Crew-Plattform mit zwei Wegen: Self-Service und **Managed Crew** (das Agentur-Element als Premium) |
| Sieben Bereiche: Musikproduktion, Tonstudio-Vermietung, Videograf, Fotograf, Booker, Schauspieler, Grafikdesigner | Exakt diese sieben Kategorien (`src/lib/constants.ts`), jeweils mit eigener Profil-Sektion |
| „Es ist schwer, im Medienbereich ein Team zusammenzustellen – kostet Zeit und Kontakte“ | Kernversprechen der Landingpage, Crew-Builder |
| „Mit einem Blick die komplette Produktionskette einsehen und buchen“ | Mitglieder-Verzeichnis + Crew-Builder + Projektraum |
| „Mit detaillierten Fragebogen ermitteln wir die im Budget liegenden Dienstleister“ | **Briefing-Assistent** (KI) mit Budgetaufteilung und Crew-Vorschlag im Budgetrahmen |
| Nestos Auge für Kreative, auch für noch nicht etablierte (preislich attraktiv) + Kartei etablierter Dienstleister | Kuratiertes, geschlossenes Netzwerk; Verifizierung durch Admin |
| Kostenlose Plattform, Einnahmen über Provision auf Vermittlungen + Premium-Funktionen | 0 % für Kreative, 10 % Servicegebühr Auftraggeber, Pro-Abo 12 €/Monat, Managed-Crew-Marge 18 % |
| Partnerprogramm | Einladungs- und Empfehlungssystem mit Empfehlungsbaum |
| Zielkunden wie „Red Bull, Puma, HipHop-Magazine, Labels“, Independent-Artists „in ihrer Nähe“ | Fiktive Pendants im Seed (z. B. „Nordwind Energy Drinks“, „Kiezbeat Magazin“); Umkreis-Filter |
| Start aus dem Home-Office, schlanke Kosten | Nur Hinweis im Kontext; Demo ohne laufende Kosten (alle Dienste gemockt) |

## Was 2026 anders ist (aus dem neuen Plan)

- **Reihenfolge:** Phase 1 geschlossenes Netzwerk → Phase 2 externe Auftraggeber → Phase 3 offen. In der Demo per Feature-Flag `marketplaceMode` (`closed | clients | open`) im Admin umschaltbar.
- **KI im Ablauf, nicht als Ersatz** – „KI organisiert, Menschen gestalten“; Kennzeichnung nach EU AI Act Art. 50.
- **Rechtssicherheit eingebaut:** Künstlersozialabgabe (2026: 4,9 %, Bagatellgrenze 1.000 €), Scheinselbstständigkeit (Kennzahl „Anteil größter Auftraggeber“), EU-Plattformarbeitsrichtlinie (keine Steuerung der Arbeit), DAC7-Meldung (nur Flag „Steuer-ID hinterlegt“), Zahlungen nur über lizenzierten Zahlungsdienstleister (kein eigenes Treuhandkonto), DSGVO/P2B (Ranking- und Sperrkriterien in den AGB).

## Bewusst nicht übernommen aus 2023

Die Finanztabellen des alten Plans (Vorlage mit „Backwaren, Früchte, Gemüse“, alle Werte 0 €, widersprüchlicher Kapitalbedarf 15.300 € vs. 120 €) – siehe Prüfbericht im neuen Plan. Die Demo zeigt nur die Erlöslogik aus dem Plan 2026.
