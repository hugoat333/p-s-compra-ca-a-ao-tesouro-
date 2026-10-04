import type { ThemeId } from "../themes";

export type PaymentStatus = "paid" | "refunded" | "charged_back";
export type PersonalizationStatus = "pending" | "completed";
export type DeliveryStatus = "pending" | "generated" | "delivered" | "failed";

export interface Order {
  id: string;
  paymentId: string;
  productId: string;
  customerName: string | null;
  customerEmail: string | null;
  paymentStatus: PaymentStatus;
  amount: string | null;
  childName: string | null;
  theme: ThemeId | null;
  personalizationStatus: PersonalizationStatus;
  deliveryStatus: DeliveryStatus;
  downloadToken: string;
  paidAt: Date | null;
  refundedAt: Date | null;
  personalizedAt: Date | null;
  emailSentAt: Date | null;
  accessEmailSentAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaymentUpsert {
  paymentId: string;
  productId: string;
  customerName: string | null;
  customerEmail: string | null;
  paymentStatus: PaymentStatus;
  amount: number | null;
  paidAt: Date | null;
  /** Usado somente se o pedido for criado agora. */
  newToken: string;
}

export interface UpsertResult {
  order: Order;
  inserted: boolean;
  previousStatus: PaymentStatus | null;
}

export interface OrderRepository {
  /**
   * Idempotente por payment_id. Nunca rebaixa refunded/charged_back para paid
   * (reenvio atrasado de um evento "paid" não pode reativar um pedido reembolsado).
   */
  upsertPayment(input: PaymentUpsert): Promise<UpsertResult>;
  findByToken(token: string): Promise<Order | null>;
  /** Pedido pago do produto para o e-mail: primeiro um pendente de personalização, senão o mais recente. */
  findPaidForEmail(email: string, productId: string): Promise<Order | null>;
  /** Salva a personalização apenas se ainda estiver pendente. Retorna null se outro request já salvou. */
  completePersonalization(id: string, childName: string, theme: ThemeId): Promise<Order | null>;
  /** pending|failed -> generated. Retorna true só para quem fez a transição. */
  markGenerated(id: string): Promise<boolean>;
  markDeliveryFailed(id: string): Promise<void>;
  /** generated -> delivered com email_sent_at. */
  markEmailSent(id: string): Promise<void>;
  /** generated -> delivered (cliente baixou o arquivo). */
  markDownloaded(id: string): Promise<void>;
  /** Reserva o envio do e-mail de acesso pós-pagamento. true só uma vez por pedido. */
  claimAccessEmail(id: string): Promise<boolean>;
  releaseAccessEmail(id: string): Promise<void>;
}
