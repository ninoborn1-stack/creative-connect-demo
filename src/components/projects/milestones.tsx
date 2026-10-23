"use client";

import { useRef, useTransition } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { addMilestone, toggleMilestone } from "@/app/actions/projects";
import { formatDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EmptyState } from "@/components/empty-state";
import { cn } from "@/lib/utils";

type Item = { id: string; title: string; dueDate: string; done: boolean };

export function Milestones({ projectId, items, canEdit }: { projectId: string; items: Item[]; canEdit: boolean }) {
  const [pending, start] = useTransition();
  const form = useRef<HTMLFormElement>(null);
  return (
    <div className="space-y-6">
      {items.length === 0 ? (
        <EmptyState title="Noch keine Meilensteine" description="Leg den ersten Termin an, damit alle wissen, was wann ansteht." />
      ) : (
        <ol className="relative space-y-3 border-l pl-5">
          {items.map((m) => (
            <li key={m.id} className="relative">
              <span className={cn("absolute top-2 -left-[25px] size-2.5 rounded-full border-2 border-background", m.done ? "bg-primary" : "bg-muted-foreground/40")} aria-hidden />
              <div className="flex items-center gap-3 rounded-lg border bg-card p-3">
                <Checkbox
                  id={`ms-${m.id}`}
                  checked={m.done}
                  disabled={!canEdit || pending}
                  onCheckedChange={() =>
                    start(async () => {
                      const res = await toggleMilestone(m.id);
                      if (!res.ok) toast.error(res.error);
                    })
                  }
                />
                <Label htmlFor={`ms-${m.id}`} className={cn("flex-1 flex-col items-start gap-0 font-normal", m.done && "text-muted-foreground line-through")}>
                  <span className="font-medium">{m.title}</span>
                  <span className="text-xs text-muted-foreground no-underline">{formatDate(m.dueDate)}</span>
                </Label>
              </div>
            </li>
          ))}
        </ol>
      )}
      {canEdit && (
        <form
          ref={form}
          className="grid gap-3 rounded-lg border p-3 sm:grid-cols-[1fr_170px_auto] sm:items-end"
          action={(fd) =>
            start(async () => {
              const res = await addMilestone(projectId, fd);
              if (res.ok) {
                toast.success(res.message ?? "Gespeichert.");
                form.current?.reset();
              } else toast.error(res.error);
            })
          }
        >
          <div className="space-y-1.5">
            <Label htmlFor="ms-title">Neuer Meilenstein</Label>
            <Input id="ms-title" name="title" placeholder="z. B. Farbkorrektur abgeschlossen" required minLength={2} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ms-date">Fällig am</Label>
            <Input id="ms-date" name="dueDate" type="date" required />
          </div>
          <Button type="submit" disabled={pending}>
            <Plus aria-hidden /> Hinzufügen
          </Button>
        </form>
      )}
    </div>
  );
}
