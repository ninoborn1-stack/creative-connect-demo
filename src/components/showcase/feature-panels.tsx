import { ArrowUpRight } from "lucide-react";
import { APP_NAME } from "@/lib/brand";
import type { Dict, Locale } from "@/lib/i18n";
import { Eyebrow } from "@/components/site/bits";
import { Accent, plain } from "@/components/showcase/accent";
import { MotionScope } from "@/components/showcase/motion-scope";
import { PreviewLink } from "@/components/showcase/preview-link";
import { ShowcasePhone, type ScreenKey } from "@/components/showcase/screens";

// Feature-Tafeln im Stil von App-Store-Screenshots (Seitenverhältnis 9 : 19,5): Überschrift mit Akzentwort, Handy
// mit dem passenden Screen, schwebende Chips, eine Zeile Erklärung. Desktop (ab 1024 px, mit Bewegung): Bereich
// wird angeheftet und die Tafeln laufen beim Scrollen horizontal durch. Mobil, bei reduzierter Bewegung und ohne
// JavaScript: normaler wischbarer Bereich mit scroll-snap. Klick öffnet die Vorschau im Hero auf diesem Screen.
// Für Store-Screenshots: jede Tafel trägt data-store-panel (scripts/store-screenshots.mjs).
export function FeaturePanels({ lang, t }: { lang: Locale; t: Dict }) {
  const p = t.showcase.panels;
  return (
    <section id="momente" aria-labelledby="panels-title" className="sc-panels-sec scroll-mt-16 border-t" data-testid="feature-panels">
      <div className="gutter pt-20 sm:pt-32">
        <div data-reveal>
          <Eyebrow>{p.eyebrow.replace("{app}", APP_NAME)}</Eyebrow>
          <h2 id="panels-title" className="poster mt-6 text-[clamp(2.2rem,6.4vw,6.5rem)] lg:text-[clamp(3rem,4.6vw,5.6rem)]"><Accent text={p.title} /></h2>
          <p className="meta mt-6 text-muted-foreground">{p.hint}</p>
        </div>
      </div>
      <MotionScope mode="pin" focus className="sc-panels">
        <div className="sc-panels-sticky">
          <ol className="sc-track" data-scroller tabIndex={0} aria-label={plain(p.title)}>
            {p.items.map((item, i) => (
              <li key={item.key} className="sc-panel-item" data-focus>
                <PreviewLink screen={item.key as ScreenKey} className="sc-panel" label={`${plain(item.title)} ${p.open}`} testId="feature-panel">
                  <div className="sc-panel-inner" data-store-panel={item.key} data-variant={item.key}>
                    <h3 className="sc-panel-title"><Accent text={item.title} /></h3>
                    <div className="sc-panel-phone"><ShowcasePhone k={item.key as ScreenKey} lang={lang} t={t} shine={false} /></div>
                    <div aria-hidden className="sc-panel-chips">
                      {item.chips.map((c, j) => <span key={c} className="sc-glass meta sc-panel-chip" style={{ "--j": j } as React.CSSProperties}>{c}</span>)}
                    </div>
                    <p className="sc-panel-text">{item.text}</p>
                    <span aria-hidden className="sc-panel-open meta">{String(i + 1).padStart(2, "0")} <ArrowUpRight className="size-3.5" /></span>
                  </div>
                </PreviewLink>
              </li>
            ))}
          </ol>
          <div className="sc-progress gutter" aria-hidden><span /></div>
        </div>
      </MotionScope>
    </section>
  );
}
