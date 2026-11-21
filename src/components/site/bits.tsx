import Link from "next/link";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Photo, type PhotoName } from "@/components/site/photo";

// Bausteine der öffentlichen Seiten im Plakat-Look: volle Breite (gutter), harte Kanten, Versal-Headlines (poster),
// Mono-Metadaten (meta). Utilities stehen in globals.css.

export function Eyebrow({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={cn("meta flex items-center gap-3 text-muted-foreground", className)}>
      <span aria-hidden className="size-2 shrink-0 bg-primary" />
      {children}
    </p>
  );
}

export function SectionHeading({
  eyebrow, title, text, id, index, align = "left",
}: { eyebrow: string; title: React.ReactNode; text?: string; id?: string; index?: string; align?: "left" | "center" }) {
  if (align === "center") {
    return (
      <div className="mx-auto max-w-5xl text-center">
        <Eyebrow className="justify-center">{index ? `${index} · ${eyebrow}` : eyebrow}</Eyebrow>
        <h2 id={id} className="poster mt-6 text-[clamp(2.4rem,6.4vw,6.5rem)]">{title}</h2>
        {text && <p className="mx-auto mt-6 max-w-2xl text-base text-pretty text-muted-foreground sm:text-lg">{text}</p>}
      </div>
    );
  }
  return (
    <div className="grid gap-6 lg:grid-cols-12 lg:items-end lg:gap-10">
      <div className="lg:col-span-8">
        <Eyebrow>{index ? `${index} · ${eyebrow}` : eyebrow}</Eyebrow>
        <h2 id={id} className="poster mt-6 text-[clamp(2.2rem,6.4vw,6.5rem)] lg:text-[clamp(3rem,4.6vw,5.6rem)]">{title}</h2>
      </div>
      {text && <p className="text-base text-pretty text-muted-foreground sm:text-lg lg:col-span-4 lg:pb-2">{text}</p>}
    </div>
  );
}

export function Section({ id, labelledBy, className, children }: { id?: string; labelledBy?: string; className?: string; children: React.ReactNode }) {
  return (
    <section id={id} aria-labelledby={labelledBy} className={cn("gutter scroll-mt-16 py-20 sm:py-32", className)}>
      {children}
    </section>
  );
}

const CTA_VARIANTS = {
  primary: "bg-primary text-primary-foreground hover:bg-primary/85",
  outline: "border border-current hover:bg-foreground hover:text-background hover:border-foreground",
  light: "bg-[var(--bone)] text-[var(--ink)] hover:bg-white",
  ghost: "border border-white/40 text-white hover:bg-white hover:text-black",
} as const;

// Kantige Plakat-Buttons; externe Ziele (http, mailto) als normaler Link
export function CtaLink({ href, children, variant = "primary", className }: { href: string; children: React.ReactNode; variant?: keyof typeof CTA_VARIANTS; className?: string }) {
  const cls = cn("meta inline-flex h-12 items-center justify-center gap-2 px-5 whitespace-nowrap transition-colors", CTA_VARIANTS[variant], className);
  if (/^(https?:|mailto:)/.test(href)) return <a href={href} className={cls}>{children}</a>;
  return <Link href={href} className={cls}>{children}</Link>;
}

// Endloses Laufband. Inhalt wird verdoppelt, damit die Animation (-50 %) nahtlos ist.
export function Marquee({ items, className, itemClassName, reverse, speed = "40s", separator }: {
  items: React.ReactNode[]; className?: string; itemClassName?: string; reverse?: boolean; speed?: string; separator?: React.ReactNode;
}) {
  const row = items.length < 8 ? [...items, ...items] : items;
  return (
    <div className={cn("marquee-wrap overflow-hidden", className)}>
      <div className="marquee" data-reverse={reverse ? "" : undefined} style={{ "--marquee-speed": speed } as React.CSSProperties}>
        {[0, 1].map((half) => (
          <ul key={half} aria-hidden={half === 1 ? true : undefined} className="flex shrink-0 items-center">
            {row.map((item, i) => (
              <li key={i} className={cn("flex shrink-0 items-center", itemClassName)}>
                {item}
                <span aria-hidden className="px-[0.5em]">{separator ?? <Disc />}</span>
              </li>
            ))}
          </ul>
        ))}
      </div>
    </div>
  );
}

// Kleine Schallplatte als Trenner/Ornament
export function Disc({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("inline-block size-[0.55em] align-middle", className)} aria-hidden>
      <circle cx="12" cy="12" r="11" fill="currentColor" />
      <circle cx="12" cy="12" r="7.5" fill="none" stroke="var(--background)" strokeOpacity=".35" strokeWidth="1" />
      <circle cx="12" cy="12" r="3.2" fill="var(--signal)" />
    </svg>
  );
}

export function FaqList({ items }: { items: { q: string; a: string }[] }) {
  return (
    <div className="border-t">
      {items.map((f, i) => (
        <details key={f.q} className="group border-b">
          <summary className="grid cursor-pointer list-none grid-cols-[2.5rem_1fr_auto] items-baseline gap-3 py-6 sm:grid-cols-[4rem_1fr_auto] [&::-webkit-details-marker]:hidden">
            <span className="meta text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>
            <span className="text-lg font-semibold tracking-tight text-balance transition-colors group-hover:text-primary sm:text-2xl">{f.q}</span>
            <Plus className="size-5 shrink-0 self-center text-primary transition-transform duration-300 group-open:rotate-45" aria-hidden />
          </summary>
          <p className="max-w-3xl pb-7 pl-[3.25rem] text-sm leading-relaxed text-muted-foreground sm:pl-[4.75rem] sm:text-base">{f.a}</p>
        </details>
      ))}
    </div>
  );
}

// Seiten-Hero für Unterseiten: vollflächiges Bild, Plakat-Headline unten links
export function PageHero({ eyebrow, title, text, image, children }: { eyebrow: string; title: React.ReactNode; text: string; image: PhotoName; children?: React.ReactNode }) {
  return (
    <section className="relative isolate flex min-h-[78svh] flex-col justify-end overflow-hidden bg-[var(--ink)] text-[var(--bone)]">
      <div className="absolute inset-0 -z-10">
        <Photo name={image} sizes="100vw" priority className="opacity-70 grayscale-[35%]" />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--ink)] via-[var(--ink)]/60 to-[var(--ink)]/10" />
      </div>
      <div className="gutter pt-28 pb-12 sm:pb-16">
        <p className="meta flex items-center gap-3 text-white/75">
          <span aria-hidden className="size-2 bg-primary" />
          {eyebrow}
        </p>
        <h1 className="poster mt-6 text-[clamp(2.6rem,9vw,8rem)]">{title}</h1>
        <div className="mt-8 grid gap-8 border-t border-white/20 pt-6 lg:grid-cols-12">
          <p className="text-base text-pretty text-white/80 sm:text-lg lg:col-span-6">{text}</p>
          {children && <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap lg:col-span-6 lg:justify-end lg:self-end">{children}</div>}
        </div>
      </div>
    </section>
  );
}
