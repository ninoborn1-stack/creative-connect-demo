import { Heart, RotateCcw, Star, X } from "lucide-react";
import { APP_NAME } from "@/lib/brand";
import type { Locale } from "@/lib/i18n";
import { Photo } from "@/components/site/photo";
import { PhoneFrame } from "@/components/preview/phone-frame";
import { CARDS, UI } from "@/content/preview-data";

// Statischer Platzhalter in exakt der Größe der interaktiven Vorschau (kein Layout-Sprung beim Nachladen)
export function PreviewPlaceholder({ lang }: { lang: Locale }) {
  const t = UI[lang];
  const card = CARDS[0];
  return (
    <div className="flex flex-col items-center gap-4" aria-hidden>
      <PhoneFrame time={t.status}>
        <div className="flex h-full flex-col">
          <div className="space-y-2 px-3 pb-2">
            <p className="poster-wide text-sm">{APP_NAME}</p>
            <div className="h-6 rounded-full bg-muted" />
            <div className="h-6 rounded-lg bg-muted" />
          </div>
          <div className="relative mx-3 min-h-0 flex-1 overflow-hidden rounded-3xl bg-[var(--ink)] text-[var(--bone)]">
            <Photo name={card.image} sizes="340px" className="opacity-85" />
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--ink)] via-transparent to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-4">
              <p className="meta text-white/75">{card.sub[lang]}</p>
              <p className="poster text-[2.3rem]">{card.title}</p>
            </div>
          </div>
          <div className="flex justify-center gap-3 py-3 text-muted-foreground">
            {[X, RotateCcw, Heart, Star].map((I, i) => <span key={i} className="grid size-11 place-items-center rounded-full border"><I className="size-4" /></span>)}
          </div>
          <div className="h-14 border-t" />
        </div>
      </PhoneFrame>
      <span className="h-10" />
    </div>
  );
}
