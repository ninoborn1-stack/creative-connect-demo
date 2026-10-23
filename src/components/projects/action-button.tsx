"use client";

import { useTransition } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export type ActionResult = { ok: true; message?: string } | { ok: false; error: string };

// Button für eine (gebundene) Server Action mit Ladezustand und Toast-Rückmeldung.
export function ActionButton({
  action, children, onDone, pendingLabel, ...props
}: Omit<React.ComponentProps<typeof Button>, "onClick" | "action"> & {
  action: () => Promise<ActionResult>;
  onDone?: (result: ActionResult) => void;
  pendingLabel?: string;
}) {
  const [pending, start] = useTransition();
  return (
    <Button
      type="button"
      {...props}
      disabled={pending || props.disabled}
      onClick={() =>
        start(async () => {
          const res = await action();
          if (res.ok) {
            if (res.message) toast.success(res.message);
          } else toast.error(res.error);
          onDone?.(res);
        })
      }
    >
      {pending && <Loader2 className="animate-spin" aria-hidden />}
      {pending && pendingLabel ? pendingLabel : children}
    </Button>
  );
}
