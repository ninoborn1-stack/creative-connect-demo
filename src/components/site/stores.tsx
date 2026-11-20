import { Globe, Play, Smartphone } from "lucide-react";
import { LINKS } from "@/lib/brand";
import type { Dict } from "@/lib/i18n";
import { cn } from "@/lib/utils";

// Store-Links. PLATZHALTER: zum Start durch die offiziellen Badges von Apple und Google ersetzen
// (deren Richtlinien verlangen die Original-Grafiken).
export function StoreBadges({ t, className, web = false }: { t: Dict["stores"]; className?: string; web?: boolean }) {
  const badge = "inline-flex h-14 items-center gap-3 border border-white/30 bg-black px-4 text-white transition-colors hover:border-white";
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      <a href={LINKS.appStore} className={badge}>
        <Smartphone className="size-6" aria-hidden />
        <span className="flex flex-col leading-tight"><span className="text-[0.65rem]">{t.appStore.top}</span><span className="text-lg font-semibold">{t.appStore.bottom}</span></span>
      </a>
      <a href={LINKS.playStore} className={badge}>
        <Play className="size-6" aria-hidden />
        <span className="flex flex-col leading-tight"><span className="text-[0.65rem] uppercase">{t.playStore.top}</span><span className="text-lg font-semibold">{t.playStore.bottom}</span></span>
      </a>
      {web && (
        <a href={LINKS.webApp} className={badge}>
          <Globe className="size-6" aria-hidden />
          <span className="text-base font-semibold">{t.web}</span>
        </a>
      )}
    </div>
  );
}
