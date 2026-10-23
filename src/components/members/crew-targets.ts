import "server-only";
import { db } from "@/lib/db";

export type CrewTargetProject = {
  id: string;
  title: string;
  city: string;
  roles: { id: string; title: string; category: string; budget: number }[];
};

// Eigene Projekte mit offenen (unbesetzten) Rollen – Datenquelle für den „Zur Crew hinzufügen“-Dialog.
export async function getCrewTargets(userId: string): Promise<CrewTargetProject[]> {
  const projects = await db.project.findMany({
    where: {
      ownerId: userId,
      status: { in: ["entwurf", "anfragen", "bestaetigt", "produktion"] },
      roles: { some: { assigneeId: null } },
    },
    include: { roles: { where: { assigneeId: null }, orderBy: { sort: "asc" } } },
    orderBy: { startDate: "asc" },
  });
  return projects.map((p) => ({
    id: p.id,
    title: p.title,
    city: p.city,
    roles: p.roles.map((r) => ({ id: r.id, title: r.title, category: r.category, budget: r.budget })),
  }));
}
