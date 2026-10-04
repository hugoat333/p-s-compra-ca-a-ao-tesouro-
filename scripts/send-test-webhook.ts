/**
 * Simula o webhook do checkout contra um servidor rodando (local ou produção).
 * Uso: npm run webhook:test -- --email cliente@teste.com [--event pix.paid] [--status paid] [--payment pay_123] [--url http://localhost:3000]
 * Usa CHECKOUT_WEBHOOK_SECRET e CHECKOUT_PRODUCT_ID do ambiente.
 */
import "./env";
import { randomUUID } from "node:crypto";

function arg(name: string, fallback?: string) {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : fallback;
}

async function main() {
  const url = (arg("url", process.env.APP_URL ?? "http://localhost:3000") as string).replace(/\/+$/, "");
  const secret = process.env.CHECKOUT_WEBHOOK_SECRET;
  const productId = arg("product", process.env.CHECKOUT_PRODUCT_ID);
  if (!secret || !productId) throw new Error("Defina CHECKOUT_WEBHOOK_SECRET e CHECKOUT_PRODUCT_ID.");
  const event = arg("event", "pix.paid")!;
  const body = {
    event,
    payment: {
      id: arg("payment", `test_${randomUUID()}`),
      status: arg("status", event.endsWith("refunded") ? "refunded" : "paid"),
      amount: Number(arg("amount", "2790")),
      paid_at: new Date().toISOString(),
    },
    product: { id: productId, type: process.env.CHECKOUT_PRODUCT_TYPE || arg("type", "main") },
    customer: { name: arg("name", "Cliente Teste"), email: arg("email", "cliente@teste.com") },
  };
  const res = await fetch(`${url}/api/webhooks/checkout`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${secret}` },
    body: JSON.stringify(body),
  });
  console.log(res.status, await res.text());
  console.log(`payment.id = ${body.payment.id}`);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
