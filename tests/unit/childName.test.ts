import { describe, expect, it } from "vitest";
import { validateChildName, pdfFilename, CHILD_NAME_MAX_LENGTH } from "@/lib/childName";
import { fitText } from "@/lib/pdf/text";

describe("nome da criança", () => {
  it("10. nome vazio é rejeitado", () => {
    for (const v of ["", "   ", undefined, null, 42]) expect(validateChildName(v).ok).toBe(false);
  });

  it("aceita nomes brasileiros, preserva acentos e remove espaços extras", () => {
    expect(validateChildName("  João   Pedro ")).toEqual({ ok: true, value: "João Pedro" });
    expect(validateChildName("Maria-Clara")).toEqual({ ok: true, value: "Maria-Clara" });
    expect(validateChildName("D’Ávila")).toEqual({ ok: true, value: "D'Ávila" });
    expect(validateChildName("Çécília Ñ")).toMatchObject({ ok: true });
  });

  it("rejeita HTML, scripts, números e nomes longos demais", () => {
    for (const v of ["<script>alert(1)</script>", "<b>Ana</b>", "Ana & Bia", "Miguel2", "🦖", "a".repeat(CHILD_NAME_MAX_LENGTH + 1), "---"]) {
      expect(validateChildName(v).ok).toBe(false);
    }
  });

  it("filename sanitizado", () => {
    expect(pdfFilename("Miguel")).toBe("o-tesouro-de-miguel.pdf");
    expect(pdfFilename("João Pedro")).toBe("o-tesouro-de-joao-pedro.pdf");
    expect(pdfFilename("D'Ávila")).toBe("o-tesouro-de-d-avila.pdf");
    expect(pdfFilename("../../etc")).toBe("o-tesouro-de-etc.pdf");
  });
});

describe("fitText", () => {
  const font = { widthOfTextAtSize: (s: string, size: number) => s.length * size * 0.5 } as never;
  it("reduz a fonte, quebra em 2 linhas e respeita o mínimo", () => {
    expect(fitText(font, "Miguel", { width: 300, height: 60 }, { maxSize: 40, minSize: 12 })).toMatchObject({ lines: ["Miguel"], size: 40 });
    const two = fitText(font, "Maria Eduarda Santos", { width: 100, height: 80 }, { maxSize: 40, minSize: 12 });
    expect(two.lines).toHaveLength(2);
    expect(two.size).toBeGreaterThanOrEqual(12);
    const cut = fitText(font, "Supercalifragilistico", { width: 40, height: 20 }, { maxSize: 40, minSize: 12 });
    expect(cut.size).toBe(12);
    expect(cut.lines[0].endsWith("…")).toBe(true);
  });
});
