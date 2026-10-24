// Ereignisbus der Browser-Demo: „revalidatePath“ → alle Ansichten laden neu; Navigation aus Actions.
const REFRESH = "cc-demo:refresh";
let scheduled = false;

export function emitRefresh() {
  if (typeof window === "undefined" || scheduled) return;
  scheduled = true;
  setTimeout(() => {
    scheduled = false;
    window.dispatchEvent(new Event(REFRESH));
  }, 0);
}

export function onRefresh(cb: () => void) {
  window.addEventListener(REFRESH, cb);
  return () => window.removeEventListener(REFRESH, cb);
}

type Navigator = (url: string, mode: "push" | "replace") => void;
let current: Navigator | null = null;

export function setNavigator(fn: Navigator) {
  current = fn;
}

export function navigate(url: string, mode: "push" | "replace" = "push") {
  if (current) current(url, mode);
  else if (typeof window !== "undefined") window.location.assign(url);
}

// Next-Fehler für redirect()/notFound() erkennen (Digest-Format von next/navigation)
export type NavSignal = { type: "redirect"; url: string; mode: "push" | "replace" } | { type: "notFound" } | null;

export function navSignal(error: unknown): NavSignal {
  const digest = typeof error === "object" && error !== null ? (error as { digest?: unknown }).digest : undefined;
  if (typeof digest !== "string") return null;
  if (digest.startsWith("NEXT_REDIRECT;")) {
    const parts = digest.split(";");
    return { type: "redirect", mode: parts[1] === "push" ? "push" : "replace", url: parts.slice(2, -2).join(";") };
  }
  if (digest.startsWith("NEXT_HTTP_ERROR_FALLBACK;")) return { type: "notFound" };
  return null;
}
