/**
 * npm run db:migrate → aplica as migrações (src/server/db/migrations.ts) e sincroniza o estoque com o catálogo.
 * Use no deploy com DB_AUTO_MIGRATE=false, para o banco não ser alterado no meio de uma requisição.
 * Lê DATABASE_URL do ambiente (ou de .env.local). Sem DATABASE_URL, usa o banco local PGlite (.data/pglite).
 * Seguro rodar várias vezes: cada migração roda uma vez só. Nunca apaga dados.
 */
import { build } from "esbuild";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
for (const f of [".env.local", ".env"]) {
  if (!existsSync(join(root, f))) continue;
  for (const line of readFileSync(join(root, f), "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}
process.env.NEXT_PUBLIC_STORE_MODE ||= "test";
process.env.DB_AUTO_MIGRATE = "false";

const out = join(root, "node_modules/.cache/gs-migrate.mjs");
await build({
  stdin: {
    contents: `import { connectPglite, migrate } from "@/server/db"; import { syncCatalog } from "@/server/inventory"; export { connectPglite, migrate, syncCatalog };`,
    resolveDir: root,
    loader: "ts",
  },
  bundle: true,
  platform: "node",
  format: "esm",
  outfile: out,
  packages: "external",
  alias: { "server-only": join(root, "scripts/empty.mjs") },
  tsconfig: join(root, "tsconfig.json"),
  logLevel: "warning",
});
const { connectPglite, migrate, syncCatalog } = await import(pathToFileURL(out).href);

let db;
if (process.env.DATABASE_URL) {
  const { default: pg } = await import("pg");
  const url = process.env.DATABASE_URL;
  const pool = new pg.Pool({ connectionString: url, max: 1, ssl: /sslmode=require|neon\.tech|supabase/.test(url) ? { rejectUnauthorized: false } : undefined });
  db = {
    query: async (t, p) => (await pool.query(t, p)).rows,
    tx: async (fn) => {
      const c = await pool.connect();
      try {
        await c.query("begin");
        const r = await fn({ query: async (t, p) => (await c.query(t, p)).rows });
        await c.query("commit");
        return r;
      } catch (e) {
        await c.query("rollback");
        throw e;
      } finally {
        c.release();
      }
    },
    close: () => pool.end(),
  };
  console.log("banco: DATABASE_URL");
} else {
  const dir = process.env.LOCAL_DB_PATH || join(root, ".data/pglite");
  const { mkdirSync } = await import("node:fs");
  mkdirSync(dir, { recursive: true });
  db = await connectPglite(dir);
  console.log(`banco: PGlite local em ${dir}`);
}
await migrate(db);
await syncCatalog(db);
const rows = await db.query("select id, applied_at from schema_migrations order by id");
for (const r of rows) console.log(`ok ${r.id}`);
await db.close();
