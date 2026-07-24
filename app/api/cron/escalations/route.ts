import { isAuthorizedCron } from "@/lib/cron";
import { db } from "@/lib/db";
import { istDate, istHourMinute } from "@/lib/time";

export async function GET(request: Request) {
  if (!isAuthorizedCron(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const override = url.searchParams.get("now");
  const now = override ? new Date(override) : new Date();
  if (Number.isNaN(now.getTime())) {
    return Response.json({ error: "Invalid now override" }, { status: 400 });
  }

  const today = istDate(now);
  const { hour } = istHourMinute(now);
  let missedCheckins = 0;
  let lowMood = 0;

  if (hour >= 20) {
    const missed = await db<
      { id: string; name: string; guardian_name: string }[]
    >`
      select e.id, e.name, p.full_name as guardian_name
      from shravan.elders e
      join shravan.profiles p on p.id = e.guardian_id
      left join shravan.checkins c
        on c.elder_id = e.id and c.checkin_date = ${today}
      where c.id is null
    `;
    for (const elder of missed) {
      const result = await db`
        insert into shravan.alerts (elder_id, kind, detail, dedupe_key)
        values (
          ${elder.id},
          'MISSED_CHECKIN',
          ${`${elder.name} did not complete the daily check-in by 8:00 PM IST.`},
          ${`missed:${elder.id}:${today}`}
        )
        on conflict (dedupe_key) do nothing
        returning id
      `;
      if (result.length) missedCheckins += 1;
    }
  }

  const lowMoodCandidates = await db<
    { elder_id: string; elder_name: string; latest_date: string }[]
  >`
    with ranked as (
      select c.elder_id, c.checkin_date, c.mood_score,
             row_number() over (partition by c.elder_id order by c.checkin_date desc) as row_number
      from shravan.checkins c
      where c.checkin_date <= ${today}
    ),
    last_two as (
      select elder_id,
             max(checkin_date)::text as latest_date,
             min(checkin_date)::text as prior_date,
             count(*) filter (where mood_score <= 2) as low_count
      from ranked
      where row_number <= 2
      group by elder_id
    )
    select l.elder_id, e.name as elder_name, l.latest_date
    from last_two l
    join shravan.elders e on e.id = l.elder_id
    where l.low_count = 2
      and l.latest_date::date - l.prior_date::date = 1
  `;

  for (const elder of lowMoodCandidates) {
    const result = await db`
      insert into shravan.alerts (elder_id, kind, detail, dedupe_key)
      values (
        ${elder.elder_id},
        'LOW_MOOD',
        ${`${elder.elder_name} reported a mood score of 2 or lower on two consecutive days.`},
        ${`low-mood:${elder.elder_id}:${elder.latest_date}`}
      )
      on conflict (dedupe_key) do nothing
      returning id
    `;
    if (result.length) lowMood += 1;
  }

  return Response.json({
    ok: true,
    istDate: today,
    istHour: hour,
    created: { missedCheckins, lowMood },
  });
}

