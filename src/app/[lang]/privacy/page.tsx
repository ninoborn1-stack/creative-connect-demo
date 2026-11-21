import type { Metadata } from "next";
import { getDict, onlyLang } from "@/lib/i18n";
import { pageMeta } from "@/lib/meta";
import { PrivacyContent } from "@/components/site/privacy-page";

// Nur en: /en/privacy/ (die andere Sprache hat ihren eigenen Slug)
export const generateStaticParams = onlyLang("en");

export function generateMetadata(): Metadata {
  return pageMeta("en", "datenschutz", getDict("en").privacy.metaTitle);
}

export default function Page() {
  return <PrivacyContent lang="en" />;
}
