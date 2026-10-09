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
  /** preço "de" só quando a peça foi vendida por esse valor antes (nunca preço inflado) */
  compareAt: number | null;
  specs: string;
  color: string;
  drop: string | null; // número do drop ("001") ou null para a linha Core
  edition: number | null; // tiragem numerada (teto de vendas, controlado pelo servidor)
  sizes: string[];
  sizeTable: string;
  addedAt: string;
  rank: number; // ordem editorial ("destaques"); "mais vendidos" só com dados de pedidos
  featured: boolean;
  media: Media[];
  description: string;
  fabric: string[];
  fit: string;
};

/**
 * Estoque real, vindo do servidor (/api/stock). Não existe no catálogo: sem servidor (prévia),
 * o site não mostra contador nenhum.
 * sizes[tamanho]: unidades disponíveis, 0 = esgotado, null = produção sob demanda (sem limite).
 */
export type Inventory = { sizes: Record<string, number | null>; editionLeft: number | null };

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
  /** força um status pelo catálogo (decisão administrativa): encerrar, arquivar ou esgotar um drop */
  status?: "sold-out" | "archived";
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
export const COMMERCE = data.commerce;
export const { freeShippingFrom: FREE_SHIPPING_FROM, installments: INSTALLMENTS, pixDiscount: PIX_DISCOUNT } = data.commerce;
export const SPECS_CONFIRMED = data.site.specsConfirmed;

export const getProduct = (slug: string) => PRODUCTS.find((p) => p.slug === slug);
export const getDrop = (slugOrNumber: string | null) => DROPS.find((d) => d.slug === slugOrNumber || d.number === slugOrNumber);
export const categoryName = (slug: string) => CATEGORIES.find((c) => c.slug === slug)?.name ?? slug;
export const dropProducts = (d: Drop) => PRODUCTS.filter((p) => p.drop === d.number);
export const coreProducts = () => PRODUCTS.filter((p) => !p.drop);
export const reviewsFor = (slug: string) => REVIEWS.filter((r) => r.product === slug);
/** total da tiragem numerada do drop (calculado, nunca digitado no texto) */
export const editionTotal = (d: Drop) => dropProducts(d).reduce((s, p) => s + (p.edition ?? 0), 0);
/** peças numeradas ainda disponíveis no drop, só com estoque real (null = desconhecido) */
export function editionLeft(d: Drop, stock?: Record<string, Inventory> | null): number | null {
  if (!stock) return null;
  const numbered = dropProducts(d).filter((p) => p.edition != null);
  if (!numbered.length || numbered.some((p) => stock[p.slug]?.editionLeft == null)) return null;
  return numbered.reduce((s, p) => s + (stock[p.slug].editionLeft ?? 0), 0);
}

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

/** tamanho esgotado de verdade (só com estoque do servidor) */
export const sizeOut = (inv: Inventory | undefined, size: string) => inv?.sizes[size] === 0;
/** unidades que ainda podem ser vendidas desse tamanho (null = sem limite conhecido) */
export function sizeLeft(p: Product, inv: Inventory | undefined, size: string): number | null {
  if (!inv) return null;
  const s = inv.sizes[size];
  const e = inv.editionLeft;
  if (s == null) return e;
  return e == null ? s : Math.min(s, e);
}
export const productSoldOut = (p: Product, inv?: Inventory) => !!inv && (inv.editionLeft === 0 || p.sizes.every((s) => inv.sizes[s] === 0));

/** Disponibilidade da peça a partir da fase do drop e do estoque real (quando existe). */
export function availability(p: Product, phase?: DropPhase, inv?: Inventory): Availability {
  if (phase === "coming-soon" || phase === "upcoming") return "coming-soon";
  if (phase === "sold-out" || phase === "archived" || productSoldOut(p, inv)) return "sold-out";
  if (inv?.editionLeft != null && p.edition && (inv.editionLeft <= LOW_ABS || inv.editionLeft / p.edition <= LOW_PCT)) return "low";
  return "available";
}
/** dá para comprar agora? (pré-venda e drop aberto) */
export const isPurchasablePhase = (phase?: DropPhase) => phase === undefined || phase === "presale" || phase === "live";

/* ---------- fase do drop (pura, recebe o "agora") ---------- */
export type DropPhase = "coming-soon" | "presale" | "upcoming" | "live" | "sold-out" | "archived";

/**
 * Regras de transição, em ordem:
 * 1. status forçado no catálogo (decisão administrativa);
 * 2. fechado por data (closesAtUTC) → archived;
 * 3. sem data ou sem peças → coming-soon;
 * 4. todas as peças esgotadas pelo estoque real → sold-out (vale também na pré-venda);
 * 5. antes da abertura → presale (se o drop tem pré-venda) ou upcoming;
 * 6. senão → live.
 */
export function dropPhase(d: Drop, now: number, stock?: Record<string, Inventory>): DropPhase {
  if (d.status) return d.status;
  const items = dropProducts(d);
  if (d.closesAtUTC && now >= Date.parse(d.closesAtUTC)) return "archived";
  if (!d.opensAtUTC || !items.length) return "coming-soon";
  const soldOut = !!stock && items.every((p) => productSoldOut(p, stock[p.slug]));
  if (soldOut) return "sold-out";
  if (now < Date.parse(d.opensAtUTC)) return d.presale ? "presale" : "upcoming";
  return "live";
}

export const PHASE_LABEL: Record<DropPhase, string> = {
  "coming-soon": "EM BREVE",
  presale: "PRÉ-VENDA",
  upcoming: "PRÓXIMO DROP",
  live: "DROP AO VIVO",
  "sold-out": "ESGOTADO",
  archived: "ARQUIVO",
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
