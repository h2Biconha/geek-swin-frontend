import { COMMERCE, getProduct } from "../catalog";
import type { PaymentMethod } from "./types";

/**
 * Regras de preço, em centavos inteiros. A MESMA função roda no navegador (prévia do total)
 * e no servidor (valor cobrado). O servidor nunca confia no total enviado pelo navegador.
 *
 * Ordem: subtotal → cupom → desconto Pix (sobre as peças, não sobre o frete) → frete.
 * Frete grátis: subtotal das peças ≥ freeShippingFrom, só na opção marcada com freeAbove.
 */
export const toCents = (reais: number) => Math.round(reais * 100);
export const fromCents = (c: number) => c / 100;

export type Coupon = { code: string; kind: "percent" | "fixed"; value: number; minSubtotalCents: number };
export type ShippingQuote = { id: string; name: string; days: string; priceCents: number };

export type PricedLine = { slug: string; size: string; qty: number; name: string; unitCents: number; lineCents: number };
export type Totals = {
  lines: PricedLine[];
  subtotalCents: number;
  couponCents: number;
  pixCents: number;
  discountCents: number;
  shippingCents: number;
  totalCents: number;
  freeShipping: boolean;
};

export function priceLines(items: { slug: string; size: string; qty: number }[]): PricedLine[] {
  return items.map((i) => {
    const p = getProduct(i.slug);
    if (!p) throw new Error(`produto_inexistente:${i.slug}`);
    const unitCents = toCents(p.price);
    return { slug: i.slug, size: i.size, qty: i.qty, name: p.name, unitCents, lineCents: unitCents * i.qty };
  });
}

export const qualifiesFreeShipping = (subtotalCents: number) => subtotalCents >= toCents(COMMERCE.freeShippingFrom);

export function couponDiscount(c: Coupon | null, subtotalCents: number) {
  if (!c || subtotalCents < c.minSubtotalCents) return 0;
  const raw = c.kind === "percent" ? Math.round((subtotalCents * Math.min(c.value, 100)) / 100) : c.value;
  return Math.min(raw, subtotalCents);
}

export function computeTotals(input: { items: { slug: string; size: string; qty: number }[]; method: PaymentMethod; shipping: ShippingQuote | null; coupon?: Coupon | null }): Totals {
  const lines = priceLines(input.items);
  const subtotalCents = lines.reduce((s, l) => s + l.lineCents, 0);
  const couponCents = couponDiscount(input.coupon ?? null, subtotalCents);
  const afterCoupon = subtotalCents - couponCents;
  const pixCents = input.method === "pix" ? Math.round(afterCoupon * COMMERCE.pixDiscount) : 0;
  const shippingCents = input.shipping?.priceCents ?? 0;
  const discountCents = couponCents + pixCents;
  return { lines, subtotalCents, couponCents, pixCents, discountCents, shippingCents, totalCents: subtotalCents - discountCents + shippingCents, freeShipping: qualifiesFreeShipping(subtotalCents) };
}

/** opções de frete pela tabela do catálogo (usada sem integração de frete e na prévia) */
export function tableShipping(subtotalCents: number): ShippingQuote[] {
  const free = qualifiesFreeShipping(subtotalCents);
  return COMMERCE.shippingTable.map((o) => ({ id: o.id, name: o.name, days: o.days, priceCents: free && o.freeAbove ? 0 : toCents(o.price) }));
}

/** parcela em centavos, arredondada para baixo (a soma nunca passa do total) */
export const installmentCents = (totalCents: number, n: number) => Math.floor(totalCents / n);
