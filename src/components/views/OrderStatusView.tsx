"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { trackPurchaseOnce } from "@/lib/analytics";
import { BRAND } from "@/lib/brand";
import { brl, getProduct } from "@/lib/catalog";
import { fetchOrder } from "@/lib/commerce/checkout";
import type { OrderView } from "@/lib/commerce/types";
import { refreshInventory } from "@/lib/inventory";
import { STORE_CONNECTED } from "@/lib/mode";
import { splitCountdown, useNow } from "@/lib/time";
import Icon from "../ui/Icon";

/**
 * Página do pedido (/order/GS-000001?t=...). Mostra o Pix, acompanha a confirmação e o envio.
 * O status vem do servidor, que só muda para "pago" com confirmação do Mercado Pago.
 */
const STATUS: Record<OrderView["status"], { eyebrow: string; title: string }> = {
  pending: { eyebrow: "Aguardando pagamento", title: "Falta pouco." },
  paid: { eyebrow: "Pagamento confirmado", title: "GG. Pedido confirmado." },
  shipped: { eyebrow: "Pedido postado", title: "Saiu para entrega." },
  delivered: { eyebrow: "Entregue", title: "Chegou." },
  expired: { eyebrow: "Pagamento expirado", title: "O tempo do Pix acabou." },
  canceled: { eyebrow: "Pedido cancelado", title: "Pedido cancelado." },
  refunded: { eyebrow: "Estornado", title: "Pagamento estornado." },
  needs_review: { eyebrow: "Em análise", title: "Recebemos seu pagamento." },
};

function PixBox({ order }: { order: OrderView }) {
  const now = useNow(1000);
  const [copied, setCopied] = useState(false);
  const pix = order.pix!;
  const until = Date.parse(order.reservedUntil ?? pix.expiresAt ?? "") || 0;
  const t = splitCountdown(until, now);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(pix.copyPaste);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  };
  return (
    <div className="mt-10 grid gap-8 border border-line bg-surface p-6 md:grid-cols-[auto_1fr] md:p-8">
      {pix.qrCodeBase64 ? (
        <img src={`data:image/png;base64,${pix.qrCodeBase64}`} alt="QR Code do Pix" width={220} height={220} className="mx-auto size-[220px] bg-white p-2" />
      ) : (
        <div className="mx-auto grid size-[220px] place-items-center border border-dashed border-line-strong p-4 text-center text-small text-muted">{order.testMode ? "Ambiente de teste: sem QR real" : "QR indisponível. Use o código ao lado."}</div>
      )}
      <div className="flex min-w-0 flex-col gap-4">
        <p className="eyebrow text-muted">Pix copia e cola</p>
        <p className="num break-all border border-line bg-bg p-3 font-mono text-label">{pix.copyPaste}</p>
        <button type="button" onClick={copy} className="btn btn-primary self-start" aria-live="polite">
          {copied ? (
            <>
              <Icon name="check" size={16} /> Código copiado
            </>
          ) : (
            "Copiar código"
          )}
        </button>
        <p className="text-small text-muted">
          {t.done ? "O prazo deste Pix acabou." : (
            <>
              Vale por mais <span className="num text-fg">{t.h > 0 ? `${t.h}h ` : ""}{String(t.m).padStart(2, "0")}:{String(t.s).padStart(2, "0")}</span>. As peças ficam reservadas até lá.
            </>
          )}{" "}
          Esta página atualiza sozinha quando o pagamento for confirmado.
        </p>
      </div>
    </div>
  );
}

export default function OrderStatusView({ id, token }: { id: string; token: string | null }) {
  const [order, setOrder] = useState<OrderView | null | "erro" | undefined>(undefined);
  const [simulating, setSimulating] = useState(false);

  useEffect(() => {
    if (!STORE_CONNECTED) return;
    let alive = true;
    let timer: ReturnType<typeof setTimeout>;
    const load = async () => {
      const o = await fetchOrder(id, token);
      if (!alive) return;
      setOrder(o);
      // pendente: consulta de novo a cada 4 s (o servidor também consulta o Mercado Pago)
      if (o && o !== "erro" && o.status === "pending") timer = setTimeout(load, 4000);
      if (o === "erro") timer = setTimeout(load, 8000);
    };
    void load();
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [id, token]);

  useEffect(() => {
    if (!order || order === "erro" || order.status !== "paid") return;
    void refreshInventory(true);
    trackPurchaseOnce(order.id, {
      currency: "BRL",
      value: order.totalCents / 100,
      shipping: order.shippingCents / 100,
      items: order.items.map((i) => ({ item_id: `GS-${getProduct(i.slug)?.number ?? i.slug}`, item_name: i.name, item_variant: i.size, price: i.unitCents / 100, quantity: i.qty })),
    });
  }, [order]);

  const simulate = async (outcome: "paid" | "failed") => {
    setSimulating(true);
    await fetch("/api/dev/mock-payment", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orderId: id, token, outcome }) });
    setOrder(await fetchOrder(id, token));
    setSimulating(false);
  };

  if (!STORE_CONNECTED || order === null)
    return (
      <section className="wrap max-w-3xl py-section">
        <p className="eyebrow text-muted">Pedido</p>
        <h1 className="font-display mt-4 text-d3">Pedido não encontrado.</h1>
        <p className="mt-6 text-muted">Use o link do e-mail de confirmação ou entre na sua conta com o e-mail da compra para ver seus pedidos.</p>
        <Link href="/account" className="btn btn-primary mt-8">
          Entrar na conta
        </Link>
      </section>
    );

  if (order === undefined)
    return (
      <section className="wrap max-w-3xl py-section" aria-busy="true" aria-label="Carregando pedido">
        <div className="skeleton h-6 w-40" />
        <div className="skeleton mt-6 h-20 w-3/4" />
        <div className="skeleton mt-10 h-64" />
      </section>
    );

  if (order === "erro")
    return (
      <section className="wrap max-w-3xl py-section" role="alert">
        <h1 className="font-display text-d3">Não conseguimos carregar o pedido.</h1>
        <p className="mt-6 text-muted">Confira sua conexão. Tentamos de novo sozinhos em alguns segundos. Se você já pagou, o pagamento não se perde.</p>
      </section>
    );

  const s = STATUS[order.status];
  const pending = order.status === "pending";
  const ok = order.status === "paid" || order.status === "shipped" || order.status === "delivered";

  return (
    <section className="wrap max-w-4xl py-section">
      {order.testMode && <p className="eyebrow mb-8 bg-fg px-4 py-2 text-center text-bg">Ambiente de teste · nenhuma cobrança real</p>}
      <p className={`eyebrow ${ok ? "text-accent-fg" : "text-muted"}`} aria-live="polite">
        {s.eyebrow}
      </p>
      <h1 className="font-display mt-4 text-d2">{s.title}</h1>
      <p className="eyebrow num mt-6">
        Pedido {order.id} · {new Date(order.createdAt).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })}
      </p>

      {pending && order.paymentMethod === "pix" && order.pix && <PixBox order={order} />}
      {pending && order.paymentMethod === "card" && (
        <div className="mt-10 border border-line bg-surface p-6 md:p-8">
          <p>Estamos esperando a confirmação do Mercado Pago. Se você fechou a janela antes de pagar, dá para voltar enquanto a reserva vale.</p>
          {order.redirectUrl && !order.testMode && (
            <a href={order.redirectUrl} className="btn btn-primary mt-6">
              Continuar pagamento
            </a>
          )}
        </div>
      )}
      {pending && order.testMode && (
        <div className="mt-6 flex flex-wrap gap-3 border border-dashed border-line-strong p-4">
          <p className="w-full text-small text-muted">Teste: simule a resposta do gateway (o mesmo caminho do webhook real).</p>
          <button type="button" disabled={simulating} onClick={() => simulate("paid")} className="btn btn-solid btn-sm">
            Simular pagamento aprovado
          </button>
          <button type="button" disabled={simulating} onClick={() => simulate("failed")} className="btn btn-secondary btn-sm">
            Simular recusa
          </button>
        </div>
      )}

      {ok && (
        <p className="mt-6 max-w-[60ch] text-muted">
          A confirmação foi para {order.email}.{" "}
          {order.trackingCode
            ? `Código de rastreio: ${order.trackingCode}.`
            : order.presale && order.shipsFrom
              ? `Pedido de pré-venda: o envio começa a partir de ${order.shipsFrom.split("-").reverse().slice(0, 2).join("/")}.`
              : "Você recebe o código de rastreio quando o pedido for postado."}
        </p>
      )}
      {order.status === "needs_review" && <p className="mt-6 max-w-[60ch] text-muted">Seu pagamento chegou, mas precisamos conferir a disponibilidade das peças. Respondemos por e-mail em até 1 dia útil. Se não houver peça, o estorno é integral.</p>}
      {(order.status === "expired" || order.status === "canceled") && (
        <div className="mt-6">
          <p className="max-w-[60ch] text-muted">Nada foi cobrado e as peças voltaram para a loja. Se ainda quiser, é só montar a bag de novo.</p>
          <Link href="/shop" className="btn btn-primary mt-6">
            Voltar para a loja
          </Link>
        </div>
      )}

      <div className="mt-12 grid gap-10 md:grid-cols-[1fr_18rem]">
        <div>
          <h2 className="eyebrow text-muted">Itens</h2>
          <ul className="mt-4 divide-y divide-line border-y border-line">
            {order.items.map((i) => (
              <li key={`${i.slug}-${i.size}`} className="flex justify-between gap-4 py-4 text-small">
                <span>
                  {i.qty}× {i.name} · {i.size}
                  {i.editionFrom != null && (
                    <span className="eyebrow mt-1 block text-accent-fg">
                      Peça nº {i.editionFrom === i.editionTo ? i.editionFrom : `${i.editionFrom} a ${i.editionTo}`}
                    </span>
                  )}
                </span>
                <span className="num">{brl((i.unitCents * i.qty) / 100)}</span>
              </li>
            ))}
          </ul>
          <dl className="num mt-4 grid grid-cols-[1fr_auto] gap-y-1.5 text-small">
            <dt className="text-muted">Subtotal</dt>
            <dd>{brl(order.subtotalCents / 100)}</dd>
            {order.discountCents > 0 && (
              <>
                <dt className="text-muted">Descontos</dt>
                <dd>−{brl(order.discountCents / 100)}</dd>
              </>
            )}
            <dt className="text-muted">Frete ({order.shipping.name})</dt>
            <dd>{order.shippingCents ? brl(order.shippingCents / 100) : "Grátis"}</dd>
            <dt className="mt-2 font-semibold">Total</dt>
            <dd className="mt-2 font-semibold">{brl(order.totalCents / 100)}</dd>
          </dl>
        </div>
        <div className="text-small">
          <h2 className="eyebrow text-muted">Entrega</h2>
          <p className="mt-4">{order.customerName}</p>
          <p className="text-muted">{order.addressLine}</p>
          <h2 className="eyebrow mt-8 text-muted">Pagamento</h2>
          <p className="mt-4">{order.paymentMethod === "pix" ? "Pix" : "Cartão de crédito"}</p>
          <h2 className="eyebrow mt-8 text-muted">Ajuda</h2>
          <p className="mt-4 text-muted">
            Dúvidas sobre o pedido:{" "}
            <a href={`mailto:${BRAND.email}?subject=Pedido%20${order.id}`} className="link-u text-fg">
              {BRAND.email}
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}
