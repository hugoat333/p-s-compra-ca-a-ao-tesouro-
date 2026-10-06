import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import fontkit from "@pdf-lib/fontkit";
import { PDFDocument } from "pdf-lib";
import { FONTS_DIR } from "./helpers";
import { fit } from "@/lib/pdf/editorial/text";
import { STYLES } from "@/lib/pdf/editorial/styles";
import { THEME_IDS } from "@/lib/themes";
import { CHILD_NAME_MAX_LENGTH } from "@/lib/childName";

// Regressão: o nome já saiu como "O M ue" por glifos perdidos. Todo caractere aceito no nome precisa existir em TODAS as fontes.
const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyzÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇÑáàâãäéèêëíìîïóòôõöúùûüçñ' -.!,?:…";
const FONT_FILES = fs.readdirSync(FONTS_DIR).filter((f) => f.endsWith(".ttf"));

describe("fontes do PDF", () => {
  it("todas as fontes dos temas estão presentes", () => {
    for (const t of THEME_IDS) {
      const f = STYLES[t]?.font ?? "Baloo2-ExtraBold.ttf";
      expect(FONT_FILES).toContain(f);
    }
  });
  for (const file of FONT_FILES) {
    it(`${file} cobre todos os caracteres usados`, () => {
      const font = fontkit.create(fs.readFileSync(path.join(FONTS_DIR, file)));
      const missing = [...CHARS].filter((ch) => ch !== " " && font.glyphForCodePoint(ch.codePointAt(0)!).id === 0);
      expect(missing).toEqual([]);
    });
  }
});

describe("nome na introdução e no certificado de cada tema", () => {
  const longest = "Wwwwwwwwwwwww Mmmmmmmmmmmmmmmm".slice(0, CHILD_NAME_MAX_LENGTH);
  for (const theme of THEME_IDS) {
    it(`${theme}: nomes simples, compostos e o maior permitido cabem sem cortar`, async () => {
      const doc = await PDFDocument.create();
      doc.registerFontkit(fontkit);
      const font = await doc.embedFont(fs.readFileSync(path.join(FONTS_DIR, STYLES[theme]?.font ?? "Baloo2-ExtraBold.ttf")));
      for (const name of ["Ana", "Miguel", "Maria Eduarda", "João Pedro", longest]) {
        // Mesmas caixas usadas nas páginas (mm) — fit lança erro se não couber no tamanho mínimo.
        // Caixas reais: motor dos 5 temas (storybook) e Dinossauros (jurassic).
        const introBox = STYLES[theme] ? { w: 150, h: 27, max: 52, min: 18 } : { w: 122, h: 24, max: 46, min: 22 };
        const certBox = STYLES[theme] ? { w: 120, h: 30, max: 56, min: 16 } : { w: 110, h: 30, max: 54, min: 22 };
        const intro = fit(font, `Olá, ${name}!`, introBox.w, introBox.h, { max: introBox.max, min: introBox.min, leading: 1.0, maxLines: 2 });
        expect(intro.lines.join(" ")).toBe(`Olá, ${name}!`);
        const cert = fit(font, name, certBox.w, certBox.h, { max: certBox.max, min: certBox.min, leading: 1.0, maxLines: 2 });
        expect(cert.lines.join(" ")).toBe(name);
      }
    });
  }
});
