"use client";

import { useId, useState } from "react";
import { BRAND } from "@/lib/brand";
import { maskPhone, subscribe, SUBSCRIBE_MESSAGES } from "@/lib/subscribe";

/**
 * Formulário de lista (lobby, aviso de drop, members).
 * withWhatsapp: campo opcional de WhatsApp. Consentimento explícito (LGPD).
 */
export default function SignupForm({ source, cta = "Entrar", withWhatsapp, done = "Você está no lobby." }: { source: string; cta?: string; withWhatsapp?: boolean; done?: string }) {
  const id = useId();
  const [email, setEmail] = useState("");
  const [wa, setWa] = useState("");
  const [consent, setConsent] = useState(false);
  const [state, setState] = useState<"idle" | "sending" | "ok" | "warn" | "error">("idle");
  const [msg, setMsg] = useState("");
  const [field, setField] = useState<"email" | "wa" | "consent" | null>(null);

  if (state === "ok")
    return (
      <div role="status" className="border-l-2 border-accent pl-4">
        <p className="font-display text-d4">{done}</p>
        <p className="mt-2 text-muted">O próximo aviso chega antes de todo mundo.</p>
      </div>
    );

  return (
    <form
      noValidate
      onSubmit={async (e) => {
        e.preventDefault();
        setState("sending");
        const r = await subscribe({ email, whatsapp: wa || undefined, consent, source });
        if (r.ok) return setState("ok");
        setMsg(SUBSCRIBE_MESSAGES[r.reason]);
        setField(r.reason === "invalid_email" ? "email" : r.reason === "invalid_whatsapp" ? "wa" : r.reason === "no_consent" ? "consent" : null);
        setState(r.reason === "not_connected" ? "warn" : "error");
      }}
      className="flex w-full flex-col gap-4"
    >
      <div className={`grid gap-3 ${withWhatsapp ? "sm:grid-cols-2" : ""}`}>
        <div>
          <label htmlFor={`${id}-e`} className="field-label">
            Seu e-mail
          </label>
          <input id={`${id}-e`} type="email" autoComplete="email" inputMode="email" placeholder="voce@email.com" value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={field === "email"} aria-describedby={`${id}-m`} className="input" />
        </div>
        {withWhatsapp && (
          <div>
            <label htmlFor={`${id}-w`} className="field-label">
              WhatsApp <span className="normal-case tracking-normal">(opcional)</span>
            </label>
            <input id={`${id}-w`} type="tel" autoComplete="tel-national" inputMode="tel" placeholder="(11) 90000-0000" value={wa} onChange={(e) => setWa(maskPhone(e.target.value))} aria-invalid={field === "wa"} aria-describedby={`${id}-m`} className="input" />
          </div>
        )}
      </div>
      <label className="flex items-start gap-3 text-small text-muted">
        <input type="checkbox" className="check mt-0.5" checked={consent} onChange={(e) => setConsent(e.target.checked)} aria-invalid={field === "consent"} />
        <span>
          Quero receber avisos de drops da {BRAND.name} por e-mail{withWhatsapp ? " e WhatsApp" : ""}. Sem spam, saio quando quiser.
        </span>
      </label>
      <button type="submit" disabled={state === "sending"} className="btn btn-primary btn-lg sm:self-start">
        {state === "sending" ? "Enviando…" : cta}
      </button>
      <p id={`${id}-m`} role={state === "error" ? "alert" : "status"} className={`text-small ${state === "error" ? "text-danger" : "text-muted"} ${state === "warn" || state === "error" ? "" : "sr-only"}`}>
        {state === "warn" || state === "error" ? msg : ""}
      </p>
    </form>
  );
}
