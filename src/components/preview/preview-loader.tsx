"use client";

import { lazy, Suspense, useEffect, useRef, useState } from "react";
import type { Locale } from "@/lib/i18n";

// Lädt die interaktive Vorschau erst, wenn das Handy in die Nähe des Viewports kommt.
// Bis dahin (und während des Ladens) steht der statische Platzhalter da, kein Einfluss auf den ersten Seitenaufbau.
const AppPreview = lazy(() => import("@/components/preview/app-preview").then((m) => ({ default: m.AppPreview })));

export function PreviewLoader({ lang, placeholder }: { lang: Locale; placeholder: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        setVisible(true);
        io.disconnect();
      }
    }, { rootMargin: "300px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref}>
      {visible ? <Suspense fallback={placeholder}><AppPreview lang={lang} /></Suspense> : placeholder}
    </div>
  );
}
