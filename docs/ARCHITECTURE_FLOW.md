# Shravan architecture flow

The browser renders two experiences from one Next.js application. Guardians authenticate
with Supabase OTP when public keys are present; otherwise a signed demo session exposes
the seeded story. Elders enter through expiring invite links and receive a signed,
30-day device session.

Every mutation passes through server routes. The server resolves the current Guardian or
Elder, validates input, and runs SQL in the isolated `shravan` schema. User-scoped
queries switch to PostgreSQL's `authenticated` role with a request claim, so committed
RLS policies remain the final ownership boundary.

Deterministic distress and scam rules run before Claude. Claude adds conversational
quality and structured extraction, but it cannot lower the deterministic risk or suppress
an urgent alert. Render cron routes use a Bearer secret and fixed IST date logic.

## Master flow

```mermaid
flowchart TD
  Entry["Open Shravan"] --> Role{"Choose experience<br/>FUNCTION"}
  Role -->|Guardian| Auth["Guardian auth<br/>Supabase OTP or signed demo session"]
  Auth --> Dash["Guardian dashboard<br/>today, 14-day trends, alerts, digest"]
  Dash --> Manage["Elder profile + medication + invite management"]
  Role -->|Elder invite| Invite["Validate invite and persist Elder session"]
  Invite --> Elder["Elder Mode<br/>large Hindi/English actions"]
  Elder --> Checkin["Daily check-in<br/>deterministic safety then Claude"]
  Elder --> Meds["Medication cards<br/>idempotent taken log"]
  Elder --> Scam["Scam check<br/>rules set minimum risk then Claude"]
  Checkin --> DB[("shravan schema<br/>RLS-protected Postgres")]
  Meds --> DB
  Scam --> DB
  Cron["Render cron<br/>IST escalation + Sunday digest"] --> DB
  Cron --> Claude["Anthropic API<br/>server-side only"]
  Checkin --> Claude
  Scam --> Claude
  DB --> Dash
```

## Daily check-in

```mermaid
flowchart TD
  Request["Validated Elder chat request"] --> Persist["Persist user turn"]
  Persist --> Distress{"Known distress phrase?"}
  Distress -->|yes| Urgent["Create URGENT alert + fixed 112 script"]
  Distress -->|no| Context["Load ≤30 messages + meds + prior summary + usage"]
  Context --> Budget{"Daily token budget reached?"}
  Budget -->|yes| Close["Fixed short safe close"]
  Budget -->|no| Claude["Claude streams one-question-at-a-time check-in"]
  Claude --> Tool{"Valid save_checkin tool?"}
  Tool -->|yes| Save["Upsert one check-in per Elder/date"]
  Tool -->|no| PersistAssistant["Persist assistant text only"]
  Save --> PersistAssistant
  PersistAssistant --> Done["Return saved flag + usage"]
```

## Alerts and digest

```mermaid
flowchart TD
  Request["Cron request"] --> Auth{"Exact Bearer secret?"}
  Auth -->|no| Deny["401"]
  Auth -->|yes| Job{"Escalation or digest?"}
  Job -->|Escalation| Missed{"After 20:00 IST and no check-in?"}
  Missed -->|yes| MissedAlert["Idempotent MISSED alert"]
  Missed --> Mood{"Two consecutive moods ≤2?"}
  Mood -->|yes| MoodAlert["Idempotent LOW_MOOD alert"]
  Job -->|Digest| History["Load factual IST-week history"]
  History --> Claude["Claude writes ≤150 plain-text words"]
  Claude --> Digest["Upsert Elder + week digest"]
```

## Gates at a glance

| Gate | Enforcer | Threshold / rule |
|---|---|---|
| Elder invite | Server function | unexpired token and active Elder |
| Check-in turn cap | Server function | 25 user turns |
| Distress | Deterministic function | any configured self-harm/chest-pain/fall phrase |
| Scam minimum | Deterministic function | known pattern forces SUSPICIOUS; urgent money/police/OTP combination forces HIGH |
| Daily cost | Server function | `DAILY_TOKEN_BUDGET`, default 12,000 output+input tokens per Elder |
| Cron auth | Route handler | exact `Authorization: Bearer CRON_SECRET` |
| Ownership | Postgres RLS | Guardian ID or linked Elder profile ID equals auth claim |

## File index

| Stage | Primary files |
|---|---|
| Sessions | `lib/auth/session.ts`, `lib/auth/tokens.ts`, `middleware.ts` |
| Guardian | `app/dashboard/page.tsx`, `app/dashboard/actions.ts`, `lib/data.ts` |
| Elder Mode | `app/elder/page.tsx`, `app/elder/meds/page.tsx`, `app/elder/scam/page.tsx` |
| Check-in | `app/api/chat/route.ts`, `lib/prompts.ts`, `lib/safety.ts` |
| Alerts/digest | `app/api/scam-check/route.ts`, `app/api/cron/*` |
| Database/RLS | `supabase/migrations/202607240001_shravan_v01.sql` |

## Failure that matters most

If Claude is unavailable during distress, Shravan still writes the URGENT alert and
returns the fixed immediate-help script. If the database is also unavailable, the Elder
still sees the help script, but the Guardian alert cannot be persisted; the route returns
a visible degraded-state warning rather than pretending the alert succeeded.
