import { cn } from "@/lib/utils";
import type { Dict, Locale } from "@/lib/i18n";
import { MotionScope } from "@/components/showcase/motion-scope";
import { ShowcasePhone, type ScreenKey } from "@/components/showcase/screens";

// „Das Handy auf der Stufe“: Ein Handy liegt schräg auf einer Glasstufe wie in einem Studiofoto. Stone Blue fällt
// durch die obere Kante, Scarlet schwach durch die untere, darunter eine weiche Spiegelung. Beim Hineinscrollen
// richtet sich das Handy um höchstens 15° auf und das Licht wird heller (--p aus MotionScope, mode „enter“).
// children: Textspalte (Startseite: H2 mit Zeilen, Backstage: H1 mit Buttons).
export function PhoneStage({ k, lang, t, children, dark, id, labelledBy, testId }: {
  k: ScreenKey; lang: Locale; t: Dict; children: React.ReactNode; dark?: boolean; id?: string; labelledBy?: string; testId?: string;
}) {
  return (
    <section id={id} aria-labelledby={labelledBy} className={cn("sc-stage-sec gutter relative isolate overflow-hidden py-20 sm:py-32", dark && "sc-stage-sec--dark")} data-testid={testId}>
      <MotionScope mode="enter" className="grid items-center gap-10 lg:grid-cols-12 lg:gap-8">
        <div aria-hidden className="sc-stage-scene lg:col-span-7">
          <div className="sc-stage-glow" />
          <div className="sc-step"><div className="sc-step-top" /><div className="sc-step-edge" /></div>
          <div className="sc-stage-reflect" />
          <div className="sc-stage-phone"><ShowcasePhone k={k} lang={lang} t={t} /></div>
        </div>
        <div className="relative z-10 lg:col-span-5">{children}</div>
      </MotionScope>
    </section>
  );
}
