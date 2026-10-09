import "server-only";
import type { Coupon } from "@/lib/commerce/pricing";
import type { Sql } from "./db";

/**
 * Cupons ficam na tabela `coupons` (não há cupom cadastrado por padrão).
 * Exemplo: insert into coupons (code, kind, value, max_uses) values ('LOBBY10', 'percent', 10, 200);
 */
export async function findCoupon(sql: Sql, code: string | undefined, subtotalCents: number): Promise<{ coupon: Coupon | null; message: string; ok: boolean } | null> {
  if (!code) return null;
  const c = code.trim().toUpperCase().slice(0, 40);
  const [row] = await sql.query<{ code: string; kind: "percent" | "fixed"; value: number; min_subtotal_cents: number; ok_time: boolean; ok_uses: boolean; active: boolean }>(
    `select code, kind, value, min_subtotal_cents, active,
            (starts_at is null or starts_at <= now()) and (ends_at is null or ends_at > now()) as ok_time,
            (max_uses is null or uses < max_uses) as ok_uses
     from coupons where code = $1`,
    [c],
  );
  if (!row || !row.active || !row.ok_time || !row.ok_uses) return { coupon: null, ok: false, message: "Cupom inválido ou expirado." };
  if (subtotalCents < row.min_subtotal_cents) return { coupon: null, ok: false, message: `Esse cupom vale a partir de R$ ${(row.min_subtotal_cents / 100).toFixed(2).replace(".", ",")}.` };
  return { coupon: { code: row.code, kind: row.kind, value: row.value, minSubtotalCents: row.min_subtotal_cents }, ok: true, message: row.kind === "percent" ? `${row.value}% aplicado.` : "Desconto aplicado." };
}
