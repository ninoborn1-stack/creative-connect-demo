// Uploads der Browser-Demo: Datei als Blob in IndexedDB, angezeigt über Object-URLs (Pfad bleibt /uploads/<name>).
import { idbDelete, idbGet, idbKeys, idbSet } from "./idb";

const PREFIX = "upload:";
const urls = new Map<string, string>();

export async function storeUpload(name: string, file: Blob) {
  await idbSet(PREFIX + name, file);
  urls.set(`/uploads/${name}`, URL.createObjectURL(file));
}

export async function loadUploads() {
  for (const key of (await idbKeys()) ?? []) {
    if (typeof key !== "string" || !key.startsWith(PREFIX)) continue;
    const blob = await idbGet<Blob>(key);
    if (blob) urls.set(`/uploads/${key.slice(PREFIX.length)}`, URL.createObjectURL(blob));
  }
}

export async function clearUploads() {
  for (const key of (await idbKeys()) ?? []) if (typeof key === "string" && key.startsWith(PREFIX)) await idbDelete(key);
  urls.forEach((u) => URL.revokeObjectURL(u));
  urls.clear();
}

export function uploadUrl(path: string) {
  return urls.get(path.split(/[?#]/)[0]);
}
