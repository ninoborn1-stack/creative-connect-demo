"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { storeFile } from "@/lib/services/storage";
import { CATEGORIES, CITIES } from "@/lib/constants";

export type OnboardingInput = {
  roles: { creative: boolean; client: boolean };
  categories: string[];
  skills: string[];
  headline: string;
  bio: string;
  city: string;
  travelRadiusKm: number;
  dayRateMin: number;
  dayRateMax: number;
  portfolioSeeds: string[];
  taxIdProvided: boolean;
  kskMember: boolean;
};

export type OnboardingResult = { ok: true; slug: string | null } | { ok: false; error: string };

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss")
    .normalize("NFKD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "mitglied";
}

async function uniqueSlug(base: string, userId: string) {
  let slug = base;
  for (let i = 2; ; i++) {
    const hit = await db.profile.findUnique({ where: { slug }, select: { userId: true } });
    if (!hit || hit.userId === userId) return slug;
    slug = `${base}-${i}`;
  }
}

const clampInt = (v: unknown, min: number, max: number, fallback: number) => {
  const n = Math.round(Number(v));
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
};

export async function completeOnboarding(formData: FormData): Promise<OnboardingResult> {
  const user = await requireUser();
  let input: OnboardingInput;
  try {
    input = JSON.parse(String(formData.get("data") ?? ""));
  } catch {
    return { ok: false, error: "Die Angaben konnten nicht gelesen werden." };
  }

  const isCreative = !!input.roles?.creative;
  const isClient = !!input.roles?.client;
  if (!isCreative && !isClient) return { ok: false, error: "Bitte wähle mindestens eine Rolle." };

  let slug: string | null = user.profile?.slug ?? null;

  if (isCreative) {
    const categories = (input.categories ?? []).filter((c) => CATEGORIES.some((k) => k.slug === c));
    if (!categories.length) return { ok: false, error: "Bitte wähle mindestens einen Bereich." };
    const city = CITIES.find((c) => c.name === input.city) ?? CITIES[0];
    const skills = (input.skills ?? []).map((s) => String(s).trim()).filter(Boolean).slice(0, 20);
    const dayRateMin = clampInt(input.dayRateMin, 50, 5000, 300);
    const dayRateMax = Math.max(dayRateMin, clampInt(input.dayRateMax, 50, 5000, 600));
    const headline = String(input.headline ?? "").trim().slice(0, 80) || `${CATEGORIES.find((c) => c.slug === categories[0])?.name} in ${city.name}`;
    const bio = String(input.bio ?? "").trim().slice(0, 1200) || "Neu im Netzwerk – mein Profil wächst gerade.";

    slug = await uniqueSlug(user.profile?.slug ?? slugify(user.name), user.id);
    const data = {
      headline, bio, city: city.name, state: city.state, lat: city.lat, lng: city.lng,
      travelRadiusKm: clampInt(input.travelRadiusKm, 0, 1000, 100),
      categories: JSON.stringify(categories), skills: JSON.stringify(skills), dayRateMin, dayRateMax,
      taxIdProvided: !!input.taxIdProvided, kskMember: !!input.kskMember,
    };
    await db.profile.upsert({
      where: { userId: user.id },
      update: data,
      create: { ...data, userId: user.id, slug, avatarSeed: `cc-${slug}`, coverSeed: `cc-cover-${slug}` },
    });

    // Portfolio: vorausgefüllte Stock-Bilder nur beim ersten Mal, Uploads immer anhängen
    const existing = await db.portfolioItem.count({ where: { userId: user.id } });
    let sort = existing;
    if (existing === 0) {
      const seeds = (input.portfolioSeeds ?? []).map(String).slice(0, 12);
      if (seeds.length) {
        await db.portfolioItem.createMany({
          data: seeds.map((seed, i) => ({ userId: user.id, type: "bild", title: `Arbeit ${i + 1}`, imageSeed: seed, sort: sort++ })),
        });
      }
    }
    const uploads = formData.getAll("files").filter((f): f is File => f instanceof File && f.size > 0).slice(0, 6);
    for (const file of uploads) {
      if (!file.type.startsWith("image/") || file.size > 8 * 1024 * 1024) continue;
      const stored = await storeFile(file);
      await db.portfolioItem.create({
        data: { userId: user.id, type: "bild", title: file.name.replace(/\.[^.]+$/, "").slice(0, 60) || "Upload", url: stored.url, imageSeed: `cc-upload-${slug}-${sort}`, sort: sort++ },
      });
    }
  }

  await db.user.update({ where: { id: user.id }, data: { isCreative, isClient, onboarded: true } });
  revalidatePath("/", "layout");
  return { ok: true, slug: isCreative ? slug : null };
}
