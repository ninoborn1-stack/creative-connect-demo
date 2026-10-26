import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight, BadgeCheck, BookOpenCheck, Building2, CheckCircle2, FileCheck2, FileSignature, Handshake, Megaphone, ReceiptText, ShieldCheck,
  UserCog, UsersRound, Workflow,
} from "lucide-react";
import { db } from "@/lib/db";
import { getFees, getMarketplaceMode } from "@/lib/settings";
import { INDUSTRIES, LICENSE_TIERS } from "@/lib/constants";
import { formatEur } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { StockImage } from "@/components/stock-image";
import { UserAvatar } from "@/components/user-avatar";
import { Eyebrow, PageHero, Section, SectionHeading } from "@/components/public/landing-bits";
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
        <Button asChild size="lg" className="h-12 rounded-full px-6"><Link href="#kontakt">Demo anfragen <ArrowRight className="size-4" aria-hidden /></Link></Button>
        {canRegister && (
          <Button asChild size="lg" variant="outline" className="h-12 rounded-full border-white/40 bg-white/10 px-6 text-white hover:bg-white/20 hover:text-white">
            <Link href="/registrieren">Projekt starten</Link>
          </Button>
        )}
      </PageHero>

      {/* ---------- Wege ---------- */}
      <Section labelledBy="ways-title">
        <SectionHeading id="ways-title" eyebrow="Vier Wege" title="So kauft ihr Kreativleistungen ein." text="Kombinierbar in einem Firmenkonto – vom einzelnen Track bis zur Season-Produktion." />
        <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {ways.map((w) => (
            <li key={w.title} className={cn("flex flex-col rounded-3xl border p-6", w.highlight ? "border-primary/50 bg-primary/10" : "bg-card")}>
              <span className="grid size-11 place-items-center rounded-xl bg-primary/15 text-primary"><w.icon className="size-5" aria-hidden /></span>
              <h3 className="mt-5 text-lg font-semibold">{w.title}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{w.text}</p>
              <p className="mt-4 text-xs font-semibold text-primary">{w.meta}</p>
            </li>
          ))}
        </ul>
      </Section>

      {/* ---------- Enterprise-Funktionen ---------- */}
      <Section labelledBy="features-title" className="border-t bg-muted/30">
        <SectionHeading id="features-title" eyebrow="Enterprise" title="Gebaut für Teams, Einkauf und Rechtsabteilung." />
        <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <li key={f.title} className="rounded-3xl border bg-card p-6">
              <f.icon className="size-6 text-primary" aria-hidden />
              <h3 className="mt-4 font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{f.text}</p>
            </li>
          ))}
        </ul>
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <article className="rounded-3xl border bg-card p-6 sm:p-8">
            <h3 className="text-lg font-semibold">Rollen im Firmenkonto</h3>
            <ul className="mt-4 divide-y">
              {ROLES.map((r) => (
                <li key={r.role} className="flex flex-col gap-0.5 py-3 sm:flex-row sm:items-baseline sm:gap-4">
                  <span className="w-44 shrink-0 text-sm font-medium">{r.role}</span>
                  <span className="text-sm text-muted-foreground">{r.text}</span>
                </li>
              ))}
            </ul>
          </article>
          <article className="rounded-3xl border bg-card p-6 sm:p-8">
            <h3 className="text-lg font-semibold">Freigabe-Workflow</h3>
            <ol className="mt-5 space-y-3">
              {APPROVAL.map((s, i) => (
                <li key={s} className="flex items-center gap-3">
                  <span className="grid size-7 shrink-0 place-items-center rounded-full bg-primary/15 text-xs font-bold text-primary">{i + 1}</span>
                  <span className="text-sm font-medium">{s}</span>
                </li>
              ))}
            </ol>
            <p className="mt-5 text-xs text-muted-foreground">Jeder Schritt mit Zeitstempel und verantwortlicher Person – exportierbar für Audit und Revision.</p>
          </article>
        </div>
      </Section>

      {/* ---------- Branchen ---------- */}
      <Section labelledBy="ind-title" className="border-t">
        <SectionHeading id="ind-title" eyebrow="Branchen" title="Für jede Branche das passende Setup." />
        <ul className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {INDUSTRIES.map((i) => {
            const Icon = INDUSTRY_ICONS[i.icon];
            return (
              <li key={i.slug}>
                <Link href={`/branchen/${i.slug}`} className={cn("flex h-full flex-col gap-3 rounded-2xl border p-4 transition-colors hover:border-primary/50", i.slug === "gaming" ? "bg-primary/10" : "bg-card")}>
                  <Icon className="size-5 text-primary" aria-hidden />
                  <span className="text-sm font-semibold">{i.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </Section>

      {/* ---------- Preise ---------- */}
      <Section id="preise" labelledBy="prices-title" className="border-t bg-muted/30">
        <SectionHeading id="prices-title" eyebrow="Preise" title="Transparent bis auf den Cent." text="Keine Grundgebühr, keine bezahlte Platzierung. Die Kreativen behalten ihr komplettes Honorar." />
        <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {prices.map((p) => (
            <li key={p.title} className={cn("flex flex-col rounded-3xl border p-6", p.highlight ? "border-primary bg-primary/10" : "bg-card")}>
              <h3 className="font-semibold">{p.title}</h3>
              <p className="mt-4 font-heading text-3xl font-extrabold tracking-tight">{p.price}</p>
              <p className="text-xs text-muted-foreground">{p.unit}</p>
              <ul className="mt-5 space-y-2 border-t pt-4 text-sm">
                {p.points.map((x) => <li key={x} className="flex gap-2"><CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />{x}</li>)}
              </ul>
            </li>
          ))}
        </ul>
        <p className="mt-6 text-xs text-muted-foreground">Alle Preise netto zzgl. USt. Lizenzgebühren gehen vollständig an die Kreativen.</p>
      </Section>

      {/* ---------- Kontakt ---------- */}
      <Section id="kontakt" labelledBy="contact-title" className="border-t">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.2fr]">
          <div>
            <Eyebrow>Kontakt</Eyebrow>
            <h2 id="contact-title" className="mt-3 text-3xl leading-[1.05] font-bold text-balance sm:text-5xl">Demo anfragen</h2>
            <p className="mt-4 text-muted-foreground">
              30 Minuten, persönlich: Wir zeigen euch Katalog, Ausschreibungen und Managed Crew an einem Beispiel aus eurer Branche – und besprechen Rahmenvertrag und Abrechnung.
            </p>
            <div className="mt-8 flex items-center gap-4 rounded-2xl border bg-card p-4">
              {founder ? (
                <UserAvatar name={founder.name} seed={founder.profile?.avatarSeed ?? "nesto"} className="size-14" />
              ) : (
                <span className="grid size-14 place-items-center rounded-full bg-primary/15 text-primary"><Building2 className="size-6" aria-hidden /></span>
              )}
              <div className="min-w-0">
                <p className="font-semibold">{founder?.name ?? "Nesto von Drabich"}</p>
                <p className="text-sm text-muted-foreground">Gründer · kuratiert das Netzwerk persönlich</p>
              </div>
            </div>
            <ul className="mt-6 space-y-2 text-sm text-muted-foreground">
              <li className="flex gap-2"><BadgeCheck className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />Antwort innerhalb von zwei Werktagen</li>
              <li className="flex gap-2"><BadgeCheck className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />Unverbindlich, auch für Pilotprojekte</li>
            </ul>
            <div className="relative mt-8 hidden aspect-[16/9] overflow-hidden rounded-2xl border lg:block">
              <StockImage seed="cc-kontakt-studio" w={800} h={450} sizes="40vw" />
            </div>
          </div>
          <div className="rounded-3xl border bg-card p-5 sm:p-8">
            <DemoRequestForm />
          </div>
        </div>
      </Section>
    </>
  );
}
