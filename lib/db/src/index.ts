import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

// Prefer SUPABASE_DATABASE_URL when set (production), fall back to Replit-managed DATABASE_URL (dev)
const supabaseUrl = process.env.SUPABASE_DATABASE_URL;
const connectionString = supabaseUrl ?? process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "SUPABASE_DATABASE_URL or DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Supabase requires the region-specific pooler host; the stored URL may point to the
// wrong region, so we parse credentials and connect with explicit params.
let poolConfig: ConstructorParameters<typeof Pool>[0];
if (supabaseUrl) {
  const parsed = new URL(supabaseUrl);
  poolConfig = {
    host: "aws-0-us-west-2.pooler.supabase.com",
    port: 5432,
    user: parsed.username,
    password: decodeURIComponent(parsed.password),
    database: "postgres",
    ssl: { rejectUnauthorized: false },
  };
} else {
  poolConfig = { connectionString };
}

export const pool = new Pool(poolConfig);
export const db = drizzle(pool, { schema });

export * from "./schema";
