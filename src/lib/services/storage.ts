// Mock-Speicher: legt Dateien lokal in public/uploads ab. Später durch S3-kompatiblen EU-Speicher ersetzen.
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

export async function storeFile(file: File) {
  const dir = path.join(process.cwd(), "public", "uploads");
  await mkdir(dir, { recursive: true });
  const safe = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
  await writeFile(path.join(dir, safe), Buffer.from(await file.arrayBuffer()));
  return { url: `/uploads/${safe}`, sizeKb: Math.max(1, Math.round(file.size / 1024)) };
}
