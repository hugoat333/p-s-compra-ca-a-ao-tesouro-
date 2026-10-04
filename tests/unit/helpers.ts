import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { Pool } from "pg";
import { writeFixtureKits } from "../fixtures/kits";
import { MemoryOrderRepository } from "@/lib/db/memory";
import { PgOrderRepository } from "@/lib/db/pg";
import type { OrderRepository } from "@/lib/db/types";
import { migrate } from "../../scripts/migrate";

export const PRODUCT_ID = "prod_tesouro_test";
export const SECRET = "test-secret-123";
export const FONTS_DIR = path.join(__dirname, "..", "..", "assets", "fonts");

export async function makeFixtureKits(): Promise<string> {
  return writeFixtureKits(fs.mkdtempSync(path.join(os.tmpdir(), "tesouro-kits-")));
}

export function paidPayload(overrides: {
  event?: string;
  status?: string;
  paymentId?: string;
  productId?: string;
  email?: string;
} = {}) {
  return {
    event: overrides.event ?? "pix.paid",
    payment: {
      id: overrides.paymentId ?? "pay_001",
      status: overrides.status ?? "paid",
      amount: 2790,
      paid_at: "2026-10-04T12:00:00Z",
      pix_code: "00020126...SEGREDO",
    },
    product: { id: overrides.productId ?? PRODUCT_ID, type: "main" },
    customer: {
      name: "Ana Souza",
      email: overrides.email ?? "Ana@Example.com",
      document: "123.456.789-00",
      ip: "200.1.2.3",
    },
  };
}

export interface RepoFactory {
  name: string;
  create: () => Promise<OrderRepository>;
  close: () => Promise<void>;
}

let pool: Pool | undefined;

/** Roda contra memória sempre e contra Postgres real quando TEST_DATABASE_URL existir. */
export function repoFactories(): RepoFactory[] {
  const list: RepoFactory[] = [
    { name: "memória", create: async () => new MemoryOrderRepository(), close: async () => {} },
  ];
  const url = process.env.TEST_DATABASE_URL;
  if (url) {
    list.push({
      name: "postgres",
      create: async () => {
        if (!pool) {
          await migrate(url, true);
          pool = new Pool({ connectionString: url, max: 5 });
        }
        await pool.query("TRUNCATE orders RESTART IDENTITY");
        return new PgOrderRepository(pool);
      },
      close: async () => {
        await pool?.end();
        pool = undefined;
      },
    });
  }
  return list;
}

export function setTestEnv(kitsDir?: string) {
  process.env.CHECKOUT_PRODUCT_ID = PRODUCT_ID;
  process.env.CHECKOUT_WEBHOOK_SECRET = SECRET;
  process.env.APP_URL = "https://aventura.test";
  delete process.env.CHECKOUT_PRODUCT_TYPE;
  delete process.env.EMAIL_HOST;
  if (kitsDir) process.env.KITS_DIR = kitsDir;
}

export function webhookRequest(body: unknown, headers: Record<string, string> = { authorization: `Bearer ${SECRET}` }) {
  return new Request("http://localhost/api/webhooks/checkout", {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

export function jsonRequest(url: string, body: unknown, ip = "10.0.0.1") {
  return new Request(`http://localhost${url}`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": ip },
    body: JSON.stringify(body),
  });
}
