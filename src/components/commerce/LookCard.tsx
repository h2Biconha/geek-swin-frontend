import Link from "next/link";
import { asset, brl, getProduct, type Product } from "@/lib/catalog";
import type { LookRef } from "@/lib/merch/looks";

/** look editorial comprável: composição, peças, soma e atalho para montar no Loadout */
export default function LookCard({ look: l, index = 0 }: { look: LookRef; index?: number }) {
  const items = l.products.map(getProduct).filter((p): p is Product => !!p);
  const total = items.reduce((s, p) => s + p.price, 0);
  return (
    <article className="flex flex-col" data-reveal style={{ "--i": index } as React.CSSProperties}>
      <div className="studio relative grid aspect-[4/5] grid-cols-2 place-items-center gap-2 overflow-hidden p-6">
        {items.slice(0, 3).map((p, j) => (
          <img key={p.slug} src={asset(p.media[0].src)} alt="" loading="lazy" className={`w-full object-contain ${j === 2 ? "col-span-2 w-1/2" : j === 1 ? "translate-y-[10%]" : "-translate-y-[6%]"}`} />
        ))}
        <span className="eyebrow absolute top-4 left-4 text-muted">
          Look {l.n} · Drop {l.drop.number}
        </span>
      </div>
      <div className="flex flex-1 flex-col py-5">
        <h3 className="font-display text-[2rem] leading-none">{l.name}</h3>
        <p className="mt-2 text-muted">{l.text}</p>
        <ul className="mt-4 grid gap-1 border-t border-line pt-3">
          {items.map((p) => (
            <li key={p.slug} className="flex items-baseline justify-between gap-3 text-small">
              <Link href={`/product/${p.slug}`} className="link-u">
                {p.name}
              </Link>
              <span className="num text-muted">{brl(p.price)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-5">
          <p className="num text-small">
            <span className="text-muted">Look completo </span>
            <strong>{brl(total)}</strong>
          </p>
          <Link href={`/loadout?look=${l.drop.number}-${l.n}`} className="btn btn-secondary btn-sm">
            Montar este look
          </Link>
        </div>
      </div>
    </article>
  );
}
