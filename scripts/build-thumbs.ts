/**
 * Gera as miniaturas leves dos cards de tema (public/temas/<tema>.webp, 600x450).
 * Fonte: kits/<tema>/capa.(png|jpg) se existir; senão a introducao. Uso: npm run kits:thumbs
 */
import "./env";
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { loadConfig } from "../src/lib/server/config";
import { KIT_EXTENSIONS, kitDir } from "../src/lib/kits/manifest";
import { THEME_IDS } from "../src/lib/themes";

async function main() {
  const { kitsDir } = loadConfig();
  const outDir = path.join(process.cwd(), "public", "temas");
  fs.mkdirSync(outDir, { recursive: true });
  for (const theme of THEME_IDS) {
    const dir = kitDir(theme, kitsDir);
    const source = ["capa", "introducao"]
      .flatMap((b) => KIT_EXTENSIONS.map((e) => path.join(dir, b + e)))
      .find((p) => fs.existsSync(p));
    if (!source) {
      console.log(`✗ ${theme}: sem capa/introducao — card usará o fallback com emoji`);
      continue;
    }
    const out = path.join(outDir, `${theme}.webp`);
    await sharp(source).resize(600, 450, { fit: "cover", position: "top" }).webp({ quality: 78 }).toFile(out);
    console.log(`✓ ${theme}: ${path.relative(process.cwd(), out)} (${Math.round(fs.statSync(out).size / 1024)} KB)`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
