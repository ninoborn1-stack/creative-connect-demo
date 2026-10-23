import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CheckCircle2, FileClock, FolderKanban, Scale } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { getFees } from "@/lib/settings";
import { formatDate, formatDateTime, formatEur } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ContractDocument } from "@/components/finance/contract-document";
import { SignForm } from "@/components/finance/sign-form";
import { templateTitle } from "@/components/finance/contract-templates";

export default async function ContractPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const contract = await db.contract.findUnique({
    where: { id },
    include: { project: { select: { id: true, title: true, ownerId: true, roles: { select: { assigneeId: true } } } } },
  });
  if (!contract) notFound();

  const isOwner = contract.project?.ownerId === user.id;
  const isCrew = !!contract.project?.roles.some((r) => r.assigneeId === user.id);
  if (!user.isAdmin && !isOwner && !isCrew) notFound();

  const fees = await getFees();
  const serviceFee = Math.round((contract.compensation * fees.serviceFeePct) / 100);
  const values = {
    title: contract.title,
    partyA: contract.partyA,
    partyB: contract.partyB,
    service: contract.service,
    usageRights: contract.usageRights,
    compensation: formatEur(contract.compensation),
    serviceFee: formatEur(serviceFee),
    serviceFeePct: String(fees.serviceFeePct),
    kskRate: fees.kskRatePct.toLocaleString("de-DE"),
    date: formatDate(contract.createdAt),
  };
  const complete = contract.signedA && contract.signedB;

  const sides = [
    {
      side: "A" as const,
      label: "Partei A – Auftraggeber:in",
      party: contract.partyA,
      signed: contract.signedA,
      signedName: contract.signedAName,
      canSign: user.isAdmin || isOwner,
    },
    {
      side: "B" as const,
      label: "Partei B – Auftragnehmer:in",
      party: contract.partyB,
      signed: contract.signedB,
      signedName: contract.signedBName,
      canSign: user.isAdmin || isCrew,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <Button asChild variant="ghost" size="sm">
          <Link href="/finanzen">
            <ArrowLeft aria-hidden /> Verträge & Zahlungen
          </Link>
        </Button>
        {contract.project && (
          <Button asChild variant="ghost" size="sm">
            <Link href={`/projekte/${contract.project.id}`}>
              <FolderKanban aria-hidden /> {contract.project.title}
            </Link>
          </Button>
        )}
      </div>

      <div>
        <p className="text-sm text-muted-foreground">{templateTitle(contract.template)}</p>
        <h1 className="text-2xl font-bold text-balance sm:text-3xl">{contract.title}</h1>
      </div>

      <div
        role="status"
        className={cn(
          "flex items-start gap-3 rounded-xl border px-4 py-3 text-sm",
          complete ? "border-emerald-500/30 bg-emerald-500/10" : "border-amber-500/30 bg-amber-500/10",
        )}
      >
        {complete ? (
          <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600 dark:text-emerald-300" aria-hidden />
        ) : (
          <FileClock className="mt-0.5 size-5 shrink-0 text-amber-600 dark:text-amber-300" aria-hidden />
        )}
        <div>
          {complete ? (
            <p className="font-medium">
              Vollständig unterschrieben{contract.signedAt ? ` am ${formatDate(contract.signedAt)}` : ""}.
            </p>
          ) : (
            <p className="font-medium">
              Entwurf – {contract.signedA || contract.signedB ? `noch nicht von Partei ${contract.signedA ? "B" : "A"} unterschrieben` : "noch nicht unterschrieben"}.
            </p>
          )}
          <p className="text-muted-foreground">
            Vergütung {formatEur(contract.compensation)} netto · Zahlung wird über den lizenzierten Zahlungsdienstleister reserviert.
          </p>
        </div>
      </div>

      <ContractDocument template={contract.template} values={values}>
        <section aria-labelledby="unterschriften" className="border-t pt-6">
          <h3 id="unterschriften" className="mb-4 text-base font-semibold">
            Unterschriften
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            {sides.map((s) => (
              <div key={s.side} className="rounded-lg border bg-background/50 p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">{s.label}</p>
                <p className="mt-1 text-sm font-medium">{s.party}</p>
                {s.signed ? (
                  <div className="mt-4">
                    <p className="border-b border-dashed pb-1 font-serif text-xl italic">{s.signedName ?? s.party}</p>
                    <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-300">
                      <CheckCircle2 className="size-3.5" aria-hidden /> Unterschrieben
                      {contract.signedAt && complete ? ` · ${formatDateTime(contract.signedAt)}` : ""}
                    </p>
                  </div>
                ) : s.canSign ? (
                  <div className="mt-4">
                    <SignForm contractId={contract.id} side={s.side} defaultName={user.name} />
                    {user.isAdmin && !(s.side === "A" ? isOwner : isCrew) && (
                      <p className="mt-2 text-xs text-muted-foreground">Demo: Als Admin darfst du beide Seiten unterschreiben.</p>
                    )}
                  </div>
                ) : (
                  <div className="mt-4">
                    <div className="h-8 border-b border-dashed" aria-hidden />
                    <p className="mt-2 text-xs text-muted-foreground">Noch nicht unterschrieben – wartet auf {s.party}.</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      </ContractDocument>

      <p className="mx-auto flex max-w-3xl items-start gap-2 text-xs text-muted-foreground">
        <Scale className="mt-0.5 size-3.5 shrink-0" aria-hidden />
        Demo-Vorlage, kein Rechtsrat. Für echte Verträge bitte anwaltlich prüfen lassen.
      </p>
    </div>
  );
}
