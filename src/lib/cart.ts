"use client";

import { createLocalStore } from "./store";
import { getProduct, FREE_SHIPPING_FROM } from "./catalog";
import { openOverlay } from "./ui";
import { track } from "./analytics";

/**
 * Carrinho no navegador (localStorage "gs-cart", mesma chave da versão anterior: ninguém perde a bag).
 * O servidor recalcula preço e estoque no checkout (BACKEND.md). Aqui só guardamos slug, tamanho e quantidade.
 */
export type CartItem = { slug: string; size: string; qty: number };
export const MAX_QTY = 5;

const EMPTY: CartItem[] = [];
const store = createLocalStore<CartItem[]>("gs-cart", EMPTY, (v) => (Array.isArray(v) ? v.filter((i) => getProduct(i.slug)) : EMPTY));
export const useCart = store.use;

export const cart = {
  add(slug: string, size: string, qty = 1) {
    const items = store.read().map((i) => ({ ...i }));
    const hit = items.find((i) => i.slug === slug && i.size === size);
    if (hit) hit.qty = Math.min(hit.qty + qty, MAX_QTY);
    else items.unshift({ slug, size, qty });
    store.write(items);
    const p = getProduct(slug);
    track("add_to_cart", { slug, size, qty, value: p?.price });
    lastAdded = `${slug}|${size}`;
    openOverlay("cart");
  },
  setQty(slug: string, size: string, qty: number) {
    store.write(store.read().map((i) => (i.slug === slug && i.size === size ? { ...i, qty: Math.min(qty, MAX_QTY) } : i)).filter((i) => i.qty > 0));
  },
  remove(slug: string, size: string) {
    store.write(store.read().filter((i) => !(i.slug === slug && i.size === size)));
  },
  clear: () => store.write(EMPTY),
};

/** último item adicionado: a gaveta destaca essa linha */
export let lastAdded = "";

export const countItems = (items: CartItem[]) => items.reduce((s, i) => s + i.qty, 0);
export const subtotal = (items: CartItem[]) => items.reduce((s, i) => s + (getProduct(i.slug)?.price ?? 0) * i.qty, 0);
export const freeShippingGap = (items: CartItem[]) => Math.max(0, FREE_SHIPPING_FROM - subtotal(items));
/** item cujo tamanho esgotou depois de entrar na bag */
export const isUnavailable = (i: CartItem) => {
  const p = getProduct(i.slug);
  return !p || p.soldOut.includes(i.size) || p.stockLeft === 0;
};
