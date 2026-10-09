import "server-only";
import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import type { Sql } from "./db";
import { env, secret } from "./env";

export const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");
export const randomToken = (bytes = 32) => randomBytes(bytes).toString("base64url");
export const hmac = (data: string, key = secret()) => createHmac("sha256", key).update(data).digest("hex");

export function safeEqual(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

/** IP do cliente (atrás da Vercel/proxy). Guardamos só o hash, nunca o IP. */
export function clientIp(req: Request) {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "0.0.0.0";
}
export const ipKey = (req: Request) => hmac(clientIp(req)).slice(0, 24);

/**
 * Proteção contra CSRF para rotas que mudam estado: o navegador sempre manda Origin em POST.
 * Aceita só a origem do próprio site (e a do pedido, para localhost/preview).
 */
export function sameOrigin(req: Request) {
  const origin = req.headers.get("origin");
  if (!origin) return false;
  const self = new URL(req.url).origin;
  return origin === self || origin === env.siteUrl;
}

/** Rate limit por janela fixa, guardado no banco (funciona com várias instâncias serverless). */
export async function rateLimit(sql: Sql, key: string, limit: number, windowSec: number): Promise<boolean> {
  const bucket = new Date(Math.floor(Date.now() / (windowSec * 1000)) * windowSec * 1000).toISOString();
  const [row] = await sql.query<{ count: number }>(
    `insert into rate_limits (key, bucket, count) values ($1, $2, 1)
     on conflict (key, bucket) do update set count = rate_limits.count + 1
     returning count`,
    [key, bucket],
  );
  if (Math.random() < 0.02) await sql.query("delete from rate_limits where bucket < now() - interval '1 day'");
  return row.count <= limit;
}

/** corpo JSON com limite de tamanho (evita payload gigante) */
export async function readJson<T = unknown>(req: Request, maxBytes = 32_000): Promise<T | null> {
  const text = await req.text();
  if (text.length > maxBytes) return null;
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

export const json = (body: unknown, status = 200, headers: Record<string, string> = {}) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store", ...headers } });
