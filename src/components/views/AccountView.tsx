"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { favSizes, fetchMe, logout, requestLink, type Me } from "@/lib/account";
import { BRAND } from "@/lib/brand";
import { brl, getProduct } from "@/lib/catalog";
import { ORDER_STATUS_LABEL, type OrderView } from "@/lib/commerce/types";
import { STORE_CONNECTED } from "@/lib/mode";
import { useHydrated } from "@/lib/store";
import { isValidEmail } from "@/lib/validate";
import { useWishlist } from "@/lib/wishlist";
import ProductGrid from "../product/ProductGrid";
import EmptyState from "../ui/EmptyState";

/**
 * Minha conta. Login sem senha (link por e-mail). Pedidos vêm do servidor pelo e-mail da compra,
 * inclusive os feitos antes de criar a conta. Favoritos e tamanhos ficam neste navegador.
 */
const TABS = ["Pedidos", "Favoritos", "Tamanhos", "Dados"] as const;

function LoginForm() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "sent" | "error">("idle");
  const [msg, setMsg] = useState("");
  const [devLink, setDevLink] = useState<string | undefined>();
  const [notice] = useState(() => (typeof window === "undefined" ? null : new URLSearchParams(location.search).get("login")));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidEmail(email)) return (setState("error"), setMsg("Confira o e-mail. Algo como nome@gmail.com."));
    setState("loading");
    const r = await requestLink(email.trim().toLowerCase());
    if (r.ok) {
      setState("sent");
      setDevLink(r.devLink);
    } else {
      setState("error");
      setMsg(r.message);
    }
  };

  if (!STORE_CONNECTED)
    return (
      <div className="max-w-xl border border-line-strong p-6 text-small" role="note">
        <strong className="eyebrow mb-2 block">Conta indisponível na prévia</strong>
        Esta versão do site não está ligada ao servidor da loja. Seus favoritos e tamanhos continuam salvos neste navegador.
        <div className="mt-4 flex gap-3">
          <Link href="/wishlist" className="btn btn-secondary btn-sm">
            Ver favoritos
          </Link>
        </div>
      </div>
    );

  return (
    <div className="grid gap-12 lg:grid-cols-2">
      <form noValidate onSubmit={submit} className="flex flex-col gap-4" aria-labelledby="login-t">
        <h2 id="login-t" className="font-display text-d4">
          Entrar ou criar conta
        </h2>
        <p className="text-muted">Sem senha: mandamos um link de acesso para o seu e-mail. Use o mesmo e-mail das compras para ver seus pedidos.</p>
        {notice && (
          <p role="alert" className="field-error mt-0">
            {notice === "expirado" ? "Esse link expirou ou já foi usado. Peça outro." : "Link inválido. Peça outro."}
          </p>
        )}
        <div>
          <label htmlFor="lg-e" className="field-label">
            E-mail
          </label>
          <input id="lg-e" type="email" autoComplete="email" inputMode="email" value={email} onChange={(e) => (setEmail(e.target.value), setState("idle"))} className="input" aria-invalid={state === "error"} aria-describedby={state === "error" ? "lg-e-err" : undefined} />
          {state === "error" && (
            <p id="lg-e-err" className="field-error">
              {msg}
            </p>
          )}
        </div>
        <button type="submit" className="btn btn-primary btn-lg" disabled={state === "loading"}>
          {state === "loading" ? "Enviando…" : "Receber link de acesso"}
        </button>
        {state === "sent" && (
          <p role="status" className="border-l-2 border-accent pl-3 text-small">
            Se esse e-mail puder entrar, o link chega em instantes. Ele vale 15 minutos. Confira também o spam.
            {devLink && (
              <a href={devLink} className="link-u mt-2 block text-fg">
                Ambiente de teste: entrar com o link
              </a>
            )}
          </p>
        )}
      </form>
      <div className="studio flex flex-col gap-5 p-6 md:p-10">
        <h2 className="font-display text-d4">Na sua conta</h2>
        <ul className="grid gap-3 text-muted">
          {["Pedidos e rastreio num lugar só", "Status do pagamento e número de cada peça numerada"].map((t) => (
            <li key={t} className="flex gap-3">
              <span aria-hidden className="mt-2.5 h-px w-4 shrink-0 bg-current" />
              {t}
            </li>
          ))}
        </ul>
        <p className="text-small text-muted">Favoritos e tamanhos salvos ficam neste navegador, com ou sem conta.</p>
      </div>
    </div>
  );
}

function Sizes() {
  const sizes = favSizes.use();
  return (
    <div className="grid max-w-xl gap-6">
      <p className="text-muted">Salvos neste navegador. A página da peça já abre com o seu tamanho marcado.</p>
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
              <button key={o} type="button" aria-pressed={sizes[k] === o} onClick={() => favSizes.write({ ...sizes, [k]: sizes[k] === o ? undefined : o })} className={`num min-h-11 min-w-12 border px-3 font-mono text-label ${sizes[k] === o ? "border-fg bg-fg text-bg" : "border-line-strong"}`}>
                {o}
              </button>
            ))}
          </div>
        </fieldset>
      ))}
    </div>
  );
}

function Orders({ orders }: { orders: OrderView[] }) {
  if (!orders.length) return <EmptyState level={2} code="PEDIDOS · 0" title="Nenhum pedido ainda" text="Quando você comprar com este e-mail, o pedido aparece aqui." cta="Ver a loja" href="/shop" />;
  return (
    <ul className="grid gap-3">
      {orders.map((o) => (
        <li key={o.id} className="grid gap-4 border border-line p-5 sm:grid-cols-[1fr_auto] sm:items-center">
          <div>
            <p className="eyebrow num">
              {o.id} · {new Date(o.createdAt).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })}
            </p>
            <p className="mt-2">{o.items.map((i) => `${i.qty}× ${getProduct(i.slug)?.name ?? i.name} (${i.size})`).join(", ")}</p>
            <p className="mt-1 text-small text-muted">
              {ORDER_STATUS_LABEL[o.status]}
              {o.trackingCode ? ` · rastreio ${o.trackingCode}` : ""}
            </p>
          </div>
          <div className="flex items-center gap-4 sm:flex-col sm:items-end">
            <span className="num">{brl(o.totalCents / 100)}</span>
            <Link href={`/order/${o.id}`} className="btn btn-ghost">
              <span>Detalhes</span>
            </Link>
          </div>
        </li>
      ))}
    </ul>
  );
}

function Logged({ me, onLogout }: { me: Me; onLogout: () => void }) {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Pedidos");
  const wish = useWishlist();
  return (
    <>
      <div role="tablist" aria-label="Seções da conta" className="flex gap-1 overflow-x-auto border-b border-line">
        {TABS.map((t) => (
          <button key={t} role="tab" id={`tab-${t}`} aria-selected={tab === t} aria-controls={`panel-${t}`} onClick={() => setTab(t)} className={`eyebrow min-h-12 shrink-0 border-b-2 px-4 ${tab === t ? "border-accent text-fg" : "border-transparent text-muted hover:text-fg"}`}>
            {t}
          </button>
        ))}
      </div>
      <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`} className="pt-10">
        {tab === "Pedidos" && <Orders orders={me.orders} />}
        {tab === "Favoritos" &&
          (wish.length ? (
            <ProductGrid products={wish.map((s) => getProduct(s)).filter((p) => !!p)} cols={3} />
          ) : (
            <EmptyState level={2} code="FAVORITOS · 0" title="Nenhum favorito" text="Toque no coração de uma peça para salvar aqui." cta="Ver a loja" href="/shop" />
          ))}
        {tab === "Tamanhos" && <Sizes />}
        {tab === "Dados" && (
          <div className="grid max-w-xl gap-6">
            <dl className="grid grid-cols-[8rem_1fr] gap-y-3">
              <dt className="eyebrow text-muted">E-mail</dt>
              <dd className="break-all">{me.customer!.email}</dd>
            </dl>
            <p className="text-small text-muted">
              Para corrigir ou apagar seus dados (LGPD), escreva para{" "}
              <a href={`mailto:${BRAND.email}?subject=Meus%20dados`} className="link-u text-fg">
                {BRAND.email}
              </a>
              . Saiba mais na{" "}
              <Link href="/privacy" className="link-u text-fg">
                política de privacidade
              </Link>
              .
            </p>
          </div>
        )}
      </div>
      <button type="button" onClick={onLogout} className="btn btn-ghost mt-12">
        <span>Sair da conta</span>
      </button>
    </>
  );
}

export default function AccountView() {
  const ready = useHydrated();
  const [me, setMe] = useState<Me | "erro" | null>(null);
  useEffect(() => {
    let alive = true;
    void fetchMe().then((m) => alive && setMe(m));
    return () => {
      alive = false;
    };
  }, []);
  const logged = me && me !== "erro" && me.customer;
  return (
    <div className="wrap pt-10 pb-section lg:pt-14">
      <p className="eyebrow text-muted">{logged ? me.customer!.email : "Conta"}</p>
      <h1 className="font-display mt-3 mb-12 text-d2">Minha {BRAND.name}</h1>
      {!ready || me === null ? (
        <div className="skeleton h-64" aria-busy="true" aria-label="Carregando conta" />
      ) : me === "erro" ? (
        <p role="alert" className="text-muted">
          Não deu para carregar sua conta agora. Tente de novo em instantes.
        </p>
      ) : logged ? (
        <Logged me={me} onLogout={async () => (await logout(), setMe({ customer: null, orders: [] }))} />
      ) : (
        <LoginForm />
      )}
    </div>
  );
}
