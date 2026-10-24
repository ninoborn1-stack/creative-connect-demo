/* eslint-disable @typescript-eslint/no-explicit-any -- dynamische Prisma-Nachbildung, Typen kommen vom PrismaClient-Cast */
// In-Memory-Nachbildung der Prisma-Client-API für die statische Browser-Demo (GitHub Pages).
// Läuft ohne Browser-APIs (auch in Node, für Selbsttests). Abgedeckt ist genau der Teil der API,
// den die App nutzt – siehe docs/pages-demo.md.

export type DemoFieldDefault = string | number | boolean | null | { name: string; args: unknown[] };
export type DemoField = {
  name: string;
  kind: string; // scalar | object | enum
  type: string;
  isList: boolean;
  isRequired: boolean;
  isId: boolean;
  isUpdatedAt: boolean;
  default?: DemoFieldDefault;
  relationName?: string;
  relationFromFields?: string[];
  relationToFields?: string[];
  relationOnDelete?: string;
};
export type DemoModel = { name: string; primaryKey: string[]; uniques: string[][]; fields: DemoField[] };
export type DemoSchema = { models: Record<string, DemoModel> };
export type DemoSnapshot = { version: string; createdAt: string; schema: DemoSchema; data: Record<string, Record<string, unknown>[]> };

type Row = Record<string, any>;
type Args = Record<string, any>;
type Rel = { field: DemoField; target: string; isList: boolean; owning: boolean; localFields: string[]; targetFields: string[] };
export type ChangeListener = (model: string, pk: string, row: Row | null) => void;

export class DemoPrismaError extends Error {
  code: string;
  meta?: Record<string, unknown>;
  clientVersion = "demo";
  constructor(message: string, code: string, meta?: Record<string, unknown>) {
    super(message);
    this.name = "PrismaClientKnownRequestError";
    this.code = code;
    this.meta = meta;
  }
}

const isPlainObject = (v: unknown): v is Args =>
  typeof v === "object" && v !== null && !Array.isArray(v) && !(v instanceof Date) && !(typeof Blob !== "undefined" && v instanceof Blob);
const toArray = <T,>(v: T | T[] | undefined | null): T[] => (v == null ? [] : Array.isArray(v) ? v : [v]);
const lowerAscii = (s: string) => s.replace(/[A-Z]/g, (c) => c.toLowerCase());

let cuidCounter = Math.floor(Math.random() * 1679616);
export function cuid() {
  cuidCounter = (cuidCounter + 1) % 1679616;
  const rnd = () => Math.floor(Math.random() * 2176782336).toString(36).padStart(6, "0");
  return ("c" + Date.now().toString(36) + cuidCounter.toString(36).padStart(4, "0") + rnd() + rnd()).slice(0, 25);
}

// Thenable wie PrismaPromise: wird erst bei await/then ausgeführt (wichtig für $transaction([...]))
export class LazyQuery<T> implements PromiseLike<T> {
  private promise?: Promise<T>;
  readonly [Symbol.toStringTag] = "PrismaPromise";
  constructor(private readonly run: () => T | Promise<T>) {}
  exec(): Promise<T> {
    return (this.promise ??= Promise.resolve().then(this.run));
  }
  then<A = T, B = never>(ok?: ((v: T) => A | PromiseLike<A>) | null, fail?: ((e: unknown) => B | PromiseLike<B>) | null) {
    return this.exec().then(ok, fail);
  }
  catch<B = never>(fail?: ((e: unknown) => B | PromiseLike<B>) | null) {
    return this.exec().catch(fail);
  }
  finally(fn?: (() => void) | null) {
    return this.exec().finally(fn);
  }
}

export class DemoEngine {
  readonly schema: DemoSchema;
  private tables: Record<string, Row[]> = {};
  private pk: Record<string, Map<string, Row>> = {};
  private versions: Record<string, number> = {};
  private indexes = new Map<string, { version: number; map: Map<string, Row[]> }>();
  private fieldMaps: Record<string, Record<string, DemoField>> = {};
  private rels = new Map<string, Rel>();
  private incoming: Record<string, Rel[]> = {};
  private delegates: Record<string, string> = {};
  private txDepth = 0;
  private pending: [string, string, Row | null][] = [];
  listener?: ChangeListener;

  constructor(schema: DemoSchema, data?: Record<string, Row[]>) {
    this.schema = schema;
    for (const m of Object.values(schema.models)) {
      this.fieldMaps[m.name] = Object.fromEntries(m.fields.map((f) => [f.name, f]));
      this.delegates[m.name[0].toLowerCase() + m.name.slice(1)] = m.name;
      this.incoming[m.name] ??= [];
    }
    for (const m of Object.values(schema.models)) {
      for (const f of m.fields) {
        if (f.kind !== "object") continue;
        const rel = this.rel(m.name, f.name);
        if (rel.owning) (this.incoming[rel.target] ??= []).push({ ...rel, target: m.name });
      }
    }
    this.load(data ?? {});
  }

  modelForDelegate(name: string) {
    return this.delegates[name];
  }

  // ------------------------------------------------------------------ Laden / Export

  load(data: Record<string, Row[]>) {
    for (const name of Object.keys(this.schema.models)) {
      this.tables[name] = (data[name] ?? []).map((r) => this.deserialize(name, r));
      this.rebuildPk(name);
    }
  }

  deserialize(model: string, raw: Row): Row {
    const row: Row = {};
    for (const f of this.schema.models[model].fields) {
      if (f.kind === "object") continue;
      const v = raw[f.name];
      row[f.name] = v === undefined ? null : f.type === "DateTime" && v !== null ? new Date(v) : v;
    }
    return row;
  }

  serialize(row: Row): Row {
    const o: Row = {};
    for (const [k, v] of Object.entries(row)) o[k] = v instanceof Date ? v.toISOString() : v;
    return o;
  }

  dump(): Record<string, Row[]> {
    return Object.fromEntries(Object.entries(this.tables).map(([k, rows]) => [k, rows.map((r) => this.serialize(r))]));
  }

  pkOf(model: string, row: Row) {
    return this.schema.models[model].primaryKey.map((k) => String(row[k])).join("|");
  }

  // Overlay anwenden (Änderungen aus localStorage): Datensatz ersetzen/einfügen oder löschen
  applyRaw(model: string, pk: string, raw: Row | null) {
    if (!this.tables[model]) return;
    const existing = this.pk[model].get(pk);
    if (raw === null) {
      if (existing) this.tables[model] = this.tables[model].filter((r) => r !== existing);
    } else {
      const row = this.deserialize(model, raw);
      if (existing) Object.assign(existing, row);
      else this.tables[model].push(row);
    }
    this.rebuildPk(model);
  }

  private rebuildPk(model: string) {
    const map = new Map<string, Row>();
    for (const r of this.tables[model]) map.set(this.pkOf(model, r), r);
    this.pk[model] = map;
    this.bump(model);
  }

  private bump(model: string) {
    this.versions[model] = (this.versions[model] ?? 0) + 1;
  }

  private emit(model: string, row: Row, deleted = false) {
    this.emitRaw(model, this.pkOf(model, row), deleted ? null : this.serialize(row));
  }

  private emitRaw(model: string, pk: string, row: Row | null) {
    if (this.txDepth > 0) this.pending.push([model, pk, row]);
    else this.listener?.(model, pk, row);
  }

  // ------------------------------------------------------------------ Metadaten

  private field(model: string, name: string) {
    return this.fieldMaps[model]?.[name];
  }

  private rel(model: string, name: string): Rel {
    const key = `${model}.${name}`;
    const cached = this.rels.get(key);
    if (cached) return cached;
    const f = this.field(model, name);
    if (!f || f.kind !== "object") throw new Error(`Demo-DB: ${key} ist keine Relation`);
    let rel: Rel;
    if (f.relationFromFields?.length) {
      rel = { field: f, target: f.type, isList: f.isList, owning: true, localFields: f.relationFromFields, targetFields: f.relationToFields ?? [] };
    } else {
      const other = this.schema.models[f.type].fields.find(
        (g) => g.kind === "object" && g.relationName === f.relationName && (f.type !== model || g.name !== f.name) && g.relationFromFields?.length,
      );
      if (!other) throw new Error(`Demo-DB: Gegenseite zu ${key} nicht gefunden (implizite m:n-Relationen werden nicht unterstützt)`);
      rel = { field: f, target: f.type, isList: f.isList, owning: false, localFields: other.relationToFields ?? [], targetFields: other.relationFromFields ?? [] };
    }
    this.rels.set(key, rel);
    return rel;
  }

  private keyOf(values: unknown[]) {
    return values.map((v) => (v instanceof Date ? `d${v.getTime()}` : `${typeof v}:${String(v)}`)).join("|");
  }

  private index(model: string, fields: string[]) {
    const key = `${model}:${fields.join(",")}`;
    const version = this.versions[model] ?? 0;
    const hit = this.indexes.get(key);
    if (hit && hit.version === version) return hit.map;
    const map = new Map<string, Row[]>();
    for (const r of this.tables[model]) {
      const k = this.keyOf(fields.map((f) => r[f]));
      const list = map.get(k);
      if (list) list.push(r);
      else map.set(k, [r]);
    }
    this.indexes.set(key, { version, map });
    return map;
  }

  private related(model: string, row: Row, rel: Rel): Row[] {
    const vals = rel.localFields.map((f) => row[f]);
    if (vals.some((v) => v == null)) return [];
    return this.index(rel.target, rel.targetFields).get(this.keyOf(vals)) ?? [];
  }

  // ------------------------------------------------------------------ Filter

  private norm(f: DemoField | undefined, v: unknown) {
    if (v instanceof Date) return v.getTime();
    if (f?.type === "DateTime" && typeof v === "string") return Date.parse(v);
    return v;
  }

  private eq(f: DemoField | undefined, a: unknown, b: unknown) {
    if (a == null || b == null) return a == null && b == null;
    return this.norm(f, a) === this.norm(f, b);
  }

  private cmp(f: DemoField | undefined, a: unknown, b: unknown) {
    const x = this.norm(f, a) as any;
    const y = this.norm(f, b) as any;
    return x < y ? -1 : x > y ? 1 : 0;
  }

  match(model: string, row: Row, where: Args | undefined): boolean {
    if (!where) return true;
    for (const [key, cond] of Object.entries(where)) {
      if (cond === undefined) continue;
      if (key === "AND") {
        if (!toArray(cond).every((w) => this.match(model, row, w))) return false;
        continue;
      }
      if (key === "OR") {
        if (!toArray(cond).some((w) => this.match(model, row, w))) return false;
        continue;
      }
      if (key === "NOT") {
        if (toArray(cond).some((w) => this.match(model, row, w))) return false;
        continue;
      }
      const f = this.field(model, key);
      if (!f) {
        const compound = [this.schema.models[model].primaryKey, ...this.schema.models[model].uniques].find((u) => u.join("_") === key);
        if (!compound || !isPlainObject(cond)) throw new Error(`Demo-DB: unbekanntes Feld ${model}.${key}`);
        if (!compound.every((part) => this.eq(this.field(model, part), row[part], cond[part]))) return false;
        continue;
      }
      if (f.kind === "object") {
        if (!this.matchRelation(model, row, this.rel(model, key), cond)) return false;
        continue;
      }
      if (!this.matchScalar(f, row[key], cond)) return false;
    }
    return true;
  }

  private matchScalar(f: DemoField, value: unknown, cond: unknown): boolean {
    if (cond === null) return value == null;
    if (!isPlainObject(cond)) return this.eq(f, value, cond);
    const insensitive = cond.mode === "insensitive";
    const s = (v: unknown) => (insensitive ? String(v).toLowerCase() : lowerAscii(String(v)));
    for (const [op, arg] of Object.entries(cond)) {
      if (arg === undefined || op === "mode") continue;
      switch (op) {
        case "equals":
          if (!this.eq(f, value, arg)) return false;
          break;
        case "not":
          if (arg === null) {
            if (value == null) return false;
          } else if (value == null) return false;
          else if (isPlainObject(arg) ? this.matchScalar(f, value, arg) : this.eq(f, value, arg)) return false;
          break;
        case "in":
          if (value == null || !toArray(arg).some((a) => this.eq(f, value, a))) return false;
          break;
        case "notIn":
          if (value == null || toArray(arg).some((a) => this.eq(f, value, a))) return false;
          break;
        case "lt":
          if (value == null || arg == null || this.cmp(f, value, arg) >= 0) return false;
          break;
        case "lte":
          if (value == null || arg == null || this.cmp(f, value, arg) > 0) return false;
          break;
        case "gt":
          if (value == null || arg == null || this.cmp(f, value, arg) <= 0) return false;
          break;
        case "gte":
          if (value == null || arg == null || this.cmp(f, value, arg) < 0) return false;
          break;
        case "contains":
          if (typeof value !== "string" || !s(value).includes(s(arg))) return false;
          break;
        case "startsWith":
          if (typeof value !== "string" || !s(value).startsWith(s(arg))) return false;
          break;
        case "endsWith":
          if (typeof value !== "string" || !s(value).endsWith(s(arg))) return false;
          break;
        default:
          throw new Error(`Demo-DB: Filter "${op}" wird nicht unterstützt (${f.name})`);
      }
    }
    return true;
  }

  private matchRelation(model: string, row: Row, rel: Rel, cond: any): boolean {
    const rows = this.related(model, row, rel);
    if (rel.isList) {
      if (!isPlainObject(cond)) throw new Error(`Demo-DB: Listen-Relation ${rel.field.name} braucht some/none/every`);
      if (cond.some !== undefined && !rows.some((r) => this.match(rel.target, r, cond.some))) return false;
      if (cond.none !== undefined && rows.some((r) => this.match(rel.target, r, cond.none))) return false;
      if (cond.every !== undefined && !rows.every((r) => this.match(rel.target, r, cond.every))) return false;
      return true;
    }
    const one = rows[0] ?? null;
    if (cond === null) return one === null;
    if (isPlainObject(cond) && ("is" in cond || "isNot" in cond)) {
      if (cond.is !== undefined) {
        if (cond.is === null ? one !== null : !one || !this.match(rel.target, one, cond.is)) return false;
      }
      if (cond.isNot !== undefined) {
        if (cond.isNot === null ? one === null : one && this.match(rel.target, one, cond.isNot)) return false;
      }
      return true;
    }
    return one !== null && this.match(rel.target, one, cond);
  }

  // ------------------------------------------------------------------ Sortierung & Paging

  private sortValue(model: string, row: Row, key: string, spec: any): { value: unknown; dir: string; nulls?: string; f?: DemoField } {
    const f = this.field(model, key);
    if (!f) throw new Error(`Demo-DB: orderBy auf unbekanntes Feld ${model}.${key}`);
    if (f.kind !== "object") {
      if (isPlainObject(spec)) return { value: row[key], dir: spec.sort, nulls: spec.nulls, f };
      return { value: row[key], dir: spec, f };
    }
    const rel = this.rel(model, key);
    const rows = this.related(model, row, rel);
    if (rel.isList) {
      if (!isPlainObject(spec) || !spec._count) throw new Error(`Demo-DB: orderBy auf Liste ${key} nur mit _count`);
      return { value: rows.length, dir: spec._count };
    }
    const [[k2, s2]] = Object.entries(spec as Args);
    if (!rows[0]) return { value: null, dir: isPlainObject(s2) ? s2.sort : (s2 as string) };
    return this.sortValue(rel.target, rows[0], k2, s2);
  }

  private sort(model: string, rows: Row[], orderBy: any): Row[] {
    const specs = toArray(orderBy).flatMap((o: Args) => Object.entries(o).filter(([, v]) => v !== undefined));
    if (!specs.length) return rows;
    const decorated = rows.map((r) => ({ r, keys: specs.map(([k, v]) => this.sortValue(model, r, k, v)) }));
    decorated.sort((a, b) => {
      for (let i = 0; i < specs.length; i++) {
        const x = a.keys[i];
        const y = b.keys[i];
        const desc = x.dir === "desc";
        if (x.value == null || y.value == null) {
          if (x.value == null && y.value == null) continue;
          const nullsFirst = x.nulls ? x.nulls === "first" : !desc; // SQLite: NULL ist der kleinste Wert
          return (x.value == null ? -1 : 1) * (nullsFirst ? 1 : -1);
        }
        const c = this.cmp(x.f, x.value, y.value);
        if (c) return desc ? -c : c;
      }
      return 0;
    });
    return decorated.map((d) => d.r);
  }

  private page(model: string, rows: Row[], args: Args): Row[] {
    let out = this.sort(model, rows, args.orderBy);
    if (args.cursor) {
      const i = out.findIndex((r) => this.match(model, r, args.cursor));
      out = i < 0 ? [] : out.slice(i);
    }
    if (args.distinct) {
      const fields = toArray(args.distinct) as string[];
      const seen = new Set<string>();
      out = out.filter((r) => {
        const k = this.keyOf(fields.map((f) => r[f]));
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      });
    }
    const skip = args.skip ?? 0;
    if (typeof args.take === "number" && args.take < 0) {
      const end = out.length - skip;
      return out.slice(Math.max(0, end + args.take), end);
    }
    out = skip ? out.slice(skip) : out;
    return typeof args.take === "number" ? out.slice(0, args.take) : out;
  }

  // ------------------------------------------------------------------ Ausgabe (select/include)

  private clone(v: unknown) {
    return v instanceof Date ? new Date(v.getTime()) : v;
  }

  private shape(model: string, row: Row, args?: Args | null): Row {
    const out: Row = {};
    const select = args?.select;
    if (select) {
      for (const [k, v] of Object.entries(select as Args)) {
        if (!v) continue;
        if (k === "_count") out._count = this.countRelations(model, row, v);
        else if (this.field(model, k)?.kind === "object") out[k] = this.relationValue(model, row, k, v === true ? {} : v);
        else if (this.field(model, k)) out[k] = this.clone(row[k]);
        else throw new Error(`Demo-DB: select auf unbekanntes Feld ${model}.${k}`);
      }
      return out;
    }
    for (const f of this.schema.models[model].fields) if (f.kind !== "object") out[f.name] = this.clone(row[f.name]);
    for (const [k, v] of Object.entries((args?.include ?? {}) as Args)) {
      if (!v) continue;
      if (k === "_count") out._count = this.countRelations(model, row, v);
      else out[k] = this.relationValue(model, row, k, v === true ? {} : v);
    }
    return out;
  }

  private relationValue(model: string, row: Row, key: string, args: Args) {
    const rel = this.rel(model, key);
    const rows = this.related(model, row, rel);
    if (!rel.isList) return rows[0] ? this.shape(rel.target, rows[0], args) : null;
    const filtered = args.where ? rows.filter((r) => this.match(rel.target, r, args.where)) : rows;
    return this.page(rel.target, filtered, args).map((r) => this.shape(rel.target, r, args));
  }

  private countRelations(model: string, row: Row, spec: any) {
    const out: Row = {};
    const select: Args =
      spec === true
        ? Object.fromEntries(this.schema.models[model].fields.filter((f) => f.kind === "object" && f.isList).map((f) => [f.name, true]))
        : (spec.select ?? {});
    for (const [k, v] of Object.entries(select)) {
      if (!v) continue;
      const rel = this.rel(model, k);
      const rows = this.related(model, row, rel);
      out[k] = isPlainObject(v) && v.where ? rows.filter((r) => this.match(rel.target, r, v.where)).length : rows.length;
    }
    return out;
  }

  // ------------------------------------------------------------------ Lesen

  private filter(model: string, where?: Args) {
    const table = this.tables[model];
    if (!table) throw new Error(`Demo-DB: unbekanntes Modell ${model}`);
    // Schnellpfad über den Primärschlüssel
    const pkFields = this.schema.models[model].primaryKey;
    if (where && pkFields.length === 1 && typeof where[pkFields[0]] === "string") {
      const hit = this.pk[model].get(where[pkFields[0]]);
      return hit && this.match(model, hit, where) ? [hit] : [];
    }
    return where ? table.filter((r) => this.match(model, r, where)) : table.slice();
  }

  findMany(model: string, args: Args = {}) {
    return this.page(model, this.filter(model, args.where), args).map((r) => this.shape(model, r, args));
  }

  findFirst(model: string, args: Args = {}) {
    return this.findMany(model, { ...args, take: args.take ?? 1 })[0] ?? null;
  }

  findUnique(model: string, args: Args) {
    const row = this.filter(model, args.where)[0];
    return row ? this.shape(model, row, args) : null;
  }

  private notFound(model: string, op: string): never {
    throw new DemoPrismaError(`No record was found for a ${op} on ${model}.`, "P2025", { modelName: model });
  }

  count(model: string, args: Args = {}) {
    const rows = this.page(model, this.filter(model, args.where), { ...args, select: undefined });
    if (!isPlainObject(args.select)) return rows.length;
    const out: Row = {};
    for (const [k, v] of Object.entries(args.select)) {
      if (!v) continue;
      out[k] = k === "_all" ? rows.length : rows.filter((r) => r[k] != null).length;
    }
    return out;
  }

  private aggregates(model: string, rows: Row[], args: Args) {
    const out: Row = {};
    const values = (k: string) => rows.map((r) => r[k]).filter((v) => v != null);
    if (args._count) {
      if (args._count === true) out._count = rows.length;
      else {
        out._count = {};
        for (const [k, v] of Object.entries(args._count as Args)) if (v) out._count[k] = k === "_all" ? rows.length : values(k).length;
      }
    }
    for (const op of ["_sum", "_avg", "_min", "_max"] as const) {
      if (!args[op]) continue;
      out[op] = {};
      for (const [k, v] of Object.entries(args[op] as Args)) {
        if (!v) continue;
        const vals = values(k);
        const f = this.field(model, k);
        if (!vals.length) out[op][k] = null;
        else if (op === "_sum") out[op][k] = vals.reduce((s: number, x: number) => s + x, 0);
        else if (op === "_avg") out[op][k] = vals.reduce((s: number, x: number) => s + x, 0) / vals.length;
        else {
          const sorted = [...vals].sort((a, b) => this.cmp(f, a, b));
          out[op][k] = this.clone(op === "_min" ? sorted[0] : sorted[sorted.length - 1]);
        }
      }
    }
    return out;
  }

  aggregate(model: string, args: Args = {}) {
    return this.aggregates(model, this.page(model, this.filter(model, args.where), args), args);
  }

  groupBy(model: string, args: Args) {
    const by = toArray(args.by) as string[];
    const groups = new Map<string, Row[]>();
    for (const r of this.filter(model, args.where)) {
      const k = this.keyOf(by.map((f) => r[f]));
      const list = groups.get(k);
      if (list) list.push(r);
      else groups.set(k, [r]);
    }
    let result = [...groups.values()].map((rows) => {
      const o: Row = {};
      for (const f of by) o[f] = this.clone(rows[0][f]);
      return Object.assign(o, this.aggregates(model, rows, args));
    });
    if (args.having) {
      result = result.filter((g) =>
        Object.entries(args.having as Args).every(([k, cond]) => {
          if (by.includes(k)) return this.matchScalar(this.field(model, k)!, g[k], cond);
          return Object.entries(cond as Args).every(([field, c]) => {
            const agg = (this.aggregates(model, groups.get(this.keyOf(by.map((f) => g[f])))!, { [k]: { [field]: true } }) as Row)[k];
            return this.matchScalar({ name: field, type: "Float" } as DemoField, typeof agg === "object" && agg ? agg[field] : agg, c);
          });
        }),
      );
    }
    const specs = toArray(args.orderBy).flatMap((o: Args) => Object.entries(o));
    const order = specs.length ? specs : by.map((f) => [f, "asc"] as [string, any]);
    result.sort((a, b) => {
      for (const [k, spec] of order) {
        let x: unknown, y: unknown, dir: string;
        if (k.startsWith("_")) {
          const [[field, d]] = Object.entries(spec as Args);
          x = a[k]?.[field] ?? a[k];
          y = b[k]?.[field] ?? b[k];
          dir = d as string;
        } else {
          x = a[k];
          y = b[k];
          dir = isPlainObject(spec) ? spec.sort : spec;
        }
        if (x == null && y == null) continue;
        if (x == null) return dir === "desc" ? 1 : -1;
        if (y == null) return dir === "desc" ? -1 : 1;
        const c = this.cmp(this.field(model, k), x, y);
        if (c) return dir === "desc" ? -c : c;
      }
      return 0;
    });
    const skip = args.skip ?? 0;
    return result.slice(skip, typeof args.take === "number" ? skip + args.take : undefined);
  }

  // ------------------------------------------------------------------ Schreiben

  private coerce(f: DemoField, v: unknown) {
    if (v == null) return null;
    if (f.type === "DateTime") return new Date(v as string | number | Date);
    return v;
  }

  private defaultValue(model: string, f: DemoField) {
    if (f.isUpdatedAt) return new Date();
    const d = f.default;
    if (d === undefined) return null;
    if (isPlainObject(d)) {
      switch (d.name) {
        case "cuid":
        case "cuid2":
        case "nanoid":
          return cuid();
        case "uuid":
          return globalThis.crypto?.randomUUID?.() ?? cuid();
        case "now":
          return new Date();
        case "autoincrement":
          return this.tables[model].reduce((m, r) => Math.max(m, Number(r[f.name]) || 0), 0) + 1;
        default:
          return null;
      }
    }
    return f.type === "DateTime" && d !== null ? new Date(d as string) : d;
  }

  private checkUnique(model: string, row: Row, self: Row | null) {
    const m = this.schema.models[model];
    for (const fields of [m.primaryKey, ...m.uniques]) {
      if (!fields.length || fields.some((f) => row[f] == null)) continue;
      const k = this.keyOf(fields.map((f) => row[f]));
      const clash = (this.index(model, fields).get(k) ?? []).some((r) => r !== self);
      if (clash) throw new DemoPrismaError(`Unique constraint failed on the fields: (${fields.join(", ")})`, "P2002", { target: fields, modelName: model });
    }
  }

  private findRow(model: string, where: Args) {
    return this.filter(model, where)[0] ?? null;
  }

  private link(rel: Rel, owner: Row, target: Row) {
    // owning: owner hält den Fremdschlüssel
    rel.localFields.forEach((lf, i) => (owner[lf] = target[rel.targetFields[i]]));
  }

  insert(model: string, data: Args): Row {
    const m = this.schema.models[model];
    if (!m) throw new Error(`Demo-DB: unbekanntes Modell ${model}`);
    const row: Row = {};
    const later: [Rel, Args][] = [];
    for (const [k, v] of Object.entries(data ?? {})) {
      if (v === undefined) continue;
      const f = this.field(model, k);
      if (!f) throw new Error(`Demo-DB: unbekanntes Feld ${model}.${k}`);
      if (f.kind !== "object") {
        row[k] = this.coerce(f, v);
        continue;
      }
      const rel = this.rel(model, k);
      if (!rel.owning) {
        later.push([rel, v]);
        continue;
      }
      let target: Row | null = null;
      if (v.connect) target = this.findRow(rel.target, v.connect) ?? this.notFound(rel.target, "connect");
      else if (v.connectOrCreate) target = this.findRow(rel.target, v.connectOrCreate.where) ?? this.insert(rel.target, v.connectOrCreate.create);
      else if (v.create) target = this.insert(rel.target, v.create);
      if (target) this.link(rel, row, target);
    }
    for (const f of m.fields) {
      if (f.kind === "object" || f.name in row) continue;
      row[f.name] = this.defaultValue(model, f);
    }
    for (const f of m.fields) {
      if (f.kind !== "object" && f.isRequired && row[f.name] == null) {
        throw new Error(`Demo-DB: Pflichtfeld ${model}.${f.name} fehlt`);
      }
    }
    this.checkUnique(model, row, null);
    this.tables[model].push(row);
    this.pk[model].set(this.pkOf(model, row), row);
    this.bump(model);
    this.emit(model, row);
    for (const [rel, ops] of later) this.nestedBack(model, row, rel, ops);
    return row;
  }

  private childData(rel: Rel, parent: Row, data: Args) {
    const fk: Args = {};
    rel.targetFields.forEach((tf, i) => (fk[tf] = parent[rel.localFields[i]]));
    return { ...data, ...fk };
  }

  private setFk(model: string, rel: Rel, child: Row, parent: Row | null) {
    const next: Args = {};
    rel.targetFields.forEach((tf, i) => (next[tf] = parent ? parent[rel.localFields[i]] : null));
    this.applyUpdate(rel.target, child, next);
    void model;
  }

  // verschachtelte Schreiboperationen auf der Gegenseite (Kind hält den Fremdschlüssel)
  private nestedBack(model: string, parent: Row, rel: Rel, ops: Args) {
    const children = () => this.related(model, parent, rel);
    for (const [op, arg] of Object.entries(ops)) {
      if (arg === undefined) continue;
      switch (op) {
        case "create":
          for (const d of toArray(arg)) this.insert(rel.target, this.childData(rel, parent, d));
          break;
        case "createMany":
          for (const d of toArray(arg.data)) this.insert(rel.target, this.childData(rel, parent, d));
          break;
        case "connect":
          for (const w of toArray(arg)) this.setFk(model, rel, this.findRow(rel.target, w) ?? this.notFound(rel.target, "connect"), parent);
          break;
        case "connectOrCreate":
          for (const c of toArray(arg)) {
            const hit = this.findRow(rel.target, c.where);
            if (hit) this.setFk(model, rel, hit, parent);
            else this.insert(rel.target, this.childData(rel, parent, c.create));
          }
          break;
        case "disconnect":
          if (arg === true) children().forEach((c) => this.setFk(model, rel, c, null));
          else for (const w of toArray(arg)) children().filter((c) => this.match(rel.target, c, w)).forEach((c) => this.setFk(model, rel, c, null));
          break;
        case "set":
          children().forEach((c) => this.setFk(model, rel, c, null));
          for (const w of toArray(arg)) this.setFk(model, rel, this.findRow(rel.target, w) ?? this.notFound(rel.target, "set"), parent);
          break;
        case "update":
          for (const u of toArray(arg)) {
            const where = rel.isList ? u.where : undefined;
            const data = rel.isList ? u.data : (u.data ?? u);
            const hit = children().find((c) => this.match(rel.target, c, where));
            if (!hit) this.notFound(rel.target, "update");
            this.applyUpdate(rel.target, hit, data);
          }
          break;
        case "updateMany":
          for (const u of toArray(arg)) children().filter((c) => this.match(rel.target, c, u.where)).forEach((c) => this.applyUpdate(rel.target, c, u.data));
          break;
        case "upsert":
          for (const u of toArray(arg)) {
            const hit = children().find((c) => this.match(rel.target, c, rel.isList ? u.where : undefined));
            if (hit) this.applyUpdate(rel.target, hit, u.update);
            else this.insert(rel.target, this.childData(rel, parent, u.create));
          }
          break;
        case "delete":
          if (arg === true) this.remove(rel.target, children());
          else for (const w of toArray(arg)) this.remove(rel.target, children().filter((c) => this.match(rel.target, c, w)));
          break;
        case "deleteMany":
          this.remove(rel.target, toArray(arg).length ? children().filter((c) => toArray(arg).some((w) => this.match(rel.target, c, w))) : children());
          break;
        default:
          throw new Error(`Demo-DB: verschachtelte Operation "${op}" wird nicht unterstützt`);
      }
    }
  }

  applyUpdate(model: string, row: Row, data: Args) {
    const next: Row = { ...row };
    const later: [Rel, Args][] = [];
    for (const [k, v] of Object.entries(data ?? {})) {
      if (v === undefined) continue;
      const f = this.field(model, k);
      if (!f) throw new Error(`Demo-DB: unbekanntes Feld ${model}.${k}`);
      if (f.kind !== "object") {
        if (isPlainObject(v)) {
          const cur = Number(next[k] ?? 0);
          if ("set" in v) next[k] = this.coerce(f, v.set);
          else if ("increment" in v) next[k] = cur + v.increment;
          else if ("decrement" in v) next[k] = cur - v.decrement;
          else if ("multiply" in v) next[k] = cur * v.multiply;
          else if ("divide" in v) next[k] = f.type === "Int" ? Math.trunc(cur / v.divide) : cur / v.divide;
          else throw new Error(`Demo-DB: unbekannte Update-Operation für ${model}.${k}`);
        } else next[k] = this.coerce(f, v);
        continue;
      }
      const rel = this.rel(model, k);
      if (!rel.owning) {
        later.push([rel, v]);
        continue;
      }
      const current = this.related(model, row, rel)[0] ?? null;
      if (v.connect) this.link(rel, next, this.findRow(rel.target, v.connect) ?? this.notFound(rel.target, "connect"));
      else if (v.disconnect) rel.localFields.forEach((lf) => (next[lf] = null));
      else if (v.create) this.link(rel, next, this.insert(rel.target, v.create));
      else if (v.connectOrCreate) this.link(rel, next, this.findRow(rel.target, v.connectOrCreate.where) ?? this.insert(rel.target, v.connectOrCreate.create));
      else if (v.upsert) {
        if (current) this.applyUpdate(rel.target, current, v.upsert.update);
        else this.link(rel, next, this.insert(rel.target, v.upsert.create));
      } else if (v.update) {
        if (!current) this.notFound(rel.target, "update");
        this.applyUpdate(rel.target, current, v.update.data ?? v.update);
      } else if (v.delete && current) {
        this.remove(rel.target, [current]);
        rel.localFields.forEach((lf) => (next[lf] = null));
      }
    }
    for (const f of this.schema.models[model].fields) if (f.isUpdatedAt && !(f.name in (data ?? {}))) next[f.name] = new Date();
    this.checkUnique(model, next, row);
    const oldPk = this.pkOf(model, row);
    Object.assign(row, next);
    const newPk = this.pkOf(model, row);
    if (oldPk !== newPk) {
      this.pk[model].delete(oldPk);
      this.pk[model].set(newPk, row);
      this.emitRaw(model, oldPk, null);
    }
    this.bump(model);
    this.emit(model, row);
    for (const [rel, ops] of later) this.nestedBack(model, row, rel, ops);
    return row;
  }

  remove(model: string, rows: Row[], seen = new Set<Row>()) {
    const todo = rows.filter((r) => !seen.has(r));
    if (!todo.length) return 0;
    todo.forEach((r) => seen.add(r));
    for (const rel of this.incoming[model] ?? []) {
      // rel.target ist hier das Kind-Modell, localFields/targetFields aus Sicht des Kindes
      const childModel = rel.target;
      const fkFields = rel.localFields;
      const refFields = rel.targetFields;
      const idx = this.index(childModel, fkFields);
      const children = todo.flatMap((r) => idx.get(this.keyOf(refFields.map((f) => r[f]))) ?? []).filter((c) => !seen.has(c));
      if (!children.length) continue;
      const required = fkFields.some((f) => this.field(childModel, f)?.isRequired);
      const action = rel.field.relationOnDelete ?? (required ? "Restrict" : "SetNull");
      if (action === "Cascade") this.remove(childModel, children, seen);
      else if (action === "SetNull") {
        for (const c of children) {
          fkFields.forEach((f) => (c[f] = null));
          this.emit(childModel, c);
        }
        this.bump(childModel);
      } else {
        throw new DemoPrismaError(`Foreign key constraint failed on the field: ${childModel}.${fkFields.join(",")}`, "P2003", { modelName: model });
      }
    }
    const kill = new Set(todo);
    this.tables[model] = this.tables[model].filter((r) => !kill.has(r));
    for (const r of todo) {
      this.pk[model].delete(this.pkOf(model, r));
      this.emit(model, r, true);
    }
    this.bump(model);
    return todo.length;
  }

  // ------------------------------------------------------------------ Operationen (Prisma-Namen)

  op(model: string, method: string, args: Args = {}): unknown {
    switch (method) {
      case "findMany":
        return this.findMany(model, args);
      case "findFirst":
        return this.findFirst(model, args);
      case "findFirstOrThrow":
        return this.findFirst(model, args) ?? this.notFound(model, "findFirstOrThrow");
      case "findUnique":
        return this.findUnique(model, args);
      case "findUniqueOrThrow":
        return this.findUnique(model, args) ?? this.notFound(model, "findUniqueOrThrow");
      case "count":
        return this.count(model, args);
      case "aggregate":
        return this.aggregate(model, args);
      case "groupBy":
        return this.groupBy(model, args);
      case "create":
        return this.atomic(() => this.shape(model, this.insert(model, args.data), args));
      case "createMany":
      case "createManyAndReturn":
        return this.atomic(() => {
          const created: Row[] = [];
          for (const d of toArray(args.data)) {
            try {
              created.push(this.insert(model, d));
            } catch (e) {
              if (!(args.skipDuplicates && e instanceof DemoPrismaError && e.code === "P2002")) throw e;
            }
          }
          return method === "createMany" ? { count: created.length } : created.map((r) => this.shape(model, r, args));
        });
      case "update":
        return this.atomic(() => {
          const row = this.findRow(model, args.where) ?? this.notFound(model, "update");
          return this.shape(model, this.applyUpdate(model, row, args.data), args);
        });
      case "updateMany":
      case "updateManyAndReturn":
        return this.atomic(() => {
          const rows = this.filter(model, args.where);
          rows.forEach((r) => this.applyUpdate(model, r, args.data));
          return method === "updateMany" ? { count: rows.length } : rows.map((r) => this.shape(model, r, args));
        });
      case "upsert":
        return this.atomic(() => {
          const row = this.findRow(model, args.where);
          return this.shape(model, row ? this.applyUpdate(model, row, args.update) : this.insert(model, args.create), args);
        });
      case "delete":
        return this.atomic(() => {
          const row = this.findRow(model, args.where) ?? this.notFound(model, "delete");
          const shaped = this.shape(model, row, args);
          this.remove(model, [row]);
          return shaped;
        });
      case "deleteMany":
        return this.atomic(() => ({ count: this.remove(model, this.filter(model, args.where)) }));
      default:
        throw new Error(`Demo-DB: ${model}.${method}() wird nicht unterstützt`);
    }
  }

  // ------------------------------------------------------------------ Transaktionen

  private snapshotState() {
    return Object.fromEntries(Object.entries(this.tables).map(([k, rows]) => [k, rows.map((r) => ({ ...r }))]));
  }

  begin() {
    const state = this.txDepth === 0 ? this.snapshotState() : null;
    this.txDepth++;
    return state;
  }

  commit() {
    this.txDepth--;
    if (this.txDepth === 0) {
      const pending = this.pending;
      this.pending = [];
      for (const e of pending) this.listener?.(...e);
    }
  }

  rollback(state: Record<string, Row[]> | null) {
    this.txDepth--;
    if (state) {
      this.tables = state;
      for (const name of Object.keys(this.tables)) this.rebuildPk(name);
      this.pending = [];
    }
  }

  // Einzeloperation mit verschachtelten Schreibzugriffen: alles oder nichts
  private atomic<T>(fn: () => T): T {
    const state = this.begin();
    try {
      const out = fn();
      this.commit();
      return out;
    } catch (e) {
      this.rollback(state);
      throw e;
    }
  }
}

// Prisma-ähnlicher Client über einer (ggf. erst asynchron geladenen) Engine
const METHODS = [
  "findMany", "findFirst", "findFirstOrThrow", "findUnique", "findUniqueOrThrow", "count", "aggregate", "groupBy", "create",
  "createMany", "createManyAndReturn", "update", "updateMany", "updateManyAndReturn", "upsert", "delete", "deleteMany",
];

export function createDemoClient(getEngine: () => DemoEngine | Promise<DemoEngine>, extra: Record<string, unknown> = {}) {
  const delegates = new Map<string, Record<string, unknown>>();
  const delegate = (name: string) => {
    let d = delegates.get(name);
    if (!d) {
      d = Object.fromEntries(
        METHODS.map((method) => [
          method,
          (args?: Args) =>
            new LazyQuery(async () => {
              const engine = await getEngine();
              const model = engine.modelForDelegate(name);
              if (!model) throw new Error(`Demo-DB: unbekanntes Modell db.${name}`);
              return engine.op(model, method, args);
            }),
        ]),
      );
      delegates.set(name, d);
    }
    return d;
  };
  const transaction = async (arg: unknown) => {
    const engine = await getEngine();
    const state = engine.begin();
    try {
      let out: unknown;
      if (Array.isArray(arg)) {
        const results: unknown[] = [];
        for (const q of arg) results.push(await (q instanceof LazyQuery ? q.exec() : q));
        out = results;
      } else if (typeof arg === "function") out = await arg(client);
      else throw new Error("Demo-DB: $transaction erwartet ein Array oder eine Funktion");
      engine.commit();
      return out;
    } catch (e) {
      engine.rollback(state);
      throw e;
    }
  };
  const base: Record<string, unknown> = {
    $transaction: transaction,
    $connect: async () => {},
    $disconnect: async () => {},
    $on: () => {},
    $use: () => {},
    $extends: () => client,
    $queryRaw: () => Promise.reject(new Error("Demo-DB: $queryRaw wird nicht unterstützt")),
    $executeRaw: () => Promise.reject(new Error("Demo-DB: $executeRaw wird nicht unterstützt")),
    ...extra,
  };
  const client: Record<string | symbol, unknown> = new Proxy(base, {
    get(target, prop) {
      if (typeof prop === "symbol" || prop in target) return target[prop as string];
      if (prop === "then" || prop === "toJSON" || prop.startsWith("$") || prop.startsWith("_")) return undefined;
      return delegate(prop);
    },
  });
  return client;
}
