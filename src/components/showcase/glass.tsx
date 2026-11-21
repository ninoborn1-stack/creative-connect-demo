import { BadgeCheck, Bell, Heart, Play } from "lucide-react";
import { APP_NAME } from "@/lib/brand";
import { cn } from "@/lib/utils";
import { Photo, type PhotoName } from "@/components/site/photo";
import type { Dict } from "@/lib/i18n";

// Glas-Karten, die aus dem Handy schweben. Rein dekorativ (aria-hidden am Container), höchstens ein Scarlet-Detail
// je Karte. Inhalte kommen aus dem Wörterbuch (showcase.cards), Fotos aus assets/photos.

type Cards = Dict["showcase"]["cards"];

export function Glass({ className, children, blur = true }: { className?: string; children: React.ReactNode; blur?: boolean }) {
  return <div className={cn("sc-glass", blur && "sc-glass--blur", className)}>{children}</div>;
}

function Avatar({ name, className }: { name: PhotoName; className?: string }) {
  return <span className={cn("relative block size-9 shrink-0 overflow-hidden rounded-full ring-2 ring-[var(--ink)]", className)}><Photo name={name} sizes="48px" /></span>;
}

export function Wave({ bars = 14, className }: { bars?: number; className?: string }) {
  return (
    <span className={cn("sc-wave flex h-6 items-center gap-[2px]", className)}>
      {Array.from({ length: bars }, (_, i) => (
        <span key={i} className="block w-1 rounded-full bg-current" style={{ height: `${30 + ((i * 37) % 70)}%`, animationDelay: `${(i % 5) * -0.18}s` }} />
      ))}
    </span>
  );
}

export function EventCard({ t }: { t: Cards["event"] }) {
  return (
    <Glass className="w-60 p-3">
      <div className="relative h-20 overflow-hidden rounded-xl"><Photo name="card-event" sizes="240px" /></div>
      <p className="mt-2.5 text-sm font-semibold">{t.title}</p>
      <p className="meta mt-0.5 text-white/65">{t.meta}</p>
      <div className="mt-2 flex gap-1.5">
        <span className="meta rounded-full bg-primary px-2 py-1 text-[0.55rem] whitespace-nowrap text-primary-foreground">{t.badge}</span>
        <span className="meta rounded-full border border-white/25 px-2 py-1 text-[0.55rem] whitespace-nowrap">{t.tickets}</span>
      </div>
    </Glass>
  );
}

export function TrackCard({ t }: { t: Cards["track"] }) {
  return (
    <Glass className="flex w-60 items-center gap-3 p-3">
      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground"><Play className="size-4 translate-x-px fill-current" /></span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{t.title}</p>
        <p className="meta truncate text-[0.6rem] text-white/65">{t.meta}</p>
        <Wave className="mt-1 text-[var(--stone)]" />
      </div>
    </Glass>
  );
}

export function MatchCard({ t }: { t: Cards["match"] }) {
  return (
    <Glass className="w-48 p-3 text-center">
      <div className="flex justify-center -space-x-3"><Avatar name="for-artists" className="size-11" /><Avatar name="artists" className="size-11" /></div>
      <p className="accent mt-2 text-xl leading-none">{t.title}</p>
      <p className="meta mt-1.5 text-[0.6rem] text-white/65">{t.text}</p>
    </Glass>
  );
}

export function PushCard({ t }: { t: Cards["push"] }) {
  return (
    <Glass className="flex w-64 items-center gap-3 p-3">
      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[var(--bone)] text-[var(--ink)]"><Heart className="size-4 fill-primary text-primary" /></span>
      <div className="min-w-0">
        <p className="meta flex items-center gap-1.5 text-[0.6rem] text-white/65"><Bell className="size-3" />{t.app.replace("{app}", APP_NAME)}</p>
        <p className="text-sm leading-snug font-medium">{t.text}</p>
      </div>
    </Glass>
  );
}

export function ProfileChip({ t }: { t: Cards["profile"] }) {
  return (
    <Glass className="flex w-max items-center gap-2.5 rounded-full py-1.5 pr-4 pl-1.5 whitespace-nowrap">
      <Avatar name="artists" />
      <div>
        <p className="text-sm leading-tight font-semibold">{t.name}</p>
        <p className="meta flex items-center gap-1 text-[0.6rem] text-[var(--stone)]"><BadgeCheck className="size-3" />{t.badge} · {t.role}</p>
      </div>
    </Glass>
  );
}

export function FilterChips({ chips, className }: { chips: readonly string[]; className?: string }) {
  return (
    <div className={cn("flex gap-1.5", className)}>
      {chips.map((c, i) => (
        <span key={c} className={cn("sc-glass meta rounded-full px-3 py-2 text-[0.6rem] whitespace-nowrap", i === 0 && "border-[var(--stone)]/60 text-[var(--stone)]")}>{c}</span>
      ))}
    </div>
  );
}
