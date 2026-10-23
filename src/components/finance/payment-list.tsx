import Link from "next/link";
import { Wallet } from "lucide-react";
import { formatDate, formatEur } from "@/lib/format";
import { StatusBadge } from "@/components/badges";
import { EmptyState } from "@/components/empty-state";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export interface PaymentRow {
  id: string;
  projectId: string | null;
  project: string;
  label: string;
  counterpart: string;
  amount: number;
  serviceFee: number;
  margin: number;
  status: string;
  date: Date;
}

export function PaymentList({
  rows,
  counterpartLabel,
  showFees = true,
}: {
  rows: PaymentRow[];
  counterpartLabel: string;
  showFees?: boolean;
}) {
  if (!rows.length) {
    return <EmptyState icon={Wallet} title="Noch keine Zahlungen" description="Sobald eine Crew bestätigt ist, wird die Zahlung hier reserviert." />;
  }
  const showMargin = rows.some((r) => r.margin > 0);
  const total = (r: PaymentRow) => r.amount + r.serviceFee + r.margin;

  return (
    <>
      {/* Mobil: Karten */}
      <ul className="space-y-3 md:hidden">
        {rows.map((r) => (
          <li key={r.id} className="rounded-xl border bg-card p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <ProjectLink row={r} />
                <p className="text-sm text-muted-foreground">
                  {r.label} · {r.counterpart}
                </p>
              </div>
              <StatusBadge kind="payment" status={r.status} />
            </div>
            <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
              <dt className="text-muted-foreground">Honorar</dt>
              <dd className="text-right font-medium tabular-nums">{formatEur(r.amount)}</dd>
              {showFees && (
                <>
                  <dt className="text-muted-foreground">Servicegebühr</dt>
                  <dd className="text-right tabular-nums">{formatEur(r.serviceFee)}</dd>
                  {r.margin > 0 && (
                    <>
                      <dt className="text-muted-foreground">Managed-Marge</dt>
                      <dd className="text-right tabular-nums">{formatEur(r.margin)}</dd>
                    </>
                  )}
                  <dt className="text-muted-foreground">Gesamt</dt>
                  <dd className="text-right font-semibold tabular-nums">{formatEur(total(r))}</dd>
                </>
              )}
              <dt className="text-muted-foreground">Datum</dt>
              <dd className="text-right">{formatDate(r.date)}</dd>
            </dl>
          </li>
        ))}
      </ul>

      {/* Desktop: Tabelle */}
      <div className="hidden overflow-x-auto rounded-xl border md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Projekt</TableHead>
              <TableHead>Rolle</TableHead>
              <TableHead>{counterpartLabel}</TableHead>
              <TableHead className="text-right">Honorar</TableHead>
              {showFees && <TableHead className="text-right">Servicegebühr</TableHead>}
              {showFees && showMargin && <TableHead className="text-right">Managed-Marge</TableHead>}
              {showFees && <TableHead className="text-right">Gesamt</TableHead>}
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Datum</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="max-w-56 truncate">
                  <ProjectLink row={r} />
                </TableCell>
                <TableCell>{r.label}</TableCell>
                <TableCell className="max-w-40 truncate">{r.counterpart}</TableCell>
                <TableCell className="text-right font-medium tabular-nums">{formatEur(r.amount)}</TableCell>
                {showFees && <TableCell className="text-right tabular-nums text-muted-foreground">{formatEur(r.serviceFee)}</TableCell>}
                {showFees && showMargin && (
                  <TableCell className="text-right tabular-nums text-muted-foreground">{r.margin > 0 ? formatEur(r.margin) : "–"}</TableCell>
                )}
                {showFees && <TableCell className="text-right font-semibold tabular-nums">{formatEur(total(r))}</TableCell>}
                <TableCell>
                  <StatusBadge kind="payment" status={r.status} />
                </TableCell>
                <TableCell className="text-right">{formatDate(r.date)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}

function ProjectLink({ row }: { row: PaymentRow }) {
  if (!row.projectId) return <span className="font-medium">{row.project}</span>;
  return (
    <Link href={`/projekte/${row.projectId}`} className="font-medium hover:text-primary hover:underline">
      {row.project}
    </Link>
  );
}
