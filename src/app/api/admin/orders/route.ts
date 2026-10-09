import { isAdmin } from "@/server/auth";
import { getDb } from "@/server/db";
import { storeRoute } from "@/server/http";
import { getOrderView } from "@/server/orders";
import { json } from "@/server/security";

/** GET /api/admin/orders?status=paid → últimos 100 pedidos (com endereço, para despachar). */
export const GET = storeRoute(async (req) => {
  if (!(await isAdmin())) return json({ error: "nao_autorizado" }, 401);
  const status = new URL(req.url).searchParams.get("status");
  const db = await getDb();
  const rows = await db.query<{ id: string; note: string | null; phone: string }>(
    `select id, note, customer->>'phone' as phone from orders ${status ? "where status = $1" : ""} order by created_at desc limit 100`,
    status ? [status] : [],
  );
  const orders = await Promise.all(rows.map(async (r) => ({ ...(await getOrderView(db, r.id)), note: r.note, phone: r.phone })));
  return json({ orders });
});
