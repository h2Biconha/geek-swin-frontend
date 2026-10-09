import type { PaymentMethod, PixData } from "@/lib/commerce/types";

export type OrderForPayment = {
  id: string;
  accessToken: string;
  totalCents: number;
  method: PaymentMethod;
  maxInstallments: number;
  expiresAt: Date;
  payer: { email: string; name: string; cpf: string };
  lines: { slug: string; size: string; name: string; qty: number; unitCents: number }[];
  shippingCents: number;
  discountCents: number;
};

export type CreatedPayment = { providerRef: string; redirectUrl?: string; pix?: PixData };

/** estado confirmado PELO PROVEDOR (nunca pelo navegador) */
export type PaymentUpdate = { orderId: string; status: "paid" | "failed" | "pending" | "refunded"; amountCents?: number; providerRef?: string; detail?: string };

export type WebhookRef = { kind: "order" | "payment"; id: string; eventKey: string };

export interface PaymentProvider {
  id: "mercadopago" | "mock";
  createPayment(o: OrderForPayment): Promise<CreatedPayment>;
  /** valida assinatura e extrai o recurso a consultar; "invalid" = assinatura errada */
  parseWebhook(req: Request, rawBody: string): Promise<WebhookRef | "invalid" | "ignore">;
  /** consulta o provedor e devolve o estado verdadeiro do pagamento */
  fetchUpdate(ref: WebhookRef): Promise<PaymentUpdate | null>;
  /** consulta ativa (quando o webhook atrasa ou não chega) */
  reconcile(o: { id: string; providerRef: string | null; method: PaymentMethod }): Promise<PaymentUpdate | null>;
}
