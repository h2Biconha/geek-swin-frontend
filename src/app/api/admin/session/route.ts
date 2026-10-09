import { ADMIN_COOKIE, adminToken, checkAdminPassword } from "@/server/auth";
import { getDb } from "@/server/db";
import { env } from "@/server/env";
import { storeRoute } from "@/server/http";
import { ipKey, json, rateLimit, readJson } from "@/server/security";

/** POST /api/admin/session { password } → cookie de 12 h. DELETE → sai. */
export const POST = storeRoute(
  async (req) => {
    if (!env.adminPassword) return json({ error: "admin_desligado", message: "Defina ADMIN_PASSWORD para usar o painel." }, 503);
    if (!(await rateLimit(await getDb(), `admin:${ipKey(req)}`, 8, 900))) return json({ error: "limite", message: "Muitas tentativas." }, 429);
    const b = await readJson<{ password?: string }>(req, 1000);
    if (!b?.password || !checkAdminPassword(b.password)) return json({ error: "senha", message: "Senha incorreta." }, 401);
    const res = json({ ok: true });
    res.headers.append("Set-Cookie", `${ADMIN_COOKIE}=${adminToken()}; Path=/; Max-Age=43200; HttpOnly; SameSite=Strict${env.siteUrl.startsWith("https") ? "; Secure" : ""}`);
    return res;
  },
  { mutate: true },
);
export const DELETE = storeRoute(
  async () => {
    const res = json({ ok: true });
    res.headers.append("Set-Cookie", `${ADMIN_COOKIE}=; Path=/; Max-Age=0; HttpOnly; SameSite=Strict`);
    return res;
  },
  { mutate: true },
);
