"use client";

import Link from "next/link";
import { useState } from "react";
import { asset, brl, isBuyable } from "@/lib/catalog";
import { cart } from "@/lib/cart";
import { bundleBuyable, bundleDiscountCents, slotOptions, type Bundle } from "@/lib/commerce/bundles";
import { useInventoryMap } from "@/lib/inventory";
import { useNow } from "@/lib/time";
import SizeSelect, { presetSize } from "./SizeSelect";

/**
 * Card de kit: escolha a peça de cada espaço e o tamanho, veja a soma e (se houver) a economia real.
 * O kit só pode ser adicionado completo; cada peça continua sujeita ao próprio estoque.
 */
export default function BundleCard({ bundle: b, highlight }: { bundle: Bundle; highlight?: string }) {
  const now = useNow(60_000);
  const stock = useInventoryMap() ?? undefined;
  const [pick, setPick] = useState<string[]>(() => b.slots.map((s) => (slotOptions(s).find((p) => p.slug === highlight) ?? slotOptions(s)[0])?.slug ?? ""));
  const [sizes, setSizes] = useState<Record<number, string | null>>({});
  const [err, setErr] = useState(false);
  const products = b.slots.map((s, i) => slotOptions(s).find((p) => p.slug === pick[i]) ?? slotOptions(s)[0]);
  const sumCents = products.reduce((t, p) => t + Math.round((p?.price ?? 0) * 100), 0);
  const off = bundleDiscountCents(b, sumCents);
  const can = bundleBuyable(b, now, stock) && products.every((p) => p && isBuyable(p, now, stock));
  const sizeOf = (i: number) => sizes[i] ?? (products[i] ? presetSize(products[i]) : null);

  const add = () => {
    if (products.some((_, i) => !sizeOf(i))) return setErr(true);
    setErr(false);
    cart.addMany(products.map((p, i) => ({ slug: p.slug, size: sizeOf(i)! })), { kit: b.slug, listName: `kit:${b.slug}` });
  };

  return (
    <article className="flex flex-col border border-line" aria-labelledby={`kit-${b.slug}`}>
      <div className="studio relative grid aspect-[16/10] grid-flow-col place-items-center gap-2 overflow-hidden px-6">
        {products.map((p, i) => p && <img key={p.slug} src={asset(p.media[0].src)} alt="" loading="lazy" className={`max-h-[82%] w-full object-contain ${i % 2 ? "translate-y-[8%]" : "-translate-y-[4%]"}`} />)}
        <span className="eyebrow absolute top-4 left-4 text-muted">Kit · {b.slots.length} peças</span>
      </div>
      <div className="flex flex-1 flex-col gap-5 p-5">
        <div>
          <h3 id={`kit-${b.slug}`} className="font-display text-[2rem] leading-none">
            {b.name}
          </h3>
          <p className="mt-2 text-muted">{b.tagline}</p>
        </div>
        <ol className="grid gap-4">
          {b.slots.map((s, i) => {
            const opts = slotOptions(s);
            const p = products[i];
            if (!p) return null;
            return (
              <li key={s.label} className="grid gap-2 border-t border-line pt-4">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="eyebrow text-muted">
                    0{i + 1} · {s.label}
                  </span>
                  <span className="num text-small">{brl(p.price)}</span>
                </div>
                {opts.length > 1 ? (
                  <div role="radiogroup" aria-label={`${s.label} do ${b.name}`} className="flex flex-wrap gap-1.5">
                    {opts.map((o) => (
                      <button
                        key={o.slug}
                        type="button"
                        role="radio"
                        aria-checked={o.slug === p.slug}
                        disabled={!isBuyable(o, now, stock)}
                        onClick={() => (setPick((x) => x.map((v, j) => (j === i ? o.slug : v))), setSizes((z) => ({ ...z, [i]: null })))}
                        className={`min-h-10 border px-3 text-small transition-colors disabled:opacity-40 ${o.slug === p.slug ? "border-fg bg-fg text-bg" : "border-line-strong hover:border-fg"}`}
                      >
                        {o.name}
                      </button>
                    ))}
                  </div>
                ) : (
                  <Link href={`/product/${p.slug}`} className="link-u self-start text-small font-medium">
                    {p.name}
                  </Link>
                )}
                <SizeSelect product={p} id={`kit-${b.slug}-${i}`} value={sizeOf(i)} onChange={(v) => setSizes((z) => ({ ...z, [i]: v }))} inv={stock?.[p.slug]} invalid={err && !sizeOf(i)} />
              </li>
            );
          })}
        </ol>
        <div className="mt-auto grid gap-3 border-t border-line pt-4">
          <dl className="num grid grid-cols-[1fr_auto] gap-y-1 text-small">
            {off > 0 ? (
              <>
                <dt className="text-muted">Peças separadas</dt>
                <dd className="text-muted">{brl(sumCents / 100)}</dd>
                <dt className="font-semibold">Preço do kit</dt>
                <dd className="font-semibold text-accent-fg">{brl((sumCents - off) / 100)}</dd>
                <dd className="col-span-2 text-accent-fg">Você economiza {brl(off / 100)} levando junto.</dd>
              </>
            ) : (
              <>
                <dt className="font-semibold">Total do kit</dt>
                <dd className="font-semibold">{brl(sumCents / 100)}</dd>
                <dd className="col-span-2 text-muted">Soma das peças: escolha os tamanhos e leve o look de uma vez.</dd>
              </>
            )}
          </dl>
          {err && (
            <p role="alert" className="field-error mt-0">
              Escolha o tamanho de cada peça.
            </p>
          )}
          <button type="button" onClick={add} disabled={!can} className="btn btn-primary btn-block">
            {can ? `Adicionar kit · ${brl((sumCents - off) / 100)}` : "Indisponível agora"}
          </button>
        </div>
      </div>
    </article>
  );
}
