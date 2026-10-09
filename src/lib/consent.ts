import { createLocalStore } from "./store";

/**
 * Consentimento de cookies (LGPD). Três categorias:
 * - necessary: sempre ligados (bag, wishlist, sessão, segurança). Não precisam de consentimento.
 * - analytics: medição do funil (Google Tag Manager / GA4).
 * - marketing: Meta Pixel (anúncios).
 * Nenhum script de terceiro carrega antes da escolha. A escolha fica 12 meses e pode ser mudada no rodapé.
 */
export type ConsentState = { v: 1; analytics: boolean; marketing: boolean; at: string } | null;
export const CONSENT_KEY = "gs-consent";
export const consentStore = createLocalStore<ConsentState>(CONSENT_KEY, null, (v) => (v && v.v === 1 && Date.now() - Date.parse(v.at) < 365 * 86400_000 ? v : null));

export const ANALYTICS_CONFIGURED = Boolean(process.env.NEXT_PUBLIC_GTM_ID || process.env.NEXT_PUBLIC_META_PIXEL_ID);

export function hasConsent(kind: "analytics" | "marketing") {
  if (typeof window === "undefined") return false;
  const c = consentStore.read();
  return !!c && c[kind];
}

export function saveConsent(analytics: boolean, marketing: boolean) {
  consentStore.write({ v: 1, analytics, marketing, at: new Date().toISOString() });
}
