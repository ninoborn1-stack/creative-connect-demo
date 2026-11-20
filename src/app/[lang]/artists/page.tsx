import type { Metadata } from "next";
import { LINKS } from "@/lib/brand";
import { getDict, hasLocale, href, type Locale } from "@/lib/i18n";
import { pageMeta } from "@/lib/meta";
import { AudiencePage } from "@/components/site/audience-page";

export async function generateMetadata({ params }: PageProps<"/[lang]/artists">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const t = getDict(lang).artistsPage;
  return pageMeta(lang, "artists", t.metaTitle, t.text);
}

export default async function ArtistsPage({ params }: PageProps<"/[lang]/artists">) {
  const lang = (await params).lang as Locale;
  const t = getDict(lang).artistsPage;
  return (
    <AudiencePage
      {...t}
      image="artists"
      cta={{ href: href(lang, "warteliste"), label: t.cta }}
      // Bewerbung läuft in der App – solange es den Link nicht gibt, bleibt nur die Warteliste
      secondary={LINKS.apply ? { href: LINKS.apply, label: t.secondary } : undefined}
    />
  );
}
