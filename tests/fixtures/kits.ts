/**
 * Kits SINTÉTICOS para testes automatizados. Gerados em diretório temporário,
 * nunca dentro de ./kits e nunca usados em produção.
 */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { THEME_IDS, THEMES } from "../../src/lib/themes";
import { CLUE_BASENAMES } from "../../src/lib/kits/manifest";

export async function writeFixtureKits(dir: string): Promise<string> {
  let hue = 0;
  for (const theme of THEME_IDS) {
    const tdir = path.join(dir, theme);
    fs.mkdirSync(tdir, { recursive: true });
    const files: [string, number, number][] = [
      ["introducao", 620, 877],
      // Grandes o bastante para os recortes editoriais (ex.: pista-08 de Dinossauros vai até x=430).
      ...CLUE_BASENAMES.map((b) => [b, 450, 600] as [string, number, number]),
      ["certificado", 877, 620],
    ];
    for (const [base, w, h] of files) {
      hue = (hue + 23) % 255;
      const label = `${THEMES[theme].label} · ${base}`;
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect width="100%" height="100%" fill="rgb(${hue},120,${255 - hue})"/><text x="50%" y="50%" font-size="${Math.round(w / 14)}" fill="#fff" text-anchor="middle" font-family="sans-serif">${label}</text></svg>`;
      await sharp(Buffer.from(svg)).png().toFile(path.join(tdir, `${base}.png`));
    }
  }
  return dir;
}
