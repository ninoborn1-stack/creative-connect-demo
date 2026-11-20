import type { Metadata } from "next";
import { getDict, hasLocale, type Locale } from "@/lib/i18n";
import { pageMeta } from "@/lib/meta";
import { LegalPage, LegalSection } from "@/components/site/legal";

export async function generateMetadata({ params }: PageProps<"/[lang]/datenschutz">): Promise<Metadata> {
  const { lang } = await params;
  return hasLocale(lang) ? pageMeta(lang, "datenschutz", getDict(lang).privacy.metaTitle) : {};
}

// Keine Cookie-Einwilligung nötig, solange ANALYTICS in brand.ts null ist (die Seite setzt keine Cookies)
export default async function PrivacyPage({ params }: PageProps<"/[lang]/datenschutz">) {
  const lang = (await params).lang as Locale;
  const d = getDict(lang);
  return (
    <LegalPage t={d.legal} title={d.privacy.title} updated="20.11.2026">
      {d.privacy.sections.map((s) => (
        <LegalSection key={s.title} title={s.title}><p>{s.body}</p></LegalSection>
      ))}
    </LegalPage>
  );
}
