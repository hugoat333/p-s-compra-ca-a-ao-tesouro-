/** Tipografia nativa: quebra de linha, ajuste automático de tamanho e desenho centralizado. */
import type { PDFFont, PDFPage } from "pdf-lib";
import type { RGB } from "../../editorial/types";
import { type Box, color, mm, pt, PT_PER_MM } from "./units";

export interface TextBlock {
  lines: string[];
  size: number; // pt
  lineHeight: number; // mm
  height: number; // mm
}

export function wrap(font: PDFFont, text: string, size: number, maxWidthMm: number): string[] {
  const max = mm(maxWidthMm);
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const candidate = line ? `${line} ${w}` : w;
    if (font.widthOfTextAtSize(candidate, size) <= max || !line) line = candidate;
    else {
      lines.push(line);
      line = w;
    }
  }
  if (line) lines.push(line);
  return lines;
}

/** Equilibra as linhas (evita uma palavra sozinha na última linha) mantendo a mesma quantidade de linhas. */
function balance(font: PDFFont, text: string, size: number, maxWidthMm: number): string[] {
  const greedy = wrap(font, text, size, maxWidthMm);
  if (greedy.length < 2) return greedy;
  let lo = maxWidthMm * 0.5;
  let hi = maxWidthMm;
  let best = greedy;
  for (let i = 0; i < 12; i++) {
    const mid = (lo + hi) / 2;
    const attempt = wrap(font, text, size, mid);
    if (attempt.length <= greedy.length) {
      best = attempt;
      hi = mid;
    } else lo = mid;
  }
  return best;
}

export function measure(font: PDFFont, text: string, size: number, widthMm: number, leading = 1.22, maxLines = Infinity): TextBlock | null {
  const lines = balance(font, text, size, widthMm);
  if (lines.length > maxLines) return null;
  if (lines.some((l) => font.widthOfTextAtSize(l, size) > mm(widthMm))) return null;
  const lineHeight = (size * leading) / PT_PER_MM;
  return { lines, size, lineHeight, height: lineHeight * lines.length };
}

/** Maior tamanho (entre max e min) cujo bloco cabe em width×maxHeight. */
export function fit(
  font: PDFFont,
  text: string,
  widthMm: number,
  maxHeightMm: number,
  o: { max: number; min: number; leading?: number; maxLines?: number },
): TextBlock {
  for (let s = o.max; s >= o.min; s -= 0.25) {
    const b = measure(font, text, s, widthMm, o.leading, o.maxLines);
    if (b && b.height <= maxHeightMm) return b;
  }
  const b = measure(font, text, o.min, widthMm, o.leading);
  if (!b) throw new Error(`Texto não cabe nem no tamanho mínimo: "${text.slice(0, 40)}…"`);
  return b;
}

/** Desenha um bloco centralizado horizontalmente a partir de y (topo do bloco). */
export function drawBlock(
  page: PDFPage,
  font: PDFFont,
  block: TextBlock,
  x: number,
  y: number,
  widthMm: number,
  c: RGB,
  o: { shadow?: RGB; shadowOffset?: number; align?: "center" | "left" } = {},
) {
  const ascent = font.heightAtSize(block.size, { descender: false }) / PT_PER_MM;
  const extra = (block.lineHeight - ascent) / 2;
  block.lines.forEach((line, i) => {
    const w = font.widthOfTextAtSize(line, block.size) / PT_PER_MM;
    const lx = o.align === "left" ? x : x + (widthMm - w) / 2;
    const baseline = y + i * block.lineHeight + extra + ascent * 0.92;
    if (o.shadow) {
      const off = o.shadowOffset ?? block.size * 0.018;
      const ps = pt(page, lx + off, baseline + off);
      page.drawText(line, { x: ps.x, y: ps.y, size: block.size, font, color: color(o.shadow) });
    }
    const p = pt(page, lx, baseline);
    page.drawText(line, { x: p.x, y: p.y, size: block.size, font, color: color(c) });
  });
}

/** Ajusta e desenha centralizado verticalmente dentro da caixa. */
export function drawFitted(
  page: PDFPage,
  font: PDFFont,
  text: string,
  box: Box,
  c: RGB,
  o: { max: number; min: number; leading?: number; maxLines?: number; shadow?: RGB; shadowOffset?: number },
): TextBlock {
  const b = fit(font, text, box.w, box.h, o);
  drawBlock(page, font, b, box.x, box.y + (box.h - b.height) / 2, box.w, c, o);
  return b;
}
