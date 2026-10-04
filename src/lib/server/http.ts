import { after } from "next/server";
import { log, errorInfo } from "./log";

export function json(body: unknown, status = 200, headers: Record<string, string> = {}) {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store", ...headers } });
}

export function tooMany(retryAfterSec: number) {
  return json({ ok: false, code: "rate_limited" }, 429, { "Retry-After": String(retryAfterSec) });
}

export async function readJson(req: Request, maxBytes = 64 * 1024): Promise<unknown> {
  const text = await req.text();
  if (text.length > maxBytes) throw new SyntaxError("payload grande demais");
  return JSON.parse(text);
}

/** Executa após responder (waitUntil na Vercel). Fora de um request do Next, executa direto. */
export function runAfter(task: () => Promise<void>) {
  const safe = () => task().catch((err) => log.error("after.failed", errorInfo(err)));
  try {
    after(safe);
  } catch {
    void safe();
  }
}
