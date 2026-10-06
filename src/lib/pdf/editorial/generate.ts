import fs from "node:fs/promises";
import path from "node:path";
import { PDFDocument } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import type { EditorialKit } from "../../editorial/types";
import type { ThemeId } from "../../themes";
import { STYLES } from "./styles";
import { certificatePageStory, cluesPageStory, introPageStory } from "./storybook";
import type { Fonts } from "./fonts";
import { certificatePageJurassic, cluesPageJurassic, introPageJurassic } from "./jurassic";
import { RasterBook, type RasterUse } from "./raster";

export interface EditorialResult {
  doc: PDFDocument;
  rasters: RasterUse[];
  filesRead: string[];
}

export async function buildEditorialPdf(o: {
  theme: ThemeId;
  kit: EditorialKit;
  kitDir: string;
  fontsDir: string;
  childName: string;
  read: (p: string) => Promise<Uint8Array>;
}): Promise<EditorialResult> {
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  const font = async (f: string) => doc.embedFont(await fs.readFile(path.join(o.fontsDir, f)), { subset: false });
  const fonts: Fonts = {
    display: await font(STYLES[o.theme]?.font ?? "Baloo2-ExtraBold.ttf"),
    body: await font("Nunito-SemiBold.ttf"),
    bold: await font("Nunito-Bold.ttf"),
  };
  const art = new RasterBook(doc, o.kitDir, o.read);
  const crops = [...o.kit.intro.cast, ...o.kit.clues.map((c) => c.art), ...o.kit.certificate.art];
  await art.preload(crops.map((c) => c.file));

  const st = STYLES[o.theme];
  if (st) {
    introPageStory(doc, o.kit, st, o.childName, fonts, art);
    cluesPageStory(doc, o.kit, st, 1, fonts, art);
    cluesPageStory(doc, o.kit, st, 5, fonts, art);
    certificatePageStory(doc, o.kit, st, o.childName, fonts, art);
  } else {
    // Dinossauros: direção "expedição jurássica" aprovada (não alterar).
    introPageJurassic(doc, o.kit, o.childName, fonts, art);
    cluesPageJurassic(doc, o.kit, 1, fonts, art);
    cluesPageJurassic(doc, o.kit, 5, fonts, art);
    certificatePageJurassic(doc, o.kit, o.childName, fonts, art);
  }
  await art.finalize();
  return { doc, rasters: art.uses, filesRead: art.filesRead };
}
