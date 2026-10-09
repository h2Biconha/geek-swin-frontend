import "server-only";
import { env } from "../env";
import { hmac, safeEqual } from "../security";
import type { CreatedPayment, OrderForPayment, PaymentProvider, PaymentUpdate, WebhookRef } from "./types";

/**
 * Mercado Pago, via REST (sem SDK).
 * - Pix: API de Orders (POST /v1/orders, processing_mode automatic). O QR aparece no próprio site.
 * - Cartão: Checkout Pro (POST /checkout/preferences). A pessoa digita o cartão no ambiente do
 *   Mercado Pago e volta para /order/<id>. A GEEK SWIM nunca vê o número do cartão.
 * - Confirmação: webhook assinado (x-signature, HMAC-SHA256) → consulta da API → estado do pedido.
 *   O retorno do navegador NUNCA marca pedido como pago.
 * Docs: mercadopago.com.br/developers (Checkout API via Orders, Checkout Pro, Webhooks).
 */
const API = "https://api.mercadopago.com";
const money = (c: number) => (c / 100).toFixed(2);
const cents = (v: string | number | undefined | null) => (v == null ? undefined : Math.round(Number(v) * 100));

async function mp<T>(path: string, init: RequestInit & { idempotencyKey?: string } = {}): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${env.mpAccessToken}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(init.idempotencyKey ? { "X-Idempotency-Key": init.idempotencyKey } : {}),
      ...init.headers,
    },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) {
    // não logamos o corpo (pode conter dados do comprador)
    throw new Error(`mercadopago ${init.method ?? "GET"} ${path.split("?")[0]} → ${res.status}`);
  }
  return (await res.json()) as T;
}

type MpOrder = {
  id: string;
  status: string;
  status_detail?: string;
  external_reference?: string;
  total_amount?: string;
  total_paid_amount?: string;
  transactions?: { payments?: { id: string; status?: string; amount?: string; paid_amount?: string; date_of_expiration?: string; payment_method?: { qr_code?: string; qr_code_base64?: string; ticket_url?: string } }[] };
};
type MpPayment = { id: number; status: string; status_detail?: string; external_reference?: string; transaction_amount?: number };

function mapOrder(o: MpOrder): PaymentUpdate | null {
  if (!o.external_reference) return null;
  const s = o.status;
  const status: PaymentUpdate["status"] = s === "processed" ? "paid" : s === "refunded" ? "refunded" : s === "expired" || s === "canceled" || s === "failed" ? "failed" : "pending";
  return { orderId: o.external_reference, status, amountCents: cents(o.total_paid_amount ?? o.total_amount), providerRef: o.id, detail: o.status_detail };
}

function mapPayment(p: MpPayment): PaymentUpdate | null {
  if (!p.external_reference) return null;
  // no Checkout Pro uma tentativa recusada não encerra o pedido: a pessoa pode tentar outro cartão
  const status: PaymentUpdate["status"] = p.status === "approved" ? "paid" : p.status === "refunded" || p.status === "charged_back" ? "refunded" : "pending";
  return { orderId: p.external_reference, status, amountCents: cents(p.transaction_amount), providerRef: String(p.id), detail: p.status_detail };
}

export const mercadoPago: PaymentProvider = {
  id: "mercadopago",

  async createPayment(o: OrderForPayment): Promise<CreatedPayment> {
    const [first, ...rest] = o.payer.name.trim().split(/\s+/);
    if (o.method === "pix") {
      const minutes = Math.max(30, Math.round((o.expiresAt.getTime() - Date.now()) / 60000));
      const order = await mp<MpOrder>("/v1/orders", {
        method: "POST",
        idempotencyKey: `pix-${o.id}`,
        body: JSON.stringify({
          type: "online",
          processing_mode: "automatic",
          external_reference: o.id,
          total_amount: money(o.totalCents),
          payer: { email: o.payer.email, first_name: first, last_name: rest.join(" ") || undefined, identification: { type: "CPF", number: o.payer.cpf } },
          transactions: { payments: [{ amount: money(o.totalCents), payment_method: { id: "pix", type: "bank_transfer" }, expiration_time: `PT${minutes}M` }] },
        }),
      });
      const pay = order.transactions?.payments?.[0];
      const pm = pay?.payment_method;
      if (!pm?.qr_code) throw new Error("mercadopago: pix sem qr_code");
      return { providerRef: order.id, pix: { copyPaste: pm.qr_code, qrCodeBase64: pm.qr_code_base64 ?? null, ticketUrl: pm.ticket_url ?? null, expiresAt: pay?.date_of_expiration ?? o.expiresAt.toISOString() } };
    }

    const back = `${env.siteUrl}/order/${o.id}?t=${o.accessToken}`;
    const items = o.lines.map((l) => ({ id: `${l.slug}-${l.size}`, title: `${l.name} · ${l.size}`, quantity: l.qty, unit_price: Number(money(l.unitCents)), currency_id: "BRL" }));
    if (o.shippingCents > 0) items.push({ id: "frete", title: "Frete", quantity: 1, unit_price: Number(money(o.shippingCents)), currency_id: "BRL" });
    const pref = await mp<{ id: string; init_point: string; sandbox_init_point?: string }>("/checkout/preferences", {
      method: "POST",
      idempotencyKey: `pref-${o.id}`,
      body: JSON.stringify({
        items: o.discountCents > 0 ? [{ id: o.id, title: `Pedido ${o.id} · GEEK SWIM`, quantity: 1, unit_price: Number(money(o.totalCents)), currency_id: "BRL" }] : items,
        payer: { email: o.payer.email, name: first, surname: rest.join(" ") || undefined, identification: { type: "CPF", number: o.payer.cpf } },
        external_reference: o.id,
        notification_url: `${env.siteUrl}/api/webhooks/mercadopago`,
        back_urls: { success: back, pending: back, failure: back },
        auto_return: "approved",
        statement_descriptor: env.mpStatementDescriptor,
        // só cartão: Pix tem fluxo próprio no site, boleto não combina com reserva de 30 min
        payment_methods: { excluded_payment_types: [{ id: "ticket" }, { id: "bank_transfer" }, { id: "atm" }], installments: o.maxInstallments },
        expires: true,
        expiration_date_to: o.expiresAt.toISOString(),
      }),
    });
    return { providerRef: pref.id, redirectUrl: pref.init_point };
  },

  async parseWebhook(req, rawBody) {
    const url = new URL(req.url);
    let body: { type?: string; action?: string; data?: { id?: string } } = {};
    try {
      body = JSON.parse(rawBody || "{}");
    } catch {}
    const type = url.searchParams.get("type") ?? url.searchParams.get("topic") ?? body.type;
    const dataId = url.searchParams.get("data.id") ?? body.data?.id ?? url.searchParams.get("id");
    if (!dataId || (type !== "order" && type !== "payment")) return "ignore";

    // x-signature: "ts=...,v1=..."; manifesto "id:<data.id minúsculo>;request-id:<x-request-id>;ts:<ts>;"
    const sig = req.headers.get("x-signature") ?? "";
    const parts = Object.fromEntries(sig.split(",").map((p) => p.split("=").map((x) => x.trim()) as [string, string]));
    const reqId = req.headers.get("x-request-id");
    if (!parts.ts || !parts.v1 || !env.mpWebhookSecret) return "invalid";
    const manifest = `id:${dataId.toLowerCase()};${reqId ? `request-id:${reqId};` : ""}ts:${parts.ts};`;
    if (!safeEqual(hmac(manifest, env.mpWebhookSecret), parts.v1)) return "invalid";
    return { kind: type, id: dataId, eventKey: `${type}:${dataId}:${parts.ts}` };
  },

  async fetchUpdate(ref: WebhookRef) {
    if (ref.kind === "order") return mapOrder(await mp<MpOrder>(`/v1/orders/${encodeURIComponent(ref.id)}`));
    return mapPayment(await mp<MpPayment>(`/v1/payments/${encodeURIComponent(ref.id)}`));
  },

  async reconcile(o) {
    if (o.method === "pix") return o.providerRef ? mapOrder(await mp<MpOrder>(`/v1/orders/${encodeURIComponent(o.providerRef)}`)) : null;
    const r = await mp<{ results: MpPayment[] }>(`/v1/payments/search?external_reference=${encodeURIComponent(o.id)}&sort=date_created&criteria=desc`);
    const list = r.results ?? [];
    const best = list.find((p) => p.status === "approved") ?? list.find((p) => p.status === "refunded" || p.status === "charged_back") ?? list[0];
    return best ? mapPayment(best) : null;
  },
};
