import Link from "next/link";
import { AlertTriangle, ArrowLeft, Download, FileBadge2, RefreshCw } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { LICENSE_MEDIA, LICENSE_TIERS, TERRITORIES } from "@/lib/constants";
import { formatDate, formatEur, parseJson } from "@/lib/format";
import { isExclusivelyTaken, licenseState, workTypeLabel } from "@/lib/licensing";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { WorkImage } from "@/components/licensing/work-visual";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata = { title: "Meine Lizenzen" };

const STATE_TONE: Record<string, string> = {
  aktiv: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300",
  abgelaufen: "bg-muted text-muted-foreground",
  widerrufen: "bg-destructive/15 text-destructive",
};

export default async function MyLicensesPage() {
  const user = await requireUser();
  const company = user.companyId ? await db.company.findUnique({ where: { id: user.companyId }, select: { name: true } }) : null;
  const licenses = await db.license.findMany({
    where: user.companyId ? { OR: [{ buyerId: user.id }, { companyId: user.companyId }] } : { buyerId: user.id },
    include: {
      buyer: { select: { id: true, name: true } },
      company: { select: { name: true } },
      work: { include: { owner: { select: { name: true } }, licenses: { select: { tier: true, status: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  const now = new Date();
  const rows = licenses
    .map((l) => ({ l, state: licenseState(l, now) }))
    .sort((a, b) => {
      const rank = (x: typeof a) => (x.state.expiringSoon ? 0 : x.state.status === "aktiv" ? 1 : 2);
      return rank(a) - rank(b) || +b.l.createdAt - +a.l.createdAt;
    });
  const active = rows.filter((r) => r.state.status === "aktiv").length;
  const soon = rows.filter((r) => r.state.expiringSoon).length;
  const spent = licenses.reduce((s, l) => s + l.price + l.serviceFee, 0);

  return (
    <div className="space-y-6">
      <Link href="/lizenzen" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden />Zum Katalog
      </Link>
      <PageHeader
        title="Meine Lizenzen"
        description={company ? `Alle Lizenzen von ${company.name} und deine persönlichen Lizenzen – mit Zertifikat und Laufzeit im Blick.` : "Deine Lizenzen mit Zertifikat und Laufzeit im Blick."}
      />

      {rows.length > 0 && (
        <dl className="grid grid-cols-1 gap-3 min-[400px]:grid-cols-3">
          <div className="rounded-xl border bg-card p-4">
            <dt className="text-xs text-muted-foreground">Aktive Lizenzen</dt>
            <dd className="text-2xl font-semibold tabular-nums">{active}</dd>
          </div>
          <div className="rounded-xl border bg-card p-4">
            <dt className="text-xs text-muted-foreground">Laufen bald ab</dt>
            <dd className={cn("text-2xl font-semibold tabular-nums", soon > 0 && "text-amber-600 dark:text-amber-300")}>{soon}</dd>
          </div>
          <div className="rounded-xl border bg-card p-4">
            <dt className="text-xs text-muted-foreground">Ausgaben gesamt</dt>
            <dd className="text-2xl font-semibold tabular-nums">{formatEur(spent)}</dd>
          </div>
        </dl>
      )}

      {rows.length === 0 ? (
        <EmptyState
          icon={FileBadge2}
          title="Noch keine Lizenzen"
          description="Im Katalog findest du Musik, Sounds, Voice, Artwork, Fotos und Footage – direkt lizenzierbar mit Zertifikat."
          action={<Button asChild><Link href="/lizenzen">Katalog öffnen</Link></Button>}
        />
      ) : (
        <ul className="space-y-3" aria-label="Lizenzen">
          {rows.map(({ l, state }) => {
            const media = parseJson<string[]>(l.media, []);
            const tier = LICENSE_TIERS[l.tier as keyof typeof LICENSE_TIERS];
            const takenByOther = isExclusivelyTaken(l.work.licenses) && l.tier !== "exklusiv";
            const canRenew = !takenByOther && (state.expiringSoon || state.status === "abgelaufen");
            return (
              <li key={l.id} className="rounded-xl border bg-card p-4" data-testid="my-license">
                <div className="flex gap-3 sm:gap-4">
                  <Link href={`/lizenzen/${l.work.slug}`} className="relative hidden size-20 shrink-0 overflow-hidden rounded-lg bg-muted min-[420px]:block" tabIndex={-1} aria-hidden>
                    <WorkImage work={l.work} sizes="80px" />
                  </Link>
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link href={`/lizenzen/${l.work.slug}`} className="font-semibold hover:underline">{l.work.title}</Link>
                      <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", STATE_TONE[state.status])}>
                        {state.status === "aktiv" ? "Aktiv" : state.status === "abgelaufen" ? "Abgelaufen" : "Widerrufen"}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {workTypeLabel(l.work.type)} von {l.work.owner.name} · Nr. <span className="font-mono text-xs">{l.number}</span>
                    </p>
                    <p className="text-sm">
                      {tier?.label ?? l.tier} · {media.map((m) => LICENSE_MEDIA[m] ?? m).join(", ")} · {TERRITORIES[l.territory] ?? l.territory}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Projekt „{l.projectName}“ · seit {formatDate(l.createdAt)} · {state.endsAt ? `${state.status === "abgelaufen" ? "abgelaufen am" : "gültig bis"} ${formatDate(state.endsAt)}` : "unbefristet"}
                      {l.company ? ` · ${l.company.name}` : " · persönlich"}
                      {l.buyer.id !== user.id ? ` · lizenziert von ${l.buyer.name}` : ""}
                    </p>
                    <p className="text-sm">{formatEur(l.price)} Lizenz + {formatEur(l.serviceFee)} Servicegebühr</p>
                    {state.expiringSoon && state.daysLeft != null && (
                      <p className="flex items-center gap-1.5 text-sm font-medium text-amber-600 dark:text-amber-300" role="note">
                        <AlertTriangle className="size-4 shrink-0" aria-hidden />
                        {state.daysLeft === 0 ? "Läuft heute ab" : `Läuft in ${state.daysLeft} ${state.daysLeft === 1 ? "Tag" : "Tagen"} ab`} – jetzt verlängern
                      </p>
                    )}
                    {takenByOther && (state.expiringSoon || state.status === "abgelaufen") && (
                      <p className="text-xs text-muted-foreground">Das Werk wurde inzwischen exklusiv vergeben – eine Verlängerung ist nicht möglich.</p>
                    )}
                    <div className="flex flex-wrap gap-2 pt-2">
                      <Button asChild size="sm" variant="outline">
                        <a href={`/lizenzen/zertifikat/${l.number}`} download aria-label={`Zertifikat ${l.number} als PDF herunterladen`}>
                          <Download aria-hidden />Zertifikat
                        </a>
                      </Button>
                      {canRenew && (
                        <Button asChild size="sm">
                          <Link href={`/lizenzen/${l.work.slug}?verlaengern=${encodeURIComponent(l.number)}`}>
                            <RefreshCw aria-hidden />{state.status === "abgelaufen" ? "Erneut lizenzieren" : "Verlängern"}
                          </Link>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
