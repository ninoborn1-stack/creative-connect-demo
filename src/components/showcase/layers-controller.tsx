"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { motionReduced } from "@/components/showcase/motion-scope";

// Steuert die Explosionsansicht (Animationen selbst in showcase.css):
// - data-running ab 30 % Sichtbarkeit: Die Tafeln fächern genau einmal auf und bleiben offen; außerhalb des Bildes ist
//   alles pausiert und läuft beim Wiederkommen an derselben Stelle weiter.
// - Labels: Die Messpunkte (.sc-ghost) an der Unterkante jeder Tafel liefern die Lage im Bild. Die Labels stehen in
//   gleichem Abstand zwischen der ersten und letzten Tafel, jede Linie trifft senkrecht die Unterkante ihrer Tafel.
//   Alle Werte auf ganze Pixel gerundet.
// - --mx/--my: leichte Drehung zur Maus (höchstens 4 Grad), ohne Maus ruhig.
// - Hervorheben im Kreis (data-active am Container, data-on an Tafel, Label und Listeneintrag). Hover ändert daran
//   nichts; Tippen springt zu dieser Ebene und läuft von dort weiter. Ohne Bewegung: Ebene 1 bleibt hervorgehoben.
const OPEN_DONE = 2; // s nach Sichtbarkeit: alle Tafeln offen, Labels da
const EACH = 1.8; // s je hervorgehobener Ebene

export function LayersController({ className, children, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const q = <T extends HTMLElement>(s: string) => Array.from(el.querySelectorAll<T>(s));
    const layers = q(".sc-layer"), labels = q(".sc-layer-label"), captions = q(".sc-layer-caption"), items = q(".sc-layers-list li");
    const ghosts = q(".sc-ghost");
    const stage = el.querySelector<HTMLElement>(".sc-layers-stage")!;
    const box = el.querySelector<HTMLElement>(".sc-layer-labels")!;
    let visible = false, elapsed = 0, idx = -1, nextAt = OPEN_DONE, last = performance.now(), timer = 0, frame = 0;
    let mx = 0, my = 0, tx = 0, ty = 0;

    const show = (i: number) => {
      if (i < 0) el.removeAttribute("data-active"); else el.setAttribute("data-active", String(i + 1));
      for (const list of [layers, labels, captions, items]) list.forEach((l, k) => l.toggleAttribute("data-on", k === i));
    };
    // Labels an die Tafeln legen
    const place = (withBase: boolean) => {
      if (getComputedStyle(box).display === "none") return;
      const o = stage.getBoundingClientRect();
      const pts = ghosts.map((g) => Array.from(g.children).map((c) => { const r = c.getBoundingClientRect(); return { x: r.left - o.left, y: r.top - o.top }; }));
      const mid = (k: number) => (pts[k][0].x + pts[k][1].x) / 2;
      const x0 = mid(0), gap = (mid(pts.length - 1) - x0) / (pts.length - 1);
      const ys: number[] = [];
      labels.forEach((l, k) => {
        const [a, b] = pts[k], x = x0 + k * gap;
        const f = Math.min(1, Math.max(0, (x - a.x) / (b.x - a.x || 1)));
        const y = a.y + f * (b.y - a.y);
        ys.push(y);
        l.style.setProperty("--x", `${Math.round(x)}px`); l.style.setProperty("--y", `${Math.round(y)}px`);
      });
      box.style.setProperty("--w", `${Math.floor(gap) - 14}px`);
      box.style.setProperty("--x0", `${Math.round(x0 - gap / 2 + 7)}px`);
      if (withBase) box.style.setProperty("--base", `${Math.round(Math.max(...ys) + 26)}px`);
    };
    // Uhr läuft nur, solange der Abschnitt sichtbar ist
    const tick = () => {
      const now = performance.now();
      if (visible && !motionReduced()) elapsed += (now - last) / 1000;
      last = now;
      if (motionReduced()) { if (idx !== 0) { idx = 0; show(0); } return; }
      if (elapsed >= nextAt) { idx = (idx + 1) % layers.length; nextAt += EACH; show(idx); }
    };
    const step = () => {
      mx += (tx - mx) * 0.08; my += (ty - my) * 0.08;
      el.style.setProperty("--mx", mx.toFixed(3)); el.style.setProperty("--my", my.toFixed(3));
      place(false);
      frame = Math.abs(tx - mx) + Math.abs(ty - my) > 0.002 ? requestAnimationFrame(step) : 0;
    };
    const move = (e: PointerEvent) => {
      if (!visible || motionReduced()) return;
      tx = (e.clientX / window.innerWidth) * 2 - 1; ty = (e.clientY / window.innerHeight) * 2 - 1;
      if (!frame) frame = requestAnimationFrame(step);
    };
    // Tippen oder Klick auf Tafel, Label oder Listennummer: dorthin springen, Durchlauf läuft von dort weiter
    const tap = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest("a")) return;
      const hit = target.closest<HTMLElement>(".sc-layer, .sc-layer-label, .sc-layers-list li");
      if (!hit) return;
      const i = [layers, labels, items].map((l) => l.indexOf(hit)).find((n) => n >= 0) ?? -1;
      if (i < 0) return;
      idx = i; nextAt = Math.max(elapsed, OPEN_DONE) + EACH; show(idx);
    };
    const resize = () => place(true);

    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; el.toggleAttribute("data-running", visible); }, { threshold: 0.3 });
    io.observe(el);
    resize();
    document.fonts?.ready.then(resize);
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
