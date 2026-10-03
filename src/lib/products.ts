import catalog from "./catalog.json";

/**
 * Fonte única dos dados da loja: src/lib/catalog.json
 * (o mesmo arquivo usado pelo protótipo HTML em prototipo/data/catalog.json).
 * Para adicionar uma peça, inclua um objeto em "products" e a rota /produto/<slug> nasce sozinha.
 */
export type Product = {
  slug: string;
  number: string;
  name: string;
  category: string;
  price: number;
  compareAt?: number;
  badge?: string;
  specs: string;
  image: string; // arquivo em /public/products
  modelImage: string; // foto no modelo (hover do card e galeria)
  drop: boolean;
  stockLeft?: number;
  edition?: number;
  sizes: string[];
  soldOut: string[];
  sizeTable: keyof typeof catalog.sizeTables;
  description: string;
  fabric: string[];
  model: string;
};

export type Look = { n: string; name: string; image: string; products: string[]; text: string };
export type SizeTable = { label: string; columns: string[]; rows: (string | number)[][] };

export const PRODUCTS = catalog.products as Product[];
export const LOOKS = catalog.looks as Look[];
export const CATEGORIES = catalog.categories;
export const SIZE_TABLES = catalog.sizeTables as Record<string, SizeTable>;
export const DROP = catalog.drop;
export const DROP_OPENS_AT = Date.parse(catalog.drop.opensAtUTC);
export const FREE_SHIPPING_FROM = catalog.freeShippingFrom;
export const INSTALLMENTS = catalog.installments;
export const PIX_DISCOUNT = catalog.pixDiscount;

export const DROP_ITEMS = PRODUCTS.filter((p) => p.drop);
// total da tiragem numerada: os textos usam este número para nunca divergir do contador
export const EDITION_TOTAL = DROP_ITEMS.reduce((s, p) => s + (p.edition ?? 0), 0);
export const getProduct = (slug: string) => PRODUCTS.find((p) => p.slug === slug);
export const categoryName = (slug: string) => CATEGORIES.find((c) => c.slug === slug)?.name ?? slug;
export const img = (file: string) => `/products/${file}`;

export const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
// centavos inteiros evitam erro de ponto flutuante (429,90 / 6 = 71,65, não 71,64)
export const installment = (v: number) => brl(Math.floor(Math.round(v * 100) / INSTALLMENTS) / 100);
export const pix = (v: number) => brl(v * (1 - PIX_DISCOUNT));
export const discount = (p: Product) => (p.compareAt ? Math.round((1 - p.price / p.compareAt) * 100) : 0);

/** "Complete o look": primeiro quem divide look com a peça, depois o resto do catálogo. */
export function related(p: Product, n = 4) {
  const fromLooks = LOOKS.filter((l) => l.products.includes(p.slug))
    .flatMap((l) => l.products)
    .filter((s) => s !== p.slug);
  const order = [...new Set([...fromLooks, ...PRODUCTS.map((q) => q.slug)])].filter((s) => s !== p.slug);
  return order.slice(0, n).map((s) => getProduct(s)!);
}
