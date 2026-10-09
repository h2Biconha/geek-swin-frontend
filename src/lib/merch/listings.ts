import { CATEGORIES, coreProducts, getCategory, LISTINGS, categoryProducts, PRODUCTS, type Category, type Inventory, type Product } from "../catalog";

/**
 * Listagens da loja (/shop/<slug>): categorias de produto + novidades, coleção Core e sale.
 * Tudo vem do catálogo: uma categoria nova em catalog.json ganha página, menu, sitemap e filtros sozinha.
 * Categoria sem peça publicada: a página existe com estado vazio, fica fora do menu principal e do sitemap (noindex).
 */
export type ListingKind = "category" | "new" | "collection" | "sale";
export type ListingDef = { slug: string; kind: ListingKind; name: string; seoTitle: string; headline: string; description: string; intro: string; art: string | null; category?: Category; days?: number };

const fromCategory = (c: Category): ListingDef => ({ slug: c.slug, kind: "category", name: c.name, seoTitle: c.seoTitle, headline: c.headline, description: c.description, intro: c.intro, art: c.art, category: c });
const ARTS: Record<string, string> = { new: "/art/hoodie-line.svg", collection: "/art/tee-black-front.svg", sale: "/art/tee-front.svg" };

export const allListings = (): ListingDef[] => [
  ...LISTINGS.map((l) => ({ slug: l.slug, kind: l.kind, name: l.name, seoTitle: l.seoTitle, headline: l.headline, description: l.description, intro: l.intro, art: ARTS[l.kind] ?? null, days: l.days })),
  ...CATEGORIES.map(fromCategory),
];
export const getListing = (slug: string) => allListings().find((l) => l.slug === slug);

/** "novidades": o lote mais recente (peças que entraram até `days` dias antes da última entrada). Não depende do relógio. */
export function newArrivals(days = 21): Product[] {
  if (!PRODUCTS.length) return [];
  const last = Math.max(...PRODUCTS.map((p) => Date.parse(p.addedAt)));
  return PRODUCTS.filter((p) => Date.parse(p.addedAt) >= last - days * 86_400_000).sort((a, b) => b.addedAt.localeCompare(a.addedAt) || a.rank - b.rank);
}

export const onSale = (p: Product) => p.compareAt != null && p.compareAt > p.price;

export function listingProducts(l: ListingDef): Product[] {
  switch (l.kind) {
    case "category":
      return categoryProducts(l.slug);
    case "new":
      return newArrivals(l.days);
    case "collection":
      return coreProducts();
    case "sale":
      return PRODUCTS.filter(onSale);
  }
}

/** a listagem aparece no menu e no sitemap? (sale só com promoção real; categoria só com peça) */
export const listingLive = (l: ListingDef) => listingProducts(l).length > 0;
/** rotas geradas: toda categoria (mesmo vazia, com estado vazio) + novidades/core; sale só quando existe */
export const listingSlugs = () => allListings().filter((l) => l.kind === "category" || listingLive(l)).map((l) => l.slug);

/** categorias do menu, na ordem do catálogo */
export const navCategories = () => CATEGORIES.filter((c) => categoryProducts(c.slug).length > 0);
/** categorias preparadas, ainda sem peça (aparecem como "em preparação", sem fingir estoque) */
export const preparingCategories = () => CATEGORIES.filter((c) => categoryProducts(c.slug).length === 0);

/* ---------- filtros ---------- */
export type FacetOption = { value: string; label: string; count: number };
export type Facet = { key: string; label: string; options: FacetOption[] };

const SIZE_ORDER = ["PP", "P", "M", "G", "GG", "XG", "38", "40", "42", "44", "46", "38-40", "41-43", "44-46", "Único"];
export const PRICE_RANGES: [string, string, (v: number) => boolean][] = [
  ["ate-150", "Até R$ 150", (v) => v <= 150],
  ["150-250", "R$ 150 a 250", (v) => v > 150 && v <= 250],
  ["250-mais", "Acima de R$ 250", (v) => v > 250],
];
const ATTR_LABEL: Record<string, string> = { modelagem: "Modelagem", modelo: "Modelo", tipo: "Tipo", marca: "Marca" };
export const collectionLabel = (p: Product) => (p.drop ? `Drop ${p.drop}` : "Core");

function count(products: Product[], values: (p: Product) => string[]) {
  const m = new Map<string, number>();
  for (const p of products) for (const v of new Set(values(p))) m.set(v, (m.get(v) ?? 0) + 1);
  return m;
}

/** valores de um filtro para a peça */
export function facetValues(key: string, p: Product): string[] {
  if (key === "tamanho") return p.sizes;
  if (key === "cor") return [p.color];
  if (key === "colecao") return [collectionLabel(p)];
  if (key === "preco") return PRICE_RANGES.filter(([, , fn]) => fn(p.price)).map(([k]) => k);
  if (key === "marca") return [p.maker?.brand ?? "GEEK SWIM"];
  return p.attrs[key] ? [p.attrs[key]] : [];
}

/** filtros com pelo menos duas opções (filtro de uma opção só não ajuda ninguém) */
export function facetsFor(keys: string[], products: Product[]): Facet[] {
  return keys
    .filter((k) => k !== "disp")
    .map((key): Facet => {
      const m = count(products, (p) => facetValues(key, p));
      let options = [...m.entries()].map(([value, n]) => ({ value, label: value, count: n }));
      if (key === "tamanho") options.sort((a, b) => SIZE_ORDER.indexOf(a.value) - SIZE_ORDER.indexOf(b.value));
      else if (key === "preco") options = PRICE_RANGES.filter(([k]) => m.has(k)).map(([k, l]) => ({ value: k, label: l, count: m.get(k)! }));
      else options.sort((a, b) => a.label.localeCompare(b.label, "pt-BR"));
      const label = key === "tamanho" ? "Tamanho disponível" : key === "cor" ? "Cor" : key === "colecao" ? "Coleção" : key === "preco" ? "Preço" : (ATTR_LABEL[key] ?? key);
      return { key, label, options };
    })
    .filter((f) => f.options.length > 1);
}

export type Filters = Record<string, string[]>;
/** a peça passa em todos os filtros? (mesmo filtro: OU; filtros diferentes: E). Tamanho conta só se não estiver esgotado. */
export function matchesFilters(p: Product, f: Filters, inv?: Inventory) {
  return Object.entries(f).every(([key, values]) => {
    if (!values.length) return true;
    if (key === "tamanho") return values.some((s) => p.sizes.includes(s) && inv?.sizes[s] !== 0);
    const own = facetValues(key, p);
    return values.some((v) => own.includes(v));
  });
}

export const SORTS = [
  ["destaques", "Destaques"],
  ["recentes", "Mais recentes"],
  ["menor", "Menor preço"],
  ["maior", "Maior preço"],
] as const;
export type SortKey = (typeof SORTS)[number][0];

export function sortProducts(list: Product[], ordem: string) {
  const s = [...list];
  if (ordem === "recentes") s.sort((a, b) => b.addedAt.localeCompare(a.addedAt) || a.rank - b.rank);
  else if (ordem === "menor") s.sort((a, b) => a.price - b.price);
  else if (ordem === "maior") s.sort((a, b) => b.price - a.price);
  else s.sort((a, b) => Number(b.featured) - Number(a.featured) || a.rank - b.rank);
  return s;
}

export { getCategory };
