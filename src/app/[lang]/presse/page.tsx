import type { Metadata } from "next";
import { COMPANY } from "@/lib/brand";
import { getDict, hasLocale, type Locale } from "@/lib/i18n";
import { pageMeta } from "@/lib/meta";
import { PageHero, Section } from "@/components/site/bits";

export async function generateMetadata({ params }: PageProps<"/[lang]/presse">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const t = getDict(lang).pressPage;
  return pageMeta(lang, "presse", t.metaTitle, t.text);
}

export default async function PressPage({ params }: PageProps<"/[lang]/presse">) {
  const lang = (await params).lang as Locale;
  const t = getDict(lang).pressPage;
  return (
    <>
      <PageHero eyebrow={t.eyebrow} title={t.title} text={t.text} image="press" />
      <Section labelledBy="facts-title" className="grid gap-16 lg:grid-cols-2">
        <div>
          <h2 id="facts-title" className="poster text-[clamp(2.4rem,5vw,5rem)]">{t.factsTitle}</h2>
          <dl className="mt-8 border-t">
            {t.facts.map(([k, v]) => (
              <div key={k} className="grid grid-cols-[8rem_1fr] gap-4 border-b py-4">
                <dt className="meta pt-1 text-muted-foreground">{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="space-y-12">
          <div>
            <h2 className="poster text-[clamp(2.4rem,5vw,5rem)]">{t.contactTitle}</h2>
            <dl className="mt-8 border-t">
              {[[t.general, COMPANY.email], [t.press, COMPANY.pressEmail]].map(([k, mail]) => (
                <div key={k} className="grid grid-cols-[8rem_1fr] gap-4 border-b py-4">
                  <dt className="meta pt-1 text-muted-foreground">{k}</dt>
                  <dd><a href={`mailto:${mail}`} className="text-lg underline underline-offset-4 hover:text-primary">{mail}</a></dd>
                </div>
              ))}
            </dl>
          </div>
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">{t.kitTitle}</h2>
            <p className="mt-2 max-w-md text-muted-foreground">{t.kitText}</p>
          </div>
        </div>
      </Section>
    </>
  );
}
