import Image from "next/image";
import { stockImage } from "@/lib/stock";
import { cn } from "@/lib/utils";

// Stock-Bild mit festem Seed. Container braucht eine Höhe/Aspect-Ratio (fill-Layout).
export function StockImage({
  seed, alt = "", w = 1200, h = 800, className, priority, sizes = "(max-width: 768px) 100vw, 50vw",
}: { seed: string; alt?: string; w?: number; h?: number; className?: string; priority?: boolean; sizes?: string }) {
  return (
    <Image src={stockImage(seed, w, h)} alt={alt} fill sizes={sizes} priority={priority} className={cn("object-cover", className)} />
  );
}
