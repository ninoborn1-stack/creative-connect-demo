"use server";

import { revalidatePath } from "next/cache";
import { addDays } from "date-fns";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { notify, sendMail } from "@/lib/services/mail";
import { formatDate } from "@/lib/format";
import { awardActivityPoints } from "@/lib/points";

type Result = { ok: true; points?: number } | { ok: false; error: string };

// ---------- Feed ----------

export async function createPost(input: { body: string; withImage: boolean }): Promise<Result> {
  const user = await requireUser();
  const body = input.body.trim();
  if (body.length < 3) return { ok: false, error: "Schreib mindestens ein paar Worte." };
  if (body.length > 2000) return { ok: false, error: "Maximal 2.000 Zeichen." };
  const post = await db.post.create({
    data: { authorId: user.id, body, imageSeed: input.withImage ? `cc-post-${user.id.slice(-6)}-${Date.now().toString(36)}` : null },
  });
  const points = await awardActivityPoints(user.id, "post", post.id);
  revalidatePath("/community");
  revalidatePath("/punkte");
  return { ok: true, points };
}

export async function toggleLike(postId: string): Promise<Result> {
  const user = await requireUser();
  const existing = await db.like.findUnique({ where: { postId_userId: { postId, userId: user.id } } });
  if (existing) await db.like.delete({ where: { id: existing.id } });
  else await db.like.create({ data: { postId, userId: user.id } });
  revalidatePath("/community");
  return { ok: true };
}

export async function addComment(input: { postId: string; body: string }): Promise<Result> {
  const user = await requireUser();
  const body = input.body.trim();
  if (!body) return { ok: false, error: "Der Kommentar ist leer." };
  if (body.length > 1000) return { ok: false, error: "Maximal 1.000 Zeichen." };
  const post = await db.post.findUnique({ where: { id: input.postId } });
  if (!post) return { ok: false, error: "Beitrag nicht gefunden." };
  await db.comment.create({ data: { postId: post.id, authorId: user.id, body } });
  if (post.authorId !== user.id) await notify(post.authorId, "Neuer Kommentar", `${user.name}: „${body.slice(0, 80)}“`, "/community");
  revalidatePath("/community");
  return { ok: true };
}

// ---------- Events ----------

export async function toggleRsvp(eventId: string): Promise<Result & { attending?: boolean }> {
  const user = await requireUser();
  const event = await db.event.findUnique({ where: { id: eventId }, include: { _count: { select: { rsvps: true } } } });
  if (!event) return { ok: false, error: "Event nicht gefunden." };
  if (event.date < new Date()) return { ok: false, error: "Das Event ist bereits vorbei." };
  const existing = await db.rSVP.findUnique({ where: { eventId_userId: { eventId, userId: user.id } } });
  let points = 0;
  if (existing) {
    await db.rSVP.delete({ where: { id: existing.id } });
  } else {
    if (event._count.rsvps >= event.capacity) return { ok: false, error: "Das Event ist voll." };
    await db.rSVP.create({ data: { eventId, userId: user.id } });
    points = await awardActivityPoints(user.id, "event", event.id, `Zusage: ${event.title}`);
    await sendMail(user.email, `Zusage: ${event.title}`, `Hallo ${user.name.split(" ")[0]},\n\ndu bist dabei: ${event.title} am ${formatDate(event.date)} um 19 Uhr, ${event.venueName} (${event.city}).\n\nBis bald!\nDein Creative-Connect-Team`);
  }
  revalidatePath("/events");
  revalidatePath(`/events/${event.slug}`);
  revalidatePath("/punkte");
  return { ok: true, attending: !existing, points };
}

export async function joinEventWaitlist(eventId: string): Promise<Result> {
  const user = await requireUser();
  const event = await db.event.findUnique({ where: { id: eventId } });
  if (!event) return { ok: false, error: "Event nicht gefunden." };
  // Demo: Warteliste wird nicht gespeichert, nur bestätigt.
  await notify(user.id, "Warteliste", `Du stehst auf der Warteliste für „${event.title}“. Wir melden uns, sobald ein Platz frei wird.`, `/events/${event.slug}`);
  return { ok: true };
}

// ---------- Equipment-Börse ----------

export async function createEquipment(input: {
  title: string; description: string; mode: string; price: number; condition: string; city: string;
}): Promise<Result> {
  const user = await requireUser();
  const title = input.title.trim();
  const description = input.description.trim();
  if (title.length < 3) return { ok: false, error: "Bitte gib einen Titel an." };
  if (description.length < 5) return { ok: false, error: "Bitte beschreibe das Angebot kurz." };
  if (input.mode !== "verleih" && input.mode !== "verkauf") return { ok: false, error: "Bitte wähle Verleih oder Verkauf." };
  const price = Math.round(Number(input.price));
  if (!(price > 0)) return { ok: false, error: "Bitte gib einen Preis an." };
  await db.equipmentListing.create({
    data: {
      ownerId: user.id, title, description, mode: input.mode, price, condition: input.condition.trim() || "Gut",
      city: input.city.trim() || user.profile?.city || "Berlin", imageSeed: `cc-equipment-${user.id.slice(-6)}-${Date.now().toString(36)}`,
    },
  });
  revalidatePath("/equipment");
  return { ok: true };
}

export async function requestEquipment(input: { listingId: string; message: string }): Promise<Result> {
  const user = await requireUser();
  const message = input.message.trim();
  if (message.length < 5) return { ok: false, error: "Bitte schreib eine kurze Nachricht." };
  const listing = await db.equipmentListing.findUnique({ where: { id: input.listingId }, include: { owner: true } });
  if (!listing) return { ok: false, error: "Angebot nicht gefunden." };
  if (listing.ownerId === user.id) return { ok: false, error: "Das ist dein eigenes Angebot." };
  await notify(listing.ownerId, `Anfrage: ${listing.title}`, `${user.name}: „${message.slice(0, 120)}“`, "/equipment");
  await sendMail(
    listing.owner.email,
    `Neue Anfrage zu „${listing.title}“`,
    `Hallo ${listing.owner.name.split(" ")[0]},\n\n${user.name} interessiert sich für dein Angebot „${listing.title}“ (${listing.mode === "verleih" ? "Verleih" : "Verkauf"}):\n\n${message}\n\nAntworte direkt an ${user.email}.\n\nDein Creative-Connect-Team`,
  );
  return { ok: true };
}

export async function deleteEquipment(listingId: string): Promise<Result> {
  const user = await requireUser();
  const listing = await db.equipmentListing.findUnique({ where: { id: listingId } });
  if (!listing || (listing.ownerId !== user.id && !user.isAdmin)) return { ok: false, error: "Nicht erlaubt." };
  await db.equipmentListing.delete({ where: { id: listing.id } });
  revalidatePath("/equipment");
  return { ok: true };
}

// ---------- Einladungen ----------

const INVITE_QUOTA = 5;
const INVITE_VALID_DAYS = 30;

function codePrefix(name: string) {
  const first = name.split(/\s+/)[0] ?? "CC";
  return (
    first
      .toUpperCase()
      .replace(/Ä/g, "AE").replace(/Ö/g, "OE").replace(/Ü/g, "UE").replace(/ß/g, "SS")
      .replace(/[^A-Z0-9]/g, "") || "CC"
  );
}

async function newInviteCode(name: string) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  for (;;) {
    const suffix = Array.from({ length: 4 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("");
    const code = `${codePrefix(name)}-${suffix}`;
    if (!(await db.invite.findUnique({ where: { code } }))) return code;
  }
}

async function openInviteCount(userId: string) {
  return db.invite.count({ where: { senderId: userId, status: "offen", expiresAt: { gt: new Date() } } });
}

export async function createInvite(): Promise<Result & { code?: string }> {
  const user = await requireUser();
  if ((await openInviteCount(user.id)) >= INVITE_QUOTA)
    return { ok: false, error: `Du hast bereits ${INVITE_QUOTA} offene Einladungen. Warte, bis eine eingelöst wird oder abläuft.` };
  const code = await newInviteCode(user.name);
  await db.invite.create({ data: { code, senderId: user.id, status: "offen", expiresAt: addDays(new Date(), INVITE_VALID_DAYS) } });
  revalidatePath("/einladen");
  return { ok: true, code };
}

export async function inviteByEmail(input: { email: string; note: string; origin: string }): Promise<Result> {
  const user = await requireUser();
  const email = input.email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, error: "Bitte gib eine gültige E-Mail-Adresse an." };
  if (await db.user.findUnique({ where: { email } })) return { ok: false, error: "Diese Person ist schon Mitglied." };
  if ((await openInviteCount(user.id)) >= INVITE_QUOTA)
    return { ok: false, error: `Kontingent erreicht: maximal ${INVITE_QUOTA} offene Einladungen gleichzeitig.` };
  const code = await newInviteCode(user.name);
  const expiresAt = addDays(new Date(), INVITE_VALID_DAYS);
  await db.invite.create({ data: { code, senderId: user.id, email, status: "offen", expiresAt } });
  const origin = /^https?:\/\/[^\s/]+$/.test(input.origin) ? input.origin : "";
  const note = input.note.trim();
  await sendMail(
    email,
    `${user.name} lädt dich zu Creative Connect ein`,
    `Hallo,\n\n${user.name} lädt dich in das geschlossene Netzwerk von Creative Connect ein – der Crew-Plattform für Kreative.${note ? `\n\nPersönliche Nachricht:\n„${note}“` : ""}\n\nDein Einladungscode: ${code}\nEinlösen: ${origin}/invite/${code}\n\nDer Code ist gültig bis ${formatDate(expiresAt)}.\n\nDein Creative-Connect-Team`,
  );
  revalidatePath("/einladen");
  return { ok: true };
}
