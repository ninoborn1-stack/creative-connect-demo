import type { Metadata } from "next";
import { ArrowUpRight } from "lucide-react";
import { db } from "@/lib/db";
import { getMarketplaceMode } from "@/lib/settings";
import { CATEGORIES, CITIES } from "@/lib/constants";
import { ProfileCard } from "@/components/profile-card";
import { Button } from "@/components/ui/button";
import { CtaLink, Eyebrow } from "@/components/public/landing-bits";

export const metadata: Metadata = { title: "Verzeichnis" };

// Öffentliches Verzeichnis – nur sichtbar, wenn der Admin den Marktplatz-Modus „open“ (Phase 3) gesetzt hat.
export default async function PublicDirectoryPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const mode = await getMarketplaceMode();
  if (mode !== "open") {
    return (
      <section className="gutter flex min-h-[calc(100svh-4rem)] flex-col justify-between gap-16 bg-[var(--ink)] py-16 text-[var(--bone)] sm:py-24">
        <p className="meta flex items-center gap-3 text-white/70"><span aria-hidden className="size-2 bg-[var(--signal)]" />Verzeichnis · Geschlossen</p>
        <div>
          <h1 className="poster max-w-[14ch] text-[clamp(3rem,9vw,10rem)] text-balance">Das Verzeichnis ist noch nicht öffentlich</h1>
          <div className="mt-10 grid gap-8 border-t border-white/20 pt-6 lg:grid-cols-12">
            <p className="text-base text-pretty text-white/75 sm:text-lg lg:col-span-6">
              Creative Connect ist gerade ein geschlossenes Netzwerk. Profile sehen nur eingeladene Mitglieder.
            </p>
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap lg:col-span-6 lg:justify-end lg:self-end">
              <CtaLink href="/invite/CC-DEMO-2026" variant="light">Einladung einlösen <ArrowUpRight className="size-4" aria-hidden /></CtaLink>
              <CtaLink href="/warteliste" variant="ghost">Auf die Warteliste</CtaLink>
            </div>
          </div>
        </div>
      </section>
    );
  }

  const sp = await searchParams;
  const bereich = typeof sp.bereich === "string" ? sp.bereich : "";
  const stadt = typeof sp.stadt === "string" ? sp.stadt : "";
  const profiles = await db.profile.findMany({
    where: {
      user: { isCreative: true, status: { not: "gesperrt" } },
      ...(bereich ? { categories: { contains: `"${bereich}"` } } : {}),
      ...(stadt ? { city: stadt } : {}),
    },
    include: { user: { select: { id: true, name: true } } },
    orderBy: [{ verified: "desc" }, { ratingAvg: "desc" }],
    take: 24,
  });

  const selectClass = "h-12 w-full min-w-0 border-0 bg-transparent text-base text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring/50 sm:text-sm";
  return (
    <>
      <section aria-labelledby="dir-title" className="gutter pt-16 pb-12 sm:pt-24 sm:pb-16">
        <Eyebrow>Verzeichnis · {profiles.length} Profile</Eyebrow>
        <div className="mt-8 grid gap-8 lg:grid-cols-12 lg:items-end lg:gap-10">
          <h1 id="dir-title" className="poster text-[clamp(3.2rem,10vw,11rem)] lg:col-span-8">Kreative entdecken</h1>
          <p className="text-base text-pretty text-muted-foreground sm:text-lg lg:col-span-4 lg:pb-2">
            Kuratierte Profile aus dem Creative-Connect-Netzwerk. Anfragen und vollständige Profile gibt es nach der Anmeldung.
          </p>
        </div>
      </section>

      {/* Filterleiste: randlos über die volle Breite */}
      <form className="gutter grid border-y sm:grid-cols-[1fr_1fr_auto]" role="search">
        <label className="flex flex-col gap-1 border-b py-3 sm:border-r sm:border-b-0 sm:pr-6">
          <span className="meta text-muted-foreground">01 — Bereich</span>
          <select name="bereich" defaultValue={bereich} className={selectClass}>
            <option value="">Alle Bereiche</option>
            {CATEGORIES.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 border-b py-3 sm:border-r sm:border-b-0 sm:px-6">
          <span className="meta text-muted-foreground">02 — Stadt</span>
          <select name="stadt" defaultValue={stadt} className={selectClass}>
            <option value="">Ganz Deutschland</option>
            {CITIES.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
          </select>
        </label>
        <div className="flex items-center py-3 sm:pl-6">
          <Button type="submit" size="lg" className="meta h-12 w-full px-8 sm:w-auto">Filtern</Button>
        </div>
      </form>

      {profiles.length > 0 ? (
        // Karten als Zellraster: Rundungen weg, nur rechte/untere Haarlinie bleibt
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 [&>article]:rounded-none [&>article]:border-t-0 [&>article]:border-l-0">
          {profiles.map((p) => <ProfileCard key={p.id} profile={p} />)}
        </div>
      ) : (
        <div className="gutter border-b py-20 sm:py-28">
          <p className="meta text-muted-foreground">0 Treffer</p>
          <h2 className="poster mt-4 text-[clamp(2.4rem,6vw,6rem)]">Keine Profile gefunden</h2>
          <p className="mt-4 max-w-md text-muted-foreground">Probiere einen anderen Bereich oder eine andere Stadt.</p>
        </div>
      )}
    </>
  );
}
