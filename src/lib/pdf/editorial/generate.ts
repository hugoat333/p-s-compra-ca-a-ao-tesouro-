import fs from "node:fs/promises";
import path from "node:path";
import { PDFDocument } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import type { EditorialKit } from "../../editorial/types";
import { certificatePage, cluesPage, introPage, type Fonts } from "./pages";
import { RasterBook, type RasterUse } from "./raster";

export interface EditorialResult {
  doc: PDFDocument;
  rasters: RasterUse[];
  filesRead: string[];
}

export async function buildEditorialPdf(o: {
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
    display: await font("Baloo2-ExtraBold.ttf"),
    body: await font("Nunito-SemiBold.ttf"),
    bold: await font("Nunito-Bold.ttf"),
  };
  const art = new RasterBook(doc, o.kitDir, o.read);
  const crops = [...o.kit.intro.cast, ...o.kit.clues.map((c) => c.art), ...o.kit.certificate.art];
  await art.preload(crops.map((c) => c.file));

  introPage(doc, o.kit, o.childName, fonts, art);
  cluesPage(doc, o.kit, 1, fonts, art);
  cluesPage(doc, o.kit, 5, fonts, art);
  certificatePage(doc, o.kit, o.childName, fonts, art);
  await art.finalize();
  return { doc, rasters: art.uses, filesRead: art.filesRead };
}
