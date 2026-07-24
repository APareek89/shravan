import dotenv from "dotenv";
import postgres from "postgres";

dotenv.config({ path: ".env.local" });
dotenv.config();

const databaseUrl = process.env.DATABASE_URL;
const cronSecret = process.env.CRON_SECRET;
const appUrl = process.env.APP_URL ?? "http://localhost:3000";
if (!databaseUrl || !cronSecret) throw new Error("DATABASE_URL and CRON_SECRET are required");

const sql = postgres(databaseUrl, { prepare: false, max: 1 });
const TEST_ELDER_ID = "33333333-3333-4333-8333-333333333333";
const TEST_GUARDIAN_ID = "22222222-2222-4222-8222-222222222222";
const DEMO_ELDER_ID = "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee";

const today = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Kolkata",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
}).format(new Date());

async function call(path: string, authorized = true) {
  return fetch(`${appUrl}${path}`, {
    headers: authorized ? { authorization: `Bearer ${cronSecret}` } : {},
  });
}

try {
  const unauthorized = await call("/api/cron/escalations", false);
  if (unauthorized.status !== 401) {
    throw new Error(`Cron without secret returned ${unauthorized.status}, expected 401`);
  }

  await sql`
    insert into shravan.elders (
      id, guardian_id, name, nickname, city, language, invite_token, invite_expires_at
    )
    values (
      ${TEST_ELDER_ID}, ${TEST_GUARDIAN_ID}, 'Cron Test Elder', 'Cron Test',
      'Indore', 'en', 'cron-test-only', now() + interval '1 hour'
    )
    on conflict (id) do update set guardian_id = excluded.guardian_id
  `;

  const escalationPath = `/api/cron/escalations?now=${encodeURIComponent(`${today}T15:00:00.000Z`)}`;
  const firstEscalation = await call(escalationPath);
  if (!firstEscalation.ok) {
    throw new Error(`Escalation cron failed: ${await firstEscalation.text()}`);
  }
  await call(escalationPath);
  const [missed] = await sql<{ count: number }[]>`
    select count(*)::int as count
    from shravan.alerts
    where elder_id = ${TEST_ELDER_ID} and kind = 'MISSED_CHECKIN'
      and dedupe_key = ${`missed:${TEST_ELDER_ID}:${today}`}
  `;
  if (missed.count !== 1) {
    throw new Error(`Missed check-in idempotency expected 1 alert, got ${missed.count}`);
  }

  await sql`
    insert into shravan.checkins (elder_id, checkin_date, mood_score, summary)
    values
      (${TEST_ELDER_ID}, ${today}::date - 1, 2, 'Low mood test day one.'),
      (${TEST_ELDER_ID}, ${today}, 2, 'Low mood test day two.')
    on conflict (elder_id, checkin_date)
    do update set mood_score = excluded.mood_score, summary = excluded.summary
  `;
  const lowMoodRun = await call(escalationPath);
  if (!lowMoodRun.ok) throw new Error(`Low mood cron failed: ${await lowMoodRun.text()}`);
  const [lowMood] = await sql<{ count: number }[]>`
    select count(*)::int as count
    from shravan.alerts
    where elder_id = ${TEST_ELDER_ID} and kind = 'LOW_MOOD'
  `;
  if (lowMood.count !== 1) {
    throw new Error(`Low mood idempotency expected 1 alert, got ${lowMood.count}`);
  }

  await sql`delete from shravan.elders where id = ${TEST_ELDER_ID}`;

  const digestRun = await call(
    `/api/cron/digest?now=${encodeURIComponent(`${today}T12:30:00.000Z`)}`,
  );
  if (!digestRun.ok) throw new Error(`Digest cron failed: ${await digestRun.text()}`);
  const [digest] = await sql<{ count: number }[]>`
    select count(*)::int as count
    from shravan.digests
    where elder_id = ${DEMO_ELDER_ID}
  `;
  if (digest.count < 1) throw new Error("Digest cron did not persist a digest");

  console.log(
    "Cron checks passed: Bearer auth, missed check-in, low mood, idempotency, and persisted digest.",
  );
} finally {
  await sql`delete from shravan.elders where id = ${TEST_ELDER_ID}`.catch(() => undefined);
  await sql.end({ timeout: 5 });
}

