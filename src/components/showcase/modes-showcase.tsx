"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

// „Swipe oder Scroll“ als ruhige Gegenüberstellung: zwei Handys, leicht zueinander gedreht, darüber die Wörter im
// kursiven Serif, dazwischen eine feine Linie und ein schmaler Umschalter. Hover oder Tippen hebt eine Seite an und
// dimmt die andere. Mobil steht immer nur das gewählte Handy da, der Umschalter wechselt es.
type Mode = "swipe" | "scroll";

export function ModesShowcase({ words, texts, phones, label }: {
  words: Record<Mode, string>; texts: Record<Mode, string>; phones: Record<Mode, React.ReactNode>; label: string;
}) {
  const [sel, setSel] = useState<Mode | null>(null);
  const [hover, setHover] = useState<Mode | null>(null);
  const lifted = hover ?? sel;
  const shown = sel ?? "swipe";
  const side = (m: Mode) => ({
    onMouseEnter: () => setHover(m), onMouseLeave: () => setHover(null), onClick: () => setSel(m),
    "data-mode": m, "data-lifted": lifted === m || undefined, "data-dim": (lifted && lifted !== m) || undefined, "data-shown": shown === m || undefined,
  });
  return (
    <div className="sc-modes" data-testid="modes-showcase">
      {(["swipe", "scroll"] as const).map((m) => (
        <div key={m} className="contents">
          <h3 className={cn("sc-modes-word accent", `sc-modes-word--${m}`)} {...side(m)}>{words[m]}</h3>
          <p className={cn("sc-modes-text", `sc-modes-text--${m}`)} {...side(m)}>{texts[m]}</p>
          <div className={cn("sc-modes-phone", `sc-modes-phone--${m}`)} {...side(m)}>{phones[m]}</div>
        </div>
      ))}
      <div className="sc-modes-mid">
        <span aria-hidden className="sc-modes-line" />
        <div role="group" aria-label={label} className="sc-modes-toggle">
          {(["swipe", "scroll"] as const).map((m) => (
            <button key={m} type="button" aria-pressed={shown === m} onClick={() => setSel(m)} data-testid={`modes-${m}`}>{words[m]}</button>
          ))}
        </div>
      </div>
    </div>
  );
}
