import Link from "next/link";
import { APP_NAME, COMPANY } from "@/lib/brand";
import { href, type Dict, type Locale } from "@/lib/i18n";
import { StoreBadges } from "@/components/site/stores";

// Footer: Claim + Store-Links, drei Linkspalten, App-Name als Wortmarke über die volle Breite
export function Footer({ lang, t }: { lang: Locale; t: Dict }) {
  const cols = [
    { title: t.footer.cols.app, links: [[href(lang, "download"), t.nav.download], [href(lang, "warteliste"), t.nav.waitlist]] },
    { title: t.footer.cols.for, links: [[href(lang, "artists"), t.nav.artists], [href(lang, "veranstalter"), t.nav.organizers], [href(lang, "unternehmen"), t.nav.business]] },
    { title: t.footer.cols.company, links: [[href(lang, "presse"), t.nav.press], [href(lang, "impressum"), t.imprint.metaTitle], [href(lang, "datenschutz"), t.privacy.metaTitle]] },
  ];
  const half = Math.ceil(APP_NAME.length / 2);
  return (
    <footer className="overflow-hidden bg-[var(--ink)] text-[var(--bone)]">
      <div className="gutter grid gap-12 pt-20 pb-14 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <p className="meta text-white/60">{APP_NAME}</p>
          <p className="mt-4 max-w-md text-2xl leading-tight font-semibold tracking-tight text-balance">{t.footer.claim}</p>
          <StoreBadges lang={lang} t={t.stores} className="mt-8" />
        </div>
        <nav aria-label="Footer" className="grid grid-cols-2 gap-10 sm:grid-cols-3 lg:col-span-7">
          {cols.map((c) => (
            <div key={c.title}>
              <p className="meta text-white/60">{c.title}</p>
              <ul className="mt-4 space-y-2.5">
                {c.links.map(([to, label]) => (
                  <li key={to}>
                    <Link href={to} className="text-sm text-white/85 transition-colors hover:text-[var(--stone)]">{label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>
      <p aria-hidden className="poster gutter text-[min(16vw,calc(128vw/var(--chars)))] leading-[0.8] whitespace-nowrap select-none" style={{ "--chars": APP_NAME.length } as React.CSSProperties}>
        {APP_NAME.slice(0, half)}<span className="text-outline">{APP_NAME.slice(half)}</span>
      </p>
      <div className="gutter mt-8 flex flex-col gap-2 border-t border-white/15 py-5 text-white/70 sm:flex-row sm:items-center sm:justify-between">
        <p className="meta">© {new Date().getFullYear()} {COMPANY.name}</p>
        <p className="meta">{t.footer.note}</p>
      </div>
    </footer>
  );
}
