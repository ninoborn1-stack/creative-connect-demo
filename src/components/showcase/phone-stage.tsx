import { cn } from "@/lib/utils";
import type { Dict, Locale } from "@/lib/i18n";
import { MotionScope } from "@/components/showcase/motion-scope";
import { ShowcasePhone, type ScreenKey } from "@/components/showcase/screens";

// Handy schwebt schräg im dunklen Raum, mit weichem Schatten darunter (Backstage-Hero). Beim Hineinscrollen
// richtet es sich leicht auf (--p aus MotionScope, mode „enter“). children: Textspalte.
export function PhoneStage({ k, lang, t, children, dark, id, labelledBy, testId }: {
  k: ScreenKey; lang: Locale; t: Dict; children: React.ReactNode; dark?: boolean; id?: string; labelledBy?: string; testId?: string;
}) {
  return (
    <section id={id} aria-labelledby={labelledBy} className={cn("sc-stage-sec gutter relative isolate overflow-hidden py-20 sm:py-32", dark && "sc-stage-sec--dark")} data-testid={testId}>
      <MotionScope mode="enter" className="grid items-center gap-10 lg:grid-cols-12 lg:gap-8">
        <div aria-hidden className="sc-stage-scene lg:col-span-7">
          <div className="sc-stage-glow" />
          <div className="sc-space-shadow" />
          <div className="sc-stage-phone"><div className="sc-space-float"><ShowcasePhone k={k} lang={lang} t={t} /></div></div>
        </div>
        <div className="relative z-10 lg:col-span-5">{children}</div>
      </MotionScope>
    </section>
  );
}
