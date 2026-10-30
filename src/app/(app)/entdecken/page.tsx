import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { FEATURES } from "@/lib/features";
import { PACKAGES } from "@/lib/packages";
import { VENUE_TYPES, categoryName } from "@/lib/constants";
import { formatDuration, workTypeLabel } from "@/lib/licensing";
import { formatEur, parseJson } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { DiscoverDeck, type DiscoverItem } from "@/components/discover/discover-deck";

export const metadata = { title: "Entdecken" };

// App-Ansicht „Entdecken“: Artists, Werke (Musik & Stock), Pakete und Studios gemischt –
// als Swipe-Stapel (rechts = merken, links = weiter) oder als Feed zum Scrollen.
export default async function DiscoverPage() {
  const user = await requireUser();
  const [profiles, works, venues] = await Promise.all([
    db.profile.findMany({
      where: { verified: true, userId: { not: user.id }, user: { isCreative: true, status: { not: "gesperrt" } } },
      orderBy: [{ ratingAvg: "desc" }, { ratingCount: "desc" }],
      select: { slug: true, headline: true, city: true, categories: true, skills: true, dayRateMin: true, coverSeed: true, ratingAvg: true, user: { select: { name: true } } },
    }),
    FEATURES.musik
      ? db.licensableWork.findMany({
          where: { ownerId: { not: user.id } },
          orderBy: [{ featured: "desc" }, { plays: "desc" }],
          include: { owner: { select: { name: true } } },
        })
      : [],
    FEATURES.studios ? db.venue.findMany({ orderBy: [{ ratingAvg: "desc" }, { name: "asc" }] }) : [],
  ]);

  const artistItems: DiscoverItem[] = profiles.map((p) => ({
    key: `artist:${p.slug}`,
    kind: "artist",
    title: p.user.name,
    subtitle: [categoryName(parseJson<string[]>(p.categories, [])[0] ?? ""), p.city].filter(Boolean).join(" · "),
    text: p.headline,
    tags: parseJson<string[]>(p.skills, []).slice(0, 3),
    image: p.coverSeed,
    price: p.dayRateMin ? `ab ${formatEur(p.dayRateMin)} / Tag` : undefined,
    href: `/mitglieder/${p.slug}`,
    cta: "Profil & anfragen",
  }));

  const workItems: DiscoverItem[] = works.map((w) => ({
    key: `werk:${w.slug}`,
    kind: "werk",
    title: w.title,
    subtitle: [workTypeLabel(w.type), w.owner.name, formatDuration(w.durationSec)].filter(Boolean).join(" · "),
    text: w.description,
    tags: parseJson<string[]>(w.tags, []).slice(0, 3),
    image: w.imageSeed,
    audio: w.previewUrl && ["track", "beat", "sfx", "stems", "voice"].includes(w.type) ? w.previewUrl : undefined,
    price: FEATURES.lizenzen ? `lizenzfrei ab ${formatEur(w.priceStandard)}` : "auf Anfrage",
    href: `/lizenzen/${w.slug}`,
    cta: FEATURES.lizenzen ? "Lizenzieren" : "Anfragen",
  }));

  const packageItems: DiscoverItem[] = PACKAGES.map((p) => ({
    key: `paket:${p.slug}`,
    kind: "paket",
    title: p.name,
    subtitle: `Paket · Lieferung ${p.delivery}`,
    text: p.tagline,
    tags: p.includes.slice(0, 3),
    image: p.imageSeed,
    price: `ab ${formatEur(p.price)}`,
    href: `/paket-anfrage?paket=${p.slug}`,
    cta: "Paket anfragen",
  }));

  const venueItems: DiscoverItem[] = venues.map((v) => ({
    key: `studio:${v.slug}`,
    kind: "studio",
    title: v.name,
    subtitle: `${VENUE_TYPES[v.type] ?? v.type} · ${v.city}`,
    text: v.description,
    tags: parseJson<string[]>(v.features, []).slice(0, 3),
    image: parseJson<string[]>(v.imageSeeds, [])[0] ?? `cc-venue-${v.slug}-0`,
    price: `ab ${formatEur(v.pricePerHour)} / Std`,
    href: `/studios/${v.slug}`,
    cta: "Termin buchen",
  }));

  // Gemischter Stapel: reihum Artist, Werk, Paket, Werk, Studio – so wirkt jede Runde abwechslungsreich
  const pattern = [artistItems, workItems, packageItems, workItems, venueItems];
  const used = new Map(pattern.map((list) => [list, 0]));
  const items: DiscoverItem[] = [];
  const total = artistItems.length + workItems.length + packageItems.length + venueItems.length;
  for (let i = 0; items.length < total; i = (i + 1) % pattern.length) {
    const list = pattern[i];
    const n = used.get(list)!;
    if (n < list.length) {
      items.push(list[n]);
      used.set(list, n + 1);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Entdecken" description="Rechts wischen merkt, links geht’s weiter." />
      <DiscoverDeck items={items} />
    </div>
  );
}
