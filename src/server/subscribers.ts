import "server-only";
import { CONSENT_TEXT } from "@/lib/consentText";
import type { Sql } from "./db";
import { env } from "./env";
import { hmac, safeEqual } from "./security";

/**
 * Lista (e-mail e, opcional, WhatsApp). LGPD: guarda quando e com qual texto a pessoa consentiu,
 * para quê (source) e oferece descadastro em um clique (link com token assinado).
 */
export { CONSENT_TEXT };

export const unsubscribeToken = (email: string) => hmac(`unsub:${email}`).slice(0, 32);
export const unsubscribeLink = (email: string) => `${env.siteUrl}/unsubscribe?e=${encodeURIComponent(email)}&t=${unsubscribeToken(email)}`;

export async function addSubscriber(sql: Sql, s: { email: string; source: string; whatsapp?: string; product?: string; size?: string }) {
  const rows = await sql.query<{ inserted: boolean }>(
    `insert into subscribers (email, source, product_slug, size, whatsapp, consent_at, consent_text, unsubscribe_hash)
     values ($1, $2, $3, $4, $5, now(), $6, $7)
     on conflict (email, source) do update set
       whatsapp = coalesce(excluded.whatsapp, subscribers.whatsapp),
       product_slug = coalesce(excluded.product_slug, subscribers.product_slug),
       size = coalesce(excluded.size, subscribers.size),
       consent_at = now(), consent_text = excluded.consent_text, unsubscribed_at = null
     returning (xmax = 0) as inserted`,
    [s.email, s.source, s.product ?? null, s.size ?? null, s.whatsapp || null, CONSENT_TEXT, unsubscribeToken(s.email)],
  );
  return rows[0]?.inserted ?? true;
}

export async function unsubscribe(sql: Sql, email: string, token: string) {
  if (!safeEqual(unsubscribeToken(email), token)) return false;
  await sql.query("update subscribers set unsubscribed_at = now() where email = $1 and unsubscribed_at is null", [email]);
  return true;
}
