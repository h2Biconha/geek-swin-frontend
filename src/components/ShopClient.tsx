"use client";

import { useEffect, useMemo, useState } from "react";
import ProductCard from "./ProductCard";
import { CATEGORIES, PRODUCTS } from "@/lib/products";

type Sort = "rel" | "menor" | "maior";

/** Filtro por categoria (lembra no #hash da URL, ex.: /loja#calcas) + ordenação por preço. */
export default function ShopClient() {
  const [cat, setCat] = useState("todos");
  const [sort, setSort] = useState<Sort>("rel");

  useEffect(() => {
    const fromHash = () => {
      const h = window.location.hash.slice(1);
      setCat(CATEGORIES.some((c) => c.slug === h) ? h : "todos");
    };
    const id = requestAnimationFrame(fromHash); // lê o hash depois da hidratação
    window.addEventListener("hashchange", fromHash);
    return () => {
      cancelAnimationFrame(id);
      window.removeEventListener("hashchange", fromHash);
    };
  }, []);

  const list = useMemo(() => {
    const l = PRODUCTS.filter((p) => cat === "todos" || p.category === cat);
    if (sort === "menor") return [...l].sort((a, b) => a.price - b.price);
    if (sort === "maior") return [...l].sort((a, b) => b.price - a.price);
    return l;
  }, [cat, sort]);

  const choose = (c: string) => {
    setCat(c);
    history.replaceState(null, "", c === "todos" ? location.pathname : `#${c}`);
  };

  return (
    <>
      <div className="mb-10 flex flex-wrap items-center justify-between gap-4 border-y border-line/15 py-4">
        <div role="group" aria-label="Filtrar por categoria" className="flex flex-wrap gap-2">
          {[{ slug: "todos", name: "Todos" }, ...CATEGORIES].map((c) => (
            <button
              key={c.slug}
              type="button"
              aria-pressed={cat === c.slug}
              onClick={() => choose(c.slug)}
              className="rounded-full border border-line/15 px-4 py-2 font-mono text-label uppercase tracking-[0.12em] transition-colors hover:border-ink aria-pressed:border-ink aria-pressed:bg-ink aria-pressed:text-bg"
            >
              {c.name}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-3 font-mono text-micro uppercase tracking-[0.14em] text-muted">
          Ordenar
          <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="rounded-full border border-line/15 bg-surface px-4 py-2.5 text-label text-ink focus:border-ink">
            <option value="rel">Relevância</option>
            <option value="menor">Menor preço</option>
            <option value="maior">Maior preço</option>
          </select>
        </label>
      </div>
      <p aria-live="polite" className="mb-6 font-mono text-micro uppercase tracking-[0.16em] tabular-nums text-muted">
        {list.length} {list.length === 1 ? "peça" : "peças"}
      </p>
      <h2 className="sr-only">Peças</h2>
      {/* key muda com o filtro: o stagger de entrada roda de novo a cada troca */}
      <div key={cat + sort} className="grid grid-cols-2 gap-x-4 gap-y-12 lg:grid-cols-4">
        {list.map((p) => (
          <ProductCard key={p.slug} product={p} animateIn />
        ))}
      </div>
    </>
  );
}
