"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Sparkles, UserPlus } from "lucide-react";
import { sendCrewRequest } from "@/app/actions/requests";
import { categoryName } from "@/lib/constants";
import { formatEur } from "@/lib/format";
import type { CrewTargetProject } from "@/components/members/crew-targets";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

// „Zur Crew hinzufügen“ / „Anfragen“: Person für eine offene Rolle eines eigenen Projekts anfragen.
// Projekte serverseitig mit getCrewTargets(user.id) aus "@/components/members/crew-targets" laden.
export function AddToCrewDialog({
  creative, projects, label = "Zur Crew hinzufügen", variant = "outline", size = "sm", className,
}: {
  creative: { id: string; name: string; categories?: string[] };
  projects: CrewTargetProject[];
  label?: string;
  variant?: "default" | "outline" | "secondary" | "ghost";
  size?: "sm" | "default" | "lg";
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const firstMatch =
    projects.flatMap((p) => p.roles).find((r) => creative.categories?.includes(r.category)) ?? projects[0]?.roles[0];
  const [roleId, setRoleId] = useState<string>(firstMatch?.id ?? "");
  const [pending, start] = useTransition();

  function submit(formData: FormData) {
    start(async () => {
      const res = await sendCrewRequest(undefined, formData);
      if (res?.ok) {
        toast.success(res.message ?? "Anfrage gesendet.");
        setOpen(false);
      } else if (res?.error) {
        toast.error(res.error);
      }
    });
  }

  const selected = projects.flatMap((p) => p.roles).find((r) => r.id === roleId);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} size={size} className={className}>
          <UserPlus aria-hidden /> {label}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{creative.name} anfragen</DialogTitle>
          <DialogDescription>Zu welchem Projekt und welcher Rolle? Als Honorar wird das Rollenbudget angeboten – {creative.name.split(" ")[0]} kann frei annehmen, ablehnen oder ein Gegenangebot machen.</DialogDescription>
        </DialogHeader>

        {projects.length === 0 ? (
          <div className="flex flex-col items-start gap-3 rounded-lg border border-dashed p-4 text-sm">
            <p>Du hast noch kein Projekt mit offenen Rollen. Lege eines mit dem Briefing-Assistenten an – er schlägt Rollen und Budget vor.</p>
            <Button asChild size="sm">
              <Link href="/briefing"><Sparkles aria-hidden /> Neues Projekt mit Briefing-Assistent</Link>
            </Button>
          </div>
        ) : (
          <form action={submit} className="space-y-4">
            <input type="hidden" name="creativeId" value={creative.id} />
            <input type="hidden" name="roleId" value={roleId} />
            <RadioGroup value={roleId} onValueChange={setRoleId} aria-label="Projekt und Rolle wählen" className="gap-4">
              {projects.map((p) => (
                <fieldset key={p.id} className="space-y-2">
                  <legend className="text-sm font-semibold">
                    {p.title} <span className="font-normal text-muted-foreground">· {p.city}</span>
                  </legend>
                  {p.roles.map((r) => {
                    const fits = creative.categories?.includes(r.category);
                    return (
                      <Label
                        key={r.id}
                        htmlFor={`role-${r.id}`}
                        className={cn(
                          "flex cursor-pointer items-center gap-3 rounded-lg border p-3 font-normal transition-colors hover:bg-muted/50",
                          roleId === r.id && "border-primary bg-primary/5",
                        )}
                      >
                        <RadioGroupItem value={r.id} id={`role-${r.id}`} />
                        <span className="min-w-0 flex-1">
                          <span className="block font-medium">{r.title}</span>
                          <span className="block text-xs text-muted-foreground">
                            {categoryName(r.category)}{fits && " · passt zum Bereich"}
                          </span>
                        </span>
                        <span className="text-sm font-semibold">{formatEur(r.budget)}</span>
                      </Label>
                    );
                  })}
                </fieldset>
              ))}
            </RadioGroup>
            <div className="space-y-1.5">
              <Label htmlFor={`note-${creative.id}`}>Nachricht (optional)</Label>
              <Textarea id={`note-${creative.id}`} name="note" rows={3} placeholder="Kurz zum Projekt, Termin, Stil …" />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={pending || !roleId} className="w-full sm:w-auto">
                {pending ? "Wird gesendet …" : selected ? `Anfrage senden (${formatEur(selected.budget)})` : "Anfrage senden"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
