"use client";

import { useEffect, useState } from "react";
import s from "../personalizar.module.css";

const STEPS = ["Personalizando introdução...", "Organizando pistas...", "Preparando certificado...", "Finalizando aventura..."];

/** Indicador visual enquanto o servidor gera. Nenhuma espera artificial: some assim que a resposta chega. */
export default function PreparingProgress({ childName }: { childName: string }) {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setStep((v) => Math.min(v + 1, STEPS.length - 1)), 900);
    return () => clearInterval(id);
  }, []);

  return (
    <section className={`${s.card} ${s.center}`} aria-live="polite" aria-busy="true">
      <div className={s.spinner} aria-hidden="true" />
      <h1 className={s.title}>Preparando a aventura de {childName}...</h1>
      <ol className={s.steps}>
        {STEPS.map((label, i) => (
          <li key={label} className={i < step ? s.stepDone : i === step ? s.stepActive : s.stepTodo}>
            <span aria-hidden="true">{i < step ? "✓" : "•"}</span> {label}
          </li>
        ))}
      </ol>
    </section>
  );
}
