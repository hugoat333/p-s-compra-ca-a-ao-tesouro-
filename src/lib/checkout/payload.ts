/**
 * Normalização do payload do webhook do checkout.
 *
 * CONTRATO DOCUMENTADO (fornecido pelo dono do produto):
 *   eventos: pix.paid | card.paid | pix.refunded | card.refunded
 *   payment.status: paid | pending | failed | refunded | charged_back
 *   campos usados: payment.id, payment.status, product.id, product.type
 *
 * SUPOSIÇÕES (confirmar com um payload real do provedor — ver README):
 *   - nome do evento em `event` (aceitamos também `type`);
 *   - dados podem vir na raiz ou dentro de `data`;
 *   - comprador em `customer` (aceitamos `buyer`), com `name` e `email`;
 *   - valor em `payment.amount` (aceitamos `payment.value`), guardado como recebido;
 *   - pode haver `products` (array) em vez de `product` — procuramos o nosso ID nele.
 * Qualquer outro campo (documento, IP, código PIX, banco) é ignorado e nunca armazenado.
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

function date(v: unknown): Date | null {
  if (typeof v !== "string" && typeof v !== "number") return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

function product(v: unknown): NormalizedProduct | null {
  if (!isObj(v)) return null;
  const id = str(v.id);
  return id ? { id, type: str(v.type) } : null;
}

export function normalizeWebhook(body: unknown): NormalizedWebhook {
  if (!isObj(body)) throw new PayloadError("body não é um objeto");
  const root = isObj(body.data) && isObj(body.data.payment) ? body.data : body;

  const event = str(body.event) ?? str(body.type) ?? str(root.event) ?? str(root.type);
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

  const customer = isObj(root.customer) ? root.customer : isObj(root.buyer) ? root.buyer : {};
  const name = str(customer.name);

  return {
    event: event.toLowerCase(),
    paymentId,
    paymentStatus,
    products,
    customerName: name ? name.slice(0, 200) : null,
    customerEmail: normalizeEmail(customer.email),
    amount: num(payment.amount) ?? num(payment.value),
    paidAt: date(payment.paid_at) ?? date(payment.paidAt) ?? date(payment.approved_at),
  };
}
