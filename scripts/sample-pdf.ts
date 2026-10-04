/**
 * Gera um PDF de amostra para conferência visual (posição do nome, cortes, qualidade).
 * Uso: npm run pdf:sample -- dinossauros "Miguel"
 */
import "./env";
import fs from "node:fs";
import path from "node:path";
import { loadConfig } from "../src/lib/server/config";
import { generateAdventurePdf } from "../src/lib/pdf/generate";
import { isThemeId, THEME_IDS } from "../src/lib/themes";
import { pdfFilename, validateChildName } from "../src/lib/childName";

async function main() {
  const [theme = "dinossauros", rawName = "Miguel"] = process.argv.slice(2);
  if (!isThemeId(theme)) throw new Error(`Tema inválido. Use: ${THEME_IDS.join(", ")}`);
  const name = validateChildName(rawName);
  if (!name.ok) throw new Error(name.error);
  const cfg = loadConfig();
  const { bytes } = await generateAdventurePdf({ theme, childName: name.value, kitsDir: cfg.kitsDir, fontsDir: cfg.fontsDir });
  const outDir = path.join(process.cwd(), "output");
  fs.mkdirSync(outDir, { recursive: true });
  const out = path.join(outDir, `${theme}-${pdfFilename(name.value)}`);
  fs.writeFileSync(out, bytes);
  console.log(`✓ ${out} (${(bytes.byteLength / 1024 / 1024).toFixed(2)} MB)`);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
