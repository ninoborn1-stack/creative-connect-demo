// Gemeinsame Helfer für Nestos Produktionskalender (Server + Client, keine DB-Zugriffe).
import { addHours, endOfDay } from "date-fns";
import { SESSION_TYPES } from "@/lib/constants";

export type SessionBookingDto = {
  id: string;
  userId: string;
  name: string;
  avatarSeed: string | null;
  status: string;
  note: string | null;
};

export type SessionDto = {
  id: string;
  type: string;
  title: string;
  description: string;
  date: string; // ISO, Tag 00:00 Ortszeit
  startHour: number;
  endHour: number;
  location: string;
  capacity: number;
  points: number;
  status: string; // geplant | abgesagt
  taken: number;
  past: boolean; // Ende liegt in der Vergangenheit
  checkInOpen: boolean; // heute oder vergangen → Check-in möglich
  myBooking: { status: string; note: string | null; earned: number | null } | null;
  bookings?: SessionBookingDto[]; // nur für Nesto/Admins
};

// Typ-Farben (nur Tokens bzw. Tailwind-Paletten wie in badges.tsx)
export const SESSION_TONE: Record<string, string> = {
  beat: "bg-primary/15 text-primary",
  songwriting: "bg-fuchsia-500/15 text-fuchsia-600 dark:text-fuchsia-300",
  "mix-feedback": "bg-sky-500/15 text-sky-600 dark:text-sky-300",
  "open-studio": "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300",
  podcast: "bg-amber-500/15 text-amber-600 dark:text-amber-300",
  workshop: "bg-violet-500/15 text-violet-600 dark:text-violet-300",
};

export function sessionTypeLabel(type: string) {
  return SESSION_TYPES[type]?.label ?? type;
}

export function sessionEnd(date: Date, endHour: number) {
  return addHours(date, endHour);
}

export function isSessionPast(date: Date, endHour: number, now = new Date()) {
  return sessionEnd(date, endHour) < now;
}

export function isCheckInOpen(date: Date, now = new Date()) {
  return date <= endOfDay(now);
}

export function timeLabel(startHour: number, endHour: number) {
  return `${startHour}–${endHour} Uhr`;
}

// Aktive Buchungen belegen einen Platz (abgesagte nicht)
export const ACTIVE_BOOKING = ["gebucht", "teilgenommen"];
