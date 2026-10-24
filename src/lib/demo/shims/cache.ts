// Ersatz für next/cache in der Browser-Demo: Revalidierung = alle sichtbaren Ansichten neu laden.
import { emitRefresh } from "../events";

export function revalidatePath(path?: string, type?: "layout" | "page") {
  void path;
  void type;
  emitRefresh();
}

export function revalidateTag(tag?: string, profile?: unknown) {
  void tag;
  void profile;
  emitRefresh();
}

export const updateTag = revalidateTag;

export function refresh() {
  emitRefresh();
}

export function unstable_cache<T extends (...args: never[]) => unknown>(fn: T): T {
  return fn;
}

export function unstable_noStore() {}
export function cacheLife(profile?: unknown) {
  void profile;
}
export function cacheTag(...tags: string[]) {
  void tags;
}
