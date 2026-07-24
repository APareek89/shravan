import dotenv from "dotenv";
import postgres from "postgres";

dotenv.config({ path: ".env.local" });
dotenv.config();

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is required");

const sql = postgres(databaseUrl, { prepare: false, max: 1 });
const GUARDIAN_A = "11111111-1111-4111-8111-111111111111";
const GUARDIAN_B = "22222222-2222-4222-8222-222222222222";
const ELDER_ID = "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee";

async function visibleElders(userId: string) {
  return sql.begin(async (transaction) => {
    await transaction`select set_config('request.jwt.claims', ${JSON.stringify({
      sub: userId,
      role: "authenticated",
    })}, true)`;
    await transaction.unsafe("set local role authenticated");
    return transaction`
      select id from shravan.elders where id = ${ELDER_ID}
    `;
  });
}

try {
  const guardianARows = await visibleElders(GUARDIAN_A);
  const guardianBRows = await visibleElders(GUARDIAN_B);
  if (guardianARows.length !== 1) {
    throw new Error(`Guardian A expected 1 Elder, got ${guardianARows.length}`);
  }
  if (guardianBRows.length !== 0) {
    throw new Error(`RLS breach: Guardian B saw ${guardianBRows.length} Elder rows`);
  }
  console.log("RLS isolation passed: Guardian A sees Sushila; Guardian B sees zero rows.");
} finally {
  await sql.end({ timeout: 5 });
}

