import { getDb } from "@/server/db";
import { storeRoute } from "@/server/http";
import { json, readJson } from "@/server/security";
import { unsubscribe } from "@/server/subscribers";

/** POST /api/unsubscribe { email, token } → sai de todas as listas (link do rodapé dos e-mails). */
export const POST = storeRoute(
  async (req) => {
    const b = await readJson<{ email?: string; token?: string }>(req, 2000);
    if (!b?.email || !b.token) return json({ error: "dados_invalidos" }, 400);
    const ok = await unsubscribe(await getDb(), b.email.toLowerCase(), b.token);
    return ok ? json({ ok: true }) : json({ error: "link_invalido" }, 400);
  },
  { mutate: true },
);
