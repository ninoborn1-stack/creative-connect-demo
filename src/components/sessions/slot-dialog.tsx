"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CalendarPlus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createSlot } from "@/app/actions/sessions";
import { SESSION_TYPES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { NativeSelect } from "@/components/venues/native-select";

const DEFAULT_CAPACITY: Record<string, number> = { beat: 2, songwriting: 2, "mix-feedback": 1, "open-studio": 12, podcast: 2, workshop: 8 };
const HOURS = Array.from({ length: 19 }, (_, i) => i + 6); // 6–24 Uhr

export function SlotDialog({ defaultDate }: { defaultDate: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState("beat");
  const [title, setTitle] = useState(SESSION_TYPES.beat.label);
  const [points, setPoints] = useState(SESSION_TYPES.beat.points);
  const [capacity, setCapacity] = useState(DEFAULT_CAPACITY.beat);
  const [pending, start] = useTransition();

  function changeType(t: string) {
    // Titel nur überschreiben, wenn er noch der Standard des alten Typs ist
    if (!title.trim() || title === SESSION_TYPES[type]?.label) setTitle(SESSION_TYPES[t].label);
    setType(t);
    setPoints(SESSION_TYPES[t].points);
    setCapacity(DEFAULT_CAPACITY[t] ?? 2);
  }

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    start(async () => {
      const res = await createSlot({
        type, title, points, capacity,
        date: String(fd.get("date") ?? ""),
        startHour: Number(fd.get("startHour")),
        endHour: Number(fd.get("endHour")),
        location: String(fd.get("location") ?? ""),
      });
      if (!res.ok) return void toast.error(res.error);
      toast.success(res.message ?? "Slot angelegt.");
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><CalendarPlus aria-hidden />Slot anlegen</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <form onSubmit={submit} className="grid gap-4">
          <DialogHeader>
            <DialogTitle>Neuen Slot anlegen</DialogTitle>
            <DialogDescription>Der Slot erscheint sofort im Kalender und ist für Mitglieder buchbar.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-1.5">
            <Label htmlFor="slot-type">Typ</Label>
            <NativeSelect id="slot-type" value={type} onChange={(e) => changeType(e.target.value)}>
              {Object.entries(SESSION_TYPES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </NativeSelect>
            <p className="text-xs text-muted-foreground">{SESSION_TYPES[type].description}</p>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="slot-title">Titel</Label>
            <Input id="slot-title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} required />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="grid gap-1.5">
              <Label htmlFor="slot-date">Datum</Label>
              <Input id="slot-date" name="date" type="date" defaultValue={defaultDate} min={defaultDate} required />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="slot-start">Beginn</Label>
              <NativeSelect id="slot-start" name="startHour" defaultValue="14">
                {HOURS.slice(0, -1).map((h) => <option key={h} value={h}>{h}:00 Uhr</option>)}
              </NativeSelect>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="slot-end">Ende</Label>
              <NativeSelect id="slot-end" name="endHour" defaultValue="17">
                {HOURS.slice(1).map((h) => <option key={h} value={h}>{h}:00 Uhr</option>)}
              </NativeSelect>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="slot-capacity">Kapazität (Plätze)</Label>
              <Input id="slot-capacity" type="number" min={1} max={50} value={capacity} onChange={(e) => setCapacity(Number(e.target.value))} required />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="slot-points">Punkte für Teilnahme</Label>
              <Input id="slot-points" type="number" min={0} max={500} value={points} onChange={(e) => setPoints(Number(e.target.value))} required />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="slot-location">Ort</Label>
            <Input id="slot-location" name="location" defaultValue="Nestos Studio, Berlin-Kreuzberg" maxLength={160} />
          </div>
          <DialogFooter>
            <DialogClose asChild><Button type="button" variant="outline">Abbrechen</Button></DialogClose>
            <Button type="submit" disabled={pending}>
              {pending ? <Loader2 className="animate-spin" aria-hidden /> : <CalendarPlus aria-hidden />}Slot anlegen
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
