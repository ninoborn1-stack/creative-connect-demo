"use client";

import { useLayoutEffect, useRef } from "react";
import Link from "next/link";
import { ArrowDown, ArrowRight } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

// Hero der Startseite: Das Foto ist die Bühne. Beim Laden öffnet es sich aus einem Bogen zum Vollbild,
// „Connect“ steigt Buchstabe für Buchstabe auf. Beim Scrollen zieht der Text weg, „Willkommen im Netzwerk.“
// erscheint und das Bild rahmt sich mit runden Ecken ein, bevor die Seite übernimmt.
// Aufbau und Timings folgen dem Hero-Konzept (siehe docs/hero-konzept.md).

const NAME = "Connect";
const FULL = "inset(0% 0% 0% 0% round 0vw 0vw 0vw 0vw)";
const INTRO_TARGETS = "[data-hero-media], [data-hero-img], [data-hero-shade], [data-hero-name] .ch, [data-hero-script], [data-hero-eyebrow] > *, [data-hero-foot] > *, [data-hero-bar]";

type HeroProps = {
  image: string;
  phaseLabel: string;
  creativeCount: number;
  cityCount: number;
  commissionPct: number;
  canRegister: boolean;
  inviteHref: string;
};

const ghostBtn =
  "inline-flex h-12 items-center justify-center gap-2 rounded-full border border-white/35 bg-white/10 px-6 text-sm font-medium text-white backdrop-blur-sm transition-colors hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";
const primaryBtn =
  "inline-flex h-12 items-center justify-center gap-2 rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground shadow-lg shadow-black/30 transition-colors hover:bg-primary/85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";

export function Hero({ image, phaseLabel, creativeCount, cityCount, commissionPct, canRegister, inviteHref }: HeroProps) {
  const root = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const el = root.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

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
      if (!location.hash) {
        window.scrollTo(0, 0);
        intro = gsap
          .timeline({ defaults: { ease: "expo.inOut" } })
          .fromTo(
            "[data-hero-media]",
            { clipPath: small ? "inset(22% 14% 22% 14% round 60vw 60vw 0vw 0vw)" : "inset(16% 36% 16% 36% round 20vw 20vw 0vw 0vw)" },
            { clipPath: FULL, duration: 1.9 },
            0.15,
          )
          .fromTo("[data-hero-img]", { scale: 1.45 }, { scale: 1.15, duration: 2.4, ease: "expo.out" }, 0.15)
          .fromTo("[data-hero-shade]", { opacity: 0 }, { opacity: 1, duration: 1.2, ease: "power2.out" }, 1.1)
          .fromTo("[data-hero-name] .ch", { yPercent: 110 }, { yPercent: 0, duration: 1.4, stagger: 0.06, ease: "expo.out" }, 1.25)
          .fromTo("[data-hero-eyebrow] > *", { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 1, stagger: 0.06, ease: "power3.out" }, 1.5)
          .fromTo("[data-hero-script]", { opacity: 0, x: -30 }, { opacity: 1, x: 0, duration: 1.6, ease: "expo.out" }, 1.6)
          .fromTo(nav, { opacity: 0, y: -20 }, { opacity: 1, y: 0, duration: 1, ease: "power3.out" }, 1.6)
          .fromTo("[data-hero-foot] > *", { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 1.1, stagger: 0.1, ease: "power3.out" }, 1.75)
          .fromTo("[data-hero-bar]", { opacity: 0 }, { opacity: 1, duration: 1, ease: "power2.out" }, 1.9)
          .eventCallback("onComplete", () => {
            gsap.set(INTRO_TARGETS, { clearProps: "all" });
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
          { clipPath: small ? "inset(2vh 3vw 2vh 3vw round 2vw 2vw 2vw 2vw)" : "inset(4vh 3vw 4vh 3vw round 1.5vw 1.5vw 1.5vw 1.5vw)", duration: 0.3, ease: "power2.inOut" },
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
      ctx.revert();
      gsap.ticker.remove(raf);
      lenis.destroy();
    };
  }, []);

  return (
    <section ref={root} className="hero" aria-labelledby="hero-title">
      <div className="hero__stage">
        <div className="hero__frame" data-hero-frame>
          <div className="hero__media" data-hero-media>
            <div className="hero__zoom" data-hero-zoom>
              {/* eslint-disable-next-line @next/next/no-img-element -- großes Bühnenbild wird per GSAP skaliert, Stock-Quelle */}
              <img src={image} alt="" data-hero-img fetchPriority="high" />
            </div>
            <div className="hero__shade" data-hero-shade />
          </div>
        </div>

        <div className="hero__content" data-hero-content>
          <p className="hero__eyebrow" data-hero-eyebrow>
            <span>
              <span className="sm:hidden">Crew-Plattform</span>
              <span className="hidden sm:inline">Musik · Film · Foto · Design</span>
            </span>
            <i aria-hidden />
            <span>Deutschlandweit</span>
          </p>

          <h1 id="hero-title" className="lockup" aria-label="Creative Connect – Deine Crew. Dein Netzwerk. Ein Klick.">
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
              <strong className="block font-heading text-xl font-semibold text-white sm:text-2xl">Deine Crew. Dein Netzwerk. Ein Klick.</strong>
              Kuratierte Kreative aus Musik, Film, Foto, Design und Schauspiel – Briefing, Vertrag, Zahlung und Abnahme in einem Ablauf.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              {canRegister && (
                <Link href="/registrieren" className={primaryBtn}>
                  Projekt starten <ArrowRight className="size-4" aria-hidden />
                </Link>
              )}
              <Link href={inviteHref} className={canRegister ? ghostBtn : primaryBtn}>
                Einladung einlösen {!canRegister && <ArrowRight className="size-4" aria-hidden />}
              </Link>
              <Link href="/warteliste" className={ghostBtn}>
                Auf die Warteliste
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
            <span className="hero__bar-extra">{creativeCount} Kreative · {cityCount} Städte</span>
            <span className="hero__bar-extra">{commissionPct} % Provision für Kreative</span>
            <span className="hidden sm:inline-flex">
              Scrollen <ArrowDown className="size-3.5 animate-bounce" aria-hidden />
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
