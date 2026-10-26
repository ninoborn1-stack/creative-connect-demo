import Link from "next/link";
import { FileBadge2, Gamepad2, Library, Music2, Search } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { getFees } from "@/lib/settings";
import { INDUSTRIES, WORK_TYPES } from "@/lib/constants";
import { formatEur, formatNumber, parseJson } from "@/lib/format";
import { isAudioType, isExclusivelyTaken } from "@/lib/licensing";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { NativeSelect } from "@/components/venues/native-select";
import { WORK_CARD_INCLUDE, WorkCard } from "@/components/licensing/work-card";
import { TierExplainer } from "@/components/licensing/tier-explainer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type SP = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

const SORTS: Record<string, string> = { empfohlen: "Empfohlen", neu: "Neu", preis: "Preis aufsteigend", "preis-ab": "Preis absteigend", beliebt: "Beliebt" };

export const metadata = { title: "Lizenz-Katalog" };

export default async function LicensingCatalogPage({ searchParams }: { searchParams: Promise<SP> }) {
  const user = await requireUser();
  const sp = await searchParams;
  const q = one(sp.q).trim();
  const typ = WORK_TYPES[one(sp.typ)] ? one(sp.typ) : "";
  const branche = INDUSTRIES.some((i) => i.slug === one(sp.branche)) ? one(sp.branche) : "";
  const max = Number(one(sp.max)) || 0;
  const bpmMin = Number(one(sp.bpmMin)) || 0;
  const bpmMax = Number(one(sp.bpmMax)) || 0;
  const exklusiv = one(sp.exklusiv) === "1";
  const kifrei = one(sp.kifrei) === "1";
  const sort = SORTS[one(sp.sort)] ? one(sp.sort) : "empfohlen";
  const hasFilter = Boolean(q || typ || branche || max || bpmMin || bpmMax || exklusiv || kifrei);

  const [all, fees, adminStats] = await Promise.all([
    db.licensableWork.findMany({ include: WORK_CARD_INCLUDE, orderBy: { createdAt: "desc" } }),
    getFees(),
    user.isAdmin ? db.license.aggregate({ _count: { _all: true }, _sum: { price: true, serviceFee: true } }) : null,
  ]);

  const needle = q.toLowerCase();
  const works = all
    .map((w) => ({ ...w, tagList: parseJson<string[]>(w.tags, []), industryList: parseJson<string[]>(w.industries, []), taken: isExclusivelyTaken(w.licenses) }))
    .filter((w) => {
      if (needle && !w.title.toLowerCase().includes(needle) && !w.tagList.some((t) => t.toLowerCase().includes(needle))) return false;
      if (typ && w.type !== typ) return false;
      if (branche && !w.industryList.includes(branche)) return false;
      if (max > 0 && w.priceStandard > max) return false;
      if ((bpmMin || bpmMax) && (!isAudioType(w.type) || !w.bpm || (bpmMin && w.bpm < bpmMin) || (bpmMax && w.bpm > bpmMax))) return false;
      if (exklusiv && (w.priceExclusive == null || w.taken)) return false;
      if (kifrei && w.aiMarked) return false;
      return true;
    })
    .sort((a, b) => {
      if (sort === "neu") return +b.createdAt - +a.createdAt;
      if (sort === "preis") return a.priceStandard - b.priceStandard;
      if (sort === "preis-ab") return b.priceStandard - a.priceStandard;
      if (sort === "beliebt") return b.plays - a.plays;
      return Number(b.featured) - Number(a.featured) || b.licenses.length - a.licenses.length || b.plays - a.plays;
    });

  const gaming = hasFilter
    ? []
    : all
        .filter((w) => parseJson<string[]>(w.industries, []).includes("gaming") && !isExclusivelyTaken(w.licenses))
        .sort((a, b) => Number(b.featured) - Number(a.featured) || b.licenses.length - a.licenses.length || b.plays - a.plays)
        .slice(0, 3);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Lizenz-Katalog"
        description="Fertige Werke aus dem Netzwerk – Tracks, Beats, Sounds, Voice, Artwork, Fotos und Footage. Direkt lizenzieren nach Umfang, Medien, Gebiet und Laufzeit, mit Zertifikat."
        actions={
          <>
            <Button asChild variant="outline"><Link href="/lizenzen/meine"><FileBadge2 aria-hidden />Meine Lizenzen</Link></Button>
            {(user.isCreative || user.isAdmin) && (
              <Button asChild><Link href="/lizenzen/werke"><Library aria-hidden />Meine Werke</Link></Button>
            )}
          </>
        }
      />

      {adminStats && (
        <section aria-label="Lizenz-Statistik (nur Admin)" className="grid grid-cols-1 gap-3 rounded-xl border border-primary/30 bg-primary/5 p-4 sm:grid-cols-3" data-testid="license-admin-stats">
          <div>
            <p className="text-xs text-muted-foreground">Lizenzen gesamt</p>
            <p className="text-2xl font-semibold tabular-nums">{formatNumber(adminStats._count._all)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Lizenzvolumen (an Kreative)</p>
            <p className="text-2xl font-semibold tabular-nums">{formatEur(adminStats._sum.price ?? 0)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Servicegebühren Plattform</p>
            <p className="text-2xl font-semibold tabular-nums">{formatEur(adminStats._sum.serviceFee ?? 0)}</p>
          </div>
        </section>
      )}

      <form method="get" className="grid gap-3 rounded-xl border bg-card p-4 sm:grid-cols-2 lg:grid-cols-4 lg:items-end" aria-label="Katalog filtern" role="search">
        <div className="grid gap-1.5 sm:col-span-2">
          <Label htmlFor="f-q">Suche</Label>
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input id="f-q" name="q" type="search" defaultValue={q} placeholder="Titel oder Tag, z. B. Cinematic, Foley" className="h-9 pl-8" />
          </div>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="f-typ">Typ</Label>
          <NativeSelect id="f-typ" name="typ" defaultValue={typ}>
            <option value="">Alle Typen</option>
            {Object.entries(WORK_TYPES).map(([k, v]) => <option key={k} value={k}>{v.plural}</option>)}
          </NativeSelect>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="f-branche">Branche</Label>
          <NativeSelect id="f-branche" name="branche" defaultValue={branche}>
            <option value="">Alle Branchen</option>
            {INDUSTRIES.map((i) => <option key={i.slug} value={i.slug}>{i.name}</option>)}
          </NativeSelect>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="f-max">Preis bis (€, Standard)</Label>
          <Input id="f-max" name="max" type="number" min={0} step={10} inputMode="numeric" placeholder="z. B. 300" defaultValue={max || ""} className="h-9" />
        </div>
        <fieldset className="grid gap-1.5">
          <legend className="mb-1.5 text-sm leading-none font-medium">BPM (nur Audio)</legend>
          <div className="flex items-center gap-2">
            <Input name="bpmMin" type="number" min={20} max={300} inputMode="numeric" placeholder="von" aria-label="BPM von" defaultValue={bpmMin || ""} className="h-9" />
            <span aria-hidden className="text-muted-foreground">–</span>
            <Input name="bpmMax" type="number" min={20} max={300} inputMode="numeric" placeholder="bis" aria-label="BPM bis" defaultValue={bpmMax || ""} className="h-9" />
          </div>
        </fieldset>
        <div className="grid gap-1.5">
          <Label htmlFor="f-sort">Sortierung</Label>
          <NativeSelect id="f-sort" name="sort" defaultValue={sort}>
            {Object.entries(SORTS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </NativeSelect>
        </div>
        <div className="flex flex-col justify-end gap-1.5 text-sm">
          <label className="flex items-center gap-2">
            <input type="checkbox" name="exklusiv" value="1" defaultChecked={exklusiv} className="size-4 accent-primary" />
            Nur exklusiv verfügbar
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" name="kifrei" value="1" defaultChecked={kifrei} className="size-4 accent-primary" />
            Nur KI-frei
          </label>
        </div>
        <div className="flex gap-2 sm:col-span-2 lg:col-span-4 lg:justify-end">
          <Button type="submit" className="h-9 flex-1 lg:flex-none lg:px-6">Filtern</Button>
          {(hasFilter || sort !== "empfohlen") && (
            <Button asChild variant="ghost" className="h-9"><Link href="/lizenzen">Zurücksetzen</Link></Button>
          )}
        </div>
      </form>

      {gaming.length > 0 && (
        <section aria-labelledby="kuratiert-gaming" className="space-y-3">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 id="kuratiert-gaming" className="flex items-center gap-2 text-xl font-semibold"><Gamepad2 className="size-5 text-primary" aria-hidden />Kuratiert für Gaming</h2>
              <p className="text-sm text-muted-foreground">Soundtrack, SFX, Voice und Concept Art – mit Lizenzen für Games, Trailer und weltweite Releases.</p>
            </div>
            <Button asChild variant="link" className="px-0"><Link href="/lizenzen?branche=gaming">Alle Gaming-Werke</Link></Button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {gaming.map((w) => <WorkCard key={w.id} work={w} />)}
          </div>
        </section>
      )}

      <section aria-labelledby="alle-werke" className="space-y-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="alle-werke" className="text-xl font-semibold">{hasFilter ? "Suchergebnisse" : "Alle Werke"}</h2>
          <p className="text-sm text-muted-foreground" aria-live="polite">{works.length} {works.length === 1 ? "Werk" : "Werke"}</p>
        </div>
        {works.length === 0 ? (
          <EmptyState
            icon={Music2}
            title="Kein Werk passt zu deinen Filtern"
            description="Lockere die Filter oder suche nach einem anderen Begriff. Für individuelle Produktionen kannst du Kreative auch direkt anfragen."
            action={<Button asChild variant="outline"><Link href="/lizenzen">Filter zurücksetzen</Link></Button>}
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {works.map((w) => <WorkCard key={w.id} work={w} exclusiveTaken={w.taken} />)}
          </div>
        )}
      </section>

      <TierExplainer serviceFeePct={fees.serviceFeePct} />
    </div>
  );
}
