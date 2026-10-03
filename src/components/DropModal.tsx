"use client";

import { EDITION_TOTAL } from "@/lib/products";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { EASE_LUX } from "@/lib/motion";
import { usePathname } from "next/navigation";
import { useCountdown } from "./Countdown";
import { isValidEmail, subscribe } from "@/lib/subscribe";

/**
 * Popup do drop: abre 1.2s depois de carregar.
 * - <dialog> nativo com showModal(): Esc fecha e o foco fica preso dentro (de graça).
 * - Uma vez por visitante: se cadastrou, nunca mais aparece; se só fechou, volta depois de 24h.
 */
const KEY = "gs-drop-popup";
const DAY = 86_400_000;
type Stored = { joined: boolean; at: number } | null;

const read = (): Stored => {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "null");
  } catch {
    return null;
  }
};
const write = (v: Stored) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(v));
  } catch {}
};

export default function DropModal() {
  const ref = useRef<HTMLDialogElement>(null);
  const reduce = useReducedMotion();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "error" | "sending" | "done">("idle");
  const [d, h, m, s] = useCountdown();
  const pathname = usePathname();

  useEffect(() => {
    if (pathname === "/carrinho") return; // não interrompe quem já está comprando
    const saved = read();
    const show = !saved || (!saved.joined && Date.now() - saved.at > DAY);
    if (!show) return;
    const t = setTimeout(() => ref.current?.showModal(), 1200);
    return () => clearTimeout(t);
  }, [pathname]);

  const close = () => ref.current?.close();
  const onClose = () => {
    if (!read()?.joined) write({ joined: false, at: Date.now() });
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidEmail(email)) return setStatus("error");
    setStatus("sending");
    try {
      await subscribe(email, "popup-drop-001");
      write({ joined: true, at: Date.now() });
      setStatus("done");
    } catch {
      setStatus("error");
    }
  };

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && close()} // clique fora fecha
      aria-labelledby="drop-title"
      className="drop-modal m-auto max-h-[calc(100%-2rem)] w-[min(920px,calc(100%-2rem))] overflow-auto rounded-[28px] bg-surface p-0 text-ink"
    >
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 28, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.9, ease: EASE_LUX }}
        className="grid md:grid-cols-[1fr_1.1fr]"
      >
        <div className="relative hidden min-h-[30rem] bg-acid md:block">
          <Image src="/products/model-tee.svg" alt="" fill unoptimized className="object-cover" />
          <span className="absolute left-5 top-5 rounded-full bg-invert px-3 py-1.5 font-mono text-micro font-bold uppercase tracking-[0.16em] text-on-invert">
            Drop 001 · Genesis
          </span>
        </div>

        <div className="relative flex flex-col justify-center gap-6 p-7 sm:p-10">
          <button type="button" onClick={close} aria-label="Fechar" className="absolute right-4 top-4 grid size-10 place-items-center rounded-full border border-line/15 text-lg hover:border-ink">
            ✕
          </button>

          <span className="inline-flex w-fit items-center gap-2 rounded-full bg-acid px-3 py-1.5 font-mono text-micro font-bold uppercase tracking-[0.16em] text-on-acid">
            <i className="size-1.5 animate-pulse rounded-full bg-on-acid" /> Abre em
          </span>
          <div className="flex gap-3 font-display font-extrabold tabular-nums">
            {[
              [d, "dias"],
              [h, "horas"],
              [m, "min"],
              [s, "seg"],
            ].map(([v, label], i) => (
              <div key={label}>
                <span className={`block text-[clamp(2rem,5vw,3rem)] leading-none ${i === 3 ? "text-acid-ink" : ""}`}>{v}</span>
                <span className="font-mono text-micro font-medium uppercase tracking-[0.16em] text-muted">{label}</span>
              </div>
            ))}
          </div>

          <div>
            <h2 id="drop-title" className="font-display text-[clamp(1.7rem,3.2vw,2.5rem)] font-extrabold uppercase leading-[0.95] tracking-[-0.03em]">
              Entre 1 hora antes de todo mundo
            </h2>
            <p className="mt-3 max-w-[40ch] text-muted">
              São {EDITION_TOTAL} peças numeradas e não vai ter reposição. Quem está na lista recebe o link do Drop 001 às 19h, uma hora antes da abertura.
            </p>
          </div>

          {status === "done" ? (
            <div role="status">
              <p className="font-display text-2xl font-extrabold uppercase">Você está na lista ✓</p>
              <p className="mt-2 text-muted">No dia 10/10, às 19h, o link chega no seu e-mail.</p>
              <button type="button" onClick={close} autoFocus className="mt-6 rounded-full bg-acid px-7 py-4 font-mono text-label font-bold uppercase tracking-[0.16em] text-on-acid">
                Ver as peças
              </button>
            </div>
          ) : (
            <form onSubmit={onSubmit} noValidate className="flex flex-col gap-3">
              <label htmlFor="modal-email" className="font-mono text-micro uppercase tracking-[0.16em] text-muted">
                Seu melhor e-mail
              </label>
              <input
                id="modal-email"
                type="email"
                autoFocus
                autoComplete="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (status === "error") setStatus("idle");
                }}
                aria-invalid={status === "error"}
                aria-describedby={status === "error" ? "modal-error" : undefined}
                className="rounded-full border border-line/15 bg-bg px-6 py-4 text-base focus:border-ink"
              />
              {status === "error" && (
                <p id="modal-error" role="alert" className="text-sm text-danger">
                  Digite um e-mail válido, tipo nome@gmail.com.
                </p>
              )}
              <button
                type="submit"
                disabled={status === "sending"}
                className="rounded-full bg-invert px-7 py-4 font-mono text-label font-bold uppercase tracking-[0.16em] text-on-invert transition-colors duration-500 hover:bg-acid hover:text-on-acid disabled:opacity-60"
              >
                {status === "sending" ? "Enviando…" : "Quero acesso antecipado"}
              </button>
              <p className="text-xs text-muted">Só aviso de drop. Sem spam. Sai quando quiser.</p>
            </form>
          )}

          <button type="button" onClick={close} className="w-fit font-mono text-micro uppercase tracking-[0.16em] text-muted underline underline-offset-4 hover:text-ink">
            Agora não
          </button>
        </div>
      </motion.div>
    </dialog>
  );
}
