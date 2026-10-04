-- Pedidos de "O Tesouro do Dia das Crianças".
-- Guardamos apenas o necessário para a operação (sem CPF, IP, código PIX ou dados bancários).
CREATE TABLE IF NOT EXISTS orders (
  id                     BIGSERIAL PRIMARY KEY,
  payment_id             TEXT        NOT NULL,
  product_id             TEXT        NOT NULL,
  customer_name          TEXT,
  customer_email         TEXT,
  payment_status         TEXT        NOT NULL,
  amount                 NUMERIC(12, 2),
  child_name             TEXT,
  theme                  TEXT,
  personalization_status TEXT        NOT NULL DEFAULT 'pending',
  delivery_status        TEXT        NOT NULL DEFAULT 'pending',
  download_token         TEXT        NOT NULL,
  paid_at                TIMESTAMPTZ,
  refunded_at            TIMESTAMPTZ,
  personalized_at        TIMESTAMPTZ,
  email_sent_at          TIMESTAMPTZ,
  access_email_sent_at   TIMESTAMPTZ,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT orders_payment_id_key UNIQUE (payment_id),
  CONSTRAINT orders_download_token_key UNIQUE (download_token),
  CONSTRAINT orders_payment_status_check CHECK (payment_status IN ('paid', 'refunded', 'charged_back')),
  CONSTRAINT orders_personalization_status_check CHECK (personalization_status IN ('pending', 'completed')),
  CONSTRAINT orders_delivery_status_check CHECK (delivery_status IN ('pending', 'generated', 'delivered', 'failed')),
  CONSTRAINT orders_theme_check CHECK (theme IS NULL OR theme IN ('dinossauros', 'espaco', 'futebol', 'princesas', 'fadas', 'sereias')),
  CONSTRAINT orders_personalization_consistency CHECK (
    (personalization_status = 'pending' AND child_name IS NULL AND theme IS NULL)
    OR (personalization_status = 'completed' AND child_name IS NOT NULL AND theme IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS orders_customer_email_idx ON orders (customer_email, product_id, payment_status);
CREATE INDEX IF NOT EXISTS orders_created_at_idx ON orders (created_at DESC);
