import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { POST } from "@/app/api/webhooks/checkout/route";
import { setOrderRepositoryForTests } from "@/lib/db";
import type { OrderRepository } from "@/lib/db/types";
import { PRODUCT_ID, SECRET, paidPayload, repoFactories, setTestEnv, webhookRequest } from "./helpers";

for (const factory of repoFactories()) {
  describe(`webhook do checkout (${factory.name})`, () => {
    let repo: OrderRepository;

    beforeEach(async () => {
      setTestEnv();
      repo = await factory.create();
      setOrderRepositoryForTests(repo);
    });
    afterAll(async () => {
      setOrderRepositoryForTests(undefined);
      await factory.close();
    });

    const tokenOf = async (paymentId: string) => {
      const found = await repo.findPaidForEmail("ana@example.com", PRODUCT_ID);
      return found?.paymentId === paymentId ? found : null;
    };

    it("1. pix.paid cria pedido aprovado", async () => {
      const res = await POST(webhookRequest(paidPayload({ event: "pix.paid", paymentId: "pix_1" })));
      expect(res.status).toBe(200);
      expect(await res.json()).toMatchObject({ ok: true, action: "created" });
      const order = await tokenOf("pix_1");
      expect(order).toMatchObject({
        paymentId: "pix_1",
        productId: PRODUCT_ID,
        paymentStatus: "paid",
        customerEmail: "ana@example.com",
        customerName: "Ana Souza",
        personalizationStatus: "pending",
        deliveryStatus: "pending",
        childName: null,
        theme: null,
      });
      expect(order!.downloadToken).toMatch(/^[A-Za-z0-9_-]{43}$/);
      expect(order!.paidAt).toBeInstanceOf(Date);
    });

    it("2. card.paid cria pedido aprovado", async () => {
      const res = await POST(webhookRequest(paidPayload({ event: "card.paid", paymentId: "card_1" })));
      expect(res.status).toBe(200);
      expect((await tokenOf("card_1"))?.paymentStatus).toBe("paid");
    });

    it("3. evento duplicado não cria segundo pedido nem troca o token", async () => {
      await POST(webhookRequest(paidPayload({ paymentId: "dup_1" })));
      const first = await tokenOf("dup_1");
      const res = await POST(webhookRequest(paidPayload({ paymentId: "dup_1" })));
      expect(res.status).toBe(200);
      expect(await res.json()).toMatchObject({ ok: true, action: "updated" });
      const second = await tokenOf("dup_1");
      expect(second!.id).toBe(first!.id);
      expect(second!.downloadToken).toBe(first!.downloadToken);
      // Mesmo pedido concorrente: ainda um único registro.
      await Promise.all([1, 2, 3].map(() => POST(webhookRequest(paidPayload({ paymentId: "dup_2" })))));
      const r1 = await repo.upsertPayment({
        paymentId: "dup_2", productId: PRODUCT_ID, customerName: null, customerEmail: null,
        paymentStatus: "paid", amount: null, paidAt: null, newToken: "x".repeat(43),
      });
      expect(r1.inserted).toBe(false);
    });

    it("4. pending não libera produto", async () => {
      const res = await POST(webhookRequest(paidPayload({ status: "pending", paymentId: "pend_1" })));
      expect(res.status).toBe(200);
      expect(await res.json()).toMatchObject({ action: "ignored" });
      expect(await tokenOf("pend_1")).toBeNull();
    });

    it("5. failed não libera produto", async () => {
      const res = await POST(webhookRequest(paidPayload({ event: "card.paid", status: "failed", paymentId: "fail_1" })));
      expect(await res.json()).toMatchObject({ action: "ignored" });
      expect(await tokenOf("fail_1")).toBeNull();
    });

    it("6. refunded altera status (sem apagar) e reenvio atrasado de paid não reativa", async () => {
      await POST(webhookRequest(paidPayload({ paymentId: "ref_1" })));
      const before = await tokenOf("ref_1");
      const res = await POST(webhookRequest(paidPayload({ event: "pix.refunded", status: "refunded", paymentId: "ref_1" })));
      expect(res.status).toBe(200);
      const after = await repo.findByToken(before!.downloadToken);
      expect(after).toMatchObject({ id: before!.id, paymentStatus: "refunded" });
      expect(after!.refundedAt).toBeInstanceOf(Date);

      await POST(webhookRequest(paidPayload({ event: "pix.paid", paymentId: "ref_1" })));
      expect((await repo.findByToken(before!.downloadToken))!.paymentStatus).toBe("refunded");

      await POST(webhookRequest(paidPayload({ paymentId: "cb_1", event: "card.paid" })));
      const cb = await tokenOf("cb_1");
      await POST(webhookRequest(paidPayload({ event: "card.chargeback", status: "charged_back", paymentId: "cb_1" })));
      expect((await repo.findByToken(cb!.downloadToken))!.paymentStatus).toBe("charged_back");
    });

    it("card.refunded também é tratado", async () => {
      await POST(webhookRequest(paidPayload({ event: "card.paid", paymentId: "ref_2" })));
      const o = await tokenOf("ref_2");
      await POST(webhookRequest(paidPayload({ event: "card.refunded", status: "refunded", paymentId: "ref_2" })));
      expect((await repo.findByToken(o!.downloadToken))!.paymentStatus).toBe("refunded");
    });

    it("7. secret incorreto retorna 401 (Bearer e x-secret)", async () => {
      expect((await POST(webhookRequest(paidPayload(), { authorization: "Bearer errado" }))).status).toBe(401);
      expect((await POST(webhookRequest(paidPayload(), { "x-secret": "errado" }))).status).toBe(401);
      expect((await POST(webhookRequest(paidPayload(), {}))).status).toBe(401);
      expect(await tokenOf("pay_001")).toBeNull();
      // x-secret correto é aceito
      expect((await POST(webhookRequest(paidPayload({ paymentId: "xs_1" }), { "x-secret": SECRET }))).status).toBe(200);
    });

    it("8. product.id incorreto não libera produto", async () => {
      const res = await POST(webhookRequest(paidPayload({ productId: "outro_produto", paymentId: "other_1" })));
      expect(res.status).toBe(200);
      expect(await res.json()).toMatchObject({ action: "ignored" });
      expect(await repo.findPaidForEmail("ana@example.com", "outro_produto")).toBeNull();
      expect(await tokenOf("other_1")).toBeNull();
    });

    it("product.type diferente de \"main\" (padrão ggCheckout) não libera", async () => {
      const p = paidPayload({ paymentId: "type_1" });
      p.product.type = "order_bump";
      expect(await (await POST(webhookRequest(p))).json()).toMatchObject({ action: "ignored" });
      expect(await tokenOf("type_1")).toBeNull();
    });

    it("aceita o produto principal dentro de products[] (estrutura oficial)", async () => {
      const p = paidPayload({ paymentId: "arr_1" }) as Record<string, unknown>;
      delete p.product;
      p.products = [{ id: "bump_x", type: "order_bump" }, { id: PRODUCT_ID, type: "main" }];
      expect(await (await POST(webhookRequest(p))).json()).toMatchObject({ action: "created" });
      expect((await tokenOf("arr_1"))?.paymentStatus).toBe("paid");
    });

    it("pagamento real malformado retorna 400; corpo sem pagamento é verificação (200)", async () => {
      expect((await POST(webhookRequest({ event: "card.paid", payment: { id: "x1", status: "paid" } }))).status).toBe(400);
      expect((await POST(webhookRequest("{nao é json"))).status).toBe(200);
      expect((await POST(webhookRequest({ event: "pix.paid" }))).status).toBe(200);
      expect(await tokenOf("x1")).toBeNull();
    });

    it("não armazena documento, IP nem código PIX", async () => {
      await POST(webhookRequest(paidPayload({ paymentId: "priv_1" })));
      const o = await tokenOf("priv_1");
      const serialized = JSON.stringify(o);
      expect(serialized).not.toContain("123.456.789-00");
      expect(serialized).not.toContain("200.1.2.3");
      expect(serialized).not.toContain("SEGREDO");
    });
  });
}

describe("webhook sem CHECKOUT_PRODUCT_ID (primeiro deploy)", () => {
  it("aceita requisição autenticada, não cria pedido e não libera nada", async () => {
    const { MemoryOrderRepository } = await import("@/lib/db/memory");
    const repo = new MemoryOrderRepository();
    setTestEnv();
    delete process.env.CHECKOUT_PRODUCT_ID;
    setOrderRepositoryForTests(repo);
    try {
      const res = await POST(webhookRequest(paidPayload({ paymentId: "disc_1" })));
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ ok: true, action: "ignored", reason: "product_not_configured" });
      expect(repo.rows).toHaveLength(0);
      // secret continua obrigatório
      expect((await POST(webhookRequest(paidPayload(), { authorization: "Bearer errado" }))).status).toBe(401);
      expect((await POST(webhookRequest("{x"))).status).toBe(200); // verificação
      expect(repo.rows).toHaveLength(0);
      // lookup também não libera
      const { POST: lookup } = await import("@/app/api/orders/lookup/route");
      const { jsonRequest } = await import("./helpers");
      expect((await lookup(jsonRequest("/api/orders/lookup", { email: "ana@example.com" }, "10.55.0.1"))).status).toBe(404);
    } finally {
      setOrderRepositoryForTests(undefined);
      setTestEnv();
    }
  });

  it("sem secret o endpoint fica fechado", async () => {
    setTestEnv();
    delete process.env.CHECKOUT_WEBHOOK_SECRET;
    try {
      expect((await POST(webhookRequest(paidPayload()))).status).toBe(500);
    } finally {
      setTestEnv();
    }
  });
});

describe("verificação do cadastro do webhook (ggCheckout)", () => {
  const raw = (body: string, headers: Record<string, string> = { authorization: `Bearer ${SECRET}` }) =>
    new Request("http://localhost/api/webhooks/checkout", { method: "POST", headers, body });

  async function withRepo(fn: (repo: import("@/lib/db/memory").MemoryOrderRepository) => Promise<void>) {
    const { MemoryOrderRepository } = await import("@/lib/db/memory");
    const repo = new MemoryOrderRepository();
    setTestEnv();
    setOrderRepositoryForTests(repo);
    try {
      await fn(repo);
    } finally {
      setOrderRepositoryForTests(undefined);
    }
  }

  const TESTS: [string, string][] = [
    ["corpo vazio", ""],
    ["JSON vazio", "{}"],
    ["texto puro", "ping"],
    ["form-urlencoded", "test=1"],
    ["evento de teste", JSON.stringify({ event: "webhook.test" })],
    ["evento test com amostra completa", JSON.stringify({ ...paidPayload({ paymentId: "sample_1" }), event: "test" })],
    ["flag test", JSON.stringify({ test: true })],
    ["amostra sem payment", JSON.stringify({ event: "pix.paid", customer: { name: "Teste" } })],
    ["array", "[]"],
  ];

  for (const [name, body] of TESTS) {
    it(`autenticado + ${name} → 200 verification, nada gravado`, async () => {
      await withRepo(async (repo) => {
        const res = await POST(raw(body));
        expect(res.status).toBe(200);
        expect(await res.json()).toEqual({ ok: true, action: "verification" });
        expect(repo.rows).toHaveLength(0);
      });
    });
  }

  it("verificação continua exigindo secret (sem secret ou errado → 401)", async () => {
    await withRepo(async () => {
      expect((await POST(raw("", {}))).status).toBe(401);
      expect((await POST(raw("{}", { "x-secret": "errado" }))).status).toBe(401);
    });
  });

  it("pagamento real malformado continua 400", async () => {
    await withRepo(async (repo) => {
      const body = JSON.stringify({ event: "pix.paid", payment: { id: "p_1", status: "paid" } }); // sem product
      const res = await POST(raw(body));
      expect(res.status).toBe(400);
      expect(repo.rows).toHaveLength(0);
    });
  });

  it("pagamento real válido continua criando pedido", async () => {
    await withRepo(async (repo) => {
      const res = await POST(raw(JSON.stringify(paidPayload({ paymentId: "real_1" }))));
      expect(await res.json()).toMatchObject({ ok: true, action: "created" });
      expect(repo.rows).toHaveLength(1);
    });
  });

  it("verificação no modo de descoberta (sem CHECKOUT_PRODUCT_ID) também responde 200", async () => {
    await withRepo(async (repo) => {
      delete process.env.CHECKOUT_PRODUCT_ID;
      expect((await POST(raw(""))).status).toBe(200);
      expect(await (await POST(raw(JSON.stringify(paidPayload())))).json()).toMatchObject({ reason: "product_not_configured" });
      expect(repo.rows).toHaveLength(0);
      setTestEnv();
    });
  });

  it("GET e HEAD respondem 200 sem dados", async () => {
    const { GET, HEAD } = await import("@/app/api/webhooks/checkout/route");
    expect(GET().status).toBe(200);
    expect(HEAD().status).toBe(200);
  });

  it("log de diagnóstico não contém valores sensíveis", async () => {
    const logs: string[] = [];
    const orig = console.log;
    console.log = (l: string) => logs.push(l);
    try {
      await withRepo(async () => {
        await POST(raw(JSON.stringify({ hello: "segredo-valor", customer: { email: "x@y.com", document: "123" } })));
      });
    } finally {
      console.log = orig;
    }
    const line = logs.join("\n");
    expect(line).toContain("webhook.verification");
    expect(line).not.toContain("segredo-valor");
    expect(line).not.toContain("x@y.com");
    expect(line).not.toContain(SECRET);
  });
});
