import { z } from "zod";
import { getProduct } from "@/lib/catalog";
import { isValidEmail, isValidWhatsapp, onlyDigits } from "@/lib/validate";
import { getDb } from "@/server/db";
import { storeRoute } from "@/server/http";
import { ipKey, json, rateLimit, readJson } from "@/server/security";
import { addStockAlert } from "@/server/alerts";
import { addSubscriber } from "@/server/subscribers";

const schema = z.object({
  email: z.string().trim().toLowerCase().refine(isValidEmail),
  whatsapp: z.string().optional().refine((v) => !v || isValidWhatsapp(v)),
  consent: z.literal(true),
  source: z.string().regex(/^[a-z0-9-]{2,40}$/),
  product: z.string().max(80).optional(),
  size: z.string().max(20).optional(),
  website: z.string().max(0).optional(), // honeypot: robôs preenchem
});

/** POST /api/subscribe → 201 novo, 200 já estava. Contrato em BACKEND.md > Lista. */
export const POST = storeRoute(
  async (req) => {
    const db = await getDb();
    if (!(await rateLimit(db, `sub:${ipKey(req)}`, 8, 3600))) return json({ error: "limite", message: "Muitas tentativas. Tente mais tarde." }, 429);
    const p = schema.safeParse(await readJson(req, 4000));
    if (!p.success) {
      const path = p.error.issues[0]?.path[0];
      return json({ error: path === "consent" ? "sem_consentimento" : path === "whatsapp" ? "whatsapp_invalido" : "email_invalido" }, 400);
    }
    const d = p.data;
    const product = d.product && getProduct(d.product) ? d.product : undefined;
    const isNew = await addSubscriber(db, { email: d.email, source: d.source, whatsapp: d.whatsapp ? onlyDigits(d.whatsapp) : undefined, product, size: product ? d.size : undefined });
    // aviso de volta ao estoque: guarda peça + tamanho (vários por pessoa)
    if (d.source === "avise-me" && product) await addStockAlert(db, d.email, product, product && getProduct(product)?.sizes.includes(d.size ?? "") ? d.size : undefined);
    return json({ ok: true }, isNew ? 201 : 200);
  },
  { mutate: true },
);
