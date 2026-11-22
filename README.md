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
| App | `/download/` | Hinweis „iOS, Android und Web · startet bald“ (Store-Badges erst mit echten Store-Links), Web-App, Vorschau |
| Warteliste | `/warteliste/` | Formular mit E-Mail, Rolle, Stadt, Double-Opt-in über Brevo |
| Presse & Kontakt | `/presse/` | Fact Sheet, Kontakt, Pressekit |
| Impressum, Datenschutz | `/de/impressum/`, `/en/imprint/`, `/de/datenschutz/`, `/en/privacy/` | Betreiberdaten aus `LEGAL` in `brand.ts`, Texte in `src/content/legal-de.ts` und `legal-en.ts` |
| 404 | jede unbekannte Adresse | zweisprachig (`src/app/global-not-found.tsx`) |

Einstieg `/` leitet je nach Browsersprache auf `/de/` oder `/en/`.

## Interaktive App-Vorschau

`src/components/preview/` – Klick-Demo der App im Handy-Rahmen, komplett im Browser mit lokalem State (nichts wird gespeichert oder gesendet):

- Tabs Entdecken · Events · + · Nachrichten · Profil
- Entdecken: Swipe-Stapel mit Drag-Geste (Pointer Events, Maus und Touch, LIKE/NOPE-Stempel), Buttons ✕ ↶ ♥ ☆, Tasten ← → Z; Scroll-Feed mit Doppeltipp-Like; Filter; Schalter „Für dich“ / „Neu entdecken“; Hörproben (selbst erzeugte Clips in `public/audio/`, je ~25 KB)
- Match-Screen bei bestimmten Artists → Chat; Events merken mit Erinnerungs-Hinweis, „Tickets“ zeigt einen Hinweis-Screen; simulierte Push-Banner (max. 3); Profil; Erstellen-Sheet
- Wird erst geladen, wenn sie in die Nähe des Viewports kommt; bis dahin steht ein gleich großer statischer Platzhalter (kein Einfluss auf den ersten Seitenaufbau)
- Inhalte (alle frei erfunden) in `src/content/preview-data.ts`

## Showcase-Animationen

Die App als Star der Seite, alles ohne Animations-Bibliothek: CSS plus ein kleiner Hook (`src/components/showcase/motion-scope.tsx`), der Scroll-Fortschritt, Mausposition und Fokus als CSS-Variablen setzt. Animiert werden nur `transform` und `opacity`, Stile in `src/app/showcase.css`.

| Bereich | Komponente | Inhalte austauschen |
| --- | --- | --- |
| Hero: 3D-Szene, Handy nach Fensterhöhe, Glas-Karten auf drei Ebenen | `hero-showcase.tsx`, `glass.tsx` | Texte `showcase.cards` in `src/content/de.ts`/`en.ts`, Positionen in `showcase.css` (`data-slot`) |
| Explosionsansicht: fünf aufrechte Glastafeln, nach rechts und in die Tiefe gestaffelt (feste Werte `--fx`/`--fy`/`--fz`), fächern einmal auf und heben dann eine Ebene nach der anderen hervor; Labels flach darunter, an Messpunkten ausgerichtet | `layers-scene.tsx`, `layers-controller.tsx` | Texte `showcase.space` (Labels in `layers`), Geometrie und Zeitplan in `showcase.css` |
| Probier’s selbst: interaktive Vorschau mit Hinweisen | `try-section.tsx` | Texte `showcase.try`, Höhe der Hinweislinien in `LEFT_Y`/`RIGHT_Y` |
| Die Szene in Bewegung: drei laufende Reihen mit Beispieldaten | `city-motion.tsx` | Texte `showcase.city`, Inhalte aus `content/preview-data.ts` |
| Backstage-Hero „Fünf Swipes, live“: Nachtstadt, Handy im Reisemodus, Karten werden geswipt, Zähler bis 5, „Session bestätigt“, dann nächste Stadt | `backstage-hero.tsx` | Texte und Städte `showcase.bsHero` |
| Riesiger Schriftzug im Footer | `footer-wordmark.tsx` | App-Name aus `src/lib/brand.ts` |
| App-Screens in den Handys | `screen-views.tsx` (sonst per Code-Splitting nachgeladen) | später durch echte Screens ersetzen |

- **Akzentwort:** In Überschriften markiert `*Wort*` ein kursives Serif-Wort (Instrument Serif, lokal über `next/font`), höchstens eins je Überschrift (`accent.tsx`).
- **Grundregel:** Nichts hält das Scrollen an (kein Anheften, kein Scroll-Jacking). Animationen laufen von selbst, sobald ein Bereich sichtbar ist; ein Test prüft, dass in den Showcase-Bereichen nichts sticky oder fixed ist.
- **Bewegung reduzieren:** Gerät (`prefers-reduced-motion`) oder Schalter im Footer setzen `html[data-motion="reduce"]`; dann steht alles still an der Endposition, die Schichten ausgefahren mit allen Labels, die Reihen sind wischbar. Ohne JavaScript gilt dasselbe.
- **Store-Screenshots (vorbereitet):** `pnpm screenshots:store [url]` fotografiert jede Feature-Tafel (`data-store-panel`, nicht verlinkte Seite `/de/store/`) in iPhone 6,9" (1320 × 2868) und Android (1080 × 2340) nach `docs/store-screenshots/` (nicht im Repo). Inhalte kommen später aus der echten App.
- **Screenshots:** `docs/screenshots/showcase-3/` (Hero, Die Szene in Bewegung) `docs/screenshots/showcase-6/`, `docs/screenshots/showcase-8/` und `docs/screenshots/showcase-9/` (Explosionsansicht, Backstage-Hero).

## Responsiv und mobil

- **Test:** `e2e/responsive.spec.ts` lädt jede Seite in DE und EN auf 320, 360, 390, 414, 768, 1024, 1280, 1440 und 1920 px sowie Handy quer (844 × 390) und Tablet quer (1180 × 820), scrollt einmal durch und prüft: kein horizontales Überlaufen, unter 768 px keine Touch-Ziele unter 44 × 44 px. Ausgenommen sind Links mitten im Satz (WCAG 2.5.8), die simulierte Handy-Oberfläche der Vorschau und die 3D-Szene der Explosionsansicht (dort gibt es die Liste mit Link darunter).
- **Überschriften:** `e2e/typo.spec.ts` prüft die Zeilengrenzen jetzt auch auf 320 und 360 px; unter 400 px werden einige Plakat-Überschriften etwas kleiner gesetzt.
- **Safe Areas:** `viewport-fit=cover`, Abstände über `env(safe-area-inset-*)` in Navigation, Seitenrändern (`gutter`) und Footer.
- **Mobil leichter:** keine Glas-Unschärfe unter 768 px, Hero mit drei statt sechs Karten, Formularfelder mit 16 px Schrift (kein Zoom beim Antippen).
- **Screenshots:** `docs/screenshots/responsive/`.

## Formulare mit Brevo (Free-Plan)

Zwei eigene Formulare senden direkt an Brevo, Brevo verschickt die Double-Opt-in-Mail:

- **Warteliste** (`/warteliste/` und Abschluss der Startseite): E-Mail, Rolle (`?rolle=artist` belegt vor), Stadt; dazu versteckt `SPRACHE` und `QUELLE=warteliste`
- **Backstage-Bewerbung** (`/backstage/`): Name, Künstler- oder Firmenname, E-Mail, Rolle, Stadt, Land, Links, Empfohlen von, Nachricht; dazu `SPRACHE` und `QUELLE=backstage`

Nach dem Klick in der Bestätigungsmail leitet Brevo auf `/de/bestaetigt/` bzw. `/en/confirmed/` (mit `?backstage=1` eigener Text). Beide Seiten sind `noindex` und nicht in der Sitemap.

Einrichtung Schritt für Schritt, inklusive Texte für die Bestätigungsmails: **[docs/brevo-setup.md](docs/brevo-setup.md)**. Die vier Formular-Adressen stehen in `src/lib/brand.ts` (`BREVO.waitlist.de/en`, `BREVO.backstage.de/en`). Fehlt eine, zeigt das Formular beim Absenden „Öffnet in Kürze“.

## Rechtliches

- **Betreiberdaten** nur in `LEGAL` (`src/lib/brand.ts`). Impressum, Datenschutz, Footer, Presse und strukturierte Daten lesen von dort. `scripts/check-legal.mjs` läuft vor jedem Build und bricht ab, solange in `LEGAL` noch `<<` oder `<Datum` steht. `vatId: null` ist erlaubt.
- **Rechtstexte** in `src/content/legal-de.ts` (verbindlich) und `legal-en.ts` (Übersetzung). Bei inhaltlichen Änderungen `LEGAL.lastUpdated` anpassen.
- **Datenfluss:** Die Seite lädt nichts von fremden Servern, setzt keine Cookies und speichert nichts im Browser, deshalb kein Cookie-Banner. Messung mit `pnpm datenfluss <URL>`, Ergebnis in [docs/legal/datenfluss.md](docs/legal/datenfluss.md). `e2e/legal.spec.ts` sichert das auf jeder Seite ab (einzige Ausnahme: Formularversand an Brevo nach Klick).
- **Bildnachweise** in `src/content/image-credits.ts`, im Impressum gerendert. Neues Foto in `assets/photos` immer dort eintragen (Test prüft das). Keine Fotos mit erkennbaren Gesichtern in der Vorschau, deren Profile sind erfunden.
- Screenshots der Rechtsseiten: `docs/screenshots/legal/`.

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
src/lib/brand.ts        Name, Farben, Domain, Store-Links, Brevo-Formular, Betreiberdaten (LEGAL)
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
- [ ] Store-Links, Web-App- und Bewerbungs-Link (`LINKS`); solange leer, zeigt die Seite keine Store-Badges
- [ ] Mit den Store-Links die offiziellen Badges von Apple und Google einsetzen (`src/components/site/stores.tsx`)
- [x] Vier Brevo-Formular-Adressen (`BREVO.waitlist`, `BREVO.backstage`), Einrichtung in `docs/brevo-setup.md`
- [x] Betreiberdaten (`LEGAL`): Inhaber, Anschrift, E-Mail, Telefon, Aufsichtsbehörde, Stand
- [ ] USt-IdNr. in `LEGAL.vatId` eintragen, sobald vorhanden (die Zeile im Impressum erscheint dann automatisch)
- [ ] Impressum und Datenschutz vor dem breiten Launch gegen einen Generator (eRecht24, Dr. Schwenke) oder anwaltlich prüfen lassen
- [ ] Bildmarke, eigene Fotos und echte App-Screens statt Platzhaltern
- [ ] Städte in den Texten (`src/content/*.ts`); ein Startdatum erst nennen, wenn es feststeht
