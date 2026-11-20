import { Bell, Heart, Ticket, X } from "lucide-react";
import { APP_NAME } from "@/lib/brand";
import type { Dict } from "@/lib/i18n";
import { Photo, type PhotoName } from "@/components/site/photo";
import { cn } from "@/lib/utils";

// App-Vorschau als animierte Mockups – reines CSS (Keyframes in globals.css), kein JavaScript.
// Bei „Bewegung reduzieren“ stehen die Mockups still.

const CARD_IMAGES: PhotoName[] = ["card-event", "card-artist", "card-music", "studio"];
const FEED_IMAGES: PhotoName[] = ["feed-2", "feed-4", "card-music", "feed-3"];

export function PhoneFrame({ children, label, className }: { children: React.ReactNode; label: string; className?: string }) {
  return (
    <figure className={cn("flex flex-col items-center gap-4", className)}>
      <div className="phone relative h-[600px] w-[min(290px,calc(100vw-2.5rem))] overflow-hidden rounded-[2.6rem] border-[9px] border-[#1b2433] bg-background shadow-2xl sm:h-[620px] sm:w-[300px]" role="img" aria-label={label}>
        <span aria-hidden className="absolute top-2 left-1/2 z-20 h-5 w-24 -translate-x-1/2 rounded-full bg-[#1b2433]" />
        {children}
      </div>
      <figcaption className="meta text-muted-foreground">{label}</figcaption>
    </figure>
  );
}

function AppBar({ filters }: { filters: string[] }) {
  return (
    <div aria-hidden className="relative z-10 px-4 pt-9">
      <p className="poster-wide text-sm">{APP_NAME}</p>
      <div className="mt-3 flex gap-1.5 overflow-hidden">
        {filters.map((f, i) => (
          <span key={f} className={cn("shrink-0 rounded-full border px-2.5 py-1 text-[0.65rem]", i === 0 ? "border-primary bg-primary text-primary-foreground" : "text-muted-foreground")}>{f}</span>
        ))}
      </div>
    </div>
  );
}

export function SwipeMockup({ t }: { t: Dict["preview"] }) {
  return (
    <PhoneFrame label={t.swipeLabel}>
      <AppBar filters={t.filters} />
      <div aria-hidden className="absolute inset-x-3 top-[6.5rem] bottom-20">
        {t.cards.map((c, i) => (
          <article key={c.title} className="swipe-card absolute inset-0 overflow-hidden rounded-2xl border bg-[var(--ink)] text-[var(--bone)]" style={{ "--i": i, "--dir": i % 2 ? -1 : 1 } as React.CSSProperties}>
            <Photo name={CARD_IMAGES[i]} sizes="280px" className="opacity-80" />
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--ink)] via-[var(--ink)]/30 to-transparent" />
            <span className="meta absolute top-3 left-3 bg-primary px-2 py-1 text-primary-foreground">{c.kind}</span>
            <span className="meta absolute top-3 right-3 bg-[var(--bone)] px-2 py-1 text-[var(--ink)]">{c.note}</span>
            <div className="absolute inset-x-0 bottom-0 p-4">
              <p className="meta text-white/75">{c.meta}</p>
              <p className="poster mt-1 text-[2.1rem]">{c.title}</p>
              <span className="meta mt-3 inline-flex items-center gap-1 bg-primary px-3 py-2 text-primary-foreground">
                {c.kind === "Event" && <Ticket className="size-3.5" />}{c.cta}
              </span>
            </div>
          </article>
        ))}
      </div>
      <div aria-hidden className="absolute inset-x-0 bottom-5 flex justify-center gap-4">
        <span className="grid size-12 place-items-center rounded-full border bg-card"><X className="size-5" /></span>
        <span className="grid size-12 place-items-center rounded-full bg-primary text-primary-foreground"><Heart className="size-5" /></span>
      </div>
    </PhoneFrame>
  );
}

export function FeedMockup({ t }: { t: Dict["preview"] }) {
  const posts = [...t.cards, ...t.cards];
  return (
    <PhoneFrame label={t.feedLabel}>
      <AppBar filters={t.filters} />
      <div aria-hidden className="absolute inset-x-3 top-[6.5rem] bottom-0 overflow-hidden">
        <ul className="feed-track space-y-3">
          {posts.map((c, i) => (
            <li key={i} className="overflow-hidden rounded-2xl border bg-card">
              <div className="flex items-center justify-between px-3 py-2">
                <span className="truncate text-xs font-semibold">{c.title}</span>
                <span className="meta text-primary">{c.kind}</span>
              </div>
              <div className="relative aspect-[4/3]">
                <Photo name={FEED_IMAGES[i % FEED_IMAGES.length]} sizes="280px" />
              </div>
              <div className="flex items-center gap-2 px-3 py-2 text-xs">
                <Heart className={cn("size-4", i % 3 === 0 && "fill-primary text-primary")} />
                <span className="text-muted-foreground">{c.meta}</span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </PhoneFrame>
  );
}

export function ReminderMockup({ t }: { t: Dict["reminders"] }) {
  return (
    <PhoneFrame label={t.hint}>
      <div className="absolute inset-0">
        <Photo name="reminders" sizes="300px" className="opacity-60" />
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--ink)]/70 via-transparent to-[var(--ink)]/80" />
      </div>
      <div aria-hidden className="relative z-10 pt-16 text-center text-white">
        <p className="text-6xl font-light tabular-nums">20:15</p>
        <p className="mt-1 text-sm text-white/80">{t.day}</p>
      </div>
      <ul aria-hidden className="absolute inset-x-3 top-48 z-10 space-y-2">
        {t.notifications.map((n, i) => (
          <li key={n.title} className="notif flex gap-3 rounded-2xl bg-white/90 p-3 text-[#03203d] shadow-lg backdrop-blur" style={{ "--i": i } as React.CSSProperties}>
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground"><Bell className="size-4" /></span>
            <span className="min-w-0">
              <span className="flex items-baseline justify-between gap-2 text-[0.7rem] text-[#03203d]/70"><span className="font-semibold uppercase">{APP_NAME}</span>{t.now}</span>
              <span className="block text-sm font-semibold">{n.title}</span>
              <span className="block truncate text-xs">{n.text}</span>
            </span>
          </li>
        ))}
      </ul>
    </PhoneFrame>
  );
}
