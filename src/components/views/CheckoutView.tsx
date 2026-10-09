"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { itemPayload, track } from "@/lib/analytics";
import { BRAND } from "@/lib/brand";
import { cart, lineKey, lineProblem, useCart } from "@/lib/cart";
import { asset, brl, COMMERCE, getProduct } from "@/lib/catalog";
import { createCheckout, getQuote, isError, lookupCep } from "@/lib/commerce/checkout";
import { installmentCents } from "@/lib/commerce/pricing";
import type { CheckoutError, LineIssue, PaymentMethod, QuoteResponse } from "@/lib/commerce/types";
import { refreshInventory, useInventoryMap } from "@/lib/inventory";
import { STORE_CONNECTED, STORE_MODE } from "@/lib/mode";
import { useHydrated } from "@/lib/store";
import { isValidCep, isValidCpf, isValidEmail, isValidPhone, isValidUf, maskCep, maskCpf, maskPhone, onlyDigits } from "@/lib/validate";
import EmptyState from "../ui/EmptyState";
import Icon from "../ui/Icon";
import Logo from "../ui/Logo";

/**
 * Checkout em 3 passos: Dados → Entrega → Pagamento.
 * Preço, frete, cupom e estoque são calculados pelo SERVIDOR (/api/checkout/quote) e recalculados ao criar o pedido.
 * Cartão: a pessoa digita no ambiente do Mercado Pago (redirecionamento). Pix: QR na página do pedido.
 * Sem servidor (prévia) o fluxo vai até a revisão e NÃO simula pagamento.
 */
const STEPS = ["Dados", "Entrega", "Pagamento"] as const;

type Form = { email: string; name: string; cpf: string; phone: string; cep: string; street: string; number: string; complement: string; district: string; city: string; state: string };
const EMPTY: Form = { email: "", name: "", cpf: "", phone: "", cep: "", street: "", number: "", complement: "", district: "", city: "", state: "" };
const FORM_KEY = "gs-checkout-form";
const IDEM_KEY = "gs-checkout-key";
const SERVER_FIELD: Record<string, keyof Form> = {
  "customer.email": "email",
  "customer.name": "name",
  "customer.cpf": "cpf",
  "customer.phone": "phone",
  "address.cep": "cep",
  "address.street": "street",
  "address.number": "number",
  "address.district": "district",
  "address.city": "city",
  "address.state": "state",
};

function readSession<T>(k: string, fallback: T): T {
  try {
    const v = sessionStorage.getItem(k);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
}
function writeSession(k: string, v: unknown) {
  try {
    if (v == null) sessionStorage.removeItem(k);
    else sessionStorage.setItem(k, JSON.stringify(v));
  } catch {}
}
/** mesma chave enquanto a pessoa tenta pagar o mesmo carrinho: clique duplo não cria dois pedidos */
function idempotencyKey(sig: string) {
  const cur = readSession<{ sig: string; key: string } | null>(IDEM_KEY, null);
  if (cur?.sig === sig) return cur.key;
  const key = crypto.randomUUID();
  writeSession(IDEM_KEY, { sig, key });
  return key;
}

function Field({ id, label, error, hint, className = "", ...p }: { id: keyof Form; label: string; error?: string; hint?: string; className?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  const desc = [error && `co-${id}-e`, hint && `co-${id}-h`].filter(Boolean).join(" ") || undefined;
  return (
    <div className={className}>
      <label htmlFor={`co-${id}`} className="field-label">
        {label}
      </label>
      <input id={`co-${id}`} name={id} className="input" aria-invalid={!!error} aria-describedby={desc} {...p} />
      {hint && !error && (
        <p id={`co-${id}-h`} className="mt-1.5 text-small text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={`co-${id}-e`} className="field-error">
          {error}
        </p>
      )}
    </div>
  );
}

const issueText = (i: LineIssue) => {
  const name = getProduct(i.slug)?.name ?? "Peça";
  if (i.reason === "esgotado") return `${name} (${i.size}) esgotou.`;
  if (i.reason === "quantidade") return `${name} (${i.size}): só ${i.available ?? 0} disponível.`;
  if (i.reason === "indisponivel") return `${name} ainda não está à venda.`;
  if (i.reason === "acesso_antecipado") return `${name} está em acesso antecipado só para quem tem convite.`;
  return `${name} não existe mais na loja.`;
};

export default function CheckoutView() {
  const items = useCart();
  const ready = useHydrated();
  const router = useRouter();
  const stock = useInventoryMap() ?? undefined;
  const [step, setStep] = useState(0);
  const [f, setF] = useState<Form>(EMPTY);
  const [err, setErr] = useState<Partial<Record<keyof Form | "accept" | "shipping", string>>>({});
  const [shipId, setShipId] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("pix");
  const [coupon, setCoupon] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState("");
  const [accept, setAccept] = useState(false);
  const [quote, setQuote] = useState<QuoteResponse | null>(null);
  const [quoteState, setQuoteState] = useState<"idle" | "loading" | "error">("idle");
  const [submit, setSubmit] = useState<"idle" | "loading">("idle");
  const [failure, setFailure] = useState<CheckoutError | null>(null);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);

  // restaura o que a pessoa já digitou nesta aba
  useEffect(() => {
    const saved = readSession<Form | null>(FORM_KEY, null);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (saved) setF({ ...EMPTY, ...saved });
  }, []);
  useEffect(() => writeSession(FORM_KEY, f), [f]);

  const cartSig = items.map((i) => `${i.slug}:${i.size}:${i.qty}:${i.kitId ?? ""}`).join("|");
  const cep = onlyDigits(f.cep);

  // cotação no servidor: muda com a bag, o CEP, o método e o cupom
  useEffect(() => {
    if (!ready || !items.length) return;
    let alive = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setQuoteState("loading");
    const t = setTimeout(async () => {
      const q = await getQuote({ items, cep: cep.length === 8 ? cep : undefined, method, coupon: appliedCoupon || undefined });
      if (!alive) return;
      if (isError(q)) {
        setQuoteState("error");
        return;
      }
      setQuote(q);
      setQuoteState("idle");
      if (q.shippingOptions?.length) setShipId((cur) => (q.shippingOptions!.some((o) => o.id === cur) ? cur : q.shippingOptions![0].id));
      if (q.issues.length) void refreshInventory(true);
    }, 250);
    return () => {
      alive = false;
      clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, cartSig, cep, method, appliedCoupon]);

  // início do checkout (uma vez)
  const started = useRef(false);
  useEffect(() => {
    if (!ready || !items.length || started.current) return;
    started.current = true;
    track("begin_checkout", itemPayload(items));
  }, [ready, items]);

  const set = (k: keyof Form, v: string) => (setF((s) => ({ ...s, [k]: v })), setErr((e) => ({ ...e, [k]: undefined })));
  const ship = quote?.shippingOptions?.find((o) => o.id === shipId) ?? null;
  const subtotalC = quote?.subtotalCents ?? 0;
  const couponC = quote?.couponCents ?? 0;
  const pixC = method === "pix" ? (quote?.pixCents ?? 0) : 0;
  const bundleC = quote?.bundleCents ?? 0;
  const benefitC = quote?.benefitCents ?? 0;
  const goodsC = subtotalC - bundleC - benefitC - couponC;
  const totalC = goodsC - pixC + (ship?.priceCents ?? 0);
  const brokenKits = (quote?.bundles ?? []).filter((b) => !b.valid);
  const issues = useMemo(() => quote?.issues ?? [], [quote]);
  const blocked = issues.length > 0 || items.some((i) => lineProblem(i, stock?.[i.slug], items));

  const go = (s: number) => {
    setStep(s);
    setFailure(null);
    requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: "smooth" });
      heading.current?.focus({ preventScroll: true });
    });
  };

  const validate = (s: number) => {
    const e: typeof err = {};
    if (s === 0) {
      if (!isValidEmail(f.email)) e.email = "Confira o e-mail. Algo como nome@gmail.com.";
      if (f.name.trim().split(/\s+/).length < 2) e.name = "Nome e sobrenome, como no documento.";
      if (!isValidCpf(f.cpf)) e.cpf = "CPF inválido. Confira os 11 números.";
      if (!isValidPhone(f.phone)) e.phone = "Celular com DDD.";
    }
    if (s === 1) {
      if (!isValidCep(f.cep)) e.cep = "CEP com 8 números.";
      if (!f.street.trim()) e.street = "Informe a rua.";
      if (!f.number.trim()) e.number = "Número (ou s/n).";
      if (!f.district.trim()) e.district = "Informe o bairro.";
      if (!f.city.trim()) e.city = "Informe a cidade.";
      if (!isValidUf(f.state)) e.state = "UF com 2 letras.";
      if (isValidCep(f.cep) && !ship) e.shipping = "Escolha uma opção de frete.";
    }
    if (s === 2 && !accept) e.accept = "Para seguir, aceite os termos e a política de privacidade.";
    setErr(e);
    const first = Object.keys(e)[0];
    if (first) document.getElementById(first === "accept" ? "co-accept" : first === "shipping" ? "co-shipping" : `co-${first}`)?.focus();
    return !first;
  };

  const onCep = async (v: string) => {
    set("cep", maskCep(v));
    if (onlyDigits(v).length !== 8) return;
    const addr = await lookupCep(v);
    if (addr) setF((s) => ({ ...s, street: addr.street || s.street, district: addr.district || s.district, city: addr.city || s.city, state: addr.state || s.state }));
  };

  const pay = async () => {
    if (!validate(2) || blocked || !ship) return;
    track("add_payment_info", itemPayload(items, { payment_type: method === "pix" ? "Pix" : "Cartão" }));
    setSubmit("loading");
    setFailure(null);
    const r = await createCheckout(
      {
        items,
        customer: { email: f.email.trim(), name: f.name.trim(), cpf: onlyDigits(f.cpf), phone: onlyDigits(f.phone) },
        address: { cep, street: f.street.trim(), number: f.number.trim(), complement: f.complement.trim(), district: f.district.trim(), city: f.city.trim(), state: f.state.toUpperCase() },
        shippingId: ship.id,
        payment: { method },
        coupon: appliedCoupon || undefined,
        accept: true,
      },
      idempotencyKey(`${cartSig}|${method}|${ship.id}|${appliedCoupon}|${f.email}`),
    );
    if (isError(r)) {
      setSubmit("idle");
      setFailure(r);
      if (r.issues?.length) {
        void refreshInventory(true);
        setQuote((q) => (q ? { ...q, issues: r.issues! } : q));
      }
      if (r.fields) {
        const mapped: typeof err = {};
        for (const [k, v] of Object.entries(r.fields)) if (SERVER_FIELD[k]) mapped[SERVER_FIELD[k]] = v;
        setErr(mapped);
        const keys = Object.keys(mapped);
        if (keys.some((k) => ["email", "name", "cpf", "phone"].includes(k))) go(0);
        else if (keys.length) go(1);
      }
      return;
    }
    cart.clear();
    writeSession(IDEM_KEY, null);
    void refreshInventory(true);
    if (r.redirectUrl && method === "card") {
      window.location.assign(r.redirectUrl);
      return;
    }
    router.push(`/order/${r.orderId}?t=${r.accessToken}`);
  };

  const summary = (where: string) => (
    <div className="flex flex-col gap-5">
      <ul className="grid gap-4">
        {items.map((i) => {
          const p = getProduct(i.slug)!;
          const issue = issues.find((x) => x.slug === i.slug && x.size === i.size);
          return (
            <li key={lineKey(i)} className="flex gap-3">
              <span className="studio relative block h-20 w-16 shrink-0">
                <img src={asset(p.media[0].src)} alt="" className="size-full object-contain p-1" />
                <span className="num absolute -top-2 -right-2 grid size-5 place-items-center bg-fg font-mono text-[0.6875rem] text-bg" aria-hidden>
                  {i.qty}
                </span>
              </span>
              <span className="min-w-0 flex-1 text-small">
                {p.name}
                <span className="block text-muted">
                  Tam. {i.size} · {i.qty} {i.qty > 1 ? "unidades" : "unidade"}
                  {i.kit && <> · kit</>}
                </span>
                {issue && <span className="field-error block">{issueText(issue)}</span>}
              </span>
              <span className="num text-small">{brl(p.price * i.qty)}</span>
            </li>
          );
        })}
      </ul>
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          setAppliedCoupon(coupon.trim());
        }}
      >
        <label htmlFor={`coupon-${where}`} className="sr-only">
          Cupom de desconto
        </label>
        <input id={`coupon-${where}`} value={coupon} onChange={(e) => setCoupon(e.target.value.toUpperCase().slice(0, 40))} placeholder="Cupom" className="input min-h-11" autoComplete="off" />
        <button type="submit" className="btn btn-secondary btn-sm min-h-11">
          Aplicar
        </button>
      </form>
      {quote?.coupon && (
        <p role="status" className={`-mt-3 text-small ${quote.coupon.ok ? "text-accent-fg" : "text-muted"}`}>
          {quote.coupon.message}
        </p>
      )}
      <dl className="num grid grid-cols-[1fr_auto] gap-y-2 border-t border-line pt-4 text-small" aria-busy={quoteState === "loading"}>
        <dt className="text-muted">Subtotal</dt>
        <dd>{quote ? brl(subtotalC / 100) : "…"}</dd>
        {bundleC > 0 && (
          <>
            <dt className="text-muted">Desconto de kit</dt>
            <dd className="text-accent-fg">−{brl(bundleC / 100)}</dd>
          </>
        )}
        {benefitC > 0 && (
          <>
            <dt className="text-muted">Benefício</dt>
            <dd className="text-accent-fg">−{brl(benefitC / 100)}</dd>
          </>
        )}
        {couponC > 0 && (
          <>
            <dt className="text-muted">Cupom</dt>
            <dd className="text-accent-fg">−{brl(couponC / 100)}</dd>
          </>
        )}
        {pixC > 0 && (
          <>
            <dt className="text-muted">Desconto Pix ({Math.round(COMMERCE.pixDiscount * 100)}%)</dt>
            <dd className="text-accent-fg">−{brl(pixC / 100)}</dd>
          </>
        )}
        <dt className="text-muted">Frete</dt>
        <dd>{ship ? (ship.priceCents ? brl(ship.priceCents / 100) : "Grátis") : "Depois do CEP"}</dd>
        <dt className="mt-2 text-base font-semibold">Total</dt>
        <dd className="mt-2 text-base font-semibold">{quote ? brl(totalC / 100) : "…"}</dd>
      </dl>
      {brokenKits.map((b) => (
        <p key={b.kitId} className="-mt-2 text-small text-muted">
          {b.name}: {b.reason ?? "kit incompleto"}. As peças seguem com preço individual.
        </p>
      ))}
      {quoteState === "error" && <p className="field-error mt-0">Não deu para atualizar os valores. Confira a conexão.</p>}
    </div>
  );

  const header = (
    <header className="border-b border-line">
      <div className="wrap flex h-header items-center justify-between">
        <Link href="/" aria-label={`${BRAND.name}, voltar ao início`}>
          <Logo />
        </Link>
        <p className="eyebrow flex items-center gap-2 text-muted">
          <Icon name="lock" size={16} /> Checkout seguro
        </p>
      </div>
    </header>
  );

  if (!ready)
    return (
      <>
        {header}
        <div className="wrap py-16" aria-busy="true" aria-label="Carregando checkout">
          <div className="skeleton h-96" />
        </div>
      </>
    );

  if (!items.length)
    return (
      <>
        {header}
        <div className="wrap py-section">
          <EmptyState level={1} code="BAG · 0" title="Sua bag está vazia" text="Escolha uma peça para finalizar a compra." cta="Ver a loja" href="/shop" />
        </div>
      </>
    );

  const done = (s: number, title: string, text: string) =>
    step > s && (
      <div className="flex items-start justify-between gap-4 border border-line p-4 text-small">
        <span className="min-w-0">
          <span className="eyebrow block text-muted">{title}</span>
          <span className="break-words">{text}</span>
        </span>
        <button type="button" onClick={() => go(s)} className="eyebrow link-u min-h-11 shrink-0" aria-label={`Editar ${title.toLowerCase()}`}>
          Editar
        </button>
      </div>
    );

  const shownIssues = failure?.issues ?? issues;

  return (
    <>
      {header}
      {STORE_MODE !== "live" && <p className="eyebrow bg-fg px-4 py-2 text-center text-bg">{STORE_CONNECTED ? "Ambiente de teste · nenhuma cobrança real" : "Prévia · pagamento ainda não conectado, nada será cobrado"}</p>}

      {/* resumo recolhível no celular */}
      <div className="border-b border-line lg:hidden">
        <button type="button" onClick={() => setSummaryOpen((o) => !o)} aria-expanded={summaryOpen} aria-controls="co-summary-m" className="wrap flex min-h-14 items-center justify-between">
          <span className="eyebrow">{summaryOpen ? "Esconder resumo" : "Ver resumo"}</span>
          <span className="num font-semibold">{quote ? brl(totalC / 100) : "…"}</span>
        </button>
        {summaryOpen && (
          <div id="co-summary-m" className="wrap pb-6">
            {summary("top")}
          </div>
        )}
      </div>

      <div className="wrap grid gap-12 pt-8 pb-section lg:grid-cols-[1fr_24rem] lg:gap-16 lg:pt-12 xl:grid-cols-[1fr_28rem]">
        <div>
          <ol className="grid grid-cols-3 gap-1" aria-label="Etapas do checkout">
            {STEPS.map((s, i) => (
              <li key={s} aria-current={i === step ? "step" : undefined}>
                <div className={`h-[2px] ${i <= step ? "bg-accent" : "bg-line"}`} />
                <p className={`eyebrow mt-2 ${i === step ? "text-fg" : "text-muted"}`}>
                  <span className="num">0{i + 1}</span> {s}
                  {i < step && <span className="sr-only"> (concluída)</span>}
                </p>
              </li>
            ))}
          </ol>

          {(failure || (blocked && step === 2)) && (
            <div role="alert" className="mt-8 border border-danger p-4 text-small">
              <strong className="eyebrow mb-1 block text-danger">{failure ? "Não foi possível concluir" : "Revise a bag"}</strong>
              {failure?.message ?? "Uma peça mudou de disponibilidade."}
              {!!shownIssues.length && (
                <>
                  <ul className="mt-2 list-disc pl-5">
                    {shownIssues.map((i) => (
                      <li key={`${i.slug}-${i.size}`}>{issueText(i)}</li>
                    ))}
                  </ul>
                  <Link href="/shop" className="btn btn-ghost mt-2">
                    <span>Voltar e ajustar a bag</span>
                  </Link>
                </>
              )}
            </div>
          )}

          <div className="mt-8 grid gap-2">
            {done(0, "Dados", `${f.name} · ${f.email}`)}
            {done(1, "Entrega", `${f.street}, ${f.number} · ${f.city}/${f.state.toUpperCase()} · ${ship?.name ?? ""}`)}
          </div>

          <section aria-labelledby="step-t" className="mt-8">
            <h1 id="step-t" ref={heading} tabIndex={-1} className="font-display text-d3 focus:outline-none">
              {STEPS[step]}
            </h1>

            {step === 0 && (
              <form noValidate onSubmit={(e) => (e.preventDefault(), validate(0) && go(1))} className="mt-8 grid gap-4 sm:grid-cols-2">
                <Field id="email" label="E-mail" type="email" autoComplete="email" inputMode="email" value={f.email} onChange={(e) => set("email", e.target.value)} error={err.email} hint="A confirmação do pedido chega aqui." className="sm:col-span-2" />
                <Field id="name" label="Nome completo" autoComplete="name" value={f.name} onChange={(e) => set("name", e.target.value)} error={err.name} className="sm:col-span-2" />
                <Field id="cpf" label="CPF" inputMode="numeric" autoComplete="off" value={f.cpf} onChange={(e) => set("cpf", maskCpf(e.target.value))} error={err.cpf} placeholder="000.000.000-00" />
                <Field id="phone" label="Celular" type="tel" autoComplete="tel-national" inputMode="tel" value={f.phone} onChange={(e) => set("phone", maskPhone(e.target.value))} error={err.phone} placeholder="(11) 90000-0000" />
                <p className="text-small text-muted sm:col-span-2">
                  O CPF é exigido para emitir a nota fiscal e pelo meio de pagamento. Usamos só para este pedido.{" "}
                  <Link href="/privacy" className="link-u text-fg">
                    Privacidade
                  </Link>
                </p>
                <button type="submit" className="btn btn-primary btn-lg sm:col-span-2">
                  Continuar para entrega
                </button>
              </form>
            )}

            {step === 1 && (
              <form
                noValidate
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!validate(1)) return;
                  track("add_shipping_info", itemPayload(items, { shipping_tier: ship?.name }));
                  go(2);
                }}
                className="mt-8 grid grid-cols-6 gap-4"
              >
                <Field id="cep" label="CEP" inputMode="numeric" autoComplete="postal-code" value={f.cep} onChange={(e) => onCep(e.target.value)} error={err.cep} placeholder="00000-000" className="col-span-6 sm:col-span-3" />
                <div className="col-span-6 flex items-end pb-3 sm:col-span-3">
                  <a href="https://buscacepinter.correios.com.br/" target="_blank" rel="noopener noreferrer" className="eyebrow link-u text-muted">
                    Não sei meu CEP <span className="sr-only">(abre o site dos Correios)</span>
                  </a>
                </div>
                <Field id="street" label="Rua" autoComplete="address-line1" value={f.street} onChange={(e) => set("street", e.target.value)} error={err.street} className="col-span-6 sm:col-span-4" />
                <Field id="number" label="Número" value={f.number} onChange={(e) => set("number", e.target.value)} error={err.number} className="col-span-2" />
                <Field id="complement" label="Complemento (opcional)" autoComplete="address-line2" value={f.complement} onChange={(e) => set("complement", e.target.value)} className="col-span-4 sm:col-span-2" />
                <Field id="district" label="Bairro" value={f.district} onChange={(e) => set("district", e.target.value)} error={err.district} className="col-span-6 sm:col-span-4" />
                <Field id="city" label="Cidade" autoComplete="address-level2" value={f.city} onChange={(e) => set("city", e.target.value)} error={err.city} className="col-span-4" />
                <Field id="state" label="UF" autoComplete="address-level1" maxLength={2} value={f.state} onChange={(e) => set("state", e.target.value.toUpperCase())} error={err.state} className="col-span-2" />
                <fieldset id="co-shipping" tabIndex={-1} className="col-span-6 mt-2 focus:outline-none" aria-describedby={err.shipping ? "co-shipping-e" : undefined}>
                  <legend className="field-label">Frete</legend>
                  {cep.length !== 8 ? (
                    <p className="text-small text-muted">Digite o CEP para ver as opções e o prazo.</p>
                  ) : !quote?.shippingOptions || quoteState === "loading" ? (
                    <div className="grid gap-2" aria-label="Calculando frete">
                      <div className="skeleton h-16" />
                      <div className="skeleton h-16" />
                    </div>
                  ) : (
                    <div className="grid gap-2">
                      {quote.shippingOptions.map((o) => (
                        <label key={o.id} className={`flex min-h-16 items-center gap-4 border px-4 py-2 ${shipId === o.id ? "border-fg" : "border-line-strong"}`}>
                          <input type="radio" name="ship" className="check rounded-full" checked={shipId === o.id} onChange={() => (setShipId(o.id), setErr((e) => ({ ...e, shipping: undefined })))} />
                          <span className="flex-1">
                            {o.name}
                            <span className="block text-small text-muted">{o.days} depois da postagem</span>
                          </span>
                          <span className="num">{o.priceCents ? brl(o.priceCents / 100) : "Grátis"}</span>
                        </label>
                      ))}
                      <p className="text-small text-muted">
                        Postagem em até {COMMERCE.handlingDays} dias úteis após o pagamento{quote.freeShipping ? ". Frete grátis aplicado." : "."}
                      </p>
                    </div>
                  )}
                  {err.shipping && (
                    <p id="co-shipping-e" className="field-error">
                      {err.shipping}
                    </p>
                  )}
                </fieldset>
                <button type="submit" className="btn btn-primary btn-lg col-span-6">
                  Continuar para pagamento
                </button>
              </form>
            )}

            {step === 2 && (
              <div className="mt-8 grid gap-3">
                <fieldset className="grid gap-3">
                  <legend className="sr-only">Forma de pagamento</legend>
                  {(
                    [
                      ["pix", "pix", "Pix", `${Math.round(COMMERCE.pixDiscount * 100)}% de desconto · aprovação na hora`],
                      [
                        "card",
                        "card",
                        "Cartão de crédito",
                        `Até ${COMMERCE.installments}x${quote ? ` de ${brl(installmentCents(goodsC + (ship?.priceCents ?? 0), COMMERCE.installments) / 100)}` : ""}${COMMERCE.installmentsInterestFree ? " sem juros" : ""} · no Mercado Pago`,
                      ],
                    ] as const
                  ).map(([k, icon, t, d]) => (
                    <label key={k} className={`flex min-h-18 items-center gap-4 border px-4 py-3 transition-colors ${method === k ? "border-fg" : "border-line-strong hover:border-fg"}`}>
                      <input type="radio" name="pay" className="check rounded-full" checked={method === k} onChange={() => setMethod(k)} />
                      <Icon name={icon} />
                      <span className="flex-1">
                        {t}
                        <span className="block text-small text-muted">{d}</span>
                      </span>
                    </label>
                  ))}
                </fieldset>
                <p className="text-small text-muted">
                  {method === "pix"
                    ? `Depois de confirmar, aparece o QR Code e o código copia e cola. Ele vale ${COMMERCE.reservationMinutes} minutos e as peças ficam reservadas enquanto isso.`
                    : `Você vai para o ambiente seguro do Mercado Pago para digitar o cartão e escolher as parcelas. A ${BRAND.name} nunca vê o número do cartão.`}
                </p>

                <div className="mt-4 lg:hidden">{summary("review")}</div>

                <label className="mt-4 flex items-start gap-3 text-small">
                  <input id="co-accept" type="checkbox" className="check mt-0.5" checked={accept} onChange={(e) => (setAccept(e.target.checked), setErr((x) => ({ ...x, accept: undefined })))} aria-invalid={!!err.accept} aria-describedby={err.accept ? "co-accept-e" : undefined} />
                  <span>
                    Li e aceito os{" "}
                    <Link href="/terms" className="link-u text-fg" target="_blank">
                      termos de compra
                    </Link>
                    , a{" "}
                    <Link href="/help#trocas" className="link-u text-fg" target="_blank">
                      política de trocas
                    </Link>{" "}
                    e a{" "}
                    <Link href="/privacy" className="link-u text-fg" target="_blank">
                      política de privacidade
                    </Link>
                    .
                  </span>
                </label>
                {err.accept && (
                  <p id="co-accept-e" className="field-error mt-0">
                    {err.accept}
                  </p>
                )}

                {STORE_CONNECTED ? (
                  <button type="button" onClick={pay} disabled={submit === "loading" || blocked || !quote || quoteState === "loading"} className="btn btn-primary btn-lg mt-3" aria-busy={submit === "loading"}>
                    {submit === "loading" ? (
                      "Criando pedido…"
                    ) : (
                      <>
                        <Icon name="lock" size={16} /> {method === "pix" ? "Gerar Pix" : "Ir para o pagamento"} · {quote ? brl(totalC / 100) : "…"}
                      </>
                    )}
                  </button>
                ) : (
                  <div className="mt-3 border border-line-strong p-4 text-small" role="note">
                    <strong className="eyebrow mb-1 block">Pagamento indisponível na prévia</strong>
                    Esta versão do site não está ligada ao servidor da loja: nenhum pedido é criado e nada é cobrado. Sua bag continua salva.
                  </div>
                )}
                <p className="text-small text-muted">Você tem 7 dias depois de receber para desistir da compra (Código de Defesa do Consumidor).</p>
              </div>
            )}
          </section>

          <ul className="mt-14 flex flex-wrap gap-x-6 gap-y-2 border-t border-line pt-6 text-small text-muted">
            <li className="flex items-center gap-2">
              <Icon name="lock" size={16} /> Pagamento processado pelo Mercado Pago
            </li>
            <li className="flex items-center gap-2">
              <Icon name="refresh" size={16} /> Trocas em até {COMMERCE.exchangeDays} dias
            </li>
          </ul>
        </div>

        <aside aria-label="Resumo do pedido" className="hidden lg:block">
          <div className="sticky top-8 border border-line bg-surface p-6">
            <p className="eyebrow mb-5">Resumo</p>
            {summary("aside")}
          </div>
        </aside>
      </div>
    </>
  );
}
