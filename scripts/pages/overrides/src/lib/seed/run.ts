// Pages-Build: „Demo zurücksetzen“ lädt den beim Build erzeugten Snapshot neu (IDs bleiben gleich).
import { resetDemoData } from "@/lib/demo/db";

export async function runSeed(db?: unknown) {
  void db;
  await resetDemoData();
  return { reset: "snapshot" };
}
