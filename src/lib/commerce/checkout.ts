import type { CheckoutCreated, CheckoutError, CheckoutPayload, OrderView, QuoteRequest, QuoteResponse } from "./types";
import { STORE_CONNECTED } from "../mode";
import { computeTotals, tableShipping } from "./pricing";

/**
 * Cliente do checkout. O navegador NUNCA fala com o Mercado Pago com chave: chama as rotas do próprio site,
 * que recalculam preço e estoque e criam o pagamento no servidor.
 * Sem servidor (modo prévia) as funções devolvem a simulação local, e a interface avisa que nada é cobrado.
 */
async function post<T>(url: string, body: unknown, headers: Record<string, string> = {}): Promise<{ status: number; data: T }> {
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json", ...headers }, body: JSON.stringify(body) });
  let data: unknown = null;
  try {
    data = await res.json();
  } catch {}
  return { status: res.status, data: data as T };
}

const offline: CheckoutError = { error: "erro", message: "Sem conexão. Nada foi cobrado. Confira a internet e tente de novo." };

export async function getQuote(req: QuoteRequest): Promise<QuoteResponse | CheckoutError> {
  if (!STORE_CONNECTED) {
    const cep = req.cep?.replace(/\D/g, "") ?? "";
    const t = computeTotals({ items: req.items, method: req.method, shipping: null, cep: cep || null });
    return {
      lines: t.lines,
      issues: [],
      shippingOptions: cep.length === 8 ? tableShipping(t, cep) : null,
      subtotalCents: t.subtotalCents,
      bundleCents: t.bundleCents,
      bundles: t.bundles,
      benefitCents: t.benefitCents,
      couponCents: 0,
      pixCents: t.pixCents,
      coupon: req.coupon ? { code: req.coupon, ok: false, message: "Prévia: cupons funcionam com a loja conectada." } : null,
      freeShipping: t.freeShipping,
    };
  }
  try {
    const r = await post<QuoteResponse | CheckoutError>("/api/checkout/quote", req);
    return r.data ?? offline;
  } catch {
    return offline;
  }
}

export async function createCheckout(payload: CheckoutPayload, idempotencyKey: string): Promise<CheckoutCreated | CheckoutError> {
  if (!STORE_CONNECTED) return { error: "loja_offline", message: "Prévia da loja: o pagamento ainda não está conectado e nada foi cobrado." };
  try {
    const r = await post<CheckoutCreated | CheckoutError>("/api/checkout", payload, { "Idempotency-Key": idempotencyKey });
    return r.data ?? offline;
  } catch {
    return offline;
  }
}

export async function fetchOrder(id: string, token: string | null): Promise<OrderView | null | "erro"> {
  try {
    const res = await fetch(`/api/orders/${encodeURIComponent(id)}${token ? `?t=${encodeURIComponent(token)}` : ""}`, { cache: "no-store" });
    if (res.status === 404) return null;
    if (!res.ok) return "erro";
    return (await res.json()) as OrderView;
  } catch {
    return "erro";
  }
}

export async function lookupCep(cep: string) {
  // ViaCEP é público e gratuito; funciona no navegador sem chave.
  const d = cep.replace(/\D/g, "");
  if (d.length !== 8) return null;
  try {
    const r = await fetch(`https://viacep.com.br/ws/${d}/json/`, { signal: AbortSignal.timeout(6000) });
    const j = await r.json();
    if (j.erro) return null;
    return { street: j.logradouro as string, district: j.bairro as string, city: j.localidade as string, state: j.uf as string };
  } catch {
    return null;
  }
}

export const isError = (r: unknown): r is CheckoutError => !!r && typeof r === "object" && "error" in r;
