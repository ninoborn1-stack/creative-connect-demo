import type { Metadata } from "next";
import { ArrowDown, Lock } from "lucide-react";
import { getDict, hasLocale, type Locale } from "@/lib/i18n";
import { pageMeta } from "@/lib/meta";
import { BackstageForm } from "@/components/site/backstage-form";
import { Accent } from "@/components/showcase/accent";
import { PhoneStage } from "@/components/showcase/phone-stage";

export async function generateMetadata({ params }: PageProps<"/[lang]/backstage">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const t = getDict(lang).backstagePage;
  return pageMeta(lang, "backstage", t.metaTitle, t.text);
}

// Backstage: dunkler und reduzierter als der Rest der Seite, viel Ruhe, wenig Farbe
export default async function BackstagePage({ params }: PageProps<"/[lang]/backstage">) {
  const lang = (await params).lang as Locale;
  const d = getDict(lang);
  const t = d.backstagePage;
  return (
    <div className="bg-[var(--ink)] text-[var(--bone)]">
      {/* Hero: Handy auf der Glasstufe im Reisemodus, dunkler als auf der Startseite */}
      <PhoneStage k="backstage" lang={lang} t={d} dark labelledBy="bs-title" testId="backstage-stage">
          <p className="meta flex items-center gap-3 text-[var(--stone)]"><Lock className="size-4" aria-hidden />{t.eyebrow}</p>
          <h1 id="bs-title" className="poster mt-8 text-[clamp(2.6rem,9vw,8rem)] md:text-[clamp(2.6rem,7vw,5rem)] lg:text-[clamp(2.6rem,3.6vw,4.6rem)]"><Accent text={t.title} /></h1>
          <p className="mt-8 max-w-[60ch] text-lg text-white/80 sm:text-xl">{t.text}</p>
          <div className="mt-10 flex flex-wrap items-center gap-6 border-t border-white/15 pt-6">
            <a href="#bewerben" className="meta inline-flex h-12 items-center gap-2 border border-white/40 px-5 whitespace-nowrap transition-colors hover:bg-white hover:text-[var(--ink)]">
              {t.cta} <ArrowDown className="size-4" aria-hidden />
            </a>
            <p className="meta text-white/70">{t.note}</p>
          </div>
      </PhoneStage>

      <section aria-labelledby="bs-steps" className="gutter border-t border-white/10 py-20 sm:py-28">
        <h2 id="bs-steps" className="poster text-[clamp(1.8rem,6vw,5.5rem)] min-[400px]:text-[clamp(2.2rem,6vw,5.5rem)]">{t.stepsTitle}</h2>
        <ol className="mt-12 grid border-t border-white/15 md:grid-cols-3">
          {t.steps.map((s, i) => (
            <li key={s.title} className="border-b border-white/15 py-8 md:border-r md:border-b-0 md:px-8 md:first:pl-0 md:last:border-r-0">
              <span className="poster text-6xl text-[var(--stone)]">{i + 1}</span>
              <h3 className="mt-6 text-2xl font-semibold tracking-tight">{s.title}</h3>
              <p className="mt-2 text-white/70">{s.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="bs-values" className="gutter grid gap-12 border-t border-white/10 py-20 sm:py-28 lg:grid-cols-12">
        <h2 id="bs-values" className="poster text-[clamp(2.2rem,6vw,5.5rem)] lg:col-span-5 lg:text-[clamp(2.6rem,4vw,4.5rem)]">{t.valuesTitle}</h2>
        <dl className="border-t border-white/15 lg:col-span-7">
          {t.values.map((v) => (
            <div key={v.title} className="grid gap-1 border-b border-white/15 py-5 sm:grid-cols-[14rem_1fr] sm:gap-6">
              <dt className="font-semibold">{v.title}</dt>
              <dd className="text-white/70">{v.text}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section aria-labelledby="bs-for" className="gutter border-t border-white/10 py-16 sm:py-20">
        <h2 id="bs-for" className="meta text-[var(--stone)]">{t.forTitle}</h2>
        <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2">
          {t.for.map((w, i) => (
            <li key={w} className="poster text-[clamp(1.4rem,4.6vw,4rem)] whitespace-nowrap min-[400px]:text-[clamp(1.8rem,4.6vw,4rem)]">
              {w}{i < t.for.length - 1 && <span aria-hidden className="ml-6 text-primary">·</span>}
            </li>
          ))}
        </ul>
      </section>

      <section id="bewerben" aria-labelledby="bs-form" className="gutter grid scroll-mt-16 gap-12 border-t border-white/10 py-20 sm:py-28 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <h2 id="bs-form" className="poster text-[clamp(2.4rem,7vw,6rem)] lg:text-[clamp(2.6rem,3.8vw,4.6rem)]">{t.formTitle}</h2>
          <p className="mt-6 max-w-[55ch] text-white/80">{t.formText}</p>
          <p className="meta mt-8 text-white/60">{t.note}</p>
        </div>
        <div className="lg:col-span-7">
          <BackstageForm lang={lang} t={t.form} consent={t} privacyLink={d.waitlistPage.privacyLink} />
        </div>
      </section>
    </div>
  );
}
