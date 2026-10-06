/** Utilitários de unidade/coordenada. Layout em milímetros com origem no canto SUPERIOR esquerdo. */
import type { PDFPage } from "pdf-lib";
import { rgb } from "pdf-lib";
import type { RGB } from "../../editorial/types";

export const PT_PER_MM = 72 / 25.4;
export const mm = (v: number) => v * PT_PER_MM;
export const A4_MM = { w: 210, h: 297 };

export interface Box {
  x: number; // mm a partir da esquerda
  y: number; // mm a partir do topo
  w: number;
  h: number;
}

export const color = (c: RGB) => rgb(c[0], c[1], c[2]);
const clamp = (v: number) => Math.max(0, Math.min(1, v));
export const shade = (c: RGB, f: number): RGB => [clamp(c[0] * f), clamp(c[1] * f), clamp(c[2] * f)];
export const mix = (a: RGB, b: RGB, t: number): RGB => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

/** Converte um ponto em mm (topo-esquerda) para pontos PDF (base-esquerda). */
export function pt(page: PDFPage, xMm: number, yMm: number) {
  return { x: mm(xMm), y: page.getHeight() - mm(yMm) };
}
