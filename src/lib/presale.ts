"use client";

import { useSyncExternalStore } from "react";
import { DROP, DROP_OPENS_AT, type Product } from "./products";

export { OPENS_LABEL, SHIPS_FROM_LABEL } from "./products";

/**
 * Pré-venda do drop: antes de `drop.opensAtUTC`, as peças do drop são vendidas como pré-venda
 * e enviadas a partir de `drop.shipsFrom` (catalog.json). Depois da abertura viram venda normal.
 *
 * As páginas são geradas no build, então a hora é conferida no navegador, com o relógio de quem está vendo.
 */
const subscribe = (cb: () => void) => {
  const id = setInterval(cb, 60_000); // reavalia a cada minuto (vira sozinho na hora da abertura)
  return () => clearInterval(id);
};
const beforeOpen = () => DROP.presale && Date.now() < DROP_OPENS_AT;

// No HTML do build e na hidratação vale o valor fixo do catálogo (igual dos dois lados, sem erro de
// hidratação); logo depois o navegador confere a hora real e esconde a pré-venda se o drop já abriu.
const serverSnapshot = () => DROP.presale;

export function usePresaleOpen() {
  return useSyncExternalStore(subscribe, beforeOpen, serverSnapshot);
}

export const isPresaleItem = (p: Product, presaleOpen: boolean) => presaleOpen && p.drop;
