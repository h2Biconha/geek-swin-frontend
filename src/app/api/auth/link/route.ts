import { isValidEmail } from "@/lib/validate";
import { requestLoginLink } from "@/server/auth";
import { getDb } from "@/server/db";
import { storeRoute } from "@/server/http";
import { ipKey, json, rateLimit, readJson, sha256 } from "@/server/security";

/** POST /api/auth/link { email, next } → envia o link de acesso. Mesma resposta exista a conta ou não. */
export const POST = storeRoute(
  async (req) => {
    const b = await readJson<{ email?: string; next?: string }>(req, 2000);
    const email = b?.email?.trim().toLowerCase() ?? "";
    if (!isValidEmail(email)) return json({ error: "email_invalido", message: "Confere o e-mail." }, 400);
    const db = await getDb();
    const okIp = await rateLimit(db, `login-ip:${ipKey(req)}`, 10, 3600);
    const okMail = await rateLimit(db, `login-mail:${sha256(email).slice(0, 24)}`, 4, 3600);
    if (!okIp || !okMail) return json({ error: "limite", message: "Muitos pedidos de link. Espere um pouco e confira sua caixa de entrada." }, 429);
    const devLink = await requestLoginLink(db, email, b?.next ?? "/account");
    return json(devLink ? { ok: true, devLink } : { ok: true });
  },
  { mutate: true },
);
