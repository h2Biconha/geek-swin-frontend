import { expect, test } from "./fixtures";

test("celular: barra fixa de compra aparece ao rolar", async ({ page }) => {
  await page.goto("/product/ggwp-core-tee");
  await expect(page.getByRole("button", { name: "Escolher tamanho" })).toBeHidden();
  await page.evaluate(() => window.scrollTo(0, 1400));
  await expect(page.getByRole("button", { name: "Escolher tamanho" })).toBeVisible();
});

test("celular: menu abre com as categorias da loja", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Abrir menu" }).click();
  const nav = page.getByRole("navigation", { name: "Menu do celular" });
  await expect(nav.getByRole("button", { name: /Loja/ })).toHaveAttribute("aria-expanded", "true");
  await nav.getByRole("link", { name: "Camisetas" }).click();
  await expect(page).toHaveURL(/\/shop\/camisetas$/);
  await expect(page.getByRole("dialog", { name: "Menu" })).toBeHidden();
});

test("celular: filtros da categoria abrem em gaveta e o Loadout cabe na tela", async ({ page }) => {
  await page.goto("/shop/calcas");
  await page.getByRole("button", { name: /Filtrar/ }).click();
  await expect(page.getByRole("dialog", { name: /Filtr/ })).toBeVisible();
  await page.keyboard.press("Escape");
  await page.goto("/loadout");
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});
