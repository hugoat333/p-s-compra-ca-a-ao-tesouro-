/**
 * Kit editorial: a página é construída pelo PDF (vetor + tipografia nativa) e as artes raster
 * entram só como ilustrações recortadas, nunca ampliadas além do DPI mínimo.
 */
export type RGB = [number, number, number];

/** Recorte em pixels da arte original (origem no canto superior esquerdo). */
export interface Crop {
  file: string; // nome-base do arquivo dentro de kits/<tema>/ (ex.: "pista-01")
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Palette {
  page: RGB; // fundo da página
  parchment: RGB; // fundo dos cards/caixas
  parchmentEdge: RGB;
  wood: RGB; // placas
  woodDark: RGB;
  woodText: RGB; // texto sobre a placa
  ink: RGB; // texto principal
  accent: RGB; // destaques (Olá, nome)
  accentDark: RGB;
  alert: RGB; // título da pista final
  leaf: RGB;
  leafDark: RGB;
  badge: RGB; // selo redondo
  badgeEdge: RGB;
  icon: RGB; // pegada/ícone do selo
  gold: RGB;
}

export type Icon = "footprint";

export interface ClueContent {
  title: string;
  /** Título em caixa alta e cor de alerta (ex.: pista final). */
  titleStyle?: "normal" | "final";
  body: string;
  challenge?: { label: string; text: string };
  art: Crop;
}

export interface EditorialKit {
  palette: Palette;
  icon: Icon;
  intro: {
    titleLines: string[];
    headline: string;
    paragraphs: string[];
    /** Medalhões circulares com personagens do tema. */
    cast: Crop[];
  };
  clues: ClueContent[]; // exatamente 8
  certificate: {
    title: string;
    subtitle: string;
    text: string;
    dateLabel: string;
    signatureLabel: string;
    art: Crop[]; // medalhões decorativos
  };
}
