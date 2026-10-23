"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal } from "lucide-react";
import { CATEGORIES, CITIES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

export type MemberFilters = {
  q?: string; bereich?: string; skill?: string; stadt?: string; umkreis?: string; maxsatz?: string;
  von?: string; bis?: string; verifiziert?: string; bewertung?: string; sort?: string; ansicht?: string;
};

const FILTER_KEYS = ["bereich", "skill", "stadt", "umkreis", "maxsatz", "von", "bis", "verifiziert", "bewertung"] as const;
const ALL = "alle";

function useUpdateUrl() {
  const router = useRouter();
  const pathname = usePathname();
  const current = useSearchParams();
  return (patch: Record<string, string | undefined>, replaceAll = false) => {
    const params = new URLSearchParams(replaceAll ? "" : current.toString());
    if (replaceAll) {
      for (const k of ["q", "sort", "ansicht"]) {
        const v = current.get(k);
        if (v) params.set(k, v);
      }
    }
    for (const [k, v] of Object.entries(patch)) {
      if (!v || v === ALL) params.delete(k);
      else params.set(k, v);
    }
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };
}

export function activeFilterCount(f: MemberFilters) {
  return FILTER_KEYS.filter((k) => k !== "umkreis" && f[k]).length;
}

function SelectField({
  id, label, name, value, placeholder, options,
}: { id: string; label: string; name: string; value?: string; placeholder: string; options: { value: string; label: string }[] }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Select name={name} defaultValue={value ?? ALL}>
        <SelectTrigger id={id} className="w-full">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>{placeholder}</SelectItem>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function FilterForm({ filters, skills, idPrefix, onDone }: { filters: MemberFilters; skills: string[]; idPrefix: string; onDone?: () => void }) {
  const update = useUpdateUrl();
  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const patch: Record<string, string | undefined> = {};
        for (const k of FILTER_KEYS) patch[k] = String(fd.get(k) ?? "") || undefined;
        patch.verifiziert = fd.get("verifiziert") ? "1" : undefined;
        update(patch, true);
        onDone?.();
      }}
    >
      <SelectField id={`${idPrefix}-bereich`} label="Bereich" name="bereich" value={filters.bereich} placeholder="Alle Bereiche"
        options={CATEGORIES.map((c) => ({ value: c.slug, label: c.name }))} />
      <SelectField id={`${idPrefix}-skill`} label="Skill" name="skill" value={filters.skill} placeholder="Alle Skills"
        options={skills.map((s) => ({ value: s, label: s }))} />
      <div className="grid grid-cols-2 gap-3">
        <SelectField id={`${idPrefix}-stadt`} label="Stadt" name="stadt" value={filters.stadt} placeholder="Überall"
          options={CITIES.map((c) => ({ value: c.name, label: c.name }))} />
        <SelectField id={`${idPrefix}-umkreis`} label="Umkreis" name="umkreis" value={filters.umkreis} placeholder="30 km"
          options={[50, 100, 200, 400].map((k) => ({ value: String(k), label: `${k} km` }))} />
      </div>
      <SelectField id={`${idPrefix}-maxsatz`} label="Tagessatz (ab) höchstens" name="maxsatz" value={filters.maxsatz} placeholder="Egal"
        options={[300, 500, 800, 1200, 2000].map((v) => ({ value: String(v), label: `bis ${v.toLocaleString("de-DE")} €` }))} />
      <fieldset className="space-y-1.5">
        <legend className="text-sm font-medium">Verfügbar im Zeitraum</legend>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label htmlFor={`${idPrefix}-von`} className="text-xs text-muted-foreground">von</Label>
            <Input id={`${idPrefix}-von`} name="von" type="date" defaultValue={filters.von} />
          </div>
          <div className="space-y-1">
            <Label htmlFor={`${idPrefix}-bis`} className="text-xs text-muted-foreground">bis</Label>
            <Input id={`${idPrefix}-bis`} name="bis" type="date" defaultValue={filters.bis} />
          </div>
        </div>
      </fieldset>
      <SelectField id={`${idPrefix}-bewertung`} label="Mindestbewertung" name="bewertung" value={filters.bewertung} placeholder="Egal"
        options={[{ value: "3", label: "ab 3 ★" }, { value: "4", label: "ab 4 ★" }, { value: "4.5", label: "ab 4,5 ★" }]} />
      <div className="flex items-center gap-2">
        <Checkbox id={`${idPrefix}-verifiziert`} name="verifiziert" value="1" defaultChecked={filters.verifiziert === "1"} />
        <Label htmlFor={`${idPrefix}-verifiziert`} className="font-normal">Nur verifizierte Mitglieder</Label>
      </div>
      <div className="flex gap-2 pt-1">
        <Button type="submit" className="flex-1">Filter anwenden</Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            update(Object.fromEntries(FILTER_KEYS.map((k) => [k, undefined])), true);
            onDone?.();
          }}
        >
          Zurücksetzen
        </Button>
      </div>
    </form>
  );
}

export function MembersSearch({ q }: { q?: string }) {
  const update = useUpdateUrl();
  return (
    <form
      role="search"
      className="relative flex-1"
      onSubmit={(e) => {
        e.preventDefault();
        update({ q: String(new FormData(e.currentTarget).get("q") ?? "").trim() || undefined });
      }}
    >
      <Label htmlFor="member-search" className="sr-only">Mitglieder durchsuchen</Label>
      <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
      <Input id="member-search" name="q" defaultValue={q} placeholder="Name, Headline oder Skill …" className="h-9 pl-9" />
    </form>
  );
}

export function SortSelect({ value }: { value?: string }) {
  const update = useUpdateUrl();
  return (
    <div className="flex items-center gap-2">
      <Label htmlFor="member-sort" className="shrink-0 text-xs text-muted-foreground">Sortieren</Label>
      <Select value={value ?? "bewertung"} onValueChange={(v) => update({ sort: v === "bewertung" ? undefined : v })}>
        <SelectTrigger id="member-sort" size="sm" className="w-44">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="bewertung">Beste Bewertung</SelectItem>
          <SelectItem value="preis-auf">Preis aufsteigend</SelectItem>
          <SelectItem value="preis-ab">Preis absteigend</SelectItem>
          <SelectItem value="neu">Neu im Netzwerk</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

export function MembersFilterSidebar({ filters, skills }: { filters: MemberFilters; skills: string[] }) {
  return (
    <aside className="hidden lg:block" aria-labelledby="filter-heading">
      <div className="sticky top-20 rounded-xl border bg-card p-4">
        <h2 id="filter-heading" className="mb-4 font-semibold">Filter</h2>
        <FilterForm filters={filters} skills={skills} idPrefix="d" />
      </div>
    </aside>
  );
}

export function MembersFilterSheet({ filters, skills }: { filters: MemberFilters; skills: string[] }) {
  const [open, setOpen] = useState(false);
  const count = activeFilterCount(filters);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="h-9 lg:hidden">
          <SlidersHorizontal aria-hidden /> Filter{count > 0 && ` (${count})`}
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="max-h-[85dvh] overflow-y-auto p-4">
        <SheetHeader className="p-0">
          <SheetTitle>Filter</SheetTitle>
          <SheetDescription>Grenze das Verzeichnis nach Bereich, Ort, Preis und Verfügbarkeit ein.</SheetDescription>
        </SheetHeader>
        <FilterForm filters={filters} skills={skills} idPrefix="m" onDone={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}
