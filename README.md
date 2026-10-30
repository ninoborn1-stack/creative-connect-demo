# Creative Connect – Klick-Demo

Durchklickbare Demo der Crew-Plattform **Creative Connect**: Kreative aus Musikproduktion, Tonstudio, Videografie, Fotografie, Booking, Schauspiel und Grafikdesign werden zu Crews für Projekte zusammengestellt – mit Briefing, Buchung, Vertrag, Zahlung, Abnahme und Bewertung in einem Ablauf.

Ziel der Demo: Nesto und seinem Netzwerk zeigen, wie die Plattform in **Phase 1 (geschlossenes Netzwerk)** funktioniert und wie die spätere Öffnung aussieht – ohne echte Zahlungen, ohne echte Nutzerdaten.

> **Live-Demo:** https://ninoborn1-stack.github.io/creative-connect-demo/ (läuft komplett im Browser, Daten bleiben im eigenen Browser)
>
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
| Admin | `admin@demo.cc` | Nesto, Gründer (zugleich Musikproduzent) |
| Kreative:r | `kreativ@demo.cc` | Jule Brandt, Regie & Kamera in Leipzig – bucht selbst auch Crews |
| Auftraggeber:in | `kunde@demo.cc` | Tarek Yilmaz, Nordlicht Records (Label) |

Einladungscodes: `CC-DEMO-2026` (gültig, beliebig oft einlösbar), `CC-ALT-2023` (abgelaufen).

## Ausbaustufe 1 (Stand 30.10.2026)

Nach dem Design-Review mit Nesto startet die Plattform mit **drei Funktionen** – alles andere bleibt im Code und wird über `src/lib/features.ts` Schritt für Schritt freigeschaltet:

- **Paket buchen** – feste Produktionen mit Startpreis (`src/lib/packages.ts`), öffentlich unter `/pakete`, Anfrage unter `/paket-anfrage` → landet als Managed Crew im Admin
- **Artist anfragen** – `/mitglieder` und Profil, Button „… anfragen“ legt ein kleines Projekt mit Anfrage an (Nesto steht in der Standard-Sortierung auf Platz 3, offen in den AGB)
- **Als Artist anbieten** – Bewerbung unter `/bewerben`, eigenes Profil

Dazu: Profil, schlankes Dashboard mit drei Start-Kacheln, Punkte & Vorteile. In Navigation und auf der Startseite zeigt „Bald verfügbar“ den Fahrplan (Ausschreibungen).

**Freigeschaltet: Musik & Stock** (`FEATURES.musik`) – der Werk-Katalog unter `/lizenzen` läuft als „Anhören & Anfragen“: Tracks, Beats, Sounds, Fotos und Footage ansehen bzw. reinhören, dann „Nutzung anfragen“ → kleines Projekt mit Anfrage an den Artist (annehmen, ablehnen, Gegenangebot). Direkt-Lizenzierung mit Bezahlung und Zertifikat bleibt aus (`FEATURES.lizenzen`). Auf der Startseite gibt es einen Reinhör-Block, auf Artist-Profilen die eigenen Werke.

**Freigeschaltet: Lizenzfreie Musik & Stock** (`FEATURES.lizenzen`) – auf jeder Werk-Seite direkt lizenzieren: Stufe (Standard, Erweitert, Exklusiv/Buyout), Medien, Gebiet und Laufzeit wählen, einmal zahlen (Mock), Lizenzzertifikat als PDF; „Meine Lizenzen“ unter `/lizenzen/meine`. Individuelle Anfragen bleiben als Alternative („Individuell anfragen“). Der Katalog bleibt schlank (Bereichs-Chips statt Filtermaske).

**Freigeschaltet: Studios & Locations** (`FEATURES.studios`) – `/studios`: Tonstudios, Foto-/Videostudios, Proberäume und Locations nach Typ und Stadt, Kalender mit freien Zeiten, Sofortbuchung mit Mock-Zahlung; eigene Räume anbieten unter „Eigene Venue anlegen“. Auf der Startseite drei Räume als Bildkacheln, auf Profilen die Räume der Person.

**Freigeschaltet: Entdecken – App mit Swipe & Feed** (`FEATURES.entdecken`) – `/entdecken`: Artists, Musik & Stock (mit Hörprobe und Lizenzpreis), Pakete und Studios gemischt in einem Stapel. Nach rechts wischen (oder ♥ / Pfeiltaste →) merkt, nach links geht’s weiter, Rückgängig per ↺. Umschaltbar auf einen Feed zum Scrollen; „Gemerkt“ sammelt alles (im Browser gespeichert). Filter nach Artists, Musik & Stock, Pakete, Studios. In der mobilen Navigation an zweiter Stelle. Auf der Startseite steht direkt unter dem Brand-Banner (Abschnitt 02) eine Live-Demo im Handy-Rahmen – ohne Login ausprobierbar; Gemerktes taucht nach dem Login unter „Gemerkt“ wieder auf (gleicher Browser-Speicher).

## Ausrichtung (Stand 27.10.2026)

Nach Kunden-Feedback ist Creative Connect eine **professionelle Schnittstelle zwischen Unternehmen und geprüften Kreativen** – LinkedIn-artig, mit Fokus auf Corporate, Licensing und Gaming, ausdrücklich kein Marktplatz. Neu:

- **Für Unternehmen:** Startseite, `/fuer-unternehmen`, `/branchen` (Gaming ausgebaut), Firmen-Registrierung mit eigenem Unternehmensprofil
- **Lizenz-Katalog** `/lizenzen`: Werke lizenzieren nach Stufe, Medien, Gebiet und Laufzeit, Lizenzzertifikat als PDF
- **Unternehmen** `/unternehmen`, **Ausschreibungen** `/ausschreibungen` mit Pitch-Board (Zusage → Projekt mit Vertrag und Zahlung), **Netzwerk** `/netzwerk` (Vernetzen)
- **Bewerbung für Kreative** `/bewerben` mit Auto-Analyse und Vorprüfungs-Score, Fast-Track über Nestos Netzwerk; Admin-Queue `/admin/bewerbungen`
- Community (Sessions mit Nesto, Punkte) bleibt als Mitgliederbereich

Zusätzliche Demo-Logins für Unternehmen: `pixelfjord-games@demo.cc` (Gaming-Studio), `nachtwerk-interactive@demo.cc`, `brueckner-mobility-ag@demo.cc` – Passwort `demo`.

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

## Statische Browser-Demo (GitHub Pages)

Derselbe Code läuft zusätzlich als rein statische Seite – ohne Server, alle Daten im Browser.

```bash
PAGES_BASE_PATH=/creative-connect-demo pnpm build:pages   # → out/
PAGES_BASE_PATH=/creative-connect-demo pnpm pages:serve   # lokal wie GitHub Pages: http://localhost:4100/creative-connect-demo/
PAGES_BASE_PATH=/creative-connect-demo pnpm test:pages    # dieselben e2e-Tests gegen den Export
PAGES_BASE_PATH=/creative-connect-demo node scripts/pages/console-check.mjs   # alle Seiten durchklicken, Konsole prüfen (Server muss laufen)
```

Deployment: `.github/workflows/pages.yml` baut bei jedem Push auf `master` mit `PAGES_BASE_PATH=/<repo-name>`. Einmalig im Repo unter *Settings → Pages → Build and deployment → Source* „GitHub Actions“ wählen.

So funktioniert es (`scripts/pages/build.mjs`): Das Projekt wird nach `.pages-build/` kopiert und dort generisch umgebaut – jede `page.tsx`/`layout.tsx` wird zu einem dünnen Server-Wrapper plus Client-Modul, das die unveränderte async-Funktion im Browser aufruft und den Elementbaum (inkl. weiterer async Komponenten) auflöst (`src/lib/demo/render.tsx`). `@/lib/db` ist dort eine In-Memory-Datenbank mit Prisma-kompatibler Teil-API (`src/lib/demo/engine.ts`), gefüllt aus einem beim Build erzeugten Seed-Snapshot (`demo-data.json`); Änderungen liegen in `localStorage` (bei Platzproblemen IndexedDB), „Demo zurücksetzen“ im Admin lädt den Snapshot neu. Server Actions werden normale Funktionen (Redirect → Client-Navigation, danach Neuladen aller Ansichten), `next/headers`/`next/cache` sind Shims, Route Handler (PDF/CSV) laufen beim Klick im Browser. Pfade ohne statische Datei (z. B. ein gerade angelegtes Projekt) liefert Pages als `404.html` aus – die erkennt die Route und rendert die Seite. Pages-spezifisches liegt nur in `scripts/pages/` und `src/lib/demo/`.

Grenzen: Daten gelten nur für diesen Browser; Seiten zu im Browser angelegten Datensätzen kommen mit HTTP-Status 404 (Inhalt korrekt); KI-Assistent nutzt immer den Mock; Inline-Server-Actions (`"use server"` innerhalb von Komponenten) bekommen keine Redirect-Behandlung.

## Hintergrund

Die beiden Businesspläne liegen in `docs/businessplaene/`. Was aus Nestos erstem Plan (2023) stammt und wie es im Plan 2026 und in dieser Demo umgesetzt ist, steht in [`docs/businessplan-kontext.md`](docs/businessplan-kontext.md).
