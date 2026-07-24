# PRD.md — Shravan v0.1
> Condensed from `Shravan_PRD_v0.1_Build_Ready.md`, supplied by the user on 2026-07-24.

## What we're building
Shravan is a two-sided web app for adult Guardians and elderly parents living alone in
India. It provides warm Hindi/English daily check-ins, medication logging, scam checks,
deterministic safety alerts, a Guardian dashboard, and weekly AI-written digests.

## Users & jobs
- Guardians need a trustworthy at-a-glance view of check-ins, mood, medication
  adherence, scam alerts, and weekly trends.
- Elders need a respectful, large-font companion that is usable in at most two taps,
  mirrors Hindi/Hinglish/English, and never infantilizes or gives medical/financial advice.

## Must never break
- Distress content must fail safe: show the immediate-help script and create an urgent
  alert before relying on an LLM response.
- A Guardian must never see another Guardian's Elder data; secrets and Anthropic calls
  stay server-side.
- Scam checks must never say a message is definitely safe. Known scam rules set a
  minimum risk before the model is called.
- Medication logging and cron alerts must be idempotent; scheduling always uses IST.

## Done for v0.1
Guardian auth/onboarding and Elder invite; Elder Mode at 360 px; persisted check-in with
mood extraction; medication CRUD/logging; HIGH scam alert; missed-check-in and low-mood
cron; weekly digest; 14-day dashboard; seeded Sushila demo; RLS policies and isolation
test; Render blueprint; committed migrations and setup docs.

## Out of scope
Voice/telephony, WhatsApp, payments, multiple Guardians per Elder, vitals/wearables,
location/fall detection, elder-abuse workflows, medicine interaction advice, languages
beyond Hindi/English, and native apps.

