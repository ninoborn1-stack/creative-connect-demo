import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowUpRight, BookOpenCheck, Building2, FileCheck2, FileSignature, Handshake, Megaphone, ReceiptText, ShieldCheck,
  UserCog, UsersRound, Workflow,
} from "lucide-react";
import { db } from "@/lib/db";
import { getFees, getMarketplaceMode } from "@/lib/settings";
import { INDUSTRIES, LICENSE_TIERS } from "@/lib/constants";
import { formatEur } from "@/lib/format";
import { StockImage } from "@/components/stock-image";
import { UserAvatar } from "@/components/user-avatar";
import { CtaLink, PageHero, Section, SectionHeading } from "@/components/public/landing-bits";
import { INDUSTRY_ICONS } from "@/components/public/industry-data";
import { DemoRequestForm } from "@/components/public/demo-request-form";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Für Unternehmen",
  description: "Kreative Produktion, Licensing und Ausschreibungen für Marken, Agenturen, Game-Studios und Konzerne – mit Teamkonten, Rahmenverträgen und Rechte-Management.",
};

const ROLES = [
  { role: "Admin", text: "verwaltet Teamkonten, Kostenstellen und Rahmenverträge" },
  { role: "Einkauf", text: "gibt Budgets frei, sieht alle Rechnungen" },
  { role: "Projektleitung", text: "brieft, beauftragt und nimmt ab" },
  { role: "Recht & Compliance", text: "Lesezugriff auf Verträge und Lizenzzertifikate" },
];

const APPROVAL = ["Briefing", "Budget-Freigabe", "Beauftragung", "Abnahme", "Sammelrechnung"];

export default async function ForCompaniesPage() {
  const [mode, fees, works, founder] = await Promise.all([
    getMarketplaceMode(),
    getFees(),
    db.licensableWork.findMany({ select: { priceStandard: true, priceExtended: true, priceExclusive: true } }),
    db.user.findFirst({ where: { isAdmin: true }, orderBy: { createdAt: "asc" }, select: { name: true, profile: { select: { avatarSeed: true } } } }),
  ]);
  const canRegister = mode !== "closed";

  const minOf = (vals: (number | null)[]) => {
    const v = vals.filter((x): x is number => typeof x === "number");
    return v.length ? Math.min(...v) : null;
  };
  const tierFrom = {
    standard: minOf(works.map((w) => w.priceStandard)),
    erweitert: minOf(works.map((w) => w.priceExtended)),
    exklusiv: minOf(works.map((w) => w.priceExclusive)),
  };

  const ways = [
    { icon: UsersRound, title: "Self-Service", text: "Briefing eingeben, der Assistent schlägt Rollen und Budget vor. Ihr fragt Kreative direkt an, vergleicht Angebote und bucht.", meta: `${fees.serviceFeePct} % Servicegebühr` },
    { icon: Handshake, title: "Managed Crew durch Nesto", text: "Nesto von Drabich und das Team stellen die Crew aus ihrem Netzwerk zusammen und koordinieren die Produktion – ein Angebot, ein Ansprechpartner.", meta: `${fees.managedMarginPct} % Marge im Angebot`, highlight: true },
    { icon: FileCheck2, title: "Licensing", text: "Musik, Sounds, Voice, Artwork und Footage aus dem Katalog – in drei Stufen bis zum exklusiven Buyout, mit Lizenzzertifikat.", meta: "Preise nach Stufe" },
    { icon: Megaphone, title: "Ausschreibungen", text: "Projekt veröffentlichen, Pitches von passenden Kreativen erhalten, Shortlist bilden, vergeben. Wie ein Stellenportal – nur für Kreativprojekte.", meta: "kostenlos veröffentlichen" },
  ];

  const features = [
    { icon: UserCog, title: "Teamkonten & Rollen", text: "Mehrere Kolleg:innen unter einem Firmenkonto – mit Rollen für Einkauf, Projektleitung und Freigabe." },
    { icon: FileSignature, title: "Rahmenverträge", text: "Feste Konditionen, Kontingente und Tagessätze für wiederkehrende Bedarfe. Einzelprojekte als Abruf." },
    { icon: ReceiptText, title: "Sammelrechnungen", text: "Eine Rechnung pro Monat, Kostenstelle oder Bestellnummer – statt Dutzender Einzelbelege." },
    { icon: Workflow, title: "Freigabe-Workflows", text: "Budgets und Abnahmen laufen über eure Freigabewege – nachvollziehbar mit Protokoll." },
    { icon: BookOpenCheck, title: "Rechte-Management", text: "Alle Lizenzen und Nutzungsrechte an einem Ort: Umfang, Laufzeit, Ablaufwarnungen, Lizenzzertifikate als PDF." },
    { icon: ShieldCheck, title: "Compliance", text: `KSK-Übersicht (${String(fees.kskRatePct).replace(".", ",")} %), DAC7-Meldungen, DSGVO mit EU-Hosting, verifizierte Profile.` },
  ];

  const prices = [
    { title: "Self-Service", price: `${fees.serviceFeePct} %`, unit: "Servicegebühr auf Honorare", points: ["Keine Grundgebühr, kein Abo", "Kreative zahlen 0 % Provision", "Zahlung über Zahlungsdienstleister"] },
    { title: "Managed Crew", price: `${fees.managedMarginPct} %`, unit: "Marge, im Angebot ausgewiesen", points: ["Crew-Zusammenstellung durch Nesto", "Ein Ansprechpartner", "Festpreis-Angebot"], highlight: true },
    {
      title: "Licensing", price: tierFrom.standard ? `ab ${formatEur(tierFrom.standard)}` : "nach Stufe", unit: "pro Werk, Stufe Standard",
      points: [
        `${LICENSE_TIERS.erweitert.label}${tierFrom.erweitert ? ` ab ${formatEur(tierFrom.erweitert)}` : ""}`,
        `${LICENSE_TIERS.exklusiv.label}${tierFrom.exklusiv ? ` ab ${formatEur(tierFrom.exklusiv)}` : ""}`,
        `zzgl. ${fees.serviceFeePct} % Servicegebühr`,
      ],
    },
    { title: "Enterprise", price: "auf Anfrage", unit: "für Konzerne & Rahmenverträge", points: ["Teamkonten & SSO-Anbindung", "Sammelrechnung & Bestellnummern", "Individuelle Vertragsvorlagen"] },
  ];

  return (
    <>
      <PageHero
        eyebrow="Für Unternehmen"
        title="Kreative Produktion und Licensing – so professionell wie euer Einkauf."
        text="Für Marken, Agenturen, Game-Studios, Labels, Film und Konzerne: geprüfte Kreative, klare Nutzungsrechte und eine Abrechnung, die durch jede Revision geht."
        imageSeed="cc-fuer-unternehmen-meeting"
      >
        <CtaLink href="#kontakt">Demo anfragen <ArrowUpRight className="size-4" aria-hidden /></CtaLink>
        {canRegister && <CtaLink href="/registrieren" variant="ghost">Projekt starten</CtaLink>}
      </PageHero>

      {/* ---------- Wege: Plakatzeilen, Managed Crew als rote Zeile über die volle Breite ---------- */}
      <Section labelledBy="ways-title">
        <SectionHeading id="ways-title" index="01" eyebrow="Vier Wege" title="So kauft ihr Kreativleistungen ein." text="Kombinierbar in einem Firmenkonto – vom einzelnen Track bis zur Season-Produktion." />
        <ol className="mt-16 border-t">
          {ways.map((w, i) => (
            <li
              key={w.title}
              className={cn(
                "grid gap-4 border-b py-8 sm:py-10 lg:grid-cols-12 lg:items-center lg:gap-8",
                w.highlight && "-mx-[max(1rem,4vw)] border-primary bg-primary px-[max(1rem,4vw)] text-primary-foreground",
              )}
            >
              <span className={cn("meta flex items-center gap-3 lg:col-span-1", w.highlight ? "text-primary-foreground/75" : "text-muted-foreground")}>
                A{i + 1} <w.icon className="size-4 lg:hidden" aria-hidden />
              </span>
              <h3 className="poster text-[clamp(2.6rem,6.4vw,6.8rem)] text-balance lg:col-span-5">{w.title}</h3>
              <p className={cn("max-w-md text-pretty lg:col-span-4", w.highlight ? "text-primary-foreground/85" : "text-muted-foreground")}>{w.text}</p>
              <p className={cn("meta lg:col-span-2 lg:text-right", w.highlight ? "text-primary-foreground" : "text-primary")}>{w.meta}</p>
            </li>
          ))}
        </ol>
      </Section>

      {/* ---------- Enterprise-Funktionen: dunkle Fläche ---------- */}
      <section aria-labelledby="features-title" className="gutter bg-[var(--ink)] py-20 text-[var(--bone)] sm:py-32">
        <p className="meta flex items-center gap-3 text-white/60"><span aria-hidden className="size-2 bg-[var(--signal)]" />02 — Enterprise</p>
        <h2 id="features-title" className="poster mt-6 max-w-[18ch] text-[clamp(2.6rem,7.4vw,8rem)] text-balance">Gebaut für Teams, Einkauf und Rechtsabteilung.</h2>
        <ul className="mt-16 grid gap-px border border-white/15 bg-white/15 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <li key={f.title} className="bg-[var(--ink)] p-6 sm:p-8">
              <div className="flex items-center justify-between">
                <span className="meta text-white/50">§{String(i + 1).padStart(2, "0")}</span>
                <f.icon className="size-5 text-[var(--signal)]" aria-hidden />
              </div>
              <h3 className="mt-10 text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/65">{f.text}</p>
            </li>
          ))}
        </ul>
        <div className="mt-px grid gap-px border border-t-0 border-white/15 bg-white/15 lg:grid-cols-2">
          <article className="bg-[var(--ink)] p-6 sm:p-10">
            <h3 className="poster text-[clamp(2rem,3.6vw,3.4rem)]">Rollen im Firmenkonto</h3>
            <ul className="mt-8 border-t border-white/15">
              {ROLES.map((r) => (
                <li key={r.role} className="flex flex-col gap-1 border-b border-white/15 py-4 sm:flex-row sm:items-baseline sm:gap-4">
                  <span className="meta w-44 shrink-0 text-[var(--bone)]">{r.role}</span>
                  <span className="text-sm text-white/65">{r.text}</span>
                </li>
              ))}
            </ul>
          </article>
          <article className="bg-[var(--ink)] p-6 sm:p-10">
            <h3 className="poster text-[clamp(2rem,3.6vw,3.4rem)]">Freigabe-Workflow</h3>
            <ol className="mt-8 border-t border-white/15">
              {APPROVAL.map((s, i) => (
                <li key={s} className="flex items-baseline gap-5 border-b border-white/15 py-3">
                  <span className="meta w-6 shrink-0 text-[var(--signal)]">{String(i + 1).padStart(2, "0")}</span>
                  <span className="poster text-[clamp(1.6rem,2.6vw,2.4rem)]">{s}</span>
                </li>
              ))}
            </ol>
            <p className="meta mt-6 text-white/50">Jeder Schritt mit Zeitstempel und verantwortlicher Person – exportierbar für Audit und Revision.</p>
          </article>
        </div>
      </section>

      {/* ---------- Branchen: Raster aus Kacheln mit Haarlinien ---------- */}
      <Section labelledBy="ind-title">
        <SectionHeading id="ind-title" index="03" eyebrow="Branchen" title="Für jede Branche das passende Setup." />
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

      {/* ---------- Preise ---------- */}
      <Section id="preise" labelledBy="prices-title" className="border-t">
        <SectionHeading id="prices-title" index="04" eyebrow="Preise" title="Transparent bis auf den Cent." text="Keine Grundgebühr, keine bezahlte Platzierung. Die Kreativen behalten ihr komplettes Honorar." />
        <ul className="mt-14 grid gap-px border bg-border sm:grid-cols-2 lg:grid-cols-4">
          {prices.map((p, i) => (
            <li key={p.title} className={cn("flex flex-col p-6 sm:p-8", p.highlight ? "bg-primary text-primary-foreground" : "bg-background")}>
              <div className="flex items-baseline justify-between gap-4">
                <h3 className="meta">{p.title}</h3>
                <span className={cn("meta", p.highlight ? "text-primary-foreground/75" : "text-muted-foreground")}>P{i + 1}</span>
              </div>
              <p className="poster mt-10 text-[clamp(3rem,5vw,5rem)] tabular-nums">{p.price}</p>
              <p className={cn("meta mt-3", p.highlight ? "text-primary-foreground/75" : "text-muted-foreground")}>{p.unit}</p>
              <ul className={cn("mt-8 border-t text-sm", p.highlight && "border-primary-foreground/30")}>
                {p.points.map((x) => (
                  <li key={x} className={cn("flex gap-3 border-b py-3", p.highlight && "border-primary-foreground/30")}>
                    <span aria-hidden className={p.highlight ? "text-primary-foreground/75" : "text-primary"}>+</span>
                    {x}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
        <p className="meta mt-6 text-muted-foreground">Alle Preise netto zzgl. USt. Lizenzgebühren gehen vollständig an die Kreativen.</p>
      </Section>

      {/* ---------- Kontakt: Split – dunkle Seite mit Gründer, Formular rechts ---------- */}
      <section id="kontakt" aria-labelledby="contact-title" className="grid scroll-mt-16 border-t lg:grid-cols-12">
        <div className="relative isolate flex flex-col overflow-hidden bg-[var(--ink)] text-[var(--bone)] lg:col-span-5">
          <div className="absolute inset-0 -z-10">
            <StockImage seed="cc-kontakt-studio" w={1200} h={1400} sizes="(max-width: 1024px) 100vw, 42vw" className="opacity-35 grayscale" />
            <div className="absolute inset-0 bg-gradient-to-b from-[var(--ink)] via-[var(--ink)]/85 to-[var(--ink)]/50" />
          </div>
          <div className="gutter flex flex-1 flex-col py-20 sm:py-28">
            <p className="meta flex items-center gap-3 text-white/60"><span aria-hidden className="size-2 bg-[var(--signal)]" />05 — Kontakt</p>
            <h2 id="contact-title" className="poster mt-6 text-[clamp(3rem,8vw,8.5rem)]">Demo anfragen</h2>
            <p className="mt-6 max-w-md text-white/75 sm:text-lg">
              30 Minuten, persönlich: Wir zeigen euch Katalog, Ausschreibungen und Managed Crew an einem Beispiel aus eurer Branche – und besprechen Rahmenvertrag und Abrechnung.
            </p>
            <div className="mt-auto pt-14">
              <div className="flex items-center gap-4 border-y border-white/15 py-5">
                {founder ? (
                  <UserAvatar name={founder.name} seed={founder.profile?.avatarSeed ?? "nesto"} className="size-14" />
                ) : (
                  <span className="grid size-14 place-items-center bg-[var(--signal)] text-white"><Building2 className="size-6" aria-hidden /></span>
                )}
                <div className="min-w-0">
                  <p className="font-semibold">{founder?.name ?? "Nesto von Drabich"}</p>
                  <p className="meta mt-1 text-white/60">Gründer · kuratiert das Netzwerk persönlich</p>
                </div>
              </div>
              <ul className="text-sm text-white/75">
                <li className="flex gap-3 border-b border-white/15 py-3"><span aria-hidden className="meta text-[var(--signal)]">01</span>Antwort innerhalb von zwei Werktagen</li>
                <li className="flex gap-3 border-b border-white/15 py-3"><span aria-hidden className="meta text-[var(--signal)]">02</span>Unverbindlich, auch für Pilotprojekte</li>
              </ul>
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
