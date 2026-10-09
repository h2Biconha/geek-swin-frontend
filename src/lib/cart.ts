"use client";

import { createLocalStore } from "./store";
import { COMMERCE, getProduct, sizeLeft, type Inventory } from "./catalog";
import { getBundle, newKitId } from "./commerce/bundles";
import { openOverlay, toast } from "./ui";
import { track, itemPayload } from "./analytics";

/**
 * Carrinho no navegador (localStorage "gs-cart", mesma chave da versão anterior: ninguém perde a bag).
 * Guarda só slug, tamanho, quantidade e, se a peça entrou num kit, o kit e o id do grupo.
 * Preço, desconto de kit e estoque são sempre do servidor no checkout.
 */
export type CartItem = { slug: string; size: string; qty: number; kit?: string; kitId?: string };
export const MAX_QTY = COMMERCE.maxQtyPerLine;

/** identidade da linha: a mesma peça/tamanho pode estar avulsa e dentro de um kit */
export const lineKey = (i: { slug: string; size: string; kitId?: string }) => `${i.slug}|${i.size}|${i.kitId ?? ""}`;
const same = (a: CartItem, b: { slug: string; size: string; kitId?: string }) => lineKey(a) === lineKey(b);

const EMPTY: CartItem[] = [];
const store = createLocalStore<CartItem[]>("gs-cart", EMPTY, (v) =>
  Array.isArray(v)
    ? v
        .filter((i) => getProduct(i?.slug)?.sizes.includes(i.size) && Number.isInteger(i.qty) && i.qty > 0)
        .map((i) => ({ slug: i.slug, size: i.size, qty: Math.min(i.qty, MAX_QTY), ...(i.kit && i.kitId && getBundle(i.kit) ? { kit: i.kit, kitId: i.kitId } : {}) }))
    : EMPTY,
);
export const useCart = store.use;
export const readCart = store.read;

/** soma da mesma peça/tamanho em todas as linhas (avulsa + kits) */
export const qtyOf = (items: CartItem[], slug: string, size: string) => items.filter((i) => i.slug === slug && i.size === size).reduce((s, i) => s + i.qty, 0);
export const inCart = (items: CartItem[], slug: string) => items.some((i) => i.slug === slug);

/** limite da linha: o menor entre o máximo por linha e o estoque real conhecido (descontando as outras linhas da mesma peça) */
export function maxQtyFor(i: { slug: string; size: string; kitId?: string }, inv?: Inventory, items: CartItem[] = []) {
  const p = getProduct(i.slug);
  const left = p ? sizeLeft(p, inv, i.size) : 0;
  const others = items.filter((x) => x.slug === i.slug && x.size === i.size && !same(x, i)).reduce((s, x) => s + x.qty, 0);
  return Math.max(0, Math.min(MAX_QTY, left == null ? MAX_QTY : left - others));
}

export type AddLine = { slug: string; size: string; qty?: number };

/**
 * Junta linhas ao carrinho SEM duplicar por acidente: se a peça/tamanho já está na bag (avulsa), não soma de novo.
 * Função pura (testada em tests/unit/cart.test.ts).
 */
export function mergeLines(items: CartItem[], add: AddLine[], kit?: { slug: string; id: string }): { items: CartItem[]; added: AddLine[]; skipped: AddLine[] } {
  const next = items.map((i) => ({ ...i }));
  const added: AddLine[] = [];
  const skipped: AddLine[] = [];
  for (const a of add) {
    const line: CartItem = { slug: a.slug, size: a.size, qty: Math.min(a.qty ?? 1, MAX_QTY), ...(kit ? { kit: kit.slug, kitId: kit.id } : {}) };
    if (!kit && next.some((i) => same(i, line))) {
      skipped.push(a);
      continue;
    }
    next.unshift(line);
    added.push(a);
  }
  return { items: next, added, skipped };
}

export const cart = {
  /** botão "Adicionar" da peça: soma 1 se já houver a mesma peça/tamanho avulsa */
  add(slug: string, size: string, qty = 1, opts: { open?: boolean } = {}) {
    const items = store.read().map((i) => ({ ...i }));
    const hit = items.find((i) => same(i, { slug, size }));
    if (hit) hit.qty = Math.min(hit.qty + qty, MAX_QTY);
    else items.unshift({ slug, size, qty });
    store.write(items);
    track("add_to_cart", itemPayload([{ slug, size, qty }]));
    lastAdded = lineKey({ slug, size });
    if (opts.open !== false) openOverlay("cart");
  },
  /**
   * Várias peças de uma vez (Complete o look, Loadout, sugestões). Não duplica o que já está na bag.
   * Com `kit`, as peças entram como um grupo de kit (o servidor confere a composição e o desconto).
   */
  addMany(lines: AddLine[], opts: { open?: boolean; kit?: string; listName?: string } = {}) {
    const kit = opts.kit ? { slug: opts.kit, id: newKitId() } : undefined;
    const r = mergeLines(store.read(), lines, kit);
    if (r.added.length) {
      store.write(r.items);
      track("add_to_cart", itemPayload(r.added.map((a) => ({ ...a, qty: a.qty ?? 1 })), opts.listName ? { item_list_name: opts.listName } : {}));
      lastAdded = lineKey({ ...r.added[0], kitId: kit?.id });
    }
    if (r.skipped.length && !r.added.length) toast({ title: "Já está na bag", text: r.skipped.map((s) => getProduct(s.slug)?.name).join(", ") });
    if (opts.open !== false && r.added.length) openOverlay("cart");
    return r;
  },
  setQty(slug: string, size: string, qty: number, kitId?: string) {
    const key = { slug, size, kitId };
    const before = store.read().find((i) => same(i, key));
    if (before?.kitId && qty < before.qty) return cart.remove(slug, size, kitId);
    store.write(store.read().map((i) => (same(i, key) ? { ...i, qty: Math.min(qty, MAX_QTY) } : i)).filter((i) => i.qty > 0));
    if (before && qty < before.qty) track("remove_from_cart", itemPayload([{ slug, size, qty: before.qty - Math.max(qty, 0) }]));
    if (before && qty > before.qty) track("add_to_cart", itemPayload([{ slug, size, qty: qty - before.qty }]));
  },
  /** tirar uma peça de um kit desfaz o kit: as outras ficam na bag como avulsas (sem desconto de kit) */
  remove(slug: string, size: string, kitId?: string) {
    const items = store.read();
    const before = items.find((i) => same(i, { slug, size, kitId }));
    let next = items.filter((i) => !same(i, { slug, size, kitId }));
    if (kitId) next = loosen(next, kitId);
    store.write(next);
    if (before) track("remove_from_cart", itemPayload([before]));
  },
  removeKit(kitId: string) {
    const gone = store.read().filter((i) => i.kitId === kitId);
    store.write(store.read().filter((i) => i.kitId !== kitId));
    if (gone.length) track("remove_from_cart", itemPayload(gone));
  },
  clear: () => store.write(EMPTY),
};

/** desfaz o grupo: as peças viram avulsas, juntando com a mesma peça/tamanho avulsa se já existir (função pura) */
export function loosen(items: CartItem[], kitId: string): CartItem[] {
  const out: CartItem[] = [];
  for (const raw of items) {
    const i: CartItem = raw.kitId === kitId ? { slug: raw.slug, size: raw.size, qty: raw.qty } : raw;
    const hit = i.kitId ? undefined : out.find((o) => !o.kitId && o.slug === i.slug && o.size === i.size);
    if (hit) hit.qty = Math.min(hit.qty + i.qty, MAX_QTY);
    else out.push({ ...i });
  }
  return out;
}

/** último item adicionado: a gaveta destaca essa linha */
export let lastAdded = "";

export const countItems = (items: CartItem[]) => items.reduce((s, i) => s + i.qty, 0);
export const subtotal = (items: CartItem[]) => items.reduce((s, i) => s + (getProduct(i.slug)?.price ?? 0) * i.qty, 0);

/** problema da linha com o estoque real: esgotou ou ficou acima do disponível */
export function lineProblem(i: CartItem, inv?: Inventory, items: CartItem[] = []): "esgotado" | "quantidade" | null {
  const max = maxQtyFor(i, inv, items);
  if (max === 0) return "esgotado";
  if (i.qty > max) return "quantidade";
  return null;
}
