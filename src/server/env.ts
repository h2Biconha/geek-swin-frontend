import "server-only";
import { STORE_MODE } from "@/lib/mode";

/**
 * Configuração do servidor, lida uma vez. Nada aqui vai para o navegador.
 * Lista completa e explicação de cada variável em .env.example e BACKEND.md.
 */
const str = (k: string) => {
  const v = process.env[k]?.trim();
  return v ? v : undefined;
};

export type PaymentProviderId = "mercadopago" | "mock";
export type ShippingProviderId = "table" | "melhorenvio";
export type EmailProviderId = "console" | "resend";

export const env = {
  mode: STORE_MODE,
  siteUrl: (str("NEXT_PUBLIC_SITE_URL") ?? "http://localhost:3000").replace(/\/$/, ""),
  databaseUrl: str("DATABASE_URL"),
  /** caminho do banco local (PGlite) quando não há DATABASE_URL. Só em preview/test. */
  localDbPath: str("LOCAL_DB_PATH") ?? ".data/pglite",
  autoMigrate: str("DB_AUTO_MIGRATE") !== "false",
  appSecret: str("APP_SECRET"),
  payment: (str("PAYMENT_PROVIDER") ?? (STORE_MODE === "live" ? "mercadopago" : "mock")) as PaymentProviderId,
  mpAccessToken: str("MERCADOPAGO_ACCESS_TOKEN"),
  mpWebhookSecret: str("MERCADOPAGO_WEBHOOK_SECRET"),
  mpStatementDescriptor: str("MERCADOPAGO_STATEMENT_DESCRIPTOR") ?? "GEEKSWIM",
  shipping: (str("SHIPPING_PROVIDER") ?? "table") as ShippingProviderId,
  melhorEnvioToken: str("MELHORENVIO_TOKEN"),
  melhorEnvioSandbox: str("MELHORENVIO_SANDBOX") !== "false",
  shipFromCep: str("SHIP_FROM_CEP"),
  email: (str("EMAIL_PROVIDER") ?? "console") as EmailProviderId,
  resendKey: str("RESEND_API_KEY"),
  emailFrom: str("EMAIL_FROM") ?? "GEEK SWIM <pedidos@geekswim.com.br>",
  adminPassword: str("ADMIN_PASSWORD"),
  /** e-mail que recebe alerta de pedido pago e de pedido que precisa de revisão */
  adminEmail: str("ADMIN_EMAIL"),
};

/** Problemas de configuração que impedem vender. Vazio = pode operar. */
export function configProblems(): string[] {
  const p: string[] = [];
  if (env.mode === "preview") return ["Loja em modo prévia (NEXT_PUBLIC_STORE_MODE)."];
  if (env.mode === "live") {
    if (!env.databaseUrl) p.push("DATABASE_URL é obrigatória em produção.");
    if (!env.appSecret || env.appSecret.length < 32) p.push("APP_SECRET precisa de 32+ caracteres.");
    if (env.payment !== "mercadopago") p.push('PAYMENT_PROVIDER precisa ser "mercadopago" em produção.');
    if (env.email !== "resend" || !env.resendKey) p.push("E-mail transacional (RESEND_API_KEY) é obrigatório em produção.");
    if (!env.siteUrl.startsWith("https://")) p.push("NEXT_PUBLIC_SITE_URL precisa ser https em produção.");
  }
  if (env.payment === "mercadopago") {
    if (!env.mpAccessToken) p.push("MERCADOPAGO_ACCESS_TOKEN não definido.");
    if (!env.mpWebhookSecret) p.push("MERCADOPAGO_WEBHOOK_SECRET não definido.");
  }
  if (env.shipping === "melhorenvio" && (!env.melhorEnvioToken || !env.shipFromCep)) p.push("Melhor Envio precisa de MELHORENVIO_TOKEN e SHIP_FROM_CEP.");
  if (env.email === "resend" && !env.resendKey) p.push("RESEND_API_KEY não definido.");
  return p;
}

let devSecret: string | undefined;
/** Segredo para assinar sessões. Em teste sem APP_SECRET, gera um por processo (sessões caem ao reiniciar). */
export function secret(): string {
  if (env.appSecret) return env.appSecret;
  if (env.mode === "live") throw new Error("APP_SECRET ausente");
  devSecret ??= crypto.randomUUID() + crypto.randomUUID();
  return devSecret;
}
