"use client";

import { useOptimistic, useState, useTransition } from "react";
import Link from "next/link";
import { Heart, Loader2, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { addComment, toggleLike } from "@/app/actions/community";
import { UserAvatar } from "@/components/user-avatar";
import { StockImage } from "@/components/stock-image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export type FeedAuthor = { name: string; slug?: string | null; avatarSeed?: string | null; headline?: string | null };
export type FeedComment = { id: string; body: string; createdAt: string; timeLabel: string; author: FeedAuthor };
export type FeedPost = {
  id: string;
  body: string;
  imageSeed: string | null;
  createdAt: string;
  timeLabel: string;
  author: FeedAuthor;
  likeCount: number;
  liked: boolean;
  comments: FeedComment[];
};

function AuthorName({ author, className }: { author: FeedAuthor; className?: string }) {
  return author.slug ? (
    <Link href={`/mitglieder/${author.slug}`} className={cn("font-medium hover:underline", className)}>{author.name}</Link>
  ) : (
    <span className={cn("font-medium", className)}>{author.name}</span>
  );
}

export function PostCard({ post, me }: { post: FeedPost; me: FeedAuthor }) {
  const [like, setOptimisticLike] = useOptimistic(
    { liked: post.liked, count: post.likeCount },
    (s) => ({ liked: !s.liked, count: s.count + (s.liked ? -1 : 1) }),
  );
  const [, startLike] = useTransition();
  const [open, setOpen] = useState(false);
  const [comment, setComment] = useState("");
  const [sending, startSend] = useTransition();

  function onLike() {
    startLike(async () => {
      setOptimisticLike(null);
      const res = await toggleLike(post.id);
      if (!res.ok) toast.error(res.error);
    });
  }

  function onComment(e: React.FormEvent) {
    e.preventDefault();
    startSend(async () => {
      const res = await addComment({ postId: post.id, body: comment });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      setComment("");
    });
  }

  const commentsId = `comments-${post.id}`;

  return (
    <article className="overflow-hidden rounded-xl border bg-card" aria-labelledby={`post-${post.id}-author`}>
      <div className="flex items-start gap-3 p-4 pb-3">
        {post.author.slug ? (
          <Link href={`/mitglieder/${post.author.slug}`} aria-hidden tabIndex={-1}><UserAvatar name={post.author.name} seed={post.author.avatarSeed} /></Link>
        ) : (
          <UserAvatar name={post.author.name} seed={post.author.avatarSeed} />
        )}
        <div className="min-w-0">
          <p id={`post-${post.id}-author`}><AuthorName author={post.author} /></p>
          <p className="truncate text-xs text-muted-foreground">
            {post.author.headline ? `${post.author.headline} · ` : ""}
            <time dateTime={post.createdAt}>{post.timeLabel}</time>
          </p>
        </div>
      </div>
      <p className="px-4 pb-3 leading-relaxed whitespace-pre-line">{post.body}</p>
      {post.imageSeed && (
        <div className="relative aspect-[16/9] bg-muted">
          <StockImage seed={post.imageSeed} alt="Bild zum Beitrag (Stock)" w={1200} h={675} sizes="(max-width: 1024px) 100vw, 700px" />
        </div>
      )}
      <div className="flex items-center gap-1 border-t px-2 py-1.5">
        <Button variant="ghost" size="sm" onClick={onLike} aria-pressed={like.liked} aria-label={like.liked ? "Gefällt mir nicht mehr" : "Gefällt mir"}>
          <Heart className={cn(like.liked && "fill-primary text-primary")} aria-hidden />
          <span>{like.count}</span>
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-controls={commentsId}>
          <MessageCircle aria-hidden />
          {post.comments.length} {post.comments.length === 1 ? "Kommentar" : "Kommentare"}
        </Button>
      </div>
      {open && (
        <div id={commentsId} className="space-y-3 border-t bg-muted/30 p-4">
          {post.comments.length === 0 && <p className="text-sm text-muted-foreground">Noch keine Kommentare – schreib den ersten.</p>}
          {post.comments.map((c) => (
            <div key={c.id} className="flex gap-2.5">
              <UserAvatar name={c.author.name} seed={c.author.avatarSeed} className="size-8" />
              <div className="min-w-0 flex-1 rounded-lg bg-background px-3 py-2 text-sm">
                <p className="flex flex-wrap items-baseline gap-x-2">
                  <AuthorName author={c.author} />
                  <time dateTime={c.createdAt} className="text-xs text-muted-foreground">{c.timeLabel}</time>
                </p>
                <p className="whitespace-pre-line">{c.body}</p>
              </div>
            </div>
          ))}
          <form onSubmit={onComment} className="flex gap-2.5">
            <UserAvatar name={me.name} seed={me.avatarSeed} className="hidden size-8 sm:flex" />
            <Label htmlFor={`c-${post.id}`} className="sr-only">Kommentar schreiben</Label>
            <Input id={`c-${post.id}`} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Kommentar schreiben …" maxLength={1000} className="h-9" />
            <Button type="submit" disabled={sending || !comment.trim()} className="h-9">
              {sending && <Loader2 className="animate-spin" aria-hidden />}Senden
            </Button>
          </form>
        </div>
      )}
    </article>
  );
}
