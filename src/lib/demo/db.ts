// Browser-Datenbank der statischen Demo: Snapshot (public/demo-data.json) + Änderungen dieses Browsers.
// Änderungen liegen als Overlay (geänderte/gelöschte Datensätze) in localStorage, bei Platzproblemen in IndexedDB.
import type { PrismaClient } from "@prisma/client";
import { addDays, differenceInCalendarDays } from "date-fns";
import { BASE_PATH, DEMO_VERSION } from "./config";
import { DemoEngine, createDemoClient, type DemoSnapshot } from "./engine";
import { idbDelete, idbGet, idbSet } from "./idb";
import { clearUploads, loadUploads } from "./uploads";

type RawRow = Record<string, unknown>;
type Overlay = { version: string; shiftDays: number; rows: Record<string, Record<string, RawRow | null>> };

const KEY = "cc-demo-state";
const IDB_FLAG = "cc-demo-state-in-idb";
let snapshot: DemoSnapshot | null = null;
let overlay: Overlay | null = null;
let enginePromise: Promise<DemoEngine> | null = null;
let dirty = false;

// Demo-Daten sind relativ zum Build-Tag erzeugt – auf „heute“ verschieben, damit Termine aktuell bleiben
const ISO = /\b(\d{4}-\d{2}-\d{2})(T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z)?\b/g;
function shiftData(snap: DemoSnapshot, days: number) {
  if (!days) return snap.data;
  const out: DemoSnapshot["data"] = {};
  for (const [model, rows] of Object.entries(snap.data)) {
    const fields = snap.schema.models[model].fields.filter((f) => f.kind === "scalar");
    out[model] = rows.map((r) => {
      const o: RawRow = { ...r };
      for (const f of fields) {
        const v = o[f.name];
        if (typeof v !== "string") continue;
        if (f.type === "DateTime") o[f.name] = addDays(new Date(v), days).toISOString();
        else if (v.startsWith("[") || v.startsWith("{")) {
          o[f.name] = v.replace(ISO, (m, d: string, t?: string) => {
            const shifted = addDays(new Date(t ? m : `${d}T12:00:00`), days);
            return t ? shifted.toISOString() : shifted.toISOString().slice(0, 10);
          });
        }
      }
      return o;
    });
  }
  return out;
}

function freshOverlay(snap: DemoSnapshot): Overlay {
  return { version: snap.version, shiftDays: differenceInCalendarDays(new Date(), new Date(snap.createdAt)), rows: {} };
}

async function readOverlay(): Promise<Overlay | null> {
  try {
    if (localStorage.getItem(IDB_FLAG)) return (await idbGet<Overlay>(KEY)) ?? null;
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Overlay) : null;
  } catch {
    return null;
  }
}

function persist() {
  dirty = false;
  if (!overlay) return;
  try {
    localStorage.setItem(KEY, JSON.stringify(overlay));
    if (localStorage.getItem(IDB_FLAG)) {
      localStorage.removeItem(IDB_FLAG);
      void idbDelete(KEY);
    }
  } catch {
    // Quota überschritten → IndexedDB
    try {
      localStorage.removeItem(KEY);
      localStorage.setItem(IDB_FLAG, "1");
    } catch {
      // ignorieren – Zustand bleibt dann nur bis zum Neuladen
    }
    void idbSet(KEY, overlay);
  }
}

function track(engine: DemoEngine) {
  engine.listener = (model, pk, row) => {
    if (!overlay) return;
    (overlay.rows[model] ??= {})[pk] = row;
    if (!dirty) {
      dirty = true;
      queueMicrotask(persist);
    }
  };
}

async function load(): Promise<DemoEngine> {
  const res = await fetch(`${BASE_PATH}/demo-data.json?v=${encodeURIComponent(DEMO_VERSION)}`);
  if (!res.ok) throw new Error(`Demo-Daten konnten nicht geladen werden (${res.status})`);
  snapshot = (await res.json()) as DemoSnapshot;
  const stored = await readOverlay();
  overlay = stored && stored.version === snapshot.version ? stored : freshOverlay(snapshot);
  const engine = new DemoEngine(snapshot.schema, shiftData(snapshot, overlay.shiftDays));
  for (const [model, rows] of Object.entries(overlay.rows)) for (const [pk, row] of Object.entries(rows)) engine.applyRaw(model, pk, row);
  await loadUploads();
  track(engine);
  return engine;
}

export function getDemoEngine() {
  enginePromise ??= load().catch((e) => {
    enginePromise = null;
    throw e;
  });
  return enginePromise;
}

// „Demo zurücksetzen“: Snapshot neu laden, Änderungen und Uploads verwerfen
export async function resetDemoData() {
  const engine = await getDemoEngine();
  if (!snapshot) return;
  overlay = freshOverlay(snapshot);
  engine.listener = undefined;
  engine.load(shiftData(snapshot, overlay.shiftDays));
  track(engine);
  persist();
  await clearUploads();
}

export const demoDb = createDemoClient(getDemoEngine, { $demoReset: resetDemoData }) as unknown as PrismaClient;
