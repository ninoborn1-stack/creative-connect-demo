import Link from "next/link";
import { Globe, Play, Smartphone } from "lucide-react";
import { LINKS } from "@/lib/brand";
import { href, type Dict, type Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

// Store-Buttons. Solange in brand.ts keine Store-URL steht, führen sie zur Warteliste und tragen „Bald verfügbar“ -
// keine toten Links. PLATZHALTER: zum Start durch die offiziellen Badges von Apple und Google ersetzen.
export function StoreBadges({ lang, t, className, web = false }: { lang: Locale; t: Dict["stores"]; className?: string; web?: boolean }) {
  const badge = "relative inline-flex h-14 items-center gap-3 border border-white/30 bg-black px-4 text-white transition-colors hover:border-white";
  const waitlist = href(lang, "warteliste");
  const items = [
    { url: LINKS.appStore, icon: Smartphone, top: t.appStore.top, bottom: t.appStore.bottom },
    { url: LINKS.playStore, icon: Play, top: t.playStore.top, bottom: t.playStore.bottom },
  ];
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {items.map(({ url, icon: Icon, top, bottom }) => {
        const content = (
          <>
            <Icon className="size-6" aria-hidden />
            <span className="flex flex-col leading-tight"><span className="text-[0.65rem]">{url ? top : t.soon}</span><span className="text-lg font-semibold">{bottom}</span></span>
          </>
        );
        return url ? (
          <a key={bottom} href={url} className={badge}>{content}</a>
        ) : (
          <Link key={bottom} href={waitlist} className={cn(badge, "opacity-90")} aria-label={`${bottom}: ${t.soon}`}>{content}</Link>
        );
      })}
      {web && LINKS.webApp && (
        <a href={LINKS.webApp} className={badge}>
          <Globe className="size-6" aria-hidden />
          <span className="text-base font-semibold">{t.web}</span>
        </a>
      )}
    </div>
  );
}
