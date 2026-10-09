"use client";

import { useSyncExternalStore } from "react";
import { fetchMe } from "./account";
import { STORE_CONNECTED } from "./mode";

/**
 * Elegibilidade ao acesso antecipado, só para a INTERFACE (mostrar o botão de compra).
 * Quem decide é o servidor no checkout (sessão + lista/pedidos). Uma consulta a /api/me por carregamento.
 */
let drops: string[] | null = null;
let loading = false;
const listeners = new Set<() => void>();

function load() {
  if (loading || drops || !STORE_CONNECTED) return;
  loading = true;
  void fetchMe().then((me) => {
    drops = me === "erro" ? [] : (me.earlyAccess ?? []);
    listeners.forEach((l) => l());
  });
}
const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};

export function useEarlyAccess(drop: string | null) {
  const list = useSyncExternalStore(subscribe, () => drops, () => null);
  if (drop && typeof window !== "undefined") load();
  return !!drop && !!list?.includes(drop);
}
