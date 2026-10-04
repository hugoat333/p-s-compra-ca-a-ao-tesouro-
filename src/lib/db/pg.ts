import { Pool } from "pg";
import type { Order, OrderRepository, PaymentUpsert, UpsertResult, PaymentStatus } from "./types";
import type { ThemeId } from "../themes";

/* eslint-disable @typescript-eslint/no-explicit-any */
function toOrder(r: any): Order {
  return {
    id: String(r.id),
    paymentId: r.payment_id,
    productId: r.product_id,
    customerName: r.customer_name,
    customerEmail: r.customer_email,
    paymentStatus: r.payment_status,
    amount: r.amount === null || r.amount === undefined ? null : String(r.amount),
    childName: r.child_name,
    theme: r.theme,
    personalizationStatus: r.personalization_status,
    deliveryStatus: r.delivery_status,
    downloadToken: r.download_token,
    paidAt: r.paid_at,
    refundedAt: r.refunded_at,
    personalizedAt: r.personalized_at,
    emailSentAt: r.email_sent_at,
    accessEmailSentAt: r.access_email_sent_at,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export class PgOrderRepository implements OrderRepository {
  constructor(private pool: Pool) {}

  async upsertPayment(i: PaymentUpsert): Promise<UpsertResult> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      const prev = await client.query("SELECT payment_status FROM orders WHERE payment_id = $1 FOR UPDATE", [i.paymentId]);
      const previousStatus: PaymentStatus | null = prev.rows[0]?.payment_status ?? null;
      const res = await client.query(
        `INSERT INTO orders (payment_id, product_id, customer_name, customer_email, payment_status, amount,
                             download_token, paid_at, refunded_at)
         VALUES ($1, $2, $3, $4, $5::text, $6, $7, $8, CASE WHEN $5::text = 'paid' THEN NULL ELSE now() END)
         ON CONFLICT (payment_id) DO UPDATE SET
           customer_name  = COALESCE(EXCLUDED.customer_name, orders.customer_name),
           customer_email = COALESCE(EXCLUDED.customer_email, orders.customer_email),
           amount         = COALESCE(EXCLUDED.amount, orders.amount),
           payment_status = CASE
             WHEN EXCLUDED.payment_status = 'paid' AND orders.payment_status IN ('refunded', 'charged_back')
               THEN orders.payment_status
             ELSE EXCLUDED.payment_status END,
           refunded_at    = CASE
             WHEN EXCLUDED.payment_status IN ('refunded', 'charged_back')
               THEN COALESCE(orders.refunded_at, now())
             ELSE orders.refunded_at END,
           paid_at        = COALESCE(orders.paid_at, EXCLUDED.paid_at),
           updated_at     = now()
         RETURNING *, (xmax = 0) AS inserted`,
        [i.paymentId, i.productId, i.customerName, i.customerEmail, i.paymentStatus, i.amount, i.newToken, i.paidAt],
      );
      await client.query("COMMIT");
      return { order: toOrder(res.rows[0]), inserted: res.rows[0].inserted === true, previousStatus };
    } catch (err) {
      await client.query("ROLLBACK").catch(() => {});
      throw err;
    } finally {
      client.release();
    }
  }

  async findByToken(token: string) {
    const r = await this.pool.query("SELECT * FROM orders WHERE download_token = $1", [token]);
    return r.rows[0] ? toOrder(r.rows[0]) : null;
  }

  async findPaidForEmail(email: string, productId: string) {
    const r = await this.pool.query(
      `SELECT * FROM orders
       WHERE customer_email = $1 AND product_id = $2 AND payment_status = 'paid'
       ORDER BY (personalization_status = 'pending') DESC, created_at DESC
       LIMIT 1`,
      [email, productId],
    );
    return r.rows[0] ? toOrder(r.rows[0]) : null;
  }

  async completePersonalization(id: string, childName: string, theme: ThemeId) {
    const r = await this.pool.query(
      `UPDATE orders SET child_name = $2, theme = $3, personalization_status = 'completed',
              personalized_at = now(), updated_at = now()
       WHERE id = $1 AND personalization_status = 'pending' AND payment_status = 'paid'
       RETURNING *`,
      [id, childName, theme],
    );
    return r.rows[0] ? toOrder(r.rows[0]) : null;
  }

  async markGenerated(id: string) {
    const r = await this.pool.query(
      `UPDATE orders SET delivery_status = 'generated', updated_at = now()
       WHERE id = $1 AND delivery_status IN ('pending', 'failed')`,
      [id],
    );
    return r.rowCount === 1;
  }

  async markDeliveryFailed(id: string) {
    await this.pool.query(
      `UPDATE orders SET delivery_status = 'failed', updated_at = now()
       WHERE id = $1 AND delivery_status IN ('pending', 'failed')`,
      [id],
    );
  }

  async markEmailSent(id: string) {
    await this.pool.query(
      `UPDATE orders SET email_sent_at = COALESCE(email_sent_at, now()),
              delivery_status = 'delivered', updated_at = now()
       WHERE id = $1`,
      [id],
    );
  }

  async markDownloaded(id: string) {
    await this.pool.query(
      `UPDATE orders SET delivery_status = 'delivered', updated_at = now()
       WHERE id = $1 AND delivery_status IN ('generated', 'failed', 'pending')`,
      [id],
    );
  }

  async claimAccessEmail(id: string) {
    const r = await this.pool.query(
      `UPDATE orders SET access_email_sent_at = now(), updated_at = now()
       WHERE id = $1 AND access_email_sent_at IS NULL`,
      [id],
    );
    return r.rowCount === 1;
  }

  async releaseAccessEmail(id: string) {
    await this.pool.query("UPDATE orders SET access_email_sent_at = NULL WHERE id = $1", [id]);
  }
}
