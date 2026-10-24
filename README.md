# Creative Connect – Klick-Demo

Durchklickbare Demo der Crew-Plattform **Creative Connect**: Kreative aus Musikproduktion, Tonstudio, Videografie, Fotografie, Booking, Schauspiel und Grafikdesign werden zu Crews für Projekte zusammengestellt – mit Briefing, Buchung, Vertrag, Zahlung, Abnahme und Bewertung in einem Ablauf.

Ziel der Demo: Nesto und seinem Netzwerk zeigen, wie die Plattform in **Phase 1 (geschlossenes Netzwerk)** funktioniert und wie die spätere Öffnung aussieht – ohne echte Zahlungen, ohne echte Nutzerdaten.

> **Demo – alle Inhalte fiktiv, Bilder: Stock.** Personen, Firmen und Labels sind frei erfunden.

## Start in 3 Befehlen

```bash
pnpm install
pnpm dev
```

```bash
open http://localhost:3000
```

`pnpm dev` legt beim ersten Start automatisch `.env` an, erzeugt die SQLite-Datenbank und befüllt sie (`prisma/dev.db`). Zurücksetzen (Seed leert alle Tabellen und füllt sie neu): `pnpm db:reset` oder im Admin-Bereich „Demo zurücksetzen“.

## Demo-Logins

Passwort jeweils `demo` (steht auch auf der Login-Seite). Nach dem Login wechselt der **Rollenwechsler** oben in der Leiste ohne Passwort zwischen den Konten.

| Rolle | E-Mail | Wer |
| --- | --- | --- |
| Admin | `admin@demo.cc` | Nesto von Drabich, Gründer (zugleich Musikproduzent) |
| Kreative:r | `kreativ@demo.cc` | Jule Brandt, Regie & Kamera in Leipzig – bucht selbst auch Crews |
| Auftraggeber:in | `kunde@demo.cc` | Tarek Yilmaz, Nordlicht Records (Label) |

Einladungscodes: `CC-DEMO-2026` (gültig, beliebig oft einlösbar), `CC-ALT-2023` (abgelaufen).

## Klickpfad für die Präsentation (10 Schritte)

1. **Landingpage** `/` – Claim, drei Schritte, sieben Bereiche, Beispiel-Crews, Werte, Roadmap. Hinweis: Phase 1, nur per Einladung.
2. **Einladung einlösen** `/invite/CC-DEMO-2026` → Konto anlegen → **Onboarding-Wizard** (Rolle, Bereiche, Region, Tagessatz, Portfolio, Steuer-Flag für DAC7, KSK-Hinweis, Profil-Vorschau).
3. Mit dem Rollenwechsler zu **Auftraggeber:in (Nordlicht)** wechseln → Dashboard mit Status-Stepper und offenen Rollen.
4. **Briefing-Assistent** `/briefing` → „Musikvideo für Single-Release“ → „Briefing strukturieren“: Rollen mit Budgetanteilen, je drei Crew-Vorschläge mit Begründung, Hinweis „KI-Vorschlag – du entscheidest“.
5. „Projekt anlegen“ → **Crew-Builder**: Personen per Drag & Drop (oder Button) in Rollen ziehen, Budget-Ampel, „Demo: alle Zusagen simulieren“ → Crew bestätigt, Vertrag und Zahlungen reserviert.
6. Im **Projektraum**: Zeitplan, Chat, Dateien, Vertrag & Zahlung. „Produktion starten“ → „Zur Abnahme“ → **Abnahme erteilen** → Zahlungen werden freigegeben und ausgezahlt → **Bewertungsdialog**.
7. **Verträge & Zahlungen** `/finanzen`: Zahlungsablauf reserviert → freigegeben → ausgezahlt, 10 % Servicegebühr separat, Rechnung als PDF, Künstlersozialabgabe-Box mit CSV-Export.
8. Zu **Kreative:r (Jule)** wechseln → Dashboard mit Anfragen (annehmen / Gegenangebot / ablehnen), Auszahlungen, „Anteil größter Auftraggeber“; dann **Mitglieder-Verzeichnis** mit Filtern und Deutschlandkarte, ein Profil mit Hörproben, Galerie, Sedcard oder Studio-Ausstattung.
9. **Studios & Locations** → z. B. „Raum 404“ → Slot wählen → **Sofortbuchung** mit Mock-Zahlung. Danach **Community**: Feed, Events (Zusagen), Wissen, Equipment-Börse, **Einladen** mit Empfehlungsbaum und Partnerprogramm.
10. Zu **Admin (Nesto)** wechseln → KPI-Dashboard (12 Monate), Mitglieder verifizieren/sperren, Warteliste, Managed-Crew-Pipeline, Streitfälle entscheiden, Exporte (DAC7, KSK). In **Einstellungen** den Marktplatz-Modus auf „Auftraggeber:innen“ oder „Offen“ stellen und die Landingpage neu laden: neue CTAs, Registrierung, öffentliches Verzeichnis `/verzeichnis`.

## Architektur

- **Next.js 16** (App Router, Server Components, Server Actions), **TypeScript strict**, **Tailwind CSS 4** + **shadcn/ui** (Radix), `lucide-react`, `recharts`, `@react-pdf/renderer`, `sonner`, `date-fns` (de).
- **Prisma 6 + SQLite** (`prisma/schema.prisma`). Für Postgres: `provider` ändern; Listenfelder sind als JSON-String gespeichert und können auf `String[]`/`Json` umgestellt werden.
- **Seed** `src/lib/seed/run.ts` mit festem Zufalls-Seed: 1 Admin, 60 Kreative in 15 Städten, 12 Auftraggeber:innen, 10 Studios/Locations, 15 Projekte über alle Status (3 Managed Crews, 2 Streitfälle), 80 Bewertungen, 120 Credits, 10 Events, 25 Posts, 8 Wissensartikel, 12 Equipment-Angebote, 12 Monate KPI-Verlauf. Hörproben (WAV) werden per Skript erzeugt (`scripts/generate-audio.ts`).

```
src/
  app/(public)/      Landingpage, Einladung, Warteliste, Registrierung, Login, Rechtsseiten, öffentliches Verzeichnis
  app/onboarding/    Wizard nach Einladung
  app/(app)/         Dashboard, Mitglieder, Briefing, Projekte, Studios, Finanzen, Community, Benachrichtigungen, Outbox
  app/admin/         KPIs, Mitglieder, Einladungen, Managed Crews, Streitfälle, Einstellungen, Exporte
  app/actions/       Server Actions je Feature
  components/        UI-Bausteine (ui/ = shadcn) und Feature-Komponenten
  lib/services/      austauschbare Dienste (Zahlung, KI, Mail, Speicher)
  lib/seed/          Seed-Daten und -Logik
prisma/              Schema und Seed-Einstieg
e2e/                 Playwright-Smoke-Tests
docs/                Businesspläne (2023 alt, 2026 neu), Kontext, Auftrag, Konventionen
```

Der **Marktplatz-Modus** (`closed` / `clients` / `open`) liegt in der Tabelle `Setting` und wird im Admin umgeschaltet – Landingpage, Registrierung und Verzeichnis lesen ihn zur Laufzeit, es ist kein Umbau nötig.

## Was gemockt ist – und wodurch es ersetzt würde

| Bereich | In der Demo | Für den echten Start |
| --- | --- | --- |
| Zahlungen | `src/lib/services/payments.ts`: Status reserviert → freigegeben → ausgezahlt/erstattet in der DB | Lizenzierter Marktplatz-Zahlungsdienstleister (z. B. Stripe Connect) inkl. KYC der Kreativen. Nie eigenes Treuhandkonto (ZAG). |
| Briefing-KI | Regelbasierter Mock (Keywords, Budgetschlüssel), Crew-Vorschlag per transparentem Scoring | Mit `ANTHROPIC_API_KEY` bereits echter Aufruf der Claude API mit strukturierter Ausgabe (`src/lib/services/ai.ts`); Transkription von Sprachnachrichten fehlt noch |
| E-Mails | Landen in der In-App-Outbox (`/outbox`) | EU-Mailanbieter, Double-Opt-in, Abmeldelinks |
| Login | Signiertes Session-Cookie, Klartext-Passwort `demo`, Rollenwechsler | Auth.js mit Magic-Link oder Passkeys, gehashte Passwörter, Rollenwechsler entfernen |
| Dateien | `public/uploads` lokal | S3-kompatibler Speicher in der EU mit Virenscan |
| Bilder/Showreels | Stock-Bilder (picsum, zentral in `src/lib/stock.ts`), Showreel-Platzhalter | Eigene Uploads, YouTube-/Vimeo-Einbettung mit Consent |
| Verträge | Vorlagen mit Platzhaltern, Unterschrift per Checkbox + Name | Anwaltlich geprüfte Vorlagen, qualifizierte/fortgeschrittene E-Signatur |
| Rechnungen/KSK/DAC7 | PDF und CSV aus fiktiven Daten | Buchhaltungsanbindung, Prüfung durch Steuerberatung, DAC7-Meldung an das BZSt |

## Was für einen echten Start fehlt

- Vertrag mit einem **Zahlungsdienstleister** mit Marktplatz-Lizenz
- **Rechtstexte** (AGB inkl. Ranking- und Sperrkriterien nach P2B-Verordnung, Datenschutzerklärung, Impressum) und anwaltlich geprüfte Vertragsvorlagen; Prüfung im Hinblick auf die EU-Plattformarbeitsrichtlinie (Umsetzung bis 02.12.2026)
- **Hosting in der EU** (App, Datenbank, Dateien, Mail), Backups, Monitoring
- **Echte KI-Anbindung** inkl. Transkription, Auftragsverarbeitungsvertrag und Kennzeichnung nach EU AI Act Art. 50
- **Datenschutz-Folgenabschätzung**, Verzeichnis der Verarbeitungstätigkeiten, Lösch- und Exportfunktionen (DSGVO)
- Echte Netzwerkdaten von Nesto (Kontakte, Auftragsgrößen, Bereiche), um Finanzplan und Annahmen zu prüfen

## Qualität

```bash
pnpm typecheck   # TypeScript
pnpm lint        # ESLint
pnpm build       # Produktions-Build
pnpm test:e2e    # Playwright: eigener Build-Server auf Port 3100 mit frischer Test-DB
```

Die Smoke-Tests (`e2e/`) decken ab: Einladung einlösen → Onboarding; Briefing → Crew → Buchung → Abnahme → Bewertung; Studio buchen; Admin schaltet `marketplaceMode` um; Kernseiten bei 375 px ohne horizontales Scrollen. Vor `pnpm test:e2e` einmal `pnpm build` ausführen.

## Hintergrund

Die beiden Businesspläne liegen in `docs/businessplaene/`. Was aus Nestos erstem Plan (2023) stammt und wie es im Plan 2026 und in dieser Demo umgesetzt ist, steht in [`docs/businessplan-kontext.md`](docs/businessplan-kontext.md).
