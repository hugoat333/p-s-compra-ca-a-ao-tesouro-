import type { OrderView } from "@/lib/orderView";
import { THEMES } from "@/lib/themes";
import { downloadUrl, guideUrl } from "@/lib/client/api";
import s from "../personalizar.module.css";

export default function ReadyScreen({ order, token, fresh }: { order: OrderView; token: string; fresh: boolean }) {
  const name = order.childName ?? "";
  const theme = order.theme ? THEMES[order.theme] : null;
  return (
    <section className={`${s.card} ${s.center} ${s.ready}`} aria-live="polite">
      <div className={s.bigEmoji} aria-hidden="true">
        🎉
      </div>
      <h1 className={s.title}>{fresh ? "Sua aventura está pronta!" : "Sua aventura já está pronta."}</h1>
      <p className={s.subtitle}>O Tesouro de {name} está preparado.</p>

      <dl className={`${s.summaryList} ${s.readyList}`}>
        <div>
          <dt>Tema</dt>
          <dd>{theme ? `${theme.emoji} ${theme.label}` : "-"}</dd>
        </div>
        <div>
          <dt>Aventureiro</dt>
          <dd>{name}</dd>
        </div>
      </dl>

      <a className={s.cta} href={downloadUrl(token)} download>
        BAIXAR MINHA AVENTURA
      </a>
      <p className={s.sectionText}>Imprima o arquivo, recorte as pistas e esconda cada uma no local indicado.</p>
      <a className={s.secondaryLink} href={guideUrl(token)} download>
        Baixar guia de preparação (para o adulto)
      </a>
      {order.emailSent && <p className={s.emailNote}>Também enviamos uma cópia para o e-mail usado na compra.</p>}
    </section>
  );
}
