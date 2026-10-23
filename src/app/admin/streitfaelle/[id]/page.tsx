import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, CheckCircle2 } from "lucide-react";
import { db } from "@/lib/db";
import { formatDate, formatDateTime, formatEur, parseJson } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/badges";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DisputeStatus } from "@/components/admin/dispute-status";
import { DisputeDecision, DisputeNoteForm } from "@/components/admin/dispute-tools";
import { DISPUTE_RESOLUTION_LABEL } from "@/components/admin/admin-constants";

export const metadata = { title: "Admin – Streitfall" };

type LogEntry = { at: string; by: string; text: string };

export default async function AdminDisputeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const dispute = await db.dispute.findUnique({
    where: { id },
    include: {
      project: {
        include: {
          owner: true,
          roles: { include: { assignee: true }, orderBy: { sort: "asc" } },
          payments: { include: { payee: true }, orderBy: { createdAt: "asc" } },
        },
      },
    },
  });
  if (!dispute) notFound();
  const { project } = dispute;
  const log = parseJson<LogEntry[]>(dispute.log, []).sort((a, b) => a.at.localeCompare(b.at));
  const open = project.payments.filter((p) => p.status === "reserviert" || p.status === "freigegeben");
  const openSum = open.reduce((s, p) => s + p.amount, 0);

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link href="/admin/streitfaelle">
          <ArrowLeft aria-hidden /> Alle Streitfälle
        </Link>
      </Button>
      <PageHeader
        title={project.title}
        description={`Streitfall eröffnet von ${dispute.openedBy} am ${formatDate(dispute.createdAt)}`}
        actions={
          <Button variant="outline" asChild>
            <Link href={`/projekte/${project.id}`}>
              Projektraum <ArrowUpRight aria-hidden />
            </Link>
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex flex-wrap items-center gap-2 text-base">
                Anliegen <DisputeStatus status={dispute.status} />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{dispute.reason}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Entscheidung</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {dispute.status === "geloest" ? (
                <p className="flex items-start gap-2 rounded-lg bg-emerald-500/10 p-3 text-sm text-emerald-700 dark:text-emerald-300">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden />
                  <span>
                    {DISPUTE_RESOLUTION_LABEL[dispute.resolution ?? ""] ?? "Gelöst"}
                    {dispute.resolvedAt && ` am ${formatDateTime(dispute.resolvedAt)}`}
                  </span>
                </p>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground">
                    {open.length > 0
                      ? `${open.length} Zahlung(en) über ${formatEur(openSum)} sind beim Zahlungsdienstleister zurückgehalten.`
                      : "Für dieses Projekt sind keine offenen Zahlungen reserviert."}
                  </p>
                  <DisputeDecision disputeId={dispute.id} openAmount={formatEur(openSum)} />
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Verlauf</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {log.length === 0 ? (
                <p className="text-sm text-muted-foreground">Noch keine Einträge.</p>
              ) : (
                <ol className="relative space-y-4 border-l pl-5">
                  {log.map((e, i) => (
                    <li key={i} className="relative">
                      <span className="absolute top-1.5 -left-[1.6rem] size-2.5 rounded-full bg-primary ring-4 ring-card" aria-hidden />
                      <p className="text-xs text-muted-foreground">
                        <time dateTime={e.at}>{formatDateTime(e.at)}</time> · {e.by}
                      </p>
                      <p className="text-sm">{e.text}</p>
                    </li>
                  ))}
                </ol>
              )}
              {dispute.status !== "geloest" && <DisputeNoteForm disputeId={dispute.id} />}
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Projekt</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-2 text-sm">
                <div className="flex justify-between gap-2">
                  <dt className="text-muted-foreground">Status</dt>
                  <dd><StatusBadge status={project.status} /></dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-muted-foreground">Auftraggeber:in</dt>
                  <dd className="text-right">{project.owner.company ?? project.owner.name}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-muted-foreground">Budget</dt>
                  <dd className="tabular-nums">{formatEur(project.budget)}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-muted-foreground">Zeitraum</dt>
                  <dd className="text-right">{formatDate(project.startDate)} – {formatDate(project.endDate)}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-muted-foreground">Ort</dt>
                  <dd>{project.city}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Crew</CardTitle>
            </CardHeader>
            <CardContent>
              {project.roles.length === 0 ? (
                <p className="text-sm text-muted-foreground">Keine Rollen angelegt.</p>
              ) : (
                <ul className="grid gap-2 text-sm">
                  {project.roles.map((r) => (
                    <li key={r.id} className="flex justify-between gap-2">
                      <span className="text-muted-foreground">{r.title}</span>
                      <span className="text-right">{r.assignee?.name ?? "offen"}</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Zahlungen</CardTitle>
            </CardHeader>
            <CardContent>
              {project.payments.length === 0 ? (
                <p className="text-sm text-muted-foreground">Keine Zahlungen.</p>
              ) : (
                <ul className="grid gap-3 text-sm">
                  {project.payments.map((p) => (
                    <li key={p.id} className="space-y-0.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="min-w-0 truncate">{p.payee?.name ?? p.label}</span>
                        <span className="tabular-nums">{formatEur(p.amount)}</span>
                      </div>
                      <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                        <span className="min-w-0 truncate">{p.label}</span>
                        <StatusBadge status={p.status} kind="payment" />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
