/** Lista exatamente quais arquivos de kit faltam. Uso: npm run kits:check [-- --strict] */
import "./env";
import { loadConfig } from "../src/lib/server/config";
import { kitsReport } from "../src/lib/kits/manifest";
import { THEMES, type ThemeId } from "../src/lib/themes";

const { kitsDir } = loadConfig();
const report = kitsReport(kitsDir);
let missingTotal = 0;
console.log(`Pasta dos kits: ${kitsDir}\n`);
for (const [theme, missing] of Object.entries(report) as [ThemeId, string[]][]) {
  missingTotal += missing.length;
  if (missing.length === 0) console.log(`✓ ${THEMES[theme].label}: completo (10/10)`);
  else console.log(`✗ ${THEMES[theme].label}: faltam ${missing.length}/10\n    ${missing.join("\n    ")}`);
}
console.log(missingTotal === 0 ? "\nTodos os 6 kits estão completos." : `\n${missingTotal} arquivo(s) faltando.`);
if (missingTotal > 0 && process.argv.includes("--strict")) process.exit(1);
