import Link from "next/link";
import {
  ArrowRight, BadgeCheck, Building2, FileCheck2, FileSignature, Fingerprint, Gamepad2, Landmark, Megaphone, Quote, ReceiptText,
  ScrollText, Server, ShieldCheck, Users, UsersRound,
} from "lucide-react";
import { db } from "@/lib/db";
import { getFees, getMarketplaceMode } from "@/lib/settings";
import { INDUSTRIES, LICENSE_MEDIA, LICENSE_TIERS, MARKETPLACE_MODES, TERRITORIES } from "@/lib/constants";
import { formatNumber } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { StockImage } from "@/components/stock-image";
import { UserAvatar } from "@/components/user-avatar";
import { ProfileCard } from "@/components/profile-card";
import { Eyebrow, FaqList, Section, SectionHeading, Wordmark } from "@/components/public/landing-bits";
import { INDUSTRY_DETAILS, INDUSTRY_ICONS } from "@/components/public/industry-data";
import { PUBLIC_WORK_SELECT, WorkCard } from "@/components/public/work-card";
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
  const gaming = INDUSTRIES.find((i) => i.slug === "gaming")!;
  const otherIndustries = INDUSTRIES.filter((i) => i.slug !== "gaming");

  const ways = [
    {
      icon: UsersRound, eyebrow: "Weg 1", title: "Crew beauftragen", image: "cc-way-crew",
      text: `Self-Service mit Briefing-Assistent oder Managed Crew durch Nesto und das Team. Verträge, Zahlung und Abnahme laufen in einem Projektraum – ${fees.serviceFeePct} % Servicegebühr, transparent ausgewiesen.`,
      href: canRegister ? "/registrieren" : "/fuer-unternehmen#kontakt", cta: canRegister ? "Briefing starten" : "Gespräch vereinbaren",
    },
    {
      icon: FileCheck2, eyebrow: "Weg 2", title: "Werke lizenzieren", image: "cc-way-licensing",
      text: `${formatNumber(workCount)} Tracks, Sounds, Voice-Packs, Artworks und Footage – sofort lizenzierbar in drei Stufen, mit Lizenzzertifikat und dokumentierter Rechtekette.`,
      href: "/lizenzen", cta: "Zum Lizenz-Katalog",
    },
    {
      icon: Megaphone, eyebrow: "Weg 3", title: "Ausschreiben & Pitches erhalten", image: "cc-way-pitch",
      text: `Projekt einmal beschreiben, Pitches von passenden Kreativen erhalten, Shortlist bilden und vergeben. Aktuell ${openOpps.length} offene Ausschreibungen.`,
      href: "/ausschreibungen", cta: "Ausschreibungen ansehen",
    },
  ];

  const stats = [
    { value: creativeCount, label: "geprüfte Kreative", icon: BadgeCheck },
    { value: companies.length, label: "Unternehmen", icon: Building2 },
    { value: workCount, label: "lizenzierbare Werke", icon: FileCheck2 },
    { value: openOpps.length, label: "offene Ausschreibungen", icon: Megaphone },
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

  return (
    <>
      {/* ---------- Hero: Bogen-Intro + Scroll-Übergang ---------- */}
      <Hero
        image={stockPhoto(453, 2400, 1600)} // Band auf der Bühne im Spotlight
        phaseLabel={MARKETPLACE_MODES[phaseIndex].label}
        creativeCount={creativeCount}
        companyCount={companies.length}
        workCount={workCount}
        canRegister={canRegister}
      />

      {/* ---------- Logo-Leiste ---------- */}
      {brandNames.length > 0 && (
        <section aria-labelledby="logos-title" className="border-t px-4 py-10 sm:py-14">
          <div className="mx-auto max-w-6xl">
            <h2 id="logos-title" className="text-center text-xs font-semibold tracking-[0.2em] text-muted-foreground uppercase">Arbeiten mit Creative Connect</h2>
            <ul className="mt-6 flex flex-wrap items-center justify-center gap-x-8 gap-y-4 opacity-80 sm:gap-x-12">
              {brandNames.map((n) => <li key={n}><Wordmark name={n} /></li>)}
            </ul>
          </div>
        </section>
      )}

      {/* ---------- Drei Wege ---------- */}
      <Section id="so-gehts" labelledBy="ways-title" className="border-t">
        <SectionHeading
          id="ways-title"
          eyebrow="Für Unternehmen"
          title="Drei Wege zusammenzuarbeiten."
          text="Ob Kampagne, Game-Soundtrack oder Imagefilm: Ihr wählt, wie ihr einkauft – Creative Connect kümmert sich um Verträge, Rechte und Abrechnung."
        />
        <ol className="mt-12 grid gap-4 md:grid-cols-3">
          {ways.map((w) => (
            <li key={w.title} className="flex flex-col overflow-hidden rounded-3xl border bg-card">
              <div className="relative aspect-[16/9]">
                <StockImage seed={w.image} w={800} h={450} sizes="(max-width: 768px) 100vw, 33vw" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <span className="absolute bottom-3 left-4 grid size-10 place-items-center rounded-xl bg-primary text-primary-foreground"><w.icon className="size-5" aria-hidden /></span>
              </div>
              <div className="flex flex-1 flex-col p-6">
                <Eyebrow className="text-muted-foreground">{w.eyebrow}</Eyebrow>
                <h3 className="mt-2 text-xl font-semibold">{w.title}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{w.text}</p>
                <Link href={w.href} className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
                  {w.cta} <ArrowRight className="size-4" aria-hidden />
                </Link>
              </div>
            </li>
          ))}
        </ol>
      </Section>

      {/* ---------- Branchen ---------- */}
      <Section id="branchen" labelledBy="ind-title" className="border-t bg-muted/30">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <SectionHeading id="ind-title" eyebrow="Branchen" title="Spezialisiert auf eure Branche." text="Gewerke, Lizenzmodelle und Abläufe, die zu eurem Markt passen – von Live-Service-Games bis Konzernkommunikation." />
          <Button asChild variant="outline" className="h-11 w-fit rounded-full px-5">
            <Link href="/branchen">Alle Branchen <ArrowRight className="size-4" aria-hidden /></Link>
          </Button>
        </div>
        <ul className="mt-12 grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
          {/* Gaming als Highlight */}
          <li className="group relative isolate min-h-[26rem] overflow-hidden rounded-3xl border sm:col-span-2 lg:row-span-2">
            <StockImage seed={INDUSTRY_DETAILS.gaming.imageSeed} w={1200} h={1200} sizes="(max-width: 1024px) 100vw, 50vw" className="-z-10 transition-transform duration-500 group-hover:scale-105" />
            <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/95 via-black/60 to-black/10" />
            <div className="flex h-full flex-col justify-between p-6 text-white sm:p-8">
              <div className="flex items-center justify-between gap-3">
                <span className="grid size-11 place-items-center rounded-xl bg-primary"><Gamepad2 className="size-5" aria-hidden /></span>
                <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur">Schwerpunkt</span>
              </div>
              <div>
                <h3 className="text-3xl font-bold sm:text-4xl">
                  <Link href="/branchen/gaming" className="after:absolute after:inset-0">{gaming.name}</Link>
                </h3>
                <p className="mt-2 max-w-md text-sm text-white/80 sm:text-base">{gaming.tagline}</p>
                <ul className="mt-4 flex flex-wrap gap-1.5">
                  {gaming.needs.map((n) => <li key={n} className="rounded-full bg-white/15 px-2.5 py-1 text-xs backdrop-blur">{n}</li>)}
                </ul>
                <p className="mt-4 text-xs text-white/70">
                  {companiesBy("gaming")} Studios im Netzwerk · {oppsBy("gaming")} offene Ausschreibungen · Buyouts weltweit
                </p>
              </div>
            </div>
          </li>
          {otherIndustries.map((ind, idx) => {
            const Icon = INDUSTRY_ICONS[ind.icon];
            return (
              <li key={ind.slug} className={cn("group relative isolate aspect-[4/3] overflow-hidden rounded-3xl border sm:aspect-auto sm:min-h-52", idx === otherIndustries.length - 1 && "sm:col-span-2 lg:col-span-1")}>
                <StockImage seed={INDUSTRY_DETAILS[ind.slug].imageSeed} w={700} h={520} sizes="(max-width: 640px) 100vw, 25vw" className="-z-10 transition-transform duration-500 group-hover:scale-105" />
                <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/90 via-black/50 to-black/10" />
                <div className="flex h-full flex-col justify-between p-5 text-white">
                  <span className="grid size-9 place-items-center rounded-lg bg-white/15 backdrop-blur"><Icon className="size-4" aria-hidden /></span>
                  <div>
                    <h3 className="text-lg font-semibold">
                      <Link href={`/branchen/${ind.slug}`} className="after:absolute after:inset-0">{ind.name}</Link>
                    </h3>
                    <p className="mt-0.5 line-clamp-2 text-xs text-white/75 sm:text-sm">{ind.tagline}</p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </Section>

      {/* ---------- Licensing ---------- */}
      <Section id="licensing" labelledBy="lic-title" className="border-t">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.2fr] lg:items-start">
          <div>
            <SectionHeading
              id="lic-title"
              eyebrow="Licensing"
              title="Lizenzieren statt verhandeln."
              text="Jedes Werk im Katalog hat drei klare Lizenzstufen. Ihr wählt Projekt und Stufe – Vertrag, Rechnung und Lizenzzertifikat entstehen automatisch."
            />
            <ul className="mt-6 space-y-3 text-sm text-muted-foreground">
              <li className="flex gap-3"><FileCheck2 className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden /><span><strong className="text-foreground">Lizenzzertifikat</strong> mit Lizenznummer, Umfang und Projekt – für Rechtsabteilung, Sender und Plattformen.</span></li>
              <li className="flex gap-3"><ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden /><span><strong className="text-foreground">Rechtekette</strong>: Urheber:in, Beteiligte und Freigaben sind pro Werk hinterlegt.</span></li>
              <li className="flex gap-3"><BadgeCheck className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden /><span><strong className="text-foreground">Fair</strong>: Die Lizenzgebühr geht vollständig an die Kreativen, die Servicegebühr wird separat ausgewiesen.</span></li>
            </ul>
          </div>
          <ol className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            {Object.entries(LICENSE_TIERS).map(([key, t], i) => (
              <li key={key} className={cn("rounded-2xl border p-5", i === 2 ? "border-primary/50 bg-primary/10" : "bg-card")}>
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className="font-semibold">{t.label}</h3>
                  <span className="text-xs text-muted-foreground">Stufe {i + 1}</span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{t.summary}</p>
                <p className="mt-3 text-xs text-muted-foreground">
                  {t.media.map((m) => LICENSE_MEDIA[m]).join(" · ")} — {TERRITORIES[t.territory]}, {t.durationMonths ? `${t.durationMonths} Monate` : "unbefristet"}
                </p>
              </li>
            ))}
          </ol>
        </div>
        {featuredWorks.length > 0 && (
          <>
            <div className="mt-14 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <h3 className="text-2xl font-bold">Ausgewählte Werke</h3>
              <Link href="/lizenzen" className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
                Gesamten Katalog ansehen <ArrowRight className="size-4" aria-hidden />
              </Link>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {featuredWorks.map((w) => <WorkCard key={w.id} work={w} />)}
            </div>
          </>
        )}
      </Section>

      {/* ---------- Kennzahlen + aktuelle Ausschreibungen ---------- */}
      <Section id="netzwerk" labelledBy="stats-title" className="border-t bg-muted/30">
        <SectionHeading id="stats-title" eyebrow="Das Netzwerk heute" title="Ein professionelles Netzwerk – kuratiert, nicht beliebig." />
        <ul className="mt-10 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {stats.map((s) => (
            <li key={s.label} className="rounded-3xl border bg-card p-5 sm:p-6">
              <s.icon className="size-5 text-primary" aria-hidden />
              <p className="mt-4 font-heading text-4xl font-extrabold tracking-tight tabular-nums sm:text-5xl">{formatNumber(s.value)}</p>
              <p className="mt-1 text-sm text-muted-foreground">{s.label}</p>
            </li>
          ))}
        </ul>
        {openOpps.length > 0 && (
          <div className="mt-12">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <h3 className="text-2xl font-bold">Aktuelle Ausschreibungen</h3>
              <Link href="/ausschreibungen" className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
                Alle Ausschreibungen <ArrowRight className="size-4" aria-hidden />
              </Link>
            </div>
            <div className="mt-6">
              <OpportunityList items={openOpps.slice(0, 4)} />
            </div>
          </div>
        )}
      </Section>

      {/* ---------- Vertrauen & Compliance ---------- */}
      <Section id="compliance" labelledBy="trust-title" className="border-t">
        <SectionHeading
          id="trust-title"
          eyebrow="Vertrauen & Compliance"
          title="Gebaut für Einkauf, Recht und Finanzen."
          text="Damit eure Kreativprojekte genauso sauber durch die Revision gehen wie jede andere Beschaffung."
        />
        <ul className="mt-12 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {trust.map((t) => (
            <li key={t.title}>
              <span className="grid size-10 place-items-center rounded-xl bg-primary/15 text-primary"><t.icon className="size-5" aria-hidden /></span>
              <h3 className="mt-4 font-semibold">{t.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{t.text}</p>
            </li>
          ))}
        </ul>
        <p className="mt-10 text-xs text-muted-foreground">
          Hinweise zu KSK und Steuern ersetzen keine Rechtsberatung. Ranking-Kriterien stehen offen in den <Link href="/agb#ranking" className="underline underline-offset-4">AGB</Link>.
        </p>
      </Section>

      {/* ---------- Stimmen ---------- */}
      {quotes.length > 0 && (
        <Section id="stimmen" labelledBy="voices-title" className="border-t bg-muted/30">
          <SectionHeading id="voices-title" eyebrow="Referenzen" title="Was Auftraggeber über ihre Projekte sagen." />
          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {quotes.map((r, i) => (
              <figure key={r.id} className={cn("flex flex-col rounded-3xl border p-6", i === 1 ? "bg-primary text-primary-foreground" : "bg-card")}>
                <Quote className={cn("size-7", i === 1 ? "text-primary-foreground/60" : "text-primary")} aria-hidden />
                <blockquote className="mt-4 flex-1 font-heading text-lg leading-snug font-medium">„{r.text}“</blockquote>
                <figcaption className="mt-6 flex items-center gap-3">
                  <UserAvatar name={r.author.name} seed={r.author.profile?.avatarSeed ?? `client-${r.authorId}`} className="size-10" />
                  <div className="min-w-0 text-sm">
                    <p className="truncate font-medium">{r.author.name}</p>
                    <p className={cn("truncate text-xs", i === 1 ? "text-primary-foreground/75" : "text-muted-foreground")}>
                      {[r.author.jobTitle, r.author.company].filter(Boolean).join(", ") || "Auftraggeber:in"}
                    </p>
                  </div>
                </figcaption>
              </figure>
            ))}
          </div>
        </Section>
      )}

      {/* ---------- Verzeichnis-Teaser (nur Modus offen) ---------- */}
      {mode === "open" && profiles.length > 0 && (
        <Section id="verzeichnis" labelledBy="dir-title" className="border-t">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <SectionHeading id="dir-title" eyebrow="Verzeichnis" title="Entdeckt das Netzwerk." text="Profile sind öffentlich sichtbar. Eine kleine Auswahl:" />
            <Button asChild variant="outline" className="h-11 w-fit rounded-full px-5">
              <Link href="/verzeichnis">Verzeichnis ansehen <ArrowRight className="size-4" aria-hidden /></Link>
            </Button>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {profiles.map((p) => <ProfileCard key={p.slug} profile={p} />)}
          </div>
        </Section>
      )}

      {/* ---------- Für Kreative (kurz) ---------- */}
      <Section id="kreative" labelledBy="creatives-title" className="border-t">
        <div className="grid gap-8 overflow-hidden rounded-3xl border bg-card md:grid-cols-2">
          <div className="relative aspect-[16/10] md:aspect-auto md:h-full md:min-h-80">
            <StockImage seed="cc-kreative-studio-session" w={900} h={700} sizes="(max-width: 768px) 100vw, 50vw" />
          </div>
          <div className="self-center p-6 sm:p-10 md:pl-0">
            <Eyebrow>Für Kreative</Eyebrow>
            <h2 id="creatives-title" className="mt-3 text-3xl font-bold text-balance sm:text-4xl">Aufträge von Unternehmen. {fees.creativeCommissionPct} % Provision.</h2>
            <p className="mt-4 text-muted-foreground">
              Bewirb dich mit Portfolio und Referenzen – oder komm über das große Netzwerk von Nesto per Fast-Track dazu. Im Netzwerk erwarten dich Ausschreibungen, Lizenz-Einnahmen aus deinen Werken und Projekte mit Marken, Studios und Labels.
            </p>
            <p className="mt-3 text-sm text-muted-foreground">
              Intern gibt es außerdem ein Community-Programm mit Sessions bei Nesto – <Link href="/fuer-kreative#community" className="text-primary underline-offset-4 hover:underline">mehr dazu</Link>.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="h-11 rounded-full px-5"><Link href="/bewerben">Als Kreative:r bewerben <ArrowRight className="size-4" aria-hidden /></Link></Button>
              <Button asChild size="lg" variant="outline" className="h-11 rounded-full px-5"><Link href="/fuer-kreative">Mehr erfahren</Link></Button>
            </div>
          </div>
        </div>
      </Section>

      {/* ---------- FAQ ---------- */}
      <Section id="faq" labelledBy="faq-title" className="border-t">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.4fr]">
          <SectionHeading id="faq-title" eyebrow="FAQ für Unternehmen" title="Häufige Fragen." text="Rechte, Rahmenverträge, Rechnungen, Teamkonten – noch etwas offen? Wir antworten persönlich." />
          <FaqList items={FAQ} />
        </div>
      </Section>

      {/* ---------- Abschluss-CTA ---------- */}
      <section aria-labelledby="cta-title" className="px-4 pb-20 sm:pb-28">
        <div className="glow relative mx-auto max-w-6xl overflow-hidden rounded-[2rem] border bg-card px-6 py-14 text-center sm:px-12 sm:py-20">
          <Eyebrow>Creative Connect für Unternehmen</Eyebrow>
          <h2 id="cta-title" className="mx-auto mt-4 max-w-3xl text-4xl leading-[1.02] font-extrabold tracking-tight text-balance sm:text-6xl">
            Euer nächstes Projekt beginnt hier.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            {canRegister
              ? "Firmenkonto in zwei Minuten anlegen – oder mit Nesto und dem Team über einen Rahmenvertrag sprechen."
              : "Creative Connect öffnet gerade schrittweise für Unternehmen. Fragt eine Demo an – wir melden uns persönlich."}
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            {canRegister && (
              <Button asChild size="lg" className="h-12 rounded-full px-6 text-base">
                <Link href="/registrieren">Projekt starten <ArrowRight className="size-4" aria-hidden /></Link>
              </Button>
            )}
            <Button asChild size="lg" variant={canRegister ? "outline" : "default"} className="h-12 rounded-full px-6 text-base">
              <Link href="/fuer-unternehmen#kontakt">Demo anfragen</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
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
