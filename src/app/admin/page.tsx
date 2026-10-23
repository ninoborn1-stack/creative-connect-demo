import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight, Crown, Download, FolderKanban, HandCoins, Mail, Minus, Receipt, Users } from "lucide-react";
import { db } from "@/lib/db";
import { getFees } from "@/lib/settings";
import { PROJECT_STATUS_LABEL } from "@/lib/constants";
import { formatEur, formatMonth, formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { MembersChart, ProjectStatusChart, RevenueMixChart, VolumeChart, type MonthPoint } from "@/components/admin/kpi-charts";
import { ResetDemoButton } from "@/components/admin/reset-demo-button";
import { PLAN_YEAR1 } from "@/components/admin/admin-constants";

export const metadata = { title: "Admin – KPIs" };

function Delta({ current, previous }: { current: number; previous?: number }) {
  if (previous === undefined || previous === 0) return <span className="text-xs text-muted-foreground">kein Vormonat</span>;
  const pct = ((current - previous) / previous) * 100;
  const Icon = pct > 0.5 ? ArrowUpRight : pct < -0.5 ? ArrowDownRight : Minus;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 text-xs font-medium",
        pct > 0.5 ? "text-emerald-600 dark:text-emerald-400" : pct < -0.5 ? "text-destructive" : "text-muted-foreground",
      )}
    >
      <Icon className="size-3.5" aria-hidden />
      {pct > 0 ? "+" : ""}
      {pct.toLocaleString("de-DE", { maximumFractionDigits: 1 })} % <span className="font-normal text-muted-foreground">zum Vormonat</span>
    </span>
  );
}

function KpiTile({ label, value, icon: Icon, current, previous, hint }: { label: string; value: string; icon: LucideIcon; current: number; previous?: number; hint?: string }) {
  return (
    <Card className="gap-2 py-4">
      <CardContent className="space-y-1 px-4">
        <div className="flex items-center justify-between gap-2 text-sm text-muted-foreground">
          <span>{label}</span>
          <Icon className="size-4 shrink-0" aria-hidden />
        </div>
        <p className="text-2xl font-semibold tabular-nums">{value}</p>
        <Delta current={current} previous={previous} />
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  );
}

function ChartCard({ title, description, children, className }: { title: string; description?: string; children: React.ReactNode; className?: string }) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="px-2 sm:px-4">{children}</CardContent>
    </Card>
  );
}

function Goal({ label, value, target, format }: { label: string; value: number; target: number; format: (n: number) => string }) {
  const pct = Math.round((value / target) * 100);
  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap items-baseline justify-between gap-x-2 text-sm">
        <span>{label}</span>
        <span className="tabular-nums text-muted-foreground">
          <span className="font-medium text-foreground">{format(value)}</span> / {format(target)}
        </span>
      </div>
      <Progress value={Math.min(pct, 100)} aria-label={`${label}: ${pct} % des Ziels`} className="h-2" />
      <p className="text-xs text-muted-foreground">{pct >= 100 ? `Ziel erreicht (${pct} %)` : `${pct} % des Ziels`}</p>
    </div>
  );
}

export default async function AdminKpiPage() {
  const [snapshots, fees, statusGroups, managedCount, openDisputes, waitlist] = await Promise.all([
    db.kpiSnapshot.findMany({ orderBy: { month: "desc" }, take: 12 }),
    getFees(),
    db.project.groupBy({ by: ["status"], _count: { _all: true } }),
    db.project.count({ where: { type: "managed" } }),
    db.dispute.count({ where: { status: { not: "geloest" } } }),
    db.waitlistEntry.count({ where: { status: "wartend" } }),
  ]);

  const last12 = [...snapshots].reverse();
  const cur = last12.at(-1);
  const prev = last12.at(-2);

  const data: MonthPoint[] = last12.map((s) => ({
    label: formatMonth(`${s.month}-01T12:00:00`),
    activeMembers: s.activeMembers,
    volume: s.volume,
    serviceFees: s.serviceFees,
    proRevenue: s.proSubs * fees.proPriceEur,
    managedMargin: s.managedMargin,
  }));

  const statusOrder = ["entwurf", "anfragen", "bestaetigt", "produktion", "abnahme", "abgeschlossen", "storniert"];
  const statusData = statusOrder
    .map((key) => ({ label: PROJECT_STATUS_LABEL[key] ?? key, count: statusGroups.find((g) => g.status === key)?._count._all ?? 0 }))
    .filter((d) => d.count > 0);

  const volume12 = last12.reduce((sum, s) => sum + s.volume, 0);

  return (
    <div>
      <PageHeader
        title="KPI-Dashboard"
        description="Kennzahlen des Netzwerks – aktueller Monat im Vergleich zum Vormonat und Verlauf der letzten 12 Monate."
        actions={
          <>
            <Button variant="outline" asChild>
              <Link href="/admin/exporte">
                <Download aria-hidden /> Exporte
              </Link>
            </Button>
            <ResetDemoButton />
          </>
        }
      />

      {(openDisputes > 0 || waitlist > 0) && (
        <div className="mb-6 flex flex-wrap gap-2 text-sm">
          {openDisputes > 0 && (
            <Link href="/admin/streitfaelle" className="rounded-full border px-3 py-1 hover:bg-muted">
              {openDisputes} offene Streitfälle
            </Link>
          )}
          {waitlist > 0 && (
            <Link href="/admin/einladungen" className="rounded-full border px-3 py-1 hover:bg-muted">
              {waitlist} Personen auf der Warteliste
            </Link>
          )}
        </div>
      )}

      {!cur ? (
        <EmptyState title="Noch keine Kennzahlen" description="Sobald der erste Monatsabschluss vorliegt, erscheinen hier die KPIs." />
      ) : (
        <>
          <h2 className="sr-only">Kennzahlen {formatMonth(`${cur.month}-01T12:00:00`)}</h2>
          <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <KpiTile label="Aktive Mitglieder" icon={Users} value={formatNumber(cur.activeMembers)} current={cur.activeMembers} previous={prev?.activeMembers} />
            <KpiTile label="Neue Einladungen" icon={Mail} value={formatNumber(cur.newInvites)} current={cur.newInvites} previous={prev?.newInvites} />
            <KpiTile label="Vermitteltes Volumen" icon={HandCoins} value={formatEur(cur.volume)} current={cur.volume} previous={prev?.volume} />
            <KpiTile label="Servicegebühren" icon={Receipt} value={formatEur(cur.serviceFees)} current={cur.serviceFees} previous={prev?.serviceFees} hint={`${fees.serviceFeePct} % auf das Volumen`} />
            <KpiTile label="Pro-Abos" icon={Crown} value={formatNumber(cur.proSubs)} current={cur.proSubs} previous={prev?.proSubs} hint={`${formatEur(cur.proSubs * fees.proPriceEur)} / Monat`} />
            <KpiTile label="Managed-Crew-Marge" icon={FolderKanban} value={formatEur(cur.managedMargin)} current={cur.managedMargin} previous={prev?.managedMargin} hint={`${fees.managedMarginPct} % Marge`} />
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <ChartCard title="Mitgliederwachstum" description="Aktive Mitglieder je Monat">
              <MembersChart data={data} />
            </ChartCard>
            <ChartCard title="Volumen & Servicegebühren" description="Vermitteltes Honorarvolumen und 10 % Servicegebühr">
              <VolumeChart data={data} />
            </ChartCard>
            <ChartCard title="Erlösmix" description={`Servicegebühren, Pro-Abos (× ${formatEur(fees.proPriceEur)}) und Managed-Marge`}>
              <RevenueMixChart data={data} />
            </ChartCard>
            <ChartCard title="Projekte nach Status" description="Aktueller Stand aller Projekte">
              {statusData.length ? <ProjectStatusChart data={statusData} /> : <EmptyState title="Noch keine Projekte" />}
            </ChartCard>
          </div>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-base">Businessplan 2026 – Jahr 1 Ziel</CardTitle>
              <CardDescription>Plan-Annahmen für das erste Jahr im Vergleich zu den aktuellen Demo-Werten.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-5 sm:grid-cols-3">
              <Goal label="Aktive Mitglieder" value={cur.activeMembers} target={PLAN_YEAR1.activeMembers} format={formatNumber} />
              <Goal label="Self-Service-Volumen (12 Monate)" value={volume12} target={PLAN_YEAR1.selfServiceVolume} format={formatEur} />
              <Goal label="Managed Crews" value={managedCount} target={PLAN_YEAR1.managedCrews} format={formatNumber} />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
