# Shravan

Shravan is a two-sided care companion for elderly parents living alone in India. The
Elder experience provides a large, Hindi/English daily check-in, medicine logging, and
scam checking. The Guardian experience shows today’s status, 14-day patterns, alerts,
Elder/medicine management, invite links, and weekly digests.

## What is working

- Supabase Postgres migration in an isolated `shravan` schema with ownership RLS
- Supabase email OTP path plus signed 30-day demo/Elder sessions
- Guardian create/update Elder, regenerate invite, and medicine CRUD
- Responsive Guardian dashboard with check-in, medicine, mood, alert, and digest data
- 20 px+ Elder Mode verified at 360 px with 52 px+ controls
- Streaming Claude check-in with 30-message context, 25-turn cap, daily token budget,
  structured `save_checkin`, medicine context, and yesterday continuity
- Deterministic distress response and urgent alert before any model call
- Deterministic scam rules before Claude; model can raise but never lower risk
- Idempotent medicine logs, HIGH-scam alerts, missed-check-in/low-mood cron alerts,
  and weekly digests
- Render Blueprint with Singapore web service and UTC schedules for 20:30 IST daily
  escalation and Sunday 18:00 IST digest

## Local setup

Requires Node 20+ and pnpm.

```bash
pnpm install
cp .env.example .env.local
# Fill .env.local
pnpm db:setup
pnpm dev
```

Open:

- Guardian demo: `http://localhost:3000/auth`
- Seeded Elder link: `http://localhost:3000/e/demo-sushila`

The seed is idempotent and creates `demo@shravan.app`, Guardian Ananya Sharma, Elder
Sushila Sharma in Indore, four medicines, ten historical check-ins, 80% historical
adherence, one scam alert, and one digest.

## Environment variables

| Variable | Required | Purpose |
|---|---:|---|
| `DATABASE_URL` | yes | Server-only Supabase Postgres connection |
| `ANTHROPIC_API_KEY` | yes | Server-only check-in, scam, and digest calls |
| `CHECKIN_MODEL` | yes | Default `claude-sonnet-4-6` |
| `UTILITY_MODEL` | yes | Default `claude-haiku-4-5-20251001` |
| `CRON_SECRET` | yes | Bearer protection for both cron routes |
| `DEMO_SESSION_SECRET` | yes | HMAC signing for demo and Elder device sessions |
| `APP_URL` | yes in production | Canonical server URL and cron target |
| `NEXT_PUBLIC_APP_URL` | yes in production | OTP callback origin |
| `SUPABASE_URL` | optional today | Server-side Supabase project URL alias |
| `NEXT_PUBLIC_SUPABASE_URL` | for real OTP | Browser-safe Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | for real OTP | Browser-safe Supabase key |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | legacy alternative | Use instead of the publishable key on older projects |
| `SUPABASE_SERVICE_ROLE_KEY` | optional today | Reserved for moving admin calls to supabase-js |
| `DAILY_TOKEN_BUDGET` | no | Default `12000` tokens per Elder/day |
| `DAILY_SCAM_MODEL_LIMIT` | no | Default `20` model-classified scam checks per Guardian family/day |
| `ENABLE_PUBLIC_DEMO` | no | Defaults on locally and off in production to prevent anonymous AI-cost abuse |
| `RESEND_API_KEY` | no | Enables HIGH-scam and digest emails |
| `RESEND_FROM_EMAIL` | with Resend | Verified sender |

`DATABASE_URL` and `ANTHROPIC_API_KEY` were reused locally from Blindspot. Secret values
are in `.env.local`, which is gitignored.

## Verification

```bash
pnpm check
pnpm build
pnpm test:rls
# With the app running:
pnpm test:cron
```

`test:rls` switches PostgreSQL to the Supabase `authenticated` role and verifies
Guardian A can see Sushila while Guardian B sees zero rows. `test:cron` verifies an
unauthorized request is rejected, creates isolated test data, checks missed/low-mood
alert idempotency, removes the test data, runs the digest, and verifies persistence.

## Render deployment

1. Push this folder to a GitHub/GitLab repository.
2. In Render, create a Blueprint from `render.yaml`.
3. Supply each `sync: false` value. The Blueprint generates one shared `CRON_SECRET`
   and wires each cron job to the web service over Render's private network.
4. Set `APP_URL` and `NEXT_PUBLIC_APP_URL` to the final `https://…onrender.com` URL.
5. In Supabase Auth, add the production URL and `/auth/callback` redirect URL.
6. Run `pnpm db:seed` once only if the demo story should exist in that environment.

The migration runs as Render’s pre-deploy command. Cron expressions are UTC because
Render schedules in UTC.

## Safety boundary

Shravan is not a doctor, emergency service, fraud investigator, or replacement for
family. The fixed urgent-help response directs the Elder to their Guardian, a nearby
trusted person, and 112. A DPDP/privacy and clinical-liability review is required before
using real Elder data.
