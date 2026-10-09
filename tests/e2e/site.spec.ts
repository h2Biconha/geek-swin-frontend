import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "./fixtures";

const PAGES = ["/", "/shop", "/product/obsidian-shell-hoodie", "/drops", "/drops/001-insert-coin", "/about", "/help", "/privacy", "/terms", "/checkout", "/account", "/wishlist", "/nao-existe"];

test.describe("acessibilidade (axe, WCAG 2.2 AA)", () => {
  for (const path of PAGES) {
    test(`sem violação séria em ${path}`, async ({ page }) => {
      await page.goto(path);
      await page.waitForLoadState("networkidle");
      const r = await new AxeBuilder({ page } as unknown as ConstructorParameters<typeof AxeBuilder>[0]).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
      const serious = r.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
      expect(serious.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).slice(0, 3).join(" | ")}`)).toEqual([]);
    });
  }
});

test.describe("SEO técnico", () => {
  test("títulos únicos, canonical e um h1 por página", async ({ page }) => {
    const titles = new Set<string>();
    for (const path of PAGES.filter((p) => p !== "/nao-existe" && p !== "/checkout" && p !== "/account" && p !== "/wishlist")) {
      await page.goto(path);
      const title = await page.title();
      expect(title.length).toBeGreaterThan(5);
      expect(titles.has(title), `título repetido: ${title}`).toBe(false);
      titles.add(title);
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", new RegExp(`${path === "/" ? "/?$" : path}$`));
      await expect(page.locator("h1")).toHaveCount(1);
      await expect(page.locator('meta[property="og:title"]')).toHaveCount(1);
    }
  });

  test("produto: JSON-LD Product/Offer/Breadcrumb, sem nota inventada", async ({ page }) => {
    await page.goto("/product/obsidian-shell-hoodie");
    const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
    const ld = blocks.map((b) => JSON.parse(b));
    const product = ld.find((x) => x["@type"] === "Product");
    expect(product.offers.price).toBe("389.90");
    expect(product.offers.priceCurrency).toBe("BRL");
    expect(product.aggregateRating).toBeUndefined();
    expect(product.review).toBeUndefined();
    expect(ld.some((x) => x["@type"] === "BreadcrumbList")).toBe(true);
    expect(ld.some((x) => x["@type"] === "Organization")).toBe(true);
  });

  test("robots e sitemap", async ({ request }) => {
    const robots = await (await request.get("/robots.txt")).text();
    expect(robots).toContain("Disallow: /checkout");
    expect(robots).toContain("Disallow: /admin");
    const sitemap = await (await request.get("/sitemap.xml")).text();
    expect(sitemap).toContain("/product/obsidian-shell-hoodie");
    expect(sitemap).not.toContain("/members");
  });

  test("página inexistente responde 404 e não indexa", async ({ page }) => {
    const r = await page.goto("/nao-existe");
    expect(r?.status()).toBe(404);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  });
});

test.describe("busca", () => {
  test("atalho /, sem resultado, Enter leva para a loja filtrada", async ({ page }) => {
    await page.goto("/");
    await page.keyboard.press("/");
    const box = page.getByRole("dialog", { name: "Buscar" });
    await expect(box).toBeVisible();
    await page.keyboard.type("zzzqqq");
    await expect(box.getByText(/Nada com “zzzqqq”/)).toBeVisible();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/shop\?q=zzzqqq/);
    await expect(page.getByText(/Nada encontrado para “zzzqqq”/)).toBeVisible();
  });

  test("resultado real e Esc fecha devolvendo o foco", async ({ page }) => {
    await page.goto("/shop");
    const trigger = page.getByRole("button", { name: /Buscar/ }).first();
    await trigger.click();
    await page.keyboard.type("hoodie");
    await expect(page.getByRole("dialog", { name: "Buscar" }).getByRole("link", { name: /Obsidian/ }).first()).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog", { name: "Buscar" })).toHaveCount(0);
    await expect(trigger).toBeFocused();
  });
});

test.describe("teclado", () => {
  test("pular para o conteúdo", async ({ page }) => {
    await page.goto("/shop");
    await page.keyboard.press("Tab");
    const skip = page.getByRole("link", { name: "Pular para o conteúdo" });
    await expect(skip).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.locator("#conteudo")).toBeFocused();
  });

  test("tamanho com setas, bag abre e fecha com Esc", async ({ page }) => {
    await page.goto("/product/ggwp-core-tee");
    const group = page.getByRole("radiogroup");
    await group.getByRole("radio").first().focus();
    await page.keyboard.press("ArrowRight");
    await expect(group.getByRole("radio", { name: "M" })).toHaveAttribute("aria-checked", "true");
    await expect(group.getByRole("radio", { name: "M" })).toBeFocused();
    await page.getByRole("button", { name: /Adicionar à bag/ }).press("Enter");
    const bag = page.getByRole("dialog", { name: /Bag/ });
    await expect(bag).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(bag).toBeHidden();
  });
});

test.describe("loja", () => {
  test("filtro e ordenação ficam na URL e sobrevivem ao recarregar", async ({ page }) => {
    await page.goto("/shop?categoria=camisetas&ordem=menor");
    await page.reload();
    await expect(page).toHaveURL(/categoria=camisetas/);
    const prices = (await page.locator("main span", { hasText: /^Preço: R\$/ }).allTextContents()).map((t) => Number(t.replace(/[^\d,]/g, "").replace(",", ".")));
    expect(prices.length).toBeGreaterThan(0);
    expect([...prices].sort((x, y) => x - y)).toEqual(prices);
  });

  test("sem horizontal scroll de 375 a 1920 px", async ({ page }) => {
    for (const w of [375, 768, 1024, 1440, 1920]) {
      await page.setViewportSize({ width: w, height: 900 });
      for (const path of ["/", "/shop", "/product/obsidian-shell-hoodie", "/drops/001-insert-coin", "/checkout"]) {
        await page.goto(path);
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
        expect(overflow, `${path} em ${w}px`).toBeLessThanOrEqual(0);
      }
    }
  });
});

test("lista do drop grava de verdade e responde 'já estava' na segunda vez", async ({ page }) => {
  await page.goto("/about");
  const form = page.locator("#lista");
  await form.getByLabel("Seu e-mail").fill("lista@exemplo.com");
  await form.getByRole("checkbox").check();
  await form.getByRole("button", { name: "Entrar na lista" }).click();
  await expect(form.getByText("Você está na lista.")).toBeVisible();
  await page.reload();
  await page.locator("#lista").getByLabel("Seu e-mail").fill("lista@exemplo.com");
  await page.locator("#lista").getByRole("checkbox").check();
  await page.locator("#lista").getByRole("button", { name: "Entrar na lista" }).click();
  await expect(page.locator("#lista").getByText("Você já estava na lista.")).toBeVisible();
});
