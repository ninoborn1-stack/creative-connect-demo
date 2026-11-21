"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BadgeCheck, Bell, Bookmark, CalendarDays, ChevronLeft, Compass, Heart, Lock, MapPin, MessageCircle, Pause, Play, Plus, RotateCcw, Send, Star, Ticket, User, X } from "lucide-react";
import { APP_NAME } from "@/lib/brand";
import { asset } from "@/lib/asset";
import type { Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { Photo } from "@/components/site/photo";
import { PhoneFrame } from "@/components/preview/phone-frame";
import { CARDS, CHATS, EVENTS, NOTICES, PROFILE, UI, type Card, type Kind, type Notice, type UIText } from "@/content/preview-data";

// Interaktive Klick-Vorschau der App im Handy-Rahmen. Alles läuft mit lokalem State im Browser -
// nichts wird gespeichert oder gesendet. Gesten mit Pointer Events, Animationen mit CSS.

type Tab = "discover" | "events" | "messages" | "profile";
type Filter = Kind | "all";
type Algo = "forYou" | "fresh";
type Msg = { me: boolean; text: string };

const FILTERS: Filter[] = ["all", "artist", "music", "event", "studio", "package"];
const THRESHOLD = 90;

export function AppPreview({ lang }: { lang: Locale }) {
  const [run, setRun] = useState(0); // Zurücksetzen = Neustart der Vorschau
  const t = UI[lang];
  return (
    <div className="flex flex-col items-center gap-4">
      <PreviewApp key={run} lang={lang} t={t} />
      <button type="button" onClick={() => setRun((r) => r + 1)} className="meta inline-flex h-10 items-center gap-2 border border-foreground/30 px-4 transition-colors hover:border-foreground" data-testid="preview-reset">
        <RotateCcw className="size-4" aria-hidden />{t.reset}
      </button>
    </div>
  );
}

function PreviewApp({ lang, t }: { lang: Locale; t: UIText }) {
  const L = useCallback((v: { de: string; en: string }) => v[lang], [lang]);
  const [tab, setTab] = useState<Tab>("discover");
  const [mode, setMode] = useState<"swipe" | "scroll">("swipe");
  const [filter, setFilter] = useState<Filter>("all");
  const [algo, setAlgo] = useState<Algo>("forYou");
  const [index, setIndex] = useState(0);
  const [history, setHistory] = useState<{ id: string; liked: boolean }[]>([]);
  const [liked, setLiked] = useState<Set<string>>(new Set());
  const [likes, setLikes] = useState<Record<string, number>>({});
  const [savedEvents, setSavedEvents] = useState<string[]>([]);
  const [match, setMatch] = useState<Card | null>(null);
  const [chats, setChats] = useState<Record<string, Msg[]>>(() => Object.fromEntries(CHATS.map((c) => [c.id, c.messages.map((m) => ({ me: m.me, text: m.text[lang] }))])));
  const [openChat, setOpenChat] = useState<string | null>(null);
  const [typing, setTyping] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [interacted, setInteracted] = useState(false);
  const [ticket, setTicket] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [createItem, setCreateItem] = useState<string | null>(null);
  const [profileTab, setProfileTab] = useState<"posts" | "tracks" | "events">("posts");
  const [playing, setPlaying] = useState<string | null>(null);
  const audio = useRef<HTMLAudioElement | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const showToast = useCallback((text: string) => {
    setToast(text);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3200);
  }, []);
  const touch = useCallback(() => setInteracted(true), []);

  // Stapel/Feed: gefiltert, im Modus „Neu entdecken“ Newcomer zuerst
  const deck = useMemo(() => {
    const list = CARDS.filter((c) => filter === "all" || c.kind === filter);
    return algo === "fresh" ? [...list.filter((c) => c.fresh), ...list.filter((c) => !c.fresh).reverse()] : list;
  }, [filter, algo]);
  const current = deck[index];

  const changeDeck = (fn: () => void) => {
    fn();
    setIndex(0);
    setHistory([]);
  };

  // Hörproben: immer nur eine gleichzeitig, kein Autoplay
  const toggleAudio = useCallback((card: Card) => {
    if (!card.audio) return;
    touch();
    if (playing === card.id) {
      audio.current?.pause();
      setPlaying(null);
      return;
    }
    audio.current?.pause();
    const a = new Audio(asset(card.audio));
    a.onended = () => setPlaying(null);
    audio.current = a;
    a.play().then(() => setPlaying(card.id)).catch(() => setPlaying(null));
  }, [playing, touch]);
  useEffect(() => () => audio.current?.pause(), []);

  const decide = useCallback((dir: "left" | "right" | "save") => {
    if (!current) return;
    touch();
    const isLike = dir !== "left";
    setHistory((h) => [...h, { id: current.id, liked: isLike }]);
    setIndex((i) => i + 1);
    if (isLike) setLiked((s) => new Set(s).add(current.id));
    if (dir === "save") showToast(`${t.saved}: ${current.title}`);
    if (dir === "right" && current.match) setTimeout(() => setMatch(current), 280);
  }, [current, touch, showToast, t.saved]);

  const undo = useCallback(() => {
    const last = history.at(-1);
    if (!last) return;
    setHistory((h) => h.slice(0, -1));
    setIndex((i) => Math.max(0, i - 1));
    if (last.liked) setLiked((s) => { const n = new Set(s); n.delete(last.id); return n; });
  }, [history]);

  // Simulierte Push-Nachrichten: erst nach der ersten Aktion, dann höchstens alle ~20 s, maximal 3
  useEffect(() => {
    if (!interacted) return;
    const timers = NOTICES.map((n, i) => setTimeout(() => {
      setNotice(n);
      setTimeout(() => setNotice((cur) => (cur === n ? null : cur)), 5500);
    }, 4000 + i * 20000));
    return () => timers.forEach(clearTimeout);
  }, [interacted]);

  const openNotice = (n: Notice) => {
    setNotice(null);
    setTab(n.target);
    if (n.chat) setOpenChat(n.chat);
  };

  const sendMessage = (chatId: string, text: string) => {
    const reply = CHATS.find((c) => c.id === chatId)?.reply[lang];
    touch();
    setChats((c) => ({ ...c, [chatId]: [...(c[chatId] ?? []), { me: true, text }] }));
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      if (reply) setChats((c) => ({ ...c, [chatId]: [...(c[chatId] ?? []), { me: false, text: reply }] }));
    }, 1400);
  };

  const toggleEvent = (id: string) => {
    touch();
    setSavedEvents((s) => {
      if (s.includes(id)) return s.filter((x) => x !== id);
      showToast(t.events.reminder);
      return [id, ...s];
    });
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (tab !== "discover" || mode !== "swipe" || (e.target as HTMLElement).closest("input, textarea")) return;
    if (e.key === "ArrowRight") { e.preventDefault(); decide("right"); }
    if (e.key === "ArrowLeft") { e.preventDefault(); decide("left"); }
    if (e.key.toLowerCase() === "z") { e.preventDefault(); undo(); }
  };

  const likeCount = (c: Card) => (likes[c.id] ?? c.likes);
  const likePost = (c: Card, force = false) => {
    touch();
    const on = liked.has(c.id);
    if (on && force) return; // Doppeltipp liked nur, entliked nie
    setLiked((s) => { const n = new Set(s); if (on) n.delete(c.id); else n.add(c.id); return n; });
    setLikes((l) => ({ ...l, [c.id]: likeCount(c) + (on ? -1 : 1) }));
  };

  return (
    <PhoneFrame label={t.region} time={t.status}>
      <div className="flex h-full flex-col" onKeyDown={onKeyDown} tabIndex={-1} data-testid="preview">
        {/* Push-Banner */}
        {notice && (
          <button type="button" onClick={() => openNotice(notice)} className="pv-drop absolute inset-x-2 top-1 z-50 flex items-center gap-3 rounded-2xl bg-white/95 p-3 text-left text-[#03203d] shadow-xl" data-testid="preview-notice">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground"><Bell className="size-4" aria-hidden /></span>
            <span className="min-w-0 text-sm">
              <span className="flex justify-between text-[0.65rem] font-semibold uppercase opacity-70"><span>{APP_NAME}</span><span>{t.now}</span></span>
              <span className="line-clamp-2 block leading-snug font-medium">{L(notice.text)}</span>
            </span>
          </button>
        )}
        <p className="sr-only" aria-live="polite">{notice ? L(notice.text) : ""}</p>

        <div className="relative min-h-0 flex-1">
          {tab === "discover" && (
            <Discover
              t={t} L={L} mode={mode} setMode={(m) => { touch(); setMode(m); }} filter={filter}
              setFilter={(f) => changeDeck(() => { touch(); setFilter(f); })}
              algo={algo}
              setAlgo={(a) => changeDeck(() => { touch(); setAlgo(a); showToast(a === "fresh" ? t.algo.freshHint : t.algo.forYouHint); })}
              deck={deck} index={index} decide={decide} undo={undo} canUndo={history.length > 0}
              showHint={!interacted} liked={liked} likeCount={likeCount} likePost={likePost}
              playing={playing} toggleAudio={toggleAudio}
            />
          )}
          {tab === "events" && <Events t={t} L={L} saved={savedEvents} toggle={toggleEvent} openTicket={(id) => { touch(); setTicket(id); }} />}
          {tab === "messages" && (
            <Messages t={t} chats={chats} openChat={openChat} setOpenChat={(id) => { touch(); setOpenChat(id); }} typing={typing} send={sendMessage} lang={lang} />
          )}
          {tab === "profile" && <Profile t={t} L={L} tab={profileTab} setTab={setProfileTab} onEdit={() => { touch(); showToast(t.profile.editHint); }} playing={playing} toggleAudio={toggleAudio} />}

          {/* Match-Screen */}
          {match && (
            <div role="dialog" aria-modal="true" aria-label={t.match.title} className="pv-fade absolute inset-0 z-40 flex flex-col items-center justify-center gap-5 bg-[var(--ink)]/95 p-6 text-center text-[var(--bone)]" data-testid="preview-match">
              <div className="flex -space-x-5">
                <span className="relative size-24 overflow-hidden rounded-full ring-4 ring-primary"><Photo name={PROFILE.image} sizes="96px" /></span>
                <span className="relative size-24 overflow-hidden rounded-full ring-4 ring-[var(--stone)]"><Photo name={match.image} sizes="96px" /></span>
              </div>
              <p className="poster text-4xl">{t.match.title}</p>
              <p className="text-sm text-white/80">{t.match.text.replace("{name}", match.title)}</p>
              <button type="button" onClick={() => { setMatch(null); setTab("messages"); setOpenChat(CHATS.some((c) => c.id === match.id) ? match.id : "mila"); }} className="meta h-11 w-full bg-primary text-primary-foreground">{t.match.write}</button>
              <button type="button" onClick={() => setMatch(null)} className="meta h-11 w-full border border-white/40">{t.match.later}</button>
            </div>
          )}

          {/* Ticket-Hinweis */}
          {ticket && (
            <div role="dialog" aria-modal="true" aria-label={t.ticket.title} className="pv-fade absolute inset-0 z-40 flex flex-col justify-center gap-4 bg-background p-6" data-testid="preview-ticket">
              <Ticket className="size-10 text-primary" aria-hidden />
              <p className="poster text-4xl">{t.ticket.title}</p>
              <p className="text-sm text-muted-foreground">{EVENTS.find((e) => e.id === ticket)?.title} · {t.ticket.text}</p>
              <button type="button" onClick={() => setTicket(null)} className="meta h-11 border border-foreground/30">{t.ticket.back}</button>
            </div>
          )}

          {/* Erstellen */}
          {createOpen && (
            <div className="absolute inset-0 z-40 flex flex-col justify-end bg-black/50" onClick={() => { setCreateOpen(false); setCreateItem(null); }}>
              <div role="dialog" aria-modal="true" aria-label={t.create.title} className="pv-sheet rounded-t-3xl bg-card p-5" onClick={(e) => e.stopPropagation()} data-testid="preview-create">
                {createItem === "backstage" ? (
                  <div className="space-y-4 text-center" data-testid="preview-backstage">
                    <span className="mx-auto grid size-14 place-items-center rounded-full bg-[var(--ink)] text-[var(--stone)]"><Lock className="size-6" aria-hidden /></span>
                    <p className="poster text-3xl">{t.backstage.title}</p>
                    <p className="text-sm text-muted-foreground">{t.backstage.text}</p>
                    <button type="button" onClick={() => { setCreateOpen(false); setCreateItem(null); }} className="meta h-11 w-full bg-primary text-primary-foreground">{t.backstage.close}</button>
                  </div>
                ) : createItem ? (
                  <div className="space-y-4">
                    <p className="poster text-3xl">{createItem}</p>
                    <div className="grid aspect-[4/3] place-items-center rounded-2xl border border-dashed text-muted-foreground"><Plus className="size-8" aria-hidden /></div>
                    <p className="text-sm text-muted-foreground">{t.create.previewText}</p>
                    <button type="button" onClick={() => { setCreateOpen(false); setCreateItem(null); }} className="meta h-11 w-full bg-primary text-primary-foreground">{t.create.close}</button>
                  </div>
                ) : (
                  <>
                    <p className="mb-3 font-semibold">{t.create.title}</p>
                    <ul className="grid grid-cols-5 gap-2">
                      {Object.values(t.create.items).map((label) => (
                        <li key={label}>
                          <button type="button" onClick={() => setCreateItem(label)} className="flex w-full flex-col items-center gap-1.5 rounded-xl border p-2 text-[0.7rem] hover:border-primary">
                            <span className="grid size-9 place-items-center rounded-full bg-primary/15 text-primary"><Plus className="size-4" aria-hidden /></span>{label}
                          </button>
                        </li>
                      ))}
                    </ul>
                    <button type="button" onClick={() => setCreateItem("backstage")} className="mt-3 flex w-full items-center gap-3 rounded-xl border bg-[var(--ink)] p-3 text-left text-sm text-[var(--bone)]" data-testid="preview-backstage-entry">
                      <Lock className="size-4 text-[var(--stone)]" aria-hidden />
                      <span className="flex-1 font-semibold">{t.backstage.label}</span>
                      <span className="meta text-[var(--stone)]">{t.backstage.title}</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Toast */}
          <div aria-live="polite" className="pointer-events-none absolute inset-x-3 bottom-2 z-30 flex justify-center">
            {toast && <p className="pv-fade rounded-xl bg-foreground px-3 py-2 text-center text-xs text-background shadow-lg" data-testid="preview-toast">{toast}</p>}
          </div>
        </div>

        {/* Tab-Leiste */}
        <nav aria-label={t.region} className="z-30 grid shrink-0 grid-cols-5 border-t bg-background/95 px-2 pt-1.5 pb-5">
          {([
            ["discover", Compass, t.tabs.discover],
            ["events", CalendarDays, t.tabs.events],
            ["create", Plus, t.tabs.create],
            ["messages", MessageCircle, t.tabs.messages],
            ["profile", User, t.tabs.profile],
          ] as const).map(([key, Icon, label]) => (
            <button
              key={key}
              type="button"
              aria-label={label}
              aria-current={tab === key ? "page" : undefined}
              onClick={() => { touch(); if (key === "create") setCreateOpen(true); else { setTab(key); setOpenChat(null); } }}
              className={cn("flex flex-col items-center gap-0.5 py-1 text-[0.6rem]", tab === key ? "text-primary" : "text-muted-foreground")}
            >
              {key === "create" ? <span className="grid size-8 place-items-center rounded-xl bg-primary text-primary-foreground"><Icon className="size-4" aria-hidden /></span> : <Icon className="size-5" aria-hidden />}
              {key !== "create" && label}
            </button>
          ))}
        </nav>
      </div>
    </PhoneFrame>
  );
}

// ---------------------------------------------------------------- Entdecken

type DiscoverProps = {
  t: UIText; L: (v: { de: string; en: string }) => string;
  mode: "swipe" | "scroll"; setMode: (m: "swipe" | "scroll") => void;
  filter: Filter; setFilter: (f: Filter) => void; algo: Algo; setAlgo: (a: Algo) => void;
  deck: Card[]; index: number; decide: (d: "left" | "right" | "save") => void; undo: () => void; canUndo: boolean;
  showHint: boolean; liked: Set<string>; likeCount: (c: Card) => number; likePost: (c: Card, force?: boolean) => void;
  playing: string | null; toggleAudio: (c: Card) => void;
};

function Discover(p: DiscoverProps) {
  const { t } = p;
  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0 space-y-2 px-3 pb-2">
        <div className="flex items-center justify-between gap-2">
          <p className="poster-wide text-sm">{APP_NAME}</p>
          <div role="group" aria-label="Modus" className="flex rounded-full border p-0.5 text-[0.7rem]">
            {(["swipe", "scroll"] as const).map((m) => (
              <button key={m} type="button" aria-pressed={p.mode === m} onClick={() => p.setMode(m)} className={cn("rounded-full px-2.5 py-1", p.mode === m && "bg-primary text-primary-foreground")}>{t.modes[m]}</button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto overscroll-x-contain pb-0.5 [scrollbar-width:none]">
          {FILTERS.map((f) => (
            <button key={f} type="button" aria-pressed={p.filter === f} onClick={() => p.setFilter(f)} className={cn("shrink-0 rounded-full border px-2.5 py-1 text-[0.7rem] whitespace-nowrap", p.filter === f ? "border-primary bg-primary text-primary-foreground" : "text-muted-foreground")}>{t.filters[f]}</button>
          ))}
        </div>
        <div role="group" aria-label="Algorithmus" className="grid grid-cols-2 rounded-lg bg-muted p-0.5 text-[0.7rem]">
          {(["forYou", "fresh"] as const).map((a) => (
            <button key={a} type="button" aria-pressed={p.algo === a} onClick={() => p.setAlgo(a)} className={cn("rounded-md py-1", p.algo === a ? "bg-card font-semibold text-foreground shadow" : "text-muted-foreground")}>{t.algo[a]}</button>
          ))}
        </div>
      </div>
      {p.mode === "swipe" ? <SwipeStack {...p} /> : <Feed {...p} />}
    </div>
  );
}

function SwipeStack(p: DiscoverProps) {
  const { t, L, deck, index } = p;
  const current = deck[index];
  const next = deck[index + 1];
  const [drag, setDrag] = useState({ x: 0, y: 0, active: false });
  const [leaving, setLeaving] = useState<"left" | "right" | null>(null);
  const start = useRef<{ x: number; y: number } | null>(null);

  const fly = (dir: "left" | "right" | "save") => {
    if (!current || leaving) return;
    setLeaving(dir === "left" ? "left" : "right");
    setTimeout(() => {
      p.decide(dir);
      setLeaving(null);
      setDrag({ x: 0, y: 0, active: false });
    }, 220);
  };

  const down = (e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest("button")) return;
    start.current = { x: e.clientX, y: e.clientY };
    e.currentTarget.setPointerCapture(e.pointerId);
    setDrag({ x: 0, y: 0, active: true });
  };
  const move = (e: React.PointerEvent) => {
    if (!start.current) return;
    setDrag({ x: e.clientX - start.current.x, y: (e.clientY - start.current.y) * 0.25, active: true });
  };
  const up = () => {
    if (!start.current) return;
    start.current = null;
    if (drag.x > THRESHOLD) fly("right");
    else if (drag.x < -THRESHOLD) fly("left");
    else setDrag({ x: 0, y: 0, active: false });
  };

  const x = leaving === "right" ? 520 : leaving === "left" ? -520 : drag.x;
  const likeOpacity = Math.max(0, Math.min(1, x / THRESHOLD));
  const nopeOpacity = Math.max(0, Math.min(1, -x / THRESHOLD));

  return (
    <div className="flex min-h-0 flex-1 flex-col px-3">
      <div className="relative min-h-0 flex-1 touch-pan-y select-none" data-testid="swipe-stack">
        {next && (
          <div aria-hidden className="absolute inset-0 scale-[0.95] opacity-70"><CardView card={next} L={L} /></div>
        )}
        {current ? (
          <div
            key={current.id}
            className={cn("pv-card absolute inset-0 cursor-grab active:cursor-grabbing", drag.active && !leaving && "pv-dragging")}
            style={{ transform: `translate(${x}px, ${drag.y}px) rotate(${x / 16}deg)` }}
            onPointerDown={down}
            onPointerMove={move}
            onPointerUp={up}
            onPointerCancel={up}
            data-testid="swipe-card"
            data-card={current.id}
          >
            <CardView card={current} L={L} playing={p.playing === current.id} onPlay={() => p.toggleAudio(current)} t={t} />
            <span aria-hidden className="meta pointer-events-none absolute top-14 left-5 -rotate-12 border-4 border-emerald-400 px-3 py-1 text-2xl text-emerald-400" style={{ opacity: likeOpacity }}>{t.like}</span>
            <span aria-hidden className="meta pointer-events-none absolute top-14 right-5 rotate-12 border-4 border-white px-3 py-1 text-2xl text-white" style={{ opacity: nopeOpacity }}>{t.nopeStamp}</span>
          </div>
        ) : (
          <div className="grid h-full place-items-center rounded-3xl border border-dashed p-6 text-center text-sm text-muted-foreground">{t.empty}</div>
        )}
        {p.showHint && current && (
          <p className="pv-pulse pointer-events-none absolute inset-x-6 top-[38%] z-20 rounded-full bg-[var(--bone)] px-3 py-2 text-center text-xs font-semibold text-[var(--ink)] shadow-lg" data-testid="preview-hint">→ {t.hint}</p>
        )}
      </div>
      <div className="flex shrink-0 items-center justify-center gap-3 py-3">
        <RoundButton label={t.actions.nope} onClick={() => fly("left")} disabled={!current}><X className="size-5" /></RoundButton>
        <RoundButton label={t.actions.undo} onClick={p.undo} disabled={!p.canUndo} small><RotateCcw className="size-4" /></RoundButton>
        <RoundButton label={t.actions.like} onClick={() => fly("right")} disabled={!current} primary><Heart className="size-5" /></RoundButton>
        <RoundButton label={t.actions.save} onClick={() => fly("save")} disabled={!current} small><Star className="size-4" /></RoundButton>
      </div>
    </div>
  );
}

function RoundButton({ label, onClick, disabled, primary, small, children }: { label: string; onClick: () => void; disabled?: boolean; primary?: boolean; small?: boolean; children: React.ReactNode }) {
  return (
    <button type="button" aria-label={label} title={label} onClick={onClick} disabled={disabled} className={cn("grid place-items-center rounded-full border transition-transform active:scale-90 disabled:opacity-40", small ? "size-10" : "size-13", primary ? "border-primary bg-primary text-primary-foreground" : "bg-card")}>
      <span aria-hidden className="contents">{children}</span>
    </button>
  );
}

function CardView({ card, L, playing, onPlay, t }: { card: Card; L: (v: { de: string; en: string }) => string; playing?: boolean; onPlay?: () => void; t?: UIText }) {
  return (
    <article className="relative h-full overflow-hidden rounded-3xl bg-[var(--ink)] text-[var(--bone)] shadow-xl">
      <Photo name={card.image} sizes="340px" className="pointer-events-none opacity-85" imgProps={{ draggable: false }} />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[var(--ink)] via-[var(--ink)]/20 to-transparent" />
      <div className="absolute top-3 left-3 flex gap-1.5">
        {card.badge && <span className="meta bg-primary px-2 py-1 whitespace-nowrap text-primary-foreground">{L(card.badge)}</span>}
        {card.fresh && <span className="meta bg-[var(--stone)] px-2 py-1 whitespace-nowrap text-[var(--ink)]">Newcomer</span>}
      </div>
      <div className="absolute inset-x-0 bottom-0 space-y-2 p-4">
        <p className="meta truncate text-white/75">{L(card.sub)}</p>
        <p className="poster line-clamp-2 text-[2.3rem]">{card.title}</p>
        <p className="line-clamp-2 text-sm text-white/85">{L(card.text)}</p>
        <div className="flex items-center gap-2">
          {card.tags.map((tag) => <span key={tag} className="rounded-full border border-white/30 px-2 py-0.5 text-[0.65rem]">{tag}</span>)}
          {card.price && <span className="ml-auto text-xs font-semibold text-[var(--stone)]">{L(card.price)}</span>}
        </div>
        {card.audio && onPlay && t && <AudioButton playing={!!playing} onClick={onPlay} t={t} />}
      </div>
    </article>
  );
}

function AudioButton({ playing, onClick, t }: { playing: boolean; onClick: () => void; t: UIText }) {
  return (
    <button type="button" onClick={onClick} aria-label={playing ? t.actions.pause : t.actions.play} aria-pressed={playing} className="flex w-full items-center gap-3 rounded-2xl bg-black/45 p-2 text-white backdrop-blur" data-testid="preview-play">
      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">{playing ? <Pause className="size-4" aria-hidden /> : <Play className="size-4" aria-hidden />}</span>
      <span aria-hidden className={cn("flex h-6 flex-1 items-center gap-[3px]", playing && "pv-wave")}>
        {Array.from({ length: 22 }, (_, i) => <span key={i} className="w-[3px] rounded-full bg-white/70" style={{ height: `${30 + ((i * 37) % 70)}%`, animationDelay: `${(i % 7) * 0.08}s` }} />)}
      </span>
    </button>
  );
}

function Feed(p: DiscoverProps) {
  const { L, t } = p;
  const [burst, setBurst] = useState<string | null>(null);
  const lastTap = useRef<{ id: string; at: number } | null>(null);
  // Doppeltipp-Erkennung über den Zeitstempel des Klick-Events
  const tap = (c: Card, now: number) => {
    if (lastTap.current?.id === c.id && now - lastTap.current.at < 320) {
      p.likePost(c, true);
      setBurst(c.id);
      setTimeout(() => setBurst(null), 700);
      lastTap.current = null;
    } else lastTap.current = { id: c.id, at: now };
  };
  return (
    <ul className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-3 pb-4 [scrollbar-width:none]" data-testid="preview-feed">
      {p.deck.map((c, i) => (
        <li key={c.id} className="overflow-hidden rounded-2xl border bg-card">
          <div className="flex items-center gap-2 px-3 py-2">
            <span className="relative size-7 overflow-hidden rounded-full"><Photo name={c.image} sizes="28px" /></span>
            <span className="min-w-0 flex-1 truncate text-xs font-semibold">{c.title}</span>
            <span className="meta text-primary">{c.kind === "music" || i % 4 === 2 ? "Reel" : t.filters[c.kind]}</span>
          </div>
          <button type="button" className={cn("relative block w-full", c.kind === "music" || i % 4 === 2 ? "aspect-[4/5]" : "aspect-square")} onClick={(e) => tap(c, e.timeStamp)} aria-label={`${c.title}: ${t.actions.likePost}`} data-testid="feed-image">
            <Photo name={c.image} sizes="340px" imgProps={{ draggable: false }} />
            {c.badge && <span className="meta absolute top-2 left-2 bg-primary px-2 py-1 text-primary-foreground">{L(c.badge)}</span>}
            {burst === c.id && <Heart aria-hidden className="pv-burst absolute top-1/2 left-1/2 size-20 -translate-x-1/2 -translate-y-1/2 fill-white text-white" />}
          </button>
          <div className="space-y-2 p-3">
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => p.likePost(c)} aria-pressed={p.liked.has(c.id)} aria-label={t.actions.likePost} className="flex items-center gap-1 text-xs" data-testid="feed-like">
                <Heart className={cn("size-5", p.liked.has(c.id) && "fill-primary text-primary")} aria-hidden />
                <span data-testid="feed-like-count">{p.likeCount(c)}</span>
              </button>
              <MessageCircle className="size-5" aria-hidden />
              <Bookmark className="ml-auto size-5" aria-hidden />
            </div>
            <p className="text-xs"><span className="font-semibold">{c.title}</span> {L(c.text)}</p>
            {c.audio && <AudioButton playing={p.playing === c.id} onClick={() => p.toggleAudio(c)} t={t} />}
          </div>
        </li>
      ))}
    </ul>
  );
}

// ---------------------------------------------------------------- Events

function Events({ t, L, saved, toggle, openTicket }: { t: UIText; L: (v: { de: string; en: string }) => string; saved: string[]; toggle: (id: string) => void; openTicket: (id: string) => void }) {
  const mine = saved.map((id) => EVENTS.find((e) => e.id === id)!).filter(Boolean);
  return (
    <div className="h-full space-y-4 overflow-y-auto overscroll-contain px-3 pb-4 [scrollbar-width:none]" data-testid="preview-events">
      {mine.length > 0 && (
        <section>
          <h3 className="meta mb-2 text-primary">{t.events.yours}</h3>
          <ul className="flex gap-2 overflow-x-auto [scrollbar-width:none]" data-testid="preview-my-events">
            {mine.map((e) => (
              <li key={e.id} className="w-36 shrink-0 rounded-xl border bg-card p-2 text-xs">
                <p className="font-semibold">{e.title}</p>
                <p className="text-muted-foreground">{L(e.countdown)}</p>
              </li>
            ))}
          </ul>
        </section>
      )}
      <section>
        <h3 className="meta mb-2 text-muted-foreground">{t.events.all}</h3>
        <ul className="space-y-3">
          {EVENTS.map((e) => {
            const on = saved.includes(e.id);
            return (
              <li key={e.id} className="overflow-hidden rounded-2xl border bg-card" data-testid="preview-event">
                <div className="relative aspect-[16/9]">
                  <Photo name={e.image} sizes="340px" />
                  <div className="absolute top-2 left-2 flex gap-1.5">
                    <span className="meta bg-primary px-2 py-1 whitespace-nowrap text-primary-foreground">{L(e.countdown)}</span>
                    {e.tickets && <span className="meta bg-[var(--bone)] px-2 py-1 whitespace-nowrap text-[var(--ink)]">{L(e.tickets)}</span>}
                  </div>
                </div>
                <div className="space-y-1 p-3">
                  <p className="meta text-muted-foreground">{L(e.type)}</p>
                  <p className="truncate font-semibold">{e.title}</p>
                  <p className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><CalendarDays className="size-3.5" aria-hidden />{L(e.date)}</span>
                    <span className="flex min-w-0 items-center gap-1 truncate"><MapPin className="size-3.5 shrink-0" aria-hidden />{e.place}</span>
                  </p>
                  <div className="flex gap-2 pt-2">
                    <button type="button" onClick={() => toggle(e.id)} aria-pressed={on} className={cn("meta flex h-9 flex-1 items-center justify-center gap-1.5 border", on ? "border-primary text-primary" : "")} data-testid="preview-event-save">
                      <Star className={cn("size-3.5", on && "fill-current")} aria-hidden />{on ? t.events.saved : t.events.save}
                    </button>
                    <button type="button" onClick={() => openTicket(e.id)} className="meta flex h-9 flex-1 items-center justify-center gap-1.5 bg-primary text-primary-foreground">
                      <Ticket className="size-3.5" aria-hidden />{t.events.tickets}
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

// ---------------------------------------------------------------- Nachrichten

function Messages({ t, chats, openChat, setOpenChat, typing, send, lang }: { t: UIText; chats: Record<string, Msg[]>; openChat: string | null; setOpenChat: (id: string | null) => void; typing: boolean; send: (id: string, text: string) => void; lang: Locale }) {
  const [draft, setDraft] = useState("");
  const list = useRef<HTMLDivElement>(null);
  const chat = CHATS.find((c) => c.id === openChat);
  const messages = openChat ? chats[openChat] ?? [] : [];
  useEffect(() => {
    list.current?.scrollTo({ top: list.current.scrollHeight });
  }, [messages.length, typing]);

  if (!chat) {
    return (
      <div className="h-full overflow-y-auto px-3" data-testid="preview-chats">
        <h3 className="poster mb-3 text-3xl">{t.messages.title}</h3>
        <ul className="divide-y">
          {CHATS.map((c) => (
            <li key={c.id}>
              <button type="button" onClick={() => setOpenChat(c.id)} className="flex w-full items-center gap-3 py-3 text-left">
                <span className="relative size-11 shrink-0 overflow-hidden rounded-full"><Photo name={c.image} sizes="44px" /></span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2 text-sm font-semibold">{c.name}{c.request && <span className="meta bg-[var(--stone)] px-1.5 py-0.5 text-[var(--ink)]">{t.messages.requests}</span>}</span>
                  <span className="block truncate text-xs text-muted-foreground">{(chats[c.id] ?? []).at(-1)?.text ?? c.preview[lang]}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    );
  }
  return (
    <div className="flex h-full flex-col" data-testid="preview-chat">
      <div className="flex shrink-0 items-center gap-2 border-b px-2 pb-2">
        <button type="button" onClick={() => setOpenChat(null)} aria-label={t.messages.back} className="grid size-8 place-items-center"><ChevronLeft className="size-5" aria-hidden /></button>
        <span className="relative size-8 overflow-hidden rounded-full"><Photo name={chat.image} sizes="32px" /></span>
        <span className="truncate text-sm font-semibold">{chat.name}</span>
      </div>
      <div ref={list} className="min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain p-3" aria-live="polite">
        {messages.map((m, i) => (
          <p key={i} className={cn("max-w-[80%] rounded-2xl px-3 py-2 text-sm", m.me ? "ml-auto rounded-br-sm bg-primary text-primary-foreground" : "rounded-bl-sm bg-muted")} data-testid={m.me ? "msg-me" : "msg-them"}>{m.text}</p>
        ))}
        {typing && <p className="text-xs text-muted-foreground">{chat.name} {t.messages.typing}</p>}
      </div>
      <form
        className="flex shrink-0 gap-2 border-t p-2"
        onSubmit={(e) => {
          e.preventDefault();
          const text = draft.trim();
          if (!text) return;
          send(chat.id, text);
          setDraft("");
        }}
      >
        <label className="sr-only" htmlFor="pv-msg">{t.messages.placeholder}</label>
        <input id="pv-msg" value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={t.messages.placeholder} className="h-10 min-w-0 flex-1 rounded-full border bg-transparent px-4 text-sm focus-visible:border-primary focus-visible:outline-none" autoComplete="off" />
        <button type="submit" aria-label={t.messages.send} className="grid size-10 place-items-center rounded-full bg-primary text-primary-foreground"><Send className="size-4" aria-hidden /></button>
      </form>
    </div>
  );
}

// ---------------------------------------------------------------- Profil

function Profile({ t, L, tab, setTab, onEdit, playing, toggleAudio }: { t: UIText; L: (v: { de: string; en: string }) => string; tab: "posts" | "tracks" | "events"; setTab: (x: "posts" | "tracks" | "events") => void; onEdit: () => void; playing: string | null; toggleAudio: (c: Card) => void }) {
  return (
    <div className="h-full overflow-y-auto overscroll-contain px-3 pb-4 [scrollbar-width:none]" data-testid="preview-profile">
      <div className="flex items-center gap-4">
        <span className="relative size-20 shrink-0 overflow-hidden rounded-full ring-2 ring-primary ring-offset-2 ring-offset-background"><Photo name={PROFILE.image} sizes="80px" /></span>
        <dl className="grid flex-1 grid-cols-3 text-center">
          {PROFILE.stats.map((s) => (
            <div key={s.value}><dt className="sr-only">{L(s.label)}</dt><dd className="font-semibold">{s.value}</dd><dd aria-hidden className="text-[0.65rem] text-muted-foreground">{L(s.label)}</dd></div>
          ))}
        </dl>
      </div>
      <p className="mt-3 flex flex-wrap items-center gap-x-2 text-sm font-semibold">{PROFILE.name} <span className="meta inline-flex items-center gap-1 bg-primary/15 px-1.5 py-0.5 whitespace-nowrap text-primary" data-testid="preview-verified"><BadgeCheck className="size-3.5" aria-hidden />{t.verified}</span> <span className="font-normal text-muted-foreground">{PROFILE.handle}</span></p>
      <p className="text-xs text-muted-foreground">{L(PROFILE.bio)}</p>
      <button type="button" onClick={onEdit} className="meta mt-3 h-8 w-full border">{t.profile.edit}</button>
      <ul className="mt-4 flex gap-3 overflow-x-auto [scrollbar-width:none]">
        {PROFILE.highlights.map((h, i) => (
          <li key={h.de} className="flex shrink-0 flex-col items-center gap-1 text-[0.65rem]">
            <span className="relative size-14 overflow-hidden rounded-full ring-2 ring-[var(--stone)]"><Photo name={PROFILE.grid[i]} sizes="56px" /></span>{L(h)}
          </li>
        ))}
      </ul>
      <div role="tablist" className="mt-4 grid grid-cols-3 border-b text-xs">
        {(["posts", "tracks", "events"] as const).map((k) => (
          <button key={k} role="tab" type="button" aria-selected={tab === k} onClick={() => setTab(k)} className={cn("py-2", tab === k ? "border-b-2 border-primary font-semibold" : "text-muted-foreground")}>{t.profile[k]}</button>
        ))}
      </div>
      {tab === "posts" && (
        <ul className="mt-1 grid grid-cols-3 gap-0.5">
          {PROFILE.grid.map((img, i) => <li key={i} className="relative aspect-square"><Photo name={img} sizes="110px" /></li>)}
        </ul>
      )}
      {tab === "tracks" && (
        <ul className="mt-3 space-y-2">
          {PROFILE.tracks.map((id) => {
            const c = CARDS.find((x) => x.id === id)!;
            return <li key={id} className="rounded-2xl border bg-card p-2"><p className="mb-2 px-1 text-sm font-semibold">{c.title}</p><AudioButton playing={playing === c.id} onClick={() => toggleAudio(c)} t={t} /></li>;
          })}
        </ul>
      )}
      {tab === "events" && (
        <ul className="mt-3 space-y-2">
          {EVENTS.slice(0, 2).map((e) => <li key={e.id} className="rounded-xl border bg-card p-3 text-sm"><p className="font-semibold">{e.title}</p><p className="text-xs text-muted-foreground">{L(e.date)} · {e.place}</p></li>)}
        </ul>
      )}
    </div>
  );
}
