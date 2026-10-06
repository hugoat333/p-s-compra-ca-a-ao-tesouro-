/**
 * Guia de preparação do responsável (1 página A4, separado do PDF da aventura).
 * Gerado a partir do mesmo conteúdo do kit: os locais saem de `hideAt` de cada pista.
 */
import fs from "node:fs/promises";
import path from "node:path";
import { PDFDocument, type PDFFont, type PDFPage } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { THEMES, type ThemeId } from "../themes";
import { editorialKit } from "../editorial";
import type { RGB } from "../editorial/types";
import { STYLES } from "./editorial/styles";
import { roundedRect, circle } from "./editorial/shapes";
import { drawBlock, fit } from "./editorial/text";
import { A4_MM, color, mix, mm, pt } from "./editorial/units";

export interface GuideRow {
  label: string;
  where: string;
}

export function guideRows(theme: ThemeId): GuideRow[] {
  const kit = editorialKit(theme);
  const rows = kit.clues.map((c, i) => ({ label: `Pista ${i + 1}`, where: c.hideAt }));
  rows.push({ label: "Surpresa final", where: `Com você, o Guardião da Missão (${kit.treasure} / o presente)` });
  return rows;
}

function text(page: PDFPage, font: PDFFont, s: string, x: number, y: number, size: number, c: RGB) {
  const p = pt(page, x, y);
  page.drawText(s, { x: p.x, y: p.y, size, font, color: color(c) });
}

export async function generateGuidePdf(o: { theme: ThemeId; childName: string; fontsDir: string }): Promise<Uint8Array> {
  const kit = editorialKit(o.theme);
  const st = STYLES[o.theme];
  const pal = kit.palette;
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  const load = async (f: string) => doc.embedFont(await fs.readFile(path.join(o.fontsDir, f)), { subset: false });
  const display = await load(st?.font ?? "Baloo2-ExtraBold.ttf");
  const body = await load("Nunito-SemiBold.ttf");
  const bold = await load("Nunito-Bold.ttf");
  const band: RGB = st?.band ?? [0.24, 0.42, 0.2];
  const head: RGB = st?.headerColors.fill ?? pal.wood;

  const page = doc.addPage([mm(A4_MM.w), mm(A4_MM.h)]);
  page.drawRectangle({ x: 0, y: 0, width: page.getWidth(), height: page.getHeight(), color: color(band) });
  roundedRect(page, { x: 10, y: 10, w: A4_MM.w - 20, h: A4_MM.h - 20 }, { r: 5, fill: [1, 1, 1] });

  // Cabeçalho
  roundedRect(page, { x: 10, y: 10, w: A4_MM.w - 20, h: 34 }, { r: 5, fill: head });
  page.drawRectangle({ ...pt(page, 10, 44), width: mm(A4_MM.w - 20), height: mm(6), color: color(head) });
  const t1 = fit(display, "Guia de preparação do Guardião da Missão", 170, 14, { max: 22, min: 14, maxLines: 1 });
  drawBlock(page, display, t1, 20, 16, 170, [1, 1, 1]);
  const t2 = fit(bold, `${kit.missionName} · tema ${THEMES[o.theme].label} · aventura de ${o.childName}`, 170, 8, { max: 11, min: 8, maxLines: 1 });
  drawBlock(page, bold, t2, 20, 32, 170, mix([1, 1, 1], head, 0.15));

  let y = 58;
  const section = (title: string) => {
    text(page, display, title, 20, y, 15, pal.accentDark);
    y += 3;
    page.drawLine({ start: pt(page, 20, y), end: pt(page, 190, y), thickness: mm(0.4), color: color(mix(pal.accent, [1, 1, 1], 0.4)) });
    y += 7;
  };
  const bullet = (s: string, n?: number) => {
    const b = fit(body, s, 158, 30, { max: 10.5, min: 9, leading: 1.3 });
    circle(page, 23.5, y + 1.6, 2.6, { fill: pal.accent });
    if (n !== undefined) {
      const w = bold.widthOfTextAtSize(String(n), 8) / (72 / 25.4);
      text(page, bold, String(n), 23.5 - w / 2, y + 2.7, 8, [1, 1, 1]);
    }
    drawBlock(page, body, b, 30, y - 1.2, 158, pal.ink, { align: "left" });
    y += b.height + 2.8;
  };

  section("Antes de começar");
  [
    "Imprima as 4 páginas da aventura em A4 (papel sulfite comum funciona; papel 120 g fica ainda mais bonito).",
    "Recorte as 8 pistas pelas marcas dos cantos. A introdução e o certificado ficam inteiros.",
    `Separe a surpresa final (um brinde, doce ou presente). Ela representa ${kit.treasure} e fica com você até o fim.`,
    "Reserve uns 10 minutos para esconder as pistas sem a criança ver.",
  ].forEach((s, i) => bullet(s, i + 1));

  y += 5;
  section("Onde esconder cada pista");
  const rows = guideRows(o.theme);
  const rowH = 9.6;
  rows.forEach((r, i) => {
    const ry = y + i * rowH;
    roundedRect(page, { x: 20, y: ry, w: 170, h: rowH - 1.2 }, { r: 2, fill: i % 2 ? [1, 1, 1] : mix(pal.parchment, [1, 1, 1], 0.4), stroke: mix(pal.parchmentEdge, [1, 1, 1], 0.3), strokeW: 0.25 });
    roundedRect(page, { x: 23, y: ry + 2.2, w: 4.2, h: 4.2 }, { r: 0.8, stroke: pal.ink, strokeW: 0.35 });
    text(page, display, r.label, 31, ry + 5.9, 11, i === rows.length - 1 ? pal.alert : pal.accentDark);
    const wb = fit(body, r.where, 118, rowH - 2, { max: 10.5, min: 8, maxLines: 1 });
    drawBlock(page, body, wb, 68, ry + (rowH - 1.2 - wb.height) / 2, 118, pal.ink, { align: "left" });
  });
  y += rows.length * rowH + 6;

  section("Como jogar");
  [
    "Leia a introdução com a criança e entregue a Pista 1 em mãos.",
    "Cada pista indica o lugar onde está escondida a próxima. Se ela travar, dê uma dica sem entregar a resposta.",
    "Nos desafios em dupla, participe junto: é a parte mais divertida!",
    "Na Pista 8, a criança vem até você, o Guardião da Missão, para receber a surpresa.",
    "No final, preencha a data, assine o certificado e entregue como prêmio da missão.",
  ].forEach((s, i) => bullet(s, i + 1));

  const foot = "O Tesouro do Dia das Crianças · guarde este guia longe dos olhos do aventureiro!";
  const fw = bold.widthOfTextAtSize(foot, 8) / (72 / 25.4);
  text(page, bold, foot, (A4_MM.w - fw) / 2, A4_MM.h - 15, 8, mix(pal.ink, [1, 1, 1], 0.4));

  doc.setTitle(`Guia de preparação — ${kit.missionName}`);
  doc.setAuthor("O Tesouro do Dia das Crianças");
  doc.setLanguage("pt-BR");
  return doc.save({ useObjectStreams: true });
}

export function guideFilename(childName: string, slug: (s: string) => string) {
  return `guia-do-responsavel-${slug(childName)}.pdf`;
}
