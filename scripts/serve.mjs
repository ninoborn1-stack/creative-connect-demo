#!/usr/bin/env node
// Kleiner statischer Server für out/, mit optionalem BASE_PATH, wie auf GitHub Pages.
// Aufruf: pnpm serve [port]   (PAGES_BASE_PATH=/creative-connect-demo pnpm serve)
import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { createBrotliCompress } from "node:zlib";
import path from "node:path";
import { fileURLToPath } from "node:url";

const OUT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "out");
const base = (process.env.PAGES_BASE_PATH ?? process.env.BASE_PATH ?? "").replace(/\/+$/, "");
const port = Number(process.argv[2] ?? 4200);
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".avif": "image/avif", ".webp": "image/webp", ".woff2": "font/woff2", ".ico": "image/x-icon", ".txt": "text/plain", ".json": "application/json", ".svg": "image/svg+xml" };

createServer((req, res) => {
  let url = decodeURIComponent((req.url ?? "/").split("?")[0]);
  if (base && url.startsWith(base)) url = url.slice(base.length) || "/";
  let file = path.join(OUT, url);
  if (existsSync(file) && statSync(file).isDirectory()) file = path.join(file, "index.html");
  const found = existsSync(file) && statSync(file).isFile();
  if (!found) file = path.join(OUT, "404.html");
  const type = TYPES[path.extname(file)] ?? "application/octet-stream";
  // wie GitHub/Cloudflare Pages: Textdateien komprimiert ausliefern (sonst messen Lighthouse-Läufe zu schlecht)
  const compress = /text|javascript|json|svg/.test(type) && /\bbr\b/.test(String(req.headers["accept-encoding"]));
  res.writeHead(found ? 200 : 404, { "content-type": type, ...(compress && { "content-encoding": "br" }) });
  const stream = createReadStream(file);
  (compress ? stream.pipe(createBrotliCompress()) : stream).pipe(res);

}).listen(port, () => console.log(`http://localhost:${port}${base}/`));
