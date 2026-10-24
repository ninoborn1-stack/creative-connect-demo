import "server-only";
import { subDays } from "date-fns";
import { db } from "@/lib/db";
import { getBalance } from "@/lib/points";
import { levelFor } from "@/lib/constants";

export async function getPointSummary(userId: string) {
  const balance = await getBalance(userId);
  return { balance, ...levelFor(balance) };
}

export type LeaderRow = { rank: number; userId: string; name: string; slug: string | null; avatarSeed: string | null; points: number; levelLabel: string };

// Rangliste nach gesammelten (positiven) Punkten; Nesto/Admins sind ausgenommen
export async function getLeaderboard(days?: number) {
  const admins = await db.user.findMany({ where: { isAdmin: true }, select: { id: true } });
  const exclude = admins.map((a) => a.id);
  const groups = await db.pointEvent.groupBy({
    by: ["userId"],
    where: { points: { gt: 0 }, userId: { notIn: exclude }, ...(days ? { createdAt: { gte: subDays(new Date(), days) } } : {}) },
    _sum: { points: true },
    orderBy: { _sum: { points: "desc" } },
  });
  const ids = groups.map((g) => g.userId);
  const [users, balances] = await Promise.all([
    db.user.findMany({ where: { id: { in: ids }, status: { not: "gesperrt" } }, select: { id: true, name: true, profile: { select: { slug: true, avatarSeed: true } } } }),
    db.pointEvent.groupBy({ by: ["userId"], where: { userId: { in: ids } }, _sum: { points: true } }),
  ]);
  const byId = new Map(users.map((u) => [u.id, u]));
  const balanceById = new Map(balances.map((b) => [b.userId, b._sum.points ?? 0]));
  const rows: LeaderRow[] = [];
  for (const g of groups) {
    const u = byId.get(g.userId);
    if (!u) continue;
    rows.push({
      rank: rows.length + 1,
      userId: u.id,
      name: u.name,
      slug: u.profile?.slug ?? null,
      avatarSeed: u.profile?.avatarSeed ?? null,
      points: g._sum.points ?? 0,
      levelLabel: levelFor(balanceById.get(u.id) ?? 0).level.label,
    });
  }
  return rows;
}

export async function sessionsAttended(userId: string) {
  return db.sessionBooking.count({ where: { userId, status: "teilgenommen" } });
}
