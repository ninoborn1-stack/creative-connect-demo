import Link from "next/link";
import { CalendarHeart, CreditCard, FolderKanban, Sparkles, Users, Wand2 } from "lucide-react";
import { db } from "@/lib/db";
import type { CurrentUser } from "@/lib/session";
import { suggestCrew } from "@/lib/matching";
import { categoryName } from "@/lib/constants";
import { formatDate, formatDateLong, formatEur } from "@/lib/format";
import { differenceInCalendarWeeks } from "date-fns";
import { EmptyState } from "@/components/empty-state";
import { StatusBadge, Rating, VerifiedBadge } from "@/components/badges";
import { StockImage } from "@/components/stock-image";
import { UserAvatar } from "@/components/user-avatar";
import { Button } from "@/components/ui/button";
import { AddToCrewDialog } from "@/components/members/add-to-crew-dialog";
import { getCrewTargets } from "@/components/members/crew-targets";
import { DashboardCard, Stat } from "./dashboard-card";
import { ProjectStepper } from "./project-stepper";
import { nextFreeSlots } from "@/components/sessions/session-data";

export async function ClientDashboard({ user }: { user: CurrentUser }) {
  const [projects, crewTargets] = await Promise.all([
    db.project.findMany({
      where: { ownerId: user.id, status: { notIn: ["abgeschlossen", "storniert"] } },
      include: {
        roles: { include: { assignee: { select: { name: true } }, requests: { where: { status: { in: ["offen", "gegenangebot"] } } } }, orderBy: { sort: "asc" } },
        payments: true,
      },
      orderBy: { startDate: "asc" },
    }),
    getCrewTargets(user.id),
  ]);
  const [openStudio] = await nextFreeSlots(1, "open-studio");

  const openRoles = projects.flatMap((p) => p.roles.filter((r) => !r.assigneeId).map((r) => ({ ...r, project: p })));
  const payments = projects.flatMap((p) => p.payments.map((pay) => ({ ...pay, projectTitle: p.title })));
  const reserved = payments.filter((p) => p.status === "reserviert").reduce((s, p) => s + p.amount + p.serviceFee, 0);
  const released = payments.filter((p) => p.status === "freigegeben").reduce((s, p) => s + p.amount + p.serviceFee, 0);

  // Vorschläge für die erste offene Rolle
  const focusRole = openRoles[0];
  const suggestions = focusRole
    ? await suggestCrew(focusRole.category, focusRole.budget, focusRole.project.city, [user.id, ...focusRole.requests.map((r) => r.creativeId)])
    : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 overflow-hidden rounded-xl border bg-card p-5 glow sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Neues Projekt starten</h2>
          <p className="text-sm text-muted-foreground">Beschreib dein Vorhaben in eigenen Worten – der Assistent schlägt Rollen, Budget und Crew vor. Du entscheidest.</p>
        </div>
        <Button asChild size="lg" className="shrink-0">
          <Link href="/briefing"><Sparkles aria-hidden /> Neues Projekt mit Briefing-Assistent</Link>
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Aktive Projekte" value={projects.length} />
        <Stat label="Offene Crew-Rollen" value={openRoles.length} />
        <Stat label="Reserviert" value={formatEur(reserved)} hint="inkl. Servicegebühr" />
        <Stat label="Freigegeben" value={formatEur(released)} hint="wird ausgezahlt" />
      </div>

      <DashboardCard id="aktive-projekte" title="Aktive Projekte" icon={FolderKanban} href="/projekte">
        {projects.length === 0 ? (
          <EmptyState
            icon={FolderKanban}
            title="Keine aktiven Projekte"
            description="Starte dein nächstes Projekt mit dem Briefing-Assistenten."
            action={<Button asChild size="sm"><Link href="/briefing">Briefing starten</Link></Button>}
          />
        ) : (
          <ul className="grid gap-4">
            {projects.map((p) => {
              const filled = p.roles.filter((r) => r.assigneeId).length;
              return (
                <li key={p.id} className="flex flex-col gap-4 rounded-lg border p-3 sm:flex-row">
                  <Link href={`/projekte/${p.id}`} className="relative aspect-video shrink-0 overflow-hidden rounded-md bg-muted sm:aspect-square sm:w-24">
                    <StockImage seed={p.coverSeed} w={300} h={300} sizes="(max-width: 640px) 100vw, 96px" />
                  </Link>
                  <div className="min-w-0 flex-1 space-y-3">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <Link href={`/projekte/${p.id}`} className="font-medium hover:underline">{p.title}</Link>
                        <p className="text-xs text-muted-foreground">
                          {p.city} · {formatDate(p.startDate)} · {formatEur(p.budget)} · Crew {filled}/{p.roles.length}
                          {p.type === "managed" && " · Managed Crew"}
                        </p>
                      </div>
                      <StatusBadge status={p.status} />
                    </div>
                    <ProjectStepper status={p.status} />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </DashboardCard>

      <div className="grid gap-6 lg:grid-cols-2">
        <DashboardCard id="offene-rollen" title="Offene Crew-Rollen" icon={Users}>
          {openRoles.length === 0 ? (
            <p className="text-sm text-muted-foreground">Alle Rollen sind besetzt.</p>
          ) : (
            <ul className="divide-y">
              {openRoles.map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-3 py-2 first:pt-0 last:pb-0">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{r.title}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {r.project.title} · {categoryName(r.category)} · {formatEur(r.budget)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {r.requests.length ? `${r.requests.length} Anfrage${r.requests.length > 1 ? "n" : ""} offen` : "noch niemand angefragt"}
                    </p>
                  </div>
                  <Button asChild size="sm" variant="outline" className="shrink-0">
                    <Link href={`/mitglieder?bereich=${r.category}`}>Suchen</Link>
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </DashboardCard>

        <DashboardCard id="zahlungsstatus" title="Zahlungsstatus" icon={CreditCard} href="/finanzen">
          {payments.length === 0 ? (
            <p className="text-sm text-muted-foreground">Zahlungen werden reserviert, sobald die Crew bestätigt ist.</p>
          ) : (
            <div className="-mx-4 overflow-x-auto sm:mx-0">
              <table className="w-full min-w-[26rem] text-sm">
                <thead className="text-left text-xs text-muted-foreground">
                  <tr>
                    <th scope="col" className="px-4 py-2 font-medium sm:px-2">Posten</th>
                    <th scope="col" className="px-2 py-2 text-right font-medium">Betrag</th>
                    <th scope="col" className="px-4 py-2 font-medium sm:px-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {payments.slice(0, 8).map((p) => (
                    <tr key={p.id}>
                      <td className="px-4 py-2 sm:px-2">
                        <span className="block">{p.label}</span>
                        <span className="block text-xs text-muted-foreground">{p.projectTitle}</span>
                      </td>
                      <td className="px-2 py-2 text-right tabular-nums">
                        {formatEur(p.amount)}
                        <span className="block text-xs text-muted-foreground">+ {formatEur(p.serviceFee)} Gebühr</span>
                      </td>
                      <td className="px-4 py-2 sm:px-2"><StatusBadge status={p.status} kind="payment" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </DashboardCard>
      </div>

      <DashboardCard id="community" title="Community" icon={CalendarHeart} href="/sessions" hrefLabel="Zum Kalender">
        {openStudio ? (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-sm font-medium">Nächstes Open Studio: {openStudio.title}</p>
              <p className="text-sm text-muted-foreground">
                {formatDateLong(openStudio.date)}, {openStudio.startHour}–{openStudio.endHour} Uhr · {openStudio.location} · noch {openStudio.free} Plätze
              </p>
              <p className="mt-1 text-xs text-muted-foreground">Lern die Crew vor dem Projekt kennen – offene Studio-Abende mit Nesto und dem Netzwerk.</p>
            </div>
            <Button asChild size="sm" variant="outline" className="shrink-0">
              <Link href={`/sessions?typ=open-studio&woche=${Math.min(3, differenceInCalendarWeeks(openStudio.date, new Date(), { weekStartsOn: 1 }))}`}>Platz sichern</Link>
            </Button>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Gerade ist kein Open Studio geplant. Schau bald wieder in Nestos Kalender.</p>
        )}
      </DashboardCard>

      <DashboardCard id="vorschlaege" title={focusRole ? `Vorschläge für „${focusRole.title}“` : "Vorschläge"} icon={Wand2}>
        {!focusRole || suggestions.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sobald ein Projekt offene Rollen hat, schlagen wir hier passende Mitglieder vor.</p>
        ) : (
          <>
            <p className="mb-3 text-xs text-muted-foreground">
              {focusRole.project.title} · Rollenbudget {formatEur(focusRole.budget)}. Transparentes Ranking: Bereich, Tagessatz, Nähe, Verfügbarkeit, Bewertung, Verifizierung.
            </p>
            <ul className="grid gap-3 md:grid-cols-3">
              {suggestions.map((s) => (
                <li key={s.user.id} className="flex flex-col gap-3 rounded-lg border p-3">
                  <Link href={`/mitglieder/${s.profile.slug}`} className="flex items-center gap-3">
                    <UserAvatar name={s.user.name} seed={s.profile.avatarSeed} className="size-10" />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium hover:underline">{s.user.name}</span>
                      <span className="block truncate text-xs text-muted-foreground">{s.profile.city} · ab {formatEur(s.profile.dayRateMin)}</span>
                    </span>
                  </Link>
                  <div className="flex flex-wrap items-center gap-2">
                    <Rating value={s.profile.ratingAvg} count={s.profile.ratingCount} />
                    {s.profile.verified && <VerifiedBadge />}
                  </div>
                  {s.reasons.length > 0 && <p className="text-xs text-muted-foreground">Passt, weil: {s.reasons.join(", ")}.</p>}
                  <AddToCrewDialog
                    creative={{ id: s.user.id, name: s.user.name, categories: [focusRole.category] }}
                    projects={crewTargets}
                    label="Anfragen"
                    className="mt-auto w-full"
                  />
                </li>
              ))}
            </ul>
          </>
        )}
      </DashboardCard>
    </div>
  );
}
