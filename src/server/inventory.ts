import "server-only";
import { PRODUCTS, type Inventory } from "@/lib/catalog";
import type { CartLine, LineIssue } from "@/lib/commerce/types";
import type { Db, Sql } from "./db";

/**
 * Estoque real. Duas travas, ambas no banco:
 * - inventory (por tamanho): `stock` null = produção sob demanda; número = unidades físicas.
 * - editions (por peça de drop): teto da tiragem numerada.
 * Disponível = estoque − reservado − vendido (nas duas travas). Reservas valem durante o pagamento.
 */

/** Cria as linhas que faltam a partir do catálogo. Nunca mexe em vendido/reservado. */
export async function syncCatalog(db: Db) {
  await db.tx(async (sql) => {
    for (const p of PRODUCTS) {
      for (const size of p.sizes) {
        await sql.query("insert into inventory (product_slug, size, stock) values ($1, $2, null) on conflict do nothing", [p.slug, size]);
      }
      if (p.edition != null) {
        await sql.query("insert into editions (product_slug, cap) values ($1, $2) on conflict (product_slug) do update set cap = excluded.cap", [p.slug, p.edition]);
      } else {
        await sql.query("delete from editions where product_slug = $1 and sold = 0 and reserved = 0", [p.slug]);
      }
    }
  });
}

/** Libera reservas de pedidos pendentes vencidos. Chamado antes de ler ou reservar estoque. */
export async function releaseExpired(db: Db) {
  await db.tx(async (sql) => {
    const expired = await sql.query<{ id: string }>(
      `update orders set status = 'expired', updated_at = now()
       where status = 'pending' and reserved_until < now()
       returning id`,
    );
    for (const o of expired) await releaseOrder(sql, o.id);
  });
}

export async function releaseOrder(sql: Sql, orderId: string) {
  const items = await sql.query<{ product_slug: string; size: string; qty: number }>("select product_slug, size, qty from order_items where order_id = $1", [orderId]);
  for (const i of items) {
    await sql.query("update inventory set reserved = greatest(reserved - $3, 0), updated_at = now() where product_slug = $1 and size = $2", [i.product_slug, i.size, i.qty]);
    await sql.query("update editions set reserved = greatest(reserved - $2, 0) where product_slug = $1", [i.product_slug, i.qty]);
  }
}

export async function readInventory(sql: Sql, slugs?: string[]): Promise<Record<string, Inventory>> {
  const filter = slugs?.length ? "where i.product_slug = any($1)" : "";
  const rows = await sql.query<{ product_slug: string; size: string; left: number | null; ed_left: number | null }>(
    `select i.product_slug, i.size,
            case when i.stock is null then null else greatest(i.stock - i.reserved - i.sold, 0) end as left,
            case when e.cap is null then null else greatest(e.cap - e.reserved - e.sold, 0) end as ed_left
     from inventory i left join editions e on e.product_slug = i.product_slug ${filter}`,
    slugs?.length ? [slugs] : [],
  );
  const out: Record<string, Inventory> = {};
  for (const r of rows) {
    const inv = (out[r.product_slug] ??= { sizes: {}, editionLeft: r.ed_left });
    // tamanho limitado pela tiragem também aparece esgotado quando a tiragem acaba
    inv.sizes[r.size] = r.ed_left === 0 ? 0 : r.left;
  }
  return out;
}

/** Reserva todas as linhas ou nenhuma (o chamador está numa transação). Devolve os problemas. */
export async function reserve(sql: Sql, lines: CartLine[]): Promise<LineIssue[]> {
  const issues: LineIssue[] = [];
  for (const l of lines) {
    const inv = await sql.query("update inventory set reserved = reserved + $3, updated_at = now() where product_slug = $1 and size = $2 and (stock is null or stock - reserved - sold >= $3) returning 1", [l.slug, l.size, l.qty]);
    if (!inv.length) {
      issues.push({ slug: l.slug, size: l.size, reason: "esgotado", ...(await availableFor(sql, l)) });
      continue;
    }
    const ed = await sql.query<{ product_slug: string }>("select product_slug from editions where product_slug = $1", [l.slug]);
    if (ed.length) {
      const ok = await sql.query("update editions set reserved = reserved + $2 where product_slug = $1 and cap - reserved - sold >= $2 returning 1", [l.slug, l.qty]);
      if (!ok.length) issues.push({ slug: l.slug, size: l.size, reason: "esgotado", ...(await availableFor(sql, l)) });
    }
  }
  return issues;
}

async function availableFor(sql: Sql, l: CartLine): Promise<{ available: number }> {
  const inv = (await readInventory(sql, [l.slug]))[l.slug];
  const s = inv?.sizes[l.size];
  const e = inv?.editionLeft;
  const n = [s, e].filter((x): x is number => x != null);
  return { available: n.length ? Math.min(...n) : 0 };
}

/**
 * Pagamento confirmado: reserva vira venda e cada peça de tiragem recebe seu número.
 * `fromReservation=false` (pedido que expirou e foi pago depois): tenta vender direto do disponível.
 * Devolve false se não houver peça (pedido vai para revisão manual e estorno).
 */
export async function commitOrder(sql: Sql, orderId: string, fromReservation: boolean): Promise<boolean> {
  const items = await sql.query<{ line: number; product_slug: string; size: string; qty: number }>("select line, product_slug, size, qty from order_items where order_id = $1 order by line", [orderId]);
  for (const i of items) {
    const inv = fromReservation
      ? await sql.query("update inventory set reserved = greatest(reserved - $3, 0), sold = sold + $3, updated_at = now() where product_slug = $1 and size = $2 returning 1", [i.product_slug, i.size, i.qty])
      : await sql.query("update inventory set sold = sold + $3, updated_at = now() where product_slug = $1 and size = $2 and (stock is null or stock - reserved - sold >= $3) returning 1", [i.product_slug, i.size, i.qty]);
    if (!inv.length) return false;
    const ed = fromReservation
      ? await sql.query<{ sold: number }>("update editions set reserved = greatest(reserved - $2, 0), sold = sold + $2 where product_slug = $1 returning sold", [i.product_slug, i.qty])
      : await sql.query<{ sold: number }>("update editions set sold = sold + $2 where product_slug = $1 and cap - reserved - sold >= $2 returning sold", [i.product_slug, i.qty]);
    const hasEdition = (await sql.query("select 1 from editions where product_slug = $1", [i.product_slug])).length > 0;
    if (hasEdition && !ed.length) return false;
    if (ed.length) {
      const to = ed[0].sold;
      await sql.query("update order_items set edition_from = $3, edition_to = $4 where order_id = $1 and line = $2", [orderId, i.line, to - i.qty + 1, to]);
    }
  }
  return true;
}
