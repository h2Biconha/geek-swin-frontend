"use client";

import { createLocalStore } from "./store";
import type { OrderView } from "./commerce/types";
import { STORE_CONNECTED } from "./mode";

/** Tamanhos favoritos (neste navegador). A página da peça já abre com o seu tamanho marcado. */
export type FavSizes = { top?: string; bottom?: string; socks?: string };
export const favSizes = createLocalStore<FavSizes>("gs-sizes", {});
export const favFor = (sizeTable: string, fav: FavSizes) => (sizeTable === "top" || sizeTable === "bottom" || sizeTable === "socks" ? fav[sizeTable] : undefined);

export type Me = { customer: { email: string; name: string | null } | null; orders: OrderView[]; earlyAccess?: string[] };

export async function fetchMe(): Promise<Me | "erro"> {
  if (!STORE_CONNECTED) return { customer: null, orders: [], earlyAccess: [] };
  try {
    const r = await fetch("/api/me", { cache: "no-store" });
    if (!r.ok) return "erro";
    return (await r.json()) as Me;
  } catch {
    return "erro";
  }
}

export async function requestLink(email: string, next = "/account"): Promise<{ ok: true; devLink?: string } | { ok: false; message: string }> {
  try {
    const r = await fetch("/api/auth/link", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, next }) });
    const j = await r.json().catch(() => ({}));
    return r.ok ? { ok: true, devLink: j.devLink } : { ok: false, message: j.message ?? "Não deu certo agora. Tente de novo." };
  } catch {
    return { ok: false, message: "Sem conexão. Tente de novo." };
  }
}

export async function logout() {
  await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
}
