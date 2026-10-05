/** Composição editorial das 4 páginas. Todas as medidas em mm (origem topo-esquerda). */
import type { PDFDocument, PDFFont, PDFPage } from "pdf-lib";
import type { ClueContent, EditorialKit, Palette } from "../../editorial/types";
import { CLUE_COUNT } from "../../themes";
import { RasterBook } from "./raster";
import { circle, cropMarks, footprint, leafCluster, medal, plank, roundedRect } from "./shapes";
import { drawBlock, drawFitted, fit } from "./text";
import { A4_MM, type Box, mix, mm, pt, shade, color } from "./units";

export interface Fonts {
  display: PDFFont; // Baloo 2 ExtraBold
  body: PDFFont; // Nunito SemiBold
  bold: PDFFont; // Nunito Bold
}

function newPage(doc: PDFDocument, pal: Palette): PDFPage {
  const page = doc.addPage([mm(A4_MM.w), mm(A4_MM.h)]);
  page.drawRectangle({ x: 0, y: 0, width: page.getWidth(), height: page.getHeight(), color: color(pal.page) });
  return page;
}

/** Moldura dupla da página (madeira + filete dourado) com folhagem nos cantos. */
function pageFrame(page: PDFPage, pal: Palette) {
  roundedRect(page, { x: 7, y: 7, w: A4_MM.w - 14, h: A4_MM.h - 14 }, { r: 6, stroke: pal.wood, strokeW: 1.8 });
  roundedRect(page, { x: 10, y: 10, w: A4_MM.w - 20, h: A4_MM.h - 20 }, { r: 4.5, stroke: pal.gold, strokeW: 0.5 });
  leafCluster(page, 8, 8, 1, "tl", pal.leaf, pal.leafDark);
  leafCluster(page, A4_MM.w - 8, 8, 1, "tr", pal.leaf, pal.leafDark);
  leafCluster(page, 8, A4_MM.h - 8, 1, "bl", pal.leaf, pal.leafDark);
  leafCluster(page, A4_MM.w - 8, A4_MM.h - 8, 1, "br", pal.leaf, pal.leafDark);
}

function trail(page: PDFPage, x: number, y: number, n: number, step: number, size: number, c: [number, number, number], dir = 1) {
  for (let i = 0; i < n; i++) {
    footprint(page, x + i * step * dir, y + (i % 2 ? -size * 0.55 : size * 0.55), size, c, -90 * dir + (i % 2 ? 8 : -8));
  }
}

/** Linhas fixas (quebra definida pelo conteúdo), mesmo tamanho para todas, centralizadas na caixa. */
function drawLines(page: PDFPage, font: PDFFont, lines: string[], box: Box, c: [number, number, number], shadow: [number, number, number], max: number) {
  let size = max;
  const widest = () => Math.max(...lines.map((l) => font.widthOfTextAtSize(l, size))) / (72 / 25.4);
  while (size > 8 && (widest() > box.w || (size * 1.02 * lines.length) / (72 / 25.4) > box.h)) size -= 0.5;
  const lh = (size * 1.02) / (72 / 25.4);
  const block = { lines, size, lineHeight: lh, height: lh * lines.length };
  drawBlock(page, font, block, box.x, box.y + (box.h - block.height) / 2, box.w, c, { shadow });
}

// ───────────────────────────── Introdução ─────────────────────────────
export function introPage(doc: PDFDocument, kit: EditorialKit, childName: string, fonts: Fonts, art: RasterBook) {
  const pal = kit.palette;
  const page = newPage(doc, pal);
  const idx = doc.getPageCount() - 1;
  pageFrame(page, pal);

  // Título da missão numa placa
  const sign: Box = { x: 30, y: 18, w: 150, h: 42 };
  plank(page, sign, pal.wood, pal.woodDark);
  drawLines(page, fonts.display, kit.intro.titleLines, { x: sign.x + 8, y: sign.y + 4, w: sign.w - 16, h: sign.h - 8 }, pal.woodText, pal.woodDark, 34);

  // Olá, {nome}!
  trail(page, 22, 76, 3, 7, 4.2, mix(pal.page, pal.icon, 0.28));
  trail(page, 188, 76, 3, 7, 4.2, mix(pal.page, pal.icon, 0.28), -1);
  drawFitted(page, fonts.display, `Olá, ${childName}!`, { x: 44, y: 64, w: 122, h: 24 }, pal.accent, {
    max: 46,
    min: 22,
    leading: 1.0,
    maxLines: 2,
    shadow: pal.accentDark,
    shadowOffset: 0.55,
  });

  // Carta da missão
  const card: Box = { x: 22, y: 94, w: 166, h: 120 };
  roundedRect(page, { x: card.x + 1, y: card.y + 1.4, w: card.w, h: card.h }, { r: 5, fill: shade(pal.parchmentEdge, 0.6), opacity: 0.3 });
  roundedRect(page, card, { r: 5, fill: pal.parchment, stroke: pal.parchmentEdge, strokeW: 0.8 });
  roundedRect(page, { x: card.x + 2.5, y: card.y + 2.5, w: card.w - 5, h: card.h - 5 }, { r: 3.5, stroke: pal.parchmentEdge, strokeW: 0.3, dash: [2, 2] });
  const inner = { x: card.x + 12, w: card.w - 24 };
  const paras = kit.intro.paragraphs;
  const last = paras[paras.length - 1];
  const body = paras.slice(0, -1);
  // Ajuste conjunto: reduz tudo proporcionalmente até caber.
  for (let k = 1.5; k >= 0.7; k -= 0.02) {
    const head = fit(fonts.display, kit.intro.headline, inner.w, 34, { max: 20 * k, min: 12, leading: 1.08, maxLines: 2 });
    const blocks = body.map((p) => fit(fonts.body, p, inner.w, 60, { max: 14 * k, min: 9.5, leading: 1.3 }));
    const closing = fit(fonts.display, last, inner.w, 20, { max: 19 * k, min: 11, leading: 1.1, maxLines: 1 });
    const gap = 5 * k;
    const total = head.height + gap * 1.4 + blocks.reduce((a, b) => a + b.height + gap, 0) + closing.height;
    if (total <= card.h - 22 || k <= 0.71) {
      let y = card.y + (card.h - total) / 2;
      drawBlock(page, fonts.display, head, inner.x, y, inner.w, pal.accentDark);
      y += head.height + gap * 1.4;
      for (const b of blocks) {
        drawBlock(page, fonts.body, b, inner.x, y, inner.w, pal.ink);
        y += b.height + gap;
      }
      drawBlock(page, fonts.display, closing, inner.x, y, inner.w, pal.accent, { shadow: pal.accentDark, shadowOffset: 0.3 });
      break;
    }
  }

  // Elenco da expedição (medalhões com as ilustrações do tema, ≥150 DPI)
  const cast = kit.intro.cast;
  const slotW = 166 / cast.length;
  const cy = 247;
  cast.forEach((crop, i) => {
    const max = RasterBook.maxSize(crop);
    const d = Math.min(max.w, max.h, slotW - 4);
    const cx = 22 + slotW * (i + 0.5);
    circle(page, cx + 0.4, cy + 0.7, d / 2 + 1.6, { fill: shade(pal.woodDark, 0.7), opacity: 0.3 });
    circle(page, cx, cy, d / 2 + 1.6, { fill: pal.wood, stroke: pal.woodDark, strokeW: 0.4 });
    art.place(page, idx, `elenco-${i + 1}`, crop, { x: cx - d / 2, y: cy - d / 2, w: d, h: d }, { shape: "circle" });
    circle(page, cx, cy, d / 2, { stroke: pal.gold, strokeW: 0.5 });
  });

  const brand = "O Tesouro do Dia das Crianças";
  const bw = fonts.bold.widthOfTextAtSize(brand, 8) / (72 / 25.4);
  const bp = pt(page, (A4_MM.w - bw) / 2, 279);
  page.drawText(brand, { x: bp.x, y: bp.y, size: 8, font: fonts.bold, color: color(mix(pal.page, pal.ink, 0.55)) });
  return page;
}

// ───────────────────────────── Pistas ─────────────────────────────
export const CARD = { w: 92, h: 130 };

function clueCard(page: PDFPage, idx: number, kit: EditorialKit, clue: ClueContent, n: number, origin: { x: number; y: number }, fonts: Fonts, art: RasterBook) {
  const pal = kit.palette;
  const o = origin;
  const card: Box = { x: o.x, y: o.y, w: CARD.w, h: CARD.h };
  roundedRect(page, card, { r: 4, fill: pal.parchment, stroke: pal.wood, strokeW: 1.2 });
  roundedRect(page, { x: o.x + 2.2, y: o.y + 2.2, w: CARD.w - 4.4, h: CARD.h - 4.4 }, { r: 2.6, stroke: pal.parchmentEdge, strokeW: 0.35 });
  leafCluster(page, o.x + 1.5, o.y + CARD.h - 1.5, 0.45, "bl", pal.leaf, pal.leafDark);
  leafCluster(page, o.x + CARD.w - 1.5, o.y + CARD.h - 1.5, 0.45, "br", pal.leaf, pal.leafDark);

  // Selo PISTA X DE N
  const sign: Box = { x: o.x + 6, y: o.y + 5.5, w: 54, h: 19 };
  plank(page, sign, pal.wood, pal.woodDark);
  const label = `PISTA ${n}`;
  const sub = `DE ${CLUE_COUNT}`;
  drawFitted(page, fonts.display, label, { x: sign.x + 4, y: sign.y + 1.6, w: sign.w - 8, h: 10 }, pal.woodText, {
    max: 21,
    min: 14,
    leading: 1.0,
    maxLines: 1,
    shadow: pal.woodDark,
    shadowOffset: 0.35,
  });
  drawFitted(page, fonts.display, sub, { x: sign.x + 4, y: sign.y + 11.4, w: sign.w - 8, h: 6 }, pal.badge, { max: 11, min: 8, leading: 1.0, maxLines: 1, shadow: pal.woodDark, shadowOffset: 0.25 });
  // Selo redondo com ícone
  const bx = o.x + CARD.w - 17;
  const by = o.y + 15;
  circle(page, bx + 0.3, by + 0.5, 9.4, { fill: shade(pal.badgeEdge, 0.6), opacity: 0.3 });
  circle(page, bx, by, 9.4, { fill: pal.badge, stroke: pal.badgeEdge, strokeW: 0.8 });
  circle(page, bx, by, 7.8, { stroke: pal.badgeEdge, strokeW: 0.25 });
  footprint(page, bx, by, 10.5, pal.icon);

  // Fluxo vertical: título → texto → ilustração → desafio.
  // A ilustração tem tamanho máximo fixo (DPI); o texto cresce até ocupar o card e a sobra vira respiro.
  const inner = { x: o.x + 6.5, w: CARD.w - 13 };
  const top = o.y + 28;
  const bottom = o.y + CARD.h - 7;
  const final = clue.titleStyle === "final";
  // Tamanho da ilustração: limitado pelo DPI alvo, pela largura útil e por uma altura máxima no card.
  const max = RasterBook.maxSize(clue.art);
  const ART_MAX_H = 34;
  const artW = Math.min(max.w, inner.w, (ART_MAX_H * clue.art.w) / clue.art.h);
  const artH = (clue.art.h / clue.art.w) * artW;
  for (let k = 1.45; k >= 0.7; k -= 0.025) {
    const title = fit(fonts.display, clue.title, inner.w, 22, { max: (final ? 17 : 16) * k, min: 10, leading: 1.02, maxLines: 2 });
    const body = fit(fonts.body, clue.body, inner.w, 46, { max: 10.5 * k, min: 8, leading: 1.25 });
    const ch = clue.challenge ? fit(fonts.bold, clue.challenge.text, inner.w - 6, 32, { max: 9.4 * k, min: 7.5, leading: 1.22 }) : null;
    const chH = ch ? ch.height + 10 : 0;
    const used = title.height + body.height + artH + chH;
    const slots = ch ? 3 : 2;
    const free = bottom - top - used;
    const minGap = 3;
    if (free >= slots * minGap || k <= 0.71) {
      // Limita o crescimento do texto: corpo até 12.5pt, título até 18pt.
      if (body.size > 12.5 || title.size > 18) continue;
      const g = Math.min(free / slots, 9);
      let y = top + (free - g * slots) / 2;
      drawBlock(page, fonts.display, title, inner.x, y, inner.w, final ? pal.alert : pal.ink);
      y += title.height + g * 0.7;
      drawBlock(page, fonts.body, body, inner.x, y, inner.w, pal.ink);
      y += body.height + g * 1.15;
      const placed = art.place(page, idx, `pista-${n}`, clue.art, { x: inner.x, y, w: inner.w, h: artH }, { radius: 2.4 });
      roundedRect(page, placed, { r: 2.4, stroke: pal.wood, strokeW: 0.6 });
      y += artH + g * 1.15;
      if (ch && clue.challenge) {
        const cb: Box = { x: inner.x, y: y + 1.5, w: inner.w, h: chH };
        roundedRect(page, cb, { r: 2.5, fill: mix(pal.parchment, pal.parchmentEdge, 0.35), stroke: pal.parchmentEdge, strokeW: 0.4 });
        const lab = clue.challenge.label;
        const labSize = 8.8;
        const lw2 = fonts.display.widthOfTextAtSize(lab, labSize) / (72 / 25.4) + 8;
        const pill: Box = { x: cb.x + (cb.w - lw2) / 2, y: cb.y - 3, w: lw2, h: 6.6 };
        roundedRect(page, pill, { r: 3.3, fill: pal.wood, stroke: pal.woodDark, strokeW: 0.4 });
        drawFitted(page, fonts.display, lab, { x: pill.x, y: pill.y + 0.5, w: pill.w, h: pill.h - 0.6 }, pal.woodText, { max: labSize, min: 7, maxLines: 1 });
        drawBlock(page, fonts.bold, ch, cb.x + 3, cb.y + 5, cb.w - 6, pal.ink);
      }
      break;
    }
  }
}

export function cluesPage(doc: PDFDocument, kit: EditorialKit, first: number, fonts: Fonts, art: RasterBook) {
  const pal = kit.palette;
  const page = doc.addPage([mm(A4_MM.w), mm(A4_MM.h)]);
  const idx = doc.getPageCount() - 1;
  const gap = 6;
  const x0 = (A4_MM.w - (2 * CARD.w + gap)) / 2;
  const y0 = (A4_MM.h - (2 * CARD.h + gap)) / 2 - 2;
  for (let i = 0; i < 4; i++) {
    const n = first + i;
    const origin = { x: x0 + (i % 2) * (CARD.w + gap), y: y0 + Math.floor(i / 2) * (CARD.h + gap) };
    clueCard(page, idx, kit, kit.clues[n - 1], n, origin, fonts, art);
    cropMarks(page, { x: origin.x, y: origin.y, w: CARD.w, h: CARD.h });
  }
  const label = `Pistas ${first} a ${first + 3}  ·  recorte pelas marcas dos cantos`;
  const w = fonts.bold.widthOfTextAtSize(label, 7.5) / (72 / 25.4);
  const p = pt(page, (A4_MM.w - w) / 2, A4_MM.h - 6);
  page.drawText(label, { x: p.x, y: p.y, size: 7.5, font: fonts.bold, color: color(mix([1, 1, 1], pal.ink, 0.45)) });
  return page;
}

// ───────────────────────────── Certificado ─────────────────────────────
export function certificatePage(doc: PDFDocument, kit: EditorialKit, childName: string, fonts: Fonts, art: RasterBook) {
  const pal = kit.palette;
  const c = kit.certificate;
  const page = newPage(doc, pal);
  const idx = doc.getPageCount() - 1;
  pageFrame(page, pal);
  roundedRect(page, { x: 14, y: 14, w: A4_MM.w - 28, h: A4_MM.h - 28 }, { r: 3.5, fill: pal.parchment, stroke: pal.parchmentEdge, strokeW: 0.4 });

  drawFitted(page, fonts.display, c.title, { x: 25, y: 22, w: 160, h: 30 }, pal.gold, { max: 62, min: 30, maxLines: 1, shadow: pal.woodDark, shadowOffset: 0.8 });
  const sign: Box = { x: 32, y: 54, w: 146, h: 17 };
  plank(page, sign, pal.wood, pal.woodDark);
  drawFitted(page, fonts.display, c.subtitle, { x: sign.x + 8, y: sign.y + 2, w: sign.w - 16, h: sign.h - 3 }, pal.woodText, {
    max: 19,
    min: 11,
    maxLines: 1,
    shadow: pal.woodDark,
  });

  // Linha de medalhões: personagem · medalha · personagem (ilustrações ≥150 DPI)
  const rowY = 104;
  medal(page, 105, rowY - 4, 17, pal.gold, pal.alert, pal.icon, pal.badge);
  c.art.forEach((crop, i) => {
    const m = RasterBook.maxSize(crop);
    const d = Math.min(m.w, m.h, 34);
    const cx = i === 0 ? 50 : 160;
    circle(page, cx + 0.4, rowY + 0.7, d / 2 + 1.8, { fill: shade(pal.woodDark, 0.7), opacity: 0.3 });
    circle(page, cx, rowY, d / 2 + 1.8, { fill: pal.wood, stroke: pal.woodDark, strokeW: 0.4 });
    art.place(page, idx, `certificado-${i + 1}`, crop, { x: cx - d / 2, y: rowY - d / 2, w: d, h: d }, { shape: "circle" });
    circle(page, cx, rowY, d / 2, { stroke: pal.gold, strokeW: 0.5 });
  });

  // Nome da criança: área própria, em destaque, dentro do certificado
  const nameBox: Box = { x: 28, y: 140, w: 154, h: 30 };
  drawFitted(page, fonts.display, childName, nameBox, pal.accent, { max: 54, min: 22, leading: 1.0, maxLines: 2, shadow: pal.accentDark, shadowOffset: 0.7 });
  page.drawLine({ start: pt(page, 45, 174), end: pt(page, 165, 174), thickness: mm(0.6), color: color(pal.gold) });
  footprint(page, 39, 174, 4.5, pal.gold, 90);
  footprint(page, 171, 174, 4.5, pal.gold, -90);

  drawFitted(page, fonts.bold, c.text, { x: 30, y: 182, w: 150, h: 30 }, pal.ink, { max: 18, min: 11, leading: 1.28, maxLines: 3 });

  // Data e assinatura
  const lineY = 246;
  const cols: [string, number, number][] = [
    [c.dateLabel, 26, 66],
    [c.signatureLabel, 104, 80],
  ];
  for (const [label, x, w] of cols) {
    const p = pt(page, x, lineY - 2);
    page.drawText(label, { x: p.x, y: p.y, size: 9.5, font: fonts.bold, color: color(pal.ink) });
    page.drawLine({ start: pt(page, x, lineY + 8), end: pt(page, x + w, lineY + 8), thickness: mm(0.35), color: color(pal.ink) });
  }
  return page;
}
