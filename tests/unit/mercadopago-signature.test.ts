import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { mercadoPago } from "@/server/payments/mercadopago";

const SECRET = "whsec-test"; // vitest.config.ts > MERCADOPAGO_WEBHOOK_SECRET
const sign = (id: string, reqId: string, ts: string) => createHmac("sha256", SECRET).update(`id:${id.toLowerCase()};request-id:${reqId};ts:${ts};`).digest("hex");

function req(url: string, body: unknown, headers: Record<string, string>) {
  return new Request(url, { method: "POST", headers: { "content-type": "application/json", ...headers }, body: JSON.stringify(body) });
}

describe("webhook do Mercado Pago (x-signature)", () => {
  const url = "http://localhost:3000/api/webhooks/mercadopago?data.id=ORD01ABC&type=order";
  const body = { type: "order", action: "order.processed", data: { id: "ORD01ABC" } };

  it("aceita assinatura válida (id em minúsculas no manifesto)", async () => {
    const r = req(url, body, { "x-signature": `ts=1700000000,v1=${sign("ORD01ABC", "req-1", "1700000000")}`, "x-request-id": "req-1" });
    expect(await mercadoPago.parseWebhook(r, JSON.stringify(body))).toEqual({ kind: "order", id: "ORD01ABC", eventKey: "order:ORD01ABC:1700000000" });
  });

  it("recusa assinatura errada", async () => {
    const r = req(url, body, { "x-signature": "ts=1700000000,v1=deadbeef", "x-request-id": "req-1" });
    expect(await mercadoPago.parseWebhook(r, JSON.stringify(body))).toBe("invalid");
  });

  it("recusa assinatura de outro request-id (replay com outro cabeçalho)", async () => {
    const r = req(url, body, { "x-signature": `ts=1700000000,v1=${sign("ORD01ABC", "req-1", "1700000000")}`, "x-request-id": "req-2" });
    expect(await mercadoPago.parseWebhook(r, JSON.stringify(body))).toBe("invalid");
  });

  it("recusa sem cabeçalho de assinatura", async () => {
    expect(await mercadoPago.parseWebhook(req(url, body, {}), JSON.stringify(body))).toBe("invalid");
  });

  it("ignora tópicos que não são pedido nem pagamento", async () => {
    const u = "http://localhost:3000/api/webhooks/mercadopago?data.id=1&type=merchant_order";
    expect(await mercadoPago.parseWebhook(req(u, {}, {}), "{}")).toBe("ignore");
  });
});
