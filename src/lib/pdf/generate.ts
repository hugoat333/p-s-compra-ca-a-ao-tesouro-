/**
 * Gera o PDF da aventura:
 *   pág. 1  introdução personalizada
 *   pág. 2  pistas 1–4 (grade 2x2)
 *   pág. 3  pistas 5–8 (grade 2x2)
 *   pág. 4  certificado personalizado
 * As 8 pistas são embutidas sem alteração. Só introdução e certificado recebem o nome.
 * As imagens são embutidas no tamanho original (sem recompressão).
 */
import fs from "node:fs/promises";
import path from "node:path";
import { PDFDocument, PDFFont, PDFImage, PDFPage, PDFName, PDFBool, PDFRawStream, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { THEMES, type ThemeId } from "../themes";
import { layoutFor, resolveKit, type NamePlacement, type KitFiles } from "../kits/manifest";
import { fitText } from "./text";
import { editorialKit } from "../editorial";
import { buildEditorialPdf } from "./editorial/generate";
import type { RasterUse } from "./editorial/raster";

export const A4: [number, number] = [595.28, 841.89];
const A4_LANDSCAPE: [number, number] = [841.89, 595.28];
export const MARGIN = 28; // ~10 mm: seguro para impressoras domésticas
export const GUTTER = 16;

/** Faixa do nome: altura e caixa de texto (largura útil = página - 2*MARGIN - 40). */
export const BANNER_HEIGHT = 96;
export const BANNER_TEXT = { maxSize: 44, minSize: 18 };

const NAVY = rgb(0.12, 0.23, 0.48);
const GOLD = rgb(0.85, 0.55, 0.13);
const PARCHMENT = rgb(1, 0.965, 0.87);
const CUT = rgb(0.7, 0.7, 0.7);

export interface GenerateOptions {
  theme: ThemeId;
  childName: string;
  kitsDir: string;
  fontsDir: string;
  /** Injetável para testes (verificar exatamente quais arquivos foram lidos). */
  readFile?: (p: string) => Promise<Uint8Array>;
}

export interface GeneratedPdf {
  bytes: Uint8Array;
  kit: KitFiles;
  /** Composição editorial: cada ilustração raster usada, com DPI efetivo no tamanho impresso. */
  rasters?: RasterUse[];
}

interface Fonts {
  display: PDFFont;
  body: PDFFont;
}

interface Rect {
  x: number;
  y: number; // canto inferior esquerdo (coordenadas PDF)
  width: number;
  height: number;
}

function isPng(b: Uint8Array) {
  return b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47;
}

async function embedImage(doc: PDFDocument, bytes: Uint8Array): Promise<PDFImage> {
  const img = isPng(bytes) ? await doc.embedPng(bytes) : await doc.embedJpg(bytes);
  // Pede ao leitor/impressora para suavizar a ampliação de artes de baixa resolução.
  // Não altera os pixels da arte.
  await img.embed();
  const stream = doc.context.lookup(img.ref);
  if (stream instanceof PDFRawStream) stream.dict.set(PDFName.of("Interpolate"), PDFBool.True);
  return img;
}

/** Encaixa preservando proporção, centralizado. */
function fit(img: { width: number; height: number }, box: Rect): Rect {
  const scale = Math.min(box.width / img.width, box.height / img.height);
  const width = img.width * scale;
  const height = img.height * scale;
  return { x: box.x + (box.width - width) / 2, y: box.y + (box.height - height) / 2, width, height };
}

function roundedRectPath(w: number, h: number, r: number): string {
  return `M ${r} 0 H ${w - r} Q ${w} 0 ${w} ${r} V ${h - r} Q ${w} ${h} ${w - r} ${h} H ${r} Q 0 ${h} 0 ${h - r} V ${r} Q 0 0 ${r} 0 Z`;
}

function drawParchment(page: PDFPage, r: Rect) {
  const radius = Math.min(14, r.height / 4);
  page.drawSvgPath(roundedRectPath(r.width, r.height, radius), {
    x: r.x,
    y: r.y + r.height,
    color: PARCHMENT,
    borderColor: GOLD,
    borderWidth: 2,
    opacity: 0.96,
  });
}

function drawCenteredText(
  page: PDFPage,
  font: PDFFont,
  text: string,
  box: Rect,
  opts: { maxSize: number; minSize: number; color?: ReturnType<typeof rgb> },
) {
  const fitted = fitText(font, text, { width: box.width, height: box.height }, opts);
  const blockHeight = fitted.lineHeight * fitted.lines.length;
  // Baseline aproximada: centraliza o bloco usando a altura das maiúsculas.
  const capHeight = font.heightAtSize(fitted.size, { descender: false });
  let y = box.y + box.height / 2 + blockHeight / 2 - (fitted.lineHeight - capHeight) / 2 - capHeight;
  for (const line of fitted.lines) {
    const w = font.widthOfTextAtSize(line, fitted.size);
    page.drawText(line, { x: box.x + (box.width - w) / 2, y, size: fitted.size, font, color: opts.color ?? NAVY });
    y -= fitted.lineHeight;
  }
}

function personalizedText(template: string, childName: string) {
  return template.replace("{nome}", childName);
}

/** Página com uma arte (introdução ou certificado) + nome conforme a regra de posicionamento. */
function drawPersonalizedPage(doc: PDFDocument, img: PDFImage, placement: NamePlacement, childName: string, fonts: Fonts) {
  const landscape = img.width > img.height;
  const page = doc.addPage(landscape ? A4_LANDSCAPE : A4);
  const { width: pw, height: ph } = page.getSize();
  const text = personalizedText(placement.template, childName);

  if (placement.mode === "banner") {
    const bannerH = BANNER_HEIGHT;
    const banner: Rect = { x: MARGIN, y: ph - MARGIN - bannerH, width: pw - 2 * MARGIN, height: bannerH };
    drawParchment(page, banner);
    drawCenteredText(
      page,
      fonts.display,
      text,
      { x: banner.x + 20, y: banner.y + 10, width: banner.width - 40, height: banner.height - 20 },
      BANNER_TEXT,
    );
    const area: Rect = { x: MARGIN, y: MARGIN, width: pw - 2 * MARGIN, height: ph - 2 * MARGIN - bannerH - 14 };
    const r = fit(img, area);
    page.drawImage(img, r);
    return page;
  }

  const r = fit(img, { x: MARGIN, y: MARGIN, width: pw - 2 * MARGIN, height: ph - 2 * MARGIN });
  page.drawImage(img, r);
  const s = placement.slot;
  const slot: Rect = {
    x: r.x + s.x * r.width,
    y: r.y + r.height - (s.y + s.h) * r.height,
    width: s.w * r.width,
    height: s.h * r.height,
  };
  if (placement.label) drawParchment(page, slot);
  const pad = placement.label ? Math.min(16, slot.height * 0.12) : 0;
  const color = placement.color ? rgb(...placement.color) : NAVY;
  drawCenteredText(
    page,
    fonts.display,
    text,
    { x: slot.x + pad, y: slot.y + pad, width: slot.width - 2 * pad, height: slot.height - 2 * pad },
    { maxSize: 54, minSize: 16, color },
  );
  return page;
}

function dashedRect(page: PDFPage, r: Rect, offset: number) {
  const x0 = r.x - offset;
  const y0 = r.y - offset;
  const x1 = r.x + r.width + offset;
  const y1 = r.y + r.height + offset;
  const style = { thickness: 0.5, color: CUT, dashArray: [3, 3] };
  page.drawLine({ start: { x: x0, y: y0 }, end: { x: x1, y: y0 }, ...style });
  page.drawLine({ start: { x: x1, y: y0 }, end: { x: x1, y: y1 }, ...style });
  page.drawLine({ start: { x: x1, y: y1 }, end: { x: x0, y: y1 }, ...style });
  page.drawLine({ start: { x: x0, y: y1 }, end: { x: x0, y: y0 }, ...style });
}

function drawCluesPage(doc: PDFDocument, imgs: PDFImage[], firstNumber: number, fonts: Fonts) {
  const page = doc.addPage(A4);
  const { width: pw, height: ph } = page.getSize();
  const footer = 14;
  const cellW = (pw - 2 * MARGIN - GUTTER) / 2;
  const cellH = (ph - 2 * MARGIN - GUTTER - footer) / 2;
  imgs.forEach((img, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const cell: Rect = {
      x: MARGIN + col * (cellW + GUTTER),
      y: MARGIN + footer + (1 - row) * (cellH + GUTTER),
      width: cellW,
      height: cellH,
    };
    // Reserva 4pt para a linha de corte não encostar na arte.
    const r = fit(img, { x: cell.x + 4, y: cell.y + 4, width: cell.width - 8, height: cell.height - 8 });
    page.drawImage(img, r);
    dashedRect(page, r, 3);
  });
  const label = `Pistas ${firstNumber} a ${firstNumber + imgs.length - 1}  ·  recorte na linha pontilhada`;
  const size = 8;
  const w = fonts.body.widthOfTextAtSize(label, size);
  page.drawText(label, { x: (pw - w) / 2, y: MARGIN - 4, size, font: fonts.body, color: CUT });
  return page;
}

export async function generateAdventurePdf(opts: GenerateOptions): Promise<GeneratedPdf> {
  const read = opts.readFile ?? ((p: string) => fs.readFile(p));
  const kit = resolveKit(opts.theme, opts.kitsDir);

  const editorial = editorialKit(opts.theme);
  if (editorial) {
    const { doc, rasters } = await buildEditorialPdf({ kit: editorial, kitDir: kit.dir, fontsDir: opts.fontsDir, childName: opts.childName, read });
    setMetadata(doc, opts);
    return { bytes: await doc.save({ useObjectStreams: true }), kit, rasters };
  }

  const layout = layoutFor(opts.theme);

  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  const [displayBytes, bodyBytes] = await Promise.all([
    fs.readFile(path.join(opts.fontsDir, "Baloo2-ExtraBold.ttf")),
    fs.readFile(path.join(opts.fontsDir, "Nunito-Bold.ttf")),
  ]);
  const fonts: Fonts = {
    display: await doc.embedFont(displayBytes, { subset: false }),
    body: await doc.embedFont(bodyBytes, { subset: false }),
  };

  const [introBytes, certBytes, ...clueBytes] = await Promise.all(
    [kit.intro, kit.certificate, ...kit.clues].map((p) => read(p)),
  );
  const intro = await embedImage(doc, introBytes);
  const cert = await embedImage(doc, certBytes);
  const clues: PDFImage[] = [];
  for (const b of clueBytes) clues.push(await embedImage(doc, b));

  drawPersonalizedPage(doc, intro, layout.intro, opts.childName, fonts);
  drawCluesPage(doc, clues.slice(0, 4), 1, fonts);
  drawCluesPage(doc, clues.slice(4, 8), 5, fonts);
  drawPersonalizedPage(doc, cert, layout.certificate, opts.childName, fonts);

  setMetadata(doc, opts);

  const bytes = await doc.save({ useObjectStreams: true });
  return { bytes, kit };
}

function setMetadata(doc: PDFDocument, opts: GenerateOptions) {
  const title = `O Tesouro de ${opts.childName}`;
  doc.setTitle(title);
  doc.setSubject(`Aventura ${THEMES[opts.theme].label} — O Tesouro do Dia das Crianças`);
  doc.setAuthor("O Tesouro do Dia das Crianças");
  doc.setCreator("O Tesouro do Dia das Crianças");
  doc.setProducer("O Tesouro do Dia das Crianças");
  doc.setLanguage("pt-BR");
}
