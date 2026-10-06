/**
 * Verifica os kits: arquivos faltantes e DPI efetivo de cada ilustração no tamanho em que é impressa.
 * Ilustração abaixo de 120 DPI = erro (exit 1); entre 120 e 150 = aviso.
 * Uso: npm run kits:check
 */
import "./env";
import { loadConfig } from "../src/lib/server/config";
import { kitsReport } from "../src/lib/kits/manifest";
import { THEMES, type ThemeId } from "../src/lib/themes";
import { generateAdventurePdf } from "../src/lib/pdf/generate";
import { MIN_DPI, TARGET_DPI } from "../src/lib/pdf/editorial/raster";

async function main() {
  const { kitsDir, fontsDir } = loadConfig();
  const report = kitsReport(kitsDir);
  let missingTotal = 0;
  let errors = 0;
  console.log(`Pasta dos kits: ${kitsDir}\n`);
  for (const [theme, missing] of Object.entries(report) as [ThemeId, string[]][]) {
    missingTotal += missing.length;
    if (missing.length) {
      errors++;
      console.log(`✗ ${THEMES[theme].label}: faltam ${missing.length}/10\n    ${missing.join("\n    ")}`);
      continue;
    }
    try {
      const { rasters, bytes } = await generateAdventurePdf({ theme, childName: "Maria Eduarda", kitsDir, fontsDir });
      const dpis = rasters.map((r) => r.dpi);
      const warn = rasters.filter((r) => r.dpi < TARGET_DPI - 0.5);
      console.log(
        `${warn.length ? "⚠" : "✓"} ${THEMES[theme].label}: 10/10 arquivos · ${rasters.length} ilustrações a ${Math.round(Math.min(...dpis))}–${Math.round(Math.max(...dpis))} DPI · PDF ${(bytes.byteLength / 1024 / 1024).toFixed(1)} MB`,
      );
      for (const r of warn) console.log(`    ⚠ ${r.slot} (${r.file}.png) ${Math.round(r.dpi)} DPI — entre ${MIN_DPI} e ${TARGET_DPI}`);
    } catch (err) {
      errors++;
      console.log(`✗ ${THEMES[theme].label}: ${(err as Error).message}`);
    }
  }
  console.log(missingTotal === 0 && errors === 0 ? "\nTodos os 6 kits estão completos e acima do DPI mínimo." : `\n${errors} tema(s) com problema.`);
  if (errors) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
