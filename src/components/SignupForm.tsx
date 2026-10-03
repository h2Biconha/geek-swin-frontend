"use client";

import { useState } from "react";
import { isValidEmail, subscribe } from "@/lib/subscribe";

/** Formulário de e-mail reaproveitável (rodapé, página de drops). Ver lib/subscribe.ts. */
export default function SignupForm({ id, source, tone = "light", cta = "Entrar" }: { id: string; source: string; tone?: "light" | "acid"; cta?: string }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "error" | "sending" | "done">("idle");

  if (status === "done")
    return (
      <p role="status" className={tone === "acid" ? "font-display text-2xl font-extrabold uppercase" : "text-sm font-medium text-acid-ink"}>
        Você está na lista ✓
      </p>
    );

  return (
    <form
      noValidate
      onSubmit={async (e) => {
        e.preventDefault();
        if (!isValidEmail(email)) return setStatus("error");
        setStatus("sending");
        try {
          await subscribe(email, source);
          setStatus("done");
        } catch {
          setStatus("error");
        }
      }}
      className="flex flex-col gap-2 sm:flex-row"
    >
      <label htmlFor={id} className="sr-only">
        Seu e-mail
      </label>
      <input
        id={id}
        type="email"
        autoComplete="email"
        placeholder="seu@email.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        aria-invalid={status === "error"}
        className={`min-w-0 flex-1 rounded-full border px-5 py-3 text-sm ${
          tone === "acid" ? "border-black/20 bg-white/70 text-on-acid focus:bg-white" : "border-line/15 bg-surface focus:border-ink"
        }`}
      />
      <button type="submit" disabled={status === "sending"} className="rounded-full bg-invert px-6 py-3 font-mono text-label font-bold uppercase tracking-[0.16em] text-on-invert disabled:opacity-60">
        {status === "sending" ? "…" : cta}
      </button>
      {status === "error" && (
        <p role="alert" className="text-sm text-danger sm:sr-only">
          Digite um e-mail válido.
        </p>
      )}
    </form>
  );
}
