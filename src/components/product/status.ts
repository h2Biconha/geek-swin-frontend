"use client";

import { availability, getDrop, type Product } from "@/lib/catalog";
import { useInventory } from "@/lib/inventory";
import { useDropPhase } from "@/lib/time";

const ANY_DROP = getDrop("001")!;

/** Disponibilidade com a fase do drop ao vivo e o estoque real (quando a loja está conectada). */
export function useAvailability(p: Product) {
  const drop = p.drop ? getDrop(p.drop) : undefined;
  const phase = useDropPhase(drop ?? ANY_DROP);
  const inv = useInventory(p.slug);
  return { status: availability(p, drop ? phase : undefined, inv), phase: drop ? phase : undefined, drop, inv };
}

export const STATUS_BADGE = {
  available: null,
  low: { label: "Últimas peças", cls: "badge-accent" },
  "sold-out": { label: "Esgotado", cls: "badge-solid" },
  "coming-soon": { label: "Em breve", cls: "badge-muted" },
} as const;
