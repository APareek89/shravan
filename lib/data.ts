import "server-only";
import { db, runAsUser } from "@/lib/db";
import { istDate } from "@/lib/time";

export type ElderSummary = {
  id: string;
  name: string;
  nickname: string | null;
  city: string | null;
  language: "hi" | "en";
  interests: string[];
  invite_token: string | null;
  invite_expires_at: string | null;
  checkin_done: boolean;
  mood_score: number | null;
  meds_taken: number;
  meds_total: number;
  last_active: string | null;
  adherence: number;
  streak: number;
  mood_trend: { date: string; score: number | null }[];
};

export type DashboardAlert = {
  id: string;
  elder_id: string;
  elder_name: string;
  kind: "MISSED_CHECKIN" | "LOW_MOOD" | "SCAM_HIGH" | "URGENT";
  detail: string | null;
  created_at: string;
  acknowledged: boolean;
};

export async function getGuardianDashboard(guardianId: string) {
  const today = istDate();
  return runAsUser(guardianId, async (transaction) => {
    const elders = await transaction<
      {
        id: string;
        name: string;
        nickname: string | null;
        city: string | null;
        language: "hi" | "en";
        interests: string[];
        invite_token: string | null;
        invite_expires_at: string | null;
        checkin_done: boolean;
        mood_score: number | null;
        meds_taken: number;
        meds_total: number;
        last_active: string | null;
      }[]
    >`
      select
        e.id, e.name, e.nickname, e.city, e.language, e.interests,
        e.invite_token, e.invite_expires_at,
        (c.id is not null) as checkin_done,
        c.mood_score,
        coalesce(mt.taken, 0)::int as meds_taken,
        coalesce(ma.total, 0)::int as meds_total,
        greatest(
          c.created_at,
          mt.last_taken,
          msg.last_message,
          e.created_at
        )::text as last_active
      from shravan.elders e
      left join shravan.checkins c
        on c.elder_id = e.id and c.checkin_date = ${today}
      left join lateral (
        select count(*)::int as taken, max(taken_at) as last_taken
        from shravan.med_logs
        where elder_id = e.id and log_date = ${today}
      ) mt on true
      left join lateral (
        select count(*)::int as total
        from shravan.medications
        where elder_id = e.id and active
      ) ma on true
      left join lateral (
        select max(m.created_at) as last_message
        from shravan.messages m
        join shravan.conversations cv on cv.id = m.conversation_id
        where cv.elder_id = e.id
      ) msg on true
      where e.guardian_id = ${guardianId}
      order by e.created_at
    `;

    const summaries: ElderSummary[] = [];
    for (const elder of elders) {
      const history = await transaction<
        { date: string; mood_score: number | null; meds_taken: number; meds_total: number }[]
      >`
        with dates as (
          select generate_series(
            ${today}::date - interval '13 days',
            ${today}::date,
            interval '1 day'
          )::date as date
        )
        select
          d.date::text,
          c.mood_score,
          coalesce(ml.taken, 0)::int as meds_taken,
          coalesce(m.total, 0)::int as meds_total
        from dates d
        left join shravan.checkins c
          on c.elder_id = ${elder.id} and c.checkin_date = d.date
        left join lateral (
          select count(*)::int as taken
          from shravan.med_logs
          where elder_id = ${elder.id} and log_date = d.date
        ) ml on true
        left join lateral (
          select count(*)::int as total
          from shravan.medications
          where elder_id = ${elder.id}
            and active
            and (created_at at time zone 'Asia/Kolkata')::date <= d.date
        ) m on true
        order by d.date
      `;

      let streak = 0;
      for (const day of [...history].reverse()) {
        if (day.date === today && day.mood_score == null) continue;
        if (day.mood_score == null) break;
        streak += 1;
      }
      const completedDays = history.filter((day) => day.date !== today);
      const possibleDoses = completedDays.reduce((sum, day) => sum + day.meds_total, 0);
      const takenDoses = completedDays.reduce((sum, day) => sum + day.meds_taken, 0);
      summaries.push({
        ...elder,
        adherence: possibleDoses ? Math.round((takenDoses / possibleDoses) * 100) : 0,
        streak,
        mood_trend: history.map((day) => ({
          date: day.date,
          score: day.mood_score,
        })),
      });
    }

    const alerts = await transaction<DashboardAlert[]>`
      select a.id, a.elder_id, e.name as elder_name, a.kind, a.detail,
             a.created_at::text, a.acknowledged
      from shravan.alerts a
      join shravan.elders e on e.id = a.elder_id
      where e.guardian_id = ${guardianId}
      order by a.acknowledged, a.created_at desc
      limit 20
    `;

    const digests = await transaction<
      { id: string; elder_id: string; elder_name: string; week_start: string; content: string }[]
    >`
      select d.id, d.elder_id, e.name as elder_name, d.week_start::text, d.content
      from shravan.digests d
      join shravan.elders e on e.id = d.elder_id
      where e.guardian_id = ${guardianId}
      order by d.week_start desc
      limit 8
    `;

    return { elders: summaries, alerts, digests, today };
  });
}

export async function getGuardianElderDetail(guardianId: string, elderId: string) {
  return runAsUser(guardianId, async (transaction) => {
    const [elder] = await transaction<
      {
        id: string;
        name: string;
        nickname: string | null;
        city: string | null;
        language: "hi" | "en";
        interests: string[];
        invite_token: string | null;
        invite_expires_at: string | null;
      }[]
    >`
      select id, name, nickname, city, language, interests,
             invite_token, invite_expires_at::text
      from shravan.elders
      where id = ${elderId} and guardian_id = ${guardianId}
      limit 1
    `;
    if (!elder) return null;

    const medications = await transaction<
      {
        id: string;
        name: string;
        dosage: string | null;
        slot: "morning" | "afternoon" | "evening" | "night";
        notes: string | null;
        active: boolean;
      }[]
    >`
      select id, name, dosage, slot, notes, active
      from shravan.medications
      where elder_id = ${elderId}
      order by
        case slot when 'morning' then 1 when 'afternoon' then 2
                  when 'evening' then 3 else 4 end,
        name
    `;

    const digests = await transaction<
      { id: string; week_start: string; content: string }[]
    >`
      select id, week_start::text, content
      from shravan.digests
      where elder_id = ${elderId}
      order by week_start desc
      limit 12
    `;
    return { elder, medications, digests };
  });
}

export async function getElderByInvite(token: string) {
  const [elder] = await db<
    {
      id: string;
      name: string;
      nickname: string | null;
      language: "hi" | "en";
      invite_expires_at: string | null;
    }[]
  >`
    select id, name, nickname, language, invite_expires_at::text
    from shravan.elders
    where invite_token = ${token}
      and invite_expires_at > now()
    limit 1
  `;
  return elder ?? null;
}

export async function getElderHome(elderId: string) {
  const today = istDate();
  const [elder] = await db<
    {
      id: string;
      name: string;
      nickname: string | null;
      city: string | null;
      language: "hi" | "en";
      guardian_name: string;
      checkin_done: boolean;
      mood_score: number | null;
    }[]
  >`
    select e.id, e.name, e.nickname, e.city, e.language,
           p.full_name as guardian_name,
           (c.id is not null) as checkin_done,
           c.mood_score
    from shravan.elders e
    join shravan.profiles p on p.id = e.guardian_id
    left join shravan.checkins c
      on c.elder_id = e.id and c.checkin_date = ${today}
    where e.id = ${elderId}
    limit 1
  `;
  if (!elder) return null;

  const medications = await db<
    {
      id: string;
      name: string;
      dosage: string | null;
      slot: "morning" | "afternoon" | "evening" | "night";
      notes: string | null;
      taken: boolean;
      taken_at: string | null;
    }[]
  >`
    select m.id, m.name, m.dosage, m.slot, m.notes,
           (ml.id is not null) as taken, ml.taken_at::text
    from shravan.medications m
    left join shravan.med_logs ml
      on ml.medication_id = m.id and ml.log_date = ${today}
    where m.elder_id = ${elderId} and m.active
    order by
      case m.slot when 'morning' then 1 when 'afternoon' then 2
                  when 'evening' then 3 else 4 end,
      m.name
  `;
  return { elder, medications, today };
}
