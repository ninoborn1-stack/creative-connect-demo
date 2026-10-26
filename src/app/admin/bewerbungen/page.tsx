import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { ArrowUpRight, ClipboardCheck, Gamepad2, MapPin, UserRound } from "lucide-react";
import { db } from "@/lib/db";
import { APPLICATION_STATUS, CATEGORIES, categoryName } from "@/lib/constants";
import { formatRelative, parseJson } from "@/lib/format";
import type { ExtractedProfile } from "@/lib/application-meta";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FilterSelect } from "@/components/admin/filter-select";
import { ScoreRing } from "@/components/apply/score-ring";
import { ApplicationStatusBadge, TrackBadge } from "@/components/admin/application-badges";

export const metadata = { title: "Admin – Bewerbungen" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function AdminApplicationsPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
  const status = one(sp.status) || "offen";
  const track = one(sp.track) || "alle";
  const bereich = one(sp.bereich) || "alle";

  const where: Prisma.CreativeApplicationWhereInput = {};
  if (status === "offen") where.status = { in: ["eingereicht", "in_pruefung"] };
  else if (status !== "alle") where.status = status;
  if (track !== "alle") where.track = track;
  if (bereich !== "alle") where.categories = { contains: `"${bereich}"` };

  const [apps, counts] = await Promise.all([
    db.creativeApplication.findMany({ where, orderBy: { createdAt: "desc" }, take: 300 }),
    db.creativeApplication.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);
  const referrerIds = [...new Set(apps.map((a) => a.referrerId).filter((x): x is string => !!x))];
  const referrers = referrerIds.length ? await db.user.findMany({ where: { id: { in: referrerIds } }, select: { id: true, name: true } }) : [];
  const refName = new Map(referrers.map((r) => [r.id, r.name]));

  // Queue: Fast-Track zuerst, dann Score, dann neueste
  const sorted = [...apps].sort(
    (a, b) => Number(b.track === "netzwerk") - Number(a.track === "netzwerk") || b.score - a.score || +b.createdAt - +a.createdAt,
  );
  const count = (s: string) => counts.find((c) => c.status === s)?._count._all ?? 0;

  return (
    <div>
      <PageHeader
        title="Bewerbungen"
        description="Kreative bewerben sich selbst oder über Nestos Netzwerk. Die Auto-Analyse sortiert vor – entschieden wird hier."
        actions={<Button variant="outline" asChild><Link href="/bewerben">Bewerbungsseite <ArrowUpRight aria-hidden /></Link></Button>}
      />

      <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {(["eingereicht", "in_pruefung", "angenommen", "abgelehnt"] as const).map((s) => (
          <Link key={s} href={`/admin/bewerbungen?status=${s}`} className="rounded-xl border bg-card p-3 transition-colors hover:bg-muted">
            <p className="text-xs text-muted-foreground">{APPLICATION_STATUS[s]}</p>
            <p className="text-2xl font-semibold tabular-nums">{count(s)}</p>
          </Link>
        ))}
      </div>

      <form method="get" className="mb-6 grid gap-2 sm:flex sm:flex-wrap sm:items-center" aria-label="Bewerbungen filtern">
        <FilterSelect name="status" label="Status" defaultValue={status} options={[{ value: "offen", label: "Offen (neu + in Prüfung)" }, { value: "alle", label: "Alle Status" }, ...Object.entries(APPLICATION_STATUS).map(([value, label]) => ({ value, label }))]} />
        <FilterSelect name="track" label="Weg" defaultValue={track} options={[{ value: "alle", label: "Alle Wege" }, { value: "netzwerk", label: "Fast-Track" }, { value: "standard", label: "Selbstbewerbung" }]} />
        <FilterSelect name="bereich" label="Bereich" defaultValue={bereich} options={[{ value: "alle", label: "Alle Bereiche" }, ...CATEGORIES.map((c) => ({ value: c.slug, label: c.name }))]} />
        <Button type="submit" variant="secondary">Filtern</Button>
      </form>

      {sorted.length === 0 ? (
        <EmptyState icon={ClipboardCheck} title="Keine Bewerbungen" description="Für diese Filter gibt es gerade nichts zu prüfen." />
      ) : (
        <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {sorted.map((a) => {
            const ex = parseJson<Partial<ExtractedProfile>>(a.extracted, {});
            const cats = parseJson<string[]>(a.categories, []);
            const gaming = ex.industries?.includes("gaming");
            return (
              <li key={a.id}>
                <Card className="relative h-full gap-0 py-0 transition-colors hover:border-primary/50">
                  <CardContent className="flex h-full flex-col gap-3 p-4">
                    <div className="flex items-start gap-3">
                      <ScoreRing score={a.score} size={56} />
                      <div className="min-w-0 flex-1">
                        <Link href={`/admin/bewerbungen/${a.id}`} className="font-semibold after:absolute after:inset-0 hover:underline">
                          {a.name}
                        </Link>
                        <p className="flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="size-3" aria-hidden /> {a.city} · {formatRelative(a.createdAt)}</p>
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                          <TrackBadge track={a.track} />
                          <ApplicationStatusBadge status={a.status} />
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {cats.map((c) => <Badge key={c} variant="secondary">{categoryName(c)}</Badge>)}
                      {gaming && <Badge variant="outline" className="border-primary/40 text-primary"><Gamepad2 aria-hidden /> Gaming</Badge>}
                    </div>
                    <p className="line-clamp-2 text-sm text-muted-foreground">{a.pitch}</p>
                    {a.referrerId && (
                      <p className="mt-auto flex items-center gap-1.5 text-xs"><UserRound className="size-3.5 text-primary" aria-hidden /> Empfohlen von <strong>{refName.get(a.referrerId) ?? "Mitglied"}</strong></p>
                    )}
                  </CardContent>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
