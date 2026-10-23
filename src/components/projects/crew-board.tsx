"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { GripVertical, Search, Send, Sparkles, UserPlus } from "lucide-react";
import { toast } from "sonner";
import {
  acceptCounterOffer, rejectCounterOffer, requestCreative, simulateAccept, simulateAllAccepts, withdrawRequest,
} from "@/app/actions/projects";
import { categoryName } from "@/lib/constants";
import { formatEur } from "@/lib/format";
import { StatusBadge } from "@/components/badges";
import { UserAvatar } from "@/components/user-avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ActionButton } from "./action-button";

export type BoardPerson = { id: string; name: string; avatarSeed: string | null; slug: string | null };
export type BoardCandidate = BoardPerson & { city: string; dayRateMin: number; categories: string[]; reasons: string[] };
export type BoardRequest = { id: string; status: string; price: number; counterPrice: number | null; creative: BoardPerson };
export type BoardRole = {
  id: string; title: string; category: string; budget: number; assignee: BoardPerson | null; acceptedPrice: number | null; requests: BoardRequest[];
};

const ACTIVE = ["offen", "gegenangebot"];
const COLUMNS = [
  { key: "offen", title: "Offen", hint: "Noch niemand angefragt" },
  { key: "angefragt", title: "Angefragt", hint: "Anfragen laufen parallel" },
  { key: "bestaetigt", title: "Bestätigt", hint: "Rolle besetzt" },
] as const;

function columnOf(r: BoardRole) {
  if (r.assignee) return "bestaetigt";
  return r.requests.some((q) => ACTIVE.includes(q.status)) ? "angefragt" : "offen";
}

export function CrewBoard({
  projectId, roles, suggestions, pool, isOwner, editable,
}: {
  projectId: string;
  roles: BoardRole[];
  suggestions: Record<string, BoardCandidate[]>;
  pool: BoardCandidate[];
  isOwner: boolean;
  editable: boolean;
}) {
  const canRequest = isOwner && editable;
  const openRoles = roles.filter((r) => !r.assignee);
  const [targetRole, setTargetRole] = useState(openRoles[0]?.id ?? "");
  const [query, setQuery] = useState("");
  const [dragOver, setDragOver] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const activeTarget = openRoles.some((r) => r.id === targetRole) ? targetRole : (openRoles[0]?.id ?? "");
  const hasActiveRequests = roles.some((r) => !r.assignee && r.requests.some((q) => ACTIVE.includes(q.status)));

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return pool
      .filter((p) => p.name.toLowerCase().includes(q) || p.city.toLowerCase().includes(q) || p.categories.some((c) => categoryName(c).toLowerCase().includes(q)))
      .slice(0, 8);
  }, [pool, query]);

  function request(roleId: string, creativeId: string) {
    if (!roleId) return toast.error("Wähle zuerst eine offene Rolle aus.");
    start(async () => {
      const res = await requestCreative(projectId, roleId, creativeId);
      if (res.ok) toast.success(res.message ?? "Angefragt.");
      else toast.error(res.error);
    });
  }

  function chip(c: BoardCandidate) {
    return (
      <li
        key={c.id}
        draggable={canRequest}
        onDragStart={(e) => {
          e.dataTransfer.setData("text/plain", c.id);
          e.dataTransfer.effectAllowed = "copy";
        }}
        className={cn("flex items-center gap-2 rounded-lg border bg-background p-2", canRequest && "cursor-grab active:cursor-grabbing")}
        data-testid="crew-chip"
      >
        {canRequest && <GripVertical className="size-4 shrink-0 text-muted-foreground" aria-hidden />}
        <UserAvatar name={c.name} seed={c.avatarSeed} className="size-8" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{c.name}</p>
          <p className="truncate text-[11px] text-muted-foreground">{c.city} · ab {formatEur(c.dayRateMin)}</p>
          {c.reasons.length > 0 && <p className="line-clamp-2 text-[11px] text-muted-foreground">Passt, weil {c.reasons.join(", ")}</p>}
        </div>
        {canRequest && (
          <Button type="button" size="xs" variant="secondary" disabled={pending || !activeTarget} onClick={() => request(activeTarget, c.id)} aria-label={`${c.name} für die gewählte Rolle anfragen`}>
            <Send aria-hidden /> Anfragen
          </Button>
        )}
      </li>
    );
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
      <div className="min-w-0 space-y-3">
        {isOwner && hasActiveRequests && editable && (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-dashed px-3 py-2 text-sm">
            <span className="text-muted-foreground">Demo-Modus: Zusagen der Kreativen simulieren, damit der Ablauf nicht hängen bleibt.</span>
            <ActionButton size="sm" variant="outline" action={() => simulateAllAccepts(projectId)} data-testid="simulate-accept-all">
              <Sparkles aria-hidden /> Demo: alle Zusagen simulieren
            </ActionButton>
          </div>
        )}
        <div className="grid gap-4 md:grid-cols-3">
          {COLUMNS.map((col) => {
            const items = roles.filter((r) => columnOf(r) === col.key);
            return (
              <section key={col.key} aria-labelledby={`col-${col.key}`} className="flex flex-col gap-3 rounded-xl bg-muted/40 p-3" data-testid={`column-${col.key}`}>
                <header>
                  <h3 id={`col-${col.key}`} className="flex items-center justify-between text-sm font-semibold">
                    {col.title} <span className="rounded-full bg-background px-2 text-xs text-muted-foreground">{items.length}</span>
                  </h3>
                  <p className="text-[11px] text-muted-foreground">{col.hint}</p>
                </header>
                {items.length === 0 && <p className="rounded-lg border border-dashed px-3 py-4 text-center text-xs text-muted-foreground">Keine Rollen</p>}
                {items.map((r) => {
                  const droppable = canRequest && !r.assignee;
                  const visible = r.requests.filter((q) => q.status !== "zurueckgezogen");
                  return (
                    <article
                      key={r.id}
                      onDragOver={droppable ? (e) => { e.preventDefault(); e.dataTransfer.dropEffect = "copy"; setDragOver(r.id); } : undefined}
                      onDragLeave={droppable ? () => setDragOver((x) => (x === r.id ? null : x)) : undefined}
                      onDrop={droppable ? (e) => {
                        e.preventDefault();
                        setDragOver(null);
                        const id = e.dataTransfer.getData("text/plain");
                        if (id) request(r.id, id);
                      } : undefined}
                      className={cn("rounded-lg border bg-card p-3 transition-colors", dragOver === r.id && "border-primary ring-2 ring-primary/40", droppable && "border-dashed")}
                      data-testid="role-card"
                      aria-label={`Rolle ${r.title}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold">{r.title}</p>
                          <p className="text-[11px] text-muted-foreground">{categoryName(r.category)} · Budget {formatEur(r.budget)}</p>
                        </div>
                        {droppable && (
                          <Button type="button" size="icon-xs" variant="ghost" aria-label={`Personen für ${r.title} vorschlagen`} onClick={() => setTargetRole(r.id)}>
                            <UserPlus aria-hidden />
                          </Button>
                        )}
                      </div>
                      {r.assignee && (
                        <div className="mt-3 flex items-center gap-2 rounded-md bg-emerald-500/10 p-2">
                          <UserAvatar name={r.assignee.name} seed={r.assignee.avatarSeed} className="size-8" />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">{r.assignee.name}</p>
                            <p className="text-[11px] text-muted-foreground">Zugesagt · {formatEur(r.acceptedPrice ?? r.budget)}</p>
                          </div>
                        </div>
                      )}
                      {!r.assignee && visible.length > 0 && (
                        <ul className="mt-3 flex flex-col gap-2">
                          {visible.map((q) => (
                            <li key={q.id} className="rounded-md border p-2">
                              <div className="flex items-center gap-2">
                                <UserAvatar name={q.creative.name} seed={q.creative.avatarSeed} className="size-7" />
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-xs font-medium">{q.creative.name}</p>
                                  <p className="text-[11px] text-muted-foreground">
                                    {formatEur(q.price)}
                                    {q.status === "gegenangebot" && q.counterPrice != null && <> → <strong className="text-foreground">{formatEur(q.counterPrice)}</strong></>}
                                  </p>
                                </div>
                                <StatusBadge status={q.status} kind="request" />
                              </div>
                              {isOwner && editable && q.status === "offen" && (
                                <div className="mt-2 flex flex-wrap gap-1.5">
                                  <ActionButton size="xs" action={() => simulateAccept(q.id)} data-testid="simulate-accept">
                                    Demo: Zusage simulieren
                                  </ActionButton>
                                  <ActionButton size="xs" variant="ghost" action={() => withdrawRequest(q.id)}>
                                    Zurückziehen
                                  </ActionButton>
                                </div>
                              )}
                              {isOwner && editable && q.status === "gegenangebot" && (
                                <div className="mt-2 flex flex-wrap gap-1.5">
                                  <ActionButton size="xs" action={() => acceptCounterOffer(q.id)} data-testid="accept-counter">
                                    Gegenangebot annehmen
                                  </ActionButton>
                                  <ActionButton size="xs" variant="outline" action={() => rejectCounterOffer(q.id)}>
                                    Ablehnen
                                  </ActionButton>
                                </div>
                              )}
                            </li>
                          ))}
                        </ul>
                      )}
                      {droppable && <p className="mt-2 text-center text-[11px] text-muted-foreground">Person hierher ziehen oder rechts „Anfragen“</p>}
                    </article>
                  );
                })}
              </section>
            );
          })}
        </div>
      </div>

      {canRequest ? (
        <aside className="space-y-4 rounded-xl border bg-card p-4" aria-labelledby="vorschlaege">
          <h3 id="vorschlaege" className="font-semibold">Vorschläge & Suche</h3>
          {openRoles.length === 0 ? (
            <p className="text-sm text-muted-foreground">Alle Rollen sind besetzt.</p>
          ) : (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="target-role">Für Rolle</Label>
                <select
                  id="target-role"
                  value={activeTarget}
                  onChange={(e) => setTargetRole(e.target.value)}
                  className="h-8 w-full rounded-lg border border-input bg-transparent px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
                >
                  {openRoles.map((r) => <option key={r.id} value={r.id}>{r.title}</option>)}
                </select>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Passende Mitglieder (transparentes Scoring)</p>
                {(suggestions[activeTarget] ?? []).length ? (
                  <ul className="mt-2 flex flex-col gap-2">
                    {(suggestions[activeTarget] ?? []).map(chip)}
                  </ul>
                ) : (
                  <p className="mt-2 text-xs text-muted-foreground">Keine weiteren Vorschläge – nutze die Suche.</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="crew-search">Mitglieder suchen</Label>
                <div className="relative">
                  <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                  <Input id="crew-search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Name, Stadt oder Bereich" className="pl-8" />
                </div>
                {query.trim() && (
                  searchResults.length ? (
                    <ul className="mt-2 flex flex-col gap-2">{searchResults.map(chip)}</ul>
                  ) : (
                    <p className="text-xs text-muted-foreground">Niemand gefunden.</p>
                  )
                )}
              </div>
              <p className="text-[11px] text-muted-foreground">
                Tipp: Karten per Drag & Drop auf eine Rolle ziehen. Mehrere Anfragen pro Rolle laufen parallel – wer zuerst zusagt, ist dabei.{" "}
                <Link href="/mitglieder" className="text-primary underline-offset-4 hover:underline">Zum Verzeichnis</Link>
              </p>
            </>
          )}
        </aside>
      ) : (
        <aside className="h-fit rounded-xl border bg-card p-4 text-sm text-muted-foreground">
          {isOwner ? "Die Crew steht – Änderungen sind nach der Bestätigung nicht mehr möglich." : "Nur die Auftraggeber:in kann die Crew zusammenstellen. Du siehst den aktuellen Stand."}
        </aside>
      )}
    </div>
  );
}
