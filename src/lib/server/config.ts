/**
 * Configuração server-side. NUNCA importar em componentes "use client":
 * nada aqui pode chegar ao JavaScript do navegador.
 */
import path from "node:path";

function env(name: string): string | undefined {
  const value = process.env[name];
  return value && value.trim() !== "" ? value.trim() : undefined;
}

export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  user?: string;
  password?: string;
  from: string;
}

export interface AppConfig {
  appUrl: string;
  databaseUrl?: string;
  checkoutProductId?: string;
  checkoutProductType: string;
  checkoutWebhookSecret?: string;
  email?: EmailConfig;
  kitsDir: string;
  fontsDir: string;
}

export function loadConfig(): AppConfig {
  const host = env("EMAIL_HOST");
  const from = env("EMAIL_FROM");
  const email: EmailConfig | undefined =
    host && from
      ? {
          host,
          port: Number(env("EMAIL_PORT") ?? 587),
          secure: env("EMAIL_SECURE") === "true",
          user: env("EMAIL_USER"),
          password: env("EMAIL_PASSWORD"),
          from,
        }
      : undefined;

  return {
    appUrl: (env("APP_URL") ?? "http://localhost:3000").replace(/\/+$/, ""),
    databaseUrl: env("DATABASE_URL"),
    checkoutProductId: env("CHECKOUT_PRODUCT_ID"),
    // ggCheckout: o produto principal chega com product.type = "main".
    checkoutProductType: env("CHECKOUT_PRODUCT_TYPE") ?? "main",
    checkoutWebhookSecret: env("CHECKOUT_WEBHOOK_SECRET"),
    email,
    kitsDir: path.resolve(env("KITS_DIR") ?? path.join(process.cwd(), "kits")),
    fontsDir: path.join(process.cwd(), "assets", "fonts"),
  };
}
