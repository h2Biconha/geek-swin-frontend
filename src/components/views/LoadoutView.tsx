"use client";

import { useEffect, useState } from "react";
import { asset, brl, isBuyable, PRODUCTS, roleOf, type Product, type ProductRole } from "@/lib/catalog";
import { cart, MAX_QTY, useCart } from "@/lib/cart";
import { bundleLive, BUNDLES, evaluateBundle } from "@/lib/commerce/bundles";
import { computeTotals } from "@/lib/commerce/pricing";
import { useInventoryMap } from "@/lib/inventory";
import { allLooks, ROLE_LABEL } from "@/lib/merch/looks";
import { useNow } from "@/lib/time";
import { readQuery } from "@/lib/url";
import BenefitBar from "../commerce/BenefitBar";
import BundleCard from "../commerce/BundleCard";
import SizeSelect, { presetSize } from "../commerce/SizeSelect";
import Icon from "../ui/Icon";

/**
 * BUILD YOUR LOADOUT. Uma peça por slot (cima, baixo, boné, acessório), tamanho e quantidade,
 * total na hora e o progresso do benefício somando com o que já está na bag.
 * Se a combinação formar um kit com desconto configurado, o desconto aparece e o kit entra como kit.
 * Tudo continua sujeito a estoque, fase do drop e preço do servidor.
 */
const SLOTS: ProductRole[] = ["top", "bottom", "head", "accessory"];
type Pick = { slug: string; size: string | null; qty: number };

export default function LoadoutView() {
  const now = useNow(60_000);
  const stock = useInventoryMap() ?? undefined;
  const bag = useCart();
  const [picks, setPicks] = useState<Partial<Record<ProductRole, Pick>>>({});
  const [err, setErr] = useState(false);
  const [done, setDone] = useState(false);

  // ?look=001-03 (de um look) ou ?with=<slug> (de uma peça): começa montado
  useEffect(() => {
    const q = readQuery();
    const look = allLooks().find((l) => `${l.drop.number}-${l.n}` === q.get("look"));
    const seed = look ? look.products : q.get("with") ? [q.get("with")!] : [];
    const next: Partial<Record<ProductRole, Pick>> = {};
    for (const s of seed) {
      const p = PRODUCTS.find((x) => x.slug === s);
      if (p && SLOTS.includes(roleOf(p))) next[roleOf(p)] = { slug: p.slug, size: presetSize(p), qty: 1 };
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- estado inicial vem da URL, só no navegador
    if (Object.keys(next).length) setPicks(next);
  }, []);

  const options = (r: ProductRole) => PRODUCTS.filter((p) => roleOf(p) === r).sort((a, b) => Number(isBuyable(b, now, stock)) - Number(isBuyable(a, now, stock)) || a.rank - b.rank);
  const chosen = SLOTS.flatMap((r) => (picks[r] ? [{ role: r, ...picks[r]!, product: PRODUCTS.find((p) => p.slug === picks[r]!.slug)! }] : []));
  const set = (r: ProductRole, v: Pick | null) => (setDone(false), setPicks((x) => ({ ...x, [r]: v ?? undefined })));

  // kit com desconto real que essa combinação forma (todas as peças com quantidade 1)
  const kit = chosen.length > 1 && chosen.every((c) => c.qty === 1)
    ? BUNDLES.filter((b) => bundleLive(b, now) && b.discount).map((b) => evaluateBundle(b.slug, "loadout", chosen.map((c) => ({ slug: c.slug, qty: 1, lineCents: Math.round(c.product.price * 100) })), now)).find((c) => c.valid && c.discountCents > 0)
    : undefined;
  const sumCents = chosen.reduce((s, c) => s + Math.round(c.product.price * 100) * c.qty, 0);
  const totalCents = sumCents - (kit?.discountCents ?? 0);
  // benefício: bag atual + loadout
  const combined = computeTotals({ items: [...bag, ...chosen.map((c) => ({ slug: c.slug, size: c.size ?? c.product.sizes[0], qty: c.qty }))], method: "card", shipping: null, now });

  const add = () => {
    if (chosen.some((c) => !c.size)) return setErr(true);
    setErr(false);
    const lines = chosen.map((c) => ({ slug: c.slug, size: c.size!, qty: c.qty }));
    const r = kit ? cart.addMany(lines, { kit: kit.kit, listName: "loadout" }) : cart.addMany(lines, { listName: "loadout" });
    setDone(r.added.length > 0);
  };

  const summary = (
    <div className="flex flex-col gap-5">
      <div className="flex items-baseline justify-between">
        <h2 className="eyebrow text-fg">Seu loadout</h2>
        <span className="eyebrow num text-muted">{chosen.length}/4 slots</span>
      </div>
      {chosen.length ? (
        <ul className="grid gap-2 text-small">
          {chosen.map((c) => (
            <li key={c.role} className="flex items-baseline justify-between gap-3">
              <span className="min-w-0 truncate">
                {c.qty > 1 ? `${c.qty}× ` : ""}
                {c.product.name}
                <span className="text-muted"> · {c.size ?? "tamanho?"}</span>
              </span>
              <span className="num shrink-0">{brl((Math.round(c.product.price * 100) * c.qty) / 100)}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-small text-muted">Escolha pelo menos uma peça. Nenhum slot é obrigatório.</p>
      )}
      <dl className="num grid grid-cols-[1fr_auto] gap-y-1 border-t border-line pt-4 text-small">
        {kit && (
          <>
            <dt className="text-muted">Desconto do kit {BUNDLES.find((b) => b.slug === kit.kit)?.name}</dt>
            <dd className="text-accent-fg">−{brl(kit.discountCents / 100)}</dd>
          </>
        )}
        <dt className="font-semibold">Total</dt>
        <dd className="font-semibold" aria-live="polite">
          {brl(totalCents / 100)}
        </dd>
      </dl>
      {chosen.length > 0 && <BenefitBar lines={combined.lines} compact />}
      {bag.length > 0 && chosen.length > 0 && <p className="text-small text-muted">O progresso soma com o que já está na sua bag.</p>}
      {err && (
        <p role="alert" className="field-error mt-0">
          Escolha o tamanho de cada peça.
        </p>
      )}
      <button type="button" onClick={add} disabled={!chosen.length} className="btn btn-primary btn-lg btn-block">
        {done ? (
          <>
            <Icon name="check" size={18} /> Na bag
          </>
        ) : chosen.length ? (
          `Adicionar ${chosen.reduce((s, c) => s + c.qty, 0)} à bag · ${brl(totalCents / 100)}`
        ) : (
          "Monte o loadout"
        )}
      </button>
    </div>
  );

  const kits = BUNDLES.filter((b) => bundleLive(b, now));
  return (
    <>
      <section className="theme-dark grain relative overflow-hidden">
        <div className="wrap relative pt-14 pb-12 lg:pt-20 lg:pb-16">
          <p className="eyebrow text-accent-fg">Build your loadout</p>
          <h1 className="font-display mt-4 text-d1">Loadout</h1>
          <p className="mt-6 max-w-[48ch] text-[1.125rem] text-muted">Uma peça por slot. Tamanho, quantidade e total na hora. Nada entra na bag até você confirmar.</p>
          <div className="mt-8 flex flex-wrap gap-2" role="group" aria-label="Começar por um look">
            {allLooks().map((l) => (
              <button
                key={`${l.drop.number}-${l.n}`}
                type="button"
                onClick={() => (setDone(false), setPicks(Object.fromEntries(l.products.map((s) => PRODUCTS.find((p) => p.slug === s)).filter((p): p is Product => !!p && SLOTS.includes(roleOf(p))).map((p) => [roleOf(p), { slug: p.slug, size: presetSize(p), qty: 1 }]))))}
                className="btn btn-secondary btn-sm"
              >
                Look {l.name}
              </button>
            ))}
            {chosen.length > 0 && (
              <button type="button" onClick={() => setPicks({})} className="btn btn-ghost btn-sm text-muted">
                <span>Limpar</span>
              </button>
            )}
          </div>
        </div>
      </section>

      <div className="wrap grid gap-12 py-12 lg:grid-cols-[minmax(0,1fr)_22rem] lg:py-16 xl:gap-16">
        <ol className="grid gap-12">
          {SLOTS.map((r, i) => {
            const opts = options(r);
            if (!opts.length) return null;
            const pick = picks[r];
            const p = pick ? opts.find((x) => x.slug === pick.slug) : undefined;
            return (
              <li key={r}>
                <div className="flex items-baseline justify-between gap-4 border-b border-line pb-3">
                  <h2 className="eyebrow text-fg">
                    Slot 0{i + 1} · {ROLE_LABEL[r]}
                  </h2>
                  <span className="eyebrow text-muted">{p ? brl(p.price) : "opcional"}</span>
                </div>
                <div role="radiogroup" aria-label={ROLE_LABEL[r]} className="scrollbar-none -mx-gutter mt-4 flex snap-x gap-3 overflow-x-auto px-gutter pb-2 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0 xl:grid-cols-4">
                  {opts.map((o) => {
                    const ok = isBuyable(o, now, stock);
                    const on = pick?.slug === o.slug;
                    return (
                      <button
                        key={o.slug}
                        type="button"
                        role="radio"
                        aria-checked={on}
                        disabled={!ok}
                        onClick={() => set(r, on ? null : { slug: o.slug, size: presetSize(o), qty: 1 })}
                        className={`group w-[42%] shrink-0 snap-start border p-2 text-left transition-colors sm:w-auto ${on ? "border-accent-fg" : "border-line hover:border-fg"} disabled:opacity-45`}
                      >
                        <span className="studio relative block aspect-[4/5]">
                          <img src={asset(o.media[0].src)} alt="" loading="lazy" className="size-full object-contain p-[8%] transition-transform duration-500 group-hover:scale-[1.03]" />
                          {on && (
                            <span className="absolute top-2 right-2 grid size-7 place-items-center bg-accent text-on-accent">
                              <Icon name="check" size={14} />
                            </span>
                          )}
                        </span>
                        <span className="mt-2 block text-small font-medium leading-snug">{o.name}</span>
                        <span className="num block text-small text-muted">{ok ? brl(o.price) : "Indisponível"}</span>
                      </button>
                    );
                  })}
                </div>
                {p && pick && (
                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <SizeSelect product={p} id={`lo-${r}`} value={pick.size} onChange={(v) => set(r, { ...pick, size: v })} inv={stock?.[p.slug]} invalid={err && !pick.size} />
                    <div className="flex items-center border border-line" role="group" aria-label={`Quantidade de ${p.name}`}>
                      <button type="button" onClick={() => (pick.qty > 1 ? set(r, { ...pick, qty: pick.qty - 1 }) : set(r, null))} className="grid size-10 place-items-center" aria-label={pick.qty > 1 ? `Diminuir ${p.name}` : `Tirar ${p.name} do loadout`}>
                        <Icon name="minus" size={14} />
                      </button>
                      <span className="num w-7 text-center text-small" aria-live="polite">
                        {pick.qty}
                      </span>
                      <button type="button" disabled={pick.qty >= MAX_QTY} onClick={() => set(r, { ...pick, qty: pick.qty + 1 })} className="grid size-10 place-items-center disabled:opacity-30" aria-label={`Aumentar ${p.name}`}>
                        <Icon name="plus" size={14} />
                      </button>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ol>
        <aside aria-label="Resumo do loadout" className="lg:sticky lg:top-[calc(var(--header-h)+1.5rem)] lg:self-start">
          <div className="border border-line bg-surface p-5">{summary}</div>
        </aside>
      </div>

      {kits.length > 0 && (
        <section aria-labelledby="lo-kits" className="wrap pb-section">
          <p className="eyebrow text-muted">Prontos para levar</p>
          <h2 id="lo-kits" className="font-display mt-4 text-d3">
            Kits
          </h2>
          <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {kits.map((b) => (
              <BundleCard key={b.slug} bundle={b} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
