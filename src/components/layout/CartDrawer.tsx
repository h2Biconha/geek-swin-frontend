"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useHydrated } from "@/lib/store";
import { cart, countItems, lastAdded, lineKey, lineProblem, maxQtyFor, useCart, type CartItem } from "@/lib/cart";
import { asset, brl, COMMERCE, getDrop, getProduct, installment, shipsLabel } from "@/lib/catalog";
import { benefitProgress } from "@/lib/commerce/benefits";
import { getBundle } from "@/lib/commerce/bundles";
import { computeTotals } from "@/lib/commerce/pricing";
import { useNow } from "@/lib/time";
import BenefitBar from "../commerce/BenefitBar";
import CartSuggestions from "../commerce/CartSuggestions";
import { itemPayload, track } from "@/lib/analytics";
import { useInventoryMap } from "@/lib/inventory";
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

  const stock = useInventoryMap() ?? undefined;
  // abriu a bag: evento view_cart (uma vez por abertura)
  useEffect(() => {
    if (open && items.length) track("view_cart", itemPayload(items));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const now = useNow(60_000);
  const count = countItems(items);
  // mesma função de preço do checkout: soma, desconto de kit (quando houver) e frete grátis
  const t = computeTotals({ items, method: "card", shipping: null, now });
  const sub = t.subtotalCents / 100;
  const total = (t.subtotalCents - t.bundleCents) / 100;
  const ship = benefitProgress(t.lines, now).find((b) => b.kind === "free_shipping");
  const blocked = items.some((i) => lineProblem(i, stock?.[i.slug], items));
  // linhas avulsas e grupos de kit, na ordem em que entraram
  const groups: { kitId: string | null; lines: CartItem[] }[] = [];
  for (const i of items) {
    const g = i.kitId ? groups.find((x) => x.kitId === i.kitId) : undefined;
    if (g) g.lines.push(i);
    else groups.push({ kitId: i.kitId ?? null, lines: [i] });
  }
  const findMore = () => document.getElementById("cart-sugestoes")?.focus();
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
              {t.bundleCents > 0 && (
                <>
                  <dt className="text-muted">Desconto de kit</dt>
                  <dd className="text-accent-fg">−{brl(t.bundleCents / 100)}</dd>
                </>
              )}
              <dt className="text-muted">Frete</dt>
              <dd>{ship?.reached && ship.region !== false ? <span className="text-accent-fg">Grátis no Econômico{ship.region === null ? "*" : ""}</span> : "Calculado no checkout"}</dd>
              <dt className="mt-2 font-semibold">Total</dt>
              <dd className="mt-2 font-semibold">{brl(total)}</dd>
              <dd className="col-span-2 text-muted">
                ou até {COMMERCE.installments}x de {installment(total)}
                {COMMERCE.installmentsInterestFree ? " sem juros" : ""} no cartão
              </dd>
            </dl>
            {ship?.reached && ship.region === null && <p className="text-small text-muted">* {ship.condition} Confirmado no CEP.</p>}
            {presale && drop.shipsFrom && <p className="text-small text-muted">Tem peça de pré-venda: o pedido inteiro sai a partir de {shipsLabel(drop.shipsFrom)}.</p>}
            {blocked && (
              <p role="alert" className="field-error mt-0">
                Ajuste os itens marcados para seguir.
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
          <EmptyState level={2} code="BAG · 0" title="Sua bag está vazia" text="Nada por aqui ainda. Veja as peças do drop atual." cta="Ver o drop" href={`/drops/${drop.slug}`} onClick={closeOverlay} />
        </div>
      ) : (
        <>
          {ship || t.bundles.length ? (
            <div className="border-b border-line px-5 py-4">
              <BenefitBar lines={t.lines} onFind={findMore} />
            </div>
          ) : null}
          <ul>
            {groups.map((g) => {
              const kit = g.kitId ? getBundle(g.lines[0].kit) : undefined;
              const check = g.kitId ? t.bundles.find((b) => b.kitId === g.kitId) : undefined;
              const lis = g.lines.map((i) => line(i));
              return kit && g.kitId ? (
                <li key={g.kitId} className="border-b border-line">
                  <div className="flex items-baseline justify-between gap-3 px-5 pt-4">
                    <p className="eyebrow text-fg">
                      Kit · {kit.name}
                      {check?.discountCents ? <span className="text-accent-fg"> · −{brl(check.discountCents / 100)}</span> : null}
                    </p>
                    <button type="button" onClick={() => cart.removeKit(g.kitId!)} className="eyebrow min-h-11 text-muted hover:text-fg" aria-label={`Remover o kit ${kit.name}`}>
                      <span className="link-u">Remover kit</span>
                    </button>
                  </div>
                  {check && !check.valid && <p className="px-5 text-small text-muted">Kit incompleto: as peças seguem com o preço normal.</p>}
                  <ul>{lis}</ul>
                </li>
              ) : (
                lis
              );
            })}
          </ul>
          <CartSuggestions items={items} gapCents={ship && !ship.reached ? ship.gapCents : null} id="cart-sugestoes" />
        </>
      )}
    </Drawer>
  );

  function line(i: CartItem) {
              const p = getProduct(i.slug)!;
              const problem = lineProblem(i, stock?.[i.slug], items);
              const out = problem === "esgotado";
              const max = maxQtyFor(i, stock?.[i.slug], items);
              const fresh = lastAdded === lineKey(i);
              return (
                <li key={lineKey(i)} className={`flex gap-4 border-b border-line px-5 py-5 last:border-b-0 ${fresh ? "animate-[rise_.4s_var(--ease-out)]" : ""}`}>
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
                    {problem && (
                      <p className="field-error">{out ? "Esse tamanho esgotou. Remova para seguir." : `Só ${max} disponível${max > 1 ? "is" : ""}. Diminua a quantidade.`}</p>
                    )}
                    <div className="mt-auto flex items-center justify-between pt-3">
                      <div className="flex items-center border border-line" role="group" aria-label={`Quantidade de ${p.name}`}>
                        <button type="button" onClick={() => cart.setQty(i.slug, i.size, i.qty - 1, i.kitId)} className="grid size-11 place-items-center" aria-label={i.qty === 1 ? `Remover ${p.name}` : `Diminuir quantidade de ${p.name}`}>
                          <Icon name="minus" size={14} />
                        </button>
                        <span className="num w-7 text-center text-small" aria-live="polite">
                          {i.qty}
                        </span>
                        <button type="button" disabled={i.qty >= max || out || !!i.kitId} onClick={() => cart.setQty(i.slug, i.size, i.qty + 1, i.kitId)} className="grid size-11 place-items-center disabled:opacity-30" aria-label={`Aumentar quantidade de ${p.name}`}>
                          <Icon name="plus" size={14} />
                        </button>
                      </div>
                      <button type="button" onClick={() => cart.remove(i.slug, i.size, i.kitId)} className="eyebrow min-h-11 text-muted hover:text-fg" aria-label={`Remover ${p.name}, tamanho ${i.size}`}>
                        <span className="link-u">Remover</span>
                      </button>
                    </div>
                  </div>
                </li>
              );
  }
}
