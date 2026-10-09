import "server-only";
import { env } from "../env";
import { mercadoPago } from "./mercadopago";
import { mockProvider } from "./mock";
import type { PaymentProvider } from "./types";

export function getProvider(): PaymentProvider {
  if (env.payment === "mercadopago") return mercadoPago;
  if (env.payment === "mock" && env.mode === "test") return mockProvider;
  throw new Error(`Gateway "${env.payment}" indisponível no modo ${env.mode}`);
}
export type { PaymentUpdate, WebhookRef } from "./types";
