#!/usr/bin/env node
// Statischer Export der Demo für GitHub Pages – derselbe Code, anderes Ziel.
//
// 1. Projekt nach .pages-build/ kopieren (node_modules per Symlink)
// 2. Seed gegen eine temporäre SQLite-DB → public/demo-data.json (Daten + Schema aus Prisma DMMF)
// 3. Quelltext transformieren (generisch, keine Handarbeit pro Seite):
//    - page.tsx/layout.tsx → dünner Server-Wrapper + Client-Modul, das die Original-Funktion im Browser aufruft
//    - route.ts (GET) → wird im Browser ausgeführt (Download), Routentabelle für die 404-Seite
//    - "use server" entfernen, Actions in einen Wrapper hüllen (redirect → Client-Navigation)
//    - next/headers, next/cache, next/server, @react-pdf/renderer, server-only → Browser-Shims
// 4. scripts/pages/overrides/ darüberkopieren (db, storage, seed, not-found)
// 5. next build mit output: "export" und basePath aus PAGES_BASE_PATH → out/
import { spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, renameSync, rmSync, statSync, symlinkSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const WORK = path.join(ROOT, ".pages-build");
const OUT = path.join(ROOT, "out");
const SRC = path.join(WORK, "src");
const APP = path.join(SRC, "app");
const DEMO_LIB = path.join(SRC, "lib", "demo");

let basePath = (process.env.PAGES_BASE_PATH ?? "").trim();
if (basePath && !basePath.startsWith("/")) basePath = "/" + basePath;
basePath = basePath.replace(/\/+$/, "");

const log = (...a) => console.log("[pages]", ...a);
const warn = (...a) => console.warn("[pages] Hinweis:", ...a);
const rel = (p) => path.relative(WORK, p).split(path.sep).join("/");

function run(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, { stdio: "inherit", ...opts });
  if (r.status !== 0) {
    console.error(`[pages] Befehl fehlgeschlagen: ${cmd} ${args.join(" ")}`);
    process.exit(r.status ?? 1);
  }
}

// ---------------------------------------------------------------- 1. Kopie

const SKIP = new Set(["node_modules", ".next", ".git", "out", ".pages-build", ".pages-build-tmp", "test-results", "playwright-report", ".claude"]);
log(`Arbeitskopie ${rel(WORK) || ".pages-build"} (basePath "${basePath}")`);
rmSync(WORK, { recursive: true, force: true });
mkdirSync(WORK, { recursive: true });
for (const entry of readdirSync(ROOT)) {
  if (SKIP.has(entry) || entry.startsWith(".env")) continue;
  cpSync(path.join(ROOT, entry), path.join(WORK, entry), {
    recursive: true,
    filter: (src) => {
      const r = path.relative(ROOT, src).split(path.sep).join("/");
      if (/^prisma\/.*\.db(-journal)?$/.test(r)) return false;
      if (r.startsWith("public/uploads/") && !r.endsWith(".gitkeep")) return false;
      if (r.startsWith("docs/businessplaene")) return false;
      return true;
    },
  });
}
symlinkSync(path.join(ROOT, "node_modules"), path.join(WORK, "node_modules"), "dir");

// ---------------------------------------------------------------- 2. Snapshot

const snapshotFile = path.join(WORK, "public", "demo-data.json");
log("Seed → Snapshot");
run("pnpm", ["exec", "tsx", "scripts/pages/snapshot.ts", snapshotFile], { cwd: ROOT });
const snapshot = JSON.parse(readFileSync(snapshotFile, "utf8"));

// ---------------------------------------------------------------- Hilfen für Transformationen

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = path.join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(tsx?|jsx?|mjs)$/.test(name)) out.push(p);
  }
  return out;
}

function parse(file, text) {
  const kind = /\.tsx$/.test(file) ? ts.ScriptKind.TSX : /\.jsx$/.test(file) ? ts.ScriptKind.JSX : /\.ts$/.test(file) ? ts.ScriptKind.TS : ts.ScriptKind.JS;
  return ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, kind);
}

function directives(sf) {
  const found = [];
  for (const st of sf.statements) {
    if (ts.isExpressionStatement(st) && ts.isStringLiteral(st.expression)) found.push({ value: st.expression.text, node: st });
    else break;
  }
  return found;
}

function applyEdits(text, edits) {
  let out = text;
  for (const e of [...edits].sort((a, b) => b.start - a.start)) out = out.slice(0, e.start) + e.text + out.slice(e.end);
  return out;
}

const hasExport = (node) => node.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword);
const hasDefault = (node) => node.modifiers?.some((m) => m.kind === ts.SyntaxKind.DefaultKeyword);

const SPECIFIERS = {
  "next/headers": "@/lib/demo/shims/headers",
  "next/cache": "@/lib/demo/shims/cache",
  "next/server": "@/lib/demo/shims/server",
  "@react-pdf/renderer": "@/lib/demo/shims/react-pdf",
};
const REMOVED_IMPORTS = new Set(["server-only", "client-only"]);

// Import-Pfade umbiegen, server-only entfernen, "use server" auflösen
function transformSource(file) {
  const text = readFileSync(file, "utf8");
  const sf = parse(file, text);
  const edits = [];
  const appended = [];
  let needsWrap = false;

  for (const st of sf.statements) {
    if ((ts.isImportDeclaration(st) || ts.isExportDeclaration(st)) && st.moduleSpecifier && ts.isStringLiteral(st.moduleSpecifier)) {
      const spec = st.moduleSpecifier.text;
      if (ts.isImportDeclaration(st) && REMOVED_IMPORTS.has(spec) && !st.importClause) edits.push({ start: st.getStart(sf), end: st.getEnd(), text: "" });
      else if (SPECIFIERS[spec]) edits.push({ start: st.moduleSpecifier.getStart(sf), end: st.moduleSpecifier.getEnd(), text: JSON.stringify(SPECIFIERS[spec]) });
    }
  }
  // dynamische Imports
  const visitImports = (node) => {
    if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword && node.arguments[0] && ts.isStringLiteral(node.arguments[0])) {
      const spec = node.arguments[0].text;
      if (SPECIFIERS[spec]) edits.push({ start: node.arguments[0].getStart(sf), end: node.arguments[0].getEnd(), text: JSON.stringify(SPECIFIERS[spec]) });
    }
    ts.forEachChild(node, visitImports);
  };
  visitImports(sf);

  const top = directives(sf);
  const useServer = top.find((d) => d.value === "use server");
  if (useServer) {
    edits.push({ start: useServer.node.getStart(sf), end: useServer.node.getEnd(), text: "" });
    for (const st of sf.statements) {
      if (ts.isFunctionDeclaration(st) && hasExport(st) && st.name) {
        const name = st.name.text;
        const mods = st.modifiers.filter((m) => m.kind === ts.SyntaxKind.ExportKeyword || m.kind === ts.SyntaxKind.DefaultKeyword);
        edits.push({ start: mods[0].getStart(sf), end: mods[mods.length - 1].getEnd(), text: "" });
        if (hasDefault(st)) appended.push(`export default __demoWrapAction(${name});`);
        else appended.push(`const __demoAction_${name} = __demoWrapAction(${name});\nexport { __demoAction_${name} as ${name} };`);
        needsWrap = true;
      } else if (ts.isVariableStatement(st) && hasExport(st)) {
        for (const d of st.declarationList.declarations) {
          if (d.initializer && (ts.isArrowFunction(d.initializer) || ts.isFunctionExpression(d.initializer) || ts.isCallExpression(d.initializer))) {
            edits.push({ start: d.initializer.getStart(sf), end: d.initializer.getStart(sf), text: "__demoWrapAction(" });
            edits.push({ start: d.initializer.getEnd(), end: d.initializer.getEnd(), text: ")" });
            needsWrap = true;
          }
        }
      } else if (ts.isExportAssignment(st)) {
        edits.push({ start: st.expression.getStart(sf), end: st.expression.getStart(sf), text: "__demoWrapAction(" });
        edits.push({ start: st.expression.getEnd(), end: st.expression.getEnd(), text: ")" });
        needsWrap = true;
      } else if (ts.isExportDeclaration(st) && !st.moduleSpecifier && !st.isTypeOnly) {
        warn(`${rel(file)}: "export { … }" in einer "use server"-Datei wird nicht umhüllt`);
      }
    }
  }
  // Inline-"use server" (Server Actions in Komponenten): Direktive entfernen
  const visitInline = (node) => {
    if (ts.isBlock(node) && node.statements[0] && ts.isExpressionStatement(node.statements[0]) && ts.isStringLiteral(node.statements[0].expression) && node.statements[0].expression.text === "use server") {
      edits.push({ start: node.statements[0].getStart(sf), end: node.statements[0].getEnd(), text: "" });
      warn(`${rel(file)}: Inline-Server-Action ohne Redirect-Behandlung`);
    }
    ts.forEachChild(node, visitInline);
  };
  sf.statements.forEach((st) => visitInline(st));

  if (!edits.length && !appended.length) return;
  let out = applyEdits(text, edits);
  if (needsWrap) out = `import { wrapAction as __demoWrapAction } from "@/lib/demo/actions";\n` + out + "\n" + appended.join("\n") + "\n";
  writeFileSync(file, out);
}

// ---------------------------------------------------------------- 3. Transformationen

log("Quelltext transformieren");
const allFiles = walk(SRC).filter((f) => !f.startsWith(DEMO_LIB + path.sep));
for (const f of allFiles) transformSource(f);

// THEME_INIT_SCRIPT o. ä.: Startseiten-Erkennung über location.pathname braucht den basePath
if (basePath) {
  for (const f of allFiles) {
    const text = readFileSync(f, "utf8");
    const next = text.replace(/location\.pathname\s*===\s*(["'])\/\1/g, `(location.pathname==="${basePath}"||location.pathname==="${basePath}/")`);
    if (next !== text) writeFileSync(f, next);
  }
}

// --- Routen im app-Verzeichnis
const isSpecial = (name, kind) => new RegExp(`^${kind}\\.(tsx|ts|jsx|js)$`).test(name);
const routeSegments = (dir) =>
  path
    .relative(APP, dir)
    .split(path.sep)
    .filter((s) => s && !(s.startsWith("(") && s.endsWith(")")) && !s.startsWith("@"));
const routePattern = (dir) => "/" + routeSegments(dir).join("/");
const importPath = (file) => "@/" + path.relative(SRC, file).split(path.sep).join("/").replace(/\.(tsx|ts|jsx|js)$/, "");

function collect(dir, acc = { pages: [], layouts: new Map(), routes: [] }) {
  for (const name of readdirSync(dir)) {
    const p = path.join(dir, name);
    if (statSync(p).isDirectory()) {
      if (!name.startsWith("_")) collect(p, acc);
      continue;
    }
    if (isSpecial(name, "page")) acc.pages.push(p);
    else if (isSpecial(name, "layout")) acc.layouts.set(dir, p);
    else if (isSpecial(name, "route")) acc.routes.push(p);
  }
  return acc;
}
const found = collect(APP);
const isClientFile = (file) => directives(parse(file, readFileSync(file, "utf8"))).some((d) => d.value === "use client");

// statische Metadaten übernehmen, wenn sie nur aus Literalen bestehen
function staticMetadata(file) {
  const sf = parse(file, readFileSync(file, "utf8"));
  for (const st of sf.statements) {
    if (!ts.isVariableStatement(st) || !hasExport(st)) continue;
    for (const d of st.declarationList.declarations) {
      if (!ts.isIdentifier(d.name) || d.name.text !== "metadata" || !d.initializer) continue;
      let pure = true;
      const check = (n) => {
        if (ts.isIdentifier(n) && !(ts.isPropertyAssignment(n.parent) && n.parent.name === n) && !ts.isTypeReferenceNode(n.parent)) pure = false;
        if (ts.isTemplateExpression(n) || ts.isCallExpression(n) || ts.isSpreadAssignment(n) || ts.isShorthandPropertyAssignment(n)) pure = false;
        ts.forEachChild(n, check);
      };
      check(d.initializer);
      let init = d.initializer;
      while (ts.isSatisfiesExpression(init) || ts.isAsExpression(init)) init = init.expression;
      if (pure) return init.getText(sf);
    }
  }
  return null;
}

// generateStaticParams aus dem Snapshot: sucht db.<modell>.findUnique/findFirst({ where: { <feld>: <param> } })
const delegateToModel = Object.fromEntries(Object.keys(snapshot.schema.models).map((m) => [m[0].toLowerCase() + m.slice(1), m]));
function staticParams(file, params) {
  const text = readFileSync(file, "utf8");
  const values = {};
  for (const p of params) {
    const aliases = new Set([p.name]);
    for (const m of text.matchAll(new RegExp(`\\b${p.name}\\s*:\\s*(\\w+)`, "g"))) aliases.add(m[1]);
    const re = /db\.(\w+)\.(?:findUnique|findFirst|findUniqueOrThrow|findFirstOrThrow)\(\s*\{\s*where:\s*\{\s*(\w+)\s*(?::\s*(\w+))?\s*[,}]/g;
    for (const m of text.matchAll(re)) {
      const [, delegate, field, value = field] = m;
      const model = delegateToModel[delegate];
      if (!model || !aliases.has(value)) continue;
      const vals = [...new Set((snapshot.data[model] ?? []).map((r) => r[field]).filter((v) => typeof v === "string" && v))];
      if (vals.length) {
        values[p.name] = vals;
        break;
      }
    }
    // sonst: ein in der Seite benutztes Modell mit eindeutigem Feld gleichen Namens (z. B. invite.code)
    if (!values[p.name] && p.name !== "id") {
      for (const m of text.matchAll(/db\.(\w+)\./g)) {
        const model = delegateToModel[m[1]];
        const def = model && snapshot.schema.models[model];
        if (!def || !def.uniques.some((u) => u.length === 1 && u[0] === p.name)) continue;
        values[p.name] = [...new Set(snapshot.data[model].map((r) => r[p.name]).filter((v) => typeof v === "string" && v))];
        break;
      }
    }
    // sonst: Nachschlagen in einer importierten Konstante, z. B. CONTRACT_TEMPLATES[template] oder LIST.find((t) => t.key === slug)
    if (!values[p.name]) values[p.name] = constantValues(file, text, aliases);
    // sonst: genau ein Modell im Schema hat ein eindeutiges Feld dieses Namens (z. B. code → Invite)
    if (!values[p.name] && p.name !== "id") {
      const models = Object.values(snapshot.schema.models).filter((m) => m.uniques.some((u) => u.length === 1 && u[0] === p.name));
      if (models.length === 1) values[p.name] = [...new Set(snapshot.data[models[0].name].map((r) => r[p.name]).filter((v) => typeof v === "string" && v))];
    }
  }
  const dynamic = params.filter((p) => !p.catchAll);
  if (dynamic.length && dynamic.every((p) => values[p.name]) && dynamic.length === 1 && params.length === 1) {
    return values[params[0].name].map((v) => ({ [params[0].name]: v }));
  }
  // Platzhalter: echte Pfade rendert die 404-Seite im Browser
  return [Object.fromEntries(params.map((p) => [p.name, p.catchAll ? ["__demo"] : "__demo"]))];
}

function constantValues(file, text, aliases) {
  const sf = parse(file, text);
  const imports = new Map();
  for (const st of sf.statements) {
    if (!ts.isImportDeclaration(st) || !st.importClause?.namedBindings || !ts.isNamedImports(st.importClause.namedBindings)) continue;
    for (const el of st.importClause.namedBindings.elements) imports.set(el.name.text, { spec: st.moduleSpecifier.text, name: (el.propertyName ?? el.name).text });
  }
  let need = null;
  for (const m of text.matchAll(/\b(\w+)\[(\w+)\]/g)) if (imports.has(m[1]) && aliases.has(m[2])) need = { ...imports.get(m[1]), kind: "keys" };
  for (const m of text.matchAll(/\b(\w+)\.find\(\s*\(?(\w+)\)?\s*=>\s*\2\.(\w+)\s*===\s*(\w+)/g))
    if (!need && imports.has(m[1]) && aliases.has(m[4])) need = { ...imports.get(m[1]), kind: "field", field: m[3] };
  if (!need) return undefined;
  // Modul im Original-Projekt mit tsx auswerten (Pfad-Aliase aus tsconfig)
  const origFile = path.join(ROOT, path.relative(WORK, file));
  const target = need.spec.startsWith("@/") ? path.join(ROOT, "src", need.spec.slice(2)) : need.spec.startsWith(".") ? path.resolve(path.dirname(origFile), need.spec) : need.spec;
  const code = `import(${JSON.stringify(target)}).then((m) => { const v = m[${JSON.stringify(need.name)}]; const out = ${
    need.kind === "keys" ? "Array.isArray(v) ? [] : Object.keys(v ?? {})" : `(Array.isArray(v) ? v : Object.values(v ?? {})).map((x) => x?.[${JSON.stringify(need.field)}])`
  }; console.log("@@" + JSON.stringify(out.filter((x) => typeof x === "string" && x))); })`;
  const r = spawnSync("pnpm", ["exec", "tsx", "--eval", code], { cwd: ROOT, encoding: "utf8" });
  const line = (r.stdout ?? "").split("\n").find((l) => l.startsWith("@@"));
  const vals = line ? JSON.parse(line.slice(2)) : [];
  return vals.length ? vals : undefined;
}

function dynamicParams(dir) {
  return routeSegments(dir)
    .map((s) => /^\[\[?(\.\.\.)?(.+?)\]?\]$/.exec(s))
    .filter(Boolean)
    .map((m) => ({ name: m[2], catchAll: Boolean(m[1]) }));
}

const layoutFiles = new Map(); // dir → { client, load }
const rootLayoutDir = APP;
for (const [dir, file] of found.layouts) {
  if (dir === rootLayoutDir) continue;
  if (isClientFile(file)) {
    layoutFiles.set(dir, { client: true, load: importPath(file) });
    continue;
  }
  const ext = path.extname(file);
  const impl = path.join(dir, `layout.impl${ext}`);
  renameSync(file, impl);
  const meta = staticMetadata(impl);
  writeFileSync(
    path.join(dir, "layout.client.tsx"),
    `"use client";\nimport * as Mod from "./layout.impl";\nimport { DemoLayout } from "@/lib/demo/render";\nimport "@/lib/demo/generated/routes";\n\nexport default function DemoClientLayout({ children }: { children: React.ReactNode }) {\n  return <DemoLayout mod={Mod}>{children}</DemoLayout>;\n}\n`,
  );
  writeFileSync(
    path.join(dir, "layout.tsx"),
    `import DemoClientLayout from "./layout.client";\n${meta ? `export const metadata = ${meta};\n` : ""}\nexport default function DemoServerLayout({ children }: { children: React.ReactNode }) {\n  return <DemoClientLayout>{children}</DemoClientLayout>;\n}\n`,
  );
  layoutFiles.set(dir, { client: false, load: importPath(impl) });
}

const routeTable = [];
function layoutChain(dir) {
  const chain = [];
  let d = dir;
  while (d.startsWith(APP) && d !== rootLayoutDir) {
    if (layoutFiles.has(d)) chain.unshift(layoutFiles.get(d));
    d = path.dirname(d);
  }
  return chain;
}

let pageCount = 0;
for (const file of found.pages) {
  const dir = path.dirname(file);
  const params = dynamicParams(dir);
  const pattern = routePattern(dir);
  if (isClientFile(file)) {
    routeTable.push({ pattern, kind: "page", layouts: layoutChain(dir), page: { client: true, load: importPath(file) } });
    if (params.length) warn(`${rel(file)}: Client-Seite mit dynamischen Segmenten – bitte generateStaticParams selbst liefern`);
    continue;
  }
  const ext = path.extname(file);
  const impl = path.join(dir, `page.impl${ext}`);
  renameSync(file, impl);
  const meta = staticMetadata(impl);
  writeFileSync(
    path.join(dir, "page.client.tsx"),
    `"use client";\nimport { Suspense } from "react";\nimport * as Mod from "./page.impl";\nimport { DemoPage, DemoSkeleton } from "@/lib/demo/render";\nimport "@/lib/demo/generated/routes";\n\nexport default function DemoClientPage() {\n  return (\n    <Suspense fallback={<DemoSkeleton />}>\n      <DemoPage mod={Mod} />\n    </Suspense>\n  );\n}\n`,
  );
  const sp = params.length ? staticParams(impl, params) : null;
  writeFileSync(
    path.join(dir, "page.tsx"),
    `import DemoClientPage from "./page.client";\n${meta ? `export const metadata = ${meta};\n` : ""}${
      sp ? `export const dynamicParams = false;\nexport function generateStaticParams() {\n  return ${JSON.stringify(sp)};\n}\n` : ""
    }\nexport default function DemoServerPage() {\n  return <DemoClientPage />;\n}\n`,
  );
  const known = (sp ?? [])
    .filter((ps) => !Object.values(ps).some((v) => v === "__demo" || (Array.isArray(v) && v.includes("__demo"))))
    .map((ps) => pattern.replace(/\[\[?(?:\.\.\.)?(.+?)\]?\]/g, (_, n) => [].concat(ps[n]).join("/")));
  routeTable.push({ pattern, kind: "page", layouts: layoutChain(dir), page: { client: false, load: importPath(impl) }, known: params.length ? known : undefined });
  pageCount++;
}

for (const file of found.routes) {
  const text = readFileSync(file, "utf8");
  if (/force-static/.test(text)) continue; // statisch exportierbar – bleibt
  const dir = path.dirname(file);
  const impl = path.join(dir, `route.impl${path.extname(file)}`);
  renameSync(file, impl);
  routeTable.push({ pattern: routePattern(dir), kind: "route", layouts: [], handler: importPath(impl) });
}

// eigene not-found-Seite der App behalten (wird innerhalb der Demo-404 angezeigt)
let notFoundEntry = "null";
for (const ext of [".tsx", ".ts", ".jsx", ".js"]) {
  const nf = path.join(APP, `not-found${ext}`);
  if (!existsSync(nf)) continue;
  const impl = path.join(APP, `not-found.impl${ext}`);
  renameSync(nf, impl);
  notFoundEntry = `{ client: ${isClientFile(impl)}, load: () => import(${JSON.stringify(importPath(impl))}) }`;
}

// ---------------------------------------------------------------- 4. Overrides + generierte Module

cpSync(path.join(ROOT, "scripts", "pages", "overrides"), WORK, { recursive: true });
const GEN = path.join(DEMO_LIB, "generated");
mkdirSync(GEN, { recursive: true });
const seg = (s) => `{ client: ${s.client}, load: () => import(${JSON.stringify(s.load)}) }`;
writeFileSync(
  path.join(GEN, "routes.ts"),
  `// generiert von scripts/pages/build.mjs\nimport { registerDemoRoutes } from "@/lib/demo/routes";\n\nregisterDemoRoutes(\n  [\n${routeTable
    .map(
      (r) =>
        `    { pattern: ${JSON.stringify(r.pattern)}, kind: ${JSON.stringify(r.kind)}, layouts: [${r.layouts.map(seg).join(", ")}]${r.page ? `, page: ${seg(r.page)}` : ""}${
          r.handler ? `, handler: () => import(${JSON.stringify(r.handler)})` : ""
        }${r.known ? `, known: ${JSON.stringify(r.known)}` : ""} },`,
    )
    .join("\n")}\n  ],\n  ${notFoundEntry},\n);\n`,
);
writeFileSync(
  path.join(GEN, "fallback.tsx"),
  `"use client";\n// generiert von scripts/pages/build.mjs\nimport "./routes";\nimport { DemoFallback } from "@/lib/demo/render";\n\nexport function DemoFallbackPage() {\n  return <DemoFallback />;\n}\n`,
);

// next.config: Original übernehmen, Export-Einstellungen ergänzen
const configName = ["next.config.ts", "next.config.mjs", "next.config.js"].find((n) => existsSync(path.join(WORK, n)));
const baseConfig = configName ? `next.config.base${path.extname(configName)}` : null;
if (configName) renameSync(path.join(WORK, configName), path.join(WORK, baseConfig));
writeFileSync(
  path.join(WORK, "next.config.ts"),
  `// generiert von scripts/pages/build.mjs – statischer Export für GitHub Pages\nimport type { NextConfig } from "next";\n${
    baseConfig ? `import base from "./${baseConfig.replace(/\.ts$/, "")}";` : "const base: NextConfig = {};"
  }\n\nconst basePath = ${JSON.stringify(basePath)};\nconst { experimental, ...rest } = base;\nconst { serverActions, ...experimentalRest } = experimental ?? {};\nvoid serverActions;\n\nconst config: NextConfig = {\n  ...rest,\n  experimental: experimentalRest,\n  output: "export",\n  basePath: basePath || undefined,\n  assetPrefix: basePath || undefined,\n  trailingSlash: false,\n  images: { ...base.images, unoptimized: true },\n  typescript: { ...base.typescript, ignoreBuildErrors: true },\n  turbopack: { ...base.turbopack, root: ${JSON.stringify(ROOT)} },\n};\n\nexport default config;\n`,
);

log(`${pageCount} Seiten, ${layoutFiles.size} Layouts, ${routeTable.filter((r) => r.kind === "route").length} Route Handler umgestellt`);

// ---------------------------------------------------------------- 5. Build

const rootLayout = readFileSync(path.join(APP, "layout.tsx"), "utf8");
const titleTemplate = /template:\s*["'`]([^"'`]+)["'`]/.exec(rootLayout)?.[1] ?? "%s";
const publicDirs = readdirSync(path.join(WORK, "public")).filter((n) => statSync(path.join(WORK, "public", n)).isDirectory());
const env = {
  ...process.env,
  NODE_ENV: "production",
  NEXT_TELEMETRY_DISABLED: "1",
  NEXT_PUBLIC_PAGES_DEMO: "1",
  NEXT_PUBLIC_DEMO_BASE_PATH: basePath,
  NEXT_PUBLIC_DEMO_VERSION: snapshot.version,
  NEXT_PUBLIC_DEMO_TITLE_TEMPLATE: titleTemplate,
  NEXT_PUBLIC_DEMO_PUBLIC_DIRS: publicDirs.join(","),
};
// Server-Geheimnisse gehören nicht in den Browser-Build
delete env.ANTHROPIC_API_KEY;
delete env.DATABASE_URL;
log("next build (output: export)");
run(path.join(ROOT, "node_modules", ".bin", "next"), ["build"], { cwd: WORK, env });

// ---------------------------------------------------------------- 6. Ausgabe

rmSync(OUT, { recursive: true, force: true });
renameSync(path.join(WORK, "out"), OUT);
writeFileSync(path.join(OUT, ".nojekyll"), "");
// x.html zusätzlich als x/index.html, wenn es den Ordner x/ gibt (robust gegen Verzeichnis-Weiterleitungen)
const dup = (dir) => {
  for (const name of readdirSync(dir)) {
    const p = path.join(dir, name);
    if (statSync(p).isDirectory()) {
      dup(p);
      const html = `${p}.html`;
      if (existsSync(html) && !existsSync(path.join(p, "index.html"))) cpSync(html, path.join(p, "index.html"));
    }
  }
};
dup(OUT);
log(`fertig → ${path.relative(ROOT, OUT)}/ (lokal testen: pnpm pages:serve)`);
