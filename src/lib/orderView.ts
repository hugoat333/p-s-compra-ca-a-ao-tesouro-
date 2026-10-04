/** Visão pública do pedido enviada ao navegador. Nunca inclui e-mail, payment_id ou IDs internos. */
import type { ThemeId } from "./themes";

export interface OrderView {
  personalization: "pending" | "completed";
  theme: ThemeId | null;
  childName: string | null;
  /** true quando o PDF já foi gerado com sucesso ao menos uma vez. */
  ready: boolean;
  failed: boolean;
  emailSent: boolean;
}
