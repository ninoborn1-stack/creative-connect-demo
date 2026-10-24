// Selbsttest der Browser-DB: runSeed gegen die In-Memory-Engine ausführen und Zeilenzahlen mit dem
// SQLite-Snapshot vergleichen. Aufruf: pnpm tsx scripts/pages/selftest.ts <snapshot.json>
import { readFileSync } from "node:fs";
import type { PrismaClient } from "@prisma/client";
import { runSeed } from "../../src/lib/seed/run";
import { DemoEngine, createDemoClient, type DemoSnapshot } from "../../src/lib/demo/engine";

async function main() {
  const snap = JSON.parse(readFileSync(process.argv[2], "utf8")) as DemoSnapshot;
  const engine = new DemoEngine(snap.schema);
  const db = createDemoClient(() => engine) as unknown as PrismaClient;
  const t = Date.now();
  await runSeed(db);
  console.log(`runSeed gegen Demo-Engine: ${Date.now() - t} ms`);
  const dump = engine.dump();
  let bad = 0;
  for (const [model, rows] of Object.entries(snap.data)) {
    if (dump[model].length !== rows.length) {
      bad++;
      console.log(`✗ ${model}: Engine ${dump[model].length}, SQLite ${rows.length}`);
    }
  }

  // Abfragen auf dem echten Snapshot
  const e2 = new DemoEngine(snap.schema, snap.data);
  const db2 = createDemoClient(() => e2) as unknown as PrismaClient;
  const groups = await db2.project.groupBy({ by: ["status"], _count: { _all: true } });
  const agg = await db2.review.aggregate({ _avg: { rating: true }, _count: true });
  const withCount = await db2.event.findMany({ include: { _count: { select: { rsvps: true } } }, orderBy: { date: "asc" }, take: 2 });
  const some = await db2.user.count({ where: { OR: [{ invitesSent: { some: {} } }, { invitees: { some: {} } }] } });
  const nested = await db2.project.findFirst({ include: { roles: { orderBy: { sort: "asc" }, include: { assignee: { include: { profile: true } } } } } });
  console.log({ groups, agg, events: withCount.map((e) => [e.title, e._count.rsvps]), inviters: some, roles: nested?.roles.length });
  if (bad) process.exit(1);
  console.log("Selbsttest ok");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
