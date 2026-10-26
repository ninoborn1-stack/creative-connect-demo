import { CalendarCheck, Camera, ChevronDown, Drama, Mic, Music, PenTool, Video, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { StockImage } from "@/components/stock-image";

export const CATEGORY_ICONS: Record<string, LucideIcon> = { Music, Mic, Video, Camera, CalendarCheck, Drama, PenTool };

export function Eyebrow({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={cn("text-xs font-semibold tracking-[0.2em] text-primary uppercase", className)}>{children}</p>;
}

export function SectionHeading({ eyebrow, title, text, id, align = "left" }: { eyebrow: string; title: React.ReactNode; text?: string; id?: string; align?: "left" | "center" }) {
  return (
    <div className={cn("max-w-2xl", align === "center" && "mx-auto text-center")}>
      <Eyebrow>{eyebrow}</Eyebrow>
      <h2 id={id} className="mt-3 text-3xl leading-[1.05] font-bold text-balance sm:text-5xl">{title}</h2>
      {text && <p className="mt-4 text-base text-pretty text-muted-foreground sm:text-lg">{text}</p>}
    </div>
  );
}

export function Section({ id, labelledBy, className, children }: { id?: string; labelledBy?: string; className?: string; children: React.ReactNode }) {
  return (
    <section id={id} aria-labelledby={labelledBy} className={cn("scroll-mt-16 px-4 py-20 sm:py-28", className)}>
      <div className="mx-auto max-w-6xl">{children}</div>
    </section>
  );
}

export function FaqList({ items }: { items: { q: string; a: string }[] }) {
  return (
    <div className="divide-y rounded-3xl border bg-card">
      {items.map((f) => (
        <details key={f.q} className="group px-5 py-1 sm:px-6">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 font-medium [&::-webkit-details-marker]:hidden">
            {f.q}
            <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" aria-hidden />
          </summary>
          <p className="pb-5 text-sm leading-relaxed text-muted-foreground">{f.a}</p>
        </details>
      ))}
    </div>
  );
}

// Dezente Wortmarke einer (fiktiven) Firma – Text statt Logo-Datei
export function Wordmark({ name, className }: { name: string; className?: string }) {
  return <span className={cn("font-heading text-base font-semibold tracking-tight whitespace-nowrap text-muted-foreground sm:text-lg", className)}>{name}</span>;
}

// Kompakter Seiten-Hero für Unterseiten (Bild + Verlauf + Text)
export function PageHero({ eyebrow, title, text, imageSeed, children }: { eyebrow: string; title: React.ReactNode; text: string; imageSeed: string; children?: React.ReactNode }) {
  return (
    <section className="relative isolate overflow-hidden border-b">
      <div className="absolute inset-0 -z-10">
        <StockImage seed={imageSeed} w={1920} h={900} sizes="100vw" priority />
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/70 to-black/30" />
      </div>
      <div className="mx-auto max-w-6xl px-4 py-16 text-white sm:py-24">
        <p className="text-xs font-semibold tracking-[0.2em] text-white/80 uppercase">{eyebrow}</p>
        <h1 className="mt-3 max-w-3xl text-4xl leading-[1.05] font-bold text-balance sm:text-6xl">{title}</h1>
        <p className="mt-4 max-w-2xl text-base text-pretty text-white/80 sm:text-lg">{text}</p>
        {children && <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">{children}</div>}
      </div>
    </section>
  );
}
