import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock, Scale } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { formatDate } from "@/lib/format";
import { StockImage } from "@/components/stock-image";
import { ArticleBody } from "@/components/community/article-body";
import { Badge } from "@/components/ui/badge";

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  await requireUser();
  const article = await db.article.findUnique({ where: { slug } });
  if (!article) notFound();
  const more = await db.article.findMany({ where: { id: { not: article.id } }, orderBy: { createdAt: "desc" }, take: 3 });
  const legal = article.category === "Recht & Steuern";

  return (
    <article className="mx-auto max-w-3xl space-y-6">
      <Link href="/wissen" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden />Wissen
      </Link>
      <header className="space-y-3">
        <Link href={`/wissen?kategorie=${encodeURIComponent(article.category)}`}><Badge variant="secondary">{article.category}</Badge></Link>
        <h1 className="text-3xl font-bold sm:text-4xl">{article.title}</h1>
        <p className="text-lg text-muted-foreground">{article.teaser}</p>
        <p className="flex items-center gap-1.5 text-sm text-muted-foreground"><Clock className="size-4" aria-hidden />{article.readMin} Min. Lesezeit · {formatDate(article.createdAt)}</p>
      </header>
      <div className="relative aspect-[16/9] overflow-hidden rounded-xl bg-muted">
        <StockImage seed={article.imageSeed} alt="" w={1400} h={788} priority sizes="(max-width: 768px) 100vw, 768px" />
      </div>
      {legal && (
        <div role="note" className="flex items-start gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm">
          <Scale className="mt-0.5 size-4 shrink-0 text-amber-500" aria-hidden />
          <p><strong>Kein Rechtsrat.</strong> Dieser Artikel gibt einen allgemeinen Überblick und ersetzt keine individuelle Rechts- oder Steuerberatung.</p>
        </div>
      )}
      <ArticleBody body={article.body} />
      {more.length > 0 && (
        <aside className="border-t pt-6" aria-labelledby="mehr">
          <h2 id="mehr" className="mb-3 text-lg font-semibold">Weiterlesen</h2>
          <ul className="space-y-2">
            {more.map((m) => (
              <li key={m.id}>
                <Link href={`/wissen/${m.slug}`} className="text-primary hover:underline">{m.title}</Link>
                <span className="text-sm text-muted-foreground"> · {m.category}</span>
              </li>
            ))}
          </ul>
        </aside>
      )}
    </article>
  );
}
