// Kleiner Key-Value-Speicher auf IndexedDB (Uploads, großer Demo-Zustand). Fällt still auf „nichts gespeichert“ zurück.
const DB_NAME = "cc-demo";
const STORE = "kv";
let opening: Promise<IDBDatabase | null> | null = null;

function open() {
  opening ??= new Promise((resolve) => {
    try {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => req.result.createObjectStore(STORE);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
  return opening;
}

async function run<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T | undefined> {
  const db = await open();
  if (!db) return undefined;
  return new Promise((resolve) => {
    try {
      const req = fn(db.transaction(STORE, mode).objectStore(STORE));
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(undefined);
    } catch {
      resolve(undefined);
    }
  });
}

export const idbGet = <T,>(key: string) => run<T>("readonly", (s) => s.get(key) as IDBRequest<T>);
export const idbSet = (key: string, value: unknown) => run("readwrite", (s) => s.put(value, key));
export const idbDelete = (key: string) => run("readwrite", (s) => s.delete(key));
export const idbKeys = () => run<IDBValidKey[]>("readonly", (s) => s.getAllKeys());
