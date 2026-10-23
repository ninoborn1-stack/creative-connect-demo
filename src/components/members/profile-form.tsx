"use client";

import { useActionState } from "react";
import { updateProfile } from "@/app/actions/members";
import { AVAILABILITY, CITIES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export type ProfileFormValues = {
  headline: string; bio: string; city: string; travelRadiusKm: number; dayRateMin: number; dayRateMax: number;
  availability: string; skills: string[]; instagram: string | null; website: string | null;
};

export function ProfileForm({ values }: { values: ProfileFormValues }) {
  const [state, action, pending] = useActionState(updateProfile, undefined);
  return (
    <form action={action} className="space-y-6">
      <fieldset className="space-y-4 rounded-xl border bg-card p-4 sm:p-6">
        <legend className="px-1 text-sm font-semibold">Auftritt</legend>
        <div className="space-y-1.5">
          <Label htmlFor="headline">Headline</Label>
          <Input id="headline" name="headline" defaultValue={values.headline} maxLength={80} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="bio">Über mich</Label>
          <Textarea id="bio" name="bio" defaultValue={values.bio} rows={6} maxLength={1200} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="skills">Skills</Label>
          <Input id="skills" name="skills" defaultValue={values.skills.join(", ")} aria-describedby="skills-hint" />
          <p id="skills-hint" className="text-xs text-muted-foreground">Mit Komma getrennt, max. 12 – z. B. „Color Grading, Drohne, Schnitt“.</p>
        </div>
      </fieldset>

      <fieldset className="space-y-4 rounded-xl border bg-card p-4 sm:p-6">
        <legend className="px-1 text-sm font-semibold">Ort &amp; Verfügbarkeit</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="city">Stadt</Label>
            <Select name="city" defaultValue={CITIES.some((c) => c.name === values.city) ? values.city : undefined}>
              <SelectTrigger id="city" className="w-full"><SelectValue placeholder={values.city} /></SelectTrigger>
              <SelectContent>
                {CITIES.map((c) => <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="travelRadiusKm">Reiseradius (km)</Label>
            <Input id="travelRadiusKm" name="travelRadiusKm" type="number" min={0} max={2000} step={10} defaultValue={values.travelRadiusKm} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="availability">Verfügbarkeit</Label>
          <Select name="availability" defaultValue={values.availability}>
            <SelectTrigger id="availability" className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(AVAILABILITY).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </fieldset>

      <fieldset className="space-y-4 rounded-xl border bg-card p-4 sm:p-6">
        <legend className="px-1 text-sm font-semibold">Preise</legend>
        <p className="text-sm text-muted-foreground">Du setzt deine Preise selbst. Creative Connect nimmt 0 % Provision von Kreativen.</p>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="dayRateMin">Tagessatz von (€)</Label>
            <Input id="dayRateMin" name="dayRateMin" type="number" min={50} step={10} defaultValue={values.dayRateMin} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="dayRateMax">Tagessatz bis (€)</Label>
            <Input id="dayRateMax" name="dayRateMax" type="number" min={50} step={10} defaultValue={values.dayRateMax} required />
          </div>
        </div>
      </fieldset>

      <fieldset className="space-y-4 rounded-xl border bg-card p-4 sm:p-6">
        <legend className="px-1 text-sm font-semibold">Links</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="instagram">Instagram</Label>
            <Input id="instagram" name="instagram" defaultValue={values.instagram ?? ""} placeholder="@deinname" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="website">Website</Label>
            <Input id="website" name="website" type="url" defaultValue={values.website ?? ""} placeholder="https://" />
          </div>
        </div>
      </fieldset>

      {state?.error && <p role="alert" className="text-sm text-destructive">{state.error}</p>}
      <div className="flex justify-end">
        <Button type="submit" size="lg" disabled={pending} className="w-full sm:w-auto">
          {pending ? "Speichern …" : "Profil speichern"}
        </Button>
      </div>
    </form>
  );
}
