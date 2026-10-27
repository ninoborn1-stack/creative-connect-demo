import Link from "next/link";
import {
  ArrowUpRight, FileCheck2, FileSignature, Fingerprint, Landmark, Megaphone, ReceiptText, ScrollText, Server, ShieldCheck, Users, UsersRound,
} from "lucide-react";
import { db } from "@/lib/db";
import { getFees, getMarketplaceMode } from "@/lib/settings";
import { INDUSTRIES, LICENSE_MEDIA, LICENSE_TIERS, MARKETPLACE_MODES, TERRITORIES } from "@/lib/constants";
import { formatNumber } from "@/lib/format";
import { StockImage } from "@/components/stock-image";
import { UserAvatar } from "@/components/user-avatar";
import { ProfileCard } from "@/components/profile-card";
import { CtaLink, Eyebrow, FaqList, Marquee, Section, SectionHeading, Wordmark } from "@/components/public/landing-bits";
import { INDUSTRY_DETAILS } from "@/components/public/industry-data";
import { PUBLIC_WORK_SELECT, WorkRow } from "@/components/public/work-card";
import { OpportunityList, PUBLIC_OPPORTUNITY_SELECT } from "@/components/public/opportunity-list";
import { cn } from "@/lib/utils";
import { stockPhoto } from "@/lib/stock";
import { Hero } from "@/components/public/hero";

const FAQ = [
  { q: "Wem gehören die Rechte an den Ergebnissen?", a: "Das regelt jeder Auftrag und jede Lizenz ausdrücklich: Medien, Gebiet, Laufzeit und Exklusivität stehen im Vertrag bzw. im Lizenzzertifikat. Für Auftragsproduktionen sind Buyouts möglich – inklusive dokumentierter Rechtekette pro Asset." },
  { q: "Können wir einen Rahmenvertrag abschließen?", a: "Ja. Für wiederkehrende Bedarfe vereinbaren wir Rahmenverträge mit festen Konditionen, Bestellnummern und Freigabewegen. Einzelne Projekte und Lizenzen laufen dann als Abrufe darunter." },
  { q: "Wie läuft die Rechnungsstellung?", a: "Über einen lizenzierten Zahlungsdienstleister: Honorare werden bei Beauftragung reserviert und nach eurer Abnahme freigegeben. Ihr erhaltet ordnungsgemäße Rechnungen – auf Wunsch als monatliche Sammelrechnung pro Kostenstelle." },
  { q: "Können mehrere Personen aus unserem Team mitarbeiten?", a: "Ja. Teamkonten mit Rollen (z. B. Einkauf, Projektleitung, Freigabe) sind möglich – Projekte, Lizenzen und Rechnungen liegen dann zentral beim Unternehmen." },
  { q: "Wie funktionieren Buyouts für Games?", a: "Für Musik, Sounddesign und Voice Acting bieten wir Buyouts weltweit, unbefristet und für alle Plattformen inklusive DLCs, Trailer und Marketing an. Stems und adaptive Layer für Wwise/FMOD gehören auf Wunsch zur Lieferung." },
  { q: "Wer sind die Kreativen – und wie werden sie geprüft?", a: "Profile werden vom Team um Gründer Nesto kuratiert: Portfolio, Referenzen und Identität werden geprüft, viele Mitglieder kommen direkt aus seinem Netzwerk. Verifizierte Profile sind gekennzeichnet." },
  { q: "Was kostet Creative Connect?", a: "Für Unternehmen fällt eine transparent ausgewiesene Servicegebühr auf Honorare und Lizenzen an. Managed Crews kalkulieren wir mit fester Marge im Angebot. Enterprise-Konditionen auf Anfrage." },
];

export default async function LandingPage() {
  const [mode, fees, companies, creativeCount, workCount, openOpps, featuredWorks, profiles, reviews] = await Promise.all([
    getMarketplaceMode(),
    getFees(),
    db.company.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, industry: true, verified: true } }),
    db.profile.count(),
    db.licensableWork.count(),
    db.opportunity.findMany({ where: { status: "offen" }, orderBy: { deadline: "asc" }, select: { ...PUBLIC_OPPORTUNITY_SELECT, industry: true } }),
    db.licensableWork.findMany({ where: { featured: true }, orderBy: { plays: "desc" }, take: 6, select: PUBLIC_WORK_SELECT }),
    loadTeaserProfiles(),
    db.review.findMany({
      where: { rating: 5, author: { isClient: true }, target: { isCreative: true } },
      orderBy: { createdAt: "desc" },
      take: 30,
      include: {
        author: { select: { name: true, company: true, jobTitle: true, profile: { select: { avatarSeed: true } } } },
        target: { select: { name: true } },
      },
    }),
  ]);

  const phaseIndex = mode === "closed" ? 0 : mode === "clients" ? 1 : 2;
  const canRegister = mode !== "closed";
  const brandNames = companies.filter((c) => c.verified && !c.name.includes("(Independent)")).map((c) => c.name);
  const seenTexts = new Set<string>();
  const quotes = reviews.filter((r) => !seenTexts.has(r.text) && seenTexts.add(r.text)).slice(0, 3);

  const companiesBy = (slug: string) => companies.filter((c) => c.industry === slug).length;
  const oppsBy = (slug: string) => openOpps.filter((o) => o.industry === slug).length;
  // Gaming zuerst – Schwerpunkt des Netzwerks
  const industries = [...INDUSTRIES].sort((a, b) => Number(b.slug === "gaming") - Number(a.slug === "gaming"));

  const ways = [
    {
      icon: UsersRound, title: "Crew beauftragen", image: "cc-way-crew",
      text: `Self-Service mit Briefing-Assistent oder Managed Crew durch Nesto und das Team. Verträge, Zahlung und Abnahme laufen in einem Projektraum – ${fees.serviceFeePct} % Servicegebühr, transparent ausgewiesen.`,
      href: canRegister ? "/registrieren" : "/fuer-unternehmen#kontakt", cta: canRegister ? "Briefing starten" : "Gespräch vereinbaren",
    },
    {
      icon: FileCheck2, title: "Werke lizenzieren", image: "cc-way-licensing",
      text: `${formatNumber(workCount)} Tracks, Sounds, Voice-Packs, Artworks und Footage – sofort lizenzierbar in drei Stufen, mit Lizenzzertifikat und dokumentierter Rechtekette.`,
      href: "/lizenzen", cta: "Zum Katalog",
    },
    {
      icon: Megaphone, title: "Ausschreiben", image: "cc-way-pitch",
      text: `Projekt einmal beschreiben, Pitches von passenden Kreativen erhalten, Shortlist bilden und vergeben. Aktuell ${openOpps.length} offene Ausschreibungen.`,
      href: "/ausschreibungen", cta: "Ausschreibungen",
    },
  ];

  const stats = [
    { value: creativeCount, label: "geprüfte Kreative" },
    { value: companies.length, label: "Unternehmen" },
    { value: workCount, label: "lizenzierbare Werke" },
    { value: openOpps.length, label: "offene Ausschreibungen" },
  ];

  const trust = [
    { icon: FileSignature, title: "Verträge & Nutzungsrechte", text: "Werkverträge und Lizenzen mit klarem Umfang: Medien, Gebiet, Laufzeit, Exklusivität. Rechtekette pro Asset dokumentiert." },
    { icon: Landmark, title: "Zahlungsabwicklung", text: "Über einen lizenzierten Zahlungsdienstleister: Reservierung bei Beauftragung, Auszahlung nach Abnahme. Keine Vorkasse an Unbekannte." },
    { icon: ReceiptText, title: "KSK-Hinweise", text: `Wir zeigen, wann Künstlersozialabgabe (${String(fees.kskRatePct).replace(".", ",")} %) anfallen kann, und liefern eine Jahresübersicht als Export.` },
    { icon: ScrollText, title: "DAC7-konform", text: "Plattform-Meldepflichten nach DAC7 sind abgebildet – für euch und für die Kreativen nachvollziehbar." },
    { icon: Server, title: "DSGVO & EU-Hosting", text: "Daten bleiben in der EU, Auftragsverarbeitung nach DSGVO, Löschkonzepte und Rollenrechte." },
    { icon: Fingerprint, title: "Verifizierte Profile", text: "Identität, Portfolio und Steuerangaben geprüft – verifizierte Profile sind gekennzeichnet." },
    { icon: ShieldCheck, title: "Kuratiert durch Nesto", text: "Gründer Nesto von Drabich und sein Team kuratieren das Netzwerk persönlich. Qualität vor Masse." },
    { icon: Users, title: "Ein Ansprechpartner", text: `Für Managed Crews: ein Angebot, ein Team, eine Rechnung – kalkuliert mit ${fees.managedMarginPct} % Marge.` },
  ];

  const [leadQuote, ...moreQuotes] = quotes;

  return (
    <>
      {/* ---------- Hero: DJ-Pult-Intro + Scroll-Übergang ---------- */}
      <Hero
        image={stockPhoto(453, 2400, 1600)} // Band auf der Bühne im Spotlight
        phaseLabel={MARKETPLACE_MODES[phaseIndex].label}
        creativeCount={creativeCount}
        companyCount={companies.length}
        workCount={workCount}
        canRegister={canRegister}
      />

      {/* ---------- Laufband: Gewerke ---------- */}
      <div className="bg-primary py-4 text-primary-foreground sm:py-6">
        <Marquee
          items={["Musik", "Game-Audio", "Sounddesign", "Voice", "Film & Video", "Foto", "Design", "Licensing", "Buyouts"]}
          itemClassName="poster text-[clamp(2.6rem,7vw,6.5rem)]"
          speed="45s"
        />
      </div>

      {/* ---------- Statement + Kennzahlen ---------- */}
      <section aria-labelledby="statement-title" className="gutter pt-24 pb-16 sm:pt-36 sm:pb-24">
        <Eyebrow>01 — Das Netzwerk</Eyebrow>
        <h2 id="statement-title" className="mt-8 max-w-[22ch] text-[clamp(2rem,5vw,5.4rem)] leading-[1.02] font-semibold tracking-[-0.035em] text-balance">
          Talent ist nicht das Problem. <span className="text-muted-foreground">Der sichere Weg dorthin schon.</span>{" "}
          <span className="text-primary">Creative Connect</span> bringt Unternehmen mit geprüften Kreativen zusammen – mit Vertrag, Rechten und Rechnung.
        </h2>
        <dl className="mt-16 grid grid-cols-2 border-t sm:mt-24 lg:grid-cols-4">
          {stats.map((s, i) => (
            <div key={s.label} className={cn("border-b py-6 pr-4 lg:border-b-0 lg:py-8", i % 2 === 1 && "border-l pl-4 lg:pl-6", i >= 2 && "lg:border-l lg:pl-6")}>
              <dt className="meta text-muted-foreground">{s.label}</dt>
              <dd className="poster mt-3 text-[clamp(3.6rem,9vw,9rem)] tabular-nums">{formatNumber(s.value)}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* ---------- Logo-Laufband ---------- */}
      {brandNames.length > 0 && (
        <section aria-labelledby="logos-title" className="border-y py-8 sm:py-10">
          <h2 id="logos-title" className="meta gutter mb-6 text-muted-foreground">Arbeiten mit Creative Connect</h2>
          <Marquee items={brandNames.map((n) => <Wordmark key={n} name={n} />)} reverse speed="70s" separator={<span className="text-primary">/</span>} />
        </section>
      )}

      {/* ---------- Drei Wege ---------- */}
      <Section id="so-gehts" labelledBy="ways-title">
        <SectionHeading
          id="ways-title"
          index="02"
          eyebrow="Für Unternehmen"
          title="Drei Wege zusammen­zuarbeiten."
          text="Ob Kampagne, Game-Soundtrack oder Imagefilm: Ihr wählt, wie ihr einkauft – Creative Connect kümmert sich um Verträge, Rechte und Abrechnung."
        />
        <ol className="mt-16 border-t">
          {ways.map((w, i) => (
            <li key={w.title} className="border-b">
              <Link href={w.href} className="group relative grid gap-4 py-8 sm:py-10 lg:grid-cols-12 lg:items-center lg:gap-8">
                <span className="meta text-muted-foreground lg:col-span-1">A{i + 1}</span>
                <h3 className="poster text-[clamp(2.8rem,7vw,7.5rem)] transition-colors group-hover:text-primary lg:col-span-6">{w.title}</h3>
                <p className="max-w-md text-pretty text-muted-foreground lg:col-span-3">{w.text}</p>
                <span className="meta inline-flex items-center gap-2 text-primary lg:col-span-2 lg:justify-self-end">
                  {w.cta} <ArrowUpRight className="size-6 transition-transform duration-300 group-hover:rotate-45" aria-hidden />
                </span>
                {/* Vorschaubild erscheint beim Hover neben dem Titel */}
                <span aria-hidden className="pointer-events-none absolute top-1/2 left-[42%] z-10 hidden aspect-[4/3] w-72 -translate-y-1/2 scale-90 rotate-3 overflow-hidden opacity-0 shadow-2xl transition-all duration-500 group-hover:scale-100 group-hover:rotate-0 group-hover:opacity-100 lg:block">
                  <StockImage seed={w.image} w={600} h={450} sizes="288px" />
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </Section>

      {/* ---------- Branchen: aufklappende Bildstreifen über die volle Breite ---------- */}
      <section id="branchen" aria-labelledby="ind-title" className="scroll-mt-16 border-t pt-20 sm:pt-32">
        <div className="gutter">
          <SectionHeading
            id="ind-title"
            index="03"
            eyebrow="Branchen"
            title="Spezialisiert auf eure Branche."
            text="Gewerke, Lizenzmodelle und Abläufe, die zu eurem Markt passen – von Live-Service-Games bis Konzernkommunikation."
          />
        </div>
        <ul className="ind-strip mt-14 sm:mt-20">
          {industries.map((ind, i) => {
            const featured = ind.slug === "gaming";
            return (
              <li key={ind.slug} data-featured={featured ? "" : undefined} className="group relative isolate overflow-hidden border-t border-white/10 bg-[var(--ink)] text-[var(--bone)] lg:border-t-0 lg:border-l">
                <StockImage
                  seed={INDUSTRY_DETAILS[ind.slug].imageSeed}
                  w={1000}
                  h={1200}
                  sizes="(max-width: 1024px) 100vw, 40vw"
                  className="-z-10 opacity-60 grayscale transition-all duration-700 group-hover:scale-105 group-hover:opacity-80 group-hover:grayscale-0"
                />
                <div className="absolute inset-0 -z-10 bg-gradient-to-t from-[var(--ink)] via-[var(--ink)]/40 to-transparent" />
                <div className="flex h-full flex-col justify-between gap-6 p-5 lg:p-4 xl:p-5">
                  <div className="flex items-center justify-between gap-3">
                    <span className="meta text-white/70">{String(i + 1).padStart(2, "0")}</span>
                    {featured && <span className="meta bg-[var(--signal)] px-2 py-1 text-white">Schwerpunkt</span>}
                  </div>
                  <div>
                    <h3 className="poster text-[2.6rem] lg:text-[clamp(1.6rem,2.05vw,3rem)]">
                      <Link href={`/branchen/${ind.slug}`} className="after:absolute after:inset-0">{ind.name}</Link>
                    </h3>
                    <div className="ind-strip__more">
                      <div>
                        <p className="mt-3 max-w-sm text-sm text-white/80">{ind.tagline}</p>
                        <p className="meta mt-4 text-white/60">
                          {companiesBy(ind.slug)} Unternehmen · {oppsBy(ind.slug)} offen
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      {/* ---------- Licensing ---------- */}
      <Section id="licensing" labelledBy="lic-title" className="border-t">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:sticky lg:top-24 lg:col-span-5 lg:self-start">
            <Eyebrow>04 — Licensing</Eyebrow>
            <h2 id="lic-title" className="poster mt-6 text-[clamp(2.8rem,6.4vw,7rem)]">Lizenzieren statt verhandeln.</h2>
            <p className="mt-6 max-w-md text-muted-foreground sm:text-lg">
              Jedes Werk im Katalog hat drei klare Lizenzstufen. Ihr wählt Projekt und Stufe – Vertrag, Rechnung und Lizenzzertifikat entstehen automatisch.
            </p>
            <ul className="mt-8 border-t text-sm">
              {[
                ["Lizenzzertifikat", "mit Lizenznummer, Umfang und Projekt – für Rechtsabteilung, Sender und Plattformen."],
                ["Rechtekette", "Urheber:in, Beteiligte und Freigaben sind pro Werk hinterlegt."],
                ["Fair", "Die Lizenzgebühr geht vollständig an die Kreativen, die Servicegebühr wird separat ausgewiesen."],
              ].map(([t, d]) => (
                <li key={t} className="grid grid-cols-[8rem_1fr] gap-4 border-b py-4">
                  <span className="meta text-foreground">{t}</span>
                  <span className="text-muted-foreground">{d}</span>
                </li>
              ))}
            </ul>
          </div>
          <ol className="lg:col-span-7">
            {Object.entries(LICENSE_TIERS).map(([key, t], i) => (
              <li key={key} className={cn("border p-6 sm:p-10", i > 0 && "border-t-0", i === 2 && "border-primary bg-primary text-primary-foreground")}>
                <div className="flex items-baseline justify-between gap-4">
                  <span className={cn("meta", i === 2 ? "text-primary-foreground/75" : "text-muted-foreground")}>Stufe {String(i + 1).padStart(2, "0")}</span>
                  <span className={cn("meta", i === 2 ? "text-primary-foreground/75" : "text-muted-foreground")}>
                    {TERRITORIES[t.territory]} · {t.durationMonths ? `${t.durationMonths} Monate` : "unbefristet"}
                  </span>
                </div>
                <h3 className="poster mt-4 text-[clamp(3rem,6vw,6rem)]">{t.label}</h3>
                <p className={cn("mt-3 max-w-lg", i === 2 ? "text-primary-foreground/85" : "text-muted-foreground")}>{t.summary}</p>
                <p className={cn("meta mt-5", i === 2 ? "text-primary-foreground/75" : "text-muted-foreground")}>{t.media.map((m) => LICENSE_MEDIA[m]).join(" / ")}</p>
              </li>
            ))}
          </ol>
        </div>

        {featuredWorks.length > 0 && (
          <div className="mt-24">
            <div className="flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-end sm:justify-between">
              <h3 className="poster text-[clamp(2.2rem,4vw,4rem)]">Ausgewählte Werke</h3>
              <Link href="/lizenzen" className="meta inline-flex items-center gap-2 text-primary hover:underline">
                Gesamter Katalog <ArrowUpRight className="size-4" aria-hidden />
              </Link>
            </div>
            <ol>
              {featuredWorks.map((w, i) => <WorkRow key={w.id} work={w} index={i} />)}
            </ol>
          </div>
        )}
      </Section>

      {/* ---------- Aktuelle Ausschreibungen ---------- */}
      {openOpps.length > 0 && (
        <Section id="netzwerk" labelledBy="opps-title" className="border-t">
          <SectionHeading
            id="opps-title"
            index="05"
            eyebrow="Jetzt offen"
            title="Aktuelle Ausschreibungen."
            text="Unternehmen schreiben aus, Kreative pitchen. Ein Ausschnitt aus dem, was gerade im Netzwerk passiert."
          />
          <div className="mt-14">
            <OpportunityList items={openOpps.slice(0, 5)} />
          </div>
          <div className="mt-8">
            <CtaLink href="/ausschreibungen" variant="outline">Alle Ausschreibungen <ArrowUpRight className="size-4" aria-hidden /></CtaLink>
          </div>
        </Section>
      )}

      {/* ---------- Vertrauen & Compliance ---------- */}
      <section id="compliance" aria-labelledby="trust-title" className="gutter scroll-mt-16 bg-[var(--ink)] py-20 text-[var(--bone)] sm:py-32">
        <div className="grid gap-6 lg:grid-cols-12 lg:items-end lg:gap-10">
          <div className="lg:col-span-8">
            <p className="meta flex items-center gap-3 text-white/60"><span aria-hidden className="size-2 bg-[var(--signal)]" />06 — Vertrauen &amp; Compliance</p>
            <h2 id="trust-title" className="poster mt-6 text-[clamp(2.6rem,7.4vw,8rem)]">Gebaut für Einkauf, Recht und Finanzen.</h2>
          </div>
          <p className="text-white/70 sm:text-lg lg:col-span-4 lg:pb-2">Damit eure Kreativprojekte genauso sauber durch die Revision gehen wie jede andere Beschaffung.</p>
        </div>
        <ul className="mt-16 grid gap-px border border-white/15 bg-white/15 sm:grid-cols-2 lg:grid-cols-4">
          {trust.map((t, i) => (
            <li key={t.title} className="bg-[var(--ink)] p-6 sm:p-8">
              <div className="flex items-center justify-between">
                <span className="meta text-white/50">§{String(i + 1).padStart(2, "0")}</span>
                <t.icon className="size-5 text-[var(--signal)]" aria-hidden />
              </div>
              <h3 className="mt-10 text-lg font-semibold">{t.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/65">{t.text}</p>
            </li>
          ))}
        </ul>
        <p className="meta mt-8 text-white/50">
          Hinweise zu KSK und Steuern ersetzen keine Rechtsberatung. Ranking-Kriterien stehen offen in den <Link href="/agb#ranking" className="underline underline-offset-4">AGB</Link>.
        </p>
      </section>

      {/* ---------- Stimmen ---------- */}
      {leadQuote && (
        <Section id="stimmen" labelledBy="voices-title">
          <Eyebrow>07 — Referenzen</Eyebrow>
          <h2 id="voices-title" className="sr-only">Was Auftraggeber über ihre Projekte sagen</h2>
          <figure className="mt-10">
            <blockquote className="font-[family-name:var(--font-serif)] text-[clamp(1.9rem,4.4vw,4.6rem)] leading-[1.08] font-light tracking-[-0.02em] text-balance">
              <span className="text-primary">„</span>{leadQuote.text}<span className="text-primary">“</span>
            </blockquote>
            <QuoteAuthor review={leadQuote} />
          </figure>
          {moreQuotes.length > 0 && (
            <div className="mt-20 grid border-t md:grid-cols-2">
              {moreQuotes.map((r, i) => (
                <figure key={r.id} className={cn("py-10", i === 1 && "md:border-l md:pl-10", i === 0 && "md:pr-10")}>
                  <blockquote className="font-[family-name:var(--font-serif)] text-2xl leading-snug font-light text-balance">„{r.text}“</blockquote>
                  <QuoteAuthor review={r} />
                </figure>
              ))}
            </div>
          )}
        </Section>
      )}

      {/* ---------- Verzeichnis-Teaser (nur Modus offen) ---------- */}
      {mode === "open" && profiles.length > 0 && (
        <Section id="verzeichnis" labelledBy="dir-title" className="border-t">
          <SectionHeading id="dir-title" eyebrow="Verzeichnis" title="Entdeckt das Netzwerk." text="Profile sind öffentlich sichtbar. Eine kleine Auswahl:" />
          <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {profiles.map((p) => <ProfileCard key={p.slug} profile={p} />)}
          </div>
          <div className="mt-8">
            <CtaLink href="/verzeichnis" variant="outline">Verzeichnis ansehen <ArrowUpRight className="size-4" aria-hidden /></CtaLink>
          </div>
        </Section>
      )}

      {/* ---------- Für Kreative: Split über die volle Breite ---------- */}
      <section id="kreative" aria-labelledby="creatives-title" className="grid scroll-mt-16 lg:grid-cols-2">
        <div className="relative min-h-[50svh] lg:min-h-[85svh]">
          <StockImage seed="id:145" w={1400} h={1400} sizes="(max-width: 1024px) 100vw, 50vw" className="grayscale-[30%]" />
        </div>
        <div className="gutter flex flex-col justify-center bg-primary py-16 text-primary-foreground sm:py-24">
          <p className="meta flex items-center gap-3 text-primary-foreground/75"><span aria-hidden className="size-2 bg-[var(--bone)]" />08 — Für Kreative</p>
          <h2 id="creatives-title" className="poster mt-6 text-[clamp(2.8rem,6vw,6.5rem)]">
            Aufträge von Unternehmen. {fees.creativeCommissionPct} % Provision.
          </h2>
          <p className="mt-6 max-w-lg text-primary-foreground/85 sm:text-lg">
            Bewirb dich mit Portfolio und Referenzen – oder komm über das große Netzwerk von Nesto per Fast-Track dazu. Im Netzwerk erwarten dich Ausschreibungen, Lizenz-Einnahmen aus deinen Werken und Projekte mit Marken, Studios und Labels.
          </p>
          <p className="mt-3 max-w-lg text-sm text-primary-foreground/75">
            Intern gibt es außerdem ein Community-Programm mit Sessions bei Nesto – <Link href="/fuer-kreative#community" className="underline underline-offset-4">mehr dazu</Link>.
          </p>
          <div className="mt-10 flex flex-col gap-2 sm:flex-row">
            <CtaLink href="/bewerben" variant="light">Als Kreative:r bewerben <ArrowUpRight className="size-4" aria-hidden /></CtaLink>
            <CtaLink href="/fuer-kreative" variant="ghost">Mehr erfahren</CtaLink>
          </div>
        </div>
      </section>

      {/* ---------- FAQ ---------- */}
      <Section id="faq" labelledBy="faq-title">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:sticky lg:top-24 lg:col-span-4 lg:self-start">
            <Eyebrow>09 — FAQ für Unternehmen</Eyebrow>
            <h2 id="faq-title" className="poster mt-6 text-[clamp(2.8rem,6vw,6.5rem)]">Häufige Fragen.</h2>
            <p className="mt-6 max-w-sm text-muted-foreground">Rechte, Rahmenverträge, Rechnungen, Teamkonten – noch etwas offen? Wir antworten persönlich.</p>
          </div>
          <div className="lg:col-span-8">
            <FaqList items={FAQ} />
          </div>
        </div>
      </Section>

      {/* ---------- Abschluss-CTA ---------- */}
      <section aria-labelledby="cta-title" className="gutter border-t py-24 sm:py-36">
        <Eyebrow>Creative Connect für Unternehmen</Eyebrow>
        <h2 id="cta-title" className="poster mt-8 text-[clamp(3.4rem,11.5vw,13rem)]">
          Euer nächstes Projekt <span className="text-primary">beginnt hier.</span>
        </h2>
        <div className="mt-12 grid gap-8 border-t pt-8 lg:grid-cols-12">
          <p className="max-w-xl text-muted-foreground sm:text-lg lg:col-span-6">
            {canRegister
              ? "Firmenkonto in zwei Minuten anlegen – oder mit Nesto und dem Team über einen Rahmenvertrag sprechen."
              : "Creative Connect öffnet gerade schrittweise für Unternehmen. Fragt eine Demo an – wir melden uns persönlich."}
          </p>
          <div className="flex flex-col gap-2 sm:flex-row lg:col-span-6 lg:justify-end">
            {canRegister && <CtaLink href="/registrieren">Projekt starten <ArrowUpRight className="size-4" aria-hidden /></CtaLink>}
            <CtaLink href="/fuer-unternehmen#kontakt" variant={canRegister ? "outline" : "primary"}>Demo anfragen</CtaLink>
          </div>
        </div>
      </section>
    </>
  );
}

type QuoteReview = { authorId: string; author: { name: string; company: string | null; jobTitle: string | null; profile: { avatarSeed: string } | null } };

function QuoteAuthor({ review: r }: { review: QuoteReview }) {
  return (
    <figcaption className="mt-8 flex items-center gap-4">
      <UserAvatar name={r.author.name} seed={r.author.profile?.avatarSeed ?? `client-${r.authorId}`} className="size-11" />
      <div className="min-w-0">
        <p className="font-semibold">{r.author.name}</p>
        <p className="meta mt-1 truncate text-muted-foreground">{[r.author.jobTitle, r.author.company].filter(Boolean).join(" · ") || "Auftraggeber:in"}</p>
      </div>
    </figcaption>
  );
}

// Verzeichnis-Teaser nur im offenen Modus – Profile werden immer geladen, aber erst dort angezeigt
async function loadTeaserProfiles() {
  return db.profile.findMany({
    where: { verified: true, user: { status: { not: "gesperrt" } } },
    orderBy: [{ ratingAvg: "desc" }, { ratingCount: "desc" }],
    take: 6,
    select: {
      slug: true, headline: true, city: true, categories: true, dayRateMin: true, dayRateMax: true, availability: true, verified: true,
      ratingAvg: true, ratingCount: true, avatarSeed: true, coverSeed: true, isPro: true, user: { select: { id: true, name: true } },
    },
  });
}
