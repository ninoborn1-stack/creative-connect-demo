"use client";

import { useCallback, useRef, useState, useSyncExternalStore } from "react";
import { BREVO_FIELDS } from "@/lib/brand";

// Gemeinsame Sendelogik für die Brevo-Formulare (Warteliste und Backstage).
//
// So funktioniert es: Brevo-Formulare nehmen einen normalen POST an die action-URL aus dem Einbettungscode an.
// Wir senden application/x-www-form-urlencoded per fetch mit mode: "no-cors", weil Brevo keine CORS-Header
// schickt. Die Antwort ist dann „opaque“ und nicht lesbar: Erkennbar sind nur Client-Validierung und
// Netzwerkfehler. Kommt der Request an, verschickt Brevo die Double-Opt-in-Mail; ob der Kontakt angelegt wurde,
// sieht man in Brevo unter Kontakte (Status „Double-Opt-in ausstehend“).
// Testen: siehe docs/brevo-setup.md, Schritt 7.

export type SendState = "idle" | "sending" | "success" | "error" | "closed";

export const OWN_HONEYPOT = "website"; // eigenes Honeypot-Feld zusätzlich zu Brevos email_address_check
export const CONSENT_FIELD = "OPT_IN"; // Einwilligungs-Häkchen, nur im Browser geprüft, nicht an Brevo gesendet
const LOCAL_ONLY = new Set([OWN_HONEYPOT, CONSENT_FIELD]);
const COOLDOWN_MS = 3000; // Zeitsperre gegen Doppelklick und schnelles Wiederholen

declare global {
  interface Window {
    __BREVO_URL_OVERRIDE__?: string; // nur für automatische Tests (Playwright), nie im Produktivcode gesetzt
  }
}

export function useBrevoSubmit(url: string, lang: "de" | "en") {
  const [state, setState] = useState<SendState>("idle");
  const lockedUntil = useRef(0);

  const submit = useCallback(async (form: HTMLFormElement, extra: Record<string, string>) => {
    if (Date.now() < lockedUntil.current) return;
    lockedUntil.current = Date.now() + COOLDOWN_MS;
    const data = new FormData(form);
    // Bot hat das unsichtbare Feld ausgefüllt: still „Erfolg“ zeigen, nichts senden
    if (String(data.get(OWN_HONEYPOT) ?? "") || String(data.get(BREVO_FIELDS.brevoHoneypot) ?? "")) return setState("success");
    const target = (typeof window !== "undefined" && window.__BREVO_URL_OVERRIDE__) || url;
    if (!target) return setState("closed");

    const body = new URLSearchParams();
    for (const [key, value] of data.entries()) if (!LOCAL_ONLY.has(key) && typeof value === "string") body.set(key, value.trim());
    for (const [key, value] of Object.entries(extra)) body.set(key, value);
    body.set(BREVO_FIELDS.brevoHoneypot, "");
    body.set(BREVO_FIELDS.locale, lang);

    setState("sending");
    try {
      await fetch(target, { method: "POST", mode: "no-cors", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body });
      setState("success");
    } catch {
      lockedUntil.current = 0;
      setState("error");
    }
  }, [url, lang]);

  return { state, submit };
}

// URL-Parameter im Browser lesen (statische Seite: auf dem Server gibt es keine Query, dort null)
const noSubscribe = () => () => {};
export function useSearchParam(name: string) {
  return useSyncExternalStore(noSubscribe, () => new URLSearchParams(window.location.search).get(name), () => null);
}
