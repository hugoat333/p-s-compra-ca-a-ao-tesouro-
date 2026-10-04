import type { Order, OrderRepository, PaymentUpsert, UpsertResult } from "./types";
import type { ThemeId } from "../themes";

/** Implementação em memória com a MESMA semântica do Postgres. Usada nos testes. */
export class MemoryOrderRepository implements OrderRepository {
  rows: Order[] = [];
  private seq = 0;

  async upsertPayment(i: PaymentUpsert): Promise<UpsertResult> {
    const now = new Date();
    const existing = this.rows.find((o) => o.paymentId === i.paymentId);
    if (!existing) {
      if (this.rows.some((o) => o.downloadToken === i.newToken)) throw new Error("duplicate token");
      const order: Order = {
        id: String(++this.seq),
        paymentId: i.paymentId,
        productId: i.productId,
        customerName: i.customerName,
        customerEmail: i.customerEmail,
        paymentStatus: i.paymentStatus,
        amount: i.amount === null ? null : i.amount.toFixed(2),
        childName: null,
        theme: null,
        personalizationStatus: "pending",
        deliveryStatus: "pending",
        downloadToken: i.newToken,
        paidAt: i.paidAt,
        refundedAt: i.paymentStatus === "paid" ? null : now,
        personalizedAt: null,
        emailSentAt: null,
        accessEmailSentAt: null,
        createdAt: now,
        updatedAt: now,
      };
      this.rows.push(order);
      return { order: { ...order }, inserted: true, previousStatus: null };
    }
    const previousStatus = existing.paymentStatus;
    existing.customerName = i.customerName ?? existing.customerName;
    existing.customerEmail = i.customerEmail ?? existing.customerEmail;
    if (i.amount !== null) existing.amount = i.amount.toFixed(2);
    const keepTerminal = i.paymentStatus === "paid" && existing.paymentStatus !== "paid";
    if (!keepTerminal) existing.paymentStatus = i.paymentStatus;
    if (i.paymentStatus !== "paid") existing.refundedAt = existing.refundedAt ?? now;
    existing.paidAt = existing.paidAt ?? i.paidAt;
    existing.updatedAt = now;
    return { order: { ...existing }, inserted: false, previousStatus };
  }

  async findByToken(token: string) {
    const o = this.rows.find((r) => r.downloadToken === token);
    return o ? { ...o } : null;
  }

  async findPaidForEmail(email: string, productId: string) {
    const list = this.rows
      .filter((o) => o.customerEmail === email && o.productId === productId && o.paymentStatus === "paid")
      .sort((a, b) => {
        const pa = a.personalizationStatus === "pending" ? 1 : 0;
        const pb = b.personalizationStatus === "pending" ? 1 : 0;
        return pb - pa || b.createdAt.getTime() - a.createdAt.getTime() || Number(b.id) - Number(a.id);
      });
    return list[0] ? { ...list[0] } : null;
  }

  async completePersonalization(id: string, childName: string, theme: ThemeId) {
    const o = this.rows.find((r) => r.id === id);
    if (!o || o.personalizationStatus !== "pending" || o.paymentStatus !== "paid") return null;
    o.childName = childName;
    o.theme = theme;
    o.personalizationStatus = "completed";
    o.personalizedAt = new Date();
    o.updatedAt = new Date();
    return { ...o };
  }

  async markGenerated(id: string) {
    const o = this.rows.find((r) => r.id === id);
    if (!o || !["pending", "failed"].includes(o.deliveryStatus)) return false;
    o.deliveryStatus = "generated";
    return true;
  }

  async markDeliveryFailed(id: string) {
    const o = this.rows.find((r) => r.id === id);
    if (o && ["pending", "failed"].includes(o.deliveryStatus)) o.deliveryStatus = "failed";
  }

  async markEmailSent(id: string) {
    const o = this.rows.find((r) => r.id === id);
    if (o) {
      o.emailSentAt = o.emailSentAt ?? new Date();
      o.deliveryStatus = "delivered";
    }
  }

  async markDownloaded(id: string) {
    const o = this.rows.find((r) => r.id === id);
    if (o && o.deliveryStatus !== "delivered") o.deliveryStatus = "delivered";
  }

  async claimAccessEmail(id: string) {
    const o = this.rows.find((r) => r.id === id);
    if (!o || o.accessEmailSentAt) return false;
    o.accessEmailSentAt = new Date();
    return true;
  }

  async releaseAccessEmail(id: string) {
    const o = this.rows.find((r) => r.id === id);
    if (o) o.accessEmailSentAt = null;
  }
}
