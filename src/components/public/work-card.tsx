import Link from "next/link";
import { WORK_TYPES, industryName } from "@/lib/constants";
import { formatEur, parseJson } from "@/lib/format";
import { StockImage } from "@/components/stock-image";
import { AudioPlayer } from "@/components/members/audio-player";

export type PublicWork = {
  id: string; slug: string; type: string; title: string; description: string; tags: string; industries: string;
  previewUrl: string | null; imageSeed: string; priceStandard: number; priceExtended: number; priceExclusive: number | null;
  owner: { name: string };
};

export const PUBLIC_WORK_SELECT = {
  id: true, slug: true, type: true, title: true, description: true, tags: true, industries: true, previewUrl: true, imageSeed: true,
  priceStandard: true, priceExtended: true, priceExclusive: true, owner: { select: { name: true } },
} as const;

// Werk aus dem Lizenz-Katalog für öffentliche Seiten: Bild bzw. Audio-Vorschau, Preise ab Stufe Standard
export function WorkCard({ work }: { work: PublicWork }) {
  const tags = parseJson<string[]>(work.tags, []).slice(0, 3);
  const industries = parseJson<string[]>(work.industries, []);
  const type = WORK_TYPES[work.type]?.label ?? work.type;
  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border bg-card">
      <div className="relative aspect-[16/9] bg-muted">
        <StockImage seed={work.imageSeed} w={640} h={360} sizes="(max-width: 640px) 100vw, 33vw" />
        <span className="absolute top-3 left-3 rounded-full bg-black/65 px-2.5 py-0.5 text-[11px] font-medium text-white">{type}</span>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="min-w-0">
          <h3 className="font-semibold leading-snug">
            <Link href={`/lizenzen/${work.slug}`} className="hover:underline">{work.title}</Link>
          </h3>
          <p className="mt-0.5 text-xs text-muted-foreground">von {work.owner.name}</p>
          <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{work.description}</p>
        </div>
        {work.previewUrl && <AudioPlayer src={work.previewUrl} title={work.title} subtitle="Hörprobe" className="bg-background/60" />}
        <div className="flex flex-wrap gap-1.5">
          {tags.map((t) => <span key={t} className="rounded-full border px-2 py-0.5 text-[11px] text-muted-foreground">{t}</span>)}
          {industries.slice(0, 2).map((i) => <span key={i} className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] text-primary">{industryName(i)}</span>)}
        </div>
        <dl className="mt-auto grid grid-cols-3 gap-2 border-t pt-3 text-center text-xs">
          <div><dt className="text-muted-foreground">Standard</dt><dd className="font-semibold">{formatEur(work.priceStandard)}</dd></div>
          <div><dt className="text-muted-foreground">Erweitert</dt><dd className="font-semibold">{formatEur(work.priceExtended)}</dd></div>
          <div><dt className="text-muted-foreground">Buyout</dt><dd className="font-semibold">{work.priceExclusive ? formatEur(work.priceExclusive) : "–"}</dd></div>
        </dl>
      </div>
    </article>
  );
}
