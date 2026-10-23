import Link from "next/link";
import { CalendarDays, MapPin } from "lucide-react";
import { formatDate, formatEur } from "@/lib/format";
import { StatusBadge } from "@/components/badges";
import { StockImage } from "@/components/stock-image";
import { UserAvatar } from "@/components/user-avatar";
import { Badge } from "@/components/ui/badge";

export type ProjectCardData = {
  id: string; title: string; type: string; status: string; budget: number; city: string; startDate: Date; endDate: Date; coverSeed: string;
  crew: { id: string; name: string; avatarSeed: string | null }[];
  openRoles: number;
  myRole?: string;
};

export function TypeBadge({ type }: { type: string }) {
  return type === "managed" ? <Badge>Managed Crew</Badge> : <Badge variant="outline">Self-Service</Badge>;
}

export function ProjectCard({ project }: { project: ProjectCardData }) {
  const shown = project.crew.slice(0, 5);
  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border bg-card transition-colors hover:border-primary/40" data-testid="project-card">
      <Link href={`/projekte/${project.id}`} className="relative block aspect-[16/7] bg-muted" tabIndex={-1} aria-hidden>
        <StockImage seed={project.coverSeed} w={800} h={350} sizes="(max-width: 640px) 100vw, 33vw" className="transition-transform duration-300 group-hover:scale-[1.03]" />
        <div className="absolute top-2 left-2 flex gap-1.5"><StatusBadge status={project.status} /></div>
      </Link>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold leading-snug">
            <Link href={`/projekte/${project.id}`} className="hover:underline">{project.title}</Link>
          </h3>
          <TypeBadge type={project.type} />
        </div>
        {project.myRole && <p className="text-xs text-primary">Deine Rolle: {project.myRole}</p>}
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1"><MapPin className="size-3.5" aria-hidden />{project.city}</span>
          <span className="inline-flex items-center gap-1"><CalendarDays className="size-3.5" aria-hidden />{formatDate(project.startDate)} – {formatDate(project.endDate)}</span>
        </div>
        <div className="mt-auto flex items-center justify-between gap-2 border-t pt-3">
          <div>
            <p className="text-sm font-semibold">{formatEur(project.budget)}</p>
            <p className="text-[11px] text-muted-foreground">{project.openRoles ? `${project.openRoles} Rolle(n) offen` : "Budget"}</p>
          </div>
          {shown.length > 0 ? (
            <div className="flex -space-x-2" aria-label={`Crew: ${project.crew.map((c) => c.name).join(", ")}`}>
              {shown.map((c) => <UserAvatar key={c.id} name={c.name} seed={c.avatarSeed} className="size-7 ring-2 ring-card" />)}
              {project.crew.length > shown.length && (
                <span className="flex size-7 items-center justify-center rounded-full bg-muted text-[10px] font-medium ring-2 ring-card">+{project.crew.length - shown.length}</span>
              )}
            </div>
          ) : (
            <span className="text-xs text-muted-foreground">Noch keine Crew</span>
          )}
        </div>
      </div>
    </article>
  );
}
