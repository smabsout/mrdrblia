/**
 * Pushes the schema to Supabase directly via SQL.
 * Run with: node lib/db/push-supabase.mjs
 */
import pg from "pg";

const url = process.env.SUPABASE_DATABASE_URL;
if (!url) {
  console.error("SUPABASE_DATABASE_URL is not set");
  process.exit(1);
}

const { Client } = pg;
// Parse and reconstruct with correct region (us-west-2 / Oregon)
const parsed = new URL(url);
const client = new Client({
  host: 'aws-0-us-west-2.pooler.supabase.com',
  port: 5432,
  user: parsed.username,
  password: decodeURIComponent(parsed.password),
  database: 'postgres',
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 15000,
});

const DDL = `
CREATE TABLE IF NOT EXISTS users (
  id               SERIAL PRIMARY KEY,
  email            TEXT NOT NULL UNIQUE,
  password_hash    TEXT NOT NULL,
  display_name     TEXT,
  role             TEXT NOT NULL DEFAULT 'user',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS items (
  id               SERIAL PRIMARY KEY,
  slug             TEXT NOT NULL UNIQUE,
  name             TEXT NOT NULL,
  category         TEXT NOT NULL,
  subcategory      TEXT,
  description      TEXT,
  provenance_notes TEXT,
  year             INTEGER,
  source_event     TEXT,
  authenticator    TEXT,
  image_urls       TEXT[] NOT NULL DEFAULT '{}',
  notoriety_tier   TEXT,
  purchase_price   NUMERIC(10,2),
  purchase_date    DATE,
  purchase_source  TEXT,
  owned            BOOLEAN NOT NULL DEFAULT TRUE,
  created_by       INTEGER REFERENCES users(id),
  status           TEXT NOT NULL DEFAULT 'pending',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sales (
  id                    SERIAL PRIMARY KEY,
  item_id               INTEGER NOT NULL REFERENCES items(id),
  sale_price            NUMERIC(10,2) NOT NULL,
  sale_date             DATE NOT NULL,
  sale_source           TEXT NOT NULL,
  source_name           TEXT,
  condition_grade       TEXT,
  authentication_status TEXT,
  verified              BOOLEAN NOT NULL DEFAULT FALSE,
  notes                 TEXT,
  entered_by            INTEGER REFERENCES users(id),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS comp_matches (
  id               SERIAL PRIMARY KEY,
  item_id          INTEGER REFERENCES items(id),
  comp_item_id     INTEGER REFERENCES items(id),
  similarity_score NUMERIC(4,3),
  match_reason     TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS valuation_cache (
  item_id          INTEGER PRIMARY KEY REFERENCES items(id),
  low_estimate     NUMERIC(10,2),
  median_estimate  NUMERIC(10,2),
  high_estimate    NUMERIC(10,2),
  confidence       TEXT,
  tier_used        TEXT,
  sample_size      INTEGER,
  computed_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS watchlist (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER REFERENCES users(id),
  item_id    INTEGER REFERENCES items(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, item_id)
);

CREATE TABLE IF NOT EXISTS conversations (
  id         SERIAL PRIMARY KEY,
  title      TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS messages (
  id              SERIAL PRIMARY KEY,
  conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role            TEXT NOT NULL,
  content         TEXT NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
`;

try {
  console.log("Connecting to Supabase...");
  await client.connect();
  console.log("Connected. Applying schema...");
  await client.query(DDL);
  console.log("✓ Schema applied successfully — all 8 tables created (if not already present).");
} catch (err) {
  console.error("Error:", err.message);
  process.exit(1);
} finally {
  await client.end();
}
