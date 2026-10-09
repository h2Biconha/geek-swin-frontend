import { configProblems, env } from "@/server/env";
import { json } from "@/server/security";

/** GET /api/health → modo da loja e o que falta configurar (sem nenhum valor secreto). */
export function GET() {
  const problems = configProblems();
  return json({ mode: env.mode, ready: env.mode !== "preview" && problems.length === 0, payment: env.payment, shipping: env.shipping, email: env.email, database: env.databaseUrl ? "postgres" : env.mode === "preview" ? "nenhum" : "local (PGlite)", problems });
}
