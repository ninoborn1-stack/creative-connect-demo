import type { Dict, Locale } from "@/lib/i18n";
import { Eyebrow } from "@/components/site/bits";
import { PreviewLoader } from "@/components/preview/preview-loader";
import { PreviewPlaceholder } from "@/components/preview/preview-placeholder";
import { Accent } from "@/components/showcase/accent";
import { PREVIEW_ID } from "@/components/showcase/preview-link";

// „Probier’s selbst“: die interaktive Vorschau groß und ohne Deko, links und rechts kurze Hinweise mit dünner Linie
// zum passenden Bereich am Handy (Höhe über --y). Mobil stehen die Hinweise als Liste unter dem Handy.
const LEFT_Y = ["46%", "9%"];
const RIGHT_Y = ["88%", "72%"];

export function TrySection({ lang, t }: { lang: Locale; t: Dict }) {
  const s = t.showcase.try;
  return (
    <section id={PREVIEW_ID} aria-labelledby="try-title" className="gutter scroll-mt-16 border-t py-20 sm:py-28" data-testid="try-section">
      <div className="text-center" data-reveal>
        <Eyebrow className="justify-center">{s.eyebrow}</Eyebrow>
        <h2 id="try-title" className="poster mt-6 text-[clamp(2.4rem,6.4vw,6rem)]"><Accent text={s.title} /></h2>
      </div>
      <div className="sc-try mt-12 sm:mt-16">
        <ul className="sc-try-hints" data-side="left">
          {s.left.map((h, i) => <li key={h} style={{ "--y": LEFT_Y[i] } as React.CSSProperties}><span>{h}</span><i aria-hidden /></li>)}
        </ul>
        <div className="sc-try-phone"><PreviewLoader lang={lang} placeholder={<PreviewPlaceholder lang={lang} />} /></div>
        <ul className="sc-try-hints" data-side="right">
          {s.right.map((h, i) => <li key={h} style={{ "--y": RIGHT_Y[i] } as React.CSSProperties}><i aria-hidden /><span>{h}</span></li>)}
        </ul>
      </div>
      <p className="mx-auto mt-8 max-w-xl text-center text-xs text-muted-foreground">{t.hero.previewNote}</p>
    </section>
  );
}
