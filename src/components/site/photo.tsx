import IMAGES from "@/lib/images.json";
import { asset } from "@/lib/asset";
import { cn } from "@/lib/utils";

export type PhotoName = keyof typeof IMAGES;

// Foto aus public/img als <picture> mit AVIF und WebP in mehreren Breiten (erzeugt von scripts/images.mjs).
// fill: füllt den (relativ positionierten) Container wie object-cover.
export function Photo({
  name, alt = "", sizes = "(max-width: 768px) 100vw, 50vw", priority, fill = true, className, imgProps,
}: {
  name: PhotoName; alt?: string; sizes?: string; priority?: boolean; fill?: boolean; className?: string;
  imgProps?: React.ImgHTMLAttributes<HTMLImageElement> & Record<`data-${string}`, string>;
}) {
  const { widths, ratio } = IMAGES[name];
  const set = (ext: string) => widths.map((w) => `${asset(`/img/${name}-${w}.${ext}`)} ${w}w`).join(", ");
  const largest = widths[widths.length - 1];
  return (
    <picture className={cn(fill && "absolute inset-0")}>
      <source type="image/avif" srcSet={set("avif")} sizes={sizes} />
      <source type="image/webp" srcSet={set("webp")} sizes={sizes} />
      {/* statischer Export: Bilder sind vorab optimiert, daher <img> statt next/image */}
      <img
        src={asset(`/img/${name}-${largest}.webp`)}
        alt={alt}
        width={largest}
        height={Math.round(largest / ratio)}
        loading={priority ? "eager" : "lazy"}
        decoding={priority ? "sync" : "async"}
        fetchPriority={priority ? "high" : undefined}
        className={cn(fill && "h-full w-full object-cover", className)}
        {...imgProps}
      />
    </picture>
  );
}
