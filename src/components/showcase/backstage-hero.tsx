"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Lock } from "lucide-react";
import type { Dict, Locale } from "@/lib/i18n";
import { UI } from "@/content/preview-data";
import { PhoneFrame } from "@/components/preview/phone-frame";
import { Photo, type PhotoName } from "@/components/site/photo";
import { MotionScope, motionReduced } from "@/components/showcase/motion-scope";

// Backstage-Hero „Fünf Swipes, live“: Nachtstadt in Stone Blue (Linien-Skyline, Stadtplan mit aufglimmenden
// Punkten, schmaler Lichtkegel), davor das Handy im Reisemodus, leicht im Raum gedreht wie im Startseiten-Hero.
// Karten von Studios, Venues und Mitgliedern gleiten nacheinander ins Bild und werden geswipt, der große Zähler
// zählt mit. Beim fünften Swipe: Karte „Session bestätigt“, Lichtimpuls über der Skyline, der Punkt der Session
// leuchtet in Scarlet. Kurze Pause, dann die nächste Stadt. Läuft nur, solange der Hero sichtbar ist.
// Ohne Bewegung (und ohne JavaScript): Endzustand mit „Session bestätigt“, still (Regeln in showcase.css).
// Die fünfte Karte bleibt nach dem Swipe stehen (mit Häkchen), darüber erscheint die Bestätigung.
// Zeitplan: erster Swipe nach FIRST s, dann alle EACH s; nach dem fünften HOLD s Pause.
const FIRST = 1.2, EACH = 1.15, HOLD = 3.4;
// Punkte auf dem Stadtplan (Prozent der Bühne); je Stadt leuchtet einer davon für die Session
const DOTS = [[14, 62], [22, 48], [31, 70], [38, 56], [47, 66], [55, 44], [63, 60], [71, 52], [79, 68], [86, 46], [92, 58], [27, 40], [67, 38]];
const SESSION_DOT = [5, 7, 3];

export function BackstageHero({ lang, t, children }: { lang: Locale; t: Dict; children: React.ReactNode }) {
  const h = t.showcase.bsHero;
  const ref = useRef<HTMLElement>(null);
  const [city, setCity] = useState(0);
  const [step, setStep] = useState(0); // Anzahl Swipes, 5 = Session bestätigt

  useEffect(() => {
    const el = ref.current;
    if (!el || motionReduced()) return;
    el.setAttribute("data-live", "");
    let visible = false, elapsed = 0, last = performance.now(), c = 0;
    const tick = () => {
      const now = performance.now();
      if (visible && !motionReduced()) elapsed += (now - last) / 1000;
      last = now;
      const n = elapsed < FIRST ? 0 : Math.min(5, 1 + Math.floor((elapsed - FIRST) / EACH));
      setStep(n);
      if (elapsed >= FIRST + 4 * EACH + HOLD) { elapsed = 0; c = (c + 1) % h.cities.length; setCity(c); setStep(0); }
    };
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; el.toggleAttribute("data-running", visible); }, { threshold: 0.2 });
    io.observe(el);
    const timer = window.setInterval(tick, 100);
    return () => { io.disconnect(); window.clearInterval(timer); };
  }, [h.cities.length]);

  const c = h.cities[city];
  const done = step >= 5;
  return (
    <section ref={ref} aria-labelledby="bs-title" className="sc-bs gutter relative isolate overflow-hidden" data-testid="backstage-stage" data-step={step} data-done={done ? "" : undefined}>
      {/* Nachtstadt */}
      <div aria-hidden className="sc-bs-bg">
        <div className="sc-bs-cone" />
        <svg className="sc-bs-map" viewBox="0 0 1000 400" preserveAspectRatio="none">
          <path d="M0 250 L1000 210 M0 320 L1000 300 M120 400 L260 120 M430 400 L520 110 M700 400 L640 120 M880 400 L980 160 M0 180 L1000 150" />
        </svg>
        <svg className="sc-bs-sky" viewBox="0 0 1200 220" preserveAspectRatio="xMidYMax slice">
          <path d="M0 220 V170 H40 V120 H70 V150 H110 V90 H150 V140 H180 V60 H200 V40 H210 V60 H230 V150 H270 V110 H320 V160 H350 V80 H400 V130 H440 V100 H470 V30 H480 V100 H510 V150 H560 V120 H600 V70 H650 V140 H690 V100 H720 V160 H760 V50 H800 V130 H840 V90 H880 V150 H920 V110 H960 V70 H990 V140 H1030 V100 H1070 V160 H1110 V120 H1150 V150 H1200 V220" />
        </svg>
        <div className="sc-bs-dots">
          {DOTS.map(([x, y], i) => <i key={i} className={i === SESSION_DOT[city] ? "is-session" : undefined} style={{ left: `${x}%`, top: `${y}%`, "--i": i } as React.CSSProperties} />)}
        </div>
        <div className="sc-bs-pulse" />
      </div>

      <div className="sc-bs-grid">
        <div className="relative z-10">{children}</div>
        <MotionScope tilt className="sc-bs-stage" aria-hidden>
          {/* Zähler: läuft live mit, ohne Bewegung steht die 5 */}
          <div className="sc-bs-count">
            <p className="meta text-[var(--stone)]">{h.counter}</p>
            <p className="sc-bs-n poster"><span key={`${city}-${step}`} className="sc-bs-n-live">{step}</span><span className="sc-bs-n-static">5</span></p>
            <p className="meta text-white/60">{h.of}</p>
            <div className="sc-bs-bar">{Array.from({ length: 5 }, (_, i) => <i key={i} data-on={i < step ? "" : undefined} />)}</div>
          </div>
          <div className="sc-bs-scene">
            <div className="sc-bs-tilt">
              <div className="sc-bs-phone">
                <span className="sc-hero-edge" />
                <PhoneFrame time={UI[lang].status} className="mx-0 bg-[#070b14]" pw="var(--bs-pw)">
                  <div className="flex h-full flex-col bg-[var(--ink)] px-3 pb-4 text-[var(--bone)]">
                    <p className="meta flex items-center gap-1.5 text-[0.55rem] whitespace-nowrap text-[var(--stone)]"><Lock className="size-3 shrink-0" />Backstage · {t.showcase.backstage.mode}</p>
                    <p key={city} className="sc-bs-city poster mt-2 text-[1.9rem] leading-none">{c.city}</p>
                    <p className="meta mt-1.5 text-[0.6rem] text-white/65">{c.dates}</p>
                    <div key={`deck-${city}`} className="sc-bs-deck">
                      {c.cards.map((card, i) => (
                        <div key={card.title + i} className="sc-bs-card" data-state={i === 4 && step >= 5 ? "liked" : i < step ? "out" : i === step ? "in" : "wait"} data-last={i === 4 ? "" : undefined}>
                          <span className="relative block h-[50%] overflow-hidden rounded-t-[14px]"><Photo name={card.image as PhotoName} sizes="240px" /></span>
                          <div className="grid gap-1 p-3">
                            <span className="meta text-[0.55rem] text-[var(--stone)]">{h.kinds[card.kind as keyof typeof h.kinds]}</span>
                            <span className="text-[0.95rem] leading-tight font-semibold">{card.title}</span>
                            <span className="text-[0.7rem] text-white/65">{card.sub}</span>
                          </div>
                          <span className="sc-bs-like"><Check className="size-4" /></span>
                        </div>
                      ))}
                    </div>
                  </div>
                </PhoneFrame>
                <span className="sc-hero-glare" />
              </div>
              {/* Session bestätigt */}
              <div key={`ok-${city}`} className="sc-bs-confirm sc-glass">
                <p className="meta flex items-center gap-2 text-[0.6rem] text-[var(--bone)]"><span className="grid size-5 place-items-center rounded-full bg-primary"><Check className="size-3" /></span>{h.confirmed}</p>
                <p className="mt-2 text-base font-semibold">{c.session.place}</p>
                <div className="mt-2 flex items-center justify-between gap-3">
                  <p className="meta text-[0.58rem] whitespace-nowrap text-white/70">{c.session.date} · {c.session.time}</p>
                  <span className="flex -space-x-2">
                    {(["for-artists", "artists"] as const).map((p) => <span key={p} className="relative block size-6 overflow-hidden rounded-full ring-2 ring-[var(--ink)]"><Photo name={p} sizes="32px" /></span>)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </MotionScope>
      </div>
    </section>
  );
}
