"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { motionReduced } from "@/components/showcase/motion-scope";

// Steuert die Explosionsansicht (Animationen selbst in showcase.css):
// - data-running ab 30 % Sichtbarkeit: Die Schichten gehen dann genau einmal auf und bleiben offen; außerhalb des
//   Bildes ist alles pausiert und läuft beim Wiederkommen an derselben Stelle weiter.
// - --mx/--my für die sanfte Drehung zur Maus, --s: Größe nach Fensterhöhe (Bühne passt unter die Navigation)
// - Hervorheben im Kreis (data-active am Container, data-on an Ebene und Listeneintrag), eine Ebene nach der anderen.
//   Hover ändert daran nichts (die CSS hellt nur kurz auf); Tippen springt zu dieser Ebene und läuft von dort weiter.
const OPEN_DONE = 2.6; // s nach Sichtbarkeit: alle Schichten offen, Labels da
const EACH = 1.6; // s je hervorgehobener Ebene
const NATURAL_W = 1250; // Breite von Stapel und Labels bei Größe 1 (px)
const NATURAL_H = 1060; // Höhe der Bühne um den offenen Stapel bei Größe 1 (px), wie --nat in showcase.css

export function LayersController({ className, children, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const layers = Array.from(el.querySelectorAll<HTMLElement>(".sc-layer"));
    const items = Array.from(el.querySelectorAll<HTMLElement>(".sc-layers-list li"));
    let visible = false, elapsed = 0, idx = -1, nextAt = OPEN_DONE, last = performance.now(), timer = 0, frame = 0;
    let mx = 0, my = 0, tx = 0, ty = 0;

    const show = (i: number) => {
      if (i < 0) el.removeAttribute("data-active"); else el.setAttribute("data-active", String(i + 1));
      layers.forEach((l, k) => l.toggleAttribute("data-on", k === i));
      items.forEach((l, k) => l.toggleAttribute("data-on", k === i));
    };
    // Uhr läuft nur, solange der Abschnitt sichtbar ist
    const tick = () => {
      const now = performance.now();
      if (visible && !motionReduced()) elapsed += (now - last) / 1000;
      last = now;
      if (motionReduced()) { if (idx !== -1) { idx = -1; show(-1); } return; }
      if (elapsed >= nextAt) { idx = (idx + 1) % layers.length; nextAt += EACH; show(idx); }
    };
    const resize = () => {
      const s = window.innerWidth >= 1024
        ? Math.min(0.95, el.clientWidth / NATURAL_W, Math.max(0.5, (window.innerHeight - 112) / NATURAL_H))
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
    // Tippen oder Klick auf Ebene bzw. Listennummer: dorthin springen, Durchlauf läuft von dort weiter
    const tap = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest("a")) return;
      const hit = target.closest(".sc-layer, .sc-layers-list li");
      if (!hit || motionReduced()) return;
      const i = hit.classList.contains("sc-layer") ? layers.indexOf(hit as HTMLElement) : items.indexOf(hit as HTMLElement);
      if (i < 0) return;
      idx = i; nextAt = Math.max(elapsed, OPEN_DONE) + EACH; show(idx);
    };

    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; el.toggleAttribute("data-running", visible); }, { threshold: 0.3 });
    io.observe(el);
    resize();
    timer = window.setInterval(tick, 100);
    window.addEventListener("resize", resize, { passive: true });
    el.addEventListener("click", tap);
    const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (fine) window.addEventListener("pointermove", move, { passive: true });
    return () => {
      io.disconnect(); window.clearInterval(timer); cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize); el.removeEventListener("click", tap);
      if (fine) window.removeEventListener("pointermove", move);
    };
  }, []);

  return <div ref={ref} className={cn("sc-layers", className)} {...rest}>{children}</div>;
}
