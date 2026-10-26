import "server-only";
import { db } from "@/lib/db";
import { parseJson } from "@/lib/format";

// Zustand einer Kontaktbeziehung aus Sicht der angemeldeten Person
export type ConnectionState = "none" | "pending_out" | "pending_in" | "connected";
export type Relation = { state: ConnectionState; connectionId?: string };

type Row = { id: string; fromId: string; toId: string; status: string };

function relationFrom(meId: string, row: Row | undefined): Relation {
  if (!row) return { state: "none" };
  if (row.status === "verbunden") return { state: "connected", connectionId: row.id };
  if (row.status === "angefragt") return { state: row.fromId === meId ? "pending_out" : "pending_in", connectionId: row.id };
  return { state: "none", connectionId: row.id };
}

// Alle Beziehungen der Person als Map (andere User-ID → Zustand)
export async function getRelations(meId: string) {
  const rows = await db.connection.findMany({
    where: { OR: [{ fromId: meId }, { toId: meId }] },
    select: { id: true, fromId: true, toId: true, status: true },
  });
  const map = new Map<string, Relation>();
  for (const r of rows) {
    const other = r.fromId === meId ? r.toId : r.fromId;
    const rel = relationFrom(meId, r);
    // „verbunden“ schlägt alles, offene Anfragen schlagen „abgelehnt“
    const prev = map.get(other);
    if (!prev || prev.state === "none" || rel.state === "connected") map.set(other, rel);
  }
  return map;
}

export function relationOf(map: Map<string, Relation>, otherId: string): Relation {
  return map.get(otherId) ?? { state: "none" };
}

export async function getConnectedIds(userId: string) {
  const rows = await db.connection.findMany({
    where: { status: "verbunden", OR: [{ fromId: userId }, { toId: userId }] },
    select: { fromId: true, toId: true },
  });
  return new Set(rows.map((r) => (r.fromId === userId ? r.toId : r.fromId)));
}

export async function getMutualIds(meId: string, otherId: string) {
  if (meId === otherId) return [];
  const [mine, theirs] = await Promise.all([getConnectedIds(meId), getConnectedIds(otherId)]);
  return [...mine].filter((id) => theirs.has(id) && id !== otherId);
}

export type Suggestion = {
  id: string;
  name: string;
  slug: string | null;
  avatarSeed: string | null;
  headline: string;
  reason: string;
  mutual: number;
};

// „Leute, die du kennen könntest“: gemeinsame Kontakte, gleiche Stadt/Kategorie, Leute aus gefolgten Unternehmen
export async function getSuggestions(meId: string, limit = 12): Promise<Suggestion[]> {
  const [me, relations, myConnected, follows] = await Promise.all([
    db.user.findUnique({ where: { id: meId }, include: { profile: { select: { city: true, categories: true } } } }),
    getRelations(meId),
    getConnectedIds(meId),
    db.companyFollow.findMany({ where: { userId: meId }, select: { companyId: true } }),
  ]);
  if (!me) return [];

  // Kontakte meiner Kontakte
  const ids = [...myConnected];
  const second = ids.length
    ? await db.connection.findMany({
        where: { status: "verbunden", OR: [{ fromId: { in: ids } }, { toId: { in: ids } }] },
        select: { fromId: true, toId: true },
      })
    : [];
  const mutual = new Map<string, number>();
  for (const c of second) {
    for (const [a, b] of [[c.fromId, c.toId], [c.toId, c.fromId]] as const) {
      if (myConnected.has(a) && b !== meId && !myConnected.has(b)) mutual.set(b, (mutual.get(b) ?? 0) + 1);
    }
  }

  const myCats = parseJson<string[]>(me.profile?.categories, []);
  const companyIds = [...new Set([...follows.map((f) => f.companyId), ...(me.companyId ? [me.companyId] : [])])];

  const candidates = await db.user.findMany({
    where: {
      id: { not: meId },
      status: { not: "gesperrt" },
      OR: [
        { id: { in: [...mutual.keys()] } },
        ...(me.profile ? [{ profile: { is: { city: me.profile.city } } }] : []),
        ...myCats.map((c) => ({ profile: { is: { categories: { contains: `"${c}"` } } } })),
        ...(companyIds.length ? [{ companyId: { in: companyIds } }] : []),
        // Firmenkonten ohne eigenes Profil: Kreative als Vorschlag
        ...(!me.profile ? [{ isCreative: true }] : []),
      ],
    },
    include: { profile: { select: { slug: true, avatarSeed: true, headline: true, city: true, categories: true, verified: true } } },
    take: 400,
  });

  const scored = candidates
    .filter((u) => relationOf(relations, u.id).state === "none" && !u.isAdmin)
    .map((u) => {
      const m = mutual.get(u.id) ?? 0;
      const cats = parseJson<string[]>(u.profile?.categories, []);
      const sameCity = Boolean(me.profile && u.profile && u.profile.city === me.profile.city);
      const sharedCat = cats.find((c) => myCats.includes(c));
      const sameCompany = Boolean(u.companyId && companyIds.includes(u.companyId));
      const score = m * 10 + (sameCompany ? 25 : 0) + (sameCity ? 8 : 0) + (sharedCat ? 6 : 0) + (u.profile?.verified ? 2 : 0);
      const reason =
        m > 0
          ? `${m} gemeinsame${m === 1 ? "r Kontakt" : " Kontakte"}`
          : sameCompany
            ? `Arbeitet bei ${u.company}`
            : sameCity
              ? `Auch in ${u.profile!.city}`
              : sharedCat
                ? "Gleicher Bereich"
                : "Aktiv im Netzwerk";
      return {
        id: u.id,
        name: u.name,
        slug: u.profile?.slug ?? null,
        avatarSeed: u.profile?.avatarSeed ?? null,
        headline: u.profile?.headline ?? [u.jobTitle, u.company].filter(Boolean).join(" · "),
        reason,
        mutual: m,
        score,
      };
    })
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name, "de"))
    .slice(0, limit);
  return scored.map((s) => ({ id: s.id, name: s.name, slug: s.slug, avatarSeed: s.avatarSeed, headline: s.headline, reason: s.reason, mutual: s.mutual }));
}
