"use client";

import { useEffect, useRef } from "react";

// Setzt data-running, solange der Bereich sichtbar ist; die CSS pausiert Endlos-Animationen ohne das Attribut.
export function RunWhenVisible({ children, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => el.toggleAttribute("data-running", e.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return <div ref={ref} {...rest}>{children}</div>;
}
