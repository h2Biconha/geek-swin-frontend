/** Níveis do GEEK LEVEL e conta de exemplo (prévia). Sem "use client": usado também no servidor. */
export const LEVELS = [
  { n: "01", name: "PLAYER", rule: "Criou a conta.", perks: ["Aviso de drop por e-mail", "Wishlist sincronizada"] },
  { n: "02", name: "MEMBER", rule: "Primeira compra entregue.", perks: ["Acesso 1 h antes de cada drop", "Pré-venda garantida"] },
  { n: "03", name: "OG", rule: "Peças de 3 drops diferentes.", perks: ["Drops secretos", "Código de aniversário"] },
  { n: "04", name: "LEGEND", rule: "6 drops ou convite da marca.", perks: ["Peças especiais numeradas 001", "Experiências e eventos"] },
] as const;

export type DemoOrder = { id: string; date: string; status: string; items: { slug: string; size: string }[]; total: number };
export const DEMO_ACCOUNT = {
  name: "Player de exemplo",
  email: "voce@exemplo.com",
  level: 1, // índice em LEVELS
  dropsOwned: ["001"],
  orders: [{ id: "GS-000127", date: "2026-10-08", status: "Pré-venda · envio a partir de 14/10", items: [{ slug: "obsidian-shell-hoodie", size: "G" }], total: 389.9 }] as DemoOrder[],
  addresses: [{ label: "Casa", line: "Rua de Exemplo, 100 · São Paulo, SP · 01000-000" }],
};

