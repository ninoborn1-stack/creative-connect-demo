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

export const THEME_INIT_SCRIPT = `try{if(localStorage.getItem("${KEY}")==="light")document.documentElement.classList.remove("dark")}catch(e){}`;
