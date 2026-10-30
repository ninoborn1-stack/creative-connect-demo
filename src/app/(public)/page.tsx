import Link from "next/link";
import { ArrowUpRight, Check } from "lucide-react";
import { db } from "@/lib/db";
import { getMarketplaceMode } from "@/lib/settings";
import { MARKETPLACE_MODES, VENUE_TYPES, categoryName } from "@/lib/constants";
import { formatEur, formatNumber, parseJson } from "@/lib/format";
import { PACKAGES } from "@/lib/packages";
import { FEATURES, ROADMAP, placeFounder } from "@/lib/features";
import { formatDuration, workTypeLabel } from "@/lib/licensing";
import { AudioPlayer } from "@/components/members/audio-player";
import { StockImage } from "@/components/stock-image";
import { UserAvatar } from "@/components/user-avatar";
import { CtaLink, Eyebrow, FaqList, Marquee, Section, SectionHeading, Wordmark } from "@/components/public/landing-bits";
import { stockPhoto } from "@/lib/stock";
import { Hero } from "@/components/public/hero";
import { DiscoverDeck } from "@/components/discover/discover-deck";
import { getDiscoverItems } from "@/lib/discover";

const FAQ = [
  { q: "Was ist in einem Paket enthalten?", a: "Jedes Paket hat einen festen Umfang und einen Startpreis. Nach deiner Anfrage stellen Nesto und das Team die passenden Artists zusammen und schicken dir ein verbindliches Angebot – erst dann entscheidest du." },
  { q: "Wie frage ich einen Artist direkt an?", a: "Profil öffnen, Hörproben und Arbeiten ansehen, auf „Anfragen“ klicken. Du beschreibst kurz Projekt, Termin und Budget – der Artist nimmt an, lehnt ab oder macht ein Gegenangebot." },
  { q: "Wie werde ich Teil des Netzwerks?", a: "Bewirb dich mit Portfolio und Links. Das Team um Nesto prüft jede Bewerbung persönlich. Wer aus Nestos Netzwerk kommt, ist per Fast-Track schneller drin." },
  { q: "Wem gehören die Rechte an den Ergebnissen?", a: "Das regelt jeder Auftrag ausdrücklich im Vertrag – Nutzung, Gebiet und Laufzeit. Für Brands sind Buyouts möglich." },
];

export default async function LandingPage() {
  const [mode, creativeCount, brandRows, profiles, review, tracks, venues, discover] = await Promise.all([
    getMarketplaceMode(),
    db.profile.count(),
    db.company.findMany({ where: { verified: true }, orderBy: { name: "asc" }, select: { name: true } }),
    db.profile.findMany({
      where: { verified: true, user: { isCreative: true, status: { not: "gesperrt" } } },
      orderBy: [{ ratingAvg: "desc" }, { ratingCount: "desc" }],
      select: { slug: true, city: true, categories: true, coverSeed: true, user: { select: { name: true, isAdmin: true } } },
    }),
    db.review.findFirst({
      where: { rating: 5, author: { isClient: true }, target: { isCreative: true } },
      orderBy: { createdAt: "desc" },
      include: { author: { select: { name: true, company: true, jobTitle: true, profile: { select: { avatarSeed: true } } } } },
    }),
    FEATURES.musik
      ? db.licensableWork.findMany({
          where: { type: { in: ["track", "beat"] }, previewUrl: { not: null } },
          orderBy: [{ featured: "desc" }, { plays: "desc" }],
          take: 3,
          include: { owner: { select: { name: true } } },
        })
      : [],
    FEATURES.studios ? db.venue.findMany({ orderBy: [{ ratingAvg: "desc" }, { name: "asc" }], take: 3 }) : [],
    FEATURES.entdecken ? getDiscoverItems().then((items) => items.slice(0, 15)) : [],
  ]);

  const phaseIndex = mode === "closed" ? 0 : mode === "clients" ? 1 : 2;
  const canRegister = mode !== "closed";
  const brandNames = brandRows.map((c) => c.name).filter((n) => !n.includes("(Independent)"));
  // Nesto (Gründer) auf Platz 3 der Auswahl
  const artists = placeFounder([...profiles.filter((p) => !p.user.isAdmin).slice(0, 5), ...profiles.filter((p) => p.user.isAdmin)], (p) => p.user.isAdmin).slice(0, 6);
  const cheapest = Math.min(...PACKAGES.map((p) => p.price));

  const ways = [
    { n: "01", title: "Paket buchen", text: `Feste Produktionen zum Startpreis – ab ${formatEur(cheapest)}.`, href: "/pakete", cta: "Pakete ansehen", image: "id:39", featured: true },
    { n: "02", title: "Artist anfragen", text: "Profile ansehen, reinhören, direkt anfragen.", href: "/mitglieder", cta: "Artists finden", image: "id:96" },
    { n: "03", title: "Als Artist anbieten", text: "Profil anlegen, gefunden werden, Anfragen bekommen.", href: "/bewerben", cta: "Jetzt bewerben", image: "id:145" },
  ];

  return (
    <>
      {/* ---------- Hero: DJ-Pult-Intro + Scroll-Übergang ---------- */}
      <Hero
        image={stockPhoto(453, 2400, 1600)} // Band auf der Bühne im Spotlight
        phaseLabel={MARKETPLACE_MODES[phaseIndex].label}
        creativeCount={creativeCount}
        companyCount={brandNames.length}
        packageCount={PACKAGES.length}
      />

      {/* ---------- Statement: kurz und laut ---------- */}
      <section aria-labelledby="statement-title" className="gutter pt-24 pb-16 sm:pt-36 sm:pb-24">
        <Eyebrow>01 — Creative Connect</Eyebrow>
        <h2 id="statement-title" className="poster mt-8 text-[clamp(3rem,9.5vw,10.5rem)]">
          Ein Netzwerk. <span className="text-primary">Drei Wege rein.</span>
        </h2>
        <p className="mt-8 max-w-xl text-lg text-pretty text-muted-foreground sm:text-xl">
          {formatNumber(creativeCount)} geprüfte Artists aus Musik, Video, Foto und Design – kuratiert von Nesto.
        </p>
      </section>

      {/* ---------- Brands: Laufband, knallig ---------- */}
      {brandNames.length > 0 && (
        <section aria-labelledby="logos-title" className="bg-primary py-8 text-primary-foreground sm:py-12">
          <h2 id="logos-title" className="meta gutter mb-6 text-primary-foreground/75">Brands im Netzwerk</h2>
          <Marquee
            items={brandNames.map((n) => <Wordmark key={n} name={n} className="text-[clamp(2.4rem,6vw,5.5rem)] text-primary-foreground" />)}
            speed="60s"
            separator={<span className="text-[var(--bone)]/50">/</span>}
          />
        </section>
      )}

      {/* ---------- Entdecken: die App-Ansicht live zum Ausprobieren ---------- */}
      {discover.length > 0 && (
        <section id="entdecken" aria-labelledby="discover-title" className="gutter grid scroll-mt-16 items-center gap-12 bg-[var(--ink)] py-20 text-[var(--bone)] sm:py-28 lg:grid-cols-12">
          <div className="lg:col-span-6">
            <p className="meta flex items-center gap-3 text-white/60"><span aria-hidden className="size-2 bg-[var(--signal)]" />02 — Neu in der App</p>
            <h2 id="discover-title" className="poster mt-6 text-[clamp(2.8rem,7vw,7.5rem)]">Wischen. Merken. <span className="text-[var(--signal)]">Buchen.</span></h2>
            <p className="mt-6 max-w-lg text-white/75 sm:text-lg">
              Artists, Musik & Stock, Pakete und Studios in einem Stapel. Probier’s direkt hier aus – so sieht es nach dem Login in deinem Konto aus.
            </p>
            <ol className="mt-10 grid max-w-lg gap-px border border-white/15 bg-white/15 sm:grid-cols-3">
              {[
                ["→", "Rechts wischen", "merkt Artist, Track oder Paket"],
                ["←", "Links wischen", "zeigt das Nächste"],
                ["♥", "Gemerkt", "anfragen, lizenzieren, buchen"],
              ].map(([icon, title, text]) => (
                <li key={title} className="flex items-baseline gap-4 bg-[var(--ink)] px-4 py-3 sm:block sm:p-4">
                  <span aria-hidden className="poster w-5 shrink-0 text-2xl text-[var(--signal)]">{icon}</span>
                  <div>
                    <p className="font-semibold sm:mt-3">{title}</p>
                    <p className="mt-0.5 text-sm text-white/60 sm:mt-1">{text}</p>
                  </div>
                </li>
              ))}
            </ol>
            <div className="mt-10 flex flex-col gap-2 sm:flex-row">
              <CtaLink href="/entdecken" variant="light">In der App entdecken <ArrowUpRight className="size-4" aria-hidden /></CtaLink>
            </div>
            {ROADMAP.length > 0 && (
              <p className="meta mt-8 text-white/50">Als Nächstes: {ROADMAP.map((r) => r.label).join(", ")}</p>
            )}
          </div>
          <div className="flex justify-center lg:col-span-6">
            <div className="dark relative h-[640px] w-full max-w-[360px] sm:h-[700px] rounded-[2.75rem] border-[10px] border-neutral-800 bg-background p-3 pt-8 text-foreground shadow-2xl" data-testid="discover-demo">
              <span aria-hidden className="absolute top-2.5 left-1/2 h-5 w-24 -translate-x-1/2 rounded-full bg-neutral-800" />
              <DiscoverDeck items={discover} demo />
            </div>
          </div>
        </section>
      )}

      {/* ---------- Drei Wege als aufklappende Bildstreifen ---------- */}
      <section id="so-gehts" aria-labelledby="ways-title" className="scroll-mt-16 pt-20 sm:pt-32">
        <div className="gutter">
          <Eyebrow>03 — So geht’s</Eyebrow>
          <h2 id="ways-title" className="poster mt-6 text-[clamp(2.6rem,7.4vw,8rem)]">Wähl deinen Weg.</h2>
        </div>
        <ul className="ind-strip mt-14 sm:mt-20">
          {ways.map((w) => (
            <li key={w.n} data-featured={w.featured ? "" : undefined} className="group relative isolate overflow-hidden border-t border-white/10 bg-[var(--ink)] text-[var(--bone)] lg:border-t-0 lg:border-l">
              <StockImage
                seed={w.image}
                w={1200}
                h={1200}
                sizes="(max-width: 1024px) 100vw, 60vw"
                className="-z-10 opacity-60 grayscale transition-all duration-700 group-hover:scale-105 group-hover:opacity-85 group-hover:grayscale-0"
              />
              <div className="absolute inset-0 -z-10 bg-gradient-to-t from-[var(--ink)] via-[var(--ink)]/30 to-transparent" />
              <div className="flex h-full min-h-[22rem] flex-col justify-between gap-6 p-5 lg:min-h-0 lg:p-8">
                <span className="meta text-white/70">{w.n}</span>
                <div>
                  <h3 className="poster text-[clamp(2.8rem,5vw,6rem)]">
                    <Link href={w.href} className="after:absolute after:inset-0">{w.title}</Link>
                  </h3>
                  <div className="ind-strip__more">
                    <div>
                      <p className="mt-3 max-w-sm text-white/80 sm:text-lg">{w.text}</p>
                      <span className="meta mt-6 inline-flex items-center gap-2 bg-[var(--signal)] px-4 py-3 text-white">
                        {w.cta} <ArrowUpRight className="size-4" aria-hidden />
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* ---------- Pakete ---------- */}
      <Section id="pakete" labelledBy="pkg-title">
        <SectionHeading id="pkg-title" index="04" eyebrow="Pakete" title="Fertig geschnürt." text="Fester Umfang, klarer Startpreis. Die Crew stellt Nesto mit dem Team zusammen." />
        <ul className="mt-14 flex snap-x snap-mandatory gap-px overflow-x-auto overscroll-x-contain border bg-border [scrollbar-width:none] sm:grid sm:grid-cols-2 sm:overflow-visible xl:grid-cols-4" aria-label="Pakete">
          {PACKAGES.map((p) => (
            <li key={p.slug} className="group relative flex w-[82%] shrink-0 snap-start flex-col bg-background sm:w-auto">
              <div className="relative aspect-[4/3] overflow-hidden">
                <StockImage seed={p.imageSeed} w={800} h={600} sizes="(max-width: 640px) 100vw, 25vw" className="grayscale-[40%] transition-all duration-700 group-hover:scale-105 group-hover:grayscale-0" />
                {p.featured && <span className="meta absolute top-3 left-3 bg-[var(--signal)] px-2 py-1 text-white">Beliebt</span>}
              </div>
              <div className="flex flex-1 flex-col p-5 sm:p-6">
                <h3 className="poster text-[clamp(2rem,3vw,2.8rem)]">
                  <Link href={`/pakete#${p.slug}`} className="after:absolute after:inset-0 group-hover:text-primary">{p.name}</Link>
                </h3>
                <p className="meta mt-2 text-primary">ab {formatEur(p.price)}</p>
                <ul className="mt-5 space-y-1.5 text-sm text-muted-foreground">
                  {p.includes.slice(0, 3).map((i) => (
                    <li key={i} className="flex gap-2"><Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />{i}</li>
                  ))}
                </ul>
              </div>
            </li>
          ))}
        </ul>
        <p className="meta mt-3 text-muted-foreground sm:hidden" aria-hidden>← Wischen für mehr →</p>
        <div className="mt-8">
          <CtaLink href="/pakete">Alle Pakete <ArrowUpRight className="size-4" aria-hidden /></CtaLink>
        </div>
      </Section>

      {/* ---------- Musik & Stock: reinhören, dann lizenzieren oder anfragen ---------- */}
      {tracks.length > 0 && (
        <Section id="musik" labelledBy="music-title" className="border-t">
          <SectionHeading id="music-title" index="05" eyebrow="Musik & Stock" title={FEATURES.lizenzen ? "Reinhören. Lizenzieren." : "Reinhören. Anfragen."} text={FEATURES.lizenzen ? "Tracks, Beats, Fotos und Footage aus dem Netzwerk – lizenzfrei nutzen: einmal zahlen, mit Zertifikat. Oder individuell beim Artist anfragen." : "Tracks, Beats, Fotos und Footage aus dem Netzwerk – die Nutzung fragst du direkt beim Artist an."} />
          <ul className="mt-14 grid gap-px border bg-border lg:grid-cols-3">
            {tracks.map((t) => (
              <li key={t.id} className="bg-background p-4 sm:p-6">
                <AudioPlayer src={t.previewUrl!} title={t.title} subtitle={[t.owner.name, workTypeLabel(t.type), formatDuration(t.durationSec)].filter(Boolean).join(" · ")} className="border-0 bg-transparent p-0" />
              </li>
            ))}
          </ul>
          <div className="mt-8">
            <CtaLink href="/lizenzen">Musik & Stock öffnen <ArrowUpRight className="size-4" aria-hidden /></CtaLink>
          </div>
        </Section>
      )}

      {/* ---------- Studios & Locations: drei Räume als Bildkacheln ---------- */}
      {venues.length > 0 && (
        <section id="studios" aria-labelledby="studios-title" className="scroll-mt-16 border-t pt-20 sm:pt-32">
          <div className="gutter">
            <SectionHeading id="studios-title" index="06" eyebrow="Studios & Locations" title="Der Raum dazu." text="Tonstudios, Fotostudios, Proberäume und Locations aus dem Netzwerk – stunden- oder tageweise, sofort buchbar." />
          </div>
          <ul className="mt-14 grid gap-px bg-border sm:mt-20 md:grid-cols-3">
            {venues.map((v) => (
              <li key={v.id} className="group relative aspect-[4/3] overflow-hidden bg-[var(--ink)] text-[var(--bone)] md:aspect-[3/4] lg:aspect-[4/5]">
                <StockImage seed={parseJson<string[]>(v.imageSeeds, [])[0] ?? `cc-venue-${v.slug}-0`} w={900} h={1100} sizes="(max-width: 768px) 100vw, 33vw" className="opacity-80 grayscale-[30%] transition-all duration-700 group-hover:scale-105 group-hover:opacity-100 group-hover:grayscale-0" />
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--ink)] via-transparent to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
                  <p className="meta text-white/70">{VENUE_TYPES[v.type] ?? v.type} · {v.city}</p>
                  <h3 className="poster mt-2 text-[clamp(1.8rem,2.8vw,2.8rem)]">
                    <Link href={`/studios/${v.slug}`} className="after:absolute after:inset-0">{v.name}</Link>
                  </h3>
                  <p className="meta mt-2 text-[var(--signal)]">ab {formatEur(v.pricePerHour)} / Std</p>
                </div>
              </li>
            ))}
          </ul>
          <div className="gutter py-8">
            <CtaLink href="/studios" variant="outline">Alle Studios & Locations <ArrowUpRight className="size-4" aria-hidden /></CtaLink>
          </div>
        </section>
      )}

      {/* ---------- Artists: Porträts über die volle Breite ---------- */}
      {artists.length > 0 && (
        <section id="artists" aria-labelledby="artists-title" className="scroll-mt-16 border-t pt-20 sm:pt-32">
          <div className="gutter">
            <SectionHeading id="artists-title" index="07" eyebrow="Artists" title="Direkt anfragen." text="Hörproben, Arbeiten, Preisrahmen – und ein Klick zur Anfrage." />
          </div>
          <ul className="mt-14 grid grid-cols-2 gap-px bg-border sm:mt-20 md:grid-cols-3 xl:grid-cols-6">
            {artists.map((a) => (
              <li key={a.slug} className="group relative aspect-[3/4] overflow-hidden bg-[var(--ink)] text-[var(--bone)]">
                <StockImage seed={a.coverSeed} w={600} h={800} sizes="(max-width: 768px) 50vw, 17vw" className="opacity-75 grayscale transition-all duration-700 group-hover:scale-105 group-hover:opacity-100 group-hover:grayscale-0" />
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--ink)] via-transparent to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-4">
                  <p className="meta text-white/70">{categoryName(parseJson<string[]>(a.categories, [])[0] ?? "")} · {a.city}</p>
                  <h3 className="poster mt-2 text-[clamp(1.6rem,2.4vw,2.4rem)]">
                    <Link href={`/mitglieder/${a.slug}`} className="after:absolute after:inset-0">{a.user.name}</Link>
                  </h3>
                </div>
              </li>
            ))}
          </ul>
          <div className="gutter py-8">
            <CtaLink href="/mitglieder" variant="outline">Alle Artists <ArrowUpRight className="size-4" aria-hidden /></CtaLink>
          </div>
        </section>
      )}

      {/* ---------- Stimme ---------- */}
      {review && (
        <Section id="stimmen" labelledBy="voices-title" className="border-t">
          <Eyebrow>08 — Referenz</Eyebrow>
          <h2 id="voices-title" className="sr-only">Was Auftraggeber sagen</h2>
          <figure className="mt-10">
            <blockquote className="font-[family-name:var(--font-serif)] text-[clamp(1.9rem,4.4vw,4.6rem)] leading-[1.08] font-light tracking-[-0.02em] text-balance">
              <span className="text-primary">„</span>{review.text}<span className="text-primary">“</span>
            </blockquote>
            <figcaption className="mt-8 flex items-center gap-4">
              <UserAvatar name={review.author.name} seed={review.author.profile?.avatarSeed ?? `client-${review.authorId}`} className="size-11" />
              <div className="min-w-0">
                <p className="font-semibold">{review.author.name}</p>
                <p className="meta mt-1 truncate text-muted-foreground">{[review.author.jobTitle, review.author.company].filter(Boolean).join(" · ") || "Auftraggeber:in"}</p>
              </div>
            </figcaption>
          </figure>
        </Section>
      )}

      {/* ---------- Für Artists: Split über die volle Breite ---------- */}
      <section id="kreative" aria-labelledby="creatives-title" className="grid scroll-mt-16 lg:grid-cols-2">
        <div className="relative min-h-[50svh] lg:min-h-[80svh]">
          <StockImage seed="id:145" w={1400} h={1400} sizes="(max-width: 1024px) 100vw, 50vw" className="grayscale-[30%]" />
        </div>
        <div className="gutter flex flex-col justify-center bg-primary py-16 text-primary-foreground sm:py-24">
          <p className="meta flex items-center gap-3 text-primary-foreground/75"><span aria-hidden className="size-2 bg-[var(--bone)]" />09 — Für Artists</p>
          <h2 id="creatives-title" className="poster mt-6 text-[clamp(2.8rem,6vw,6.5rem)]">Zeig, was du kannst.</h2>
          <p className="mt-6 max-w-lg text-primary-foreground/85 sm:text-lg">
            Profil anlegen, Brands fragen an. Dazu Kooperationen mit Artists aus Nestos Netzwerk und Punkte für Vorteile in der Community.
          </p>
          <div className="mt-10 flex flex-col gap-2 sm:flex-row">
            <CtaLink href="/bewerben" variant="light">Als Artist bewerben <ArrowUpRight className="size-4" aria-hidden /></CtaLink>
            <CtaLink href="/fuer-kreative" variant="ghost">Mehr erfahren</CtaLink>
          </div>
        </div>
      </section>

      {/* ---------- FAQ ---------- */}
      <Section id="faq" labelledBy="faq-title">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:sticky lg:top-24 lg:col-span-4 lg:self-start">
            <Eyebrow>10 — FAQ</Eyebrow>
            <h2 id="faq-title" className="poster mt-6 text-[clamp(2.8rem,6vw,6.5rem)]">Kurz gefragt.</h2>
          </div>
          <div className="lg:col-span-8">
            <FaqList items={FAQ} />
          </div>
        </div>
      </Section>

      {/* ---------- Abschluss-CTA ---------- */}
      <section aria-labelledby="cta-title" className="gutter border-t py-24 sm:py-36">
        <h2 id="cta-title" className="poster text-[clamp(3.4rem,11.5vw,13rem)]">
          Dein nächstes Projekt <span className="text-primary">beginnt hier.</span>
        </h2>
        <div className="mt-12 flex flex-col gap-2 border-t pt-8 sm:flex-row">
          <CtaLink href="/pakete">Paket buchen <ArrowUpRight className="size-4" aria-hidden /></CtaLink>
          {canRegister && <CtaLink href="/registrieren" variant="outline">Projekt starten</CtaLink>}
          <CtaLink href="/bewerben" variant="outline">Als Artist anbieten</CtaLink>
        </div>
      </section>
    </>
  );
}
