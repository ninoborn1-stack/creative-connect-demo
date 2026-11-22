import Link from "next/link";
import { APP_NAME, LEGAL } from "@/lib/brand";
import { href, type Dict, type Locale } from "@/lib/i18n";
import { LangLinks } from "@/components/site/lang-links";
import { FooterWordmark } from "@/components/showcase/footer-wordmark";
import { MotionToggle } from "@/components/showcase/motion-toggle";

// Footer: Claim, drei Linkspalten, Rechtslinks, ganz unten der riesige Schriftzug (FooterWordmark)
export function Footer({ lang, t }: { lang: Locale; t: Dict }) {
  const cols = [
    { title: t.footer.cols.app, links: [[href(lang, "download"), t.nav.download], [href(lang, "warteliste"), t.nav.waitlist]] },
    { title: t.footer.cols.for, links: [[href(lang, "artists"), t.nav.artists], [href(lang, "veranstalter"), t.nav.organizers], [href(lang, "unternehmen"), t.nav.business], [href(lang, "backstage"), t.nav.backstage]] },
    { title: t.footer.cols.company, links: [[href(lang, "presse"), t.nav.press], [`mailto:${LEGAL.email}`, t.footer.contact]] },
  ];
  return (
    <footer className="overflow-hidden bg-[var(--ink)] text-[var(--bone)]">
      <div className="gutter grid gap-12 pt-20 pb-14 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <p className="meta text-white/60">{APP_NAME}</p>
          <p className="mt-4 max-w-md text-2xl leading-tight font-semibold tracking-tight text-balance">{t.footer.claim}</p>
          <Link href={href(lang, "warteliste")} className="meta mt-8 inline-flex h-12 items-center bg-primary px-5 whitespace-nowrap text-primary-foreground transition-colors hover:bg-primary/85">{t.footer.waitlist}</Link>
          <p className="meta mt-3 text-white/60">{t.footer.soon}</p>
        </div>
        <nav aria-label="Footer" className="grid grid-cols-2 gap-10 sm:grid-cols-3 lg:col-span-7">
          {cols.map((c) => (
            <div key={c.title}>
              <p className="meta text-white/60">{c.title}</p>
              <ul className="mt-3">
                {c.links.map(([to, label]) => (
                  <li key={to}>
                    {to.startsWith("mailto:") ? (
                      <a href={to} className="inline-flex min-h-11 min-w-11 items-center text-base text-white/85 transition-colors hover:text-[var(--stone)] sm:text-sm">{label}</a>
                    ) : (
                      <Link href={to} className="inline-flex min-h-11 min-w-11 items-center text-base text-white/85 transition-colors hover:text-[var(--stone)] sm:text-sm">{label}</Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>
      <div className="gutter flex flex-col gap-4 border-t border-white/15 py-5 text-white/80 lg:flex-row lg:items-center lg:justify-between">
        <nav aria-label={t.footer.legal} data-testid="footer-legal">
          <ul className="flex flex-wrap items-center gap-x-6 text-base sm:text-sm">
            <li><Link href={href(lang, "impressum")} className="inline-flex min-h-11 items-center underline-offset-4 hover:underline">{t.imprint.metaTitle}</Link></li>
            <li><Link href={href(lang, "datenschutz")} className="inline-flex min-h-11 items-center underline-offset-4 hover:underline">{t.privacy.metaTitle}</Link></li>
            <li><a href={`mailto:${LEGAL.email}`} className="inline-flex min-h-11 items-center underline-offset-4 hover:underline">{t.footer.contact}</a></li>
          </ul>
        </nav>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <MotionToggle label={t.footer.motion} />
          <LangLinks lang={lang} label={t.footer.language} className="meta -ml-2" />
          <p className="meta">© {new Date().getFullYear()} {LEGAL.company}</p>
        </div>
      </div>
      <p className="gutter meta pb-[max(1.5rem,env(safe-area-inset-bottom))] text-white/55">{t.footer.note}</p>
      <FooterWordmark />
    </footer>
  );
}
