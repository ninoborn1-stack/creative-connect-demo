import Link from "next/link";
import { ArrowUpRight, Bell, Heart, Lock, MessageCircle } from "lucide-react";
import { APP_NAME } from "@/lib/brand";
import { href, type Dict, type Locale } from "@/lib/i18n";
import { Photo, type PhotoName } from "@/components/site/photo";
import { CARDS } from "@/content/preview-data";
import { Accent } from "@/components/showcase/accent";
import { OrbitRunner } from "@/components/showcase/orbit-runner";
import { ShowcasePhone } from "@/components/showcase/screens";
import { Glass, MatchCard, TrackCard } from "@/components/showcase/glass";

// Orbit: Das Handy schwebt mittig und dreht sich langsam hin und her, Funktionen, Community und Backstage kreisen
// auf drei elliptischen Bahnen in unterschiedlicher Tiefe darum (hinten kleiner und blasser, hinter dem Handy
// verdeckt). Läuft von selbst, solange der Bereich sichtbar ist (OrbitRunner), ohne Bezug zum Scrollen.
// Bahnen: r Radius, y Höhe, dur Umlaufzeit, dir Richtung; a Startwinkel (Grad). Mobil: eine Bahn, sechs Elemente (m).
// Bei reduzierter Bewegung stehen die Elemente ruhig im Kreis (sx/sy). CSS: showcase.css, Abschnitt Orbit.
const RINGS = {
  1: { r: 290, y: -150, dur: 36, dir: "normal" },
  2: { r: 245, y: 40, dur: 30, dir: "reverse" },
  3: { r: 330, y: 200, dur: 42, dir: "normal" },
} as const;

function Avatar({ name, className = "size-8" }: { name: PhotoName; className?: string }) {
  return <span className={`relative block shrink-0 overflow-hidden rounded-full ring-2 ring-[var(--ink)] ${className}`}><Photo name={name} sizes="48px" /></span>;
}

export function OrbitScene({ lang, t }: { lang: Locale; t: Dict }) {
  const s = t.showcase.space;
  const c = t.showcase.cards;
  const card = CARDS[0];
  const items: { slot: string; ring: 1 | 2 | 3; a: number; m?: number; node: React.ReactNode; link?: boolean }[] = [
    { slot: "swipe", ring: 1, a: 0, m: 0, node: (
      <Glass className="w-44 overflow-hidden p-0">
        <div className="relative h-32"><Photo name={card.image} sizes="200px" /><div className="absolute inset-0 bg-gradient-to-t from-[var(--ink)] to-transparent" /></div>
        <div className="p-3 pt-0"><p className="meta text-[0.55rem] text-white/65">{card.sub[lang]}</p><p className="poster text-xl">{card.title}</p></div>
      </Glass>
    ) },
    { slot: "event", ring: 1, a: 120, m: 60, node: (
      <Glass className="w-60 p-3">
        <div className="relative h-20 overflow-hidden rounded-xl"><Photo name="card-event" sizes="240px" /></div>
        <p className="mt-2.5 text-sm font-semibold">{c.event.title}</p>
        <p className="meta mt-0.5 text-white/65">{c.event.meta}</p>
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <span className="meta rounded-full bg-primary px-2 py-1 text-[0.55rem] whitespace-nowrap text-primary-foreground">{c.event.badge}</span>
          <span className="meta rounded-full border border-white/25 px-2 py-1 text-[0.55rem] whitespace-nowrap">{s.startsIn} <span data-countdown className="tabular-nums">05:59:59</span></span>
        </div>
      </Glass>
    ) },
    { slot: "reminder", ring: 1, a: 240, node: (
      <Glass className="flex w-64 items-center gap-3 p-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[var(--bone)] text-[var(--ink)]"><Bell className="size-4" /></span>
        <div className="min-w-0"><p className="text-sm font-semibold">{s.reminder.title}</p><p className="text-xs text-white/70">{s.reminder.text}</p></div>
      </Glass>
    ) },
    { slot: "track", ring: 2, a: 60, m: 120, node: <TrackCard t={c.track} /> },
    { slot: "match", ring: 2, a: 180, m: 180, node: <div className="sc-pulse-host"><MatchCard t={c.match} /></div> },
    { slot: "chat", ring: 2, a: 300, m: 240, node: (
      <div className="flex items-end gap-2">
        <Avatar name="for-artists" />
        <Glass className="rounded-bl-sm px-4 py-2.5 text-sm font-medium whitespace-nowrap"><MessageCircle className="mr-1.5 inline size-3.5 text-[var(--stone)]" />{s.chat}</Glass>
      </div>
    ) },
    { slot: "followers", ring: 3, a: 30, node: (
      <Glass className="flex items-center gap-3 rounded-full py-1.5 pr-4 pl-1.5">
        <span className="flex -space-x-2"><Avatar name="artists" className="size-7" /><Avatar name="studio" className="size-7" /><Avatar name="music" className="size-7" /></span>
        <p className="text-sm whitespace-nowrap"><strong className="font-semibold">{s.followers.n}</strong> {s.followers.label}</p>
      </Glass>
    ) },
    { slot: "comment", ring: 3, a: 150, node: (
      <Glass className="flex w-60 items-start gap-2.5 p-3">
        <Avatar name="card-music" />
        <p className="min-w-0 flex-1 text-xs leading-snug"><strong className="font-semibold">{s.comment.name}</strong> {s.comment.text}</p>
        <Heart className="sc-pulse size-4 shrink-0 fill-primary text-primary" />
      </Glass>
    ) },
    { slot: "backstage", ring: 3, a: 270, m: 300, link: true, node: (
      <Link href={href(lang, "backstage")} className="sc-backstage group block w-64 p-4" data-testid="space-backstage">
        <p className="meta flex items-center gap-2 text-[0.6rem] text-[var(--stone)]"><Lock className="size-3.5" />{s.backstage.label}</p>
        <p className="poster mt-2 text-2xl">{s.backstage.free}</p>
        <p className="meta mt-3 inline-flex items-center gap-1.5 text-[0.6rem] text-white/80 group-hover:text-white">{s.backstage.more}<ArrowUpRight className="size-3.5" /></p>
      </Link>
    ) },
  ];
  const all = items.length;
  return (
    <section id="app" aria-labelledby="space-title" className="sc-space-sec scroll-mt-16" data-testid="orbit-scene">
      <div className="gutter grid items-center gap-10 py-20 sm:py-28 lg:grid-cols-12 lg:gap-8">
        <div className="relative z-10 lg:order-2 lg:col-span-4">
          <p className="meta flex items-center gap-3 text-[var(--stone)]" data-reveal><span aria-hidden className="size-2 bg-primary" />{s.eyebrow}</p>
          <h2 id="space-title" className="poster mt-6 text-[clamp(2.4rem,7vw,6rem)] lg:text-[clamp(2.2rem,2.9vw,3.6rem)]" data-reveal style={{ "--i": 1 } as React.CSSProperties}><Accent text={s.title} /></h2>
          <p className="mt-6 max-w-md text-lg text-white/80" data-reveal style={{ "--i": 2 } as React.CSSProperties}>{s.text.replace("{app}", APP_NAME)}</p>
        </div>
        <OrbitRunner className="lg:order-1 lg:col-span-8">
          <div aria-hidden className="sc-orbit-glow" />
          <div className="sc-orbit-stage">
            <div aria-hidden className="sc-orbit-phone"><ShowcasePhone k="swipe" lang={lang} t={t} /></div>
            {items.map((x, i) => {
              const ring = RINGS[x.ring];
              const ang = (i / all) * Math.PI * 2 - Math.PI / 2; // ruhiger Kreis bei reduzierter Bewegung
              const mi = x.m === undefined ? -1 : x.m / 60;
              const mang = (mi / 6) * Math.PI * 2 - Math.PI / 2;
              const style = {
                "--r": `${ring.r}px`, "--y": `${ring.y}px`, "--dur": `${ring.dur}s`, "--dir": ring.dir, "--af": x.a / 360,
                "--afm": (x.m ?? 0) / 360,
                "--sx": `${Math.round(Math.cos(ang) * 330)}px`, "--sy": `${Math.round(Math.sin(ang) * 250)}px`,
                "--msx": `${Math.round(Math.cos(mang) * 120)}px`, "--msy": `${Math.round(Math.sin(mang) * 190)}px`,
              } as React.CSSProperties;
              return (
                <div key={x.slot} className="sc-orbit-item" data-slot={x.slot} data-mobile={x.m === undefined ? "off" : "on"} aria-hidden={x.link ? undefined : true} style={style}>
                  <div className="sc-orbit-face">{x.node}</div>
                </div>
              );
            })}
          </div>
        </OrbitRunner>
      </div>
    </section>
  );
}
