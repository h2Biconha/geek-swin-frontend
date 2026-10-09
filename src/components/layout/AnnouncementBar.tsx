"use client";

import Link from "next/link";
import { useState } from "react";
import { dateLabel, getDrop, shipsLabel, SITE, timeLabel } from "@/lib/catalog";
import { freeShippingCondition } from "@/lib/commerce/benefits";
import { useDropPhase, useNow } from "@/lib/time";

const drop = getDrop("001")!;

/**
 * Barra fina no topo com UMA mensagem, a mais útil para a fase do drop.
 * Fixa de propósito: texto que gira sozinho atrapalha leitura (WCAG 2.2.2) e ninguém lê o terceiro slide.
 */
export default function AnnouncementBar() {
  const phase = useDropPhase(drop);
  const shipping = freeShippingCondition(useNow(60_000));
  const [note, setNote] = useState(false);
  const opens = drop.opensAtUTC;
  const msg: { text: string; href?: string } =
    phase === "presale" && opens
      ? { text: `Pré-venda do Drop ${drop.number} · abre ${dateLabel(opens)} às ${timeLabel(opens)}${drop.shipsFrom ? ` · envio a partir de ${shipsLabel(drop.shipsFrom)}` : ""}`, href: `/drops/${drop.slug}` }
      : phase === "upcoming" && opens
        ? { text: `Drop ${drop.number} abre ${dateLabel(opens)} às ${timeLabel(opens)} · entre na lista`, href: "/#lista" }
        : phase === "live"
          ? { text: `Drop ${drop.number} · ${drop.name ?? ""} está aberto`, href: `/drops/${drop.slug}` }
          : shipping
            ? { text: shipping }
            : { text: "Novidades toda semana na loja", href: "/shop/novidades" };
  return (
    <div className="theme-dark relative z-[51] border-b border-line">
      <div className="wrap flex h-9 items-center justify-center gap-3">
        {SITE.preview && (
          <button type="button" onClick={() => setNote((n) => !n)} aria-expanded={note} aria-controls="preview-note" className="eyebrow shrink-0 border border-line-strong px-1.5 py-0.5 text-accent-fg">
            Prévia
          </button>
        )}
        <p className="eyebrow min-w-0 truncate text-fg">
          {msg.href ? (
            <Link href={msg.href} className="link-u">
              {msg.text}
            </Link>
          ) : (
            msg.text
          )}
        </p>
      </div>
      {note && (
        <p id="preview-note" className="wrap border-t border-line py-3 text-center text-small text-muted">
          {SITE.previewNote}
        </p>
      )}
    </div>
  );
}
