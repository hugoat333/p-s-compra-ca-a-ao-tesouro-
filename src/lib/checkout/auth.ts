import { safeEqual } from "../server/tokens";

/** Lê o secret de "Authorization: Bearer <secret>" ou "x-secret: <secret>". */
export function extractWebhookSecret(headers: Headers): string | null {
  const auth = headers.get("authorization");
  if (auth) {
    const m = /^Bearer\s+(.+)$/i.exec(auth.trim());
    if (m) return m[1].trim();
  }
  const x = headers.get("x-secret");
  return x ? x.trim() : null;
}

export function isValidWebhookSecret(headers: Headers, expected: string): boolean {
  const received = extractWebhookSecret(headers);
  return received !== null && safeEqual(received, expected);
}
