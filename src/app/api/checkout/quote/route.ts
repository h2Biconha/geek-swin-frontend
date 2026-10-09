import { currentCustomer } from "@/server/auth";
import { getDb } from "@/server/db";
import { storeRoute } from "@/server/http";
import { quote } from "@/server/orders";
import { json, readJson } from "@/server/security";
import { normalizeItems, quoteSchema } from "@/server/validation";

/** POST /api/checkout/quote → preço, frete e cupom calculados no servidor. Não reserva nada. */
export const POST = storeRoute(
  async (req) => {
    const parsed = quoteSchema.safeParse(await readJson(req));
    if (!parsed.success) return json({ error: "dados_invalidos", message: "Bag inválida." }, 400);
    const { items, invalid } = normalizeItems(parsed.data.items);
    const viewer = await currentCustomer(await getDb());
    const q = await quote({ ...parsed.data, items }, viewer?.email ?? null);
    return json({ ...q, issues: [...q.issues, ...invalid.map((i) => ({ ...i, reason: "inexistente" as const }))] });
  },
  { mutate: true },
);
