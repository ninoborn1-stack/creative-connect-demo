import Link from "next/link";
import { ArrowRight, CalendarCheck, Camera, Check, Clock, Download, FileSignature, FileText, Hammer, HeartHandshake, Mic, Receipt } from "lucide-react";
import { CONTRACT_TEMPLATES } from "@/lib/constants";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { getFees } from "@/lib/settings";
import { formatDate, formatEur, formatEurExact, parseJson } from "@/lib/format";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PaymentFlow, type FlowSums } from "@/components/finance/payment-flow";
import { PaymentList, type PaymentRow } from "@/components/finance/payment-list";
import { KskBox } from "@/components/finance/ksk-box";
import { IndependenceBox } from "@/components/finance/independence-box";
import { getClientHonorare, kskSummary, paymentDate } from "@/components/finance/finance-data";

export const metadata = { title: "Verträge & Zahlungen" };

const TEMPLATE_ICON: Record<string, typeof Hammer> = {
  werkvertrag: Hammer,
  nutzungsrechte: Camera,
  studiomiete: Mic,
  booking: CalendarCheck,
};

function flowSums(rows: PaymentRow[], value: (r: PaymentRow) => number): FlowSums {
  const sums: FlowSums = {
    reserviert: { amount: 0, count: 0 },
    freigegeben: { amount: 0, count: 0 },
    ausgezahlt: { amount: 0, count: 0 },
    erstattet: { amount: 0, count: 0 },
  };
  for (const r of rows) {
    const bucket = sums[r.status as keyof FlowSums];
    if (!bucket) continue;
    bucket.amount += value(r);
    bucket.count += 1;
  }
  return sums;
}

function SectionTitle({ id, icon: Icon, children, aside }: { id: string; icon: typeof Hammer; children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
      <h2 id={id} className="flex items-center gap-2 text-lg font-semibold">
        <Icon className="size-5 text-primary" aria-hidden /> {children}
      </h2>
      {aside}
    </div>
  );
}

export default async function FinancePage() {
  const user = await requireUser();
  const fees = await getFees();
  const year = new Date().getFullYear();

  const paymentInclude = {
    project: { select: { id: true, title: true, owner: { select: { id: true, name: true, company: true } } } },
    payee: { select: { name: true } },
  } as const;

  const [clientPayments, creativePayments, allPayments] = await Promise.all([
    db.payment.findMany({ where: { project: { ownerId: user.id } }, include: paymentInclude, orderBy: { createdAt: "desc" } }),
    user.isCreative ? db.payment.findMany({ where: { payeeId: user.id }, include: paymentInclude, orderBy: { createdAt: "desc" } }) : [],
    user.isAdmin ? db.payment.findMany({ include: paymentInclude, orderBy: { createdAt: "desc" } }) : [],
  ]);

  type P = (typeof clientPayments)[number];
  const toRow = (p: P, counterpart: string): PaymentRow => ({
    id: p.id,
    projectId: p.project?.id ?? null,
    project: p.project?.title ?? "Ohne Projekt",
    label: p.label,
    counterpart,
    amount: p.amount,
    serviceFee: p.serviceFee,
    margin: p.margin,
    status: p.status,
    date: paymentDate(p),
  });
  const ownerName = (p: P) => p.project?.owner.company ?? p.project?.owner.name ?? "–";

  const clientRows = clientPayments.map((p) => toRow(p, p.payee?.name ?? "offen"));
  const creativeRows = creativePayments.map((p) => toRow(p, ownerName(p)));
  const adminRows = allPayments.map((p) => toRow(p, p.payee?.name ?? "offen"));

  const showClient = user.isClient || clientRows.length > 0;
  const showCreative = user.isCreative;
  const showAdmin = user.isAdmin;

  // Künstlersozialabgabe (Auftraggeber:in)
  const honorare = showClient ? await getClientHonorare(user.id, year) : [];
  const ksk = kskSummary(honorare, fees.kskRatePct, fees.kskThresholdEur);

  // Anteil größter Auftraggeber aus eigenen Zahlungen
  const byClient = new Map<string, { name: string; amount: number }>();
  for (const p of creativePayments) {
    if (p.status === "erstattet" || !p.project) continue;
    const key = p.project.owner.id;
    const e = byClient.get(key) ?? { name: ownerName(p), amount: 0 };
    e.amount += p.amount;
    byClient.set(key, e);
  }
  const creativeTotal = [...byClient.values()].reduce((s, e) => s + e.amount, 0);
  const topClient = [...byClient.values()].sort((a, b) => b.amount - a.amount)[0];
  const computedShare = creativeTotal > 0 && topClient ? Math.round((topClient.amount / creativeTotal) * 100) : null;

  // Verträge & Rechnungen
  const projectScope = user.isAdmin ? {} : { project: { OR: [{ ownerId: user.id }, { roles: { some: { assigneeId: user.id } } }] } };
  const [contracts, invoices] = await Promise.all([
    db.contract.findMany({
      where: projectScope,
      include: { project: { select: { id: true, title: true, ownerId: true } } },
      orderBy: { createdAt: "desc" },
    }),
    db.invoice.findMany({ where: projectScope, include: { project: { select: { title: true } } }, orderBy: { issuedAt: "desc" } }),
  ]);

  const perspectives = [
    showClient && {
      key: "auftraggeber",
      label: "Als Auftraggeber:in",
      content: (
        <div className="space-y-6">
          <PaymentFlow
            sums={flowSums(clientRows, (r) => r.amount + r.serviceFee + r.margin)}
            amountLabel={`Deine Zahlungen inkl. ${fees.serviceFeePct} % Servicegebühr`}
          />
          <section aria-labelledby="zahlungen-ag">
            <SectionTitle id="zahlungen-ag" icon={Receipt}>
              Zahlungen deiner Projekte
            </SectionTitle>
            <p className="mb-3 text-sm text-muted-foreground">
              Die Servicegebühr von {fees.serviceFeePct} % wird separat ausgewiesen – die Kreativen erhalten ihr volles Honorar.
            </p>
            <PaymentList rows={clientRows} counterpartLabel="Kreative:r" />
          </section>
          <KskBox
            year={year}
            ratePct={fees.kskRatePct}
            thresholdEur={fees.kskThresholdEur}
            total={ksk.total}
            liableTotal={ksk.liableTotal}
            levy={ksk.levy}
            aboveThreshold={ksk.aboveThreshold}
            count={honorare.length}
          />
        </div>
      ),
    },
    showCreative && {
      key: "kreative",
      label: "Als Kreative:r",
      content: (
        <div className="space-y-6">
          <div className="flex items-start gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 sm:items-center">
            <HeartHandshake className="size-6 shrink-0 text-emerald-600 dark:text-emerald-300" aria-hidden />
            <p className="text-sm">
              <strong className="text-base">{fees.creativeCommissionPct} % Provision</strong> – du bekommst dein volles Honorar. Die
              Servicegebühr zahlt die Auftraggeber:in.
            </p>
          </div>
          <PaymentFlow sums={flowSums(creativeRows, (r) => r.amount)} amountLabel="Deine Auszahlungen (volles Honorar)" />
          <section aria-labelledby="zahlungen-kr">
            <SectionTitle id="zahlungen-kr" icon={Receipt}>
              Auszahlungen an dich
            </SectionTitle>
            <PaymentList rows={creativeRows} counterpartLabel="Auftraggeber:in" showFees={false} />
          </section>
          <IndependenceBox profileShare={user.profile?.topClientShare ?? null} computedShare={computedShare} topClientName={topClient?.name} />
        </div>
      ),
    },
    showAdmin && {
      key: "plattform",
      label: "Plattform (Admin)",
      content: (
        <div className="space-y-6">
          <PaymentFlow
            sums={flowSums(adminRows, (r) => r.amount + r.serviceFee + r.margin)}
            amountLabel="Alle Zahlungen der Plattform inkl. Servicegebühr und Managed-Marge"
          />
          <section aria-labelledby="zahlungen-admin">
            <SectionTitle
              id="zahlungen-admin"
              icon={Receipt}
              aside={
                <p className="text-sm text-muted-foreground">
                  Servicegebühren {formatEur(adminRows.reduce((s, r) => s + r.serviceFee, 0))} · Marge{" "}
                  {formatEur(adminRows.reduce((s, r) => s + r.margin, 0))}
                </p>
              }
            >
              Alle Zahlungen
            </SectionTitle>
            <PaymentList rows={adminRows} counterpartLabel="Kreative:r" />
          </section>
        </div>
      ),
    },
  ].filter((p): p is { key: string; label: string; content: React.ReactElement } => !!p);

  return (
    <div className="space-y-10">
      <PageHeader
        title="Verträge & Zahlungen"
        description="Zahlungen laufen sicher über einen lizenzierten Zahlungsdienstleister. Verträge unterschreibst du direkt hier, Rechnungen gibt es als PDF."
      />

      {perspectives.length > 1 ? (
        <Tabs defaultValue={showAdmin ? "plattform" : perspectives[0].key}>
          <TabsList className="w-full sm:w-fit">
            {perspectives.map((p) => (
              <TabsTrigger key={p.key} value={p.key}>
                {p.label}
              </TabsTrigger>
            ))}
          </TabsList>
          {perspectives.map((p) => (
            <TabsContent key={p.key} value={p.key} className="mt-4">
              {p.content}
            </TabsContent>
          ))}
        </Tabs>
      ) : perspectives.length === 1 ? (
        perspectives[0].content
      ) : (
        <EmptyState icon={Receipt} title="Noch keine Zahlungen" description="Sobald du ein Projekt buchst oder gebucht wirst, siehst du hier den Zahlungsstatus." />
      )}

      {/* Verträge */}
      <section aria-labelledby="vertraege">
        <SectionTitle id="vertraege" icon={FileSignature}>
          Verträge
        </SectionTitle>
        {contracts.length ? (
          <ul className="grid gap-3 md:grid-cols-2">
            {contracts.map((c) => {
              const complete = c.signedA && c.signedB;
              return (
                <li key={c.id}>
                  <Link
                    href={`/finanzen/vertraege/${c.id}`}
                    className="group flex h-full flex-col gap-3 rounded-xl border bg-card p-4 transition-colors hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground">{CONTRACT_TEMPLATES[c.template]?.title ?? "Vertrag"}</p>
                        <p className="font-medium group-hover:text-primary">{c.title}</p>
                      </div>
                      <span
                        className={cn(
                          "shrink-0 rounded-full px-2 py-0.5 text-xs font-medium",
                          complete ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300" : "bg-amber-500/15 text-amber-600 dark:text-amber-300",
                        )}
                      >
                        {complete ? "Unterschrieben" : "Entwurf"}
                      </span>
                    </div>
                    <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                      <SignedPill label="A" signed={c.signedA} who={c.partyA} />
                      <SignedPill label="B" signed={c.signedB} who={c.partyB} />
                      <span className="ml-auto font-medium tabular-nums">{formatEur(c.compensation)}</span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <EmptyState icon={FileSignature} title="Noch keine Verträge" description="Verträge entstehen automatisch, sobald eine Crew bestätigt ist." />
        )}
      </section>

      {/* Rechnungen */}
      <section aria-labelledby="rechnungen">
        <SectionTitle id="rechnungen" icon={FileText}>
          Rechnungen
        </SectionTitle>
        {invoices.length ? (
          <ul className="divide-y rounded-xl border bg-card">
            {invoices.map((inv) => {
              const vat = Math.round(inv.net * inv.vatRate) / 100;
              const items = parseJson<{ label: string; amount: number }[]>(inv.items, []);
              return (
                <li key={inv.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="font-medium">
                      {inv.number} <span className="font-normal text-muted-foreground">· {formatDate(inv.issuedAt)}</span>
                    </p>
                    <p className="truncate text-sm text-muted-foreground">
                      {inv.project?.title ?? "Ohne Projekt"} · an {inv.recipient} · {items.length} Positionen
                    </p>
                  </div>
                  <div className="flex items-center justify-between gap-4 sm:justify-end">
                    <div className="text-right text-sm">
                      <p className="font-semibold tabular-nums">{formatEurExact(inv.net + vat)}</p>
                      <p className="text-xs text-muted-foreground tabular-nums">
                        netto {formatEur(inv.net)} + {inv.vatRate} % USt
                      </p>
                    </div>
                    <Button asChild variant="outline" size="sm">
                      <a href={`/finanzen/rechnungen/${inv.id}/pdf`} download aria-label={`Rechnung ${inv.number} als PDF herunterladen`}>
                        <Download aria-hidden /> PDF herunterladen
                      </a>
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <EmptyState icon={FileText} title="Noch keine Rechnungen" description="Rechnungen werden nach Vertragsabschluss automatisch erstellt." />
        )}
      </section>

      {/* Vorlagen */}
      <section aria-labelledby="vorlagen-titel" id="vorlagen" className="scroll-mt-20">
        <SectionTitle id="vorlagen-titel" icon={FileSignature}>
          Vertragsvorlagen
        </SectionTitle>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Object.entries(CONTRACT_TEMPLATES).map(([key, t]) => {
            const Icon = TEMPLATE_ICON[key] ?? FileText;
            return (
              <li key={key} className="flex flex-col rounded-xl border bg-card p-4">
                <span className="flex size-10 items-center justify-center rounded-lg bg-primary/15 text-primary">
                  <Icon className="size-5" aria-hidden />
                </span>
                <p className="mt-3 font-medium">{t.title}</p>
                <p className="mt-1 flex-1 text-sm text-muted-foreground">{t.summary}</p>
                <Button asChild variant="ghost" size="sm" className="mt-3 self-start px-0 hover:bg-transparent hover:text-primary">
                  <Link href={`/finanzen/vorlagen/${key}`} aria-label={`Vorschau: ${t.title}`}>
                    Vorschau <ArrowRight aria-hidden />
                  </Link>
                </Button>
              </li>
            );
          })}
        </ul>
        <p className="mt-3 text-xs text-muted-foreground">Demo-Vorlagen, kein Rechtsrat.</p>
      </section>
    </div>
  );
}

function SignedPill({ label, signed, who }: { label: string; signed: boolean; who: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-muted-foreground" title={who}>
      <span
        className={cn(
          "flex size-5 items-center justify-center rounded-full",
          signed ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300" : "bg-muted text-muted-foreground",
        )}
      >
        {signed ? <Check className="size-3" aria-hidden /> : <Clock className="size-3" aria-hidden />}
      </span>
      Partei {label} {signed ? "unterschrieben" : "offen"}
    </span>
  );
}
