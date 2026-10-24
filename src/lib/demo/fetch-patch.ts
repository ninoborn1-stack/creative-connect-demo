// Kleine fetch-Korrekturen für Next-Requests im statischen Export unter einem basePath:
// - RSC-Payload der Startseite liegt in <basePath>/index.txt, Next fragt aber <basePath>.txt an
// - für Pfade ohne statische Datei (im Browser angelegte Datensätze) gar nicht erst anfragen:
//   Next bekommt sofort ein 404 und lädt die Seite hart neu → 404.html rendert sie im Browser
import { BASE_PATH } from "./config";
import { isUnknownDynamicPath } from "./routes";

let installed = false;

export function installFetchPatch() {
  if (installed || typeof window === "undefined") return;
  installed = true;
  const original = window.fetch.bind(window);
  window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
    try {
      const raw = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
      const url = new URL(raw, window.location.href);
      if (url.origin === window.location.origin) {
        if (BASE_PATH && url.pathname === `${BASE_PATH}.txt`) {
          url.pathname = `${BASE_PATH}/index.txt`;
          return original(input instanceof Request ? new Request(url, input) : url.href, init);
        }
        const inBase = !BASE_PATH || url.pathname.startsWith(BASE_PATH + "/");
        if (inBase) {
          const route = url.pathname
            .slice(BASE_PATH.length)
            .replace(/\/__next\.[^/]*$/, "")
            .replace(/\.txt$/, "");
          if (isUnknownDynamicPath(route)) return Promise.resolve(new Response("", { status: 404, statusText: "Not Found" }));
        }
      }
    } catch {
      // im Zweifel unverändert weiterreichen
    }
    return original(input, init);
  };
}
