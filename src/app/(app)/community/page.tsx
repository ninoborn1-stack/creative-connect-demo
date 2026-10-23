import Link from "next/link";
import { BookOpen, CalendarDays, MessagesSquare } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { formatDate, formatRelative } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { StockImage } from "@/components/stock-image";
import { PostComposer } from "@/components/community/post-composer";
import { PostCard, type FeedAuthor, type FeedPost } from "@/components/community/post-card";
import { CommunityTabs } from "@/components/community/community-tabs";

type AuthorRow = { name: string; profile: { slug: string; avatarSeed: string; headline: string } | null };
const toAuthor = (u: AuthorRow): FeedAuthor => ({ name: u.name, slug: u.profile?.slug, avatarSeed: u.profile?.avatarSeed, headline: u.profile?.headline });

export default async function CommunityPage() {
  const user = await requireUser();
  const [posts, events, articles] = await Promise.all([
    db.post.findMany({
      orderBy: { createdAt: "desc" },
      take: 30,
      include: {
        author: { include: { profile: true } },
        likes: { where: { userId: user.id }, select: { id: true } },
        _count: { select: { likes: true } },
        comments: { orderBy: { createdAt: "asc" }, include: { author: { include: { profile: true } } } },
      },
    }),
    db.event.findMany({ where: { date: { gte: new Date() } }, orderBy: { date: "asc" }, take: 3, include: { _count: { select: { rsvps: true } } } }),
    db.article.findMany({ orderBy: { createdAt: "desc" }, take: 3 }),
  ]);

  const feed: FeedPost[] = posts.map((p) => ({
    id: p.id,
    body: p.body,
    imageSeed: p.imageSeed,
    createdAt: p.createdAt.toISOString(),
    timeLabel: formatRelative(p.createdAt),
    author: toAuthor(p.author),
    likeCount: p._count.likes,
    liked: p.likes.length > 0,
    comments: p.comments.map((c) => ({ id: c.id, body: c.body, createdAt: c.createdAt.toISOString(), timeLabel: formatRelative(c.createdAt), author: toAuthor(c.author) })),
  }));
  const me = toAuthor(user);

  return (
    <div>
      <PageHeader title="Community" description="Neuigkeiten, Gesuche und Releases aus dem Netzwerk." />
      <CommunityTabs active="/community" />
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0 space-y-4">
          <PostComposer name={user.name} avatarSeed={user.profile?.avatarSeed} />
          {feed.length === 0 ? (
            <EmptyState icon={MessagesSquare} title="Noch keine Beiträge" description="Mach den Anfang und erzähl dem Netzwerk, woran du gerade arbeitest." />
          ) : (
            feed.map((p) => <PostCard key={p.id} post={p} me={me} />)
          )}
        </div>

        <aside className="hidden space-y-6 lg:block" aria-label="Seitenleiste">
          <section className="rounded-xl border bg-card p-4" aria-labelledby="side-events">
            <h2 id="side-events" className="mb-3 flex items-center gap-2 font-semibold"><CalendarDays className="size-4 text-primary" aria-hidden />Nächste Events</h2>
            {events.length === 0 ? (
              <p className="text-sm text-muted-foreground">Gerade keine Events geplant.</p>
            ) : (
              <ul className="space-y-3">
                {events.map((e) => (
                  <li key={e.id}>
                    <Link href={`/events/${e.slug}`} className="group block">
                      <p className="text-sm font-medium group-hover:underline">{e.title}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(e.date)} · {e.city} · {e._count.rsvps}/{e.capacity} Zusagen</p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            <Link href="/events" className="mt-3 inline-block text-sm text-primary hover:underline">Alle Events</Link>
          </section>
          <section className="rounded-xl border bg-card p-4" aria-labelledby="side-wissen">
            <h2 id="side-wissen" className="mb-3 flex items-center gap-2 font-semibold"><BookOpen className="size-4 text-primary" aria-hidden />Neu im Wissensbereich</h2>
            <ul className="space-y-3">
              {articles.map((a) => (
                <li key={a.id}>
                  <Link href={`/wissen/${a.slug}`} className="group flex gap-3">
                    <div className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-muted">
                      <StockImage seed={a.imageSeed} w={200} h={200} sizes="56px" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm leading-snug font-medium group-hover:underline">{a.title}</p>
                      <p className="text-xs text-muted-foreground">{a.category} · {a.readMin} Min.</p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
            <Link href="/wissen" className="mt-3 inline-block text-sm text-primary hover:underline">Zum Wissensbereich</Link>
          </section>
        </aside>
      </div>
    </div>
  );
}
