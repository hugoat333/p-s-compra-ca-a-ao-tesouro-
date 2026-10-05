/**
 * Lista exatamente quais arquivos de kit faltam e a resolução efetiva de impressão (DPI) de cada arte.
 * Uso: npm run kits:check [-- --strict]
 */
import "./env";
import sharp from "sharp";
import { loadConfig } from "../src/lib/server/config";
import { kitsReport, resolveKit } from "../src/lib/kits/manifest";
import { A4, BANNER_HEIGHT, GUTTER, MARGIN } from "../src/lib/pdf/generate";
import { THEMES, type ThemeId } from "../src/lib/themes";
import { editorialKit } from "../src/lib/editorial";
import { generateAdventurePdf } from "../src/lib/pdf/generate";
import { MIN_DPI as HARD_MIN_DPI, TARGET_DPI } from "../src/lib/pdf/editorial/raster";

const MIN_DPI = 150; // abaixo disso a impressão fica visivelmente borrada/serrilhada

/** DPI efetivo de uma imagem encaixada (proporção preservada) numa caixa em pontos (1pt = 1/72"). */
function dpi(px: { width: number; height: number }, box: { width: number; height: number }) {
  const scale = Math.min(box.width / px.width, box.height / px.height); // pt por pixel
  return Math.round(72 / scale);
}

async function main() {
  const { kitsDir } = loadConfig();
  const report = kitsReport(kitsDir);
  let missingTotal = 0;
  let lowRes = 0;
  let errors = 0;
  const { fontsDir } = loadConfig();
  console.log(`Pasta dos kits: ${kitsDir}\n`);
  for (const [theme, missing] of Object.entries(report) as [ThemeId, string[]][]) {
    missingTotal += missing.length;
    if (missing.length) {
      console.log(`✗ ${THEMES[theme].label}: faltam ${missing.length}/10\n    ${missing.join("\n    ")}`);
      continue;
    }
    if (editorialKit(theme)) {
      // Composição editorial: mede cada ilustração no tamanho em que realmente é impressa.
      try {
        const { rasters = [] } = await generateAdventurePdf({ theme, childName: "Maria Eduarda", kitsDir, fontsDir });
        const min = Math.min(...rasters.map((r) => r.dpi));
        const warn = rasters.filter((r) => r.dpi < TARGET_DPI - 0.5);
        console.log(`${warn.length ? "⚠" : "✓"} ${THEMES[theme].label}: completo (10/10) — editorial, texto vetorial, ${rasters.length} ilustrações a ${Math.round(min)}–${Math.round(Math.max(...rasters.map((r) => r.dpi)))} DPI`);
        for (const r of warn) console.log(`    ⚠ ${r.slot} (${r.file}.png) ${Math.round(r.dpi)} DPI — entre ${HARD_MIN_DPI} e ${TARGET_DPI}`);
      } catch (err) {
        errors++;
        console.log(`✗ ${THEMES[theme].label}: ${(err as Error).message}`);
      }
      continue;
    }
    const kit = resolveKit(theme, kitsDir);
    const meta = async (p: string) => {
      const m = await sharp(p).metadata();
      return { width: m.width ?? 1, height: m.height ?? 1 };
    };
    const page = async (p: string) => {
      const m = await meta(p);
      const [pw, ph] = m.width > m.height ? [A4[1], A4[0]] : A4;
      return { name: p.split("/").pop()!, px: m, dpi: dpi(m, { width: pw - 2 * MARGIN, height: ph - 2 * MARGIN - BANNER_HEIGHT - 14 }) };
    };
    const cell = { width: (A4[0] - 2 * MARGIN - GUTTER) / 2 - 8, height: (A4[1] - 2 * MARGIN - GUTTER - 14) / 2 - 8 };
    const items = [await page(kit.intro), ...(await Promise.all(kit.clues.map(async (p) => {
      const m = await meta(p);
      return { name: p.split("/").pop()!, px: m, dpi: dpi(m, cell) };
    }))), await page(kit.certificate)];
    const worst = Math.min(...items.map((i) => i.dpi));
    const flag = worst < MIN_DPI ? "⚠" : "✓";
    if (worst < MIN_DPI) lowRes++;
    console.log(`${flag} ${THEMES[theme].label}: completo (10/10) — layout legado (arte inteira), resolução de impressão ${worst}–${Math.max(...items.map((i) => i.dpi))} DPI`);
    for (const i of items.filter((x) => x.dpi < MIN_DPI)) {
      console.log(`    ${i.name.padEnd(16)} ${i.px.width}x${i.px.height}px → ${i.dpi} DPI`);
    }
  }
  console.log(missingTotal === 0 ? "\nTodos os 6 kits estão completos." : `\n${missingTotal} arquivo(s) faltando.`);
  if (lowRes) {
    console.log(`⚠ ${lowRes} tema(s) legado(s) com artes abaixo de ${MIN_DPI} DPI na impressão. Ideal: 300 DPI ` +
      `(introdução/certificado ~2250x3000px; pistas ~1050x1550px). O PDF funciona, mas sai borrado no papel.`);
  }
  if (errors) process.exit(1); // ilustração abaixo de 120 DPI ou recorte inválido
  if (missingTotal > 0 && process.argv.includes("--strict")) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
