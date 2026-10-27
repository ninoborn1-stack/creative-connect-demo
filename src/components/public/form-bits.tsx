"use client";

import { CircleCheck } from "lucide-react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export function Field({ id, label, hint, children, className }: { id: string; label: string; hint?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={id}>{label}</Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function FormError({ message }: { message?: string }) {
  if (!message) return null;
  return <p role="alert" className="border-l-2 border-destructive bg-destructive/10 px-3 py-2 text-sm text-destructive">{message}</p>;
}

export function SuccessPanel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div role="status" className="flex flex-col items-start gap-3 border-t-4 border-emerald-500 pt-6">
      <p className="meta flex items-center gap-2 text-emerald-600 dark:text-emerald-400"><CircleCheck className="size-4" aria-hidden /> Erledigt</p>
      <h2 className="poster text-[clamp(2.4rem,5vw,4.5rem)] text-balance">{title}</h2>
      <div className="space-y-2 text-sm text-muted-foreground sm:text-base">{children}</div>
    </div>
  );
}

const PANEL_TONES = {
  ink: { panel: "bg-[var(--ink)] text-[var(--bone)]", muted: "text-white/70", dot: "bg-[var(--signal)]", rule: "border-white/15" },
  primary: { panel: "bg-primary text-primary-foreground", muted: "text-primary-foreground/80", dot: "bg-[var(--bone)]", rule: "border-primary-foreground/25" },
} as const;

// Geteilter Bildschirm für Formular- und Auth-Seiten: links ein Plakat-Panel mit der einzigen h1,
// rechts der Inhalt auf dem Seitenhintergrund. Auf Mobilgeräten untereinander.
export function PosterSplit({
  eyebrow, title, intro, aside, tone = "ink", children, className,
}: {
  eyebrow: string;
  title: React.ReactNode;
  intro?: React.ReactNode;
  aside?: React.ReactNode;
  tone?: keyof typeof PANEL_TONES;
  children: React.ReactNode;
  className?: string;
}) {
  const t = PANEL_TONES[tone];
  return (
    <div className={cn("grid min-h-[calc(100svh-4rem)] lg:grid-cols-2", className)}>
      <section className={cn("gutter flex min-w-0 flex-col justify-between gap-12 py-12 sm:py-16", t.panel)}>
        <div>
          <p className={cn("meta flex items-center gap-3", t.muted)}>
            <span aria-hidden className={cn("size-2 shrink-0", t.dot)} />
            {eyebrow}
          </p>
          <h1 className="poster mt-8 text-[clamp(3rem,7.4vw,8.5rem)] break-words hyphens-auto text-balance">{title}</h1>
          {intro && <div className={cn("mt-8 max-w-xl text-base text-pretty sm:text-lg", t.muted)}>{intro}</div>}
        </div>
        {aside && <div className={cn("border-t pt-6", t.rule)}>{aside}</div>}
      </section>
      <div className="gutter flex min-w-0 flex-col justify-center py-12 sm:py-16">
        <div className="w-full max-w-xl">{children}</div>
      </div>
    </div>
  );
}

// Nummerierte Zeilen für Vorteile/Hinweise im Plakat-Panel
export function PanelList({ items, className }: { items: { title: string; text?: string }[]; className?: string }) {
  return (
    <ol className={cn("text-sm", className)}>
      {items.map((p, i) => (
        <li key={p.title} className="grid grid-cols-[2.5rem_1fr] gap-3 border-b border-current/15 py-3 first:pt-0 last:border-b-0 last:pb-0">
          <span className="meta pt-0.5 opacity-60">{String(i + 1).padStart(2, "0")}</span>
          <span>
            <span className={cn(p.text && "font-semibold")}>{p.title}</span>
            {p.text && <span className="block opacity-70">{p.text}</span>}
          </span>
        </li>
      ))}
    </ol>
  );
}
