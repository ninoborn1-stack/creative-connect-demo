import type { Metadata } from "next";
import { getDict, onlyLang } from "@/lib/i18n";
import { pageMeta } from "@/lib/meta";
import { ImprintContent } from "@/components/site/imprint-page";

// Nur en: /en/imprint/ (die andere Sprache hat ihren eigenen Slug)
export const generateStaticParams = onlyLang("en");

export function generateMetadata(): Metadata {
  return pageMeta("en", "impressum", getDict("en").imprint.metaTitle);
}

export default function Page() {
  return <ImprintContent lang="en" />;
}
