import path from "node:path";
import fs from "node:fs";
import { beforeAll, describe, expect, it } from "vitest";
import { THEME_IDS, THEMES, isThemeId } from "@/lib/themes";
import { resolveKit, missingAssets, MissingKitAssetsError, CLUE_BASENAMES } from "@/lib/kits/manifest";
import { makeFixtureKits } from "./helpers";

let kitsDir: string;
beforeAll(async () => {
  kitsDir = await makeFixtureKits();
});

describe("manifesto de temas", () => {
  it("tem exatamente os 6 IDs obrigatórios", () => {
    expect([...THEME_IDS]).toEqual(["dinossauros", "espaco", "futebol", "princesas", "fadas", "sereias"]);
    expect(THEMES.espaco.label).toBe("Espaço");
  });

  it("9. whitelist rejeita temas inválidos e tentativas de path traversal", () => {
    for (const bad of ["", "Dinossauros", "../dinossauros", "dinossauros/../espaco", "piratas", null, 1, "espaço"]) {
      expect(isThemeId(bad)).toBe(false);
    }
  });
});

const labels: Record<string, string> = {
  dinossauros: "11", espaco: "12", futebol: "13", princesas: "14", fadas: "15", sereias: "16",
};

describe("cada tema aponta só para os próprios arquivos", () => {
  for (const theme of THEME_IDS) {
    it(`${labels[theme]}. ${theme} carrega apenas assets de ${theme}`, () => {
      const kit = resolveKit(theme, kitsDir);
      const themeDir = path.join(kitsDir, theme) + path.sep;
      const all = [kit.intro, ...kit.clues, kit.certificate];
      expect(all).toHaveLength(10);
      for (const p of all) {
        expect(p.startsWith(themeDir)).toBe(true);
        for (const other of THEME_IDS.filter((t) => t !== theme)) {
          expect(p.includes(`${path.sep}${other}${path.sep}`)).toBe(false);
        }
      }
      expect(path.basename(kit.intro)).toBe("introducao.png");
      expect(path.basename(kit.certificate)).toBe("certificado.png");
      expect(kit.clues.map((p) => path.basename(p))).toEqual(CLUE_BASENAMES.map((b) => `${b}.png`));
      expect(new Set(kit.clues).size).toBe(8);
    });
  }
});

describe("kits incompletos", () => {
  it("lista exatamente os arquivos faltantes e não usa placeholder", () => {
    fs.renameSync(path.join(kitsDir, "fadas", "pista-03.png"), path.join(kitsDir, "fadas", "x.tmp"));
    try {
      expect(missingAssets("fadas", kitsDir)).toEqual(["fadas/pista-03.png"]);
      expect(() => resolveKit("fadas", kitsDir)).toThrow(MissingKitAssetsError);
    } finally {
      fs.renameSync(path.join(kitsDir, "fadas", "x.tmp"), path.join(kitsDir, "fadas", "pista-03.png"));
    }
  });
});
