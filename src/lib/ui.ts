"use client";

import { createMemoryStore } from "./store";

/** Qual camada está aberta. Uma por vez: abrir uma fecha a outra. */
export type Overlay = null | "cart" | "search" | "menu" | "filters";
export const overlay = createMemoryStore<Overlay>(null);
export const openOverlay = (o: Overlay) => overlay.set(o);
export const closeOverlay = () => overlay.set(null);

export type Toast = { id: number; title: string; text?: string; action?: { label: string; href: string } };
export const toasts = createMemoryStore<Toast[]>([]);
let n = 0;
export function toast(t: Omit<Toast, "id">) {
  const id = ++n;
  toasts.set((s) => [...s.slice(-2), { ...t, id }]);
  setTimeout(() => toasts.set((s) => s.filter((x) => x.id !== id)), 4200);
}
