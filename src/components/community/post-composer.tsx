"use client";

import { useState, useTransition } from "react";
import { ImagePlus, Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { createPost } from "@/app/actions/community";
import { UserAvatar } from "@/components/user-avatar";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

export function PostComposer({ name, avatarSeed }: { name: string; avatarSeed?: string | null }) {
  const [body, setBody] = useState("");
  const [withImage, setWithImage] = useState(false);
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await createPost({ body, withImage });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      setBody("");
      setWithImage(false);
      toast.success("Beitrag veröffentlicht");
    });
  }

  return (
    <form onSubmit={submit} className="rounded-xl border bg-card p-4" aria-label="Neuer Beitrag">
      <div className="flex gap-3">
        <UserAvatar name={name} seed={avatarSeed} className="hidden sm:flex" />
        <div className="min-w-0 flex-1 space-y-3">
          <Label htmlFor="post-body" className="sr-only">Was gibt’s Neues?</Label>
          <Textarea
            id="post-body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={3}
            maxLength={2000}
            placeholder="Was gibt’s Neues? Suchst du jemanden für ein Projekt, hast du ein Release, einen Tipp?"
          />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Switch id="post-image" checked={withImage} onCheckedChange={setWithImage} />
              <Label htmlFor="post-image" className="font-normal"><ImagePlus className="size-4" aria-hidden />Stock-Bild anhängen</Label>
            </div>
            <Button type="submit" disabled={pending || body.trim().length < 3}>
              {pending ? <Loader2 className="animate-spin" aria-hidden /> : <Send aria-hidden />}Posten
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}
