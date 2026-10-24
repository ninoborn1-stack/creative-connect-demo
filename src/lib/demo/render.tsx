"use client";

/* eslint-disable @typescript-eslint/no-explicit-any -- Seiten-/Layout-Module werden generisch aufgerufen */
// Seiten-Renderer der Browser-Demo: ruft die unveränderten (async) Server-Seiten und -Layouts im Browser auf,
// löst den Elementbaum auf und rendert ihn. Lädt neu bei Navigation und nach Actions („revalidatePath“).
import { createContext, createElement, startTransition, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { BASE_PATH, TITLE_TEMPLATE, stripBase, withBase } from "./config";
import { navSignal, navigate, onRefresh, setNavigator } from "./events";
import { resolveTree } from "./resolve";
import { getNotFoundView, isUnknownDynamicPath, matchDemoRoute, type DemoModule, type DemoParams, type DemoSegmentFile } from "./routes";
import { runRouteHandler } from "./downloads";
import { installFetchPatch } from "./fetch-patch";

installFetchPatch();

type State = { node: ReactNode } | { notFound: true } | { error: string } | null;

// ------------------------------------------------------------------ Laufzeit (Navigation, Klicks)

let clicksInstalled = false;

function installClickHandler() {
  if (clicksInstalled || typeof window === "undefined") return;
  clicksInstalled = true;
  window.addEventListener(
    "click",
    (ev) => {
      if (ev.defaultPrevented || ev.button !== 0 || ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey) return;
      const a = (ev.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a || (a.target && a.target !== "_self")) return;
      const url = new URL(a.href, window.location.href);
      if (url.origin !== window.location.origin || (url.protocol !== "http:" && url.protocol !== "https:")) return;
      const path = stripBase(url.pathname);
      const handler = matchDemoRoute(path, "route");
      if (handler) {
        ev.preventDefault();
        ev.stopPropagation();
        void runRouteHandler(handler.route, handler.params, url);
        return;
      }
      // rohe Links ohne basePath (z. B. <a href="/profil"> in Client-Komponenten)
      if (BASE_PATH && path === url.pathname) {
        if (a.hasAttribute("download")) {
          a.href = withBase(url.pathname) + url.search + url.hash;
          return;
        }
        ev.preventDefault();
        ev.stopPropagation();
        navigate(url.pathname + url.search + url.hash);
      }
    },
    true,
  );
}

function useDemoRuntime() {
  const router = useRouter();
  useEffect(() => {
    installClickHandler();
    setNavigator((url, mode) => {
      if (/^[a-z]+:/i.test(url)) return window.location.assign(url);
      const target = new URL(withBase(url), window.location.href);
      if (target.pathname + target.search === window.location.pathname + window.location.search) return;
      // keine statische Datei (im Browser angelegter Datensatz) → direkt hart laden, 404.html rendert die Seite
      if (isUnknownDynamicPath(stripBase(target.pathname))) return window.location.assign(target.href);
      if (mode === "replace") router.replace(url);
      else router.push(url);
    });
  }, [router]);
}

// ------------------------------------------------------------------ Bausteine

export function DemoSkeleton() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-4 px-4 py-8" aria-busy="true" aria-label="Wird geladen">
      <Skeleton className="h-8 w-56" />
      <Skeleton className="h-4 w-80 max-w-full" />
      <div className="grid gap-4 pt-2 sm:grid-cols-2 lg:grid-cols-3">
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>
    </div>
  );
}

export function DemoNotFound() {
  const [custom, setCustom] = useState<ReactNode>(null);
  useEffect(() => {
    const view = getNotFoundView();
    if (!view) return;
    let cancelled = false;
    view
      .load()
      .then(async (m) => (view.client ? createElement(m.default) : resolveTree(m.default({}))))
      .then((n) => !cancelled && setCustom(n))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);
  if (custom) return <>{custom}</>;
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-20 text-center">
      <p className="text-sm font-medium text-primary">404</p>
      <h1 className="text-2xl font-semibold">Seite nicht gefunden</h1>
      <p className="text-sm text-muted-foreground">Diese Seite gibt es nicht (mehr) – oder sie ist für deine Demo-Rolle nicht sichtbar.</p>
      <Button asChild>
        <Link href="/">Zur Startseite</Link>
      </Button>
    </div>
  );
}

function ErrorView({ message }: { message: string }) {
  return (
    <div role="alert" className="mx-auto max-w-xl rounded-xl border border-destructive/40 bg-card p-6 text-sm">
      <h1 className="mb-2 text-lg font-semibold">Diese Ansicht konnte nicht geladen werden</h1>
      <p className="text-muted-foreground">{message}</p>
    </div>
  );
}

function render(state: State) {
  if (!state) return <DemoSkeleton />;
  if ("notFound" in state) return <DemoNotFound />;
  if ("error" in state) return <ErrorView message={state.error} />;
  return <>{state.node}</>;
}

function setTitle(meta: any) {
  const t = meta?.title;
  if (!t) return;
  if (typeof t === "string") document.title = TITLE_TEMPLATE.replace("%s", t);
  else if (t.absolute) document.title = t.absolute;
  else if (t.default) document.title = t.default;
}

function toRecord(sp: URLSearchParams) {
  const out: Record<string, string | string[]> = {};
  sp.forEach((v, k) => {
    const cur = out[k];
    out[k] = cur === undefined ? v : Array.isArray(cur) ? [...cur, v] : [cur, v];
  });
  return out;
}

// Ruft load() auf, löst den Baum auf; neu bei pathname-/key-Wechsel und Refresh-Ereignis
function useResolved(load: () => unknown, key: string): State {
  const pathname = usePathname();
  const [state, setState] = useState<State>(null);
  const [tick, setTick] = useState(0);
  const seq = useRef(0);
  const loadRef = useRef(load);
  useEffect(() => {
    loadRef.current = load;
  });
  useEffect(() => onRefresh(() => setTick((t) => t + 1)), []);
  useEffect(() => {
    const id = ++seq.current;
    (async () => {
      try {
        const node = await resolveTree((await loadRef.current()) as ReactNode);
        // wie router.refresh() als Transition: verschränkt sich mit laufenden Action-Transitions (ein Commit)
        if (id === seq.current) startTransition(() => setState({ node }));
      } catch (e) {
        if (id !== seq.current) return;
        const signal = navSignal(e);
        if (signal?.type === "redirect") navigate(signal.url, "replace");
        else if (signal?.type === "notFound") setState({ notFound: true });
        else {
          console.error(e);
          setState({ error: e instanceof Error ? e.message : String(e) });
        }
      }
    })();
  }, [pathname, key, tick]);
  return state;
}

// ------------------------------------------------------------------ Seite & Layout

export function DemoPage({ mod, params }: { mod: DemoModule; params?: DemoParams }) {
  useDemoRuntime();
  const routeParams = useParams() as DemoParams | null;
  const searchParams = useSearchParams();
  const p = params ?? routeParams ?? {};
  const spKey = searchParams.toString();
  const state = useResolved(() => {
    const props = { params: Promise.resolve(p), searchParams: Promise.resolve(toRecord(new URLSearchParams(spKey))) };
    if (typeof mod.generateMetadata === "function") {
      Promise.resolve(mod.generateMetadata(props, Promise.resolve({}))).then(setTitle, () => {});
    } else if (mod.metadata) setTitle(mod.metadata);
    return mod.default(props);
  }, `${JSON.stringify(p)}?${spKey}`);
  return render(state);
}

const SlotContext = createContext<ReactNode>(null);

function LayoutSlot() {
  return <>{useContext(SlotContext)}</>;
}

export function DemoLayout({ mod, params, children }: { mod: DemoModule; params?: DemoParams; children?: ReactNode }) {
  useDemoRuntime();
  const routeParams = useParams() as DemoParams | null;
  const p = params ?? routeParams ?? {};
  const state = useResolved(() => mod.default({ children: <LayoutSlot />, params: Promise.resolve(p) }), JSON.stringify(p));
  return <SlotContext.Provider value={children}>{render(state)}</SlotContext.Provider>;
}

// ------------------------------------------------------------------ 404-Seite: Pfade ohne statische Datei

function segment(file: DemoSegmentFile, mod: DemoModule, params: DemoParams, children: ReactNode, isPage: boolean) {
  if (file.client) {
    const props = { params: Promise.resolve(params), searchParams: Promise.resolve({}) };
    return createElement(mod.default, props, children);
  }
  return isPage ? <DemoPage mod={mod} params={params} /> : <DemoLayout mod={mod} params={params}>{children}</DemoLayout>;
}

export function DemoFallback() {
  useDemoRuntime();
  const [view, setView] = useState<ReactNode | "loading" | "none" | "download">("loading");
  useEffect(() => {
    let cancelled = false;
    const url = new URL(window.location.href);
    const match = matchDemoRoute(stripBase(url.pathname));
    (async () => {
      if (!match) return setView("none");
      const { route, params } = match;
      if (route.kind === "route") {
        setView("download");
        await runRouteHandler(route, params, url);
        return;
      }
      const [layouts, page] = await Promise.all([Promise.all(route.layouts.map((l) => l.load())), route.page!.load()]);
      if (cancelled) return;
      let node: ReactNode = segment(route.page!, page, params, null, true);
      for (let i = layouts.length - 1; i >= 0; i--) node = segment(route.layouts[i], layouts[i], params, node, false);
      setView(node);
    })().catch((e) => {
      console.error(e);
      if (!cancelled) setView("none");
    });
    return () => {
      cancelled = true;
    };
  }, []);
  if (view === "loading") return <DemoSkeleton />;
  if (view === "none") return <DemoNotFound />;
  if (view === "download")
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center text-sm text-muted-foreground">
        Die Datei wird im Browser erzeugt und heruntergeladen. <Link href="/dashboard" className="text-primary underline">Zurück zum Dashboard</Link>
      </div>
    );
  return <>{view}</>;
}
