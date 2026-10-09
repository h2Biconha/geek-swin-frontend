"use client";

import { useEffect, useState } from "react";
import { fromCents } from "@/lib/commerce/pricing";
import { ORDER_STATUS_LABEL, type OrderStatus, type OrderView } from "@/lib/commerce/types";
import { brl, getProduct } from "@/lib/catalog";
import { STORE_CONNECTED, STORE_MODE } from "@/lib/mode";

/**
 * Painel mínimo para operar a loja sem abrir o banco: pedidos (despachar com rastreio, entregar, cancelar pendente)
 * e estoque (definir estoque físico por tamanho; vazio = sob demanda). Senha em ADMIN_PASSWORD.
 * Estorno é feito no Mercado Pago; o webhook atualiza o pedido.
 */
type AdminOrder = OrderView & { note: string | null; phone: string };
type InvRow = { product_slug: string; size: string; stock: number | null; reserved: number; sold: number };
type EdRow = { product_slug: string; cap: number; reserved: number; sold: number };

const FILTERS: (OrderStatus | "")[] = ["", "paid", "needs_review", "pending", "shipped", "delivered", "canceled", "expired", "refunded"];

async function api<T>(path: string, init?: RequestInit): Promise<{ ok: boolean; status: number; data: T }> {
  const r = await fetch(path, { ...init, headers: { "Content-Type": "application/json" }, cache: "no-store" });
  return { ok: r.ok, status: r.status, data: (await r.json().catch(() => ({}))) as T };
}

export default function AdminView() {
  const [auth, setAuth] = useState<"checking" | "out" | "in">("checking");
  const [tab, setTab] = useState<"pedidos" | "estoque">("pedidos");

  useEffect(() => {
    if (!STORE_CONNECTED) return;
    api("/api/admin/orders?status=paid").then((r) => setAuth(r.status === 401 ? "out" : "in"));
  }, []);

  if (!STORE_CONNECTED)
    return (
      <Shell>
        <p className="mt-6 text-muted">O painel precisa da loja conectada (NEXT_PUBLIC_STORE_MODE=test ou live). Na prévia não há pedidos.</p>
      </Shell>
    );
  if (auth === "checking")
    return (
      <Shell>
        <p className="mt-6 text-muted" role="status">
          Carregando…
        </p>
      </Shell>
    );
  if (auth === "out")
    return (
      <Shell>
        <Login onDone={() => setAuth("in")} />
      </Shell>
    );
  return (
    <Shell>
      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <div role="tablist" aria-label="Seções do painel" className="flex gap-2">
          {(["pedidos", "estoque"] as const).map((t) => (
            <button key={t} role="tab" aria-selected={tab === t} type="button" onClick={() => setTab(t)} className={`btn ${tab === t ? "btn-solid" : "btn-secondary"}`}>
              {t === "pedidos" ? "Pedidos" : "Estoque"}
            </button>
          ))}
        </div>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={async () => {
            await api("/api/admin/session", { method: "DELETE" });
            setAuth("out");
          }}
        >
          Sair do painel
        </button>
      </div>
      <div role="tabpanel" className="mt-8">
        {tab === "pedidos" ? <Orders /> : <Stock />}
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="wrap pt-10 pb-section">
      <p className="eyebrow text-muted">Modo: {STORE_MODE === "live" ? "produção" : STORE_MODE === "test" ? "teste (sem cobrança real)" : "prévia"}</p>
      <h1 className="font-display mt-3 text-d3">Painel da loja</h1>
      {children}
    </div>
  );
}

function Login({ onDone }: { onDone: () => void }) {
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <form
      className="mt-8 flex max-w-[24rem] flex-col gap-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        const r = await api<{ message?: string }>("/api/admin/session", { method: "POST", body: JSON.stringify({ password }) });
        setBusy(false);
        if (r.ok) return onDone();
        setMsg(r.data.message ?? "Não deu certo.");
      }}
    >
      <div>
        <label htmlFor="adm-pw" className="field-label">
          Senha do painel
        </label>
        <input id="adm-pw" type="password" autoComplete="current-password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} aria-invalid={!!msg} aria-describedby="adm-msg" required />
      </div>
      <button type="submit" className="btn btn-primary" disabled={busy}>
        {busy ? "Entrando…" : "Entrar"}
      </button>
      <p id="adm-msg" role="alert" className="text-small text-danger">
        {msg}
      </p>
    </form>
  );
}

function Orders() {
  const [filter, setFilter] = useState<OrderStatus | "">("paid");
  const [orders, setOrders] = useState<AdminOrder[] | null>(null);
  const [error, setError] = useState("");

  const [tick, setTick] = useState(0);
  const load = () => setTick((t) => t + 1);
  useEffect(() => {
    let on = true;
    api<{ orders: AdminOrder[] }>(`/api/admin/orders${filter ? `?status=${filter}` : ""}`).then((r) => {
      if (!on) return;
      if (r.ok) {
        setOrders(r.data.orders);
        setError("");
      } else setError("Não foi possível carregar os pedidos.");
    });
    return () => {
      on = false;
    };
  }, [filter, tick]);

  const act = async (id: string, body: Record<string, unknown>) => {
    const r = await api<{ error?: string }>(`/api/admin/orders/${id}`, { method: "PATCH", body: JSON.stringify(body) });
    if (!r.ok) setError(r.data.error === "transicao_invalida" ? "Essa ação não vale para o status atual do pedido." : "A ação falhou.");
    load();
  };

  return (
    <div>
      <label htmlFor="adm-filter" className="field-label">
        Status
      </label>
      <select id="adm-filter" className="input max-w-[16rem]" value={filter} onChange={(e) => setFilter(e.target.value as OrderStatus | "")}>
        {FILTERS.map((f) => (
          <option key={f} value={f}>
            {f ? ORDER_STATUS_LABEL[f] : "Todos (últimos 100)"}
          </option>
        ))}
      </select>
      {error && (
        <p role="alert" className="mt-4 text-small text-danger">
          {error}
        </p>
      )}
      {!orders ? (
        <p className="mt-6 text-muted" role="status">
          Carregando…
        </p>
      ) : !orders.length ? (
        <p className="mt-6 text-muted">Nenhum pedido com esse status.</p>
      ) : (
        <ul className="mt-6 grid gap-4">
          {orders.map((o) => (
            <AdminOrderCard key={o.id} o={o} act={act} />
          ))}
        </ul>
      )}
    </div>
  );
}

function AdminOrderCard({ o, act }: { o: AdminOrder; act: (id: string, body: Record<string, unknown>) => Promise<void> }) {
  const [tracking, setTracking] = useState("");
  return (
    <li className={`border p-5 ${o.status === "needs_review" ? "border-danger" : "border-line"}`}>
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <p className="font-mono font-bold">{o.id}</p>
        <p className="eyebrow">{ORDER_STATUS_LABEL[o.status]}</p>
      </div>
      <p className="mt-2 text-small text-muted">
        {new Date(o.createdAt).toLocaleString("pt-BR")} · {o.paymentMethod === "pix" ? "Pix" : `Cartão ${o.installments}x`} · {brl(fromCents(o.totalCents))}
        {o.presale && o.shipsFrom ? ` · pré-venda, envio a partir de ${o.shipsFrom.split("-").reverse().join("/")}` : ""}
      </p>
      <p className="mt-3 text-small">
        {o.customerName} · {o.email} · {o.phone}
        <br />
        {o.addressLine} · {o.shipping.name}
      </p>
      <ul className="mt-3 text-small">
        {o.items.map((i) => (
          <li key={`${i.slug}-${i.size}`}>
            {i.qty}× {getProduct(i.slug)?.name ?? i.name} · {i.size}
            {i.editionFrom ? ` · N° ${i.editionFrom}${i.editionTo && i.editionTo !== i.editionFrom ? `–${i.editionTo}` : ""}` : ""}
          </li>
        ))}
      </ul>
      {o.note && <p className="mt-3 text-small text-muted">Nota: {o.note}</p>}
      {o.trackingCode && <p className="mt-3 text-small">Rastreio: {o.trackingCode}</p>}
      <div className="mt-4 flex flex-wrap items-end gap-2">
        {o.status === "paid" && (
          <>
            <div>
              <label htmlFor={`trk-${o.id}`} className="field-label">
                Código de rastreio
              </label>
              <input id={`trk-${o.id}`} className="input" value={tracking} onChange={(e) => setTracking(e.target.value)} />
            </div>
            <button type="button" className="btn btn-solid" onClick={() => act(o.id, { action: "ship", trackingCode: tracking || undefined })}>
              Marcar como postado
            </button>
          </>
        )}
        {o.status === "shipped" && (
          <button type="button" className="btn btn-solid" onClick={() => act(o.id, { action: "deliver" })}>
            Marcar como entregue
          </button>
        )}
        {o.status === "pending" && (
          <button type="button" className="btn btn-secondary" onClick={() => confirm(`Cancelar ${o.id} e liberar a reserva?`) && act(o.id, { action: "cancel" })}>
            Cancelar e liberar reserva
          </button>
        )}
      </div>
    </li>
  );
}

type Demand = { alerts: { product_slug: string; size: string; pending: number }[]; sources: { source: string; people: number }[] };
type StockData = { inventory: InvRow[]; editions: EdRow[]; demand?: Demand };

function Stock() {
  const [data, setData] = useState<StockData | null>(null);
  const [msg, setMsg] = useState("");
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let on = true;
    api<StockData>("/api/admin/inventory").then((r) => on && r.ok && setData(r.data));
    return () => {
      on = false;
    };
  }, [tick]);
  if (!data)
    return (
      <p className="text-muted" role="status">
        Carregando…
      </p>
    );
  const save = async (row: InvRow, value: string) => {
    const stock = value.trim() === "" ? null : Number(value);
    if (stock !== null && (!Number.isInteger(stock) || stock < 0)) return setMsg("Use um número inteiro ou deixe vazio (sob demanda).");
    const r = await api<{ message?: string; notified?: number }>("/api/admin/inventory", { method: "PATCH", body: JSON.stringify({ slug: row.product_slug, size: row.size, stock }) });
    const sent = r.data.notified ? ` ${r.data.notified} aviso${r.data.notified > 1 ? "s" : ""} de volta enviado${r.data.notified > 1 ? "s" : ""}.` : "";
    setMsg(r.ok ? `Salvo: ${row.product_slug} ${row.size}.${sent}` : (r.data.message ?? "Não foi possível salvar."));
    setTick((t) => t + 1);
  };
  return (
    <div>
      <p className="max-w-[60ch] text-small text-muted">Estoque vazio = produção sob demanda (sem limite por tamanho). A tiragem numerada de cada peça de drop é o limite total e vem do catálogo.</p>
      <p role="status" className="mt-3 text-small">
        {msg}
      </p>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[36rem] text-left text-small">
          <thead>
            <tr className="border-b border-line">
              <th className="py-2">Peça</th>
              <th>Tamanho</th>
              <th>Estoque</th>
              <th>Reservado</th>
              <th>Vendido</th>
            </tr>
          </thead>
          <tbody>
            {data.inventory.map((r) => (
              <tr key={`${r.product_slug}-${r.size}`} className="border-b border-line">
                <td className="py-2">{getProduct(r.product_slug)?.name ?? r.product_slug}</td>
                <td>{r.size}</td>
                <td>
                  <label className="sr-only" htmlFor={`st-${r.product_slug}-${r.size}`}>
                    Estoque de {r.product_slug} {r.size}
                  </label>
                  <input id={`st-${r.product_slug}-${r.size}`} className="input h-10 w-24" inputMode="numeric" defaultValue={r.stock ?? ""} placeholder="sob demanda" onBlur={(e) => e.target.value !== String(r.stock ?? "") && save(r, e.target.value)} />
                </td>
                <td className="num">{r.reserved}</td>
                <td className="num">{r.sold}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {data.demand && (
        <>
          <h2 className="eyebrow mt-10">Demanda</h2>
          <p className="mt-2 max-w-[60ch] text-small text-muted">Pedidos de “avise-me” ainda não atendidos. O aviso sai sozinho quando o estoque daquele tamanho volta, uma vez por pessoa.</p>
          {data.demand.alerts.length ? (
            <ul className="mt-3 grid gap-1 text-small">
              {data.demand.alerts.map((a) => (
                <li key={`${a.product_slug}-${a.size}`}>
                  {getProduct(a.product_slug)?.name ?? a.product_slug}
                  {a.size ? ` · ${a.size}` : ""}: <span className="num">{a.pending}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-small text-muted">Nenhum aviso pendente.</p>
          )}
          {data.demand.sources.length > 0 && (
            <p className="mt-4 text-small text-muted">
              Lista ativa por origem: {data.demand.sources.map((x) => `${x.source} ${x.people}`).join(" · ")}
            </p>
          )}
        </>
      )}
      <h2 className="eyebrow mt-10">Tiragens</h2>
      <ul className="mt-3 grid gap-1 text-small">
        {data.editions.map((e) => (
          <li key={e.product_slug}>
            {getProduct(e.product_slug)?.name ?? e.product_slug}: {e.sold} vendidas + {e.reserved} reservadas de {e.cap}
          </li>
        ))}
      </ul>
    </div>
  );
}
