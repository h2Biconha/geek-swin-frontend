"use client";

import { availability, getDrop, type Product } from "@/lib/catalog";
import { useDropPhase } from "@/lib/time";

const NO_DROP = getDrop("001")!;

/** Disponibilidade com a fase do drop ao vivo (pré-venda, aberto, esgotado...). */
export function useAvailability(p: Product) {
  const drop = p.drop ? getDrop(p.drop) : undefined;
  const phase = useDropPhase(drop ?? NO_DROP);
  return { status: availability(p, drop ? phase : undefined), phase: drop ? phase : undefined, drop };
}

export const STATUS_BADGE = {
  available: null,
  low: { label: "Últimas", cls: "badge-accent" },
  "sold-out": { label: "Sold out", cls: "badge-solid" },
  "coming-soon": { label: "Coming soon", cls: "badge-muted" },
} as const;
