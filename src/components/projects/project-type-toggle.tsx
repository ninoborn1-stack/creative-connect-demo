"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { setProjectType } from "@/app/actions/projects";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

// Umschalter Self-Service ↔ Managed Crew (geht an Admin)
export function ProjectTypeToggle({ projectId, type, disabled, marginPct }: { projectId: string; type: string; disabled?: boolean; marginPct: number }) {
  const [pending, start] = useTransition();
  const managed = type === "managed";
  return (
    <div className="flex items-start gap-3 rounded-lg border p-3">
      <Switch
        id="managed-toggle"
        checked={managed}
        disabled={disabled || pending}
        data-testid="managed-toggle"
        onCheckedChange={(v) =>
          start(async () => {
            const res = await setProjectType(projectId, v ? "managed" : "self");
            if (res.ok) {
              if (res.message) toast.success(res.message);
            } else toast.error(res.error);
          })
        }
        className="mt-0.5"
      />
      <Label htmlFor="managed-toggle" className="flex-col items-start gap-0.5 font-normal">
        <span className="font-semibold">{managed ? "Managed Crew angefragt" : "Managed Crew anfragen"}</span>
        <span className="text-xs text-muted-foreground">
          {managed
            ? "Nesto stellt das Team für dich zusammen. Zurückschalten auf Self-Service ist bis zur Bestätigung möglich."
            : `Nesto stellt das Team zusammen (${marginPct} % Marge statt Servicegebühr). Aktuell: Self-Service.`}
        </span>
      </Label>
    </div>
  );
}
