import { defineConfig, devices } from "@playwright/test";

/**
 * E2E no navegador de verdade, contra o build de produção em MODO TESTE:
 * banco PGlite novo a cada execução, gateway "mock" (nenhuma cobrança), e-mail só no terminal.
 *   npm run e2e
 */
const PORT = 3100;
const env = {
  NEXT_PUBLIC_STORE_MODE: "test",
  NEXT_PUBLIC_SITE_URL: `http://localhost:${PORT}`,
  PAYMENT_PROVIDER: "mock",
  APP_SECRET: "e2e-secret-0123456789-0123456789-abcdef",
  EMAIL_PROVIDER: "console",
  ADMIN_PASSWORD: "e2e-admin-password",
  LOCAL_DB_PATH: ".data/e2e",
};

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    locale: "pt-BR",
    timezoneId: "America/Sao_Paulo",
    trace: "retain-on-failure",
    launchOptions: process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : undefined,
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] }, testIgnore: /mobile\.spec\.ts/ },
    { name: "mobile", use: { ...devices["Pixel 7"] }, testMatch: /mobile\.spec\.ts/ },
  ],
  webServer: {
    command: `rm -rf .data/e2e && next build && next start -p ${PORT}`,
    url: `http://localhost:${PORT}/api/health`,
    timeout: 300_000,
    reuseExistingServer: !process.env.CI,
    env,
  },
});
