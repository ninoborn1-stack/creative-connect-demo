# Design-Konzept – Bubblegum (Arbeitstitel)

Dieses Dokument beschreibt das Erscheinungsbild der Marketing-Seite und der App-Vorschau. Die frühere Klick-Demo ist über den Git-Tag `demo-final` wiederherstellbar.

Es ist so geschrieben, dass man es ohne den Code nachbauen oder in ein anderes Tool übertragen kann, zum Beispiel Figma, Webflow, Framer, WordPress oder eine andere KI.

---

## 1. Leitidee

Die Seite sieht aus wie ein **Club- oder Label-Plakat**:
- Flächen gehen über die volle Breite.
- Kanten sind hart.
- Überschriften sind riesig, schmal und in Versalien gesetzt.
- Kleine Metadaten stehen in Schreibmaschinenschrift (Mono).
- Fotos sind dunkel und entsättigt. Beim Hover bekommen sie ihre Farbe zurück.

Die Stimmung ist nächtlich, klar und musikalisch: tiefes Egyptian Blue, Stone Blue als zweite Fläche, Scarlet Red als einziger Akzent und fast weißer Text.

Die Seite hat zwei Welten:

| Bereich | Look |
|---|---|
| **Öffentliche Seiten** (Startseite, Für Unternehmen, Pakete …) | Plakat-Look: fast keine Rundungen, volle Breite, Versal-Headlines |
| **App nach dem Login** (Dashboard, Entdecken, Finanzen …) | Ruhiges App-Design mit Seitenleiste, Karten und leichten Rundungen. Dieselben Farben, aber normale Schrift |

---

## 2. Farben

**Farbwelt aus drei Tönen:** Egyptian Blue `#03203D` · Stone Blue `#639CC5` · Scarlet Red `#EB2F33`.
Die zwei Blautöne setzen die Stimmung, Scarlet ist der Akzent. Der **Dunkelmodus ist Standard**. Die Hex-Werte sind Näherungen; im Code sind die Farben in OKLCH definiert.

### Dunkel (Standard)
| Rolle | Hex | Einsatz |
|---|---|---|
| Hintergrund | `#011730` | tiefes Egyptian Blue |
| Karte / Fläche | `#04213E` | Karten, Panels (≈ Egyptian Blue) |
| Text | `#EFF4F8` | Fließtext, Headlines |
| Text gedämpft | `#A1BBCF` | Beschreibungen, Meta (bläuliches Grau) |
| Primär (Scarlet Red) | `#EB2F33` | Buttons, Akzentwörter, Flächen |
| Linien | Stone Blue mit 20 % Deckkraft | Haarlinien, Rahmen |

### Hell
| Rolle | Hex |
|---|---|
| Hintergrund (kühles Weiß) | `#F3F7FB` |
| Text (Egyptian Blue) | `#03203D` |
| Text gedämpft | `#445B70` |
| Primär (Scarlet, etwas dunkler für Kontrast) | `#D61C26` |
| Linien | `#CEDBE5` |

### Plakatfarben (unabhängig vom Modus)
| Name | Hex | Einsatz |
|---|---|---|
| **Ink** | `#000F26` | dunkle Bildflächen, Footer, Hero-Hintergrund |
| **Bone** | `#EFF4F8` | Text auf Fotos und dunklen Flächen |
| **Signal** | `#FF3E3B` | helles Scarlet für kleine Akzente; rote Schrift auf Dunkel wird automatisch aufgehellt (Kontrast) |
| **Stone** | `#639CC5` | zweite Fläche: Brands-Laufband, helle Akzente |
| Hero-Ink | `#001630` | Grundton hinter dem Hero-Foto, blauer Schleier über dem Foto |

**Regeln**
- Scarlet ist der einzige warme Akzent. Grün und Gelb gibt es nur für Status-Hinweise wie Erfolg oder Warnung.
- Stone Blue ist die ruhige zweite Fläche (z. B. das Brands-Laufband mit Egyptian-Blue-Schrift und roten Trennern).
- In jeder Headline wird **ein Teil rot** gesetzt, zum Beispiel: „Ein Netzwerk. **Drei Wege rein.**“
- Kleine **rote Quadrate** von etwa 8 px dienen als Aufzählungszeichen vor Eyebrow-Zeilen. Es sind keine Kreise.

---

## 3. Schriften

Alle Schriften sind Google Fonts und werden selbst gehostet, also DSGVO-konform.

| Rolle | Schrift | Einstellung |
|---|---|---|
| **Plakat-Headlines** | **Archivo** (variabel) | Breite 62 % (schmal), Gewicht 850–900, VERSALIEN, Zeilenhöhe 0,78–0,86, Laufweite −1 % |
| Plakat breit (Logo) | Archivo | Breite 125 %, Gewicht 800, VERSALIEN, Zeilenhöhe 0,9–0,95 |
| **Meta / Labels / Buttons** | **Geist Mono** | 0,7 rem (≈11 px), Gewicht 500, VERSALIEN, Laufweite 0,12 em |
| Fließtext | **Inter** | 16–20 px, Zeilenhöhe ≈1,55 |
| App-Headlines | **Bricolage Grotesque** | fett, normale Schreibweise |
| Zitate | **Fraunces** (Serif) | Light, sehr groß, Laufweite −2 % |

**Größen:** Plakat-Headlines skalieren mit der Bildschirmbreite.

| Element | Größe (von–bis) |
|---|---|
| Hero-Headline | 3,4 rem → 9 rem |
| Abschnitts-Headline | 2,6 rem → 8 rem (≈ 42 px → 128 px) |
| Abschluss-Headline | 3,4 rem → 13 rem |
| Karten-Titel (Bildkacheln) | 1,6 rem → 2,8 rem |

---

## 4. Grundraster & Abstände

- **Seitenrand („Gutter“):** links und rechts 4 % der Breite, mindestens 16 px. Inhalte gehen fast bis zum Rand; es gibt keinen schmalen zentrierten Container.
- **Abstand zwischen Abschnitten:** 80 px auf dem Handy, 128 px ab Tablet.
- **Raster:** 12 Spalten auf dem Desktop. Typische Aufteilung:
  - Headline über 8 Spalten, Erklärtext über 4 Spalten rechts unten bündig;
  - oder ein 50/50-Split aus Bild und Text.
- **Haarlinien-Raster:** Kacheln stehen ohne Abstand nebeneinander und sind nur durch **1-px-Linien** getrennt (Technik: `gap: 1px` auf einer Linienfarbe als Hintergrund). Das ist das wichtigste Gestaltungsmerkmal.
- **Ecken:**
  - öffentlich fast eckig (Radius 3 px);
  - in der App 12 px;
  - die Handy-Attrappe im Entdecken-Abschnitt 44 px.
- **Nummerierung:** Jeder Abschnitt hat eine Eyebrow-Zeile im Format `■ 01 — Titel`. Die Zählung läuft durch die ganze Seite.

---

## 5. Bausteine (wiederverwendbar)

| Baustein | Aussehen |
|---|---|
| **Eyebrow** | rotes Quadrat + Mono-Versalien in gedämpfter Farbe, z. B. `■ 04 — PAKETE` |
| **Abschnittskopf** | Eyebrow → riesige Plakat-Headline (8 Spalten) → kurzer Text rechts unten (4 Spalten). Auf dem Handy untereinander |
| **Button (CTA)** | 48 px hoch, eckig, Mono-Versalien, Pfeil ↗ rechts. 4 Varianten: **Primär** rot (Hover: Signal-Rot) · **Outline** mit Rahmen (Hover: invertiert) · **Hell** Bone auf Dunkel · **Ghost** weißer Rahmen auf Foto |
| **Bildkachel** | Foto füllt die Kachel. Darüber ein Verlauf von Ink unten nach transparent oben. Text unten links: Meta-Zeile + Plakat-Titel. Die ganze Kachel ist klickbar |
| **Laufband (Marquee)** | endlos laufende Zeile in Plakat-Schrift. Trenner: `/` oder eine kleine Schallplatte (Kreis mit rotem Mittelpunkt). Hält bei Hover an |
| **FAQ** | Zeilen mit Haarlinien: `01` (Mono) · Frage (fett, groß) · rotes **+**, das sich beim Öffnen zum × dreht |
| **Seiten-Hero (Unterseiten)** | Vollbild-Foto, 78 % der Bildschirmhöhe, dunkler Verlauf. Unten links: Eyebrow → Plakat-Headline (max. 16 Zeichen breit) → Linie → Text links + Buttons rechts |
| **Zitat** | riesige Serif-Schrift (Fraunces Light) mit roten Anführungszeichen, darunter Avatar + Name + Mono-Rolle |
| **Logo** | rotes Quadrat (32 px, leicht gerundet) mit einer weißen Kaugummiblase samt Glanzpunkt + App-Name in breiter Plakat-Schrift (Platzhalter-Bildmarke) |

---

## 6. Bildsprache

- **Motive:**
  - Bühne, Konzert, Studio, Mischpult;
  - Menschen bei der Arbeit, also Musik, Kamera, Foto und Design;
  - Porträts im Hochformat.
- **Bearbeitung:**
  - Grundsätzlich **entsättigt**: Graustufen oder 25–40 % weniger Farbe.
  - Deckkraft 60–80 % auf Ink-Schwarz, damit Bone-Text darauf lesbar bleibt.
  - Hero-Foto: Graustufen, 30 % Deckkraft unter einem Ink-Verlauf.
- **Hover:** Das Bild wird farbig, voll deckend und um 5 % größer. Die Überblendung dauert 0,7 s.
- **Verläufe:** Immer von **Ink unten** nach transparent oben. Text steht darum unten.
- **Formate:**

| Einsatz | Seitenverhältnis |
|---|---|
| Artist-Porträts | 3:4 (Hochformat) |
| Pakete (Startseite) | 4:3 |
| Pakete (Für Unternehmen) | 3:4 |
| Studios | 4:3 Handy → 3:4 Tablet → 4:5 Desktop |
| „Warum dabei sein“-Kacheln | 4:5 |
| Branchen-Thumbnails | 16:9 Handy → 4:3 Desktop |
| Split-Bilder | halbe Seite, 50–80 % der Bildschirmhöhe |
| Hero / Seiten-Hero | Vollbild |

- **Platzhalter-Bilder:** Die Fotos sind Unsplash-Platzhalter unter `assets/photos/` (beim Build als AVIF/WebP ausgegeben). Zum Start werden sie durch eigene Fotos und echte App-Screens ersetzt.

---

## 7. Startseite – Abschnitt für Abschnitt

| # | Abschnitt | Aufbau |
|---|---|---|
| – | **Navigation** | Sticky, 64 px, leicht durchscheinend: Logo · Links (ab Desktop) · DE/EN · roter Button „Warteliste“ · Menü-Button mobil |
| 00 | **Hero** | Ink-Fläche mit stark abgedunkeltem Bühnenfoto. Links: Eyebrow „Die Szene, zusammengehalten.“, riesige Headline „Swipe dich durch **die Szene.**“, Lead, Buttons **Warteliste** (rot) + Für Artists (Ghost), Start-Hinweis in Mono. Rechts: „So wird {App} aussehen – probier’s aus“ + kleiner Hinweis „Vorschau mit Beispielinhalten“ und darunter die **interaktive App-Vorschau** im Handy-Rahmen. Mobil: Text oben, Handy darunter. |
| 01 | Drei Kernnutzen | Haarlinien-Raster mit großen roten Nummern: Entdecken · Events nie verpassen · Connecten & gebucht werden |
| 02 | Swipe oder Scroll | Zwei große Kacheln mit Icon (Stapel / Feed) |
| 03 | Algorithmus an oder aus | **Stone-Blue-Fläche**, Headline mit Kontur-Wort „Oder aus.“, zwei Zeilen „Für dich“ / „Neu entdecken“ |
| 04 | Für Artists | 50/50-Split: rote Fläche mit Text + Foto |
| 05 | Für Veranstalter, Studios & Unternehmen | drei Bildkacheln 4:5, entsättigt, Hover farbig |
| 06 | FAQ | Headline links (sticky), aufklappbare Fragen rechts |
| 07 | Abschluss Warteliste | Ink-Fläche: Headline + Store-Buttons („Bald verfügbar“) links, Wartelisten-Formular rechts |
| – | Footer | Ink, Claim + Store-Buttons, drei Linkspalten, App-Name über die volle Breite (zweite Hälfte als Kontur) |

## 8. Interaktive App-Vorschau

- **Rahmen:** eigene CSS-Grafik – dunkles Gehäuse, Seitentasten, Kamera-Insel, Statusleiste (9:41, Signal, Akku), Home-Indikator. Höchstens 350 px breit, mobil fast bildschirmbreit, auf niedrigen Bildschirmen an die Höhe angepasst.
- **App-Look innen:** dunkles Egyptian Blue, Karten mit 24 px Rundung, Scarlet als Akzent (Like-Button, aktive Tabs, Badges), Stone Blue für „Newcomer“ und Preise. Plakat-Schrift für Kartentitel.
- **Bedienung:** Tabs Entdecken · Events · + · Nachrichten · Profil. Swipe-Karten folgen dem Finger, kippen leicht, Stempel „LIKE“ (grün) / „NOPE“ (weiß). Buttons ✕ ↶ ♥ ☆. Feed im Instagram-Stil mit Doppeltipp-Herz. Match-Screen auf Ink mit zwei runden Porträts. Push-Banner oben in Weiß.
- **Bewegung:** nur kurze CSS-Übergänge (Karte 220 ms, Banner/Sheets 250–300 ms); bei „Bewegung reduzieren“ fast keine.

## 9. Unterseiten

Alle Unterseiten beginnen mit dem **Seiten-Hero** (Vollbild-Foto, Eyebrow, Plakat-Headline, Text + Buttons) und folgen dann dem Muster Eyebrow mit Nummer → Headline → Haarlinien-Raster.

| Seite | Aufbau |
|---|---|
| Für Artists / Veranstalter & Locations / Für Unternehmen | Seiten-Hero → Nutzen (2×2-Raster) → bei Veranstaltern Formate als Stone-Blue-Band → drei Schritte mit großen roten Ziffern → Buttons |
| App | Headline, Store-Buttons („Bald verfügbar“), Hinweis Web-App, rechts die interaktive Vorschau |
| Warteliste | Split: Formular links (E-Mail, „Ich bin …“, Stadt, Einwilligung), Foto rechts |
| Presse | Seiten-Hero → Fact Sheet und Kontakt als Haarlinien-Listen |
| Impressum / Datenschutz | Plakat-Kopf, roter Entwurfs-Balken, nummerierte Abschnitte |
| 404 | Ink-Fläche, riesige „404“ mit roter Null, Links DE/EN |

## 10. Bewegung

| Element | Verhalten |
|---|---|
| Bildkacheln | Hover: Farbe zurück, +5 % Zoom, 0,7 s |
| App-Vorschau | Drag-Geste, Ausflug 220 ms, Herz-Animation, Push-Banner |
| FAQ | „+“ dreht sich um 45° |
| **Bewegung reduzieren** | Animationen aus oder minimal, alles bleibt bedienbar |

## 11. Mobil

- Alles funktioniert ab 320 px ohne seitliches Scrollen (Tests bei 320 und 375 px).
- Hero: Headline, Text und Wartelisten-Button sofort sichtbar, das Handy folgt darunter in fast voller Breite.
- In der Vorschau blockiert der Swipe-Stapel das Seiten-Scrollen nicht (`touch-action: pan-y`), der Feed im Handy gibt am Ende an die Seite ab (`overscroll-behavior: contain`).

## 12. Kurzfassung als Prompt (für andere Tools / KI)

> Dark-mode-first Website im Stil eines Club-/Label-Plakats. Farbwelt aus drei Tönen: Egyptian Blue #03203D (Hintergrund, Ink #000F26), Stone Blue #639CC5 (zweite Fläche) und Scarlet Red #EB2F33 (einziger Akzent, hell #FF3E3B für Hover), Text fast weiß #EFF4F8; Hellmodus kühles Weiß #F3F7FB mit Egyptian-Blue-Text. Headlines: Archivo, sehr schmal (wdth 62), Gewicht 900, VERSALIEN, Zeilenhöhe 0,8, riesig (bis 8–13 rem), ein Teil jeder Headline rot. Labels und Buttons: Geist Mono, 11 px, Versalien, weite Laufweite. Fließtext: Inter. Volle Breite mit 4vw Rand, harte Kanten (Radius 3 px), Kacheln ohne Abstand mit 1-px-Haarlinien getrennt. Abschnitte nummeriert („■ 01 — Titel“ mit rotem Quadrat). Fotos entsättigt und abgedunkelt auf Schwarz, Verlauf von unten, Text unten links; bei Hover farbig und leicht gezoomt. Startseite: Hero mit Claim „Swipe dich durch die Szene.“, rotem Wartelisten-Button und daneben einer interaktiven App-Vorschau im Handy-Rahmen (Swipe-Stapel, Feed, Events, Chat); Stone-Blue-Fläche für „Algorithmus an oder aus“, rote Split-Fläche für Artists, schwarzer Abschluss mit Wartelisten-Formular und Footer mit Wortmarke über die volle Breite.
