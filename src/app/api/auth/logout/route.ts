import { endSession, SESSION_COOKIE } from "@/server/auth";
import { getDb } from "@/server/db";
import { storeRoute } from "@/server/http";
import { json } from "@/server/security";

export const POST = storeRoute(
  async () => {
    await endSession(await getDb());
    const res = json({ ok: true });
    res.headers.append("Set-Cookie", `${SESSION_COOKIE}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax`);
    return res;
  },
  { mutate: true },
);
