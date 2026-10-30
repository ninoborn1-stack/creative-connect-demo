import type { Metadata } from "next";
import { ArrowUpRight, Check } from "lucide-react";
import { PACKAGES } from "@/lib/packages";
import { formatEur } from "@/lib/format";
import { StockImage } from "@/components/stock-image";
import { CtaLink, Eyebrow, PageHero, Section } from "@/components/public/landing-bits";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Pakete" };

const STEPS = [
  { title: "Paket wählen", text: "Umfang und Startpreis stehen fest." },
  { title: "Crew bekommen", text: "Nesto und das Team stellen die passenden Artists zusammen und schicken ein Angebot." },
  { title: "Produzieren", text: "Termin, Vertrag und Abnahme laufen über einen Projektraum." },
];

export default function PackagesPage() {
  return (
    <>
      <PageHero
        eyebrow="Pakete"
        title="Fertig geschnürte Produktionen."
        text="Fester Umfang, klarer Startpreis, eine Crew aus Nestos Netzwerk. Anfragen ist kostenlos und unverbindlich."
        imageSeed="id:39"
      >
        <CtaLink href="#song-video" variant="light">Pakete ansehen</CtaLink>
      </PageHero>

      <ol aria-label="Pakete">
        {PACKAGES.map((p, i) => (
          <li key={p.slug} id={p.slug} className="grid scroll-mt-16 border-b lg:grid-cols-2">
            <div className={cn("relative min-h-[40svh] lg:min-h-[70svh]", i % 2 === 1 && "lg:order-2")}>
              <StockImage seed={p.imageSeed} w={1400} h={1100} sizes="(max-width: 1024px) 100vw, 50vw" className="grayscale-[25%]" />
              {p.featured && <span className="meta absolute top-4 left-4 bg-[var(--signal)] px-2 py-1 text-white">Beliebt</span>}
            </div>
            <div className="gutter flex flex-col justify-center py-14 sm:py-20">
              <Eyebrow>Paket {String(i + 1).padStart(2, "0")} · Lieferung {p.delivery}</Eyebrow>
              <h2 className="poster mt-6 text-[clamp(3rem,7vw,7.5rem)]">{p.name}</h2>
              <p className="mt-4 max-w-md text-lg text-muted-foreground">{p.tagline}</p>
              <ul className="mt-8 max-w-md border-t">
                {p.includes.map((item) => (
                  <li key={item} className="flex items-center gap-3 border-b py-3"><Check className="size-4 shrink-0 text-primary" aria-hidden />{item}</li>
                ))}
              </ul>
              <div className="mt-8 flex flex-wrap items-center gap-6">
                <p className="poster text-[clamp(2.4rem,4vw,3.6rem)] text-primary"><span className="meta mr-2 align-middle text-muted-foreground">ab</span>{formatEur(p.price)}</p>
                <CtaLink href={`/paket-anfrage?paket=${p.slug}`}>Paket anfragen <ArrowUpRight className="size-4" aria-hidden /></CtaLink>
              </div>
            </div>
          </li>
        ))}
      </ol>

      <Section labelledBy="steps-title">
        <Eyebrow>So läuft’s</Eyebrow>
        <h2 id="steps-title" className="poster mt-6 text-[clamp(2.6rem,6vw,6.5rem)]">Drei Schritte.</h2>
        <ol className="mt-12 grid border-t md:grid-cols-3">
          {STEPS.map((s, i) => (
            <li key={s.title} className={cn("py-8 md:pr-8", i > 0 && "border-t md:border-t-0 md:border-l md:pl-8")}>
              <span className="meta text-primary">{String(i + 1).padStart(2, "0")}</span>
              <h3 className="mt-4 text-2xl font-semibold">{s.title}</h3>
              <p className="mt-2 text-muted-foreground">{s.text}</p>
            </li>
          ))}
        </ol>
        <p className="mt-8 max-w-2xl text-sm text-muted-foreground">
          Etwas anderes im Kopf? Frag einen Artist direkt an – oder schreib uns, dann schnüren wir ein eigenes Paket.
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <CtaLink href="/mitglieder" variant="outline">Artist anfragen</CtaLink>
          <CtaLink href="/fuer-unternehmen#kontakt" variant="outline">Eigenes Paket anfragen</CtaLink>
        </div>
      </Section>
    </>
  );
}
