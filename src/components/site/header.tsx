"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/site/logo";
import { href, LOCALES, switchLang, type Dict, type Locale } from "@/lib/i18n";

// Sticky-Leiste mit Navigation, Sprachwechsel und Warteliste; mobil als Ausklappmenü
export function Header({ lang, t }: { lang: Locale; t: Dict["nav"] }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  // Menü schließt mit Escape (Fokus zurück auf den Menü-Knopf)
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") { setOpen(false); document.getElementById("menue-knopf")?.focus(); } };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const links = [
    { href: href(lang, "artists"), label: t.artists },
    { href: href(lang, "veranstalter"), label: t.organizers },
    { href: href(lang, "unternehmen"), label: t.business },
    { href: href(lang, "backstage"), label: t.backstage },
    { href: href(lang, "download"), label: t.download },
  ];
  // gleiche Seite in der anderen Sprache
  const switchTo = (l: Locale) => switchLang(pathname, l);

  return (
    <header className="sticky top-0 z-30 border-b bg-background/90 pt-[env(safe-area-inset-top)] backdrop-blur">
      <a href="#inhalt" className="meta sr-only bg-primary px-4 py-3 text-primary-foreground focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50">
        {t.skip}
      </a>
      <div className="gutter flex h-16 items-center gap-2">
        <Logo href={href(lang)} />
        <nav aria-label="Hauptnavigation" className="ml-8 hidden xl:block">
          <ul className="flex items-center gap-6">
            {links.map((l) => (
              <li key={l.href}>
                <Link href={l.href} aria-current={pathname === l.href ? "page" : undefined} className="meta transition-colors hover:text-[var(--stone)] aria-[current=page]:text-[var(--stone)]">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <ul aria-label={t.language} className="meta hidden items-center min-[360px]:flex">
            {LOCALES.map((l) => (
              <li key={l}>
                <Link
                  href={switchTo(l)}
                  hrefLang={l}
                  lang={l}
                  aria-current={l === lang ? "true" : undefined}
                  className="inline-flex h-11 min-w-11 items-center justify-center px-2 opacity-60 transition-opacity hover:opacity-100 aria-[current=true]:opacity-100"
                >
                  {l.toUpperCase()}
                </Link>
              </li>
            ))}
          </ul>
          <Link href={href(lang, "warteliste")} className="meta hidden h-11 items-center bg-primary px-4 whitespace-nowrap text-primary-foreground transition-colors hover:bg-primary/85 min-[440px]:inline-flex">
            {t.cta}
          </Link>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-controls="mobil-menue"
            aria-label={open ? t.close : t.menu}
            id="menue-knopf"
            className="grid size-11 place-items-center xl:hidden"
          >
            {open ? <X className="size-5" aria-hidden /> : <Menu className="size-5" aria-hidden />}
          </button>
        </div>
      </div>
      {open && (
        <nav id="mobil-menue" aria-label="Mobilnavigation" className="gutter border-t pb-6 xl:hidden">
          <ul aria-label={t.language} className="meta flex gap-4 py-4 min-[360px]:hidden">
            {LOCALES.map((l) => (
              <li key={l}><Link href={switchTo(l)} onClick={() => setOpen(false)} hrefLang={l} lang={l} aria-current={l === lang ? "true" : undefined} className="inline-flex h-11 min-w-11 items-center justify-center opacity-60 aria-[current=true]:opacity-100">{l.toUpperCase()}</Link></li>
            ))}
          </ul>
          <ul className="divide-y">
            {[...links, { href: href(lang, "warteliste"), label: t.cta }, { href: href(lang, "presse"), label: t.press }].map((l) => (
              <li key={l.href}>
                <Link href={l.href} onClick={() => setOpen(false)} className="poster block py-4 text-4xl transition-colors hover:text-primary">{l.label}</Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}
