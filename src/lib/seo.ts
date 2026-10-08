import { BRAND, SITE_URL } from "./brand";
import { availability, dropPhase, dropTitle, type Drop, type Product } from "./catalog";

/** Dados estruturados (schema.org). Renderizados como <script type="application/ld+json">. */
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
  const a = availability(p, d ? dropPhase(d, Date.now()) : undefined);
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
      availability: a === "sold-out" ? "https://schema.org/SoldOut" : a === "coming-soon" ? "https://schema.org/PreOrder" : d?.presale ? "https://schema.org/PreOrder" : "https://schema.org/InStock",
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
