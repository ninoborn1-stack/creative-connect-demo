"use client";

import { lazy, Suspense, useEffect, useRef, useState } from "react";
import type { Dict, Locale } from "@/lib/i18n";
import { Photo, type PhotoName } from "@/components/site/photo";
import type { ScreenKey } from "@/components/showcase/screens";

const Screen = lazy(() => import("@/components/showcase/screen-views").then((m) => ({ default: m.Screen })));

// Platzhalter im Display: Foto des Screens, abgedunkelt. Gleiche Größe wie der echte Screen (kein Layoutsprung).
const PHOTO: Record<ScreenKey, PhotoName> = { swipe: "for-artists", events: "card-event", music: "card-music", matches: "for-artists", backstage: "studio" };

export function LazyScreen({ k, lang, backstage }: { k: ScreenKey; lang: Locale; backstage: Dict["showcase"]["backstage"] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [show, setShow] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setShow(true); io.disconnect(); } }, { rootMargin: "600px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const placeholder = (
    <div className="relative h-full bg-[var(--ink)]">
      <Photo name={PHOTO[k]} sizes="280px" className="opacity-60" />
      <div className="absolute inset-0 bg-gradient-to-t from-[var(--ink)] via-transparent to-[var(--ink)]/60" />
    </div>
  );
  return <div ref={ref} className="h-full">{show ? <Suspense fallback={placeholder}><Screen k={k} lang={lang} backstage={backstage} /></Suspense> : placeholder}</div>;
}
