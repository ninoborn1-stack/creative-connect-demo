import { db } from "@/lib/db";
import { FEATURES } from "@/lib/features";
import { PACKAGES } from "@/lib/packages";
import { VENUE_TYPES, categoryName } from "@/lib/constants";
import { formatDuration, workTypeLabel } from "@/lib/licensing";
import { formatDayShort, formatEur, parseJson } from "@/lib/format";
import { ticketsSold } from "@/lib/tickets";
import type { DiscoverItem } from "@/components/discover/discover-deck";

// Stapel für „Entdecken“ (App) und die Swipe-Demo auf der Startseite:
// Artists, Events mit Tickets, Werke (Musik & Stock), Pakete und Studios gemischt. excludeUserId blendet eigene Inhalte aus.
export async function getDiscoverItems(excludeUserId?: string): Promise<DiscoverItem[]> {
  const [profiles, works, venues, events] = await Promise.all([
    db.profile.findMany({
      where: { verified: true, ...(excludeUserId && { userId: { not: excludeUserId } }), user: { isCreative: true, status: { not: "gesperrt" } } },
      orderBy: [{ ratingAvg: "desc" }, { ratingCount: "desc" }],
      select: { slug: true, headline: true, city: true, categories: true, skills: true, dayRateMin: true, coverSeed: true, ratingAvg: true, user: { select: { name: true } } },
    }),
    FEATURES.musik
      ? db.licensableWork.findMany({
          where: excludeUserId ? { ownerId: { not: excludeUserId } } : {},
          orderBy: [{ featured: "desc" }, { plays: "desc" }],
          include: { owner: { select: { name: true } } },
        })
      : [],
    FEATURES.studios ? db.venue.findMany({ orderBy: [{ ratingAvg: "desc" }, { name: "asc" }] }) : [],
    FEATURES.events
      ? db.event.findMany({
          where: { ticketPrice: { not: null }, date: { gte: new Date() } },
          orderBy: { date: "asc" },
          include: { tickets: { select: { quantity: true } } },
        })
      : [],
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

  const eventItems: DiscoverItem[] = events.map((e) => {
    const soldOut = ticketsSold(e.tickets) >= e.capacity;
    return {
      key: `event:${e.slug}`,
      kind: "event",
      title: e.title,
      subtitle: `${formatDayShort(e.date)} · ${e.startTime} · ${e.venueName}, ${e.city}`,
      text: e.description,
      tags: [e.genre, ...parseJson<string[]>(e.lineup, []).slice(0, 2)].filter((t): t is string => Boolean(t)),
      image: e.imageSeed,
      price: soldOut ? "Ausverkauft" : `Tickets ab ${formatEur(e.ticketPrice ?? 0)}`,
      href: `/events/${e.slug}#tickets`,
      cta: soldOut ? "Ansehen" : "Ticket kaufen",
    };
  });

  // Gemischter Stapel: reihum Artist, Event, Werk, Paket, Werk, Studio – so wirkt jede Runde abwechslungsreich
  const pattern = [artistItems, eventItems, workItems, packageItems, workItems, venueItems];
  const used = new Map(pattern.map((list) => [list, 0]));
  const items: DiscoverItem[] = [];
  const total = artistItems.length + eventItems.length + workItems.length + packageItems.length + venueItems.length;
  for (let i = 0; items.length < total; i = (i + 1) % pattern.length) {
    const list = pattern[i];
    const n = used.get(list)!;
    if (n < list.length) {
      items.push(list[n]);
      used.set(list, n + 1);
    }
  }

  return items;
}
