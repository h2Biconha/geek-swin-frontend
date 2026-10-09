import "server-only";
import { cookies } from "next/headers";
import type { Sql } from "./db";
import { env } from "./env";
import { loginMail, sendMail } from "./email";
import { hmac, randomToken, safeEqual, sha256 } from "./security";

/**
 * Conta sem senha: link mágico por e-mail (15 min, uso único) → sessão em cookie httpOnly (30 dias).
 * O banco guarda só o hash do token e da sessão.
 */
export const SESSION_COOKIE = "gs_session";
const SESSION_DAYS = 30;

export async function requestLoginLink(sql: Sql, email: string, next: string) {
  const token = randomToken();
  await sql.query("insert into login_tokens (token_hash, email, expires_at) values ($1, $2, now() + interval '15 minutes')", [sha256(token), email]);
  await sql.query("delete from login_tokens where expires_at < now() - interval '1 day'");
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/account";
  const link = `${env.siteUrl}/api/auth/callback?token=${token}&next=${encodeURIComponent(safeNext)}`;
  await sendMail(loginMail(email, link));
  // só em teste sem provedor de e-mail: devolve o link para quem está testando conseguir entrar
  return env.mode === "test" && env.email === "console" ? link : null;
}

/** troca o token por uma sessão; devolve o id da sessão (em claro, só para o cookie) */
export async function consumeLoginToken(sql: Sql, token: string): Promise<string | null> {
  const [row] = await sql.query<{ email: string }>(
    "update login_tokens set used_at = now() where token_hash = $1 and used_at is null and expires_at > now() returning email",
    [sha256(token)],
  );
  if (!row) return null;
  const id = `c_${sha256(row.email).slice(0, 20)}`;
  await sql.query("insert into customers (id, email) values ($1, $2) on conflict (email) do nothing", [id, row.email]);
  const [c] = await sql.query<{ id: string }>("select id from customers where email = $1", [row.email]);
  const session = randomToken();
  await sql.query(`insert into sessions (id_hash, customer_id, expires_at) values ($1, $2, now() + interval '${SESSION_DAYS} days')`, [sha256(session), c.id]);
  return session;
}

export const sessionCookie = (value: string, maxAge = SESSION_DAYS * 86400) => ({
  name: SESSION_COOKIE,
  value,
  httpOnly: true,
  secure: env.siteUrl.startsWith("https://"),
  sameSite: "lax" as const,
  path: "/",
  maxAge,
});

export async function currentCustomer(sql: Sql): Promise<{ id: string; email: string; name: string | null } | null> {
  const raw = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!raw) return null;
  const [c] = await sql.query<{ id: string; email: string; name: string | null }>(
    "select c.id, c.email, c.name from sessions s join customers c on c.id = s.customer_id where s.id_hash = $1 and s.expires_at > now()",
    [sha256(raw)],
  );
  return c ?? null;
}

export async function endSession(sql: Sql) {
  const raw = (await cookies()).get(SESSION_COOKIE)?.value;
  if (raw) await sql.query("delete from sessions where id_hash = $1", [sha256(raw)]);
}

/* ---------- painel (/admin): uma senha, cookie assinado de 12 h ---------- */
export const ADMIN_COOKIE = "gs_admin";
export const adminToken = () => {
  const exp = Date.now() + 12 * 3600_000;
  return `${exp}.${hmac(`admin:${exp}`)}`;
};
export async function isAdmin(): Promise<boolean> {
  if (!env.adminPassword) return false;
  const v = (await cookies()).get(ADMIN_COOKIE)?.value;
  if (!v) return false;
  const [exp, sig] = v.split(".");
  return Number(exp) > Date.now() && !!sig && safeEqual(hmac(`admin:${exp}`), sig);
}
export const checkAdminPassword = (p: string) => !!env.adminPassword && safeEqual(sha256(p), sha256(env.adminPassword));
