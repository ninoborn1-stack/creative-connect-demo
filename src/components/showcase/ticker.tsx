"use client";

import { useEffect, useRef } from "react";
import { motionReduced } from "@/components/showcase/motion-scope";

// Countdown, der sekundengenau herunterzählt, solange er sichtbar ist (Beispiel, kein echtes Event)
export function Ticker({ from = 6 * 3600 - 1 }: { from?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || motionReduced()) return;
    let secs = from, timer = 0;
    const show = () => { el.textContent = [Math.floor(secs / 3600), Math.floor((secs % 3600) / 60), secs % 60].map((v) => String(v).padStart(2, "0")).join(":"); };
    const io = new IntersectionObserver(([e]) => {
      window.clearInterval(timer);
      if (e.isIntersecting) timer = window.setInterval(() => { secs = secs > 0 ? secs - 1 : from; show(); }, 1000);
    });
    io.observe(el);
    return () => { io.disconnect(); window.clearInterval(timer); };
  }, [from]);
  const h = Math.floor(from / 3600), m = Math.floor((from % 3600) / 60), s = from % 60;
  return <span ref={ref} className="tabular-nums">{[h, m, s].map((v) => String(v).padStart(2, "0")).join(":")}</span>;
}
