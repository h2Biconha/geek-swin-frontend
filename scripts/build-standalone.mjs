/**
 * Gera um HTML único que abre com duplo clique (sem servidor, sem internet obrigatória).
 * Usa as mesmas views do site Next; só troca next/link e next/navigation por shims com rota no hash.
 *
 *   npm run standalone                 -> standalone-dist/ABRIR-GEEK-SWIM.html
 *   npm run standalone -- caminho.html -> grava onde você mandar
 *
 * As fontes vêm do Google Fonts quando há internet; offline, cai para Helvetica/Arial.
 */
import { build } from "esbuild";
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const here = join(root, "scripts/standalone");
const out = resolve(process.argv[2] ?? join(root, "standalone-dist/ABRIR-GEEK-SWIM.html"));
const tmp = join(root, "standalone-dist/.tmp");
mkdirSync(tmp, { recursive: true });
mkdirSync(dirname(out), { recursive: true });

// 1. CSS: o mesmo globals.css, compilado pelo Tailwind 4
execFileSync(join(root, "node_modules/.bin/tailwindcss"), ["-i", "src/app/globals.css", "-o", join(tmp, "app.css"), "--minify"], { cwd: root, stdio: "inherit" });
const css = readFileSync(join(tmp, "app.css"), "utf8");

// 2. JS: views + shims
const env = { NODE_ENV: "production", NEXT_PUBLIC_BUILD_TIME: String(Date.now()) };
const res = await build({
  entryPoints: [join(here, "entry.tsx")],
  bundle: true,
  minify: true,
  format: "iife",
  target: "es2020",
  jsx: "automatic",
  write: false,
  logLevel: "warning",
  logOverride: { "unsupported-directive": "silent" }, // "use client" não significa nada fora do Next
  alias: { "next/link": join(here, "link.tsx"), "next/navigation": join(here, "navigation.ts") },
  define: { "process.env": JSON.stringify(env) },
  tsconfig: join(root, "tsconfig.json"),
});
const js = res.outputFiles[0].text.replace(/<\/script/gi, "<\\/script");

// 3. Imagens: os SVGs de public/art viram data URI, lidos por asset() em lib/catalog.ts
const assets = {};
for (const f of readdirSync(join(root, "public/art"))) {
  if (f.endsWith(".svg")) assets[`/art/${f}`] = `data:image/svg+xml;base64,${readFileSync(join(root, "public/art", f)).toString("base64")}`;
}
const icon = `data:image/svg+xml;base64,${readFileSync(join(root, "src/app/icon.svg")).toString("base64")}`;

const html = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#0b0b0c">
<title>GEEK SWIM · Streetwear nascido da cultura gamer</title>
<link rel="icon" href="${icon}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,100..900&family=JetBrains+Mono:wght@400;500;700&display=swap">
<script>window.__GS_HASH=true;window.__GS_ASSETS=${JSON.stringify(assets)};</script>
<style>:root{--font-archivo:"Archivo";--font-jetbrains:"JetBrains Mono"}</style>
<style>${css}</style>
</head>
<body>
<div id="root"></div>
<script>${js}</script>
</body>
</html>
`;
writeFileSync(out, html);
console.log(`ok: ${out} (${(html.length / 1024).toFixed(0)} KB)`);
