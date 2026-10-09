import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getDrop, getProduct } from "@/lib/catalog";
import { getBundle } from "@/lib/commerce/bundles";
import { toCents } from "@/lib/commerce/pricing";
import { addStockAlert, notifyRestock } from "@/server/alerts";
import type { Db } from "@/server/db";
import { testOutbox } from "@/server/email";
import { createOrder, getOrderView } from "@/server/orders";
import { addSubscriber } from "@/server/subscribers";
import { checkoutInput, freshDb } from "./helpers";

vi.mock("next/headers", () => ({ cookies: async () => ({ get: () => undefined, set: () => {}, delete: () => {} }) }));

const LIVE = new Date("2026-10-11T12:00:00Z");
const tee = getProduct("ggwp-core-tee")!;
const cap = getProduct("respawn-cap")!;
const starter = getBundle("starter-loadout")!;
const d1 = getDrop("001")!;

let db: Db;
beforeEach(async () => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(LIVE);
  db = await freshDb();
  testOutbox.length = 0;
});
afterEach(async () => {
  starter.discount = null;
  d1.earlyAccess = null;
  vi.useRealTimers();
  await db.close();
});

const kit = (id: string) => [
  { slug: tee.slug, size: "M", qty: 1, kit: starter.slug, kitId: id },
  { slug: cap.slug, size: "Único", qty: 1, kit: starter.slug, kitId: id },
];

describe("kits no pedido", () => {
  it("grava cada linha com o kit e o desconto rateado; o total bate", async () => {
    starter.discount = { kind: "percent", value: 10 };
    const r = await createOrder(checkoutInput(kit("abcd1234"), { payment: { method: "card" } }), null);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const v = (await getOrderView(db, r.body.orderId))!;
    const sum = toCents(tee.price) + toCents(cap.price);
    const off = Math.round(sum * 0.1);
    expect(v.items.map((i) => i.kit)).toEqual([starter.slug, starter.slug]);
    expect(v.items.reduce((s, i) => s + i.discountCents, 0)).toBe(off);
    expect(v.subtotalCents).toBe(sum);
    expect(v.totalCents).toBe(sum - off + v.shippingCents);
  });

  it("a mesma peça avulsa e dentro do kit vira duas linhas e o estoque conta as duas", async () => {
    await db.query("update inventory set stock = 1 where product_slug = $1 and size = 'M'", [tee.slug]);
    const r = await createOrder(checkoutInput([{ slug: tee.slug, size: "M", qty: 1 }, ...kit("k2k2k2k2")]), null);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.body.error).toBe("sem_estoque");
    await db.query("update inventory set stock = 2 where product_slug = $1 and size = 'M'", [tee.slug]);
    const ok = await createOrder(checkoutInput([{ slug: tee.slug, size: "M", qty: 1 }, ...kit("k3k3k3k3")]), null);
    expect(ok.ok).toBe(true);
    if (ok.ok) expect((await getOrderView(db, ok.body.orderId))!.items).toHaveLength(3);
  });

  it("kit incompleto não ganha desconto (o servidor não confia no navegador)", async () => {
    starter.discount = { kind: "percent", value: 10 };
    const r = await createOrder(checkoutInput([kit("abcd9999")[0]], { payment: { method: "card" } }), null);
    expect(r.ok).toBe(true);
    if (r.ok) expect((await getOrderView(db, r.body.orderId))!.items[0].discountCents).toBe(0);
  });
});

describe("acesso antecipado", () => {
  const BEFORE = new Date("2026-10-10T12:00:00Z");
  const hoodie = getProduct("obsidian-shell-hoodie")!;
  const order = (email: string) => checkoutInput([{ slug: hoodie.slug, size: "M", qty: 1 }], { customer: { email, name: "Pessoa Teste", cpf: "52998224725", phone: "11912345678" } });

  it("antes da abertura, só a lista compra, e com o e-mail da sessão", async () => {
    vi.setSystemTime(BEFORE);
    d1.earlyAccess = { enabled: true, opensAtUTC: "2026-10-10T00:00:00Z", audience: "list", sources: ["drop-001"] };
    await addSubscriber(db, { email: "lista@exemplo.com", source: "drop-001" });
    await addSubscriber(db, { email: "outra@exemplo.com", source: "rodape" });

    const anon = await createOrder(order("lista@exemplo.com"), null, null);
    expect(anon.ok).toBe(false);
    if (!anon.ok) expect(anon.body.error).toBe("fora_de_venda");

    const wrongSource = await createOrder(order("outra@exemplo.com"), null, "outra@exemplo.com");
    expect(wrongSource.ok).toBe(false);

    const otherEmail = await createOrder(order("terceiro@exemplo.com"), null, "lista@exemplo.com");
    expect(otherEmail.ok).toBe(false);
    if (!otherEmail.ok) expect(otherEmail.body.error).toBe("dados_invalidos");

    const ok = await createOrder(order("lista@exemplo.com"), null, "lista@exemplo.com");
    expect(ok.ok).toBe(true);
  });

  it("desligado: segue a regra normal do drop", async () => {
    vi.setSystemTime(BEFORE);
    const r = await createOrder(order("qualquer@exemplo.com"), null, null);
    expect(r.ok).toBe(!!d1.presale);
  });
});

describe("avise-me quando voltar", () => {
  it("avisa uma vez, só quando o tamanho volta, e só quem continua inscrito", async () => {
    await db.query("update inventory set stock = 0 where product_slug = $1 and size = 'M'", [tee.slug]);
    await addSubscriber(db, { email: "a@exemplo.com", source: "avise-me", product: tee.slug, size: "M" });
    await addStockAlert(db, "a@exemplo.com", tee.slug, "M");
    await addStockAlert(db, "a@exemplo.com", tee.slug, undefined);
    await addStockAlert(db, "sem-consentimento@exemplo.com", tee.slug, "M");

    expect(await notifyRestock(db, tee.slug, "M")).toBe(0);
    await db.query("update inventory set stock = 5 where product_slug = $1 and size = 'M'", [tee.slug]);
    expect(await notifyRestock(db, tee.slug, "M")).toBe(1);
    expect(testOutbox.filter((m) => m.to === "a@exemplo.com")).toHaveLength(1);
    expect(testOutbox.some((m) => m.to === "sem-consentimento@exemplo.com")).toBe(false);
    expect(await notifyRestock(db, tee.slug, "M")).toBe(0);
  });
});
