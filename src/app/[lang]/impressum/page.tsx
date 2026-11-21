import type { Metadata } from "next";
import { getDict, onlyLang } from "@/lib/i18n";
import { pageMeta } from "@/lib/meta";
import { ImprintContent } from "@/components/site/imprint-page";

// Nur de: /de/impressum/ (die andere Sprache hat ihren eigenen Slug)
export const generateStaticParams = onlyLang("de");

export function generateMetadata(): Metadata {
  return pageMeta("de", "impressum", getDict("de").imprint.metaTitle);
}

export default function Page() {
  return <ImprintContent lang="de" />;
}
