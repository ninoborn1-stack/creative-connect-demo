// Mock-Mailversand: Mails landen nur in der In-App-Outbox (/outbox). Später z. B. durch einen EU-Mailanbieter ersetzen.
import { db } from "@/lib/db";

export async function sendMail(to: string, subject: string, body: string) {
  await db.outboxMail.create({ data: { to, subject, body } });
}

export async function notify(userId: string, title: string, body: string, href?: string) {
  await db.notification.create({ data: { userId, title, body, href } });
}
