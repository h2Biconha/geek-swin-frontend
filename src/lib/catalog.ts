import data from "./catalog.json";

/**
 * Fonte única dos dados da loja: src/lib/catalog.json.
 * Para adicionar uma peça, inclua um objeto em "products": a rota /product/<slug> nasce sozinha.
 * Quando o back-end existir, estas funções passam a ler a API (ver BACKEND.md).
 */
export type Media = { src: string; view: string; alt?: string; type?: "image" | "video"; poster?: string };

export type Product = {
  slug: string;
  number: string;
  name: string;
  category: string;
  price: number;
  compareAt: number | null;
  specs: string;
  color: string;
  drop: string | null; // número do drop ("001") ou null para a linha Core
  edition: number | null; // tiragem numerada
  stockLeft: number | null; // null = não exibimos contador
  sizes: string[];
  soldOut: string[];
  sizeTable: string;
  addedAt: string;
  rank: number; // ordem de "mais vendidos" (virá dos pedidos pagos)
  featured: boolean;
  media: Media[];
  description: string;
  fabric: string[];
  fit: string;
};

export type Look = { n: string; name: string; products: string[]; text: string };

export type Drop = {
  number: string;
  slug: string;
  name: string | null;
  tagline: string;
  quote: string;
  concept: string;
  manifesto: string[];
  story: { title: string; text: string }[];
  opensAtUTC: string | null;
  closesAtUTC: string | null;
  presale: boolean;
  shipsFrom: string | null;
  heroArt: string | null;
  heroMedia: Media | null;
  gallery: Media[];
  video: Media | null;
  looks: Look[];
  status?: "sold-out" | "closed"; // força um status (ex.: encerrado manualmente)
};

export type Review = { id: string; product: string; rating: number; text: string; name: string; verified: boolean; date: string; size?: string };
export type SizeTable = { label: string; columns: string[]; rows: (string | number)[][] };

export const SITE = data.site;
export const PRODUCTS = data.products as Product[];
export const DROPS = data.drops as Drop[];
export const CATEGORIES = data.categories;
export const SIZE_TABLES = data.sizeTables as Record<string, SizeTable>;
export const REVIEWS = data.reviews as Review[];
export const COMMUNITY = data.community as { instagram: string; posts: Media[] };
export const { freeShippingFrom: FREE_SHIPPING_FROM, installments: INSTALLMENTS, pixDiscount: PIX_DISCOUNT } = data.commerce;

export const getProduct = (slug: string) => PRODUCTS.find((p) => p.slug === slug);
export const getDrop = (slugOrNumber: string | null) => DROPS.find((d) => d.slug === slugOrNumber || d.number === slugOrNumber);
export const categoryName = (slug: string) => CATEGORIES.find((c) => c.slug === slug)?.name ?? slug;
export const dropProducts = (d: Drop) => PRODUCTS.filter((p) => p.drop === d.number);
export const coreProducts = () => PRODUCTS.filter((p) => !p.drop);
export const reviewsFor = (slug: string) => REVIEWS.filter((r) => r.product === slug);
/** total da tiragem numerada do drop (calculado, nunca digitado no texto) */
export const editionTotal = (d: Drop) => dropProducts(d).reduce((s, p) => s + (p.edition ?? 0), 0);
export const editionLeft = (d: Drop) => dropProducts(d).reduce((s, p) => s + (p.stockLeft ?? 0), 0);

/* ---------- preço ---------- */
export const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
// centavos inteiros evitam erro de ponto flutuante (429,90 / 6 = 71,65, não 71,64)
export const installment = (v: number) => brl(Math.floor(Math.round(v * 100) / INSTALLMENTS) / 100);
const cents = (v: number) => Math.round(v * 100);
/** preço no Pix, calculado em centavos (o desconto arredonda uma vez só, igual no checkout) */
export const pixPrice = (v: number) => (cents(v) - Math.round(cents(v) * PIX_DISCOUNT)) / 100;
export const discountPct = (p: Product) => (p.compareAt ? Math.round((1 - p.price / p.compareAt) * 100) : 0);

/* ---------- disponibilidade ---------- */
export type Availability = "available" | "low" | "sold-out" | "coming-soon";
const LOW_ABS = 20;
const LOW_PCT = 0.15;

/** Disponibilidade do produto. `dropOpen` vem do status do drop (ver drops.ts). */
export function availability(p: Product, dropState?: DropPhase): Availability {
  if (dropState === "coming-soon") return "coming-soon";
  const allSizesOut = p.sizes.every((s) => p.soldOut.includes(s));
  if (allSizesOut || p.stockLeft === 0 || dropState === "sold-out" || dropState === "closed") return "sold-out";
  if (p.stockLeft != null && p.edition && (p.stockLeft <= LOW_ABS || p.stockLeft / p.edition <= LOW_PCT)) return "low";
  return "available";
}

/* ---------- fase do drop (pura, recebe o "agora") ---------- */
export type DropPhase = "coming-soon" | "presale" | "upcoming" | "live" | "sold-out" | "closed";

export function dropPhase(d: Drop, now: number): DropPhase {
  if (d.status) return d.status;
  const items = dropProducts(d);
  if (items.length && items.every((p) => p.stockLeft === 0 || p.sizes.every((s) => p.soldOut.includes(s)))) return "sold-out";
  if (d.closesAtUTC && now >= Date.parse(d.closesAtUTC)) return "closed";
  if (!d.opensAtUTC || !items.length) return "coming-soon";
  if (now < Date.parse(d.opensAtUTC)) return d.presale ? "presale" : "upcoming";
  return "live";
}

export const PHASE_LABEL: Record<DropPhase, string> = {
  "coming-soon": "COMING SOON",
  presale: "PRÉ-VENDA",
  upcoming: "PRÓXIMO DROP",
  live: "DROP AO VIVO",
  "sold-out": "SOLD OUT",
  closed: "DROP ENCERRADO",
};

/** datas sempre no horário de Brasília */
const BRT = { timeZone: "America/Sao_Paulo" } as const;
export const dateLabel = (iso: string) => new Date(iso).toLocaleDateString("pt-BR", { ...BRT, day: "2-digit", month: "2-digit" });
export const timeLabel = (iso: string) => `${new Date(iso).toLocaleTimeString("pt-BR", { ...BRT, hour: "numeric" })}h`;
export const shipsLabel = (iso: string) => {
  const [, m, d] = iso.split("-");
  return `${d}/${m}`;
};
export const dropTitle = (d: Drop) => d.name ?? "????";
export const asset = (src: string) => (globalThis as { __GS_ASSETS?: Record<string, string> }).__GS_ASSETS?.[src] ?? src;
