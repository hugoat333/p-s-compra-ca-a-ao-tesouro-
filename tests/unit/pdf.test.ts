import path from "node:path";
import fs from "node:fs/promises";
import { beforeAll, describe, expect, it } from "vitest";
import { PDFDocument, PDFDict, PDFName } from "pdf-lib";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { generateAdventurePdf } from "@/lib/pdf/generate";
import { THEME_IDS } from "@/lib/themes";
import { FONTS_DIR, makeFixtureKits } from "./helpers";

let kitsDir: string;
beforeAll(async () => {
  kitsDir = await makeFixtureKits();
});

async function pageTexts(bytes: Uint8Array): Promise<string[]> {
  const doc = await getDocument({ data: new Uint8Array(bytes), useSystemFonts: false, disableFontFace: true }).promise;
  const out: string[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const content = await (await doc.getPage(i)).getTextContent();
    out.push(content.items.map((it) => ("str" in it ? it.str : "")).join(" "));
  }
  return out;
}

async function imagesPerPage(bytes: Uint8Array): Promise<number[]> {
  const doc = await PDFDocument.load(bytes);
  return doc.getPages().map((p) => {
    const xobj = p.node.Resources()?.lookup(PDFName.of("XObject"), PDFDict);
    return xobj ? xobj.keys().length : 0;
  });
}

describe("gerador do PDF", () => {
  it("17-21. introdução + 8 pistas + certificado, nome na introdução e no certificado", async () => {
    const read: string[] = [];
    const { bytes } = await generateAdventurePdf({
      theme: "sereias", // layout legado (Dinossauros usa o editorial; ver editorial.test.ts)
      childName: "Miguel",
      kitsDir,
      fontsDir: FONTS_DIR,
      readFile: async (p) => {
        read.push(p);
        return fs.readFile(p);
      },
    });

    const doc = await PDFDocument.load(bytes);
    expect(doc.getPageCount()).toBe(4);
    expect(doc.getTitle()).toBe("O Tesouro de Miguel");

    // Só arquivos do tema escolhido foram lidos: introdução, 8 pistas e certificado.
    const dinoDir = path.join(kitsDir, "sereias");
    expect(read).toHaveLength(10);
    expect(read.every((p) => p.startsWith(dinoDir + path.sep))).toBe(true);
    expect(read.map((p) => path.basename(p)).sort()).toEqual(
      ["certificado.png", "introducao.png", ...Array.from({ length: 8 }, (_, i) => `pista-0${i + 1}.png`)].sort(),
    );

    // 17/19: uma imagem na introdução e no certificado. 18: 4 + 4 pistas.
    expect(await imagesPerPage(bytes)).toEqual([1, 4, 4, 1]);

    const texts = await pageTexts(bytes);
    expect(texts[0]).toContain("Miguel"); // 20
    expect(texts[3]).toContain("Miguel"); // 21
    expect(texts[1]).not.toContain("Miguel"); // pistas não são personalizadas
    expect(texts[2]).not.toContain("Miguel");
    expect(texts[1]).toContain("Pistas 1 a 4");
    expect(texts[2]).toContain("Pistas 5 a 8");

    // A4 retrato nas pistas; certificado paisagem segue a arte.
    const sizes = doc.getPages().map((p) => p.getSize());
    expect(Math.round(sizes[1].width)).toBe(595);
    expect(Math.round(sizes[1].height)).toBe(842);
    expect(Math.round(sizes[3].width)).toBe(842);
  });

  it("preserva acentos e encaixa nomes longos", async () => {
    const { bytes } = await generateAdventurePdf({
      theme: "sereias",
      childName: "Maria Eduarda dos Santos Silva",
      kitsDir,
      fontsDir: FONTS_DIR,
    });
    const long = await pageTexts(bytes);
    expect(long[0].replace(/\s+/g, " ")).toContain("Maria Eduarda");

    const { bytes: b2 } = await generateAdventurePdf({ theme: "espaco", childName: "João Ângelo", kitsDir, fontsDir: FONTS_DIR });
    const t = await pageTexts(b2);
    expect(t[0]).toContain("João Ângelo");
    expect(t[3]).toContain("João Ângelo");
  });

  it("gera para todos os temas sem misturar", async () => {
    for (const theme of THEME_IDS) {
      const read: string[] = [];
      await generateAdventurePdf({
        theme, childName: "Lia", kitsDir, fontsDir: FONTS_DIR,
        readFile: async (p) => (read.push(p), fs.readFile(p)),
      });
      expect(read.every((p) => p.startsWith(path.join(kitsDir, theme) + path.sep))).toBe(true);
    }
  });
});
