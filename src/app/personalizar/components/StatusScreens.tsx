import s from "../personalizar.module.css";

export function Validating() {
  return (
    <section className={`${s.card} ${s.center}`} aria-live="polite" aria-busy="true">
      <div className={s.spinner} aria-hidden="true" />
      <p className={s.subtitle}>Validando sua compra...</p>
    </section>
  );
}

export function NotFound({ onRetry }: { onRetry: () => void }) {
  return (
    <section className={`${s.card} ${s.center}`} role="alert">
      <div className={s.bigEmoji} aria-hidden="true">
        🔎
      </div>
      <h1 className={s.title}>Não conseguimos localizar uma compra aprovada.</h1>
      <p className={s.subtitle}>Confira se você está usando o mesmo e-mail informado no pagamento.</p>
      <button type="button" className={s.cta} onClick={onRetry}>
        Tentar novamente
      </button>
    </section>
  );
}

export function GenerationFailed({ onRetry }: { onRetry: () => void }) {
  return (
    <section className={`${s.card} ${s.center}`} role="alert">
      <div className={s.bigEmoji} aria-hidden="true">
        🧭
      </div>
      <h1 className={s.title}>Não conseguimos finalizar seu arquivo agora.</h1>
      <p className={s.subtitle}>Suas informações foram salvas. Tente novamente.</p>
      <button type="button" className={s.cta} onClick={onRetry}>
        TENTAR NOVAMENTE
      </button>
    </section>
  );
}
