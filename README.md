# Bubblegum – Marketing-Seite

Landingpage für die App **Bubblegum** (Arbeitstitel, zentral in `src/lib/brand.ts` austauschbar): Artists, Events, neue Musik und Studios in einer App – swipen oder scrollen, merken, erinnert werden, hingehen. Die App selbst lebt im neuen Monorepo; diese Seite ist rein statisch.

Die frühere Klick-Demo „Creative Connect“ ist über den Git-Tag **`demo-final`** jederzeit wiederherstellbar:

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

Dann http://localhost:3000/de/ öffnen. `pnpm dev` braucht einmal `pnpm images` (oder einen Build), damit die Bilder unter `public/img/` existieren.

```bash
pnpm build
```

erzeugt den statischen Export in `out/` (vorher automatisch: Bilder als AVIF/WebP, nachher: Sprachweiche `index.html`, `404.html`). Lokal ansehen mit `pnpm serve` → http://localhost:4200/.

```bash
pnpm test
```

prüft alle Seiten in beiden Sprachen gegen `out/` (Desktop und 375 px): Status, Konsole, kein horizontales Scrollen, Hero bei 320 × 640, Sprachwechsel.

## Seiten (jeweils `/de/…` und `/en/…`)

| Seite | Pfad | Inhalt |
|---|---|---|
| Start | `/` | Hero, Claim, App-Vorschau (Swipe + Feed als animierte Handy-Mockups), drei Kernnutzen, Event-Erinnerungen, Musik entdecken, Für Artists, Für Veranstalter/Locations/Unternehmen, FAQ, Download |
| Für Artists | `/artists/` | Nutzen, Matches, Weg in die App (Bewerbung führt in die App) |
| Veranstalter & Locations | `/veranstalter/` | Events im Stapel, Erinnerungen, Tickets über den eigenen Ticketanbieter, Räume vermieten |
| Für Unternehmen | `/unternehmen/` | Artists finden, Musik lizenzieren, Pakete, Studios |
| Download | `/download/` | App-Store-/Play-Store-Links, Web-App |
| Warteliste | `/warteliste/` | Newsletter mit Double-Opt-in über Brevo |
| Presse & Kontakt | `/presse/` | Fact Sheet, Kontakt, Pressekit |
| Impressum, Datenschutz | `/impressum/`, `/datenschutz/` | Struktur mit Platzhaltern (ThreeApesGroup) |

Einstieg `/` leitet je nach Browsersprache auf `/de/` oder `/en/`. Keine Cookies, keine Reichweitenmessung – deshalb kein Cookie-Banner. Erst wenn `ANALYTICS` in `brand.ts` gesetzt wird, ist eine Einwilligung nötig.

## Aufbau

```
assets/photos/        Bildquellen (JPG) – Ausgabe per scripts/images.mjs nach public/img (AVIF/WebP)
src/lib/brand.ts      Name, Farben, Domain, Store-Links, Brevo-Formular, Firmendaten
src/lib/i18n.ts       Sprachen, Seiten-Slugs, href(lang, slug)
src/content/de.ts     alle deutschen Texte (en.ts gleiche Struktur)
src/app/[lang]/       Layout (Header, Footer, Schriften) und alle Seiten
src/components/site/  Hero, Header, Footer, Handy-Mockups, Bausteine, Formular, Rechtsseiten
scripts/              images.mjs, postbuild.mjs, serve.mjs
docs/                 Design-Konzept, Hero-Konzept, Konventionen
```

Konventionen: `docs/konventionen.md`. Design: `docs/design-konzept.md` (Egyptian Blue `#03203D`, Stone Blue `#639CC5`, Scarlet `#EB2F33`, Plakat-Look).

## Deployment

Statischer Export – läuft überall, wo man Dateien hochladen kann.

- **GitHub Pages:** `.github/workflows/pages.yml` baut bei Push auf `master`/`main` mit `BASE_PATH=/<repo>` und `SITE_URL=https://<owner>.github.io/<repo>`.
- **Cloudflare Pages (Free, kommerzielle Nutzung erlaubt):** Build-Befehl `pnpm build`, Ausgabeordner `out`, Umgebungsvariable `SITE_URL=https://<domain>`; `BASE_PATH` leer lassen.

Umgebungsvariablen beim Build:

| Variable | Wofür | Beispiel |
|---|---|---|
| `BASE_PATH` | Unterordner, falls die Seite nicht im Root liegt | `/creative-connect-demo` |
| `SITE_URL` | absolute Adresse für canonical, hreflang, Open Graph | `https://bubblegum.app` |

## Offene Platzhalter vor dem Livegang

Alle mit `PLATZHALTER` markiert in `src/lib/brand.ts`:

- [ ] App-Name final (`APP_NAME`)
- [ ] Domain (`SITE_URL`, bzw. Build-Variable)
- [ ] App-Store- und Play-Store-Links, Web-App- und Bewerbungs-Link (`LINKS`)
- [ ] Offizielle Store-Badges von Apple und Google statt der eigenen Buttons (`src/components/site/stores.tsx`)
- [ ] Brevo-Formular-Adresse (`NEWSLETTER.brevoFormAction`) – bis dahin ist das Formular gesperrt und zeigt einen Hinweis
- [ ] Firmendaten ThreeApesGroup: Rechtsform, Anschrift, Vertretung, Register, USt-ID, E-Mail, Presse-Mail, Telefon (`COMPANY`)
- [ ] Impressum und Datenschutzerklärung durch eine Rechtsberatung prüfen lassen (Entwurfs-Hinweis auf den Seiten entfernen)
- [ ] Bildmarke (Logo) und Favicon
- [ ] Eigene Fotos und echte App-Screens statt Unsplash-Platzhaltern und Mockups
- [ ] Startjahr und Städte in den Texten (`src/content/*.ts`)
