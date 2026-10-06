/** Gera o guia de preparação de um tema. Uso: npx tsx scripts/sample-guide.ts espaco "Maria Eduarda" */
import fs from "node:fs";
import path from "node:path";
import { generateGuidePdf } from "../src/lib/pdf/guide";
import { isThemeId } from "../src/lib/themes";
import { slugifyName } from "../src/lib/childName";

(async () => {
  const [theme = "dinossauros", name = "Miguel"] = process.argv.slice(2);
  if (!isThemeId(theme)) throw new Error("tema inválido");
  const bytes = await generateGuidePdf({ theme, childName: name, fontsDir: path.join(process.cwd(), "assets/fonts") });
  fs.mkdirSync("output", { recursive: true });
  const out = `output/${theme}-guia-do-responsavel-${slugifyName(name)}.pdf`;
  fs.writeFileSync(out, bytes);
  console.log(`✓ ${out} (${(bytes.length / 1024).toFixed(0)} KB)`);
})();
