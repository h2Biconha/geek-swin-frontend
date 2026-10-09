"use client";

import { useSyncExternalStore } from "react";
import type { Inventory } from "./catalog";
import { STORE_CONNECTED } from "./mode";

/**
 * Estoque real no navegador. Uma busca a /api/stock por carregamento (o catálogo é pequeno),
 * renovada ao voltar para a aba e depois de mudanças (compra, erro de estoque).
 * Sem servidor (prévia): fica vazio e a interface não mostra contador nem esgotado.
 */
type State = { data: Record<string, Inventory> | null; at: number; loading: boolean };
let state: State = { data: null, at: 0, loading: false };
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export async function refreshInventory(force = false) {
  if (!STORE_CONNECTED || typeof window === "undefined") return;
  if (state.loading || (!force && Date.now() - state.at < 20_000)) return;
  state = { ...state, loading: true };
  try {
    const res = await fetch("/api/stock", { cache: "no-store" });
    if (res.ok) state = { data: (await res.json()) as Record<string, Inventory>, at: Date.now(), loading: false };
    else state = { ...state, loading: false, at: Date.now() };
  } catch {
    state = { ...state, loading: false, at: Date.now() };
  }
  emit();
}

const subscribe = (cb: () => void) => {
  listeners.add(cb);
  if (listeners.size === 1 && typeof window !== "undefined") {
    void refreshInventory();
    window.addEventListener("focus", onFocus);
  }
  return () => {
    listeners.delete(cb);
    if (!listeners.size) window.removeEventListener("focus", onFocus);
  };
};
const onFocus = () => void refreshInventory();
const get = () => state.data;
const serverGet = () => null;

/** mapa slug → estoque (null enquanto carrega ou em prévia) */
export const useInventoryMap = () => useSyncExternalStore(subscribe, get, serverGet);
export const useInventory = (slug: string) => useInventoryMap()?.[slug];
