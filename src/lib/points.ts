import "server-only";
import { db } from "@/lib/db";
import { POINT_RULES, levelFor } from "@/lib/constants";
import { notify } from "@/lib/services/mail";

// Punkte gutschreiben (Journal-Eintrag + Benachrichtigung). Doppelte Gutschrift pro refId+kind wird verhindert.
export async function awardPoints(userId: string, points: number, kind: string, reason: string, refId?: string) {
  if (refId) {
    const existing = await db.pointEvent.findFirst({ where: { userId, kind, refId } });
    if (existing) return null;
  }
  const before = await getBalance(userId);
  const event = await db.pointEvent.create({ data: { userId, points, kind, reason, refId } });
  const after = before + points;
  const lvBefore = levelFor(before).level.key;
  const lv = levelFor(after).level;
  await notify(userId, `+${points} Punkte`, reason, "/punkte");
  if (lv.key !== lvBefore && points > 0) await notify(userId, "Neues Level!", `Du bist jetzt „${lv.label}“ im Creative-Connect-Netzwerk.`, "/punkte");
  return event;
}

export async function getBalance(userId: string) {
  const agg = await db.pointEvent.aggregate({ where: { userId }, _sum: { points: true } });
  return agg._sum.points ?? 0;
}

// Punkte für Aktivitäten im Netzwerk (POINT_RULES) – nur aktive Kreative/Mitglieder, nicht Nesto/Admins.
// Gibt die gutgeschriebenen Punkte zurück (0, wenn nicht berechtigt oder bereits gutgeschrieben).
export async function awardActivityPoints(userId: string, rule: keyof typeof POINT_RULES, refId: string, reason?: string) {
  const user = await db.user.findUnique({ where: { id: userId }, select: { isAdmin: true, isCreative: true, status: true } });
  if (!user || user.isAdmin || !user.isCreative || user.status === "gesperrt") return 0;
  const { points, label } = POINT_RULES[rule];
  const event = await awardPoints(userId, points, rule, reason ?? label, refId);
  return event ? points : 0;
}
