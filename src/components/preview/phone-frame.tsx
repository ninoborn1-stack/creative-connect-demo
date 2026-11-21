import { cn } from "@/lib/utils";

// Handy-Rahmen als reine CSS-Grafik (kein Gerätebild): Gehäuse, Kamera-Insel, Statusleiste, Home-Indikator.
// Breite --pw: höchstens 350 px, auf kleinen Bildschirmen fast bildschirmbreit, auf niedrigen passend zur Höhe.
// Feste Höhe (9 : 19,2), damit lange Inhalte innen scrollen statt den Rahmen zu strecken.
// pw: feste Breite für Showcase-Handys (z. B. "260px"), überschreibt die responsive Breite.
export function PhoneFrame({ children, time = "9:41", className, label, pw }: { children: React.ReactNode; time?: string; className?: string; label?: string; pw?: string }) {
  return (
    <div
      role={label ? "region" : undefined}
      aria-label={label}
      style={pw ? ({ "--pw": pw } as React.CSSProperties) : undefined}
      className={cn(
        "relative mx-auto h-[calc(var(--pw)*2.133)] w-[var(--pw)] rounded-[3rem] [--pw:max(280px,min(350px,calc(100vw-2rem),calc((100svh-8rem)*0.468)))] bg-[#0b1220] p-[10px] shadow-[0_30px_80px_-20px_rgba(0,0,0,.7),inset_0_0_0_2px_#2a3547]",
        className,
      )}
    >
      {/* Seitentasten */}
      <span aria-hidden className="absolute top-28 -left-[3px] h-12 w-[3px] rounded-l bg-[#2a3547]" />
      <span aria-hidden className="absolute top-44 -left-[3px] h-12 w-[3px] rounded-l bg-[#2a3547]" />
      <span aria-hidden className="absolute top-36 -right-[3px] h-20 w-[3px] rounded-r bg-[#2a3547]" />
      <div className="relative flex h-full flex-col overflow-hidden rounded-[2.4rem] bg-background text-foreground">
        <div aria-hidden className="relative z-30 flex h-11 shrink-0 items-center justify-between px-7 pt-1 text-[0.8rem] font-semibold">
          <span>{time}</span>
          <span className="absolute top-2.5 left-1/2 h-[26px] w-[92px] -translate-x-1/2 rounded-full bg-black" />
          <span className="flex items-center gap-1.5">
            <svg viewBox="0 0 18 12" className="h-3 w-4" fill="currentColor"><rect x="0" y="8" width="3" height="4" rx="1" /><rect x="5" y="5" width="3" height="7" rx="1" /><rect x="10" y="2.5" width="3" height="9.5" rx="1" /><rect x="15" y="0" width="3" height="12" rx="1" /></svg>
            <svg viewBox="0 0 24 12" className="h-3 w-6"><rect x="0.5" y="0.5" width="20" height="11" rx="3" fill="none" stroke="currentColor" opacity=".5" /><rect x="2" y="2" width="14" height="8" rx="1.5" fill="currentColor" /><rect x="21.5" y="4" width="2" height="4" rx="1" fill="currentColor" opacity=".5" /></svg>
          </span>
        </div>
        <div className="relative min-h-0 flex-1">{children}</div>
        <span aria-hidden className="pointer-events-none absolute bottom-1.5 left-1/2 z-40 h-[5px] w-32 -translate-x-1/2 rounded-full bg-foreground/80" />
      </div>
    </div>
  );
}
