/**
 * Gera um PDF de amostra para conferência visual e lista o DPI efetivo de cada ilustração.
 * Uso: npm run pdf:sample -- dinossauros "Miguel"
 */
import "./env";
import fs from "node:fs";
import path from "node:path";
import { loadConfig } from "../src/lib/server/config";
import { generateAdventurePdf } from "../src/lib/pdf/generate";
import { isThemeId, THEME_IDS } from "../src/lib/themes";
import { pdfFilename, validateChildName } from "../src/lib/childName";
import { TARGET_DPI } from "../src/lib/pdf/editorial/raster";

async function main() {
  const [theme = "dinossauros", rawName = "Miguel"] = process.argv.slice(2).filter((a) => !a.startsWith("--"));
  if (!isThemeId(theme)) throw new Error(`Tema inválido. Use: ${THEME_IDS.join(", ")}`);
  const name = validateChildName(rawName);
  if (!name.ok) throw new Error(name.error);
  const cfg = loadConfig();
  const { bytes, rasters } = await generateAdventurePdf({ theme, childName: name.value, kitsDir: cfg.kitsDir, fontsDir: cfg.fontsDir });
  const outDir = path.join(process.cwd(), "output");
  fs.mkdirSync(outDir, { recursive: true });
  const out = path.join(outDir, `${theme}-${pdfFilename(name.value)}`);
  fs.writeFileSync(out, bytes);
  console.log(`✓ ${out} (${(bytes.byteLength / 1024 / 1024).toFixed(2)} MB)`);
  if (rasters && process.argv.includes("--dpi")) {
    const pages = ["introdução", "pistas 1–4", "pistas 5–8", "certificado"];
    console.log("\nIlustrações raster (DPI efetivo no tamanho impresso):");
    for (const r of rasters) {
      const flag = r.dpi >= TARGET_DPI - 0.5 ? "✓" : "⚠";
      console.log(
        `  ${flag} ${pages[r.page].padEnd(12)} ${r.slot.padEnd(14)} ${(r.file + ".png").padEnd(16)} ` +
          `recorte ${r.crop.w}×${r.crop.h}px → ${r.widthMm.toFixed(1)}×${r.heightMm.toFixed(1)} mm → ${r.dpi.toFixed(0)} DPI`,
      );
    }
  }
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
