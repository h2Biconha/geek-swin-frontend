/** Tipos do checkout. Contrato completo em BACKEND.md > Checkout. */
export type PaymentMethod = "pix" | "card" | "boleto";
export type PaymentProviderId = "mercadopago" | "stripe";

export type CheckoutPayload = {
  items: { slug: string; size: string; qty: number }[];
  customer: { email: string; name: string; cpf: string; phone: string };
  address: { cep: string; street: string; number: string; complement?: string; district: string; city: string; state: string };
  shippingId: string;
  payment: { method: PaymentMethod; installments?: number };
  coupon?: string;
};

export type CheckoutResult =
  | { ok: true; mode: "live"; orderId: string; redirectUrl?: string; pix?: { qrCode: string; copyPaste: string; expiresAt: string } }
  | { ok: true; mode: "demo"; orderId: string }
  | { ok: false; error: "sem_estoque" | "dados_invalidos" | "pagamento_recusado" | "rede"; message: string };

export type ShippingOption = { id: string; name: string; days: string; price: number };
