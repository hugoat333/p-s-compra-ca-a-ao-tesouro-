"use client";

import { useState } from "react";
import { normalizeEmail } from "@/lib/email";
import s from "../personalizar.module.css";

export default function EmailGate({ onSubmit, error }: { onSubmit: (email: string) => void; error?: string }) {
  const [email, setEmail] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const shown = localError ?? error ?? null;

  return (
    <section className={s.card}>
      <h1 className={s.title}>Vamos localizar sua compra</h1>
      <p className={s.subtitle}>Informe o mesmo e-mail que você usou no pagamento. É assim que encontramos o seu pedido com segurança.</p>
      <form
        className={s.stack}
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          const normalized = normalizeEmail(email);
          if (!normalized) return setLocalError("Digite um e-mail válido.");
          setLocalError(null);
          onSubmit(normalized);
        }}
      >
        <label className={s.label} htmlFor="email">
          E-mail usado na compra
        </label>
        <input
          id="email"
          className={s.input}
          type="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          enterKeyHint="go"
          placeholder="seuemail@exemplo.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-invalid={!!shown}
          aria-describedby={shown ? "email-error" : undefined}
          maxLength={254}
          required
        />
        {shown && (
          <p id="email-error" className={s.error} role="alert">
            {shown}
          </p>
        )}
        <button type="submit" className={s.cta} disabled={!email.trim()}>
          CONTINUAR
        </button>
      </form>
    </section>
  );
}
