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
