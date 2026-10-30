"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Send } from "lucide-react";
import { requestWork } from "@/app/actions/starter";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

// Musik & Stock: Nutzung eines Werks beim Artist anfragen (statt Direktkauf)
export function WorkRequestDialog({ work, className }: {
  work: { id: string; title: string; ownerName: string; suggestedBudget: number };
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const router = useRouter();
  const firstName = work.ownerName.split(" ")[0];

  function submit(formData: FormData) {
    start(async () => {
      const res = await requestWork({
        workId: work.id,
        usage: String(formData.get("usage") ?? ""),
        budget: Number(formData.get("budget") ?? 0),
        note: String(formData.get("note") ?? ""),
      });
      if (!res) return;
      if (res.ok) {
        toast.success(res.message);
        setOpen(false);
        router.push(`/projekte/${res.projectId}`);
      } else toast.error(res.error);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className={className}><Send aria-hidden /> Nutzung anfragen</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>„{work.title}“ anfragen</DialogTitle>
          <DialogDescription>Sag kurz, wofür du das Werk nutzen willst. {firstName} nimmt an, lehnt ab oder macht ein Gegenangebot.</DialogDescription>
        </DialogHeader>
        <form action={submit} className="grid gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="work-usage">Wofür?</Label>
            <Input id="work-usage" name="usage" required minLength={3} maxLength={120} placeholder="z. B. Instagram-Kampagne, 3 Monate" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="work-budget">Budget in €</Label>
            <Input id="work-budget" name="budget" type="number" required min={50} defaultValue={work.suggestedBudget} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="work-note">Nachricht <span className="font-normal text-muted-foreground">(optional)</span></Label>
            <Textarea id="work-note" name="note" rows={3} maxLength={1000} placeholder="Medien, Gebiet, Laufzeit – alles, was hilft." />
          </div>
          <Button type="submit" className="mt-1 w-full" disabled={pending}>
            <Send aria-hidden /> {pending ? "Wird gesendet …" : "Anfrage senden"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
