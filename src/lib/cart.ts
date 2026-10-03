"use client";

import { useSyncExternalStore } from "react";
import { getProduct } from "./products";

/**
 * Bag no navegador (localStorage "gs-cart"), sem biblioteca.
 * useSyncExternalStore mantém todas as telas em sincronia, inclusive entre abas.
 * Num e-commerce real isso vira o carrinho da plataforma (Shopify, VTEX, Nuvemshop...).
 */
export type CartItem = { slug: string; size: string; qty: number };

const KEY = "gs-cart";
const EMPTY: CartItem[] = [];
let cacheRaw: string | null = null;
let cache: CartItem[] = EMPTY;
const listeners = new Set<() => void>();

function read(): CartItem[] {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(KEY);
  } catch {}
  if (raw === cacheRaw) return cache; // mesma referência = React não re-renderiza à toa
  cacheRaw = raw;
  try {
    cache = (raw ? (JSON.parse(raw) as CartItem[]) : EMPTY).filter((i) => getProduct(i.slug));
  } catch {
    cache = EMPTY;
  }
  return cache;
}

function write(items: CartItem[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(items));
  } catch {}
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => e.key === KEY && cb();
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
}

export function useCart() {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}

export const cart = {
  add(slug: string, size: string, qty = 1) {
    const items = read().map((i) => ({ ...i }));
    const hit = items.find((i) => i.slug === slug && i.size === size);
    if (hit) hit.qty = Math.min(hit.qty + qty, 10);
    else items.push({ slug, size, qty });
    write(items);
    window.dispatchEvent(new CustomEvent("gs:added", { detail: { slug, size } }));
  },
  has: (slug: string, size: string) => read().some((i) => i.slug === slug && i.size === size),
  setQty(slug: string, size: string, qty: number) {
    write(read().map((i) => (i.slug === slug && i.size === size ? { ...i, qty } : i)).filter((i) => i.qty > 0));
  },
};

export const countItems = (items: CartItem[]) => items.reduce((s, i) => s + i.qty, 0);
export const subtotal = (items: CartItem[]) => items.reduce((s, i) => s + (getProduct(i.slug)?.price ?? 0) * i.qty, 0);
