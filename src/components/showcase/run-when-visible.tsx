"use client";

import { useEffect, useRef } from "react";
import { motionReduced } from "@/components/showcase/motion-scope";

// Setzt data-running, solange der Bereich (zu threshold) sichtbar ist; die CSS pausiert Endlos-Animationen ohne das
// Attribut. Mit tilt zusätzlich --mx/--my (-1 bis 1, gedämpft) für eine sanfte Drehung zur Maus (nur Desktop).
export function RunWhenVisible({ children, threshold = 0, tilt = false, ...rest }: React.HTMLAttributes<HTMLDivElement> & { threshold?: number; tilt?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let visible = false, frame = 0, mx = 0, my = 0, tx = 0, ty = 0;
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; el.toggleAttribute("data-running", visible); }, { threshold });
    io.observe(el);
    const step = () => {
      mx += (tx - mx) * 0.07; my += (ty - my) * 0.07;
      el.style.setProperty("--mx", mx.toFixed(3)); el.style.setProperty("--my", my.toFixed(3));
      frame = Math.abs(tx - mx) + Math.abs(ty - my) > 0.003 ? requestAnimationFrame(step) : 0;
    };
    const move = (e: PointerEvent) => {
      if (!visible || motionReduced()) return;
      tx = (e.clientX / window.innerWidth) * 2 - 1; ty = (e.clientY / window.innerHeight) * 2 - 1;
      if (!frame) frame = requestAnimationFrame(step);
    };
    const fine = tilt && matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (fine) window.addEventListener("pointermove", move, { passive: true });
    return () => { io.disconnect(); cancelAnimationFrame(frame); if (fine) window.removeEventListener("pointermove", move); };
  }, [threshold, tilt]);
  return <div ref={ref} {...rest}>{children}</div>;
}
