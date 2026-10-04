/**
 * Manifesto central dos temas. Fonte única de verdade para IDs, rótulos e pastas.
 * Seguro para o navegador: não contém caminhos do servidor.
 */
export const THEME_IDS = ["dinossauros", "espaco", "futebol", "princesas", "fadas", "sereias"] as const;

export type ThemeId = (typeof THEME_IDS)[number];

export interface ThemeInfo {
  id: ThemeId;
  label: string;
  emoji: string;
  /** Pasta dentro de KITS_DIR. Nunca derivada de input do usuário. */
  folder: string;
}

export const THEMES: Readonly<Record<ThemeId, ThemeInfo>> = Object.freeze({
  dinossauros: { id: "dinossauros", label: "Dinossauros", emoji: "🦖", folder: "dinossauros" },
  espaco: { id: "espaco", label: "Espaço", emoji: "🚀", folder: "espaco" },
  futebol: { id: "futebol", label: "Futebol", emoji: "⚽", folder: "futebol" },
  princesas: { id: "princesas", label: "Princesas", emoji: "👑", folder: "princesas" },
  fadas: { id: "fadas", label: "Fadas", emoji: "🧚", folder: "fadas" },
  sereias: { id: "sereias", label: "Sereias", emoji: "🧜‍♀️", folder: "sereias" },
});

export function isThemeId(value: unknown): value is ThemeId {
  return typeof value === "string" && (THEME_IDS as readonly string[]).includes(value);
}

export const CLUE_COUNT = 8;
