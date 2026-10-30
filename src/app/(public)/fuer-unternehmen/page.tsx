import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Building2 } from "lucide-react";
import { db } from "@/lib/db";
import { getFees } from "@/lib/settings";
import { INDUSTRIES, categoryName } from "@/lib/constants";
import { formatEur, parseJson } from "@/lib/format";
import { PACKAGES } from "@/lib/packages";
import { FEATURES, placeFounder } from "@/lib/features";
import { StockImage } from "@/components/stock-image";
import { UserAvatar } from "@/components/user-avatar";
import { CtaLink, PageHero, Section, SectionHeading } from "@/components/public/landing-bits";
import { INDUSTRY_ICONS } from "@/components/public/industry-data";
import { DemoRequestForm } from "@/components/public/demo-request-form";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Für Brands",
  description: "Feste Produktions-Pakete und direkte Anfragen an geprüfte Artists aus Nestos Netzwerk.",
};

export default async function ForCompaniesPage() {
  const [fees, profiles, founder] = await Promise.all([
    getFees(),
    db.profile.findMany({
      where: { verified: true, user: { isCreative: true, status: { not: "gesperrt" } } },
      orderBy: [{ ratingAvg: "desc" }, { ratingCount: "desc" }],
      take: 5,
      select: { slug: true, city: true, categories: true, coverSeed: true, user: { select: { name: true, isAdmin: true } } },
    }),
    db.user.findFirst({ where: { isAdmin: true }, orderBy: { createdAt: "asc" }, select: { name: true, profile: { select: { avatarSeed: true } } } }),
  ]);

  // Nesto (Gründer) auf Platz 3 der Auswahl
  const artists = placeFounder(profiles, (p) => p.user.isAdmin).slice(0, 4);
  const cheapest = Math.min(...PACKAGES.map((p) => p.price));

  return (
    <>
      <PageHero
        eyebrow="Für Brands"
        title="Produktion ohne Umwege."
        text="Fertige Pakete zum Startpreis oder Artists direkt anfragen – kuratiert von Nesto."
        imageSeed="cc-fuer-unternehmen-meeting"
      >
        <CtaLink href="#pakete" variant="light">Paket wählen <ArrowUpRight className="size-4" aria-hidden /></CtaLink>
        <CtaLink href="#kontakt" variant="ghost">Demo anfragen</CtaLink>
      </PageHero>

      {/* ---------- Pakete: große Bildkacheln, direkt zur Anfrage ---------- */}
      <section id="pakete" aria-labelledby="pkg-title" className="scroll-mt-16 pt-20 sm:pt-32">
        <div className="gutter">
          <SectionHeading id="pkg-title" index="01" eyebrow="Paket buchen" title="Fertig geschnürt." text={`Fester Umfang, klarer Startpreis – ab ${formatEur(cheapest)}.`} />
        </div>
        <ul className="mt-14 grid gap-px bg-border sm:mt-20 sm:grid-cols-2 xl:grid-cols-4">
          {PACKAGES.map((p) => (
            <li key={p.slug} className="group relative isolate flex aspect-[3/4] flex-col justify-end overflow-hidden bg-[var(--ink)] text-[var(--bone)]">
              <StockImage seed={p.imageSeed} w={800} h={1067} sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 25vw" className="-z-10 opacity-70 grayscale transition-all duration-700 group-hover:scale-105 group-hover:opacity-90 group-hover:grayscale-0" />
              <div className="absolute inset-0 -z-10 bg-gradient-to-t from-[var(--ink)] via-[var(--ink)]/30 to-transparent" />
              {p.featured && <span className="meta absolute top-4 left-4 bg-[var(--signal)] px-2 py-1 text-white">Beliebt</span>}
              <div className="p-5 sm:p-6">
                <p className="meta text-white/70">Lieferung {p.delivery}</p>
                <h3 className="poster mt-3 text-[clamp(2.4rem,3.6vw,3.6rem)]">
                  <Link href={`/paket-anfrage?paket=${p.slug}`} className="after:absolute after:inset-0">{p.name}</Link>
                </h3>
                <p className="meta mt-4 inline-flex items-center gap-2 bg-[var(--signal)] px-3 py-2 text-white">
                  ab {formatEur(p.price)} <ArrowUpRight className="size-4" aria-hidden />
                </p>
              </div>
            </li>
          ))}
        </ul>
        <div className="gutter py-8">
          <CtaLink href="/pakete" variant="outline">Alle Details <ArrowUpRight className="size-4" aria-hidden /></CtaLink>
        </div>
      </section>

      {/* ---------- Artists direkt anfragen: Porträts ---------- */}
      <section id="artists" aria-labelledby="artists-title" className="scroll-mt-16 border-t pt-20 sm:pt-32">
        <div className="gutter">
          <SectionHeading id="artists-title" index="02" eyebrow="Artist anfragen" title="Direkt beim Artist." text="Reinhören, Arbeiten ansehen, mit einem Klick anfragen." />
        </div>
        {artists.length > 0 && (
          <ul className="mt-14 grid grid-cols-2 gap-px bg-border sm:mt-20 lg:grid-cols-4">
            {artists.map((a) => (
              <li key={a.slug} className="group relative aspect-[3/4] overflow-hidden bg-[var(--ink)] text-[var(--bone)]">
                <StockImage seed={a.coverSeed} w={600} h={800} sizes="(max-width: 1024px) 50vw, 25vw" className="opacity-75 grayscale transition-all duration-700 group-hover:scale-105 group-hover:opacity-100 group-hover:grayscale-0" />
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--ink)] via-transparent to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-4">
                  <p className="meta text-white/70">{categoryName(parseJson<string[]>(a.categories, [])[0] ?? "")} · {a.city}</p>
                  <h3 className="poster mt-2 text-[clamp(1.6rem,2.6vw,2.6rem)]">
                    <Link href={`/mitglieder/${a.slug}`} className="after:absolute after:inset-0">{a.user.name}</Link>
                  </h3>
                </div>
              </li>
            ))}
          </ul>
        )}
        <div className="gutter py-8">
          <CtaLink href="/mitglieder">Artists finden <ArrowUpRight className="size-4" aria-hidden /></CtaLink>
        </div>
      </section>

      {/* ---------- Branchen: Raster aus Kacheln mit Haarlinien (Ausbaustufe später) ---------- */}
      {FEATURES.branchen && (
        <Section labelledBy="ind-title" className="border-t">
          <SectionHeading id="ind-title" eyebrow="Branchen" title="Für jede Branche das passende Setup." />
          <ul className="mt-14 grid grid-cols-2 gap-px border bg-border sm:grid-cols-3 lg:grid-cols-6">
            {INDUSTRIES.map((ind, idx) => {
              const Icon = INDUSTRY_ICONS[ind.icon];
              const featured = ind.slug === "gaming";
              return (
                <li key={ind.slug} className="min-w-0">
                  <Link
                    href={`/branchen/${ind.slug}`}
                    className={cn(
                      "group flex h-full min-h-44 flex-col justify-between gap-8 p-4 transition-colors sm:min-h-56 sm:p-5",
                      featured ? "bg-primary text-primary-foreground hover:bg-[var(--signal)]" : "bg-background hover:bg-foreground hover:text-background",
                    )}
                  >
                    <span className="flex items-center justify-between">
                      <span className={cn("meta", featured ? "text-primary-foreground/75" : "text-muted-foreground group-hover:text-background/70")}>{String(idx + 1).padStart(2, "0")}</span>
                      <Icon className="size-5" aria-hidden />
                    </span>
                    <span className="poster text-[clamp(1.6rem,2.4vw,2.6rem)] text-balance hyphens-auto">{ind.name}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </Section>
      )}

      {/* ---------- Preise: zwei Zeilen, kein Kleingedrucktes ---------- */}
      <Section id="preise" labelledBy="prices-title" className="border-t">
        <SectionHeading id="prices-title" index="03" eyebrow="Preise" title="Klar vorher." />
        <ul className="mt-14 grid gap-px border bg-border md:grid-cols-2">
          <li className="flex flex-col bg-primary p-6 text-primary-foreground sm:p-10">
            <h3 className="meta text-primary-foreground/75">Paket</h3>
            <p className="poster mt-8 text-[clamp(3rem,6vw,6rem)] tabular-nums">ab {formatEur(cheapest)}</p>
            <p className="mt-4 max-w-sm text-primary-foreground/85">Startpreis je Paket. Verbindliches Angebot vor dem Start.</p>
          </li>
          <li className="flex flex-col bg-background p-6 sm:p-10">
            <h3 className="meta text-muted-foreground">Artist direkt</h3>
            <p className="poster mt-8 text-[clamp(3rem,6vw,6rem)] tabular-nums">+{fees.serviceFeePct} %</p>
            <p className="mt-4 max-w-sm text-muted-foreground">Honorar des Artists plus Servicegebühr. Kein Abo, keine Grundgebühr.</p>
          </li>
        </ul>
        <p className="meta mt-6 text-muted-foreground">Alle Preise netto zzgl. USt.</p>
      </Section>

      {/* ---------- Kontakt: Split – dunkle Seite mit Gründer, Formular rechts ---------- */}
      <section id="kontakt" aria-labelledby="contact-title" className="grid scroll-mt-16 border-t lg:grid-cols-12">
        <div className="relative isolate flex flex-col overflow-hidden bg-[var(--ink)] text-[var(--bone)] lg:col-span-5">
          <div className="absolute inset-0 -z-10">
            <StockImage seed="cc-kontakt-studio" w={1200} h={1400} sizes="(max-width: 1024px) 100vw, 42vw" className="opacity-35 grayscale" />
            <div className="absolute inset-0 bg-gradient-to-b from-[var(--ink)] via-[var(--ink)]/85 to-[var(--ink)]/50" />
          </div>
          <div className="gutter flex flex-1 flex-col py-20 sm:py-28">
            <p className="meta flex items-center gap-3 text-white/60"><span aria-hidden className="size-2 bg-[var(--signal)]" />04 — Kontakt</p>
            <h2 id="contact-title" className="poster mt-6 text-[clamp(3rem,8vw,8.5rem)]">Demo anfragen</h2>
            <p className="mt-6 max-w-md text-white/75 sm:text-lg">30 Minuten, persönlich. Oder ein eigenes Paket, maßgeschneidert.</p>
            <div className="mt-auto pt-14">
              <div className="flex items-center gap-4 border-y border-white/15 py-5">
                {founder ? (
                  <UserAvatar name={founder.name} seed={founder.profile?.avatarSeed ?? "nesto"} className="size-14" />
                ) : (
                  <span className="grid size-14 place-items-center bg-[var(--signal)] text-white"><Building2 className="size-6" aria-hidden /></span>
                )}
                <div className="min-w-0">
                  <p className="font-semibold">{founder?.name ?? "Nesto"}</p>
                  <p className="meta mt-1 text-white/60">Gründer · kuratiert das Netzwerk persönlich</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="gutter py-16 sm:py-28 lg:col-span-7">
          <p className="meta mb-8 flex items-center justify-between border-b pb-4 text-muted-foreground">
            <span>Anfrage</span>
            <span>Antwort in 2 Werktagen</span>
          </p>
          <DemoRequestForm />
        </div>
      </section>
    </>
  );
}
