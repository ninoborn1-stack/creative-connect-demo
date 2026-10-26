"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type SelectDef = { name: string; label: string; all: string; options: { value: string; label: string }[] };
type ToggleDef = { name: string; label: string };

// Filterleiste, die ihren Zustand in der URL hält (funktioniert auch in der statischen Browser-Demo)
export function UrlFilters({
  search, selects = [], toggles = [], keep = [], className,
}: { search?: { name: string; placeholder: string; label: string }; selects?: SelectDef[]; toggles?: ToggleDef[]; keep?: string[]; className?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const current = useSearchParams();
  const [q, setQ] = useState(search ? (current.get(search.name) ?? "") : "");

  function push(patch: Record<string, string | undefined>) {
    const params = new URLSearchParams(current.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (!v) params.delete(k);
      else params.set(k, v);
    }
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  const names = [search?.name, ...selects.map((s) => s.name), ...toggles.map((t) => t.name)].filter(Boolean) as string[];
  const active = names.some((n) => current.get(n));

  function reset() {
    const params = new URLSearchParams();
    for (const k of keep) {
      const v = current.get(k);
      if (v) params.set(k, v);
    }
    setQ("");
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  return (
    <div className={cn("space-y-3 rounded-xl border bg-card p-3 sm:p-4", className)}>
      {search && (
        <form
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            push({ [search.name]: q.trim() || undefined });
          }}
          className="flex gap-2"
        >
          <Label htmlFor={`f-${search.name}`} className="sr-only">{search.label}</Label>
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input id={`f-${search.name}`} value={q} onChange={(e) => setQ(e.target.value)} placeholder={search.placeholder} className="pl-8" type="search" />
          </div>
          <Button type="submit" variant="secondary">Suchen</Button>
        </form>
      )}
      {(selects.length > 0 || toggles.length > 0) && (
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-end">
          {selects.map((s) => (
            <div key={s.name} className="min-w-0 space-y-1 sm:w-44">
              <Label htmlFor={`f-${s.name}`} className="text-xs text-muted-foreground">{s.label}</Label>
              <select
                id={`f-${s.name}`}
                value={current.get(s.name) ?? ""}
                onChange={(e) => push({ [s.name]: e.target.value || undefined })}
                className="h-9 w-full min-w-0 rounded-md border border-input bg-transparent px-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:bg-input/30"
              >
                <option value="">{s.all}</option>
                {s.options.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          ))}
          {toggles.map((t) => {
            const on = current.get(t.name) === "1";
            return (
              <label key={t.name} className="col-span-1 flex h-9 cursor-pointer items-center gap-2 rounded-md border px-2.5 text-sm has-[:checked]:border-primary/60 has-[:checked]:bg-primary/10">
                <input type="checkbox" checked={on} onChange={() => push({ [t.name]: on ? undefined : "1" })} className="size-4 accent-[var(--primary)]" />
                <span className="truncate">{t.label}</span>
              </label>
            );
          })}
          {active && (
            <Button type="button" variant="ghost" size="sm" onClick={reset} className="h-9">
              <X aria-hidden /> Zurücksetzen
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
