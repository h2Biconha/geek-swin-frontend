import { brl, COMMERCE, getProduct, inCategory } from "../catalog";
import { expandRegions, regionsLabel, ufFromCep } from "./regions";

/**
 * Benefícios progressivos (catalog.json > commerce.benefits). Função pura, a MESMA no navegador e no servidor.
 * Nada aparece na loja se a regra não estiver ligada (enabled) e dentro do prazo.
 *
 * Tipos:
 * - free_shipping: frete grátis nas opções listadas ("economico" = a mais barata) acima de `threshold`.
 * - discount: desconto no pedido (percent OU amount, em reais) acima de `threshold`. Nasce desligado.
 *
 * Campos: threshold (R$), regions (UFs ou regiões, null = Brasil todo), categories (null = todas),
 * excludeProducts, startsAtUTC/endsAtUTC, stacksWithCoupon, messages.before/after/condition
 * ({gap}, {threshold}, {regions}).
 */
export type Benefit = {
  id: string;
  kind: "free_shipping" | "discount";
  enabled: boolean;
  label: string;
  threshold: number;
  shippingOptions?: string[];
  percent?: number;
  amount?: number;
  regions: string[] | null;
  categories: string[] | null;
  excludeProducts: string[];
  startsAtUTC: string | null;
  endsAtUTC: string | null;
  stacksWithCoupon: boolean;
  messages: { before: string; after: string; condition: string };
};

export const BENEFITS = (COMMERCE.benefits ?? []) as unknown as Benefit[];

/** linha já com preço (o desconto de kit, quando houver, já vem abatido em discountCents) */
export type BenefitLine = { slug: string; lineCents: number; discountCents?: number };

export const isActive = (b: Benefit, now: number) =>
  b.enabled && b.threshold > 0 && (!b.startsAtUTC || now >= Date.parse(b.startsAtUTC)) && (!b.endsAtUTC || now < Date.parse(b.endsAtUTC));
export const activeBenefits = (now: number) => BENEFITS.filter((b) => isActive(b, now));

/** a peça conta para o valor mínimo da regra? */
export function lineEligible(b: Benefit, slug: string) {
  const p = getProduct(slug);
  if (!p || b.excludeProducts.includes(slug)) return false;
  return !b.categories || b.categories.some((c) => inCategory(p, c));
}
export const eligibleCents = (b: Benefit, lines: BenefitLine[]) => lines.filter((l) => lineEligible(b, l.slug)).reduce((s, l) => s + l.lineCents - (l.discountCents ?? 0), 0);

/** região: true/false com CEP; null quando ainda não dá para saber (sem CEP e a regra tem região) */
export function regionOk(b: Benefit, cep?: string | null): boolean | null {
  if (!b.regions?.length) return true;
  const uf = ufFromCep(cep);
  if (!uf) return null;
  return expandRegions(b.regions).has(uf);
}

const fill = (t: string, b: Benefit, gapCents: number) =>
  t
    .replaceAll("{gap}", brl(gapCents / 100))
    .replaceAll("{threshold}", brl(b.threshold))
    .replaceAll("{regions}", b.regions?.length ? ` para ${regionsLabel(b.regions)}` : "");

export type BenefitProgress = {
  id: string;
  kind: Benefit["kind"];
  label: string;
  thresholdCents: number;
  eligibleCents: number;
  gapCents: number;
  reached: boolean;
  /** a região ainda não foi confirmada (sem CEP) ou o CEP não é elegível */
  region: boolean | null;
  message: string;
  /** condição completa, para quem quer saber a regra antes do CEP */
  condition: string;
};

/** progresso de cada benefício ativo, do mais perto de ser atingido ao mais longe */
export function benefitProgress(lines: BenefitLine[], now: number, cep?: string | null): BenefitProgress[] {
  return activeBenefits(now)
    .map((b) => {
      const thresholdCents = Math.round(b.threshold * 100);
      const el = eligibleCents(b, lines);
      const gapCents = Math.max(0, thresholdCents - el);
      const reached = gapCents === 0;
      const region = regionOk(b, cep);
      return {
        id: b.id,
        kind: b.kind,
        label: b.label,
        thresholdCents,
        eligibleCents: el,
        gapCents,
        reached,
        region,
        message: fill(reached ? b.messages.after : b.messages.before, b, gapCents),
        condition: fill(b.messages.condition, b, gapCents),
      };
    })
    .sort((a, b) => Number(a.reached) - Number(b.reached) || a.gapCents - b.gapCents);
}

/** frete grátis para essa opção? (servidor e prévia usam a mesma regra) */
export function freeShippingFor(optionId: string, ctx: { lines: BenefitLine[]; now: number; cep?: string | null; couponApplied?: boolean; cheapest?: boolean }) {
  return activeBenefits(ctx.now).some(
    (b) =>
      b.kind === "free_shipping" &&
      (b.shippingOptions ?? ["economico"]).some((o) => o === optionId || (o === "economico" && ctx.cheapest)) &&
      eligibleCents(b, ctx.lines) >= Math.round(b.threshold * 100) &&
      regionOk(b, ctx.cep) === true &&
      (b.stacksWithCoupon || !ctx.couponApplied),
  );
}

/** valor mínimo do frete grátis atingido (sem olhar a região, que depende do CEP) */
export const freeShippingReached = (lines: BenefitLine[], now: number, couponApplied = false) =>
  activeBenefits(now).some((b) => b.kind === "free_shipping" && eligibleCents(b, lines) >= Math.round(b.threshold * 100) && (b.stacksWithCoupon || !couponApplied));

/** desconto de pedido (kind "discount") atingido: o maior que valer */
export function orderBenefitDiscount(lines: BenefitLine[], now: number, cep?: string | null): { id: string; cents: number; stacksWithCoupon: boolean } | null {
  let best: { id: string; cents: number; stacksWithCoupon: boolean } | null = null;
  for (const b of activeBenefits(now)) {
    if (b.kind !== "discount") continue;
    const el = eligibleCents(b, lines);
    if (el < Math.round(b.threshold * 100) || regionOk(b, cep) === false) continue;
    const cents = b.percent ? Math.round((el * Math.min(b.percent, 90)) / 100) : Math.min(Math.round((b.amount ?? 0) * 100), el);
    if (cents > 0 && (!best || cents > best.cents)) best = { id: b.id, cents, stacksWithCoupon: b.stacksWithCoupon };
  }
  return best;
}

/** valor mínimo do frete grátis ligado agora (para os textos fixos da loja); null = sem frete grátis */
export function freeShippingThreshold(now: number): number | null {
  const b = activeBenefits(now).find((x) => x.kind === "free_shipping");
  return b ? b.threshold : null;
}
/** a regra do frete grátis em uma frase (ou null) */
export function freeShippingCondition(now: number): string | null {
  const b = activeBenefits(now).find((x) => x.kind === "free_shipping");
  return b ? fill(b.messages.condition, b, 0) : null;
}
