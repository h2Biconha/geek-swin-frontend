import { currentCustomer } from "@/server/auth";
import { getDb } from "@/server/db";
import { storeRoute } from "@/server/http";
import { DROPS } from "@/lib/catalog";
import { earlyAccessEligible, getOrderView } from "@/server/orders";
import { json } from "@/server/security";

/** GET /api/me → conta logada e pedidos do mesmo e-mail (inclusive os feitos antes de criar a conta). */
export const GET = storeRoute(async () => {
  const db = await getDb();
  const c = await currentCustomer(db);
  if (!c) return json({ customer: null, orders: [], earlyAccess: [] });
  const ids = await db.query<{ id: string }>("select id from orders where email = $1 and status <> 'canceled' order by created_at desc limit 50", [c.email]);
  const orders = (await Promise.all(ids.map((o) => getOrderView(db, o.id)))).filter(Boolean);
  // drops em que esta conta pode comprar no acesso antecipado (o checkout confere de novo)
  const earlyAccess: string[] = [];
  for (const d of DROPS) if (d.earlyAccess?.enabled && (await earlyAccessEligible(db, d, c.email))) earlyAccess.push(d.number);
  return json({ customer: { email: c.email, name: c.name }, orders, earlyAccess });
});
