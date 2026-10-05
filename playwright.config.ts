/**
 * Teste ponta a ponta: webhook → /personalizar → PDF → download, em viewports mobile.
 * Requer um Postgres de teste: E2E_DATABASE_URL=postgres://... npx playwright test
 */
import { defineConfig, devices } from "@playwright/test";

const PORT = 3100;
export const E2E_ENV = {
  DATABASE_URL: process.env.E2E_DATABASE_URL ?? "postgres://postgres@localhost:5544/tesouro_dev",
  CHECKOUT_PRODUCT_ID: "prod_e2e",
  CHECKOUT_WEBHOOK_SECRET: "e2e-secret",
  APP_URL: `http://localhost:${PORT}`,
  // Usa os kits definitivos de ./kits (padrão).
  EMAIL_HOST: "",
};

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 60_000,
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    launchOptions: process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : undefined,
  },
  projects: [{ name: "mobile", use: { ...devices["iPhone 13"], browserName: "chromium" } }],
  webServer: {
    command: `npx tsx scripts/migrate.ts && npx next start -p ${PORT}`,
    url: `http://localhost:${PORT}/personalizar`,
    reuseExistingServer: false,
    timeout: 120_000,
    env: E2E_ENV,
  },
});
