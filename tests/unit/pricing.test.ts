import { describe, expect, it } from "vitest";
import { COMMERCE, getProduct } from "@/lib/catalog";
import { computeTotals, couponDiscount, installmentCents, priceLines, qualifiesFreeShipping, tableShipping, toCents } from "@/lib/commerce/pricing";

const hoodie = getProduct("obsidian-shell-hoodie")!;
const tee = getProduct("phantom-frame-tee")!;

describe("pricing", () => {
  it("preço vem do catálogo, nunca do cliente", () => {
    const [l] = priceLines([{ slug: hoodie.slug, size: "M", qty: 2 }]);
    expect(l.unitCents).toBe(toCents(hoodie.price));
    expect(l.lineCents).toBe(toCents(hoodie.price) * 2);
  });

  it("recusa produto inexistente (a rota normaliza antes de precificar)", () => {
    expect(() => priceLines([{ slug: "nao-existe", size: "M", qty: 1 }])).toThrow(/produto_inexistente/);
  });

  it("toCents evita erro de ponto flutuante", () => {
    expect(toCents(0.1 + 0.2)).toBe(30);
    expect(toCents(389.9)).toBe(38990);
  });

  it("Pix aplica desconto só sobre os itens, não sobre o frete", () => {
    const ship = { id: "expresso", name: "Expresso", days: "", priceCents: 3990 };
    const card = computeTotals({ items: [{ slug: tee.slug, size: "M", qty: 1 }], method: "card", shipping: ship });
    const pix = computeTotals({ items: [{ slug: tee.slug, size: "M", qty: 1 }], method: "pix", shipping: ship });
    expect(card.pixCents).toBe(0);
    expect(pix.pixCents).toBe(Math.round(toCents(tee.price) * COMMERCE.pixDiscount));
    expect(pix.totalCents).toBe(card.totalCents - pix.pixCents);
    expect(pix.shippingCents).toBe(3990);
  });

  it("cupom vem antes do Pix e nunca deixa total negativo", () => {
    const c = { code: "X", kind: "fixed" as const, value: 999999, minSubtotalCents: 0 };
    expect(couponDiscount(c, 10000)).toBe(10000);
    const t = computeTotals({ items: [{ slug: tee.slug, size: "M", qty: 1 }], method: "pix", shipping: null, coupon: c });
    expect(t.totalCents).toBeGreaterThanOrEqual(0);
  });

  it("cupom abaixo do mínimo não vale", () => {
    expect(couponDiscount({ code: "X", kind: "percent", value: 10, minSubtotalCents: 50000 }, 10000)).toBe(0);
  });

  it("frete grátis só na opção marcada e a partir do valor configurado", () => {
    const limit = toCents(COMMERCE.freeShippingFrom);
    expect(qualifiesFreeShipping(limit - 1)).toBe(false);
    expect(qualifiesFreeShipping(limit)).toBe(true);
    const opts = tableShipping(limit);
    for (const o of COMMERCE.shippingTable) {
      const q = opts.find((x) => x.id === o.id)!;
      expect(q.priceCents).toBe(o.freeAbove ? 0 : toCents(o.price));
    }
  });

  it("parcela arredonda para baixo (soma nunca passa do total)", () => {
    expect(installmentCents(10000, 6) * 6).toBeLessThanOrEqual(10000);
  });
});
