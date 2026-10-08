"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useHydrated } from "@/lib/store";
import { BRAND } from "@/lib/brand";
import { cart, isUnavailable, subtotal, useCart } from "@/lib/cart";
import { asset, brl, getDrop, getProduct, INSTALLMENTS, installment, pixPrice, shipsLabel } from "@/lib/catalog";
import { CHECKOUT_MODE, createCheckout, lookupCep, quoteShipping, validateCoupon } from "@/lib/commerce/checkout";
import type { CheckoutResult, PaymentMethod, ShippingOption } from "@/lib/commerce/types";
import { maskPhone, isValidEmail, onlyDigits } from "@/lib/subscribe";
import { useDropPhase } from "@/lib/time";
import EmptyState from "../ui/EmptyState";
import Icon from "../ui/Icon";
import Logo from "../ui/Logo";

/**
 * Checkout em 4 passos: Identificação → Entrega → Pagamento → Confirmação.
 * Sem menu nem rodapé (menos distração). Dados do cartão NUNCA passam por aqui:
 * o gateway (Mercado Pago Bricks / Stripe Elements) desenha os campos do cartão no slot indicado.
 */
const STEPS = ["Identificação", "Entrega", "Pagamento", "Confirmação"] as const;
const drop = getDrop("001")!;

const maskCpf = (v: string) => onlyDigits(v).slice(0, 11).replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d{1,2})$/, "$1-$2");
const maskCep = (v: string) => onlyDigits(v).slice(0, 8).replace(/(\d{5})(\d)/, "$1-$2");
function validCpf(v: string) {
  const d = onlyDigits(v);
  if (d.length !== 11 || /^(\d)\1+$/.test(d)) return false;
  const calc = (n: number) => {
    let s = 0;
    for (let i = 0; i < n; i++) s += Number(d[i]) * (n + 1 - i);
    return ((s * 10) % 11) % 10;
  };
  return calc(9) === Number(d[9]) && calc(10) === Number(d[10]);
}

type Form = { email: string; name: string; cpf: string; phone: string; cep: string; street: string; number: string; complement: string; district: string; city: string; state: string };
const EMPTY: Form = { email: "", name: "", cpf: "", phone: "", cep: "", street: "", number: "", complement: "", district: "", city: "", state: "" };

function Field({ id, label, error, className = "", ...p }: { id: keyof Form; label: string; error?: string; className?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className={className}>
      <label htmlFor={`co-${id}`} className="field-label">
        {label}
      </label>
      <input id={`co-${id}`} name={id} className="input" aria-invalid={!!error} aria-describedby={error ? `co-${id}-e` : undefined} {...p} />
      {error && (
        <p id={`co-${id}-e`} className="field-error">
          {error}
        </p>
      )}
    </div>
  );
}

export default function CheckoutView() {
  const items = useCart();
  const phase = useDropPhase(drop);
  const ready = useHydrated();
  const [step, setStep] = useState(0);
  const [f, setF] = useState<Form>(EMPTY);
  const [err, setErr] = useState<Partial<Record<keyof Form, string>>>({});
  const [ship, setShip] = useState<ShippingOption[] | null>(null);
  const [shipId, setShipId] = useState("");
  const [shipLoading, setShipLoading] = useState(false);
  const [method, setMethod] = useState<PaymentMethod>("pix");
  const [inst, setInst] = useState(1);
  const [coupon, setCoupon] = useState("");
  const [couponMsg, setCouponMsg] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");
  const [result, setResult] = useState<CheckoutResult | null>(null);
  const [summaryOpen, setSummaryOpen] = useState(false);

  const set = (k: keyof Form, v: string) => (setF((s) => ({ ...s, [k]: v })), setErr((e) => ({ ...e, [k]: undefined })));
  const sub = subtotal(items);
  const shipping = ship?.find((o) => o.id === shipId)?.price ?? 0;
  const pixOff = method === "pix" ? Math.round((sub - pixPrice(sub)) * 100) / 100 : 0;
  const total = Math.max(0, sub + shipping - pixOff);
  const blocked = items.some(isUnavailable);
  const presale = phase === "presale" && items.some((i) => getProduct(i.slug)?.drop === drop.number);

  const validate = (s: number) => {
    const e: typeof err = {};
    if (s === 0) {
      if (!isValidEmail(f.email)) e.email = "E-mail inválido.";
      if (f.name.trim().split(/\s+/).length < 2) e.name = "Nome e sobrenome.";
      if (!validCpf(f.cpf)) e.cpf = "CPF inválido.";
      if (onlyDigits(f.phone).length < 10) e.phone = "Celular com DDD.";
    }
    if (s === 1) {
      if (onlyDigits(f.cep).length !== 8) e.cep = "CEP com 8 números.";
      if (!f.street) e.street = "Informe a rua.";
      if (!f.number) e.number = "Número (ou s/n).";
      if (!f.district) e.district = "Informe o bairro.";
      if (!f.city) e.city = "Informe a cidade.";
      if (!/^[A-Za-z]{2}$/.test(f.state)) e.state = "UF";
      if (!shipId) e.cep = e.cep ?? "Escolha o frete.";
    }
    setErr(e);
    const first = Object.keys(e)[0];
    if (first) document.getElementById(`co-${first}`)?.focus();
    return !first;
  };
  const next = (s: number) => validate(s) && (setStep(s + 1), window.scrollTo({ top: 0, behavior: "smooth" }));

  const onCep = async (v: string) => {
    set("cep", maskCep(v));
    if (onlyDigits(v).length !== 8) return;
    setShipLoading(true);
    const [addr, opts] = await Promise.all([lookupCep(v), quoteShipping(v, sub).catch(() => null)]);
    if (addr) setF((s) => ({ ...s, street: addr.street || s.street, district: addr.district || s.district, city: addr.city, state: addr.state }));
    setShip(opts);
    if (opts?.length) setShipId(opts[0].id);
    setShipLoading(false);
  };

  const pay = async () => {
    if (blocked) return;
    setState("loading");
    const r = await createCheckout({
      items,
      customer: { email: f.email, name: f.name, cpf: onlyDigits(f.cpf), phone: onlyDigits(f.phone) },
      address: { cep: onlyDigits(f.cep), street: f.street, number: f.number, complement: f.complement, district: f.district, city: f.city, state: f.state.toUpperCase() },
      shippingId: shipId,
      payment: { method, installments: method === "card" ? inst : undefined },
      coupon: coupon || undefined,
    });
    if (!r.ok) return (setState("error"), setResult(r));
    setResult(r);
    setState("idle");
    if (r.mode === "live" && r.redirectUrl) location.href = r.redirectUrl;
    if (r.mode === "live") cart.clear();
  };

  const summary = useMemo(
    () => (
      <div className="flex flex-col gap-5">
        <ul className="grid gap-4">
          {items.map((i) => {
            const p = getProduct(i.slug)!;
            return (
              <li key={`${i.slug}-${i.size}`} className="flex gap-3">
                <span className="studio relative block h-20 w-16 shrink-0">
                  <img src={asset(p.media[0].src)} alt="" className="size-full object-contain p-1" />
                  <span className="num absolute -top-2 -right-2 grid size-5 place-items-center bg-fg font-mono text-[0.6875rem] text-bg">{i.qty}</span>
                </span>
                <span className="min-w-0 flex-1 text-small">
                  {p.name}
                  <span className="block text-muted">Tam. {i.size}</span>
                  {isUnavailable(i) && <span className="field-error block">Esgotou. Volte à bag.</span>}
                </span>
                <span className="num text-small">{brl(p.price * i.qty)}</span>
              </li>
            );
          })}
        </ul>
        <form
          className="flex gap-2"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!coupon) return;
            setCouponMsg("…");
            setCouponMsg((await validateCoupon(coupon)).message);
          }}
        >
          <label htmlFor="coupon" className="sr-only">
            Cupom
          </label>
          <input id="coupon" value={coupon} onChange={(e) => (setCoupon(e.target.value.toUpperCase()), setCouponMsg(""))} placeholder="Cupom" className="input min-h-11" />
          <button type="submit" className="btn btn-secondary btn-sm min-h-11">
            Aplicar
          </button>
        </form>
        {couponMsg && (
          <p role="status" className="-mt-3 text-small text-muted">
            {couponMsg}
          </p>
        )}
        <dl className="num grid grid-cols-[1fr_auto] gap-y-2 border-t border-line pt-4 text-small">
          <dt className="text-muted">Subtotal</dt>
          <dd>{brl(sub)}</dd>
          <dt className="text-muted">Frete</dt>
          <dd>{shipId ? (shipping ? brl(shipping) : "Grátis") : "Depois do CEP"}</dd>
          {pixOff > 0 && (
            <>
              <dt className="text-muted">Desconto Pix (5%)</dt>
              <dd className="text-accent-fg">−{brl(pixOff)}</dd>
            </>
          )}
          <dt className="mt-2 text-base font-semibold">Total</dt>
          <dd className="mt-2 text-base font-semibold">{brl(total)}</dd>
        </dl>
        {presale && drop.shipsFrom && <p className="border-l-2 border-accent pl-3 text-small text-muted">Pedido com pré-venda: sai inteiro a partir de {shipsLabel(drop.shipsFrom)}.</p>}
      </div>
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [items, coupon, couponMsg, shipId, shipping, pixOff, total, presale],
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
        <div className="wrap py-16">
          <div className="skeleton h-96" />
        </div>
      </>
    );

  if (result?.ok)
    return (
      <>
        {header}
        <section className="wrap max-w-3xl py-section" aria-live="polite">
          <p className="eyebrow text-accent-fg">{result.mode === "demo" ? "Pedido de demonstração" : "Pedido recebido"}</p>
          <h1 className="font-display mt-4 text-d2">GG. {result.mode === "demo" ? "Fluxo completo." : "Peça garantida."}</h1>
          <p className="eyebrow num mt-6">Nº {result.orderId}</p>
          {result.mode === "demo" ? (
            <p className="mt-6 border-l-2 border-accent pl-4 text-muted">Esta é a prévia da loja: nenhum pagamento foi criado e nada foi cobrado. Sua bag continua salva. Quando o gateway estiver conectado, esta tela mostra o QR do Pix ou a confirmação do cartão.</p>
          ) : (
            <p className="mt-6 text-muted">Você recebe a confirmação em {f.email}. {presale && drop.shipsFrom ? `Envio a partir de ${shipsLabel(drop.shipsFrom)}.` : "Postagem em até 2 dias úteis."}</p>
          )}
          <div className="theme-dark mt-12 grid gap-6 p-6 md:grid-cols-[1fr_auto] md:items-center md:p-10">
            <div>
              <p className="eyebrow text-muted">Próximo nível</p>
              <p className="font-display mt-2 text-d4">Crie sua conta e vire MEMBER na entrega.</p>
            </div>
            <Link href="/members" className="btn btn-primary">
              Conhecer Members
            </Link>
          </div>
          <Link href="/" className="btn btn-ghost mt-8">
            <span>Voltar para o lobby</span>
          </Link>
        </section>
      </>
    );

  if (!items.length)
    return (
      <>
        {header}
        <div className="wrap py-section">
          <EmptyState code="INVENTORY · 0/0" title="Your inventory is empty" text="Sem itens para finalizar. Volte para o lobby." cta="Explore the drop" href={`/drops/${drop.slug}`} />
        </div>
      </>
    );

  return (
    <>
      {header}
      {CHECKOUT_MODE === "demo" && <p className="eyebrow bg-fg px-4 py-2 text-center text-bg">Prévia · pagamento ainda não conectado, nada será cobrado</p>}

      {/* resumo recolhível no celular */}
      <div className="border-b border-line lg:hidden">
        <button type="button" onClick={() => setSummaryOpen((o) => !o)} aria-expanded={summaryOpen} className="wrap flex min-h-14 items-center justify-between">
          <span className="eyebrow">{summaryOpen ? "Esconder resumo" : "Ver resumo"}</span>
          <span className="num font-semibold">{brl(total)}</span>
        </button>
        {summaryOpen && <div className="wrap pb-6">{summary}</div>}
      </div>

      <div className="wrap grid gap-12 pt-8 pb-section lg:grid-cols-[1fr_24rem] lg:gap-16 lg:pt-12 xl:grid-cols-[1fr_28rem]">
        <div>
          <ol className="grid grid-cols-4 gap-1" aria-label="Etapas">
            {STEPS.map((s, i) => (
              <li key={s} aria-current={i === step ? "step" : undefined}>
                <div className={`h-[2px] ${i <= step ? "bg-accent" : "bg-line"}`} />
                <p className={`eyebrow mt-2 ${i === step ? "text-fg" : "text-muted"}`}>
                  <span className="num">0{i + 1}</span> <span className="hidden sm:inline">{s}</span>
                </p>
              </li>
            ))}
          </ol>

          {state === "error" && result && !result.ok && (
            <div role="alert" className="mt-8 border border-danger p-4 text-small">
              <strong className="eyebrow mb-1 block text-danger">Não foi possível concluir</strong>
              {result.message}
            </div>
          )}

          {/* resumo dos passos concluídos */}
          <div className="mt-8 grid gap-2">
            {step > 0 && (
              <div className="flex items-start justify-between gap-4 border border-line p-4 text-small">
                <span>
                  <span className="eyebrow block text-muted">Identificação</span>
                  {f.name} · {f.email}
                </span>
                <button type="button" onClick={() => setStep(0)} className="eyebrow link-u">
                  Editar
                </button>
              </div>
            )}
            {step > 1 && (
              <div className="flex items-start justify-between gap-4 border border-line p-4 text-small">
                <span>
                  <span className="eyebrow block text-muted">Entrega</span>
                  {f.street}, {f.number} · {f.city}/{f.state.toUpperCase()} · {ship?.find((o) => o.id === shipId)?.name}
                </span>
                <button type="button" onClick={() => setStep(1)} className="eyebrow link-u">
                  Editar
                </button>
              </div>
            )}
            {step > 2 && (
              <div className="flex items-start justify-between gap-4 border border-line p-4 text-small">
                <span>
                  <span className="eyebrow block text-muted">Pagamento</span>
                  {method === "pix" ? "Pix (5% off)" : method === "card" ? `Cartão em ${inst}x` : "Boleto"}
                </span>
                <button type="button" onClick={() => setStep(2)} className="eyebrow link-u">
                  Editar
                </button>
              </div>
            )}
          </div>

          <section aria-labelledby="step-t" className="mt-8">
            <h1 id="step-t" className="font-display text-d3">
              {STEPS[step]}
            </h1>

            {step === 0 && (
              <form noValidate onSubmit={(e) => (e.preventDefault(), next(0))} className="mt-8 grid gap-4 sm:grid-cols-2">
                <Field id="email" label="E-mail" type="email" autoComplete="email" inputMode="email" value={f.email} onChange={(e) => set("email", e.target.value)} error={err.email} className="sm:col-span-2" />
                <Field id="name" label="Nome completo" autoComplete="name" value={f.name} onChange={(e) => set("name", e.target.value)} error={err.name} className="sm:col-span-2" />
                <Field id="cpf" label="CPF" inputMode="numeric" value={f.cpf} onChange={(e) => set("cpf", maskCpf(e.target.value))} error={err.cpf} placeholder="000.000.000-00" />
                <Field id="phone" label="Celular" type="tel" autoComplete="tel-national" inputMode="tel" value={f.phone} onChange={(e) => set("phone", maskPhone(e.target.value))} error={err.phone} placeholder="(11) 90000-0000" />
                <p className="text-small text-muted sm:col-span-2">CPF é exigido para nota fiscal e para o Pix. Usamos só para o pedido.</p>
                <button type="submit" className="btn btn-primary btn-lg sm:col-span-2">
                  Continuar para entrega
                </button>
              </form>
            )}

            {step === 1 && (
              <form noValidate onSubmit={(e) => (e.preventDefault(), next(1))} className="mt-8 grid grid-cols-6 gap-4">
                <Field id="cep" label="CEP" inputMode="numeric" autoComplete="postal-code" value={f.cep} onChange={(e) => onCep(e.target.value)} error={err.cep} placeholder="00000-000" className="col-span-6 sm:col-span-3" />
                <div className="col-span-6 flex items-end pb-3 sm:col-span-3">
                  <a href="https://buscacepinter.correios.com.br/" target="_blank" rel="noopener noreferrer" className="eyebrow link-u text-muted">
                    Não sei meu CEP
                  </a>
                </div>
                <Field id="street" label="Rua" autoComplete="address-line1" value={f.street} onChange={(e) => set("street", e.target.value)} error={err.street} className="col-span-6 sm:col-span-4" />
                <Field id="number" label="Número" inputMode="numeric" value={f.number} onChange={(e) => set("number", e.target.value)} error={err.number} className="col-span-2" />
                <Field id="complement" label="Complemento (opcional)" autoComplete="address-line2" value={f.complement} onChange={(e) => set("complement", e.target.value)} className="col-span-4 sm:col-span-2" />
                <Field id="district" label="Bairro" value={f.district} onChange={(e) => set("district", e.target.value)} error={err.district} className="col-span-6 sm:col-span-4" />
                <Field id="city" label="Cidade" autoComplete="address-level2" value={f.city} onChange={(e) => set("city", e.target.value)} error={err.city} className="col-span-4 sm:col-span-4" />
                <Field id="state" label="UF" autoComplete="address-level1" maxLength={2} value={f.state} onChange={(e) => set("state", e.target.value.toUpperCase())} error={err.state} className="col-span-2" />
                <fieldset className="col-span-6 mt-2">
                  <legend className="field-label">Frete</legend>
                  {shipLoading ? (
                    <div className="grid gap-2" aria-label="Calculando frete">
                      <div className="skeleton h-16" />
                      <div className="skeleton h-16" />
                    </div>
                  ) : ship ? (
                    <div className="grid gap-2">
                      {ship.map((o) => (
                        <label key={o.id} className={`flex min-h-16 items-center gap-4 border px-4 ${shipId === o.id ? "border-fg" : "border-line-strong"}`}>
                          <input type="radio" name="ship" className="check rounded-full" checked={shipId === o.id} onChange={() => setShipId(o.id)} />
                          <span className="flex-1">
                            {o.name}
                            <span className="block text-small text-muted">{o.days}</span>
                          </span>
                          <span className="num">{o.price ? brl(o.price) : "Grátis"}</span>
                        </label>
                      ))}
                      {CHECKOUT_MODE === "demo" && <p className="text-small text-muted">Prévia: valores de frete de exemplo.</p>}
                    </div>
                  ) : (
                    <p className="text-small text-muted">Digite o CEP para ver as opções.</p>
                  )}
                </fieldset>
                <button type="submit" className="btn btn-primary btn-lg col-span-6">
                  Continuar para pagamento
                </button>
              </form>
            )}

            {step === 2 && (
              <div className="mt-8 grid gap-3">
                {(
                  [
                    ["pix", "pix", "Pix", `5% off · ${brl(pixPrice(sub) + shipping)} · aprovação na hora`],
                    ["card", "card", "Cartão de crédito", `Até ${INSTALLMENTS}x de ${installment(sub + shipping)} sem juros`],
                    ["boleto", "barcode", "Boleto", "Aprovação em até 2 dias úteis · peça reservada até lá"],
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
                {method === "card" && (
                  <div className="grid gap-4 border border-dashed border-line-strong p-5">
                    <p className="text-small text-muted">
                      <Icon name="lock" size={14} className="mr-1.5 inline" />
                      Os campos do cartão aparecem aqui, dentro do ambiente seguro do Mercado Pago ou Stripe. A {BRAND.name} não vê o número do seu cartão.
                    </p>
                    <div>
                      <label htmlFor="inst" className="field-label">
                        Parcelas
                      </label>
                      <select id="inst" value={inst} onChange={(e) => setInst(Number(e.target.value))} className="input">
                        {Array.from({ length: INSTALLMENTS }, (_, i) => i + 1).map((n) => (
                          <option key={n} value={n}>
                            {n}x de {brl(Math.floor(Math.round((sub + shipping) * 100) / n) / 100)} sem juros
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
                {method === "pix" && <p className="text-small text-muted">Depois de confirmar, aparece o QR Code e o código copia e cola. Vale por 30 minutos e a peça fica reservada enquanto isso.</p>}
                <button type="button" onClick={() => setStep(3)} className="btn btn-primary btn-lg mt-3">
                  Revisar pedido
                </button>
              </div>
            )}

            {step === 3 && (
              <div className="mt-8 flex flex-col gap-6">
                <p className="text-muted">Confira tudo. Ao confirmar, {method === "card" ? "o pagamento é processado no ambiente seguro do gateway" : method === "pix" ? "geramos o Pix" : "geramos o boleto"}.</p>
                <div className="lg:hidden">{summary}</div>
                <button type="button" onClick={pay} disabled={state === "loading" || blocked} className="btn btn-primary btn-lg" aria-live="polite">
                  {state === "loading" ? (
                    "Processando…"
                  ) : (
                    <>
                      <Icon name="lock" size={16} /> {method === "pix" ? "Gerar Pix" : method === "boleto" ? "Gerar boleto" : "Pagar"} · {brl(total)}
                    </>
                  )}
                </button>
                <p className="text-small text-muted">
                  Ao confirmar você concorda com os{" "}
                  <Link href="/help#trocas" className="link-u text-fg">
                    termos de troca e devolução
                  </Link>
                  . 7 dias para desistir, garantido pelo CDC.
                </p>
              </div>
            )}
          </section>

          <ul className="mt-14 flex flex-wrap gap-x-6 gap-y-2 border-t border-line pt-6 text-small text-muted">
            <li className="flex items-center gap-2">
              <Icon name="lock" size={16} /> Conexão criptografada
            </li>
            <li className="flex items-center gap-2">
              <Icon name="refresh" size={16} /> Primeira troca grátis
            </li>
            <li className="flex items-center gap-2">
              <Icon name="pix" size={16} /> Pix, cartão e boleto
            </li>
          </ul>
        </div>

        <aside aria-label="Resumo do pedido" className="hidden lg:block">
          <div className="sticky top-8 border border-line bg-surface p-6">
            <p className="eyebrow mb-5">Resumo</p>
            {summary}
          </div>
        </aside>
      </div>
    </>
  );
}
