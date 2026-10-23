"use client";

import { useState, useTransition } from "react";
import { Loader2, Plus, Send, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { createEquipment, deleteEquipment, requestEquipment } from "@/app/actions/community";
import { CITIES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { NativeSelect } from "@/components/venues/native-select";

export function EquipmentRequestDialog({ listing }: { listing: { id: string; title: string; ownerName: string; mode: string } }) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState(
    listing.mode === "verleih"
      ? `Hallo ${listing.ownerName.split(" ")[0]}, ich würde „${listing.title}“ gern ausleihen. Wäre es am … verfügbar?`
      : `Hallo ${listing.ownerName.split(" ")[0]}, ist „${listing.title}“ noch zu haben? Ich hätte Interesse.`,
  );
  const [pending, startTransition] = useTransition();

  function send(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await requestEquipment({ listingId: listing.id, message });
      if (!res.ok) return void toast.error(res.error);
      setOpen(false);
      toast.success(`Anfrage an ${listing.ownerName} gesendet`);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="w-full">Anfragen</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={send} className="grid gap-4">
          <DialogHeader>
            <DialogTitle>{listing.title} anfragen</DialogTitle>
            <DialogDescription>{listing.ownerName} bekommt deine Nachricht als Benachrichtigung und per E-Mail.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-1.5">
            <Label htmlFor={`req-${listing.id}`}>Nachricht</Label>
            <Textarea id={`req-${listing.id}`} rows={4} value={message} onChange={(e) => setMessage(e.target.value)} maxLength={1000} />
          </div>
          <DialogFooter>
            <DialogClose asChild><Button type="button" variant="outline">Abbrechen</Button></DialogClose>
            <Button type="submit" disabled={pending || message.trim().length < 5}>
              {pending ? <Loader2 className="animate-spin" aria-hidden /> : <Send aria-hidden />}Anfrage senden
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function EquipmentDeleteButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      size="sm"
      variant="destructive"
      className="w-full"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const res = await deleteEquipment(id);
          if (!res.ok) return void toast.error(res.error);
          toast.success("Angebot entfernt");
        })
      }
    >
      {pending ? <Loader2 className="animate-spin" aria-hidden /> : <Trash2 aria-hidden />}Angebot entfernen
    </Button>
  );
}

export function EquipmentCreateDialog({ defaultCity, defaultMode }: { defaultCity: string; defaultMode: "verleih" | "verkauf" }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<string>(defaultMode);
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const get = (k: string) => String(fd.get(k) ?? "");
    startTransition(async () => {
      const res = await createEquipment({
        title: get("title"), description: get("description"), mode, price: Number(get("price")), condition: get("condition"), city: get("city"),
      });
      if (!res.ok) return void toast.error(res.error);
      setOpen(false);
      toast.success("Angebot eingestellt");
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><Plus aria-hidden />Angebot einstellen</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <form onSubmit={submit} className="grid gap-4">
          <DialogHeader>
            <DialogTitle>Angebot einstellen</DialogTitle>
            <DialogDescription>Verleihe oder verkaufe Equipment an Mitglieder. Ein Stock-Foto wird automatisch ergänzt.</DialogDescription>
          </DialogHeader>
          <fieldset className="grid gap-1.5">
            <legend className="mb-1.5 text-sm font-medium">Art</legend>
            <div className="grid grid-cols-2 gap-2">
              {(["verleih", "verkauf"] as const).map((m) => (
                <label key={m} className="flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm has-checked:border-primary has-checked:bg-primary/10">
                  <input type="radio" name="mode" value={m} checked={mode === m} onChange={() => setMode(m)} className="accent-primary" />
                  {m === "verleih" ? "Verleih" : "Verkauf"}
                </label>
              ))}
            </div>
          </fieldset>
          <div className="grid gap-1.5">
            <Label htmlFor="eq-title">Titel</Label>
            <Input id="eq-title" name="title" required minLength={3} placeholder="z. B. Sony A7 IV mit 24–70 mm" />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="eq-desc">Beschreibung</Label>
            <Textarea id="eq-desc" name="description" rows={3} required placeholder="Zubehör, Zustand, Abholung …" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="eq-price">{mode === "verleih" ? "Preis pro Tag (€)" : "Festpreis (€)"}</Label>
              <Input id="eq-price" name="price" type="number" min={1} required inputMode="numeric" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="eq-cond">Zustand</Label>
              <NativeSelect id="eq-cond" name="condition" defaultValue="Sehr gut">
                {["Neuwertig", "Sehr gut", "Gut", "Gebraucht"].map((c) => <option key={c} value={c}>{c}</option>)}
              </NativeSelect>
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="eq-city">Stadt</Label>
            <NativeSelect id="eq-city" name="city" defaultValue={defaultCity}>
              {CITIES.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
            </NativeSelect>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button type="button" variant="outline">Abbrechen</Button></DialogClose>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="animate-spin" aria-hidden />}Angebot veröffentlichen
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
