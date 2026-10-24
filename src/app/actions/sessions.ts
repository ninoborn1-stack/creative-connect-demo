"use server";

import { revalidatePath } from "next/cache";
import { addDays, startOfDay } from "date-fns";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { awardPoints } from "@/lib/points";
import { notify, sendMail } from "@/lib/services/mail";
import { formatDateLong } from "@/lib/format";
import { SESSION_TYPES } from "@/lib/constants";
import { ACTIVE_BOOKING, isCheckInOpen, isSessionPast, timeLabel } from "@/components/sessions/session-utils";

type Result = { ok: true; message?: string; points?: number } | { ok: false; error: string };

function refresh() {
  revalidatePath("/sessions");
  revalidatePath("/punkte");
  revalidatePath("/dashboard");
  revalidatePath("/mitglieder/[slug]", "page");
  revalidatePath("/");
}

function when(s: { date: Date; startHour: number; endHour: number }) {
  return `${formatDateLong(s.date)}, ${timeLabel(s.startHour, s.endHour)}`;
}

// ---------- Mitglieder ----------

export async function bookSession(input: { sessionId: string; note?: string }): Promise<Result> {
  const user = await requireUser();
  const session = await db.nestoSession.findUnique({ where: { id: input.sessionId }, include: { host: true, bookings: true } });
  if (!session) return { ok: false, error: "Diese Session gibt es nicht mehr." };
  if (session.hostId === user.id) return { ok: false, error: "Das ist dein eigener Slot." };
  if (session.status !== "geplant") return { ok: false, error: "Diese Session wurde abgesagt." };
  if (isSessionPast(session.date, session.endHour)) return { ok: false, error: "Die Session ist bereits vorbei." };

  const mine = session.bookings.find((b) => b.userId === user.id);
  if (mine && ACTIVE_BOOKING.includes(mine.status)) return { ok: false, error: "Du hast hier schon einen Platz." };
  const taken = session.bookings.filter((b) => ACTIVE_BOOKING.includes(b.status)).length;
  if (taken >= session.capacity) return { ok: false, error: "Die Session ist leider ausgebucht." };

  const note = input.note?.trim().slice(0, 500) || null;
  if (mine) await db.sessionBooking.update({ where: { id: mine.id }, data: { status: "gebucht", note } });
  else await db.sessionBooking.create({ data: { sessionId: session.id, userId: user.id, note } });

  await notify(session.hostId, `Neue Buchung: ${session.title}`, `${user.name} hat einen Platz gebucht (${when(session)}).${note ? ` „${note}“` : ""}`, "/sessions");
  await sendMail(
    user.email,
    `Platz gebucht: ${session.title}`,
    `Hallo ${user.name.split(" ")[0]},\n\ndein Platz ist reserviert: ${session.title} mit ${session.host.name.split(" ")[0]} – ${when(session)}, ${session.location}.${note ? `\n\nDeine Notiz: „${note}“` : ""}\n\nSessions sind für Mitglieder kostenlos. Für deine Teilnahme bekommst du ${session.points} Punkte.\n\nBis bald im Studio!\nDein Creative-Connect-Team`,
  );
  refresh();
  return { ok: true, message: `Platz gebucht – nach der Teilnahme gibt’s +${session.points} Punkte.` };
}

export async function cancelBooking(sessionId: string): Promise<Result> {
  const user = await requireUser();
  const booking = await db.sessionBooking.findUnique({ where: { sessionId_userId: { sessionId, userId: user.id } }, include: { session: true } });
  if (!booking || booking.status !== "gebucht") return { ok: false, error: "Keine aktive Buchung gefunden." };
  if (isSessionPast(booking.session.date, booking.session.endHour)) return { ok: false, error: "Die Session ist bereits vorbei." };
  // Stornierung gibt den Platz frei (Eintrag entfällt)
  await db.sessionBooking.delete({ where: { id: booking.id } });
  await notify(booking.session.hostId, `Storniert: ${booking.session.title}`, `${user.name} hat den Platz am ${formatDateLong(booking.session.date)} storniert.`, "/sessions");
  refresh();
  return { ok: true, message: "Buchung storniert – der Platz ist wieder frei." };
}

// Demo: Check-in für die eigene Buchung simulieren, damit Punkte sofort sichtbar werden
export async function demoCheckIn(sessionId: string): Promise<Result> {
  const user = await requireUser();
  const booking = await db.sessionBooking.findUnique({ where: { sessionId_userId: { sessionId, userId: user.id } }, include: { session: true } });
  if (!booking || booking.status !== "gebucht") return { ok: false, error: "Keine offene Buchung gefunden." };
  if (booking.session.status !== "geplant") return { ok: false, error: "Diese Session wurde abgesagt." };
  return checkInBooking(booking.id, true);
}

// ---------- Nesto / Admin ----------

async function requireHost() {
  const user = await requireUser();
  return user.isAdmin ? user : null;
}

export type SlotInput = {
  type: string; title: string; date: string; startHour: number; endHour: number; capacity: number; location: string; points: number; description?: string;
};

function parseDay(key: string) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key);
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : null;
}

export async function createSlot(input: SlotInput): Promise<Result> {
  const host = await requireHost();
  if (!host) return { ok: false, error: "Nur Nesto kann Slots anlegen." };
  const meta = SESSION_TYPES[input.type];
  if (!meta) return { ok: false, error: "Bitte wähle einen Session-Typ." };
  const title = input.title.trim() || meta.label;
  const date = parseDay(input.date);
  const today = startOfDay(new Date());
  if (!date || date < today || date > addDays(today, 120)) return { ok: false, error: "Bitte wähle ein Datum ab heute (max. 4 Monate im Voraus)." };
  const startHour = Math.floor(Number(input.startHour));
  const endHour = Math.floor(Number(input.endHour));
  if (!(startHour >= 6 && endHour <= 24 && endHour > startHour)) return { ok: false, error: "Bitte wähle eine gültige Uhrzeit (Ende nach Beginn)." };
  const capacity = Math.floor(Number(input.capacity));
  if (!(capacity >= 1 && capacity <= 50)) return { ok: false, error: "Kapazität zwischen 1 und 50 Plätzen." };
  const points = Math.floor(Number(input.points));
  if (!(points >= 0 && points <= 500)) return { ok: false, error: "Punkte zwischen 0 und 500." };
  const location = input.location.trim() || "Nestos Studio, Berlin-Kreuzberg";

  await db.nestoSession.create({
    data: { hostId: host.id, type: input.type, title: title.slice(0, 120), description: input.description?.trim() || meta.description, date, startHour, endHour, location: location.slice(0, 160), capacity, points },
  });
  refresh();
  return { ok: true, message: `Slot „${title}“ angelegt.` };
}

export async function cancelSlot(sessionId: string): Promise<Result> {
  const host = await requireHost();
  if (!host) return { ok: false, error: "Nur Nesto kann Slots absagen." };
  const session = await db.nestoSession.findUnique({ where: { id: sessionId }, include: { bookings: { where: { status: "gebucht" }, include: { user: true } } } });
  if (!session) return { ok: false, error: "Session nicht gefunden." };
  if (session.status === "abgesagt") return { ok: false, error: "Der Slot ist bereits abgesagt." };
  await db.nestoSession.update({ where: { id: session.id }, data: { status: "abgesagt" } });
  for (const b of session.bookings) {
    await db.sessionBooking.update({ where: { id: b.id }, data: { status: "abgesagt" } });
    await notify(b.userId, `Abgesagt: ${session.title}`, `Nesto musste die Session am ${formatDateLong(session.date)} leider absagen. Such dir gern einen neuen Slot aus.`, "/sessions");
    await sendMail(
      b.user.email,
      `Session abgesagt: ${session.title}`,
      `Hallo ${b.user.name.split(" ")[0]},\n\nleider muss die Session „${session.title}“ (${when(session)}) ausfallen. Sorry dafür!\n\nIm Kalender unter /sessions findest du die nächsten freien Slots.\n\nNesto & das Creative-Connect-Team`,
    );
  }
  refresh();
  return { ok: true, message: session.bookings.length ? `Slot abgesagt – ${session.bookings.length} Buchende benachrichtigt.` : "Slot abgesagt." };
}

async function checkInBooking(bookingId: string, attended: boolean): Promise<Result> {
  const booking = await db.sessionBooking.findUnique({ where: { id: bookingId }, include: { session: true } });
  if (!booking) return { ok: false, error: "Buchung nicht gefunden." };
  const { session } = booking;
  if (!attended) {
    await db.sessionBooking.update({ where: { id: booking.id }, data: { status: "abgesagt" } });
    refresh();
    return { ok: true, message: "Als „nicht erschienen“ markiert." };
  }
  await db.sessionBooking.update({ where: { id: booking.id }, data: { status: "teilgenommen" } });
  const event = await awardPoints(booking.userId, session.points, "session", `${session.title} mit Nesto`, session.id);
  refresh();
  return { ok: true, points: event ? session.points : 0, message: event ? `Teilnahme bestätigt – +${session.points} Punkte` : "Teilnahme bestätigt (Punkte waren schon gutgeschrieben)." };
}

export async function checkIn(bookingId: string, attended: boolean): Promise<Result> {
  const host = await requireHost();
  if (!host) return { ok: false, error: "Nur Nesto kann den Check-in machen." };
  const booking = await db.sessionBooking.findUnique({ where: { id: bookingId }, include: { session: true } });
  if (!booking) return { ok: false, error: "Buchung nicht gefunden." };
  if (!isCheckInOpen(booking.session.date)) return { ok: false, error: "Check-in ist erst am Tag der Session möglich." };
  return checkInBooking(bookingId, attended);
}
