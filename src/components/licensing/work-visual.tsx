import Image from "next/image";
import { StockImage } from "@/components/stock-image";
import { AudioPlayer } from "@/components/members/audio-player";
import { isAudioType } from "@/lib/licensing";
import { cn } from "@/lib/utils";

type VisualWork = { type: string; title: string; imageSeed: string; previewUrl: string | null };

// Bildvorschau eines Werks: hochgeladenes Vorschaubild (previewUrl bei visuellen Typen) oder Stock-Bild.
// Container braucht relative + Höhe/Aspect.
export function WorkImage({ work, sizes, priority, className }: { work: VisualWork; sizes?: string; priority?: boolean; className?: string }) {
  const alt = `Vorschau: ${work.title}`;
  if (!isAudioType(work.type) && work.previewUrl) {
    return <Image src={work.previewUrl} alt={alt} fill unoptimized sizes={sizes} className={cn("object-cover", className)} />;
  }
  return <StockImage seed={work.imageSeed} alt={alt} w={800} h={600} sizes={sizes} priority={priority} className={className} />;
}

// Hörprobe für Audio-Werke (Wellenform-Player)
export function WorkAudio({ work, subtitle, className }: { work: VisualWork; subtitle?: string; className?: string }) {
  if (!isAudioType(work.type) || !work.previewUrl) return null;
  return <AudioPlayer src={work.previewUrl} title={work.title} subtitle={subtitle} className={className} />;
}
