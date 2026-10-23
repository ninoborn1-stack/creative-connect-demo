import Link from "next/link";
import { ArrowUpRight, CalendarDays, FolderKanban, MapPin, Users } from "lucide-react";
import { db } from "@/lib/db";
import { getFees } from "@/lib/settings";
import { CITIES, MANAGED_STAGES } from "@/lib/constants";
import { formatDate, formatEur, parseJson } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/badges";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreateManagedDialog, OfferDialog, StageButtons } from "@/components/admin/managed-tools";
import type { ManagedOffer } from "@/app/actions/admin";

export const metadata = { title: "Admin – Managed Crews" };

export default async function AdminManagedPage() {
  const [projects, clients, offersRow, fees] = await Promise.all([
    db.project.findMany({
      where: { type: "managed" },
      include: { owner: true, roles: true },
      orderBy: { createdAt: "desc" },
    }),
    db.user.findMany({ where: { isClient: true, status: { not: "gesperrt" } }, orderBy: { name: "asc" } }),
    db.setting.findUnique({ where: { key: "managedOffers" } }),
    getFees(),
  ]);
  const offers = parseJson<Record<string, ManagedOffer>>(offersRow?.value, {});
  const stageIndex = (s: string | null) => Math.max(0, MANAGED_STAGES.findIndex((m) => m.key === (s ?? "anfrage")));

  return (
    <div>
      <PageHeader
        title="Managed Crews"
        description={`Premium-Weg: Das Team stellt die Crew zusammen und begleitet die Produktion – ${fees.managedMarginPct.toLocaleString("de-DE")} % Marge auf die Honorare.`}
        actions={
          <CreateManagedDialog
            clients={clients.map((c) => ({ id: c.id, label: c.company ? `${c.company} (${c.name})` : c.name }))}
            cities={CITIES.map((c) => c.name)}
          />
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {MANAGED_STAGES.map((stage, si) => {
          const items = projects.filter((p) => stageIndex(p.managedStage) === si);
          return (
            <section key={stage.key} aria-labelledby={`stage-${stage.key}`} className="flex flex-col gap-3 rounded-xl bg-muted/40 p-3">
              <h2 id={`stage-${stage.key}`} className="flex items-center justify-between px-1 text-sm font-semibold">
                <span>
                  {si + 1}. {stage.label}
                </span>
                <span className="rounded-full bg-background px-2 py-0.5 text-xs text-muted-foreground">{items.length}</span>
              </h2>
              {items.length === 0 ? (
                <p className="rounded-lg border border-dashed px-3 py-6 text-center text-xs text-muted-foreground">Keine Projekte in dieser Phase</p>
              ) : (
                items.map((p) => {
                  const offer = offers[p.id];
                  const filled = p.roles.filter((r) => r.assigneeId).length;
                  return (
                    <Card key={p.id} className="gap-3 py-4">
                      <CardContent className="space-y-3 px-4">
                        <div className="space-y-1">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="leading-snug font-medium">{p.title}</h3>
                            <StatusBadge status={p.status} />
                          </div>
                          <p className="text-xs text-muted-foreground">{p.owner.company ?? p.owner.name}</p>
                        </div>
                        <ul className="grid gap-1 text-xs text-muted-foreground">
                          <li className="flex items-center gap-1.5">
                            <MapPin className="size-3.5" aria-hidden /> {p.city}
                          </li>
                          <li className="flex items-center gap-1.5">
                            <CalendarDays className="size-3.5" aria-hidden /> {formatDate(p.startDate)}
                          </li>
                          <li className="flex items-center gap-1.5">
                            <Users className="size-3.5" aria-hidden /> {p.roles.length ? `${filled}/${p.roles.length} Rollen besetzt` : "Noch keine Rollen"}
                          </li>
                        </ul>
                        <dl className="grid grid-cols-2 gap-2 rounded-lg bg-muted/50 p-2 text-xs">
                          <div>
                            <dt className="text-muted-foreground">Budget</dt>
                            <dd className="font-medium tabular-nums">{formatEur(p.budget)}</dd>
                          </div>
                          <div>
                            <dt className="text-muted-foreground">Angebot</dt>
                            <dd className="font-medium tabular-nums">{offer ? formatEur(offer.total) : "–"}</dd>
                          </div>
                          {offer && (
                            <div className="col-span-2 text-muted-foreground">
                              davon Marge {formatEur(offer.margin)} ({offer.marginPct.toLocaleString("de-DE")} %)
                            </div>
                          )}
                        </dl>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <StageButtons projectId={p.id} title={p.title} canBack={si > 0} canForward={si < MANAGED_STAGES.length - 1} />
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <OfferDialog projectId={p.id} title={p.title} budget={p.budget} marginPct={fees.managedMarginPct} currentFee={offer?.fee} />
                          <Button size="sm" variant="ghost" asChild>
                            <Link href={`/projekte/${p.id}`}>
                              Projektraum <ArrowUpRight aria-hidden />
                            </Link>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </section>
          );
        })}
      </div>

      {projects.length === 0 && (
        <p className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
          <FolderKanban className="size-4" aria-hidden /> Noch keine Managed Crews – lege die erste über den Button oben an.
        </p>
      )}
    </div>
  );
}
