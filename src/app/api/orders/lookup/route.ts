/**
 * Fallback de identificação: o redirecionamento do checkout não traz identificador documentado,
 * então o cliente informa o e-mail usado na compra. Resposta genérica, sem revelar outros pedidos.
 */
import { loadConfig } from "@/lib/server/config";
import { getOrderRepository } from "@/lib/db";
import { normalizeEmail, maskEmail } from "@/lib/email";
import { isDeliverable, toView } from "@/lib/server/delivery";
import { clientIp, rateLimit } from "@/lib/server/rateLimit";
import { json, readJson, tooMany } from "@/lib/server/http";
import { log, errorInfo } from "@/lib/server/log";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const ip = clientIp(req);
  const perMinute = rateLimit(`lookup:m:${ip}`, 12, 60_000);
  if (!perMinute.ok) return tooMany(perMinute.retryAfterSec);
  const perHour = rateLimit(`lookup:h:${ip}`, 30, 3_600_000);
  if (!perHour.ok) return tooMany(perHour.retryAfterSec);

  let email: string | null = null;
  try {
    const body = (await readJson(req, 2048)) as { email?: unknown };
    email = normalizeEmail(body?.email);
  } catch {
    /* tratado abaixo */
  }
  if (!email) return json({ ok: false, code: "invalid_email" }, 400);

  const perEmail = rateLimit(`lookup:e:${email}`, 20, 3_600_000);
  if (!perEmail.ok) return tooMany(perEmail.retryAfterSec);

  try {
    const { checkoutProductId } = loadConfig();
    if (!checkoutProductId) throw new Error("CHECKOUT_PRODUCT_ID não configurado");
    const order = await getOrderRepository().findPaidForEmail(email, checkoutProductId);
    if (!order || !isDeliverable(order, checkoutProductId)) {
      log.info("lookup.not_found", { customerEmail: maskEmail(email) });
      return json({ ok: false, code: "not_found" }, 404);
    }
    return json({ ok: true, token: order.downloadToken, order: toView(order) });
  } catch (err) {
    log.error("lookup.failed", errorInfo(err));
    return json({ ok: false, code: "error" }, 500);
  }
}
