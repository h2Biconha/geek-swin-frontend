"use client";

import { useSyncExternalStore } from "react";

/**
 * Store mínima em localStorage, sem biblioteca.
 * useSyncExternalStore mantém todas as telas em sincronia, inclusive entre abas.
 */
export function createLocalStore<T>(key: string, fallback: T, sanitize: (v: T) => T = (v) => v) {
  let cacheRaw: string | null | undefined;
  let cache = fallback;
  let memOnly = false; // navegador sem localStorage (aba anônima restrita): guarda só em memória
  const listeners = new Set<() => void>();

  const read = (): T => {
    if (memOnly) return cache;
    let raw: string | null = null;
    try {
      raw = localStorage.getItem(key);
    } catch {}
    if (raw === cacheRaw) return cache; // mesma referência = React não re-renderiza à toa
    cacheRaw = raw;
    try {
      cache = raw ? sanitize(JSON.parse(raw) as T) : fallback;
    } catch {
      cache = fallback;
    }
    return cache;
  };
  const write = (v: T) => {
    try {
      localStorage.setItem(key, JSON.stringify(v));
    } catch {
      memOnly = true;
      cache = v;
    }
    listeners.forEach((l) => l());
  };
  const subscribe = (cb: () => void) => {
    listeners.add(cb);
    const onStorage = (e: StorageEvent) => e.key === key && cb();
    window.addEventListener("storage", onStorage);
    return () => {
      listeners.delete(cb);
      window.removeEventListener("storage", onStorage);
    };
  };
  const use = () => useSyncExternalStore(subscribe, read, () => fallback);
  return { read, write, use };
}

/** Store só em memória (estado de interface: gaveta aberta, busca aberta...). */
export function createMemoryStore<T>(initial: T) {
  let state = initial;
  const listeners = new Set<() => void>();
  const get = () => state;
  const set = (v: T | ((s: T) => T)) => {
    state = typeof v === "function" ? (v as (s: T) => T)(state) : v;
    listeners.forEach((l) => l());
  };
  const subscribe = (cb: () => void) => {
    listeners.add(cb);
    return () => listeners.delete(cb);
  };
  const use = () => useSyncExternalStore(subscribe, get, () => initial);
  return { get, set, use };
}

const noop = () => () => {};
/** true só no navegador, depois da hidratação (sem setState em efeito). */
export const useHydrated = () => useSyncExternalStore(noop, () => true, () => false);
