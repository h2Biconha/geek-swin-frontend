import { expect, test } from "./fixtures";

test.describe("navegação", () => {
  test("mega menu abre pelo teclado, leva à categoria e fecha com Esc devolvendo o foco", async ({ page }) => {
    await page.goto("/");
    const loja = page.getByRole("navigation", { name: "Principal" }).getByRole("button", { name: /Loja/ });
    await loja.focus();
    await page.keyboard.press("Enter");
    await expect(loja).toHaveAttribute("aria-expanded", "true");
    const cats = page.getByRole("navigation", { name: "Categorias" });
    await expect(cats.getByRole("link", { name: /Camisetas/ })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(loja).toHaveAttribute("aria-expanded", "false");
    await expect(loja).toBeFocused();
    await loja.click();
    await cats.getByRole("link", { name: /Calças/ }).click();
    await expect(page).toHaveURL(/\/shop\/calcas$/);
    await expect(page.getByRole("heading", { level: 1, name: "Calças" })).toBeVisible();
  });

  test("categoria com peças: SEO próprio, breadcrumb e grade; vazia: noindex e estado vazio sem peça falsa", async ({ page }) => {
    await page.goto("/shop/camisetas");
    await expect(page).toHaveTitle(/Camisetas/);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /\/shop\/camisetas$/);
    await expect(page.locator('meta[name="robots"][content*="noindex"]')).toHaveCount(0);
    await expect(page.getByRole("navigation", { name: "Trilha" })).toBeVisible();
    expect(await page.getByRole("region", { name: "Peças" }).getByRole("heading", { level: 3 }).count()).toBeGreaterThan(0);
    // filtro não vira página indexada: canonical continua sem query
    await page.goto("/shop/camisetas?tamanho=M&ordem=menor");
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /\/shop\/camisetas$/);

    await page.goto("/shop/bermudas");
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
    await expect(page.getByRole("region", { name: "Peças" })).toHaveCount(0);
    await expect(page.getByRole("textbox", { name: /e-mail/i }).first()).toBeVisible();
  });

  test("sitemap lista categorias com peças e não lista as vazias", async ({ request }) => {
    const xml = await (await request.get("/sitemap.xml")).text();
    expect(xml).toContain("/shop/camisetas");
    expect(xml).toContain("/loadout");
    expect(xml).not.toContain("/shop/bermudas");
    expect(xml).not.toContain("/shop/sale");
  });
});

test.describe("venda casada", () => {
  test("Complete o look: adiciona as peças escolhidas de uma vez, sem duplicar", async ({ page }) => {
    await page.goto("/product/ggwp-core-tee");
    const look = page.getByRole("region", { name: "Complete o look" });
    const addAll = look.getByRole("button", { name: /^Adicionar \d peças/ });
    await expect(addAll).toBeEnabled();
    const n = Number((await addAll.textContent())!.match(/\d+/)![0]);
    // tamanho nunca é chutado: sem escolher, avisa e não adiciona
    await addAll.click();
    await expect(look.getByText(/Escolha o tamanho/)).toBeVisible();
    await expect(page.getByRole("button", { name: /^Bag, 0 ite/ })).toBeVisible();
    for (const sel of await look.getByRole("combobox", { name: /^Tamanho de/ }).all()) await sel.selectOption({ index: 1 });
    await addAll.click();
    await expect(page.getByRole("button", { name: new RegExp(`^Bag, ${n} ite`) })).toBeVisible();
    // de novo: o que já está na bag não entra duplicado
    await page.reload();
    await expect(page.getByRole("button", { name: new RegExp(`^Bag, ${n} ite`) })).toBeVisible();
  });

  test("Loadout: monta a partir de um look, mostra o total e leva tudo para a bag", async ({ page }) => {
    await page.goto("/loadout?look=001-03");
    const summary = page.getByRole("complementary", { name: "Resumo do loadout" });
    const add = summary.getByRole("button", { name: /^Adicionar \d+ à bag/ });
    await expect(add).toBeEnabled();
    for (const sel of await page.getByRole("combobox", { name: /^Tamanho de/ }).all()) await sel.selectOption({ index: 1 });
    const n = Number((await add.textContent())!.match(/Adicionar (\d+)/)![1]);
    expect(n).toBeGreaterThanOrEqual(2);
    await add.click();
    await expect(page.getByRole("button", { name: new RegExp(`^Bag, ${n} ite`) })).toBeVisible();
  });

  test("bag: barra de benefício só com regra configurada e sugestões sem repetir o que já está nela", async ({ page }) => {
    await page.goto("/product/ggwp-core-tee");
    await page.getByRole("radiogroup", { name: /^Tamanho/ }).getByRole("radio", { name: /^M\b/ }).check();
    await page.getByRole("button", { name: /Adicionar à bag/ }).click();
    const bag = page.getByRole("dialog", { name: /Bag/ });
    await expect(bag).toBeVisible();
    await expect(bag.getByRole("progressbar")).toBeVisible();
    const sug = bag.getByRole("region", { name: "Também combina com" });
    await expect(sug).toBeVisible();
    await expect(sug.getByText("GG/WP Core Tee")).toHaveCount(0);
  });

  test("favoritos continuam salvos depois de recarregar", async ({ page }) => {
    await page.goto("/product/void-wide-pant");
    await page.getByRole("button", { name: /Salvar Void Wide Pant na wishlist/ }).first().click();
    await page.goto("/wishlist");
    await page.reload();
    await expect(page.getByRole("heading", { name: "Void Wide Pant" })).toBeVisible();
  });
});
