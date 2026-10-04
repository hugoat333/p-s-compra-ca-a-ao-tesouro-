/**
 * Validação e normalização do nome da criança. Usado no cliente (UX) e no servidor (fonte oficial).
 */
export const CHILD_NAME_MAX_LENGTH = 30;

export type ChildNameResult = { ok: true; value: string } | { ok: false; error: string };

// Letras latinas (com acentos), espaço, apóstrofo, hífen e ponto. Bloqueia HTML, scripts, números e emojis.
// Restringir ao alfabeto latino garante que a fonte do PDF tenha todos os glifos.
const ALLOWED = /^[\p{Script=Latin}\p{M}' .\-]+$/u;
const HAS_LETTER = /\p{Script=Latin}/u;

export function normalizeChildName(raw: string): string {
  return raw
    .normalize("NFC")
    .replace(/[‘’ʼ]/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

export function validateChildName(raw: unknown): ChildNameResult {
  if (typeof raw !== "string") return { ok: false, error: "Informe o nome da criança." };
  const value = normalizeChildName(raw);
  if (!value) return { ok: false, error: "Informe o nome da criança." };
  if (value.length > CHILD_NAME_MAX_LENGTH) {
    return { ok: false, error: `Use no máximo ${CHILD_NAME_MAX_LENGTH} caracteres.` };
  }
  if (!ALLOWED.test(value) || !HAS_LETTER.test(value)) {
    return { ok: false, error: "Use apenas letras, espaços, hífen ou apóstrofo." };
  }
  return { ok: true, value };
}

/** Parte segura do nome do arquivo: "João Pedro" -> "joao-pedro". */
export function slugifyName(name: string): string {
  const slug = name
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40)
    .replace(/-+$/g, "");
  return slug || "aventura";
}

export function pdfFilename(childName: string): string {
  return `o-tesouro-de-${slugifyName(childName)}.pdf`;
}
