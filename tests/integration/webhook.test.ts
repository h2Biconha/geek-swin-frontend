import { createHmac } from "node:crypto";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { Db } from "@/server/db";
import { checkoutInput, freshDb, ORIGIN } from "./helpers";

/**
 * Fluxo completo com o adaptador REAL do Mercado Pago e a API simulada (fetch interceptado):
 * cria Pix → webhook assinado → servidor consulta a "API" → pedido pago. Nenhuma chamada sai da máquina.
 */
const SECRET = "whsec-test";
let mod: {
  createOrder: typeof import("@/server/orders").createOrder;
  getOrderView: typeof import("@/server/orders").getOrderView;
  POST: typeof import("@/app/api/webhooks/mercadopago/route").POST;
};

beforeAll(async () => {
  vi.stubEnv("PAYMENT_PROVIDER", "mercadopago");
  vi.stubEnv("MERCADOPAGO_ACCESS_TOKEN", "TEST-0000");
  vi.resetModules();
  const orders = await import("@/server/orders");
  const route = await import("@/app/api/webhooks/mercadopago/route");
  mod = { createOrder: orders.createOrder, getOrderView: orders.getOrderView, POST: route.POST };
});

let db: Db;
let mpOrder: { id: string; status: string; external_reference: string; total_paid_amount: string };
const calls: string[] = [];

beforeEach(async () => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-10-11T12:00:00Z"));
  // o resetModules acima cria um módulo de banco novo: registramos o banco de teste nele
  const dbmod = await import("@/server/db");
  db = await freshDb();
  dbmod.setDbForTests(db);
  calls.length = 0;
  vi.stubGlobal("fetch", async (url: string, init?: RequestInit) => {
    calls.push(`${init?.method ?? "GET"} ${url}`);
    if (url.endsWith("/v1/orders") && init?.method === "POST") {
      const b = JSON.parse(String(init.body));
      mpOrder = { id: "ORD01TEST", status: "action_required", external_reference: b.external_reference, total_paid_amount: b.total_amount };
      return Response.json({ ...mpOrder, transactions: { payments: [{ id: "PAY01", payment_method: { qr_code: "00020126PIX-TESTE", qr_code_base64: "iVBOR", ticket_url: "https://example.test/ticket" } }] } });
    }
    if (url.includes("/v1/orders/ORD01TEST")) return Response.json(mpOrder);
    return new Response("not found", { status: 404 });
  });
});
afterEach(async () => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  await db.close();
});

const signed = (id: string, ts = "1760184000", reqId = "req-abc") =>
  new Request(`${ORIGIN}/api/webhooks/mercadopago?data.id=${id}&type=order`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-request-id": reqId, "x-signature": `ts=${ts},v1=${createHmac("sha256", SECRET).update(`id:${id.toLowerCase()};request-id:${reqId};ts:${ts};`).digest("hex")}` },
    body: JSON.stringify({ type: "order", action: "order.processed", data: { id } }),
  });

describe("webhook Mercado Pago (API simulada)", () => {
  it("Pix: cria a cobrança e só marca pago depois de consultar a API", async () => {
    const r = await mod.createOrder(checkoutInput([{ slug: "ggwp-core-tee", size: "M", qty: 1 }]), null);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.body.pix?.copyPaste).toBe("00020126PIX-TESTE");
    expect(calls.some((c) => c.startsWith("POST https://api.mercadopago.com/v1/orders"))).toBe(true);

    // notificação chega, mas a API ainda diz "aguardando" → continua pendente
    expect((await mod.POST(signed("ORD01TEST"))).status).toBe(200);
    expect((await mod.getOrderView(db, r.body.orderId))!.status).toBe("pending");

    mpOrder.status = "processed";
    expect((await mod.POST(signed("ORD01TEST", "1760184100"))).status).toBe(200);
    expect((await mod.getOrderView(db, r.body.orderId))!.status).toBe("paid");

    // reentrega da mesma notificação: ignorada
    const dup = await mod.POST(signed("ORD01TEST", "1760184100"));
    expect(await dup.json()).toMatchObject({ duplicate: true });
  });

  it("assinatura inválida: 401 e nada muda", async () => {
    const bad = new Request(`${ORIGIN}/api/webhooks/mercadopago?data.id=ORD01TEST&type=order`, { method: "POST", headers: { "x-signature": "ts=1,v1=00", "x-request-id": "r" }, body: "{}" });
    expect((await mod.POST(bad)).status).toBe(401);
    expect(calls).toHaveLength(0);
  });
});
