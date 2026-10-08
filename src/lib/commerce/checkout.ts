import type { CheckoutPayload, CheckoutResult, ShippingOption } from "./types";
import { track } from "../analytics";
import { FREE_SHIPPING_FROM } from "../catalog";

/**
 * Cliente do checkout. O navegador NUNCA fala direto com Mercado Pago ou Stripe:
 * chama a rota do próprio site (NEXT_PUBLIC_CHECKOUT_URL, ex.: /api/checkout), que usa o adaptador
 * do gateway em src/lib/commerce/providers/ com a chave guardada no servidor.
 *
 * Sem NEXT_PUBLIC_CHECKOUT_URL o checkout roda em MODO DEMONSTRAÇÃO: nenhum pagamento é criado e a
 * tela de confirmação diz isso com todas as letras.
 */
const CHECKOUT_URL = process.env.NEXT_PUBLIC_CHECKOUT_URL;
const SHIPPING_URL = process.env.NEXT_PUBLIC_SHIPPING_URL;
export const CHECKOUT_MODE: "live" | "demo" = CHECKOUT_URL ? "live" : "demo";

export async function quoteShipping(cep: string, subtotal: number): Promise<ShippingOption[]> {
  if (SHIPPING_URL) {
    const res = await fetch(SHIPPING_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ cep }) });
    if (!res.ok) throw new Error("frete");
    return (await res.json()).options;
  }
  // DEMONSTRAÇÃO: valores fixos de exemplo, só para a interface funcionar. O real vem do Melhor Envio/Correios.
  await new Promise((r) => setTimeout(r, 450));
  const free = subtotal >= FREE_SHIPPING_FROM;
  return [
    { id: "pac", name: "Econômico", days: "6 a 9 dias úteis", price: free ? 0 : 24.9 },
    { id: "sedex", name: "Expresso", days: "2 a 4 dias úteis", price: 39.9 },
  ];
}

export async function lookupCep(cep: string) {
  // ViaCEP é público e gratuito; funciona no navegador sem chave.
  const d = cep.replace(/\D/g, "");
  if (d.length !== 8) return null;
  try {
    const r = await fetch(`https://viacep.com.br/ws/${d}/json/`);
    const j = await r.json();
    if (j.erro) return null;
    return { street: j.logradouro as string, district: j.bairro as string, city: j.localidade as string, state: j.uf as string };
  } catch {
    return null;
  }
}

export async function createCheckout(payload: CheckoutPayload): Promise<CheckoutResult> {
  track("begin_checkout", { items: payload.items.length, method: payload.payment.method });
  if (!CHECKOUT_URL) {
    await new Promise((r) => setTimeout(r, 1100));
    return { ok: true, mode: "demo", orderId: "DEMO-" + Math.random().toString(36).slice(2, 8).toUpperCase() };
  }
  try {
    const res = await fetch(CHECKOUT_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const j = await res.json();
    if (res.status === 409) return { ok: false, error: "sem_estoque", message: "Um tamanho esgotou enquanto você finalizava. Revise a bag." };
    if (!res.ok) return { ok: false, error: j.error ?? "dados_invalidos", message: j.message ?? "Confira os dados e tente de novo." };
    return { ok: true, mode: "live", ...j };
  } catch {
    return { ok: false, error: "rede", message: "Sem conexão com o pagamento. Nada foi cobrado. Tente de novo." };
  }
}

export async function validateCoupon(code: string): Promise<{ ok: boolean; message: string }> {
  await new Promise((r) => setTimeout(r, 400));
  void code;
  return { ok: false, message: CHECKOUT_URL ? "Cupom inválido ou expirado." : "Prévia: cupons entram junto com o back-end." };
}
