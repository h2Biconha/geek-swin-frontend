"use client";

import Link from "next/link";
import { useState } from "react";
import { asset, brl, sizeOut } from "@/lib/catalog";
import { cart, type CartItem } from "@/lib/cart";
import { useInventoryMap } from "@/lib/inventory";
import { suggestFor } from "@/lib/merch/recommend";
import { useNow } from "@/lib/time";
import { closeOverlay } from "@/lib/ui";

/**
 * "Também combina com": até 3 peças que formam look com o que já está na bag.
 * Adicionar não fecha a gaveta, não mexe nas outras linhas e não duplica (peça na bag não aparece aqui).
 */
export default function CartSuggestions({ items, gapCents, id }: { items: CartItem[]; gapCents: number | null; id: string }) {
  const now = useNow(60_000);
  const stock = useInventoryMap() ?? undefined;
  const [open, setOpen] = useState<string | null>(null);
  const list = suggestFor([...new Set(items.map((i) => i.slug))], now, stock, 3);
  if (!list.length) return null;
  return (
    <section id={id} aria-labelledby={`${id}-t`} className="border-t border-line px-5 py-5" tabIndex={-1}>
      <h3 id={`${id}-t`} className="eyebrow text-muted">
        Também combina com
      </h3>
      <ul className="mt-3 grid gap-3">
        {list.map(({ product: p, reason }) => {
          const one = p.sizes.length === 1;
          const closes = gapCents != null && gapCents > 0 && Math.round(p.price * 100) >= gapCents;
          return (
            <li key={p.slug} className="grid grid-cols-[3.5rem_1fr] gap-3">
              <Link href={`/product/${p.slug}`} onClick={closeOverlay} className="studio block aspect-[4/5]" tabIndex={-1} aria-hidden>
                <img src={asset(p.media[0].src)} alt="" loading="lazy" className="size-full object-contain p-1" />
              </Link>
              <div className="min-w-0">
                <div className="flex items-baseline justify-between gap-2">
                  <Link href={`/product/${p.slug}`} onClick={closeOverlay} className="link-u truncate text-small font-medium">
                    {p.name}
                  </Link>
                  <span className="num shrink-0 text-small">{brl(p.price)}</span>
                </div>
                <p className="text-small text-muted">
                  {reason}
                  {closes ? " · completa o frete grátis" : ""}
                </p>
                {open === p.slug || one ? (
                  <div className="mt-1.5 flex flex-wrap gap-1" role="group" aria-label={`Tamanho de ${p.name}`}>
                    {p.sizes.map((s) => (
                      <button
                        key={s}
                        type="button"
                        disabled={sizeOut(stock?.[p.slug], s)}
                        onClick={() => (cart.addMany([{ slug: p.slug, size: s }], { open: false, listName: "carrinho-sugestoes" }), setOpen(null))}
                        aria-label={one ? `Adicionar ${p.name}` : `Adicionar ${p.name} tamanho ${s}`}
                        className="num min-h-9 min-w-9 border border-line px-2 font-mono text-label transition-colors hover:border-fg hover:bg-fg hover:text-bg disabled:line-through disabled:opacity-40"
                      >
                        {one ? "+ Adicionar" : s}
                      </button>
                    ))}
                  </div>
                ) : (
                  <button type="button" onClick={() => setOpen(p.slug)} className="eyebrow mt-1.5 inline-flex min-h-9 items-center text-fg" aria-label={`Escolher tamanho de ${p.name}`}>
                    <span className="link-u">+ Escolher tamanho</span>
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
