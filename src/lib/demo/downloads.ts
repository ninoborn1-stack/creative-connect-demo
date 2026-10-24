// Route Handler (PDF/CSV) laufen in der Browser-Demo im Browser: GET() aufrufen, Response als Datei speichern.
import { toast } from "sonner";
import type { DemoParams, DemoRoute } from "./routes";

function filenameFrom(res: Response, url: URL) {
  const cd = res.headers.get("Content-Disposition") ?? "";
  const star = /filename\*=(?:UTF-8'')?([^;]+)/i.exec(cd)?.[1];
  const plain = /filename="?([^";]+)"?/i.exec(cd)?.[1];
  const name = star ?? plain ?? url.pathname.split("/").filter(Boolean).pop() ?? "download";
  try {
    return decodeURIComponent(name.trim());
  } catch {
    return name.trim();
  }
}

export async function runRouteHandler(route: DemoRoute, params: DemoParams, url: URL) {
  const toastId = toast.loading("Datei wird im Browser erzeugt …");
  try {
    const mod = await route.handler!();
    if (!mod.GET) throw new Error("Kein GET-Handler");
    const res = await mod.GET(new Request(url.href), { params: Promise.resolve(params) });
    if (!res.ok) {
      toast.error((await res.text()) || `Download fehlgeschlagen (${res.status})`, { id: toastId });
      return false;
    }
    const blob = await res.blob();
    const href = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = href;
    a.download = filenameFrom(res, url);
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(href), 30_000);
    toast.success(`${a.download} heruntergeladen`, { id: toastId });
    return true;
  } catch (e) {
    console.warn("Demo-Download fehlgeschlagen", e);
    toast.error("Die Datei konnte nicht erzeugt werden.", { id: toastId });
    return false;
  }
}
