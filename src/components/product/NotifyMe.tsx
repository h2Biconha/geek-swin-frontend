"use client";

import { useState } from "react";
import { CONSENT_TEXT, subscribe, SUBSCRIBE_MESSAGES } from "@/lib/subscribe";

/** "Avisar-me" quando um tamanho/produto voltar ou o drop abrir. */
export default function NotifyMe({ product, size, source = "avise-me", label = "Me avise se voltar" }: { product: string; size?: string | null; source?: string; label?: string }) {
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [state, setState] = useState<"idle" | "sending" | "msg">("idle");
  const [msg, setMsg] = useState("");
  const id = `notify-${product}`;

  return (
    <form
      noValidate
      className="flex flex-col gap-3 border border-line p-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setState("sending");
        const r = await subscribe({ email, consent, source, product, size: size ?? undefined });
        setMsg(r.ok ? (source === "drop-abertura" ? "Pronto. Você recebe um e-mail quando o drop abrir." : "Pronto. Você recebe um e-mail se ele voltar.") : SUBSCRIBE_MESSAGES[r.reason]);
        setState("msg");
      }}
    >
      <p className="eyebrow text-fg">
        {label}
        {size ? ` · ${size}` : ""}
      </p>
      <div className="flex gap-2">
        <label htmlFor={id} className="sr-only">
          Seu e-mail
        </label>
        <input id={id} type="email" required autoComplete="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} className="input" />
        <button type="submit" className="btn btn-solid shrink-0" disabled={state === "sending"}>
          {state === "sending" ? "Enviando…" : "Avisar"}
        </button>
      </div>
      <label className="flex items-start gap-2.5 text-small text-muted">
        <input type="checkbox" className="check mt-0.5" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
        {CONSENT_TEXT.replace(" (e WhatsApp, se informado)", "")}
      </label>
      {state === "msg" && (
        <p role="status" className="text-small text-fg">
          {msg}
        </p>
      )}
    </form>
  );
}
