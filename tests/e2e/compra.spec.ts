import { addToBag, adminLogin, expect, test } from "./fixtures";

const SIZES = ["38", "40", "42", "44", "46"]; // void-wide-pant (catalog.json)

test.describe("compra", () => {
  test("produto → bag → checkout → Pix de teste → pedido pago", async ({ page }) => {
    await addToBag(page, "ggwp-core-tee", "M");
    const bag = page.getByRole("dialog", { name: /Bag · 1/ });
    await expect(bag).toBeVisible();
    await bag.getByRole("link", { name: /Finalizar|checkout/i }).click();

    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await page.locator("#co-email").fill("compra@exemplo.com");
    await page.locator("#co-name").fill("Pessoa Teste");
    await page.locator("#co-cpf").fill("52998224725");
    await page.locator("#co-phone").fill("11912345678");
    await page.getByRole("button", { name: "Continuar para entrega" }).click();

    await page.locator("#co-cep").fill("01310100");
    await page.locator("#co-street").fill("Av. Paulista");
    await page.locator("#co-number").fill("1000");
    await page.locator("#co-district").fill("Bela Vista");
    await page.locator("#co-city").fill("São Paulo");
    await page.locator("#co-state").fill("SP");
    await page.getByRole("radio", { name: /Econômico/ }).check();
    await page.getByRole("button", { name: "Continuar para pagamento" }).click();

    await page.getByRole("radio", { name: /Pix/ }).check();
    await page.locator("#co-accept").check();
    await page.getByRole("button", { name: /Gerar Pix/ }).click();

    await expect(page).toHaveURL(/\/order\/GS-\d{6}\?t=/);
    await expect(page.getByText("Ambiente de teste · nenhuma cobrança real")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Falta pouco." })).toBeVisible();
    await page.getByRole("button", { name: "Simular pagamento aprovado" }).click();
    await expect(page.getByRole("heading", { name: /Pedido confirmado/ })).toBeVisible();

    // recarregar não duplica nada e continua pago
    await page.reload();
    await expect(page.getByRole("heading", { name: /Pedido confirmado/ })).toBeVisible();
  });

  test("peça esgotada: tamanho aparece esgotado e o servidor recusa o pedido", async ({ page }) => {
    await page.goto("/");
    await adminLogin(page);
    for (const size of SIZES) {
      const r = await page.request.patch("/api/admin/inventory", { data: { slug: "void-wide-pant", size, stock: 0 }, headers: { origin: "http://localhost:3100" } });
      expect(r.status()).toBe(200);
    }

    await page.goto("/product/void-wide-pant");
    await expect(page.getByText(/Esgotado · no arquivo/)).toBeVisible();
    await expect(page.getByRole("button", { name: /Adicionar à bag/ })).toHaveCount(0);

    // mesmo forçando a chamada, o servidor não vende
    const r = await page.request.post("/api/checkout", {
      headers: { origin: "http://localhost:3100" },
      data: {
        items: [{ slug: "void-wide-pant", size: SIZES[0], qty: 1 }],
        customer: { email: "x@exemplo.com", name: "Pessoa Teste", cpf: "52998224725", phone: "11912345678" },
        address: { cep: "01310100", street: "Rua", number: "1", district: "Centro", city: "São Paulo", state: "SP" },
        shippingId: "economico",
        payment: { method: "pix" },
        accept: true,
      },
    });
    expect(r.status()).toBe(409);
    expect((await r.json()).error).toBe("sem_estoque");
  });

  test("checkout vazio e formulário inválido mostram erros e levam o foco", async ({ page }) => {
    await page.goto("/checkout");
    await expect(page.getByText(/bag está vazia/i)).toBeVisible();

    await addToBag(page, "ggwp-core-tee", "G");
    await page.goto("/checkout");
    await page.locator("#co-email").fill("nao-e-email");
    await page.locator("#co-cpf").fill("11111111111");
    await page.getByRole("button", { name: "Continuar para entrega" }).click();
    await expect(page.locator("#co-email")).toHaveAttribute("aria-invalid", "true");
    await expect(page.locator("#co-cpf")).toHaveAttribute("aria-invalid", "true");
    await expect(page.locator("#co-email")).toBeFocused();
  });
});
