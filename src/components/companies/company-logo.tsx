import { StockImage } from "@/components/stock-image";
import { cn } from "@/lib/utils";

// Quadratisches Firmenlogo (Stock-Motiv als Platzhalter) mit Initialen-Overlay für Wiedererkennung
export function CompanyLogo({ seed, name, className, textClassName, sizes = "64px" }: { seed: string; name: string; className?: string; textClassName?: string; sizes?: string }) {
  const letters = name
    .split(/\s+/)
    .filter((w) => /^[A-Za-zÄÖÜäöü0-9]/.test(w))
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
  return (
    <span className={cn("relative block size-14 shrink-0 overflow-hidden rounded-lg border bg-muted", className)}>
      <StockImage seed={seed} w={200} h={200} sizes={sizes} />
      <span className={cn("absolute inset-0 grid place-items-center bg-black/45 font-semibold tracking-wide text-white", textClassName)} aria-hidden>
        {letters}
      </span>
      <span className="sr-only">Logo {name}</span>
    </span>
  );
}
