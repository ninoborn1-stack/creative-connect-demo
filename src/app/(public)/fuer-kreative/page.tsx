import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Sparkles } from "lucide-react";
import { FEATURES } from "@/lib/features";
import { StockImage } from "@/components/stock-image";
import { CtaLink, Eyebrow, FaqList, Marquee, PageHero, Section, SectionHeading } from "@/components/public/landing-bits";

export const metadata: Metadata = {
  title: "Für Artists",
  description: "Profil anlegen, von Brands angefragt werden und mit Artists aus Nestos Netzwerk zusammenarbeiten. Jetzt bei Creative Connect bewerben.",
};

const FAQ = [
  { q: "Wer kann sich bewerben?", a: "Artists aus Musik, Video, Foto, Design, Voice und Booking – mit Portfolio und Referenzen. Auch kleine Teams sind willkommen." },
  { q: "Wer entscheidet über die Aufnahme?", a: "Immer ein Mensch aus dem Team um Nesto. Rückmeldung bekommst du per Mail." },
  { q: "Wie funktioniert der Fast-Track?", a: "Wer aus Nestos Netzwerk empfohlen wird, landet direkt in der bevorzugten Prüfung – meist innerhalb weniger Tage." },
];

// Was Artists bekommen – bildgeführt, ein Satz pro Kachel
const PERKS = [
  { title: "Brands fragen an", text: "Dein Profil, deine Arbeiten – Anfragen landen direkt bei dir.", image: "id:96" },
  { title: "Kooperationen", text: "Kooperationsmöglichkeiten mit Artists aus Nestos Netzwerk.", image: "id:145" },
  { title: "In Paketen gebucht", text: "Nesto stellt für Pakete Crews aus dem Netzwerk zusammen.", image: "id:39" },
];

export default function ForCreativesPage() {
  return (
    <>
      <PageHero
        eyebrow="Für Artists"
        title="Zeig, was du kannst."
        text="Ein kuratiertes Netzwerk für Artists aus Musik, Video, Foto und Design."
        imageSeed="cc-fuer-kreative-studio"
      >
        <CtaLink href="/bewerben" variant="light">Als Artist bewerben <ArrowUpRight className="size-4" aria-hidden /></CtaLink>
        {FEATURES.einladen && <CtaLink href="/invite/CC-DEMO-2026" variant="ghost">Einladung einlösen</CtaLink>}
      </PageHero>

      {/* ---------- Laufband: Gewerke ---------- */}
      <div className="bg-primary py-4 text-primary-foreground sm:py-6">
        <Marquee
          items={["Musik", "Game-Audio", "Film", "Foto", "Design", "Voice", "Booking"]}
          itemClassName="poster text-[clamp(2.4rem,6vw,5.5rem)]"
          speed="45s"
        />
      </div>

      {/* ---------- Was du bekommst: Bildkacheln über die volle Breite ---------- */}
      <section aria-labelledby="why-title" className="pt-20 sm:pt-32">
        <div className="gutter">
          <SectionHeading id="why-title" index="01" eyebrow="Warum dabei sein" title="Gefunden werden." />
        </div>
        <ul className="mt-14 grid gap-px bg-border sm:mt-20 md:grid-cols-3">
          {PERKS.map((p, i) => (
            <li key={p.title} className="group relative isolate flex aspect-[4/5] flex-col justify-between overflow-hidden bg-[var(--ink)] p-5 text-[var(--bone)] sm:p-8">
              <StockImage seed={p.image} w={900} h={1125} sizes="(max-width: 768px) 100vw, 33vw" className="-z-10 opacity-60 grayscale transition-all duration-700 group-hover:scale-105 group-hover:opacity-85 group-hover:grayscale-0" />
              <div className="absolute inset-0 -z-10 bg-gradient-to-t from-[var(--ink)] via-[var(--ink)]/30 to-transparent" />
              <span className="meta text-white/70">{String(i + 1).padStart(2, "0")}</span>
              <div>
                <h3 className="poster text-[clamp(2.4rem,4vw,4.2rem)]">{p.title}</h3>
                <p className="mt-3 max-w-xs text-white/80">{p.text}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* ---------- Zwei Wege: Split über die volle Breite ---------- */}
      <section aria-labelledby="apply-title" className="border-t">
        <div className="gutter py-20 sm:py-32">
          <SectionHeading id="apply-title" index="02" eyebrow="Bewerbung" title="Zwei Wege rein." text="Jede Aufnahme prüft das Team persönlich." />
        </div>
        <div className="grid lg:grid-cols-2">
          <article className="gutter border-t py-12 sm:py-16 lg:border-r">
            <p className="meta text-muted-foreground">Weg 01</p>
            <h3 className="poster mt-6 text-[clamp(2.4rem,4.4vw,4.8rem)]">Selbst bewerben</h3>
            <p className="mt-6 max-w-lg text-muted-foreground sm:text-lg">Profil, Links und Portfolio einreichen. Rückmeldung per Mail.</p>
          </article>
          <article className="gutter flex flex-col bg-primary py-12 text-primary-foreground sm:py-16">
            <p className="meta flex items-center gap-3 text-primary-foreground/75"><span aria-hidden className="size-2 bg-[var(--bone)]" />Weg 02 · Fast-Track</p>
            <h3 className="poster mt-6 text-[clamp(2.4rem,4.4vw,4.8rem)]">Über Nestos Netzwerk</h3>
            <p className="mt-6 flex max-w-lg items-start gap-2 text-primary-foreground/85 sm:text-lg"><Sparkles className="mt-1 size-4 shrink-0" aria-hidden />Empfohlen? Dann bist du meist in wenigen Tagen dabei.</p>
          </article>
        </div>
        <div className="gutter flex flex-col gap-2 border-t py-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="meta text-muted-foreground">Selbst bewerben oder Fast-Track</p>
          <CtaLink href="/bewerben">Jetzt bewerben <ArrowUpRight className="size-4" aria-hidden /></CtaLink>
        </div>
      </section>

      {/* ---------- Community: Punkte (Sessions mit Nesto erst, wenn freigeschaltet) ---------- */}
      <section id="community" aria-labelledby="community-title" className="grid scroll-mt-16 bg-[var(--ink)] text-[var(--bone)] lg:grid-cols-2">
        <div className="gutter flex flex-col justify-center py-20 sm:py-28">
          <p className="meta flex items-center gap-3 text-white/60"><span aria-hidden className="size-2 bg-[var(--signal)]" />03 — Community</p>
          <h2 id="community-title" className="poster mt-6 text-[clamp(2.6rem,6.4vw,7rem)] text-balance">
            {FEATURES.sessions ? "Sessions mit Nesto und Punkte." : "Mitmachen, Punkte sammeln."}
          </h2>
          <p className="mt-6 max-w-md text-white/70 sm:text-lg">
            Wer sich einbringt, sammelt Punkte und tauscht sie gegen kleine Vorteile.
            {FEATURES.sessions && <> Dazu <Link href="/sessions" className="underline underline-offset-4 hover:text-white">Sessions mit Nesto</Link>.</>}
          </p>
        </div>
        <div className="relative min-h-[40svh]">
          <StockImage seed="id:453" w={1400} h={1000} sizes="(max-width: 1024px) 100vw, 50vw" className="opacity-80 grayscale-[30%]" />
        </div>
      </section>

      {/* ---------- FAQ ---------- */}
      <Section labelledBy="faq-title">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:sticky lg:top-24 lg:col-span-4 lg:self-start">
            <Eyebrow>04 — FAQ</Eyebrow>
            <h2 id="faq-title" className="poster mt-6 text-[clamp(2.8rem,6vw,6.5rem)]">Kurz gefragt.</h2>
          </div>
          <div className="lg:col-span-8">
            <FaqList items={FAQ} />
          </div>
        </div>
      </Section>
    </>
  );
}
