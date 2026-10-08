"use client";

import { useEffect, useState } from "react";
import { availability, CATEGORIES, categoryName, dropPhase, DROPS, getDrop, PRODUCTS, type Product } from "@/lib/catalog";
import { useNow } from "@/lib/time";
import { closeOverlay, openOverlay, overlay } from "@/lib/ui";
import { readQuery, writeQuery } from "@/lib/url";
import { useHydrated } from "@/lib/store";
import ProductCard from "../product/ProductCard";
import Drawer from "../ui/Drawer";
import Icon from "../ui/Icon";

/** Shop: filtros e ordenação na hora, sem recarregar. O estado fica na URL (dá pra compartilhar o link filtrado). */
const SORTS = [
  ["destaques", "Destaques"],
  ["recentes", "Mais recentes"],
  ["vendidos", "Mais vendidos"],
  ["menor", "Menor preço"],
  ["maior", "Maior preço"],
] as const;
const PRICES = [
  ["ate-150", "Até R$ 150", (v: number) => v <= 150],
  ["150-250", "R$ 150 a 250", (v: number) => v > 150 && v <= 250],
  ["250-mais", "Acima de R$ 250", (v: number) => v > 250],
] as const;
const SIZE_GROUPS: [string, string[]][] = [
  ["Parte de cima", ["P", "M", "G", "GG", "XG"]],
  ["Calças", ["38", "40", "42", "44", "46"]],
  ["Outros", ["Único", "38-40", "41-43", "44-46"]],
];
type F = { categoria: string[]; tamanho: string[]; preco: string[]; drop: string; disp: string; ordem: string };
const EMPTY: F = { categoria: [], tamanho: [], preco: [], drop: "", disp: "", ordem: "destaques" };

function fromURL(): F {
  const q = readQuery();
  const list = (k: string) => (q.get(k) ? q.get(k)!.split(",") : []);
  return { categoria: list("categoria"), tamanho: list("tamanho"), preco: list("preco"), drop: q.get("drop") ?? "", disp: q.get("disp") ?? "", ordem: q.get("ordem") ?? "destaques" };
}

function Chip({ on, onClick, children, label }: { on: boolean; onClick: () => void; children: React.ReactNode; label?: string }) {
  return (
    <button type="button" aria-pressed={on} aria-label={label} onClick={onClick} className={`num min-h-10 border px-3 font-mono text-label transition-colors ${on ? "border-fg bg-fg text-bg" : "border-line-strong hover:border-fg"}`}>
      {children}
    </button>
  );
}

export default function ShopView() {
  const ready = useHydrated();
  const [state, setF] = useState<F | null>(null);
  // antes da 1ª interação, os filtros vêm da URL (só no navegador; no HTML do build, sem filtro)
  const f = state ?? (ready ? fromURL() : EMPTY);
  const now = useNow(60_000);
  const filtersOpen = overlay.use() === "filters";

  useEffect(() => {
    const on = () => setF(fromURL());
    window.addEventListener("popstate", on);
    window.addEventListener("hashchange", on);
    return () => (window.removeEventListener("popstate", on), window.removeEventListener("hashchange", on));
  }, []);

  const update = (patch: Partial<F>) => {
    const n = { ...f, ...patch };
    setF(n);
    const q = new URLSearchParams();
    if (n.categoria.length) q.set("categoria", n.categoria.join(","));
    if (n.tamanho.length) q.set("tamanho", n.tamanho.join(","));
    if (n.preco.length) q.set("preco", n.preco.join(","));
    if (n.drop) q.set("drop", n.drop);
    if (n.disp) q.set("disp", n.disp);
    if (n.ordem !== "destaques") q.set("ordem", n.ordem);
    writeQuery(q);
  };
  const toggle = (k: "categoria" | "tamanho" | "preco", v: string) => update({ [k]: f[k].includes(v) ? f[k].filter((x) => x !== v) : [...f[k], v] });

  const status = (p: Product) => availability(p, p.drop ? dropPhase(getDrop(p.drop)!, now) : undefined);
  const list = (() => {
    const r = PRODUCTS.filter(
      (p) =>
        (!f.categoria.length || f.categoria.includes(p.category)) &&
        (!f.tamanho.length || f.tamanho.some((s) => p.sizes.includes(s) && !p.soldOut.includes(s))) &&
        (!f.preco.length || PRICES.some(([k, , fn]) => f.preco.includes(k) && fn(p.price))) &&
        (!f.drop || (f.drop === "core" ? !p.drop : p.drop === f.drop)) &&
        (!f.disp || status(p) !== "sold-out"),
    );
    const s = [...r];
    if (f.ordem === "recentes") s.sort((a, b) => b.addedAt.localeCompare(a.addedAt) || a.rank - b.rank);
    else if (f.ordem === "vendidos") s.sort((a, b) => a.rank - b.rank);
    else if (f.ordem === "menor") s.sort((a, b) => a.price - b.price);
    else if (f.ordem === "maior") s.sort((a, b) => b.price - a.price);
    else s.sort((a, b) => Number(b.featured) - Number(a.featured) || a.rank - b.rank);
    // esgotados vão para o fim, mas continuam visíveis (arquivo)
    return s.sort((a, b) => Number(status(a) === "sold-out") - Number(status(b) === "sold-out"));
  })();

  const activeCount = f.categoria.length + f.tamanho.length + f.preco.length + (f.drop ? 1 : 0) + (f.disp ? 1 : 0);
  const title = f.categoria.length === 1 ? categoryName(f.categoria[0]) : f.drop === "core" ? "Linha Core" : f.drop ? `Drop ${f.drop}` : "Shop";

  const filters = (
    <div className="flex flex-col gap-8">
      <fieldset>
        <legend className="eyebrow mb-3 text-muted">Drop</legend>
        <div className="flex flex-wrap gap-1.5">
          <Chip on={!f.drop} onClick={() => update({ drop: "" })}>
            Todos
          </Chip>
          {DROPS.filter((d) => PRODUCTS.some((p) => p.drop === d.number)).map((d) => (
            <Chip key={d.number} on={f.drop === d.number} onClick={() => update({ drop: f.drop === d.number ? "" : d.number })}>
              Drop {d.number}
            </Chip>
          ))}
          <Chip on={f.drop === "core"} onClick={() => update({ drop: f.drop === "core" ? "" : "core" })}>
            Core
          </Chip>
        </div>
      </fieldset>
      <fieldset>
        <legend className="eyebrow mb-3 text-muted">Categoria</legend>
        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map((c) => (
            <Chip key={c.slug} on={f.categoria.includes(c.slug)} onClick={() => toggle("categoria", c.slug)}>
              {c.name}
            </Chip>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend className="eyebrow mb-3 text-muted">Tamanho disponível</legend>
        <div className="flex flex-col gap-3">
          {SIZE_GROUPS.map(([g, sizes]) => (
            <div key={g}>
              <p className="mb-1.5 text-small text-muted">{g}</p>
              <div className="flex flex-wrap gap-1.5">
                {sizes.map((s) => (
                  <Chip key={s} on={f.tamanho.includes(s)} onClick={() => toggle("tamanho", s)} label={`Tamanho ${s}`}>
                    {s}
                  </Chip>
                ))}
              </div>
            </div>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend className="eyebrow mb-3 text-muted">Preço</legend>
        <div className="flex flex-wrap gap-1.5">
          {PRICES.map(([k, l]) => (
            <Chip key={k} on={f.preco.includes(k)} onClick={() => toggle("preco", k)}>
              {l}
            </Chip>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend className="eyebrow mb-3 text-muted">Disponibilidade</legend>
        <label className="flex min-h-10 items-center gap-3">
          <input type="checkbox" className="check" checked={!!f.disp} onChange={(e) => update({ disp: e.target.checked ? "1" : "" })} />
          Esconder esgotados
        </label>
      </fieldset>
      {activeCount > 0 && (
        <button type="button" onClick={() => update({ ...EMPTY, ordem: f.ordem })} className="btn btn-ghost self-start">
          <span>Limpar filtros ({activeCount})</span>
        </button>
      )}
    </div>
  );

  return (
    <div className="wrap pt-10 pb-section lg:pt-14">
      <div className="flex flex-wrap items-end justify-between gap-6 border-b border-line pb-8">
        <div>
          <p className="eyebrow text-muted">
            {list.length} {list.length === 1 ? "peça" : "peças"}
          </p>
          <h1 className="font-display mt-3 text-d2">{title}</h1>
        </div>
        <div className="flex w-full items-center gap-2 sm:w-auto">
          <button type="button" onClick={() => openOverlay("filters")} className="btn btn-secondary flex-1 sm:flex-none lg:hidden" aria-expanded={filtersOpen}>
            <Icon name="filter" size={18} /> Filtrar{activeCount ? ` (${activeCount})` : ""}
          </button>
          <label htmlFor="ordem" className="sr-only">
            Ordenar por
          </label>
          <div className="relative flex-1 sm:flex-none">
            <select id="ordem" value={f.ordem} onChange={(e) => update({ ordem: e.target.value })} className="input min-w-[12rem] appearance-none pr-10 font-mono text-label tracking-[0.1em] uppercase">
              {SORTS.map(([k, l]) => (
                <option key={k} value={k}>
                  {l}
                </option>
              ))}
            </select>
            <span aria-hidden className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-muted">
              ↓
            </span>
          </div>
        </div>
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-[15rem_1fr] xl:gap-14">
        <aside aria-label="Filtros" className="hidden lg:block">
          <div className="sticky top-[calc(var(--header-h)+2rem)]">{filters}</div>
        </aside>
        <div aria-live="polite" aria-busy={!ready}>
          {list.length ? (
            <div className="grid grid-cols-2 gap-x-3 gap-y-10 sm:gap-x-5 md:grid-cols-3 md:gap-y-14">
              {list.map((p, i) => (
                <ProductCard key={p.slug} product={p} index={i} priority={i < 3} />
              ))}
            </div>
          ) : (
            <div className="py-16">
              <p className="font-display text-d4">Nenhuma peça com esses filtros.</p>
              <p className="mt-3 text-muted">Tira um filtro ou volte para tudo.</p>
              <button type="button" onClick={() => update(EMPTY)} className="btn btn-primary mt-6">
                Limpar filtros
              </button>
            </div>
          )}
        </div>
      </div>

      <Drawer
        open={filtersOpen}
        onClose={closeOverlay}
        title={`Filtrar${activeCount ? ` · ${activeCount}` : ""}`}
        footer={
          <button type="button" onClick={closeOverlay} className="btn btn-primary btn-lg btn-block">
            Ver {list.length} {list.length === 1 ? "peça" : "peças"}
          </button>
        }
      >
        <div className="p-5">{filters}</div>
      </Drawer>
    </div>
  );
}
