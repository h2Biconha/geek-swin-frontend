"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { getDrop } from "@/lib/catalog";
import { splitCountdown, useDropPhase, useNow } from "@/lib/time";

/**
 * Aviso do drop (substitui o popup que travava a tela).
 * Aparece no canto depois de 40% de rolagem ou 15 s, só na home, shop e drops; nunca em produto e checkout.
 * Fechou: volta em 24 h. Não cobre conteúdo nem rouba o foco.
 */
const KEY = "gs-drop-alert";
const drop = getDrop("001")!;

export default function DropAlert() {
  const path = usePathname();
  const phase = useDropPhase(drop);
  const now = useNow(1000);
  const [show, setShow] = useState(false);
  const allowed = path === "/" || path === "/shop" || path === "/drops";

  useEffect(() => {
    if (!allowed || !(phase === "presale" || phase === "upcoming")) return;
    try {
      if (Date.now() - Number(localStorage.getItem(KEY) ?? 0) < 86_400_000) return;
    } catch {}
    const reveal = () => setShow(true);
    const t = setTimeout(reveal, 15_000);
    const onScroll = () => window.scrollY / (document.body.scrollHeight - innerHeight) > 0.4 && reveal();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => (clearTimeout(t), window.removeEventListener("scroll", onScroll));
  }, [allowed, phase]);

  if (!show || !allowed || !drop.opensAtUTC) return null;
  const c = splitCountdown(Date.parse(drop.opensAtUTC), now);
  const close = () => {
    setShow(false);
    try {
      localStorage.setItem(KEY, String(Date.now()));
    } catch {}
  };
  return (
    <aside aria-label="Aviso do drop" className="theme-dark fixed bottom-4 left-4 z-40 w-[calc(100%-2rem)] max-w-[22rem] animate-[rise_.45s_var(--ease-out)] border border-line p-5 shadow-pop">
      <button type="button" onClick={close} className="eyebrow absolute top-2 right-2 grid size-10 place-items-center text-muted hover:text-fg" aria-label="Fechar aviso">
        ✕
      </button>
      <p className="eyebrow text-accent-fg">Drop {drop.number} abre em</p>
      <p className="font-display num mt-2 text-[2.25rem] leading-none">
        {c.d}D {String(c.h).padStart(2, "0")}H {String(c.m).padStart(2, "0")}M
      </p>
      <p className="mt-3 text-small text-muted">Quem está na lista recebe o link antes. A pré-venda já está aberta.</p>
      <div className="mt-4 flex gap-2">
        <Link href={`/drops/${drop.slug}#aviso`} onClick={close} className="btn btn-primary btn-sm flex-1">
          Me avise
        </Link>
        <Link href={`/drops/${drop.slug}`} onClick={close} className="btn btn-secondary btn-sm flex-1">
          Ver drop
        </Link>
      </div>
    </aside>
  );
}
