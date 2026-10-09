import { z } from "zod";
import { isAdmin } from "@/server/auth";
import { getDb } from "@/server/db";
import { storeRoute } from "@/server/http";
import { releaseOrder } from "@/server/inventory";
import { json, readJson } from "@/server/security";

const schema = z.object({ action: z.enum(["ship", "deliver", "cancel", "note"]), trackingCode: z.string().trim().max(60).optional(), note: z.string().max(500).optional() });

/**
 * PATCH /api/admin/orders/:id → postar (com rastreio), entregar, cancelar pendente, anotar.
 * Estorno de pedido pago é feito no Mercado Pago; o webhook muda o status para "refunded".
 */
export const PATCH = storeRoute(
  async (req, ctx: RouteContext<"/api/admin/orders/[id]">) => {
    if (!(await isAdmin())) return json({ error: "nao_autorizado" }, 401);
    const { id } = await ctx.params;
    const p = schema.safeParse(await readJson(req, 2000));
    if (!p.success) return json({ error: "dados_invalidos" }, 400);
    const db = await getDb();
    const { action, trackingCode, note } = p.data;
    const done = await db.tx(async (sql) => {
      const [o] = await sql.query<{ status: string }>("select status from orders where id = $1 for update", [id]);
      if (!o) return "nao_encontrado";
      if (action === "ship" && o.status === "paid") await sql.query("update orders set status = 'shipped', tracking_code = $2, updated_at = now() where id = $1", [id, trackingCode ?? null]);
      else if (action === "deliver" && o.status === "shipped") await sql.query("update orders set status = 'delivered', updated_at = now() where id = $1", [id]);
      else if (action === "cancel" && o.status === "pending") {
        await sql.query("update orders set status = 'canceled', note = 'cancelado no painel', updated_at = now() where id = $1", [id]);
        await releaseOrder(sql, id);
      } else if (action === "note") await sql.query("update orders set note = $2, updated_at = now() where id = $1", [id, note ?? null]);
      else return "transicao_invalida";
      return "ok";
    });
    return done === "ok" ? json({ ok: true }) : json({ error: done }, done === "nao_encontrado" ? 404 : 409);
  },
  { mutate: true },
);
