export function normalizeEmail(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const value = raw.trim().toLowerCase();
  if (value.length < 3 || value.length > 254) return null;
  // Validação estrutural simples; a prova real é existir uma compra com esse e-mail.
  if (!/^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]+$/.test(value)) return null;
  return value;
}

/** Para logs: "miguel.pai@gmail.com" -> "mi***@gmail.com". */
export function maskEmail(email: string | null | undefined): string {
  if (!email) return "-";
  const [user, domain] = email.split("@");
  if (!domain) return "***";
  return `${user.slice(0, 2)}***@${domain}`;
}
