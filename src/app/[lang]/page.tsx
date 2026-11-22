import type { Metadata } from "next";
import Link from "next/link";
import { ArrowDown, ArrowUpRight, Lock, Shuffle, Sparkles } from "lucide-react";
import { PreviewLink } from "@/components/showcase/preview-link";
import { cn } from "@/lib/utils";
import { APP_NAME } from "@/lib/brand";
import { getDict, hasLocale, href, type Locale } from "@/lib/i18n";
import { pageMeta } from "@/lib/meta";
import { CtaLink, Eyebrow, FaqList, Section, SectionHeading } from "@/components/site/bits";
import { Photo } from "@/components/site/photo";
import { StoreBadges } from "@/components/site/stores";
import { WaitlistForm } from "@/components/site/waitlist-form";
import { DeckIntro } from "@/components/site/deck-intro";
import { Accent } from "@/components/showcase/accent";
import { HeroShowcase } from "@/components/showcase/hero-showcase";
import { LayersScene } from "@/components/showcase/layers-scene";
import { TrySection } from "@/components/showcase/try-section";
import { CityMotion } from "@/components/showcase/city-motion";

export async function generateMetadata({ params }: PageProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  return hasLocale(lang) ? pageMeta(lang, "") : {};
}

export default async function HomePage({ params }: PageProps<"/[lang]">) {
  const lang = (await params).lang as Locale;
  const t = getDict(lang);
  const audienceImages = ["organizers", "studio", "business"] as const;
  const algos = [{ icon: Sparkles, ...t.algo.on }, { icon: Shuffle, ...t.algo.off }];

  return (
    <>
      <DeckIntro />
      {/* ---------- Hero: Claim + Warteliste links, interaktive Vorschau rechts ---------- */}
      <section aria-labelledby="hero-title" className="relative isolate overflow-hidden bg-[var(--ink)] text-[var(--bone)]">
        <div className="absolute inset-0 -z-10">
          <Photo name="hero" sizes="100vw" className="opacity-30 grayscale" />
          <div className="absolute inset-0 bg-gradient-to-r from-[var(--ink)] via-[var(--ink)]/85 to-[var(--ink)]/60" />
          <div className="sc-grid absolute inset-0" />
        </div>
        <div className="gutter grid min-h-[calc(100svh-4rem)] grid-cols-[minmax(0,1fr)] items-center gap-12 py-10 sm:py-14 lg:grid-cols-12 lg:gap-8 lg:py-6 [@media(orientation:landscape)_and_(max-height:540px)]:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] [@media(orientation:landscape)_and_(max-height:540px)]:items-start [@media(orientation:landscape)_and_(max-height:540px)]:gap-6 [@media(orientation:landscape)_and_(max-height:540px)]:py-6">
          <div className="lg:col-span-6 xl:col-span-7">
            <p className="meta flex items-center gap-3 text-[var(--stone)]"><span aria-hidden className="size-2 bg-primary" />{t.hero.eyebrow}</p>
            <h1 id="hero-title" className="poster mt-6 text-[clamp(2rem,10.5vw,2.8rem)] min-[400px]:text-[clamp(2.8rem,8.4vw,9rem)] lg:text-[clamp(3.4rem,4.8vw,6.5rem)] [@media(orientation:landscape)_and_(max-height:540px)]:mt-3 [@media(orientation:landscape)_and_(max-height:540px)]:text-[2.6rem]">
              <Accent text={t.hero.title} />
            </h1>
            <p className="mt-8 max-w-xl text-lg text-white/85 sm:text-xl [@media(orientation:landscape)_and_(max-height:540px)]:mt-4 [@media(orientation:landscape)_and_(max-height:540px)]:text-base">{t.hero.lead}</p>
            <div className="mt-10 flex flex-col gap-2 sm:flex-row [@media(orientation:landscape)_and_(max-height:540px)]:mt-5">
              <CtaLink href={href(lang, "warteliste")}>{t.hero.primary} <ArrowUpRight className="size-4" aria-hidden /></CtaLink>
              <PreviewLink screen="swipe" className="btn-shine meta relative inline-flex h-12 items-center justify-center gap-2 overflow-hidden border border-white/40 px-5 whitespace-nowrap text-white transition-colors hover:bg-white hover:text-black" testId="hero-try">{t.hero.secondary} <ArrowDown className="size-4" aria-hidden /></PreviewLink>
            </div>
            <p className="meta mt-6 text-white/70">{t.hero.note}</p>
          </div>
          <div className="lg:col-span-6 xl:col-span-5">
            <HeroShowcase lang={lang} t={t} />
            <p className="meta mt-6 text-center text-white/60">{t.hero.phoneNote.replace("{app}", APP_NAME)}</p>
          </div>
        </div>
      </section>

      {/* ---------- Explosionsansicht: die App in Schichten ---------- */}
      <LayersScene lang={lang} t={t} />

      {/* ---------- 01 Drei Kernnutzen ---------- */}
      <Section id="nutzen" labelledBy="benefits-title">
        <SectionHeading reveal id="benefits-title" eyebrow={t.benefits.eyebrow} title={t.benefits.title} />
        <ol className="mt-14 grid gap-px border bg-border lg:grid-cols-3">
          {t.benefits.items.map((b) => (
            <li key={b.n} className="flex flex-col gap-10 bg-background p-6 sm:p-8">
              <span className="poster text-6xl text-primary">{b.n}</span>
              <div>
                <h3 className="poster text-[1.5rem] min-[400px]:text-[clamp(1.8rem,2.6vw,2.6rem)]">{b.title}</h3>
                <p className="mt-3 text-muted-foreground">{b.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </Section>

      {/* ---------- Probier's selbst: interaktive Vorschau ---------- */}
      <TrySection lang={lang} t={t} />

      {/* ---------- 02 Die Szene in Bewegung ---------- */}
      <CityMotion lang={lang} t={t} />

      {/* ---------- 03 Zugang: Offen, Geprüft, Backstage ---------- */}
      <Section id="zugang" labelledBy="access-title" className="border-t">
        <SectionHeading reveal id="access-title" eyebrow={t.access.eyebrow} title={t.access.title} />
        <ol className="mt-14 grid gap-px border bg-border lg:grid-cols-3">
          {t.access.levels.map((level, i) => {
            const backstage = level.key === "backstage";
            const to = backstage ? href(lang, "backstage") : level.key === "verified" ? href(lang, "warteliste", undefined, { rolle: "artist" }) : href(lang, "warteliste");
            return (
              <li key={level.key} className={cn("flex flex-col gap-6 p-6 sm:p-8", backstage ? "bg-[var(--ink)] text-[var(--bone)]" : "bg-background")}>
                <span className="meta flex items-center gap-2 text-[var(--stone)]">
                  {backstage ? <Lock className="size-4" aria-hidden /> : <span aria-hidden className="size-2 bg-primary" />}
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="flex-1">
                  <h3 className="poster text-[clamp(2.2rem,3.4vw,3.6rem)]">{level.name}</h3>
                  <p className={cn("mt-3 font-semibold", backstage ? "text-white" : "text-foreground")}>{level.who}</p>
                  <p className={cn("mt-2", backstage ? "text-white/75" : "text-muted-foreground")}>{level.text}</p>
                </div>
                <CtaLink href={to} variant={backstage ? "light" : i === 0 ? "primary" : "outline"} className="self-start">
                  {level.cta} <ArrowUpRight className="size-4" aria-hidden />
                </CtaLink>
              </li>
            );
          })}
        </ol>
      </Section>

      {/* ---------- 04 Algorithmus an oder aus ---------- */}
      <section id="algorithmus" aria-labelledby="algo-title" className="gutter grid scroll-mt-16 gap-12 bg-[var(--stone)] py-20 text-[var(--ink)] sm:py-28 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <p className="meta flex items-center gap-3"><span aria-hidden className="size-2 bg-[var(--ink)]" />{t.algo.eyebrow}</p>
          <h2 id="algo-title" className="poster mt-6 text-[clamp(2.4rem,8vw,7rem)] lg:text-[clamp(3rem,5.6vw,6.5rem)]">{t.algo.title} <span className="text-outline [--stroke:var(--ink)]">{t.algo.accent}</span></h2>
          <p className="mt-6 max-w-xl sm:text-lg">{t.algo.text}</p>
        </div>
        <ul className="grid gap-px self-end border border-[var(--ink)]/20 bg-[var(--ink)]/20 lg:col-span-5">
          {algos.map(({ icon: Icon, title, text }) => (
            <li key={title} className="flex gap-4 bg-[var(--stone)] p-5">
              <Icon className="mt-1 size-6 shrink-0" aria-hidden />
              <div><h3 className="text-xl font-semibold">{title}</h3><p className="mt-1">{text}</p></div>
            </li>
          ))}
        </ul>
      </section>

      {/* ---------- 05 Für Artists ---------- */}
      <section id="artists" aria-labelledby="artists-title" className="grid scroll-mt-16 lg:grid-cols-2">
        <div className="gutter flex flex-col justify-center bg-primary py-16 text-primary-foreground sm:py-24">
          <p className="meta flex items-center gap-3"><span aria-hidden className="size-2 bg-[var(--bone)]" />{t.forArtists.eyebrow}</p>
          <h2 id="artists-title" className="poster mt-6 text-[clamp(2.4rem,7vw,6rem)] lg:text-[clamp(3rem,4.6vw,5.5rem)]">{t.forArtists.title}</h2>
          <p className="mt-6 max-w-lg sm:text-lg">{t.forArtists.text}</p>
          <div className="mt-10">
            <CtaLink href={href(lang, "artists")} variant="light">{t.forArtists.cta} <ArrowUpRight className="size-4" aria-hidden /></CtaLink>
          </div>
        </div>
        <div className="relative min-h-[50svh] lg:min-h-[70svh]">
          <Photo name="for-artists" sizes="(max-width: 1024px) 100vw, 50vw" className="grayscale-[30%]" />
        </div>
      </section>

      {/* ---------- 06 Für Veranstalter, Studios & Unternehmen ---------- */}
      <section id="fuer-alle" aria-labelledby="audiences-title" className="scroll-mt-16 pt-20 sm:pt-32">
        <div className="gutter">
          <SectionHeading reveal id="audiences-title" eyebrow={t.audiences.eyebrow} title={t.audiences.title} />
        </div>
        <ul className="mt-14 grid gap-px bg-border sm:mt-20 lg:grid-cols-3">
          {t.audiences.items.map((a, i) => (
            <li key={a.title} className="group relative isolate flex aspect-[4/5] flex-col justify-end overflow-hidden sm:aspect-[16/9] lg:aspect-[4/5] bg-[var(--ink)] text-[var(--bone)]">
              <Photo name={audienceImages[i]} sizes="(max-width: 768px) 100vw, 33vw" pictureClassName="-z-10" className="opacity-60 grayscale transition-all duration-700 group-hover:scale-105 group-hover:opacity-85 group-hover:grayscale-0" />
              <div className="absolute inset-0 -z-10 bg-gradient-to-t from-[var(--ink)] via-[var(--ink)]/40 to-transparent" />
              <div className="p-5 sm:p-8">
                <h3 className="poster text-[1.8rem] min-[400px]:text-[clamp(2.2rem,3vw,3.4rem)]">
                  <Link href={href(lang, a.key as "veranstalter" | "unternehmen")} className="inline-flex min-h-11 items-center after:absolute after:inset-0">{a.title}</Link>
                </h3>
                <p className="mt-3 max-w-sm text-white/85">{a.text}</p>
                <span className="meta mt-6 inline-flex items-center gap-2 text-[var(--stone)]">{t.audiences.cta} <ArrowUpRight className="size-4" aria-hidden /></span>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* ---------- 07 FAQ ---------- */}
      <Section id="faq" labelledBy="faq-title">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:sticky lg:top-24 lg:col-span-4 lg:self-start">
            <Eyebrow>{t.faq.eyebrow}</Eyebrow>
            <h2 id="faq-title" className="poster mt-6 text-[clamp(2.4rem,7vw,6rem)] lg:text-[clamp(2.6rem,3.8vw,4.5rem)]">{t.faq.title}</h2>
          </div>
          <div className="lg:col-span-8">
            <FaqList items={t.faq.items} />
          </div>
        </div>
      </Section>

      {/* ---------- 08 Abschluss: Warteliste ---------- */}
      <section id="warteliste" aria-labelledby="final-title" className="gutter grid scroll-mt-16 gap-12 bg-[var(--ink)] py-20 text-[var(--bone)] sm:py-28 lg:grid-cols-12">
        <div className="lg:col-span-6">
          <p className="meta flex items-center gap-3 text-white/75"><span aria-hidden className="size-2 bg-primary" />{t.finalCta.eyebrow}</p>
          <h2 id="final-title" className="poster mt-6 text-[clamp(2.6rem,8vw,7rem)] lg:text-[clamp(3rem,5vw,6rem)]">{t.finalCta.title} <span className="text-primary">{t.finalCta.accent}</span></h2>
          <p className="mt-6 max-w-lg text-white/85 sm:text-lg">{t.finalCta.text}</p>
          <StoreBadges lang={lang} t={t.stores} className="mt-10" />
        </div>
        <div className="lg:col-span-6 lg:self-end">
          <WaitlistForm lang={lang} t={t.waitlistPage} tone="ink" />
        </div>
      </section>
    </>
  );
}
