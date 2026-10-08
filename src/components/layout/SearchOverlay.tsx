"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { asset, brl } from "@/lib/catalog";
import { track } from "@/lib/analytics";
import { BRAND } from "@/lib/brand";
import { searchCatalog, SEARCH_SUGGESTIONS, type SearchResults } from "@/lib/search";
import { closeOverlay, overlay, openOverlay } from "@/lib/ui";
import Icon from "../ui/Icon";

/** Busca instantânea em produtos, drops e categorias. Atalho: tecla "/". */
export default function SearchOverlay() {
  const open = overlay.use() === "search";
  const [q, setQ] = useState("");
  const [res, setRes] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (e.key === "/" && !/INPUT|TEXTAREA|SELECT/.test(t.tagName)) {
        e.preventDefault();
        openOverlay("search");
      }
      if (e.key === "Escape" && overlay.get() === "search") closeOverlay();
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, []);

  useEffect(() => {
    if (!open) return;
    const html = document.documentElement;
    html.style.overflow = "hidden";
    setTimeout(() => input.current?.focus(), 20);
    return () => {
      html.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (!q.trim()) return;
    let alive = true;
    const t = setTimeout(async () => {
      const r = await searchCatalog(q);
      if (!alive) return;
      setRes(r);
      setLoading(false);
      track("search", { q });
    }, 140);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [q]);

  if (!open) return null;
  const empty = res && !res.products.length && !res.drops.length && !res.categories.length;
  const term = q.trim();

  return (
    <>
      <div className="scrim" onClick={closeOverlay} aria-hidden />
      <div role="dialog" aria-modal="true" aria-label="Buscar" className="fixed inset-x-0 top-0 z-90 max-h-[100dvh] animate-[rise_.3s_var(--ease-out)] overflow-y-auto bg-bg text-fg shadow-pop">
        <div className="wrap pt-4 pb-10">
          <div className="flex items-center gap-3 border-b border-line-strong">
            <Icon name="search" size={24} className="shrink-0" />
            <label htmlFor="gs-search" className="sr-only">
              Buscar na loja
            </label>
            <input
              id="gs-search"
              ref={input}
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setLoading(!!e.target.value.trim());
                if (!e.target.value.trim()) setRes(null);
              }}
              placeholder={`Search ${BRAND.name}`}
              autoComplete="off"
              enterKeyHint="search"
              className="font-display h-20 min-w-0 flex-1 bg-transparent text-[clamp(1.75rem,5vw,3.5rem)] placeholder:text-muted/60 focus:outline-none"
            />
            <button type="button" onClick={closeOverlay} className="grid size-11 shrink-0 place-items-center" aria-label="Fechar busca">
              <Icon name="close" />
            </button>
          </div>

          <div aria-live="polite" className="pt-8">
            {!term && (
              <div>
                <p className="eyebrow text-muted">Mais buscados</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {SEARCH_SUGGESTIONS.map((s) => (
                    <button key={s} type="button" onClick={() => (setQ(s), setLoading(true))} className="btn btn-secondary btn-sm">
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {term && loading && (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4" aria-label="Carregando resultados">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i}>
                    <div className="skeleton aspect-[4/5]" />
                    <div className="skeleton mt-3 h-3 w-2/3" />
                  </div>
                ))}
              </div>
            )}

            {term && !loading && empty && (
              <div className="py-6">
                <p className="font-display text-d4">Nada com “{term}”.</p>
                <p className="mt-3 text-muted">Tenta “hoodie”, “cargo” ou “drop 001”. Ou veja tudo que existe.</p>
                <Link href="/shop" onClick={closeOverlay} className="btn btn-primary mt-6">
                  Ver o shop
                </Link>
              </div>
            )}

            {term && !loading && res && !empty && (
              <div className="grid gap-10 lg:grid-cols-[1fr_18rem]">
                <section aria-label="Produtos">
                  <p className="eyebrow text-muted">Produtos · {res.products.length}</p>
                  <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 xl:grid-cols-4">
                    {res.products.map((p) => (
                      <li key={p.slug}>
                        <Link href={`/product/${p.slug}`} onClick={closeOverlay} className="group block">
                          <div className="studio aspect-[4/5]">
                            <img src={asset(p.media[0].src)} alt="" className="size-full object-contain p-[8%] transition-transform duration-500 group-hover:scale-[1.04]" />
                          </div>
                          <p className="mt-3 text-small font-medium">{p.name}</p>
                          <p className="num text-small text-accent-fg">{brl(p.price)}</p>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
                <div className="flex flex-col gap-8">
                  {!!res.drops.length && (
                    <section aria-label="Drops">
                      <p className="eyebrow text-muted">Drops</p>
                      <ul className="mt-3">
                        {res.drops.map((d) => (
                          <li key={d.href}>
                            <Link href={d.href} onClick={closeOverlay} className="block border-b border-line py-3">
                              <span className="font-display text-xl">{d.label}</span>
                              <span className="block text-small text-muted">{d.sub}</span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </section>
                  )}
                  {!!res.categories.length && (
                    <section aria-label="Categorias">
                      <p className="eyebrow text-muted">Categorias</p>
                      <ul className="mt-3">
                        {res.categories.map((c) => (
                          <li key={c.href}>
                            <Link href={c.href} onClick={closeOverlay} className="flex min-h-12 items-center justify-between border-b border-line">
                              {c.label} <Icon name="arrow" size={16} />
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </section>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
