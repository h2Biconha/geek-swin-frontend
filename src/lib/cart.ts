"use client";

import { createLocalStore } from "./store";
import { COMMERCE, getProduct, sizeLeft, type Inventory } from "./catalog";
import { openOverlay } from "./ui";
import { track, itemPayload } from "./analytics";

/**
 * Carrinho no navegador (localStorage "gs-cart", mesma chave da versão anterior: ninguém perde a bag).
 * Guarda só slug, tamanho e quantidade. Preço e estoque são sempre do servidor no checkout.
 */
export type CartItem = { slug: string; size: string; qty: number };
export const MAX_QTY = COMMERCE.maxQtyPerLine;

const EMPTY: CartItem[] = [];
const store = createLocalStore<CartItem[]>("gs-cart", EMPTY, (v) =>
  Array.isArray(v) ? v.filter((i) => getProduct(i?.slug)?.sizes.includes(i.size) && Number.isInteger(i.qty) && i.qty > 0).map((i) => ({ ...i, qty: Math.min(i.qty, MAX_QTY) })) : EMPTY,
);
export const useCart = store.use;
export const readCart = store.read;

/** limite da linha: o menor entre o máximo por pedido e o estoque real conhecido */
export function maxQtyFor(i: { slug: string; size: string }, inv?: Inventory) {
  const p = getProduct(i.slug);
  const left = p ? sizeLeft(p, inv, i.size) : 0;
  return Math.max(0, Math.min(MAX_QTY, left ?? MAX_QTY));
}

export const cart = {
  add(slug: string, size: string, qty = 1, opts: { open?: boolean } = {}) {
    const items = store.read().map((i) => ({ ...i }));
    const hit = items.find((i) => i.slug === slug && i.size === size);
    if (hit) hit.qty = Math.min(hit.qty + qty, MAX_QTY);
    else items.unshift({ slug, size, qty });
    store.write(items);
    track("add_to_cart", itemPayload([{ slug, size, qty }]));
    lastAdded = `${slug}|${size}`;
    if (opts.open !== false) openOverlay("cart");
  },
  setQty(slug: string, size: string, qty: number) {
    const before = store.read().find((i) => i.slug === slug && i.size === size);
    store.write(store.read().map((i) => (i.slug === slug && i.size === size ? { ...i, qty: Math.min(qty, MAX_QTY) } : i)).filter((i) => i.qty > 0));
    if (before && qty < before.qty) track("remove_from_cart", itemPayload([{ slug, size, qty: before.qty - Math.max(qty, 0) }]));
    if (before && qty > before.qty) track("add_to_cart", itemPayload([{ slug, size, qty: qty - before.qty }]));
  },
  remove(slug: string, size: string) {
    const before = store.read().find((i) => i.slug === slug && i.size === size);
    store.write(store.read().filter((i) => !(i.slug === slug && i.size === size)));
    if (before) track("remove_from_cart", itemPayload([before]));
  },
  clear: () => store.write(EMPTY),
};

/** último item adicionado: a gaveta destaca essa linha */
export let lastAdded = "";

export const countItems = (items: CartItem[]) => items.reduce((s, i) => s + i.qty, 0);
export const subtotal = (items: CartItem[]) => items.reduce((s, i) => s + (getProduct(i.slug)?.price ?? 0) * i.qty, 0);
export const freeShippingGap = (items: CartItem[]) => Math.max(0, COMMERCE.freeShippingFrom - subtotal(items));

/** problema da linha com o estoque real: esgotou ou ficou acima do disponível */
export function lineProblem(i: CartItem, inv?: Inventory): "esgotado" | "quantidade" | null {
  const max = maxQtyFor(i, inv);
  if (max === 0) return "esgotado";
  if (i.qty > max) return "quantidade";
  return null;
}
