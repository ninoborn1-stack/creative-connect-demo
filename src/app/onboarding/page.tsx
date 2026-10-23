import type { Metadata } from "next";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { parseJson } from "@/lib/format";
import { OnboardingWizard, type WizardInitial } from "@/components/onboarding/wizard";

export const metadata: Metadata = { title: "Profil einrichten" };

export default async function OnboardingPage() {
  const user = await requireUser();
  const p = user.profile;
  const portfolio = await db.portfolioItem.findMany({
    where: { userId: user.id, type: "bild", imageSeed: { not: null } },
    orderBy: { sort: "asc" },
    take: 6,
    select: { imageSeed: true },
  });
  const hasPortfolio = portfolio.length > 0;

  const initial: WizardInitial = {
    name: user.name,
    firstName: user.name.split(" ")[0] ?? user.name,
    alreadyOnboarded: user.onboarded,
    roles: { creative: user.isCreative || !user.isClient, client: user.isClient },
    categories: parseJson<string[]>(p?.categories, []),
    skills: parseJson<string[]>(p?.skills, []),
    headline: p?.headline ?? "",
    bio: p?.bio ?? "",
    city: p?.city ?? "Berlin",
    travelRadiusKm: p?.travelRadiusKm ?? 100,
    dayRateMin: p?.dayRateMin ?? 300,
    dayRateMax: p?.dayRateMax ?? 700,
    portfolioSeeds: hasPortfolio ? portfolio.map((i) => i.imageSeed!) : Array.from({ length: 6 }, (_, i) => `cc-onb-${user.id}-${i}`),
    portfolioLocked: hasPortfolio,
    taxIdProvided: p?.taxIdProvided ?? false,
    kskMember: p?.kskMember ?? false,
    profileMeta: p
      ? { slug: p.slug, avatarSeed: p.avatarSeed, coverSeed: p.coverSeed, verified: p.verified, ratingAvg: p.ratingAvg, ratingCount: p.ratingCount, isPro: p.isPro, availability: p.availability }
      : null,
    userId: user.id,
  };

  return <OnboardingWizard initial={initial} />;
}
