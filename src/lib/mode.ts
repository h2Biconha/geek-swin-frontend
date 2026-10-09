/**
 * Modo da loja, lido no navegador e no servidor (NEXT_PUBLIC_STORE_MODE).
 *
 * - preview: sem servidor de loja. Nada é salvo nem cobrado e a interface diz isso. É o padrão,
 *   e é o modo do arquivo único (ABRIR-GEEK-SWIM.html).
 * - test:    servidor, banco e gateway de TESTE (Mercado Pago sandbox ou provedor "mock"). Nenhuma cobrança real.
 * - live:    venda de verdade. O servidor recusa subir sem banco, gateway e segredos (ver src/server/env.ts).
 */
export type StoreMode = "preview" | "test" | "live";

const raw = process.env.NEXT_PUBLIC_STORE_MODE;
export const STORE_MODE: StoreMode = raw === "live" || raw === "test" ? raw : "preview";
/** true quando existe back-end para chamar (/api/*) */
export const STORE_CONNECTED = STORE_MODE !== "preview";
