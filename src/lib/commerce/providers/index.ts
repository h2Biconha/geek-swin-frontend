import "server-only";
import type { CheckoutPayload, PaymentProviderId } from "../types";

/**
 * Adaptadores de pagamento (SÓ SERVIDOR). Nenhum está implementado ainda.
 * A rota /api/checkout escolhe o adaptador por PAYMENT_PROVIDER e chama createPayment.
 *
 * Mercado Pago: Pix (QR + copia e cola), cartão em até 12x, boleto. SDK: mercadopago (npm). Webhook: /api/webhooks/payment.
 * Stripe: cartão internacional, Pix e boleto disponíveis no Brasil. SDK: stripe (npm). Webhook com assinatura.
 */
export type CreatedPayment = { providerRef: string; redirectUrl?: string; pix?: { qrCode: string; copyPaste: string; expiresAt: string } };

export interface PaymentProvider {
  id: PaymentProviderId;
  createPayment(order: { id: string; totalCents: number; payload: CheckoutPayload }): Promise<CreatedPayment>;
  verifyWebhook(rawBody: string, headers: Headers): Promise<{ orderId: string; status: "paid" | "failed" | "pending" } | null>;
}

export function getProvider(): PaymentProvider {
  const id = (process.env.PAYMENT_PROVIDER ?? "mercadopago") as PaymentProviderId;
  throw new Error(`Gateway "${id}" ainda não implementado. Ver BACKEND.md > Pagamento.`);
}
