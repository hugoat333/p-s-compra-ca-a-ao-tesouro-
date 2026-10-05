/**
 * Ilustrações raster com controle de resolução real.
 * Regra: a arte nunca é desenhada maior do que seu tamanho a TARGET_DPI. O DPI efetivo de cada uso é
 * registrado; abaixo de MIN_DPI a geração falha (nada de "esticar" imagem pequena).
 */
import { type PDFDocument, type PDFImage, type PDFPage, PDFName, PDFBool, PDFRawStream } from "pdf-lib";
import path from "node:path";
import type { Crop } from "../../editorial/types";
import { beginClip, endClip } from "./shapes";
import { type Box, mm } from "./units";

export const TARGET_DPI = 150;
export const MIN_DPI = 120;

export interface RasterUse {
  page: number;
  slot: string;
  file: string;
  crop: { x: number; y: number; w: number; h: number };
  widthMm: number;
  heightMm: number;
  dpi: number;
}

export class RasterResolutionError extends Error {}

export class RasterBook {
  private images = new Map<string, PDFImage>();
  readonly uses: RasterUse[] = [];
  readonly filesRead: string[] = [];

  constructor(
    private doc: PDFDocument,
    private dir: string,
    private read: (p: string) => Promise<Uint8Array>,
  ) {}

  async preload(files: string[]) {
    for (const f of new Set(files)) {
      if (this.images.has(f)) continue;
      const p = path.join(this.dir, `${f}.png`);
      this.filesRead.push(p);
      const bytes = await this.read(p);
      const isPng = bytes[0] === 0x89 && bytes[1] === 0x50;
      const img = isPng ? await this.doc.embedPng(bytes) : await this.doc.embedJpg(bytes);
      this.images.set(f, img);
    }
  }

  /** Tamanho máximo (mm) do recorte sem cair abaixo do DPI alvo. */
  static maxSize(crop: Crop, dpi = TARGET_DPI) {
    return { w: (crop.w / dpi) * 25.4, h: (crop.h / dpi) * 25.4 };
  }

  /**
   * Encaixa o recorte na caixa (proporção preservada), limitado ao tamanho máximo pelo DPI alvo,
   * alinhado conforme `align`. Retorna a caixa efetivamente ocupada.
   */
  place(
    page: PDFPage,
    pageIndex: number,
    slot: string,
    crop: Crop,
    box: Box,
    o: { shape?: "rect" | "circle"; radius?: number; align?: "center" | "top" | "bottom" } = {},
  ): Box {
    const img = this.images.get(crop.file);
    if (!img) throw new Error(`arte não carregada: ${crop.file}`);
    if (crop.x < 0 || crop.y < 0 || crop.x + crop.w > img.width || crop.y + crop.h > img.height) {
      throw new Error(`recorte fora da arte: ${crop.file} ${crop.x},${crop.y} ${crop.w}×${crop.h} (arte ${img.width}×${img.height})`);
    }
    const max = RasterBook.maxSize(crop);
    const scale = Math.min(box.w / crop.w, box.h / crop.h, max.w / crop.w);
    const w = crop.w * scale;
    const h = crop.h * scale;
    const x = box.x + (box.w - w) / 2;
    const y = o.align === "top" ? box.y : o.align === "bottom" ? box.y + box.h - h : box.y + (box.h - h) / 2;
    const dpi = crop.w / (w / 25.4);
    if (dpi < MIN_DPI - 0.5) {
      throw new RasterResolutionError(`${crop.file} (${slot}) ficaria com ${dpi.toFixed(0)} DPI (< ${MIN_DPI})`);
    }
    this.uses.push({ page: pageIndex, slot, file: crop.file, crop: { x: crop.x, y: crop.y, w: crop.w, h: crop.h }, widthMm: w, heightMm: h, dpi });

    const placed = { x, y, w, h };
    beginClip(page, placed, o.shape ?? "rect", o.radius ?? 2);
    const ptPerPx = mm(w) / crop.w;
    const pageH = page.getHeight();
    page.drawImage(img, {
      x: mm(x) - crop.x * ptPerPx,
      y: pageH - mm(y) - (img.height - crop.y) * ptPerPx,
      width: img.width * ptPerPx,
      height: img.height * ptPerPx,
    });
    endClip(page);
    return placed;
  }

  /** Marca as imagens para interpolação suave no leitor (não altera pixels nem conta como DPI). */
  async finalize() {
    for (const img of this.images.values()) {
      await img.embed();
      const stream = this.doc.context.lookup(img.ref);
      if (stream instanceof PDFRawStream) stream.dict.set(PDFName.of("Interpolate"), PDFBool.True);
    }
  }
}
