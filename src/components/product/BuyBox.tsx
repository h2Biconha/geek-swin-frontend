"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { cart } from "@/lib/cart";
import { BRAND } from "@/lib/brand";
import { favFor, favSizes } from "@/lib/account";
import { availability, brl, categoryHref, categoryName, COMMERCE, dateLabel, dropTitle, shipsLabel, sizeOut, SPECS_CONFIRMED, timeLabel, type Product } from "@/lib/catalog";
import { freeShippingCondition } from "@/lib/commerce/benefits";
import { useEarlyAccess } from "@/lib/early";
import { useNow } from "@/lib/time";
import { itemPayload, track } from "@/lib/analytics";
import Accordion from "../ui/Accordion";
import Countdown from "../ui/Countdown";
import Icon from "../ui/Icon";
import Price from "../ui/Price";
import StockMeter from "../ui/StockMeter";
import NotifyMe from "./NotifyMe";
import SizeGuide from "./SizeGuide";
import SizeSelector from "./SizeSelector";
import WishlistButton from "./WishlistButton";
import { useAvailability } from "./status";

export default function BuyBox({ product: p }: { product: Product }) {
  const { status: rawStatus, phase, drop, inv } = useAvailability(p);
  const now = useNow(60_000);
  const shipping = freeShippingCondition(now);
  // acesso antecipado: o botão só libera para conta elegível (o servidor confere de novo no checkout)
  const early = phase === "early-access" && drop?.earlyAccess ? drop : null;
  const eligible = useEarlyAccess(early?.number ?? null);
  const status = early && eligible ? availability(p, "live", inv) : rawStatus;
  const soldOut = p.sizes.filter((s) => sizeOut(inv, s));
  const [picked, setSize] = useState<string | null>(null);
  // peça de tamanho único já vem escolhida; senão, o tamanho salvo em "Minha conta > Tamanhos" (se existir e não estiver esgotado)
  const fav = favFor(p.sizeTable, favSizes.use());
  const preset = p.sizes.length === 1 ? p.sizes[0] : fav && p.sizes.includes(fav) && !soldOut.includes(fav) ? fav : null;
  const size = picked ?? preset;
  const [err, setErr] = useState(false);
  const [added, setAdded] = useState(false);
  const [guide, setGuide] = useState(false);
  const [showBar, setShowBar] = useState(false);
  const cta = useRef<HTMLDivElement>(null);

  useEffect(() => track("view_item", itemPayload([{ slug: p.slug, qty: 1 }])), [p.slug]);
  // barra fixa de compra no celular quando o botão principal sai da tela
  useEffect(() => {
    const el = cta.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setShowBar(!e.isIntersecting && e.boundingClientRect.top < 0), { threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const chosenOut = size != null && soldOut.includes(size);
  const buyable = status === "available" || status === "low";
  const add = () => {
    if (!size) {
      setErr(true);
      document.getElementById("size-block")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    if (chosenOut) return;
    cart.add(p.slug, size);
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };

  return (
    <div className="flex flex-col gap-7">
      <div>
        <p className="eyebrow flex flex-wrap items-center gap-x-3 gap-y-1 text-muted">
          {drop ? (
            <Link href={`/drops/${drop.slug}`} className="link-u text-fg">
              Drop {drop.number} · {dropTitle(drop)}
            </Link>
          ) : (
            <span className="text-fg">Linha Core</span>
          )}
          <span>N° {p.number}</span>
          <Link href={categoryHref(p.category)} className="link-u">
            {categoryName(p.category)}
          </Link>
        </p>
        <h1 className="font-display mt-4 text-d3">{p.name}</h1>
        <p className="mt-3 text-small text-muted">
          {p.color} · {p.specs}
          {!SPECS_CONFIRMED && " (em validação)"}
        </p>
        {p.maker && !p.maker.authored && <p className="mt-2 text-small text-muted">Produto {p.maker.brand}, vendido pela {BRAND.name}.</p>}
      </div>

      <Price product={p} size="lg" showInstallments />

      {p.edition != null && status !== "coming-soon" && <StockMeter product={p} inv={inv} />}

      {phase === "presale" && buyable && drop?.shipsFrom && drop.opensAtUTC && (
        <p className="border-l-2 border-accent pl-4 text-small text-muted">
          <strong className="eyebrow mb-1 block text-fg">Pré-venda aberta</strong>
          O drop abre {dateLabel(drop.opensAtUTC)} às {timeLabel(drop.opensAtUTC)}. Quem compra agora garante a peça e recebe a partir de {shipsLabel(drop.shipsFrom)}. O número da sua peça é definido na confirmação do pagamento.
        </p>
      )}

      {early && (
        <div className="border-l-2 border-accent pl-4 text-small text-muted">
          <strong className="eyebrow mb-1 block text-fg">Acesso antecipado</strong>
          {eligible
            ? "Sua conta está na lista: a compra está liberada antes da abertura geral."
            : `Até ${dateLabel(early.opensAtUTC!)} às ${timeLabel(early.opensAtUTC!)}, só ${early.earlyAccess!.audience === "customers" ? "quem já comprou" : "quem está na lista"} compra. `}
          {!eligible && (
            <Link href={`/account?next=${encodeURIComponent(`/product/${p.slug}`)}`} className="link-u text-fg">
              Entrar com o e-mail da lista
            </Link>
          )}
        </div>
      )}

      {status === "coming-soon" && drop?.opensAtUTC && (
        <div className="flex flex-col gap-4">
          <p className="eyebrow text-muted">Abre em</p>
          <Countdown target={Date.parse(drop.opensAtUTC)} size="md" />
        </div>
      )}

      {status !== "sold-out" && status !== "coming-soon" && (
        <div id="size-block" className="flex flex-col gap-3">
          <div className="flex items-baseline justify-between">
            <p className="eyebrow" id="size-label">
              Tamanho{size ? <span className="text-muted"> · {size}</span> : null}
            </p>
            <button type="button" onClick={() => setGuide(true)} className="eyebrow inline-flex min-h-11 items-center gap-2 text-muted hover:text-fg">
              <Icon name="ruler" size={16} />
              <span className="link-u">Guia de tamanhos</span>
            </button>
          </div>
          <SizeSelector sizes={p.sizes} soldOut={soldOut} value={size} onChange={(s) => (setSize(s), setErr(false))} error={err} />
          {err && (
            <p id="size-error" role="alert" className="field-error">
              Escolha um tamanho primeiro.
            </p>
          )}
        </div>
      )}

      <div ref={cta} className="flex flex-col gap-3">
        {status === "sold-out" ? (
          <>
            <div className="flex min-h-15 items-center justify-center border border-line-strong font-mono text-label font-bold tracking-[0.14em] uppercase">Esgotado · no arquivo</div>
            <p className="text-small text-muted">{p.drop ? "Peça de drop não tem reposição. Ela fica no arquivo como parte da história da marca." : "Esgotou por enquanto. Deixe seu e-mail para saber quando voltar."}</p>
            {!p.drop && <NotifyMe product={p.slug} />}
          </>
        ) : status === "coming-soon" ? (
          <NotifyMe product={p.slug} source="drop-abertura" label="Me avise quando abrir" />
        ) : chosenOut ? (
          <NotifyMe product={p.slug} size={size} label={p.drop ? "Tamanho esgotado. Me avise se liberar" : "Me avise quando voltar"} />
        ) : (
          <div className="flex gap-2">
            <button type="button" onClick={add} className="btn btn-primary btn-lg flex-1" aria-live="polite">
              {added ? (
                <>
                  <Icon name="check" size={18} /> Na bag
                </>
              ) : (
                <>
                  {phase === "presale" ? "Garantir na pré-venda" : "Adicionar à bag"} <span className="hidden opacity-70 sm:inline">· {brl(p.price)}</span>
                </>
              )}
            </button>
            <WishlistButton slug={p.slug} name={p.name} className="grid size-15 shrink-0 place-items-center border border-line-strong hover:border-fg" />
          </div>
        )}
      </div>

      <ul className="grid gap-3 text-small text-muted">
        <li className="flex items-center gap-3">
          <Icon name="truck" size={18} /> {shipping ?? "Frete calculado pelo CEP no checkout"}
        </li>
        <li className="flex items-center gap-3">
          <Icon name="refresh" size={18} /> Primeira troca de tamanho por nossa conta · 7 dias para desistir
        </li>
        <li className="flex items-center gap-3">
          <Icon name="lock" size={18} /> Pagamento no Mercado Pago · Pix ou cartão
        </li>
      </ul>

      <Accordion
        items={[
          { title: "A peça", content: <p>{p.description}</p> },
          ...(p.maker
            ? [
                {
                  title: "Ficha técnica e garantia",
                  content: (
                    <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-small">
                      <dt className="text-muted">Fabricante</dt>
                      <dd>{p.maker.brand}</dd>
                      {p.maker.warranty && (
                        <>
                          <dt className="text-muted">Garantia</dt>
                          <dd>{p.maker.warranty}</dd>
                        </>
                      )}
                      {!!p.maker.compatibility?.length && (
                        <>
                          <dt className="text-muted">Compatível com</dt>
                          <dd>{p.maker.compatibility.join(", ")}</dd>
                        </>
                      )}
                      {p.maker.specs?.map(([k, v]) => (
                        <div key={k} className="contents">
                          <dt className="text-muted">{k}</dt>
                          <dd>{v}</dd>
                        </div>
                      ))}
                    </dl>
                  ),
                },
              ]
            : []),
          {
            title: "Tecido e construção",
            content: (
              <ul className="grid gap-2">
                {!SPECS_CONFIRMED && <li className="text-small text-fg">Ficha em validação com a produção: composição e gramatura podem mudar antes do envio.</li>}
                {p.fabric.map((f) => (
                  <li key={f} className="flex gap-3">
                    <span aria-hidden className="mt-2.5 h-px w-3 shrink-0 bg-current" />
                    {f}
                  </li>
                ))}
              </ul>
            ),
          },
          {
            title: "Modelagem e medidas",
            content: (
              <>
                <p>{p.fit}</p>
                <button type="button" onClick={() => setGuide(true)} className="btn btn-ghost mt-2 text-fg">
                  <span>Abrir tabela de medidas</span>
                </button>
              </>
            ),
          },
          {
            title: "Envio e trocas",
            content: (
              <p>
                Postagem em até {COMMERCE.handlingDays} dias úteis depois do pagamento (pré-venda: a partir da data informada). {shipping ? `${shipping}. ` : ""}A primeira troca de tamanho, em até {COMMERCE.exchangeDays} dias, é por conta da {BRAND.name}, e você tem 7 dias depois de receber para desistir da compra.{" "}
                <Link href="/help" className="link-u text-fg">
                  Tudo sobre envio e trocas
                </Link>
              </p>
            ),
          },
        ]}
      />

      <SizeGuide table={p.sizeTable} open={guide} onClose={() => setGuide(false)} productName={p.name} />

      {/* barra fixa no celular */}
      {buyable && (
        <div className={`fixed inset-x-0 bottom-0 z-40 border-t border-line bg-bg/95 px-4 pt-3 pb-[max(.75rem,env(safe-area-inset-bottom))] backdrop-blur transition-transform duration-300 ease-out lg:hidden ${showBar ? "translate-y-0" : "translate-y-full"}`} aria-hidden={!showBar} inert={!showBar}>
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-small font-medium">{p.name}</p>
              <p className="num text-small text-accent-fg">
                {brl(p.price)}
                {size ? <span className="text-muted"> · {size}</span> : null}
              </p>
            </div>
            <button type="button" onClick={add} className="btn btn-primary">
              {size ? (added ? "Na bag" : "Adicionar") : "Escolher tamanho"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
