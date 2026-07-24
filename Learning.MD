# Learning.MD — Shravan
> Add a 5-whys entry for flow changes, user-reported bugs, corrective feedback, and
> hard-won fixes. Check this file before debugging.

### 2026-07-24 — Public demo AI paths need their own cost guard

**Symptom:** The daily token budget protected check-in chat but not repeated scam checks.
**Why 1:** Scam classification used a separate one-shot model route.
**Why 2:** The cost guard was designed around chat tokens instead of every public model call.
**Deepest why type:** `design`
**Action taken:** Cap scam-model calls per Elder/day, keep the deterministic fallback available, deduplicate repeated HIGH alerts by message/day, and persist scam messages plus alerts atomically.
**Preventive action:** Inventory every externally reachable model call when adding usage limits; do not assume one feature's token ledger protects another.

### 2026-07-24 — A context window is not a lifetime turn counter

**Symptom:** The 25-turn closing rule could never trigger because only the latest 30 chat messages were counted.
**Why 1:** Thirty alternating messages contain at most about 15 Elder turns.
**Why 2:** One query was being reused for both bounded model context and conversation-wide control state.
**Deepest why type:** `code`
**Action taken:** Keep the 30-message model context, but count all user messages separately for the turn cap.
**Preventive action:** Never derive lifetime quotas or control gates from a deliberately truncated context window.

### 2026-07-24 — Seeded adherence denominator included days before the schedule

**Symptom:** The 10-day demo with 80% medication logs displayed 57% on a 14-day card.
**Why 1:** The denominator counted four medicines on all 14 chart days.
**Why 2:** It ignored each medicine's `created_at` date while historical seed logs began only 10 days ago.
**Why 3:** The UI query treated “active now” as “scheduled throughout the full window.”
**Deepest why type:** `code`
**Action taken:** Count a medicine only from its IST creation date, seed the demo schedule before its history, and exclude the still-in-progress current day from the 14-day percentage.
**Preventive action:** Every adherence calculation must define both the schedule-active interval and whether the measurement window is complete before counting possible doses.

### 2026-07-24 — Demo scam phrase needed a combined urgency signal

**Symptom:** The PRD’s parcel/customs/police message was initially classified SUSPICIOUS, not HIGH.
**Why 1:** Parcel and customs shared one regex hit, while police produced only one urgency hit.
**Why 2:** A direction to call an unknown number was not counted as an urgency/coercion signal.
**Deepest why type:** `code`
**Action taken:** Add call/phone/number in Hindi and English to urgency signals; keep the minimum-risk unit test.
**Preventive action:** Every PRD demo input is an exact deterministic regression test before model evaluation.

### 2026-07-24 — Script and test runners needed explicit ESM/alias configuration

**Symptom:** Database scripts rejected top-level await and Vitest could not resolve `@/` imports.
**Why 1:** The package lacked `"type": "module"` and Vitest did not inherit Next's TypeScript alias.
**Why 2:** TypeScript compilation alone did not exercise runner-specific module resolution.
**Deepest why type:** `process`
**Action taken:** Mark the package as ESM and add an explicit Vitest alias configuration.
**Preventive action:** Run database scripts and the test runner before calling the first build checkpoint complete.

### 2026-07-24 — Shared database requires schema isolation

**Symptom:** The target Supabase database already contains a public `profiles` table.
**Why 1:** Blindspot and Shravan are using the same Supabase Postgres project.
**Why 2:** The user asked Shravan to reuse Blindspot's database credentials.
**Why 3:** A literal public-schema migration would collide with Blindspot data.
**Deepest why type:** `design`
**Action taken:** Put every Shravan table in a dedicated `shravan` schema and qualify all server queries.
**Preventive action:** Migration and tests assert the schema search path and never issue unqualified destructive SQL.
