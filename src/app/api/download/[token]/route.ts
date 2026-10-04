/**
 * Download protegido. O token opaco é a única chave: nada de caminhos, IDs ou nomes de arquivo na URL.
 * O PDF é regenerado sob demanda a partir de (tema, nome) salvos — sem armazenar milhares de PDFs.
 */
import { isWellFormedToken } from "@/lib/server/tokens";
import { getDeliveryDeps } from "@/lib/server/deps";
import { isDeliverable, accessLink } from "@/lib/server/delivery";
import { pdfFilename } from "@/lib/childName";
import { clientIp, rateLimit } from "@/lib/server/rateLimit";
import { log, errorInfo } from "@/lib/server/log";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function page(status: number, title: string, text: string, link?: string) {
  const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
  const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${esc(title)}</title>
<style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#f7f1e3;font-family:system-ui,sans-serif;color:#1f2a44;padding:16px;box-sizing:border-box}main{max-width:420px;background:#fff;border-radius:18px;padding:28px 22px;text-align:center;box-shadow:0 6px 24px rgba(30,58,122,.12)}h1{font-size:20px;margin:0 0 10px}p{margin:0 0 18px;line-height:1.5;color:#4b5563}a{display:inline-block;background:#f08c1a;color:#fff;font-weight:700;text-decoration:none;padding:13px 22px;border-radius:999px}</style></head>
<body><main><h1>${esc(title)}</h1><p>${esc(text)}</p>${link ? `<a href="${esc(link)}">TENTAR NOVAMENTE</a>` : ""}</main></body></html>`;
  return new Response(html, {
    status,
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
  });
}

export async function GET(req: Request, ctx: { params: Promise<{ token: string }> }) {
  const rl = rateLimit(`download:${clientIp(req)}`, 20, 60_000);
  if (!rl.ok) return page(429, "Muitas tentativas", "Aguarde um minuto e tente novamente.");

  const { token } = await ctx.params;
  const notFound = () =>
    page(404, "Não conseguimos localizar uma compra aprovada.", "Confira se você está usando o link enviado para o e-mail da compra.");
  if (!isWellFormedToken(token)) return notFound();

  const deps = getDeliveryDeps();
  let order;
  try {
    order = await deps.repo.findByToken(token);
  } catch (err) {
    log.error("download.lookup_failed", errorInfo(err));
    return page(500, "Não conseguimos finalizar seu arquivo agora.", "Suas informações foram salvas. Tente novamente.", "/personalizar");
  }
  // Pedido reembolsado/chargeback: o acesso é bloqueado (mesma resposta de "não encontrado").
  if (!order) return notFound();
  if (!isDeliverable(order, deps.productId)) {
    log.warn("download.blocked", { orderId: order.id, paymentStatus: order.paymentStatus });
    return notFound();
  }
  if (order.personalizationStatus !== "completed" || !order.theme || !order.childName) {
    return Response.redirect(accessLink(deps.appUrl, token), 303);
  }

  try {
    const bytes = await deps.generatePdf({ theme: order.theme, childName: order.childName });
    await deps.repo.markDownloaded(order.id).catch(() => {});
    log.info("download.served", { orderId: order.id, paymentId: order.paymentId, theme: order.theme });
    const filename = pdfFilename(order.childName);
    return new Response(Buffer.from(bytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Length": String(bytes.byteLength),
        "Content-Disposition": `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (err) {
    await deps.repo.markDeliveryFailed(order.id).catch(() => {});
    log.error("download.generation_failed", { orderId: order.id, theme: order.theme, ...errorInfo(err) });
    return page(
      500,
      "Não conseguimos finalizar seu arquivo agora.",
      "Suas informações foram salvas. Tente novamente.",
      `/personalizar?t=${encodeURIComponent(token)}`,
    );
  }
}
