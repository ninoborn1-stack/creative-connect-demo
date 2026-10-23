"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { CITIES } from "@/lib/constants";

export type ProfileFormState = { error?: string } | undefined;

const AVAILABILITY_VALUES = ["verfuegbar", "teilweise", "ausgebucht"];

export async function updateProfile(_: ProfileFormState, formData: FormData): Promise<ProfileFormState> {
  const user = await requireUser();
  const profile = await db.profile.findUnique({ where: { userId: user.id } });
  if (!profile) return { error: "Du hast noch kein Kreativ-Profil." };

  const headline = String(formData.get("headline") ?? "").trim();
  const bio = String(formData.get("bio") ?? "").trim();
  const cityName = String(formData.get("city") ?? "");
  const dayRateMin = Math.round(Number(formData.get("dayRateMin")));
  const dayRateMax = Math.round(Number(formData.get("dayRateMax")));
  const travelRadiusKm = Math.round(Number(formData.get("travelRadiusKm") ?? profile.travelRadiusKm));
  const availability = String(formData.get("availability") ?? "");
  const skills = String(formData.get("skills") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 12);
  const instagram = String(formData.get("instagram") ?? "").trim() || null;
  const website = String(formData.get("website") ?? "").trim() || null;

  if (headline.length < 3) return { error: "Bitte gib eine aussagekräftige Headline an." };
  if (!Number.isFinite(dayRateMin) || !Number.isFinite(dayRateMax) || dayRateMin < 50) return { error: "Bitte gib einen Tagessatz ab 50 € an." };
  if (dayRateMax < dayRateMin) return { error: "Der Tagessatz „bis“ muss größer oder gleich „von“ sein." };
  if (!AVAILABILITY_VALUES.includes(availability)) return { error: "Bitte wähle eine Verfügbarkeit." };
  if (website && !/^https?:\/\//.test(website)) return { error: "Die Website muss mit https:// beginnen." };

  const city = CITIES.find((c) => c.name === cityName);
  await db.profile.update({
    where: { id: profile.id },
    data: {
      headline, bio, dayRateMin, dayRateMax, availability, instagram, website,
      travelRadiusKm: Number.isFinite(travelRadiusKm) && travelRadiusKm >= 0 ? travelRadiusKm : profile.travelRadiusKm,
      skills: JSON.stringify(skills),
      ...(city && city.name !== profile.city ? { city: city.name, state: city.state, lat: city.lat, lng: city.lng } : {}),
    },
  });
  revalidatePath(`/mitglieder/${profile.slug}`);
  revalidatePath("/mitglieder");
  revalidatePath("/dashboard");
  redirect(`/mitglieder/${profile.slug}?gespeichert=1`);
}

// Mock: Pro-Abo (12 €/Monat) testen bzw. beenden – keine echte Zahlung.
export async function toggleProTrial() {
  const user = await requireUser();
  const profile = await db.profile.findUnique({ where: { userId: user.id } });
  if (!profile) return { error: "Kein Profil vorhanden." };
  await db.profile.update({ where: { id: profile.id }, data: { isPro: !profile.isPro } });
  revalidatePath("/dashboard");
  revalidatePath(`/mitglieder/${profile.slug}`);
  return { isPro: !profile.isPro };
}
