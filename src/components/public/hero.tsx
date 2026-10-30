"use client";

import { useLayoutEffect, useRef } from "react";
import Link from "next/link";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

// Hero der Startseite: Das Foto ist die Bühne. Beim Laden zeichnet sich ein DJ-Pult (zwei Plattenteller + Mixer),
// das Bühnenfoto erscheint in seiner Silhouette, die Teller drehen an, dann zoomt die Maske durch den Mixer ins Vollbild.
// „Connect“ steigt Buchstabe für Buchstabe auf. Beim Scrollen zieht der Text weg, „Willkommen im Netzwerk.“
// erscheint und das Bild rahmt sich ein, bevor die Seite übernimmt.
// Aufbau und Timings folgen dem Hero-Konzept (siehe docs/hero-konzept.md).

const NAME = "Connect";
const FULL = "inset(0% 0% 0% 0% round 0vw 0vw 0vw 0vw)";
const INTRO_TARGETS =
  "[data-hero-img], [data-hero-shade], [data-hero-name] .ch, [data-hero-script], [data-hero-eyebrow] > *, [data-hero-foot] > *, [data-hero-bar]";
const DECKS = [235, 765];

type HeroProps = {
  image: string;
  phaseLabel: string;
  creativeCount: number;
  companyCount: number;
  packageCount: number;
};

const ghostBtn =
  "meta inline-flex h-12 items-center justify-center gap-2 border border-white/40 px-5 text-white transition-colors hover:bg-white hover:text-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";
const primaryBtn =
  "meta inline-flex h-12 items-center justify-center gap-2 bg-primary px-5 text-primary-foreground transition-colors hover:bg-[var(--signal)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";

// Linienzeichnung des DJ-Pults – gleiche Geometrie wie die Maske in globals.css (viewBox 1000 × 440)
function Deck() {
  return (
    <svg viewBox="0 0 1000 440" aria-hidden>
      {DECKS.map((cx) => (
        <g key={cx}>
          <circle data-deck-draw pathLength={1} cx={cx} cy={220} r={175} />
          <circle data-deck-draw pathLength={1} cx={cx} cy={220} r={162} />
          <g data-deck-spin data-origin={`${cx} 220`} data-deck-fade>
            {[140, 118, 96, 74].map((r) => (
              <circle key={r} cx={cx} cy={220} r={r} fill="none" stroke="currentColor" strokeOpacity={0.45} strokeWidth={1.2} strokeDasharray="38 14" />
            ))}
            <line x1={cx} y1={174} x2={cx} y2={150} stroke="var(--signal)" strokeWidth={3} />
          </g>
          <circle data-deck-draw className="accent" pathLength={1} cx={cx} cy={220} r={46} />
          <circle data-deck-fade cx={cx} cy={220} r={4} fill="currentColor" />
          {/* Tonarm */}
          <circle data-deck-draw pathLength={1} cx={cx + 150} cy={58} r={14} />
          <path data-deck-draw pathLength={1} d={`M${cx + 150} 72 L${cx + 150} 128 L${cx + 96} 200`} />
          <path data-deck-draw pathLength={1} d={`M${cx + 90} 192 l16 12 l-9 13 l-16 -12 z`} />
        </g>
      ))}
      {/* Mixer */}
      <rect data-deck-draw pathLength={1} x={432} y={40} width={136} height={360} rx={14} />
      {[468, 532].map((x) => (
        <g key={x}>
          {[82, 118, 154].map((y) => <circle key={y} data-deck-draw pathLength={1} cx={x} cy={y} r={11} />)}
          <path data-deck-draw pathLength={1} d={`M${x} 212 L${x} 330`} />
          <rect data-deck-draw className="accent" pathLength={1} x={x - 12} y={x === 468 ? 250 : 282} width={24} height={12} />
        </g>
      ))}
      <path data-deck-draw pathLength={1} d="M456 370 L544 370" />
      <rect data-deck-draw className="accent" pathLength={1} x={492} y={363} width={16} height={14} />
      <text data-deck-fade x={500} y={196} textAnchor="middle">CC</text>
    </svg>
  );
}

export function Hero({ image, phaseLabel, creativeCount, companyCount, packageCount }: HeroProps) {
  const root = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const el = root.current;
    const html = document.documentElement;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      html.removeAttribute("data-intro");
      return;
    }

    gsap.registerPlugin(ScrollTrigger);
    const small = window.innerWidth < 761;

    const lenis = new Lenis({ lerp: 0.11, smoothWheel: true });
    lenis.on("scroll", ScrollTrigger.update);
    const raf = (t: number) => lenis.raf(t * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    let intro: gsap.core.Timeline | null = null;
    const finishIntro = () => {
      if (intro && intro.progress() < 1) intro.timeScale(6); // abkürzen statt abbrechen
    };

    // Die Navbar liegt außerhalb der Section (Layout) – sie wird per Element-Referenz mitanimiert
    const nav = document.querySelector<HTMLElement>("[data-hero-nav]");

    const ctx = gsap.context(() => {
      // Intro nur ohne Anker – mit Anker ist der CSS-Zustand bereits der fertige
      if (location.hash) {
        html.removeAttribute("data-intro");
      } else {
        html.setAttribute("data-intro", "");
        window.scrollTo(0, 0);
        intro = gsap
          .timeline({ defaults: { ease: "expo.inOut" } })
          // 1. DJ-Pult zeichnet sich, Teller drehen an, das Foto füllt die Silhouette
          .fromTo("[data-deck-draw]", { strokeDasharray: 1, strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 1.1, stagger: 0.018, ease: "power2.inOut" }, 0)
          .fromTo("[data-deck-fade]", { opacity: 0 }, { opacity: 1, duration: 0.6, ease: "power2.out" }, 0.3)
          .fromTo("[data-deck-spin]", { rotation: 0 }, { rotation: 300, svgOrigin: (_: number, t: Element) => t.getAttribute("data-origin") ?? "0 0", duration: 2.2, ease: "power2.in" }, 0.2)
          .fromTo("[data-hero-img]", { opacity: 0, scale: 1.45 }, { opacity: 1, scale: 1.15, duration: 2.6, ease: "expo.out" }, 0.45)
          // 2. Zoom durch den Mixer ins Vollbild
          .fromTo("[data-hero-stage]", { "--deck-w": small ? "94vw" : "64vw" }, { "--deck-w": "2200vw", duration: 1.5, ease: "power4.in" }, 1.05)
          .fromTo("[data-hero-deck]", { opacity: 1 }, { opacity: 0, duration: 0.5, ease: "power1.in" }, 1.6)
          // 3. Typo und Bedienelemente
          .fromTo("[data-hero-shade]", { opacity: 0 }, { opacity: 1, duration: 1.2, ease: "power2.out" }, 2.2)
          .fromTo("[data-hero-name] .ch", { yPercent: 110 }, { yPercent: 0, duration: 1.3, stagger: 0.055, ease: "expo.out" }, 2.3)
          .fromTo("[data-hero-script]", { opacity: 0, x: -40 }, { opacity: 1, x: 0, duration: 1.4, ease: "expo.out" }, 2.45)
          .fromTo("[data-hero-eyebrow] > *", { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 1, stagger: 0.06, ease: "power3.out" }, 2.5)
          .fromTo(nav, { opacity: 0, y: -20 }, { opacity: 1, y: 0, duration: 1, ease: "power3.out" }, 2.55)
          .fromTo("[data-hero-foot] > *", { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 1.1, stagger: 0.1, ease: "power3.out" }, 2.65)
          .fromTo("[data-hero-bar]", { opacity: 0 }, { opacity: 1, duration: 1, ease: "power2.out" }, 2.8)
          .eventCallback("onComplete", () => {
            html.removeAttribute("data-intro");
            gsap.set(INTRO_TARGETS, { clearProps: "all" });
            gsap.set("[data-hero-stage]", { clearProps: "--deck-w" });
            if (nav) gsap.set(nav, { clearProps: "opacity,transform" });
          });
      }

      // Scroll: Hero → Seite. Nur fromTo mit festen Werten, damit jede Scroll-Position eindeutig ist.
      gsap
        .timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: el,
            start: "top top",
            end: "bottom bottom",
            scrub: 0.8,
            onUpdate: (s) => {
              if (s.progress > 0.02) finishIntro();
            },
          },
        })
        .fromTo("[data-hero-zoom]", { scale: 1 }, { scale: 0.88, duration: 1 }, 0)
        .fromTo("[data-hero-content]", { yPercent: 0, opacity: 1 }, { yPercent: -14, opacity: 0, duration: 0.38, ease: "power1.in" }, 0)
        .fromTo("[data-hero-barwrap]", { opacity: 1 }, { opacity: 0, duration: 0.2 }, 0)
        .fromTo("[data-hero-second]", { autoAlpha: 0, y: 70 }, { autoAlpha: 1, y: 0, duration: 0.25, ease: "power2.out" }, 0.38)
        .fromTo(
          "[data-hero-frame]",
          { clipPath: FULL },
          { clipPath: small ? "inset(2vh 3vw 2vh 3vw round 0vw 0vw 0vw 0vw)" : "inset(4vh 3vw 4vh 3vw round 0vw 0vw 0vw 0vw)", duration: 0.3, ease: "power2.inOut" },
          0.7,
        );
    }, el);

    window.addEventListener("wheel", finishIntro, { once: true, passive: true });
    window.addEventListener("touchmove", finishIntro, { once: true, passive: true });
    window.addEventListener("keydown", finishIntro, { once: true });

    return () => {
      window.removeEventListener("wheel", finishIntro);
      window.removeEventListener("touchmove", finishIntro);
      window.removeEventListener("keydown", finishIntro);
      html.removeAttribute("data-intro");
      ctx.revert();
      gsap.ticker.remove(raf);
      lenis.destroy();
    };
  }, []);

  return (
    <section ref={root} className="hero" aria-labelledby="hero-title">
      <div className="hero__stage" data-hero-stage>
        <div className="hero__frame" data-hero-frame>
          <div className="hero__media" data-hero-media>
            <div className="hero__zoom" data-hero-zoom>
              {/* eslint-disable-next-line @next/next/no-img-element -- großes Bühnenbild wird per GSAP skaliert, Stock-Quelle */}
              <img src={image} alt="" data-hero-img fetchPriority="high" />
            </div>
            <div className="hero__shade" data-hero-shade />
          </div>
          <div className="hero__deck" data-hero-deck>
            <Deck />
          </div>
        </div>

        <div className="hero__content" data-hero-content>
          <p className="hero__eyebrow meta" data-hero-eyebrow>
            <span>
              <i aria-hidden />
              <span className="sm:hidden">Für Unternehmen</span>
              <span className="hidden sm:inline">Für Marken · Agenturen · Gaming · Labels</span>
            </span>
            <span>
              <span className="sm:hidden">CC—001</span>
              <span className="hidden sm:inline">CC—001 / Produktion &amp; Licensing</span>
            </span>
          </p>

          <span aria-hidden />

          <h1 id="hero-title" className="lockup" aria-label="Creative Connect – das Kreativ-Netzwerk für Unternehmen">
            <span className="lockup__script" data-hero-script aria-hidden>
              Creative
            </span>
            <span className="lockup__name" data-hero-name aria-hidden>
              {[...NAME].map((c, i) => (
                <span key={i} className="ch">
                  {c}
                </span>
              ))}
            </span>
          </h1>

          <div className="hero__foot" data-hero-foot>
            <p>
              <strong className="mb-2 block text-xl font-semibold text-white sm:text-2xl">Nestos Netzwerk. Für eure Produktion.</strong>
              <span className="hero__desc">Paket buchen, Artist anfragen oder selbst Teil des Netzwerks werden – Musik, Video, Foto und Design aus einer Hand.</span>
            </p>
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
              <Link href="/pakete" className={primaryBtn}>
                Paket buchen <ArrowUpRight className="size-4" aria-hidden />
              </Link>
              <Link href="/mitglieder" className={ghostBtn}>
                Artist anfragen
              </Link>
              <Link href="/bewerben" className={ghostBtn}>
                Als Artist anbieten
              </Link>
            </div>
          </div>
        </div>

        <div className="hero__second" data-hero-second aria-hidden>
          <p className="big">
            <span className="sc">Willkommen im</span>Netzwerk.
          </p>
        </div>

        <div data-hero-barwrap>
          <div className="hero__bar" data-hero-bar>
            <span>
              <span className="hero__dot" aria-hidden /> {phaseLabel}
            </span>
            <span className="hero__bar-extra">{creativeCount} Artists · {companyCount} Brands</span>
            <span className="hero__bar-extra">{packageCount} Pakete ab sofort</span>
            <span className="hero__bar-extra">
              Scrollen <ArrowDown className="size-3.5 animate-bounce" aria-hidden />
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
