/**
 * Guia de preparação do responsável (PDF de 1 página). Mesmas regras do download da aventura:
 * token opaco, pedido pago, personalização concluída.
 */
import { isWellFormedToken } from "@/lib/server/tokens";
import { getDeliveryDeps } from "@/lib/server/deps";
import { isDeliverable, accessLink } from "@/lib/server/delivery";
import { slugifyName } from "@/lib/childName";
import { generateGuidePdf, guideFilename } from "@/lib/pdf/guide";
import { clientIp, rateLimit } from "@/lib/server/rateLimit";
import { log, errorInfo } from "@/lib/server/log";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const notFound = () =>
  new Response("Não conseguimos localizar uma compra aprovada.", { status: 404, headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" } });

export async function GET(req: Request, ctx: { params: Promise<{ token: string }> }) {
  const rl = rateLimit(`guia:${clientIp(req)}`, 20, 60_000);
  if (!rl.ok) return new Response("Muitas tentativas. Aguarde um minuto.", { status: 429 });
  const { token } = await ctx.params;
  if (!isWellFormedToken(token)) return notFound();
  const deps = getDeliveryDeps();
  try {
    const order = await deps.repo.findByToken(token);
    if (!order || !isDeliverable(order, deps.productId)) return notFound();
    if (order.personalizationStatus !== "completed" || !order.theme || !order.childName) return Response.redirect(accessLink(deps.appUrl, token), 303);
    const bytes = await generateGuidePdf({ theme: order.theme, childName: order.childName, fontsDir: deps.fontsDir });
    const filename = guideFilename(order.childName, slugifyName);
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
    log.error("guide.failed", errorInfo(err));
    return new Response("Não conseguimos gerar o guia agora. Tente novamente.", { status: 500 });
  }
}
