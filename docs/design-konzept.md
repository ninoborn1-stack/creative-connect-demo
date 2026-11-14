# Design-Konzept – Creative Connect

Dieses Dokument beschreibt das komplette Erscheinungsbild der Seite. Es ist so geschrieben, dass man es ohne den Code nachbauen oder in ein anderes Tool übertragen kann, zum Beispiel Figma, Webflow, Framer, WordPress oder eine andere KI.

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
| **Signal** | `#FF3E3B` | helles Scarlet: Hover der Buttons, kleine Quadrate, „Beliebt“-Badge, letzter Buchstabe im Hero |
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
| Plakat breit (Logo, „CREATIVE“ im Hero) | Archivo | Breite 125 %, Gewicht 800, VERSALIEN, Zeilenhöhe 0,9–0,95 |
| **Meta / Labels / Buttons** | **Geist Mono** | 0,7 rem (≈11 px), Gewicht 500, VERSALIEN, Laufweite 0,12 em |
| Fließtext | **Inter** | 16–20 px, Zeilenhöhe ≈1,55 |
| App-Headlines | **Bricolage Grotesque** | fett, normale Schreibweise |
| Zitate | **Fraunces** (Serif) | Light, sehr groß, Laufweite −2 % |

**Größen:** Plakat-Headlines skalieren mit der Bildschirmbreite.

| Element | Größe (von–bis) |
|---|---|
| Hero-Wort „CONNECT“ | 26 % der Breite, höchstens 40 % der Höhe |
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
| **Logo** | rotes Quadrat (32 px, leicht gerundet) mit einem weißen „C“ und einem Punkt + „CREATIVE CONNECT“ in breiter Plakat-Schrift |

---

## 6. Bildsprache

- **Motive:**
  - Bühne, Konzert, Studio, Mischpult;
  - Menschen bei der Arbeit, also Musik, Kamera, Foto und Design;
  - Porträts im Hochformat.
- **Bearbeitung:**
  - Grundsätzlich **entsättigt**: Graustufen oder 25–40 % weniger Farbe.
  - Deckkraft 60–80 % auf Ink-Schwarz, damit Bone-Text darauf lesbar bleibt.
  - Hero-Foto: Sättigung 85 %, Kontrast 108 %, leicht rötlicher Farbschleier.
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

- **Demo-Bilder:** Die Fotos sind Unsplash-Platzhalter, die lokal unter `public/stock/` liegen. Für den Livebetrieb werden sie durch eigene Fotos aus Nestos Netzwerk ersetzt.

---

## 7. Startseite – Abschnitt für Abschnitt

### Navigation (oben, fixiert)
- Höhe 64 px, links und rechts der Gutter.
- Inhalt: Logo · Links (erst ab Desktop sichtbar) · Hell/Dunkel-Schalter · Button „Anmelden“ (Outline) · Menü-Button auf dem Handy.
- Über dem Hero-Foto ist die Navigation transparent mit weißem Text.

### 00 · Hero – „DJ-Pult-Intro“
Vollbild und dunkel. Der Ablauf ist ausführlich in `docs/hero-konzept.md` beschrieben.

1. **Intro (≈3 s):**
   - Zwei Plattenteller und ein Mixer zeichnen sich als Linien (Bone, mit roten Akzenten).
   - Das Bühnenfoto erscheint *in der Silhouette des Pults*, und die Teller drehen an.
   - Dann zoomt das Bild durch den Mixer ins Vollbild.
2. **Aufbau (Vollbild):**
   - **Oben:** links `■ FÜR MARKEN · AGENTUREN · GAMING · LABELS`, rechts `CC—001 / PRODUKTION & LICENSING` (Mono).
   - **Mitte/unten:** „CREATIVE“ als Kontur-Schrift (breit, nur Umriss), daneben eine rote Linie bis zum Rand. Darunter **„CONNECT“** riesig und schmal über die ganze Breite; das letzte „T“ ist Signal-Rot. Die Buchstaben steigen einzeln auf.
   - **Fuß:** links die fette Zeile „Nestos Netzwerk. Für eure Produktion.“ mit einem kurzen Text darunter. Rechts drei Buttons: **Paket buchen** (rot) · Artist anfragen · Als Artist anbieten (Ghost).
   - **Leiste ganz unten:** Haarlinie, Mono-Text, pulsierender roter Punkt mit Phase · „X Artists · Y Brands“ · „Z Pakete ab sofort“ · „Scrollen ↓“.
3. **Beim Scrollen:**
   - Der Text zieht nach oben weg, und das Bild verkleinert sich leicht (auf 88 %).
   - „WILLKOMMEN IM / NETZWERK.“ erscheint groß.
   - Das Foto bekommt einen Rahmen mit Abstand zum Rand, dann übernimmt die Seite.
4. **Ohne Animation** (Einstellung „Bewegung reduzieren“): Der Hero erscheint sofort im fertigen Zustand.

### 01 · Statement
- Nur Typografie auf dem Hintergrund, mit viel Luft.
- Headline: „EIN NETZWERK. **DREI WEGE REIN.**“, bis zu 10,5 rem groß.
- Darunter ein Satz in gedämpfter Farbe.

### Brands-Laufband
- **Stone-Blue-Vollfläche** über die volle Breite.
- Darauf laufen die Firmennamen endlos in großer Plakat-Schrift in Egyptian Blue, getrennt durch ein rotes „/“.

### 02 · Entdecken (App zum Ausprobieren)
- **Ink-Schwarze Fläche**, 50/50-Split.
  - **Links:**
    - Headline „WISCHEN. MERKEN. **BUCHEN.**“;
    - Text;
    - drei Schritte im Haarlinien-Raster (→ Rechts wischen · ← Links wischen · ♥ Gemerkt);
    - Button in Bone.
  - **Rechts:** eine **Handy-Attrappe** (360 × 700 px, dicker grauer Rahmen, Notch) mit dem echten, wischbaren Kartenstapel.

### 03 · So geht's – „Wähl deinen Weg.“
- **Drei Bildstreifen** nebeneinander über 82 % der Bildschirmhöhe: Paket buchen · Artist anfragen · Als Artist anbieten.
- Desktop:
  - Der aktive Streifen ist 2,6-mal so breit wie die anderen und zeigt Text und einen Signal-roten Button.
  - Die anderen Streifen sind schmal und zeigen nur Nummer und Titel.
  - Fährt man mit der Maus über einen Streifen, klappt er auf (0,7 s, weiche Kurve).
- Handy: Die Streifen stehen untereinander, sind mindestens 352 px hoch und immer offen.

### 04 · Pakete – „Fertig geschnürt.“
- **4 Karten** im Haarlinien-Raster, nebeneinander auf dem Desktop.
- Jede Karte:
  - Foto im Format 4:3, zu 40 % entsättigt, bei Bedarf mit rotem „BELIEBT“-Badge;
  - Plakat-Titel;
  - „AB 1.490 €“ in Rot (Mono);
  - drei Leistungen mit roten Häkchen.
- Handy: **Wisch-Karussell**. Jede Karte ist 82 % breit und rastet ein; darunter steht „← Wischen für mehr →“.

### 05 · Musik & Stock – „Reinhören. Lizenzieren.“
- Drei Audio-Player im Haarlinien-Raster. Jeder zeigt Titel, Artist · Typ · Dauer und eine animierte Wellenform.

### 06 · Studios & Locations – „Der Raum dazu.“
- Drei Bildkacheln im Hochformat, auf dem Desktop nebeneinander.
- Unten in jeder Kachel: Typ · Stadt (Mono), Name (Plakat) und „AB 45 € / STD“ in Signal-Rot.

### 07 · Artists – „Direkt anfragen.“
- **6 Porträts** im Format 3:4 und in Graustufen, ohne Abstand. Spalten: 2 auf dem Handy, 3 auf dem Tablet, 6 auf dem Desktop.
- Unten in jeder Kachel: Gewerk · Stadt und der Name.
- Nesto steht auf Platz 3.

### 08 · Referenz
- Ein einzelnes großes Kundenzitat in Serif-Schrift mit roten Anführungszeichen, darunter Avatar und Name.

### 09 · Für Artists – Split
- Links ein Foto über die halbe Seite.
- Rechts eine **rote Vollfläche**:
  - Headline „ZEIG, WAS DU KANNST.“;
  - Text;
  - Buttons in Bone und Ghost.

### 10 · FAQ – „Kurz gefragt.“
- Links die Headline. Sie bleibt beim Scrollen stehen (sticky).
- Rechts 4 aufklappbare Fragen.

### Abschluss-CTA
- Riesige Headline „DEIN NÄCHSTES PROJEKT **BEGINNT HIER.**“, bis zu 13 rem groß.
- Darunter eine Linie und drei Buttons.

### Footer
- **Ink-Schwarz**.
  - **Links:** Claim und Buttons.
  - **Rechts:** 3 Linkspalten, Überschriften in Mono.
- Darunter **„CREATIVE CONNECT“ über die gesamte Breite**, etwa 13 % der Bildschirmbreite hoch, „Connect“ nur als Kontur.
- Ganz unten eine Haarlinie und eine Mono-Zeile mit dem Hinweis „Demo – alle Inhalte fiktiv“.

---

## 8. Unterseiten (öffentlich)

Alle Unterseiten beginnen mit dem **Seiten-Hero**: Vollbild-Foto, Eyebrow, Plakat-Headline und Buttons. Danach folgen Abschnitte nach demselben Muster (Eyebrow mit Nummer → Headline → Inhalt im Haarlinien-Raster).

| Seite | Aufbau |
|---|---|
| **Für Unternehmen** | Seiten-Hero → **Pakete** als 4 große Hochformat-Bildkacheln → **Artists** als 4 Porträts → **Branchen**-Raster (6 Kacheln mit Icon) → **Preise**: zwei große Zahlen („ab 1.490 €“ · „+10 %“) → **Kontakt**-Split (links dunkles Foto mit Gründer-Info, rechts Formular) |
| **Für Kreative** | Seiten-Hero → **Laufband** mit den Gewerken → „Gefunden werden.“: 3 Bildkacheln 4:5 mit großem Titel → „Zwei Wege rein.“: Split (Selbst bewerben / Über Nestos Netzwerk) → **Community**-Split (dunkel, Text + Foto) → FAQ |
| **Pakete** | Seiten-Hero → jedes Paket als **50/50-Split**: Foto über die halbe Seite + Text mit Paketnummer, Lieferzeit, Plakat-Name, Leistungsliste und großem roten Preis; die Seiten wechseln nicht → „Drei Schritte.“ in 3 Spalten |
| **Branchen** | Seiten-Hero → die Schwerpunkt-Branche (Gaming) als großer dunkler Split mit Foto → die übrigen Branchen als **Plakat-Zeilen**: kleines Thumbnail, riesiger Name, Text und Pfeil; bei Hover wird der Name rot → rote Vollfläche „Eure Branche ist nicht dabei?“ |
| **Branche (Detail)** | Seiten-Hero → typische Bedarfe (5 nummerierte Kacheln) → bei Gaming: Leistungen auf dunkler Fläche, Lizenzmodelle, Beispiel-Crew als Split mit Preisliste und Gesamtsumme → passende Talente (Karten) → Werke aus dem Katalog → Unternehmen und Ausschreibungen |
| **Verzeichnis** | Plakat-Kopf ohne Foto („KREATIVE ENTDECKEN“) → Suchleiste über die volle Breite zwischen zwei Linien → Profilkarten ohne Abstand (1/2/3/4 Spalten) |
| **Bewerben** | Dunkler Plakat-Kopf „Werde Teil von Nestos Netzwerk.“ mit 4 Vorteilen im Haarlinien-Raster → Formular-Assistent in Schritten, daneben eine Spalte mit Hinweisen |
| **Login / Registrieren / Warteliste** | Split: links eine dunkle Fläche mit großem „LOGIN.“ und Demo-Zugängen als nummerierte Liste, rechts das Formular |
| **Impressum / Datenschutz / AGB / KI-Hinweis** | Plakat-Kopf ohne Bild (riesiger Titel, „Stand:“ in Mono) → **Signal-roter Hinweisbalken** über die volle Breite → Fließtext mit einer Lesebreite von höchstens 72 Zeichen |

---

## 9. App-Bereich (nach dem Login)

Dieser Bereich ist bewusst ruhiger, denn hier wird gearbeitet und nicht inszeniert.

- **Layout:**
  - Links eine **Seitenleiste** (256 px, fixiert) mit dem Logo und Navigationsgruppen: Haupt · Community · Admin · „Bald verfügbar“.
  - Oben eine **Kopfleiste** (56 px), leicht durchscheinend mit Unschärfe.
  - Auf dem Handy wird die Seitenleiste zum Menü.
- **Seitenkopf:** Titel (24–30 px, fett, Bricolage Grotesque) + kurze Beschreibung, Aktions-Buttons rechts.
- **Inhalt:**
  - Karten mit 12 px Rundung;
  - Raster mit 1 Spalte auf dem Handy, 2 auf dem Tablet und 3 auf dem Desktop;
  - Tabellen scrollen auf dem Handy seitlich.
- **Komponenten:**
  - Buttons, Formulare, Dialoge und Tabs von shadcn/ui;
  - Icons von Lucide (dünne Linien);
  - Hinweise als Toasts unten.
- **Entdecken (App):** Kartenstapel im Tinder-Stil mit Artists, **Events mit Tickets**, Musik & Stock, Paketen und Studios. Rechts wischen merkt, links wischen überspringt. Event-Karten haben einen roten Button „Ticket kaufen“, der direkt zum Ticketkauf auf der Event-Seite führt (Anzahl wählen, Summe mit Ticketgebühr, kaufen, Ticket-Code erscheint). Auf dem Desktop gibt es zusätzlich Tastatursteuerung, außerdem eine Feed-Ansicht.
- **Leere Listen** zeigen immer einen freundlichen Leer-Zustand mit Icon und Button.

---

## 10. Bewegung

| Element | Verhalten |
|---|---|
| Scrollen | Weiches Scrollen (Lenis) auf der Startseite |
| Hero | DJ-Pult-Intro + Scroll-Übergang (GSAP) |
| Bildkacheln | Hover: Farbe zurück, +5 % Zoom, 0,7 s |
| Bildstreifen „So geht's“ | klappen bei Hover auf, 0,7 s |
| Laufbänder | Brands 60 s pro Durchlauf, Gewerke ≈40 s; halten bei Hover an |
| FAQ | „+“ dreht sich um 45° |
| Status-Punkt | pulsiert alle 2 s |
| **Bewegung reduzieren** | Alle Animationen sind aus, die Inhalte sind sofort sichtbar |

---

## 11. Mobil

- Alles funktioniert **ab 320 px Breite** ohne seitliches Scrollen. Getestet ist das bei 320 × 640 und 375 × 667.
- Die Navigation wird zum Menü-Button mit einer Ausklapp-Leiste.
- Der Hero bekommt mehr Abstand unten. Die Buttons stehen untereinander und sind 44 px hoch. Auf sehr kleinen Handys fällt der Beschreibungstext weg.
- Die Leiste unten zeigt nur noch die Phase.
- Splits stehen untereinander, Bild oben.
- Pakete werden zum Wisch-Karussell, Artists zum 2er-Raster.
- Eyebrows sind auf dem Handy kürzer (zum Beispiel „Für Unternehmen“ statt der ganzen Liste).

---

## 12. Kurzfassung als Prompt (für andere Tools / KI)

> Dark-mode-first Website im Stil eines Club-/Label-Plakats. Farbwelt aus drei Tönen: Egyptian Blue #03203D (Hintergrund, Ink #000F26), Stone Blue #639CC5 (zweite Fläche) und Scarlet Red #EB2F33 (einziger Akzent, hell #FF3E3B für Hover), Text fast weiß #EFF4F8; Hellmodus kühles Weiß #F3F7FB mit Egyptian-Blue-Text. Headlines: Archivo, sehr schmal (wdth 62), Gewicht 900, VERSALIEN, Zeilenhöhe 0,8, riesig (bis 8–13 rem), ein Teil jeder Headline rot. Labels und Buttons: Geist Mono, 11 px, Versalien, weite Laufweite. Fließtext: Inter. Volle Breite mit 4vw Rand, harte Kanten (Radius 3 px), Kacheln ohne Abstand mit 1-px-Haarlinien getrennt. Abschnitte nummeriert („■ 01 — Titel“ mit rotem Quadrat). Fotos entsättigt und abgedunkelt auf Schwarz, Verlauf von unten, Text unten links; bei Hover farbig und leicht gezoomt. Startseite: Vollbild-Hero mit „CREATIVE“ als Kontur und „CONNECT“ riesig (letzter Buchstabe rot), Stone-Blue-Laufband mit Brands, aufklappende Bildstreifen, Wisch-Karussell auf dem Handy, rote Split-Fläche, schwarzer Footer mit Wortmarke über die volle Breite.
