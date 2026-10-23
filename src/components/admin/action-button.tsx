"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ActionResult } from "./admin-constants";

export function useAdminAction() {
  const [pending, start] = useTransition();
  function run(fn: () => Promise<ActionResult>, onSuccess?: () => void) {
    start(async () => {
      try {
        const res = await fn();
        if (res.ok) {
          toast.success(res.message);
          onSuccess?.();
        } else toast.error(res.error);
      } catch {
        toast.error("Das hat nicht geklappt. Bitte erneut versuchen.");
      }
    });
  }
  return { pending, run };
}

export function ActionButton({
  action,
  children,
  ...props
}: { action: () => Promise<ActionResult> } & Omit<React.ComponentProps<typeof Button>, "onClick">) {
  const { pending, run } = useAdminAction();
  return (
    <Button {...props} disabled={pending || props.disabled} onClick={() => run(action)}>
      {pending && <Loader2 className="animate-spin" aria-hidden />}
      {children}
    </Button>
  );
}
