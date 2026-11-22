"use client";

import type { ScreenKey } from "@/components/showcase/screens";
import { motionReduced } from "@/components/showcase/motion-scope";

// Link zur interaktiven Vorschau im Hero (#vorschau). Mit JavaScript öffnet sie direkt den passenden Screen
// (Ereignis „bg-preview“, siehe PreviewLoader), ohne JavaScript springt der Anker einfach zur Vorschau.
export const PREVIEW_ID = "vorschau";

export function openPreview(screen: ScreenKey) {
  window.dispatchEvent(new CustomEvent("bg-preview", { detail: screen }));
  const target = document.getElementById(PREVIEW_ID);
  // Abschnitt unter der Navigation einpassen (scroll-margin der Sektion), Vorschau danach fokussieren
  target?.scrollIntoView({ behavior: motionReduced() ? "auto" : "smooth", block: "start" });
  window.setTimeout(() => target?.querySelector<HTMLElement>("[data-testid=preview]")?.focus({ preventScroll: true }), 700);
}

export function PreviewLink({ screen, className, children, label, testId }: { screen: ScreenKey; className?: string; children: React.ReactNode; label?: string; testId?: string }) {
  return (
    <a href={`#${PREVIEW_ID}`} className={className} aria-label={label} data-testid={testId} data-screen={screen}
      onClick={(e) => { e.preventDefault(); openPreview(screen); }}>
      {children}
    </a>
  );
}
