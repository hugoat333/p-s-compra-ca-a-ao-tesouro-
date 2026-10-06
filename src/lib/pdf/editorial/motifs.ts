/** Motivos vetoriais temáticos (Espaço, Futebol, Princesas, Fadas, Sereias). Medidas em mm, topo-esquerda. */
import { degrees, type PDFPage } from "pdf-lib";
import type { RGB } from "../../editorial/types";
import { color, mix, mm, pt, shade } from "./units";
import { circle, beginClip, endClip } from "./shapes";
import { blobPoints, bladeLeaf, drawShape, rng, sparkle } from "./jungle";

type P = { x: number; y: number };
const WHITE: RGB = [1, 1, 1];

function poly(cx: number, cy: number, r: number, n: number, rot = -Math.PI / 2): P[] {
  return Array.from({ length: n }, (_, i) => ({ x: cx + Math.cos(rot + (i / n) * Math.PI * 2) * r, y: cy + Math.sin(rot + (i / n) * Math.PI * 2) * r }));
}

export function star5(page: PDFPage, cx: number, cy: number, r: number, fill: RGB, o: { stroke?: RGB; rot?: number; opacity?: number; inner?: number } = {}) {
  const pts: P[] = [];
  const rot = (o.rot ?? 0) * (Math.PI / 180) - Math.PI / 2;
  for (let i = 0; i < 10; i++) {
    const rr = i % 2 ? r * (o.inner ?? 0.45) : r;
    const a = rot + (i * Math.PI) / 5;
    pts.push({ x: cx + Math.cos(a) * rr, y: cy + Math.sin(a) * rr });
  }
  drawShape(page, pts, { fill, stroke: o.stroke, strokeW: 0.25, sharp: true, opacity: o.opacity });
}

export function softShadow(page: PDFPage, pts: P[], dx = 0.4, dy = 0.6, c: RGB = [0, 0, 0], opacity = 0.2) {
  drawShape(page, pts.map((p) => ({ x: p.x + dx, y: p.y + dy })), { fill: c, opacity });
}

// ───────────── Espaço ─────────────
export function planet(page: PDFPage, cx: number, cy: number, r: number, base: RGB, o: { ring?: RGB; bands?: boolean; craters?: boolean } = {}) {
  if (o.ring) {
    const p = pt(page, cx, cy);
    page.drawEllipse({ x: p.x, y: p.y, xScale: mm(r * 1.75), yScale: mm(r * 0.45), borderColor: color(o.ring), borderWidth: mm(r * 0.16), rotate: degrees(-18) });
  }
  circle(page, cx, cy, r, { fill: base });
  beginClip(page, { x: cx - r, y: cy - r, w: 2 * r, h: 2 * r }, "circle");
  if (o.bands) for (let i = -2; i <= 2; i++) page.drawRectangle({ ...pt(page, cx - r, cy + i * r * 0.38 + r * 0.08), width: mm(2 * r), height: mm(r * 0.16), color: color(shade(base, 0.82)), opacity: 0.8 });
  if (o.craters) for (const [dx, dy, s] of [[-0.35, -0.2, 0.22], [0.3, 0.25, 0.16], [0.05, 0.5, 0.12]]) circle(page, cx + dx * r, cy + dy * r, s * r, { fill: shade(base, 0.8) });
  circle(page, cx + r * 0.35, cy + r * 0.35, r * 0.95, { fill: shade(base, 0.6), opacity: 0.25 });
  circle(page, cx - r * 0.35, cy - r * 0.38, r * 0.22, { fill: WHITE, opacity: 0.35 });
  endClip(page);
  if (o.ring) {
    // metade da frente do anel
    const p = pt(page, cx, cy);
    beginClip(page, { x: cx - r * 2, y: cy, w: r * 4, h: r * 1.2 }, "rect", 0);
    page.drawEllipse({ x: p.x, y: p.y, xScale: mm(r * 1.75), yScale: mm(r * 0.45), borderColor: color(o.ring), borderWidth: mm(r * 0.16), rotate: degrees(-18) });
    endClip(page);
  }
}

export function rocket(page: PDFPage, cx: number, cy: number, h: number, angle = 0, body: RGB = [0.96, 0.96, 0.98], accent: RGB = [0.85, 0.15, 0.15], windowC: RGB = [0.2, 0.45, 0.85]) {
  const s = h / 10;
  const a = (angle * Math.PI) / 180;
  const T = (x: number, y: number): P => ({ x: cx + (x * Math.cos(a) - y * Math.sin(a)) * s, y: cy + (x * Math.sin(a) + y * Math.cos(a)) * s });
  // chama
  drawShape(page, [T(-1, 3.6), T(0, 6.4), T(1, 3.6)], { fill: [1, 0.7, 0.15] });
  drawShape(page, [T(-0.55, 3.6), T(0, 5.3), T(0.55, 3.6)], { fill: [1, 0.92, 0.5] });
  // aletas
  drawShape(page, [T(-1.4, 1.2), T(-2.6, 3.9), T(-1.2, 3.4)], { fill: accent, sharp: true });
  drawShape(page, [T(1.4, 1.2), T(2.6, 3.9), T(1.2, 3.4)], { fill: accent, sharp: true });
  // corpo
  const bodyPts = [T(0, -5), T(1.2, -3.4), T(1.6, -0.5), T(1.5, 2.6), T(1.1, 3.7), T(-1.1, 3.7), T(-1.5, 2.6), T(-1.6, -0.5), T(-1.2, -3.4)];
  softShadow(page, bodyPts, 0.3, 0.4, [0, 0, 0], 0.25);
  drawShape(page, bodyPts, { fill: body, stroke: shade(body, 0.6), strokeW: 0.2 });
  drawShape(page, [T(0, -5), T(1.05, -3.6), T(-1.05, -3.6)], { fill: accent });
  const w = T(0, -1.1);
  circle(page, w.x, w.y, 0.85 * s, { fill: windowC, stroke: shade(body, 0.55), strokeW: 0.35 * s });
  circle(page, w.x - 0.25 * s, w.y - 0.25 * s, 0.25 * s, { fill: WHITE, opacity: 0.7 });
}

export function comet(page: PDFPage, x: number, y: number, len: number, angle: number, c: RGB) {
  const a = (angle * Math.PI) / 180;
  for (let i = 0; i < 4; i++) {
    const off = (i - 1.5) * 0.5;
    page.drawLine({
      start: pt(page, x - Math.sin(a) * off, y + Math.cos(a) * off),
      end: pt(page, x - Math.cos(a) * len * (1 - i * 0.15) - Math.sin(a) * off, y - Math.sin(a) * len * (1 - i * 0.15) + Math.cos(a) * off),
      thickness: mm(0.35),
      color: color(c),
      opacity: 0.55 - i * 0.1,
      lineCap: 1,
    });
  }
  star5(page, x, y, 1.6, c);
}

export function starField(page: PDFPage, x: number, y: number, w: number, h: number, seed: number, n: number, c: RGB = WHITE) {
  const r = rng(seed);
  for (let i = 0; i < n; i++) {
    const p = pt(page, x + r() * w, y + r() * h);
    page.drawCircle({ x: p.x, y: p.y, size: mm(0.12 + r() * 0.3), color: color(c), opacity: 0.4 + r() * 0.6 });
  }
}

// ───────────── Futebol ─────────────
export function soccerBall(page: PDFPage, cx: number, cy: number, r: number, dark: RGB = [0.12, 0.12, 0.14]) {
  circle(page, cx + r * 0.08, cy + r * 0.12, r, { fill: [0, 0, 0], opacity: 0.2 });
  circle(page, cx, cy, r, { fill: WHITE, stroke: dark, strokeW: Math.max(0.2, r * 0.06) });
  beginClip(page, { x: cx - r, y: cy - r, w: 2 * r, h: 2 * r }, "circle");
  drawShape(page, poly(cx, cy, r * 0.36, 5), { fill: dark, sharp: true });
  for (let i = 0; i < 5; i++) {
    const a = -Math.PI / 2 + (i / 5) * Math.PI * 2;
    const px = cx + Math.cos(a) * r * 0.95;
    const py = cy + Math.sin(a) * r * 0.95;
    drawShape(page, poly(px, py, r * 0.3, 5, a + Math.PI), { fill: dark, sharp: true });
    page.drawLine({ start: pt(page, cx + Math.cos(a) * r * 0.36, cy + Math.sin(a) * r * 0.36), end: pt(page, cx + Math.cos(a) * r * 0.68, cy + Math.sin(a) * r * 0.68), thickness: mm(r * 0.05), color: color(dark) });
  }
  circle(page, cx - r * 0.35, cy - r * 0.4, r * 0.18, { fill: WHITE, opacity: 0.6 });
  endClip(page);
}

export function trophy(page: PDFPage, cx: number, cy: number, h: number, gold: RGB = [0.95, 0.73, 0.1]) {
  const s = h / 10;
  const dark = shade(gold, 0.65);
  for (const side of [-1, 1]) {
    const p = pt(page, cx + side * 2.9 * s, cy - 2.4 * s);
    page.drawEllipse({ x: p.x, y: p.y, xScale: mm(1.3 * s), yScale: mm(1.6 * s), borderColor: color(dark), borderWidth: mm(0.55 * s) });
  }
  const cup = [{ x: cx - 3 * s, y: cy - 4.6 * s }, { x: cx + 3 * s, y: cy - 4.6 * s }, { x: cx + 2.6 * s, y: cy - 1.4 * s }, { x: cx + 1.2 * s, y: cy + 0.4 * s }, { x: cx - 1.2 * s, y: cy + 0.4 * s }, { x: cx - 2.6 * s, y: cy - 1.4 * s }];
  softShadow(page, cup, 0.3, 0.4);
  drawShape(page, cup, { fill: gold, stroke: dark, strokeW: 0.25 });
  page.drawRectangle({ ...pt(page, cx - 0.5 * s, cy + 2.6 * s), width: mm(1 * s), height: mm(2.2 * s), color: color(dark) });
  page.drawRectangle({ ...pt(page, cx - 2 * s, cy + 4.6 * s), width: mm(4 * s), height: mm(2 * s), color: color(gold), borderColor: color(dark), borderWidth: mm(0.2) });
  drawShape(page, [{ x: cx - 1.8 * s, y: cy - 4 * s }, { x: cx - 1.2 * s, y: cy - 4 * s }, { x: cx - 1.6 * s, y: cy - 1.6 * s }], { fill: WHITE, opacity: 0.45, sharp: true });
  star5(page, cx, cy - 2.3 * s, 1 * s, shade(gold, 1.1));
}

export function whistle(page: PDFPage, cx: number, cy: number, s: number, c: RGB = [0.95, 0.73, 0.1]) {
  circle(page, cx, cy, s * 0.5, { fill: c, stroke: shade(c, 0.6), strokeW: 0.2 });
  page.drawRectangle({ ...pt(page, cx, cy - s * 0.05), width: mm(s * 0.9), height: mm(s * 0.45), color: color(c), borderColor: color(shade(c, 0.6)), borderWidth: mm(0.2) });
  circle(page, cx, cy, s * 0.18, { fill: shade(c, 0.55) });
}

export function cone(page: PDFPage, cx: number, base: number, h: number) {
  drawShape(page, [{ x: cx - h * 0.35, y: base }, { x: cx, y: base - h }, { x: cx + h * 0.35, y: base }], { fill: [0.98, 0.45, 0.1], sharp: true });
  page.drawRectangle({ ...pt(page, cx - h * 0.2, base - h * 0.45), width: mm(h * 0.4), height: mm(h * 0.12), color: color(WHITE) });
  page.drawRectangle({ ...pt(page, cx - h * 0.45, base + h * 0.06), width: mm(h * 0.9), height: mm(h * 0.08), color: color([0.85, 0.35, 0.05]) });
}

export function boot(page: PDFPage, cx: number, cy: number, s: number, c: RGB, flip = 1) {
  const X = (x: number) => cx + x * s * flip;
  const pts = [{ x: X(-2.2), y: cy - 2.4 * s }, { x: X(0), y: cy - 2.4 * s }, { x: X(0.4), y: cy - 0.6 * s }, { x: X(2.6), y: cy + 0.1 * s }, { x: X(2.8), y: cy + 1.1 * s }, { x: X(-2.4), y: cy + 1.1 * s }];
  softShadow(page, pts, 0.3, 0.3);
  drawShape(page, pts, { fill: c, stroke: shade(c, 0.6), strokeW: 0.2 });
  for (let i = 0; i < 3; i++) page.drawLine({ start: pt(page, X(-1.4 + i * 0.6), cy - 1.6 * s + i * 0.2 * s), end: pt(page, X(-0.6 + i * 0.6), cy - 1.6 * s + i * 0.2 * s), thickness: mm(0.25), color: color(WHITE) });
  for (let i = 0; i < 4; i++) circle(page, X(-1.6 + i * 1.3), cy + 1.35 * s, 0.25 * s, { fill: shade(c, 0.45) });
  page.drawLine({ start: pt(page, X(-2.3), cy + 0.5 * s), end: pt(page, X(2.6), cy + 0.5 * s), thickness: mm(0.3 * s), color: color(WHITE) });
}

export function goalNet(page: PDFPage, x: number, y: number, w: number, h: number, c: RGB = WHITE) {
  for (let i = 0; i <= 8; i++) page.drawLine({ start: pt(page, x + (w * i) / 8, y), end: pt(page, x + (w * i) / 8, y + h), thickness: mm(0.15), color: color(c), opacity: 0.6 });
  for (let i = 0; i <= 5; i++) page.drawLine({ start: pt(page, x, y + (h * i) / 5), end: pt(page, x + w, y + (h * i) / 5), thickness: mm(0.15), color: color(c), opacity: 0.6 });
  page.drawLine({ start: pt(page, x, y + h), end: pt(page, x, y), thickness: mm(0.8), color: color(c) });
  page.drawLine({ start: pt(page, x, y), end: pt(page, x + w, y), thickness: mm(0.8), color: color(c) });
  page.drawLine({ start: pt(page, x + w, y), end: pt(page, x + w, y + h), thickness: mm(0.8), color: color(c) });
}

export function bunting(page: PDFPage, x0: number, y0: number, x1: number, n: number, colors: RGB[], sag = 2.5, size = 3) {
  const at = (t: number) => ({ x: x0 + (x1 - x0) * t, y: y0 + Math.sin(t * Math.PI) * sag });
  for (let i = 0; i < 30; i++) page.drawLine({ start: pt(page, at(i / 30).x, at(i / 30).y), end: pt(page, at((i + 1) / 30).x, at((i + 1) / 30).y), thickness: mm(0.25), color: color([0.4, 0.3, 0.2]) });
  for (let i = 0; i < n; i++) {
    const t = (i + 0.5) / n;
    const p = at(t);
    drawShape(page, [{ x: p.x - size / 2, y: p.y }, { x: p.x + size / 2, y: p.y }, { x: p.x, y: p.y + size * 1.2 }], { fill: colors[i % colors.length], sharp: true });
  }
}

// ───────────── Princesas ─────────────
export function crown(page: PDFPage, cx: number, cy: number, w: number, gold: RGB = [0.95, 0.75, 0.2], gem: RGB = [0.85, 0.1, 0.4]) {
  const h = w * 0.62;
  const x0 = cx - w / 2;
  const y0 = cy - h / 2;
  const pts = [
    { x: x0, y: y0 + h * 0.85 },
    { x: x0, y: y0 + h * 0.2 },
    { x: x0 + w * 0.22, y: y0 + h * 0.55 },
    { x: cx, y: y0 },
    { x: x0 + w * 0.78, y: y0 + h * 0.55 },
    { x: x0 + w, y: y0 + h * 0.2 },
    { x: x0 + w, y: y0 + h * 0.85 },
  ];
  softShadow(page, pts, 0.3, 0.4);
  drawShape(page, pts, { fill: gold, stroke: shade(gold, 0.65), strokeW: 0.25, sharp: true });
  page.drawRectangle({ ...pt(page, x0, y0 + h), width: mm(w), height: mm(h * 0.2), color: color(shade(gold, 0.88)), borderColor: color(shade(gold, 0.65)), borderWidth: mm(0.2) });
  for (const [px, py] of [[x0, y0 + h * 0.2], [cx, y0], [x0 + w, y0 + h * 0.2]]) circle(page, px, py, w * 0.07, { fill: gold, stroke: shade(gold, 0.65), strokeW: 0.15 });
  drawShape(page, [{ x: cx, y: y0 + h * 0.42 }, { x: cx + w * 0.09, y: y0 + h * 0.6 }, { x: cx, y: y0 + h * 0.78 }, { x: cx - w * 0.09, y: y0 + h * 0.6 }], { fill: gem, sharp: true });
  for (const dx of [-0.3, 0.3]) circle(page, cx + dx * w, y0 + h * 0.7, w * 0.05, { fill: mix(gem, [0.3, 0.5, 1], 0.6) });
}

export function heart(page: PDFPage, cx: number, cy: number, s: number, fill: RGB, opacity = 1) {
  const pts: P[] = [];
  for (let i = 0; i < 24; i++) {
    const t = (i / 24) * Math.PI * 2;
    const x = 16 * Math.sin(t) ** 3;
    const y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
    pts.push({ x: cx + (x / 17) * s, y: cy + (y / 17) * s });
  }
  drawShape(page, pts, { fill, opacity });
}

export function rose(page: PDFPage, cx: number, cy: number, r: number, petal: RGB, seed = 1) {
  const g: RGB = [0.36, 0.6, 0.3];
  bladeLeaf(page, cx - r * 0.6, cy + r * 0.5, r * 1.3, 150, r * 0.6, g, shade(g, 0.6));
  bladeLeaf(page, cx + r * 0.6, cy + r * 0.5, r * 1.3, 30, r * 0.6, shade(g, 1.1), shade(g, 0.6));
  drawShape(page, blobPoints(cx, cy, r, r, seed, 0.12, 10), { fill: petal, stroke: shade(petal, 0.7), strokeW: 0.15 });
  drawShape(page, blobPoints(cx, cy, r * 0.7, r * 0.7, seed + 1, 0.15, 9), { fill: shade(petal, 0.88) });
  drawShape(page, blobPoints(cx, cy, r * 0.42, r * 0.42, seed + 2, 0.2, 8), { fill: shade(petal, 0.75) });
  page.drawSvgPath(`M 0 0 C ${mm(r * 0.3)} ${mm(-r * 0.3)} ${mm(r * 0.4)} ${mm(r * 0.25)} 0 ${mm(r * 0.2)}`, { ...pt(page, cx - r * 0.1, cy - r * 0.05), borderColor: color(shade(petal, 0.55)), borderWidth: mm(0.2) });
  circle(page, cx - r * 0.35, cy - r * 0.4, r * 0.15, { fill: WHITE, opacity: 0.4 });
}

export function castle(page: PDFPage, cx: number, base: number, w: number, h: number, wall: RGB, roof: RGB) {
  const tower = (x: number, tw: number, th: number) => {
    page.drawRectangle({ ...pt(page, x - tw / 2, base), width: mm(tw), height: mm(th), color: color(wall) });
    drawShape(page, [{ x: x - tw * 0.65, y: base - th }, { x: x + tw * 0.65, y: base - th }, { x, y: base - th - tw * 1.3 }], { fill: roof, sharp: true });
    page.drawRectangle({ ...pt(page, x - tw * 0.15, base - th * 0.55), width: mm(tw * 0.3), height: mm(th * 0.18), color: color(shade(wall, 0.7)) });
    const f = pt(page, x, base - th - tw * 1.3);
    page.drawLine({ start: f, end: { x: f.x, y: f.y + mm(tw * 0.6) }, thickness: mm(0.2), color: color(shade(roof, 0.6)) });
    drawShape(page, [{ x, y: base - th - tw * 1.3 - tw * 0.6 }, { x: x + tw * 0.4, y: base - th - tw * 1.3 - tw * 0.45 }, { x, y: base - th - tw * 1.3 - tw * 0.3 }], { fill: roof, sharp: true });
  };
  page.drawRectangle({ ...pt(page, cx - w * 0.35, base), width: mm(w * 0.7), height: mm(h * 0.5), color: color(wall) });
  for (let i = 0; i < 6; i++) page.drawRectangle({ ...pt(page, cx - w * 0.35 + i * (w * 0.7) / 5.5, base - h * 0.5), width: mm(w * 0.06), height: mm(h * 0.06), color: color(wall) });
  tower(cx - w * 0.4, w * 0.16, h * 0.62);
  tower(cx + w * 0.4, w * 0.16, h * 0.62);
  tower(cx, w * 0.2, h * 0.8);
  page.drawEllipse({ ...pt(page, cx, base - h * 0.08), xScale: mm(w * 0.07), yScale: mm(h * 0.12), color: color(shade(wall, 0.6)) });
}

export function gem(page: PDFPage, cx: number, cy: number, s: number, c: RGB) {
  drawShape(page, [{ x: cx - s, y: cy - s * 0.3 }, { x: cx - s * 0.5, y: cy - s * 0.8 }, { x: cx + s * 0.5, y: cy - s * 0.8 }, { x: cx + s, y: cy - s * 0.3 }, { x: cx, y: cy + s }], { fill: c, stroke: shade(c, 0.6), strokeW: 0.2, sharp: true });
  drawShape(page, [{ x: cx - s * 0.5, y: cy - s * 0.8 }, { x: cx, y: cy - s * 0.3 }, { x: cx - s, y: cy - s * 0.3 }], { fill: WHITE, opacity: 0.4, sharp: true });
}

// ───────────── Fadas ─────────────
export function flower(page: PDFPage, cx: number, cy: number, r: number, petal: RGB, center: RGB = [1, 0.82, 0.25], n = 5, rot = 0) {
  for (let i = 0; i < n; i++) {
    const a = (rot * Math.PI) / 180 + (i / n) * Math.PI * 2;
    const p = pt(page, cx + Math.cos(a) * r * 0.55, cy + Math.sin(a) * r * 0.55);
    page.drawEllipse({ x: p.x, y: p.y, xScale: mm(r * 0.55), yScale: mm(r * 0.36), color: color(petal), borderColor: color(shade(petal, 0.75)), borderWidth: mm(0.12), rotate: degrees(-(a * 180) / Math.PI) });
  }
  circle(page, cx, cy, r * 0.3, { fill: center, stroke: shade(center, 0.7), strokeW: 0.12 });
}

export function butterfly(page: PDFPage, cx: number, cy: number, s: number, w1: RGB, w2: RGB, angle = 0) {
  for (const side of [-1, 1]) {
    const a = angle + side * 0;
    const up = pt(page, cx + side * s * 0.55, cy - s * 0.3);
    page.drawEllipse({ x: up.x, y: up.y, xScale: mm(s * 0.6), yScale: mm(s * 0.45), color: color(w1), borderColor: color(shade(w1, 0.6)), borderWidth: mm(0.15), rotate: degrees(-a + side * 25) });
    const lo = pt(page, cx + side * s * 0.4, cy + s * 0.35);
    page.drawEllipse({ x: lo.x, y: lo.y, xScale: mm(s * 0.38), yScale: mm(s * 0.3), color: color(w2), borderColor: color(shade(w2, 0.6)), borderWidth: mm(0.15), rotate: degrees(-a - side * 25) });
    circle(page, cx + side * s * 0.6, cy - s * 0.35, s * 0.12, { fill: WHITE, opacity: 0.7 });
  }
  const b = pt(page, cx, cy);
  page.drawEllipse({ x: b.x, y: b.y, xScale: mm(s * 0.1), yScale: mm(s * 0.55), color: color([0.25, 0.18, 0.3]) });
}

export function mushroom(page: PDFPage, cx: number, base: number, h: number, cap: RGB = [0.85, 0.2, 0.25]) {
  page.drawRectangle({ ...pt(page, cx - h * 0.14, base), width: mm(h * 0.28), height: mm(h * 0.55), color: color([0.98, 0.95, 0.85]), borderColor: color([0.75, 0.68, 0.55]), borderWidth: mm(0.15) });
  const pts = Array.from({ length: 12 }, (_, i) => {
    const a = Math.PI + (i / 11) * Math.PI;
    return { x: cx + Math.cos(a) * h * 0.5, y: base - h * 0.5 + Math.sin(a) * h * 0.45 };
  });
  drawShape(page, [...pts, { x: cx + h * 0.5, y: base - h * 0.45 }, { x: cx - h * 0.5, y: base - h * 0.45 }], { fill: cap, stroke: shade(cap, 0.65), strokeW: 0.15 });
  for (const [dx, dy, s] of [[-0.22, -0.72, 0.08], [0.15, -0.8, 0.06], [0.28, -0.6, 0.07]]) circle(page, cx + dx * h, base + dy * h, s * h, { fill: WHITE });
}

export function glow(page: PDFPage, cx: number, cy: number, r: number, c: RGB = [1, 0.92, 0.5]) {
  for (let i = 4; i >= 1; i--) circle(page, cx, cy, r * i * 0.5, { fill: c, opacity: 0.12 });
  circle(page, cx, cy, r * 0.35, { fill: [1, 1, 0.9] });
}

export function wand(page: PDFPage, x: number, y: number, len: number, angle: number, starC: RGB) {
  const a = (angle * Math.PI) / 180;
  const tip = { x: x + Math.cos(a) * len, y: y + Math.sin(a) * len };
  page.drawLine({ start: pt(page, x, y), end: pt(page, tip.x, tip.y), thickness: mm(0.9), color: color([0.45, 0.28, 0.5]), lineCap: 1 });
  star5(page, tip.x, tip.y, len * 0.22, starC, { stroke: shade(starC, 0.6) });
  for (let i = 1; i <= 4; i++) sparkle(page, tip.x + Math.cos(a + 0.8) * i * 2.2, tip.y + Math.sin(a + 0.8) * i * 2.2 - i * 0.6, 1.3 - i * 0.2, starC);
}

// ───────────── Sereias ─────────────
export function shell(page: PDFPage, cx: number, cy: number, s: number, fill: RGB) {
  const pts: P[] = [{ x: cx, y: cy + s * 0.55 }];
  for (let i = 0; i <= 12; i++) {
    const a = Math.PI + (i / 12) * Math.PI;
    const bump = i % 2 ? 0.92 : 1;
    pts.push({ x: cx + Math.cos(a) * s * bump, y: cy - s * 0.1 + Math.sin(a) * s * 0.85 * bump });
  }
  softShadow(page, pts, 0.3, 0.4);
  drawShape(page, pts, { fill, stroke: shade(fill, 0.65), strokeW: 0.2 });
  for (let i = 1; i < 6; i++) {
    const a = Math.PI + (i / 6) * Math.PI;
    page.drawLine({ start: pt(page, cx, cy + s * 0.5), end: pt(page, cx + Math.cos(a) * s * 0.88, cy - s * 0.1 + Math.sin(a) * s * 0.75), thickness: mm(0.2), color: color(shade(fill, 0.7)) });
  }
  page.drawEllipse({ ...pt(page, cx, cy + s * 0.55), xScale: mm(s * 0.3), yScale: mm(s * 0.15), color: color(shade(fill, 0.85)) });
}

export function starfish(page: PDFPage, cx: number, cy: number, r: number, fill: RGB, rot = 0) {
  const pts: P[] = [];
  for (let i = 0; i < 10; i++) {
    const rr = i % 2 ? r * 0.45 : r;
    const a = ((rot - 90) * Math.PI) / 180 + (i * Math.PI) / 5;
    pts.push({ x: cx + Math.cos(a) * rr, y: cy + Math.sin(a) * rr });
  }
  softShadow(page, pts, 0.3, 0.4);
  drawShape(page, pts, { fill, stroke: shade(fill, 0.7), strokeW: 0.2 });
  for (let i = 0; i < 5; i++) {
    const a = ((rot - 90) * Math.PI) / 180 + (i * 2 * Math.PI) / 5;
    for (const t of [0.35, 0.6]) circle(page, cx + Math.cos(a) * r * t, cy + Math.sin(a) * r * t, r * 0.06, { fill: mix(fill, WHITE, 0.5) });
  }
}

export function bubble(page: PDFPage, cx: number, cy: number, r: number, c: RGB = WHITE) {
  circle(page, cx, cy, r, { fill: mix(c, [0.6, 0.85, 1], 0.5), stroke: c, strokeW: Math.max(0.15, r * 0.08), opacity: 0.35 });
  circle(page, cx, cy, r, { stroke: c, strokeW: Math.max(0.15, r * 0.08) });
  circle(page, cx - r * 0.35, cy - r * 0.35, r * 0.22, { fill: WHITE, opacity: 0.85 });
}

export function seaweed(page: PDFPage, x: number, base: number, h: number, c: RGB, seed = 1) {
  const r = rng(seed);
  const pts: P[] = [];
  const n = 10;
  for (let i = 0; i <= n; i++) pts.push({ x: x + Math.sin(i * 0.9 + seed) * 1.6 + 0.9 * (1 - i / n), y: base - (h * i) / n });
  for (let i = n; i >= 0; i--) pts.push({ x: x + Math.sin(i * 0.9 + seed) * 1.6 - 0.9 * (1 - i / n), y: base - (h * i) / n });
  drawShape(page, pts, { fill: c, stroke: shade(c, 0.7), strokeW: 0.15 });
  void r;
}

export function coral(page: PDFPage, x: number, base: number, h: number, c: RGB, seed = 1) {
  const r = rng(seed);
  const branch = (x0: number, y0: number, len: number, a: number, w: number, depth: number) => {
    const x1 = x0 + Math.cos(a) * len;
    const y1 = y0 + Math.sin(a) * len;
    page.drawLine({ start: pt(page, x0, y0), end: pt(page, x1, y1), thickness: mm(w), color: color(c), lineCap: 1 });
    if (depth > 0) {
      branch(x1, y1, len * 0.72, a - 0.45 - r() * 0.3, w * 0.75, depth - 1);
      branch(x1, y1, len * 0.72, a + 0.45 + r() * 0.3, w * 0.75, depth - 1);
    } else circle(page, x1, y1, w * 0.6, { fill: mix(c, WHITE, 0.25) });
  };
  branch(x, base, h * 0.42, -Math.PI / 2, h * 0.12, 2);
}

export function pearl(page: PDFPage, cx: number, cy: number, r: number) {
  circle(page, cx, cy, r, { fill: [0.97, 0.95, 0.98], stroke: [0.78, 0.74, 0.82], strokeW: 0.15 });
  circle(page, cx - r * 0.3, cy - r * 0.3, r * 0.3, { fill: WHITE });
}

export function chest(page: PDFPage, cx: number, cy: number, w: number, wood: RGB = [0.55, 0.33, 0.15], gold: RGB = [0.95, 0.75, 0.2]) {
  const h = w * 0.7;
  const x0 = cx - w / 2;
  const y0 = cy - h / 2;
  // tesouro saindo
  for (const [dx, c] of [[-0.25, gold], [0, [0.9, 0.3, 0.5]], [0.22, [0.3, 0.7, 0.9]], [0.1, gold]] as const) circle(page, cx + dx * w, y0 + h * 0.32, w * 0.11, { fill: c as RGB, stroke: shade(c as RGB, 0.7), strokeW: 0.12 });
  const lid = Array.from({ length: 10 }, (_, i) => {
    const a = Math.PI + (i / 9) * Math.PI;
    return { x: cx + Math.cos(a) * w / 2, y: y0 + h * 0.38 + Math.sin(a) * h * 0.3 };
  });
  drawShape(page, [...lid], { fill: shade(wood, 1.1), stroke: shade(wood, 0.6), strokeW: 0.2 });
  page.drawRectangle({ ...pt(page, x0, y0 + h), width: mm(w), height: mm(h * 0.62), color: color(wood), borderColor: color(shade(wood, 0.6)), borderWidth: mm(0.2) });
  for (const fx of [0.15, 0.85]) page.drawRectangle({ ...pt(page, x0 + w * fx - w * 0.04, y0 + h), width: mm(w * 0.08), height: mm(h * 0.92), color: color(gold) });
  page.drawRectangle({ ...pt(page, cx - w * 0.08, y0 + h * 0.62), width: mm(w * 0.16), height: mm(h * 0.2), color: color(gold), borderColor: color(shade(gold, 0.6)), borderWidth: mm(0.15) });
  for (let i = 0; i < 3; i++) sparkle(page, cx + (i - 1) * w * 0.35, y0 - h * 0.05 - (i % 2) * 2, 1.4, gold);
}

export function fish(page: PDFPage, cx: number, cy: number, s: number, body: RGB, fin: RGB, flip = 1) {
  const X = (x: number) => cx + x * s * flip;
  drawShape(page, [{ x: X(1.4), y: cy }, { x: X(2.4), y: cy - 1 * s }, { x: X(2.2), y: cy }, { x: X(2.4), y: cy + 1 * s }], { fill: fin, sharp: true });
  const b = pt(page, cx, cy);
  page.drawEllipse({ x: b.x, y: b.y, xScale: mm(s * 1.6), yScale: mm(s * 1.05), color: color(body), borderColor: color(shade(body, 0.65)), borderWidth: mm(0.15) });
  drawShape(page, [{ x: X(-0.2), y: cy - 0.9 * s }, { x: X(0.7), y: cy - 1.6 * s }, { x: X(0.9), y: cy - 0.8 * s }], { fill: fin, sharp: true });
  for (const dx of [-0.2, 0.3]) page.drawLine({ start: pt(page, X(dx), cy - 0.8 * s), end: pt(page, X(dx), cy + 0.8 * s), thickness: mm(0.25 * s), color: color(fin), opacity: 0.7 });
  circle(page, X(-0.9), cy - 0.2 * s, 0.28 * s, { fill: WHITE });
  circle(page, X(-0.95), cy - 0.2 * s, 0.15 * s, { fill: [0.1, 0.1, 0.15] });
}

export function waveLine(page: PDFPage, x0: number, x1: number, y: number, amp: number, c: RGB, opacity = 0.4, thick = 0.4) {
  const n = Math.round((x1 - x0) / 2);
  for (let i = 0; i < n; i++) {
    const xa = x0 + ((x1 - x0) * i) / n;
    const xb = x0 + ((x1 - x0) * (i + 1)) / n;
    page.drawLine({ start: pt(page, xa, y + Math.sin(i * 0.9) * amp), end: pt(page, xb, y + Math.sin((i + 1) * 0.9) * amp), thickness: mm(thick), color: color(c), opacity, lineCap: 1 });
  }
}

export { mix, shade };
