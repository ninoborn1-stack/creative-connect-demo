"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";

export async function markAllNotificationsRead() {
  const user = await requireUser();
  await db.notification.updateMany({ where: { userId: user.id, read: false }, data: { read: true } });
  revalidatePath("/", "layout");
}

// Markiert eine Benachrichtigung als gelesen und folgt ihrem Link.
export async function openNotification(id: string) {
  const user = await requireUser();
  const n = await db.notification.findUnique({ where: { id } });
  if (!n || n.userId !== user.id) return;
  if (!n.read) await db.notification.update({ where: { id }, data: { read: true } });
  revalidatePath("/", "layout");
  if (n.href && n.href.startsWith("/")) redirect(n.href);
}
