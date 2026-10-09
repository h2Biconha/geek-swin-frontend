import { z } from "zod";
import { getProduct } from "@/lib/catalog";
import { isAdmin } from "@/server/auth";
import { getDb } from "@/server/db";
import { storeRoute } from "@/server/http";
import { json, readJson } from "@/server/security";

/** GET → estoque bruto (estoque, reservado, vendido). PATCH { slug, size, stock } → define estoque físico (null = sob demanda). */
export const GET = storeRoute(async () => {
  if (!(await isAdmin())) return json({ error: "nao_autorizado" }, 401);
  const db = await getDb();
  const inventory = await db.query("select product_slug, size, stock, reserved, sold from inventory order by product_slug, size");
  const editions = await db.query("select product_slug, cap, reserved, sold from editions order by product_slug");
  return json({ inventory, editions });
});

const schema = z.object({ slug: z.string(), size: z.string(), stock: z.number().int().min(0).max(100000).nullable() });
export const PATCH = storeRoute(
  async (req) => {
    if (!(await isAdmin())) return json({ error: "nao_autorizado" }, 401);
    const p = schema.safeParse(await readJson(req, 1000));
    if (!p.success || !getProduct(p.data.slug)?.sizes.includes(p.data.size)) return json({ error: "dados_invalidos" }, 400);
    const db = await getDb();
    const r = await db.query(
      "update inventory set stock = $3, updated_at = now() where product_slug = $1 and size = $2 and ($3::int is null or $3::int >= reserved + sold) returning 1",
      [p.data.slug, p.data.size, p.data.stock],
    );
    return r.length ? json({ ok: true }) : json({ error: "abaixo_do_vendido", message: "O estoque não pode ficar abaixo do que já foi vendido ou reservado." }, 409);
  },
  { mutate: true },
);
