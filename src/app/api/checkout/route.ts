import { getDb } from "@/server/db";
import { storeRoute } from "@/server/http";
import { createOrder } from "@/server/orders";
import { ipKey, json, rateLimit, readJson } from "@/server/security";
import { checkoutSchema, fieldErrors, normalizeItems } from "@/server/validation";

/**
 * POST /api/checkout → cria pedido pendente, reserva as peças e o pagamento.
 * Header Idempotency-Key: o mesmo valor devolve o mesmo pedido (clique duplo, rede instável).
 */
export const POST = storeRoute(
  async (req) => {
    const db = await getDb();
    if (!(await rateLimit(db, `checkout:${ipKey(req)}`, 10, 600))) return json({ error: "limite", message: "Muitas tentativas. Espere alguns minutos." }, 429);
    const parsed = checkoutSchema.safeParse(await readJson(req));
    if (!parsed.success) return json({ error: "dados_invalidos", message: "Confira os campos marcados.", fields: fieldErrors(parsed.error) }, 400);
    const { items, invalid } = normalizeItems(parsed.data.items);
    if (invalid.length || !items.length) return json({ error: "sem_estoque", message: "Uma peça da bag não existe mais. Revise a bag.", issues: invalid.map((i) => ({ ...i, reason: "inexistente" })) }, 409);
    const key = req.headers.get("idempotency-key");
    const r = await createOrder({ ...parsed.data, items }, key && /^[\w-]{16,80}$/.test(key) ? key : null);
    return r.ok ? json(r.body, 201) : json(r.body, r.status);
  },
  { mutate: true },
);
