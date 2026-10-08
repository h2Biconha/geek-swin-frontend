/**
 * POST /api/subscribe: NÃO IMPLEMENTADO (responde 501).
 * Contrato em BACKEND.md > Lista de e-mails. Para ligar no site, implemente aqui e defina
 * NEXT_PUBLIC_SUBSCRIBE_URL=/api/subscribe no .env.local.
 */
export function POST() {
  return Response.json({ error: "not_connected", message: "Lista ainda não conectada (ver BACKEND.md)." }, { status: 501 });
}
