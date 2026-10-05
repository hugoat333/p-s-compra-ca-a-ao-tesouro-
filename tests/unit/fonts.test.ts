import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import fontkit from "@pdf-lib/fontkit";
import { FONTS_DIR } from "./helpers";

// Regressão: o nome já saiu como "O M ue" por glifos perdidos na fonte. Todo caractere aceito no nome precisa existir.
const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyzÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇÑáàâãäéèêëíìîïóòôõöúùûüçñ' -.!,";

describe("fontes do PDF", () => {
  for (const file of ["Baloo2-ExtraBold.ttf", "Nunito-Bold.ttf"]) {
    it(`${file} cobre todos os caracteres do nome`, () => {
      const font = fontkit.create(fs.readFileSync(path.join(FONTS_DIR, file)));
      const missing = [...CHARS].filter((ch) => font.glyphForCodePoint(ch.codePointAt(0)!).id === 0 && ch !== " ");
      expect(missing).toEqual([]);
    });
  }
});

import { PDFDocument } from "pdf-lib";
import { fitText } from "@/lib/pdf/text";
import { A4, BANNER_HEIGHT, BANNER_TEXT, MARGIN } from "@/lib/pdf/generate";
import { CHILD_NAME_MAX_LENGTH } from "@/lib/childName";

describe("nome na faixa da introdução e do certificado", () => {
  it("nomes de teste e o maior nome permitido cabem sem cortar (fonte reduz sozinha)", async () => {
    const doc = await PDFDocument.create();
    doc.registerFontkit(fontkit);
    const font = await doc.embedFont(fs.readFileSync(path.join(FONTS_DIR, "Baloo2-ExtraBold.ttf")));
    const box = { width: A4[0] - 2 * MARGIN - 40, height: BANNER_HEIGHT - 20 };
    const longest = "Wwwwwwwwwwwww Mmmmmmmmmmmmmmmm".slice(0, CHILD_NAME_MAX_LENGTH);
    const sizes: Record<string, number> = {};
    for (const name of ["Ana", "Miguel", "Maria Eduarda", "João Pedro", longest]) {
      for (const tpl of ["Olá, {nome}!", "Parabéns, {nome}!"]) {
        const text = tpl.replace("{nome}", name);
        const fitted = fitText(font, text, box, BANNER_TEXT);
        expect(fitted.lines.join(" ")).toBe(text); // nunca corta com reticências
        for (const line of fitted.lines) expect(font.widthOfTextAtSize(line, fitted.size)).toBeLessThanOrEqual(box.width);
        expect(fitted.lineHeight * fitted.lines.length).toBeLessThanOrEqual(box.height);
        expect(fitted.size).toBeGreaterThanOrEqual(BANNER_TEXT.minSize);
        sizes[text] = fitted.size;
      }
    }
    expect(sizes["Olá, Ana!"]).toBe(BANNER_TEXT.maxSize);
    expect(sizes[`Parabéns, ${longest}!`]).toBeLessThan(BANNER_TEXT.maxSize);
  });
});
