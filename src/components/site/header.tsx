"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/site/logo";
import { href, LOCALES, type Dict, type Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

// Auf der Startseite liegt die Navbar transparent über dem Hero-Foto und wird erst nach der
// Hero-Scroll-Strecke zur normalen Leiste. Auf allen anderen Seiten ist sie direkt sticky.
export function Header({ lang, t }: { lang: Locale; t: Dict["nav"] }) {
  const pathname = usePathname();
  const onHero = /^\/(de|en)\/?$/.test(pathname);
  const [pastHero, setPastHero] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!onHero) return;
    const update = () => {
      const hero = document.querySelector<HTMLElement>(".hero");
      const limit = hero ? hero.offsetHeight - window.innerHeight * 0.6 : window.innerHeight;
      setPastHero(window.scrollY > limit);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [onHero]);

  const links = [
    { href: href(lang, "artists"), label: t.artists },
    { href: href(lang, "veranstalter"), label: t.organizers },
    { href: href(lang, "unternehmen"), label: t.business },
    { href: href(lang, "warteliste"), label: t.waitlist },
  ];
  // gleiche Seite in der anderen Sprache
  const switchTo = (l: Locale) => pathname.replace(/^\/(de|en)(?=\/|$)/, `/${l}`);
  const overPhoto = onHero && !pastHero && !open;

  return (
    <header
      data-hero-nav={onHero ? "" : undefined}
      data-over-photo={overPhoto ? "" : undefined}
      className={cn(
        "top-0 z-30 transition-[background-color,border-color,color] duration-500",
        onHero ? "fixed inset-x-0" : "sticky",
        overPhoto ? "border-b border-transparent bg-transparent text-white" : "border-b bg-background/90 backdrop-blur",
      )}
    >
      <a href="#inhalt" className="meta sr-only bg-primary px-4 py-3 text-primary-foreground focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50">
        {t.skip}
      </a>
      <div className="gutter flex h-16 items-center gap-2">
        <Logo href={href(lang)} />
        <nav aria-label="Hauptnavigation" className="ml-8 hidden lg:block">
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
                  className="inline-flex h-9 items-center px-2 opacity-60 transition-opacity hover:opacity-100 aria-[current=true]:opacity-100"
                >
                  {l.toUpperCase()}
                </Link>
              </li>
            ))}
          </ul>
          <Link href={href(lang, "download")} className="meta hidden h-9 items-center bg-primary px-4 text-primary-foreground transition-colors hover:bg-primary/85 sm:inline-flex">
            {t.download}
          </Link>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-controls="mobil-menue"
            aria-label={open ? t.close : t.menu}
            className="grid size-10 place-items-center lg:hidden"
          >
            {open ? <X className="size-5" aria-hidden /> : <Menu className="size-5" aria-hidden />}
          </button>
        </div>
      </div>
      {open && (
        <nav id="mobil-menue" aria-label="Mobilnavigation" className="gutter border-t pb-6 lg:hidden">
          <ul aria-label={t.language} className="meta flex gap-4 py-4 min-[360px]:hidden">
            {LOCALES.map((l) => (
              <li key={l}><Link href={switchTo(l)} onClick={() => setOpen(false)} hrefLang={l} lang={l} aria-current={l === lang ? "true" : undefined} className="opacity-60 aria-[current=true]:opacity-100">{l.toUpperCase()}</Link></li>
            ))}
          </ul>
          <ul className="divide-y">
            {[...links, { href: href(lang, "download"), label: t.download }, { href: href(lang, "presse"), label: t.press }].map((l) => (
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
