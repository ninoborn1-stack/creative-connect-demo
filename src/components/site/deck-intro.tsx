"use client";

import { useEffect } from "react";
import { APP_NAME } from "@/lib/brand";
import { Photo } from "@/components/site/photo";

// Vorhang beim ersten Laden der Startseite: Ein DJ-Pult (zwei Plattenteller, Mixer) zeichnet sich in Linien,
// das Bühnenfoto erscheint in seiner Silhouette, die Teller drehen an, dann zoomt die Maske durch den Mixer ins
// Vollbild und der Vorhang blendet sich aus. Reines CSS (globals.css, Abschnitt „DJ-PULT-INTRO“), kein GSAP.
//
// Wann es läuft: Das Inline-Skript direkt davor setzt html.intro-on nur beim echten Laden der Seite (nicht bei
// Navigation innerhalb der Seite, nicht mit #Anker, nicht bei „Bewegung reduzieren“). Ohne die Klasse ist der
// Vorhang unsichtbar. Scrollen, Tippen oder eine Taste kürzen ihn ab. Nichts wird gespeichert.

const INIT = `(function(){var h=document.documentElement;if(!location.hash&&!matchMedia("(prefers-reduced-motion: reduce)").matches){h.classList.add("intro-on");}})();`;
const DECKS = [235, 765];

function Deck() {
  return (
    <svg viewBox="0 0 1000 440" aria-hidden>
      {DECKS.map((cx) => (
        <g key={cx}>
          <circle data-draw pathLength={1} cx={cx} cy={220} r={175} />
          <circle data-draw pathLength={1} cx={cx} cy={220} r={162} />
          <g className="intro__spin">
            {[140, 118, 96, 74].map((r) => (
              <circle key={r} cx={cx} cy={220} r={r} fill="none" stroke="currentColor" strokeOpacity={0.45} strokeWidth={1.2} strokeDasharray="38 14" />
            ))}
            <line x1={cx} y1={174} x2={cx} y2={150} stroke="var(--signal)" strokeWidth={3} />
          </g>
          <circle data-draw className="accent" pathLength={1} cx={cx} cy={220} r={46} />
          <circle data-fade cx={cx} cy={220} r={4} fill="currentColor" />
          {/* Tonarm */}
          <circle data-draw pathLength={1} cx={cx + 150} cy={58} r={14} />
          <path data-draw pathLength={1} d={`M${cx + 150} 72 L${cx + 150} 128 L${cx + 96} 200`} />
          <path data-draw pathLength={1} d={`M${cx + 90} 192 l16 12 l-9 13 l-16 -12 z`} />
        </g>
      ))}
      {/* Mixer */}
      <rect data-draw pathLength={1} x={432} y={40} width={136} height={360} rx={14} />
      {[468, 532].map((x) => (
        <g key={x}>
          {[82, 118, 154].map((y) => <circle key={y} data-draw pathLength={1} cx={x} cy={y} r={11} />)}
          <path data-draw pathLength={1} d={`M${x} 212 L${x} 330`} />
          <rect data-draw className="accent" pathLength={1} x={x - 12} y={x === 468 ? 250 : 282} width={24} height={12} />
        </g>
      ))}
      <path data-draw pathLength={1} d="M456 370 L544 370" />
      <rect data-draw className="accent" pathLength={1} x={492} y={363} width={16} height={14} />
      <text data-fade x={500} y={196} textAnchor="middle">{APP_NAME.toUpperCase()}</text>
    </svg>
  );
}

export function DeckIntro() {
  useEffect(() => {
    const html = document.documentElement;
    if (!html.classList.contains("intro-on")) return;
    const el = document.querySelector<HTMLElement>("[data-intro]");
    const done = () => html.classList.remove("intro-on", "intro-skip");
    const skip = () => html.classList.add("intro-skip");
    const onEnd = (e: AnimationEvent) => {
      if (e.target === el && (e.animationName === "intro-out" || e.animationName === "intro-skip")) done();
    };
    el?.addEventListener("animationend", onEnd);
    const opts = { once: true, passive: true } as const;
    for (const ev of ["wheel", "touchmove", "keydown", "pointerdown"]) window.addEventListener(ev, skip, opts);
    const safety = window.setTimeout(done, 5000); // falls ein Browser kein animationend liefert
    return () => {
      el?.removeEventListener("animationend", onEnd);
      for (const ev of ["wheel", "touchmove", "keydown", "pointerdown"]) window.removeEventListener(ev, skip);
      window.clearTimeout(safety);
      done();
    };
  }, []);

  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: INIT }} />
      <div className="intro" data-intro data-testid="deck-intro" aria-hidden>
        <div className="intro__media">
          <Photo name="hero" sizes="100vw" priority />
        </div>
        <div className="intro__deck">
          <Deck />
        </div>
      </div>
    </>
  );
}
