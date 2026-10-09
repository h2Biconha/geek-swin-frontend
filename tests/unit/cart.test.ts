import { describe, expect, it } from "vitest";
import { lineKey, lineProblem, loosen, maxQtyFor, mergeLines, type CartItem } from "@/lib/cart";

const tee: CartItem = { slug: "phantom-frame-tee", size: "M", qty: 1 };

describe("carrinho", () => {
  it("adicionar várias peças não duplica peça avulsa que já está na bag", () => {
    const r = mergeLines([tee], [{ slug: tee.slug, size: "M" }, { slug: "respawn-cap", size: "Único" }]);
    expect(r.items).toHaveLength(2);
    expect(r.skipped.map((x) => x.slug)).toEqual([tee.slug]);
  });

  it("kit vira um grupo próprio, mesmo com a peça já avulsa", () => {
    const r = mergeLines([tee], [{ slug: tee.slug, size: "M" }, { slug: "respawn-cap", size: "Único" }], { slug: "starter-loadout", id: "k1" });
    expect(r.items).toHaveLength(3);
    expect(r.items.filter((i) => i.kitId === "k1")).toHaveLength(2);
    expect(lineKey(r.items[0])).not.toBe(lineKey(tee));
  });

  it("desfazer o kit junta as peças às avulsas sem perder quantidade", () => {
    const items: CartItem[] = [tee, { ...tee, kit: "starter-loadout", kitId: "k1" }, { slug: "respawn-cap", size: "Único", qty: 1, kit: "starter-loadout", kitId: "k1" }];
    const out = loosen(items, "k1");
    expect(out.find((i) => i.slug === tee.slug)!.qty).toBe(2);
    expect(out.every((i) => !i.kitId)).toBe(true);
    expect(out.reduce((s, i) => s + i.qty, 0)).toBe(3);
  });

  it("estoque conta a mesma peça em todas as linhas (avulsa + kit)", () => {
    const inv = { sizes: { M: 2 }, editionLeft: null };
    const items: CartItem[] = [{ ...tee, qty: 2 }, { ...tee, kit: "starter-loadout", kitId: "k1" }];
    expect(maxQtyFor(items[1], inv, items)).toBe(0);
    expect(lineProblem(items[1], inv, items)).toBe("esgotado");
  });
});
