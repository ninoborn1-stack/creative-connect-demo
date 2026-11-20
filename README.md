# Bubblegum – Marketing-Seite

Landing- und Wartelisten-Seite für **Bubblegum** (Arbeitstitel, zentral in `src/lib/brand.ts` austauschbar): die Community-App für Musik- und Kreativszene – Instagram trifft Tinder. Artists, Tracks, Events, Studios und Pakete im Swipe-Stapel oder Feed entdecken, Events merken und erinnert werden, Matches unter Artists, Algorithmus abschaltbar. Die App selbst lebt im Monorepo; diese Seite ist rein statisch (Deutsch und Englisch, kein Backend).

Die frühere Klick-Demo „Creative Connect“ ist über den Git-Tag **`demo-final`** wiederherstellbar:

```bash
git switch -c demo-wiederherstellen demo-final
```

## Starten

```bash
pnpm install
```

```bash
pnpm dev
```

Dann http://localhost:3000/de/ öffnen (vorher einmal `pnpm images`, damit `public/img/` existiert).

```bash
pnpm build:pages
```

erzeugt den statischen Export in `out/` – vorher automatisch die Bilder als AVIF/WebP, danach die Sprachweiche `index.html`. Lokal ansehen: `pnpm serve` → http://localhost:4200/.

```bash
pnpm test:pages
```

Playwright gegen `out/` (Desktop und 375 px). `e2e/typo.spec.ts` prüft auf allen Seiten in beiden Sprachen, dass keine Gedankenstriche vorkommen, Überschriften bei 375, 768, 1280 und 1440 px höchstens 2 bis 3 Zeilen haben und nichts überläuft. Außerdem: alle Seiten in beiden Sprachen (Status, Konsole, kein seitliches Scrollen), Sprachwechsel, 404, SEO-Dateien, Warteliste, Store-Buttons und die interaktive Vorschau (Swipe per Maus und Button, Rückgängig, Match → Chat, Nachricht senden, Feed-Doppeltipp, Filter, Algorithmus-Schalter, Event merken, Zurücksetzen).

Weitere Skripte: `pnpm lint`, `pnpm typecheck`, `pnpm check:dashes` (keine Gedankenstriche in `src/`, `public/` und `out/`, läuft auch im Deploy), `pnpm images` (Bilder neu erzeugen), `pnpm brand-assets` (Icons, Favicon und Social-Bilder nach Namens-/Farbänderung neu erzeugen).

## Seiten (jeweils `/de/…` und `/en/…`)

| Seite | Pfad | Inhalt |
|---|---|---|
| Start | `/` | Hero mit Claim, Warteliste und **interaktiver App-Vorschau**; drei Kernnutzen, Swipe oder Scroll, Algorithmus an/aus, Für Artists, Für Veranstalter/Studios/Unternehmen, FAQ, Warteliste |
| Für Artists | `/artists/` | Nutzen, Matches, Weg in die App |
| Veranstalter & Locations | `/veranstalter/` | Events im Stapel, Erinnerungen, Tickets über den eigenen Ticketanbieter, Räume vermieten |
| Für Unternehmen | `/unternehmen/` | Artists finden, Musik lizenzieren, Pakete, Studios |
| App | `/download/` | Store-Buttons (bis zum Start „Bald verfügbar“ → Warteliste), Web-App, Vorschau |
| Warteliste | `/warteliste/` | Formular mit E-Mail, Rolle, Stadt, Double-Opt-in über Brevo |
| Presse & Kontakt | `/presse/` | Fact Sheet, Kontakt, Pressekit |
| Impressum, Datenschutz | `/impressum/`, `/datenschutz/` | aus `brand.ts`, Platzhalter markiert |
| 404 | jede unbekannte Adresse | zweisprachig (`src/app/global-not-found.tsx`) |

Einstieg `/` leitet je nach Browsersprache auf `/de/` oder `/en/`.

## Interaktive App-Vorschau

`src/components/preview/` – Klick-Demo der App im Handy-Rahmen, komplett im Browser mit lokalem State (nichts wird gespeichert oder gesendet):

- Tabs Entdecken · Events · + · Nachrichten · Profil
- Entdecken: Swipe-Stapel mit Drag-Geste (Pointer Events, Maus und Touch, LIKE/NOPE-Stempel), Buttons ✕ ↶ ♥ ☆, Tasten ← → Z; Scroll-Feed mit Doppeltipp-Like; Filter; Schalter „Für dich“ / „Neu entdecken“; Hörproben (selbst erzeugte Clips in `public/audio/`, je ~25 KB)
- Match-Screen bei bestimmten Artists → Chat; Events merken mit Erinnerungs-Hinweis, „Tickets“ zeigt einen Hinweis-Screen; simulierte Push-Banner (max. 3); Profil; Erstellen-Sheet
- Wird erst geladen, wenn sie in die Nähe des Viewports kommt; bis dahin steht ein gleich großer statischer Platzhalter (kein Einfluss auf den ersten Seitenaufbau)
- Inhalte (alle frei erfunden) in `src/content/preview-data.ts`

## Warteliste mit Brevo (Free-Plan)

Das Formular ist selbst gestaltet und sendet per `fetch` (`mode: "no-cors"`) an das Brevo-Anmeldeformular – kein iframe, kein eigener Server. Brevo verschickt die Bestätigungsmail (Double-Opt-in). Weil die Antwort bei `no-cors` nicht lesbar ist, zeigt die Seite nach dem Absenden „Bitte bestätige deine E-Mail“; nur Netzwerkfehler werden als Fehler angezeigt. Solange keine Brevo-Adresse eingetragen ist, zeigt das Absenden „Die Warteliste öffnet in Kürze“.

Einrichten:

1. Kostenloses Konto auf brevo.com anlegen (Absender-Domain bzw. -Adresse verifizieren).
2. **Kontakte → Einstellungen → Kontaktattribute**: diese Attribute anlegen
   - `ROLLE` – Typ *Text* (Werte: `fan`, `artist`, `venue`, `organizer`, `business`)
   - `STADT` – Typ *Text*
   - `SPRACHE` – Typ *Text* (`de` / `en`)
3. **Kontakte → Listen**: Liste „Warteliste“ anlegen.
4. **Kontakte → Formulare → Anmeldeformular erstellen**: Liste „Warteliste“ wählen, Felder E-Mail, ROLLE, STADT, SPRACHE hinzufügen, **Double-Opt-in** aktivieren (Bestätigungsmail und Weiterleitungsseite einstellen).
5. Unter **Teilen → HTML-Code einbetten** die Adresse aus `<form … action="https://….sibforms.com/serve/…">` kopieren.
6. In `src/lib/brand.ts` bei `WAITLIST.waitlistFormUrl` eintragen. Die Feldnamen in `WAITLIST.fields` müssen den Attributnamen entsprechen; das Honeypot-Feld heißt bei Brevo `email_address_check`.
7. Testen: `pnpm build:pages && pnpm serve`, eigene Adresse eintragen → Bestätigungsmail kommt → Kontakt erscheint in Brevo mit Rolle, Stadt und Sprache.

## SEO und Teilen

Pro Seite und Sprache Title, Description, Canonical, `hreflang` (de, en, x-default), Open-Graph- und Twitter-Karte (`public/og/og-de.png`, `og-en.png`), strukturierte Daten (`Organization`, `MobileApplication` mit Verfügbarkeit „PreOrder“), `sitemap.xml`, `robots.txt`, Web-Manifest und Icons (`public/icons/`). Alle absoluten URLs bauen auf `SITE_URL` auf.

## Deployment

Statischer Export – läuft auf jedem Static-Host.

| Variable | Wofür | GitHub Pages | Eigene Domain |
|---|---|---|---|
| `PAGES_BASE_PATH` | Unterordner der Seite | `/<repo>` | leer lassen |
| `SITE_URL` | absolute Adresse (canonical, hreflang, OG, Sitemap) | `https://<owner>.github.io/<repo>` | `https://<domain>` |

- **GitHub Pages:** `.github/workflows/pages.yml` baut bei Push auf `master`/`main` mit beiden Variablen.
- **Cloudflare Pages (Free, kommerzielle Nutzung erlaubt):** Build-Befehl `pnpm build:pages`, Ausgabeordner `out`, `SITE_URL` setzen, `PAGES_BASE_PATH` leer.

Keine Cookies, keine Analyse, keine externen Dienste beim Seitenaufruf → kein Cookie-Banner nötig (dokumentiert in `brand.ts` bei `ANALYTICS`). Das Wartelisten-Formular spricht Brevo erst beim Absenden an.

## Aufbau

```
assets/photos/          Bildquellen (JPG) → public/img (AVIF/WebP, nicht versioniert)
public/audio/           Hörproben der Vorschau (selbst erzeugt, lizenzfrei)
public/icons, public/og Icons und Social-Bilder (pnpm brand-assets)
src/lib/brand.ts        Name, Farben, Domain, Store-Links, Brevo-Formular, Firmendaten
src/lib/i18n.ts         Sprachen, Seiten-Slugs, href(lang, slug)
src/content/de.ts, en.ts      alle Seitentexte
src/content/preview-data.ts   Inhalte der App-Vorschau
src/app/[lang]/         Layout und Seiten; src/app/sitemap.ts, robots.ts, manifest.ts, global-not-found.tsx
src/components/site/    Header, Footer, Bausteine, Fotos, Store-Buttons, Wartelisten-Formular, Rechtsseiten
src/components/preview/ interaktive App-Vorschau (Rahmen, Platzhalter, Loader, App)
scripts/                images.mjs, brand-assets.mjs, postbuild.mjs, serve.mjs
docs/                   Design-Konzept, Konventionen
```

## Offene Platzhalter vor dem Livegang

Alle mit `PLATZHALTER` markiert in `src/lib/brand.ts`:

- [ ] App-Name final (`APP_NAME`) – danach `pnpm brand-assets`
- [ ] Domain (`SITE_URL` bzw. Build-Variable)
- [ ] Store-Links, Web-App- und Bewerbungs-Link (`LINKS`) – leer = „Bald verfügbar“ → Warteliste
- [ ] Offizielle Store-Badges von Apple und Google statt der eigenen Buttons (`src/components/site/stores.tsx`)
- [ ] Brevo-Formular-Adresse (`WAITLIST.waitlistFormUrl`) und Attribute in Brevo
- [ ] Firmendaten ThreeApesGroup: Rechtsform, Anschrift, Vertretung, Register, USt-ID, E-Mail, Presse-Mail, Telefon (`COMPANY`)
- [ ] Impressum und Datenschutz durch eine Rechtsberatung prüfen lassen (Entwurfs-Hinweis entfernen)
- [ ] Bildmarke, eigene Fotos und echte App-Screens statt Platzhaltern
- [ ] Startjahr und Städte in den Texten (`src/content/*.ts`)
