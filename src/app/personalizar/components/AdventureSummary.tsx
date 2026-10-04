import { THEMES, type ThemeId } from "@/lib/themes";
import s from "../personalizar.module.css";

export default function AdventureSummary({ theme, childName }: { theme: ThemeId | null; childName: string }) {
  return (
    <section className={s.summary} aria-live="polite" aria-label="Resumo da sua aventura">
      <h2 className={s.summaryTitle}>Sua aventura</h2>
      <dl className={s.summaryList}>
        <div>
          <dt>Tema</dt>
          <dd>{theme ? `${THEMES[theme].emoji} ${THEMES[theme].label}` : <span className={s.placeholder}>Escolha um tema</span>}</dd>
        </div>
        <div>
          <dt>Aventureiro</dt>
          <dd>{childName || <span className={s.placeholder}>Digite o nome</span>}</dd>
        </div>
      </dl>
    </section>
  );
}
