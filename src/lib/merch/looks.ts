import { DROPS, getProduct, isBuyable, PRODUCTS, roleOf, collectionOf, type Drop, type Inventory, type Look, type Product, type ProductRole } from "../catalog";

/**
 * Complete o look. As combinações vêm de relações REAIS do catálogo, nesta ordem:
 * 1. looks editoriais dos drops (catalog.json > drops[].looks);
 * 2. combinações manuais da peça (products[].pairsWith);
 * 3. alternativa: peças da mesma coleção (mesmo drop ou linha Core) que ocupam outro papel no look.
 * Regra de compatibilidade: um look tem no máximo uma peça por papel (nada de duas partes de cima),
 * kits não entram, e periférico só combina com periférico.
 */
export type LookRef = Look & { drop: Drop };
export const allLooks = (): LookRef[] => DROPS.flatMap((d) => d.looks.map((l) => ({ ...l, drop: d })));
export const looksWith = (slug: string) => allLooks().filter((l) => l.products.includes(slug));

export const LOOK_ROLES: ProductRole[] = ["top", "bottom", "head", "accessory"];
export const ROLE_LABEL: Record<ProductRole, string> = { top: "Parte de cima", bottom: "Parte de baixo", head: "Boné", accessory: "Acessório", setup: "Setup", pack: "Kit" };

const family = (p: Product) => (roleOf(p) === "setup" ? "setup" : roleOf(p) === "pack" ? "pack" : "apparel");
/** duas peças podem estar no mesmo look? */
export const compatible = (a: Product, b: Product) =>
  a.slug !== b.slug && family(a) !== "pack" && family(b) !== "pack" && family(a) === family(b) && (family(a) === "setup" ? (a.attrs.tipo ?? "") !== (b.attrs.tipo ?? "") : roleOf(a) !== roleOf(b));

export type LookSlot = { role: ProductRole; pick: Product; options: Product[] };
export type CompleteLook = { source: "look" | "pairs" | "collection" | "none"; look: LookRef | null; slots: LookSlot[] };

export function completeLook(p: Product, now: number, stock?: Record<string, Inventory>, max = 3): CompleteLook {
  const ok = (q: Product) => compatible(p, q) && isBuyable(q, now, stock);
  const look = looksWith(p.slug).find((l) => l.products.some((s) => getProduct(s) && ok(getProduct(s)!))) ?? null;
  const fromLook = (look?.products ?? []).map(getProduct).filter((q): q is Product => !!q);
  const fromPairs = p.pairsWith.map(getProduct).filter((q): q is Product => !!q);
  const fromCollection = PRODUCTS.filter((q) => collectionOf(q) === collectionOf(p)).sort((a, b) => a.rank - b.rank);
  const ranked = [...new Set([...fromLook, ...fromPairs, ...fromCollection])].filter(ok);
  // trocar: qualquer peça compatível do catálogo, depois das sugeridas
  const everything = [...new Set([...ranked, ...PRODUCTS.filter(ok).sort((a, b) => a.rank - b.rank)])];

  const roles = family(p) === "setup" ? [...new Set(ranked.map((q) => q.attrs.tipo ?? ""))].map(() => "setup" as ProductRole) : LOOK_ROLES.filter((r) => r !== roleOf(p));
  const slots: LookSlot[] = [];
  const used = new Set<string>();
  for (const role of roles) {
    const options = everything.filter((q) => roleOf(q) === role && !used.has(q.slug));
    const pick = ranked.find((q) => roleOf(q) === role && !used.has(q.slug));
    if (!pick) continue;
    used.add(pick.slug);
    slots.push({ role, pick, options: [pick, ...options.filter((q) => q.slug !== pick.slug)] });
    if (slots.length >= max) break;
  }
  const picks = slots.map((s) => s.pick.slug);
  const source = !slots.length ? "none" : picks.some((s) => fromLook.some((q) => q.slug === s)) ? "look" : picks.some((s) => fromPairs.some((q) => q.slug === s)) ? "pairs" : "collection";
  return { source, look: source === "look" ? look : null, slots };
}
