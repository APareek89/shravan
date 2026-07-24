## Power Coding (auto — do not remove without asking the user)
At session start read Handoff.MD; FIRST run `git log --oneline <its last-synced sha>..HEAD`
and reconcile anything changed underneath it; then open with its pending points. Update
Handoff.MD before every git checkpoint commit and at the end of every phase (low context is
a secondary trigger) — snapshot not journal, re-stamp `last-synced` with HEAD; then, if
context was the trigger, tell the user to start fresh ("Refer to Handoff.MD in
/Users/anandpareek/Documents/New project/shravan and begin"). When Handoff exceeds ~40
lines or ~15 ✅ items, collapse ✅ into one "Shipped:" line, detail to Learning.MD.
Log flow changes / user-reported bugs in Learning.MD (5-whys entry format).
Read Loop.MD every session and obey its `status:` machine — when the first working
draft is done, ASK the user whether to turn the loop on (disclosing the free/paid eval
split); while `status: on`, run the FREE Loop.MD evals after every meaningful change.
The golden set / paid evals run ONLY per `consent.paid_evals`.
Keep docs/mermaid/*.mmd current when the flow changes (see docs/ARCHITECTURE_FLOW.md).
Obey .power-coding/config.json FMEA triggers. Before a checkpoint commit, run the secret
scan and a light diff review; P0 findings block the commit. If Sentinel is enabled, run
its four-lens sweep after major task completion. If Session Pulse is enabled, show and
log its two-line effort split after major milestones.
Commit a git checkpoint at every working state and before risky changes (obey
`consent.git_checkpoints`). Build the smallest PRD-proving slice first. Architecture-
shaping changes require a plain-language delta proposal and user approval before code.
Log stack/architecture/behavior decisions in Handoff.MD; never silently reverse them.

