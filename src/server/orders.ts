import "server-only";
import { COMMERCE, dropPhase, getDrop, getProduct, isPurchasablePhase } from "@/lib/catalog";
import { computeTotals, type ShippingQuote } from "@/lib/commerce/pricing";
import type { CartLine, CheckoutCreated, CheckoutError, LineIssue, OrderStatus, OrderView, PixData, QuoteResponse } from "@/lib/commerce/types";
import { findCoupon } from "./coupons";
import { getDb, type Db, type Sql } from "./db";
import { adminAlertMail, orderPaidMail, sendMail } from "./email";
import { env } from "./env";
import { commitOrder, readInventory, releaseExpired, releaseOrder, reserve } from "./inventory";
import { getProvider, type PaymentUpdate } from "./payments";
import { hmac, safeEqual, sha256 } from "./security";
import { quoteShipping } from "./shipping";
import type { CheckoutInput } from "./validation";

/** token de acesso ao pedido (vai no link do e-mail e da página do pedido). Derivado, não guardado em claro. */
export const orderToken = (id: string) => hmac(`order:${id}`).slice(0, 40);
export const checkOrderToken = (id: string, token: string | null) => !!token && safeEqual(orderToken(id), token);

/** peças fora de venda agora (drop ainda não abriu, encerrado, esgotado) */
function phaseIssues(items: CartLine[], now = Date.now()): LineIssue[] {
  return items.flatMap((i): LineIssue[] => {
    const p = getProduct(i.slug);
    if (!p) return [{ slug: i.slug, size: i.size, reason: "inexistente" as const }];
    const d = p.drop ? getDrop(p.drop) : undefined;
    return d && !isPurchasablePhase(dropPhase(d, now)) ? [{ slug: i.slug, size: i.size, reason: "indisponivel" as const }] : [];
  });
}

async function stockIssues(sql: Sql, items: CartLine[]): Promise<LineIssue[]> {
  const inv = await readInventory(sql, items.map((i) => i.slug));
  const issues: LineIssue[] = [];
  // a tiragem é compartilhada entre os tamanhos da mesma peça
  const editionUse = new Map<string, number>();
  for (const i of items) {
    const v = inv[i.slug];
    const size = v?.sizes[i.size];
    const usedEd = (editionUse.get(i.slug) ?? 0) + i.qty;
    editionUse.set(i.slug, usedEd);
    const sizeLeft = size === undefined ? 0 : size;
    if (sizeLeft === 0 || v?.editionLeft === 0) issues.push({ slug: i.slug, size: i.size, reason: "esgotado", available: 0 });
    else if ((sizeLeft != null && sizeLeft < i.qty) || (v?.editionLeft != null && v.editionLeft < usedEd))
      issues.push({ slug: i.slug, size: i.size, reason: "quantidade", available: Math.min(sizeLeft ?? Infinity, (v?.editionLeft ?? Infinity) - (usedEd - i.qty)) });
  }
  return issues;
}

export function linesFrom(items: CartLine[]) {
  return computeTotals({ items, method: "card", shipping: null }).lines;
}

/** Cotação: preço, frete, cupom e problemas de estoque. Não reserva nada. */
export async function quote(input: { items: CartLine[]; cep?: string; method: "pix" | "card"; coupon?: string }): Promise<QuoteResponse> {
  const db = await getDb();
  await releaseExpired(db);
  const issues = [...phaseIssues(input.items), ...(await stockIssues(db, input.items))];
  const base = computeTotals({ items: input.items, method: input.method, shipping: null });
  const c = await findCoupon(db, input.coupon, base.subtotalCents);
  const t = computeTotals({ items: input.items, method: input.method, shipping: null, coupon: c?.coupon });
  const shippingOptions = input.cep && input.cep.replace(/\D/g, "").length === 8 ? await quoteShipping(input.cep.replace(/\D/g, ""), input.items, t.subtotalCents) : null;
  return {
    lines: t.lines,
    issues,
    shippingOptions,
    subtotalCents: t.subtotalCents,
    couponCents: t.couponCents,
    pixCents: t.pixCents,
    coupon: c ? { code: input.coupon!.toUpperCase(), ok: c.ok, message: c.message } : null,
    freeShipping: t.freeShipping,
  };
}

type Created = { ok: true; body: CheckoutCreated } | { ok: false; status: number; body: CheckoutError };

/** Cria o pedido: valida, recalcula tudo no servidor, reserva o estoque e cria o pagamento. */
export async function createOrder(input: CheckoutInput & { items: CartLine[] }, idempotencyKey: string | null): Promise<Created> {
  const db = await getDb();

  if (idempotencyKey) {
    const [dup] = await db.query<{ id: string }>("select id from orders where idempotency_key = $1", [idempotencyKey]);
    if (dup) return { ok: true, body: await createdBody(db, dup.id) };
  }

  await releaseExpired(db);
  const blocked = phaseIssues(input.items);
  if (blocked.length) return { ok: false, status: 409, body: { error: "fora_de_venda", message: "Uma peça da bag não está à venda agora.", issues: blocked } };

  const base = computeTotals({ items: input.items, method: input.payment.method, shipping: null });
  const options = await quoteShipping(input.address.cep, input.items, base.subtotalCents);
  const ship: ShippingQuote | undefined = options.find((o) => o.id === input.shippingId);
  if (!ship) return { ok: false, status: 400, body: { error: "dados_invalidos", message: "Escolha o frete de novo: as opções mudaram.", fields: { shippingId: "Frete inválido." } } };
  const c = await findCoupon(db, input.coupon, base.subtotalCents);
  if (input.coupon && !c?.ok) return { ok: false, status: 400, body: { error: "dados_invalidos", message: c?.message ?? "Cupom inválido.", fields: { coupon: c?.message ?? "Cupom inválido." } } };
  const t = computeTotals({ items: input.items, method: input.payment.method, shipping: ship, coupon: c?.coupon });

  const presaleDrop = input.items.map((i) => getProduct(i.slug)!).map((p) => (p.drop ? getDrop(p.drop) : undefined)).find((d) => d && dropPhase(d, Date.now()) === "presale");
  const reservedUntil = new Date(Date.now() + COMMERCE.reservationMinutes * 60_000);

  let orderId = "";
  try {
    orderId = await db.tx(async (sql) => {
      const [{ n }] = await sql.query<{ n: number }>("select nextval('order_seq')::int as n");
      const id = `GS-${String(n).padStart(6, "0")}`;
      await sql.query(
        `insert into orders (id, access_hash, idempotency_key, status, email, customer, address, shipping, subtotal_cents, shipping_cents, discount_cents, total_cents,
           coupon, payment_method, installments, provider, presale, ships_from, reserved_until)
         values ($1,$2,$3,'pending',$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)`,
        [
          id,
          sha256(orderToken(id)),
          idempotencyKey,
          input.customer.email,
          JSON.stringify(input.customer),
          JSON.stringify(input.address),
          JSON.stringify({ id: ship.id, name: ship.name, days: ship.days }),
          t.subtotalCents,
          t.shippingCents,
          t.discountCents,
          t.totalCents,
          c?.coupon?.code ?? null,
          input.payment.method,
          input.payment.installments ?? 1,
          getProvider().id,
          !!presaleDrop,
          presaleDrop?.shipsFrom ?? null,
          reservedUntil.toISOString(),
        ],
      );
      for (const l of t.lines) await sql.query("insert into order_items (order_id, product_slug, size, qty, unit_cents, name) values ($1,$2,$3,$4,$5,$6)", [id, l.slug, l.size, l.qty, l.unitCents, l.name]);
      const issues = await reserve(sql, input.items);
      if (issues.length) throw Object.assign(new Error("sem_estoque"), { issues });
      return id;
    });
  } catch (e) {
    const issues = (e as { issues?: LineIssue[] }).issues;
    if (issues) return { ok: false, status: 409, body: { error: "sem_estoque", message: "Uma peça esgotou enquanto você finalizava. Revise a bag.", issues } };
    if (String((e as Error).message).includes("idempotency_key")) {
      const [dup] = await db.query<{ id: string }>("select id from orders where idempotency_key = $1", [idempotencyKey]);
      if (dup) return { ok: true, body: await createdBody(db, dup.id) };
    }
    throw e;
  }

  try {
    const created = await getProvider().createPayment({
      id: orderId,
      accessToken: orderToken(orderId),
      totalCents: t.totalCents,
      method: input.payment.method,
      maxInstallments: COMMERCE.installments,
      expiresAt: reservedUntil,
      payer: { email: input.customer.email, name: input.customer.name, cpf: input.customer.cpf },
      lines: t.lines,
      shippingCents: t.shippingCents,
      discountCents: t.discountCents,
    });
    await db.query("update orders set provider_ref = $2, payment_data = $3, updated_at = now() where id = $1", [orderId, created.providerRef, JSON.stringify({ pix: created.pix ?? null, redirectUrl: created.redirectUrl ?? null })]);
  } catch (e) {
    console.error(`[checkout] pagamento não criado para ${orderId}: ${(e as Error).message}`);
    await db.tx(async (sql) => {
      await sql.query("update orders set status = 'canceled', note = 'falha ao criar pagamento', updated_at = now() where id = $1 and status = 'pending'", [orderId]);
      await releaseOrder(sql, orderId);
    });
    return { ok: false, status: 502, body: { error: "pagamento_indisponivel", message: "O pagamento não respondeu. Nada foi cobrado. Tente de novo em instantes." } };
  }
  return { ok: true, body: await createdBody(db, orderId) };
}

async function createdBody(db: Db, id: string): Promise<CheckoutCreated> {
  const [o] = await db.query<{ status: OrderStatus; payment_data: { pix: PixData | null; redirectUrl: string | null } | null }>("select status, payment_data from orders where id = $1", [id]);
  return { orderId: id, accessToken: orderToken(id), status: o.status, redirectUrl: o.payment_data?.redirectUrl ?? undefined, pix: o.payment_data?.pix ?? undefined };
}

/**
 * Aplica um estado CONFIRMADO PELO PROVEDOR (webhook, consulta ativa ou provedor de teste).
 * Idempotente: repetir a mesma notificação não muda nada.
 */
export async function applyPaymentUpdate(u: PaymentUpdate): Promise<OrderStatus | null> {
  const db = await getDb();
  type Row = { status: OrderStatus; total_cents: number; coupon: string | null };
  let became = null as OrderStatus | null;
  let review = "";

  const run = async () =>
    db.tx(async (sql) => {
      const [o] = await sql.query<Row>("select status, total_cents, coupon from orders where id = $1 for update", [u.orderId]);
      if (!o) return null;
      if (u.status === "paid") {
        if (o.status === "paid" || o.status === "shipped" || o.status === "delivered" || o.status === "needs_review" || o.status === "refunded") return o.status;
        if (u.amountCents != null && u.amountCents !== o.total_cents) {
          review = `valor pago ${u.amountCents} diferente do total ${o.total_cents}`;
          throw new Error("review");
        }
        const ok = await commitOrder(sql, u.orderId, o.status === "pending");
        if (!ok) {
          review = "pago depois de expirar e a peça não está mais disponível";
          throw new Error("review");
        }
        await sql.query("update orders set status = 'paid', paid_at = now(), reserved_until = null, provider_ref = coalesce($2, provider_ref), updated_at = now() where id = $1", [u.orderId, u.providerRef ?? null]);
        if (o.coupon) await sql.query("update coupons set uses = uses + 1 where code = $1", [o.coupon]);
        became = "paid";
        return "paid" as const;
      }
      if (u.status === "failed" && o.status === "pending") {
        await sql.query("update orders set status = 'canceled', note = $2, updated_at = now() where id = $1", [u.orderId, `pagamento ${u.detail ?? "não concluído"}`]);
        await releaseOrder(sql, u.orderId);
        became = "canceled";
        return "canceled" as const;
      }
      if (u.status === "refunded" && (o.status === "paid" || o.status === "shipped" || o.status === "delivered")) {
        await sql.query("update orders set status = 'refunded', updated_at = now() where id = $1", [u.orderId]);
        became = "refunded";
        return "refunded" as const;
      }
      return o.status;
    });

  let result: OrderStatus | null;
  try {
    result = await run();
  } catch (e) {
    if ((e as Error).message !== "review") throw e;
    await db.query("update orders set status = 'needs_review', note = $2, updated_at = now() where id = $1", [u.orderId, review]);
    became = "needs_review";
    result = "needs_review";
  }

  if (became === "paid") await notifyPaid(db, u.orderId);
  if (became === "needs_review") {
    const m = adminAlertMail(`Pedido ${u.orderId} precisa de revisão`, `${review}. Verifique no painel e, se for o caso, estorne no Mercado Pago.`);
    if (m) await sendMail(m);
  }
  return result;
}

async function notifyPaid(db: Db, id: string) {
  const view = await getOrderView(db, id);
  if (!view) return;
  await sendMail(orderPaidMail({ to: view.email, id, link: `${env.siteUrl}/order/${id}?t=${orderToken(id)}`, totalCents: view.totalCents, items: view.items, presale: view.presale, shipsFrom: view.shipsFrom }));
  const m = adminAlertMail(`Pedido pago ${id}`, `${view.items.map((i) => `${i.qty}× ${i.name} ${i.size}`).join(", ")} · total ${(view.totalCents / 100).toFixed(2)}`);
  if (m) await sendMail(m);
}

type OrderRow = {
  id: string;
  status: OrderStatus;
  created_at: string | Date;
  paid_at: string | Date | null;
  email: string;
  customer: { name: string };
  address: { street: string; number: string; complement?: string; district: string; city: string; state: string; cep: string };
  shipping: { id: string; name: string; days: string };
  subtotal_cents: number;
  discount_cents: number;
  shipping_cents: number;
  total_cents: number;
  payment_method: "pix" | "card";
  installments: number;
  presale: boolean;
  ships_from: string | Date | null;
  reserved_until: string | Date | null;
  tracking_code: string | null;
  payment_data: { pix: PixData | null; redirectUrl: string | null } | null;
  provider: string;
  provider_ref: string | null;
  last_synced_at: string | Date | null;
};
const iso = (d: string | Date | null) => (d == null ? null : new Date(d).toISOString());

export async function getOrderView(sql: Sql, id: string): Promise<OrderView | null> {
  const [o] = await sql.query<OrderRow>("select * from orders where id = $1", [id]);
  if (!o) return null;
  const items = await sql.query<{ product_slug: string; size: string; qty: number; name: string; unit_cents: number; edition_from: number | null; edition_to: number | null }>(
    "select * from order_items where order_id = $1 order by product_slug, size",
    [id],
  );
  const a = o.address;
  const pending = o.status === "pending";
  return {
    id: o.id,
    status: o.status,
    createdAt: iso(o.created_at)!,
    paidAt: iso(o.paid_at),
    email: o.email,
    customerName: o.customer.name,
    items: items.map((i) => ({ slug: i.product_slug, size: i.size, qty: i.qty, name: i.name, unitCents: i.unit_cents, editionFrom: i.edition_from, editionTo: i.edition_to })),
    subtotalCents: o.subtotal_cents,
    discountCents: o.discount_cents,
    shippingCents: o.shipping_cents,
    totalCents: o.total_cents,
    shipping: o.shipping,
    addressLine: `${a.street}, ${a.number}${a.complement ? ` · ${a.complement}` : ""} · ${a.district} · ${a.city}/${a.state} · ${a.cep.replace(/(\d{5})(\d{3})/, "$1-$2")}`,
    paymentMethod: o.payment_method,
    installments: o.installments,
    presale: o.presale,
    shipsFrom: o.ships_from ? iso(o.ships_from)!.slice(0, 10) : null,
    reservedUntil: pending ? iso(o.reserved_until) : null,
    trackingCode: o.tracking_code,
    pix: pending ? (o.payment_data?.pix ?? null) : null,
    redirectUrl: pending ? (o.payment_data?.redirectUrl ?? null) : null,
    testMode: env.mode === "test",
  };
}

/** Lê o pedido e, se ainda estiver pendente, pergunta ao gateway (no máximo a cada 15 s). */
export async function readOrderWithSync(id: string): Promise<OrderView | null> {
  const db = await getDb();
  await releaseExpired(db);
  const [o] = await db.query<OrderRow>("select id, status, payment_method, provider, provider_ref, last_synced_at from orders where id = $1", [id]);
  if (!o) return null;
  const stale = !o.last_synced_at || Date.now() - new Date(o.last_synced_at).getTime() > 15_000;
  if ((o.status === "pending" || o.status === "expired") && stale && o.provider === "mercadopago") {
    await db.query("update orders set last_synced_at = now() where id = $1", [id]);
    try {
      const u = await getProvider().reconcile({ id, providerRef: o.provider_ref, method: o.payment_method });
      if (u && u.orderId === id) await applyPaymentUpdate(u);
    } catch (e) {
      console.warn(`[order] consulta ao gateway falhou para ${id}: ${(e as Error).message}`);
    }
  }
  return getOrderView(db, id);
}
