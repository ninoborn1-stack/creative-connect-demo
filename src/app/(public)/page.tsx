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
import { cn } from "@/lib/utils";

const FAQ = [
  { q: "Was ist in einem Paket enthalten?", a: "Jedes Paket hat einen festen Umfang und einen Startpreis. Nach deiner Anfrage stellen Nesto und das Team die passenden Artists zusammen und schicken dir ein verbindliches Angebot – erst dann entscheidest du." },
  { q: "Wie frage ich einen Artist direkt an?", a: "Profil öffnen, Hörproben und Arbeiten ansehen, auf „Anfragen“ klicken. Du beschreibst kurz Projekt, Termin und Budget – der Artist nimmt an, lehnt ab oder macht ein Gegenangebot." },
  { q: "Wie werde ich Teil des Netzwerks?", a: "Bewirb dich mit Portfolio und Links. Das Team um Nesto prüft jede Bewerbung persönlich. Wer aus Nestos Netzwerk kommt, ist per Fast-Track schneller drin." },
  { q: "Wem gehören die Rechte an den Ergebnissen?", a: "Das regelt jeder Auftrag ausdrücklich im Vertrag – Nutzung, Gebiet und Laufzeit. Für Brands sind Buyouts möglich." },
];

export default async function LandingPage() {
  const [mode, creativeCount, brandRows, profiles, review, tracks, venues] = await Promise.all([
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

      {/* ---------- Drei Wege als aufklappende Bildstreifen ---------- */}
      <section id="so-gehts" aria-labelledby="ways-title" className="scroll-mt-16 pt-20 sm:pt-32">
        <div className="gutter">
          <Eyebrow>02 — So geht’s</Eyebrow>
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
        <SectionHeading id="pkg-title" index="03" eyebrow="Pakete" title="Fertig geschnürt." text="Fester Umfang, klarer Startpreis. Die Crew stellt Nesto mit dem Team zusammen." />
        <ul className="mt-14 grid gap-px border bg-border sm:grid-cols-2 xl:grid-cols-4">
          {PACKAGES.map((p) => (
            <li key={p.slug} className="group relative flex flex-col bg-background">
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
        <div className="mt-8">
          <CtaLink href="/pakete">Alle Pakete <ArrowUpRight className="size-4" aria-hidden /></CtaLink>
        </div>
      </Section>

      {/* ---------- Musik & Stock: reinhören, dann anfragen ---------- */}
      {tracks.length > 0 && (
        <Section id="musik" labelledBy="music-title" className="border-t">
          <SectionHeading id="music-title" index="04" eyebrow="Musik & Stock" title="Reinhören. Anfragen." text="Tracks, Beats, Fotos und Footage aus dem Netzwerk – die Nutzung fragst du direkt beim Artist an." />
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
            <SectionHeading id="studios-title" index="05" eyebrow="Studios & Locations" title="Der Raum dazu." text="Tonstudios, Fotostudios, Proberäume und Locations aus dem Netzwerk – stunden- oder tageweise, sofort buchbar." />
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
            <SectionHeading id="artists-title" index="06" eyebrow="Artists" title="Direkt anfragen." text="Hörproben, Arbeiten, Preisrahmen – und ein Klick zur Anfrage." />
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
          <Eyebrow>07 — Referenz</Eyebrow>
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
          <p className="meta flex items-center gap-3 text-primary-foreground/75"><span aria-hidden className="size-2 bg-[var(--bone)]" />08 — Für Artists</p>
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

      {/* ---------- Bald verfügbar ---------- */}
      <section aria-labelledby="soon-title" className="gutter bg-[var(--ink)] py-16 text-[var(--bone)] sm:py-24">
        <p className="meta flex items-center gap-3 text-white/60"><span aria-hidden className="size-2 bg-[var(--signal)]" />09 — Coming soon</p>
        <h2 id="soon-title" className="poster mt-6 text-[clamp(2.6rem,6vw,6.5rem)]">Was als Nächstes kommt.</h2>
        <ol className={cn("mt-12 grid gap-px border border-white/15 bg-white/15 sm:grid-cols-2", ROADMAP.length >= 4 ? "lg:grid-cols-4" : "lg:grid-cols-3")}>
          {ROADMAP.map((r, i) => (
            <li key={r.label} className="bg-[var(--ink)] p-6 sm:p-8">
              <span className="meta text-white/50">Bald {String(i + 1).padStart(2, "0")}</span>
              <h3 className="mt-8 text-xl font-semibold">{r.label}</h3>
              <p className="mt-2 text-sm text-white/65">{r.text}</p>
            </li>
          ))}
        </ol>
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
