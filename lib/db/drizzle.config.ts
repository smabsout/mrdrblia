import { defineConfig } from "drizzle-kit";
import path from "path";

// Always use the Replit-managed dev DATABASE_URL for migrations.
// Production (Supabase) schema is managed via push-supabase.mjs.
const url = process.env.DATABASE_URL;

if (!url) {
  throw new Error("DATABASE_URL must be set");
}

export default defineConfig({
  schema: path.join(__dirname, "./src/schema/index.ts"),
  dialect: "postgresql",
  dbCredentials: { url },
});
