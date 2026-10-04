/**
 * Regras de negócio do webhook. Independente de HTTP para ser testável.
 */
import type { NormalizedWebhook } from "./payload";
import type { Order, OrderRepository } from "../db/types";
import type { PaymentStatus } from "../db/types";
import { generateAccessToken } from "../server/tokens";
import { log } from "../server/log";
import { maskEmail } from "../email";

export const PAID_EVENTS = new Set(["pix.paid", "card.paid"]);
export const REFUND_EVENTS = new Set(["pix.refunded", "card.refunded"]);
/** Nomes de chargeback ainda não documentados pelo provedor; tratamos pelo payment.status. */
export const CHARGEBACK_EVENTS = new Set(["pix.charged_back", "card.charged_back", "card.chargeback", "chargeback"]);

export interface ProductRule {
  productId: string;
  productType?: string;
}

export type WebhookOutcome =
  | { action: "created" | "updated"; status: PaymentStatus; order: Order; sendAccessEmail: boolean }
  | { action: "ignored"; reason: string };

function decideStatus(w: NormalizedWebhook): PaymentStatus | null {
  if (PAID_EVENTS.has(w.event)) return w.paymentStatus === "paid" ? "paid" : null;
  if (REFUND_EVENTS.has(w.event)) {
    if (w.paymentStatus === "refunded") return "refunded";
    if (w.paymentStatus === "charged_back") return "charged_back";
    return null;
  }
  // Preparado para chargeback: qualquer evento conhecido de chargeback, ou status charged_back explícito.
  if (CHARGEBACK_EVENTS.has(w.event) || w.paymentStatus === "charged_back") {
    return w.paymentStatus === "charged_back" ? "charged_back" : null;
  }
  return null;
}

export async function processWebhook(
  w: NormalizedWebhook,
  rule: ProductRule,
  repo: OrderRepository,
): Promise<WebhookOutcome> {
  const ctx = { event: w.event, paymentId: w.paymentId, paymentStatus: w.paymentStatus };

  const product = w.products.find((p) => p.id === rule.productId);
  if (!product) {
    log.info("webhook.ignored.other_product", { ...ctx, productIds: w.products.map((p) => p.id) });
    return { action: "ignored", reason: "product_mismatch" };
  }
  if (rule.productType && product.type !== rule.productType) {
    log.info("webhook.ignored.product_type", { ...ctx, productType: product.type });
    return { action: "ignored", reason: "product_type_mismatch" };
  }

  const status = decideStatus(w);
  if (!status) {
    // pending, failed, eventos desconhecidos, ou evento "paid" com status != paid: nunca liberam o produto.
    log.info("webhook.ignored.status", ctx);
    return { action: "ignored", reason: "not_actionable" };
  }

  const result = await repo.upsertPayment({
    paymentId: w.paymentId,
    productId: product.id,
    customerName: w.customerName,
    customerEmail: w.customerEmail,
    paymentStatus: status,
    amount: w.amount,
    paidAt: status === "paid" ? (w.paidAt ?? new Date()) : null,
    newToken: generateAccessToken(),
  });

  const { order } = result;
  if (result.previousStatus && result.previousStatus !== order.paymentStatus) {
    log.info("order.payment_status_changed", {
      paymentId: order.paymentId,
      from: result.previousStatus,
      to: order.paymentStatus,
    });
  }
  if (status === "paid" && order.paymentStatus !== "paid") {
    log.warn("webhook.paid_after_refund_ignored", { paymentId: order.paymentId, current: order.paymentStatus });
  }

  log.info(result.inserted ? "order.created" : "order.updated", {
    orderId: order.id,
    paymentId: order.paymentId,
    customerEmail: maskEmail(order.customerEmail),
    paymentStatus: order.paymentStatus,
    personalizationStatus: order.personalizationStatus,
    deliveryStatus: order.deliveryStatus,
  });

  return {
    action: result.inserted ? "created" : "updated",
    status: order.paymentStatus,
    order,
    sendAccessEmail:
      order.paymentStatus === "paid" &&
      order.personalizationStatus === "pending" &&
      !order.accessEmailSentAt &&
      !!order.customerEmail,
  };
}
