/**
 * Nome e contatos da marca num lugar só.
 * Trocar o nome do site inteiro = trocar BRAND.name aqui.
 */
export const BRAND = {
  name: "GEEK SWIM",
  short: "GS",
  instagram: "geekswim",
  /** texto de apoio usado em SEO e rodapé */
  description: "Streetwear nascido da cultura gamer. Drops numerados, tiragem limitada, sem reposição.",
  // TODO(back): dados reais antes de vender (CDC exige CNPJ e contato visíveis)
  email: "contato@geekswim.com.br",
  whatsapp: null as string | null,
  cnpj: null as string | null,
  city: "Brasil",
} as const;

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
