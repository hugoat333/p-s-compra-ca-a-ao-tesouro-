/** Integridade dos kits DEFINITIVOS versionados em ./kits. */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { PDFDocument, PDFName, PDFDict, PDFRawStream, PDFRef } from "pdf-lib";
import { THEME_IDS } from "@/lib/themes";
import { kitsReport, resolveKit } from "@/lib/kits/manifest";
import { generateAdventurePdf } from "@/lib/pdf/generate";
import { FONTS_DIR } from "./helpers";

const KITS = path.join(__dirname, "..", "..", "kits");
const sha = (p: string) => crypto.createHash("sha256").update(fs.readFileSync(p)).digest("hex");

describe("kits definitivos", () => {
  it("os 6 temas estão completos (60 arquivos)", () => {
    for (const missing of Object.values(kitsReport(KITS))) expect(missing).toEqual([]);
  });

  it("nenhum arquivo é repetido entre temas ou dentro do tema", () => {
    const seen = new Map<string, string>();
    for (const theme of THEME_IDS) {
      const kit = resolveKit(theme, KITS);
      for (const p of [kit.intro, ...kit.clues, kit.certificate]) {
        const h = sha(p);
        expect(seen.get(h), `${p} é idêntico a ${seen.get(h)}`).toBeUndefined();
        seen.set(h, p);
      }
    }
    expect(seen.size).toBe(60);
  });

  it("o PDF de cada tema embute exatamente as 10 artes daquele tema", async () => {
    for (const theme of THEME_IDS) {
      const kit = resolveKit(theme, KITS);
      const read: string[] = [];
      const { bytes } = await generateAdventurePdf({
        theme, childName: "Miguel", kitsDir: KITS, fontsDir: FONTS_DIR,
        readFile: async (p) => (read.push(p), fs.readFileSync(p)),
      });
      expect(read.sort()).toEqual([kit.intro, ...kit.clues, kit.certificate].sort());
      const doc = await PDFDocument.load(bytes);
      expect(doc.getPageCount()).toBe(4);
      const counts = doc.getPages().map((pg) => pg.node.Resources()!.lookup(PDFName.of("XObject"), PDFDict).keys().length);
      expect(counts).toEqual([1, 4, 4, 1]);
      // Imagens marcadas para interpolação na impressão.
      const xobj = doc.getPages()[1].node.Resources()!.lookup(PDFName.of("XObject"), PDFDict);
      const first = doc.context.lookup(xobj.get(xobj.keys()[0]) as PDFRef) as PDFRawStream;
      expect(first.dict.get(PDFName.of("Interpolate"))?.toString()).toBe("true");
    }
  }, 120_000);
});
