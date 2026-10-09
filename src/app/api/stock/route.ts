import { getDb } from "@/server/db";
import { storeRoute } from "@/server/http";
import { readInventory, releaseExpired } from "@/server/inventory";
import { json } from "@/server/security";

/** GET /api/stock?slugs=a,b → estoque real por tamanho e tiragem restante. Cache curto na borda. */
export const GET = storeRoute(async (req) => {
  const slugs = (new URL(req.url).searchParams.get("slugs") ?? "").split(",").filter(Boolean).slice(0, 50);
  const db = await getDb();
  await releaseExpired(db);
  return json(await readInventory(db, slugs.length ? slugs : undefined), 200, { "Cache-Control": "public, s-maxage=10, stale-while-revalidate=20" });
});
