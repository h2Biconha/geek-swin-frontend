"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { cart } from "@/lib/cart";
import type { Product } from "@/lib/products";

/**
 * Tamanhos + botões de compra.
 * - Tamanho é um radiogroup de verdade (setas do teclado navegam).
 * - Sem tamanho escolhido, o botão mostra o erro em vez de adicionar.
 * - No celular, quando o botão principal sai da tela, aparece uma barra fixa de compra.
 */
export default function BuyBox({ product: p, priceLabel }: { product: Product; priceLabel: string }) {
  const router = useRouter();
  const available = p.sizes.filter((s) => !p.soldOut.includes(s));
  const [size, setSize] = useState<string | null>(available.length === 1 ? available[0] : null);
  const [error, setError] = useState(false);
  const [showBar, setShowBar] = useState(false);
  const mainBtn = useRef<HTMLButtonElement>(null);
  const group = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = mainBtn.current;
    if (!el) return;
    const io = new IntersectionObserver(([en]) => setShowBar(!en.isIntersecting && en.boundingClientRect.top < 0));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const ensureSize = () => {
    if (size) return true;
    setError(true);
    group.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    group.current?.querySelector<HTMLButtonElement>("button:not(:disabled)")?.focus();
    return false;
  };
  const add = () => ensureSize() && cart.add(p.slug, size!);
  const buy = () => {
    if (!ensureSize()) return;
    if (!cart.has(p.slug, size!)) cart.add(p.slug, size!);
    router.push("/carrinho");
  };

  const onKey = (e: React.KeyboardEvent, i: number) => {
    const d = ["ArrowRight", "ArrowDown"].includes(e.key) ? 1 : ["ArrowLeft", "ArrowUp"].includes(e.key) ? -1 : 0;
    if (!d) return;
    e.preventDefault();
    const next = available[(i + d + available.length) % available.length];
    setSize(next);
    setError(false);
    group.current?.querySelector<HTMLButtonElement>(`[data-size="${next}"]`)?.focus();
  };

  return (
    <>
      <div ref={group}>
        <div className="mb-3 flex items-center justify-between font-mono text-micro uppercase tracking-[0.14em]">
          <span>
            Tamanho: <strong className="text-ink">{size ?? "escolha"}</strong>
          </span>
          <a href="#medidas" onClick={() => ((document.getElementById("medidas") as HTMLDetailsElement).open = true)} className="text-muted underline underline-offset-4 hover:text-ink">
            Guia de medidas
          </a>
        </div>
        <div role="radiogroup" aria-label="Tamanho" className="flex flex-wrap gap-2">
          {p.sizes.map((s) => {
            const out = p.soldOut.includes(s);
            const i = available.indexOf(s);
            return (
              <button
                key={s}
                type="button"
                role="radio"
                data-size={s}
                aria-checked={size === s}
                aria-label={out ? `${s}, esgotado` : s}
                disabled={out}
                tabIndex={size ? (size === s ? 0 : -1) : i === 0 ? 0 : -1}
                onClick={() => {
                  setSize(s);
                  setError(false);
                }}
                onKeyDown={(e) => onKey(e, i)}
                className="min-w-[3.25rem] rounded-full border border-line/15 bg-surface px-3.5 py-3 font-mono text-small transition-colors hover:border-ink aria-checked:border-ink aria-checked:bg-ink aria-checked:text-bg disabled:cursor-not-allowed disabled:bg-transparent disabled:text-muted disabled:line-through disabled:hover:border-line/15"
              >
                {s}
              </button>
            );
          })}
        </div>
        {error && (
          <p role="alert" className="mt-3 text-sm text-danger">
            Escolha um tamanho para continuar.
          </p>
        )}
        <p className="mt-3 text-xs text-muted">{p.model}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <button ref={mainBtn} type="button" onClick={add} className="rounded-full bg-invert px-7 py-4 font-mono text-label font-bold uppercase tracking-[0.16em] text-on-invert transition-colors duration-500 hover:bg-acid hover:text-on-acid">
          Adicionar à bag
        </button>
        <button type="button" onClick={buy} className="rounded-full border border-ink px-7 py-4 font-mono text-label font-bold uppercase tracking-[0.16em] transition-colors duration-500 hover:bg-ink hover:text-bg">
          Comprar agora
        </button>
      </div>

      <div
        className={`fixed inset-x-0 bottom-0 z-40 border-t border-line/15 bg-surface pb-[env(safe-area-inset-bottom)] transition-transform duration-500 ease-lux lg:hidden ${showBar ? "translate-y-0" : "translate-y-full"}`}
        aria-hidden={!showBar}
      >
        <div className="flex items-center justify-between gap-4 px-gutter py-3">
          <div className="min-w-0">
            <p className="truncate font-display font-bold">{p.name}</p>
            <p className="text-sm tabular-nums text-muted">{priceLabel}</p>
          </div>
          <button type="button" onClick={add} tabIndex={showBar ? 0 : -1} className="shrink-0 rounded-full bg-invert px-6 py-3 font-mono text-label font-bold uppercase tracking-[0.16em] text-on-invert">
            Adicionar
          </button>
        </div>
      </div>
    </>
  );
}
