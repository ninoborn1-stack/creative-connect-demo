#!/usr/bin/env node
// Nach dem statischen Export: Einstieg „/“ leitet je nach Browsersprache auf /de/ oder /en/,
// (404.html erzeugt Next aus src/app/global-not-found.tsx), .nojekyll damit GitHub Pages den Ordner _next ausliefert.
import { writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const OUT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "out");
const base = (process.env.PAGES_BASE_PATH ?? process.env.BASE_PATH ?? "").replace(/\/+$/, "");

const page = (title, body, script = "") => `<!doctype html>
<html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title><meta name="robots" content="noindex">${script}
<style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#011730;color:#eff4f8;font:16px/1.5 system-ui,sans-serif;text-align:center}a{color:#eff4f8}</style>
</head><body>${body}</body></html>
`;

writeFileSync(
  path.join(OUT, "index.html"),
  page(
    "Weiterleitung",
    `<p><a href="${base}/de/">Deutsch</a> · <a href="${base}/en/">English</a></p>`,
    `<meta http-equiv="refresh" content="0; url=${base}/de/"><script>location.replace("${base}/"+((navigator.languages||[navigator.language]).some(function(l){return /^de/i.test(l)})?"de":"en")+"/")</script>`,
  ),
);
writeFileSync(path.join(OUT, ".nojekyll"), "");
console.log(`postbuild: index.html (basePath "${base}")`);
