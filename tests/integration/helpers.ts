import { connectPglite, migrate, setDbForTests, type Db } from "@/server/db";
import { syncCatalog } from "@/server/inventory";
import type { CheckoutInput } from "@/server/validation";

/** Banco Postgres em memória (PGlite), migrado e sincronizado com o catálogo. */
export async function freshDb(): Promise<Db> {
  const db = await connectPglite();
  await migrate(db);
  await syncCatalog(db);
  setDbForTests(db);
  return db;
}

export const ORIGIN = "http://localhost:3000";

export function checkoutInput(items: { slug: string; size: string; qty: number }[], over: Partial<CheckoutInput> = {}): CheckoutInput {
  return {
    items,
    customer: { email: "teste@exemplo.com", name: "Pessoa Teste", cpf: "52998224725", phone: "11912345678" },
    address: { cep: "01310100", street: "Av. Paulista", number: "1000", complement: "", district: "Bela Vista", city: "São Paulo", state: "SP" },
    shippingId: "economico",
    payment: { method: "pix" },
    accept: true,
    ...over,
  };
}

export function post(path: string, body: unknown, headers: Record<string, string> = {}) {
  return new Request(`${ORIGIN}${path}`, { method: "POST", headers: { "content-type": "application/json", origin: ORIGIN, ...headers }, body: JSON.stringify(body) });
}
