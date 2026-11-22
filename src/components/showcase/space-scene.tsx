import Link from "next/link";
import { ArrowUpRight, Bell, Heart, Lock, MessageCircle } from "lucide-react";
import { APP_NAME } from "@/lib/brand";
import { href, type Dict, type Locale } from "@/lib/i18n";
import { Photo, type PhotoName } from "@/components/site/photo";
import { CARDS } from "@/content/preview-data";
import { Accent } from "@/components/showcase/accent";
import { MotionScope } from "@/components/showcase/motion-scope";
import { ShowcasePhone } from "@/components/showcase/screens";
import { EventCard, Glass, MatchCard, TrackCard } from "@/components/showcase/glass";

// Raum-Szene: Ein Handy schwebt schräg im dunklen Raum, beim Hineinscrollen fliegen Funktionen, Community und ein
// Backstage-Anschnitt aus dem Display in den Raum (Perspektive, Größe nach Tiefe, kurzer Schweif im Flug).
// Desktop: kurz angeheftet (MotionScope „auto“ = pin ab 1024 px), mobil: gestaffelt beim Hineinscrollen.
// Ablauf: Element fliegt zwischen --s und --s + 0,22 von --p. Endpositionen (--tx/--ty in px ab Handymitte, --z Tiefe)
// stehen unten in ITEMS, Größen und Mobil-Varianten in showcase.css (.sc-space-item).

function Avatar({ name, className = "size-8" }: { name: PhotoName; className?: string }) {
  return <span className={`relative block shrink-0 overflow-hidden rounded-full ring-2 ring-[var(--ink)] ${className}`}><Photo name={name} sizes="48px" /></span>;
}

export function SpaceScene({ lang, t }: { lang: Locale; t: Dict }) {
  const s = t.showcase.space;
  const c = t.showcase.cards;
  const card = CARDS[0];
  const items = [
    { slot: "swipe", s: 0.04, tx: -270, ty: -180, z: 120, r: -6, node: (
      <Glass className="w-44 overflow-hidden p-0">
        <div className="relative h-36"><Photo name={card.image} sizes="200px" /><div className="absolute inset-0 bg-gradient-to-t from-[var(--ink)] to-transparent" /></div>
        <div className="p-3 pt-0"><p className="meta text-[0.55rem] text-white/65">{card.sub[lang]}</p><p className="poster text-xl">{card.title}</p></div>
      </Glass>
    ) },
    { slot: "event", s: 0.1, tx: 270, ty: -210, z: 60, r: 5, node: <EventCard t={c.event} /> },
    { slot: "track", s: 0.16, tx: -280, ty: 70, z: 160, r: -3, node: <TrackCard t={c.track} /> },
    { slot: "reminder", s: 0.22, tx: 280, ty: -20, z: 140, r: 3, node: (
      <Glass className="flex w-64 items-center gap-3 p-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[var(--bone)] text-[var(--ink)]"><Bell className="size-4" /></span>
        <div className="min-w-0"><p className="text-sm font-semibold">{s.reminder.title}</p><p className="text-xs text-white/70">{s.reminder.text}</p></div>
      </Glass>
    ) },
    { slot: "match", s: 0.3, tx: -250, ty: 260, z: -40, r: 4, node: <MatchCard t={c.match} /> },
    { slot: "chat", s: 0.36, tx: 320, ty: 110, z: 90, r: -4, node: (
      <div className="flex items-end gap-2">
        <Avatar name="for-artists" />
        <Glass className="rounded-bl-sm px-4 py-2.5 text-sm font-medium whitespace-nowrap"><MessageCircle className="mr-1.5 inline size-3.5 text-[var(--stone)]" />{s.chat}</Glass>
      </div>
    ) },
    { slot: "followers", s: 0.42, tx: -110, ty: -310, z: -120, r: 0, node: (
      <Glass className="flex items-center gap-3 rounded-full py-1.5 pr-4 pl-1.5">
        <span className="flex -space-x-2"><Avatar name="artists" className="size-7" /><Avatar name="studio" className="size-7" /><Avatar name="music" className="size-7" /></span>
        <p className="text-sm whitespace-nowrap"><strong className="font-semibold">{s.followers.n}</strong> {s.followers.label}</p>
      </Glass>
    ) },
    { slot: "comment", s: 0.48, tx: -20, ty: 330, z: -80, r: 2, node: (
      <Glass className="flex w-60 items-start gap-2.5 p-3">
        <Avatar name="card-music" />
        <p className="min-w-0 flex-1 text-xs leading-snug"><strong className="font-semibold">{s.comment.name}</strong> {s.comment.text}</p>
        <Heart className="size-4 shrink-0 fill-primary text-primary" />
      </Glass>
    ) },
  ];

  return (
    <section id="app" aria-labelledby="space-title" className="sc-space-sec scroll-mt-16" data-testid="space-scene">
      <MotionScope mode="auto" className="sc-space">
        <div className="sc-space-sticky gutter grid items-center gap-10 lg:grid-cols-12 lg:gap-8">
          <div className="relative z-10 lg:order-2 lg:col-span-4">
            <p className="meta flex items-center gap-3 text-[var(--stone)]" data-reveal><span aria-hidden className="size-2 bg-primary" />{s.eyebrow}</p>
            <h2 id="space-title" className="poster mt-6 text-[clamp(2.4rem,7vw,6rem)] lg:text-[clamp(2.2rem,2.9vw,3.6rem)]" data-reveal style={{ "--i": 1 } as React.CSSProperties}><Accent text={s.title} /></h2>
            <p className="mt-6 max-w-md text-lg text-white/80" data-reveal style={{ "--i": 2 } as React.CSSProperties}>{s.text.replace("{app}", APP_NAME)}</p>
          </div>
          <div className="sc-space-scene lg:order-1 lg:col-span-8">
            <div aria-hidden className="sc-space-glow" />
            <div aria-hidden className="sc-space-shadow" />
            <div aria-hidden className="sc-space-phone"><div className="sc-space-float"><ShowcasePhone k="swipe" lang={lang} t={t} /></div></div>
            <div className="sc-space-items">
              {items.map((x, i) => (
                <div key={x.slot} aria-hidden className="sc-space-item" data-slot={x.slot} style={{ "--s": x.s, "--tx": x.tx, "--ty": x.ty, "--z": x.z, "--r": x.r, "--i": i } as React.CSSProperties}>
                  {x.node}
                </div>
              ))}
              {/* Backstage-Anschnitt: dunkler, edler, mit echtem Link */}
              <div className="sc-space-item sc-space-item--link" data-slot="backstage" style={{ "--s": 0.56, "--tx": 250, "--ty": 340, "--z": 30, "--r": -2 } as React.CSSProperties}>
                <Link href={href(lang, "backstage")} className="sc-backstage group block w-64 p-4" data-testid="space-backstage">
                  <p className="meta flex items-center gap-2 text-[0.6rem] text-[var(--stone)]"><Lock className="size-3.5" />{s.backstage.label}</p>
                  <p className="poster mt-2 text-2xl">{s.backstage.free}</p>
                  <p className="meta mt-3 inline-flex items-center gap-1.5 text-[0.6rem] text-white/80 group-hover:text-white">{s.backstage.more}<ArrowUpRight className="size-3.5" /></p>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </MotionScope>
    </section>
  );
}
