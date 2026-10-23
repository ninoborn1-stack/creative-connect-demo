"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { ImageIcon, Loader2, Trash2 } from "lucide-react";
import { createVenue, deleteVenue, updateVenue, type VenueFormState } from "@/app/actions/venues";
import { CITIES, VENUE_TYPES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { NativeSelect } from "./native-select";

export type VenueFormValues = {
  id?: string;
  slug?: string;
  name: string;
  type: string;
  city: string;
  address: string;
  description: string;
  features: string[];
  pricePerHour: number | "";
  pricePerDay: number | "";
  capacity: number | "";
  instantBook: boolean;
};

function FieldError({ id, msg }: { id: string; msg?: string }) {
  if (!msg) return null;
  return <p id={id} className="text-xs text-destructive">{msg}</p>;
}

export function VenueForm({ initial }: { initial: VenueFormValues }) {
  const editing = Boolean(initial.id);
  const action = editing ? updateVenue.bind(null, initial.id!) : createVenue;
  const [state, formAction, pending] = useActionState<VenueFormState, FormData>(action, undefined);
  const [features, setFeatures] = useState(initial.features.join(", "));
  const [instant, setInstant] = useState(initial.instantBook);
  const chips = features.split(/[,\n]/).map((f) => f.trim()).filter(Boolean);
  const fe = state?.fieldErrors ?? {};
  const v = (k: string, fallback: string | number) => state?.values?.[k] ?? fallback;
  const err = (k: string) => (fe[k] ? { "aria-invalid": true, "aria-describedby": `${k}-error` } : {});

  return (
    <div className="space-y-6">
      <form action={formAction} className="space-y-6" noValidate>
        {state?.error && <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">{state.error}</p>}

        <fieldset className="space-y-4 rounded-xl border bg-card p-4">
          <legend className="px-1 text-sm font-semibold">Grunddaten</legend>
          <div className="grid gap-1.5">
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" defaultValue={v("name", initial.name)} required placeholder="z. B. Studio Nordlicht" {...err("name")} />
            <FieldError id="name-error" msg={fe.name} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="type">Typ</Label>
              <NativeSelect id="type" name="type" defaultValue={v("type", initial.type)} {...err("type")}>
                <option value="">Typ wählen …</option>
                {Object.entries(VENUE_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </NativeSelect>
              <FieldError id="type-error" msg={fe.type} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="city">Stadt</Label>
              <NativeSelect id="city" name="city" defaultValue={v("city", initial.city)} {...err("city")}>
                <option value="">Stadt wählen …</option>
                {CITIES.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
              </NativeSelect>
              <FieldError id="city-error" msg={fe.city} />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="address">Adresse</Label>
            <Input id="address" name="address" defaultValue={v("address", initial.address)} placeholder="Straße Hausnummer, Stadt" {...err("address")} />
            <FieldError id="address-error" msg={fe.address} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="description">Beschreibung</Label>
            <Textarea id="description" name="description" rows={5} defaultValue={v("description", initial.description)} placeholder="Was macht deine Venue besonders? Für welche Produktionen eignet sie sich?" {...err("description")} />
            <FieldError id="description-error" msg={fe.description} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="features">Ausstattung</Label>
            <Input id="features" name="features" value={features} onChange={(e) => setFeatures(e.target.value)} placeholder="z. B. Vocal-Booth, Neve-Konsole, Lounge" aria-describedby="features-hint" />
            <p id="features-hint" className="text-xs text-muted-foreground">Mehrere Punkte mit Komma trennen.</p>
            {chips.length > 0 && (
              <ul className="flex flex-wrap gap-1.5" aria-label="Ausstattung Vorschau">
                {chips.map((c, i) => <li key={`${c}-${i}`}><Badge variant="secondary">{c}</Badge></li>)}
              </ul>
            )}
          </div>
        </fieldset>

        <fieldset className="space-y-4 rounded-xl border bg-card p-4">
          <legend className="px-1 text-sm font-semibold">Preise & Buchung</legend>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="grid gap-1.5">
              <Label htmlFor="pricePerHour">Preis pro Stunde (€)</Label>
              <Input id="pricePerHour" name="pricePerHour" type="number" min={1} inputMode="numeric" defaultValue={v("pricePerHour", initial.pricePerHour)} {...err("pricePerHour")} />
              <FieldError id="pricePerHour-error" msg={fe.pricePerHour} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="pricePerDay">Preis pro Tag (€)</Label>
              <Input id="pricePerDay" name="pricePerDay" type="number" min={1} inputMode="numeric" defaultValue={v("pricePerDay", initial.pricePerDay)} {...err("pricePerDay")} />
              <FieldError id="pricePerDay-error" msg={fe.pricePerDay} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="capacity">Kapazität (Personen)</Label>
              <Input id="capacity" name="capacity" type="number" min={1} inputMode="numeric" defaultValue={v("capacity", initial.capacity)} {...err("capacity")} />
              <FieldError id="capacity-error" msg={fe.capacity} />
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Switch id="instantBook" name="instantBook" checked={instant} onCheckedChange={setInstant} className="mt-0.5" />
            <div>
              <Label htmlFor="instantBook">Sofortbuchung erlauben</Label>
              <p className="mt-1 text-xs text-muted-foreground">Mitglieder buchen freie Slots direkt und zahlen über den Zahlungsdienstleister (Demo).</p>
            </div>
          </div>
        </fieldset>

        <div className="flex items-start gap-2 rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
          <ImageIcon className="mt-0.5 size-4 shrink-0" aria-hidden />
          <p>Bilder: In der Demo werden automatisch vier Stock-Fotos passend zum Namen gewählt. Ein echter Upload folgt.</p>
        </div>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button asChild variant="ghost"><Link href={editing ? `/studios/${initial.slug}` : "/studios"}>Abbrechen</Link></Button>
          <Button type="submit" disabled={pending} className="h-10">
            {pending && <Loader2 className="animate-spin" aria-hidden />}
            {editing ? "Änderungen speichern" : "Venue anlegen"}
          </Button>
        </div>
      </form>

      {editing && (
        <div className="rounded-xl border border-destructive/30 p-4">
          <h2 className="font-semibold">Venue löschen</h2>
          <p className="mt-1 mb-3 text-sm text-muted-foreground">Die Venue und alle zugehörigen Buchungen werden entfernt.</p>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="destructive"><Trash2 aria-hidden />Venue löschen</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Venue wirklich löschen?</DialogTitle>
                <DialogDescription>„{initial.name}“ wird mit allen Buchungen gelöscht. Das lässt sich nicht rückgängig machen (außer per „Demo zurücksetzen“).</DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose asChild><Button variant="outline">Abbrechen</Button></DialogClose>
                <form action={deleteVenue.bind(null, initial.id!)}>
                  <Button type="submit" variant="destructive" className="w-full">Endgültig löschen</Button>
                </form>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      )}
    </div>
  );
}
