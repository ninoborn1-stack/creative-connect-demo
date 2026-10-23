import Link from "next/link";
import { ChevronRight, ShieldCheck } from "lucide-react";
import { db } from "@/lib/db";
import { formatDate, formatEur } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { DISPUTE_RESOLUTION_LABEL, DISPUTE_STATUS } from "@/components/admin/admin-constants";
import { DisputeStatus } from "@/components/admin/dispute-status";

export const metadata = { title: "Admin – Streitfälle" };

export default async function AdminDisputesPage() {
  const disputes = await db.dispute.findMany({
    include: { project: { include: { owner: true, payments: true } } },
    orderBy: { createdAt: "desc" },
  });
  const order = (s: string) => DISPUTE_STATUS.findIndex((d) => d.key === s);
  disputes.sort((a, b) => order(a.status) - order(b.status));

  return (
    <div>
      <PageHeader
        title="Streitfälle"
        description="Konflikte zwischen Auftraggeber:innen und Crew. Zahlungen bleiben beim Zahlungsdienstleister reserviert, bis eine Entscheidung fällt."
      />
      {disputes.length === 0 ? (
        <EmptyState icon={ShieldCheck} title="Keine Streitfälle" description="Alles friedlich im Netzwerk." />
      ) : (
        <ul className="divide-y rounded-xl border">
          {disputes.map((d) => {
            const held = d.project.payments.filter((p) => p.status === "reserviert" || p.status === "freigegeben").reduce((s, p) => s + p.amount, 0);
            return (
              <li key={d.id}>
                <Link href={`/admin/streitfaelle/${d.id}`} className="flex items-center gap-3 px-4 py-4 hover:bg-muted/50">
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{d.project.title}</p>
                      <DisputeStatus status={d.status} />
                    </div>
                    <p className="line-clamp-2 text-sm text-muted-foreground">{d.reason}</p>
                    <p className="text-xs text-muted-foreground">
                      Eröffnet von {d.openedBy} am {formatDate(d.createdAt)}
                      {d.status === "geloest"
                        ? ` · ${DISPUTE_RESOLUTION_LABEL[d.resolution ?? ""] ?? "gelöst"}`
                        : held > 0 && ` · ${formatEur(held)} zurückgehalten`}
                    </p>
                  </div>
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
