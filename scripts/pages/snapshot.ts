// Erzeugt den Daten-Snapshot für die Browser-Demo (GitHub Pages):
// frische SQLite-DB anlegen → runSeed → alle Tabellen + Schema-Metadaten (Prisma DMMF) als JSON.
// Aufruf: pnpm tsx scripts/pages/snapshot.ts <ausgabe.json>
import { execSync } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { Prisma, PrismaClient } from "@prisma/client";
import { runSeed } from "../../src/lib/seed/run";
import type { DemoSchema, DemoSnapshot } from "../../src/lib/demo/engine";

export function schemaFromDmmf(): DemoSchema {
  const models: DemoSchema["models"] = {};
  for (const m of Prisma.dmmf.datamodel.models) {
    const idField = m.fields.find((f) => f.isId);
    models[m.name] = {
      name: m.name,
      primaryKey: idField ? [idField.name] : [...(m.primaryKey?.fields ?? [])],
      uniques: [
        ...m.fields.filter((f) => f.isUnique).map((f) => [f.name]),
        ...m.uniqueFields.map((u) => [...u]),
      ],
      fields: m.fields.map((f) => ({
        name: f.name,
        kind: f.kind,
        type: f.type,
        isList: f.isList,
        isRequired: f.isRequired,
        isId: f.isId,
        isUpdatedAt: Boolean(f.isUpdatedAt),
        default: f.hasDefaultValue ? (f.default as DemoSchema["models"][string]["fields"][number]["default"]) : undefined,
        relationName: f.relationName ?? undefined,
        relationFromFields: f.relationFromFields ? [...f.relationFromFields] : undefined,
        relationToFields: f.relationToFields ? [...f.relationToFields] : undefined,
        relationOnDelete: f.relationOnDelete ?? undefined,
      })),
    };
  }
  return { models };
}

async function main() {
  const out = process.argv[2];
  if (!out) throw new Error("Aufruf: snapshot.ts <ausgabe.json>");
  const root = process.cwd();
  const tmp = path.join(root, ".pages-build-tmp");
  rmSync(tmp, { recursive: true, force: true });
  mkdirSync(tmp, { recursive: true });
  const url = `file:${path.join(tmp, "snapshot.db")}`;
  execSync("pnpm prisma db push --skip-generate --accept-data-loss", { stdio: "inherit", env: { ...process.env, DATABASE_URL: url } });

  const db = new PrismaClient({ datasourceUrl: url });
  try {
    await runSeed(db);
    const schema = schemaFromDmmf();
    const data: DemoSnapshot["data"] = {};
    for (const name of Object.keys(schema.models)) {
      const delegate = (db as unknown as Record<string, { findMany: (a?: object) => Promise<Record<string, unknown>[]> }>)[
        name[0].toLowerCase() + name.slice(1)
      ];
      const pk = schema.models[name].primaryKey;
      // Einfügereihenfolge (rowid) beibehalten – so verhält sich findMany ohne orderBy wie SQLite
      const rows = await delegate.findMany();
      data[name] = rows.map((r) => {
        const o: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(r)) o[k] = v instanceof Date ? v.toISOString() : v;
        return o;
      });
      if (!pk.length) throw new Error(`Modell ${name} ohne Primärschlüssel wird nicht unterstützt`);
    }
    const snapshot: DemoSnapshot = { version: `${Date.now().toString(36)}`, createdAt: new Date().toISOString(), schema, data };
    writeFileSync(out, JSON.stringify(snapshot));
    const counts = Object.entries(data).map(([k, v]) => `${k}=${v.length}`).join(" ");
    console.log(`Snapshot geschrieben: ${out} (${Math.round(JSON.stringify(snapshot).length / 1024)} KB)\n${counts}`);
  } finally {
    await db.$disconnect();
    rmSync(tmp, { recursive: true, force: true });
  }
}

if (process.argv[1] && /snapshot\.ts$/.test(process.argv[1])) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
