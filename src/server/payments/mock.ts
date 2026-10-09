import "server-only";
import { env } from "../env";
import type { PaymentProvider } from "./types";

/**
 * Provedor de TESTE. Só existe com NEXT_PUBLIC_STORE_MODE=test e nunca cobra nada.
 * O pagamento é aprovado ou recusado pelos botões da página do pedido (rota /api/dev/mock-payment),
 * que passam pelo MESMO caminho de confirmação do webhook real.
 */
export const mockProvider: PaymentProvider = {
  id: "mock",
  async createPayment(o) {
    if (env.mode !== "test") throw new Error("mock só em modo teste");
    if (o.method === "pix")
      return { providerRef: `MOCK-${o.id}`, pix: { copyPaste: `00020126TESTE-GEEKSWIM-${o.id}-SEM-VALOR`, qrCodeBase64: null, ticketUrl: null, expiresAt: o.expiresAt.toISOString() } };
    return { providerRef: `MOCK-${o.id}`, redirectUrl: `${env.siteUrl}/order/${o.id}?t=${o.accessToken}&teste=cartao` };
  },
  async parseWebhook() {
    return "ignore";
  },
  async fetchUpdate() {
    return null;
  },
  async reconcile() {
    return null;
  },
};
