"use client";

import { useEffect, useState } from "react";
import { availability, productPhase, type Product } from "@/lib/catalog";
import { itemPayload, track } from "@/lib/analytics";
import { useInventoryMap } from "@/lib/inventory";
import { facetsFor, matchesFilters, SORTS, sortProducts, type Filters } from "@/lib/merch/listings";
import { useHydrated } from "@/lib/store";
import { useNow } from "@/lib/time";
import { closeOverlay, openOverlay, overlay } from "@/lib/ui";
import { readQuery, writeQuery } from "@/lib/url";
import ProductCard from "../product/ProductCard";
import Chip from "../ui/Chip";
import Drawer from "../ui/Drawer";
import Icon from "../ui/Icon";

/**
 * Grade de uma listagem: filtros (só os que têm 2+ opções), ordenação e carregamento incremental.
 * O estado fica na URL (?tamanho=M&ordem=menor) para dar para compartilhar; a canonical da página
 * continua sendo a listagem sem filtro (filtro não vira página indexada).
 */
const PAGE = 12;
type State = { f: Filters; disp: boolean; ordem: string; shown: number };

function fromURL(keys: string[]): State {
  const q = readQuery();
  const f: Filters = {};
  for (const k of keys) f[k] = q.get(k) ? q.get(k)!.split(",") : [];
  const ordem = q.get("ordem") ?? "destaques";
  return { f, disp: q.get("disp") === "1", ordem: SORTS.some(([k]) => k === ordem) ? ordem : "destaques", shown: PAGE };
}

export default function ListingGrid({ products, facets, listName, emptyText = "Nenhuma peça com esses filtros." }: { products: Product[]; facets: string[]; listName: string; emptyText?: string }) {
  const ready = useHydrated();
  const keys = facets.filter((k) => k !== "disp");
  const initial: State = { f: Object.fromEntries(keys.map((k) => [k, []])), disp: false, ordem: "destaques", shown: PAGE };
  const [state, setState] = useState<State | null>(null);
  const s = state ?? (ready ? fromURL(keys) : initial);
  const now = useNow(60_000);
  const stock = useInventoryMap() ?? undefined;
  const filtersOpen = overlay.use() === "filters";
  const groups = facetsFor(keys, products);
  // navegação no cliente: a URL só fica certa depois do commit (ver ShopView)
  const keySig = keys.join();
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState(fromURL(keySig ? keySig.split(",") : []));
  }, [keySig]);

  const update = (patch: Partial<State>) => {
    const n = { ...s, ...patch, shown: patch.shown ?? PAGE };
    setState(n);
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries(n.f)) if (v.length) q.set(k, v.join(","));
    if (n.disp) q.set("disp", "1");
    if (n.ordem !== "destaques") q.set("ordem", n.ordem);
    writeQuery(q);
  };
  const toggle = (k: string, v: string) => update({ f: { ...s.f, [k]: s.f[k]?.includes(v) ? s.f[k].filter((x) => x !== v) : [...(s.f[k] ?? []), v] } });

  const status = (p: Product) => availability(p, productPhase(p, now, stock), stock?.[p.slug]);
  const list = sortProducts(
    products.filter((p) => matchesFilters(p, s.f, stock?.[p.slug]) && (!s.disp || status(p) !== "sold-out")),
    s.ordem,
  ).sort((a, b) => Number(status(a) === "sold-out") - Number(status(b) === "sold-out")); // esgotado continua visível, no fim
  const visible = list.slice(0, s.shown);
  const active = Object.values(s.f).reduce((n, v) => n + v.length, 0) + (s.disp ? 1 : 0);

  const listKey = list.map((p) => p.slug).join();
  useEffect(() => {
    if (!ready || !listKey) return;
    track("view_item_list", { ...itemPayload(listKey.split(",").map((slug) => ({ slug, qty: 1 }))), item_list_id: listName, item_list_name: listName });
  }, [ready, listKey, listName]);

  const filters = (
    <div className="flex flex-col gap-8">
      {groups.map((g) => (
        <fieldset key={g.key}>
          <legend className="eyebrow mb-3 text-muted">{g.label}</legend>
          <div className="flex flex-wrap gap-1.5">
            {g.options.map((o) => (
              <Chip key={o.value} on={!!s.f[g.key]?.includes(o.value)} onClick={() => toggle(g.key, o.value)} label={g.key === "tamanho" ? `Tamanho ${o.label}` : undefined}>
                {o.label}
              </Chip>
            ))}
          </div>
        </fieldset>
      ))}
      {facets.includes("disp") && (
        <fieldset>
          <legend className="eyebrow mb-3 text-muted">Disponibilidade</legend>
          <label className="flex min-h-10 items-center gap-3">
            <input type="checkbox" className="check" checked={s.disp} onChange={(e) => update({ disp: e.target.checked })} />
            Esconder esgotados
          </label>
        </fieldset>
      )}
      {active > 0 && (
        <button type="button" onClick={() => update({ f: Object.fromEntries(keys.map((k) => [k, []])), disp: false })} className="btn btn-ghost self-start">
          <span>Limpar filtros ({active})</span>
        </button>
      )}
    </div>
  );
  const hasFilters = groups.length > 0 || facets.includes("disp");

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 border-y border-line py-4">
        <p className="eyebrow text-muted" role="status">
          {list.length} {list.length === 1 ? "peça" : "peças"}
          {active ? ` · ${active} ${active === 1 ? "filtro" : "filtros"}` : ""}
        </p>
        <div className="flex w-full items-center gap-2 sm:w-auto">
          {hasFilters && (
            <button type="button" onClick={() => openOverlay("filters")} className="btn btn-secondary btn-sm flex-1 sm:flex-none lg:hidden" aria-expanded={filtersOpen}>
              <Icon name="filter" size={16} /> Filtrar{active ? ` (${active})` : ""}
            </button>
          )}
          <label htmlFor={`ordem-${listName}`} className="sr-only">
            Ordenar por
          </label>
          <div className="relative flex-1 sm:flex-none">
            <select id={`ordem-${listName}`} value={s.ordem} onChange={(e) => update({ ordem: e.target.value })} className="input min-h-10 min-w-[12rem] appearance-none py-0 pr-10 font-mono text-label tracking-[0.1em] uppercase">
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

      <div className={`mt-10 grid gap-10 ${hasFilters ? "lg:grid-cols-[14rem_1fr] xl:gap-14" : ""}`}>
        {hasFilters && (
          <aside aria-label="Filtros" className="hidden lg:block">
            <div className="sticky top-[calc(var(--header-h)+2rem)]">{filters}</div>
          </aside>
        )}
        <section aria-label="Peças" aria-busy={!ready}>
          {visible.length ? (
            <>
              <div className={`grid grid-cols-2 gap-x-3 gap-y-10 sm:gap-x-5 md:gap-y-14 ${hasFilters ? "md:grid-cols-3" : "md:grid-cols-3 lg:grid-cols-4"}`}>
                {visible.map((p, i) => (
                  <ProductCard key={p.slug} product={p} index={i} priority={i < 2} />
                ))}
              </div>
              {list.length > visible.length && (
                <div className="mt-14 flex flex-col items-center gap-3">
                  <p className="eyebrow num text-muted">
                    {visible.length} de {list.length}
                  </p>
                  <button type="button" onClick={() => setState({ ...s, shown: s.shown + PAGE })} className="btn btn-secondary">
                    Ver mais {Math.min(PAGE, list.length - visible.length)}
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="py-12">
              <p className="font-display text-d4">{emptyText}</p>
              <button type="button" onClick={() => update({ f: Object.fromEntries(keys.map((k) => [k, []])), disp: false })} className="btn btn-primary mt-6">
                Limpar filtros
              </button>
            </div>
          )}
        </section>
      </div>

      {hasFilters && (
        <Drawer
          open={filtersOpen}
          onClose={closeOverlay}
          title={`Filtrar${active ? ` · ${active}` : ""}`}
          footer={
            <button type="button" onClick={closeOverlay} className="btn btn-primary btn-lg btn-block">
              Ver {list.length} {list.length === 1 ? "peça" : "peças"}
            </button>
          }
        >
          <div className="p-5">{filters}</div>
        </Drawer>
      )}
    </div>
  );
}
