// Ersatz für next/headers in der Browser-Demo: Cookies in localStorage, Header aus window.location.
import { BASE_PATH } from "../config";

const PREFIX = "cc-demo-cookie:";
type Cookie = { name: string; value: string };

function storage() {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

const memory = new Map<string, string>();

const store = {
  get(name: string | Cookie): Cookie | undefined {
    const key = typeof name === "string" ? name : name.name;
    const value = storage()?.getItem(PREFIX + key) ?? memory.get(key);
    return value == null ? undefined : { name: key, value };
  },
  getAll(name?: string): Cookie[] {
    const s = storage();
    const all: Cookie[] = [];
    if (s) {
      for (let i = 0; i < s.length; i++) {
        const k = s.key(i);
        if (k?.startsWith(PREFIX)) all.push({ name: k.slice(PREFIX.length), value: s.getItem(k) ?? "" });
      }
    } else memory.forEach((value, n) => all.push({ name: n, value }));
    return name ? all.filter((c) => c.name === name) : all;
  },
  has(name: string) {
    return store.get(name) !== undefined;
  },
  set(name: string | (Cookie & Record<string, unknown>), value?: string) {
    const c = typeof name === "string" ? { name, value: value ?? "" } : name;
    memory.set(c.name, c.value);
    try {
      storage()?.setItem(PREFIX + c.name, c.value);
    } catch {
      // nur im Speicher
    }
    return store;
  },
  delete(name: string | { name: string }) {
    const key = typeof name === "string" ? name : name.name;
    memory.delete(key);
    storage()?.removeItem(PREFIX + key);
    return store;
  },
  get size() {
    return store.getAll().length;
  },
  toString() {
    return store.getAll().map((c) => `${c.name}=${encodeURIComponent(c.value)}`).join("; ");
  },
  [Symbol.iterator]() {
    return store.getAll().map((c) => [c.name, c] as [string, Cookie])[Symbol.iterator]();
  },
};

export async function cookies() {
  return store;
}

export async function headers() {
  const h = new Headers();
  if (typeof window === "undefined") return h;
  // Host inkl. basePath: Code, der absolute Links aus Host + Pfad baut, landet so auf der Projektseite
  h.set("host", window.location.host + BASE_PATH);
  h.set("x-forwarded-host", window.location.host + BASE_PATH);
  h.set("x-forwarded-proto", window.location.protocol.replace(":", ""));
  h.set("user-agent", navigator.userAgent);
  h.set("accept-language", navigator.language);
  h.set("referer", window.location.href);
  return h;
}

export async function draftMode() {
  return { isEnabled: false, enable() {}, disable() {} };
}
