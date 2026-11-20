import type { Metadata } from "next";
import { ArrowUpRight } from "lucide-react";
import { LINKS } from "@/lib/brand";
import { getDict, hasLocale, href, type Locale } from "@/lib/i18n";
import { pageMeta } from "@/lib/meta";
import { CtaLink, Eyebrow } from "@/components/site/bits";
import { StoreBadges } from "@/components/site/stores";
import { SwipeMockup } from "@/components/site/phone";

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
        <h1 id="dl-title" className="poster mt-8 text-[clamp(3rem,9vw,9.5rem)] text-balance">{t.title}</h1>
        <p className="mt-8 max-w-xl text-lg text-muted-foreground">{t.text}</p>
        <StoreBadges t={d.stores} className="mt-10" />
        <p className="meta mt-3 text-muted-foreground">{d.stores.soon}</p>
        <div className="mt-14 border-t pt-8">
          <h2 className="text-2xl font-semibold tracking-tight">{t.webTitle}</h2>
          <p className="mt-2 max-w-xl text-muted-foreground">{t.webText}</p>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            <CtaLink href={LINKS.webApp}>{d.stores.web} <ArrowUpRight className="size-4" aria-hidden /></CtaLink>
            <CtaLink href={href(lang, "warteliste")} variant="outline">{d.nav.waitlist}</CtaLink>
          </div>
        </div>
      </div>
      <div className="flex justify-center lg:col-span-5">
        <SwipeMockup t={d.preview} />
      </div>
    </section>
  );
}
