import data from "../catalog.json";
import { getProduct, inCategory, isBuyable, PRODUCTS, type Inventory, type Product } from "../catalog";

/**
 * Kits (bundles): combinações comerciais configuradas em catalog.json > bundles.
 * - O kit NÃO tem estoque próprio: cada peça é reservada no próprio estoque, tudo ou nada, na mesma transação.
 * - Desconto só quando `discount` está configurado e o kit está ativo e dentro do prazo. Sem desconto, o kit custa a soma das peças.
 * - O servidor recalcula: o desconto só vale se as peças do grupo formarem exatamente o kit (uma por espaço).
 */
export type BundleSlot = { label: string; products?: string[]; categories?: string[]; qty?: number };
export type Bundle = {
  slug: string;
  name: string;
  tagline: string;
  slots: BundleSlot[];
  /** percent: 1 a 50 · fixed: reais. null = sem desconto */
  discount: { kind: "percent" | "fixed"; value: number } | null;
  active: boolean;
  startsAtUTC: string | null;
  endsAtUTC: string | null;
};

export const BUNDLES = (data.bundles ?? []) as unknown as Bundle[];
export const getBundle = (slug: string | undefined) => BUNDLES.find((b) => b.slug === slug);

/** peças publicadas que cabem no espaço do kit */
export const slotOptions = (s: BundleSlot): Product[] =>
  s.products ? s.products.map((x) => getProduct(x)).filter((p): p is Product => !!p) : PRODUCTS.filter((p) => s.categories?.some((c) => inCategory(p, c)));

/** kit ligado, no prazo e com pelo menos uma peça publicada em cada espaço (ignora estoque) */
export const bundleLive = (b: Bundle, now: number) =>
  b.active && (!b.startsAtUTC || now >= Date.parse(b.startsAtUTC)) && (!b.endsAtUTC || now < Date.parse(b.endsAtUTC)) && b.slots.length > 1 && b.slots.every((s) => slotOptions(s).length > 0);

/** dá para montar agora? cada espaço precisa de uma peça à venda (fase do drop + estoque real) */
export const bundleBuyable = (b: Bundle, now: number, stock?: Record<string, Inventory>) => bundleLive(b, now) && b.slots.every((s) => slotOptions(s).some((p) => isBuyable(p, now, stock)));

/** kits em que a peça entra */
export const bundlesWith = (slug: string, now: number) => BUNDLES.filter((b) => bundleLive(b, now) && b.slots.some((s) => slotOptions(s).some((p) => p.slug === slug)));

/** desconto do kit sobre a soma das peças (em centavos) */
export function bundleDiscountCents(b: Bundle, sumCents: number) {
  if (!b.discount || b.discount.value <= 0) return 0;
  const raw = b.discount.kind === "percent" ? Math.round((sumCents * Math.min(b.discount.value, 50)) / 100) : Math.round(b.discount.value * 100);
  return Math.max(0, Math.min(raw, sumCents - 1));
}

/** cada linha num espaço diferente, com a quantidade do espaço (tentativa e erro: kits têm poucos espaços) */
function fits(b: Bundle, lines: { slug: string; qty: number }[]) {
  if (lines.length !== b.slots.length) return false;
  const used = new Set<number>();
  const place = (i: number): boolean => {
    if (i === lines.length) return true;
    for (let s = 0; s < b.slots.length; s++) {
      if (used.has(s)) continue;
      const slot = b.slots[s];
      if ((slot.qty ?? 1) !== lines[i].qty || !slotOptions(slot).some((p) => p.slug === lines[i].slug)) continue;
      used.add(s);
      if (place(i + 1)) return true;
      used.delete(s);
    }
    return false;
  };
  return place(0);
}

export type BundleCheck = { kit: string; kitId: string; name: string; valid: boolean; discountCents: number; reason?: "inexistente" | "inativo" | "incompleto" };

/** o grupo de linhas forma o kit? devolve o desconto (0 sem desconto configurado ou com kit inválido) */
export function evaluateBundle(kit: string, kitId: string, lines: { slug: string; qty: number; lineCents: number }[], now: number): BundleCheck {
  const b = getBundle(kit);
  if (!b) return { kit, kitId, name: kit, valid: false, discountCents: 0, reason: "inexistente" };
  if (!bundleLive(b, now)) return { kit, kitId, name: b.name, valid: false, discountCents: 0, reason: "inativo" };
  if (!fits(b, lines)) return { kit, kitId, name: b.name, valid: false, discountCents: 0, reason: "incompleto" };
  return { kit, kitId, name: b.name, valid: true, discountCents: bundleDiscountCents(b, lines.reduce((s, l) => s + l.lineCents, 0)) };
}

/** divide o desconto entre as linhas, proporcional ao valor (a soma bate exatamente) */
export function allocate(total: number, weights: number[]) {
  const sum = weights.reduce((a, b) => a + b, 0);
  if (!total || !sum) return weights.map(() => 0);
  const raw = weights.map((w) => (total * w) / sum);
  const out = raw.map(Math.floor);
  let rest = total - out.reduce((a, b) => a + b, 0);
  raw.map((r, i) => [r - Math.floor(r), i] as const).sort((a, b) => b[0] - a[0]).forEach(([, i]) => rest-- > 0 && out[i]++);
  return out;
}

/** id curto da instância do kit no carrinho (duas vezes o mesmo kit = dois grupos) */
export const newKitId = () => Math.random().toString(36).slice(2, 10).padEnd(8, "0");
