import { describe, expect, it } from "vitest";
import { categoryProducts, getDrop, getProduct, inCategory, PRODUCTS } from "@/lib/catalog";
import { compatible, completeLook } from "@/lib/merch/looks";
import { facetsFor, getListing, listingProducts, listingSlugs, matchesFilters, navCategories, newArrivals, preparingCategories, sortProducts } from "@/lib/merch/listings";
import { suggestFor } from "@/lib/merch/recommend";

const NOW = Date.parse(getDrop("001")!.opensAtUTC!) + 86_400_000;
const p = (s: string) => getProduct(s)!;

describe("categorias e listagens", () => {
  it("peça aparece na categoria principal e nas secundárias", () => {
    expect(inCategory(p("respawn-cap"), "bones")).toBe(true);
    expect(inCategory(p("respawn-cap"), "acessorios")).toBe(true);
    expect(categoryProducts("acessorios").map((x) => x.slug)).toEqual(expect.arrayContaining(["respawn-cap", "lag-zero-socks"]));
  });

  it("categoria vazia tem página (estado vazio), mas fica fora do menu principal", () => {
    expect(categoryProducts("bermudas")).toEqual([]);
    expect(listingSlugs()).toContain("bermudas");
    expect(navCategories().map((c) => c.slug)).not.toContain("bermudas");
    expect(preparingCategories().map((c) => c.slug)).toEqual(expect.arrayContaining(["bermudas", "perifericos"]));
  });

  it("sale só existe com preço 'de' real; hoje não há, então a página não é gerada", () => {
    expect(listingProducts(getListing("sale")!)).toEqual([]);
    expect(listingSlugs()).not.toContain("sale");
  });

  it("novidades = o lote mais recente, não depende do relógio", () => {
    const n = newArrivals(7).map((x) => x.slug);
    expect(n).toContain("phantom-frame-tee");
    expect(n).not.toContain("ggwp-core-tee");
  });

  it("filtro de uma opção só não aparece; tamanho esgotado não conta", () => {
    const calcas = categoryProducts("calcas");
    const keys = facetsFor(["tamanho", "modelo", "cor", "preco"], calcas).map((f) => f.key);
    expect(keys).toContain("modelo");
    const inv = { sizes: { "38": 0, "40": 3 }, editionLeft: null };
    expect(matchesFilters(p("respawn-cargo"), { tamanho: ["38"] }, inv)).toBe(false);
    expect(matchesFilters(p("respawn-cargo"), { tamanho: ["40"] }, inv)).toBe(true);
    expect(matchesFilters(p("respawn-cargo"), { modelo: ["Cargo"] })).toBe(true);
    expect(matchesFilters(p("void-wide-pant"), { modelo: ["Cargo"] })).toBe(false);
  });

  it("ordenação por preço", () => {
    const asc = sortProducts(PRODUCTS, "menor").map((x) => x.price);
    expect(asc).toEqual([...asc].sort((a, b) => a - b));
  });
});

describe("Complete o look", () => {
  it("usa o look do drop quando existe e nunca repete o papel da peça", () => {
    const l = completeLook(p("phantom-frame-tee"), NOW);
    expect(l.source).toBe("look");
    expect(l.slots[0].pick.slug).toBe("void-wide-pant");
    expect(l.slots.every((s) => s.role !== "top")).toBe(true);
    expect(new Set(l.slots.map((s) => s.pick.slug)).size).toBe(l.slots.length);
  });

  it("sem look/pairsWith, cai para a mesma coleção", () => {
    const l = completeLook(p("void-wide-pant"), NOW);
    expect(["look", "collection"]).toContain(l.source);
    expect(l.slots.every((s) => s.role !== "bottom")).toBe(true);
  });

  it("kit (pack) não combina com nada e não recebe sugestão", () => {
    expect(compatible(p("kit-squad-3-tees"), p("respawn-cap"))).toBe(false);
    expect(completeLook(p("kit-squad-3-tees"), NOW).source).toBe("none");
  });

  it("peça esgotada não é sugerida", () => {
    const stock = { "void-wide-pant": { sizes: Object.fromEntries(p("void-wide-pant").sizes.map((s) => [s, 0])), editionLeft: null } };
    const l = completeLook(p("phantom-frame-tee"), NOW, stock);
    expect(l.slots.flatMap((s) => s.options).map((x) => x.slug)).not.toContain("void-wide-pant");
  });

  it("antes da abertura do drop, peça do drop não é sugerida como compra", () => {
    const before = Date.parse(getDrop("001")!.opensAtUTC!) - 86_400_000;
    const picks = completeLook(p("ggwp-core-tee"), before).slots.map((s) => s.pick);
    for (const x of picks) if (x.drop === "001") expect(getDrop("001")!.presale).toBe(true);
  });
});

describe("recomendações do carrinho", () => {
  it("poucas, sem duplicar o que já está na bag e sem kit", () => {
    const s = suggestFor(["phantom-frame-tee", "respawn-cap"], NOW, undefined, 3);
    expect(s.length).toBeLessThanOrEqual(3);
    const slugs = s.map((x) => x.product.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    expect(slugs).not.toContain("phantom-frame-tee");
    expect(slugs).not.toContain("respawn-cap");
    expect(slugs).not.toContain("kit-squad-3-tees");
    expect(s.every((x) => x.reason.length > 0)).toBe(true);
  });

  it("bag vazia: nenhuma sugestão", () => {
    expect(suggestFor([], NOW)).toEqual([]);
  });
});
