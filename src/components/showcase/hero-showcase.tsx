import type { Dict } from "@/lib/i18n";
import { MotionScope } from "@/components/showcase/motion-scope";
import { EventCard, FilterChips, MatchCard, ProfileChip, PushCard, TrackCard } from "@/components/showcase/glass";

// Hero-Showcase: Um die echte, bedienbare Handy-Vorschau (children) schweben Glas-Karten auf drei Ebenen.
// Beim Laden fliegen sie aus der Mitte des Handys an ihre Plätze (nach dem DJ-Pult-Intro), auf dem Desktop folgen
// Handy und Karten der Maus (höchstens 6° Neigung), auf dem Handy driften sie beim Scrollen leicht.
// Karten sind aria-hidden und lassen Klicks durch (pointer-events: none), der Inhalt steht als Text im Hero.
// Positionen und Ebenen: showcase.css (.sc-hero-card[data-slot]).

export function HeroShowcase({ t, children }: { t: Dict["showcase"]["cards"]; children: React.ReactNode }) {
  // fx/fy: Weg von der Endposition zurück zur Handymitte, von dort fliegt die Karte los
  const cards = [
    { slot: "push", depth: 3, fx: -150, fy: 260, node: <PushCard t={t.push} /> },
    { slot: "profile", depth: 1, fx: 190, fy: 170, node: <ProfileChip t={t.profile} /> },
    { slot: "track", depth: 3, fx: -170, fy: 0, node: <TrackCard t={t.track} /> },
    { slot: "event", depth: 2, fx: 210, fy: -40, node: <EventCard t={t.event} /> },
    { slot: "match", depth: 1, fx: -170, fy: -180, node: <MatchCard t={t.match} /> },
    { slot: "chips", depth: 2, fx: 150, fy: -260, node: <FilterChips chips={t.chips} /> },
  ];
  return (
    <MotionScope tilt className="sc-hero relative" data-testid="hero-showcase">
      <div aria-hidden className="sc-hero-light" />
      <div className="sc-hero-tilt relative">
        {children}
        <div aria-hidden className="sc-hero-cards" data-testid="hero-cards">
          {cards.map((c, i) => (
            <div key={c.slot} className="sc-hero-card" data-slot={c.slot} data-depth={c.depth} style={{ "--d": c.depth, "--i": i, "--fx": `${c.fx}px`, "--fy": `${c.fy}px` } as React.CSSProperties}>
              <div className="sc-fly">{c.node}</div>
            </div>
          ))}
        </div>
      </div>
    </MotionScope>
  );
}
