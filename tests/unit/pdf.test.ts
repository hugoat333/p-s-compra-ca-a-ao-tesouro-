import path from "node:path";
import fs from "node:fs/promises";
import { beforeAll, describe, expect, it } from "vitest";
import { PDFDocument } from "pdf-lib";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { generateAdventurePdf } from "@/lib/pdf/generate";
import { THEME_IDS } from "@/lib/themes";
import { FONTS_DIR, makeFixtureKits } from "./helpers";

let kitsDir: string;
beforeAll(async () => {
  kitsDir = await makeFixtureKits();
});

async function pageTexts(bytes: Uint8Array): Promise<string[]> {
  const doc = await getDocument({ data: new Uint8Array(bytes), disableFontFace: true }).promise;
  const out: string[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const content = await (await doc.getPage(i)).getTextContent();
    out.push(content.items.map((it) => ("str" in it ? it.str : "")).join(" ").replace(/\s+/g, " "));
  }
  return out;
}

describe("gerador do PDF (kits de teste)", () => {
  for (const theme of THEME_IDS) {
    it(`17-21. ${theme}: introdução + 8 pistas + certificado; nome só na introdução e no certificado`, async () => {
      const read: string[] = [];
      const { bytes } = await generateAdventurePdf({
        theme, childName: "João Ângelo", kitsDir, fontsDir: FONTS_DIR,
        readFile: async (p) => (read.push(p), fs.readFile(p)),
      });
      const doc = await PDFDocument.load(bytes);
      expect(doc.getPageCount()).toBe(4);
      expect(doc.getTitle()).toBe("O Tesouro de João Ângelo");
      expect(read.length).toBeGreaterThan(0);
      for (const p of read) expect(p.startsWith(path.join(kitsDir, theme) + path.sep)).toBe(true);
      for (let i = 1; i <= 8; i++) expect(read.map((p) => path.basename(p))).toContain(`pista-0${i}.png`);
      const t = await pageTexts(bytes);
      expect(t[0]).toContain("Olá, João Ângelo!");
      expect(t[3]).toContain("João Ângelo");
      expect(t[1]).not.toContain("João");
      expect(t[2]).not.toContain("João");
      expect(t[1]).toContain("Pistas 1 a 4");
      expect(t[2]).toContain("Pistas 5 a 8");
    }, 60_000);
  }
});
