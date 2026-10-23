import { CalendarCheck, Camera, Drama, Mic, Music, PenTool, Video, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

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
