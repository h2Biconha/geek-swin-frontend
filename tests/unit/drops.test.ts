import { describe, expect, it } from "vitest";
import { availability, dropPhase, editionLeft, getDrop, getProduct, isPurchasablePhase, type Drop, type Inventory } from "@/lib/catalog";
import { splitCountdown } from "@/lib/time";

const d1 = getDrop("001")!;
const opens = Date.parse(d1.opensAtUTC!);

describe("fase do drop", () => {
  it("abre 10/10 às 20h de Brasília (23h UTC)", () => {
    expect(d1.opensAtUTC).toBe("2026-10-10T23:00:00Z");
  });

  it("antes da abertura: pré-venda (drop com pré-venda) ou em breve", () => {
    expect(dropPhase(d1, opens - 1000)).toBe(d1.presale ? "presale" : "upcoming");
    expect(dropPhase({ ...d1, presale: false }, opens - 1000)).toBe("upcoming");
  });

  it("na hora exata vira ao vivo", () => {
    expect(dropPhase(d1, opens)).toBe("live");
  });

  it("drop sem data é coming-soon e não vende", () => {
    const d2 = getDrop("002")!;
    expect(dropPhase(d2, Date.now())).toBe("coming-soon");
    expect(isPurchasablePhase("coming-soon")).toBe(false);
    expect(isPurchasablePhase("upcoming")).toBe(false);
  });

  it("encerrado por data vira arquivo", () => {
    const closed: Drop = { ...d1, closesAtUTC: new Date(opens + 1000).toISOString() };
    expect(dropPhase(closed, opens + 2000)).toBe("archived");
  });

  it("status forçado no catálogo manda", () => {
    expect(dropPhase({ ...d1, status: "sold-out" }, opens + 1)).toBe("sold-out");
  });

  it("esgotado só com estoque real zerado em todas as peças", () => {
    const zero: Record<string, Inventory> = {};
    for (const p of ["obsidian-shell-hoodie", "phantom-frame-tee", "respawn-cap", "respawn-cargo", "lag-zero-socks"]) zero[p] = { sizes: Object.fromEntries(getProduct(p)!.sizes.map((s) => [s, 0])), editionLeft: 0 };
    expect(dropPhase(d1, opens + 1, zero)).toBe("sold-out");
    expect(dropPhase(d1, opens + 1, {})).toBe("live");
  });

  it("sem dado de estoque, não inventa quantidade restante", () => {
    expect(editionLeft(d1, null)).toBeNull();
    const hoodie = getProduct("obsidian-shell-hoodie")!;
    expect(availability(hoodie, "live", undefined)).toBe("available");
  });
});

describe("contagem regressiva", () => {
  it("nunca fica negativa", () => {
    const t = splitCountdown(1000, 5000);
    expect(t).toEqual({ done: true, d: 0, h: 0, m: 0, s: 0 });
  });
  it("quebra em dias, horas, minutos e segundos", () => {
    expect(splitCountdown(90061000, 0)).toEqual({ done: false, d: 1, h: 1, m: 1, s: 1 });
  });
});
