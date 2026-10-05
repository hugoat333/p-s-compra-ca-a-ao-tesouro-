/** Primitivas vetoriais: caixas arredondadas, placas de madeira, folhas, pegadas, medalha, marcas de corte. */
import { degrees, pushGraphicsState, popGraphicsState, moveTo, lineTo, appendBezierCurve, closePath, clip, endPath, type PDFPage } from "pdf-lib";
import type { RGB } from "../../editorial/types";
import { type Box, color, mm, pt, shade } from "./units";

const K = 0.5523;

function roundedSvg(w: number, h: number, r: number): string {
  r = Math.min(r, w / 2, h / 2);
  return `M ${r} 0 H ${w - r} C ${w - r + r * K} 0 ${w} ${r - r * K} ${w} ${r} V ${h - r} C ${w} ${h - r + r * K} ${w - r + r * K} ${h} ${w - r} ${h} H ${r} C ${r - r * K} ${h} 0 ${h - r + r * K} 0 ${h - r} V ${r} C 0 ${r - r * K} ${r - r * K} 0 ${r} 0 Z`;
}

export function roundedRect(
  page: PDFPage,
  b: Box,
  o: { r?: number; fill?: RGB; stroke?: RGB; strokeW?: number; opacity?: number; dash?: number[] },
) {
  const p = pt(page, b.x, b.y);
  page.drawSvgPath(roundedSvg(mm(b.w), mm(b.h), mm(o.r ?? 3)), {
    x: p.x,
    y: p.y,
    color: o.fill ? color(o.fill) : undefined,
    borderColor: o.stroke ? color(o.stroke) : undefined,
    borderWidth: o.stroke ? mm(o.strokeW ?? 0.4) : 0,
    opacity: o.opacity,
    borderOpacity: o.opacity,
    borderDashArray: o.dash,
  });
}

export function circle(page: PDFPage, cx: number, cy: number, r: number, o: { fill?: RGB; stroke?: RGB; strokeW?: number; opacity?: number }) {
  const p = pt(page, cx, cy);
  page.drawCircle({
    x: p.x,
    y: p.y,
    size: mm(r),
    color: o.fill ? color(o.fill) : undefined,
    borderColor: o.stroke ? color(o.stroke) : undefined,
    borderWidth: o.stroke ? mm(o.strokeW ?? 0.4) : 0,
    opacity: o.opacity,
  });
}

/** Inicia um recorte (clip) arredondado ou circular. Fechar com endClip(). */
export function beginClip(page: PDFPage, b: Box, shape: "rect" | "circle", rMm = 2) {
  const x = mm(b.x);
  const yTop = page.getHeight() - mm(b.y);
  const w = mm(b.w);
  const h = mm(b.h);
  const y = yTop - h;
  const r = shape === "circle" ? Math.min(w, h) / 2 : Math.min(mm(rMm), w / 2, h / 2);
  const k = r * K;
  page.pushOperators(
    pushGraphicsState(),
    moveTo(x + r, y),
    lineTo(x + w - r, y),
    appendBezierCurve(x + w - r + k, y, x + w, y + r - k, x + w, y + r),
    lineTo(x + w, y + h - r),
    appendBezierCurve(x + w, y + h - r + k, x + w - r + k, y + h, x + w - r, y + h),
    lineTo(x + r, y + h),
    appendBezierCurve(x + r - k, y + h, x, y + h - r + k, x, y + h - r),
    lineTo(x, y + r),
    appendBezierCurve(x, y + r - k, x + r - k, y, x + r, y),
    closePath(),
    clip(),
    endPath(),
  );
}

export function endClip(page: PDFPage) {
  page.pushOperators(popGraphicsState());
}

/** Placa de madeira com veios e pregos. */
export function plank(page: PDFPage, b: Box, wood: RGB, woodDark: RGB) {
  roundedRect(page, { x: b.x + 0.6, y: b.y + 0.9, w: b.w, h: b.h }, { r: 2.2, fill: shade(woodDark, 0.7), opacity: 0.35 });
  roundedRect(page, b, { r: 2.2, fill: wood, stroke: woodDark, strokeW: 0.7 });
  const grain = shade(wood, 0.82);
  const lines = Math.max(2, Math.round(b.h / 7));
  for (let i = 1; i <= lines; i++) {
    const yy = b.y + (b.h * i) / (lines + 1);
    const a = pt(page, b.x + 3, yy);
    const c = pt(page, b.x + b.w - 3, yy + (i % 2 ? 0.5 : -0.4));
    page.drawLine({ start: a, end: c, thickness: mm(0.25), color: color(grain), opacity: 0.55 });
  }
  const nail = Math.min(1.1, b.h / 10);
  for (const nx of [b.x + 2.6, b.x + b.w - 2.6]) {
    circle(page, nx, b.y + 2.6, nail, { fill: shade(woodDark, 0.9) });
    circle(page, nx - nail * 0.25, b.y + 2.6 - nail * 0.25, nail * 0.35, { fill: [0.85, 0.75, 0.6], opacity: 0.8 });
  }
}

/** Folha estilizada (elipse + nervura). angle em graus, 0 = apontando para a direita. */
export function leaf(page: PDFPage, cx: number, cy: number, len: number, angle: number, fill: RGB, vein: RGB) {
  const p = pt(page, cx, cy);
  page.drawEllipse({ x: p.x, y: p.y, xScale: mm(len / 2), yScale: mm(len / 5.2), color: color(fill), rotate: degrees(angle) });
  const rad = (angle * Math.PI) / 180;
  const dx = Math.cos(rad) * (len / 2) * 0.85;
  const dy = Math.sin(rad) * (len / 2) * 0.85;
  page.drawLine({ start: pt(page, cx - dx, cy + dy), end: pt(page, cx + dx, cy - dy), thickness: mm(0.3), color: color(vein), opacity: 0.7 });
}

/** Tufo de folhas num canto. corner: tl | tr | bl | br */
export function leafCluster(page: PDFPage, x: number, y: number, scale: number, corner: "tl" | "tr" | "bl" | "br", light: RGB, dark: RGB) {
  const sx = corner === "tl" || corner === "bl" ? 1 : -1;
  const sy = corner === "tl" || corner === "tr" ? 1 : -1;
  const base = corner === "tl" ? -30 : corner === "tr" ? 210 : corner === "bl" ? 30 : 150;
  const leaves: [number, number, number, number][] = [
    [6, 2, 16, 0],
    [2, 7, 15, -55],
    [10, 8, 13, -25],
    [4, 13, 11, -75],
    [15, 3, 10, 20],
  ];
  leaves.forEach(([dx, dy, len, da], i) => {
    const angle = sx === 1 ? base + (sy === 1 ? da : -da) : base - (sy === 1 ? da : -da);
    leaf(page, x + sx * dx * scale, y + sy * dy * scale, len * scale, angle, i % 2 ? dark : light, i % 2 ? light : dark);
  });
}

/** Contorno de pegada de três dedos (caixa 100×110, y para baixo): calcanhar redondo + dedos pontudos. */
const FOOTPRINT_PATH =
  "M 50 108 C 30 108 26 92 30 78 C 22 62 10 38 12 18 C 22 34 34 50 40 58 C 42 40 44 20 50 2 " +
  "C 56 20 58 40 60 58 C 66 50 78 34 88 18 C 90 38 78 62 70 78 C 74 92 70 108 50 108 Z";

/** Pegada de dinossauro centrada em (cx, cy) com altura `size` mm. rotation em graus (horário). */
export function footprint(page: PDFPage, cx: number, cy: number, size: number, fill: RGB, rotation = 0) {
  const sc = mm(size) / 110; // pt por unidade do path
  const th = (-rotation * Math.PI) / 180; // pdf-lib gira no sentido anti-horário
  const c = pt(page, cx, cy);
  // Centro do path relativo à origem (canto sup. esq.), já em coordenadas PDF.
  const ox = 50 * sc;
  const oy = -55 * sc;
  const rx = ox * Math.cos(th) - oy * Math.sin(th);
  const ry = ox * Math.sin(th) + oy * Math.cos(th);
  page.drawSvgPath(FOOTPRINT_PATH, { x: c.x - rx, y: c.y - ry, scale: sc, color: color(fill), rotate: degrees(-rotation) });
}

/** Medalha vetorial com fitas e ícone. */
export function medal(page: PDFPage, cx: number, cy: number, r: number, gold: RGB, ribbon: RGB, iconFill: RGB, inner: RGB) {
  const ribbonPath = (dir: number) => {
    const top = pt(page, cx + dir * r * 0.35, cy + r * 0.5);
    const w = mm(r * 0.55);
    const h = mm(r * 1.25);
    return { top, path: `M 0 0 L ${w} 0 L ${w} ${h} L ${w / 2} ${h - mm(r * 0.25)} L 0 ${h} Z`, w };
  };
  for (const dir of [-1, 1]) {
    const { top, path, w } = ribbonPath(dir);
    page.drawSvgPath(path, { x: top.x - w / 2, y: top.y, color: color(ribbon), rotate: degrees(dir * -14) });
  }
  circle(page, cx + 0.5, cy + 0.7, r, { fill: shade(gold, 0.55), opacity: 0.35 });
  circle(page, cx, cy, r, { fill: gold, stroke: shade(gold, 0.7), strokeW: 0.8 });
  const teeth = 28;
  for (let i = 0; i < teeth; i++) {
    const a = (i / teeth) * Math.PI * 2;
    circle(page, cx + Math.cos(a) * r * 0.9, cy + Math.sin(a) * r * 0.9, r * 0.05, { fill: shade(gold, 0.78) });
  }
  circle(page, cx, cy, r * 0.74, { fill: inner, stroke: shade(gold, 0.75), strokeW: 0.6 });
  footprint(page, cx, cy, r * 1.05, iconFill);
}

/** Marcas de corte nos cantos de uma caixa (fora dela). */
export function cropMarks(page: PDFPage, b: Box, gap = 1.5, len = 4, c: RGB = [0.6, 0.6, 0.6]) {
  const t = mm(0.25);
  const corners: [number, number, number, number][] = [
    [b.x, b.y, -1, -1],
    [b.x + b.w, b.y, 1, -1],
    [b.x, b.y + b.h, -1, 1],
    [b.x + b.w, b.y + b.h, 1, 1],
  ];
  for (const [x, y, sx, sy] of corners) {
    page.drawLine({ start: pt(page, x + sx * gap, y), end: pt(page, x + sx * (gap + len), y), thickness: t, color: color(c) });
    page.drawLine({ start: pt(page, x, y + sy * gap), end: pt(page, x, y + sy * (gap + len)), thickness: t, color: color(c) });
  }
}
