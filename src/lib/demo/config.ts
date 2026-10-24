// Konfiguration der statischen Browser-Demo (GitHub Pages). Werte setzt scripts/pages/build.mjs beim Build.
export const IS_PAGES_DEMO = process.env.NEXT_PUBLIC_PAGES_DEMO === "1";
export const BASE_PATH = process.env.NEXT_PUBLIC_DEMO_BASE_PATH ?? "";
export const DEMO_VERSION = process.env.NEXT_PUBLIC_DEMO_VERSION ?? "dev";
export const TITLE_TEMPLATE = process.env.NEXT_PUBLIC_DEMO_TITLE_TEMPLATE || "%s";
// Oberste Ordner in public/ (z. B. demo-audio, uploads) – Pfade dorthin bekommen den basePath
export const PUBLIC_DIRS = (process.env.NEXT_PUBLIC_DEMO_PUBLIC_DIRS ?? "").split(",").filter(Boolean);

export function stripBase(pathname: string) {
  if (BASE_PATH && (pathname === BASE_PATH || pathname.startsWith(BASE_PATH + "/"))) pathname = pathname.slice(BASE_PATH.length);
  return pathname || "/";
}

export function withBase(path: string) {
  if (!BASE_PATH || !path.startsWith("/") || path.startsWith("//")) return path;
  if (path === BASE_PATH || path.startsWith(BASE_PATH + "/")) return path;
  return BASE_PATH + path;
}
