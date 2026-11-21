import { Heart, X } from "lucide-react";
import type { Dict, Locale } from "@/lib/i18n";
import { Photo } from "@/components/site/photo";
import { CARDS } from "@/content/preview-data";
import { MotionScope } from "@/components/showcase/motion-scope";
import { PreviewLink } from "@/components/showcase/preview-link";

// Swipe-Moment: Beim Scrollen arbeitet sich ein kleiner Kartenstapel ab (rechts mit Herz-Stempel, links weiter),
// die letzte Karte löst einen Match aus. Rein dekorativ (aria-hidden), dazu ein Knopf zur echten Vorschau.
// Ablauf über --p (MotionScope „through“): Karte i fliegt zwischen --s und --s + 0,11, danach der Match.
const STACK = [
  { id: "mila", dir: 1 }, { id: "warehouse", dir: -1 }, { id: "nachtfahrt", dir: 1 }, { id: "nord", dir: 1 },
] as const;

export function SwipeMoment({ lang, t }: { lang: Locale; t: Dict["showcase"]["swipe"] }) {
  return (
    <div className="flex flex-col items-center gap-6" data-testid="swipe-moment">
      <MotionScope className="sc-swipe" aria-hidden>
        <div className="sc-swipe-match">
          <div className="flex -space-x-4"><span className="relative block size-16 overflow-hidden rounded-full ring-4 ring-[var(--ink)]"><Photo name="for-artists" sizes="80px" /></span><span className="relative block size-16 overflow-hidden rounded-full ring-4 ring-[var(--ink)]"><Photo name="studio" sizes="80px" /></span></div>
          <p className="accent mt-3 text-4xl">{t.match}</p>
          <p className="meta mt-2 max-w-[14rem] text-center text-white/70">{t.matchText}</p>
        </div>
        {STACK.map((s, i) => {
          const c = CARDS.find((x) => x.id === s.id)!;
          return (
            <div key={s.id} className="sc-swipe-card" style={{ "--s": (0.22 + i * 0.11).toFixed(2), "--dir": s.dir, "--z": STACK.length - i, "--i": i } as React.CSSProperties}>
              <Photo name={c.image} sizes="280px" className="opacity-85" />
              <div className="absolute inset-0 bg-gradient-to-t from-[var(--ink)] via-transparent to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-4 text-[var(--bone)]">
                <p className="meta text-white/75">{c.sub[lang]}</p>
                <p className="poster text-2xl">{c.title}</p>
              </div>
              <span className="sc-stamp" data-dir={s.dir > 0 ? "like" : "nope"}>
                {s.dir > 0 ? <Heart className="size-4 fill-current" /> : <X className="size-4" />}{s.dir > 0 ? t.like : t.nope}
              </span>
            </div>
          );
        })}
      </MotionScope>
      <PreviewLink screen="swipe" className="meta relative inline-flex h-12 items-center gap-2 overflow-hidden border border-current px-5 whitespace-nowrap transition-colors hover:bg-foreground hover:text-background btn-shine" testId="swipe-try">
        {t.try}
      </PreviewLink>
    </div>
  );
}
