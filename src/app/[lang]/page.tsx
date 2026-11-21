import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Layers, LayoutList, Lock, Shuffle, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { getDict, hasLocale, href, type Locale } from "@/lib/i18n";
import { pageMeta } from "@/lib/meta";
import { CtaLink, Eyebrow, FaqList, Section, SectionHeading } from "@/components/site/bits";
import { Photo } from "@/components/site/photo";
import { StoreBadges } from "@/components/site/stores";
import { WaitlistForm } from "@/components/site/waitlist-form";
import { DeckIntro } from "@/components/site/deck-intro";
import { PreviewLoader } from "@/components/preview/preview-loader";
import { PreviewPlaceholder } from "@/components/preview/preview-placeholder";

export async function generateMetadata({ params }: PageProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  return hasLocale(lang) ? pageMeta(lang, "") : {};
}

export default async function HomePage({ params }: PageProps<"/[lang]">) {
  const lang = (await params).lang as Locale;
  const t = getDict(lang);
  const audienceImages = ["organizers", "studio", "business"] as const;
  const modes = [{ icon: Layers, ...t.modes.swipe }, { icon: LayoutList, ...t.modes.scroll }];
  const algos = [{ icon: Sparkles, ...t.algo.on }, { icon: Shuffle, ...t.algo.off }];

  return (
    <>
      <DeckIntro />
      {/* ---------- Hero: Claim + Warteliste links, interaktive Vorschau rechts ---------- */}
      <section aria-labelledby="hero-title" className="relative isolate overflow-hidden bg-[var(--ink)] text-[var(--bone)]">
        <div className="absolute inset-0 -z-10">
          <Photo name="hero" sizes="100vw" className="opacity-30 grayscale" />
          <div className="absolute inset-0 bg-gradient-to-r from-[var(--ink)] via-[var(--ink)]/85 to-[var(--ink)]/60" />
        </div>
        <div className="gutter grid grid-cols-[minmax(0,1fr)] items-center gap-12 py-14 sm:py-20 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-6 xl:col-span-7">
            <p className="meta flex items-center gap-3 text-[var(--stone)]"><span aria-hidden className="size-2 bg-primary" />{t.hero.eyebrow}</p>
            <h1 id="hero-title" className="poster mt-6 text-[clamp(2.8rem,8.4vw,9rem)] lg:text-[clamp(3.4rem,4.8vw,6.5rem)]">
              {t.hero.title} <span className="text-primary">{t.hero.accent}</span>
            </h1>
            <p className="mt-8 max-w-xl text-lg text-white/85 sm:text-xl">{t.hero.lead}</p>
            <div className="mt-10 flex flex-col gap-2 sm:flex-row">
              <CtaLink href={href(lang, "warteliste")}>{t.hero.primary} <ArrowUpRight className="size-4" aria-hidden /></CtaLink>
              <CtaLink href={href(lang, "artists")} variant="ghost">{t.hero.secondary}</CtaLink>
            </div>
            <p className="meta mt-6 text-white/70">{t.hero.note}</p>
          </div>
          <div className="lg:col-span-6 xl:col-span-5">
            <p className="text-center text-lg font-semibold text-balance">{t.hero.previewTitle}</p>
            <p className="mx-auto mt-1 mb-6 max-w-xs text-center text-xs text-white/70">{t.hero.previewNote}</p>
            <PreviewLoader lang={lang} placeholder={<PreviewPlaceholder lang={lang} />} />
          </div>
        </div>
      </section>

      {/* ---------- 01 Drei Kernnutzen ---------- */}
      <Section id="nutzen" labelledBy="benefits-title">
        <SectionHeading id="benefits-title" eyebrow={t.benefits.eyebrow} title={t.benefits.title} />
        <ol className="mt-14 grid gap-px border bg-border lg:grid-cols-3">
          {t.benefits.items.map((b) => (
            <li key={b.n} className="flex flex-col gap-10 bg-background p-6 sm:p-8">
              <span className="poster text-6xl text-primary">{b.n}</span>
              <div>
                <h3 className="poster text-[clamp(1.8rem,2.6vw,2.6rem)]">{b.title}</h3>
                <p className="mt-3 text-muted-foreground">{b.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </Section>

      {/* ---------- 02 Swipe oder Scroll ---------- */}
      <section id="modi" aria-labelledby="modes-title" className="gutter scroll-mt-16 border-t py-20 sm:py-32">
        <Eyebrow>{t.modes.eyebrow}</Eyebrow>
        <h2 id="modes-title" className="poster mt-6 text-[clamp(2.1rem,7vw,7rem)]">{t.modes.title} <span className="text-primary">{t.modes.accent}</span></h2>
        <ul className="mt-14 grid gap-px border bg-border md:grid-cols-2">
          {modes.map(({ icon: Icon, title, text }) => (
            <li key={title} className="flex flex-col gap-8 bg-background p-6 sm:p-10">
              <Icon className="size-10 text-primary" aria-hidden />
              <div>
                <h3 className="poster text-[clamp(2.2rem,3.6vw,3.6rem)]">{title}</h3>
                <p className="mt-3 max-w-md text-muted-foreground sm:text-lg">{text}</p>
              </div>
            </li>
          ))}
        </ul>
        <p className="meta mt-6 text-muted-foreground">{t.modes.note}</p>
      </section>

      {/* ---------- 03 Zugang: Offen, Geprüft, Backstage ---------- */}
      <Section id="zugang" labelledBy="access-title" className="border-t">
        <SectionHeading id="access-title" eyebrow={t.access.eyebrow} title={t.access.title} />
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
          <SectionHeading id="audiences-title" eyebrow={t.audiences.eyebrow} title={t.audiences.title} />
        </div>
        <ul className="mt-14 grid gap-px bg-border sm:mt-20 lg:grid-cols-3">
          {t.audiences.items.map((a, i) => (
            <li key={a.title} className="group relative isolate flex aspect-[4/5] flex-col justify-end overflow-hidden sm:aspect-[16/9] lg:aspect-[4/5] bg-[var(--ink)] text-[var(--bone)]">
              <Photo name={audienceImages[i]} sizes="(max-width: 768px) 100vw, 33vw" pictureClassName="-z-10" className="opacity-60 grayscale transition-all duration-700 group-hover:scale-105 group-hover:opacity-85 group-hover:grayscale-0" />
              <div className="absolute inset-0 -z-10 bg-gradient-to-t from-[var(--ink)] via-[var(--ink)]/40 to-transparent" />
              <div className="p-5 sm:p-8">
                <h3 className="poster text-[clamp(2.2rem,3vw,3.4rem)]">
                  <Link href={href(lang, a.key as "veranstalter" | "unternehmen")} className="after:absolute after:inset-0">{a.title}</Link>
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
