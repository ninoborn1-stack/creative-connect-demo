"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LOCALES, switchLang, type Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

// Sprachwechsel auf dieselbe Seite in der anderen Sprache (Footer)
export function LangLinks({ lang, label, className }: { lang: Locale; label: string; className?: string }) {
  const pathname = usePathname();
  return (
    <ul aria-label={label} className={cn("flex items-center gap-1", className)}>
      {LOCALES.map((l) => (
        <li key={l}>
          <Link href={switchLang(pathname, l)} hrefLang={l} lang={l} aria-current={l === lang ? "true" : undefined} className="inline-flex h-11 min-w-11 items-center justify-center px-2 opacity-70 transition-opacity hover:opacity-100 aria-[current=true]:opacity-100 aria-[current=true]:underline aria-[current=true]:underline-offset-4">
            {l.toUpperCase()}
          </Link>
        </li>
      ))}
    </ul>
  );
}
