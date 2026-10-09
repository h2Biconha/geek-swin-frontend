"use client";

import Link from "next/link";
import { useState } from "react";
import { asset, brl, isBuyable, roleOf, type Product } from "@/lib/catalog";
import { cart, inCart, useCart } from "@/lib/cart";
import { useInventoryMap } from "@/lib/inventory";
import { completeLook, ROLE_LABEL } from "@/lib/merch/looks";
import { useHydrated } from "@/lib/store";
import { useNow } from "@/lib/time";
import SizeSelect, { presetSize } from "../commerce/SizeSelect";
import Icon from "../ui/Icon";

/**
 * COMPLETE O LOOK. A peça da página + as peças que o catálogo diz que combinam (look do drop,
 * combinação manual ou, na falta delas, a mesma coleção). Cada peça tem tamanho e preço próprios,
 * dá para trocar a sugestão, comprar só uma ou várias. Nada é obrigatório e nada entra na bag sozinho.
 */
export default function CompleteTheLook({ product: p }: { product: Product }) {
  const now = useNow(60_000);
  const stock = useInventoryMap() ?? undefined;
  const ready = useHydrated();
  const items = useCart();
  const look = completeLook(p, now, stock);
  const [choice, setChoice] = useState<Record<number, number>>({});
  const [sizes, setSizes] = useState<Record<string, string>>({});
  const [off, setOff] = useState<Record<string, boolean>>({});
  const [err, setErr] = useState(false);
  if (!look.slots.length) return null;

  const mainBuyable = isBuyable(p, now, stock);
  const rows: { role: string; product: Product; slot: number | null }[] = [
    ...(mainBuyable ? [{ role: "Esta peça", product: p, slot: null }] : []),
    ...look.slots.map((s, i) => ({ role: ROLE_LABEL[s.role], product: s.options[(choice[i] ?? 0) % s.options.length], slot: i })),
  ];
  const sizeOf = (q: Product) => sizes[q.slug] ?? presetSize(q);
  // já na bag: começa desmarcada (não duplica por acidente)
  const excluded = (q: Product) => off[q.slug] ?? (ready && inCart(items, q.slug));
  const selected = rows.filter((r) => !excluded(r.product));
  const total = selected.reduce((s, r) => s + r.product.price, 0);

  const addRows = (list: typeof rows) => {
    if (list.some((r) => !sizeOf(r.product))) return setErr(true);
    setErr(false);
    cart.addMany(list.map((r) => ({ slug: r.product.slug, size: sizeOf(r.product)! })), { listName: "complete-o-look" });
  };
  const label =
    look.source === "look" && look.look ? `Look ${look.look.name} · Drop ${look.look.drop.number}` : look.source === "pairs" ? "Combinação da casa" : p.drop ? `Mais do Drop ${p.drop}` : "Mais da linha Core";

  return (
    <section aria-labelledby="ctl-t" className="wrap pt-section">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="eyebrow text-muted">{label}</p>
          <h2 id="ctl-t" className="font-display mt-4 text-d3">
            Complete o look
          </h2>
        </div>
        {look.look && <p className="max-w-[40ch] text-muted">{look.look.text}</p>}
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1.1fr_1fr] lg:gap-12">
        {/* composição editorial: as peças juntas, como no lookbook */}
        <div className="studio relative grid min-h-[22rem] grid-cols-2 place-items-center gap-3 overflow-hidden p-6 lg:min-h-[34rem]" aria-hidden>
          {rows.map((r, i) => (
            <img
              key={r.product.slug}
              src={asset(r.product.media[0].src)}
              alt=""
              loading="lazy"
              className={`w-full object-contain transition-[opacity,transform] duration-500 ${excluded(r.product) ? "scale-95 opacity-30" : ""} ${i === 0 ? "row-span-2 max-h-[90%]" : i % 2 ? "translate-y-[6%]" : "-translate-y-[4%]"} ${rows.length === 2 && i === 1 ? "row-span-2" : ""}`}
            />
          ))}
          <span className="eyebrow absolute bottom-4 left-4 text-muted">{selected.length} de {rows.length} peças</span>
        </div>

        <div className="flex flex-col">
          <ul className="grid">
            {rows.map((r) => {
              const q = r.product;
              const on = !excluded(q);
              const slot = r.slot != null ? look.slots[r.slot] : null;
              const already = ready && inCart(items, q.slug);
              return (
                <li key={`${r.slot ?? "main"}-${q.slug}`} className="grid grid-cols-[auto_4.5rem_1fr] items-start gap-4 border-b border-line py-4 first:border-t">
                  <input
                    type="checkbox"
                    className="check mt-1"
                    checked={on}
                    onChange={(e) => setOff((o) => ({ ...o, [q.slug]: !e.target.checked }))}
                    aria-label={`Incluir ${q.name}`}
                  />
                  <Link href={`/product/${q.slug}`} className="studio block aspect-[4/5]" tabIndex={-1} aria-hidden>
                    <img src={asset(q.media[0].src)} alt="" loading="lazy" className="size-full object-contain p-1.5" />
                  </Link>
                  <div className="min-w-0">
                    <p className="eyebrow text-muted">
                      {r.role}
                      {already ? " · já na bag" : ""}
                    </p>
                    <div className="mt-1 flex items-baseline justify-between gap-3">
                      {q.slug === p.slug ? (
                        <span className="text-[0.9375rem] font-medium">{q.name}</span>
                      ) : (
                        <Link href={`/product/${q.slug}`} className="link-u text-[0.9375rem] font-medium">
                          {q.name}
                        </Link>
                      )}
                      <span className="num text-[0.9375rem]">{brl(q.price)}</span>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <SizeSelect product={q} id={`ctl-${q.slug}`} value={sizeOf(q)} onChange={(v) => setSizes((z) => ({ ...z, [q.slug]: v }))} inv={stock?.[q.slug]} invalid={err && on && !sizeOf(q)} />
                      {slot && slot.options.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setChoice((c) => ({ ...c, [r.slot!]: ((c[r.slot!] ?? 0) + 1) % slot.options.length }))}
                          className="btn btn-ghost min-h-10 text-muted hover:text-fg"
                          aria-label={`Trocar ${ROLE_LABEL[roleOf(q)].toLowerCase()}: mostrar ${slot.options[((choice[r.slot!] ?? 0) + 1) % slot.options.length].name}`}
                        >
                          <Icon name="refresh" size={16} />
                          <span>Trocar</span>
                        </button>
                      )}
                      {q.slug !== p.slug && (
                        <button type="button" onClick={() => addRows([r])} className="btn btn-ghost min-h-10" aria-label={`Adicionar só ${q.name}`}>
                          <span>Só esta</span>
                        </button>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
          <div className="mt-6 flex flex-col gap-3">
            <p className="num flex items-baseline justify-between text-small">
              <span className="text-muted">
                {selected.length} {selected.length === 1 ? "peça selecionada" : "peças selecionadas"}
              </span>
              <strong className="text-base">{brl(total)}</strong>
            </p>
            {err && (
              <p role="alert" className="field-error mt-0">
                Escolha o tamanho das peças marcadas.
              </p>
            )}
            <button type="button" disabled={!selected.length} onClick={() => addRows(selected)} className="btn btn-primary btn-lg btn-block">
              {selected.length ? `Adicionar ${selected.length} ${selected.length === 1 ? "peça" : "peças"} · ${brl(total)}` : "Marque as peças"}
            </button>
            <p className="text-small text-muted">Cada peça entra na bag com o próprio preço. Pode tirar qualquer uma depois.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
