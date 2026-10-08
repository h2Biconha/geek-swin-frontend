"use client";

import { createLocalStore } from "./store";
import { getProduct } from "./catalog";
import { toast } from "./ui";
import { track } from "./analytics";

/** Favoritos no navegador. Com contas no ar, sincroniza com o servidor no login (BACKEND.md). */
const EMPTY: string[] = [];
const store = createLocalStore<string[]>("gs-wishlist", EMPTY, (v) => (Array.isArray(v) ? v.filter((s) => getProduct(s)) : EMPTY));
export const useWishlist = store.use;

export function toggleWishlist(slug: string) {
  const list = store.read();
  const on = !list.includes(slug);
  store.write(on ? [slug, ...list] : list.filter((s) => s !== slug));
  const p = getProduct(slug);
  if (on) track("add_to_wishlist", { slug });
  toast(on ? { title: "Salvo na wishlist", text: p?.name, action: { label: "Ver wishlist", href: "/wishlist" } } : { title: "Removido da wishlist", text: p?.name });
  return on;
}
