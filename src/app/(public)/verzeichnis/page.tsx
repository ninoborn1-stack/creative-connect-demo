import type { Metadata } from "next";
import Link from "next/link";
import { Lock } from "lucide-react";
import { db } from "@/lib/db";
import { getMarketplaceMode } from "@/lib/settings";
import { CATEGORIES, CITIES } from "@/lib/constants";
import { ProfileCard } from "@/components/profile-card";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Verzeichnis" };

// Öffentliches Verzeichnis – nur sichtbar, wenn der Admin den Marktplatz-Modus „open“ (Phase 3) gesetzt hat.
export default async function PublicDirectoryPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const mode = await getMarketplaceMode();
  if (mode !== "open") {
    return (
      <div className="mx-auto max-w-xl px-4 py-20">
        <EmptyState
          icon={Lock}
          title="Das Verzeichnis ist noch nicht öffentlich"
          description="Creative Connect ist gerade ein geschlossenes Netzwerk. Profile sehen nur eingeladene Mitglieder."
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <Button asChild><Link href="/invite/CC-DEMO-2026">Einladung einlösen</Link></Button>
              <Button asChild variant="outline"><Link href="/warteliste">Auf die Warteliste</Link></Button>
            </div>
          }
        />
      </div>
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

  const selectClass = "h-9 rounded-lg border border-input bg-transparent px-3 text-sm dark:bg-input/30";
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-bold">Kreative entdecken</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        Kuratierte Profile aus dem Creative-Connect-Netzwerk. Anfragen und vollständige Profile gibt es nach der Anmeldung.
      </p>
      <form className="mt-6 flex flex-wrap items-end gap-2" role="search">
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          Bereich
          <select name="bereich" defaultValue={bereich} className={selectClass}>
            <option value="">Alle Bereiche</option>
            {CATEGORIES.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          Stadt
          <select name="stadt" defaultValue={stadt} className={selectClass}>
            <option value="">Ganz Deutschland</option>
            {CITIES.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
          </select>
        </label>
        <Button type="submit" variant="secondary">Filtern</Button>
      </form>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {profiles.map((p) => <ProfileCard key={p.id} profile={p} />)}
      </div>
      {!profiles.length && <div className="mt-6"><EmptyState title="Keine Profile gefunden" description="Probiere einen anderen Bereich oder eine andere Stadt." /></div>}
    </div>
  );
}
