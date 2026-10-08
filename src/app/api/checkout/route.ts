/**
 * POST /api/checkout: NÃO IMPLEMENTADO (responde 501).
 * Fluxo, validações e resposta esperada em BACKEND.md > Checkout. O adaptador do gateway fica em
 * src/lib/commerce/providers/. Para ligar no site: NEXT_PUBLIC_CHECKOUT_URL=/api/checkout.
 */
export function POST() {
  return Response.json({ error: "not_connected", message: "Checkout ainda não conectado (ver BACKEND.md)." }, { status: 501 });
}
