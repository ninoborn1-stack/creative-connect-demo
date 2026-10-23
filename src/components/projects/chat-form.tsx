"use client";

import { useRef, useTransition } from "react";
import { SendHorizontal } from "lucide-react";
import { toast } from "sonner";
import { sendProjectMessage } from "@/app/actions/projects";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function ChatForm({ projectId }: { projectId: string }) {
  const [pending, start] = useTransition();
  const form = useRef<HTMLFormElement>(null);
  return (
    <form
      ref={form}
      className="flex items-end gap-2"
      action={(fd) =>
        start(async () => {
          const res = await sendProjectMessage(projectId, fd);
          if (res.ok) form.current?.reset();
          else toast.error(res.error);
        })
      }
    >
      <div className="flex-1">
        <Label htmlFor="chat-body" className="sr-only">Nachricht</Label>
        <Textarea
          id="chat-body" name="body" rows={2} required placeholder="Nachricht an die Crew …"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              form.current?.requestSubmit();
            }
          }}
        />
      </div>
      <Button type="submit" size="icon-lg" disabled={pending} aria-label="Nachricht senden" data-testid="chat-send">
        <SendHorizontal aria-hidden />
      </Button>
    </form>
  );
}
