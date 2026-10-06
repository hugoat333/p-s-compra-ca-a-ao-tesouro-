import { describe, expect, it } from "vitest";
import { validateChildName, pdfFilename, CHILD_NAME_MAX_LENGTH } from "@/lib/childName";
import { fit } from "@/lib/pdf/editorial/text";

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

describe("ajuste de texto (fit)", () => {
  const font = { widthOfTextAtSize: (s: string, size: number) => s.length * size * 0.5 } as never;
  it("reduz a fonte e quebra linhas sem cortar", () => {
    expect(fit(font, "Miguel", 120, 20, { max: 40, min: 12, maxLines: 2 }).lines).toEqual(["Miguel"]);
    const two = fit(font, "Maria Eduarda dos Santos", 40, 30, { max: 40, min: 12, maxLines: 2 });
    expect(two.lines.length).toBeLessThanOrEqual(2);
    expect(two.lines.join(" ")).toBe("Maria Eduarda dos Santos");
    expect(two.size).toBeGreaterThanOrEqual(12);
  });
});
