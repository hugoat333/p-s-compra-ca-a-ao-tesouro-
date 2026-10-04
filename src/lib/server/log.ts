/**
 * Log estruturado (JSON por linha), legível na Vercel/qualquer coletor.
 * Regras: nunca registrar secret, senha, documento, código PIX, token completo.
 */
type Fields = Record<string, unknown>;

const REDACT = /secret|password|senha|token|document|cpf|cnpj|pix_?code|qr_?code|authorization|^ip$/i;

function clean(fields: Fields): Fields {
  const out: Fields = {};
  for (const [k, v] of Object.entries(fields)) {
    out[k] = REDACT.test(k) ? "[redacted]" : v;
  }
  return out;
}

function write(level: "info" | "warn" | "error", msg: string, fields: Fields = {}) {
  const line = JSON.stringify({ level, msg, ts: new Date().toISOString(), ...clean(fields) });
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

export const log = {
  info: (msg: string, fields?: Fields) => write("info", msg, fields),
  warn: (msg: string, fields?: Fields) => write("warn", msg, fields),
  error: (msg: string, fields?: Fields) => write("error", msg, fields),
};

export function errorInfo(err: unknown): Fields {
  if (err instanceof Error) return { error: err.message, errorName: err.name, stack: err.stack };
  return { error: String(err) };
}
