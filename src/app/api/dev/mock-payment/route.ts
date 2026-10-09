import { env } from "@/server/env";
import { storeRoute } from "@/server/http";
import { applyPaymentUpdate, checkOrderToken } from "@/server/orders";
import { json, readJson } from "@/server/security";

/**
 * SÓ EM MODO TESTE com PAYMENT_PROVIDER=mock: simula a confirmação do gateway.
 * Passa pelo mesmo applyPaymentUpdate do webhook real. Em produção responde 404.
 */
export const POST = storeRoute(
  async (req) => {
    if (env.mode !== "test" || env.payment !== "mock") return json({ error: "nao_encontrado" }, 404);
    const b = await readJson<{ orderId?: string; token?: string; outcome?: "paid" | "failed"; amountCents?: number }>(req);
    if (!b?.orderId || !checkOrderToken(b.orderId, b.token ?? null) || (b.outcome !== "paid" && b.outcome !== "failed")) return json({ error: "dados_invalidos" }, 400);
    const status = await applyPaymentUpdate({ orderId: b.orderId, status: b.outcome, amountCents: b.amountCents, providerRef: `MOCK-${b.orderId}` });
    return json({ status });
  },
  { mutate: true },
);
