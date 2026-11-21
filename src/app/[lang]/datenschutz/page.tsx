import type { Metadata } from "next";
import { getDict, onlyLang } from "@/lib/i18n";
import { pageMeta } from "@/lib/meta";
import { PrivacyContent } from "@/components/site/privacy-page";

// Nur de: /de/datenschutz/ (die andere Sprache hat ihren eigenen Slug)
export const generateStaticParams = onlyLang("de");

export function generateMetadata(): Metadata {
  return pageMeta("de", "datenschutz", getDict("de").privacy.metaTitle);
}

export default function Page() {
  return <PrivacyContent lang="de" />;
}
