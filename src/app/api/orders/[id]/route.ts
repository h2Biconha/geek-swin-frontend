import { currentCustomer } from "@/server/auth";
import { getDb } from "@/server/db";
import { storeRoute } from "@/server/http";
import { checkOrderToken, readOrderWithSync } from "@/server/orders";
import { json } from "@/server/security";

/**
 * GET /api/orders/:id?t=token → status do pedido.
 * Acesso: token do link (página de confirmação e e-mail) OU sessão da conta com o mesmo e-mail.
 * Resposta igual para "não existe" e "sem acesso" (não revela ids de outros pedidos).
 */
export const GET = storeRoute(async (req, ctx: RouteContext<"/api/orders/[id]">) => {
  const { id } = await ctx.params;
  const token = new URL(req.url).searchParams.get("t");
  const notFound = json({ error: "nao_encontrado", message: "Pedido não encontrado." }, 404);
  if (!/^GS-\d{6}$/.test(id)) return notFound;
  let allowed = checkOrderToken(id, token);
  const view = await readOrderWithSync(id);
  if (!view) return notFound;
  if (!allowed) {
    const c = await currentCustomer(await getDb());
    allowed = !!c && c.email === view.email;
  }
  return allowed ? json(view) : notFound;
});
