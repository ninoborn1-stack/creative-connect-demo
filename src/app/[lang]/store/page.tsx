import type { Metadata } from "next";
import { getDict, type Locale } from "@/lib/i18n";
import { FeaturePanels } from "@/components/showcase/feature-panels";

// Nicht verlinkte Arbeitsseite für Store-Screenshots (pnpm screenshots:store): die Feature-Tafeln ohne Animation.
// Nicht in der Sitemap, noindex.
export const metadata: Metadata = { title: "Store-Tafeln", robots: { index: false, follow: false } };

export default async function StorePanelsPage({ params }: PageProps<"/[lang]/store">) {
  const lang = (await params).lang as Locale;
  return <FeaturePanels lang={lang} t={getDict(lang)} />;
}
