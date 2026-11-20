import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Check } from "lucide-react";
import { getDict, hasLocale, href, type Locale } from "@/lib/i18n";
import { pageMeta } from "@/lib/meta";
import { CtaLink, Eyebrow, FaqList, Section, SectionHeading } from "@/components/site/bits";
import { Hero } from "@/components/site/hero";
import { Photo } from "@/components/site/photo";
import { FeedMockup, ReminderMockup, SwipeMockup } from "@/components/site/phone";
import { StoreBadges } from "@/components/site/stores";

export async function generateMetadata({ params }: PageProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  return hasLocale(lang) ? pageMeta(lang, "") : {};
}

export default async function HomePage({ params }: PageProps<"/[lang]">) {
  const { lang: raw } = await params;
  const lang = raw as Locale;
  const t = getDict(lang);
  const audienceImages = ["organizers", "studio", "business"] as const;

  return (
    <>
      {/* ---------- Hero: DJ-Pult-Intro + Scroll-Übergang ---------- */}
      <Hero lang={lang} t={t.hero} photo={<Photo name="hero" sizes="100vw" priority fill={false} imgProps={{ "data-hero-img": "" }} />} />

      {/* ---------- 01 Statement ---------- */}
      <section aria-labelledby="statement-title" className="gutter pt-24 pb-16 sm:pt-36 sm:pb-24">
        <Eyebrow>{t.statement.eyebrow}</Eyebrow>
        <h2 id="statement-title" className="poster mt-8 text-[clamp(3rem,9vw,10rem)] text-balance">
          {t.statement.title} <span className="text-primary">{t.statement.accent}</span>
        </h2>
        <p className="mt-8 max-w-xl text-lg text-pretty text-muted-foreground sm:text-xl">{t.statement.text}</p>
      </section>

      {/* ---------- 02 App-Vorschau: Swipe und Feed im Handy-Rahmen ---------- */}
      <section id="vorschau" aria-labelledby="preview-title" className="gutter grid scroll-mt-16 grid-cols-[minmax(0,1fr)] items-center gap-12 bg-[var(--ink)] py-20 text-[var(--bone)] sm:py-28 xl:grid-cols-12">
        <div className="xl:col-span-5">
          <p className="meta flex items-center gap-3 text-white/70"><span aria-hidden className="size-2 bg-primary" />{t.preview.eyebrow}</p>
          <h2 id="preview-title" className="poster mt-6 text-[clamp(2.8rem,7vw,7.5rem)] text-balance xl:text-[clamp(3rem,5.2vw,6rem)]">{t.preview.title} <span className="text-[var(--stone)]">{t.preview.accent}</span></h2>
          <p className="mt-6 max-w-lg text-white/80 sm:text-lg">{t.preview.text}</p>
          <p className="meta mt-8 text-white/60">{t.preview.hint}</p>
        </div>
        <div className="flex flex-wrap justify-center gap-8 xl:col-span-7">
          <SwipeMockup t={t.preview} />
          <FeedMockup t={t.preview} />
        </div>
      </section>

      {/* ---------- 03 Drei Kernnutzen ---------- */}
      <Section id="nutzen" labelledBy="benefits-title">
        <SectionHeading id="benefits-title" eyebrow={t.benefits.eyebrow} title={t.benefits.title} />
        <ol className="mt-14 grid gap-px border bg-border md:grid-cols-3">
          {t.benefits.items.map((b) => (
            <li key={b.n} className="flex flex-col gap-10 bg-background p-6 sm:p-8">
              <span className="poster text-6xl text-primary">{b.n}</span>
              <div>
                <h3 className="poster text-[clamp(2rem,3vw,3rem)]">{b.title}</h3>
                <p className="mt-3 text-muted-foreground">{b.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </Section>

      {/* ---------- 04 Event-Erinnerungen ---------- */}
      <section id="erinnerungen" aria-labelledby="reminders-title" className="gutter grid scroll-mt-16 items-center gap-12 border-t py-20 sm:py-32 lg:grid-cols-12">
        <div className="flex justify-center lg:order-2 lg:col-span-5">
          <ReminderMockup t={t.reminders} />
        </div>
        <div className="lg:col-span-7">
          <Eyebrow>{t.reminders.eyebrow}</Eyebrow>
          <h2 id="reminders-title" className="poster mt-6 text-[clamp(2.8rem,7vw,7.5rem)] text-balance">{t.reminders.title}</h2>
          <p className="mt-6 max-w-xl text-lg text-muted-foreground">{t.reminders.text}</p>
          <ul className="mt-10 max-w-xl border-t">
            {t.reminders.points.map((p) => (
              <li key={p} className="flex gap-3 border-b py-4"><Check className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />{p}</li>
            ))}
          </ul>
        </div>
      </section>

      {/* ---------- 05 Musik entdecken ---------- */}
      <section id="musik" aria-labelledby="music-title" className="grid scroll-mt-16 lg:grid-cols-2">
        <div className="relative min-h-[50svh] lg:min-h-[80svh]">
          <Photo name="music" sizes="(max-width: 1024px) 100vw, 50vw" className="grayscale-[20%]" />
        </div>
        <div className="gutter flex flex-col justify-center bg-[var(--stone)] py-16 text-[var(--ink)] sm:py-24">
          <p className="meta flex items-center gap-3"><span aria-hidden className="size-2 bg-primary" />{t.music.eyebrow}</p>
          <h2 id="music-title" className="poster mt-6 text-[clamp(2.8rem,6vw,6.5rem)] text-balance">{t.music.title}</h2>
          <p className="mt-6 max-w-lg sm:text-lg">{t.music.text}</p>
          <ul className="mt-8 max-w-lg space-y-2">
            {t.music.points.map((p) => <li key={p} className="flex gap-3"><Check className="mt-0.5 size-5 shrink-0" aria-hidden />{p}</li>)}
          </ul>
        </div>
      </section>

      {/* ---------- 06 Für Artists: Split ---------- */}
      <section id="artists" aria-labelledby="artists-title" className="grid scroll-mt-16 lg:grid-cols-2">
        <div className="gutter flex flex-col justify-center bg-primary py-16 text-primary-foreground sm:py-24 lg:order-1">
          <p className="meta flex items-center gap-3 text-primary-foreground"><span aria-hidden className="size-2 bg-[var(--bone)]" />{t.forArtists.eyebrow}</p>
          <h2 id="artists-title" className="poster mt-6 text-[clamp(2.8rem,6vw,6.5rem)]">{t.forArtists.title}</h2>
          <p className="mt-6 max-w-lg text-primary-foreground sm:text-lg">{t.forArtists.text}</p>
          <div className="mt-10">
            <CtaLink href={href(lang, "artists")} variant="light">{t.forArtists.cta} <ArrowUpRight className="size-4" aria-hidden /></CtaLink>
          </div>
        </div>
        <div className="relative min-h-[50svh] lg:order-2 lg:min-h-[80svh]">
          <Photo name="for-artists" sizes="(max-width: 1024px) 100vw, 50vw" className="grayscale-[30%]" />
        </div>
      </section>

      {/* ---------- 07 Für Veranstalter, Locations, Unternehmen ---------- */}
      <section id="fuer-alle" aria-labelledby="audiences-title" className="scroll-mt-16 pt-20 sm:pt-32">
        <div className="gutter">
          <SectionHeading id="audiences-title" eyebrow={t.audiences.eyebrow} title={t.audiences.title} />
        </div>
        <ul className="mt-14 grid gap-px bg-border sm:mt-20 md:grid-cols-3">
          {t.audiences.items.map((a, i) => (
            <li key={a.title} className="group relative isolate flex aspect-[4/5] flex-col justify-end overflow-hidden bg-[var(--ink)] text-[var(--bone)]">
              <Photo name={audienceImages[i]} sizes="(max-width: 768px) 100vw, 33vw" className="-z-10 opacity-60 grayscale transition-all duration-700 group-hover:scale-105 group-hover:opacity-85 group-hover:grayscale-0" />
              <div className="absolute inset-0 -z-10 bg-gradient-to-t from-[var(--ink)] via-[var(--ink)]/40 to-transparent" />
              <div className="p-5 sm:p-8">
                <h3 className="poster text-[clamp(2.4rem,4vw,4.2rem)]">
                  <Link href={href(lang, a.key as "veranstalter" | "unternehmen")} className="after:absolute after:inset-0">{a.title}</Link>
                </h3>
                <p className="mt-3 max-w-sm text-white/85">{a.text}</p>
                <span className="meta mt-6 inline-flex items-center gap-2 text-[var(--stone)]">{t.audiences.cta} <ArrowUpRight className="size-4" aria-hidden /></span>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* ---------- 08 FAQ ---------- */}
      <Section id="faq" labelledBy="faq-title">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:sticky lg:top-24 lg:col-span-4 lg:self-start">
            <Eyebrow>{t.faq.eyebrow}</Eyebrow>
            <h2 id="faq-title" className="poster mt-6 text-[clamp(2.8rem,6vw,6.5rem)]">{t.faq.title}</h2>
          </div>
          <div className="lg:col-span-8">
            <FaqList items={t.faq.items} />
          </div>
        </div>
      </Section>

      {/* ---------- 09 Download ---------- */}
      <section aria-labelledby="download-title" className="gutter border-t py-24 sm:py-36">
        <Eyebrow>{t.downloadCta.eyebrow}</Eyebrow>
        <h2 id="download-title" className="poster mt-8 text-[clamp(3.4rem,11.5vw,13rem)]">
          {t.downloadCta.title} <span className="text-primary">{t.downloadCta.accent}</span>
        </h2>
        <div className="mt-12 grid gap-8 border-t pt-8 lg:grid-cols-12">
          <p className="max-w-lg text-lg text-muted-foreground lg:col-span-5">{t.downloadCta.text}</p>
          <div className="flex flex-col gap-4 lg:col-span-7 lg:items-end">
            <StoreBadges t={t.stores} web />
            <CtaLink href={href(lang, "warteliste")}>{t.hero.secondary} <ArrowUpRight className="size-4" aria-hidden /></CtaLink>
          </div>
        </div>
      </section>
    </>
  );
}
