"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Send } from "lucide-react";
import { requestArtist } from "@/app/actions/starter";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { RequestFields } from "./request-fields";

// „Anfragen“ auf dem Artist-Profil: legt ein kleines Projekt mit genau dieser Person an
export function ArtistRequestDialog({ creative, suggestedBudget, defaultCity, size = "lg", className }: {
  creative: { id: string; name: string };
  suggestedBudget: number;
  defaultCity?: string;
  size?: "sm" | "default" | "lg";
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const router = useRouter();
  const firstName = creative.name.split(" ")[0];

  function submit(formData: FormData) {
    start(async () => {
      const res = await requestArtist({
        creativeId: creative.id,
        title: String(formData.get("title") ?? ""),
        budget: Number(formData.get("budget") ?? 0),
        city: String(formData.get("city") ?? ""),
        date: String(formData.get("date") ?? ""),
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
        <Button size={size} className={className}><Send aria-hidden /> {firstName} anfragen</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{creative.name} anfragen</DialogTitle>
          <DialogDescription>Beschreib kurz dein Projekt. {firstName} kann annehmen, ablehnen oder ein Gegenangebot machen.</DialogDescription>
        </DialogHeader>
        <form action={submit}>
          <RequestFields titleLabel="Projekt" titlePlaceholder="z. B. Musikvideo zur neuen Single" defaultCity={defaultCity} budget={suggestedBudget} />
          <Button type="submit" className="mt-5 w-full" disabled={pending}>
            <Send aria-hidden /> {pending ? "Wird gesendet …" : "Anfrage senden"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
