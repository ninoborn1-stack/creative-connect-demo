"use client";

import { useSyncExternalStore } from "react";

// Schalter „Bewegung reduzieren“ im Footer. Speichert die Wahl nur auf Klick im localStorage („bg-motion“),
// in der Datenschutzerklärung beschrieben. Folgt sonst der Einstellung des Geräts.
const KEY = "bg-motion";
const subscribe = (cb: () => void) => {
  window.addEventListener("bg-motion", cb);
  return () => window.removeEventListener("bg-motion", cb);
};

export function MotionToggle({ label }: { label: string }) {
  const on = useSyncExternalStore(subscribe, () => document.documentElement.getAttribute("data-motion") === "reduce", () => false);

  const toggle = () => {
    const next = !on;
    const h = document.documentElement;
    try {
      if (next) localStorage.setItem(KEY, "reduce");
      else localStorage.removeItem(KEY);
    } catch {}
    if (next || matchMedia("(prefers-reduced-motion: reduce)").matches) h.setAttribute("data-motion", "reduce");
    else h.removeAttribute("data-motion");
    window.dispatchEvent(new Event("bg-motion"));
  };

  return (
    <button type="button" onClick={toggle} aria-pressed={on} className="meta inline-flex items-center gap-2 whitespace-nowrap" data-testid="motion-toggle">
      <span aria-hidden className="relative inline-block h-4 w-7 rounded-full border border-white/40 transition-colors aria-pressed:bg-white" data-on={on || undefined}>
        <span className={`absolute top-0.5 left-0.5 size-2.5 rounded-full bg-white transition-transform ${on ? "translate-x-3 bg-[var(--stone)]" : ""}`} />
      </span>
      {label}
    </button>
  );
}
