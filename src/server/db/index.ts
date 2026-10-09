import "server-only";
import { env } from "../env";
import { MIGRATIONS } from "./migrations";
import { syncCatalog } from "../inventory";

/**
 * Acesso ao Postgres com SQL parametrizado (nunca concatene valores na query).
 * - Com DATABASE_URL: Postgres de verdade (Neon, Supabase, RDS...) via `pg`.
 * - Sem DATABASE_URL, fora de produção: PGlite (Postgres em WebAssembly) num arquivo local.
 *   Os testes usam PGlite em memória.
 */
export interface Sql {
  query<T = Record<string, unknown>>(text: string, params?: unknown[]): Promise<T[]>;
}
export interface Db extends Sql {
  tx<T>(fn: (sql: Sql) => Promise<T>): Promise<T>;
  close(): Promise<void>;
}

async function connectPg(url: string): Promise<Db> {
  const { Pool } = (await import("pg")).default;
  const pool = new Pool({ connectionString: url, max: 5, ssl: /sslmode=require|neon\.tech|supabase/.test(url) ? { rejectUnauthorized: false } : undefined });
  return {
    async query(text, params) {
      return (await pool.query(text, params as unknown[])).rows;
    },
    async tx(fn) {
      const client = await pool.connect();
      try {
        await client.query("begin");
        const r = await fn({ query: async (t, p) => (await client.query(t, p as unknown[])).rows });
        await client.query("commit");
        return r;
      } catch (e) {
        await client.query("rollback").catch(() => {});
        throw e;
      } finally {
        client.release();
      }
    },
    close: () => pool.end(),
  };
}

export async function connectPglite(dataDir?: string): Promise<Db> {
  const { PGlite } = await import("@electric-sql/pglite");
  const pg = new PGlite(dataDir);
  // PGlite tem uma conexão só: as transações rodam em fila para não se misturarem.
  let queue: Promise<unknown> = Promise.resolve();
  const serial = <T>(fn: () => Promise<T>) => {
    const run = queue.then(fn, fn);
    queue = run.catch(() => {});
    return run;
  };
  return {
    query: (text, params) => serial(async () => (await pg.query(text, params as unknown[])).rows as never),
    tx: (fn) => serial(() => pg.transaction((t) => fn({ query: async (text, params) => (await t.query(text, params as unknown[])).rows as never }))),
    close: () => pg.close(),
  };
}

export async function migrate(db: Db) {
  await db.query("create table if not exists schema_migrations (id text primary key, applied_at timestamptz not null default now())");
  const done = new Set((await db.query<{ id: string }>("select id from schema_migrations")).map((r) => r.id));
  for (const m of MIGRATIONS) {
    if (done.has(m.id)) continue;
    await db.tx(async (sql) => {
      // várias instâncias subindo juntas (serverless): só uma aplica cada migração
      await sql.query("select pg_advisory_xact_lock(727274)");
      if ((await sql.query("select 1 from schema_migrations where id = $1", [m.id])).length) return;
      for (const stmt of splitSql(m.sql)) await sql.query(stmt);
      await sql.query("insert into schema_migrations (id) values ($1)", [m.id]);
    });
  }
}

/** separa por ";" no fim de linha (as migrações não usam funções com ";" internos) */
const splitSql = (s: string) =>
  s
    .split(/;\s*$/m)
    .map((x) => x.replace(/--.*$/gm, "").trim())
    .filter(Boolean);

const g = globalThis as { __gsDb?: Promise<Db> };

/** Conexão única por processo, migrada e com o estoque sincronizado com o catálogo. */
export function getDb(): Promise<Db> {
  g.__gsDb ??= (async () => {
    if (env.mode === "preview") throw new Error("store_preview");
    let db: Db;
    if (env.databaseUrl) db = await connectPg(env.databaseUrl);
    else if (env.mode === "live") throw new Error("DATABASE_URL ausente em produção");
    else {
      const { mkdirSync } = await import("node:fs");
      mkdirSync(env.localDbPath, { recursive: true });
      db = await connectPglite(env.localDbPath);
    }
    if (env.autoMigrate) {
      await migrate(db);
      await syncCatalog(db);
    }
    return db;
  })().catch((e) => {
    g.__gsDb = undefined;
    throw e;
  });
  return g.__gsDb;
}

/** só para testes */
export function setDbForTests(db: Db | undefined) {
  g.__gsDb = db ? Promise.resolve(db) : undefined;
}
