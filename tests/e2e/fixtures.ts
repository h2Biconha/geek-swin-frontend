import { test as base, expect, type Page } from "@playwright/test";

/** Toda página falha o teste se houver erro no console ou exceção não tratada. */
export const test = base.extend<{ errors: string[] }>({
  errors: [
    async ({ page }, use) => {
      const errors: string[] = [];
      page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
      page.on("console", (m) => {
        if (m.type() !== "error") return;
        const t = m.text();
        // recursos externos bloqueados no ambiente de teste não são erro do site
        if (/fonts\.g|viacep|Failed to load resource: net::ERR_/.test(t)) return;
        // a própria página 404 responde 404 (esperado)
        if (/status of 404/.test(t) && /\/nao-existe/.test(m.location().url)) return;
        errors.push(`console: ${t}`);
      });
      // CEP: nada de rede externa nos testes
      await page.route("https://viacep.com.br/**", (r) => r.abort());
      await use(errors);
      expect(errors, "erros no console").toEqual([]);
    },
    { auto: true },
  ],
});
export { expect };

export async function addToBag(page: Page, slug: string, size: string) {
  await page.goto(`/product/${slug}`);
  await page.getByRole("radiogroup").getByRole("radio", { name: new RegExp(`^${size}\\b`) }).check();
  await page.getByRole("button", { name: /Adicionar à bag|Garantir na pré-venda/ }).click();
}

export async function adminLogin(page: Page) {
  const r = await page.request.post("/api/admin/session", { data: { password: "e2e-admin-password" }, headers: { origin: new URL(page.url() === "about:blank" ? "http://localhost:3100" : page.url()).origin } });
  expect(r.ok()).toBeTruthy();
}
