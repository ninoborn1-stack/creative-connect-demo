import Link from "next/link";
import { ArrowLeft, Eye, Library, Lock, Pencil, Plus, Sparkles } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { LICENSE_TIERS } from "@/lib/constants";
import { formatDate, formatEur, formatNumber } from "@/lib/format";
import { isAudioType, isExclusivelyTaken, workTypeLabel } from "@/lib/licensing";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { WorkImage } from "@/components/licensing/work-visual";
import { DeleteWorkButton } from "@/components/licensing/delete-work-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type SP = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export const metadata = { title: "Meine Werke" };

export default async function MyWorksPage({ searchParams }: { searchParams: Promise<SP> }) {
  const user = await requireUser();
  const sp = await searchParams;

  if (!user.isCreative && !user.isAdmin) {
    return (
      <div className="space-y-6">
        <PageHeader title="Meine Werke" />
        <EmptyState
          icon={Library}
          title="Werke anbieten können Kreative"
          description="Als Unternehmen lizenzierst du Werke direkt im Katalog. Deine Lizenzen findest du unter „Meine Lizenzen“."
          action={<Button asChild><Link href="/lizenzen/meine">Meine Lizenzen</Link></Button>}
        />
      </div>
    );
  }

  const works = await db.licensableWork.findMany({
    where: { ownerId: user.id },
    include: { licenses: { include: { company: { select: { name: true } }, buyer: { select: { name: true } } }, orderBy: { createdAt: "desc" } } },
    orderBy: { createdAt: "desc" },
  });

  const allLicenses = works.flatMap((w) => w.licenses.map((l) => ({ ...l, workTitle: w.title, workSlug: w.slug }))).sort((a, b) => +b.createdAt - +a.createdAt);
  const revenue = allLicenses.reduce((s, l) => s + l.price, 0);
  const plays = works.reduce((s, w) => s + w.plays, 0);
  const notice = one(sp.neu) ? "Dein Werk ist jetzt im Katalog." : one(sp.gespeichert) ? "Änderungen gespeichert." : one(sp.geloescht) ? "Das Werk wurde gelöscht." : null;

  return (
    <div className="space-y-8">
      <div>
        <Link href="/lizenzen" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" aria-hidden />Zum Katalog
        </Link>
        <PageHeader
          title="Meine Werke"
          description="Biete fertige Werke zur Lizenzierung an – die Lizenzgebühr geht zu 100 % an dich, Unternehmen erhalten ein Zertifikat."
          actions={<Button asChild><Link href="/lizenzen/werke/neu"><Plus aria-hidden />Werk hinzufügen</Link></Button>}
        />
        {notice && <p role="status" className="rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-sm">{notice}</p>}
      </div>

      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          ["Werke", formatNumber(works.length)],
          ["Verkaufte Lizenzen", formatNumber(allLicenses.length)],
          ["Umsatz (100 % an dich)", formatEur(revenue)],
          ["Plays & Aufrufe", formatNumber(plays)],
        ].map(([k, v]) => (
          <div key={k} className="rounded-xl border bg-card p-4">
            <dt className="text-xs text-muted-foreground">{k}</dt>
            <dd className="text-xl font-semibold tabular-nums sm:text-2xl">{v}</dd>
          </div>
        ))}
      </dl>

      <section aria-labelledby="werke-liste" className="space-y-3">
        <h2 id="werke-liste" className="text-xl font-semibold">Werke im Katalog</h2>
        {works.length === 0 ? (
          <EmptyState
            icon={Library}
            title="Du bietest noch keine Werke an"
            description="Tracks, Beats, Sound-Packs, Voice, Artwork, Fotos oder Footage – lade dein erstes Werk hoch und lege drei Preisstufen fest."
            action={<Button asChild><Link href="/lizenzen/werke/neu"><Plus aria-hidden />Werk hinzufügen</Link></Button>}
          />
        ) : (
          <ul className="space-y-3">
            {works.map((w) => {
              const sum = w.licenses.reduce((s, l) => s + l.price, 0);
              const taken = isExclusivelyTaken(w.licenses);
              return (
                <li key={w.id} className="rounded-xl border bg-card p-4" data-testid="my-work">
                  <div className="flex gap-3 sm:gap-4">
                    <div className="relative hidden size-20 shrink-0 overflow-hidden rounded-lg bg-muted min-[420px]:block">
                      <WorkImage work={w} sizes="80px" />
                    </div>
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link href={`/lizenzen/${w.slug}`} className="font-semibold hover:underline">{w.title}</Link>
                        <Badge variant="secondary">{workTypeLabel(w.type)}</Badge>
                        {taken ? (
                          <Badge variant="outline" className="gap-1"><Lock className="size-3" aria-hidden />Exklusiv vergeben</Badge>
                        ) : (
                          <Badge variant="outline" className="border-emerald-500/40 text-emerald-600 dark:text-emerald-300">Lizenzierbar</Badge>
                        )}
                        {w.aiMarked && <Badge variant="outline" className="gap-1 text-primary"><Sparkles className="size-3" aria-hidden />KI</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {formatEur(w.priceStandard)} / {formatEur(w.priceExtended)} / {w.priceExclusive != null ? formatEur(w.priceExclusive) : "kein Exklusiv"} · seit {formatDate(w.createdAt)}
                      </p>
                      <p className="text-sm">
                        <strong>{w.licenses.length}</strong> {w.licenses.length === 1 ? "Lizenz" : "Lizenzen"} · <strong>{formatEur(sum)}</strong> Umsatz ·{" "}
                        {formatNumber(w.plays)} {isAudioType(w.type) ? "Plays" : "Aufrufe"}
                      </p>
                      <div className="flex flex-wrap gap-1 pt-1">
                        <Button asChild size="sm" variant="outline"><Link href={`/lizenzen/${w.slug}`}><Eye aria-hidden />Ansehen</Link></Button>
                        <Button asChild size="sm" variant="outline"><Link href={`/lizenzen/werke/${w.slug}/bearbeiten`}><Pencil aria-hidden />Bearbeiten</Link></Button>
                        <DeleteWorkButton workId={w.id} title={w.title} licenseCount={w.licenses.length} />
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {allLicenses.length > 0 && (
        <section aria-labelledby="verkaeufe" className="space-y-3">
          <h2 id="verkaeufe" className="text-xl font-semibold">Letzte Verkäufe</h2>
          <div className="overflow-x-auto rounded-xl border bg-card">
            <table className="w-full min-w-[560px] text-sm">
              <thead className="text-left text-xs text-muted-foreground">
                <tr className="border-b">
                  <th scope="col" className="px-4 py-2 font-medium">Datum</th>
                  <th scope="col" className="px-4 py-2 font-medium">Werk</th>
                  <th scope="col" className="px-4 py-2 font-medium">Lizenznehmer:in</th>
                  <th scope="col" className="px-4 py-2 font-medium">Stufe</th>
                  <th scope="col" className="px-4 py-2 text-right font-medium">Lizenzgebühr</th>
                </tr>
              </thead>
              <tbody>
                {allLicenses.slice(0, 10).map((l) => (
                  <tr key={l.id} className="border-b last:border-0">
                    <td className="px-4 py-2 whitespace-nowrap">{formatDate(l.createdAt)}</td>
                    <td className="px-4 py-2"><Link href={`/lizenzen/${l.workSlug}`} className="hover:underline">{l.workTitle}</Link></td>
                    <td className="px-4 py-2">{l.company?.name ?? l.buyer.name}</td>
                    <td className="px-4 py-2">{LICENSE_TIERS[l.tier as keyof typeof LICENSE_TIERS]?.label ?? l.tier}</td>
                    <td className="px-4 py-2 text-right tabular-nums">{formatEur(l.price)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
