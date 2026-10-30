import Link from "next/link";
import { CtaLink } from "@/components/public/landing-bits";

const COLUMNS = [
  {
    title: "Start",
    links: [
      { href: "/pakete", label: "Pakete" },
      { href: "/mitglieder", label: "Artists" },
      { href: "/fuer-unternehmen", label: "Für Brands" },
    ],
  },
  {
    title: "Artists",
    links: [
      { href: "/fuer-kreative", label: "Für Artists" },
      { href: "/bewerben", label: "Bewerben" },
      { href: "/login", label: "Anmelden" },
    ],
  },
  {
    title: "Rechtliches",
    links: [
      { href: "/impressum", label: "Impressum" },
      { href: "/datenschutz", label: "Datenschutz" },
      { href: "/agb", label: "AGB" },
      { href: "/ki-hinweis", label: "Hinweis zur KI-Nutzung" },
    ],
  },
];

// Footer der öffentlichen Seiten: Linkspalten + Wortmarke über die volle Breite
export function PublicFooter() {
  return (
    <footer className="overflow-hidden bg-[var(--ink)] text-[var(--bone)]">
      <div className="gutter grid gap-12 pt-20 pb-14 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <p className="meta text-white/60">Creative Connect</p>
          <p className="mt-4 max-w-md text-2xl leading-tight font-semibold tracking-tight text-balance">
            Das Kreativ-Netzwerk für Brands und Artists. Kuratiert von Nesto.
          </p>
          <div className="mt-8 flex flex-col gap-2 sm:flex-row">
            <CtaLink href="/pakete">Paket buchen</CtaLink>
            <CtaLink href="/bewerben" variant="ghost">Als Artist anbieten</CtaLink>
          </div>
        </div>
        <nav aria-label="Footer" className="grid grid-cols-2 gap-10 sm:grid-cols-3 lg:col-span-7">
          {COLUMNS.map((c) => (
            <div key={c.title}>
              <p className="meta text-white/50">{c.title}</p>
              <ul className="mt-4 space-y-2.5">
                {c.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="text-sm text-white/80 transition-colors hover:text-[var(--signal)]">{l.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>
      <p aria-hidden className="poster gutter text-[13vw] leading-[0.8] whitespace-nowrap select-none">
        Creative <span className="text-outline">Connect</span>
      </p>
      <div className="gutter mt-8 flex flex-col gap-2 border-t border-white/15 py-5 text-white/55 sm:flex-row sm:items-center sm:justify-between">
        <p className="meta">Demo – alle Inhalte fiktiv, Bilder: Stock.</p>
        {process.env.NEXT_PUBLIC_PAGES_DEMO === "1" && (
          <p data-testid="browser-demo-note" className="meta">Browser-Demo: Daten liegen nur in diesem Browser – Zurücksetzen im Admin.</p>
        )}
      </div>
    </footer>
  );
}
