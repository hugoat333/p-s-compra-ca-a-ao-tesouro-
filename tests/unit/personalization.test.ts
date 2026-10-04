import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { POST as webhook } from "@/app/api/webhooks/checkout/route";
import { POST as lookup } from "@/app/api/orders/lookup/route";
import { POST as status } from "@/app/api/orders/status/route";
import { POST as personalize } from "@/app/api/personalization/route";
import { GET as download } from "@/app/api/download/[token]/route";
import { setOrderRepositoryForTests } from "@/lib/db";
import type { OrderRepository } from "@/lib/db/types";
import { setEmailServiceForTests, type EmailMessage, type EmailService } from "@/lib/mail/service";
import { personalizeAndDeliver, type DeliveryDeps } from "@/lib/server/delivery";
import { resetRateLimits } from "@/lib/server/rateLimit";
import { generateAccessToken } from "@/lib/server/tokens";
import { PRODUCT_ID, jsonRequest, makeFixtureKits, paidPayload, repoFactories, setTestEnv, webhookRequest } from "./helpers";

class FakeEmail implements EmailService {
  enabled = true;
  all: EmailMessage[] = [];
  async send(m: EmailMessage) {
    this.all.push(m);
  }
  /** E-mails de entrega (aventura pronta). */
  get sent() {
    return this.all.filter((m) => m.subject.startsWith("A aventura de"));
  }
  get access() {
    return this.all.filter((m) => m.subject.startsWith("Compra confirmada"));
  }
}

let kitsDir: string;
beforeAll(async () => {
  kitsDir = await makeFixtureKits();
});

function dl(token: string) {
  return download(new Request(`http://localhost/api/download/${token}`, { headers: { "x-forwarded-for": "10.9.9.9" } }), {
    params: Promise.resolve({ token }),
  });
}

for (const factory of repoFactories()) {
  describe(`personalização e entrega (${factory.name})`, () => {
    let repo: OrderRepository;
    let email: FakeEmail;

    beforeEach(async () => {
      setTestEnv(kitsDir);
      resetRateLimits();
      repo = await factory.create();
      setOrderRepositoryForTests(repo);
      email = new FakeEmail();
      setEmailServiceForTests(email);
    });
    afterAll(async () => {
      setOrderRepositoryForTests(undefined);
      setEmailServiceForTests(undefined);
      await factory.close();
    });

    async function buy(paymentId = "pay_flow", mail = "ana@example.com") {
      await webhook(webhookRequest(paidPayload({ paymentId, email: mail })));
      const res = await lookup(jsonRequest("/api/orders/lookup", { email: mail.toUpperCase() }));
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.order).toEqual({ personalization: "pending", theme: null, childName: null, ready: false, failed: false, emailSent: false });
      // A visão pública nunca expõe e-mail nem payment_id.
      expect(JSON.stringify(body)).not.toContain(paymentId);
      expect(JSON.stringify(body)).not.toContain("example.com");
      return body.token as string;
    }

    it("fluxo completo: lookup → personaliza → gera → e-mail → download", async () => {
      const token = await buy();
      const res = await personalize(jsonRequest("/api/personalization", { token, childName: "  Miguel ", theme: "dinossauros" }));
      expect(res.status).toBe(200);
      const { order } = await res.json();
      expect(order).toEqual({ personalization: "completed", theme: "dinossauros", childName: "Miguel", ready: true, failed: false, emailSent: true });

      const saved = await repo.findByToken(token);
      expect(saved).toMatchObject({ childName: "Miguel", theme: "dinossauros", personalizationStatus: "completed", deliveryStatus: "delivered" });
      expect(saved!.personalizedAt).toBeInstanceOf(Date);
      expect(saved!.emailSentAt).toBeInstanceOf(Date);

      expect(email.sent).toHaveLength(1);
      expect(email.sent[0].subject).toBe("A aventura de Miguel está pronta! 🎉");
      expect(email.sent[0].to).toBe("ana@example.com");
      expect(email.sent[0].html).toContain(`https://aventura.test/personalizar?t=${token}`);
      expect(email.sent[0].html).toContain("ACESSAR MINHA AVENTURA");
      expect(email.sent[0].text).toContain("Dinossauros");

      const file = await dl(token);
      expect(file.status).toBe(200);
      expect(file.headers.get("content-type")).toBe("application/pdf");
      expect(file.headers.get("content-disposition")).toContain('filename="o-tesouro-de-miguel.pdf"');
      const bytes = new Uint8Array(await file.arrayBuffer());
      expect(String.fromCharCode(...bytes.slice(0, 5))).toBe("%PDF-");

      // 24. Reabrir o link do e-mail baixa o mesmo produto, sem refazer a personalização.
      const again = await dl(token);
      expect(again.status).toBe(200);
    });

    it("e-mail de acesso pós-pagamento é enviado uma única vez (mesmo com webhook repetido)", async () => {
      await webhook(webhookRequest(paidPayload({ paymentId: "acc_1" })));
      await webhook(webhookRequest(paidPayload({ paymentId: "acc_1" })));
      await webhook(webhookRequest(paidPayload({ event: "card.paid", paymentId: "acc_1" })));
      expect(email.access).toHaveLength(1);
      const order = await repo.findPaidForEmail("ana@example.com", PRODUCT_ID);
      expect(email.access[0].html).toContain(`https://aventura.test/personalizar?t=${order!.downloadToken}`);
      expect(email.access[0].to).toBe("ana@example.com");
    });

    it("sem e-mail configurado: não finge envio", async () => {
      setEmailServiceForTests(undefined); // EMAIL_HOST vazio => serviço desativado
      const token = await buy("pay_noemail");
      const { order } = await (await personalize(jsonRequest("/api/personalization", { token, childName: "Lia", theme: "fadas" }))).json();
      expect(order.ready).toBe(true);
      expect(order.emailSent).toBe(false);
      expect((await repo.findByToken(token))!.deliveryStatus).toBe("generated");
    });

    it("9. tema inválido é rejeitado no servidor", async () => {
      const token = await buy();
      for (const theme of ["piratas", "../espaco", "", null]) {
        const res = await personalize(jsonRequest("/api/personalization", { token, childName: "Miguel", theme }));
        expect(res.status).toBe(400);
      }
      expect((await repo.findByToken(token))!.personalizationStatus).toBe("pending");
    });

    it("10. nome vazio ou com HTML é rejeitado no servidor", async () => {
      const token = await buy();
      for (const childName of ["", "   ", "<script>x</script>"]) {
        const res = await personalize(jsonRequest("/api/personalization", { token, childName, theme: "espaco" }));
        expect(res.status).toBe(400);
      }
      expect((await repo.findByToken(token))!.personalizationStatus).toBe("pending");
    });

    it("24. refresh após personalização recupera o produto (status e lookup)", async () => {
      const token = await buy();
      await personalize(jsonRequest("/api/personalization", { token, childName: "Miguel", theme: "princesas" }));
      const s = await (await status(jsonRequest("/api/orders/status", { token }))).json();
      expect(s.order).toMatchObject({ personalization: "completed", theme: "princesas", childName: "Miguel", ready: true });
      const l = await (await lookup(jsonRequest("/api/orders/lookup", { email: "ana@example.com" }))).json();
      expect(l.token).toBe(token);
      expect(l.order.personalization).toBe("completed");
    });

    it("25. double click não duplica geração, personalização nem e-mail", async () => {
      const token = await buy();
      const results = await Promise.all(
        ["Miguel", "Miguel", "Outro Nome"].map((childName) =>
          personalize(jsonRequest("/api/personalization", { token, childName, theme: "sereias" })),
        ),
      );
      for (const r of results) expect(r.status).toBe(200);
      const bodies = await Promise.all(results.map((r) => r.json()));
      for (const b of bodies) expect(b.order.childName).toBe("Miguel");
      expect(email.sent).toHaveLength(1);
      expect((await repo.findByToken(token))!.childName).toBe("Miguel");

      // Nível de serviço: gerações simultâneas viram uma só.
      const t2 = await buy("pay_dbl2");
      let generations = 0;
      const deps: DeliveryDeps = {
        repo, email, appUrl: "https://aventura.test", productId: PRODUCT_ID,
        generatePdf: async () => {
          generations++;
          await new Promise((r) => setTimeout(r, 30));
          return new Uint8Array([1]);
        },
      };
      await Promise.all([1, 2, 3].map(() => personalizeAndDeliver(deps, { token: t2, childName: "Miguel", theme: "espaco" })));
      expect(generations).toBe(1);
      // Depois de pronto, um novo submit não gera de novo.
      await personalizeAndDeliver(deps, { token: t2, childName: "Miguel", theme: "espaco" });
      expect(generations).toBe(1);
    });

    it("personalização concluída não pode ser trocada", async () => {
      const token = await buy();
      await personalize(jsonRequest("/api/personalization", { token, childName: "Miguel", theme: "futebol" }));
      const r = await (await personalize(jsonRequest("/api/personalization", { token, childName: "Pedro", theme: "fadas" }))).json();
      expect(r.order).toMatchObject({ childName: "Miguel", theme: "futebol" });
    });

    it("27. falha na geração mantém a personalização e permite tentar de novo", async () => {
      const token = await buy();
      let fail = true;
      const deps: DeliveryDeps = {
        repo, email, appUrl: "https://aventura.test", productId: PRODUCT_ID,
        generatePdf: async () => {
          if (fail) throw new Error("disco cheio");
          return new Uint8Array([1]);
        },
      };
      await expect(personalizeAndDeliver(deps, { token, childName: "Miguel", theme: "espaco" })).rejects.toThrow();
      const failed = await repo.findByToken(token);
      expect(failed).toMatchObject({ childName: "Miguel", theme: "espaco", personalizationStatus: "completed", deliveryStatus: "failed" });
      const s = await (await status(jsonRequest("/api/orders/status", { token }))).json();
      expect(s.order).toMatchObject({ personalization: "completed", ready: false, failed: true });

      fail = false;
      const ok = await personalizeAndDeliver(deps, { token, childName: "ignorado", theme: "fadas" });
      expect(ok).toMatchObject({ ready: true, childName: "Miguel", theme: "espaco" });
    });

    it("kit incompleto => delivery failed, sem placeholder", async () => {
      process.env.KITS_DIR = "/caminho/inexistente";
      const token = await buy();
      const res = await personalize(jsonRequest("/api/personalization", { token, childName: "Miguel", theme: "espaco" }));
      expect(res.status).toBe(500);
      expect(await res.json()).toEqual({ ok: false, code: "generation_failed" });
      expect((await repo.findByToken(token))!.deliveryStatus).toBe("failed");
    });

    it("22. download sem token / token inválido / token inexistente é bloqueado", async () => {
      expect((await dl("")).status).toBe(404);
      expect((await dl("../../etc/passwd")).status).toBe(404);
      expect((await dl(generateAccessToken())).status).toBe(404);
    });

    it("23. pedido reembolsado: download, status e personalização bloqueados", async () => {
      const token = await buy("pay_ref");
      await personalize(jsonRequest("/api/personalization", { token, childName: "Miguel", theme: "dinossauros" }));
      await webhook(webhookRequest(paidPayload({ event: "pix.refunded", status: "refunded", paymentId: "pay_ref" })));
      expect((await dl(token)).status).toBe(404);
      expect((await status(jsonRequest("/api/orders/status", { token }))).status).toBe(404);
      expect((await lookup(jsonRequest("/api/orders/lookup", { email: "ana@example.com" }))).status).toBe(404);
    });

    it("download antes de personalizar redireciona para /personalizar", async () => {
      const token = await buy();
      const res = await dl(token);
      expect(res.status).toBe(303);
      expect(res.headers.get("location")).toBe(`https://aventura.test/personalizar?t=${token}`);
    });

    it("26. e-mail sem compra: resposta genérica, sem dados", async () => {
      const res = await lookup(jsonRequest("/api/orders/lookup", { email: "ninguem@example.com" }));
      expect(res.status).toBe(404);
      expect(await res.json()).toEqual({ ok: false, code: "not_found" });
      expect((await lookup(jsonRequest("/api/orders/lookup", { email: "não-é-email" }))).status).toBe(400);
    });

    it("rate limit no lookup", async () => {
      const codes: number[] = [];
      for (let i = 0; i < 14; i++) codes.push((await lookup(jsonRequest("/api/orders/lookup", { email: `x${i}@ex.com` }, "10.7.7.7"))).status);
      expect(codes.filter((c) => c === 429).length).toBeGreaterThan(0);
    });

    it("compra de outro produto não libera", async () => {
      process.env.CHECKOUT_PRODUCT_ID = "outro";
      await webhook(webhookRequest(paidPayload({ paymentId: "x1", productId: "outro" })));
      process.env.CHECKOUT_PRODUCT_ID = PRODUCT_ID;
      expect((await lookup(jsonRequest("/api/orders/lookup", { email: "ana@example.com" }))).status).toBe(404);
    });
  });
}
