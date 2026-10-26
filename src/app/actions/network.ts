"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { notify, sendMail } from "@/lib/services/mail";

type Result = { ok: true; message?: string; state?: "none" | "pending_out" | "pending_in" | "connected"; connectionId?: string } | { ok: false; error: string };

function refresh() {
  revalidatePath("/netzwerk");
  revalidatePath("/dashboard");
  revalidatePath("/mitglieder", "layout");
  revalidatePath("/unternehmen", "layout");
}

async function profileHref(userId: string) {
  const p = await db.profile.findUnique({ where: { userId }, select: { slug: true } });
  return p ? `/mitglieder/${p.slug}` : "/netzwerk";
}

// Vernetzen: neue Anfrage – oder, falls die andere Person schon angefragt hat, direkt verbinden
export async function requestConnection(targetId: string, note?: string): Promise<Result> {
  const me = await requireUser();
  if (targetId === me.id) return { ok: false, error: "Du kannst dich nicht mit dir selbst vernetzen." };
  const target = await db.user.findUnique({ where: { id: targetId } });
  if (!target || target.status === "gesperrt") return { ok: false, error: "Diese Person ist nicht erreichbar." };

  const [mine, theirs] = await Promise.all([
    db.connection.findUnique({ where: { fromId_toId: { fromId: me.id, toId: targetId } } }),
    db.connection.findUnique({ where: { fromId_toId: { fromId: targetId, toId: me.id } } }),
  ]);
  if (mine?.status === "verbunden" || theirs?.status === "verbunden") return { ok: true, state: "connected", message: "Ihr seid bereits verbunden." };
  if (theirs?.status === "angefragt") return acceptConnection(theirs.id);
  if (mine?.status === "angefragt") return { ok: true, state: "pending_out", connectionId: mine.id, message: "Anfrage ist bereits unterwegs." };

  const text = note?.trim().slice(0, 300) || null;
  const conn = mine
    ? await db.connection.update({ where: { id: mine.id }, data: { status: "angefragt", note: text, createdAt: new Date() } })
    : await db.connection.create({ data: { fromId: me.id, toId: targetId, status: "angefragt", note: text } });

  const who = me.jobTitle && me.company ? `${me.name} (${me.jobTitle}, ${me.company})` : me.name;
  await notify(targetId, "Neue Kontaktanfrage", `${who} möchte sich mit dir vernetzen.${text ? ` „${text}“` : ""}`, "/netzwerk");
  await sendMail(
    target.email,
    `${me.name} möchte sich mit dir vernetzen`,
    `Hallo ${target.name.split(" ")[0]},\n\n${who} möchte sich auf Creative Connect mit dir vernetzen.${text ? `\n\nNachricht:\n„${text}“` : ""}\n\nAnnehmen oder ablehnen kannst du unter „Netzwerk“.\n\nDein Creative-Connect-Team`,
  );
  refresh();
  return { ok: true, state: "pending_out", connectionId: conn.id, message: `Anfrage an ${target.name} gesendet.` };
}

export async function acceptConnection(connectionId: string): Promise<Result> {
  const me = await requireUser();
  const conn = await db.connection.findUnique({ where: { id: connectionId }, include: { from: true } });
  if (!conn || conn.toId !== me.id) return { ok: false, error: "Anfrage nicht gefunden." };
  if (conn.status === "verbunden") return { ok: true, state: "connected" };
  await db.connection.update({ where: { id: connectionId }, data: { status: "verbunden" } });
  // eine eventuelle Gegenanfrage aufräumen
  await db.connection.deleteMany({ where: { fromId: me.id, toId: conn.fromId, status: { not: "verbunden" } } });
  await notify(conn.fromId, "Kontaktanfrage angenommen", `${me.name} hat deine Kontaktanfrage angenommen.`, await profileHref(me.id));
  refresh();
  return { ok: true, state: "connected", connectionId, message: `Du bist jetzt mit ${conn.from.name} verbunden.` };
}

export async function declineConnection(connectionId: string): Promise<Result> {
  const me = await requireUser();
  const conn = await db.connection.findUnique({ where: { id: connectionId } });
  if (!conn || conn.toId !== me.id || conn.status !== "angefragt") return { ok: false, error: "Anfrage nicht gefunden." };
  await db.connection.update({ where: { id: connectionId }, data: { status: "abgelehnt" } });
  refresh();
  return { ok: true, state: "none", message: "Anfrage abgelehnt." };
}

export async function withdrawConnection(connectionId: string): Promise<Result> {
  const me = await requireUser();
  const conn = await db.connection.findUnique({ where: { id: connectionId } });
  if (!conn || conn.fromId !== me.id || conn.status !== "angefragt") return { ok: false, error: "Anfrage nicht gefunden." };
  await db.connection.delete({ where: { id: connectionId } });
  refresh();
  return { ok: true, state: "none", message: "Anfrage zurückgezogen." };
}

export async function removeConnection(otherId: string): Promise<Result> {
  const me = await requireUser();
  await db.connection.deleteMany({
    where: { status: "verbunden", OR: [{ fromId: me.id, toId: otherId }, { fromId: otherId, toId: me.id }] },
  });
  refresh();
  return { ok: true, state: "none", message: "Kontakt entfernt." };
}
