/** Tipos do checkout, compartilhados entre navegador e servidor. Contrato em BACKEND.md > Checkout. */
export type PaymentMethod = "pix" | "card";

export type CartLine = { slug: string; size: string; qty: number };

export type CheckoutCustomer = { email: string; name: string; cpf: string; phone: string };
export type CheckoutAddress = { cep: string; street: string; number: string; complement?: string; district: string; city: string; state: string };

export type CheckoutPayload = {
  items: CartLine[];
  customer: CheckoutCustomer;
  address: CheckoutAddress;
  shippingId: string;
  payment: { method: PaymentMethod; installments?: number };
  coupon?: string;
  /** aceite dos termos e da política de privacidade */
  accept: true;
};

export type QuoteRequest = { items: CartLine[]; cep?: string; method: PaymentMethod; coupon?: string };

export type LineIssue = { slug: string; size: string; reason: "esgotado" | "quantidade" | "indisponivel" | "inexistente"; available?: number };

export type QuoteResponse = {
  lines: { slug: string; size: string; qty: number; name: string; unitCents: number; lineCents: number }[];
  issues: LineIssue[];
  shippingOptions: { id: string; name: string; days: string; priceCents: number }[] | null;
  subtotalCents: number;
  couponCents: number;
  pixCents: number;
  coupon: { code: string; ok: boolean; message: string } | null;
  freeShipping: boolean;
};

export type PixData = { qrCodeBase64: string | null; copyPaste: string; expiresAt: string | null; ticketUrl?: string | null };

export type OrderStatus = "pending" | "paid" | "shipped" | "delivered" | "expired" | "canceled" | "refunded" | "needs_review";

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "Aguardando pagamento",
  paid: "Pago · em preparação",
  shipped: "Postado",
  delivered: "Entregue",
  expired: "Expirado",
  canceled: "Cancelado",
  refunded: "Estornado",
  needs_review: "Em análise",
};


export type CheckoutCreated = { orderId: string; accessToken: string; status: OrderStatus; redirectUrl?: string; pix?: PixData };

export type CheckoutError = {
  error: "sem_estoque" | "dados_invalidos" | "fora_de_venda" | "pagamento_indisponivel" | "limite" | "loja_offline" | "erro";
  message: string;
  issues?: LineIssue[];
  fields?: Record<string, string>;
};

/** visão pública do pedido (o que a página do pedido e a conta mostram) */
export type OrderView = {
  id: string;
  status: OrderStatus;
  createdAt: string;
  paidAt: string | null;
  email: string;
  customerName: string;
  items: { slug: string; size: string; qty: number; name: string; unitCents: number; editionFrom: number | null; editionTo: number | null }[];
  subtotalCents: number;
  discountCents: number;
  shippingCents: number;
  totalCents: number;
  shipping: { id: string; name: string; days: string };
  addressLine: string;
  paymentMethod: PaymentMethod;
  installments: number;
  presale: boolean;
  shipsFrom: string | null;
  reservedUntil: string | null;
  trackingCode: string | null;
  pix: PixData | null;
  redirectUrl: string | null;
  testMode: boolean;
};
