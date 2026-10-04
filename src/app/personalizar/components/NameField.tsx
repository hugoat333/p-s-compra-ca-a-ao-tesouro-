"use client";

import { CHILD_NAME_MAX_LENGTH } from "@/lib/childName";
import s from "../personalizar.module.css";

interface Props {
  value: string;
  onChange: (v: string) => void;
  onBlur: () => void;
  error: string | null;
}

export default function NameField({ value, onChange, onBlur, error }: Props) {
  return (
    <div className={s.section}>
      <h2 className={s.sectionTitle}>2. Qual é o nome do aventureiro?</h2>
      <label className={s.label} htmlFor="child-name">
        Nome da criança
      </label>
      <input
        id="child-name"
        className={s.input}
        type="text"
        placeholder="Ex: Miguel"
        autoComplete="off"
        autoCapitalize="words"
        spellCheck={false}
        enterKeyHint="done"
        // Margem para espaços extras; o limite real é aplicado após remover espaços duplicados.
        maxLength={CHILD_NAME_MAX_LENGTH + 10}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        aria-invalid={!!error}
        aria-describedby={error ? "child-name-help child-name-error" : "child-name-help"}
        required
      />
      <p id="child-name-help" className={s.sectionText}>
        Esse nome aparecerá na introdução e no certificado da missão.
      </p>
      {error && (
        <p id="child-name-error" className={s.error} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
