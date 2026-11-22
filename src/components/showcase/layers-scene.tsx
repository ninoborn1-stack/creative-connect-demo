import Link from "next/link";
import { ArrowUpRight, Bookmark, Heart, MessageCircle, Ticket } from "lucide-react";
import { APP_NAME } from "@/lib/brand";
import { href, type Dict, type Locale } from "@/lib/i18n";
import { Photo, type PhotoName } from "@/components/site/photo";
import { CARDS, EVENTS } from "@/content/preview-data";
import { Accent } from "@/components/showcase/accent";
import { LayersController } from "@/components/showcase/layers-controller";
import { Ticker } from "@/components/showcase/ticker";

// Explosionsansicht: Ein App-Display ohne Gehäuse liegt isometrisch im Raum und fährt in fünf treppenartig versetzte
// Schichten auseinander (Stadt, Entdecken, Merken, Community, Backstage), jede mit Materialkante, Glasschimmer und
// Schatten auf die Schicht darunter. Ab 30 % Sichtbarkeit fahren die Schichten von unten nach oben auseinander, jedes
// Label erscheint zusammen mit seiner Schicht; dann wird eine Schicht nach der anderen hervorgehoben (größer, höher,
// Rest abgedunkelt) und spielt ihren Mini-Moment, kurz vor Ende fährt alles einmal zusammen und wieder auf.
// Steuerung, Größe nach Fensterhöhe und Hover/Tippen: LayersController.
// Ohne Bewegung: offen und still.
// Zeitplan und Geometrie: showcase.css, Abschnitt Explosionsansicht.

function Avatar({ name, className = "size-8" }: { name: PhotoName; className?: string }) {
  return <span className={`relative block shrink-0 overflow-hidden rounded-full ring-2 ring-[var(--ink)] ${className}`}><Photo name={name} sizes="48px" /></span>;
}

export function LayersScene({ lang, t }: { lang: Locale; t: Dict }) {
  const s = t.showcase.space;
  const artist = CARDS[0];
  const event = EVENTS[1];
  // Pro Schicht höchstens zwei bis drei große Elemente, damit man jede auf einen Blick versteht
  const layers = [
    // 1 Grund: Stadt-Raster mit Orten
    <div key="base" className="sc-plate sc-plate--base">
      <div className="sc-plate-bar"><span>9:41</span><span className="poster-wide text-[0.7rem]">{APP_NAME}</span></div>
      <p className="sc-ly-city poster">{s.backstage.label.split(" · ")[1]}</p>
      {[["30%", "78%"], ["70%", "70%"], ["52%", "86%"]].map(([x, y]) => <span key={x + y} className="sc-ly-pin" style={{ left: x, top: y }} />)}
      <div className="sc-plate-tabs">{Array.from({ length: 5 }, (_, i) => <span key={i} />)}</div>
    </div>,
    // 2 Entdecken: Artist und Event mit Countdown
    <div key="content" className="sc-plate sc-plate--clear">
      <div className="sc-ly sc-ly-artist"><Photo name={artist.image} sizes="300px" /><div className="sc-ly-shade" /><div className="absolute inset-x-0 bottom-0 p-4"><p className="meta text-[0.6rem] text-white/70">{artist.sub[lang]}</p><p className="poster text-3xl">{artist.title}</p></div></div>
      <div className="sc-ly sc-ly-event">
        <span className="relative block h-14 w-20 shrink-0 overflow-hidden rounded-lg"><Photo name={event.image} sizes="100px" /></span>
        <div className="min-w-0"><p className="truncate font-semibold">{event.title}</p><p className="meta text-[0.6rem] text-white/70">{s.startsIn} <Ticker /></p></div>
      </div>
    </div>,
    // 3 Merken und erinnern: Wisch mit Herz-Stempel, Merken, Ticket
    <div key="action" className="sc-plate sc-plate--clear">
      <div className="sc-ly-swipe"><span className="sc-ly-trail" /><span className="sc-ly-finger" /></div>
      <span className="sc-ly-stamp"><Heart className="size-5 fill-current" />{s.stamp}</span>
      <span className="sc-ly-chip sc-ly-save"><Bookmark className="size-4" />{s.save}</span>
      <span className="sc-ly-chip sc-ly-ticket"><Ticket className="size-4" />{s.tickets} · {event.tickets?.[lang]}</span>
    </div>,
    // 4 Community: Match und Chat-Blase, die tippt
    <div key="community" className="sc-plate sc-plate--clear">
      <div className="sc-ly sc-ly-match"><div className="flex -space-x-4"><Avatar name="for-artists" className="size-14" /><Avatar name="artists" className="size-14" /></div><p className="accent text-3xl leading-none">{t.showcase.cards.match.title}</p><p className="meta text-[0.6rem] text-white/65">{t.showcase.cards.match.text}</p></div>
      <div className="sc-ly sc-ly-chat"><MessageCircle className="size-4 text-[var(--stone)]" /><span>{s.chat}</span><span className="sc-ly-typing"><i /><i /><i /></span></div>
    </div>,
    // 5 Backstage: dunkle Glasschicht mit Schloss
    <div key="backstage" className="sc-plate sc-plate--glass">
      <Link href={href(lang, "backstage")} className="sc-ly-backstage" data-testid="space-backstage">
        <span className="sc-lock" aria-hidden><i /><b /></span>
        <span className="meta text-[0.65rem] text-[var(--stone)]">{s.backstage.label}</span>
        <span className="poster text-4xl">{s.backstage.free}</span>
        <span className="meta inline-flex items-center gap-1.5 text-[0.62rem] text-white/80">{s.backstage.more}<ArrowUpRight className="size-3.5" /></span>
      </Link>
    </div>,
  ];
  return (
    <section id="app" aria-labelledby="space-title" className="sc-space-sec scroll-mt-16" data-testid="layers-scene">
      <div className="gutter grid items-center gap-10 py-16 sm:py-20 lg:min-h-[calc(100svh-4rem)] lg:grid-cols-12 lg:gap-8 lg:py-6">
        <div className="relative z-10 lg:col-span-4">
          <p className="meta flex items-center gap-3 text-[var(--stone)]"><span aria-hidden className="size-2 bg-primary" />{s.eyebrow}</p>
          <h2 id="space-title" className="poster mt-6 text-[clamp(2.4rem,7vw,6rem)] lg:text-[clamp(2.2rem,2.9vw,3.6rem)]"><Accent text={s.title} /></h2>
          <p className="mt-6 max-w-md text-lg text-white/80">{s.text.replace("{app}", APP_NAME)}</p>
        </div>
        <LayersController className="lg:col-span-8">
          <div className="sc-layers-stage">
            <div className="sc-layers-iso">
              {layers.map((plate, i) => (
                <div key={i} className="sc-layer" data-layer={i + 1} style={{ "--i": i } as React.CSSProperties}>
                  {i > 0 && <span aria-hidden className="sc-layer-shadow" />}
                  {(["t", "r", "b", "l"] as const).map((e) => <span key={e} aria-hidden className={`sc-edge sc-edge--${e}`} />)}
                  {plate}
                  <div className="sc-layer-label" data-side="left" aria-hidden><span className="sc-layer-line" /><span className="sc-layer-tag"><b className="meta">{String(i + 1).padStart(2, "0")} {s.layers[i].label}</b><span>{s.layers[i].text}</span></span></div>
                </div>
              ))}
            </div>
          </div>
          <ol className="sc-layers-list">
            {s.layers.map((l, i) => (
              <li key={l.label} style={{ "--i": i } as React.CSSProperties}><b className="meta">{String(i + 1).padStart(2, "0")}</b><span><strong>{l.label}</strong> {l.text}</span></li>
            ))}
          </ol>
        </LayersController>
      </div>
    </section>
  );
}
