import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
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
    <article className="flex flex-col overflow-hidden border bg-card">
      <div className="relative aspect-[16/9] bg-muted">
        <StockImage seed={work.imageSeed} w={640} h={360} sizes="(max-width: 640px) 100vw, 33vw" />
        <span className="meta absolute top-3 left-3 bg-black/75 px-2 py-1 text-white">{type}</span>
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

// Werk als Zeile einer Trackliste (Startseite): Nummer · Cover · Titel · Hörprobe · Preis
export function WorkRow({ work, index }: { work: PublicWork; index: number }) {
  const type = WORK_TYPES[work.type]?.label ?? work.type;
  const tags = parseJson<string[]>(work.tags, []).slice(0, 3);
  return (
    <li className="grid grid-cols-[2rem_3.5rem_minmax(0,1fr)] items-center gap-x-4 gap-y-3 border-b py-5 lg:grid-cols-[3rem_4.5rem_minmax(0,1.2fr)_minmax(0,1.6fr)_9rem_auto] lg:gap-x-6">
      <span className="meta text-muted-foreground">{String(index + 1).padStart(2, "0")}</span>
      <div className="relative aspect-square overflow-hidden bg-muted">
        <StockImage seed={work.imageSeed} w={160} h={160} sizes="80px" />
      </div>
      <div className="min-w-0">
        <h3 className="truncate text-lg font-semibold tracking-tight sm:text-xl">
          <Link href={`/lizenzen/${work.slug}`} className="hover:text-primary">{work.title}</Link>
        </h3>
        <p className="meta mt-1 truncate text-muted-foreground">{work.owner.name} · {type}</p>
      </div>
      <div className="col-span-full min-w-0 lg:col-span-1">
        {work.previewUrl ? (
          <AudioPlayer src={work.previewUrl} title={work.title} subtitle="Hörprobe" className="border-0 bg-transparent p-0" />
        ) : (
          <p className="flex flex-wrap gap-1.5">{tags.map((t) => <span key={t} className="meta border px-2 py-1 text-muted-foreground">{t}</span>)}</p>
        )}
      </div>
      <p className="col-span-2 text-sm lg:col-span-1 lg:text-right">
        <span className="meta text-muted-foreground">ab </span>
        <span className="font-semibold tabular-nums">{formatEur(work.priceStandard)}</span>
      </p>
      <Link href={`/lizenzen/${work.slug}`} className="meta inline-flex items-center gap-1.5 justify-self-end text-primary hover:underline">
        Lizenzieren <ArrowUpRight className="size-4" aria-hidden />
      </Link>
    </li>
  );
}
