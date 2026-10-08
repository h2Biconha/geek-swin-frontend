"use client";

import Link from "next/link";
import { useState } from "react";
import { useHydrated } from "@/lib/store";
import { accountPreview, DEMO_ACCOUNT, favSizes, LEVELS } from "@/lib/account";
import { BRAND } from "@/lib/brand";
import { asset, brl, coreProducts, getDrop, getProduct, dropTitle } from "@/lib/catalog";
import { useWishlist } from "@/lib/wishlist";
import ProductGrid from "../product/ProductGrid";
import EmptyState from "../ui/EmptyState";

const TABS = ["Pedidos", "Favoritos", "Drops", "Tamanhos", "Endereços", "Dados"] as const;

function Visitor() {
  const [msg, setMsg] = useState("");
  return (
    <div className="grid gap-12 lg:grid-cols-2">
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          setMsg("Prévia: as contas ainda não estão conectadas. O login entra junto com o checkout real.");
        }}
        className="flex flex-col gap-4"
        aria-labelledby="login-t"
      >
        <h2 id="login-t" className="font-display text-d4">
          Entrar
        </h2>
        <div>
          <label htmlFor="lg-e" className="field-label">
            E-mail
          </label>
          <input id="lg-e" type="email" autoComplete="email" className="input" />
        </div>
        <div>
          <label htmlFor="lg-p" className="field-label">
            Senha
          </label>
          <input id="lg-p" type="password" autoComplete="current-password" className="input" />
        </div>
        <button type="submit" className="btn btn-primary btn-lg">
          Entrar
        </button>
        <p className="text-small text-muted">Sem senha? Vamos mandar um link de acesso por e-mail (login sem senha).</p>
        {msg && (
          <p role="status" className="border-l-2 border-accent pl-3 text-small">
            {msg}
          </p>
        )}
      </form>
      <div className="studio flex flex-col gap-6 p-6 md:p-10">
        <h2 className="font-display text-d4">Criar conta = nível 01 · PLAYER</h2>
        <ul className="grid gap-3 text-muted">
          {["Pedidos e rastreio num lugar só", "Wishlist em qualquer aparelho", "Seus tamanhos salvos para comprar em 2 toques", "Aviso de drop antes da lista aberta", "Caminho para MEMBER, OG e LEGEND"].map((t) => (
            <li key={t} className="flex gap-3">
              <span aria-hidden className="mt-2.5 h-px w-4 shrink-0 bg-current" />
              {t}
            </li>
          ))}
        </ul>
        <button type="button" onClick={() => accountPreview.write(true)} className="btn btn-secondary self-start">
          Ver prévia da conta
        </button>
      </div>
    </div>
  );
}

function Logged() {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Pedidos");
  const wish = useWishlist();
  const sizes = favSizes.use();
  const lvl = LEVELS[DEMO_ACCOUNT.level];
  const next = LEVELS[DEMO_ACCOUNT.level + 1];
  return (
    <>
      <p role="note" className="eyebrow mb-8 border border-dashed border-line-strong px-4 py-3 text-muted">
        Prévia com dados de exemplo · favoritos e tamanhos são reais (deste navegador)
      </p>
      <div className="theme-dark grid gap-8 p-6 md:grid-cols-[1fr_auto] md:items-end md:p-10">
        <div>
          <p className="eyebrow text-muted">Geek level · nível {lvl.n}</p>
          <p className="font-display mt-3 text-d2">{lvl.name}</p>
          <p className="mt-3 text-muted">{DEMO_ACCOUNT.name}</p>
        </div>
        {next && (
          <div className="md:w-80">
            <p className="eyebrow flex justify-between text-muted">
              <span>Próximo: {next.name}</span>
              <span className="num">1/2</span>
            </p>
            <div className="mt-2 h-[2px] bg-line">
              <div className="h-full w-1/2 bg-accent" />
            </div>
            <p className="mt-3 text-small text-muted">{next.rule}</p>
          </div>
        )}
      </div>

      <div role="tablist" aria-label="Seções da conta" className="scrollbar-none mt-10 flex gap-1 overflow-x-auto border-b border-line">
        {TABS.map((t) => (
          <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={`eyebrow min-h-12 shrink-0 border-b-2 px-3 ${tab === t ? "border-accent text-fg" : "border-transparent text-muted hover:text-fg"}`}>
            {t}
          </button>
        ))}
      </div>

      <div role="tabpanel" className="pt-8">
        {tab === "Pedidos" &&
          DEMO_ACCOUNT.orders.map((o) => (
            <article key={o.id} className="grid gap-4 border-b border-line pb-8 md:grid-cols-[1fr_auto]">
              <div>
                <p className="eyebrow num">Pedido {o.id}</p>
                <p className="mt-1 text-small text-muted">{o.status}</p>
                <div className="mt-4 flex gap-3">
                  {o.items.map((i) => {
                    const p = getProduct(i.slug)!;
                    return (
                      <Link key={i.slug} href={`/product/${p.slug}`} className="flex items-center gap-3">
                        <span className="studio block size-20">
                          <img src={asset(p.media[0].src)} alt="" className="size-full object-contain p-1.5" />
                        </span>
                        <span className="text-small">
                          {p.name}
                          <span className="block text-muted">Tam. {i.size}</span>
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </div>
              <p className="num font-semibold">{brl(o.total)}</p>
            </article>
          ))}
        {tab === "Favoritos" && (wish.length ? <ProductGrid products={wish.map((s) => getProduct(s)!).filter(Boolean)} /> : <EmptyState title="Nada salvo" text="O coração em cada peça guarda aqui." cta="Ir ao shop" href="/shop" />)}
        {tab === "Drops" && (
          <div className="grid gap-4">
            {DEMO_ACCOUNT.dropsOwned.map((n) => {
              const d = getDrop(n)!;
              return (
                <Link key={n} href={`/drops/${d.slug}`} className="theme-dark flex items-baseline justify-between p-6">
                  <span className="font-display text-d3">{d.number}</span>
                  <span className="font-display text-[1.75rem]">{dropTitle(d)}</span>
                </Link>
              );
            })}
            <p className="text-small text-muted">Recompra: peças da linha Core voltam ao estoque.</p>
            <ProductGrid products={coreProducts()} cols={3} />
          </div>
        )}
        {tab === "Tamanhos" && (
          <div className="grid max-w-xl gap-6">
            <p className="text-muted">Salvos neste navegador. Na página da peça, o seu tamanho já vem marcado (quando as contas estiverem no ar).</p>
            {(
              [
                ["top", "Camisetas e moletons", ["P", "M", "G", "GG", "XG"]],
                ["bottom", "Calças", ["38", "40", "42", "44", "46"]],
                ["socks", "Meias", ["38-40", "41-43", "44-46"]],
              ] as const
            ).map(([k, l, opts]) => (
              <fieldset key={k}>
                <legend className="field-label">{l}</legend>
                <div className="flex flex-wrap gap-1.5">
                  {opts.map((o) => (
                    <button key={o} type="button" aria-pressed={sizes[k] === o} onClick={() => favSizes.write({ ...sizes, [k]: o })} className={`num min-h-11 min-w-12 border px-3 font-mono text-label ${sizes[k] === o ? "border-fg bg-fg text-bg" : "border-line-strong"}`}>
                      {o}
                    </button>
                  ))}
                </div>
              </fieldset>
            ))}
          </div>
        )}
        {tab === "Endereços" &&
          DEMO_ACCOUNT.addresses.map((a) => (
            <div key={a.label} className="max-w-xl border border-line p-5">
              <p className="eyebrow">{a.label}</p>
              <p className="mt-2 text-muted">{a.line}</p>
            </div>
          ))}
        {tab === "Dados" && (
          <dl className="grid max-w-xl grid-cols-[8rem_1fr] gap-y-3">
            <dt className="eyebrow text-muted">Nome</dt>
            <dd>{DEMO_ACCOUNT.name}</dd>
            <dt className="eyebrow text-muted">E-mail</dt>
            <dd>{DEMO_ACCOUNT.email}</dd>
            <dt className="eyebrow text-muted">Avisos</dt>
            <dd>E-mail · drops e pré-vendas</dd>
          </dl>
        )}
      </div>

      <button type="button" onClick={() => accountPreview.write(false)} className="btn btn-ghost mt-12">
        <span>Sair da prévia</span>
      </button>
    </>
  );
}

export default function AccountView() {
  const preview = accountPreview.use();
  const ready = useHydrated();
  return (
    <div className="wrap pt-10 pb-section lg:pt-14">
      <p className="eyebrow text-muted">{preview && ready ? "Logado (prévia)" : "Visitante"}</p>
      <h1 className="font-display mt-3 mb-12 text-d2">Minha {BRAND.name}</h1>
      {!ready ? <div className="skeleton h-64" /> : preview ? <Logged /> : <Visitor />}
    </div>
  );
}
