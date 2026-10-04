import { isWellFormedToken } from "@/lib/server/tokens";
import { getDeliveryDeps } from "@/lib/server/deps";
import { personalizeAndDeliver, NotFoundError, ValidationError, GenerationError } from "@/lib/server/delivery";
import { clientIp, rateLimit } from "@/lib/server/rateLimit";
import { json, readJson, tooMany } from "@/lib/server/http";
import { log, errorInfo } from "@/lib/server/log";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: Request) {
  const rl = rateLimit(`personalize:${clientIp(req)}`, 10, 60_000);
  if (!rl.ok) return tooMany(rl.retryAfterSec);

  let body: { token?: unknown; childName?: unknown; theme?: unknown } = {};
  try {
    body = ((await readJson(req, 2048)) as typeof body) ?? {};
  } catch {
    return json({ ok: false, code: "invalid" }, 400);
  }
  if (!isWellFormedToken(body.token)) return json({ ok: false, code: "not_found" }, 404);

  try {
    const order = await personalizeAndDeliver(getDeliveryDeps(), {
      token: body.token,
      childName: body.childName,
      theme: body.theme,
    });
    return json({ ok: true, order });
  } catch (err) {
    if (err instanceof ValidationError) return json({ ok: false, code: "invalid", message: err.message }, 400);
    if (err instanceof NotFoundError) return json({ ok: false, code: "not_found" }, 404);
    if (err instanceof GenerationError) return json({ ok: false, code: "generation_failed" }, 500);
    log.error("personalization.failed", errorInfo(err));
    return json({ ok: false, code: "error" }, 500);
  }
}
