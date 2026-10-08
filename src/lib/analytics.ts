/**
 * Ponto único de eventos. Hoje não envia nada: só repassa para GTM (dataLayer) e Meta Pixel (fbq)
 * SE eles estiverem carregados (ver NEXT_PUBLIC_GTM_ID / NEXT_PUBLIC_META_PIXEL_ID no .env.example).
 */
type W = { dataLayer?: unknown[]; fbq?: (...a: unknown[]) => void };
const META: Record<string, string> = { add_to_cart: "AddToCart", view_item: "ViewContent", begin_checkout: "InitiateCheckout", sign_up: "Lead", add_to_wishlist: "AddToWishlist", search: "Search", purchase: "Purchase" };

export function track(event: string, props: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;
  const w = window as unknown as W;
  w.dataLayer?.push({ event, ...props });
  if (META[event]) w.fbq?.("track", META[event], props);
}
