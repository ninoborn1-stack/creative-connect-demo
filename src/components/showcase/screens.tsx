import { cn } from "@/lib/utils";
import type { Dict, Locale } from "@/lib/i18n";
import { PhoneFrame } from "@/components/preview/phone-frame";
import { UI } from "@/content/preview-data";
import { LazyScreen } from "@/components/showcase/lazy-screen";

// Showcase-Handy: CSS-Rahmen mit einem App-Screen (screen-views.tsx), der erst nachgeladen wird, wenn das Handy
// in die Nähe des Viewports kommt. Bis dahin und ohne JavaScript steht ein ruhiges Foto im Display.
export type ScreenKey = "swipe" | "events" | "music" | "matches" | "backstage";

// Handy mit statischem Screen. Größe über --pw (Breite), Glanz-Reflex über das Display (sc-shine).
export function ShowcasePhone({ k, lang, t, className, shine = true, pw = "280px" }: { k: ScreenKey; lang: Locale; t: Dict; className?: string; shine?: boolean; pw?: string }) {
  return (
    <div className={cn("sc-phone relative", shine && "sc-phone--shine", className)} aria-hidden>
      <PhoneFrame time={UI[lang].status} className="mx-0" pw={pw}>
        <LazyScreen k={k} lang={lang} backstage={t.showcase.backstage} />
      </PhoneFrame>
      {shine && <span className="sc-shine"><span /></span>}
    </div>
  );
}
