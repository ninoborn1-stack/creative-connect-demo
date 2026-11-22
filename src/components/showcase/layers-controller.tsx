"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { motionReduced } from "@/components/showcase/motion-scope";

// Steuert die Explosionsansicht (Animationen selbst in showcase.css):
// - data-running ab 30 % Sichtbarkeit (CSS pausiert sonst), --mx/--my für die sanfte Drehung zur Maus
// - --s: Größe nach Fensterhöhe, damit der Stapel samt oberster Ebene höchstens ca. 70svh hoch ist
// - aktive Ebene (data-active am Container, data-on an Ebene und Listeneintrag): im Durchlauf nach dem Aufgehen
//   eine nach der anderen, synchron zur CSS-Schleife (Fortschritt der Animation von Ebene 1); Hover oder Tippen
//   auf Ebene, Label oder Listennummer hebt diese Ebene hervor, danach geht der Durchlauf weiter.
const T = 13; // Sekunden, wie --T in showcase.css
const OPEN_AT = 0.954; // Ebene 1 beginnt bei diesem Fortschritt aufzugehen
const FIRST = 2.8, EACH = 1.5; // erste Hervorhebung nach dem Aufgehen, Dauer je Ebene
const NATURAL_H = 830; // Höhe des offenen Stapels bei Größe 1 (px)

export function LayersController({ className, children, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const layers = Array.from(el.querySelectorAll<HTMLElement>(".sc-layer"));
    const items = Array.from(el.querySelectorAll<HTMLElement>(".sc-layers-list li"));
    let visible = false, manual: number | null = null, manualUntil = 0, timer = 0, frame = 0, current = -2;
    let mx = 0, my = 0, tx = 0, ty = 0;

    const setActive = (i: number) => {
      if (i === current) return;
      current = i;
      if (i < 0) el.removeAttribute("data-active"); else el.setAttribute("data-active", String(i + 1));
      layers.forEach((l, k) => l.toggleAttribute("data-on", k === i));
      items.forEach((l, k) => l.toggleAttribute("data-on", k === i));
    };
    const autoIndex = () => {
      const anim = layers[0]?.getAnimations().find((a) => (a as CSSAnimation).animationName === "sc-lift");
      const p = anim?.effect?.getComputedTiming().progress;
      if (p == null) return -1;
      const tc = (((p - OPEN_AT) % 1) + 1) % 1 * T; // Sekunden seit Ebene 1 aufgeht
      const k = Math.floor((tc - FIRST) / EACH);
      return tc >= FIRST && k < layers.length ? k : -1;
    };
    const tick = () => {
      if (manual !== null && (manualUntil === 0 || performance.now() < manualUntil)) return setActive(manual);
      manual = null;
      setActive(visible && !motionReduced() ? autoIndex() : -1);
    };
    const resize = () => {
      const s = window.innerWidth >= 1024
        ? Math.min(1.05, Math.max(0.5, (window.innerHeight * 0.7) / NATURAL_H))
        : Math.min(0.62, window.innerWidth / 760);
      el.style.setProperty("--s", s.toFixed(3));
    };
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
    const indexOf = (t: EventTarget | null) => {
      const hit = (t as HTMLElement | null)?.closest?.(".sc-layer, .sc-layers-list li");
      if (!hit) return -1;
      return hit.classList.contains("sc-layer") ? layers.indexOf(hit as HTMLElement) : items.indexOf(hit as HTMLElement);
    };
    const over = (e: PointerEvent) => { if (e.pointerType !== "mouse") return; const i = indexOf(e.target); manual = i >= 0 ? i : null; manualUntil = 0; tick(); };
    const leave = () => { manual = null; tick(); };
    const tap = (e: MouseEvent) => { const i = indexOf(e.target); if (i >= 0 && !(e.target as HTMLElement).closest("a")) { manual = i; manualUntil = performance.now() + 4000; tick(); } };

    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; el.toggleAttribute("data-running", visible); tick(); }, { threshold: 0.3 });
    io.observe(el);
    resize();
    timer = window.setInterval(tick, 120);
    window.addEventListener("resize", resize, { passive: true });
    el.addEventListener("pointerover", over);
    el.addEventListener("pointerleave", leave);
    el.addEventListener("click", tap);
    const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (fine) window.addEventListener("pointermove", move, { passive: true });
    return () => {
      io.disconnect(); window.clearInterval(timer); cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize); el.removeEventListener("pointerover", over); el.removeEventListener("pointerleave", leave); el.removeEventListener("click", tap);
      if (fine) window.removeEventListener("pointermove", move);
    };
  }, []);

  return <div ref={ref} className={cn("sc-layers", className)} {...rest}>{children}</div>;
}
