import dotenv from "dotenv";
import postgres from "postgres";

dotenv.config({ path: ".env.local" });
dotenv.config();

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is required");

const sql = postgres(databaseUrl, { prepare: false, max: 1 });
const GUARDIAN_ID = "11111111-1111-4111-8111-111111111111";
const OTHER_GUARDIAN_ID = "22222222-2222-4222-8222-222222222222";
const ELDER_ID = "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee";
const MEDICATIONS = [
  ["aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1", "Thyronorm", "50 mcg", "morning", "खाली पेट / empty stomach"],
  ["aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2", "Metformin", "500 mg", "morning", "नाश्ते के बाद / after breakfast"],
  ["aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3", "Amlodipine", "5 mg", "evening", "रोज़ एक ही समय / same time daily"],
  ["aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa4", "Calcium", "1 tablet", "night", "खाने के बाद / after dinner"],
] as const;

const dateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Kolkata",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

function daysAgo(days: number) {
  return dateFormatter.format(new Date(Date.now() - days * 86_400_000));
}

function mondayFor(dateString: string) {
  const date = new Date(`${dateString}T12:00:00+05:30`);
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() - day + 1);
  return date.toISOString().slice(0, 10);
}

try {
  await sql.begin(async (transaction) => {
    await transaction`
      insert into shravan.profiles (id, role, full_name, email, language, subscribed)
      values
        (${GUARDIAN_ID}, 'guardian', 'Ananya Sharma', 'demo@shravan.app', 'en', true),
        (${OTHER_GUARDIAN_ID}, 'guardian', 'Privacy Test Guardian', 'privacy@shravan.app', 'en', true)
      on conflict (id) do update
      set full_name = excluded.full_name, email = excluded.email, subscribed = true
    `;

    await transaction`
      insert into shravan.elders (
        id, guardian_id, name, nickname, city, language, interests,
        invite_token, invite_expires_at
      )
      values (
        ${ELDER_ID}, ${GUARDIAN_ID}, 'Sushila Sharma', 'Sushila', 'Indore', 'hi',
        ${["bhajans", "cooking", "cricket"]},
        'demo-sushila', now() + interval '1 year'
      )
      on conflict (id) do update
      set guardian_id = excluded.guardian_id,
          name = excluded.name,
          nickname = excluded.nickname,
          city = excluded.city,
          language = excluded.language,
          interests = excluded.interests,
          invite_token = excluded.invite_token,
          invite_expires_at = excluded.invite_expires_at
    `;

    for (const [id, name, dosage, slot, notes] of MEDICATIONS) {
      await transaction`
        insert into shravan.medications (
          id, elder_id, name, dosage, slot, notes, active, created_at
        )
        values (
          ${id}, ${ELDER_ID}, ${name}, ${dosage}, ${slot}, ${notes}, true,
          now() - interval '10 days'
        )
        on conflict (id) do update
        set name = excluded.name, dosage = excluded.dosage, slot = excluded.slot,
            notes = excluded.notes, active = true, created_at = excluded.created_at
      `;
    }

    const moods = [4, 4, 3, 2, 2, 3, 4, 4, 5, 4];
    for (let index = 9; index >= 0; index -= 1) {
      const date = daysAgo(index + 1);
      const mood = moods[9 - index];
      await transaction`
        insert into shravan.checkins (
          elder_id, checkin_date, slept_well, ate_meals, meals_note,
          mood_score, mobility_ok, pain_note, concerns, summary
        )
        values (
          ${ELDER_ID}, ${date}, ${mood >= 3}, true,
          ${mood <= 2 ? "हल्का खाना खाया" : "समय पर खाना खाया"},
          ${mood}, ${mood >= 3},
          ${mood <= 2 ? "घुटने में थोड़ी तकलीफ़" : null},
          ${mood <= 2 ? "दो दिन ऊर्जा कम थी" : null},
          ${mood <= 2 ? "ऊर्जा और मन थोड़ा कम था; परिवार से बात करने को कहा।" : "दिन सामान्य रहा, दवाइयाँ और खाना समय पर।"}
        )
        on conflict (elder_id, checkin_date) do update
        set mood_score = excluded.mood_score,
            summary = excluded.summary,
            slept_well = excluded.slept_well,
            mobility_ok = excluded.mobility_ok
      `;

      for (let medicationIndex = 0; medicationIndex < MEDICATIONS.length; medicationIndex += 1) {
        if ((index + medicationIndex) % 5 === 0) continue;
        const medicationId = MEDICATIONS[medicationIndex][0];
        await transaction`
          insert into shravan.med_logs (medication_id, elder_id, log_date)
          values (${medicationId}, ${ELDER_ID}, ${date})
          on conflict (medication_id, log_date) do nothing
        `;
      }
    }

    await transaction`
      insert into shravan.alerts (elder_id, kind, detail, dedupe_key, created_at)
      values (
        ${ELDER_ID}, 'SCAM_HIGH',
        '“Digital arrest” caller claimed to be police and asked for an urgent transfer.',
        'seed:scam-high',
        now() - interval '3 days'
      )
      on conflict (dedupe_key) do update set detail = excluded.detail
    `;

    const weekStart = mondayFor(daysAgo(1));
    await transaction`
      insert into shravan.digests (elder_id, week_start, content)
      values (
        ${ELDER_ID}, ${weekStart},
        'Sushila ji ने इस हफ्ते नियमित रूप से बात की। सप्ताह के बीच में दो दिन उनका मन और ऊर्जा कम रही, साथ में घुटने की हल्की तकलीफ़ थी, लेकिन उसके बाद mood फिर 4–5 तक सुधरा। दवाइयों का पालन लगभग 80% रहा। एक “digital arrest” scam message को उन्होंने जाँच के लिए भेजा—बहुत अच्छा कदम। अगले हफ्ते शाम की दवाई और हल्की सैर पर प्यार से ध्यान दिलाना उपयोगी रहेगा।'
      )
      on conflict (elder_id, week_start) do update set content = excluded.content
    `;
  });
  console.log("Seeded Guardian Ananya and Elder Sushila ji with 10 days of history.");
} finally {
  await sql.end({ timeout: 5 });
}
