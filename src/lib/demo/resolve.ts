// Löst einen von einer (async) Server Component zurückgegebenen Elementbaum im Browser auf:
// async Funktionskomponenten werden aufgerufen und ersetzt, auch tief in Props (children, icon, action …).
// Nebenbei bekommen Pfade auf public/-Dateien und rohe <a>/<img>-Links den basePath.
import { Fragment, cloneElement, createElement, isValidElement, type ReactElement, type ReactNode } from "react";
import { BASE_PATH, PUBLIC_DIRS, withBase } from "./config";
import { uploadUrl } from "./uploads";

const HOST_URL_PROPS: Record<string, string[]> = {
  a: ["href"],
  img: ["src"],
  audio: ["src"],
  video: ["src", "poster"],
  source: ["src"],
  track: ["src"],
  link: ["href"],
  iframe: ["src"],
};
const ASSET_PREFIXES = PUBLIC_DIRS.map((d) => `/${d}/`);

function isAsyncFunction(fn: unknown): fn is (props: unknown) => Promise<ReactNode> {
  if (typeof fn !== "function") return false;
  if (Object.prototype.toString.call(fn) === "[object AsyncFunction]") return true;
  return /^async[\s(]/.test(Function.prototype.toString.call(fn));
}

export function fixAssetUrl(value: string) {
  if (value.startsWith("/uploads/")) {
    const blobUrl = uploadUrl(value);
    if (blobUrl) return blobUrl;
  }
  return withBase(value);
}

function isAssetPath(v: string) {
  return ASSET_PREFIXES.some((p) => v.startsWith(p));
}

function mightContainNodes(v: unknown) {
  return isValidElement(v) || Array.isArray(v) || (typeof v === "object" && v !== null && typeof (v as { then?: unknown }).then === "function");
}

export async function resolveTree(node: ReactNode | Promise<ReactNode>): Promise<ReactNode> {
  const value = await node;
  if (value == null || typeof value !== "object") return value;
  if (Array.isArray(value)) {
    const out = await Promise.all(value.map((n) => resolveTree(n)));
    return out.every((n, i) => n === value[i]) ? value : out;
  }
  if (!isValidElement(value)) return value;

  const el = value as ReactElement<Record<string, unknown>>;
  if (isAsyncFunction(el.type)) {
    const out = await resolveTree(await el.type(el.props));
    return el.key != null ? createElement(Fragment, { key: el.key }, out) : out;
  }

  const props = el.props ?? {};
  let changed: Record<string, unknown> | null = null;
  const hostProps = typeof el.type === "string" ? HOST_URL_PROPS[el.type] : undefined;
  for (const [k, v] of Object.entries(props)) {
    let next = v;
    if (typeof v === "string") {
      if ((hostProps?.includes(k) && BASE_PATH) || isAssetPath(v) || v.startsWith("/uploads/")) next = fixAssetUrl(v);
    } else if (mightContainNodes(v)) {
      next = await resolveTree(v as ReactNode);
    }
    if (next !== v) (changed ??= {})[k] = next;
  }
  return changed ? cloneElement(el, changed) : el;
}
