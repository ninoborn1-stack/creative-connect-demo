# Datenfluss der Marketing-Seite

Was die Seite beim Aufruf wirklich tut: welche Server sie anfragt und was sie im Browser speichert. Grundlage für die Datenschutzerklärung (`src/content/legal-de.ts`). Messung mit `scripts/datenfluss.mjs` (Playwright, Chromium): jede Seite in DE und EN laden, bis unten scrollen, die Handy-Vorschau anspielen, dann Anfragen an fremde Hosts, Cookies, localStorage, sessionStorage und IndexedDB auflisten. Formulare werden dabei nicht abgeschickt.

Neu messen:

```bash
node scripts/datenfluss.mjs https://ninoborn1-stack.github.io/creative-connect-demo
```

## Ergebnis

- **Fremde Hosts beim Seitenaufruf:** keine. Schriften (Inter, Archivo, Geist Mono, Instrument Serif über `next/font`), Bilder, Icons, Hörproben und Skripte liegen auf demselben Server wie die Seite.
- **Cookies:** keine.
- **localStorage, sessionStorage, IndexedDB:** beim Aufruf leer. Die Sprache steckt in der Adresse (`/de/`, `/en/`), der Zustand der Handy-Vorschau nur im Arbeitsspeicher. Einzige Ausnahme: Wer im Footer „Bewegung reduzieren“ einschaltet, bekommt den Eintrag `bg-motion` im localStorage (nur auf Klick, wird beim Ausschalten gelöscht, in der Datenschutzerklärung beschrieben).
- **Einzige Verbindung zu Dritten:** der Formularversand an Brevo (`*.sibforms.com`), erst nach Klick auf Absenden.
- **Keine** Analytics, Werbung, Karten, eingebetteten Player (Spotify, YouTube, Instagram) oder Google Fonts vom Google-Server.

Gefunden und entfernt wurde nichts, die Seite war schon vorher frei von Fremdanfragen. Im Zuge der Rechtsprüfung geändert:

- Store-Badges mit den Namen der beiden App-Stores ersetzt durch den neutralen Hinweis „iOS, Android und Web · startet bald“ (es gibt noch keine Store-Einträge).
- Drei Fotos mit erkennbaren Gesichtern entfernt (zwei davon standen in der Vorschau bei erfundenen Profilen), ersetzt durch Fotos ohne Personen.
- Vergleiche mit einer bekannten Social-Media-App und das Startjahr aus den Texten genommen.

Dauerhaft abgesichert durch `e2e/legal.spec.ts`: Auf jeder Seite (DE, EN, 404) gehen beim Laden keine Anfragen an fremde Hosts, es gibt keine Cookies und keinen Browser-Speicher.

## Messung vorher (Live-Seite, Stand vor diesem Umbau)

In dieser Messung liefern `/en/imprint/` und `/en/privacy/` noch 404, weil es die englischen Slugs vorher nicht gab.

Gemessen am 2026-11-21 gegen `https://ninoborn1-stack.github.io/creative-connect-demo` mit Chromium (Playwright).

| Seite | Status | Anfragen | Fremde Hosts | Cookies | localStorage | sessionStorage | IndexedDB |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `/de/` | 200 | 70 | keine | keine | keine | keine | keine |
| `/en/` | 200 | 68 | keine | keine | keine | keine | keine |
| `/de/artists/` | 200 | 54 | keine | keine | keine | keine | keine |
| `/en/artists/` | 200 | 51 | keine | keine | keine | keine | keine |
| `/de/veranstalter/` | 200 | 54 | keine | keine | keine | keine | keine |
| `/en/veranstalter/` | 200 | 54 | keine | keine | keine | keine | keine |
| `/de/unternehmen/` | 200 | 54 | keine | keine | keine | keine | keine |
| `/en/unternehmen/` | 200 | 54 | keine | keine | keine | keine | keine |
| `/de/backstage/` | 200 | 53 | keine | keine | keine | keine | keine |
| `/en/backstage/` | 200 | 53 | keine | keine | keine | keine | keine |
| `/de/download/` | 200 | 66 | keine | keine | keine | keine | keine |
| `/en/download/` | 200 | 66 | keine | keine | keine | keine | keine |
| `/de/warteliste/` | 200 | 54 | keine | keine | keine | keine | keine |
| `/en/warteliste/` | 200 | 54 | keine | keine | keine | keine | keine |
| `/de/presse/` | 200 | 52 | keine | keine | keine | keine | keine |
| `/en/presse/` | 200 | 54 | keine | keine | keine | keine | keine |
| `/de/impressum/` | 200 | 53 | keine | keine | keine | keine | keine |
| `/en/imprint/` | 404 | 9 | keine | keine | keine | keine | keine |
| `/de/datenschutz/` | 200 | 51 | keine | keine | keine | keine | keine |
| `/en/privacy/` | 404 | 9 | keine | keine | keine | keine | keine |
| `/de/bestaetigt/` | 200 | 57 | keine | keine | keine | keine | keine |
| `/en/confirmed/` | 200 | 57 | keine | keine | keine | keine | keine |
| `/gibt-es-nicht/` | 404 | 9 | keine | keine | keine | keine | keine |

Ergebnis: Keine Anfrage an fremde Hosts. Nichts wird im Browser gespeichert.

## Messung nachher (neuer Build mit GitHub-Pages-Unterordner, lokal)

Gemessen am 2026-11-21 gegen `http://localhost:4201/creative-connect-demo` mit Chromium (Playwright).

| Seite | Status | Anfragen | Fremde Hosts | Cookies | localStorage | sessionStorage | IndexedDB |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `/de/` | 200 | 69 | keine | keine | keine | keine | keine |
| `/en/` | 200 | 69 | keine | keine | keine | keine | keine |
| `/de/artists/` | 200 | 54 | keine | keine | keine | keine | keine |
| `/en/artists/` | 200 | 54 | keine | keine | keine | keine | keine |
| `/de/veranstalter/` | 200 | 54 | keine | keine | keine | keine | keine |
| `/en/veranstalter/` | 200 | 54 | keine | keine | keine | keine | keine |
| `/de/unternehmen/` | 200 | 54 | keine | keine | keine | keine | keine |
| `/en/unternehmen/` | 200 | 54 | keine | keine | keine | keine | keine |
| `/de/backstage/` | 200 | 53 | keine | keine | keine | keine | keine |
| `/en/backstage/` | 200 | 53 | keine | keine | keine | keine | keine |
| `/de/download/` | 200 | 64 | keine | keine | keine | keine | keine |
| `/en/download/` | 200 | 64 | keine | keine | keine | keine | keine |
| `/de/warteliste/` | 200 | 54 | keine | keine | keine | keine | keine |
| `/en/warteliste/` | 200 | 54 | keine | keine | keine | keine | keine |
| `/de/presse/` | 200 | 54 | keine | keine | keine | keine | keine |
| `/en/presse/` | 200 | 54 | keine | keine | keine | keine | keine |
| `/de/impressum/` | 200 | 53 | keine | keine | keine | keine | keine |
| `/en/imprint/` | 200 | 53 | keine | keine | keine | keine | keine |
| `/de/datenschutz/` | 200 | 53 | keine | keine | keine | keine | keine |
| `/en/privacy/` | 200 | 53 | keine | keine | keine | keine | keine |
| `/de/bestaetigt/` | 200 | 57 | keine | keine | keine | keine | keine |
| `/en/confirmed/` | 200 | 57 | keine | keine | keine | keine | keine |
| `/gibt-es-nicht/` | 404 | 9 | keine | keine | keine | keine | keine |

Ergebnis: Keine Anfrage an fremde Hosts. Nichts wird im Browser gespeichert.
