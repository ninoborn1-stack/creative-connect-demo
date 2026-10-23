"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { toggleProTrial } from "@/app/actions/members";
import { Button } from "@/components/ui/button";

export function ProToggle({ isPro }: { isPro: boolean }) {
  const [pending, start] = useTransition();
  return (
    <Button
      variant={isPro ? "outline" : "default"}
      size="sm"
      disabled={pending}
      onClick={() =>
        start(async () => {
          const res = await toggleProTrial();
          if ("error" in res) toast.error(res.error);
          else toast.success(res.isPro ? "Pro ist aktiv (Demo – keine Zahlung)." : "Pro-Abo beendet (Demo).");
        })
      }
    >
      {isPro ? "Pro beenden (Demo)" : "Pro testen"}
    </Button>
  );
}
