/** Prova de conceito v2: uma página A4 com as pistas 5–8 de Dinossauros. Uso: npx tsx scripts/poc-pistas-5-8.ts */
import fs from "node:fs";
import path from "node:path";
import { PDFDocument } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { dinossauros } from "../src/lib/editorial/dinossauros";
import { RasterBook } from "../src/lib/pdf/editorial/raster";
import { cluesPageV2 } from "../src/lib/pdf/editorial/cardsV2";
import type { Crop } from "../src/lib/editorial/types";

// Recortes v2: maior área de ilustração SEM texto rasterizado em cada arte.
const CROPS: Record<5 | 6 | 7 | 8, Crop> = {
  5: { file: "pista-05", x: 0, y: 208, w: 365, h: 128 },
  6: { file: "pista-06", x: 0, y: 176, w: 172, h: 160 },
  7: { file: "pista-07", x: 0, y: 178, w: 364, h: 158 },
  8: { file: "pista-08", x: 268, y: 0, w: 166, h: 336 },
};

async function main() {
  const root = process.cwd();
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  const font = async (f: string) => doc.embedFont(fs.readFileSync(path.join(root, "assets/fonts", f)), { subset: false });
  const fonts = { display: await font("Baloo2-ExtraBold.ttf"), body: await font("Nunito-SemiBold.ttf"), bold: await font("Nunito-Bold.ttf") };
  const art = new RasterBook(doc, path.join(root, "kits/dinossauros"), async (p) => fs.readFileSync(p));
  await art.preload(Object.values(CROPS).map((c) => c.file));
  cluesPageV2(doc, dinossauros, fonts, art, CROPS);
  doc.setTitle("Dinossauros — pistas 5 a 8 (prova de conceito v2)");
  const bytes = await doc.save();
  fs.mkdirSync(path.join(root, "output"), { recursive: true });
  const out = path.join(root, "output/poc-v2-dinossauros-pistas-5-8.pdf");
  fs.writeFileSync(out, bytes);
  console.log(`✓ ${out} (${(bytes.length / 1024 / 1024).toFixed(2)} MB)`);
  for (const r of art.uses) {
    console.log(`  ${r.slot.padEnd(8)} ${(r.file + ".png").padEnd(13)} recorte ${r.crop.w}×${r.crop.h}px → ${r.widthMm.toFixed(1)}×${r.heightMm.toFixed(1)} mm → ${r.dpi.toFixed(0)} DPI`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
