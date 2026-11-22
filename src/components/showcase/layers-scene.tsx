import Link from "next/link";
import { ArrowUpRight, Bookmark, Heart, MessageCircle, Ticket } from "lucide-react";
import { APP_NAME } from "@/lib/brand";
import { href, type Dict, type Locale } from "@/lib/i18n";
import { Photo, type PhotoName } from "@/components/site/photo";
import { CARDS, EVENTS } from "@/content/preview-data";
import { Accent } from "@/components/showcase/accent";
import { Wave } from "@/components/showcase/glass";
import { RunWhenVisible } from "@/components/showcase/run-when-visible";
import { Ticker } from "@/components/showcase/ticker";

// Explosionsansicht: Ein App-Display ohne Gehäuse liegt isometrisch im Raum und fährt in fünf Schichten auseinander
// (Stadt, Entdecken, Merken, Community, Backstage). Hinweislinien zeichnen sich zu Mono-Labels, jede Schicht leuchtet
// nacheinander auf und spielt einen Mini-Moment, dann fährt alles wieder zusammen. Schleife 16 s, läuft nur sichtbar
// (RunWhenVisible), Hover hält an und hebt die Schicht hervor. Ohne Bewegung: ausgefahren und still.
// Zeitplan und Geometrie: showcase.css, Abschnitt Explosionsansicht.

function Avatar({ name, className = "size-8" }: { name: PhotoName; className?: string }) {
  return <span className={`relative block shrink-0 overflow-hidden rounded-full ring-2 ring-[var(--ink)] ${className}`}><Photo name={name} sizes="48px" /></span>;
}

export function LayersScene({ lang, t }: { lang: Locale; t: Dict }) {
  const s = t.showcase.space;
  const artist = CARDS[0];
  const event = EVENTS[1];
  const track = CARDS.find((c) => c.id === "nachtfahrt")!;
  const layers = [
    // 1 Grund: App-Hintergrund mit Stadt-Raster
    <div key="base" className="sc-plate sc-plate--base">
      <div className="sc-plate-bar"><span>9:41</span><span className="poster-wide text-[0.7rem]">{APP_NAME}</span></div>
      <div className="sc-plate-tabs">{Array.from({ length: 5 }, (_, i) => <span key={i} />)}</div>
    </div>,
    // 2 Inhalte: Artist, Event mit Countdown, Track mit Wellenform
    <div key="content" className="sc-plate sc-plate--clear">
      <div className="sc-ly sc-ly-artist"><Photo name={artist.image} sizes="300px" /><div className="sc-ly-shade" /><div className="absolute inset-x-0 bottom-0 p-3"><p className="meta text-[0.55rem] text-white/70">{artist.sub[lang]}</p><p className="poster text-2xl">{artist.title}</p></div></div>
      <div className="sc-ly sc-ly-event">
        <span className="relative block h-12 w-16 shrink-0 overflow-hidden rounded-lg"><Photo name={event.image} sizes="80px" /></span>
        <div className="min-w-0"><p className="truncate text-sm font-semibold">{event.title}</p><p className="meta text-[0.55rem] text-white/70">{s.startsIn} <Ticker /></p></div>
      </div>
      <div className="sc-ly sc-ly-track"><span className="sc-ly-play">▶</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{track.title}</p><Wave className="text-[var(--stone)]" /></div></div>
    </div>,
    // 3 Interaktion: Swipe mit Herz-Stempel, Merken, Ticket
    <div key="action" className="sc-plate sc-plate--clear">
      <div className="sc-ly-swipe"><span className="sc-ly-trail" /><span className="sc-ly-finger" /></div>
      <span className="sc-ly-stamp"><Heart className="size-4 fill-current" />{s.stamp}</span>
      <span className="sc-ly-chip sc-ly-save"><Bookmark className="size-3.5" />{s.save}</span>
      <span className="sc-ly-chip sc-ly-ticket"><Ticket className="size-3.5" />{s.tickets} · {event.tickets?.[lang]}</span>
    </div>,
    // 4 Community: Match, Chat-Blase tippt, Follower, Kommentar
    <div key="community" className="sc-plate sc-plate--clear">
      <div className="sc-ly sc-ly-match"><div className="flex -space-x-3"><Avatar name="for-artists" className="size-9" /><Avatar name="artists" className="size-9" /></div><p className="accent text-lg leading-none">{t.showcase.cards.match.title}</p></div>
      <div className="sc-ly sc-ly-chat"><MessageCircle className="size-3.5 text-[var(--stone)]" /><span>{s.chat}</span><span className="sc-ly-typing"><i /><i /><i /></span></div>
      <div className="sc-ly sc-ly-followers"><span className="flex -space-x-2"><Avatar name="studio" className="size-6" /><Avatar name="music" className="size-6" /></span><strong>{s.followers.n}</strong> {s.followers.label}</div>
      <div className="sc-ly sc-ly-comment"><Avatar name="card-music" className="size-6" /><p className="min-w-0 flex-1 text-[0.7rem] leading-snug"><strong>{s.comment.name}</strong> {s.comment.text}</p><Heart className="size-3.5 shrink-0 fill-primary text-primary" /></div>
    </div>,
    // 5 Backstage: dunkle Glasschicht mit Schloss
    <div key="backstage" className="sc-plate sc-plate--glass">
      <Link href={href(lang, "backstage")} className="sc-ly-backstage" data-testid="space-backstage">
        <span className="sc-lock" aria-hidden><i /><b /></span>
        <span className="meta text-[0.6rem] text-[var(--stone)]">{s.backstage.label}</span>
        <span className="poster text-3xl">{s.backstage.free}</span>
        <span className="meta inline-flex items-center gap-1.5 text-[0.6rem] text-white/80">{s.backstage.more}<ArrowUpRight className="size-3.5" /></span>
      </Link>
    </div>,
  ];
  return (
    <section id="app" aria-labelledby="space-title" className="sc-space-sec scroll-mt-16" data-testid="layers-scene">
      <div className="gutter grid items-center gap-10 py-20 sm:py-28 lg:grid-cols-12 lg:gap-8">
        <div className="relative z-10 lg:col-span-4">
          <p className="meta flex items-center gap-3 text-[var(--stone)]" data-reveal><span aria-hidden className="size-2 bg-primary" />{s.eyebrow}</p>
          <h2 id="space-title" className="poster mt-6 text-[clamp(2.4rem,7vw,6rem)] lg:text-[clamp(2.2rem,2.9vw,3.6rem)]" data-reveal style={{ "--i": 1 } as React.CSSProperties}><Accent text={s.title} /></h2>
          <p className="mt-6 max-w-md text-lg text-white/80" data-reveal style={{ "--i": 2 } as React.CSSProperties}>{s.text.replace("{app}", APP_NAME)}</p>
        </div>
        <RunWhenVisible className="sc-layers lg:col-span-8">
          <div className="sc-layers-stage">
            <div className="sc-layers-iso">
              {layers.map((plate, i) => (
                <div key={i} className="sc-layer" data-layer={i + 1} style={{ "--i": i } as React.CSSProperties}>
                  {plate}
                  <div className="sc-layer-label" aria-hidden><span className="sc-layer-line" /><span className="sc-layer-tag"><b className="meta">{String(i + 1).padStart(2, "0")} {s.layers[i].label}</b><span>{s.layers[i].text}</span></span></div>
                </div>
              ))}
            </div>
          </div>
          <ol className="sc-layers-list">
            {s.layers.map((l, i) => (
              <li key={l.label} style={{ "--i": i } as React.CSSProperties}><b className="meta">{String(i + 1).padStart(2, "0")}</b><span><strong>{l.label}</strong> {l.text}</span></li>
            ))}
          </ol>
        </RunWhenVisible>
      </div>
    </section>
  );
}
