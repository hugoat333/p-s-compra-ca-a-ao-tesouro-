/**
 * Motor de composição dos temas Espaço, Futebol, Princesas, Fadas e Sereias.
 * Mesma arquitetura editorial aprovada em Dinossauros (texto vetorial, ilustrações integradas ≥150 DPI,
 * 8 composições de card distintas), com identidade visual própria por tema via ThemeStyle.
 */
import type { PDFDocument, PDFPage } from "pdf-lib";
import type { ClueContent, Crop, EditorialKit, Palette, RGB } from "../../editorial/types";
import { CLUE_COUNT } from "../../themes";
import type { Fonts } from "./fonts";
import { RasterBook } from "./raster";
import { beginClip, endClip, circle, cropMarks, plank, roundedRect } from "./shapes";
import { drawBlock, drawFitted, fit, type TextBlock } from "./text";
import { A4_MM, type Box, color, mix, mm, pt, shade } from "./units";
import { blobPoints, bladeLeaf, dottedPath, drawShape, organicPoints, parchment, pushClip, rng, sparkle, sunburst } from "./jungle";

export interface SCtx {
  page: PDFPage;
  idx: number;
  pal: Palette;
  fonts: Fonts;
  art: RasterBook;
  st: ThemeStyle;
}

export interface ThemeStyle {
  /** Fonte de títulos (arquivo em assets/fonts). */
  font: string;
  band: RGB;
  bandDecor(c: SCtx, o: Box, seed: number): void;
  sheet: { shape: "torn" | "panel" | "wavy" | "ornate"; fill: RGB; edge: RGB };
  /** Enfeites sobre as bordas do papel (cards e páginas). */
  edgeDecor(c: SCtx, o: Box, sheet: Box, seed: number, page: boolean): void;
  header: "pill" | "board" | "ribbon" | "plank";
  headerColors: { fill: RGB; dark: RGB; text: RGB; sub: RGB };
  headerDecor?(c: SCtx, sign: Box): void;
  badge: { fill: RGB; edge: RGB };
  emblem(c: SCtx, cx: number, cy: number, r: number): void;
  frame: { fill: RGB; stroke: RGB; ring: RGB };
  challenge: { fill: RGB; stroke: RGB; pill: RGB; pillDark: RGB; pillText: RGB };
  watermark(c: SCtx, x: number, y: number, s: number, rot: number): void;
  vignette: {
    start(c: SCtx, box: Box): void;
    rest(c: SCtx, box: Box): void;
    trail(c: SCtx, box: Box): void;
    row(c: SCtx, box: Box): void;
    burst(c: SCtx, scene: Box): void;
    pair(c: SCtx, box: Box): void;
    goal(c: SCtx, x: number, y: number): void;
    accents(c: SCtx, scene: Box, seed: number): void;
    map(c: SCtx, box: Box): void;
    certFooter(c: SCtx, box: Box): void;
  };
  final: { frame: RGB; frameDark: RGB; rays: RGB; band: RGB };
  progress: RGB;
}

export const CARD = { w: 92, h: 130 };

// ───────────── papel / fundo ─────────────
function sheetPoints(st: ThemeStyle, b: Box, seed: number) {
  const s = st.sheet.shape;
  if (s === "torn") return organicPoints(b, seed, 0.75, 3.2);
  const r = s === "panel" ? 4 : 3;
  const pts: { x: number; y: number }[] = [];
  const edge = (x0: number, y0: number, x1: number, y1: number) => {
    const len = Math.hypot(x1 - x0, y1 - y0);
    const n = Math.max(2, Math.round(len / 3));
    for (let i = 0; i < n; i++) {
      const t = i / n;
      let x = x0 + (x1 - x0) * t;
      let y = y0 + (y1 - y0) * t;
      if (s === "wavy") {
        const nx = -(y1 - y0) / len;
        const ny = (x1 - x0) / len;
        const w = Math.sin((len * t) / 2.6) * 0.7;
        x += nx * w;
        y += ny * w;
      }
      pts.push({ x, y });
    }
  };
  edge(b.x + r, b.y, b.x + b.w - r, b.y);
  edge(b.x + b.w, b.y + r, b.x + b.w, b.y + b.h - r);
  edge(b.x + b.w - r, b.y + b.h, b.x + r, b.y + b.h);
  edge(b.x, b.y + b.h - r, b.x, b.y + r);
  return pts;
}

function background(c: SCtx, o: Box, seed: number, base?: RGB) {
  roundedRect(c.page, o, { r: 3.5, fill: base ?? c.st.band });
  beginClip(c.page, o, "rect", 3.5);
  c.st.bandDecor(c, o, seed);
  endClip(c.page);
}

function sheet(c: SCtx, b: Box, seed: number, edgeC?: RGB) {
  const pts = sheetPoints(c.st, b, seed);
  parchment(c.page, pts, b, seed, c.st.sheet.fill, edgeC ?? c.st.sheet.edge);
  if (c.st.sheet.shape === "panel") roundedRect(c.page, { x: b.x + 1.6, y: b.y + 1.6, w: b.w - 3.2, h: b.h - 3.2 }, { r: 3, stroke: c.st.sheet.edge, strokeW: 0.3, dash: [1.5, 1.2] });
  if (c.st.sheet.shape === "ornate") {
    roundedRect(c.page, { x: b.x + 1.4, y: b.y + 1.4, w: b.w - 2.8, h: b.h - 2.8 }, { r: 2.5, stroke: c.pal.gold, strokeW: 0.5 });
    roundedRect(c.page, { x: b.x + 2.4, y: b.y + 2.4, w: b.w - 4.8, h: b.h - 4.8 }, { r: 2, stroke: c.pal.gold, strokeW: 0.2 });
  }
  return pts;
}

// ───────────── cabeçalho ─────────────
function sign(c: SCtx, b: Box, gold = false) {
  const { page, st } = c;
  const hc = st.headerColors;
  if (gold) roundedRect(page, { x: b.x - 1.2, y: b.y - 1.2, w: b.w + 2.4, h: b.h + 2.4 }, { r: st.header === "pill" ? (b.h + 2.4) / 2 : 3, fill: c.pal.gold, stroke: shade(c.pal.gold, 0.7), strokeW: 0.4 });
  if (st.header === "plank") plank(page, b, hc.fill, hc.dark);
  else if (st.header === "pill") {
    roundedRect(page, { x: b.x + 0.5, y: b.y + 0.8, w: b.w, h: b.h }, { r: b.h / 2, fill: [0, 0, 0], opacity: 0.25 });
    roundedRect(page, b, { r: b.h / 2, fill: hc.fill, stroke: mix(hc.fill, [1, 1, 1], 0.55), strokeW: 0.7 });
    roundedRect(page, { x: b.x + 1.4, y: b.y + 1.4, w: b.w - 2.8, h: b.h - 2.8 }, { r: (b.h - 2.8) / 2, stroke: mix(hc.fill, [1, 1, 1], 0.3), strokeW: 0.25 });
  } else if (st.header === "board") {
    roundedRect(page, { x: b.x + 0.5, y: b.y + 0.8, w: b.w, h: b.h }, { r: 1.6, fill: [0, 0, 0], opacity: 0.25 });
    roundedRect(page, b, { r: 1.6, fill: hc.fill, stroke: hc.dark, strokeW: 0.8 });
    roundedRect(page, { x: b.x + 1.3, y: b.y + 1.3, w: b.w - 2.6, h: b.h - 2.6 }, { r: 1, stroke: [1, 1, 1], strokeW: 0.35 });
    for (const fx of [0.06, 0.94]) circle(page, b.x + b.w * fx, b.y + 2.4, 0.6, { fill: [0.85, 0.85, 0.8] });
  } else {
    // fita com pontas dobradas
    const tail = 5;
    for (const side of [-1, 1]) {
      const x = side < 0 ? b.x - tail + 1 : b.x + b.w - 1;
      drawShape(page, [{ x, y: b.y + 3 }, { x: x + tail, y: b.y + 3 }, { x: x + tail, y: b.y + b.h + 2 }, { x, y: b.y + b.h + 2 }, { x: x + (side < 0 ? 1.8 : tail - 1.8), y: b.y + b.h / 2 + 2.5 }], {
        fill: hc.dark,
        sharp: true,
      });
    }
    roundedRect(page, { x: b.x + 0.5, y: b.y + 0.8, w: b.w, h: b.h }, { r: 2, fill: [0, 0, 0], opacity: 0.2 });
    roundedRect(page, b, { r: 2, fill: hc.fill, stroke: c.pal.gold, strokeW: 0.7 });
  }
  st.headerDecor?.(c, b);
}

function header(c: SCtx, o: Box, n: number, align: "left" | "right" | "center", gold = false) {
  const { page, st, fonts } = c;
  const w = align === "center" ? 50 : 46;
  const px = align === "left" ? o.x + 7 : align === "right" ? o.x + o.w - 7 - w : o.x + (o.w - w) / 2;
  const b: Box = { x: px, y: o.y + 6.5, w, h: 17 };
  sign(c, b, gold);
  const hc = st.headerColors;
  drawFitted(page, fonts.display, `PISTA ${n}`, { x: b.x + 3, y: b.y + 1.5, w: b.w - 6, h: 9.6 }, hc.text, { max: 20, min: 12, maxLines: 1, shadow: hc.dark, shadowOffset: 0.35 });
  drawFitted(page, fonts.display, `DE ${CLUE_COUNT}`, { x: b.x + 3, y: b.y + 10.6, w: b.w - 6, h: 5.4 }, gold ? c.pal.gold : hc.sub, { max: 10.5, min: 7, maxLines: 1, shadow: hc.dark, shadowOffset: 0.25 });
  if (align !== "center") {
    const bx = align === "left" ? o.x + o.w - 16 : o.x + 16;
    const by = o.y + 15;
    circle(page, bx + 0.3, by + 0.5, 8.6, { fill: [0, 0, 0], opacity: 0.25 });
    circle(page, bx, by, 8.6, { fill: st.badge.fill, stroke: st.badge.edge, strokeW: 0.8 });
    circle(page, bx, by, 7.1, { stroke: st.badge.edge, strokeW: 0.25 });
    st.emblem(c, bx, by, 6.2);
  }
}

// ───────────── texto ─────────────
const mTitle = (c: SCtx, text: string, w: number, maxPt: number, maxH = 18) => fit(c.fonts.display, text, w, maxH, { max: maxPt, min: 10, leading: 1.04, maxLines: 3 });
const mBody = (c: SCtx, text: string, w: number, maxPt: number, maxH = 26) => fit(c.fonts.body, text, w, maxH, { max: maxPt, min: 8, leading: 1.25 });
const dTitle = (c: SCtx, b: TextBlock, x: number, y: number, w: number, col?: RGB) =>
  drawBlock(c.page, c.fonts.display, b, x, y, w, col ?? c.pal.ink, { shadow: mix(c.st.sheet.fill, c.st.sheet.edge, 0.9), shadowOffset: 0.25 });
const dBody = (c: SCtx, b: TextBlock, x: number, y: number, w: number) => drawBlock(c.page, c.fonts.body, b, x, y, w, c.pal.ink);

interface ChStyle {
  max: number;
  min: number;
  light?: boolean;
}
const CH_DEFAULT: ChStyle = { max: 9.6, min: 7.6 };
const CH_FINAL: ChStyle = { max: 10.8, min: 10, light: true };
const chText = (c: SCtx, text: string, w: number, st: ChStyle) => fit(c.fonts.bold, text, w - 7, 45, { max: st.max, min: st.min, leading: 1.24 });
const mChallenge = (c: SCtx, text: string, w: number, st: ChStyle = CH_DEFAULT) => chText(c, text, w, st).height + 10.5;

function challenge(c: SCtx, label: string, text: string, b: Box, seed: number, final = false): number {
  const { page, fonts, st } = c;
  const style = final ? CH_FINAL : CH_DEFAULT;
  const t = chText(c, text, b.w, style);
  const h = t.height + 10.5;
  const box: Box = { x: b.x, y: b.y, w: b.w, h };
  const pts = st.sheet.shape === "torn" ? organicPoints(box, seed, 0.5, 3) : sheetPoints(st, box, seed);
  drawShape(page, pts, {
    fill: style.light ? mix(st.sheet.fill, [1, 1, 1], 0.55) : st.challenge.fill,
    stroke: final ? c.pal.alert : st.challenge.stroke,
    strokeW: final ? 0.7 : 0.5,
  });
  const lw = fonts.display.widthOfTextAtSize(label, 9) / (72 / 25.4) + 9;
  const pill: Box = { x: box.x + (box.w - lw) / 2, y: box.y - 3.3, w: lw, h: 7 };
  if (final) roundedRect(page, { x: pill.x - 0.8, y: pill.y - 0.8, w: pill.w + 1.6, h: pill.h + 1.6 }, { r: 4, fill: c.pal.gold });
  roundedRect(page, pill, { r: 3.5, fill: final ? c.pal.alert : st.challenge.pill, stroke: st.challenge.pillDark, strokeW: 0.4 });
  drawFitted(page, fonts.display, label, { x: pill.x, y: pill.y + 0.6, w: pill.w, h: pill.h - 0.8 }, st.challenge.pillText, { max: 9, min: 7, maxLines: 1 });
  drawBlock(page, fonts.bold, t, box.x + 3.5, box.y + 5.4, box.w - 7, c.pal.ink);
  return h;
}

/** Ilustração integrada por máscara orgânica (≤150 DPI de ampliação). */
function scene(c: SCtx, slot: string, crop: Crop, box: Box, seed: number, shape: "torn" | "blob", align: "center" | "top" | "bottom" = "center") {
  const { page, art, idx, st } = c;
  const max = RasterBook.maxSize(crop);
  const s = Math.min(box.w / crop.w, box.h / crop.h, max.w / crop.w);
  const w = crop.w * s;
  const h = crop.h * s;
  const pl: Box = { x: box.x + (box.w - w) / 2, y: align === "top" ? box.y : align === "bottom" ? box.y + box.h - h : box.y + (box.h - h) / 2, w, h };
  const mask = shape === "blob" ? blobPoints(pl.x + pl.w / 2, pl.y + pl.h / 2, pl.w / 2, pl.h / 2, seed, 0.07, 14) : organicPoints(pl, seed, 1.0, 3.4);
  drawShape(page, mask.map((p) => ({ x: p.x + 0.7, y: p.y + 1 })), { fill: [0, 0, 0], opacity: 0.25 });
  art.place(page, idx, slot, crop, box, { align, clip: (pg) => pushClip(pg, mask) });
  drawShape(page, mask, { stroke: st.frame.stroke, strokeW: 0.6 });
  drawShape(page, mask, { stroke: st.frame.ring, strokeW: 0.2, opacity: 0.9 });
  return pl;
}

function medallion(c: SCtx, slot: string, crop: Crop, cx: number, cy: number, maxD: number) {
  const { page, art, idx, st } = c;
  const m = RasterBook.maxSize(crop);
  const d = Math.min(m.w, m.h, maxD);
  circle(page, cx + 0.5, cy + 0.8, d / 2 + 2, { fill: [0, 0, 0], opacity: 0.3 });
  circle(page, cx, cy, d / 2 + 2, { fill: st.frame.fill, stroke: st.frame.stroke, strokeW: 0.5 });
  art.place(page, idx, slot, crop, { x: cx - d / 2, y: cy - d / 2, w: d, h: d }, { shape: "circle" });
  circle(page, cx, cy, d / 2, { stroke: st.frame.ring, strokeW: 0.6 });
  return d;
}

// ───────────── cards ─────────────
type NClue = ClueContent & { __n: number };
type CardFn = (c: SCtx, o: Box, clue: NClue, seed: number) => void;

function base(c: SCtx, o: Box, seed: number, inset: [number, number]) {
  background(c, o, seed);
  const b: Box = { x: o.x + inset[0], y: o.y + inset[1], w: o.w - inset[0] * 2, h: o.h - inset[1] * 2 };
  sheet(c, b, seed + 1);
  return b;
}

function finish(c: SCtx, o: Box, b: Box, seed: number) {
  c.st.edgeDecor(c, o, b, seed, false);
  roundedRect(c.page, o, { r: 3.5, stroke: c.st.frame.stroke, strokeW: 0.6 });
}

/** Pista sem desafio: texto → vinheta temática → cena no rodapé. */
function storyCard(kind: "start" | "rest" | "trail", align: "left" | "right"): CardFn {
  return (c, o, clue, seed) => {
    const b = base(c, o, seed, [4.5, 4.5]);
    const inner = { x: b.x + 5.5, w: b.w - 11 };
    c.st.watermark(c, align === "left" ? o.x + 78 : o.x + 14, o.y + 64, 7, -20);
    header(c, o, clue.__n, align);
    const top = o.y + 28.5;
    const t = mTitle(c, clue.title, inner.w, 17.5);
    const bd = mBody(c, clue.body, inner.w, 12);
    const scH = RasterBook.maxSize(clue.art).h;
    let y = top;
    dTitle(c, t, inner.x, y, inner.w);
    y += t.height + 2.4;
    dBody(c, bd, inner.x, y, inner.w);
    y += bd.height + 2.5;
    const sceneTop = o.y + 111 - Math.min(scH, 30);
    if (sceneTop - y > 8) c.st.vignette[kind](c, { x: inner.x - 2, y, w: inner.w + 4, h: sceneTop - y - 1 });
    const sc = scene(c, `pista-${clue.__n}`, clue.art, { x: inner.x - 2, y: sceneTop, w: inner.w + 4, h: Math.min(scH, 30) }, seed + 3, "torn");
    c.st.vignette.accents(c, sc, seed + 4);
    finish(c, o, b, seed + 5);
  };
}

/** Pista 2: cena larga + fileira temática + desafio. */
const card2: CardFn = (c, o, clue, seed) => {
  const b = base(c, o, seed, [4, 4.5]);
  const inner = { x: b.x + 5.5, w: b.w - 11 };
  header(c, o, 2, "right");
  const t = mTitle(c, clue.title, inner.w, 17.5);
  const bd = mBody(c, clue.body, inner.w, 12);
  const chH = clue.challenge ? mChallenge(c, clue.challenge.text, inner.w) : 0;
  const chY = o.y + 119 - chH;
  let y = o.y + 28.5;
  dTitle(c, t, inner.x, y, inner.w);
  y += t.height + 2.4;
  dBody(c, bd, inner.x, y, inner.w);
  y += bd.height;
  const rowH = 8;
  const scH = Math.min(RasterBook.maxSize(clue.art).h, chY - 6 - rowH - y - 3);
  const sceneY = y + Math.max(2, (chY - 4 - rowH - y - scH) / 2);
  const sc = scene(c, "pista-2", clue.art, { x: inner.x - 2, y: sceneY, w: inner.w + 4, h: scH }, seed + 3, "torn");
  c.st.vignette.accents(c, sc, seed + 4);
  c.st.vignette.row(c, { x: inner.x, y: chY - 4.5 - rowH, w: inner.w, h: rowH });
  if (clue.challenge) challenge(c, clue.challenge.label, clue.challenge.text, { x: inner.x, y: chY, w: inner.w, h: 0 }, seed + 5);
  finish(c, o, b, seed + 6);
};

/** Pista 4: cena com efeito temático ao redor + desafio. */
const card4: CardFn = (c, o, clue, seed) => {
  const b = base(c, o, seed, [4, 4.5]);
  const inner = { x: b.x + 5.5, w: b.w - 11 };
  header(c, o, 4, "right");
  const t = mTitle(c, clue.title, inner.w, 17.5);
  const bd = mBody(c, clue.body, inner.w, 12);
  const chH = clue.challenge ? mChallenge(c, clue.challenge.text, inner.w) : 0;
  const chY = o.y + 119 - chH;
  let y = o.y + 28.5;
  dTitle(c, t, inner.x, y, inner.w);
  y += t.height + 2.4;
  dBody(c, bd, inner.x, y, inner.w);
  y += bd.height;
  const scH = Math.min(RasterBook.maxSize(clue.art).h, chY - 8 - y);
  const sceneY = y + Math.max(3, (chY - 6 - y - scH) / 2);
  const sc = scene(c, "pista-4", clue.art, { x: inner.x + 4, y: sceneY, w: inner.w - 8, h: scH }, seed + 3, "torn");
  c.st.vignette.burst(c, sc);
  if (clue.challenge) challenge(c, clue.challenge.label, clue.challenge.text, { x: inner.x, y: chY, w: inner.w, h: 0 }, seed + 5);
  finish(c, o, b, seed + 6);
};

/** Pista 6: medalhão orgânico + par temático + desafio. */
const card6: CardFn = (c, o, clue, seed) => {
  const b = base(c, o, seed, [4, 4.5]);
  const inner = { x: b.x + 5.5, w: b.w - 11 };
  header(c, o, 6, "right");
  const t = mTitle(c, clue.title, inner.w, 17.5);
  const bd = mBody(c, clue.body, inner.w, 12);
  const chH = clue.challenge ? mChallenge(c, clue.challenge.text, inner.w) : 0;
  const chY = o.y + 119 - chH;
  let y = o.y + 28.5;
  dTitle(c, t, inner.x, y, inner.w);
  y += t.height + 2.4;
  dBody(c, bd, inner.x, y, inner.w);
  y += bd.height;
  const rowH = Math.min(31, chY - 7 - y);
  const rowY = y + Math.max(2, (chY - 5 - y - rowH) / 2);
  scene(c, "pista-6", clue.art, { x: inner.x, y: rowY, w: 38, h: rowH }, seed + 3, "blob");
  c.st.vignette.pair(c, { x: inner.x + 40, y: rowY, w: inner.w - 40, h: rowH });
  if (clue.challenge) challenge(c, clue.challenge.label, clue.challenge.text, { x: inner.x, y: chY, w: inner.w, h: 0 }, seed + 5);
  finish(c, o, b, seed + 6);
};

/** Pista 7: cena + mapa de progresso até o objetivo. */
const card7: CardFn = (c, o, clue, seed) => {
  const { page, fonts, st } = c;
  const b = base(c, o, seed, [4.5, 4.5]);
  const inner = { x: b.x + 5.5, w: b.w - 11 };
  header(c, o, 7, "left");
  const t = mTitle(c, clue.title, inner.w, 18);
  const bd = mBody(c, clue.body, inner.w, 12.5);
  let y = o.y + 28.5;
  dTitle(c, t, inner.x, y, inner.w);
  y += t.height + 2.4;
  dBody(c, bd, inner.x, y, inner.w);
  y += bd.height + 3;
  const mapY = o.y + 110;
  const scH = Math.min(RasterBook.maxSize(clue.art).h, mapY - 9 - y);
  const sceneY = y + Math.max(0, (mapY - 9 - y - scH) / 2);
  const sc = scene(c, "pista-7", clue.art, { x: inner.x - 3, y: sceneY, w: inner.w + 6, h: scH }, seed + 3, "torn");
  c.st.vignette.accents(c, sc, seed + 4);
  const x0 = inner.x + 3;
  const x1 = inner.x + inner.w - 10;
  const p0 = { x: x0, y: mapY };
  const c1 = { x: x0 + 20, y: mapY - 6 };
  const c2 = { x: x1 - 20, y: mapY + 6 };
  const p1 = { x: x1, y: mapY };
  dottedPath(page, p0, c1, c2, p1, st.frame.stroke, 0.32, 1.3);
  const at = (t2: number) => {
    const u = 1 - t2;
    return {
      x: u * u * u * p0.x + 3 * u * u * t2 * c1.x + 3 * u * t2 * t2 * c2.x + t2 * t2 * t2 * p1.x,
      y: u * u * u * p0.y + 3 * u * u * t2 * c1.y + 3 * u * t2 * t2 * c2.y + t2 * t2 * t2 * p1.y,
    };
  };
  for (let i = 0; i < 8; i++) {
    const p = at(i / 7.6);
    const done = i < 7;
    circle(page, p.x, p.y, done ? 2.1 : 2.5, { fill: done ? st.progress : st.sheet.fill, stroke: st.frame.stroke, strokeW: 0.35 });
    const s = String(i + 1);
    const w = fonts.display.widthOfTextAtSize(s, 7) / (72 / 25.4);
    const q = pt(page, p.x - w / 2, p.y + 1.1);
    page.drawText(s, { x: q.x, y: q.y, size: 7, font: fonts.display, color: color(done ? [1, 1, 1] : st.frame.stroke) });
  }
  st.vignette.goal(c, x1 + 6, mapY - 1);
  finish(c, o, b, seed + 6);
};

/** Pista 8: final da missão. */
const card8: CardFn = (c, o, clue, seed) => {
  const { page, pal, st } = c;
  background(c, o, seed, st.final.band);
  roundedRect(page, { x: o.x + 2.2, y: o.y + 2.2, w: o.w - 4.4, h: o.h - 4.4 }, { r: 2.8, stroke: st.final.frame, strokeW: 0.9 });
  const b: Box = { x: o.x + 5, y: o.y + 5, w: o.w - 10, h: o.h - 10 };
  sheet(c, b, seed + 1, st.final.frameDark);
  beginClip(page, b, "rect", 2);
  sunburst(page, o.x + 64, o.y + 80, 70, 22, st.final.rays, 0.14);
  endClip(page);
  const inner = { x: b.x + 5, w: b.w - 10 };
  header(c, o, 8, "center", true);
  for (const [x, y, s] of [[o.x + 14, o.y + 12, 2.6], [o.x + 78, o.y + 11, 3], [o.x + 21, o.y + 22, 1.6], [o.x + 71, o.y + 23, 1.8]] as const) sparkle(page, x, y, s, pal.gold);
  let y = o.y + 28;
  const t = mTitle(c, clue.title, inner.w, 19, 20);
  dTitle(c, t, inner.x, y, inner.w, pal.alert);
  y += t.height + 1.5;
  const colW = inner.w - 33;
  const bd = mBody(c, clue.body, colW, 11, 14);
  dBody(c, bd, inner.x, y, colW);
  const chH = clue.challenge ? mChallenge(c, clue.challenge.text, inner.w, CH_FINAL) : 0;
  const chY = o.y + o.h - 8 - chH;
  const imgBox: Box = { x: inner.x + colW + 1.5, y: y - 1, w: 31, h: Math.min(52, chY - 5.5 - (y - 1)) };
  const sc = scene(c, "pista-8", clue.art, imgBox, seed + 3, "blob", "top");
  for (const [dx, dy, s] of [[-2, 6, 2.2], [sc.w + 1.5, 14, 2.6], [-1, sc.h - 8, 1.8], [sc.w + 2, sc.h - 2, 2]] as const) sparkle(page, sc.x + dx, sc.y + dy, s, pal.gold);
  const gx = inner.x + colW / 2;
  const gy = Math.min(y + bd.height + 11, chY - 11);
  st.vignette.goal(c, gx, gy);
  if (clue.challenge) challenge(c, clue.challenge.label, clue.challenge.text, { x: inner.x, y: chY, w: inner.w, h: 0 }, seed + 5, true);
  st.edgeDecor(c, o, b, seed + 7, false);
  roundedRect(page, o, { r: 3.5, stroke: st.final.frameDark, strokeW: 0.8 });
};

const CARDS: CardFn[] = [storyCard("start", "left"), card2, storyCard("rest", "left"), card4, storyCard("trail", "left"), card6, card7, card8];

export function cluesPageStory(doc: PDFDocument, kit: EditorialKit, st: ThemeStyle, first: 1 | 5, fonts: Fonts, art: RasterBook) {
  const page = doc.addPage([mm(A4_MM.w), mm(A4_MM.h)]);
  const c: SCtx = { page, idx: doc.getPageCount() - 1, pal: kit.palette, fonts, art, st };
  const gap = 6;
  const x0 = (A4_MM.w - (2 * CARD.w + gap)) / 2;
  const y0 = (A4_MM.h - (2 * CARD.h + gap)) / 2 - 2;
  for (let i = 0; i < 4; i++) {
    const n = first + i;
    const o: Box = { x: x0 + (i % 2) * (CARD.w + gap), y: y0 + Math.floor(i / 2) * (CARD.h + gap), w: CARD.w, h: CARD.h };
    const clue = { ...kit.clues[n - 1], __n: n };
    CARDS[n - 1](c, o, clue, n * 10 + 1);
    cropMarks(page, o);
  }
  const label = `Pistas ${first} a ${first + 3}  ·  recorte pelas marcas dos cantos`;
  const w = fonts.bold.widthOfTextAtSize(label, 7.5) / (72 / 25.4);
  const p = pt(page, (A4_MM.w - w) / 2, A4_MM.h - 6);
  page.drawText(label, { x: p.x, y: p.y, size: 7.5, font: fonts.bold, color: color([0.55, 0.55, 0.55]) });
  return page;
}

// ───────────── páginas inteiras ─────────────
export const PAGE_BAND: Box = { x: 5, y: 5, w: A4_MM.w - 10, h: A4_MM.h - 10 };
export const PAGE_SHEET: Box = { x: 12, y: 12, w: A4_MM.w - 24, h: A4_MM.h - 24 };

export function newStoryPage(doc: PDFDocument, kit: EditorialKit, st: ThemeStyle, fonts: Fonts, art: RasterBook, seed: number): SCtx {
  const page = doc.addPage([mm(A4_MM.w), mm(A4_MM.h)]);
  const c: SCtx = { page, idx: doc.getPageCount() - 1, pal: kit.palette, fonts, art, st };
  background(c, PAGE_BAND, seed);
  sheet(c, PAGE_SHEET, seed + 1);
  return c;
}

function titleSign(c: SCtx, b: Box, lines: string[], maxPt: number) {
  const { page, fonts, st } = c;
  sign(c, b);
  const box = { x: b.x + 9, y: b.y + 4, w: b.w - 18, h: b.h - 8 };
  let size = maxPt;
  const widest = () => Math.max(...lines.map((l) => fonts.display.widthOfTextAtSize(l, size))) / (72 / 25.4);
  while (size > 10 && (widest() > box.w || (size * 1.04 * lines.length) / (72 / 25.4) > box.h)) size -= 0.5;
  const lh = (size * 1.04) / (72 / 25.4);
  drawBlock(page, fonts.display, { lines, size, lineHeight: lh, height: lh * lines.length }, box.x, box.y + (box.h - lh * lines.length) / 2, box.w, st.headerColors.text, {
    shadow: st.headerColors.dark,
  });
}

export function introPageStory(doc: PDFDocument, kit: EditorialKit, st: ThemeStyle, childName: string, fonts: Fonts, art: RasterBook) {
  const c = newStoryPage(doc, kit, st, fonts, art, 101);
  const { page, pal } = c;
  for (const [x, y, r] of [[40, 70, 60], [172, 64, -60], [30, 205, 30]] as const) st.watermark(c, x, y, 9, r);
  titleSign(c, { x: 33, y: 20, w: 144, h: 40 }, kit.intro.titleLines, 36);
  for (const [x, y, s] of [[24, 30, 3], [186, 34, 3.4], [30, 52, 1.8]] as const) sparkle(page, x, y, s, pal.gold);
  drawFitted(page, fonts.display, `Olá, ${childName}!`, { x: 30, y: 65, w: 150, h: 27 }, pal.accent, { max: 52, min: 18, leading: 1.0, maxLines: 2, shadow: pal.accentDark, shadowOffset: 0.7 });

  const card: Box = { x: 30, y: 100, w: 150, h: 100 };
  const pts = st.sheet.shape === "torn" ? organicPoints(card, 111, 0.8, 4) : sheetPoints(st, card, 111);
  drawShape(page, pts.map((p) => ({ x: p.x + 1, y: p.y + 1.5 })), { fill: [0, 0, 0], opacity: 0.15 });
  drawShape(page, pts, { fill: mix(st.sheet.fill, [1, 1, 1], 0.45), stroke: st.frame.stroke, strokeW: 0.6 });
  const inner = { x: card.x + 14, w: card.w - 28 };
  const paras = kit.intro.paragraphs;
  for (let k = 1.4; k >= 0.7; k -= 0.02) {
    const head = fit(fonts.display, kit.intro.headline, inner.w, 30, { max: 19 * k, min: 12, leading: 1.08, maxLines: 2 });
    const blocks = paras.slice(0, -1).map((p) => fit(fonts.body, p, inner.w, 50, { max: 13.5 * k, min: 9.5, leading: 1.3 }));
    const closing = fit(fonts.display, paras[paras.length - 1], inner.w, 20, { max: 18 * k, min: 11, leading: 1.1, maxLines: 1 });
    const gap = 4.2 * k;
    const total = head.height + gap * 1.3 + blocks.reduce((a, b) => a + b.height + gap, 0) + closing.height;
    if (total <= card.h - 18 || k <= 0.71) {
      let y = card.y + (card.h - total) / 2;
      drawBlock(page, fonts.display, head, inner.x, y, inner.w, pal.accentDark);
      y += head.height + gap * 1.3;
      for (const b of blocks) {
        drawBlock(page, fonts.body, b, inner.x, y, inner.w, pal.ink);
        y += b.height + gap;
      }
      drawBlock(page, fonts.display, closing, inner.x, y, inner.w, pal.accent, { shadow: pal.accentDark, shadowOffset: 0.3 });
      break;
    }
  }
  const cast = kit.intro.cast;
  medallion(c, "elenco-1", cast[0], card.x - 1, card.y + 4, 30);
  medallion(c, "elenco-2", cast[1], card.x + card.w + 1, card.y + 8, 24);
  st.vignette.map(c, { x: 20, y: 214, w: 170, h: 58 });
  medallion(c, "elenco-3", cast[2], 98, 256, 26);
  medallion(c, "elenco-4", cast[3], 70, 262, 22);
  medallion(c, "elenco-5", cast[4], 140, 236, 24);
  st.edgeDecor(c, PAGE_BAND, PAGE_SHEET, 131, true);
  return page;
}

function laurel(c: SCtx, cx: number, cy: number, h: number, side: 1 | -1) {
  const { page, pal } = c;
  const gd = shade(pal.gold, 0.7);
  let prev = { x: cx, y: cy };
  for (let i = 1; i <= 7; i++) {
    const t = i / 7;
    const x = cx + side * Math.sin(t * 1.2) * h * 0.45;
    const y = cy - t * h;
    page.drawLine({ start: pt(page, prev.x, prev.y), end: pt(page, x, y), thickness: mm(0.6), color: color(gd) });
    const dir = (Math.atan2(y - prev.y, x - prev.x) * 180) / Math.PI;
    const len = 6.2 - t * 1.6;
    bladeLeaf(page, x, y, len, dir - side * 55, len * 0.42, pal.gold, gd);
    bladeLeaf(page, x, y, len, dir + side * 55, len * 0.42, shade(pal.gold, 0.86), gd);
    prev = { x, y };
  }
}

export function certificatePageStory(doc: PDFDocument, kit: EditorialKit, st: ThemeStyle, childName: string, fonts: Fonts, art: RasterBook) {
  const c = newStoryPage(doc, kit, st, fonts, art, 201);
  const { page, pal } = c;
  const cert = kit.certificate;
  roundedRect(page, { x: 19, y: 19, w: A4_MM.w - 38, h: A4_MM.h - 38 }, { r: 4, stroke: pal.gold, strokeW: 0.9 });
  roundedRect(page, { x: 21.5, y: 21.5, w: A4_MM.w - 43, h: A4_MM.h - 43 }, { r: 3, stroke: pal.gold, strokeW: 0.3 });
  beginClip(page, PAGE_SHEET, "rect", 3);
  sunburst(page, 105, 100, 120, 28, st.final.rays, 0.08);
  endClip(page);
  drawFitted(page, fonts.display, cert.title, { x: 25, y: 26, w: 160, h: 31 }, pal.gold, { max: 64, min: 30, maxLines: 1, shadow: st.headerColors.dark, shadowOffset: 0.9 });
  const sb: Box = { x: 30, y: 58, w: 150, h: 17 };
  sign(c, sb);
  drawFitted(page, fonts.display, cert.subtitle, { x: sb.x + 8, y: sb.y + 2, w: sb.w - 16, h: sb.h - 3 }, st.headerColors.text, { max: 19, min: 10, maxLines: 1, shadow: st.headerColors.dark });

  // Medalha com o emblema do tema
  const mx = 105;
  const my = 102;
  for (const dir of [-1, 1]) {
    const p = pt(page, mx + dir * 5 - 4, my + 9);
    page.drawSvgPath(`M 0 0 L ${mm(8)} 0 L ${mm(8)} ${mm(19)} L ${mm(4)} ${mm(15.5)} L 0 ${mm(19)} Z`, { x: p.x, y: p.y, color: color(pal.alert) });
  }
  circle(page, mx + 0.5, my + 0.8, 17, { fill: [0, 0, 0], opacity: 0.3 });
  circle(page, mx, my, 17, { fill: pal.gold, stroke: shade(pal.gold, 0.7), strokeW: 0.8 });
  for (let i = 0; i < 28; i++) {
    const a = (i / 28) * Math.PI * 2;
    circle(page, mx + Math.cos(a) * 15.3, my + Math.sin(a) * 15.3, 0.85, { fill: shade(pal.gold, 0.78) });
  }
  circle(page, mx, my, 12.6, { fill: st.badge.fill, stroke: shade(pal.gold, 0.7), strokeW: 0.6 });
  st.emblem(c, mx, my, 10);
  medallion(c, "certificado-1", cert.art[0], 50, 105, 30);
  if (cert.art[1]) medallion(c, "certificado-2", cert.art[1], 160, 105, 26);
  for (const [x, y, s] of [[78, 86, 2.4], [132, 88, 2.8], [84, 124, 1.8], [128, 122, 2]] as const) sparkle(page, x, y, s, pal.gold);

  laurel(c, 44, 172, 26, -1);
  laurel(c, 166, 172, 26, 1);
  drawFitted(page, fonts.display, childName, { x: 45, y: 142, w: 120, h: 30 }, pal.accent, { max: 56, min: 16, leading: 1.0, maxLines: 2, shadow: pal.accentDark, shadowOffset: 0.7 });
  page.drawLine({ start: pt(page, 48, 176), end: pt(page, 162, 176), thickness: mm(0.6), color: color(pal.gold) });
  drawFitted(page, fonts.bold, cert.text, { x: 32, y: 183, w: 146, h: 30 }, pal.ink, { max: 18, min: 11, leading: 1.28, maxLines: 3 });
  const lineY = 236;
  for (const [label, x, w] of [[cert.dateLabel, 30, 64], [cert.signatureLabel, 106, 76]] as const) {
    const p = pt(page, x, lineY);
    page.drawText(label, { x: p.x, y: p.y, size: 10, font: fonts.bold, color: color(pal.ink) });
    page.drawLine({ start: pt(page, x, lineY + 10), end: pt(page, x + w, lineY + 10), thickness: mm(0.35), color: color(pal.ink) });
  }
  st.vignette.certFooter(c, { x: 30, y: 252, w: 150, h: 20 });
  st.edgeDecor(c, PAGE_BAND, PAGE_SHEET, 221, true);
  return page;
}

export { rng, sparkle, drawShape, blobPoints, shade, mix };
