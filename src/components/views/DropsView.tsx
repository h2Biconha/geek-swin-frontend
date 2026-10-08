"use client";

import Link from "next/link";
import { availability, dropPhase, getDrop, PRODUCTS } from "@/lib/catalog";
import { useNow } from "@/lib/time";
import DropTimeline from "../drop/DropTimeline";
import WhyDrops from "../drop/WhyDrops";
import ProductCard from "../product/ProductCard";

export default function DropsView() {
  const now = useNow(60_000);
  // ARCHIVE: tudo que esgotou continua visível
  const archive = PRODUCTS.filter((p) => availability(p, p.drop ? dropPhase(getDrop(p.drop)!, now) : undefined) === "sold-out");
  return (
    <>
      <section className="theme-dark grain relative -mt-header overflow-hidden pt-header">
        <div className="wrap relative pt-16 pb-section lg:pt-24">
          <p className="eyebrow text-muted animate-[fade-in_.6s_both]">Arquivo da marca</p>
          <h1 className="font-display mt-4 animate-[rise_.8s_var(--ease-out)_both] text-d1">Drops</h1>
          <p className="mt-8 max-w-[44ch] animate-[rise_.8s_var(--ease-out)_.15s_both] text-[1.125rem] text-muted">Cada coleção é um capítulo. Tem número, nome, tiragem e data. Quando acaba, vira história e fica aqui.</p>
          <div className="mt-14">
            <DropTimeline />
          </div>
        </div>
      </section>

      <WhyDrops />

      <section id="archive" aria-labelledby="archive-t" className="wrap py-section">
        <div className="flex flex-wrap items-end justify-between gap-6" data-reveal>
          <div>
            <p className="eyebrow text-muted">Sold out</p>
            <h2 id="archive-t" className="font-display mt-4 text-d2">
              Archive
            </h2>
          </div>
          <p className="max-w-[40ch] text-muted">Peças esgotadas não somem. Ficam aqui com o número da tiragem, para todo mundo ver o que já existiu.</p>
        </div>
        {archive.length ? (
          <div className="mt-12 grid grid-cols-2 gap-x-3 gap-y-10 sm:gap-x-5 lg:grid-cols-4">
            {archive.map((p, i) => (
              <ProductCard key={p.slug} product={p} index={i} />
            ))}
          </div>
        ) : (
          <div className="mt-12 grid gap-6 border border-dashed border-line-strong p-8 md:grid-cols-[auto_1fr_auto] md:items-center md:p-12" data-reveal>
            <span className="font-display num text-d2 text-muted">000</span>
            <p className="max-w-[48ch] text-muted">O arquivo ainda está vazio. A primeira peça entra aqui quando o Drop 001 esgotar. Depois disso, ela não volta.</p>
            <Link href="/drops/001-insert-coin" className="btn btn-primary">
              Garantir a minha
            </Link>
          </div>
        )}
      </section>
    </>
  );
}
