"use client";

import Link from "next/link";
import { asset, brl, categoryHref, categoryProducts, dropTitle, getDrop, PHASE_LABEL } from "@/lib/catalog";
import { navCategories, newArrivals, preparingCategories } from "@/lib/merch/listings";
import { bundleLive, BUNDLES } from "@/lib/commerce/bundles";
import { useDropPhase, useNow } from "@/lib/time";

const drop = getDrop("001")!;

/**
 * Mega menu da loja (desktop). Abre por hover (com pequena espera), clique ou teclado (Enter/Espaço no botão "Loja").
 * Esc fecha e devolve o foco. Só lista o que existe: categorias com peça, coleções reais, drop atual e as 2 peças mais novas.
 */
export default function MegaMenu({ id, onNavigate }: { id: string; onNavigate: () => void }) {
  const phase = useDropPhase(drop);
  const now = useNow(60_000);
  const cats = navCategories();
  const soon = preparingCategories();
  const fresh = newArrivals().slice(0, 2);
  const kits = BUNDLES.some((b) => bundleLive(b, now));
  const link = "link-u inline-flex min-h-9 items-center";

  return (
    <div id={id} className="absolute inset-x-0 top-full border-b border-line bg-bg text-fg shadow-pop animate-[fade-in_.2s_var(--ease-out)]">
      <div className="wrap grid grid-cols-[1fr_1fr_1.25fr_1.35fr] gap-10 py-10 xl:gap-14">
        <nav aria-label="Categorias">
          <p className="eyebrow text-muted">Comprar por categoria</p>
          <ul className="mt-4 grid gap-0.5">
            {cats.map((c) => (
              <li key={c.slug}>
                <Link href={categoryHref(c.slug)} onClick={onNavigate} className="group flex min-h-10 items-baseline justify-between gap-4 border-b border-line">
                  <span className="font-display text-[1.375rem] leading-none transition-colors group-hover:text-accent-fg">{c.name}</span>
                  <span className="eyebrow num text-muted">{String(categoryProducts(c.slug).length).padStart(2, "0")}</span>
                </Link>
              </li>
            ))}
          </ul>
          <Link href="/shop" onClick={onNavigate} className="btn btn-ghost mt-3">
            <span>Ver tudo</span>
          </Link>
          {soon.length > 0 && (
            <p className="mt-3 text-small text-muted">
              Em preparação:{" "}
              {soon.map((c, i) => (
                <span key={c.slug}>
                  <Link href={categoryHref(c.slug)} onClick={onNavigate} className="link-u">
                    {c.name}
                  </Link>
                  {i < soon.length - 1 ? " · " : ""}
                </span>
              ))}
            </p>
          )}
        </nav>

        <nav aria-label="Coleções e atalhos">
          <p className="eyebrow text-muted">Coleções</p>
          <ul className="mt-4 grid gap-1">
            <li>
              <Link href={`/drops/${drop.slug}`} onClick={onNavigate} className={link}>
                Drop {drop.number} · {dropTitle(drop)}
              </Link>
            </li>
            <li>
              <Link href="/shop/core" onClick={onNavigate} className={link}>
                Linha Core
              </Link>
            </li>
            <li>
              <Link href="/drops#arquivo" onClick={onNavigate} className={link}>
                Arquivo
              </Link>
            </li>
          </ul>
          <p className="eyebrow mt-8 text-muted">Montar</p>
          <ul className="mt-4 grid gap-1">
            <li>
              <Link href="/loadout" onClick={onNavigate} className={link}>
                Build your loadout
              </Link>
            </li>
            {kits && (
              <li>
                <Link href="/shop/kits" onClick={onNavigate} className={link}>
                  Kits prontos
                </Link>
              </li>
            )}
            <li>
              <Link href="/about" onClick={onNavigate} className={link}>
                Sobre a marca
              </Link>
            </li>
          </ul>
        </nav>

        <Link href={`/drops/${drop.slug}`} onClick={onNavigate} className="theme-dark grain group relative flex min-h-[17rem] flex-col justify-between overflow-hidden p-6">
          {drop.heroArt && <img src={asset(drop.heroArt)} alt="" className="pointer-events-none absolute -right-6 -bottom-8 w-[70%] opacity-80 transition-transform duration-700 ease-out group-hover:scale-[1.04]" />}
          <span className="eyebrow relative text-accent-fg">
            {PHASE_LABEL[phase]} · Drop {drop.number}
          </span>
          <span className="relative">
            <span className="font-display block text-d4">{dropTitle(drop)}</span>
            <span className="eyebrow mt-3 inline-flex items-center gap-2 text-fg">
              Ver o drop <span aria-hidden>→</span>
            </span>
          </span>
        </Link>

        <div>
          <p className="eyebrow text-muted">Novidades</p>
          <ul className="mt-4 grid grid-cols-2 gap-4">
            {fresh.map((p) => (
              <li key={p.slug}>
                <Link href={`/product/${p.slug}`} onClick={onNavigate} className="group block">
                  <span className="studio block aspect-[4/5]">
                    <img src={asset(p.media[0].src)} alt="" className="size-full object-contain p-[10%] transition-transform duration-500 group-hover:scale-[1.04]" />
                  </span>
                  <span className="mt-2 block text-small font-medium">{p.name}</span>
                  <span className="num block text-small text-accent-fg">{brl(p.price)}</span>
                </Link>
              </li>
            ))}
          </ul>
          <Link href="/shop/novidades" onClick={onNavigate} className="btn btn-ghost mt-2">
            <span>Todas as novidades</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
