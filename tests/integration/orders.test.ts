import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getProduct } from "@/lib/catalog";
import { toCents } from "@/lib/commerce/pricing";
import type { Db } from "@/server/db";
import { testOutbox } from "@/server/email";
import { readInventory, releaseExpired } from "@/server/inventory";
import { applyPaymentUpdate, createOrder, getOrderView, orderToken } from "@/server/orders";
import { POST as checkoutRoute } from "@/app/api/checkout/route";
import { POST as mockPayRoute } from "@/app/api/dev/mock-payment/route";
import { GET as orderRoute } from "@/app/api/orders/[id]/route";
import { checkoutInput, freshDb, ORIGIN, post } from "./helpers";

// fora do Next não existe contexto de requisição: sem cookie de sessão
vi.mock("next/headers", () => ({ cookies: async () => ({ get: () => undefined, set: () => {}, delete: () => {} }) }));

// o Drop 001 abre 10/10/2026 às 23:00 UTC; os testes rodam como se fosse dia 11 (drop ao vivo)
const LIVE = new Date("2026-10-11T12:00:00Z");
const hoodie = getProduct("obsidian-shell-hoodie")!;
const tee = getProduct("ggwp-core-tee")!;

let db: Db;
beforeEach(async () => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(LIVE);
  db = await freshDb();
  testOutbox.length = 0;
});
afterEach(async () => {
  vi.useRealTimers();
  await db.close();
});

const setStock = (slug: string, size: string, stock: number | null) => db.query("update inventory set stock = $3 where product_slug = $1 and size = $2", [slug, size, stock]);
const created = async (r: Awaited<ReturnType<typeof createOrder>>) => {
  if (!r.ok) throw new Error(`pedido não criado: ${JSON.stringify(r.body)}`);
  return r.body;
};

describe("checkout no servidor", () => {
  it("recalcula o total com preço do catálogo (Pix com desconto, frete grátis acima do mínimo)", async () => {
    const o = await created(await createOrder(checkoutInput([{ slug: hoodie.slug, size: "M", qty: 1 }]), null));
    const v = (await getOrderView(db, o.orderId))!;
    const sub = toCents(hoodie.price);
    expect(v.subtotalCents).toBe(sub);
    expect(v.shippingCents).toBe(0); // 389,90 ≥ 349
    expect(v.totalCents).toBe(sub - Math.round(sub * 0.05));
    expect(v.status).toBe("pending");
    expect(o.pix?.copyPaste).toContain("TESTE");
  });

  it("o mesmo Idempotency-Key devolve o mesmo pedido e não reserva duas vezes", async () => {
    const input = checkoutInput([{ slug: hoodie.slug, size: "M", qty: 1 }]);
    const a = await created(await createOrder(input, "chave-idempotente-0001"));
    const b = await created(await createOrder(input, "chave-idempotente-0001"));
    expect(b.orderId).toBe(a.orderId);
    const [ed] = await db.query<{ reserved: number }>("select reserved from editions where product_slug = $1", [hoodie.slug]);
    expect(ed.reserved).toBe(1);
  });

  it("não vende além do estoque: a última peça vai para um pedido só", async () => {
    await setStock(tee.slug, "M", 1);
    const [a, b] = await Promise.all([createOrder(checkoutInput([{ slug: tee.slug, size: "M", qty: 1 }]), null), createOrder(checkoutInput([{ slug: tee.slug, size: "M", qty: 1 }]), null)]);
    expect([a.ok, b.ok].filter(Boolean)).toHaveLength(1);
    const fail = a.ok ? b : a;
    expect(fail.ok).toBe(false);
    if (!fail.ok) expect(fail.body.error).toBe("sem_estoque");
  });

  it("tiragem numerada: não passa do teto e numera na confirmação", async () => {
    await db.query("update editions set cap = 2 where product_slug = $1", [hoodie.slug]);
    const a = await created(await createOrder(checkoutInput([{ slug: hoodie.slug, size: "M", qty: 1 }]), null));
    const b = await created(await createOrder(checkoutInput([{ slug: hoodie.slug, size: "G", qty: 1 }]), null));
    const c = await createOrder(checkoutInput([{ slug: hoodie.slug, size: "GG", qty: 1 }]), null);
    expect(c.ok).toBe(false);
    expect(await applyPaymentUpdate({ orderId: b.orderId, status: "paid" })).toBe("paid");
    expect(await applyPaymentUpdate({ orderId: a.orderId, status: "paid" })).toBe("paid");
    const vb = (await getOrderView(db, b.orderId))!;
    const va = (await getOrderView(db, a.orderId))!;
    expect(vb.items[0].editionFrom).toBe(1);
    expect(va.items[0].editionFrom).toBe(2);
    const inv = await readInventory(db, [hoodie.slug]);
    expect(inv[hoodie.slug].editionLeft).toBe(0);
    expect(Object.values(inv[hoodie.slug].sizes).every((s) => s === 0)).toBe(true);
  });

  it("confirmação repetida é idempotente e o e-mail de pedido pago sai uma vez", async () => {
    const o = await created(await createOrder(checkoutInput([{ slug: tee.slug, size: "M", qty: 2 }]), null));
    await applyPaymentUpdate({ orderId: o.orderId, status: "paid" });
    await applyPaymentUpdate({ orderId: o.orderId, status: "paid" });
    const [inv] = await db.query<{ sold: number; reserved: number }>("select sold, reserved from inventory where product_slug = $1 and size = 'M'", [tee.slug]);
    expect(inv).toEqual({ sold: 2, reserved: 0 });
    expect(testOutbox.filter((m) => m.to === "teste@exemplo.com" && m.subject.includes(o.orderId))).toHaveLength(1);
  });

  it("valor pago diferente do total vai para revisão, não para pago", async () => {
    const o = await created(await createOrder(checkoutInput([{ slug: tee.slug, size: "M", qty: 1 }]), null));
    expect(await applyPaymentUpdate({ orderId: o.orderId, status: "paid", amountCents: 1 })).toBe("needs_review");
  });

  it("reserva vencida libera a peça; pagamento atrasado sem peça vai para revisão", async () => {
    await setStock(tee.slug, "P", 1);
    const a = await created(await createOrder(checkoutInput([{ slug: tee.slug, size: "P", qty: 1 }]), null));
    await db.query("update orders set reserved_until = now() - interval '1 minute' where id = $1", [a.orderId]);
    await releaseExpired(db);
    expect((await getOrderView(db, a.orderId))!.status).toBe("expired");
    const b = await created(await createOrder(checkoutInput([{ slug: tee.slug, size: "P", qty: 1 }]), null));
    expect(await applyPaymentUpdate({ orderId: b.orderId, status: "paid" })).toBe("paid");
    expect(await applyPaymentUpdate({ orderId: a.orderId, status: "paid" })).toBe("needs_review");
  });

  it("pagamento recusado cancela e devolve a reserva", async () => {
    const o = await created(await createOrder(checkoutInput([{ slug: tee.slug, size: "M", qty: 1 }]), null));
    expect(await applyPaymentUpdate({ orderId: o.orderId, status: "failed" })).toBe("canceled");
    const [inv] = await db.query<{ reserved: number }>("select reserved from inventory where product_slug = $1 and size = 'M'", [tee.slug]);
    expect(inv.reserved).toBe(0);
  });

  it("pré-venda aberta vende e marca o pedido como pré-venda", async () => {
    vi.setSystemTime(new Date("2026-10-01T12:00:00Z"));
    // Drop 001 tem pré-venda: compra liberada; sem pré-venda seria bloqueado (ver tests/unit/drops)
    const r = await createOrder(checkoutInput([{ slug: "obsidian-shell-hoodie", size: "M", qty: 1 }]), null);
    expect(r.ok).toBe(true);
    if (r.ok) expect((await getOrderView(db, r.body.orderId))!.presale).toBe(true);
  });
});

describe("rotas HTTP", () => {
  it("POST /api/checkout valida campos e recusa origem de outro site", async () => {
    const bad = await checkoutRoute(post("/api/checkout", { ...checkoutInput([{ slug: tee.slug, size: "M", qty: 1 }]), customer: { email: "x", name: "A", cpf: "1", phone: "2" } }), undefined);
    expect(bad.status).toBe(400);
    const j = await bad.json();
    expect(Object.keys(j.fields)).toEqual(expect.arrayContaining(["customer.email", "customer.cpf"]));
    const csrf = await checkoutRoute(post("/api/checkout", checkoutInput([{ slug: tee.slug, size: "M", qty: 1 }]), { origin: "https://evil.example" }), undefined);
    expect(csrf.status).toBe(403);
  });

  it("preço enviado pelo navegador é ignorado", async () => {
    const res = await checkoutRoute(post("/api/checkout", { ...checkoutInput([{ slug: tee.slug, size: "M", qty: 1 }]), items: [{ slug: tee.slug, size: "M", qty: 1, price: 1 }], totalCents: 1 }, { "idempotency-key": "abcdefghijklmnop-1" }), undefined);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect((await getOrderView(db, body.orderId))!.subtotalCents).toBe(toCents(tee.price));
  });

  it("pedido só abre com o token certo; pagamento de teste passa pelo mesmo caminho do webhook", async () => {
    const o = await created(await createOrder(checkoutInput([{ slug: tee.slug, size: "M", qty: 1 }]), null));
    const ctx = { params: Promise.resolve({ id: o.orderId }) };
    expect((await orderRoute(new Request(`${ORIGIN}/api/orders/${o.orderId}?t=errado`), ctx)).status).toBe(404);
    expect((await orderRoute(new Request(`${ORIGIN}/api/orders/${o.orderId}?t=${orderToken(o.orderId)}`), ctx)).status).toBe(200);
    const pay = await mockPayRoute(post("/api/dev/mock-payment", { orderId: o.orderId, token: orderToken(o.orderId), outcome: "paid" }), undefined);
    expect((await pay.json()).status).toBe("paid");
  });
});
