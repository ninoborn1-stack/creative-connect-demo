import { Heart, Sparkles, UserPlus } from "lucide-react";
import type { Dict, Locale } from "@/lib/i18n";
import { Eyebrow } from "@/components/site/bits";
import { Photo, type PhotoName } from "@/components/site/photo";
import { CARDS, EVENTS } from "@/content/preview-data";
import { Accent } from "@/components/showcase/accent";
import { Wave } from "@/components/showcase/glass";
import { RunWhenVisible } from "@/components/showcase/run-when-visible";

// „Die Szene in Bewegung“: drei endlos laufende Reihen mit Karten aus der Szene (Beispieldaten aus preview-data.ts),
// leicht schräg im Raum, außen kleiner und dunkler, an den Rändern ausgeblendet. Hover hält eine Reihe an. Die
// laufenden Reihen sind aria-hidden; für Screenreader steht derselbe Inhalt als normale Liste darunter.
// Läuft nur, solange sichtbar; bei reduzierter Bewegung stehen die Reihen still und sind wischbar.
type Tile = { key: string; label: string; node: React.ReactNode };

function Img({ name, className }: { name: PhotoName; className: string }) {
  return <span className={`relative block shrink-0 overflow-hidden ${className}`}><Photo name={name} sizes="160px" /></span>;
}

export function CityMotion({ lang, t }: { lang: Locale; t: Dict }) {
  const s = t.showcase.city;
  const artists: Tile[] = CARDS.filter((c) => c.kind === "artist").map((c) => {
    const [role, city] = c.sub[lang].split(" · ");
    return { key: c.id, label: `${c.title}, ${role}, ${city}`, node: (
      <div className="sc-city-card flex w-64 items-center gap-3 p-3">
        <Img name={c.image} className="size-14 rounded-xl" />
        <div className="min-w-0"><p className="truncate font-semibold">{c.title}</p><p className="meta truncate text-[0.6rem] text-white/60">{role} · {city}</p></div>
      </div>
    ) };
  });
  const events: Tile[] = EVENTS.map((e) => ({ key: e.id, label: `${e.title}, ${e.countdown[lang]}`, node: (
    <div className="sc-city-card w-64 overflow-hidden">
      <div className="relative h-28"><Photo name={e.image} sizes="260px" /><span className="meta absolute top-2.5 left-2.5 rounded-full bg-primary px-2 py-1 text-[0.55rem] text-primary-foreground">{e.countdown[lang]}</span></div>
      <div className="p-3"><p className="font-semibold">{e.title}</p><p className="meta mt-0.5 text-[0.6rem] text-white/60">{e.date[lang]} · {e.place}</p></div>
    </div>
  ) }));
  const tracks: Tile[] = CARDS.filter((c) => c.kind === "music").map((c) => ({ key: c.id, label: `${c.title}, ${c.sub[lang]}`, node: (
    <div className="sc-city-card flex w-72 items-center gap-3 p-3">
      <Img name={c.image} className="size-16 rounded-lg" />
      <div className="min-w-0 flex-1"><p className="truncate font-semibold">{c.title}</p><p className="meta truncate text-[0.6rem] text-white/60">{c.sub[lang]}</p><Wave className="mt-1.5 text-[var(--stone)]" /></div>
    </div>
  ) }));
  const places: Tile[] = [
    ...CARDS.filter((c) => c.kind === "studio").map((c) => ({ name: c.title, sub: c.sub[lang], image: c.image })),
    ...EVENTS.slice(1).map((e) => ({ name: e.place.split(",")[0], sub: `${e.type[lang]} · ${e.place.split(", ")[1]}`, image: e.image })),
  ].map((p) => ({ key: p.name, label: `${p.name}, ${p.sub}`, node: (
    <div className="sc-city-card flex w-60 items-center gap-3 p-2.5">
      <Img name={p.image} className="h-12 w-16 rounded-lg" />
      <div className="min-w-0"><p className="truncate text-sm font-semibold">{p.name}</p><p className="meta truncate text-[0.55rem] text-white/60">{p.sub}</p></div>
    </div>
  ) }));
  const icons = [Heart, UserPlus, Sparkles, Sparkles, Sparkles];
  const moments: Tile[] = s.moments.map((m, i) => {
    const Icon = icons[i];
    return { key: m, label: m, node: <p className="sc-city-moment"><Icon className="size-3.5 text-[var(--stone)]" />{m}</p> };
  });
  const mix = (a: Tile[], b: Tile[]) => a.flatMap((x, i) => (b[i] ? [x, b[i]] : [x]));
  const rows = [
    { n: 1, speed: "80s", reverse: false, tiles: mix(artists, moments.slice(0, 2)) },
    { n: 2, speed: "95s", reverse: true, tiles: mix(events, tracks) },
    { n: 3, speed: "85s", reverse: false, tiles: mix(places, moments.slice(2)) },
  ];
  return (
    <section id="modi" aria-labelledby="city-title" className="scroll-mt-16 overflow-x-clip border-t py-20 sm:py-32" data-testid="city-motion">
      <div className="gutter" data-reveal>
        <Eyebrow>{s.eyebrow}</Eyebrow>
        <h2 id="city-title" className="poster mt-6 text-[clamp(2.2rem,6.4vw,6.5rem)] lg:text-[clamp(3rem,4.6vw,5.6rem)]"><Accent text={s.title} /></h2>
        <p className="mt-6 max-w-xl text-lg text-muted-foreground">{s.text}</p>
      </div>
      <RunWhenVisible className="sc-city mt-14 sm:mt-20">
        <div className="sc-city-tilt">
          {rows.map((r) => (
            <div key={r.n} className="sc-city-row marquee-wrap" data-row={r.n}>
              <div className="marquee" data-reverse={r.reverse ? "" : undefined} style={{ "--marquee-speed": r.speed } as React.CSSProperties}>
                {[0, 1].map((half) => (
                  <ul key={half} aria-hidden className="flex shrink-0 items-center gap-4 pr-4">
                    {r.tiles.map((x) => <li key={x.key} className="shrink-0">{x.node}</li>)}
                  </ul>
                ))}
              </div>
            </div>
          ))}
        </div>
      </RunWhenVisible>
      <ul className="sr-only" aria-label={s.listLabel}>
        {rows.flatMap((r) => r.tiles).map((x) => <li key={x.key}>{x.label}</li>)}
      </ul>
      <p className="gutter meta mt-8 text-muted-foreground">{s.note}</p>
    </section>
  );
}
