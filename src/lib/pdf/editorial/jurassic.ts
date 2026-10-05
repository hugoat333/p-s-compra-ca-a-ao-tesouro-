/**
 * Direção de arte "expedição jurássica" (Dinossauros): cards de pista como páginas de uma expedição.
 * Cenário quase todo vetorial; a arte raster entra integrada por máscara orgânica, a ≥150 DPI.
 * Cada card tem composição própria (A–D) sobre uma identidade comum.
 */
import type { PDFDocument, PDFPage } from "pdf-lib";
import type { ClueContent, EditorialKit, Palette, RGB, Crop } from "../../editorial/types";
import { CLUE_COUNT } from "../../themes";
import type { Fonts } from "./fonts";
import { RasterBook } from "./raster";
import { beginClip, endClip, circle, cropMarks, footprint, plank, roundedRect } from "./shapes";
import { drawBlock, drawFitted, fit, type TextBlock } from "./text";
import { A4_MM, type Box, color, mix, mm, pt, shade } from "./units";
import { degrees } from "pdf-lib";
import {
  bigLeaf,
  bladeLeaf,
  volcano,
  blobPoints,
  compass,
  dottedPath,
  drawShape,
  egg,
  fern,
  organicPoints,
  parchment,
  pushClip,
  rng,
  sparkle,
  stone,
  sunburst,
  vine,
  xMark,
  type Greens,
} from "./jungle";

export const CARD = { w: 92, h: 130 };

interface Ctx {
  page: PDFPage;
  idx: number;
  pal: Palette;
  g: Greens;
  fonts: Fonts;
  art: RasterBook;
}

const JUNGLE: RGB = [0.24, 0.42, 0.2];
const GREENS: Greens = { light: [0.49, 0.71, 0.29], mid: [0.31, 0.56, 0.23], dark: [0.17, 0.36, 0.15] };
const GOLD_DEEP: RGB = [0.72, 0.5, 0.12];

// ───────────── base comum ─────────────
function jungleBackground(c: Ctx, o: Box, seed: number, base: RGB = JUNGLE) {
  const { page, g } = c;
  roundedRect(page, o, { r: 3.5, fill: base });
  beginClip(page, o, "rect", 3.5);
  const r = rng(seed);
  for (let i = 0; i < 4; i++) roundedRect(page, { x: o.x + i * 2, y: o.y + i * 2, w: o.w - i * 4, h: o.h - i * 4 }, { r: 3, stroke: shade(base, 0.7), strokeW: 2.5, opacity: 0.25 });
  // Folhagem de fundo nas bordas (apontando para dentro).
  const edgeLeaf = (x: number, y: number, ang: number) => bigLeaf(page, x, y, 9 + r() * 7, ang + (r() - 0.5) * 30, g, r() > 0.6 ? "dark" : "mid");
  for (let y = o.y - 2; y < o.y + o.h; y += 4.5) {
    edgeLeaf(o.x - 2, y + r() * 4, -10 + r() * 20);
    edgeLeaf(o.x + o.w + 2, y + r() * 4, 190 - r() * 20);
  }
  for (let y = o.y + 3; y < o.y + o.h; y += 9) {
    bigLeaf(page, o.x - 1, y, 7 + r() * 3, -25 + r() * 50, g, "light");
    bigLeaf(page, o.x + o.w + 1, y + 4, 7 + r() * 3, 155 + r() * 50, g, "light");
  }
  for (let x = o.x; x < o.x + o.w; x += 6) {
    edgeLeaf(x + r() * 4, o.y - 2, 80 + r() * 20);
    edgeLeaf(x + r() * 4, o.y + o.h + 2, -80 - r() * 20);
  }
  endClip(page);
}

function sheet(c: Ctx, b: Box, seed: number, edge?: RGB) {
  const pts = organicPoints(b, seed, 0.75, 3.2);
  parchment(c.page, pts, b, seed, c.pal.parchment, edge ?? c.pal.parchmentEdge);
  return pts;
}

/** Cipós e samambaias sobre as bordas do pergaminho (integra papel e selva). */
function edgeFoliage(c: Ctx, o: Box, b: Box, seed: number, opts: { left?: boolean; right?: boolean; bottom?: boolean } = {}) {
  const { page, g } = c;
  if (opts.left !== false) vine(page, b.x + 0.8, b.y + 22, b.y + b.h - 18, g, seed, 1);
  if (opts.right !== false) vine(page, b.x + b.w - 0.8, b.y + 26, b.y + b.h - 22, g, seed + 5, -1);
  if (opts.bottom !== false) {
    fern(page, o.x + 3, o.y + o.h - 3, 21, -58, g, seed + 1, 1);
    fern(page, o.x + o.w - 3, o.y + o.h - 3, 21, -122, g, seed + 2, -1);
    bigLeaf(page, o.x + 2, o.y + o.h - 9, 12, -20, g, "mid");
    bigLeaf(page, o.x + o.w - 2, o.y + o.h - 9, 12, 200, g, "mid");
  }
}

function header(c: Ctx, o: Box, n: number, align: "left" | "right" | "center", gold = false) {
  const { page, pal, fonts } = c;
  const w = align === "center" ? 50 : 46;
  const px = align === "left" ? o.x + 7 : align === "right" ? o.x + o.w - 7 - w : o.x + (o.w - w) / 2;
  const sign: Box = { x: px, y: o.y + 6.5, w, h: 17 };
  if (gold) roundedRect(page, { x: sign.x - 1.2, y: sign.y - 1.2, w: sign.w + 2.4, h: sign.h + 2.4 }, { r: 3, fill: pal.gold, stroke: GOLD_DEEP, strokeW: 0.4 });
  plank(page, sign, pal.wood, pal.woodDark);
  drawFitted(page, fonts.display, `PISTA ${n}`, { x: sign.x + 3, y: sign.y + 1.5, w: sign.w - 6, h: 9.6 }, pal.woodText, {
    max: 20,
    min: 12,
    maxLines: 1,
    shadow: pal.woodDark,
    shadowOffset: 0.35,
  });
  drawFitted(page, fonts.display, `DE ${CLUE_COUNT}`, { x: sign.x + 3, y: sign.y + 10.6, w: sign.w - 6, h: 5.4 }, gold ? pal.gold : pal.badge, {
    max: 10.5,
    min: 7,
    maxLines: 1,
    shadow: pal.woodDark,
    shadowOffset: 0.25,
  });
  // Selo redondo com pegada, do lado oposto
  if (align !== "center") {
    const bx = align === "left" ? o.x + o.w - 16 : o.x + 16;
    const by = o.y + 15;
    circle(page, bx + 0.3, by + 0.5, 8.6, { fill: shade(pal.badgeEdge, 0.5), opacity: 0.35 });
    circle(page, bx, by, 8.6, { fill: pal.badge, stroke: pal.badgeEdge, strokeW: 0.8 });
    circle(page, bx, by, 7.1, { stroke: pal.badgeEdge, strokeW: 0.25 });
    footprint(page, bx, by, 9.5, pal.icon);
  }
}

const mTitle = (c: Ctx, text: string, w: number, maxPt: number, maxH = 18) => fit(c.fonts.display, text, w, maxH, { max: maxPt, min: 10, leading: 1.02, maxLines: 3 });
const mBody = (c: Ctx, text: string, w: number, maxPt: number, maxH = 26) => fit(c.fonts.body, text, w, maxH, { max: maxPt, min: 8, leading: 1.25 });
const dTitle = (c: Ctx, b: TextBlock, x: number, y: number, w: number, col?: RGB) =>
  drawBlock(c.page, c.fonts.display, b, x, y, w, col ?? c.pal.ink, { shadow: mix(c.pal.parchment, c.pal.parchmentEdge, 0.9), shadowOffset: 0.25 });
const dBody = (c: Ctx, b: TextBlock, x: number, y: number, w: number) => drawBlock(c.page, c.fonts.body, b, x, y, w, c.pal.ink);
const mChallenge = (c: Ctx, text: string, w: number, st: ChallengeStyle = CH_DEFAULT) => challengeText(c, text, w, st).height + 10.5;

function title(c: Ctx, text: string, x: number, y: number, w: number, maxPt: number, col?: RGB, maxH = 18): TextBlock {
  const b = fit(c.fonts.display, text, w, maxH, { max: maxPt, min: 10, leading: 1.02, maxLines: 3 });
  drawBlock(c.page, c.fonts.display, b, x, y, w, col ?? c.pal.ink, { shadow: mix(c.pal.parchment, c.pal.parchmentEdge, 0.9), shadowOffset: 0.25 });
  return b;
}

function body(c: Ctx, text: string, x: number, y: number, w: number, maxPt: number, maxH = 26): TextBlock {
  const b = fit(c.fonts.body, text, w, maxH, { max: maxPt, min: 8, leading: 1.25 });
  drawBlock(c.page, c.fonts.body, b, x, y, w, c.pal.ink);
  return b;
}

/** Bloco de desafio: pergaminho escuro com placa de título. */
interface ChallengeStyle {
  max: number;
  min: number;
  light?: boolean; // fundo claro (mais contraste)
}
const CH_DEFAULT: ChallengeStyle = { max: 9.6, min: 7.6 };
/** Desafio final: corpo maior e fundo claro para leitura confortável. */
const CH_FINAL: ChallengeStyle = { max: 10.8, min: 10, light: true };

const challengeText = (c: Ctx, text: string, w: number, st: ChallengeStyle) =>
  fit(c.fonts.bold, text, w - 7, 45, { max: st.max, min: st.min, leading: 1.24 });

function challenge(c: Ctx, label: string, text: string, b: Box, seed: number, accent?: RGB, st: ChallengeStyle = CH_DEFAULT): number {
  const { page, pal, fonts } = c;
  const t = challengeText(c, text, b.w, st);
  const h = t.height + 10.5;
  const box: Box = { x: b.x, y: b.y, w: b.w, h };
  drawShape(page, organicPoints(box, seed, 0.5, 3), {
    fill: st.light ? mix(pal.parchment, [1, 1, 1], 0.45) : mix(pal.parchment, pal.parchmentEdge, 0.45),
    stroke: accent ?? pal.wood,
    strokeW: st.light ? 0.7 : 0.5,
  });
  const lw = fonts.display.widthOfTextAtSize(label, 9) / (72 / 25.4) + 9;
  const pill: Box = { x: box.x + (box.w - lw) / 2, y: box.y - 3.3, w: lw, h: 7 };
  if (accent) roundedRect(page, { x: pill.x - 0.8, y: pill.y - 0.8, w: pill.w + 1.6, h: pill.h + 1.6 }, { r: 4, fill: pal.gold });
  roundedRect(page, pill, { r: 3.5, fill: accent ?? pal.wood, stroke: pal.woodDark, strokeW: 0.4 });
  drawFitted(page, fonts.display, label, { x: pill.x, y: pill.y + 0.6, w: pill.w, h: pill.h - 0.8 }, pal.woodText, { max: 9, min: 7, maxLines: 1 });
  drawBlock(page, fonts.bold, t, box.x + 3.5, box.y + 5.4, box.w - 7, pal.ink);
  return h;
}

/** Ilustração integrada: máscara orgânica, sombra, borda irregular e folhas sobrepostas. */
function scene(c: Ctx, slot: string, crop: Crop, box: Box, seed: number, shape: "torn" | "blob" | "arch", align: "center" | "top" | "bottom" = "center") {
  const { page, pal, g, art, idx } = c;
  const maskOf = (pl: Box) => {
    if (shape === "blob") return blobPoints(pl.x + pl.w / 2, pl.y + pl.h / 2, pl.w / 2, pl.h / 2, seed, 0.07, 14);
    if (shape === "arch") {
      const pts = organicPoints({ x: pl.x, y: pl.y + pl.h * 0.25, w: pl.w, h: pl.h * 0.75 }, seed, 0.5, 4).filter((p) => p.y > pl.y + pl.h * 0.3);
      const arc = Array.from({ length: 12 }, (_, i) => {
        const a = Math.PI + (i / 11) * Math.PI;
        return { x: pl.x + pl.w / 2 + Math.cos(a) * (pl.w / 2), y: pl.y + pl.h * 0.32 + Math.sin(a) * pl.h * 0.32 };
      });
      return [...arc, ...pts.filter((p) => p.y > pl.y + pl.h * 0.32).sort((a, b) => (b.y - a.y) * 0.001 + (b.x - a.x))];
    }
    return organicPoints(pl, seed, 1.0, 3.4);
  };
  // Tamanho final é decidido pelo RasterBook (limite de DPI); calculamos antes para a sombra.
  const max = RasterBook.maxSize(crop);
  const s = Math.min(box.w / crop.w, box.h / crop.h, max.w / crop.w);
  const w = crop.w * s;
  const h = crop.h * s;
  const pl: Box = { x: box.x + (box.w - w) / 2, y: align === "top" ? box.y : align === "bottom" ? box.y + box.h - h : box.y + (box.h - h) / 2, w, h };
  const mask = maskOf(pl);
  drawShape(page, mask.map((p) => ({ x: p.x + 0.7, y: p.y + 1 })), { fill: shade(pal.woodDark, 0.6), opacity: 0.35 });
  const placed = art.place(page, idx, slot, crop, box, { align, clip: (pg) => pushClip(pg, mask) });
  void placed;
  drawShape(page, mask, { stroke: pal.woodDark, strokeW: 0.55 });
  drawShape(page, mask.map((p) => ({ x: p.x, y: p.y })), { stroke: pal.parchmentEdge, strokeW: 0.2, opacity: 0.8 });
  void g;
  return pl;
}

// ───────────── Card A — Pista 5: cena panorâmica na base, trilha até ela ─────────────
function card5(c: Ctx, o: Box, clue: ClueContent, crop: Crop) {
  const { page, pal, g } = c;
  jungleBackground(c, o, 51);
  const b: Box = { x: o.x + 4.5, y: o.y + 4, w: o.w - 9, h: o.h - 8.5 };
  sheet(c, b, 52);
  const inner = { x: b.x + 5.5, w: b.w - 11 };
  // pegadas-marca d'água
  for (const [x, y, rot] of [
    [o.x + 15, o.y + 66, 70],
    [o.x + 77, o.y + 30, -20],
  ] as const)
    footprint(page, x, y, 7, mix(pal.parchment, pal.parchmentEdge, 0.55), rot);
  header(c, o, 5, "left");
  const top = o.y + 28.5;
  const t = mTitle(c, clue.title, inner.w, 17.5);
  const bd = mBody(c, clue.body, inner.w, 12);
  const scH = RasterBook.maxSize(crop).h;
  const avail = o.y + 113 - top;
  const g0 = Math.max(2, Math.min(5, (avail - t.height - bd.height - scH) / 4));
  let y = top;
  dTitle(c, t, inner.x, y, inner.w);
  y += t.height + g0 * 0.6;
  dBody(c, bd, inner.x, y, inner.w);
  y += bd.height + g0;
  // Cena ancorada perto do rodapé; a trilha de exploração ocupa o espaço entre o texto e a cena.
  const sceneTop = o.y + 110 - scH;
  const mid = (y + sceneTop) / 2;
  dottedPath(page, { x: o.x + 14, y: y + 1 }, { x: o.x + 46, y: y + 2 }, { x: o.x + 20, y: sceneTop - 4 }, { x: o.x + 50, y: sceneTop - 1 }, pal.woodDark, 0.42, 1.7);
  footprint(page, o.x + 18, y + 5, 5.6, pal.icon, 115);
  footprint(page, o.x + 28, mid - 1, 5.6, pal.icon, 140);
  footprint(page, o.x + 31, sceneTop - 7, 5.6, pal.icon, 155);
  magnifier(c, o.x + 68, mid - 3, 6.5);
  xMark(page, o.x + 56, sceneTop - 3.5, 1.2, pal.alert);
  const sc = scene(c, "pista-5", crop, { x: inner.x - 2, y: sceneTop, w: inner.w + 4, h: scH }, 55, "torn");
  bigLeaf(page, sc.x - 3, sc.y + 3, 10, 25, g, "light");
  bigLeaf(page, sc.x - 2, sc.y + sc.h - 2, 11, -15, g, "mid");
  bigLeaf(page, sc.x + sc.w + 3, sc.y + 4, 10, 155, g, "mid");
  bigLeaf(page, sc.x + sc.w + 2, sc.y + sc.h - 3, 11, 195, g, "light");
  stone(page, sc.x + 8, sc.y + sc.h + 1.5, 9, 4.5, 56);
  stone(page, sc.x + 15, sc.y + sc.h + 2.3, 5, 3, 57, [0.6, 0.55, 0.48]);
  stone(page, sc.x + sc.w - 10, sc.y + sc.h + 1.8, 8, 4, 58);
  egg(page, sc.x + sc.w - 18, sc.y + sc.h + 1.4, 5.2, 59, undefined, undefined, -12);
  edgeFoliage(c, o, b, 53);
  roundedRect(page, o, { r: 3.5, stroke: pal.woodDark, strokeW: 0.6 });
}

function magnifier(c: Ctx, cx: number, cy: number, r: number) {
  const { page, pal } = c;
  const a = Math.PI / 4;
  page.drawLine({
    start: pt(page, cx + Math.cos(a) * r * 0.95, cy + Math.sin(a) * r * 0.95),
    end: pt(page, cx + Math.cos(a) * r * 2.1, cy + Math.sin(a) * r * 2.1),
    thickness: mm(r * 0.38),
    color: color(pal.woodDark),
    lineCap: 1,
  });
  circle(page, cx, cy, r, { fill: [0.8, 0.9, 0.95], stroke: pal.gold, strokeW: r * 0.22, opacity: 0.85 });
  circle(page, cx - r * 0.3, cy - r * 0.35, r * 0.22, { fill: [1, 1, 1], opacity: 0.8 });
}

// ───────────── Card B — Pista 6: medalhão + comparação de pegadas ─────────────
function card6(c: Ctx, o: Box, clue: ClueContent, crop: Crop) {
  const { page, pal, g } = c;
  jungleBackground(c, o, 61);
  const b: Box = { x: o.x + 4, y: o.y + 4.5, w: o.w - 8.5, h: o.h - 9 };
  sheet(c, b, 62);
  const inner = { x: b.x + 5.5, w: b.w - 11 };
  // marca d'água: trilha de pegadas cruzando o card
  for (let i = 0; i < 6; i++) footprint(page, o.x + 12 + i * 13, o.y + 104 - i * 9 + (i % 2) * 3, 5, mix(pal.parchment, pal.parchmentEdge, 0.5), 50);
  header(c, o, 6, "right");
  const top = o.y + 28.5;
  const t = mTitle(c, clue.title, inner.w, 17.5);
  const bd = mBody(c, clue.body, inner.w, 12);
  const rowH = 31;
  const chH = clue.challenge ? mChallenge(c, clue.challenge.text, inner.w) : 0;
  const avail = o.y + 117 - top;
  const g0 = Math.max(2.5, Math.min(10, (avail - t.height - bd.height - rowH - chH) / 3));
  let y = top;
  dTitle(c, t, inner.x, y, inner.w);
  y += t.height + g0 * 0.6;
  dBody(c, bd, inner.x, y, inner.w);
  y += bd.height + g0;
  // Linha do meio: medalhão orgânico (esq.) + duas pegadas para comparar (dir.)
  const rowY = y;
  const med = scene(c, "pista-6", crop, { x: inner.x + 1, y: rowY, w: 34, h: rowH }, 63, "blob");
  bigLeaf(page, med.x - 2, med.y + med.h - 3, 9, -30, g, "light");
  bigLeaf(page, med.x + med.w + 1, med.y + med.h - 1, 8, 200, g, "mid");
  const fx = inner.x + 50;
  footprint(page, fx, rowY + 13, 16, pal.icon, -8);
  footprint(page, fx + 15, rowY + 17, 10.5, shade(pal.wood, 1.1), 10);
  dottedPath(page, { x: fx - 7, y: rowY + 26.5 }, { x: fx, y: rowY + 26.5 }, { x: fx + 12, y: rowY + 26.5 }, { x: fx + 21, y: rowY + 26.5 }, pal.wood, 0.3, 1.2);
  for (const tx of [fx - 7, fx + 21]) page.drawLine({ start: pt(page, tx, rowY + 25), end: pt(page, tx, rowY + 28), thickness: mm(0.35), color: color(pal.wood) });
  y = rowY + rowH + g0 + 1.5;
  if (clue.challenge) challenge(c, clue.challenge.label, clue.challenge.text, { x: inner.x, y, w: inner.w, h: 0 }, 64);
  edgeFoliage(c, o, b, 65, { bottom: true });
  stone(page, o.x + 46, o.y + o.h - 4, 10, 4.5, 66);
  egg(page, o.x + 54, o.y + o.h - 6, 5.5, 67, undefined, undefined, 15);
  roundedRect(page, o, { r: 3.5, stroke: pal.woodDark, strokeW: 0.6 });
}

// ───────────── Card C — Pista 7: janela em arco + mapa de progresso até o ninho ─────────────
function card7(c: Ctx, o: Box, clue: ClueContent, crop: Crop) {
  const { page, pal, g, fonts } = c;
  jungleBackground(c, o, 71);
  const b: Box = { x: o.x + 4.5, y: o.y + 4.5, w: o.w - 9, h: o.h - 9 };
  sheet(c, b, 72);
  const inner = { x: b.x + 5.5, w: b.w - 11 };
  header(c, o, 7, "left");
  const top = o.y + 28.5;
  const t = mTitle(c, clue.title, inner.w, 18);
  const bd = mBody(c, clue.body, inner.w, 12.5);
  const scH = RasterBook.maxSize(crop).h;
  const mapH = 16;
  const avail = o.y + 116 - top;
  const g0 = Math.max(2.5, Math.min(5, (avail - t.height - bd.height - scH - mapH) / 4));
  let y = top;
  dTitle(c, t, inner.x, y, inner.w);
  y += t.height + g0 * 0.6;
  dBody(c, bd, inner.x, y, inner.w);
  y += bd.height + g0;
  const mapY = o.y + 109;
  const sceneY = y + Math.max(0, (mapY - 10 - y - scH) / 2);
  const sc = scene(c, "pista-7", crop, { x: inner.x - 3, y: sceneY, w: inner.w + 6, h: scH }, 73, "torn");
  bigLeaf(page, sc.x - 2.5, sc.y + 6, 11, 15, g, "mid");
  bigLeaf(page, sc.x + sc.w + 2.5, sc.y + 8, 11, 170, g, "light");
  bigLeaf(page, sc.x + 4, sc.y + sc.h + 1, 8, -60, g, "light");
  stone(page, sc.x + sc.w - 6, sc.y + sc.h + 1.2, 7, 3.5, 77);
  y = mapY;
  // Mapa de progresso: 8 marcos, 7 alcançados, ninho no fim
  const my = y;
  const x0 = inner.x + 3;
  const x1 = inner.x + inner.w - 9;
  dottedPath(page, { x: x0, y: my }, { x: x0 + 20, y: my - 7 }, { x: x1 - 20, y: my + 7 }, { x: x1, y: my }, pal.wood, 0.32, 1.3);
  const at = (t2: number) => {
    const u = 1 - t2;
    const p0 = { x: x0, y: my };
    const c1 = { x: x0 + 20, y: my - 7 };
    const c2 = { x: x1 - 20, y: my + 7 };
    const p1 = { x: x1, y: my };
    return {
      x: u * u * u * p0.x + 3 * u * u * t2 * c1.x + 3 * u * t2 * t2 * c2.x + t2 * t2 * t2 * p1.x,
      y: u * u * u * p0.y + 3 * u * u * t2 * c1.y + 3 * u * t2 * t2 * c2.y + t2 * t2 * t2 * p1.y,
    };
  };
  for (let i = 0; i < 8; i++) {
    const p = at(i / 7.6);
    const done = i < 7;
    circle(page, p.x, p.y, done ? 2.1 : 2.5, { fill: done ? pal.accent : pal.parchment, stroke: pal.woodDark, strokeW: 0.35 });
    const s = String(i + 1);
    const sz = 7;
    const w = fonts.display.widthOfTextAtSize(s, sz) / (72 / 25.4);
    const q = pt(page, p.x - w / 2, p.y + 1.1);
    page.drawText(s, { x: q.x, y: q.y, size: sz, font: fonts.display, color: color(done ? [1, 1, 1] : pal.woodDark) });
  }
  // ninho com ovo ao fim do caminho
  const nest = { x: x1 + 5, y: my - 1 };
  drawShape(page, blobPoints(nest.x, nest.y + 2, 5, 2.2, 74, 0.15, 10), { fill: [0.55, 0.38, 0.2], stroke: pal.woodDark, strokeW: 0.25 });
  for (let i = 0; i < 6; i++)
    page.drawLine({ start: pt(page, nest.x - 4.5 + i * 1.6, nest.y + 1), end: pt(page, nest.x - 3.5 + i * 1.6, nest.y + 3.4), thickness: mm(0.2), color: color([0.38, 0.25, 0.12]) });
  egg(page, nest.x, nest.y - 1.8, 6.4, 75);
  xMark(page, nest.x + 6.2, nest.y - 5, 1.3, pal.alert);
  edgeFoliage(c, o, b, 76);
  roundedRect(page, o, { r: 3.5, stroke: pal.woodDark, strokeW: 0.6 });
}

// ───────────── Card D — Pista 8: final da missão (dourado, raios, ovo em destaque) ─────────────
function card8(c: Ctx, o: Box, clue: ClueContent, crop: Crop) {
  const { page, pal, g } = c;
  jungleBackground(c, o, 81, [0.2, 0.35, 0.17]);
  // moldura dourada dupla
  roundedRect(page, { x: o.x + 2.2, y: o.y + 2.2, w: o.w - 4.4, h: o.h - 4.4 }, { r: 2.8, stroke: pal.gold, strokeW: 0.9 });
  const b: Box = { x: o.x + 5, y: o.y + 5, w: o.w - 10, h: o.h - 10 };
  sheet(c, b, 82, GOLD_DEEP);
  beginClip(page, b, "rect", 2);
  sunburst(page, o.x + 64, o.y + 80, 70, 22, pal.gold, 0.13);
  endClip(page);
  const inner = { x: b.x + 5, w: b.w - 10 };
  header(c, o, 8, "center", true);
  for (const [x, y, s] of [
    [o.x + 14, o.y + 12, 2.6],
    [o.x + 78, o.y + 11, 3],
    [o.x + 21, o.y + 22, 1.6],
    [o.x + 71, o.y + 23, 1.8],
  ] as const)
    sparkle(page, x, y, s, pal.gold);
  let y = o.y + 28;
  const t = title(c, clue.title, inner.x, y, inner.w, 19, pal.alert, 20);
  y += t.height + 1.5;
  // Coluna esquerda: texto + desafio final; coluna direita: ilustração alta com raios
  const colW = inner.w - 33;
  const bd = body(c, clue.body, inner.x, y, colW, 11, 12);
  // Desafio final ancorado no rodapé com corpo maior; a ilustração usa o espaço que sobra (≤ 52 mm).
  const chH = clue.challenge ? mChallenge(c, clue.challenge.text, inner.w, CH_FINAL) : 0;
  const chY = o.y + o.h - 8 - chH;
  const imgBox: Box = { x: inner.x + colW + 1.5, y: y - 1, w: 31, h: Math.min(52, chY - 5.5 - (y - 1)) };
  const sc = scene(c, "pista-8", crop, imgBox, 83, "blob", "top");
  for (const [dx, dy, s2] of [
    [-2, 6, 2.2],
    [sc.w + 1.5, 14, 2.6],
    [-1, sc.h - 8, 1.8],
    [sc.w + 2, sc.h - 2, 2],
  ] as const)
    sparkle(page, sc.x + dx, sc.y + dy, s2, pal.gold);
  bigLeaf(page, sc.x - 1, sc.y + sc.h - 1, 9, -40, g, "light");
  bigLeaf(page, sc.x + sc.w + 1.5, sc.y + sc.h - 2, 9, 210, g, "mid");
  compass(page, inner.x + colW / 2, Math.min(y + bd.height + 9, chY - 10), 5.8, pal.gold, pal.woodDark, pal.parchment);
  if (clue.challenge) challenge(c, clue.challenge.label, clue.challenge.text, { x: inner.x, y: chY, w: inner.w, h: 0 }, 84, pal.alert, CH_FINAL);
  fern(page, o.x + 3, o.y + o.h - 3, 15, -60, g, 85, 1);
  fern(page, o.x + o.w - 3, o.y + o.h - 3, 15, -120, g, 86, -1);
  roundedRect(page, o, { r: 3.5, stroke: GOLD_DEEP, strokeW: 0.8 });
}


// ───────────── Card E — Pista 1: início da expedição (bússola → trilha → cena) ─────────────
function card1(c: Ctx, o: Box, clue: ClueContent, crop: Crop) {
  const { page, pal, g } = c;
  jungleBackground(c, o, 11);
  const b: Box = { x: o.x + 4.5, y: o.y + 4.5, w: o.w - 9, h: o.h - 9 };
  sheet(c, b, 12);
  const inner = { x: b.x + 5.5, w: b.w - 11 };
  footprint(page, o.x + 78, o.y + 64, 7, mix(pal.parchment, pal.parchmentEdge, 0.55), -30);
  header(c, o, 1, "left");
  const top = o.y + 28.5;
  const t = mTitle(c, clue.title, inner.w, 17.5);
  const bd = mBody(c, clue.body, inner.w, 12);
  const scH = RasterBook.maxSize(crop).h;
  const g0 = Math.max(2, Math.min(5, (o.y + 112 - top - t.height - bd.height - scH) / 4));
  let y = top;
  dTitle(c, t, inner.x, y, inner.w);
  y += t.height + g0 * 0.6;
  dBody(c, bd, inner.x, y, inner.w);
  y += bd.height + g0;
  const sceneTop = o.y + 111 - scH;
  const mid = (y + sceneTop) / 2;
  // A expedição começa: bússola → caminho pontilhado → pegadas até a cena
  compass(page, o.x + 19, mid, 6.4, pal.gold, pal.woodDark, pal.parchment);
  dottedPath(page, { x: o.x + 27, y: mid }, { x: o.x + 40, y: mid - 6 }, { x: o.x + 44, y: sceneTop - 4 }, { x: o.x + 58, y: sceneTop - 1 }, pal.woodDark, 0.42, 1.7);
  footprint(page, o.x + 38, mid + 2.5, 5.4, pal.icon, 125);
  footprint(page, o.x + 50, sceneTop - 6.5, 5.4, pal.icon, 140);
  volcano(page, o.x + 72, mid + 7, 18, 12, mix(pal.parchmentEdge, pal.woodDark, 0.35), pal.accent);
  const sc = scene(c, "pista-1", crop, { x: inner.x - 2, y: sceneTop, w: inner.w + 4, h: scH }, 13, "torn");
  bigLeaf(page, sc.x - 3, sc.y + 4, 10, 20, g, "mid");
  bigLeaf(page, sc.x + sc.w + 3, sc.y + 5, 10, 160, g, "light");
  stone(page, sc.x + 9, sc.y + sc.h + 1.6, 9, 4.4, 14);
  stone(page, sc.x + sc.w - 12, sc.y + sc.h + 1.8, 8, 4, 15);
  edgeFoliage(c, o, b, 16);
  roundedRect(page, o, { r: 3.5, stroke: pal.woodDark, strokeW: 0.6 });
}

// ───────────── Card F — Pista 2: lama + 5 passos de T-Rex ─────────────
function card2(c: Ctx, o: Box, clue: ClueContent, crop: Crop) {
  const { page, pal, g } = c;
  jungleBackground(c, o, 21);
  const b: Box = { x: o.x + 4, y: o.y + 4.5, w: o.w - 8.5, h: o.h - 9 };
  sheet(c, b, 22);
  const inner = { x: b.x + 5.5, w: b.w - 11 };
  header(c, o, 2, "right");
  const top = o.y + 28.5;
  const t = mTitle(c, clue.title, inner.w, 17.5);
  const bd = mBody(c, clue.body, inner.w, 12);
  const chH = clue.challenge ? mChallenge(c, clue.challenge.text, inner.w) : 0;
  const chY = o.y + 119 - chH;
  let y = top;
  dTitle(c, t, inner.x, y, inner.w);
  y += t.height + 2.4;
  dBody(c, bd, inner.x, y, inner.w);
  y += bd.height;
  const scH = RasterBook.maxSize(crop).h;
  const stepsY = chY - 8.5;
  const sceneY = y + Math.max(2, (stepsY - 7 - y - scH) / 2);
  const mud: RGB = [0.45, 0.31, 0.18];
  for (const [dx, dy, rx, ry, sd] of [
    [8, scH + 0.5, 8, 2.8, 1],
    [inner.w - 9, scH + 1, 9, 3.2, 2],
  ] as const)
    drawShape(page, blobPoints(inner.x + dx, sceneY + dy, rx, ry, 23 + sd, 0.2, 10), { fill: mud, opacity: 0.85 });
  const sc = scene(c, "pista-2", crop, { x: inner.x - 2, y: sceneY, w: inner.w + 4, h: scH }, 24, "torn");
  bigLeaf(page, sc.x - 3, sc.y + 2, 9, 30, g, "light");
  bigLeaf(page, sc.x + sc.w + 3, sc.y + 2, 9, 150, g, "mid");
  // 5 passos de T-Rex (desafio)
  for (let i = 0; i < 5; i++) footprint(page, inner.x + 10 + i * ((inner.w - 20) / 4), stepsY + (i % 2 ? -1.6 : 1.6), 5.6, i % 2 ? pal.wood : pal.icon, 90);
  if (clue.challenge) challenge(c, clue.challenge.label, clue.challenge.text, { x: inner.x, y: chY, w: inner.w, h: 0 }, 25);
  edgeFoliage(c, o, b, 26);
  roundedRect(page, o, { r: 3.5, stroke: pal.woodDark, strokeW: 0.6 });
}

// ───────────── Card G — Pista 3: silêncio, descanso (lua e estrelas) ─────────────
function card3(c: Ctx, o: Box, clue: ClueContent, crop: Crop) {
  const { page, pal, g } = c;
  jungleBackground(c, o, 31);
  const b: Box = { x: o.x + 4.5, y: o.y + 4, w: o.w - 9, h: o.h - 8.5 };
  sheet(c, b, 32);
  const inner = { x: b.x + 5.5, w: b.w - 11 };
  header(c, o, 3, "left");
  const top = o.y + 28.5;
  const t = mTitle(c, clue.title, inner.w, 17.5);
  const bd = mBody(c, clue.body, inner.w, 12);
  const scH = RasterBook.maxSize(crop).h;
  let y = top;
  dTitle(c, t, inner.x, y, inner.w);
  y += t.height + 2.4;
  dBody(c, bd, inner.x, y, inner.w);
  y += bd.height + 3;
  const sceneTop = o.y + 112 - scH;
  // Lua crescente e estrelas: o dinossauro foi descansar
  const mx = o.x + 66;
  const my = (y + sceneTop) / 2;
  circle(page, mx, my, 6.2, { fill: pal.gold });
  circle(page, mx + 2.6, my - 1.6, 5.4, { fill: pal.parchment });
  for (const [dx, dy, s2] of [
    [-14, -3, 1.8],
    [-8, 4, 1.2],
    [9, 4, 1.5],
    [-22, 3, 1.1],
    [12, -5, 1.0],
  ] as const)
    sparkle(page, mx + dx, my + dy, s2, pal.gold);
  // pegadas que se afastam devagar (cada vez mais claras)
  for (let i = 0; i < 3; i++) footprint(page, o.x + 16 + i * 8, my + 2 - i * 2.5, 5, mix(pal.icon, pal.parchment, i * 0.28), 70);
  const sc = scene(c, "pista-3", crop, { x: inner.x - 2, y: sceneTop, w: inner.w + 4, h: scH }, 33, "torn");
  bigLeaf(page, sc.x - 3, sc.y + sc.h - 4, 11, -10, g, "light");
  bigLeaf(page, sc.x + sc.w + 3, sc.y + 6, 10, 165, g, "mid");
  stone(page, sc.x + sc.w - 8, sc.y + sc.h + 1.6, 9, 4.2, 34);
  egg(page, sc.x + 10, sc.y + sc.h + 1.2, 5, 35, undefined, undefined, 10);
  edgeFoliage(c, o, b, 36);
  roundedRect(page, o, { r: 3.5, stroke: pal.woodDark, strokeW: 0.6 });
}

// ───────────── Card H — Pista 4: o rugido (ondas sonoras) + ovo mais perto ─────────────
function card4(c: Ctx, o: Box, clue: ClueContent, crop: Crop) {
  const { page, pal, g } = c;
  jungleBackground(c, o, 41);
  const b: Box = { x: o.x + 4, y: o.y + 4.5, w: o.w - 8.5, h: o.h - 9 };
  sheet(c, b, 42);
  const inner = { x: b.x + 5.5, w: b.w - 11 };
  header(c, o, 4, "right");
  const top = o.y + 28.5;
  const t = mTitle(c, clue.title, inner.w, 17.5);
  const bd = mBody(c, clue.body, inner.w, 12);
  const chH = clue.challenge ? mChallenge(c, clue.challenge.text, inner.w) : 0;
  const chY = o.y + 119 - chH;
  let y = top;
  dTitle(c, t, inner.x, y, inner.w);
  y += t.height + 2.4;
  dBody(c, bd, inner.x, y, inner.w);
  y += bd.height;
  const scH = RasterBook.maxSize(crop).h;
  const sceneY = y + Math.max(3, (chY - 6 - y - scH) / 2);
  const sc = scene(c, "pista-4", crop, { x: inner.x + 2, y: sceneY, w: inner.w - 4, h: scH }, 43, "torn");
  // ondas do rugido saindo da cena
  for (let i = 0; i < 3; i++) {
    const r = 3 + i * 2.4;
    for (const side of [-1, 1]) {
      const cx = side < 0 ? sc.x - 1 : sc.x + sc.w + 1;
      const cy = sc.y + sc.h * 0.45;
      const p0 = pt(page, cx, cy - r);
      page.drawSvgPath(`M 0 0 A ${mm(r)} ${mm(r)} 0 0 ${side > 0 ? 1 : 0} 0 ${mm(2 * r)}`, {
        x: p0.x,
        y: p0.y,
        borderColor: color(pal.accent),
        borderWidth: mm(0.55),
        borderOpacity: 1 - i * 0.25,
      });
    }
  }
  egg(page, inner.x + inner.w - 2, sc.y - 3, 6.5, 44, undefined, undefined, 12);
  bigLeaf(page, sc.x + 3, sc.y + sc.h + 1, 9, -50, g, "light");
  stone(page, sc.x + sc.w - 7, sc.y + sc.h + 1.4, 8, 3.6, 45);
  if (clue.challenge) challenge(c, clue.challenge.label, clue.challenge.text, { x: inner.x, y: chY, w: inner.w, h: 0 }, 46);
  edgeFoliage(c, o, b, 47);
  roundedRect(page, o, { r: 3.5, stroke: pal.woodDark, strokeW: 0.6 });
}

type CardFn = (c: Ctx, o: Box, clue: ClueContent, crop: Crop) => void;
const CARDS: CardFn[] = [card1, card2, card3, card4, card5, card6, card7, card8];

/** Página A4 com 4 pistas (first = 1 ou 5). */
export function cluesPageJurassic(doc: PDFDocument, kit: EditorialKit, first: 1 | 5, fonts: Fonts, art: RasterBook) {
  const page = doc.addPage([mm(A4_MM.w), mm(A4_MM.h)]);
  const idx = doc.getPageCount() - 1;
  const c: Ctx = { page, idx, pal: kit.palette, g: GREENS, fonts, art };
  const gap = 6;
  const x0 = (A4_MM.w - (2 * CARD.w + gap)) / 2;
  const y0 = (A4_MM.h - (2 * CARD.h + gap)) / 2 - 2;
  for (let i = 0; i < 4; i++) {
    const n = first + i;
    const o: Box = { x: x0 + (i % 2) * (CARD.w + gap), y: y0 + Math.floor(i / 2) * (CARD.h + gap), w: CARD.w, h: CARD.h };
    const clue = kit.clues[n - 1];
    CARDS[n - 1](c, o, clue, clue.art);
    cropMarks(page, o);
  }
  const label = `Pistas ${first} a ${first + 3}  ·  recorte pelas marcas dos cantos`;
  const w = fonts.bold.widthOfTextAtSize(label, 7.5) / (72 / 25.4);
  const p = pt(page, (A4_MM.w - w) / 2, A4_MM.h - 6);
  page.drawText(label, { x: p.x, y: p.y, size: 7.5, font: fonts.bold, color: color([0.55, 0.55, 0.55]) });
  return page;
}

// ───────────── páginas inteiras: introdução e certificado ─────────────
const PAGE_BAND: Box = { x: 5, y: 5, w: A4_MM.w - 10, h: A4_MM.h - 10 };
const PAGE_SHEET: Box = { x: 12, y: 12, w: A4_MM.w - 24, h: A4_MM.h - 24 };

function newPage(doc: PDFDocument, kit: EditorialKit, fonts: Fonts, art: RasterBook, seed: number): Ctx {
  const page = doc.addPage([mm(A4_MM.w), mm(A4_MM.h)]);
  const c: Ctx = { page, idx: doc.getPageCount() - 1, pal: kit.palette, g: GREENS, fonts, art };
  jungleBackground(c, PAGE_BAND, seed);
  sheet(c, PAGE_SHEET, seed + 1);
  return c;
}

function pageFoliage(c: Ctx, seed: number) {
  const { page, g } = c;
  const s = PAGE_SHEET;
  vine(page, s.x + 1, s.y + 40, s.y + s.h - 40, g, seed, 1);
  vine(page, s.x + s.w - 1, s.y + 46, s.y + s.h - 46, g, seed + 3, -1);
  for (const [x, y, a, f] of [
    [PAGE_BAND.x + 3, PAGE_BAND.y + PAGE_BAND.h - 3, -58, 1],
    [PAGE_BAND.x + PAGE_BAND.w - 3, PAGE_BAND.y + PAGE_BAND.h - 3, -122, -1],
    [PAGE_BAND.x + 3, PAGE_BAND.y + 3, 58, -1],
    [PAGE_BAND.x + PAGE_BAND.w - 3, PAGE_BAND.y + 3, 122, 1],
  ] as const)
    fern(page, x, y, 30, a, g, seed + x, f);
}

/** Medalhão circular com moldura de madeira (ilustração ≥150 DPI). */
function medallion(c: Ctx, slot: string, crop: Crop, cx: number, cy: number, maxD: number) {
  const { page, pal, art, idx } = c;
  const m = RasterBook.maxSize(crop);
  const d = Math.min(m.w, m.h, maxD);
  circle(page, cx + 0.5, cy + 0.8, d / 2 + 2, { fill: shade(pal.woodDark, 0.6), opacity: 0.35 });
  circle(page, cx, cy, d / 2 + 2, { fill: pal.wood, stroke: pal.woodDark, strokeW: 0.5 });
  art.place(page, idx, slot, crop, { x: cx - d / 2, y: cy - d / 2, w: d, h: d }, { shape: "circle" });
  circle(page, cx, cy, d / 2, { stroke: pal.gold, strokeW: 0.6 });
  return d;
}

function signWithRopes(c: Ctx, sign: Box, lines: string[], maxPt: number) {
  const { page, pal, fonts } = c;
  for (const fx of [0.18, 0.82]) {
    page.drawLine({ start: pt(page, sign.x + sign.w * fx, PAGE_SHEET.y - 1), end: pt(page, sign.x + sign.w * fx, sign.y + 2), thickness: mm(0.8), color: color([0.55, 0.42, 0.25]) });
  }
  plank(page, sign, pal.wood, pal.woodDark);
  const box = { x: sign.x + 8, y: sign.y + 4, w: sign.w - 16, h: sign.h - 8 };
  let size = maxPt;
  const widest = () => Math.max(...lines.map((l) => fonts.display.widthOfTextAtSize(l, size))) / (72 / 25.4);
  while (size > 10 && (widest() > box.w || (size * 1.02 * lines.length) / (72 / 25.4) > box.h)) size -= 0.5;
  const lh = (size * 1.02) / (72 / 25.4);
  drawBlock(page, fonts.display, { lines, size, lineHeight: lh, height: lh * lines.length }, box.x, box.y + (box.h - lh * lines.length) / 2, box.w, pal.woodText, {
    shadow: pal.woodDark,
  });
}

export function introPageJurassic(doc: PDFDocument, kit: EditorialKit, childName: string, fonts: Fonts, art: RasterBook) {
  const c = newPage(doc, kit, fonts, art, 101);
  const { page, pal, g } = c;
  // marcas d'água de pegadas
  for (const [x, y, r] of [
    [40, 70, 60],
    [172, 64, -60],
    [30, 205, 30],
  ] as const)
    footprint(page, x, y, 9, mix(pal.parchment, pal.parchmentEdge, 0.5), r);
  signWithRopes(c, { x: 35, y: 20, w: 140, h: 40 }, kit.intro.titleLines, 36);
  sparkle(page, 26, 30, 3, pal.gold);
  sparkle(page, 184, 34, 3.4, pal.gold);
  sparkle(page, 32, 50, 1.8, pal.gold);

  // Olá, {nome}!
  for (let i = 0; i < 3; i++) {
    footprint(page, 22 + i * 7, 79 + (i % 2 ? -2.3 : 2.3), 4.4, mix(pal.parchment, pal.icon, 0.35), -90);
    footprint(page, 188 - i * 7, 79 + (i % 2 ? -2.3 : 2.3), 4.4, mix(pal.parchment, pal.icon, 0.35), 90);
  }
  drawFitted(page, fonts.display, `Olá, ${childName}!`, { x: 44, y: 66, w: 122, h: 26 }, pal.accent, {
    max: 50,
    min: 22,
    leading: 1.0,
    maxLines: 2,
    shadow: pal.accentDark,
    shadowOffset: 0.7,
  });

  // Carta da missão (pergaminho interno de borda rasgada)
  const card: Box = { x: 30, y: 100, w: 150, h: 98 };
  drawShape(page, organicPoints({ x: card.x + 1, y: card.y + 1.5, w: card.w, h: card.h }, 111, 0.8, 4), { fill: shade(pal.parchmentEdge, 0.6), opacity: 0.3 });
  drawShape(page, organicPoints(card, 111, 0.8, 4), { fill: mix(pal.parchment, [1, 1, 1], 0.35), stroke: pal.wood, strokeW: 0.6 });
  const inner = { x: card.x + 14, w: card.w - 28 };
  const paras = kit.intro.paragraphs;
  const closingText = paras[paras.length - 1];
  for (let k = 1.4; k >= 0.7; k -= 0.02) {
    const head = fit(fonts.display, kit.intro.headline, inner.w, 30, { max: 19 * k, min: 12, leading: 1.08, maxLines: 2 });
    const blocks = paras.slice(0, -1).map((p) => fit(fonts.body, p, inner.w, 50, { max: 13.5 * k, min: 9.5, leading: 1.3 }));
    const closing = fit(fonts.display, closingText, inner.w, 20, { max: 18 * k, min: 11, leading: 1.1, maxLines: 1 });
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
  // Personagens “espiando” nos cantos da carta
  medallion(c, "elenco-1", cast[0], card.x - 1, card.y + 4, 30);
  medallion(c, "elenco-3", cast[2], card.x + card.w + 1, card.y + 8, 26);

  // Mapa do tesouro na base: bússola → trilha → personagens → X no ovo
  const mapY = 240;
  volcano(page, 128, 228, 24, 16, mix(pal.parchmentEdge, pal.woodDark, 0.3), pal.accent);
  volcano(page, 146, 230, 16, 11, mix(pal.parchmentEdge, pal.woodDark, 0.45), pal.accent);
  compass(page, 36, mapY - 6, 11, pal.gold, pal.woodDark, pal.parchment);
  dottedPath(page, { x: 49, y: mapY }, { x: 75, y: mapY + 16 }, { x: 125, y: mapY + 18 }, { x: 160, y: mapY + 4 }, pal.woodDark, 0.5, 2);
  footprint(page, 60, mapY + 7, 6, pal.icon, 120);
  footprint(page, 135, mapY + 14, 6, pal.icon, 70);
  medallion(c, "elenco-2", cast[1], 98, mapY + 16, 26);
  medallion(c, "elenco-4", cast[3], 72, mapY + 26, 22);
  medallion(c, "elenco-5", cast[4], 170, mapY - 4, 26);
  xMark(page, 184, mapY + 9, 2.2, pal.alert);
  stone(page, 150, mapY + 24, 12, 5.5, 121);
  stone(page, 160, mapY + 26, 7, 3.5, 122, [0.6, 0.55, 0.48]);
  egg(page, 118, mapY + 26, 7, 123, undefined, undefined, -15);
  bigLeaf(page, 24, 262, 16, -30, g, "mid");
  bigLeaf(page, 186, 262, 16, 210, g, "light");
  pageFoliage(c, 131);
  return page;
}

/** Ramo de louros vetorial: haste curva com pares de folhas, abrindo para cima. side -1 = esquerda. */
function laurel(c: Ctx, cx: number, cy: number, h: number, side: 1 | -1) {
  const { page, pal } = c;
  const n = 7;
  let prev = { x: cx, y: cy };
  for (let i = 1; i <= n; i++) {
    const t = i / n;
    // haste: arco que sobe e se afasta do nome
    const x = cx + side * Math.sin(t * 1.2) * h * 0.45;
    const y = cy - t * h;
    page.drawLine({ start: pt(page, prev.x, prev.y), end: pt(page, x, y), thickness: mm(0.6), color: color(GOLD_DEEP) });
    const dir = (Math.atan2(y - prev.y, x - prev.x) * 180) / Math.PI;
    const len = 6.2 - t * 1.6;
    bladeLeaf(page, x, y, len, dir - side * 55, len * 0.42, pal.gold, GOLD_DEEP);
    bladeLeaf(page, x, y, len, dir + side * 55 + 180 * 0, len * 0.42, shade(pal.gold, 0.86), GOLD_DEEP);
    prev = { x, y };
  }
  bladeLeaf(page, prev.x, prev.y, 5, -90 + side * 15, 2.2, pal.gold, GOLD_DEEP);
}

export function certificatePageJurassic(doc: PDFDocument, kit: EditorialKit, childName: string, fonts: Fonts, art: RasterBook) {
  const c = newPage(doc, kit, fonts, art, 201);
  const { page, pal } = c;
  const cert = kit.certificate;
  roundedRect(page, { x: 19, y: 19, w: A4_MM.w - 38, h: A4_MM.h - 38 }, { r: 4, stroke: pal.gold, strokeW: 0.9 });
  roundedRect(page, { x: 21.5, y: 21.5, w: A4_MM.w - 43, h: A4_MM.h - 43 }, { r: 3, stroke: pal.gold, strokeW: 0.3 });
  beginClip(page, PAGE_SHEET, "rect", 3);
  sunburst(page, 105, 100, 120, 28, pal.gold, 0.08);
  endClip(page);

  drawFitted(page, fonts.display, cert.title, { x: 25, y: 27, w: 160, h: 30 }, pal.gold, { max: 64, min: 30, maxLines: 1, shadow: pal.woodDark, shadowOffset: 0.9 });
  const sign: Box = { x: 32, y: 58, w: 146, h: 17 };
  plank(page, sign, pal.wood, pal.woodDark);
  drawFitted(page, fonts.display, cert.subtitle, { x: sign.x + 8, y: sign.y + 2, w: sign.w - 16, h: sign.h - 3 }, pal.woodText, {
    max: 19,
    min: 11,
    maxLines: 1,
    shadow: pal.woodDark,
  });

  // Medalha central + personagens
  const rowY = 105;
  medal(c, 105, rowY - 3);
  medallion(c, "certificado-1", cert.art[0], 50, rowY, 30);
  if (cert.art[1]) medallion(c, "certificado-2", cert.art[1], 160, rowY, 26);
  for (const [x, y, s2] of [
    [78, 86, 2.4],
    [132, 88, 2.8],
    [84, 122, 1.8],
    [128, 120, 2],
  ] as const)
    sparkle(page, x, y, s2, pal.gold);

  // Nome em área própria, com louros
  laurel(c, 44, 172, 26, -1);
  laurel(c, 166, 172, 26, 1);
  drawFitted(page, fonts.display, childName, { x: 50, y: 142, w: 110, h: 30 }, pal.accent, {
    max: 56,
    min: 22,
    leading: 1.0,
    maxLines: 2,
    shadow: pal.accentDark,
    shadowOffset: 0.7,
  });
  page.drawLine({ start: pt(page, 48, 176), end: pt(page, 162, 176), thickness: mm(0.6), color: color(pal.gold) });
  drawFitted(page, fonts.bold, cert.text, { x: 32, y: 183, w: 146, h: 30 }, pal.ink, { max: 18, min: 11, leading: 1.28, maxLines: 3 });

  // Data e assinatura
  const lineY = 236;
  for (const [label, x, w] of [
    [cert.dateLabel, 30, 64],
    [cert.signatureLabel, 106, 76],
  ] as const) {
    const p = pt(page, x, lineY);
    page.drawText(label, { x: p.x, y: p.y, size: 10, font: fonts.bold, color: color(pal.ink) });
    page.drawLine({ start: pt(page, x, lineY + 10), end: pt(page, x + w, lineY + 10), thickness: mm(0.35), color: color(pal.ink) });
  }
  for (let i = 0; i < 5; i++) footprint(page, 70 + i * 17, 262 + (i % 2 ? -2 : 2), 5.5, mix(pal.parchment, pal.icon, 0.3), 90);
  stone(page, 44, 266, 11, 5, 211);
  egg(page, 54, 264, 7, 212, undefined, undefined, 12);
  stone(page, 166, 266, 11, 5, 213);
  pageFoliage(c, 221);
  return page;
}

function medal(c: Ctx, cx: number, cy: number) {
  const { page, pal } = c;
  for (const dir of [-1, 1]) {
    const p = pt(page, cx + dir * 5, cy + 9);
    page.drawSvgPath(`M 0 0 L ${mm(8)} 0 L ${mm(8)} ${mm(19)} L ${mm(4)} ${mm(15.5)} L 0 ${mm(19)} Z`, {
      x: p.x - mm(4),
      y: p.y,
      color: color(pal.alert),
      rotate: degrees(dir * -14),
    });
  }
  circle(page, cx + 0.5, cy + 0.8, 17, { fill: shade(pal.gold, 0.5), opacity: 0.35 });
  circle(page, cx, cy, 17, { fill: pal.gold, stroke: GOLD_DEEP, strokeW: 0.8 });
  for (let i = 0; i < 28; i++) {
    const a = (i / 28) * Math.PI * 2;
    circle(page, cx + Math.cos(a) * 15.3, cy + Math.sin(a) * 15.3, 0.85, { fill: shade(pal.gold, 0.78) });
  }
  circle(page, cx, cy, 12.6, { fill: pal.badge, stroke: GOLD_DEEP, strokeW: 0.6 });
  footprint(page, cx, cy, 17, pal.icon);
}
