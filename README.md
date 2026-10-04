# O Tesouro do Dia das Crianças — Pós-compra e entrega automática

Aplicação independente (Next.js 15 + TypeScript + PostgreSQL + pdf-lib). A landing page e o checkout ficam onde estão
hoje; o checkout só precisa (1) chamar o webhook e (2) redirecionar para `/personalizar`.

```
Checkout aprovado ──► POST /api/webhooks/checkout  (registra o pedido, idempotente por payment.id)
        │                         └─► e-mail "Compra confirmada" com link pessoal (se SMTP configurado)
        └─► redirect  /personalizar
                 ├─ cliente informa o e-mail da compra → backend confirma payment_status = paid
                 ├─ escolhe tema + nome → POST /api/personalization
                 ├─ servidor monta PDF: introdução (nome) + 8 pistas fixas + certificado (nome)
                 └─ GET /api/download/<token>  (token opaco; PDF regenerado sob demanda)
```

## Configuração

1. `cp .env.example .env.local` e preencha (ver comentários no arquivo).
2. `npm install`
3. `npm run db:migrate` (cria a tabela `orders`)
4. Adicione os kits em `kits/` (ver `kits/README.md`) → `npm run kits:check` → `npm run kits:thumbs`
5. `npm run dev` (local) ou deploy na Vercel (Root = este repo, variáveis de ambiente no painel).

### No painel do checkout

| Campo | Valor |
|---|---|
| URL do webhook | `https://SEU_DOMINIO/api/webhooks/checkout` |
| Eventos | `pix.paid`, `card.paid`, `pix.refunded`, `card.refunded` (e chargeback, se existir) |
| Secret | o mesmo de `CHECKOUT_WEBHOOK_SECRET` (enviado como `Authorization: Bearer` ou `x-secret`) |
| Redirecionamento pós-compra | `https://SEU_DOMINIO/personalizar` |

## Regras implementadas

- Só `pix.paid`/`card.paid` **com** `payment.status === "paid"` e `product.id === CHECKOUT_PRODUCT_ID` liberam o produto
  (`CHECKOUT_PRODUCT_TYPE` opcional filtra `product.type`). `pending`/`failed`/outros produtos: 200 e ignorados.
- `payment_id` UNIQUE; reenvios atualizam o mesmo registro. Um `paid` atrasado nunca reativa um pedido `refunded`/`charged_back`.
- Reembolso/chargeback: status muda, `refunded_at` é registrado, nada é apagado; download/acesso bloqueados.
- Não armazena CPF, IP, código PIX nem dados bancários. Logs JSON sem secrets; e-mails mascarados.
- Personalização concluída não pode ser trocada (evita reuso da compra para várias crianças).
- Double submit: bloqueado no botão, no banco (UPDATE condicional) e por deduplicação em memória.
- Falha na geração: personalização preservada, `delivery_status = failed`, botão "TENTAR NOVAMENTE".
- `delivery_status`: `generated` (PDF gerado) → `delivered` (e-mail enviado ou primeiro download).

## Suposições sobre o payload (CONFIRMAR com um evento real)

Ver `src/lib/checkout/payload.ts`. Aceitamos o evento em `event` ou `type`, dados na raiz ou em `data`,
comprador em `customer`/`buyer` (`name`, `email`), valor em `payment.amount`/`payment.value` e `product` ou `products[]`.
Se o provedor usar outros nomes, o ajuste é só nesse arquivo. Os logs `webhook.invalid_payload` mostram o motivo.

## Operação / consultas úteis

```sql
SELECT payment_id, customer_email, payment_status, theme, child_name,
       personalization_status, delivery_status, created_at
FROM orders ORDER BY created_at DESC LIMIT 50;
```

## Testes

```bash
npm test                                         # unitários/integração (memória)
TEST_DATABASE_URL=postgres://... npm test        # + mesmos testes contra Postgres real
E2E_DATABASE_URL=postgres://... npm run test:e2e # navegador: webhook → personalizar → PDF → download (4 temas)
npm run webhook:test -- --email voce@teste.com   # dispara um pix.paid falso contra APP_URL
```

## Limitações conhecidas

- Rate limit em memória (por instância serverless). Para limite global, trocar o store por Redis/Upstash (`src/lib/server/rateLimit.ts`).
- Sem identificador no redirect, a identificação é pelo e-mail da compra (+ link pessoal enviado por e-mail).
  Quem souber o e-mail do comprador consegue acessar o pedido dele; mitigado por rate limit.
