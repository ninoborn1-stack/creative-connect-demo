"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { motionReduced } from "@/components/showcase/motion-scope";

// Steuert die Explosionsansicht (Animationen selbst in showcase.css):
// - data-running ab 30 % Sichtbarkeit: Die Tafeln fächern genau einmal auf und bleiben offen; außerhalb des Bildes ist
//   alles pausiert und läuft beim Wiederkommen an derselben Stelle weiter.
// - Labels: Die Messpunkte (.sc-ghost) an der Unterkante jeder Tafel liefern die Lage im Bild. Die Labels stehen in
//   gleichem Abstand zwischen der ersten und letzten Tafel, jede Linie trifft senkrecht die Unterkante ihrer Tafel.
//   Bei der aktiven Tafel und bei jeder Tafel, die gerade gleitet (auch die zurückkehrende), misst .sc-anchor (wandert
//   mit) die Unterkante: die Linie wächst und schrumpft jedes Bild mit und bleibt verbunden.
//   Alle Werte auf ganze Pixel gerundet.
// - --mx/--my: leichte Drehung zur Maus (höchstens 4 Grad), ohne Maus ruhig.
// - Hervorheben im Kreis (data-active am Container, data-on an Tafel, Label und Listeneintrag). Hover ändert daran
//   nichts; Tippen springt zu dieser Ebene und läuft von dort weiter. Ohne Bewegung: Ebene 1 bleibt hervorgehoben.
const OPEN_DONE = 2; // s nach Sichtbarkeit: alle Tafeln offen, Labels da
const EACH = 1.8; // s je hervorgehobener Ebene
const MOVE = 900; // ms: Gleitzeit der Tafeln (0,8 s in showcase.css) plus Reserve

export function LayersController({ className, children, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const q = <T extends HTMLElement>(s: string) => Array.from(el.querySelectorAll<T>(s));
    const layers = q(".sc-layer"), labels = q(".sc-layer-label"), captions = q(".sc-layer-caption"), items = q(".sc-layers-list li");
    const ghosts = q(".sc-ghost"), anchors = q(".sc-anchor");
    const stage = el.querySelector<HTMLElement>(".sc-layers-stage")!;
    const box = el.querySelector<HTMLElement>(".sc-layer-labels")!;
    let visible = false, elapsed = 0, idx = -1, nextAt = OPEN_DONE, last = performance.now(), timer = 0, frame = 0, follow = 0;
    let mx = 0, my = 0, tx = 0, ty = 0;
    const gliding = new Set<number>(); // Tafeln, deren Linienende gerade live gemessen wird
    let calibrated = false;
    const at = (g: Element) => { const o = stage.getBoundingClientRect(); return Array.from(g.children).map((c) => { const r = c.getBoundingClientRect(); return { x: r.left - o.left, y: r.top - o.top }; }); };
    // Kommt eine Tafel nach vorne, wandert sie durch die Perspektive auch seitlich. Je Tafel einmal ohne Übergang
    // messen (vor dem nächsten Bild zurückgesetzt, also unsichtbar) und als --dx gegensteuern: die Unterkante der
    // aktiven Tafel bleibt genau über ihrem Label, die Label-Reihe steht still.
    const calibrate = () => {
      if (getComputedStyle(box).display === "none") return;
      const fx = parseFloat(getComputedStyle(el).getPropertyValue("--fx")) || 112;
      const mid = (p: { x: number }[]) => (p[0].x + p[1].x) / 2;
      layers.forEach((l, k) => {
        const on = l.hasAttribute("data-on");
        l.style.transition = "none";
        l.style.setProperty("--dx", "0px");
        l.removeAttribute("data-on"); const off = at(anchors[k]);
        l.setAttribute("data-on", ""); const lift = at(anchors[k]);
        if (!on) l.removeAttribute("data-on");
        const w = lift[1].x - lift[0].x || fx;
        l.style.setProperty("--dx", `${((mid(off) - mid(lift)) * fx / w).toFixed(1)}px`);
        void l.offsetWidth; l.style.transition = "";
      });
      calibrated = true;
    };

    const show = (i: number) => {
      layers.forEach((l, k) => { if (l.hasAttribute("data-on") || k === i) gliding.add(k); });
      if (i < 0) el.removeAttribute("data-active"); else el.setAttribute("data-active", String(i + 1));
      for (const list of [layers, labels, captions, items]) list.forEach((l, k) => l.toggleAttribute("data-on", k === i));
      // Während die Tafeln gleiten, die Linienenden der kommenden und der gehenden Tafel jedes Bild nachführen
      cancelAnimationFrame(follow);
      const until = performance.now() + MOVE;
      const run = () => {
        if (performance.now() < until) { place(false); follow = requestAnimationFrame(run); }
        else { gliding.clear(); place(false); }
      };
      follow = requestAnimationFrame(run);
    };
    // Labels an die Tafeln legen
    const place = (withBase: boolean) => {
      if (getComputedStyle(box).display === "none") return;
      const pts = ghosts.map(at);
      const mid = (k: number) => (pts[k][0].x + pts[k][1].x) / 2;
      const x0 = mid(0), gap = (mid(pts.length - 1) - x0) / (pts.length - 1);
      const ys: number[] = [];
      labels.forEach((l, k) => {
        // Linie immer innerhalb der Unterkante (12 px Rand): in Ruhe an der Messkante, beim Gleiten an der echten Kante
        const inside = (x: number, p: { x: number }[]) => Math.min(Math.max(x, p[0].x + 12), p[1].x - 12);
        const edge = (x: number, p: { x: number; y: number }[]) => { const [a, b] = p, f = Math.min(1, Math.max(0, (x - a.x) / (b.x - a.x || 1))); return a.y + f * (b.y - a.y); };
        let x = inside(x0 + k * gap, pts[k]);
        ys.push(edge(x, pts[k]));
        const live = (layers[k].hasAttribute("data-on") || gliding.has(k)) && anchors[k];
        let y = ys[k];
        if (live) { const lp = at(anchors[k]); x = inside(x, lp); y = edge(x, lp); }
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
      if (motionReduced()) { if (!calibrated) calibrate(); if (idx !== 0) { idx = 0; show(0); } return; }
      if (!calibrated && elapsed >= OPEN_DONE - 0.2) calibrate();
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
      if (!calibrated) calibrate();
      idx = i; nextAt = Math.max(elapsed, OPEN_DONE) + EACH; show(idx);
    };
    const resize = () => { if (calibrated) calibrate(); place(true); };

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
      io.disconnect(); window.clearInterval(timer); cancelAnimationFrame(frame); cancelAnimationFrame(follow);
      window.removeEventListener("resize", resize); el.removeEventListener("click", tap);
      if (fine) window.removeEventListener("pointermove", move);
    };
  }, []);

  return <div ref={ref} className={cn("sc-layers", className)} {...rest}>{children}</div>;
}
