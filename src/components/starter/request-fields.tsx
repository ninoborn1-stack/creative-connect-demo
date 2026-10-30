import { addDays, format } from "date-fns";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

// Gemeinsame Felder der Paket- und Artist-Anfrage
export function RequestFields({ titleLabel, titlePlaceholder, defaultCity, budget }: {
  titleLabel: string; titlePlaceholder: string; defaultCity?: string; budget?: number;
}) {
  const minDate = format(addDays(new Date(), 1), "yyyy-MM-dd");
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-1.5 sm:col-span-2">
        <Label htmlFor="req-title">{titleLabel}</Label>
        <Input id="req-title" name="title" required minLength={3} maxLength={120} placeholder={titlePlaceholder} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="req-city">Ort</Label>
        <Input id="req-city" name="city" required defaultValue={defaultCity} placeholder="z. B. Berlin" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="req-date">Wunschtermin</Label>
        <Input id="req-date" name="date" type="date" required min={minDate} defaultValue={format(addDays(new Date(), 21), "yyyy-MM-dd")} />
      </div>
      {budget !== undefined && (
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="req-budget">Budget in €</Label>
          <Input id="req-budget" name="budget" type="number" required min={50} defaultValue={budget} />
        </div>
      )}
      <div className="space-y-1.5 sm:col-span-2">
        <Label htmlFor="req-note">Nachricht <span className="font-normal text-muted-foreground">(optional)</span></Label>
        <Textarea id="req-note" name="note" rows={3} maxLength={1000} placeholder="Referenzen, Stil, Links – alles, was hilft." />
      </div>
    </div>
  );
}
