import data from "./catalog.json";

/**
 * Fonte única dos dados da loja: src/lib/catalog.json.
 * Para adicionar uma peça, inclua um objeto em "products": a rota /product/<slug> nasce sozinha.
 * Quando o back-end existir, estas funções passam a ler a API (ver BACKEND.md).
 */
export type Media = { src: string; view: string; alt?: string; type?: "image" | "video"; poster?: string };

export type ProductRole = "top" | "bottom" | "head" | "accessory" | "setup" | "pack";

export type Product = {
  slug: string;
  number: string;
  name: string;
  /** categoria principal (breadcrumb, URL canônica da listagem) */
  category: string;
  /** categorias secundárias: a peça também aparece nessas listagens (ex.: boné em Acessórios) */
  categories: string[];
  price: number;
  /** preço "de" só quando a peça foi vendida por esse valor antes (nunca preço inflado). Com ele, a peça entra em /shop/sale */
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
  /** atributos filtráveis (modelagem, modelo, tipo, marca...). Só valores reais. */
  attrs: Record<string, string>;
  /** termos extras para a busca */
  tags: string[];
  /** combinações configuradas à mão (além dos looks dos drops) */
  pairsWith: string[];
  /** draft/hidden: fora do site, da busca, do sitemap e do checkout */
  status: "published" | "draft" | "hidden";
  /** periféricos e itens de terceiros: fabricante, garantia, compatibilidade, ficha técnica */
  maker?: { brand: string; authored: boolean; warranty?: string; compatibility?: string[]; specs?: [string, string][] };
};

export type Category = {
  slug: string;
  name: string;
  /** título da página para buscadores (o <h1> é o nome) */
  seoTitle: string;
  role: ProductRole;
  group: string;
  headline: string;
  description: string;
  intro: string;
  art: string | null;
  spotlight: "looks" | "silhouettes" | "details" | "types" | "specs" | "bundles";
  highlights: [string, string][];
  facets: string[];
};

/** listagens que não são categoria: novidades, coleção (Core) e sale */
export type Listing = { slug: string; kind: "new" | "collection" | "sale"; name: string; seoTitle: string; headline: string; description: string; intro: string; days?: number; collection?: string };

/**
 * Estoque real, vindo do servidor (/api/stock). Não existe no catálogo: sem servidor (prévia),
 * o site não mostra contador nenhum.
 * sizes[tamanho]: unidades disponíveis, 0 = esgotado, null = produção sob demanda (sem limite).
 */
export type Inventory = { sizes: Record<string, number | null>; editionLeft: number | null };

export type Look = { n: string; name: string; products: string[]; text: string };

/** Acesso antecipado: quem está na lista (ou já comprou) compra antes da abertura geral. Conferido no servidor. */
export type EarlyAccess = { enabled: boolean; opensAtUTC: string; audience: "list" | "customers"; sources?: string[] };

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
  earlyAccess?: EarlyAccess | null;
};

export type Review = { id: string; product: string; rating: number; text: string; name: string; verified: boolean; date: string; size?: string };
export type SizeTable = { label: string; columns: string[]; rows: (string | number)[][] };

export const SITE = data.site;
const ALL_PRODUCTS = data.products as unknown as Product[];
/** só o que está publicado existe para o site, a busca, o sitemap e o checkout */
export const PRODUCTS = ALL_PRODUCTS.filter((p) => p.status === "published");
export const DROPS = data.drops as unknown as Drop[];
export const CATEGORIES = data.categories as unknown as Category[];
export const LISTINGS = data.listings as unknown as Listing[];
export const SIZE_TABLES = data.sizeTables as Record<string, SizeTable>;
export const REVIEWS = data.reviews as Review[];
export const COMMUNITY = data.community as { instagram: string; posts: Media[] };
export const COMMERCE = data.commerce;
export const { installments: INSTALLMENTS, pixDiscount: PIX_DISCOUNT } = data.commerce;
export const SPECS_CONFIRMED = data.site.specsConfirmed;

export const getProduct = (slug: string) => PRODUCTS.find((p) => p.slug === slug);
export const getDrop = (slugOrNumber: string | null) => DROPS.find((d) => d.slug === slugOrNumber || d.number === slugOrNumber);
export const getCategory = (slug: string) => CATEGORIES.find((c) => c.slug === slug);
export const categoryName = (slug: string) => getCategory(slug)?.name ?? slug;
/** URL da listagem da categoria */
export const categoryHref = (slug: string) => `/shop/${slug}`;
/** a peça aparece nessa categoria (principal ou secundária)? */
export const inCategory = (p: Product, slug: string) => p.category === slug || p.categories.includes(slug);
export const categoryProducts = (slug: string) => PRODUCTS.filter((p) => inCategory(p, slug));
/** papel da peça no look (parte de cima, de baixo, cabeça, acessório, setup, kit) */
export const roleOf = (p: Product): ProductRole => getCategory(p.category)?.role ?? "accessory";
export const dropProducts = (d: Drop) => PRODUCTS.filter((p) => p.drop === d.number);
export const coreProducts = () => PRODUCTS.filter((p) => !p.drop);
/** coleção da peça: o drop dela ou a linha Core */
export const collectionOf = (p: Product) => p.drop ?? "core";
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
  if (phase === "coming-soon" || phase === "upcoming" || phase === "early-access") return "coming-soon";
  if (phase === "sold-out" || phase === "archived" || productSoldOut(p, inv)) return "sold-out";
  if (inv?.editionLeft != null && p.edition && (inv.editionLeft <= LOW_ABS || inv.editionLeft / p.edition <= LOW_PCT)) return "low";
  return "available";
}
/** dá para comprar agora? (pré-venda e drop aberto) */
export const isPurchasablePhase = (phase?: DropPhase) => phase === undefined || phase === "presale" || phase === "live";
/** fase da peça agora (Core não tem fase) */
export const productPhase = (p: Product, now: number, stock?: Record<string, Inventory>) => (p.drop ? dropPhase(getDrop(p.drop)!, now, stock) : undefined);
/** dá para pôr na bag agora? (fase do drop + estoque real, quando existe) */
export const isBuyable = (p: Product, now: number, stock?: Record<string, Inventory>) => {
  const a = availability(p, productPhase(p, now, stock), stock?.[p.slug]);
  return a === "available" || a === "low";
};

/* ---------- fase do drop (pura, recebe o "agora") ---------- */
export type DropPhase = "coming-soon" | "presale" | "upcoming" | "early-access" | "live" | "sold-out" | "archived";

/**
 * Regras de transição, em ordem:
 * 1. status forçado no catálogo (decisão administrativa);
 * 2. fechado por data (closesAtUTC) → archived;
 * 3. sem data ou sem peças → coming-soon;
 * 4. todas as peças esgotadas pelo estoque real → sold-out (vale também na pré-venda);
 * 5. dentro da janela de acesso antecipado → early-access (só quem é elegível compra; o servidor confere);
 * 6. antes da abertura → presale (se o drop tem pré-venda) ou upcoming;
 * 7. senão → live.
 */
export function dropPhase(d: Drop, now: number, stock?: Record<string, Inventory>): DropPhase {
  if (d.status) return d.status;
  const items = dropProducts(d);
  if (d.closesAtUTC && now >= Date.parse(d.closesAtUTC)) return "archived";
  if (!d.opensAtUTC || !items.length) return "coming-soon";
  const soldOut = !!stock && items.every((p) => productSoldOut(p, stock[p.slug]));
  if (soldOut) return "sold-out";
  const opens = Date.parse(d.opensAtUTC);
  const early = d.earlyAccess?.enabled ? Date.parse(d.earlyAccess.opensAtUTC) : NaN;
  if (now >= early && now < opens) return "early-access";
  if (now < opens) return d.presale ? "presale" : "upcoming";
  return "live";
}

export const PHASE_LABEL: Record<DropPhase, string> = {
  "coming-soon": "EM BREVE",
  presale: "PRÉ-VENDA",
  upcoming: "PRÓXIMO DROP",
  "early-access": "ACESSO ANTECIPADO",
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
