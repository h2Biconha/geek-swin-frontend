import { NextResponse } from "next/server";
import { consumeLoginToken, sessionCookie } from "@/server/auth";
import { getDb } from "@/server/db";
import { env } from "@/server/env";

/** GET /api/auth/callback?token=...&next=/account → cria a sessão e volta para o site. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const next = url.searchParams.get("next") ?? "/account";
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/account";
  const token = url.searchParams.get("token");
  if (env.mode === "preview" || !token) return NextResponse.redirect(new URL("/account?login=invalido", env.siteUrl));
  const session = await consumeLoginToken(await getDb(), token);
  if (!session) return NextResponse.redirect(new URL("/account?login=expirado", env.siteUrl));
  const res = NextResponse.redirect(new URL(safeNext, env.siteUrl));
  res.cookies.set(sessionCookie(session));
  res.headers.set("Cache-Control", "no-store");
  return res;
}
