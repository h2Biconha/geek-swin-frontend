import "server-only";
import { z } from "zod";
import { COMMERCE, getProduct } from "@/lib/catalog";
import { isValidCep, isValidCpf, isValidEmail, isValidPhone, isValidUf, onlyDigits } from "@/lib/validate";

const text = (max: number) => z.string().trim().min(1).max(max);
const line = z.object({ slug: z.string().max(80), size: z.string().max(20), qty: z.number().int().min(1).max(COMMERCE.maxQtyPerLine) });
export const itemsSchema = z.array(line).min(1).max(20);

export const quoteSchema = z.object({
  items: itemsSchema,
  cep: z.string().max(12).optional(),
  method: z.enum(["pix", "card"]).default("pix"),
  coupon: z.string().max(40).optional(),
});

export const checkoutSchema = z.object({
  items: itemsSchema,
  customer: z.object({
    email: z.string().trim().toLowerCase().refine(isValidEmail, "E-mail inválido."),
    name: text(120).refine((v) => v.split(/\s+/).length >= 2, "Nome e sobrenome."),
    cpf: z.string().transform(onlyDigits).refine(isValidCpf, "CPF inválido."),
    phone: z.string().transform(onlyDigits).refine(isValidPhone, "Celular com DDD."),
  }),
  address: z.object({
    cep: z.string().transform(onlyDigits).refine(isValidCep, "CEP com 8 números."),
    street: text(160),
    number: text(20),
    complement: z.string().trim().max(80).optional().default(""),
    district: text(80),
    city: text(80),
    state: z.string().trim().toUpperCase().refine(isValidUf, "UF inválida."),
  }),
  shippingId: z.string().max(40),
  payment: z.object({ method: z.enum(["pix", "card"]), installments: z.number().int().min(1).max(COMMERCE.installments).optional() }),
  coupon: z.string().max(40).optional(),
  accept: z.literal(true, { error: "Aceite os termos para continuar." }),
});
export type CheckoutInput = z.infer<typeof checkoutSchema>;

/** junta linhas repetidas e confere se produto e tamanho existem */
export function normalizeItems(items: { slug: string; size: string; qty: number }[]) {
  const map = new Map<string, { slug: string; size: string; qty: number }>();
  const invalid: { slug: string; size: string }[] = [];
  for (const i of items) {
    const p = getProduct(i.slug);
    if (!p || !p.sizes.includes(i.size)) {
      invalid.push({ slug: i.slug, size: i.size });
      continue;
    }
    const k = `${i.slug}|${i.size}`;
    const cur = map.get(k);
    map.set(k, { ...i, qty: Math.min((cur?.qty ?? 0) + i.qty, COMMERCE.maxQtyPerLine) });
  }
  return { items: [...map.values()], invalid };
}

/** erros do zod no formato { "customer.cpf": "CPF inválido." } */
export function fieldErrors(e: z.ZodError) {
  const out: Record<string, string> = {};
  for (const i of e.issues) out[i.path.join(".")] ??= i.message.startsWith("Invalid") || i.message.startsWith("Too") ? "Campo inválido." : i.message;
  return out;
}
