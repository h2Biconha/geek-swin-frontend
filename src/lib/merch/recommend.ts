import { collectionOf, getProduct, isBuyable, PRODUCTS, roleOf, type Inventory, type Product } from "../catalog";
import { compatible, looksWith } from "./looks";

/**
 * Recomendações (carrinho, página da peça, pós-compra, conta). Poucas e explicáveis:
 * cada sugestão diz POR QUE aparece. Nunca sugere o que já está na bag, peça fora de venda ou combinação incompatível.
 */
export type Suggestion = { product: Product; reason: string; score: number };

export function suggestFor(slugs: string[], now: number, stock?: Record<string, Inventory>, n = 3): Suggestion[] {
  const base = slugs.map(getProduct).filter((p): p is Product => !!p);
  if (!base.length) return [];
  const taken = new Set(slugs);
  const rolesTaken = new Set(base.map(roleOf));
  const best = new Map<string, Suggestion>();
  const offer = (q: Product, score: number, reason: string) => {
    if (taken.has(q.slug) || roleOf(q) === "pack" || !isBuyable(q, now, stock)) return;
    const s = score - (rolesTaken.has(roleOf(q)) ? 2 : 0);
    const cur = best.get(q.slug);
    if (!cur || s > cur.score) best.set(q.slug, { product: q, reason, score: s });
  };
  for (const p of base) {
    for (const l of looksWith(p.slug)) for (const s of l.products) {
      const q = getProduct(s);
      if (q && compatible(p, q)) offer(q, 6, `Do look ${l.name}`);
    }
    for (const s of p.pairsWith) {
      const q = getProduct(s);
      if (q && compatible(p, q)) offer(q, 5, `Combina com ${p.name}`);
    }
    for (const q of PRODUCTS) if (compatible(p, q) && collectionOf(q) === collectionOf(p)) offer(q, 3, p.drop ? `Também do Drop ${p.drop}` : "Também da linha Core");
    for (const q of PRODUCTS) if (compatible(p, q)) offer(q, 1, `Completa com ${p.name}`);
  }
  return [...best.values()].sort((a, b) => b.score - a.score || a.product.rank - b.product.rank).slice(0, n);
}

/** outras peças da mesma coleção (drop ou Core) */
export const collectionMates = (p: Product, n = 4) => PRODUCTS.filter((q) => q.slug !== p.slug && collectionOf(q) === collectionOf(p) && roleOf(q) !== "pack").sort((a, b) => a.rank - b.rank).slice(0, n);
/** alternativas: mesmo papel (outra camiseta, outra calça), de qualquer coleção */
export const alternatives = (p: Product, n = 4) => PRODUCTS.filter((q) => q.slug !== p.slug && roleOf(q) === roleOf(p)).sort((a, b) => a.rank - b.rank).slice(0, n);
