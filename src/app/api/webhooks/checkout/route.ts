import { loadConfig } from "@/lib/server/config";
import { getOrderRepository } from "@/lib/db";
import { getEmailService } from "@/lib/mail/service";
import { isValidWebhookSecret } from "@/lib/checkout/auth";
import { normalizeWebhook, PayloadError } from "@/lib/checkout/payload";
import { processWebhook } from "@/lib/checkout/process";
import { sendAccessEmail } from "@/lib/server/delivery";
import { json, readJson, runAfter } from "@/lib/server/http";
import { log, errorInfo } from "@/lib/server/log";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const cfg = loadConfig();
  if (!cfg.checkoutWebhookSecret || !cfg.checkoutProductId) {
    log.error("webhook.misconfigured", { hasSecret: !!cfg.checkoutWebhookSecret, hasProductId: !!cfg.checkoutProductId });
    return json({ ok: false }, 500);
  }
  if (!isValidWebhookSecret(req.headers, cfg.checkoutWebhookSecret)) {
    log.warn("webhook.unauthorized");
    return json({ ok: false }, 401);
  }

  let normalized;
  try {
    normalized = normalizeWebhook(await readJson(req));
  } catch (err) {
    log.warn("webhook.invalid_payload", { reason: err instanceof PayloadError ? err.message : "json inválido" });
    return json({ ok: false, error: "invalid_payload" }, 400);
  }

  try {
    const repo = getOrderRepository();
    const outcome = await processWebhook(
      normalized,
      { productId: cfg.checkoutProductId, productType: cfg.checkoutProductType },
      repo,
    );
    if (outcome.action !== "ignored" && outcome.sendAccessEmail) {
      const order = outcome.order;
      runAfter(() => sendAccessEmail({ repo, email: getEmailService(cfg.email), appUrl: cfg.appUrl }, order));
    }
    return json({ ok: true, action: outcome.action });
  } catch (err) {
    // 500 => o provedor reenvia; a idempotência garante que o reenvio é seguro.
    log.error("webhook.processing_failed", { paymentId: normalized.paymentId, event: normalized.event, ...errorInfo(err) });
    return json({ ok: false }, 500);
  }
}
