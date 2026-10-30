import type { Metadata } from "next";
import Link from "next/link";
import { eachDayOfInterval, format, isValid, parseISO } from "date-fns";
import { Globe, LayoutGrid, Map as MapIcon, SearchX } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { getMarketplaceMode } from "@/lib/settings";
import { CITIES, categoryName } from "@/lib/constants";
import { distanceKm, parseJson } from "@/lib/format";
import { placeFounder } from "@/lib/features";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { ProfileCard } from "@/components/profile-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArtistRequestDialog } from "@/components/starter/artist-request-dialog";
import { GermanyMap, type MapCity } from "@/components/members/germany-map";
import {
  MembersFilterSheet, MembersFilterSidebar, MembersSearch, SortSelect, type MemberFilters,
} from "@/components/members/members-filter";

export const metadata: Metadata = { title: "Artists" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const KEYS = ["q", "bereich", "skill", "stadt", "umkreis", "maxsatz", "von", "bis", "verifiziert", "bewertung", "sort", "ansicht"] as const;

function toFilters(sp: Record<string, string | string[] | undefined>): MemberFilters {
  const f: MemberFilters = {};
  for (const k of KEYS) {
    const v = sp[k];
    const s = Array.isArray(v) ? v[0] : v;
    if (s) f[k] = s;
  }
  return f;
}

function buildHref(f: MemberFilters, patch: Partial<MemberFilters>) {
  const params = new URLSearchParams();
  const merged = { ...f, ...patch };
  for (const k of KEYS) {
    const v = merged[k];
    if (v) params.set(k, v);
  }
  const qs = params.toString();
  return qs ? `/mitglieder?${qs}` : "/mitglieder";
}

export default async function MitgliederPage({ searchParams }: { searchParams: SearchParams }) {
  const user = await requireUser();
  const f = toFilters(await searchParams);
  const [profiles, mode] = await Promise.all([
    db.profile.findMany({
      where: { user: { isCreative: true, status: { not: "gesperrt" } } },
      include: { user: { select: { id: true, name: true, createdAt: true, isAdmin: true } } },
    }),
    getMarketplaceMode(),
  ]);

  const allSkills = [...new Set(profiles.flatMap((p) => parseJson<string[]>(p.skills, [])))].sort((a, b) => a.localeCompare(b, "de"));

  // Zeitraum für Verfügbarkeit
  const from = f.von ? parseISO(f.von) : null;
  const to = f.bis ? parseISO(f.bis) : from;
  const rangeDays =
    from && isValid(from) && to && isValid(to) && to >= from
      ? eachDayOfInterval({ start: from, end: to }).slice(0, 120).map((d) => format(d, "yyyy-MM-dd"))
      : null;

  const q = f.q?.toLowerCase().trim();
  const maxRate = f.maxsatz ? Number(f.maxsatz) : null;
  const minRating = f.bewertung ? Number(f.bewertung) : null;

  const enriched = profiles.map((p) => ({
    p,
    cats: parseJson<string[]>(p.categories, []),
    skills: parseJson<string[]>(p.skills, []),
    busy: parseJson<string[]>(p.busyDates, []),
  }));

  // alle Filter außer Ort → Grundlage für die Karte
  const base = enriched.filter(({ p, cats, skills, busy }) => {
    if (q && ![p.user.name, p.headline, ...skills].some((s) => s.toLowerCase().includes(q))) return false;
    if (f.bereich && !cats.includes(f.bereich)) return false;
    if (f.skill && !skills.includes(f.skill)) return false;
    if (maxRate && p.dayRateMin > maxRate) return false;
    if (f.verifiziert === "1" && !p.verified) return false;
    if (minRating && (p.ratingCount === 0 || p.ratingAvg < minRating)) return false;
    if (rangeDays && (p.availability === "ausgebucht" || rangeDays.some((d) => busy.includes(d)))) return false;
    return true;
  });

  const city = CITIES.find((c) => c.name === f.stadt);
  const radius = f.umkreis ? Number(f.umkreis) : 30;
  const sorted = base
    .filter(({ p }) => !city || distanceKm(city, p) <= radius)
    .map(({ p }) => p)
    .sort((a, b) => {
      switch (f.sort) {
        case "preis-auf": return a.dayRateMin - b.dayRateMin;
        case "preis-ab": return b.dayRateMax - a.dayRateMax;
        case "neu": return b.memberSince.getTime() - a.memberSince.getTime();
        default: return b.ratingAvg - a.ratingAvg || b.ratingCount - a.ratingCount;
      }
    });
  const results = f.sort ? sorted : placeFounder(sorted, (p) => p.user.isAdmin);

  const mapCities: MapCity[] = CITIES.map((c) => ({
    name: c.name, lat: c.lat, lng: c.lng,
    count: base.filter(({ p }) => p.city === c.name).length,
    href: buildHref(f, { stadt: f.stadt === c.name ? undefined : c.name, ansicht: "karte" }),
  }));

  const isMap = f.ansicht === "karte";
  const activeChips = [
    f.q && { label: `„${f.q}“`, key: "q" },
    f.bereich && { label: categoryName(f.bereich), key: "bereich" },
    f.skill && { label: f.skill, key: "skill" },
    f.stadt && { label: `${f.stadt} · ${radius} km`, key: "stadt" },
    f.maxsatz && { label: `bis ${f.maxsatz} €`, key: "maxsatz" },
    rangeDays && { label: `frei ${f.von}${f.bis && f.bis !== f.von ? ` – ${f.bis}` : ""}`, key: "von" },
    f.bewertung && { label: `ab ${f.bewertung.replace(".", ",")} ★`, key: "bewertung" },
    f.verifiziert === "1" && { label: "verifiziert", key: "verifiziert" },
  ].filter(Boolean) as { label: string; key: keyof MemberFilters }[];

  return (
    <>
      <PageHeader
        title="Artists"
        description="Das kuratierte Netzwerk von Nesto: finde Artists nach Bereich, Ort und Preis – und frag sie direkt an."
        actions={
          mode === "open" ? (
            <Badge variant="outline" className="gap-1"><Globe aria-hidden /> öffentlich sichtbar</Badge>
          ) : (
            <Badge variant="secondary">nur für Mitglieder</Badge>
          )
        }
      />

      <div className="grid gap-6 lg:grid-cols-[16rem_minmax(0,1fr)]">
        <MembersFilterSidebar key={`d-${JSON.stringify(f)}`} filters={f} skills={allSkills} />

        <div className="min-w-0 space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <MembersSearch key={f.q ?? ""} q={f.q} />
            <div className="flex items-center gap-2">
              <MembersFilterSheet key={`m-${JSON.stringify(f)}`} filters={f} skills={allSkills} />
              <div className="inline-flex rounded-lg border p-0.5" role="group" aria-label="Ansicht">
                <Button asChild size="sm" variant={isMap ? "ghost" : "secondary"}>
                  <Link href={buildHref(f, { ansicht: undefined })} aria-current={!isMap ? "page" : undefined} scroll={false}>
                    <LayoutGrid aria-hidden /> Karten
                  </Link>
                </Button>
                <Button asChild size="sm" variant={isMap ? "secondary" : "ghost"}>
                  <Link href={buildHref(f, { ansicht: "karte" })} aria-current={isMap ? "page" : undefined} scroll={false}>
                    <MapIcon aria-hidden /> Deutschland
                  </Link>
                </Button>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground" aria-live="polite">
              <span className="font-semibold text-foreground">{results.length}</span> {results.length === 1 ? "Artist" : "Artists"} gefunden
            </p>
            <SortSelect value={f.sort} />
          </div>

          {activeChips.length > 0 && (
            <ul className="flex flex-wrap gap-1.5" aria-label="Aktive Filter">
              {activeChips.map((c) => (
                <li key={c.key}>
                  <Link
                    href={buildHref(f, c.key === "von" ? { von: undefined, bis: undefined } : c.key === "stadt" ? { stadt: undefined, umkreis: undefined } : { [c.key]: undefined })}
                    className="inline-flex items-center gap-1 rounded-full border bg-card px-2.5 py-0.5 text-xs hover:border-primary/50"
                    aria-label={`Filter ${c.label} entfernen`}
                    scroll={false}
                  >
                    {c.label} <span aria-hidden>×</span>
                  </Link>
                </li>
              ))}
              <li>
                <Link href={buildHref({ sort: f.sort, ansicht: f.ansicht }, {})} className="px-1 text-xs text-primary hover:underline" scroll={false}>
                  Alle entfernen
                </Link>
              </li>
            </ul>
          )}

          {isMap && (
            <section aria-labelledby="map-heading" className="rounded-xl border bg-card/50 p-4">
              <h2 id="map-heading" className="sr-only">Deutschlandkarte</h2>
              <GermanyMap cities={mapCities} selected={f.stadt} />
            </section>
          )}

          {results.length === 0 ? (
            <EmptyState
              icon={SearchX}
              title="Keine Treffer"
              description="Mit diesen Filtern haben wir niemanden gefunden. Erweitere Umkreis oder Zeitraum – oder lass dir vom Briefing-Assistenten eine Crew vorschlagen."
              action={
                <div className="flex flex-wrap justify-center gap-2">
                  <Button asChild variant="outline" size="sm"><Link href="/mitglieder">Filter zurücksetzen</Link></Button>
                  <Button asChild size="sm"><Link href="/briefing">Briefing-Assistent</Link></Button>
                </div>
              }
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {results.map((p) => (
                <ProfileCard
                  key={p.id}
                  profile={p}
                  action={
                    p.userId !== user.id ? (
                      <ArtistRequestDialog creative={{ id: p.userId, name: p.user.name }} suggestedBudget={p.dayRateMin} defaultCity={user.profile?.city} size="sm" className="w-full" />
                    ) : (
                      <Button asChild variant="ghost" size="sm" className="w-full"><Link href="/profil">Das bist du – Profil bearbeiten</Link></Button>
                    )
                  }
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
