import type { Dict, Locale } from "@/lib/i18n";
import { MotionScope } from "@/components/showcase/motion-scope";
import { ShowcasePhone } from "@/components/showcase/screens";
import { EventCard, FilterChips, MatchCard, ProfileChip, PushCard, TrackCard } from "@/components/showcase/glass";

// Hero-Showcase als echte 3D-Szene: Das Handy steht gedreht im Raum (mit Gehäusekante), die Glas-Karten liegen auf
// drei Ebenen (translateZ) in derselben Szene. Die Maus dreht die ganze Szene, dadurch wandern nahe Karten stärker
// als ferne; ohne Maus schwebt sie langsam (Ruhe-Bewegung). Ein Glanzlicht folgt der Maus über Display und Glas.
// Beim Laden fliegen die Karten mit Schwung aus dem Display. Karten sind dekorativ (aria-hidden), ihr Inhalt steht
// als Text im Hero. Positionen, Ebenen und Licht: showcase.css (Abschnitt Hero).
export function HeroShowcase({ lang, t }: { lang: Locale; t: Dict }) {
  const c = t.showcase.cards;
  // fx/fy: Weg von der Endposition zurück ins Display, von dort fliegt die Karte los
  const cards = [
    { slot: "push", depth: 3, fx: -120, fy: 180, node: <PushCard t={c.push} /> },
    { slot: "event", depth: 2, fx: 150, fy: 40, node: <EventCard t={c.event} /> },
    { slot: "track", depth: 3, fx: -130, fy: -60, node: <TrackCard t={c.track} /> },
    { slot: "match", depth: 1, fx: 120, fy: 160, node: <MatchCard t={c.match} /> },
    { slot: "profile", depth: 1, fx: -110, fy: -200, node: <ProfileChip t={c.profile} /> },
    { slot: "chips", depth: 2, fx: 100, fy: -220, node: <FilterChips chips={c.chips} /> },
  ];
  return (
    <MotionScope tilt className="sc-hero relative" data-testid="hero-showcase">
      <div aria-hidden className="sc-hero-light" />
      <div className="sc-hero-scene" data-testid="hero-phone">
        <div className="sc-hero-tilt">
          <div className="sc-hero-phone">
            <span aria-hidden className="sc-hero-edge" />
            <ShowcasePhone k="swipe" lang={lang} t={t} pw="calc(var(--ph) / 2.133)" eager />
            <span aria-hidden className="sc-hero-glare" />
          </div>
          <div aria-hidden className="sc-hero-cards" data-testid="hero-cards">
            {cards.map((x, i) => (
              <div key={x.slot} className="sc-hero-card" data-slot={x.slot} data-depth={x.depth} style={{ "--d": x.depth, "--i": i, "--fx": `${x.fx}px`, "--fy": `${x.fy}px` } as React.CSSProperties}>
                <div className="sc-fly">{x.node}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </MotionScope>
  );
}
