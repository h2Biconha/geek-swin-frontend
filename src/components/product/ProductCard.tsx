"use client";

import Link from "next/link";
import { useState } from "react";
import { cart } from "@/lib/cart";
import type { Product } from "@/lib/catalog";
import Media from "../ui/Media";
import Price from "../ui/Price";
import StockMeter from "../ui/StockMeter";
import Icon from "../ui/Icon";
import WishlistButton from "./WishlistButton";
import { STATUS_BADGE, useAvailability } from "./status";

/**
 * Card de produto. Hover (desktop) troca frente → costas e mostra o quick add por tamanho.
 * No toque, o botão "+" abre os tamanhos. Clicar no tamanho já põe na bag.
 */
export default function ProductCard({ product: p, priority, index = 0 }: { product: Product; priority?: boolean; index?: number }) {
  const { status, phase } = useAvailability(p);
  const [quick, setQuick] = useState(false);
  const href = `/product/${p.slug}`;
  const badge = STATUS_BADGE[status];
  const buyable = status === "available" || status === "low";
  const [front, back] = p.media;

  return (
    <article className="group relative" data-reveal style={{ "--i": index % 4 } as React.CSSProperties}>
      <div className="studio relative aspect-[4/5] overflow-hidden">
        <Link href={href} className="absolute inset-0" aria-label={p.name} data-cursor="view" tabIndex={-1}>
          <Media media={front} alt={`${p.name}, ${front.view.toLowerCase()}`} priority={priority} className={`absolute inset-0 size-full object-contain p-[8%] transition-[opacity,transform] duration-700 ease-out ${back ? "group-hover:opacity-0" : ""} group-hover:scale-[1.03] ${status === "sold-out" ? "opacity-60 grayscale" : ""}`} />
          {back && <Media media={back} alt="" className="absolute inset-0 size-full scale-[1.03] object-contain p-[8%] opacity-0 transition-[opacity,transform] duration-700 ease-out group-hover:scale-100 group-hover:opacity-100" />}
        </Link>

        <div className="pointer-events-none absolute top-3 left-3 flex flex-wrap gap-1.5">
          {/* no celular só o selo mais importante; no desktop, todos */}
          {[badge && <span key="s" className={`badge ${badge.cls}`}>{badge.label}</span>, phase === "presale" && buyable && <span key="p" className="badge">Pré-venda</span>, p.edition ? <span key="l" className="badge">Limited</span> : !p.drop ? <span key="c" className="badge badge-muted">Core</span> : null]
            .filter(Boolean)
            .map((b, i) => (
              <span key={i} className={i > 0 ? "hidden sm:contents" : "contents"}>
                {b}
              </span>
            ))}
        </div>
        <WishlistButton slug={p.slug} name={p.name} className="absolute top-1.5 right-1.5 grid size-11 place-items-center" />

        {buyable && (
          <>
            <button
              type="button"
              onClick={() => setQuick((q) => !q)}
              aria-expanded={quick}
              aria-label={`Adicionar rápido: ${p.name}`}
              className="absolute right-2 bottom-2 grid size-11 place-items-center bg-bg/90 text-fg transition-colors hover:bg-fg hover:text-bg lg:opacity-0 lg:group-focus-within:opacity-100 lg:group-hover:opacity-100"
            >
              <Icon name={quick ? "close" : "plus"} size={18} />
            </button>
            <div
              className={`absolute inset-x-2 bottom-2 mr-12 bg-bg/95 p-2 backdrop-blur transition-[opacity,transform] duration-300 ease-out ${quick ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-2 opacity-0 lg:group-hover:pointer-events-auto lg:group-hover:translate-y-0 lg:group-hover:opacity-100"}`}
            >
              <p className="eyebrow px-1 pb-1.5 text-muted">Adicionar · tamanho</p>
              <div className="flex flex-wrap gap-1">
                {p.sizes.map((s) => {
                  const out = p.soldOut.includes(s);
                  return (
                    <button
                      key={s}
                      type="button"
                      disabled={out}
                      tabIndex={quick ? 0 : -1}
                      onClick={() => (cart.add(p.slug, s), setQuick(false))}
                      aria-label={out ? `${s}, esgotado` : `Adicionar ${p.name} tamanho ${s}`}
                      className="num min-h-9 min-w-9 border border-line px-2 font-mono text-label transition-colors hover:border-fg hover:bg-fg hover:text-bg disabled:line-through disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-fg"
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>

      <div className="mt-4 flex flex-col gap-2">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="text-[0.9375rem] leading-snug font-medium">
            <Link href={href} className="link-u">
              {p.name}
            </Link>
          </h3>
          <span className="eyebrow hidden shrink-0 text-muted sm:inline">N° {p.number}</span>
        </div>
        <Price product={p} />
        <p className="eyebrow text-muted">
          <span className="sr-only">Tamanhos: </span>
          {p.sizes.map((s, i) => (
            <span key={s} className={p.soldOut.includes(s) ? "line-through" : "text-fg"}>
              {s}
              {i < p.sizes.length - 1 ? " · " : ""}
            </span>
          ))}
        </p>
        {status !== "sold-out" && p.edition != null && (
          <div className="mt-1">
            <StockMeter product={p} compact />
          </div>
        )}
      </div>
    </article>
  );
}
