import { BRAND, SITE_URL } from "./brand";
import { availability, dropPhase, dropTitle, type Drop, type Product } from "./catalog";
import type { ListingDef } from "./merch/listings";

/**
 * Dados estruturados (schema.org). Renderizados como <script type="application/ld+json">.
 * Sem aggregateRating/review enquanto não houver avaliação real.
 */
export const abs = (path: string) => `${SITE_URL}${path}`;

export const organizationLd = () => ({
  "@context": "https://schema.org",
  "@type": "Organization",
  name: BRAND.name,
  url: SITE_URL,
  logo: abs("/icon.svg"),
  description: BRAND.description,
  sameAs: [`https://instagram.com/${BRAND.instagram}`],
});

export const websiteLd = () => ({
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: BRAND.name,
  url: SITE_URL,
});

export const breadcrumbLd = (items: [string, string][]) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: items.map(([name, path], i) => ({ "@type": "ListItem", position: i + 1, name, item: abs(path) })),
});

export function productLd(p: Product, d?: Drop) {
  const phase = d ? dropPhase(d, Date.now()) : undefined;
  const a = availability(p, phase);
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    sku: `GS-${p.number}`,
    description: p.description,
    image: p.media.map((m) => abs(m.src)),
    brand: { "@type": "Brand", name: BRAND.name },
    color: p.color,
    offers: {
      "@type": "Offer",
      url: abs(`/product/${p.slug}`),
      priceCurrency: "BRL",
      price: p.price.toFixed(2),
      // antes de abrir não dá para comprar (OutOfStock); pré-venda aberta = PreOrder
      availability: a === "sold-out" ? "https://schema.org/SoldOut" : a === "coming-soon" ? "https://schema.org/OutOfStock" : phase === "presale" ? "https://schema.org/PreOrder" : "https://schema.org/InStock",
      itemCondition: "https://schema.org/NewCondition",
    },
  };
}

export const dropLd = (d: Drop) => ({
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: `Drop ${d.number} · ${dropTitle(d)}`,
  description: d.concept,
  url: abs(`/drops/${d.slug}`),
});

/** página de categoria/coleção: CollectionPage com a lista de peças (ItemList) */
export const listingLd = (l: ListingDef, products: Product[]) => ({
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: l.seoTitle,
  description: l.description,
  url: abs(`/shop/${l.slug}`),
  mainEntity: {
    "@type": "ItemList",
    numberOfItems: products.length,
    itemListElement: products.map((p, i) => ({ "@type": "ListItem", position: i + 1, url: abs(`/product/${p.slug}`), name: p.name })),
  },
});
