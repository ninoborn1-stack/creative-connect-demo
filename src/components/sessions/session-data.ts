import "server-only";
import { startOfDay } from "date-fns";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { ACTIVE_BOOKING, isCheckInOpen, isSessionPast, type SessionDto } from "./session-utils";

const sessionInclude = {
  bookings: {
    include: { user: { select: { id: true, name: true, profile: { select: { avatarSeed: true } } } } },
    orderBy: { createdAt: "asc" },
  },
} satisfies Prisma.NestoSessionInclude;

type LoadedSession = Prisma.NestoSessionGetPayload<{ include: typeof sessionInclude }>;

export async function loadSessions(where: Prisma.NestoSessionWhereInput) {
  return db.nestoSession.findMany({ where, include: sessionInclude, orderBy: [{ date: "asc" }, { startHour: "asc" }] });
}

// Erhaltene Session-Punkte je Session-ID für eine Person
export async function earnedBySession(userId: string, sessionIds: string[]) {
  if (!sessionIds.length) return new Map<string, number>();
  const events = await db.pointEvent.findMany({ where: { userId, kind: "session", refId: { in: sessionIds } }, select: { refId: true, points: true } });
  return new Map(events.map((e) => [e.refId as string, e.points]));
}

export function toSessionDto(s: LoadedSession, viewer: { id: string; isAdmin: boolean }, earned: Map<string, number>): SessionDto {
  const mine = s.bookings.find((b) => b.userId === viewer.id);
  return {
    id: s.id,
    type: s.type,
    title: s.title,
    description: s.description,
    date: s.date.toISOString(),
    startHour: s.startHour,
    endHour: s.endHour,
    location: s.location,
    capacity: s.capacity,
    points: s.points,
    status: s.status,
    taken: s.bookings.filter((b) => ACTIVE_BOOKING.includes(b.status)).length,
    past: isSessionPast(s.date, s.endHour),
    checkInOpen: isCheckInOpen(s.date),
    myBooking: mine ? { status: mine.status, note: mine.note, earned: earned.get(s.id) ?? null } : null,
    bookings: viewer.isAdmin
      ? s.bookings.map((b) => ({ id: b.id, userId: b.userId, name: b.user.name, avatarSeed: b.user.profile?.avatarSeed ?? null, status: b.status, note: b.note }))
      : undefined,
  };
}

// Nächste gebuchte Sessions einer Person (für Profil & Dashboard)
export async function upcomingBookings(userId: string, take = 3) {
  return db.sessionBooking.findMany({
    where: { userId, status: "gebucht", session: { status: "geplant", date: { gte: startOfDay(new Date()) } } },
    include: { session: true },
    orderBy: [{ session: { date: "asc" } }, { session: { startHour: "asc" } }],
    take,
  });
}

// Nächste Slots mit freien Plätzen (Landingpage, Nestos Profil, Auftraggeber-Dashboard)
export async function nextFreeSlots(take = 3, type?: string) {
  const sessions = await db.nestoSession.findMany({
    where: { status: "geplant", date: { gte: startOfDay(new Date()) }, ...(type ? { type } : {}) },
    include: { _count: { select: { bookings: { where: { status: { in: ACTIVE_BOOKING } } } } } },
    orderBy: [{ date: "asc" }, { startHour: "asc" }],
    take: 40,
  });
  return sessions
    .filter((s) => !isSessionPast(s.date, s.endHour) && s._count.bookings < s.capacity)
    .slice(0, take)
    .map((s) => ({ ...s, free: s.capacity - s._count.bookings }));
}
