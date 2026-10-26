import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { parseJson } from "@/lib/format";
import { isAudioType } from "@/lib/licensing";
import { PageHeader } from "@/components/page-header";
import { WorkForm } from "@/components/licensing/work-form";

export default async function EditWorkPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await requireUser();
  const work = await db.licensableWork.findUnique({ where: { slug } });
  if (!work) notFound();
  if (work.ownerId !== user.id && !user.isAdmin) redirect(`/lizenzen/${slug}`);

  const hasUpload = Boolean(work.previewUrl?.startsWith("/uploads/") || (!isAudioType(work.type) && work.previewUrl));

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/lizenzen/werke" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden />Zurück zu meinen Werken
      </Link>
      <PageHeader title="Werk bearbeiten" description={work.title} />
      <WorkForm
        initial={{
          id: work.id, slug: work.slug, type: work.type, title: work.title, description: work.description,
          tags: parseJson<string[]>(work.tags, []), industries: parseJson<string[]>(work.industries, []),
          durationSec: work.durationSec, bpm: work.bpm, musicalKey: work.musicalKey,
          priceStandard: work.priceStandard, priceExtended: work.priceExtended, priceExclusive: work.priceExclusive ?? "",
          aiMarked: work.aiMarked, hasUpload,
        }}
      />
    </div>
  );
}
