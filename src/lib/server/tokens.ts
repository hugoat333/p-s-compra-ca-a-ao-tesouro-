import { randomBytes, timingSafeEqual, createHash } from "node:crypto";

/** Token opaco de acesso ao pedido: 256 bits aleatórios em base64url (43 caracteres). */
export function generateAccessToken(): string {
  return randomBytes(32).toString("base64url");
}

export function isWellFormedToken(value: unknown): value is string {
  return typeof value === "string" && /^[A-Za-z0-9_-]{43}$/.test(value);
}

/** Comparação em tempo constante (inclusive para tamanhos diferentes). */
export function safeEqual(a: string, b: string): boolean {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb) && a.length === b.length;
}
