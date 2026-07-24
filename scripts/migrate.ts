import dotenv from "dotenv";
import fs from "node:fs/promises";
import path from "node:path";
import postgres from "postgres";

dotenv.config({ path: ".env.local" });
dotenv.config();

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is required");

const sql = postgres(databaseUrl, { prepare: false, max: 1 });
const migrationPath = path.join(
  process.cwd(),
  "supabase/migrations/202607240001_shravan_v01.sql",
);

try {
  const migration = await fs.readFile(migrationPath, "utf8");
  await sql.begin(async (transaction) => {
    await transaction.unsafe(migration);
  });
  console.log("Shravan migration applied.");
} finally {
  await sql.end({ timeout: 5 });
}
