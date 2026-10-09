import "server-only";
import { getProduct } from "@/lib/catalog";
import { qualifiesFreeShipping, tableShipping, toCents, type ShippingQuote } from "@/lib/commerce/pricing";
import type { CartLine } from "@/lib/commerce/types";
import { env } from "./env";

/**
 * Cotação de frete.
 * - "table" (padrão): tabela de catalog.json > commerce.shippingTable. Valores fixos, iguais para todo o Brasil.
 * - "melhorenvio": cotação real (PAC/SEDEX e transportadoras) pela API do Melhor Envio.
 *   ATENÇÃO: o adaptador segue a documentação pública, mas não foi testado contra a conta real.
 * Em qualquer caso, o servidor aplica o frete grátis acima do valor mínimo.
 */
export async function quoteShipping(cep: string, items: CartLine[], subtotalCents: number): Promise<ShippingQuote[]> {
  if (env.shipping === "melhorenvio" && env.melhorEnvioToken && env.shipFromCep) {
    const quotes = await melhorEnvio(cep, items, subtotalCents);
    if (quotes.length) return quotes;
  }
  return tableShipping(subtotalCents);
}

// peso/medidas por categoria (estimativa de embalagem; ajuste quando tiver os números do fornecedor)
const PACK: Record<string, { w: number; h: number; l: number; kg: number }> = {
  camisetas: { w: 25, h: 3, l: 30, kg: 0.3 },
  moletons: { w: 30, h: 8, l: 35, kg: 0.9 },
  calcas: { w: 30, h: 5, l: 35, kg: 0.7 },
  acessorios: { w: 20, h: 12, l: 20, kg: 0.2 },
  kits: { w: 30, h: 8, l: 35, kg: 0.9 },
};

async function melhorEnvio(cep: string, items: CartLine[], subtotalCents: number): Promise<ShippingQuote[]> {
  const base = env.melhorEnvioSandbox ? "https://sandbox.melhorenvio.com.br" : "https://www.melhorenvio.com.br";
  const products = items.map((i) => {
    const p = getProduct(i.slug)!;
    const k = PACK[p.category] ?? PACK.camisetas;
    return { id: `${i.slug}-${i.size}`, width: k.w, height: k.h, length: k.l, weight: k.kg, insurance_value: p.price, quantity: i.qty };
  });
  try {
    const res = await fetch(`${base}/api/v2/me/shipment/calculate`, {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json", Authorization: `Bearer ${env.melhorEnvioToken}`, "User-Agent": `GEEK SWIM (${env.adminEmail ?? "contato@geekswim.com.br"})` },
      body: JSON.stringify({ from: { postal_code: env.shipFromCep }, to: { postal_code: cep }, products }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return [];
    const data = (await res.json()) as { id: number; name: string; price?: string; custom_price?: string; custom_delivery_time?: number; company?: { name: string }; error?: string }[];
    const ok = data.filter((s) => !s.error && (s.custom_price ?? s.price));
    const free = qualifiesFreeShipping(subtotalCents);
    const quotes = ok
      .map((s) => ({ id: `me-${s.id}`, name: `${s.company?.name ?? ""} ${s.name}`.trim(), days: s.custom_delivery_time ? `até ${s.custom_delivery_time} dias úteis` : "prazo a confirmar", priceCents: toCents(Number(s.custom_price ?? s.price)) }))
      .sort((a, b) => a.priceCents - b.priceCents)
      .slice(0, 3);
    if (free && quotes.length) quotes[0] = { ...quotes[0], priceCents: 0 };
    return quotes;
  } catch {
    return [];
  }
}
