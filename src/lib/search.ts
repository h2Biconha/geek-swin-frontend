import { CATEGORIES, DROPS, PRODUCTS, categoryName, dropTitle, type Product } from "./catalog";

/**
 * Busca local, instantânea, sem acento e sem diferença de maiúscula.
 * Assíncrona de propósito: com catálogo grande, troque o corpo por fetch("/api/search?q=").
 */
export type SearchResults = { products: Product[]; drops: { href: string; label: string; sub: string }[]; categories: { href: string; label: string }[] };
const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export async function searchCatalog(q: string): Promise<SearchResults> {
  const terms = norm(q).split(/\s+/).filter(Boolean);
  const hit = (hay: string) => terms.every((t) => norm(hay).includes(t));
  if (!terms.length) return { products: [], drops: [], categories: [] };
  return {
    products: PRODUCTS.filter((p) => hit([p.name, p.specs, p.color, categoryName(p.category), p.drop ? `drop ${p.drop}` : "core", p.description].join(" "))).slice(0, 6),
    drops: DROPS.filter((d) => hit(`drop ${d.number} ${d.name ?? ""} ${d.tagline}`)).map((d) => ({ href: `/drops/${d.slug}`, label: `DROP ${d.number} · ${dropTitle(d)}`, sub: d.tagline })),
    categories: CATEGORIES.filter((c) => hit(c.name)).map((c) => ({ href: `/shop?categoria=${c.slug}`, label: c.name })),
  };
}

export const SEARCH_SUGGESTIONS = ["Hoodie", "Camisetas", "Drop 001", "Cargo", "Boné"];
