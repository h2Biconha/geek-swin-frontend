"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { cart } from "@/lib/cart";
import { BRAND } from "@/lib/brand";
import { brl, categoryName, dateLabel, dropTitle, FREE_SHIPPING_FROM, shipsLabel, timeLabel, type Product } from "@/lib/catalog";
import { track } from "@/lib/analytics";
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
  const { status, phase, drop } = useAvailability(p);
  const [size, setSize] = useState<string | null>(p.sizes.length === 1 && !p.soldOut.includes(p.sizes[0]) ? p.sizes[0] : null);
  const [err, setErr] = useState(false);
  const [added, setAdded] = useState(false);
  const [guide, setGuide] = useState(false);
  const [showBar, setShowBar] = useState(false);
  const cta = useRef<HTMLDivElement>(null);

  useEffect(() => track("view_item", { slug: p.slug, value: p.price }), [p.slug, p.price]);
  // barra fixa de compra no celular quando o botão principal sai da tela
  useEffect(() => {
    const el = cta.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setShowBar(!e.isIntersecting && e.boundingClientRect.top < 0), { threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const sizeOut = size != null && p.soldOut.includes(size);
  const buyable = status === "available" || status === "low";
  const add = () => {
    if (!size) {
      setErr(true);
      document.getElementById("size-block")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    if (sizeOut) return;
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
          <span>{categoryName(p.category)}</span>
        </p>
        <h1 className="font-display mt-4 text-d3">{p.name}</h1>
        <p className="mt-3 text-small text-muted">
          {p.color} · {p.specs}
        </p>
      </div>

      <Price product={p} size="lg" showInstallments />

      {p.edition != null && status !== "coming-soon" && <StockMeter product={p} />}

      {phase === "presale" && buyable && drop?.shipsFrom && drop.opensAtUTC && (
        <p className="border-l-2 border-accent pl-4 text-small text-muted">
          <strong className="eyebrow mb-1 block text-fg">Pré-venda aberta</strong>
          O drop abre {dateLabel(drop.opensAtUTC)} às {timeLabel(drop.opensAtUTC)}. Quem compra agora garante a peça e recebe a partir de {shipsLabel(drop.shipsFrom)}. O número da sua peça é definido na confirmação do pagamento.
        </p>
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
          <SizeSelector sizes={p.sizes} soldOut={p.soldOut} value={size} onChange={(s) => (setSize(s), setErr(false))} error={err} />
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
            <div className="flex min-h-15 items-center justify-center border border-line-strong font-mono text-label font-bold tracking-[0.14em] uppercase">Sold out · no arquivo</div>
            <p className="text-small text-muted">{p.drop ? "Peça de drop não tem reposição. Ela fica no arquivo como parte da história da marca." : "Esgotou. A linha Core volta ao estoque."}</p>
            {!p.drop && <NotifyMe product={p.slug} />}
          </>
        ) : status === "coming-soon" ? (
          <NotifyMe product={p.slug} source="drop-abertura" label="Me avise quando abrir" />
        ) : sizeOut ? (
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
          <Icon name="truck" size={18} /> Frete grátis acima de {brl(FREE_SHIPPING_FROM)}
        </li>
        <li className="flex items-center gap-3">
          <Icon name="refresh" size={18} /> Primeira troca por nossa conta · 7 dias para desistir
        </li>
        <li className="flex items-center gap-3">
          <Icon name="lock" size={18} /> Pagamento seguro · Pix, cartão em 6x e boleto
        </li>
      </ul>

      <Accordion
        items={[
          { title: "A peça", content: <p>{p.description}</p> },
          {
            title: "Tecido e construção",
            content: (
              <ul className="grid gap-2">
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
                Postagem em até 2 dias úteis (pré-venda: a partir da data informada). Frete grátis acima de {brl(FREE_SHIPPING_FROM)}. A primeira troca de tamanho é por conta da {BRAND.name}, e você tem 7 dias depois de receber para desistir da compra.{" "}
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
