# Learning.MD — Shravan
> Add a 5-whys entry for flow changes, user-reported bugs, corrective feedback, and
> hard-won fixes. Check this file before debugging.

### 2026-07-24 — Shared database requires schema isolation

**Symptom:** The target Supabase database already contains a public `profiles` table.
**Why 1:** Blindspot and Shravan are using the same Supabase Postgres project.
**Why 2:** The user asked Shravan to reuse Blindspot's database credentials.
**Why 3:** A literal public-schema migration would collide with Blindspot data.
**Deepest why type:** `design`
**Action taken:** Put every Shravan table in a dedicated `shravan` schema and qualify all server queries.
**Preventive action:** Migration and tests assert the schema search path and never issue unqualified destructive SQL.

