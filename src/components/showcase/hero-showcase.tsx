import type { Dict, Locale } from "@/lib/i18n";
import { MotionScope } from "@/components/showcase/motion-scope";
import { ShowcasePhone } from "@/components/showcase/screens";
import { EventCard, FilterChips, MatchCard, ProfileChip, PushCard, TrackCard } from "@/components/showcase/glass";

// Hero-Showcase: Handy (Größe nach Fensterhöhe, immer ganz sichtbar) mit Glas-Karten auf drei Tiefenebenen
// (vorne groß und scharf, hinten kleiner und leicht unscharf). Beim Laden fliegen die Karten mit Schwung aus dem
// Display, auf dem Desktop folgen Handy und Karten der Maus (bis 10°). Karten sind dekorativ (aria-hidden),
// ihr Inhalt steht als Text im Hero. Positionen und Ebenen: showcase.css (.sc-hero-card[data-slot]).
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
      <div className="sc-hero-tilt relative" data-testid="hero-phone">
        <div className="sc-hero-phone">
          <ShowcasePhone k="swipe" lang={lang} t={t} pw="calc(var(--ph) / 2.133)" eager />
        </div>
        <div aria-hidden className="sc-hero-cards" data-testid="hero-cards">
          {cards.map((x, i) => (
            <div key={x.slot} className="sc-hero-card" data-slot={x.slot} data-depth={x.depth} style={{ "--d": x.depth, "--i": i, "--fx": `${x.fx}px`, "--fy": `${x.fy}px` } as React.CSSProperties}>
              <div className="sc-fly">{x.node}</div>
            </div>
          ))}
        </div>
      </div>
    </MotionScope>
  );
}
