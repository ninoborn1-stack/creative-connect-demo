"use client";

import { useSyncExternalStore } from "react";

// Minimaler Theme-Store: Klasse "dark" auf <html>, Wahl in localStorage. Standard ist dunkel.
const KEY = "cc-theme";

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  return () => observer.disconnect();
}

export function useIsDark() {
  return useSyncExternalStore(subscribe, () => document.documentElement.classList.contains("dark"), () => true);
}

export function setTheme(theme: "dark" | "light") {
  document.documentElement.classList.toggle("dark", theme === "dark");
  try {
    localStorage.setItem(KEY, theme);
  } catch {
    // Speicher nicht verfügbar (z. B. privates Fenster) – Wahl gilt dann nur für diese Seite
  }
}

// Läuft vor dem ersten Paint: Theme setzen und auf der Startseite die Scroll-Wiederherstellung abschalten,
// damit das Hero-Intro nach Neuladen/Zurück nicht mitten in der Scroll-Strecke startet. data-intro hält den
// Hero bis zum Start der Intro-Animation im Ausgangszustand (DJ-Pult-Maske) – die Hero-Komponente entfernt es.
export const THEME_INIT_SCRIPT = `try{if(localStorage.getItem("${KEY}")==="light")document.documentElement.classList.remove("dark")}catch(e){}if(location.pathname==="/"&&"scrollRestoration" in history&&!location.hash)history.scrollRestoration="manual";if(!location.hash&&!matchMedia("(prefers-reduced-motion: reduce)").matches)document.documentElement.setAttribute("data-intro","");`;
