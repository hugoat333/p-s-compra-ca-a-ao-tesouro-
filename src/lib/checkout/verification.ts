/**
 * Classificação de requisições AUTENTICADAS que não são um pagamento válido.
 *
 * Ao cadastrar o webhook, a ggCheckout envia uma requisição de verificação cujo formato não é documentado
 * (corpo vazio, não-JSON, evento de teste ou amostra sem dados de pagamento). Ela já passou pela validação do
 * secret; respondemos 200 sem tocar no banco. Nada é criado ou liberado.
 *
 * Continua 400: um evento de pagamento real (pix.paid, card.refunded etc.) com payment.id e payment.status, mas malformado —
 * isso indica problema de integração e deve aparecer como erro.
 */
export type Classification =
  | { kind: "verification"; reason: string }
  | { kind: "malformed_payment"; reason: string };

/* eslint-disable @typescript-eslint/no-explicit-any */
const isObj = (v: unknown): v is Record<string, any> => typeof v === "object" && v !== null && !Array.isArray(v);
const TEST_EVENT = /(test|teste|ping|verif|valida|hello|health|check)/i;
const PAYMENT_EVENT = /^(pix|card)\.(paid|refunded|charged_back|chargeback|pending|failed)$/i;

export function parseBody(text: string): { ok: true; body: unknown } | { ok: false } {
  if (text.trim() === "") return { ok: true, body: undefined };
  try {
    return { ok: true, body: JSON.parse(text) };
  } catch {
    return { ok: false };
  }
}

export function classifyInvalid(body: unknown, parseOk: boolean, reason: string): Classification {
  if (!parseOk) return { kind: "verification", reason: "corpo não-JSON" };
  if (body === undefined) return { kind: "verification", reason: "corpo vazio" };
  if (!isObj(body)) return { kind: "verification", reason: "corpo não é objeto" };
  const event = typeof body.event === "string" ? body.event : "";
  if (event && TEST_EVENT.test(event)) return { kind: "verification", reason: "evento de teste" };
  if (body.test === true || body.is_test === true || body.ping === true) return { kind: "verification", reason: "flag de teste" };
  const payment = body.payment;
  const looksLikeRealPayment =
    PAYMENT_EVENT.test(event) && isObj(payment) && (typeof payment.id === "string" || typeof payment.id === "number") && typeof payment.status === "string";
  if (looksLikeRealPayment) return { kind: "malformed_payment", reason };
  return { kind: "verification", reason: `sem dados de pagamento (${reason})` };
}

/** Evento de teste com payload completo (ex.: amostra de pagamento): nunca deve criar pedido. */
export function isTestEvent(event: string): boolean {
  return TEST_EVENT.test(event) && !PAYMENT_EVENT.test(event);
}

/** Formato do corpo para diagnóstico: só nomes de campos e tamanho — nunca valores. */
export function bodyShape(body: unknown, text: string, contentType: string | null) {
  const keys = (o: unknown) => (isObj(o) ? Object.keys(o).slice(0, 20) : undefined);
  return {
    contentType: contentType?.split(";")[0] ?? null,
    bodyBytes: text.length,
    topKeys: keys(body),
    paymentKeys: isObj(body) ? keys(body.payment) : undefined,
    productKeys: isObj(body) ? keys(body.product) : undefined,
    eventValue: isObj(body) && typeof body.event === "string" ? body.event.slice(0, 40) : undefined,
  };
}
