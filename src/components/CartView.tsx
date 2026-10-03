"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { cart, countItems, subtotal, useCart } from "@/lib/cart";
import { brl, FREE_SHIPPING_FROM, getProduct, img, installment, pix, EDITION_TOTAL } from "@/lib/products";

export default function CartView() {
  const items = useCart();
  const [note, setNote] = useState(false);
  const sub = subtotal(items);
  const missing = Math.max(0, FREE_SHIPPING_FROM - sub);
  const n = countItems(items);

  if (items.length === 0)
    return (
      <div className="py-16 text-center">
        <h1 className="font-display text-section font-extrabold uppercase">Sua bag está vazia</h1>
        <p className="mt-4 text-muted">O Drop 001 tem {EDITION_TOTAL} peças numeradas. Quando acabar, não volta.</p>
        <Link href="/loja" className="mt-8 inline-block rounded-full bg-invert px-7 py-4 font-mono text-label font-bold uppercase tracking-[0.16em] text-on-invert">
          Ir para a loja
        </Link>
      </div>
    );

  return (
    <div className="grid gap-12 lg:grid-cols-12">
      <div className="lg:col-span-7">
        <div className="flex items-end justify-between border-b border-line/15 pb-6">
          <h1 className="font-display text-section font-extrabold uppercase">Sua bag</h1>
          <span className="font-mono text-micro uppercase tracking-[0.16em] tabular-nums text-muted">
            {n} {n === 1 ? "item" : "itens"}
          </span>
        </div>
        <ul>
          {items.map((i) => {
            const p = getProduct(i.slug)!;
            return (
              <li key={i.slug + i.size} className="grid grid-cols-[6rem_1fr_auto] gap-4 border-b border-line/15 py-5 sm:grid-cols-[8rem_1fr_auto]">
                <Link href={`/produto/${p.slug}`} aria-hidden tabIndex={-1} className="studio relative block aspect-[4/5] overflow-hidden rounded-2xl">
                  <Image src={img(p.image)} alt="" fill unoptimized className="object-cover" />
                </Link>
                <div className="min-w-0">
                  <Link href={`/produto/${p.slug}`} className="font-display text-lg font-bold leading-tight hover:text-acid-ink">
                    {p.name}
                  </Link>
                  <p className="mt-1 font-mono text-micro uppercase tracking-[0.14em] text-muted">
                    Tamanho {i.size}
                    {p.edition ? ` · Nº ${p.number} / ${p.edition}` : ""}
                  </p>
                  <div className="mt-4 flex flex-wrap items-center gap-4">
                    <div className="inline-flex items-center rounded-full border border-line/15">
                      <button type="button" aria-label="Diminuir quantidade" onClick={() => cart.setQty(i.slug, i.size, i.qty - 1)} className="grid size-9 place-items-center">
                        −
                      </button>
                      <span aria-live="polite" className="w-8 text-center font-mono text-sm tabular-nums">
                        {i.qty}
                      </span>
                      <button type="button" aria-label="Aumentar quantidade" onClick={() => cart.setQty(i.slug, i.size, Math.min(10, i.qty + 1))} className="grid size-9 place-items-center">
                        +
                      </button>
                    </div>
                    <button type="button" onClick={() => cart.setQty(i.slug, i.size, 0)} aria-label={`Remover ${p.name}, tamanho ${i.size}`} className="-my-2 py-3 font-mono text-micro uppercase tracking-[0.14em] text-muted underline underline-offset-4 hover:text-ink">
                      Remover
                    </button>
                  </div>
                </div>
                <div className="text-right font-display text-lg font-bold tabular-nums">{brl(p.price * i.qty)}</div>
              </li>
            );
          })}
        </ul>
      </div>

      <aside aria-label="Resumo do pedido" className="lg:col-span-5">
        <div className="rounded-[28px] bg-surface p-7 md:p-9 lg:sticky lg:top-32">
          <p className="font-mono text-micro uppercase tracking-[0.14em] tabular-nums text-acid-ink">
            {missing === 0 ? "Você ganhou frete grátis ✓" : `Faltam ${brl(missing)} para o frete grátis`}
          </p>
          <div className="mt-3 h-[3px] overflow-hidden bg-line/15">
            <i className="block h-full bg-acid transition-[width] duration-700 ease-lux" style={{ width: `${Math.min(100, (sub / FREE_SHIPPING_FROM) * 100)}%` }} />
          </div>
          <dl className="mt-8 grid gap-3 text-sm tabular-nums">
            <div className="flex justify-between">
              <dt className="text-muted">Subtotal</dt>
              <dd>{brl(sub)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Frete</dt>
              <dd>{missing === 0 ? "Grátis" : "Calculado no checkout"}</dd>
            </div>
            <div className="flex items-baseline justify-between border-t border-line/15 pt-4">
              <dt className="font-mono text-label font-bold uppercase tracking-[0.14em]">Total</dt>
              <dd className="font-display text-3xl font-extrabold">{brl(sub)}</dd>
            </div>
          </dl>
          <p className="mt-1 text-right text-sm tabular-nums text-muted">ou 6x de {installment(sub)} sem juros</p>
          <p className="text-right text-sm font-medium tabular-nums">{pix(sub)} no Pix (5% off)</p>
          <button type="button" onClick={() => setNote(true)} className="mt-8 w-full rounded-full bg-invert px-7 py-4 font-mono text-label font-bold uppercase tracking-[0.16em] text-on-invert transition-colors duration-500 hover:bg-acid hover:text-on-acid">
            Finalizar compra
          </button>
          {note && (
            <p role="status" className="mt-4 rounded-2xl border border-line/15 p-4 text-sm text-muted">
              O checkout ainda não está ligado. Na versão real, este botão leva ao pagamento (cartão, Pix e cálculo de frete). Veja o guia.
            </p>
          )}
        </div>
      </aside>
    </div>
  );
}
