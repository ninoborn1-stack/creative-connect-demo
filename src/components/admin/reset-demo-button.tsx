"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { resetDemo } from "@/app/actions/admin";
import { useAdminAction } from "./action-button";

export function ResetDemoButton() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { pending, run } = useAdminAction();
  return (
    <Dialog open={open} onOpenChange={(o) => !pending && setOpen(o)}>
      <DialogTrigger asChild>
        <Button variant="destructive" data-testid="reset-demo">
          <RotateCcw aria-hidden /> Demo zurücksetzen
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Demo wirklich zurücksetzen?</DialogTitle>
          <DialogDescription>
            Alle Änderungen (Projekte, Nachrichten, Sperren, Einstellungen …) werden verworfen und die Beispieldaten neu angelegt.
            Du bleibst als Nesto (Admin) angemeldet.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" disabled={pending}>Abbrechen</Button>
          </DialogClose>
          <Button
            variant="destructive"
            disabled={pending}
            data-testid="reset-demo-confirm"
            onClick={() =>
              run(resetDemo, () => {
                setOpen(false);
                router.refresh();
              })
            }
          >
            {pending && <Loader2 className="animate-spin" aria-hidden />}
            {pending ? "Wird zurückgesetzt …" : "Ja, zurücksetzen"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
