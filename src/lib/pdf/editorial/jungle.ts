/**
 * Cenário vetorial "expedição jurássica": textura de pergaminho, vegetação, pedras, ovos, bússola,
 * trilhas pontilhadas, marcas de exploração e máscaras orgânicas. Tudo determinístico (seed).
 */
import {
  degrees,
  pushGraphicsState,
  popGraphicsState,
  moveTo,
  appendBezierCurve,
  closePath,
  clip,
  endPath,
  type PDFPage,
} from "pdf-lib";
import type { RGB } from "../../editorial/types";
import { type Box, color, mix, mm, pt, shade } from "./units";
import { footprint } from "./shapes";

// ───────────── aleatoriedade determinística ─────────────
export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type P = { x: number; y: number }; // mm, topo-esquerda

// ───────────── caminhos orgânicos ─────────────
/** Pontos ao redor de uma caixa com deslocamento aleatório (borda rasgada / orgânica). */
export function organicPoints(b: Box, seed: number, amp: number, step = 4): P[] {
  const r = rng(seed);
  const pts: P[] = [];
  const j = () => (r() - 0.5) * 2 * amp;
  const nx = Math.max(3, Math.round(b.w / step));
  const ny = Math.max(3, Math.round(b.h / step));
  for (let i = 0; i < nx; i++) pts.push({ x: b.x + (b.w * i) / nx, y: b.y + j() });
  for (let i = 0; i < ny; i++) pts.push({ x: b.x + b.w + j(), y: b.y + (b.h * i) / ny });
  for (let i = nx; i > 0; i--) pts.push({ x: b.x + (b.w * i) / nx, y: b.y + b.h + j() });
  for (let i = ny; i > 0; i--) pts.push({ x: b.x + j(), y: b.y + (b.h * i) / ny });
  return pts;
}

/** Elipse orgânica (blob) com n pontos. */
export function blobPoints(cx: number, cy: number, rx: number, ry: number, seed: number, wobble = 0.15, n = 10): P[] {
  const r = rng(seed);
  return Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2;
    const k = 1 + (r() - 0.5) * 2 * wobble;
    return { x: cx + Math.cos(a) * rx * k, y: cy + Math.sin(a) * ry * k };
  });
}

/** Catmull-Rom fechado → segmentos Bézier cúbicos. */
function smooth(pts: P[]) {
  const n = pts.length;
  const segs: { c1: P; c2: P; to: P }[] = [];
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % n];
    const p3 = pts[(i + 2) % n];
    segs.push({
      c1: { x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 },
      c2: { x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 },
      to: p2,
    });
  }
  return segs;
}

/** Preenche/contorna um caminho suavizado. */
export function drawShape(page: PDFPage, pts: P[], o: { fill?: RGB; stroke?: RGB; strokeW?: number; opacity?: number; sharp?: boolean }) {
  const ox = pts[0].x;
  const oy = pts[0].y;
  const q = (p: P) => `${mm(p.x - ox).toFixed(2)} ${mm(p.y - oy).toFixed(2)}`;
  let d = `M 0 0 `;
  if (o.sharp) d += pts.slice(1).map((p) => `L ${q(p)}`).join(" ") + " Z";
  else d += smooth(pts).map((s) => `C ${q(s.c1)} ${q(s.c2)} ${q(s.to)}`).join(" ") + " Z";
  const p0 = pt(page, ox, oy);
  page.drawSvgPath(d, {
    x: p0.x,
    y: p0.y,
    color: o.fill ? color(o.fill) : undefined,
    borderColor: o.stroke ? color(o.stroke) : undefined,
    borderWidth: o.stroke ? mm(o.strokeW ?? 0.3) : 0,
    opacity: o.opacity,
    borderOpacity: o.opacity,
  });
}

/** Abre um recorte (clip) com o caminho suavizado. Fechar com popClip(). */
export function pushClip(page: PDFPage, pts: P[]) {
  const H = page.getHeight();
  const X = (p: P) => mm(p.x);
  const Y = (p: P) => H - mm(p.y);
  const ops = [pushGraphicsState(), moveTo(X(pts[0]), Y(pts[0]))];
  for (const s of smooth(pts)) ops.push(appendBezierCurve(X(s.c1), Y(s.c1), X(s.c2), Y(s.c2), X(s.to), Y(s.to)));
  ops.push(closePath(), clip(), endPath());
  page.pushOperators(...ops);
}

export function popClip(page: PDFPage) {
  page.pushOperators(popGraphicsState());
}

// ───────────── textura de pergaminho ─────────────
export function parchment(page: PDFPage, pts: P[], b: Box, seed: number, base: RGB, edge: RGB) {
  drawShape(page, pts.map((p) => ({ x: p.x + 0.5, y: p.y + 0.8 })), { fill: shade(edge, 0.45), opacity: 0.45 });
  drawShape(page, pts, { fill: base });
  pushClip(page, pts);
  const r = rng(seed);
  // Vinheta: anéis internos mais escuros nas bordas.
  for (let i = 0; i < 5; i++) {
    const inset = i * 1.6;
    drawShape(page, organicPoints({ x: b.x + inset, y: b.y + inset, w: b.w - 2 * inset, h: b.h - 2 * inset }, seed + i, 0.8, 6), {
      stroke: edge,
      strokeW: 2.2,
      opacity: 0.12 - i * 0.02,
    });
  }
  // Manchas suaves.
  for (let i = 0; i < 6; i++) {
    const cx = b.x + r() * b.w;
    const cy = b.y + r() * b.h;
    drawShape(page, blobPoints(cx, cy, 4 + r() * 9, 3 + r() * 6, seed * 7 + i, 0.3, 8), { fill: edge, opacity: 0.06 });
  }
  // Pontinhos e fibras.
  for (let i = 0; i < 140; i++) {
    const p = pt(page, b.x + r() * b.w, b.y + r() * b.h);
    page.drawCircle({ x: p.x, y: p.y, size: mm(0.08 + r() * 0.18), color: color(shade(edge, 0.7)), opacity: 0.15 + r() * 0.2 });
  }
  for (let i = 0; i < 26; i++) {
    const x = b.x + r() * b.w;
    const y = b.y + r() * b.h;
    const l = 1.5 + r() * 3.5;
    const a = r() * Math.PI;
    page.drawLine({
      start: pt(page, x, y),
      end: pt(page, x + Math.cos(a) * l, y + Math.sin(a) * l),
      thickness: mm(0.12),
      color: color(shade(edge, 0.8)),
      opacity: 0.18,
    });
  }
  popClip(page);
  drawShape(page, pts, { stroke: shade(edge, 0.75), strokeW: 0.35 });
}

// ───────────── vegetação ─────────────
export interface Greens {
  light: RGB;
  mid: RGB;
  dark: RGB;
}

/** Folha lanceolada com nervura; ângulo em graus (0 = direita, sentido horário na página). */
export function bladeLeaf(page: PDFPage, x: number, y: number, len: number, angle: number, width: number, fill: RGB, vein: RGB) {
  const a = (angle * Math.PI) / 180;
  const ux = Math.cos(a);
  const uy = Math.sin(a);
  const nx = -uy;
  const ny = ux;
  const tip = { x: x + ux * len, y: y + uy * len };
  const w = width / 2;
  const pts: P[] = [
    { x, y },
    { x: x + ux * len * 0.3 + nx * w, y: y + uy * len * 0.3 + ny * w },
    { x: x + ux * len * 0.65 + nx * w * 0.8, y: y + uy * len * 0.65 + ny * w * 0.8 },
    tip,
    { x: x + ux * len * 0.65 - nx * w * 0.8, y: y + uy * len * 0.65 - ny * w * 0.8 },
    { x: x + ux * len * 0.3 - nx * w, y: y + uy * len * 0.3 - ny * w },
  ];
  drawShape(page, pts, { fill });
  page.drawLine({ start: pt(page, x, y), end: pt(page, tip.x - ux * len * 0.08, tip.y - uy * len * 0.08), thickness: mm(0.22), color: color(vein), opacity: 0.75 });
}

/** Samambaia: haste curva com folíolos alternados. */
export function fern(page: PDFPage, x: number, y: number, len: number, angle: number, g: Greens, seed: number, flip = 1) {
  const r = rng(seed);
  const a0 = (angle * Math.PI) / 180;
  const n = Math.round(len / 2.2);
  let px = x;
  let py = y;
  for (let i = 0; i < n; i++) {
    const t = i / n;
    const a = a0 + flip * t * 0.6;
    const nx2 = px + Math.cos(a) * (len / n);
    const ny2 = py + Math.sin(a) * (len / n);
    page.drawLine({ start: pt(page, px, py), end: pt(page, nx2, ny2), thickness: mm(0.35 * (1 - t) + 0.12), color: color(g.dark) });
    const ll = (1 - t * 0.75) * len * 0.22;
    const deg = (a * 180) / Math.PI;
    bladeLeaf(page, nx2, ny2, ll, deg - 62, ll * 0.32, i % 2 ? g.mid : g.light, g.dark);
    bladeLeaf(page, nx2, ny2, ll, deg + 62, ll * 0.32, i % 2 ? g.light : g.mid, g.dark);
    px = nx2;
    py = ny2;
    void r;
  }
}

/** Folha larga tropical (estilo costela-de-adão simplificada). */
export function bigLeaf(page: PDFPage, x: number, y: number, len: number, angle: number, g: Greens, tone: "light" | "mid" | "dark" = "mid") {
  const fill = g[tone];
  const vein = tone === "dark" ? g.mid : g.dark;
  bladeLeaf(page, x, y, len, angle, len * 0.55, fill, vein);
  const a = (angle * Math.PI) / 180;
  for (const t of [0.3, 0.5, 0.7]) {
    const cx = x + Math.cos(a) * len * t;
    const cy = y + Math.sin(a) * len * t;
    for (const s of [-1, 1]) {
      const b = a + s * 1.0;
      page.drawLine({
        start: pt(page, cx, cy),
        end: pt(page, cx + Math.cos(b) * len * 0.18, cy + Math.sin(b) * len * 0.18),
        thickness: mm(0.15),
        color: color(vein),
        opacity: 0.6,
      });
    }
  }
}

/** Cipó vertical com folhas ao longo. */
export function vine(page: PDFPage, x: number, y0: number, y1: number, g: Greens, seed: number, side: 1 | -1) {
  const r = rng(seed);
  const steps = Math.round((y1 - y0) / 3);
  let prev = { x, y: y0 };
  for (let i = 1; i <= steps; i++) {
    const y = y0 + ((y1 - y0) * i) / steps;
    const cx = x + Math.sin(i * 0.9 + seed) * 1.4;
    page.drawLine({ start: pt(page, prev.x, prev.y), end: pt(page, cx, y), thickness: mm(0.45), color: color(g.dark) });
    if (i % 2 === 0) {
      const len = 3.5 + r() * 3;
      bladeLeaf(page, cx, y, len, side === 1 ? 10 + r() * 40 : 130 + r() * 40, len * 0.5, r() > 0.5 ? g.light : g.mid, g.dark);
    }
    prev = { x: cx, y };
  }
}

// ───────────── elementos jurássicos / exploração ─────────────
export function stone(page: PDFPage, cx: number, cy: number, w: number, h: number, seed: number, base: RGB = [0.55, 0.5, 0.45]) {
  const pts = blobPoints(cx, cy, w / 2, h / 2, seed, 0.18, 9);
  drawShape(page, pts.map((p) => ({ x: p.x + 0.3, y: p.y + 0.4 })), { fill: shade(base, 0.45), opacity: 0.5 });
  drawShape(page, pts, { fill: base, stroke: shade(base, 0.6), strokeW: 0.2 });
  drawShape(page, blobPoints(cx - w * 0.12, cy - h * 0.15, w * 0.25, h * 0.18, seed + 3, 0.2, 7), { fill: mix(base, [1, 1, 1], 0.35), opacity: 0.7 });
}

export function egg(page: PDFPage, cx: number, cy: number, h: number, seed: number, shell: RGB = [0.96, 0.9, 0.78], spot: RGB = [0.55, 0.33, 0.16], rotation = 0) {
  const w = h * 0.74;
  const a = (rotation * Math.PI) / 180;
  const pts: P[] = Array.from({ length: 16 }, (_, i) => {
    const t = (i / 16) * Math.PI * 2;
    const yy = Math.sin(t) * (h / 2);
    const xx = Math.cos(t) * (w / 2) * (yy < 0 ? 0.86 : 1); // ponta mais fina em cima
    return { x: cx + xx * Math.cos(a) - yy * Math.sin(a), y: cy + xx * Math.sin(a) + yy * Math.cos(a) };
  });
  drawShape(page, pts.map((p) => ({ x: p.x + 0.35, y: p.y + 0.45 })), { fill: shade(shell, 0.4), opacity: 0.4 });
  drawShape(page, pts, { fill: shell, stroke: shade(shell, 0.65), strokeW: 0.25 });
  const r = rng(seed);
  for (let i = 0; i < 5; i++) {
    const sx = cx + (r() - 0.5) * w * 0.55;
    const sy = cy + (r() - 0.5) * h * 0.6;
    drawShape(page, blobPoints(sx, sy, w * (0.06 + r() * 0.06), h * (0.05 + r() * 0.05), seed + i, 0.3, 7), { fill: spot, opacity: 0.85 });
  }
  drawShape(page, blobPoints(cx - w * 0.18, cy - h * 0.2, w * 0.1, h * 0.14, seed + 9, 0.1, 7), { fill: [1, 1, 1], opacity: 0.5 });
}

export function compass(page: PDFPage, cx: number, cy: number, r: number, ring: RGB, needle: RGB, face: RGB, font?: import("pdf-lib").PDFFont) {
  const c = pt(page, cx, cy);
  page.drawCircle({ x: c.x + mm(0.3), y: c.y - mm(0.4), size: mm(r), color: color(shade(ring, 0.4)), opacity: 0.35 });
  page.drawCircle({ x: c.x, y: c.y, size: mm(r), color: color(ring) });
  page.drawCircle({ x: c.x, y: c.y, size: mm(r * 0.8), color: color(face), borderColor: color(shade(ring, 0.7)), borderWidth: mm(0.2) });
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    const l = i % 4 === 0 ? 0.16 : 0.08;
    page.drawLine({
      start: pt(page, cx + Math.cos(a) * r * 0.8, cy + Math.sin(a) * r * 0.8),
      end: pt(page, cx + Math.cos(a) * r * (0.8 - l), cy + Math.sin(a) * r * (0.8 - l)),
      thickness: mm(0.15),
      color: color(shade(ring, 0.5)),
    });
  }
  const star = (rot: number, len: number, c1: RGB) => {
    const pts: P[] = [];
    for (let i = 0; i < 4; i++) {
      const a = rot + (i * Math.PI) / 2;
      pts.push({ x: cx + Math.cos(a) * len, y: cy + Math.sin(a) * len });
      const b = a + Math.PI / 4;
      pts.push({ x: cx + Math.cos(b) * len * 0.22, y: cy + Math.sin(b) * len * 0.22 });
    }
    drawShape(page, pts, { fill: c1, sharp: true });
  };
  star(Math.PI / 4, r * 0.5, shade(ring, 0.8));
  star(0, r * 0.68, needle);
  // ponta norte em destaque
  drawShape(page, [{ x: cx, y: cy - r * 0.68 }, { x: cx + r * 0.15, y: cy }, { x: cx - r * 0.15, y: cy }], { fill: [0.75, 0.15, 0.1], sharp: true });
  page.drawCircle({ x: c.x, y: c.y, size: mm(r * 0.08), color: color(face) });
  if (font) {
    const s = Math.max(4, r * 1.6);
    const w = font.widthOfTextAtSize("N", s) / (72 / 25.4);
    const p = pt(page, cx - w / 2, cy - r * 0.84 + s / 2.83 * 0.5);
    void p;
  }
}

/** Trilha pontilhada (Bézier) — mapa de exploração. */
export function dottedPath(page: PDFPage, p0: P, c1: P, c2: P, p1: P, c: RGB, dot = 0.38, gap = 1.6) {
  const at = (t: number) => {
    const u = 1 - t;
    return {
      x: u * u * u * p0.x + 3 * u * u * t * c1.x + 3 * u * t * t * c2.x + t * t * t * p1.x,
      y: u * u * u * p0.y + 3 * u * u * t * c1.y + 3 * u * t * t * c2.y + t * t * t * p1.y,
    };
  };
  let len = 0;
  let prev = p0;
  for (let i = 1; i <= 60; i++) {
    const q = at(i / 60);
    len += Math.hypot(q.x - prev.x, q.y - prev.y);
    prev = q;
  }
  const n = Math.max(2, Math.floor(len / gap));
  for (let i = 0; i <= n; i++) {
    const q = pt(page, at(i / n).x, at(i / n).y);
    page.drawCircle({ x: q.x, y: q.y, size: mm(dot), color: color(c) });
  }
}

export function xMark(page: PDFPage, cx: number, cy: number, s: number, c: RGB) {
  for (const [a, b] of [
    [-1, -1],
    [-1, 1],
  ]) {
    page.drawLine({ start: pt(page, cx + a * s, cy + b * s), end: pt(page, cx - a * s, cy - b * s), thickness: mm(s * 0.38), color: color(c), lineCap: 1 });
  }
}

export function sparkle(page: PDFPage, cx: number, cy: number, s: number, c: RGB, opacity = 1) {
  const pts: P[] = [];
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 2 - Math.PI / 2;
    pts.push({ x: cx + Math.cos(a) * s, y: cy + Math.sin(a) * s });
    const b = a + Math.PI / 4;
    pts.push({ x: cx + Math.cos(b) * s * 0.28, y: cy + Math.sin(b) * s * 0.28 });
  }
  drawShape(page, pts, { fill: c, sharp: true, opacity });
}

export function sunburst(page: PDFPage, cx: number, cy: number, r: number, rays: number, c1: RGB, opacity: number) {
  for (let i = 0; i < rays; i++) {
    const a = (i / rays) * Math.PI * 2;
    const b = a + Math.PI / rays;
    drawShape(
      page,
      [
        { x: cx, y: cy },
        { x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r },
        { x: cx + Math.cos(b) * r, y: cy + Math.sin(b) * r },
      ],
      { fill: c1, opacity, sharp: true },
    );
  }
}

export function volcano(page: PDFPage, cx: number, base: number, w: number, h: number, rock: RGB, lava: RGB) {
  drawShape(
    page,
    [
      { x: cx - w / 2, y: base },
      { x: cx - w * 0.12, y: base - h },
      { x: cx + w * 0.12, y: base - h },
      { x: cx + w / 2, y: base },
    ],
    { fill: rock, sharp: true },
  );
  drawShape(
    page,
    [
      { x: cx - w * 0.12, y: base - h },
      { x: cx - w * 0.02, y: base - h * 0.55 },
      { x: cx + w * 0.05, y: base - h * 0.7 },
      { x: cx + w * 0.12, y: base - h },
    ],
    { fill: lava, sharp: true },
  );
  for (let i = 0; i < 3; i++) {
    const p = pt(page, cx + (i - 1) * w * 0.07, base - h - 1 - i * 1.4);
    page.drawCircle({ x: p.x, y: p.y, size: mm(1 + i * 0.5), color: color([0.8, 0.78, 0.75]), opacity: 0.5 });
  }
}

export function bird(page: PDFPage, cx: number, cy: number, s: number, c: RGB) {
  page.drawSvgPath(`M 0 0 Q ${mm(s * 0.5)} ${mm(-s * 0.45)} ${mm(s)} 0 Q ${mm(s * 1.5)} ${mm(-s * 0.45)} ${mm(s * 2)} 0`, {
    ...pt(page, cx - s, cy),
    borderColor: color(c),
    borderWidth: mm(0.3),
  });
}

/** Trilha de pegadas alternadas ao longo de uma direção. */
export function footTrail(page: PDFPage, x: number, y: number, n: number, step: number, size: number, angle: number, c: RGB, opacity = 1) {
  const a = (angle * Math.PI) / 180;
  for (let i = 0; i < n; i++) {
    const off = (i % 2 ? -1 : 1) * size * 0.45;
    const px = x + Math.cos(a) * step * i - Math.sin(a) * off;
    const py = y + Math.sin(a) * step * i + Math.cos(a) * off;
    if (opacity < 1) {
      // pdf-lib não tem opacidade no path da pegada: usa cor misturada com o fundo.
    }
    footprint(page, px, py, size, c, angle + 90);
  }
}

export { degrees };
