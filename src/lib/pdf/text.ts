import type { PDFFont } from "pdf-lib";

export interface FittedText {
  lines: string[];
  size: number;
  lineHeight: number;
}

/** Quebra em até 2 linhas, escolhendo o ponto de quebra mais equilibrado. */
function twoLineSplits(text: string): [string, string][] {
  const words = text.split(" ");
  const out: [string, string][] = [];
  for (let i = 1; i < words.length; i++) out.push([words.slice(0, i).join(" "), words.slice(i).join(" ")]);
  return out;
}

/**
 * Encaixa o texto na caixa: reduz a fonte até `minSize`, tenta 1 linha e depois 2 linhas.
 * Último recurso (palavra única gigantesca): corta com reticências no tamanho mínimo.
 */
export function fitText(
  font: PDFFont,
  text: string,
  box: { width: number; height: number },
  opts: { maxSize: number; minSize: number; lineHeightRatio?: number },
): FittedText {
  const lh = opts.lineHeightRatio ?? 1.1;
  const width = (s: string, size: number) => font.widthOfTextAtSize(s, size);

  for (let size = opts.maxSize; size >= opts.minSize; size -= 1) {
    if (width(text, size) <= box.width && size * lh <= box.height) {
      return { lines: [text], size, lineHeight: size * lh };
    }
  }
  for (let size = opts.maxSize; size >= opts.minSize; size -= 1) {
    if (size * lh * 2 > box.height) continue;
    let best: [string, string] | null = null;
    let bestWidth = Infinity;
    for (const [a, b] of twoLineSplits(text)) {
      const w = Math.max(width(a, size), width(b, size));
      if (w <= box.width && w < bestWidth) {
        best = [a, b];
        bestWidth = w;
      }
    }
    if (best) return { lines: best, size, lineHeight: size * lh };
  }
  const size = opts.minSize;
  let cut = text;
  while (cut.length > 1 && width(cut + "…", size) > box.width) cut = cut.slice(0, -1);
  return { lines: [cut.trimEnd() + "…"], size, lineHeight: size * lh };
}
