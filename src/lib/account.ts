"use client";

import { createLocalStore } from "./store";
export { LEVELS, DEMO_ACCOUNT, type DemoOrder } from "./levels";

/**
 * Conta do cliente. HOJE NÃO EXISTE LOGIN: a tela mostra visitante e uma PRÉVIA do estado logado
 * com dados de exemplo (rotulados). Reais aqui: wishlist e tamanhos favoritos (deste navegador).
 */
export const favSizes = createLocalStore<{ top?: string; bottom?: string; socks?: string }>("gs-sizes", {});
export const accountPreview = createLocalStore<boolean>("gs-account-preview", false);
