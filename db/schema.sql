-- Kalaland24 database schema (replaces the Strapi backend).
-- Safe to run repeatedly.

CREATE TABLE IF NOT EXISTS products (
  id                SERIAL PRIMARY KEY,
  document_id       TEXT NOT NULL UNIQUE,
  name_fa           TEXT NOT NULL DEFAULT '',
  name_en           TEXT NOT NULL DEFAULT '',
  brand             TEXT NOT NULL DEFAULT '',
  retail_price      NUMERIC,
  wholesale_price   NUMERIC,
  min_wholesale_qty INTEGER NOT NULL DEFAULT 1,
  category          TEXT NOT NULL DEFAULT '',
  business_types    JSONB,
  description_fa    TEXT,
  description_en    TEXT,
  stock_status      TEXT NOT NULL DEFAULT 'in_stock',
  featured          BOOLEAN NOT NULL DEFAULT FALSE,
  price_on_request  BOOLEAN NOT NULL DEFAULT FALSE,
  seo_title         TEXT,
  seo_description   TEXT,
  focus_keyword     TEXT,
  no_index          BOOLEAN NOT NULL DEFAULT FALSE,
  -- [{ url, width?, height?, formats? }] — images live on Cloudinary
  images            JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- false = hidden from the public site (draft)
  published         BOOLEAN NOT NULL DEFAULT TRUE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS articles (
  id              SERIAL PRIMARY KEY,
  document_id     TEXT NOT NULL UNIQUE,
  title_fa        TEXT NOT NULL,
  slug            TEXT NOT NULL UNIQUE,
  excerpt_fa      TEXT,
  content_fa      TEXT NOT NULL DEFAULT '',
  seo_title       TEXT,
  seo_description TEXT,
  cover           JSONB,
  published_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS orders (
  id               SERIAL PRIMARY KEY,
  document_id      TEXT NOT NULL UNIQUE,
  order_id         TEXT NOT NULL,
  type             TEXT NOT NULL,
  customer_name    TEXT NOT NULL,
  customer_phone   TEXT NOT NULL,
  customer_address TEXT NOT NULL,
  customer_email   TEXT,
  business_name    TEXT,
  notes            TEXT,
  items            JSONB NOT NULL DEFAULT '[]'::jsonb,
  total            NUMERIC,
  status           TEXT NOT NULL DEFAULT 'new',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reviews (
  id                  SERIAL PRIMARY KEY,
  document_id         TEXT NOT NULL UNIQUE,
  product_document_id TEXT NOT NULL,
  name                TEXT NOT NULL,
  rating              INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment             TEXT NOT NULL,
  approved            BOOLEAN NOT NULL DEFAULT FALSE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS reviews_product_idx ON reviews (product_document_id);

-- Bulk price changes, kept so they can be undone (was in-memory before).
CREATE TABLE IF NOT EXISTS price_changes (
  id               SERIAL PRIMARY KEY,
  category         TEXT NOT NULL,
  percentage       NUMERIC NOT NULL,
  products_updated INTEGER NOT NULL,
  can_undo         BOOLEAN NOT NULL DEFAULT TRUE,
  snapshot         JSONB NOT NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
