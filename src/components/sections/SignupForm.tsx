"use client";

import Link from "next/link";
import { useId, useRef, useState } from "react";
import { CONSENT_TEXT, subscribe, SUBSCRIBE_MESSAGES } from "@/lib/subscribe";
import { maskPhone } from "@/lib/validate";

/**
 * Formulário da lista (lista do drop, aviso de próximo drop).
 * Consentimento explícito e separado (LGPD): a caixa não vem marcada e o texto marcado é o que o servidor grava.
 */
export default function SignupForm({ source, cta = "Entrar na lista", withWhatsapp, done = "Você está na lista." }: { source: string; cta?: string; withWhatsapp?: boolean; done?: string }) {
  const id = useId();
  const [email, setEmail] = useState("");
  const [wa, setWa] = useState("");
  const [consent, setConsent] = useState(false);
  const [state, setState] = useState<"idle" | "sending" | "ok" | "again" | "warn" | "error">("idle");
  const [msg, setMsg] = useState("");
  const [field, setField] = useState<"email" | "wa" | "consent" | null>(null);
  const trap = useRef<HTMLInputElement>(null);

  if (state === "ok" || state === "again")
    return (
      <div role="status" className="border-l-2 border-accent pl-4">
        <p className="font-display text-d4">{state === "again" ? "Você já estava na lista." : done}</p>
        <p className="mt-2 text-muted">Avisamos por e-mail{wa ? " e WhatsApp" : ""} quando houver data. Para sair, use o link no rodapé de qualquer e-mail.</p>
      </div>
    );

  return (
    <form
      noValidate
      onSubmit={async (e) => {
        e.preventDefault();
        setState("sending");
        const r = await subscribe({ email, whatsapp: wa || undefined, consent, source, website: trap.current?.value || undefined });
        if (r.ok) return setState(r.isNew ? "ok" : "again");
        setMsg(SUBSCRIBE_MESSAGES[r.reason]);
        const f = r.reason === "invalid_email" ? "email" : r.reason === "invalid_whatsapp" ? "wa" : r.reason === "no_consent" ? "consent" : null;
        setField(f);
        if (f) document.getElementById(`${id}-${f === "email" ? "e" : f === "wa" ? "w" : "c"}`)?.focus();
        setState(r.reason === "not_connected" ? "warn" : "error");
      }}
      className="flex w-full flex-col gap-4"
    >
      <div className={`grid gap-3 ${withWhatsapp ? "sm:grid-cols-2" : ""}`}>
        <div>
          <label htmlFor={`${id}-e`} className="field-label">
            Seu e-mail
          </label>
          <input id={`${id}-e`} type="email" autoComplete="email" inputMode="email" placeholder="voce@email.com" value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={field === "email"} aria-describedby={`${id}-m`} className="input" required />
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
      {/* armadilha para robôs: invisível para pessoas e leitores de tela */}
      <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor={`${id}-site`}>Não preencha</label>
        <input ref={trap} id={`${id}-site`} name="website" tabIndex={-1} autoComplete="off" />
      </div>
      <label className="flex items-start gap-3 text-small text-muted">
        <input id={`${id}-c`} type="checkbox" className="check mt-0.5" checked={consent} onChange={(e) => setConsent(e.target.checked)} aria-invalid={field === "consent"} aria-describedby={`${id}-m`} />
        <span>
          {withWhatsapp ? CONSENT_TEXT : CONSENT_TEXT.replace(" (e WhatsApp, se informado)", "")}{" "}
          <Link href="/privacy" className="link-u text-fg">
            Privacidade
          </Link>
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
