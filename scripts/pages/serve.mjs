#!/usr/bin/env node
// Liefert out/ so aus, wie GitHub Pages es tut: unter /<basePath>/, „/pfad“ → pfad.html bzw. pfad/index.html,
// unbekannte Pfade → 404.html mit Status 404. Aufruf: PAGES_BASE_PATH=/creative-connect-demo node scripts/pages/serve.mjs [port]
import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../out");
const base = (process.env.PAGES_BASE_PATH ?? "").replace(/\/+$/, "");
const port = Number(process.argv[2] ?? process.env.PORT ?? 4100);

const TYPES = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8", ".txt": "text/plain; charset=utf-8", ".svg": "image/svg+xml", ".png": "image/png",
  ".jpg": "image/jpeg", ".ico": "image/x-icon", ".woff2": "font/woff2", ".woff": "font/woff", ".wav": "audio/wav", ".mp3": "audio/mpeg",
  ".webp": "image/webp", ".map": "application/json",
};

const isFile = (p) => existsSync(p) && statSync(p).isFile();

function send(res, file, status = 200) {
  res.writeHead(status, { "Content-Type": TYPES[path.extname(file)] ?? "application/octet-stream", "Cache-Control": "no-cache" });
  createReadStream(file).pipe(res);
}

createServer((req, res) => {
  const url = new URL(req.url ?? "/", "http://localhost");
  let p = decodeURIComponent(url.pathname);
  const notFound = () => send(res, path.join(ROOT, "404.html"), 404);
  if (base) {
    if (p === base) {
      res.writeHead(301, { Location: base + "/" + url.search });
      return res.end();
    }
    if (!p.startsWith(base + "/")) return notFound();
    p = p.slice(base.length);
  }
  const target = path.join(ROOT, path.normalize(p));
  if (!target.startsWith(ROOT)) return notFound();
  if (isFile(target)) return send(res, target);
  if (p.endsWith("/") && isFile(path.join(target, "index.html"))) return send(res, path.join(target, "index.html"));
  if (!p.endsWith("/") && isFile(`${target}.html`)) return send(res, `${target}.html`);
  if (!p.endsWith("/") && isFile(path.join(target, "index.html"))) {
    res.writeHead(301, { Location: base + p + "/" + url.search });
    return res.end();
  }
  return notFound();
}).listen(port, () => console.log(`Pages-Vorschau: http://localhost:${port}${base}/`));
