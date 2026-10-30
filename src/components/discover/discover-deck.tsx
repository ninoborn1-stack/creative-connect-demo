"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { ArrowUpRight, Heart, Layers, LayoutList, RotateCcw, Trash2, X } from "lucide-react";
import { StockImage } from "@/components/stock-image";
import { AudioPlayer } from "@/components/members/audio-player";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type DiscoverKind = "artist" | "werk" | "paket" | "studio";

export type DiscoverItem = {
  key: string;
  kind: DiscoverKind;
  title: string;
  subtitle: string;
  text: string;
  tags: string[];
  image: string;
  audio?: string;
  price?: string;
  href: string;
  cta: string;
};

const KIND_LABEL: Record<DiscoverKind, string> = { artist: "Artist", werk: "Musik & Stock", paket: "Paket", studio: "Studio" };
const FILTERS: { key: DiscoverKind | "alle"; label: string }[] = [
  { key: "alle", label: "Alles" },
  { key: "artist", label: "Artists" },
  { key: "werk", label: "Musik & Stock" },
  { key: "paket", label: "Pakete" },
  { key: "studio", label: "Studios" },
];
const STORAGE_KEY = "cc-entdecken-gemerkt";
const THRESHOLD = 110;

type Mode = "swipe" | "feed" | "gemerkt";

// Gemerktes als kleiner Store über localStorage (Fallback im Speicher, z. B. im privaten Modus)
let memory = "[]";
const listeners = new Set<() => void>();
function readRaw() {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? memory;
  } catch {
    return memory;
  }
}
function writeSaved(keys: string[]) {
  memory = JSON.stringify(keys);
  try {
    localStorage.setItem(STORAGE_KEY, memory);
  } catch {
    /* nur für diese Sitzung */
  }
  listeners.forEach((l) => l());
}
function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}
function parseKeys(raw: string): string[] {
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

// Swipe-Stapel im Tinder-Stil plus Feed im Instagram-Stil; Gemerktes bleibt im Browser (localStorage)
// demo: kompakte Variante für die Startseite (im Handy-Rahmen, ohne Feed/Filter/Tastatur) – Gemerktes landet im selben Speicher wie in der App
export function DiscoverDeck({ items, demo = false }: { items: DiscoverItem[]; demo?: boolean }) {
  const [mode, setMode] = useState<Mode>("swipe");
  const [filter, setFilter] = useState<DiscoverKind | "alle">("alle");
  const [index, setIndex] = useState(0);
  const [history, setHistory] = useState<number[]>([]);
  const raw = useSyncExternalStore(subscribe, readRaw, () => "[]");
  const saved = useMemo(() => parseKeys(raw), [raw]);
  const [drag, setDrag] = useState({ x: 0, y: 0, active: false });
  const [leaving, setLeaving] = useState<"links" | "rechts" | null>(null);
  const start = useRef<{ x: number; y: number } | null>(null);

  const persist = useCallback((next: string[]) => writeSaved(next), []);

  const toggleSave = useCallback((key: string) => {
    persist(saved.includes(key) ? saved.filter((k) => k !== key) : [...saved, key]);
  }, [saved, persist]);

  const deck = useMemo(() => (filter === "alle" ? items : items.filter((i) => i.kind === filter)), [items, filter]);
  const current = deck[index];
  const next = deck[index + 1];
  const savedItems = useMemo(() => saved.map((k) => items.find((i) => i.key === k)).filter((i): i is DiscoverItem => Boolean(i)), [saved, items]);
  const kinds = new Set(items.map((i) => i.kind));

  const decide = useCallback((dir: "links" | "rechts") => {
    if (!current || leaving) return;
    if (dir === "rechts" && !saved.includes(current.key)) persist([...saved, current.key]);
    setLeaving(dir);
    setTimeout(() => {
      setHistory((h) => [...h, index]);
      setIndex((i) => i + 1);
      setLeaving(null);
      setDrag({ x: 0, y: 0, active: false });
    }, 260);
  }, [current, leaving, saved, persist, index]);

  function undo() {
    const prev = history.at(-1);
    if (prev === undefined) return;
    setHistory((h) => h.slice(0, -1));
    setIndex(prev);
  }

  useEffect(() => {
    if (mode !== "swipe" || demo) return;
    function onKey(e: KeyboardEvent) {
      if ((e.target as HTMLElement)?.closest("input, textarea, select, [role=slider]")) return;
      if (e.key === "ArrowRight") decide("rechts");
      if (e.key === "ArrowLeft") decide("links");
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mode, decide, demo]);

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if ((e.target as HTMLElement).closest("[data-no-drag], a, button")) return;
    start.current = { x: e.clientX, y: e.clientY };
    e.currentTarget.setPointerCapture(e.pointerId);
    setDrag({ x: 0, y: 0, active: true });
  }
  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!start.current) return;
    setDrag({ x: e.clientX - start.current.x, y: (e.clientY - start.current.y) * 0.3, active: true });
  }
  function onPointerUp() {
    if (!start.current) return;
    start.current = null;
    if (drag.x > THRESHOLD) decide("rechts");
    else if (drag.x < -THRESHOLD) decide("links");
    else setDrag({ x: 0, y: 0, active: false });
  }

  const offsetX = leaving === "rechts" ? 700 : leaving === "links" ? -700 : drag.x;
  const hint = leaving ?? (drag.x > 40 ? "rechts" : drag.x < -40 ? "links" : null);

  return (
    <div className={cn(demo ? "flex h-full flex-col" : "space-y-5")}>
      {demo ? (
        <div className="flex items-center justify-between gap-3 px-1 pb-3">
          <p className="text-lg font-semibold">{mode === "gemerkt" ? "Gemerkt" : "Entdecken"}</p>
          <button type="button" onClick={() => setMode(mode === "gemerkt" ? "swipe" : "gemerkt")} aria-pressed={mode === "gemerkt"}
            className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm hover:border-primary/50" data-testid="demo-saved">
            <Heart className={cn("size-4", savedItems.length > 0 && "fill-primary text-primary")} aria-hidden />{mode === "gemerkt" ? "Zurück" : `${savedItems.length} gemerkt`}
          </button>
        </div>
      ) : (
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div role="tablist" aria-label="Ansicht" className="inline-flex rounded-full border p-1">
          {([
            ["swipe", "Swipe", Layers],
            ["feed", "Feed", LayoutList],
            ["gemerkt", `Gemerkt (${savedItems.length})`, Heart],
          ] as const).map(([key, label, Icon]) => (
            <button key={key} role="tab" type="button" aria-selected={mode === key} onClick={() => setMode(key)}
              className={cn("inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm transition-colors", mode === key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>
              <Icon className="size-4" aria-hidden />{label}
            </button>
          ))}
        </div>
        {mode !== "gemerkt" && (
          <div className="-mx-4 flex w-[calc(100%+2rem)] gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:w-auto sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0" aria-label="Filter">
            {FILTERS.filter((f) => f.key === "alle" || kinds.has(f.key)).map((f) => (
              <button key={f.key} type="button" aria-pressed={filter === f.key} onClick={() => { setFilter(f.key); setIndex(0); setHistory([]); }}
                className={cn("shrink-0 rounded-full border px-3.5 py-1.5 text-sm transition-colors", filter === f.key ? "border-primary bg-primary/10 text-primary" : "hover:border-primary/50")}>
                {f.label}
              </button>
            ))}
          </div>
        )}
      </div>
      )}

      {mode === "swipe" && (
        <div className={cn("mx-auto w-full", demo ? "flex flex-1 flex-col" : "max-w-md")}>
          <div className={cn("relative select-none", demo ? "flex-1" : "h-[clamp(320px,calc(100svh-28rem),620px)] sm:h-[clamp(420px,calc(100svh-22rem),620px)]")}>
            {next && (
              <div className="absolute inset-0 scale-[0.96] opacity-60" aria-hidden>
                <DiscoverCard item={next} />
              </div>
            )}
            {current ? (
              <div
                key={current.key}
                className="absolute inset-0 touch-pan-y cursor-grab active:cursor-grabbing"
                style={{
                  transform: `translate(${offsetX}px, ${drag.y}px) rotate(${offsetX / 18}deg)`,
                  transition: drag.active && !leaving ? "none" : "transform 260ms ease-out",
                }}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
                data-testid="swipe-card"
              >
                <DiscoverCard item={current} saved={saved.includes(current.key)} />
                <span aria-hidden className={cn("meta pointer-events-none absolute top-6 left-6 -rotate-12 border-2 border-emerald-400 px-3 py-1 text-lg text-emerald-400 transition-opacity", hint === "rechts" ? "opacity-100" : "opacity-0")}>Merken</span>
                <span aria-hidden className={cn("meta pointer-events-none absolute top-6 right-6 rotate-12 border-2 border-white/80 px-3 py-1 text-lg text-white/80 transition-opacity", hint === "links" ? "opacity-100" : "opacity-0")}>Weiter</span>
              </div>
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-4 rounded-2xl border border-dashed p-8 text-center">
                <p className="text-lg font-semibold">Alles gesehen.</p>
                <p className="text-sm text-muted-foreground">{savedItems.length > 0 ? `${savedItems.length} gemerkt – schau sie dir in Ruhe an.` : "Starte neu oder wechsle in den Feed."}</p>
                <div className="flex flex-wrap justify-center gap-2">
                  <Button variant="outline" onClick={() => { setIndex(0); setHistory([]); }}><RotateCcw aria-hidden />Von vorn</Button>
                  {savedItems.length > 0 && <Button onClick={() => setMode("gemerkt")}><Heart aria-hidden />Gemerkt ansehen</Button>}
                  {demo && <Button asChild variant="outline"><Link href="/entdecken">In der App weiter</Link></Button>}
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 flex items-center justify-center gap-4">
            <Button variant="outline" size="icon" className="size-11 rounded-full" onClick={undo} disabled={history.length === 0} aria-label="Zurück"><RotateCcw aria-hidden /></Button>
            <Button variant="outline" size="icon" className="size-14 rounded-full" onClick={() => decide("links")} disabled={!current} aria-label="Weiter"><X className="size-6" aria-hidden /></Button>
            <Button size="icon" className="size-14 rounded-full" onClick={() => decide("rechts")} disabled={!current} aria-label="Merken"><Heart className="size-6" aria-hidden /></Button>
            {current && (
              <Button asChild variant="outline" size="icon" className="size-11 rounded-full"><Link href={current.href} aria-label={`${current.title} öffnen`}><ArrowUpRight aria-hidden /></Link></Button>
            )}
          </div>
          <p className="mt-3 text-center text-xs text-muted-foreground" aria-live="polite">
            {current ? `${index + 1} von ${deck.length}` : `${deck.length} angesehen`} · {demo ? "Karte ziehen oder tippen" : "Tastatur: ← weiter, → merken"}
          </p>
        </div>
      )}

      {mode === "feed" && (
        <ul className="mx-auto grid max-w-xl grid-cols-[minmax(0,1fr)] gap-6" aria-label="Feed">
          {deck.map((item) => (
            <li key={item.key}>
              <FeedPost item={item} saved={saved.includes(item.key)} onToggle={() => toggleSave(item.key)} />
            </li>
          ))}
        </ul>
      )}

      {mode === "gemerkt" && (
        savedItems.length === 0 ? (
          <div className="rounded-2xl border border-dashed p-10 text-center">
            <p className="font-semibold">Noch nichts gemerkt.</p>
            <p className="mt-1 text-sm text-muted-foreground">Wisch im Swipe nach rechts oder tipp im Feed aufs Herz.</p>
            <Button className="mt-4" onClick={() => setMode("swipe")}><Layers aria-hidden />Loswischen</Button>
          </div>
        ) : (
          <ul className={cn("grid gap-3", demo ? "overflow-y-auto" : "sm:grid-cols-2 lg:grid-cols-3")} aria-label="Gemerkt">
            {savedItems.map((item) => (
              <li key={item.key} className="flex gap-3 rounded-xl border bg-card p-3">
                <div className="relative size-20 shrink-0 overflow-hidden rounded-lg bg-muted">
                  <StockImage seed={item.image} w={200} h={200} sizes="80px" />
                </div>
                <div className="flex min-w-0 flex-1 flex-col">
                  <p className="meta text-primary">{KIND_LABEL[item.kind]}</p>
                  <p className="truncate font-semibold">{item.title}</p>
                  <p className="truncate text-xs text-muted-foreground">{item.price ?? item.subtitle}</p>
                  <div className="mt-auto flex items-center gap-2 pt-1">
                    <Link href={item.href} className="text-sm font-medium text-primary hover:underline">{item.cta}</Link>
                    <button type="button" onClick={() => toggleSave(item.key)} className="ml-auto text-muted-foreground hover:text-foreground" aria-label={`${item.title} entfernen`}>
                      <Trash2 className="size-4" aria-hidden />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )
      )}
    </div>
  );
}

// Vollbild-Karte für den Swipe-Stapel
function DiscoverCard({ item, saved }: { item: DiscoverItem; saved?: boolean }) {
  return (
    <article className="relative h-full overflow-hidden rounded-2xl border bg-[var(--ink)] text-[var(--bone)] shadow-xl">
      <StockImage seed={item.image} w={900} h={1200} sizes="(max-width: 640px) 100vw, 448px" className="pointer-events-none opacity-85" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[var(--ink)] via-[var(--ink)]/40 to-transparent" />
      <div className="absolute top-4 left-4 flex gap-1.5">
        <span className="meta bg-[var(--signal)] px-2 py-1 text-white">{KIND_LABEL[item.kind]}</span>
        {saved && <span className="meta inline-flex items-center gap-1 bg-white/90 px-2 py-1 text-[var(--ink)]"><Heart className="size-3 fill-current" aria-hidden />Gemerkt</span>}
      </div>
      <div className="absolute inset-x-0 bottom-0 space-y-3 p-5">
        <p className="meta text-white/70">{item.subtitle}</p>
        <h2 className="poster text-[clamp(2rem,8vw,3rem)] leading-[0.95]">{item.title}</h2>
        <p className="line-clamp-2 text-sm text-white/80">{item.text}</p>
        {item.tags.length > 0 && (
          <ul className="flex flex-wrap gap-1.5">
            {item.tags.map((t) => <li key={t} className="rounded-full border border-white/25 px-2.5 py-0.5 text-xs text-white/85">{t}</li>)}
          </ul>
        )}
        {item.audio && (
          <div data-no-drag>
            <AudioPlayer src={item.audio} title={item.title} subtitle="Hörprobe" className="border-white/15 bg-black/50 text-white backdrop-blur" />
          </div>
        )}
        <div className="flex items-center justify-between gap-3 pt-1">
          {item.price && <p className="meta text-[var(--signal)]">{item.price}</p>}
          <Link href={item.href} className="meta ml-auto inline-flex items-center gap-1 border border-white/40 px-3 py-2 text-white hover:bg-white hover:text-[var(--ink)]">
            {item.cta}<ArrowUpRight className="size-3.5" aria-hidden />
          </Link>
        </div>
      </div>
    </article>
  );
}

// Beitrag im Feed (Instagram-Stil)
function FeedPost({ item, saved, onToggle }: { item: DiscoverItem; saved: boolean; onToggle: () => void }) {
  return (
    <article className="overflow-hidden rounded-2xl border bg-card">
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <div className="min-w-0">
          <p className="truncate font-semibold">{item.title}</p>
          <p className="truncate text-xs text-muted-foreground">{item.subtitle}</p>
        </div>
        <span className="meta shrink-0 text-primary">{KIND_LABEL[item.kind]}</span>
      </div>
      <Link href={item.href} className="relative block aspect-[4/5] bg-muted" tabIndex={-1} aria-hidden>
        <StockImage seed={item.image} w={900} h={1125} sizes="(max-width: 640px) 100vw, 576px" />
      </Link>
      <div className="space-y-3 p-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={onToggle} aria-pressed={saved} aria-label={saved ? `${item.title} nicht mehr merken` : `${item.title} merken`}>
            <Heart className={cn("size-5", saved && "fill-primary text-primary")} aria-hidden />
          </Button>
          {item.price && <p className="text-sm font-medium">{item.price}</p>}
          <Button asChild size="sm" className="ml-auto"><Link href={item.href}>{item.cta}</Link></Button>
        </div>
        {item.audio && <AudioPlayer src={item.audio} title={item.title} subtitle="Hörprobe" />}
        <p className="text-sm text-muted-foreground">{item.text}</p>
        {item.tags.length > 0 && <p className="text-sm text-primary">{item.tags.map((t) => `#${t.replace(/\s+/g, "")}`).join(" ")}</p>}
      </div>
    </article>
  );
}
