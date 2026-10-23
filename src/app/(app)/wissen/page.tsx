import Link from "next/link";
import { BookOpen, Clock } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { formatDate } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { StockImage } from "@/components/stock-image";
import { CommunityTabs } from "@/components/community/community-tabs";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type SP = Record<string, string | string[] | undefined>;

export default async function WissenPage({ searchParams }: { searchParams: Promise<SP> }) {
  await requireUser();
  const sp = await searchParams;
  const kategorie = (Array.isArray(sp.kategorie) ? sp.kategorie[0] : sp.kategorie) ?? "";
  const [all, articles] = await Promise.all([
    db.article.findMany({ select: { category: true } }),
    db.article.findMany({ where: kategorie ? { category: kategorie } : undefined, orderBy: { createdAt: "desc" } }),
  ]);
  const categories = [...new Set(all.map((a) => a.category))].sort((a, b) => a.localeCompare(b, "de"));

  const chip = (label: string, value: string) => {
    const active = kategorie === value;
    return (
      <Link
        key={value || "alle"}
        href={value ? `/wissen?kategorie=${encodeURIComponent(value)}` : "/wissen"}
        aria-current={active ? "page" : undefined}
        className={cn("inline-flex h-8 items-center rounded-full border px-3 text-sm whitespace-nowrap", active ? "border-primary bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground")}
      >
        {label}
      </Link>
    );
  };

  return (
    <div>
      <PageHeader title="Wissen" description="Praxiswissen aus dem Netzwerk: Steuern, Verträge, Preise, Produktion. Keine Rechts- oder Steuerberatung." />
      <CommunityTabs active="/wissen" />
      <nav aria-label="Nach Kategorie filtern" className="mb-6 flex flex-wrap gap-2">
        {chip("Alle", "")}
        {categories.map((c) => chip(c, c))}
      </nav>
      {articles.length === 0 ? (
        <EmptyState icon={BookOpen} title="Keine Artikel in dieser Kategorie" action={<Link href="/wissen" className="text-sm text-primary hover:underline">Alle Artikel anzeigen</Link>} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {articles.map((a) => (
            <Link key={a.id} href={`/wissen/${a.slug}`} className="group flex flex-col overflow-hidden rounded-xl border bg-card transition-colors hover:border-primary/50 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none">
              <div className="relative aspect-[16/9] bg-muted">
                <StockImage seed={a.imageSeed} alt="" w={800} h={450} sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" />
              </div>
              <div className="flex flex-1 flex-col gap-2 p-4">
                <Badge variant="secondary" className="w-fit">{a.category}</Badge>
                <h2 className="text-lg leading-tight font-semibold group-hover:underline">{a.title}</h2>
                <p className="text-sm text-muted-foreground">{a.teaser}</p>
                <p className="mt-auto flex items-center gap-1.5 pt-2 text-xs text-muted-foreground"><Clock className="size-3.5" aria-hidden />{a.readMin} Min. Lesezeit · {formatDate(a.createdAt)}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
