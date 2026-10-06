/**
 * Gera o PDF da aventura (4 páginas A4): introdução personalizada, pistas 1–4, pistas 5–8 e certificado.
 * Composição editorial vetor-first; as artes entram só como ilustrações recortadas (≥150 DPI efetivos).
 */
import fs from "node:fs/promises";
import { THEMES, type ThemeId } from "../themes";
import { resolveKit, type KitFiles } from "../kits/manifest";
import { editorialKit } from "../editorial";
import { buildEditorialPdf } from "./editorial/generate";
import type { RasterUse } from "./editorial/raster";

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
  /** Cada ilustração raster usada, com DPI efetivo no tamanho impresso. */
  rasters: RasterUse[];
}

export async function generateAdventurePdf(opts: GenerateOptions): Promise<GeneratedPdf> {
  const read = opts.readFile ?? ((p: string) => fs.readFile(p));
  // Falha cedo (sem placeholder) se algum dos 10 arquivos do tema estiver faltando.
  const kit = resolveKit(opts.theme, opts.kitsDir);
  const { doc, rasters } = await buildEditorialPdf({
    theme: opts.theme,
    kit: editorialKit(opts.theme),
    kitDir: kit.dir,
    fontsDir: opts.fontsDir,
    childName: opts.childName,
    read,
  });
  doc.setTitle(`O Tesouro de ${opts.childName}`);
  doc.setSubject(`Aventura ${THEMES[opts.theme].label} — O Tesouro do Dia das Crianças`);
  doc.setAuthor("O Tesouro do Dia das Crianças");
  doc.setCreator("O Tesouro do Dia das Crianças");
  doc.setProducer("O Tesouro do Dia das Crianças");
  doc.setLanguage("pt-BR");
  return { bytes: await doc.save({ useObjectStreams: true }), kit, rasters };
}
