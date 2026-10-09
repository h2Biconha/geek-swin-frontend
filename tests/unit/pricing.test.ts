import { afterEach, describe, expect, it } from "vitest";
import { COMMERCE, getDrop, getProduct } from "@/lib/catalog";
import { BENEFITS, benefitProgress, freeShippingCondition, freeShippingFor, type Benefit } from "@/lib/commerce/benefits";
import { computeTotals, couponDiscount, installmentCents, priceLines, tableShipping, toCents } from "@/lib/commerce/pricing";
import { ufFromCep } from "@/lib/commerce/regions";

const hoodie = getProduct("obsidian-shell-hoodie")!;
const tee = getProduct("phantom-frame-tee")!;
const NOW = Date.parse(getDrop("001")!.opensAtUTC!) + 86_400_000;
const free = BENEFITS.find((b) => b.kind === "free_shipping")!;
const freeBackup = structuredClone(free);
const extra: Benefit[] = [];
afterEach(() => {
  Object.assign(free, structuredClone(freeBackup));
  for (const b of extra) BENEFITS.splice(BENEFITS.indexOf(b), 1);
  extra.length = 0;
});
const addBenefit = (b: Partial<Benefit>) => {
  const full: Benefit = { id: "teste", kind: "discount", enabled: true, label: "Teste", threshold: 300, regions: null, categories: null, excludeProducts: [], startsAtUTC: null, endsAtUTC: null, stacksWithCoupon: false, messages: { before: "Faltam {gap}", after: "Ok", condition: "Acima de {threshold}{regions}" }, ...b };
  BENEFITS.push(full);
  extra.push(full);
  return full;
};
const SP = "01310100";
const BA = "40020000";

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
    const card = computeTotals({ items: [{ slug: tee.slug, size: "M", qty: 1 }], method: "card", shipping: ship, now: NOW });
    const pix = computeTotals({ items: [{ slug: tee.slug, size: "M", qty: 1 }], method: "pix", shipping: ship, now: NOW });
    expect(card.pixCents).toBe(0);
    expect(pix.pixCents).toBe(Math.round(toCents(tee.price) * COMMERCE.pixDiscount));
    expect(pix.totalCents).toBe(card.totalCents - pix.pixCents);
    expect(pix.shippingCents).toBe(3990);
  });

  it("cupom vem antes do Pix e nunca deixa total negativo", () => {
    const c = { code: "X", kind: "fixed" as const, value: 999999, minSubtotalCents: 0 };
    expect(couponDiscount(c, 10000)).toBe(10000);
    const t = computeTotals({ items: [{ slug: tee.slug, size: "M", qty: 1 }], method: "pix", shipping: null, coupon: c, now: NOW });
    expect(t.totalCents).toBeGreaterThanOrEqual(0);
  });

  it("cupom abaixo do mínimo não vale", () => {
    expect(couponDiscount({ code: "X", kind: "percent", value: 10, minSubtotalCents: 50000 }, 10000)).toBe(0);
  });

  it("parcela arredonda para baixo (soma nunca passa do total)", () => {
    expect(installmentCents(10000, 6) * 6).toBeLessThanOrEqual(10000);
  });
});

describe("benefícios progressivos", () => {
  const lines = (cents: number) => [{ slug: tee.slug, lineCents: cents }];

  it("frete grátis só na opção marcada e a partir do valor configurado", () => {
    const limit = Math.round(free.threshold * 100);
    const t = (c: number) => ({ lines: [{ ...priceLines([{ slug: tee.slug, size: "M", qty: 1 }])[0], lineCents: c }], couponCents: 0 });
    const cheapest = COMMERCE.shippingTable.reduce((a, b) => (b.price < a.price ? b : a));
    expect(tableShipping(t(limit - 1), SP, NOW).every((o) => o.priceCents > 0)).toBe(true);
    const opts = tableShipping(t(limit), SP, NOW);
    for (const o of COMMERCE.shippingTable) expect(opts.find((x) => x.id === o.id)!.priceCents).toBe(o.id === cheapest.id ? 0 : toCents(o.price));
  });

  it("barra de progresso mostra quanto falta e a mensagem configurada", () => {
    const [p] = benefitProgress(lines(29900), NOW);
    expect(p.gapCents).toBe(Math.round(free.threshold * 100) - 29900);
    expect(p.reached).toBe(false);
    expect(p.message).toContain("Faltam");
    expect(benefitProgress(lines(free.threshold * 100), NOW)[0].reached).toBe(true);
  });

  it("regra desligada ou fora do prazo não aparece em lugar nenhum", () => {
    free.enabled = false;
    expect(benefitProgress(lines(99999), NOW)).toEqual([]);
    expect(freeShippingCondition(NOW)).toBeNull();
    free.enabled = true;
    free.endsAtUTC = new Date(NOW - 1000).toISOString();
    expect(benefitProgress(lines(99999), NOW)).toEqual([]);
    free.endsAtUTC = null;
    free.startsAtUTC = new Date(NOW + 1000).toISOString();
    expect(freeShippingFor("economico", { lines: lines(99999), now: NOW, cep: SP, cheapest: true })).toBe(false);
  });

  it("região: CEP fora não ganha; sem CEP fica 'a confirmar'", () => {
    free.regions = ["sudeste"];
    expect(ufFromCep(SP)).toBe("SP");
    expect(ufFromCep(BA)).toBe("BA");
    expect(freeShippingFor("economico", { lines: lines(99999), now: NOW, cep: SP, cheapest: true })).toBe(true);
    expect(freeShippingFor("economico", { lines: lines(99999), now: NOW, cep: BA, cheapest: true })).toBe(false);
    expect(benefitProgress(lines(99999), NOW)[0].region).toBeNull();
    expect(benefitProgress(lines(99999), NOW)[0].condition).toContain("Sudeste");
  });

  it("produtos e categorias elegíveis contam; o resto não", () => {
    free.categories = ["calcas"];
    expect(benefitProgress([{ slug: tee.slug, lineCents: 99999 }], NOW)[0].reached).toBe(false);
    free.categories = null;
    free.excludeProducts = [tee.slug];
    expect(benefitProgress([{ slug: tee.slug, lineCents: 99999 }], NOW)[0].reached).toBe(false);
  });

  it("desconto de pedido que não acumula: vale o maior entre ele e o cupom", () => {
    addBenefit({ percent: 10 });
    const items = [{ slug: hoodie.slug, size: "M", qty: 1 }];
    const t = computeTotals({ items, method: "card", shipping: null, now: NOW });
    expect(t.benefitCents).toBe(Math.round(toCents(hoodie.price) * 0.1));
    const small = computeTotals({ items, method: "card", shipping: null, now: NOW, coupon: { code: "A", kind: "fixed", value: 100, minSubtotalCents: 0 } });
    expect(small.couponCents).toBe(0);
    expect(small.benefitCents).toBe(t.benefitCents);
    const big = computeTotals({ items, method: "card", shipping: null, now: NOW, coupon: { code: "B", kind: "percent", value: 20, minSubtotalCents: 0 } });
    expect(big.benefitCents).toBe(0);
    expect(big.couponCents).toBe(Math.round(toCents(hoodie.price) * 0.2));
  });

  it("desconto que acumula soma com o cupom e respeita a região", () => {
    addBenefit({ amount: 20, stacksWithCoupon: true, regions: ["SP"] });
    const items = [{ slug: hoodie.slug, size: "M", qty: 1 }];
    const coupon = { code: "A", kind: "fixed" as const, value: 1000, minSubtotalCents: 0 };
    const sp = computeTotals({ items, method: "card", shipping: null, now: NOW, coupon, cep: SP });
    expect(sp.benefitCents).toBe(2000);
    expect(sp.couponCents).toBe(1000);
    expect(computeTotals({ items, method: "card", shipping: null, now: NOW, coupon, cep: BA }).benefitCents).toBe(0);
  });
});
