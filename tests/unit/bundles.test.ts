import { afterEach, describe, expect, it } from "vitest";
import { getDrop, getProduct } from "@/lib/catalog";
import { allocate, bundleBuyable, bundleLive, bundlesWith, evaluateBundle, getBundle } from "@/lib/commerce/bundles";
import { computeTotals, toCents } from "@/lib/commerce/pricing";

const NOW = Date.parse(getDrop("001")!.opensAtUTC!) + 86_400_000;
const starter = getBundle("starter-loadout")!;
const backup = structuredClone(starter);
afterEach(() => Object.assign(starter, structuredClone(backup)));
const cents = (slug: string, qty = 1) => toCents(getProduct(slug)!.price) * qty;
const kitLines = [
  { slug: "ggwp-core-tee", size: "M", qty: 1, kit: "starter-loadout", kitId: "abcd1234" },
  { slug: "respawn-cap", size: "Único", qty: 1, kit: "starter-loadout", kitId: "abcd1234" },
];

describe("kits", () => {
  it("kit sem desconto configurado custa exatamente a soma das peças", () => {
    expect(starter.discount).toBeNull();
    const t = computeTotals({ items: kitLines, method: "card", shipping: null, now: NOW });
    expect(t.bundleCents).toBe(0);
    expect(t.bundles[0]).toMatchObject({ valid: true, discountCents: 0 });
    expect(t.totalCents).toBe(cents("ggwp-core-tee") + cents("respawn-cap"));
  });

  it("desconto configurado entra só quando as peças formam o kit", () => {
    starter.discount = { kind: "percent", value: 10 };
    const sum = cents("ggwp-core-tee") + cents("respawn-cap");
    const ok = computeTotals({ items: kitLines, method: "card", shipping: null, now: NOW });
    expect(ok.bundleCents).toBe(Math.round(sum * 0.1));
    expect(ok.lines.reduce((s, l) => s + l.discountCents, 0)).toBe(ok.bundleCents);
    // faltando uma peça: inválido, sem desconto
    const half = computeTotals({ items: [kitLines[0]], method: "card", shipping: null, now: NOW });
    expect(half.bundleCents).toBe(0);
    expect(half.bundles[0]).toMatchObject({ valid: false, reason: "incompleto" });
    // peça fora do espaço (calça no lugar do boné)
    const wrong = evaluateBundle("starter-loadout", "x", [{ slug: "ggwp-core-tee", qty: 1, lineCents: 1 }, { slug: "void-wide-pant", qty: 1, lineCents: 1 }], NOW);
    expect(wrong.valid).toBe(false);
    // quantidade diferente da do espaço
    expect(evaluateBundle("starter-loadout", "x", [{ slug: "ggwp-core-tee", qty: 2, lineCents: 1 }, { slug: "respawn-cap", qty: 1, lineCents: 1 }], NOW).valid).toBe(false);
  });

  it("percentual tem teto de 50% e kit desligado ou vencido não dá desconto", () => {
    starter.discount = { kind: "percent", value: 90 };
    const sum = cents("ggwp-core-tee") + cents("respawn-cap");
    expect(computeTotals({ items: kitLines, method: "card", shipping: null, now: NOW }).bundleCents).toBe(Math.round(sum * 0.5));
    starter.active = false;
    expect(computeTotals({ items: kitLines, method: "card", shipping: null, now: NOW }).bundles[0]).toMatchObject({ valid: false, reason: "inativo", discountCents: 0 });
    starter.active = true;
    starter.endsAtUTC = new Date(NOW - 1).toISOString();
    expect(bundleLive(starter, NOW)).toBe(false);
  });

  it("kit com espaço sem peça publicada (SETUP DROP sem periféricos) fica escondido", () => {
    const setup = getBundle("setup-drop")!;
    expect(bundleLive(setup, NOW)).toBe(false);
    expect(bundlesWith("phantom-frame-tee", NOW).map((b) => b.slug)).not.toContain("setup-drop");
  });

  it("kit some de compra quando um espaço esgota", () => {
    const stock = { "respawn-cap": { sizes: { Único: 0 }, editionLeft: null } } as never;
    expect(bundleBuyable(starter, NOW)).toBe(true);
    expect(bundleBuyable(starter, NOW, stock)).toBe(false);
  });

  it("rateio do desconto bate centavo por centavo", () => {
    expect(allocate(1000, [3333, 3333, 3334]).reduce((a, b) => a + b, 0)).toBe(1000);
    expect(allocate(0, [1, 2])).toEqual([0, 0]);
  });
});
