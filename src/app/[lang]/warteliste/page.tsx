import type { Metadata } from "next";
import { getDict, hasLocale, type Locale } from "@/lib/i18n";
import { pageMeta } from "@/lib/meta";
import { Eyebrow } from "@/components/site/bits";
import { WaitlistForm } from "@/components/site/waitlist-form";
import { Photo } from "@/components/site/photo";

export async function generateMetadata({ params }: PageProps<"/[lang]/warteliste">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const t = getDict(lang).waitlistPage;
  return pageMeta(lang, "warteliste", t.metaTitle, t.text);
}

export default async function WaitlistPage({ params }: PageProps<"/[lang]/warteliste">) {
  const lang = (await params).lang as Locale;
  const t = getDict(lang).waitlistPage;
  return (
    <section aria-labelledby="wl-title" className="grid lg:min-h-[calc(100svh-4rem)] lg:grid-cols-2">
      <div className="gutter py-16 sm:py-24">
        <Eyebrow>{t.eyebrow}</Eyebrow>
        <h1 id="wl-title" className="poster mt-8 text-[clamp(2.6rem,8vw,8rem)] lg:text-[clamp(3rem,4.8vw,6rem)]">{t.title}</h1>
        <p className="mt-8 max-w-lg text-lg text-muted-foreground">{t.text}</p>
        <div className="mt-12 max-w-lg">
          <WaitlistForm lang={lang} t={t} />
        </div>
        <div className="mt-12 max-w-lg border-t pt-6">
          <h2 className="meta text-primary">{t.doiTitle}</h2>
          <p className="mt-2 text-base text-muted-foreground sm:text-sm">{t.doiText}</p>
        </div>
      </div>
      <div className="relative hidden min-h-[60svh] lg:block">
        <Photo name="crowd" sizes="50vw" className="grayscale-[25%]" />
      </div>
    </section>
  );
}
