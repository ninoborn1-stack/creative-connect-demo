# Hero-Konzept der Startseite

Umsetzung: `src/components/public/hero.tsx` (Markup + GSAP), `src/app/globals.css` (Abschnitt „HERO“), `src/components/public/public-header.tsx` (Navbar über dem Foto).

## Idee

Das Foto ist die Bühne (Motiv: Band im Spotlight). Beim Laden öffnet es sich aus einem **Bogen** – Bühnenportal/Torbogen – zum Vollbild, dann steigt „Connect“ Buchstabe für Buchstabe auf, „Creative“ gleitet als Script-Zeile dazu. Beim Scrollen zieht der Schriftzug nach oben weg, „Willkommen im Netzwerk.“ erscheint, und das Bild rahmt sich mit runden Ecken ein, bevor die Seite übernimmt.

## Tokens

| Token | Verwendung |
| --- | --- |
| `--primary` (Bordeaux) | Primär-Button, Akzente in der ganzen App |
| `--hero-ink` | Bild-Hintergrund während des Bogens |
| `--champagne` | Script-Zeilen „Creative“ / „Willkommen im“, Punkt in der Infoleiste |
| `--hero-text` | Text auf dem Foto |
| `--background` | sichtbar um Bogen und Rahmen (dunkel bzw. Elfenbein im Light-Mode) |

Schriften (über `next/font` selbst gehostet, kein Google-Aufruf zur Laufzeit): **Fraunces** (Gewicht 250, `opsz` 144) für „Connect“ und die zweite Botschaft, **Pinyon Script** für die Script-Zeilen, Bricolage Grotesque/Inter für Text.

## Ebenen

```
section.hero            230vh (Handy 200vh) = Scroll-Strecke
└─ .hero__stage         sticky, 100svh
   ├─ .hero__frame      SCROLL: clip-path → Rahmen
   │  └─ .hero__media   INTRO: clip-path Bogen → Vollbild
   │     ├─ .hero__zoom SCROLL: scale 1 → 0.88
   │     │  └─ img      INTRO: scale 1.45 → 1.15
   │     └─ .hero__shade INTRO: Verlauf einblenden
   ├─ .hero__content    SCROLL: nach oben + ausblenden (Kinder: INTRO)
   ├─ .hero__second     SCROLL: „Willkommen im Netzwerk.“
   └─ [data-hero-barwrap] SCROLL: ausblenden  └─ .hero__bar INTRO: einblenden
```

Jede Eigenschaft wird von genau **einer** Animation bewegt; der CSS-Grundzustand ist der fertige Zustand. Intro wird bei Scrollen/Wischen/Taste mit `timeScale(6)` abgekürzt statt abgebrochen und räumt am Ende per `clearProps` auf. Scroll-Timeline nur mit `fromTo` (eindeutig an jeder Position), `scrub: 0.8`, Lenis-Smooth-Scroll (`lerp: 0.11`) nur auf der Startseite.

## Stolperfallen (berücksichtigt)

- `html { overflow-x: clip }` statt `hidden`, sonst funktioniert `sticky` nicht.
- `history.scrollRestoration = "manual"` auf `/` (im Inline-Script im `<head>`), damit das Intro nach Neuladen/Zurück nicht mitten in der Strecke startet; mit Anker kein Intro.
- `clip-path`-Werte immer vollständig und mit gleichen Einheiten.
- `prefers-reduced-motion`: keine Animationen, Hero nicht sticky, zweite Botschaft ausgeblendet.
- Bild mindestens 2400 px breit (wird bis 1.45 skaliert).
