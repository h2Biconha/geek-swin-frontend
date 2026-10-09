import { expect, test } from "./fixtures";

test("celular: barra fixa de compra aparece ao rolar e o menu abre", async ({ page }) => {
  await page.goto("/product/ggwp-core-tee");
  await page.mouse.wheel(0, 1400);
  await expect(page.getByRole("button", { name: "Escolher tamanho" })).toBeVisible();
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.getByRole("button", { name: "Abrir menu" }).click();
  await expect(page.getByRole("navigation", { name: "Menu do celular" }).getByRole("link", { name: /Loja/ })).toBeVisible();
});
