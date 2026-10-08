"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useHydrated } from "@/lib/store";
import { cart, countItems, freeShippingGap, isUnavailable, lastAdded, MAX_QTY, subtotal, useCart } from "@/lib/cart";
import { asset, brl, FREE_SHIPPING_FROM, getDrop, getProduct, installment, shipsLabel } from "@/lib/catalog";
import { useDropPhase } from "@/lib/time";
import { closeOverlay, overlay } from "@/lib/ui";
import Drawer from "../ui/Drawer";
import EmptyState from "../ui/EmptyState";
import Icon from "../ui/Icon";

const drop = getDrop("001")!;

export default function CartDrawer() {
  const open = overlay.use() === "cart";
  const items = useCart();
  const path = usePathname();
  const phase = useDropPhase(drop);
  const ready = useHydrated();
  const [going, setGoing] = useState(false);
  // trocou de página: zera o "Abrindo checkout…" (ajuste de estado no render, sem efeito)
  const [seenPath, setSeenPath] = useState(path);
  if (seenPath !== path) {
    setSeenPath(path);
    setGoing(false);
  }

  const count = countItems(items);
  const sub = subtotal(items);
  const gap = freeShippingGap(items);
  const blocked = items.some(isUnavailable);
  const presale = phase === "presale" && items.some((i) => getProduct(i.slug)?.drop === drop.number);

  return (
    <Drawer
      open={open}
      onClose={closeOverlay}
      title={<span className="num">Bag · {count}</span>}
      footer={
        ready && items.length ? (
          <div className="flex flex-col gap-3">
            <dl className="num grid grid-cols-[1fr_auto] gap-y-1.5 text-small">
              <dt className="text-muted">Subtotal</dt>
              <dd>{brl(sub)}</dd>
              <dt className="text-muted">Frete</dt>
              <dd>{gap === 0 ? <span className="text-accent-fg">Grátis</span> : "Calculado no checkout"}</dd>
              <dt className="mt-2 font-semibold">Total</dt>
              <dd className="mt-2 font-semibold">{brl(sub)}</dd>
              <dd className="col-span-2 text-muted">ou 6x de {installment(sub)} sem juros</dd>
            </dl>
            {presale && drop.shipsFrom && <p className="text-small text-muted">Tem peça de pré-venda: o pedido inteiro sai a partir de {shipsLabel(drop.shipsFrom)}.</p>}
            {blocked && (
              <p role="alert" className="field-error mt-0">
                Um tamanho esgotou. Remova o item marcado para seguir.
              </p>
            )}
            <Link
              href="/checkout"
              aria-disabled={blocked || going}
              onClick={(e) => (blocked ? e.preventDefault() : (setGoing(true), closeOverlay()))}
              className={`btn btn-primary btn-lg btn-block ${blocked ? "pointer-events-none opacity-45" : ""}`}
            >
              {going ? "Abrindo checkout…" : (
                <>
                  <Icon name="lock" size={16} /> Finalizar compra
                </>
              )}
            </Link>
            <button type="button" onClick={closeOverlay} className="btn btn-ghost self-center">
              <span>Continuar comprando</span>
            </button>
          </div>
        ) : undefined
      }
    >
      {!ready ? (
        <div className="flex flex-col gap-4 p-5" aria-label="Carregando bag">
          {[0, 1].map((i) => (
            <div key={i} className="flex gap-4">
              <div className="skeleton h-28 w-22" />
              <div className="flex-1 space-y-2">
                <div className="skeleton h-3 w-2/3" />
                <div className="skeleton h-3 w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : !items.length ? (
        <div className="px-5">
          <EmptyState code="INVENTORY · 0/0" title="Your inventory is empty" text="Nada na bag ainda. Volte para o lobby e veja o que está no drop." cta="Explore the drop" href={`/drops/${drop.slug}`} onClick={closeOverlay} />
        </div>
      ) : (
        <>
          <div className="border-b border-line px-5 py-4">
            <p className="text-small">
              {gap > 0 ? (
                <>
                  Faltam <strong className="num">{brl(gap)}</strong> para o frete grátis.
                </>
              ) : (
                <>Frete grátis desbloqueado.</>
              )}
            </p>
            <div className="mt-2.5 h-[2px] bg-line" role="progressbar" aria-valuemin={0} aria-valuemax={FREE_SHIPPING_FROM} aria-valuenow={Math.min(sub, FREE_SHIPPING_FROM)} aria-label="Progresso para frete grátis">
              <div className="h-full origin-left bg-accent transition-transform duration-500 ease-out" style={{ transform: `scaleX(${Math.min(1, sub / FREE_SHIPPING_FROM)})` }} />
            </div>
          </div>
          <ul>
            {items.map((i) => {
              const p = getProduct(i.slug)!;
              const out = isUnavailable(i);
              const fresh = lastAdded === `${i.slug}|${i.size}`;
              return (
                <li key={`${i.slug}-${i.size}`} className={`flex gap-4 border-b border-line px-5 py-5 ${fresh ? "animate-[rise_.4s_var(--ease-out)]" : ""}`}>
                  <Link href={`/product/${p.slug}`} onClick={closeOverlay} className="studio relative h-28 w-22 shrink-0">
                    <img src={asset(p.media[0].src)} alt="" className="size-full object-contain p-2" />
                  </Link>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex justify-between gap-3">
                      <Link href={`/product/${p.slug}`} onClick={closeOverlay} className="text-[0.9375rem] leading-snug font-medium">
                        {p.name}
                      </Link>
                      <span className="num text-[0.9375rem]">{brl(p.price * i.qty)}</span>
                    </div>
                    <p className="eyebrow mt-1 text-muted">
                      Tam. {i.size}
                      {p.drop ? ` · Drop ${p.drop}` : ""}
                    </p>
                    {out && <p className="field-error">Esse tamanho esgotou.</p>}
                    <div className="mt-auto flex items-center justify-between pt-3">
                      <div className="flex items-center border border-line" role="group" aria-label={`Quantidade de ${p.name}`}>
                        <button type="button" onClick={() => cart.setQty(i.slug, i.size, i.qty - 1)} className="grid size-10 place-items-center" aria-label="Diminuir">
                          <Icon name="minus" size={14} />
                        </button>
                        <span className="num w-7 text-center text-small" aria-live="polite">
                          {i.qty}
                        </span>
                        <button type="button" disabled={i.qty >= MAX_QTY || out} onClick={() => cart.setQty(i.slug, i.size, i.qty + 1)} className="grid size-10 place-items-center disabled:opacity-30" aria-label="Aumentar">
                          <Icon name="plus" size={14} />
                        </button>
                      </div>
                      <button type="button" onClick={() => cart.remove(i.slug, i.size)} className="eyebrow min-h-10 text-muted hover:text-fg">
                        <span className="link-u">Remover</span>
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </Drawer>
  );
}
