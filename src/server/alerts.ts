import "server-only";
import { getProduct } from "@/lib/catalog";
import type { Db, Sql } from "./db";
import { restockMail, sendMail } from "./email";
import { env } from "./env";
import { readInventory } from "./inventory";
import { unsubscribeLink } from "./subscribers";

/**
 * "Avise-me quando voltar". O consentimento fica em `subscribers` (fonte "avise-me", com data e texto);
 * aqui fica O QUE a pessoa quer (peça + tamanho), um registro por pedido de aviso.
 * O aviso sai quando o painel volta a ter estoque daquele tamanho, uma vez só, com link de descadastro.
 * Nada promete reposição: a página da peça diz que o aviso só sai SE voltar.
 */
export async function addStockAlert(sql: Sql, email: string, slug: string, size: string | undefined) {
  await sql.query("insert into stock_alerts (email, product_slug, size) values ($1, $2, $3) on conflict (email, product_slug, size) do update set notified_at = null, created_at = now()", [email, slug, size ?? ""]);
}

/** envia os avisos pendentes da peça/tamanho que voltou a ter estoque. Devolve quantos saíram. */
export async function notifyRestock(db: Db, slug: string, size: string): Promise<number> {
  const p = getProduct(slug);
  if (!p) return 0;
  const left = (await readInventory(db, [slug]))[slug]?.sizes[size];
  if (left === 0 || left === undefined) return 0;
  const rows = await db.query<{ email: string; size: string }>(
    `select a.email, a.size from stock_alerts a
     where a.product_slug = $1 and (a.size = $2 or a.size = '') and a.notified_at is null
       and exists (select 1 from subscribers s where s.email = a.email and s.unsubscribed_at is null)`,
    [slug, size],
  );
  const sent = new Set<string>();
  for (const r of rows) {
    // um e-mail por pessoa, mesmo que ela tenha pedido aviso "qualquer tamanho" e "tamanho M"
    if (!sent.has(r.email)) await sendMail(restockMail({ to: r.email, product: p.name, size, link: `${env.siteUrl}/product/${slug}`, unsubscribe: unsubscribeLink(r.email) }));
    sent.add(r.email);
    await db.query("update stock_alerts set notified_at = now() where email = $1 and product_slug = $2 and size = $3", [r.email, slug, r.size]);
  }
  return sent.size;
}

/** interesse: avisos pendentes por peça e inscrições por fonte (lista do drop, categoria em preparação...) */
export async function demand(sql: Sql) {
  const alerts = await sql.query<{ product_slug: string; size: string; pending: number }>(
    "select product_slug, size, count(*)::int as pending from stock_alerts where notified_at is null group by 1, 2 order by 3 desc limit 100",
  );
  const sources = await sql.query<{ source: string; people: number }>("select source, count(*)::int as people from subscribers where unsubscribed_at is null group by 1 order by 2 desc");
  return { alerts, sources };
}
