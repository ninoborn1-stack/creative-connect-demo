"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

// Kleiner Motor für alle Showcase-Animationen, ohne Bibliothek: setzt CSS-Variablen auf dem eigenen Element,
// die Animation selbst steht in showcase.css (nur transform und opacity).
//   --p   Scroll-Fortschritt 0 bis 1 (mode „through“: Element läuft durchs Bild, „enter“: Oberkante kommt rein,
//         „pin“: Strecke eines angehefteten Bereichs)
//   --mx, --my  Mausposition -1 bis 1, gedämpft (nur Desktop mit Maus, Option tilt)
//   --f   je Kind mit [data-focus]: 1 in der Bildmitte, 0 am Rand (Option focus, auch für horizontales Wischen)
//   data-in  einmal gesetzt, sobald der Bereich ins Bild kommt (für Einflug-Animationen)
// Bei „Bewegung reduzieren“ (Gerät oder Schalter im Footer, html[data-motion=reduce]) passiert nichts; die CSS
// setzt dann alle Elemente auf ihre Endposition. Ohne JavaScript gilt dasselbe.

export const motionReduced = () => document.documentElement.getAttribute("data-motion") === "reduce";

type Mode = "through" | "enter" | "pin" | "auto"; // auto: ab 1024 px pin, darunter enter

export function MotionScope({
  mode = "through", tilt = false, focus = false, className, children, ...rest
}: { mode?: Mode; tilt?: boolean; focus?: boolean; className?: string; children: React.ReactNode } & React.HTMLAttributes<HTMLDivElement>) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let active = false, frame = 0;
    let mx = 0, my = 0, tx = 0, ty = 0;
    const focusEls = focus ? Array.from(el.querySelectorAll<HTMLElement>("[data-focus]")) : [];
    const scroller = focus ? el.querySelector<HTMLElement>("[data-scroller]") : null;

    const measure = () => {
      if (motionReduced()) return;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      let p: number;
      const m = mode === "auto" ? (window.innerWidth >= 1024 ? "pin" : "enter") : mode;
      if (m === "pin") p = -r.top / Math.max(1, r.height - vh);
      else if (m === "enter") p = (vh - r.top) / (vh * 0.65);
      else p = (vh - r.top) / (vh + r.height);
      el.style.setProperty("--p", Math.min(1, Math.max(0, p)).toFixed(4));
      if (focusEls.length) {
        const cx = window.innerWidth / 2;
        for (const f of focusEls) {
          const b = f.getBoundingClientRect();
          const d = Math.abs(b.left + b.width / 2 - cx) / (window.innerWidth * 0.55);
          f.style.setProperty("--f", Math.max(0, 1 - d).toFixed(3));
        }
      }
    };
    const tick = () => {
      frame = 0;
      measure();
      if (tilt) {
        mx += (tx - mx) * 0.08;
        my += (ty - my) * 0.08;
        el.style.setProperty("--mx", mx.toFixed(3));
        el.style.setProperty("--my", my.toFixed(3));
        if (active && (Math.abs(tx - mx) > 0.002 || Math.abs(ty - my) > 0.002)) frame = requestAnimationFrame(tick);
      }
    };
    const request = () => { if (active && !frame) frame = requestAnimationFrame(tick); };

    const io = new IntersectionObserver(([e]) => {
      active = e.isIntersecting;
      if (active) { el.setAttribute("data-in", ""); request(); }
    }, { rootMargin: "100px 0px" });
    io.observe(el);

    const fine = tilt && matchMedia("(hover: hover) and (pointer: fine)").matches;
    const onPointer = (e: PointerEvent) => {
      if (motionReduced()) return;
      tx = (e.clientX / window.innerWidth) * 2 - 1;
      ty = (e.clientY / window.innerHeight) * 2 - 1;
      request();
    };
    const onMotion = () => { if (motionReduced()) { for (const v of ["--p", "--mx", "--my"]) el.style.removeProperty(v); } else request(); };

    window.addEventListener("scroll", request, { passive: true });
    window.addEventListener("resize", request, { passive: true });
    window.addEventListener("bg-motion", onMotion);
    scroller?.addEventListener("scroll", request, { passive: true });
    if (fine) window.addEventListener("pointermove", onPointer, { passive: true });
    return () => {
      io.disconnect();
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", request);
      window.removeEventListener("resize", request);
      window.removeEventListener("bg-motion", onMotion);
      scroller?.removeEventListener("scroll", request);
      if (fine) window.removeEventListener("pointermove", onPointer);
    };
  }, [mode, tilt, focus]);

  return <div ref={ref} className={cn("sc-scope", className)} {...rest}>{children}</div>;
}
