// Die eigentlichen App-Screens der Showcase-Handys, nachgebaut aus der interaktiven Vorschau (gleiche Daten aus
// content/preview-data.ts, gleiche Optik). Wird erst geladen, wenn ein Handy in die Nähe des Viewports kommt
// (LazyScreen), damit die Startseite schlank bleibt. Neuer Screen: Komponente hier ergänzen und in Screen eintragen.
import { CalendarDays, Heart, Home, MapPin, MessageCircle, Plus, RotateCcw, Star, User, X } from "lucide-react";
import { APP_NAME } from "@/lib/brand";
import { cn } from "@/lib/utils";
import type { Dict, Locale } from "@/lib/i18n";
import { Photo } from "@/components/site/photo";
import { CARDS, CHATS, EVENTS, UI } from "@/content/preview-data";
import { Wave } from "@/components/showcase/glass";

export type ScreenKey = "swipe" | "feed" | "events" | "music" | "matches" | "backstage";

const N = (k: Locale) => UI[k].tabs;

function TabBar({ lang, active }: { lang: Locale; active: "discover" | "events" | "messages" | "profile" }) {
  const t = N(lang);
  const items = [["discover", Home, t.discover], ["events", CalendarDays, t.events], ["create", Plus, t.create], ["messages", MessageCircle, t.messages], ["profile", User, t.profile]] as const;
  return (
    <div className="grid h-14 shrink-0 grid-cols-5 border-t text-[0.55rem]">
      {items.map(([key, Icon, label]) => (
        <span key={key} className={cn("flex flex-col items-center justify-center gap-0.5", key === active ? "text-primary" : "text-muted-foreground")}>
          <Icon className="size-4" />{label}
        </span>
      ))}
    </div>
  );
}

function Top({ lang, mode = "swipe" }: { lang: Locale; mode?: "swipe" | "scroll" }) {
  const u = UI[lang];
  return (
    <div className="flex items-center justify-between px-3 pb-2">
      <p className="poster-wide text-sm">{APP_NAME}</p>
      <span className="flex rounded-full bg-muted p-0.5 text-[0.6rem] font-semibold">
        {(["swipe", "scroll"] as const).map((m) => <span key={m} className={cn("rounded-full px-2.5 py-1", m === mode && "bg-primary text-primary-foreground")}>{u.modes[m]}</span>)}
      </span>
    </div>
  );
}

function Discover({ lang, card = CARDS[0] }: { lang: Locale; card?: (typeof CARDS)[number] }) {
  return (
    <div className="flex h-full flex-col">
      <Top lang={lang} />
      <div className="relative mx-3 min-h-0 flex-1 overflow-hidden rounded-3xl bg-[var(--ink)] text-[var(--bone)]">
        <Photo name={card.image} sizes="300px" className="opacity-85" />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--ink)] via-transparent to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-4">
          <p className="meta text-white/75">{card.sub[lang]}</p>
          <p className="poster text-[1.65rem]">{card.title}</p>
          <div className="mt-2 flex gap-1.5">{card.tags.map((g) => <span key={g} className="rounded-full bg-white/15 px-2 py-0.5 text-[0.6rem]">{g}</span>)}</div>
        </div>
      </div>
      <div className="flex justify-center gap-3 py-3 text-muted-foreground">
        {[X, RotateCcw, Heart, Star].map((I, i) => <span key={i} className={cn("grid size-10 place-items-center rounded-full border", i === 2 && "border-primary bg-primary text-primary-foreground")}><I className="size-4" /></span>)}
      </div>
      <TabBar lang={lang} active="discover" />
    </div>
  );
}

function Feed({ lang }: { lang: Locale }) {
  const posts = [CARDS[5], CARDS[1], CARDS[3]];
  return (
    <div className="flex h-full flex-col">
      <Top lang={lang} mode="scroll" />
      <div className="min-h-0 flex-1 space-y-4 overflow-hidden px-3">
        {posts.map((c) => (
          <div key={c.id}>
            <div className="mb-2 flex items-center gap-2">
              <span className="relative size-7 overflow-hidden rounded-full"><Photo name={c.image} sizes="40px" /></span>
              <p className="text-xs font-semibold">{c.title}</p>
              <p className="meta ml-auto text-[0.55rem] text-muted-foreground">{c.sub[lang].split(" · ")[0]}</p>
            </div>
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl"><Photo name={c.image} sizes="300px" /></div>
            <p className="mt-1.5 flex items-center gap-1.5 text-[0.65rem]"><Heart className="size-3.5 fill-primary text-primary" />{c.likes}</p>
          </div>
        ))}
      </div>
      <TabBar lang={lang} active="discover" />
    </div>
  );
}

function Events({ lang }: { lang: Locale }) {
  const u = UI[lang];
  return (
    <div className="flex h-full flex-col">
      <p className="px-3 pb-2 text-lg font-semibold">{u.events.yours}</p>
      <div className="min-h-0 flex-1 space-y-3 overflow-hidden px-3">
        {EVENTS.slice(1, 4).map((e, i) => (
          <div key={e.id} className="overflow-hidden rounded-2xl border bg-card">
            <div className="relative h-20"><Photo name={e.image} sizes="300px" /><span className={cn("meta absolute top-2 left-2 rounded-full px-2 py-1 text-[0.55rem]", i === 0 ? "bg-primary text-primary-foreground" : "bg-black/60 text-white")}>{e.countdown[lang]}</span></div>
            <div className="p-2.5">
              <p className="text-sm font-semibold">{e.title}</p>
              <p className="meta mt-0.5 text-[0.55rem] text-muted-foreground">{e.date[lang]} · {e.place}</p>
              {e.tickets && <p className="meta mt-1 text-[0.55rem] text-[var(--stone)]">{e.tickets[lang]}</p>}
            </div>
          </div>
        ))}
      </div>
      <TabBar lang={lang} active="events" />
    </div>
  );
}

function Music({ lang }: { lang: Locale }) {
  const card = CARDS.find((c) => c.id === "nachtfahrt")!;
  return (
    <div className="flex h-full flex-col">
      <Top lang={lang} />
      <div className="relative mx-3 min-h-0 flex-1 overflow-hidden rounded-3xl bg-[var(--ink)] text-[var(--bone)]">
        <Photo name={card.image} sizes="300px" className="opacity-80" />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--ink)] via-[var(--ink)]/30 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 space-y-2 p-4">
          <p className="meta text-white/75">{card.sub[lang]}</p>
          <p className="poster text-[1.65rem]">{card.title}</p>
          <div className="flex items-center gap-3 rounded-2xl bg-black/45 p-2">
            <span className="grid size-9 place-items-center rounded-full bg-primary text-primary-foreground">▶</span>
            <Wave bars={26} className="text-[var(--stone)]" />
          </div>
        </div>
      </div>
      <div className="h-3" />
      <TabBar lang={lang} active="discover" />
    </div>
  );
}

function Matches({ lang }: { lang: Locale }) {
  const chat = CHATS[0];
  const u = UI[lang];
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b px-3 pb-2">
        <span className="relative size-8 overflow-hidden rounded-full"><Photo name={chat.image} sizes="40px" /></span>
        <p className="text-sm font-semibold">{chat.name}</p>
      </div>
      <div className="min-h-0 flex-1 space-y-2 overflow-hidden p-3 text-[0.7rem] leading-snug">
        <p className="mx-auto w-fit rounded-full bg-muted px-3 py-1 text-[0.6rem] text-muted-foreground">{u.match.title}</p>
        {chat.messages.map((m, i) => <p key={i} className="max-w-[80%] rounded-2xl rounded-bl-sm bg-muted px-3 py-2">{m.text[lang]}</p>)}
        <p className="ml-auto max-w-[80%] rounded-2xl rounded-br-sm bg-primary px-3 py-2 text-primary-foreground">{chat.reply[lang]}</p>
        <p className="text-[0.6rem] text-muted-foreground">{chat.name.split(" ")[0]} {u.messages.typing}</p>
      </div>
      <div className="mx-3 mb-2 rounded-full border px-3 py-2 text-[0.65rem] text-muted-foreground">{u.messages.placeholder}</div>
      <TabBar lang={lang} active="messages" />
    </div>
  );
}

function Backstage({ t }: { t: Dict["showcase"]["backstage"] }) {
  const studios = [CARDS.find((c) => c.id === "nord")!, { ...CARDS[0], title: "Kreuzberg Rooms", image: "music" as const }, { ...CARDS[0], title: "Halle Süd", image: "organizers" as const }];
  return (
    <div className="flex h-full flex-col bg-[var(--ink)] text-[var(--bone)]">
      <div className="px-3 pb-3">
        <p className="meta flex items-center gap-2 text-[0.6rem] text-[var(--stone)]"><span className="size-1.5 rounded-full bg-primary" />Backstage · {t.mode}</p>
        <p className="poster mt-2 text-[2rem]">{t.city}</p>
        <p className="meta mt-1 text-[0.6rem] text-white/70">{t.dates}</p>
        <div className="mt-3 grid grid-cols-2 gap-2 text-[0.65rem]">
          <span className="rounded-xl border border-white/15 p-2"><MapPin className="mb-1 size-3.5 text-[var(--stone)]" />{t.free}</span>
          <span className="rounded-xl border border-white/15 p-2"><User className="mb-1 size-3.5 text-[var(--stone)]" />{t.people}</span>
        </div>
      </div>
      <div className="min-h-0 flex-1 space-y-2 overflow-hidden px-3">
        {studios.map((s) => (
          <div key={s.title} className="flex items-center gap-2.5 rounded-xl bg-white/5 p-2">
            <span className="relative size-10 shrink-0 overflow-hidden rounded-lg"><Photo name={s.image} sizes="48px" /></span>
            <div className="min-w-0"><p className="truncate text-xs font-semibold">{s.title}</p><p className="meta text-[0.55rem] text-white/60">{t.city}</p></div>
          </div>
        ))}
      </div>
      <p className="meta m-3 grid h-10 place-items-center bg-[var(--bone)] text-[0.6rem] text-[var(--ink)]">{t.request}</p>
    </div>
  );
}

export function Screen({ k, lang, backstage }: { k: ScreenKey; lang: Locale; backstage: Dict["showcase"]["backstage"] }) {
  if (k === "feed") return <Feed lang={lang} />;
  if (k === "events") return <Events lang={lang} />;
  if (k === "music") return <Music lang={lang} />;
  if (k === "matches") return <Matches lang={lang} />;
  if (k === "backstage") return <Backstage t={backstage} />;
  return <Discover lang={lang} />;
}

