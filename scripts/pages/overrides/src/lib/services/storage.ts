// Pages-Build: Uploads landen als Blob in IndexedDB dieses Browsers (statt public/uploads).
import { storeUpload } from "@/lib/demo/uploads";

export async function storeFile(file: File) {
  const safe = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
  await storeUpload(safe, file);
  return { url: `/uploads/${safe}`, sizeKb: Math.max(1, Math.round(file.size / 1024)) };
}
