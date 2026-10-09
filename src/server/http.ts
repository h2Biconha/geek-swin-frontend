import "server-only";
import { configProblems, env } from "./env";
import { json, sameOrigin } from "./security";

/**
 * Envelopa as rotas da loja: modo prévia/config incompleta → 503 com motivo; erro inesperado → 500
 * sem detalhes internos; rotas que mudam estado exigem a mesma origem (CSRF).
 */
export function storeRoute<C = unknown>(handler: (req: Request, ctx: C) => Promise<Response>, opts: { mutate?: boolean } = {}) {
  return async (req: Request, ctx: C) => {
    if (env.mode === "preview") return json({ error: "loja_offline", message: "A loja está em modo prévia: nada é salvo nem cobrado." }, 503);
    const problems = configProblems();
    if (problems.length) {
      console.error(`[config] loja sem condição de operar: ${problems.join(" | ")}`);
      return json({ error: "loja_offline", message: "A loja está temporariamente fora do ar. Nada foi cobrado." }, 503);
    }
    if (opts.mutate && !sameOrigin(req)) return json({ error: "origem_invalida", message: "Requisição recusada." }, 403);
    try {
      return await handler(req, ctx);
    } catch (e) {
      console.error(`[api] ${new URL(req.url).pathname}: ${(e as Error).message}`);
      return json({ error: "erro", message: "Algo deu errado do nosso lado. Nada foi cobrado. Tente de novo." }, 500);
    }
  };
}
