// Routentabelle der Browser-Demo (wird beim Pages-Build generiert und hier registriert).
// Dient der 404-Seite (Pfade ohne statische Datei, z. B. neu angelegte Projekte) und den Downloads (Route Handler).
/* eslint-disable @typescript-eslint/no-explicit-any -- Module werden dynamisch geladen */
export type DemoModule = { default?: any; GET?: (req: Request, ctx: { params: Promise<Record<string, string | string[]>> }) => Promise<Response> | Response; [k: string]: any };
export type DemoSegmentFile = { client: boolean; load: () => Promise<DemoModule> };
// known: beim Build statisch erzeugte Pfade einer dynamischen Route (alles andere rendert die 404-Seite)
export type DemoRoute = { pattern: string; kind: "page" | "route"; layouts: DemoSegmentFile[]; page?: DemoSegmentFile; handler?: () => Promise<DemoModule>; known?: string[] };
export type DemoParams = Record<string, string | string[]>;

let routes: DemoRoute[] = [];
let notFoundView: DemoSegmentFile | null = null;
const known = new Set<string>();

export function registerDemoRoutes(list: DemoRoute[], notFound?: DemoSegmentFile | null) {
  // spezifischere Muster (mehr feste Segmente) zuerst
  const score = (p: string) => p.split("/").filter((s) => s && !s.startsWith("[")).length * 10 - (p.includes("[...") ? 5 : 0);
  routes = [...list].sort((a, b) => score(b.pattern) - score(a.pattern));
  notFoundView = notFound ?? null;
  for (const r of list) r.known?.forEach((p) => known.add(p));
}

export function getNotFoundView() {
  return notFoundView;
}

function matchPattern(pattern: string, path: string): DemoParams | null {
  const ps = pattern.split("/").filter(Boolean);
  const xs = path.split("/").filter(Boolean).map((s) => {
    try {
      return decodeURIComponent(s);
    } catch {
      return s;
    }
  });
  const params: DemoParams = {};
  for (let i = 0; i < ps.length; i++) {
    const seg = ps[i];
    const optionalCatchAll = /^\[\[\.\.\.(.+)\]\]$/.exec(seg);
    const catchAll = /^\[\.\.\.(.+)\]$/.exec(seg);
    if (optionalCatchAll || catchAll) {
      const rest = xs.slice(i);
      if (!rest.length && catchAll) return null;
      if (rest.length) params[(optionalCatchAll ?? catchAll)![1]] = rest;
      return params;
    }
    if (i >= xs.length) return null;
    const dyn = /^\[(.+)\]$/.exec(seg);
    if (dyn) params[dyn[1]] = xs[i];
    else if (seg !== xs[i]) return null;
  }
  return ps.length === xs.length ? params : null;
}

export function matchDemoRoute(path: string, kind?: DemoRoute["kind"]) {
  const clean = path.replace(/\/+$/, "") || "/";
  for (const route of routes) {
    if (kind && route.kind !== kind) continue;
    const params = matchPattern(route.pattern, clean);
    if (params) return { route, params };
  }
  return null;
}

const decodePath = (p: string) => {
  try {
    return decodeURI(p);
  } catch {
    return p;
  }
};

// Pfad einer dynamischen Seite, für den es keine statische Datei gibt (z. B. neu angelegtes Projekt)?
export function isUnknownDynamicPath(path: string) {
  const clean = decodePath(path.replace(/\/+$/, "") || "/");
  const m = matchDemoRoute(clean, "page");
  return Boolean(m?.route.known && !known.has(clean));
}
