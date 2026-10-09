"use client";

import { useSyncExternalStore } from "react";
import { dropPhase, type Drop } from "./catalog";
import { useInventoryMap } from "./inventory";

/**
 * Relógio compartilhado. As páginas são geradas no build, então no HTML (e na hidratação) vale a hora
 * do build (BUILD_TIME, igual no servidor e no navegador). Logo depois o navegador assume a hora real.
 */
import { BUILD_TIME } from "./clock";
export { BUILD_TIME };

type Channel = { listeners: Set<() => void>; id?: ReturnType<typeof setInterval>; value: number; subscribe: (cb: () => void) => () => void; get: () => number };
const channels = new Map<number, Channel>();

/** Um relógio por intervalo, com funções estáveis (o React não reassina a cada render). */
function channel(ms: number): Channel {
  let c = channels.get(ms);
  if (c) return c;
  const ch: Channel = {
    listeners: new Set(),
    value: Date.now(),
    get: () => ch.value,
    subscribe: (cb) => {
      ch.listeners.add(cb);
      if (!ch.id) {
        ch.value = Date.now();
        ch.id = setInterval(() => {
          ch.value = Date.now();
          ch.listeners.forEach((l) => l());
        }, ms);
      }
      return () => {
        ch.listeners.delete(cb);
        if (!ch.listeners.size && ch.id) {
          clearInterval(ch.id);
          ch.id = undefined;
        }
      };
    },
  };
  channels.set(ms, (c = ch));
  return c;
}

const serverNow = () => BUILD_TIME;

export function useNow(ms = 1000) {
  const c = channel(ms);
  return useSyncExternalStore(c.subscribe, c.get, serverNow);
}

export function useDropPhase(d: Drop) {
  const now = useNow(30_000);
  const stock = useInventoryMap();
  return dropPhase(d, now, stock ?? undefined);
}

export function splitCountdown(target: number, now: number) {
  const t = Math.max(0, target - now);
  const s = Math.floor(t / 1000);
  return { done: t === 0, d: Math.floor(s / 86400), h: Math.floor((s % 86400) / 3600), m: Math.floor((s % 3600) / 60), s: s % 60 };
}
