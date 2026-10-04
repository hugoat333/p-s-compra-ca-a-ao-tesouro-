"use client";

import Image from "next/image";
import { THEME_IDS, THEMES, type ThemeId } from "@/lib/themes";
import s from "../personalizar.module.css";

interface Props {
  value: ThemeId | null;
  onChange: (id: ThemeId) => void;
  thumbs: Record<ThemeId, boolean>;
}

/** Grupo de rádio nativo estilizado como cards: teclado (setas/Tab), leitores de tela e aria-checked de graça. */
export default function ThemePicker({ value, onChange, thumbs }: Props) {
  return (
    <fieldset className={s.section}>
      <legend className={s.sectionTitle}>1. Escolha o tema da aventura</legend>
      <p className={s.sectionText}>Qual mundo seu pequeno aventureiro vai explorar?</p>
      <div className={s.themeGrid}>
        {THEME_IDS.map((id, i) => {
          const t = THEMES[id];
          const selected = value === id;
          return (
            <label key={id} className={`${s.themeCard} ${selected ? s.themeSelected : ""}`} data-theme={id}>
              <input
                type="radio"
                name="theme"
                value={id}
                checked={selected}
                onChange={() => onChange(id)}
                className="sr-only"
                aria-label={t.label}
              />
              <span className={s.themeMedia} aria-hidden="true">
                {thumbs[id] ? (
                  <Image
                    src={`/temas/${id}.webp`}
                    alt=""
                    fill
                    sizes="(min-width: 640px) 180px, 45vw"
                    className={s.themeImg}
                    priority={i < 4}
                  />
                ) : (
                  <span className={s.themeEmoji}>{t.emoji}</span>
                )}
              </span>
              <span className={s.themeName}>{t.label}</span>
              <span className={s.themeCheck} aria-hidden="true">
                ✓
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
