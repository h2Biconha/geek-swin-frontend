import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const r = (p: string) => fileURLToPath(new URL(p, import.meta.url));

/** Unidade e integração (banco PGlite em memória, gateway "mock"). E2E fica no Playwright (tests/e2e). */
export default defineConfig({
  resolve: { alias: { "@": r("./src"), "server-only": r("./scripts/empty.mjs") } },
  test: {
    include: ["tests/unit/**/*.test.ts", "tests/integration/**/*.test.ts"],
    environment: "node",
    testTimeout: 30_000,
    hookTimeout: 60_000,
    env: {
      NEXT_PUBLIC_STORE_MODE: "test",
      NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
      PAYMENT_PROVIDER: "mock",
      APP_SECRET: "test-secret-0123456789-0123456789-abcdef",
      MERCADOPAGO_WEBHOOK_SECRET: "whsec-test",
      EMAIL_PROVIDER: "console",
      ADMIN_PASSWORD: "admin-test-password",
      DB_AUTO_MIGRATE: "true",
    },
  },
});
