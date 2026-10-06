/** Integridade dos kits DEFINITIVOS versionados em ./kits. */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { THEME_IDS } from "@/lib/themes";
import { kitsReport, resolveKit } from "@/lib/kits/manifest";

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
});
