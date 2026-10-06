import { expect, test, type Page } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { PDFDocument } from "pdf-lib";
import fs from "node:fs";
import { E2E_ENV } from "../../playwright.config";

const WIDTHS = [375, 390, 393, 414, 430];

async function payWebhook(request: import("@playwright/test").APIRequestContext, email: string, event = "pix.paid") {
  const paymentId = `e2e_${randomUUID()}`;
  const res = await request.post("/api/webhooks/checkout", {
    headers: { Authorization: `Bearer ${E2E_ENV.CHECKOUT_WEBHOOK_SECRET}` },
    data: {
      event,
      payment: { id: paymentId, status: "paid", amount: 2790 },
      product: { id: E2E_ENV.CHECKOUT_PRODUCT_ID, type: "main" },
      customer: { name: "Cliente E2E", email },
    },
  });
  expect(res.status()).toBe(200);
  return paymentId;
}

async function noHorizontalScroll(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
}

const CASES = [
  { theme: "dinossauros", label: "Dinossauros", name: "Miguel", file: "o-tesouro-de-miguel.pdf" },
  { theme: "espaco", label: "Espaço", name: "João Pedro", file: "o-tesouro-de-joao-pedro.pdf" },
  { theme: "futebol", label: "Futebol", name: "Ana", file: "o-tesouro-de-ana.pdf" },
  { theme: "princesas", label: "Princesas", name: "Maria Eduarda", file: "o-tesouro-de-maria-eduarda.pdf" },
  { theme: "fadas", label: "Fadas", name: "Ana Clara", file: "o-tesouro-de-ana-clara.pdf" },
  { theme: "sereias", label: "Sereias", name: "Lívia", file: "o-tesouro-de-livia.pdf" },
];

for (const c of CASES) {
  test(`compra → ${c.label} → ${c.name} → PDF → reabrir`, async ({ page, request }, info) => {
    const email = `e2e+${randomUUID().slice(0, 8)}@teste.com`;
    await payWebhook(request, email, c.theme === "espaco" ? "card.paid" : "pix.paid");

    await page.goto("/personalizar");
    await expect(page.getByRole("heading", { name: "Vamos localizar sua compra" })).toBeVisible();
    await page.getByLabel("E-mail usado na compra").fill(email);
    await page.getByRole("button", { name: "CONTINUAR" }).click();

    await expect(page.getByRole("heading", { name: "🎉 Parabéns pela sua compra!" })).toBeVisible();
    await expect(page.getByText("Pagamento confirmado")).toBeVisible();
    const cta = page.getByRole("button", { name: "PREPARAR MINHA AVENTURA" });
    await expect(cta).toBeDisabled();
    await page.screenshot({ path: info.outputPath(`form-${c.theme}.png`), fullPage: true });

    await page.getByRole("radio", { name: c.label }).check({ force: true });
    await expect(page.getByRole("radio", { name: c.label })).toBeChecked();
    await expect(cta).toBeDisabled();
    await page.getByLabel("Nome da criança").fill(`  ${c.name}  `);
    await expect(page.getByLabel("Resumo da sua aventura")).toContainText(c.name);
    await expect(page.getByLabel("Resumo da sua aventura")).toContainText(c.label);
    await expect(cta).toBeEnabled();
    await page.screenshot({ path: info.outputPath(`filled-${c.theme}.png`), fullPage: true });

    for (const w of WIDTHS) {
      await page.setViewportSize({ width: w, height: 800 });
      await noHorizontalScroll(page);
    }

    await cta.dblclick();
    await expect(page.getByRole("heading", { name: "Sua aventura está pronta!" })).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText(`O Tesouro de ${c.name} está preparado.`)).toBeVisible();
    await expect(page.getByText("Também enviamos uma cópia")).toHaveCount(0); // e-mail desativado no E2E
    await page.screenshot({ path: info.outputPath(`ready-${c.theme}.png`), fullPage: true });

    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("link", { name: "BAIXAR MINHA AVENTURA" }).click(),
    ]);
    expect(download.suggestedFilename()).toBe(c.file);
    const pdfPath = info.outputPath(c.file);
    await download.saveAs(pdfPath);
    const pdf = await PDFDocument.load(fs.readFileSync(pdfPath));
    expect(pdf.getPageCount()).toBe(4);
    expect(pdf.getTitle()).toBe(`O Tesouro de ${c.name}`);

    // Guia do responsável (PDF de 1 página do mesmo tema).
    const [guide] = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("link", { name: /guia de preparação/i }).click(),
    ]);
    expect(guide.suggestedFilename()).toBe(c.file.replace("o-tesouro-de-", "guia-do-responsavel-"));

    // Refresh: não volta ao formulário.
    await page.reload();
    await expect(page.getByRole("heading", { name: "Sua aventura já está pronta." })).toBeVisible();

    // Reabrir pelo link (como o do e-mail) em outro contexto, sem localStorage.
    const url = page.url();
    expect(url).toContain("?t=");
    const fresh = await page.context().browser()!.newContext();
    const p2 = await fresh.newPage();
    await p2.goto(url);
    await expect(p2.getByRole("heading", { name: "Sua aventura já está pronta." })).toBeVisible();
    await fresh.close();
  });
}

test("e-mail sem compra mostra tela de não encontrado", async ({ page }) => {
  test.setTimeout(60_000);
  await page.goto("/personalizar");
  await page.getByLabel("E-mail usado na compra").fill(`naocomprou+${randomUUID().slice(0, 6)}@teste.com`);
  await page.getByRole("button", { name: "CONTINUAR" }).click();
  await expect(page.getByText("Validando sua compra...")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Não conseguimos localizar uma compra aprovada." })).toBeVisible({ timeout: 20_000 });
  await expect(page.getByText("Pagamento confirmado")).toHaveCount(0);
  await page.screenshot({ path: test.info().outputPath("not-found.png"), fullPage: true });
  await page.getByRole("button", { name: "Tentar novamente" }).click();
  await expect(page.getByLabel("E-mail usado na compra")).toBeVisible();
});

test("link com token inválido não libera nada", async ({ page }) => {
  await page.goto("/personalizar?t=" + "A".repeat(43));
  await expect(page.getByRole("heading", { name: "Não conseguimos localizar uma compra aprovada." })).toBeVisible();
  const res = await page.request.get("/api/download/" + "A".repeat(43));
  expect(res.status()).toBe(404);
});
