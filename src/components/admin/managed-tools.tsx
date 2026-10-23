"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, FileText, Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createManagedOffer, createManagedProject, moveManagedStage } from "@/app/actions/admin";
import { ActionButton, useAdminAction } from "./action-button";

const eur = new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });

export function StageButtons({ projectId, title, canBack, canForward }: { projectId: string; title: string; canBack: boolean; canForward: boolean }) {
  return (
    <div className="flex gap-1.5">
      <ActionButton size="sm" variant="ghost" disabled={!canBack} action={() => moveManagedStage(projectId, -1)} aria-label={`„${title}“ eine Phase zurück`}>
        <ChevronLeft aria-hidden /> Zurück
      </ActionButton>
      <ActionButton size="sm" variant="secondary" disabled={!canForward} action={() => moveManagedStage(projectId, 1)} aria-label={`„${title}“ eine Phase weiter`}>
        Weiter <ChevronRight aria-hidden />
      </ActionButton>
    </div>
  );
}

export function OfferDialog({ projectId, title, budget, marginPct, currentFee }: { projectId: string; title: string; budget: number; marginPct: number; currentFee?: number }) {
  const [open, setOpen] = useState(false);
  const [fee, setFee] = useState(String(currentFee ?? Math.round(budget / (1 + marginPct / 100) / 100) * 100));
  const { pending, run } = useAdminAction();
  const value = Number(fee.replace(/\./g, "").replace(",", "."));
  const valid = Number.isFinite(value) && value >= 100;
  const margin = valid ? Math.round((value * marginPct) / 100) : 0;
  const total = valid ? value + margin : 0;
  const inputId = `offer-fee-${projectId}`;

  return (
    <Dialog open={open} onOpenChange={(o) => !pending && setOpen(o)}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <FileText aria-hidden /> {currentFee ? "Angebot ändern" : "Angebot erstellen"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Angebot: {title}</DialogTitle>
          <DialogDescription>Honorarsumme der Crew plus {marginPct.toLocaleString("de-DE")} % Managed-Crew-Marge. Budget laut Anfrage: {eur.format(budget)}.</DialogDescription>
        </DialogHeader>
        <form
          className="grid gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (valid) run(() => createManagedOffer(projectId, value), () => setOpen(false));
          }}
        >
          <div className="grid gap-1.5">
            <Label htmlFor={inputId}>Honorarsumme Crew (€, netto)</Label>
            <Input id={inputId} inputMode="numeric" value={fee} onChange={(e) => setFee(e.target.value)} aria-invalid={!valid} />
          </div>
          <dl className="grid gap-1 rounded-lg bg-muted/50 p-3 text-sm">
            <div className="flex justify-between gap-2">
              <dt className="text-muted-foreground">Honorare</dt>
              <dd className="tabular-nums">{eur.format(valid ? value : 0)}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-muted-foreground">Marge {marginPct.toLocaleString("de-DE")} %</dt>
              <dd className="tabular-nums">{eur.format(margin)}</dd>
            </div>
            <div className="flex justify-between gap-2 border-t pt-1 font-semibold">
              <dt>Gesamtpreis (zzgl. USt.)</dt>
              <dd className="tabular-nums">{eur.format(total)}</dd>
            </div>
            {valid && total > budget && <p className="text-xs text-amber-600 dark:text-amber-300">Liegt über dem Budget der Anfrage.</p>}
          </dl>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={pending}>Abbrechen</Button>
            </DialogClose>
            <Button type="submit" disabled={!valid || pending}>
              {pending && <Loader2 className="animate-spin" aria-hidden />} Angebot senden
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function CreateManagedDialog({ clients, cities }: { clients: { id: string; label: string }[]; cities: string[] }) {
  const [open, setOpen] = useState(false);
  const [ownerId, setOwnerId] = useState("");
  const [title, setTitle] = useState("");
  const [budget, setBudget] = useState("8000");
  const [city, setCity] = useState("");
  const { pending, run } = useAdminAction();

  return (
    <Dialog open={open} onOpenChange={(o) => !pending && setOpen(o)}>
      <DialogTrigger asChild>
        <Button>
          <Plus aria-hidden /> Managed Crew anlegen
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Managed Crew anlegen</DialogTitle>
          <DialogDescription>Das Team stellt die Crew zusammen und betreut das Projekt. Startet in der Phase „Anfrage“.</DialogDescription>
        </DialogHeader>
        <form
          className="grid gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            run(
              () => createManagedProject({ ownerId, title, budget: Number(budget), city }),
              () => {
                setOpen(false);
                setTitle("");
                setOwnerId("");
                setCity("");
              },
            );
          }}
        >
          <div className="grid gap-1.5">
            <Label htmlFor="managed-owner">Auftraggeber:in</Label>
            <Select value={ownerId} onValueChange={setOwnerId}>
              <SelectTrigger id="managed-owner" className="w-full">
                <SelectValue placeholder="Auswählen …" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="managed-title">Titel</Label>
            <Input id="managed-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="z. B. Kampagnen-Shooting Herbst" required minLength={3} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="managed-budget">Budget (€)</Label>
              <Input id="managed-budget" type="number" min={500} step={100} value={budget} onChange={(e) => setBudget(e.target.value)} required />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="managed-city">Stadt</Label>
              <Input id="managed-city" list="managed-cities" value={city} onChange={(e) => setCity(e.target.value)} required />
              <datalist id="managed-cities">
                {cities.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={pending}>Abbrechen</Button>
            </DialogClose>
            <Button type="submit" disabled={pending || !ownerId}>
              {pending && <Loader2 className="animate-spin" aria-hidden />} Anlegen
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
