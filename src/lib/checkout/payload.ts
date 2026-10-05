/**
 * Normalização do payload do webhook da ggCheckout (estrutura oficial documentada):
 *
 *   event                 pix.paid | card.paid | pix.refunded | card.refunded
 *   customer.name, customer.email
 *   payment.id            identificador único da transação (chave de idempotência)
 *   payment.status        paid | pending | failed | refunded | charged_back
 *   payment.amount        guardado como recebido
 *   product.id, product.type   produto principal usa type = "main"
 *   products[]            itens do pedido (ex.: order bumps) — procuramos o nosso ID também aqui
 *
 * Qualquer outro campo (documento, IP, código PIX, dados bancários) é ignorado e nunca armazenado.
 */
import { normalizeEmail } from "../email";

export type ProviderPaymentStatus = "paid" | "pending" | "failed" | "refunded" | "charged_back";

export interface NormalizedProduct {
  id: string;
  type: string | null;
}

export interface NormalizedWebhook {
  event: string;
  paymentId: string;
  paymentStatus: ProviderPaymentStatus | string;
  products: NormalizedProduct[];
  customerName: string | null;
  customerEmail: string | null;
  amount: number | null;
  paidAt: Date | null;
}

export class PayloadError extends Error {}

/* eslint-disable @typescript-eslint/no-explicit-any */
function isObj(v: unknown): v is Record<string, any> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function str(v: unknown): string | null {
  if (typeof v === "string" && v.trim() !== "") return v.trim();
  if (typeof v === "number" && Number.isFinite(v)) return String(v);
  return null;
}

function num(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "" && Number.isFinite(Number(v))) return Number(v);
  return null;
}

function product(v: unknown): NormalizedProduct | null {
  if (!isObj(v)) return null;
  const id = str(v.id);
  return id ? { id, type: str(v.type) } : null;
}

export function normalizeWebhook(body: unknown): NormalizedWebhook {
  if (!isObj(body)) throw new PayloadError("body não é um objeto");
  const root = body;

  const event = str(root.event);
  if (!event) throw new PayloadError("evento ausente");

  const payment = root.payment;
  if (!isObj(payment)) throw new PayloadError("payment ausente");
  const paymentId = str(payment.id);
  if (!paymentId || paymentId.length > 200) throw new PayloadError("payment.id inválido");
  const paymentStatus = str(payment.status)?.toLowerCase();
  if (!paymentStatus) throw new PayloadError("payment.status ausente");

  const products: NormalizedProduct[] = [];
  const single = product(root.product);
  if (single) products.push(single);
  if (Array.isArray(root.products)) {
    for (const p of root.products) {
      const n = product(p);
      if (n) products.push(n);
    }
  }
  if (products.length === 0) throw new PayloadError("product.id ausente");

  const customer = isObj(root.customer) ? root.customer : {};
  const name = str(customer.name);

  return {
    event: event.toLowerCase(),
    paymentId,
    paymentStatus,
    products,
    customerName: name ? name.slice(0, 200) : null,
    customerEmail: normalizeEmail(customer.email),
    amount: num(payment.amount),
    // A documentação não define data de pagamento: usamos o recebimento do webhook.
    paidAt: null,
  };
}
