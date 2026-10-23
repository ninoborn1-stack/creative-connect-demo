"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { addDays, startOfDay } from "date-fns";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { getFees } from "@/lib/settings";
import { payments } from "@/lib/services/payments";
import { notify, sendMail } from "@/lib/services/mail";
import { VENUE_TYPES, CITIES } from "@/lib/constants";
import { formatDate, formatEur } from "@/lib/format";

// Buchbare Stunden: Slots von 9 bis 22 Uhr. Ganzer Tag belegt den kompletten Rahmen.
const OPEN_HOUR = 9;
const CLOSE_HOUR = 22;
const BOOKING_WINDOW_DAYS = 14;

export type BookVenueInput = { venueId: string; date: string; startHour: number; endHour: number; fullDay: boolean };
export type BookVenueResult =
  | { ok: true; bookingId: string; amount: number; serviceFee: number; providerRef: string }
  | { ok: false; error: string };

function parseDateKey(key: string) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key);
  if (!m) return null;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

export async function bookVenue(input: BookVenueInput): Promise<BookVenueResult> {
  const user = await requireUser();
  const venue = await db.venue.findUnique({ where: { id: input.venueId }, include: { owner: true } });
  if (!venue) return { ok: false, error: "Diese Venue gibt es nicht mehr." };
  if (venue.ownerId === user.id) return { ok: false, error: "Deine eigene Venue kannst du nicht buchen." };
  if (!venue.instantBook) return { ok: false, error: "Diese Venue ist nicht für Sofortbuchung freigeschaltet." };

  const day = parseDateKey(input.date);
  const today = startOfDay(new Date());
  if (!day || day < today || day >= addDays(today, BOOKING_WINDOW_DAYS)) return { ok: false, error: "Bitte wähle ein Datum in den nächsten 14 Tagen." };

  const fullDay = Boolean(input.fullDay);
  const startHour = fullDay ? OPEN_HOUR : Math.floor(input.startHour);
  const endHour = fullDay ? CLOSE_HOUR : Math.floor(input.endHour);
  if (startHour < OPEN_HOUR || endHour > CLOSE_HOUR || endHour <= startHour) return { ok: false, error: "Bitte wähle eine gültige Uhrzeit zwischen 9 und 22 Uhr." };

  const sameDay = await db.venueBooking.findMany({
    where: { venueId: venue.id, status: "bestaetigt", date: { gte: day, lt: addDays(day, 1) } },
  });
  const clash = sameDay.some((b) => {
    const bStart = b.fullDay ? OPEN_HOUR : b.startHour;
    const bEnd = b.fullDay ? CLOSE_HOUR : b.endHour;
    return startHour < bEnd && bStart < endHour;
  });
  if (clash) return { ok: false, error: "Der Zeitraum ist inzwischen belegt. Bitte wähle andere Slots." };

  const fees = await getFees();
  const hours = endHour - startHour;
  const amount = fullDay ? venue.pricePerDay : hours * venue.pricePerHour;
  const serviceFee = Math.round((amount * fees.serviceFeePct) / 100);
  const when = fullDay ? `${formatDate(day)}, ganzer Tag` : `${formatDate(day)}, ${startHour}–${endHour} Uhr`;

  const booking = await db.venueBooking.create({
    data: { venueId: venue.id, userId: user.id, date: day, startHour, endHour, fullDay, amount },
  });
  const payment = await payments.reserve({ payeeId: venue.ownerId, label: `Studio-Miete ${venue.name} (${when})`, amount, serviceFee });
  const providerRef = (await db.payment.findUnique({ where: { id: payment.id } }))?.providerRef ?? "";

  await notify(venue.ownerId, `Neue Buchung: ${venue.name}`, `${user.name} hat ${venue.name} gebucht – ${when}, ${formatEur(amount)}.`, `/studios/${venue.slug}`);
  await sendMail(
    venue.owner.email,
    `Neue Sofortbuchung für ${venue.name}`,
    `Hallo ${venue.owner.name.split(" ")[0]},\n\n${user.name} hat ${venue.name} gebucht: ${when}.\nMiete: ${formatEur(amount)} (reserviert beim Zahlungsdienstleister, Referenz ${providerRef}).\n\nDie Buchung findest du unter Studios & Locations → Meine Venues.\n\nDein Creative-Connect-Team`,
  );
  await sendMail(
    user.email,
    `Buchungsbestätigung ${venue.name}`,
    `Hallo ${user.name.split(" ")[0]},\n\ndeine Buchung ist bestätigt: ${venue.name}, ${venue.address} – ${when}.\nMiete ${formatEur(amount)} + Servicegebühr ${formatEur(serviceFee)} = ${formatEur(amount + serviceFee)} (Demo – keine echte Zahlung).\n\nViel Erfolg bei der Session!\nDein Creative-Connect-Team`,
  );

  revalidatePath("/studios");
  revalidatePath(`/studios/${venue.slug}`);
  revalidatePath("/finanzen");
  return { ok: true, bookingId: booking.id, amount, serviceFee, providerRef };
}

export type VenueFormState = { error?: string; fieldErrors?: Record<string, string>; values?: Record<string, string> } | undefined;

function echo(formData: FormData) {
  const values: Record<string, string> = {};
  for (const k of ["name", "type", "city", "address", "description", "pricePerHour", "pricePerDay", "capacity"]) values[k] = String(formData.get(k) ?? "");
  return values;
}

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function readVenueForm(formData: FormData) {
  const str = (k: string) => String(formData.get(k) ?? "").trim();
  const num = (k: string) => Number(str(k).replace(",", "."));
  const features = str("features")
    .split(/[,\n]/)
    .map((f) => f.trim())
    .filter(Boolean)
    .slice(0, 20);
  const data = {
    name: str("name"),
    type: str("type"),
    city: str("city"),
    address: str("address"),
    description: str("description"),
    features,
    pricePerHour: Math.round(num("pricePerHour")),
    pricePerDay: Math.round(num("pricePerDay")),
    capacity: Math.round(num("capacity")),
    instantBook: formData.get("instantBook") === "on" || formData.get("instantBook") === "true",
  };
  const fieldErrors: Record<string, string> = {};
  if (data.name.length < 3) fieldErrors.name = "Bitte gib einen Namen mit mindestens 3 Zeichen an.";
  if (!VENUE_TYPES[data.type]) fieldErrors.type = "Bitte wähle einen Typ.";
  if (!CITIES.some((c) => c.name === data.city)) fieldErrors.city = "Bitte wähle eine Stadt.";
  if (data.address.length < 5) fieldErrors.address = "Bitte gib eine Adresse an.";
  if (data.description.length < 20) fieldErrors.description = "Beschreibe die Venue in mindestens 20 Zeichen.";
  if (!(data.pricePerHour > 0)) fieldErrors.pricePerHour = "Preis pro Stunde muss größer als 0 sein.";
  if (!(data.pricePerDay > 0)) fieldErrors.pricePerDay = "Preis pro Tag muss größer als 0 sein.";
  if (!(data.capacity > 0)) fieldErrors.capacity = "Kapazität muss mindestens 1 sein.";
  return { data, fieldErrors };
}

export async function createVenue(_: VenueFormState, formData: FormData): Promise<VenueFormState> {
  const user = await requireUser();
  const { data, fieldErrors } = readVenueForm(formData);
  if (Object.keys(fieldErrors).length) return { error: "Bitte prüfe die markierten Felder.", fieldErrors, values: echo(formData) };

  const base = slugify(data.name) || "venue";
  let slug = base;
  for (let n = 2; await db.venue.findUnique({ where: { slug } }); n++) slug = `${base}-${n}`;

  await db.venue.create({
    data: {
      slug, ownerId: user.id, name: data.name, type: data.type, city: data.city, address: data.address,
      description: data.description, features: JSON.stringify(data.features), pricePerHour: data.pricePerHour,
      pricePerDay: data.pricePerDay, capacity: data.capacity, instantBook: data.instantBook,
      imageSeeds: JSON.stringify([0, 1, 2, 3].map((n) => `cc-venue-${slug}-${n}`)),
    },
  });
  revalidatePath("/studios");
  redirect(`/studios/${slug}?neu=1`);
}

export async function updateVenue(venueId: string, _: VenueFormState, formData: FormData): Promise<VenueFormState> {
  const user = await requireUser();
  const venue = await db.venue.findUnique({ where: { id: venueId } });
  if (!venue || (venue.ownerId !== user.id && !user.isAdmin)) return { error: "Du kannst nur deine eigenen Venues bearbeiten." };
  const { data, fieldErrors } = readVenueForm(formData);
  if (Object.keys(fieldErrors).length) return { error: "Bitte prüfe die markierten Felder.", fieldErrors, values: echo(formData) };

  await db.venue.update({
    where: { id: venue.id },
    data: {
      name: data.name, type: data.type, city: data.city, address: data.address, description: data.description,
      features: JSON.stringify(data.features), pricePerHour: data.pricePerHour, pricePerDay: data.pricePerDay,
      capacity: data.capacity, instantBook: data.instantBook,
    },
  });
  revalidatePath("/studios");
  revalidatePath(`/studios/${venue.slug}`);
  redirect(`/studios/${venue.slug}?gespeichert=1`);
}

export async function deleteVenue(venueId: string) {
  const user = await requireUser();
  const venue = await db.venue.findUnique({ where: { id: venueId } });
  if (!venue || (venue.ownerId !== user.id && !user.isAdmin)) return;
  await db.venue.delete({ where: { id: venue.id } });
  revalidatePath("/studios");
  redirect("/studios?geloescht=1");
}
