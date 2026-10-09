import { getDb } from "@/server/db";
import { env } from "@/server/env";
import { applyPaymentUpdate } from "@/server/orders";
import { getProvider } from "@/server/payments";
import { json } from "@/server/security";

/**
 * POST /api/webhooks/mercadopago (configure esta URL no painel do Mercado Pago, tópicos Order e Payments).
 * 1. valida a assinatura (x-signature) → 401 se inválida;
 * 2. registra o evento (idempotência);
 * 3. CONSULTA a API do Mercado Pago e aplica o estado verdadeiro. O corpo da notificação nunca é confiável.
 */
export async function POST(req: Request) {
  if (env.mode === "preview" || env.payment !== "mercadopago") return json({ ok: true, ignored: true });
  const raw = await req.text();
  const provider = getProvider();
  const ref = await provider.parseWebhook(req, raw);
  if (ref === "invalid") return json({ error: "assinatura_invalida" }, 401);
  if (ref === "ignore") return json({ ok: true, ignored: true });
  const db = await getDb();
  const fresh = await db.query("insert into payment_events (provider, event_key) values ('mercadopago', $1) on conflict (event_key) do nothing returning id", [ref.eventKey]);
  if (!fresh.length) return json({ ok: true, duplicate: true });
  try {
    const u = await provider.fetchUpdate(ref);
    if (u) {
      const status = await applyPaymentUpdate(u);
      await db.query("update payment_events set order_id = $2, status = $3 where event_key = $1", [ref.eventKey, u.orderId, status]);
    }
    return json({ ok: true });
  } catch (e) {
    // devolve 500 para o Mercado Pago tentar de novo, e apaga o registro para a nova tentativa contar
    await db.query("delete from payment_events where event_key = $1", [ref.eventKey]);
    console.error(`[webhook] ${ref.kind} ${ref.id}: ${(e as Error).message}`);
    return json({ error: "retry" }, 500);
  }
}
