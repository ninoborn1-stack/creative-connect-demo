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
| Start | `/` | Hero mit Claim, Warteliste und **interaktiver App-Vorschau**; drei Kernnutzen, Swipe oder Scroll, Zugangsstufen, Algorithmus an/aus, Für Artists, Für Veranstalter/Studios/Unternehmen, FAQ, Warteliste |
| Für Artists | `/artists/` | Nutzen, Matches, Weg in die App |
| Veranstalter & Locations | `/veranstalter/` | Events im Stapel, Erinnerungen, Tickets über den eigenen Ticketanbieter, Räume vermieten |
| Für Unternehmen | `/unternehmen/` | Artists finden, Musik lizenzieren, Pakete, Studios |
| Backstage | `/backstage/` | Privater Bereich auf Einladung, So funktioniert es, Bewerbungsformular |
| Bestätigt | `/de/bestaetigt/`, `/en/confirmed/` | Danke-Seite nach der Double-Opt-in-Bestätigung (noindex) |
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

## Formulare mit Brevo (Free-Plan)

Zwei eigene Formulare senden direkt an Brevo, Brevo verschickt die Double-Opt-in-Mail:

- **Warteliste** (`/warteliste/` und Abschluss der Startseite): E-Mail, Rolle (`?rolle=artist` belegt vor), Stadt; dazu versteckt `SPRACHE` und `QUELLE=warteliste`
- **Backstage-Bewerbung** (`/backstage/`): Name, Künstler- oder Firmenname, E-Mail, Rolle, Stadt, Land, Links, Empfohlen von, Nachricht; dazu `SPRACHE` und `QUELLE=backstage`

Nach dem Klick in der Bestätigungsmail leitet Brevo auf `/de/bestaetigt/` bzw. `/en/confirmed/` (mit `?backstage=1` eigener Text). Beide Seiten sind `noindex` und nicht in der Sitemap.

Einrichtung Schritt für Schritt, inklusive Texte für die Bestätigungsmails: **[docs/brevo-setup.md](docs/brevo-setup.md)**. Danach nur die vier Formular-Adressen in `src/lib/brand.ts` (`BREVO.waitlist.de/en`, `BREVO.backstage.de/en`) eintragen. Solange eine fehlt, zeigt das Formular beim Absenden „Öffnet in Kürze“.

## Zugangsstufen

| Stufe | Für wen | Zugang |
| --- | --- | --- |
| Offen | alle | sofort, kostenlos |
| Geprüft | Artists, Kreative, Studios, Venues, Veranstalter:innen | Bewerbung, kurze Prüfung (zum Start über die Warteliste mit Rolle) |
| Backstage | etablierte Artists, Produzent:innen, Studios, Venues | Einladung oder Bewerbung mit Empfehlung, Seite `/backstage/` |

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
- [ ] Vier Brevo-Formular-Adressen (`BREVO.waitlist`, `BREVO.backstage`), Einrichtung in `docs/brevo-setup.md`
- [ ] Firmendaten ThreeApesGroup: Rechtsform, Anschrift, Vertretung, Register, USt-ID, Telefon (`COMPANY`; E-Mail ist `nino@threeapesgroup.com`)
- [ ] Impressum und Datenschutz durch eine Rechtsberatung prüfen lassen (Entwurfs-Hinweis entfernen)
- [ ] Bildmarke, eigene Fotos und echte App-Screens statt Platzhaltern
- [ ] Startjahr und Städte in den Texten (`src/content/*.ts`)
