# Hero-Konzept der Startseite

Umsetzung: `src/components/public/hero.tsx` (Markup + GSAP), `src/app/globals.css` (Abschnitt „HERO“), `src/components/public/public-header.tsx` (Navbar über dem Foto).

## Idee

Das Foto ist die Bühne (Motiv: Band im Spotlight). Beim Laden zeichnet sich ein **DJ-Pult** (zwei Plattenteller mit Tonarm + Mixer) in Linien, das Foto erscheint in seiner Silhouette, die Rillen drehen an – dann zoomt die Maske durch den Mixer ins Vollbild. „Connect“ steigt Buchstabe für Buchstabe auf, „Creative“ gleitet als Outline-Zeile dazu. Beim Scrollen zieht der Schriftzug nach oben weg, „Willkommen im Netzwerk.“ erscheint, und das Bild rahmt sich ein, bevor die Seite übernimmt.

(Bis 27.10.2026 öffnete sich das Bild aus einem Bogen – auf Kundenwunsch durch das DJ-Pult ersetzt, zusammen mit dem Plakat-Redesign der öffentlichen Seiten.)

## Tokens

| Token | Verwendung |
| --- | --- |
| `--primary` (Bordeaux) | Primär-Button, Akzente in der ganzen App |
| `--ink` | Fläche um das DJ-Pult und den Rahmen |
| `--bone` | Linien des Pults, „Connect“, Outline „Creative“ |
| `--signal` | Akzent (letzter Buchstabe, Linie, Punkt in der Infoleiste, Fader) |
| `--hero-text` | Fließtext auf dem Foto |

Schriften (über `next/font` selbst gehostet, kein Google-Aufruf zur Laufzeit): **Archivo** mit `wdth`-Achse – schmal (62) für „Connect“ und die zweite Botschaft, breit (125) als Outline für „Creative“ –, **Geist Mono** für Metadaten, Inter für Text.

## Ebenen

```
section.hero            230vh (Handy 200vh) = Scroll-Strecke
└─ .hero__stage         sticky, 100svh
   ├─ .hero__frame      SCROLL: clip-path → Rahmen
   │  ├─ .hero__media   INTRO: mask (SVG-Silhouette DJ-Pult), Größe über --deck-w (64vw → 2200vw)
   │     ├─ .hero__zoom SCROLL: scale 1 → 0.88
   │     │  └─ img      INTRO: scale 1.45 → 1.15
   │     └─ .hero__shade INTRO: Verlauf einblenden
   │  └─ .hero__deck    INTRO: Linien zeichnen (stroke-dashoffset), Rillen drehen, dann ausblenden
   ├─ .hero__content    SCROLL: nach oben + ausblenden (Kinder: INTRO)
   ├─ .hero__second     SCROLL: „Willkommen im Netzwerk.“
   └─ [data-hero-barwrap] SCROLL: ausblenden  └─ .hero__bar INTRO: einblenden
```

Jede Eigenschaft wird von genau **einer** Animation bewegt; der CSS-Grundzustand ist der fertige Zustand. Intro wird bei Scrollen/Wischen/Taste mit `timeScale(6)` abgekürzt statt abgebrochen und räumt am Ende per `clearProps` auf. Scroll-Timeline nur mit `fromTo` (eindeutig an jeder Position), `scrub: 0.8`, Lenis-Smooth-Scroll (`lerp: 0.11`) nur auf der Startseite.

## Stolperfallen (berücksichtigt)

- `html { overflow-x: clip }` statt `hidden`, sonst funktioniert `sticky` nicht.
- `history.scrollRestoration = "manual"` auf `/` (im Inline-Script im `<head>`), damit das Intro nach Neuladen/Zurück nicht mitten in der Strecke startet; mit Anker kein Intro.
- `clip-path`-Werte immer vollständig und mit gleichen Einheiten.
- Maske und Linien teilen sich die Variable `--deck-w` auf `.hero__stage` und die Geometrie (viewBox 1000 × 440). Der Zoom-Mittelpunkt liegt im Mixer (massiv), deshalb ist das Bild am Ende lückenlos.
- `data-intro` auf `<html>` setzt das Inline-Script vor dem ersten Paint; so blitzt der fertige Hero vor dem Intro nicht auf. Die Hero-Komponente entfernt das Attribut am Ende, mit Anker oder bei reduced motion sofort.
- `prefers-reduced-motion`: keine Animationen, Hero nicht sticky, zweite Botschaft ausgeblendet.
- Bild mindestens 2400 px breit (wird bis 1.45 skaliert).
