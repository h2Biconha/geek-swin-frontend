"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { brl, dateLabel, FREE_SHIPPING_FROM, getDrop, INSTALLMENTS, shipsLabel, SITE, timeLabel } from "@/lib/catalog";
import { useDropPhase } from "@/lib/time";

const drop = getDrop("001")!;

/** Barra fina no topo. Mensagens giram a cada 5 s; pausa com o mouse em cima. */
export default function AnnouncementBar() {
  const phase = useDropPhase(drop);
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const [note, setNote] = useState(false);
  const msgs: { text: string; href?: string }[] = [
    phase === "presale" && drop.opensAtUTC && drop.shipsFrom
      ? { text: `Pré-venda Drop 001 aberta · abre ${dateLabel(drop.opensAtUTC)} às ${timeLabel(drop.opensAtUTC)} · envio a partir de ${shipsLabel(drop.shipsFrom)}`, href: `/drops/${drop.slug}` }
      : phase === "live"
        ? { text: "Drop 001 · INSERT COIN está ao vivo", href: `/drops/${drop.slug}` }
        : { text: "Drop 002 em produção · entre no lobby para saber primeiro", href: "/drops/002" },
    { text: `Frete grátis acima de ${brl(FREE_SHIPPING_FROM)} · ${INSTALLMENTS}x sem juros` },
    { text: "Primeira troca por nossa conta" },
  ];
  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => setI((x) => (x + 1) % 3), 5000);
    return () => clearInterval(id);
  }, [paused]);
  const m = msgs[i];
  return (
    <div className="theme-dark relative z-[51] border-b border-line" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div className="wrap flex h-9 items-center justify-center gap-3">
        {SITE.preview && (
          <button type="button" onClick={() => setNote((n) => !n)} aria-expanded={note} className="eyebrow shrink-0 border border-line-strong px-1.5 py-0.5 text-accent-fg" title={SITE.previewNote}>
            Prévia
          </button>
        )}
        <p key={i} className="eyebrow min-w-0 animate-[rise_.4s_var(--ease-out)] truncate text-fg" aria-live="off">
          {m.href ? (
            <Link href={m.href} className="link-u">
              {m.text}
            </Link>
          ) : (
            m.text
          )}
        </p>
      </div>
      {note && (
        <p role="status" className="wrap border-t border-line py-3 text-center text-small text-muted">
          {SITE.previewNote}
        </p>
      )}
    </div>
  );
}
