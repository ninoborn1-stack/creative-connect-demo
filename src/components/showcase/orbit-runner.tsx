"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { motionReduced } from "@/components/showcase/motion-scope";

// Steuert den Orbit (Animationen selbst in showcase.css): läuft nur, solange der Bereich sichtbar ist; Hover über ein
// Element verlangsamt alles; alle paar Sekunden löst sich ein Element vorne aus der Bahn und zeigt einen Mini-Moment
// (Countdown zählt, Wellenform spielt schneller, Herz pulsiert). Kein Bezug zum Scrollen, nichts wird angeheftet.
export function OrbitRunner({ className, children, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || motionReduced()) return;
    const anims = () => el.getAnimations({ subtree: true });
    let visible = false, slow = false, timer = 0, tick = 0, n = 0;

    const setRate = (r: number) => anims().forEach((a) => a.updatePlaybackRate(r));
    const focusNext = () => {
      const items = Array.from(el.querySelectorAll<HTMLElement>(".sc-orbit-item")).filter((it) => {
        const face = it.querySelector<HTMLElement>(".sc-orbit-face");
        return it.offsetParent !== null && face && Number(getComputedStyle(face).opacity) > 0.93;
      });
      if (!items.length || slow) return;
      const it = items[n++ % items.length];
      const own = it.getAnimations({ subtree: true }).filter((a) => (a as CSSAnimation).animationName?.startsWith("sc-orbit") || (a as CSSAnimation).animationName === "sc-depth");
      own.forEach((a) => a.pause());
      it.setAttribute("data-focus", "");
      const cd = it.querySelector<HTMLElement>("[data-countdown]");
      let secs = 6 * 3600 - 1;
      const show = () => { if (cd) cd.textContent = [Math.floor(secs / 3600), Math.floor((secs % 3600) / 60), secs % 60].map((v) => String(v).padStart(2, "0")).join(":"); };
      show();
      window.clearInterval(tick);
      tick = window.setInterval(() => { secs--; show(); }, 1000);
      window.setTimeout(() => { it.removeAttribute("data-focus"); window.clearInterval(tick); own.forEach((a) => a.play()); }, 2800);
    };
    const start = () => { if (timer) return; anims().forEach((a) => a.play()); timer = window.setInterval(focusNext, 4200); };
    const stop = () => { anims().forEach((a) => a.pause()); window.clearInterval(timer); timer = 0; };

    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) start(); else stop(); }, { threshold: 0.1 });
    io.observe(el);
    const over = (e: PointerEvent) => { const hit = (e.target as HTMLElement).closest(".sc-orbit-item"); if (hit && !slow) { slow = true; setRate(0.25); } else if (!hit && slow) { slow = false; setRate(1); } };
    const leave = () => { if (slow) { slow = false; setRate(1); } };
    el.addEventListener("pointerover", over);
    el.addEventListener("pointerleave", leave);
    const onMotion = () => { if (motionReduced()) stop(); else if (visible) start(); };
    window.addEventListener("bg-motion", onMotion);
    return () => { io.disconnect(); stop(); window.clearInterval(tick); el.removeEventListener("pointerover", over); el.removeEventListener("pointerleave", leave); window.removeEventListener("bg-motion", onMotion); };
  }, []);

  return <div ref={ref} className={cn("sc-orbit", className)} {...rest}>{children}</div>;
}
