/**
 * Arquivos de cada kit e regras de onde o nome entra.
 * Somente SERVIDOR. Caminhos são montados a partir deste manifesto + THEMES[theme].folder,
 * nunca a partir de texto enviado pelo usuário.
 */
import fs from "node:fs";
import path from "node:path";
import { CLUE_COUNT, THEME_IDS, THEMES, type ThemeId } from "../themes";

export const KIT_EXTENSIONS = [".png", ".jpg", ".jpeg"] as const;

export const INTRO_BASENAME = "introducao";
export const CERTIFICATE_BASENAME = "certificado";
export const CLUE_BASENAMES: readonly string[] = Array.from(
  { length: CLUE_COUNT },
  (_, i) => `pista-${String(i + 1).padStart(2, "0")}`,
);

/** Área relativa à imagem (0..1, origem no canto superior esquerdo). */
export interface Slot {
  x: number;
  y: number;
  w: number;
  h: number;
}

export type NamePlacement =
  /** Faixa de pergaminho FORA da arte (acima dela). Não cobre nada do template. */
  | { mode: "banner"; template: string }
  /** Texto por cima da arte, dentro de `slot`. `label: true` desenha um pergaminho por trás. */
  | { mode: "overlay"; template: string; slot: Slot; label: boolean; color?: [number, number, number] };

export interface KitLayout {
  intro: NamePlacement;
  certificate: NamePlacement;
}

/**
 * Padrão seguro enquanto as artes finais não forem calibradas:
 * - introdução: faixa "Olá, {nome}!" acima da arte (não cobre o template);
 * - certificado: etiqueta de pergaminho com o nome no centro-baixo.
 * Ajuste por tema em LAYOUT_OVERRIDES depois de ver `npm run pdf:sample`.
 */
export const DEFAULT_LAYOUT: KitLayout = {
  intro: { mode: "banner", template: "Olá, {nome}!" },
  certificate: {
    mode: "overlay",
    template: "{nome}",
    slot: { x: 0.18, y: 0.44, w: 0.64, h: 0.14 },
    label: true,
  },
};

/**
 * Calibrado com as artes definitivas (out/2026): nenhum certificado tem área livre para o nome —
 * todo espaço vazio já tem texto, medalha/troféu ou o quadro de data/assinatura. Por isso o nome vai numa
 * faixa de pergaminho ACIMA da arte, e a frase emenda no texto impresso logo abaixo:
 *   "Parabéns, Miguel!"  →  "Você concluiu a Missão do Cristal Lunar e se tornou um verdadeiro astronauta!"
 * Introdução: padrão (faixa "Olá, {nome}!" acima do título da missão).
 */
const CERTIFICATE_BANNER: NamePlacement = { mode: "banner", template: "Parabéns, {nome}!" };

export const LAYOUT_OVERRIDES: Partial<Record<ThemeId, Partial<KitLayout>>> = {
  dinossauros: { certificate: CERTIFICATE_BANNER },
  espaco: { certificate: CERTIFICATE_BANNER },
  futebol: { certificate: CERTIFICATE_BANNER },
  princesas: { certificate: CERTIFICATE_BANNER },
  fadas: { certificate: CERTIFICATE_BANNER },
  sereias: { certificate: CERTIFICATE_BANNER },
};

export function layoutFor(theme: ThemeId): KitLayout {
  return { ...DEFAULT_LAYOUT, ...LAYOUT_OVERRIDES[theme] };
}

export interface KitFiles {
  theme: ThemeId;
  dir: string;
  intro: string;
  clues: string[];
  certificate: string;
}

export class MissingKitAssetsError extends Error {
  constructor(
    public theme: ThemeId,
    public missing: string[],
  ) {
    super(`Kit "${theme}" incompleto. Faltando: ${missing.join(", ")}`);
    this.name = "MissingKitAssetsError";
  }
}

function findAsset(dir: string, basename: string): string | null {
  for (const ext of KIT_EXTENSIONS) {
    const p = path.join(dir, basename + ext);
    if (fs.existsSync(p)) return p;
  }
  return null;
}

export function kitDir(theme: ThemeId, kitsDir: string): string {
  return path.join(kitsDir, THEMES[theme].folder);
}

/** Lista os arquivos faltantes de um tema (nomes esperados, ex.: "pista-03.png"). */
export function missingAssets(theme: ThemeId, kitsDir: string): string[] {
  const dir = kitDir(theme, kitsDir);
  return [INTRO_BASENAME, ...CLUE_BASENAMES, CERTIFICATE_BASENAME]
    .filter((b) => !findAsset(dir, b))
    .map((b) => `${THEMES[theme].folder}/${b}.png`);
}

export function resolveKit(theme: ThemeId, kitsDir: string): KitFiles {
  const missing = missingAssets(theme, kitsDir);
  if (missing.length) throw new MissingKitAssetsError(theme, missing);
  const dir = kitDir(theme, kitsDir);
  return {
    theme,
    dir,
    intro: findAsset(dir, INTRO_BASENAME)!,
    clues: CLUE_BASENAMES.map((b) => findAsset(dir, b)!),
    certificate: findAsset(dir, CERTIFICATE_BASENAME)!,
  };
}

export function kitsReport(kitsDir: string): Record<ThemeId, string[]> {
  return Object.fromEntries(THEME_IDS.map((t) => [t, missingAssets(t, kitsDir)])) as Record<ThemeId, string[]>;
}
