# Auftrag: Creative Connect – vollständige Klick-Demo

Ziel: lauffähige, vollständig durchklickbare Demo aller Bereiche – mit Stock-Bildern, Seed-Daten und gemockten Integrationen. Keine echten Zahlungen, keine echten Nutzerdaten.

## 1. Kontext

Creative Connect ist eine Crew-Plattform für die Kreativ- und Medienbranche in Deutschland. Kreative (Musikproduktion, Tonstudio, Videografie, Fotografie, Booking, Schauspiel, Grafikdesign) werden mit Auftraggebern (Independent-Artists, Labels, Marken, Agenturen) verbunden. Die Plattform stellt für ein Projekt eine passende **Crew** zusammen und wickelt Briefing, Buchung, Vertrag, Zahlung, Abnahme und Bewertung in einem Ablauf ab.

- **Phase 1 = geschlossenes Netzwerk.** Zugang nur per Einladung. Mitglieder buchen sich gegenseitig.
- **Phase 2/3 = Öffnung** für externe Auftraggeber und später öffentliche Suche, per Feature-Flag `marketplaceMode: "closed" | "clients" | "open"` im Admin umschaltbar.
- **Zwei Wege zur Crew:** *Self-Service* (Auftraggeber sucht und bucht selbst) und *Managed Crew* (Admin/Nesto stellt das Team zusammen, Premium).
- **Erlösmodell:** 0 % Provision für Kreative; Auftraggeber zahlen 10 % Servicegebühr; Pro-Abo für Kreative 12 €/Monat; Managed Crew mit 18 % Marge.
- **Werte:** fair bezahlt, kuratiert, „Menschen vor Maschine“ (KI organisiert, Menschen gestalten), transparent.

Gesamte UI auf Deutsch. EUR, `TT.MM.JJJJ`, Europe/Berlin.

## 3. Bilder, Medien, Texte

- Bilder über `stockImage(seed, w, h)` (picsum mit stabilen Seeds).
- Audio-Hörproben: WAV-Dateien in `public/demo-audio/` (`demo-1.wav` … `demo-8.wav`), eigener kleiner Player mit Wellenform-Optik (CSS-Balken).
- Showreels: Poster-Bild + Play-Overlay, Klick öffnet Modal „Demo – Showreel-Einbettung (YouTube/Vimeo) folgt“.
- Realistische deutsche Texte, keine Lorem-Ipsum. Alles frei erfunden. Footer „Demo – alle Inhalte fiktiv, Bilder: Stock“ (ist bereits im Layout).

## 4. Design

Dunkel, nachtclub-/studio-artig, aber clean; Akzent Violett; viel Weißraum, große Typografie. Light-Mode per Toggle. Mobil zuerst (375 px), Bottom-Navigation mobil, Sidebar Desktop. Profilkarten mit Bild, Bereich-Badges, Region, Tagessatz-Rahmen, Verfügbarkeits-Punkt, Bewertung. Leere Zustände, Lade-Skeletons, Fehlerzustände. Fokus-Stile, Labels, Kontraste AA.

## 5. Rollen

| Rolle | Kann |
| --- | --- |
| Admin (Nesto) | Alles; Einladungen freigeben, Mitglieder verifizieren/sperren, Managed Crews anlegen, Streitfälle lösen, `marketplaceMode` umschalten, KPIs, Exporte |
| Kreative:r | Profil pflegen, Anfragen annehmen/ablehnen, eigene Preise setzen, Studios/Locations anbieten, Projekträume nutzen, Rechnungen sehen, andere Kreative buchen, einladen |
| Auftraggeber:in | Briefing erstellen, Crew suchen/zusammenstellen, buchen, zahlen (Mock), abnehmen, bewerten |

## 7. Seiten und Funktionen (alles muss klickbar sein)

### 7.1 Öffentlich
- Landingpage (abhängig von `marketplaceMode`): Hero mit Claim („Deine Crew. Dein Netzwerk. Ein Klick.“), Erklärung in drei Schritten, Bereiche-Kacheln, Beispiel-Crews, Stimmen aus der Community, Werte, FAQ, CTA „Einladung einlösen“ bzw. (Modus `clients`/`open`) „Projekt starten“.
- Einladung einlösen (`/invite/[code]`) mit gültigem/abgelaufenem Code; Warteliste für Personen ohne Code.
- Login, Passwort vergessen (Mock).
- Rechtliche Platzhalterseiten: Impressum, Datenschutz, AGB (mit Abschnitten zu Ranking-Kriterien und Sperrgründen), Hinweis zur KI-Nutzung.

### 7.2 Onboarding (nach Einladung)
Wizard: Rolle(n) → Bereiche & Skills → Stadt/Region & Reisebereitschaft → Tagessatz-Rahmen → Portfolio-Upload (Stock vorausgefüllt) → Steuerangaben (nur Flag „Steuer-ID hinterlegt“ für DAC7) → Hinweis Künstlersozialkasse → Fertig mit Profil-Vorschau.

### 7.3 Dashboard (rollenabhängig)
- Kreative: offene Anfragen, nächste Termine, laufende Projekte, Auszahlungen (Mock), Profil-Vollständigkeit, „Wer hat mich angesehen“, eigene Einladungen; Kennzahl „Anteil größter Auftraggeber“.
- Auftraggeber: aktive Projekte mit Status-Stepper, offene Crew-Rollen, Zahlungsstatus, Vorschläge.
- Admin: siehe 7.12.

### 7.4 Mitglieder-Verzeichnis
Suche + Filter (Bereich, Skill, Stadt/Umkreis, Tagessatz, Verfügbarkeit im Zeitraum, nur verifiziert, Bewertung), Sortierung, Kartenansicht und Deutschlandkarte (SVG mit Punkten nach Stadt). „Zur Crew hinzufügen“-Button auf jeder Karte.

### 7.5 Profilseiten
Je nach Bereich: Galerie (Foto/Design), Hörproben-Player (Musik), Showreel-Poster (Video), Sedcard (Schauspiel), Studio-Ausstattung (Tonstudio). Außerdem: Credits-Liste, Bewertungen, Verfügbarkeitskalender, Preisrahmen, Badge „Verifiziert“, „Im Netzwerk seit“, eingeladen von, Button „Anfragen“.

### 7.6 Briefing-Assistent (KI)
- Eingabe Freitext oder Sprachnachricht (Browser-Aufnahme; Transkription im Mock = vordefinierter Beispieltext).
- Ausgabe: strukturiertes Briefing (Ziel, Format, Termine, Ort, Stil, Budget), vorgeschlagene Rollen mit Budgetanteil (bearbeitbar, Summe = Gesamtbudget), Crew-Vorschläge pro Rolle (je 3, mit Begründung „passt weil …“).
- Sichtbarer Hinweis „KI-Vorschlag – du entscheidest“.
- Drei Demo-Briefings als Buttons.

### 7.7 Crew-Builder & Projekt
- Rollen-Board (Spalten: offen / angefragt / bestätigt), Drag & Drop von Personen in Rollen, parallele Anfragen, Gegenangebote, Budget-Ampel.
- Umschalter Self-Service ↔ „Managed Crew anfragen“ (geht an Admin).
- Projektraum: Übersicht, Zeitplan/Meilensteine, Chat, Dateien, Crew mit Kontakt, Vertrag, Zahlung, Abnahme-Button, danach Bewertungsdialog für alle Beteiligten.

### 7.8 Studios & Locations
Liste + Detail mit Bildergalerie, Ausstattung, Preisen, Kalender mit freien Slots, Sofortbuchung (Mock-Zahlung), eigene Venues anlegen/verwalten.

### 7.9 Verträge, Zahlungen, Rechnungen
- Vertragsvorlagen (Werkvertrag Produktion, Foto-/Video-Nutzungsrechte, Studio-Miete, Booking) mit Platzhaltern; Vorschau; „Unterschreiben“ per Checkbox + Name.
- Zahlungsablauf-Visualisierung: reserviert → freigegeben nach Abnahme → ausgezahlt; Servicegebühr 10 % separat.
- Rechnung als PDF (`@react-pdf/renderer`).
- Info-Box Künstlersozialabgabe (2026: 4,9 %, Bagatellgrenze 1.000 €/Jahr) mit Jahresübersicht-Export (CSV). Kein Rechtsrat.
- Hinweis-Box Selbstständigkeit: Kreative setzen Preise selbst, lehnen frei ab, arbeiten weisungsfrei; Kennzahl „Anteil größter Auftraggeber“.

### 7.10 Community
Feed (Posts, Bilder, Likes, Kommentare), Events (Liste, Detail, Zusage), Wissensbereich (Artikel), Equipment-Börse (verleihen/verkaufen), Einladen-Seite mit eigenem Code, Empfehlungsbaum und Partnerprogramm-Status.

### 7.11 Benachrichtigungen & Outbox
Glocke mit Liste; „Outbox“ zeigt alle gemockten E-Mails.

### 7.12 Admin (Nesto)
- KPI-Dashboard: aktive Mitglieder, neue Einladungen, Projekte nach Status, vermitteltes Volumen, Servicegebühren, Pro-Abos, Managed-Crew-Marge (Charts über 12 Monate, recharts).
- Mitgliederverwaltung: Freigabe, Verifizierung, Sperre (mit Begründung, Audit-Log).
- Einladungen: Kontingente, Codes, Warteliste abarbeiten.
- Managed Crews: Pipeline (Anfrage → Angebot → Crew → Produktion).
- Streitfälle: Liste, Verlauf, Entscheidung, Zahlung erstatten/freigeben (Mock).
- Einstellungen: `marketplaceMode` (sichtbarer Effekt auf Landingpage, Registrierung, Verzeichnis); Gebührensätze; Kategorien.
- Exporte: CSV „DAC7-Vorbereitung“ (Anbieter, Umsätze pro Quartal), CSV „KSK-Übersicht Managed Crews“.
- Button „Demo zurücksetzen“ (Seed neu ausführen).

## Demo-Logins
`admin@demo.cc` (Nesto), `kreativ@demo.cc` (Jule Brandt, Videografin/Fotografin in Leipzig, zugleich Auftraggeberin), `kunde@demo.cc` (Tarek Yilmaz, Nordlicht Records) – Passwort `demo`.
