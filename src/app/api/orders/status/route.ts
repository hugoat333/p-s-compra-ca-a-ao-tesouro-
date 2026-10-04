import { getOrderRepository } from "@/lib/db";
import { loadConfig } from "@/lib/server/config";
import { isWellFormedToken } from "@/lib/server/tokens";
import { getOrderByToken, NotFoundError, toView } from "@/lib/server/delivery";
import { clientIp, rateLimit } from "@/lib/server/rateLimit";
import { json, readJson, tooMany } from "@/lib/server/http";
import { log, errorInfo } from "@/lib/server/log";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** POST (e não GET) para o token não aparecer em logs de acesso. */
export async function POST(req: Request) {
  const rl = rateLimit(`status:${clientIp(req)}`, 60, 60_000);
  if (!rl.ok) return tooMany(rl.retryAfterSec);

  let token: unknown;
  try {
    token = ((await readJson(req, 1024)) as { token?: unknown })?.token;
  } catch {
    /* tratado abaixo */
  }
  if (!isWellFormedToken(token)) return json({ ok: false, code: "not_found" }, 404);

  try {
    const order = await getOrderByToken({ repo: getOrderRepository(), productId: loadConfig().checkoutProductId }, token);
    return json({ ok: true, order: toView(order) });
  } catch (err) {
    if (err instanceof NotFoundError) return json({ ok: false, code: "not_found" }, 404);
    log.error("status.failed", errorInfo(err));
    return json({ ok: false, code: "error" }, 500);
  }
}
