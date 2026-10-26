"use client";

import { useState, useTransition } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteWork } from "@/app/actions/licensing";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export function DeleteWorkButton({ workId, title, licenseCount }: { workId: string; title: string; licenseCount: number }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  if (licenseCount > 0) {
    return (
      <Button size="sm" variant="ghost" disabled title="Werke mit erteilten Lizenzen können nicht gelöscht werden" aria-label={`${title} löschen – nicht möglich, da bereits lizenziert`}>
        <Trash2 aria-hidden />Löschen
      </Button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !pending && setOpen(o)}>
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" aria-label={`${title} löschen`}>
          <Trash2 aria-hidden />Löschen
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Werk löschen?</DialogTitle>
          <DialogDescription>„{title}“ wird aus dem Katalog entfernt. Das kann nicht rückgängig gemacht werden.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild><Button variant="outline" disabled={pending}>Abbrechen</Button></DialogClose>
          <Button
            variant="destructive"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                const res = await deleteWork(workId);
                if (res && !res.ok) {
                  toast.error(res.error);
                  setOpen(false);
                }
              })
            }
          >
            {pending && <Loader2 className="animate-spin" aria-hidden />}Endgültig löschen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
