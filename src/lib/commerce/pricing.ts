import { COMMERCE, getProduct } from "../catalog";
import { freeShippingFor, freeShippingReached, orderBenefitDiscount } from "./benefits";
import { allocate, evaluateBundle, type BundleCheck } from "./bundles";
import type { PaymentMethod } from "./types";

/**
 * Regras de preço, em centavos inteiros. A MESMA função roda no navegador (prévia do total)
 * e no servidor (valor cobrado). O servidor nunca confia no total enviado pelo navegador.
 *
 * Ordem: subtotal → desconto de kit → benefício de pedido OU cupom (conforme a regra de acumulação)
 *        → desconto Pix (sobre as peças, não sobre o frete) → frete.
 * Frete grátis: regra em commerce.benefits (valor mínimo sobre as peças já com desconto de kit, região, prazo).
 */
export const toCents = (reais: number) => Math.round(reais * 100);
export const fromCents = (c: number) => c / 100;

export type Coupon = { code: string; kind: "percent" | "fixed"; value: number; minSubtotalCents: number };
export type ShippingQuote = { id: string; name: string; days: string; priceCents: number };

export type PriceItem = { slug: string; size: string; qty: number; kit?: string; kitId?: string };
export type PricedLine = { slug: string; size: string; qty: number; name: string; unitCents: number; lineCents: number; kit?: string; kitId?: string; discountCents: number };
export type Totals = {
  lines: PricedLine[];
  subtotalCents: number;
  /** desconto de kits válidos */
  bundleCents: number;
  bundles: BundleCheck[];
  /** desconto de benefício progressivo (kind "discount") */
  benefitCents: number;
  benefitId: string | null;
  couponCents: number;
  pixCents: number;
  discountCents: number;
  shippingCents: number;
  totalCents: number;
  /** valor mínimo do frete grátis atingido (a região só é conferida com o CEP) */
  freeShipping: boolean;
};

export function priceLines(items: PriceItem[]): PricedLine[] {
  return items.map((i) => {
    const p = getProduct(i.slug);
    if (!p) throw new Error(`produto_inexistente:${i.slug}`);
    const unitCents = toCents(p.price);
    return { slug: i.slug, size: i.size, qty: i.qty, name: p.name, unitCents, lineCents: unitCents * i.qty, discountCents: 0, ...(i.kit && i.kitId ? { kit: i.kit, kitId: i.kitId } : {}) };
  });
}

/** aplica o desconto de cada kit nas linhas do grupo (in place) e devolve a conferência dos kits */
export function applyBundles(lines: PricedLine[], now: number): BundleCheck[] {
  const groups = new Map<string, PricedLine[]>();
  for (const l of lines) {
    if (!l.kit || !l.kitId) continue;
    const k = `${l.kit}|${l.kitId}`;
    groups.set(k, [...(groups.get(k) ?? []), l]);
  }
  return [...groups.values()].map((g) => {
    const check = evaluateBundle(g[0].kit!, g[0].kitId!, g, now);
    allocate(check.discountCents, g.map((l) => l.lineCents)).forEach((d, i) => (g[i].discountCents = d));
    return check;
  });
}

export function couponDiscount(c: Coupon | null, subtotalCents: number) {
  if (!c || subtotalCents < c.minSubtotalCents) return 0;
  const raw = c.kind === "percent" ? Math.round((subtotalCents * Math.min(c.value, 100)) / 100) : c.value;
  return Math.min(raw, subtotalCents);
}

export function computeTotals(input: { items: PriceItem[]; method: PaymentMethod; shipping: ShippingQuote | null; coupon?: Coupon | null; cep?: string | null; now?: number }): Totals {
  const now = input.now ?? Date.now();
  const lines = priceLines(input.items);
  const subtotalCents = lines.reduce((s, l) => s + l.lineCents, 0);
  const bundles = applyBundles(lines, now);
  const bundleCents = lines.reduce((s, l) => s + l.discountCents, 0);
  const afterBundles = subtotalCents - bundleCents;

  // benefício de pedido x cupom: se a regra não acumula, vale o maior dos dois
  const benefit = orderBenefitDiscount(lines, now, input.cep);
  let benefitCents = benefit?.cents ?? 0;
  let couponCents = couponDiscount(input.coupon ?? null, afterBundles - benefitCents);
  if (benefit && couponCents > 0 && !benefit.stacksWithCoupon) {
    const alone = couponDiscount(input.coupon ?? null, afterBundles);
    if (alone >= benefitCents) [benefitCents, couponCents] = [0, alone];
    else couponCents = 0;
  }
  const afterDiscounts = afterBundles - benefitCents - couponCents;
  const pixCents = input.method === "pix" ? Math.round(afterDiscounts * COMMERCE.pixDiscount) : 0;
  const shippingCents = input.shipping?.priceCents ?? 0;
  const discountCents = bundleCents + benefitCents + couponCents + pixCents;
  return {
    lines,
    subtotalCents,
    bundleCents,
    bundles,
    benefitCents,
    benefitId: benefitCents ? (benefit?.id ?? null) : null,
    couponCents,
    pixCents,
    discountCents,
    shippingCents,
    totalCents: subtotalCents - discountCents + shippingCents,
    freeShipping: freeShippingReached(lines, now, couponCents > 0),
  };
}

/** opções de frete pela tabela do catálogo (usada sem integração de frete e na prévia) */
export function tableShipping(t: Pick<Totals, "lines" | "couponCents">, cep: string | null, now = Date.now()): ShippingQuote[] {
  const cheapest = Math.min(...COMMERCE.shippingTable.map((o) => o.price));
  return COMMERCE.shippingTable.map((o) => ({
    id: o.id,
    name: o.name,
    days: o.days,
    priceCents: freeShippingFor(o.id, { lines: t.lines, now, cep, couponApplied: t.couponCents > 0, cheapest: o.price === cheapest }) ? 0 : toCents(o.price),
  }));
}

/** parcela em centavos, arredondada para baixo (a soma nunca passa do total) */
export const installmentCents = (totalCents: number, n: number) => Math.floor(totalCents / n);
