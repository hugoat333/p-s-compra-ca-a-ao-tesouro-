/** Composição editorial (vetor-first) com os kits DEFINITIVOS. */
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { PDFDocument } from "pdf-lib";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { generateAdventurePdf } from "@/lib/pdf/generate";
import { editorialKit } from "@/lib/editorial";
import { MIN_DPI, TARGET_DPI } from "@/lib/pdf/editorial/raster";
import { THEME_IDS } from "@/lib/themes";
import { FONTS_DIR } from "./helpers";

const KITS = path.join(__dirname, "..", "..", "kits");
const norm = (s: string) => s.replace(/\s+/g, " ").trim();

async function pageTexts(bytes: Uint8Array): Promise<string[]> {
  const doc = await getDocument({ data: new Uint8Array(bytes), disableFontFace: true }).promise;
  const out: string[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const c = await (await doc.getPage(i)).getTextContent();
    out.push(norm(c.items.map((it) => ("str" in it ? it.str : "")).join(" ")));
  }
  return out;
}

const editorialThemes = THEME_IDS.filter((t) => editorialKit(t));

describe.each(editorialThemes)("kit editorial: %s", (theme) => {
  const kit = editorialKit(theme)!;

  it("tem 8 pistas e recortes válidos", () => {
    expect(kit.clues).toHaveLength(8);
  });

  if (theme === "dinossauros") {
    it("desafios batem exatamente com o roteiro original das artes", async () => {
      // Roteiro das artes originais (kits/dinossauros/pista-0N.png).
      const roteiro = [null, "DESAFIO EM DUPLA", null, "DESAFIO EM DUPLA", null, "DESAFIO EM DUPLA", null, "DESAFIO FINAL"];
      expect(kit.clues.map((c) => c.challenge?.label ?? null)).toEqual(roteiro);
      const { bytes } = await generateAdventurePdf({ theme, childName: "Miguel", kitsDir: KITS, fontsDir: FONTS_DIR });
      const t = await pageTexts(bytes);
      const count = (s: string, needle: string) => s.split(needle).length - 1;
      expect(count(t[1], "DESAFIO EM DUPLA")).toBe(2); // pistas 2 e 4
      expect(count(t[1], "DESAFIO FINAL")).toBe(0);
      expect(count(t[2], "DESAFIO EM DUPLA")).toBe(1); // pista 6
      expect(count(t[2], "DESAFIO FINAL")).toBe(1); // pista 8
    }, 60_000);
  }

  for (const name of ["Ana", "Miguel", "Maria Eduarda", "João Pedro"]) {
    it(`PDF com "${name}": 4 páginas, texto vetorial, nome só na introdução e no certificado`, async () => {
      const read: string[] = [];
      const { bytes, rasters } = await generateAdventurePdf({
        theme, childName: name, kitsDir: KITS, fontsDir: FONTS_DIR,
        readFile: async (p) => (read.push(p), fs.readFileSync(p)),
      });
      const doc = await PDFDocument.load(bytes);
      expect(doc.getPageCount()).toBe(4);
      for (const p of doc.getPages()) {
        expect(Math.round(p.getWidth())).toBe(595);
        expect(Math.round(p.getHeight())).toBe(842);
      }

      // Só arquivos do próprio tema.
      expect(read.length).toBeGreaterThan(0);
      for (const p of read) expect(p.startsWith(path.join(KITS, theme) + path.sep)).toBe(true);

      const t = await pageTexts(bytes);
      expect(t[0]).toContain(`Olá, ${name}!`);
      expect(t[3]).toContain(name);
      expect(t[1]).not.toContain(name);
      expect(t[2]).not.toContain(name);

      // Conteúdo textual de cada pista na página certa, em texto nativo (extraível).
      kit.clues.forEach((clue, i) => {
        const page = i < 4 ? t[1] : t[2];
        expect(page).toContain(`PISTA ${i + 1}`);
        for (const word of norm(clue.body).split(" ").slice(0, 6)) expect(page).toContain(word);
        if (clue.challenge) expect(page).toContain(clue.challenge.label);
      });
      expect(t[0]).toContain(norm(kit.intro.paragraphs[kit.intro.paragraphs.length - 1]));
      expect(t[3]).toContain(kit.certificate.title);
      expect(t[3]).toContain(kit.certificate.dateLabel);

      // Resolução real das ilustrações no tamanho impresso.
      expect(rasters!.length).toBeGreaterThan(8);
      for (const r of rasters!) {
        expect(r.dpi, `${r.slot} ${r.file}`).toBeGreaterThanOrEqual(MIN_DPI);
        expect(r.dpi, `${r.slot} ${r.file}`).toBeGreaterThanOrEqual(TARGET_DPI - 0.5);
      }
      // Cada pista usa a ilustração do próprio arquivo.
      kit.clues.forEach((clue, i) => {
        const use = rasters!.find((r) => r.slot === `pista-${i + 1}`)!;
        expect(use.file).toBe(`pista-0${i + 1}`);
      });
    }, 60_000);
  }
});
