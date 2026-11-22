import type { Metadata } from "next";
import { ArrowUpRight } from "lucide-react";
import { LINKS } from "@/lib/brand";
import { getDict, hasLocale, href, type Locale } from "@/lib/i18n";
import { pageMeta } from "@/lib/meta";
import { CtaLink, Eyebrow } from "@/components/site/bits";
import { StoreBadges } from "@/components/site/stores";
import { PreviewLoader } from "@/components/preview/preview-loader";
import { PreviewPlaceholder } from "@/components/preview/preview-placeholder";

export async function generateMetadata({ params }: PageProps<"/[lang]/download">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const t = getDict(lang).downloadPage;
  return pageMeta(lang, "download", t.metaTitle, t.text);
}

export default async function DownloadPage({ params }: PageProps<"/[lang]/download">) {
  const lang = (await params).lang as Locale;
  const d = getDict(lang);
  const t = d.downloadPage;
  return (
    <section aria-labelledby="dl-title" className="gutter grid items-center gap-16 py-16 sm:py-24 lg:grid-cols-12">
      <div className="lg:col-span-7">
        <Eyebrow>{t.eyebrow}</Eyebrow>
        <h1 id="dl-title" className="poster mt-8 text-[clamp(2rem,10vw,2.6rem)] min-[400px]:text-[clamp(2.6rem,8vw,8rem)] lg:text-[clamp(3rem,4.6vw,6rem)]">{t.title}</h1>
        <p className="mt-8 max-w-xl text-lg text-muted-foreground">{t.text}</p>
        <StoreBadges lang={lang} t={d.stores} className="mt-10" />
        <div className="mt-14 border-t pt-8">
          <h2 className="text-2xl font-semibold tracking-tight">{t.webTitle}</h2>
          <p className="mt-2 max-w-xl text-muted-foreground">{t.webText}</p>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            {LINKS.webApp && <CtaLink href={LINKS.webApp}>{d.stores.web} <ArrowUpRight className="size-4" aria-hidden /></CtaLink>}
            <CtaLink href={href(lang, "warteliste")} variant={LINKS.webApp ? "outline" : "primary"}>{d.nav.waitlist} <ArrowUpRight className="size-4" aria-hidden /></CtaLink>
          </div>
        </div>
      </div>
      <div className="flex justify-center lg:col-span-5">
        <PreviewLoader lang={lang} placeholder={<PreviewPlaceholder lang={lang} />} />
      </div>
    </section>
  );
}
