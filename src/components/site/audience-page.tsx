import { ArrowUpRight, Lock } from "lucide-react";
import { CtaLink, Eyebrow, PageHero, Section } from "@/components/site/bits";
import type { PhotoName } from "@/components/site/photo";

type Item = { title: string; text: string };

// Gemeinsamer Aufbau der Zielgruppen-Seiten (Artists, Veranstalter & Locations, Unternehmen):
// Seiten-Hero → Nutzen im Haarlinien-Raster → optional Formate → drei Schritte → Abschluss-CTA
export function AudiencePage({
  eyebrow, title, text, image, cta, secondary, benefitsTitle, benefits, formatsTitle, formats, stepsTitle, steps, access,
}: {
  eyebrow: string; title: string; text: string; image: PhotoName;
  cta: { href: string; label: string }; secondary?: { href: string; label: string };
  access?: { title: string; text: string; cta: string; href: string };
  benefitsTitle: string; benefits: Item[]; formatsTitle?: string; formats?: string[]; stepsTitle: string; steps: Item[];
}) {
  const buttons = (
    <>
      <CtaLink href={cta.href}>{cta.label} <ArrowUpRight className="size-4" aria-hidden /></CtaLink>
      {secondary && <CtaLink href={secondary.href} variant="ghost">{secondary.label}</CtaLink>}
    </>
  );
  return (
    <>
      <PageHero eyebrow={eyebrow} title={title} text={text} image={image}>{buttons}</PageHero>

      <Section labelledBy="benefits-title">
        <Eyebrow>01 · {benefitsTitle.replace(/\.$/, "")}</Eyebrow>
        <h2 id="benefits-title" className="poster mt-6 text-[clamp(2.2rem,7vw,6.5rem)]">{benefitsTitle}</h2>
        <ul className="mt-14 grid grid-cols-[minmax(0,1fr)] gap-px border bg-border sm:grid-cols-2">
          {benefits.map((b, i) => (
            <li key={b.title} className="flex flex-col gap-8 bg-background p-6 sm:p-8">
              <span className="meta text-primary">{String(i + 1).padStart(2, "0")}</span>
              <div>
                <h3 className="poster text-[clamp(1.6rem,3.4vw,3.4rem)] min-[400px]:text-[clamp(2rem,3.4vw,3.4rem)]">{b.title}</h3>
                <p className="mt-3 max-w-md text-muted-foreground">{b.text}</p>
              </div>
            </li>
          ))}
        </ul>
      </Section>

      {formats && formatsTitle && (
        <section aria-labelledby="formats-title" className="overflow-hidden bg-[var(--stone)] py-12 text-[var(--ink)] sm:py-16">
          <h2 id="formats-title" className="meta gutter">{formatsTitle}</h2>
          <ul className="gutter mt-6 flex flex-wrap gap-x-6 gap-y-2">
            {formats.map((f, i) => (
              <li key={f} className="poster text-[clamp(1.8rem,5.4vw,5rem)] whitespace-nowrap">
                {f}{i < formats.length - 1 && <span aria-hidden className="ml-6 text-primary">·</span>}
              </li>
            ))}
          </ul>
        </section>
      )}

      {access && (
        <section aria-labelledby="access-title" className="gutter grid gap-8 bg-[var(--ink)] py-16 text-[var(--bone)] sm:py-20 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <p className="meta flex items-center gap-3 text-[var(--stone)]"><Lock className="size-4" aria-hidden />Backstage</p>
            <h2 id="access-title" className="poster mt-6 text-[clamp(2.2rem,6vw,5rem)] lg:text-[clamp(2.4rem,3.2vw,4rem)]">{access.title}</h2>
          </div>
          <div className="lg:col-span-7 lg:self-end">
            <p className="max-w-[65ch] text-white/85 sm:text-lg">{access.text}</p>
            <CtaLink href={access.href} variant="light" className="mt-8">{access.cta} <ArrowUpRight className="size-4" aria-hidden /></CtaLink>
          </div>
        </section>
      )}

      <Section labelledBy="steps-title" className="border-t">
        <Eyebrow>02 · {stepsTitle.replace(/\.$/, "")}</Eyebrow>
        <h2 id="steps-title" className="poster mt-6 text-[clamp(2.2rem,7vw,6.5rem)]">{stepsTitle}</h2>
        <ol className="mt-12 grid border-t md:grid-cols-3">
          {steps.map((s, i) => (
            <li key={s.title} className="border-b py-8 md:border-r md:border-b-0 md:px-8 md:first:pl-0 md:last:border-r-0">
              <span className="poster text-7xl text-primary">{i + 1}</span>
              <h3 className="mt-6 text-2xl font-semibold tracking-tight">{s.title}</h3>
              <p className="mt-2 text-muted-foreground">{s.text}</p>
            </li>
          ))}
        </ol>
        <div className="mt-12 flex flex-col gap-2 sm:flex-row">{buttons}</div>
      </Section>
    </>
  );
}
