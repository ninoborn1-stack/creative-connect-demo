import type { Metadata } from "next";
import Link from "next/link";
import { FolderKanban, Plus, Users } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { PROJECT_STATUS_LABEL } from "@/lib/constants";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { ProjectCard, type ProjectCardData } from "@/components/projects/project-card";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Projekte" };

const FILTERS = ["alle", "entwurf", "anfragen", "bestaetigt", "produktion", "abnahme", "abgeschlossen", "storniert"];

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

const include = {
  roles: { include: { assignee: { include: { profile: { select: { avatarSeed: true } } } } }, orderBy: { sort: "asc" as const } },
};

export default async function ProjectsPage({ searchParams }: Props) {
  const user = await requireUser();
  const sp = await searchParams;
  const view = sp.ansicht === "crew" ? "crew" : "eigene";
  const status = typeof sp.status === "string" && FILTERS.includes(sp.status) ? sp.status : "alle";
  const statusWhere = status === "alle" ? {} : { status };

  const [owned, crew] = await Promise.all([
    db.project.findMany({ where: { ownerId: user.id, ...statusWhere }, include, orderBy: { startDate: "desc" } }),
    db.project.findMany({ where: { roles: { some: { assigneeId: user.id } }, ownerId: { not: user.id }, ...statusWhere }, include, orderBy: { startDate: "desc" } }),
  ]);

  const toCard = (p: (typeof owned)[number]): ProjectCardData => ({
    id: p.id, title: p.title, type: p.type, status: p.status, budget: p.budget, city: p.city, startDate: p.startDate, endDate: p.endDate, coverSeed: p.coverSeed,
    crew: [...new Map(p.roles.filter((r) => r.assignee).map((r) => [r.assignee!.id, { id: r.assignee!.id, name: r.assignee!.name, avatarSeed: r.assignee!.profile?.avatarSeed ?? null }])).values()],
    openRoles: p.roles.filter((r) => !r.assigneeId).length,
    myRole: p.ownerId === user.id ? undefined : p.roles.filter((r) => r.assigneeId === user.id).map((r) => r.title).join(", "),
  });

  const list = (view === "crew" ? crew : owned).map(toCard);
  const href = (params: { ansicht?: string; status?: string }) => {
    const q = new URLSearchParams();
    const a = params.ansicht ?? view;
    const s = params.status ?? status;
    if (a !== "eigene") q.set("ansicht", a);
    if (s !== "alle") q.set("status", s);
    const str = q.toString();
    return str ? `/projekte?${str}` : "/projekte";
  };

  return (
    <div>
      <PageHeader
        title="Projekte"
        description="Deine Projekte als Auftraggeber:in und die Projekte, in denen du Teil der Crew bist."
        actions={
          <Button asChild>
            <Link href="/briefing"><Plus aria-hidden /> Neues Projekt</Link>
          </Button>
        }
      />

      <nav aria-label="Ansicht" className="mb-4 inline-flex rounded-lg bg-muted p-1">
        {[
          { key: "eigene", label: `Meine Projekte (${owned.length})`, icon: FolderKanban },
          { key: "crew", label: `Als Crew-Mitglied (${crew.length})`, icon: Users },
        ].map((t) => (
          <Link
            key={t.key}
            href={href({ ansicht: t.key })}
            aria-current={view === t.key ? "page" : undefined}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              view === t.key ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
            )}
          >
            <t.icon className="size-4" aria-hidden /> {t.label}
          </Link>
        ))}
      </nav>

      <div className="-mx-4 mb-6 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <ul className="flex w-max gap-2" aria-label="Nach Status filtern">
          {FILTERS.map((f) => (
            <li key={f}>
              <Link
                href={href({ status: f })}
                aria-current={status === f ? "true" : undefined}
                className={cn(
                  "inline-flex rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                  status === f ? "border-primary bg-primary text-primary-foreground" : "hover:border-primary/50",
                )}
              >
                {f === "alle" ? "Alle" : PROJECT_STATUS_LABEL[f]}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {list.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title={status !== "alle" ? "Keine Projekte mit diesem Status" : view === "crew" ? "Du bist noch in keiner Crew" : "Noch keine eigenen Projekte"}
          description={view === "crew" ? "Sobald du eine Anfrage annimmst, erscheint das Projekt hier." : "Starte mit dem Briefing-Assistenten – er schlägt Rollen, Budget und Crew vor."}
          action={
            view === "eigene" ? (
              <Button asChild><Link href="/briefing">Briefing starten</Link></Button>
            ) : (
              <Button asChild variant="outline"><Link href="/dashboard">Zu meinen Anfragen</Link></Button>
            )
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((p) => <ProjectCard key={p.id} project={p} />)}
        </div>
      )}
    </div>
  );
}
