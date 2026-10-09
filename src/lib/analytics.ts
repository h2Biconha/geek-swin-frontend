import { getProduct, categoryName } from "./catalog";
import { hasConsent } from "./consent";

/**
 * Ponto único de eventos do funil (nomes do GA4 e-commerce). Envia para o dataLayer (GTM) e para o
 * Meta Pixel SÓ depois do consentimento de cookies de medição (ver src/lib/consent.ts).
 * Nunca mande e-mail, nome, CPF, telefone ou endereço aqui.
 */
type W = { dataLayer?: unknown[]; fbq?: (...a: unknown[]) => void };
const META: Record<string, string> = { add_to_cart: "AddToCart", view_item: "ViewContent", begin_checkout: "InitiateCheckout", add_payment_info: "AddPaymentInfo", sign_up: "Lead", add_to_wishlist: "AddToWishlist", search: "Search", purchase: "Purchase" };

export type GaItem = { item_id: string; item_name: string; item_category: string; item_variant?: string; item_list_name?: string; price: number; quantity: number; index?: number };

export function gaItem(slug: string, size?: string, qty = 1, extra: Partial<GaItem> = {}): GaItem | null {
  const p = getProduct(slug);
  if (!p) return null;
  return { item_id: `GS-${p.number}`, item_name: p.name, item_category: categoryName(p.category), item_variant: size, price: p.price, quantity: qty, ...extra };
}

/** payload GA4 padrão: currency, value, items */
export function itemPayload(lines: { slug: string; size?: string; qty: number }[], extra: Record<string, unknown> = {}) {
  const items = lines.map((l) => gaItem(l.slug, l.size, l.qty)).filter((x): x is GaItem => !!x);
  return { currency: "BRL", value: Math.round(items.reduce((s, i) => s + i.price * i.quantity, 0) * 100) / 100, items, ...extra };
}

export function track(event: string, props: Record<string, unknown> = {}) {
  if (typeof window === "undefined" || !hasConsent("analytics")) return;
  const w = window as unknown as W;
  // GA4 recomenda limpar o objeto ecommerce anterior
  if ("items" in props) w.dataLayer?.push({ ecommerce: null });
  w.dataLayer?.push("items" in props ? { event, ecommerce: props } : { event, ...props });
  if (META[event] && hasConsent("marketing")) w.fbq?.("track", META[event], { currency: props.currency, value: props.value, content_type: "product", content_ids: (props.items as GaItem[] | undefined)?.map((i) => i.item_id) });
}

/** purchase uma vez por pedido (o mesmo navegador não reenvia ao recarregar a página do pedido) */
export function trackPurchaseOnce(orderId: string, payload: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  const key = `gs-purchase-${orderId}`;
  try {
    if (localStorage.getItem(key)) return;
    localStorage.setItem(key, "1");
  } catch {}
  track("purchase", { transaction_id: orderId, ...payload });
}
