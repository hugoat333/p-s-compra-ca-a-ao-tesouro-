/**
 * Orquestra o pós-compra: validação do pedido, personalização, geração do PDF e e-mail.
 * Independente de HTTP (testável). Toda verificação aqui é a fonte oficial — o frontend só ajuda a UX.
 */
import type { Order, OrderRepository } from "../db/types";
import type { OrderView } from "../orderView";
import { THEMES, isThemeId, type ThemeId } from "../themes";
import { validateChildName } from "../childName";
import { log, errorInfo } from "./log";
import { maskEmail } from "../email";
import type { EmailService } from "../mail/service";
import { adventureReadyEmail, purchaseConfirmedEmail } from "../mail/templates";

export interface DeliveryDeps {
  repo: OrderRepository;
  email: EmailService;
  appUrl: string;
  productId: string | undefined;
  generatePdf: (input: { theme: ThemeId; childName: string }) => Promise<Uint8Array>;
}

export class NotFoundError extends Error {}
export class ValidationError extends Error {}
export class GenerationError extends Error {}

/** Pedido utilizável: produto correto e pagamento confirmado. */
export function isDeliverable(order: Order | null, productId: string | undefined): boolean {
  return !!order && !!productId && order.productId === productId && order.paymentStatus === "paid";
}

export function toView(o: Order): OrderView {
  return {
    personalization: o.personalizationStatus,
    theme: o.theme,
    childName: o.childName,
    ready: o.deliveryStatus === "generated" || o.deliveryStatus === "delivered",
    failed: o.deliveryStatus === "failed",
    emailSent: !!o.emailSentAt,
  };
}

export function accessLink(appUrl: string, token: string) {
  return `${appUrl}/personalizar?t=${encodeURIComponent(token)}`;
}

export async function getOrderByToken(deps: Pick<DeliveryDeps, "repo" | "productId">, token: string) {
  const order = await deps.repo.findByToken(token);
  if (!order || !isDeliverable(order, deps.productId)) throw new NotFoundError();
  return order;
}

// Deduplica gerações simultâneas do mesmo pedido na mesma instância (double click / reenvio).
const inflight = new Map<string, Promise<OrderView>>();

export async function personalizeAndDeliver(
  deps: DeliveryDeps,
  input: { token: string; childName: unknown; theme: unknown },
): Promise<OrderView> {
  const name = validateChildName(input.childName);
  if (!name.ok) throw new ValidationError(name.error);
  if (!isThemeId(input.theme)) throw new ValidationError("Tema inválido.");
  const theme = input.theme;

  let order = await getOrderByToken(deps, input.token);

  const running = inflight.get(order.id);
  if (running) return running;

  const job = (async () => {
    if (order.personalizationStatus === "pending") {
      const saved = await deps.repo.completePersonalization(order.id, name.value, theme);
      order = saved ?? (await getOrderByToken(deps, input.token));
      if (saved) {
        log.info("order.personalized", {
          orderId: order.id,
          paymentId: order.paymentId,
          theme: order.theme,
          childName: order.childName,
        });
      }
    }
    // A partir daqui usamos SEMPRE o que está salvo (uma personalização concluída não é trocada).
    if (order.deliveryStatus === "generated" || order.deliveryStatus === "delivered") return toView(order);
    return generateAndNotify(deps, order);
  })();

  inflight.set(order.id, job);
  try {
    return await job;
  } finally {
    inflight.delete(order.id);
  }
}

async function generateAndNotify(deps: DeliveryDeps, order: Order): Promise<OrderView> {
  const theme = order.theme!;
  const childName = order.childName!;
  try {
    await deps.generatePdf({ theme, childName });
  } catch (err) {
    await deps.repo.markDeliveryFailed(order.id).catch(() => {});
    log.error("delivery.generation_failed", { orderId: order.id, paymentId: order.paymentId, theme, ...errorInfo(err) });
    throw new GenerationError();
  }

  const won = await deps.repo.markGenerated(order.id);
  log.info("delivery.generated", { orderId: order.id, paymentId: order.paymentId, theme, childName });

  if (won && deps.email.enabled && order.customerEmail) {
    try {
      await deps.email.send(
        adventureReadyEmail({
          to: order.customerEmail,
          childName,
          themeLabel: THEMES[theme].label,
          link: accessLink(deps.appUrl, order.downloadToken),
        }),
      );
      await deps.repo.markEmailSent(order.id);
      log.info("delivery.email_sent", { orderId: order.id, customerEmail: maskEmail(order.customerEmail) });
    } catch (err) {
      log.error("delivery.email_failed", { orderId: order.id, customerEmail: maskEmail(order.customerEmail), ...errorInfo(err) });
    }
  }

  const fresh = await deps.repo.findByToken(order.downloadToken);
  return toView(fresh ?? order);
}

/** E-mail pós-pagamento com o link de personalização. Enviado no máximo uma vez por pedido. */
export async function sendAccessEmail(deps: Pick<DeliveryDeps, "repo" | "email" | "appUrl">, order: Order) {
  if (!deps.email.enabled || !order.customerEmail) return;
  if (!(await deps.repo.claimAccessEmail(order.id))) return;
  try {
    await deps.email.send(purchaseConfirmedEmail({ to: order.customerEmail, link: accessLink(deps.appUrl, order.downloadToken) }));
    log.info("access_email.sent", { orderId: order.id, customerEmail: maskEmail(order.customerEmail) });
  } catch (err) {
    await deps.repo.releaseAccessEmail(order.id).catch(() => {});
    log.error("access_email.failed", { orderId: order.id, ...errorInfo(err) });
  }
}
