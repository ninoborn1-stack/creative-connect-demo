"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import { href, type Dict, type Locale } from "@/lib/i18n";
import { useSearchParam } from "@/components/site/brevo";

// Danke-Seite nach dem Klick in der Brevo-Bestätigungsmail. Mit ?backstage=1 der Text für Backstage-Bewerbungen.
export function ConfirmContent({ lang, t }: { lang: Locale; t: Dict["confirmPage"] }) {
  const backstage = useSearchParam("backstage") === "1";
  return (
    <section aria-labelledby="ok-title" className="gutter grid min-h-[70svh] content-center bg-[var(--ink)] py-24 text-[var(--bone)]">
      <p className="meta flex items-center gap-3 text-[var(--stone)]"><Check className="size-4" aria-hidden />{t.eyebrow}</p>
      <h1 id="ok-title" className="poster mt-6 text-[clamp(2.6rem,9vw,8rem)]">{backstage ? t.backstageTitle : t.title}</h1>
      <p className="mt-6 max-w-[60ch] text-lg text-white/80" data-testid="confirm-text">{backstage ? t.backstageText : t.text}</p>
      <Link href={href(lang)} className="meta mt-10 inline-flex h-12 w-fit items-center bg-primary px-5 whitespace-nowrap text-primary-foreground">{t.back}</Link>
    </section>
  );
}
