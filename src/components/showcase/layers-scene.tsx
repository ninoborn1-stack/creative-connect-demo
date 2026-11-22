import Link from "next/link";
import { ArrowUpRight, Bookmark, Heart, MessageCircle, Ticket } from "lucide-react";
import { APP_NAME } from "@/lib/brand";
import { href, type Dict, type Locale } from "@/lib/i18n";
import { Photo, type PhotoName } from "@/components/site/photo";
import { CARDS, EVENTS } from "@/content/preview-data";
import { Accent } from "@/components/showcase/accent";
import { LayersController } from "@/components/showcase/layers-controller";
import { Ticker } from "@/components/showcase/ticker";

// Explosionsansicht: Die App in fünf aufrechten Glastafeln, die zum Betrachter zeigen. Sie stehen hintereinander
// gestaffelt wie aufgefächerte Karten (vorne Ebene 1, jede weitere ein festes Stück weiter hinten und nach rechts),
// alle gleich groß, mit festem Innenraster und höchstens drei Elementen je Tafel.
// Ab 30 % Sichtbarkeit gleiten die Tafeln einmal nacheinander von vorne nach hinten in ihre Position und bleiben dort;
// dann wird eine Tafel nach der anderen hervorgehoben (nach vorne über translateZ, Rest abgedunkelt).
// Die Labels liegen flach außerhalb der 3D-Szene (scharfe Schrift): eine Reihe auf gemeinsamer Grundlinie unter den
// Tafeln, gerade senkrechte Hinweislinien; die Beschreibung der aktiven Ebene steht darunter.
// Steuerung, Ausrichten der Labels an den Tafeln und Tippen: LayersController. Geometrie: showcase.css.

function Avatar({ name, className = "size-8" }: { name: PhotoName; className?: string }) {
  return <span className={`relative block shrink-0 overflow-hidden rounded-full ring-2 ring-[var(--ink)] ${className}`}><Photo name={name} sizes="48px" /></span>;
}

export function LayersScene({ lang, t }: { lang: Locale; t: Dict }) {
  const s = t.showcase.space;
  const artist = CARDS[0];
  const event = EVENTS[1];
  const city = s.backstage.label.split(" · ")[1];
  // Je Tafel: Kopfzeile (Nummer, Name) und zwei bis drei Elemente im gleichen Raster
  const faces = [
    <>
      <p className="sc-fc-city poster">{city}</p>
      <div className="sc-fc-map" aria-hidden>{[["24%", "34%"], ["68%", "22%"], ["50%", "70%"]].map(([x, y]) => <span key={x + y} className="sc-ly-pin" style={{ left: x, top: y }} />)}</div>
      <div className="sc-fc-tabs">{Array.from({ length: 5 }, (_, i) => <span key={i} />)}</div>
    </>,
    <>
      <div className="sc-fc-box sc-fc-artist"><Photo name={artist.image} sizes="200px" /><div className="sc-ly-shade" /><div className="absolute inset-x-0 bottom-0 p-3"><p className="poster text-[1.2rem] leading-[0.95]">{artist.title}</p></div></div>
      <div className="sc-fc-box sc-fc-row">
        <span className="relative block size-8 shrink-0 overflow-hidden rounded-lg"><Photo name={event.image} sizes="48px" /></span>
        <div className="min-w-0"><p className="text-[0.7rem] leading-tight font-semibold">{event.title}</p><p className="meta text-[0.55rem] text-white/70">{s.startsIn} <Ticker /></p></div>
      </div>
    </>,
    <>
      <div className="sc-fc-swipe" aria-hidden><span className="sc-ly-trail" /><span className="sc-ly-finger" /></div>
      <span className="sc-fc-stamp"><Heart className="size-4 fill-current" />{s.stamp}</span>
      <div className="sc-fc-chips">
        <span className="sc-fc-chip"><Bookmark className="size-3.5" />{s.save}</span>
        <span className="sc-fc-chip sc-fc-chip--hot"><Ticket className="size-3.5" />{s.tickets}</span>
      </div>
    </>,
    <>
      <div className="sc-fc-box sc-fc-match"><div className="flex -space-x-3"><Avatar name="for-artists" className="size-12" /><Avatar name="artists" className="size-12" /></div><p className="accent text-[1.6rem] leading-none">{t.showcase.cards.match.title}</p></div>
      <div className="sc-fc-box sc-fc-row sc-ly-chat"><MessageCircle className="size-3.5 shrink-0 text-[var(--stone)]" /><span className="text-[0.72rem] leading-tight">{s.chat}</span><span className="sc-ly-typing"><i /><i /><i /></span></div>
    </>,
    <>
      <Link href={href(lang, "backstage")} className="sc-fc-box sc-fc-backstage" data-testid="space-backstage">
        <span className="sc-lock" aria-hidden><i /><b /></span>
        <span className="meta text-[0.56rem] whitespace-nowrap text-[var(--stone)]">{s.backstage.label}</span>
        <span className="poster text-[1.75rem] leading-[0.95]">{s.backstage.free}</span>
        <span className="meta inline-flex items-center gap-1 text-[0.52rem] whitespace-nowrap text-white/80">{s.backstage.more}<ArrowUpRight className="size-3" /></span>
      </Link>
    </>,
  ];
  const num = (i: number) => String(i + 1).padStart(2, "0");
  return (
    <section id="app" aria-labelledby="space-title" className="sc-space-sec relative isolate scroll-mt-16" data-testid="layers-scene">
      <div aria-hidden className="sc-grid sc-space-grid absolute inset-0 -z-10" />
      <div className="gutter grid items-center gap-8 py-16 sm:py-20 lg:py-12 xl:grid-cols-[minmax(0,clamp(21rem,24vw,30rem))_1fr] xl:py-8">
        <div className="relative z-10">
          <p className="meta flex items-center gap-3 text-[var(--stone)]"><span aria-hidden className="size-2 bg-primary" />{s.eyebrow}</p>
          <h2 id="space-title" className="poster mt-6 text-[clamp(2.4rem,7vw,6rem)] xl:text-[clamp(2.2rem,2.6vw,3.4rem)]"><Accent text={s.title} /></h2>
          <p className="mt-6 max-w-md text-lg text-white/80">{s.text.replace("{app}", APP_NAME)}</p>
        </div>
        <LayersController className="min-w-0">
          <div className="sc-layers-stage">
            <div className="sc-fan">
              <div className="sc-fan-rot">
                {faces.map((face, i) => (
                  <div key={i} className="sc-layer" data-layer={i + 1} style={{ "--i": i } as React.CSSProperties}>
                    <div className={`sc-plate${i === 4 ? " sc-plate--glass" : ""}`}>
                      <p className="sc-fc-head meta"><span>{num(i)}</span><span>{i === 0 ? APP_NAME : s.layers[i].label}</span></p>
                      {face}
                      <span aria-hidden className="sc-fog" />
                    </div>
                    <i aria-hidden className="sc-anchor"><b /><b /></i>
                  </div>
                ))}
                {/* Messpunkte an der Unterkante jeder Tafel (Endposition, ohne Animation) für die Labels */}
                {faces.map((_, i) => <i key={i} aria-hidden className="sc-ghost" style={{ "--i": i } as React.CSSProperties}><b /><b /></i>)}
              </div>
            </div>
            <div className="sc-layer-labels" aria-hidden>
              {s.layers.map((l, i) => (
                <div key={l.label} className="sc-layer-label" style={{ "--i": i } as React.CSSProperties}>
                  <i className="sc-layer-line" />
                  <span className="sc-layer-tag"><b className="meta">{num(i)}</b><span>{l.label}</span></span>
                </div>
              ))}
              <div className="sc-layer-captions">
                {s.layers.map((l, i) => <p key={l.label} className="sc-layer-caption" style={{ "--i": i } as React.CSSProperties}>{l.text}</p>)}
              </div>
            </div>
          </div>
          <ol className="sc-layers-list">
            {s.layers.map((l, i) => (
              <li key={l.label} style={{ "--i": i } as React.CSSProperties}><b className="meta">{num(i)}</b><span><strong>{l.label}</strong> {l.text}{i === 4 && <><br /><Link href={href(lang, "backstage")}>{s.backstage.more}<ArrowUpRight className="size-3.5" aria-hidden /></Link></>}</span></li>
            ))}
          </ol>
        </LayersController>
      </div>
    </section>
  );
}
