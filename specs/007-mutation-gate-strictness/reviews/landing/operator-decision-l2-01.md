# Operator decision: landing note L2-01

- Decided by: human:jeroennouwsdev (operator), 2026-11-12, after landing review round 2 (`round-2.md`, approved).
- Question: on a freshly booted sandbox, the reviewer's first gate-source mutation run at HEAD had 2 timeouts
  (`gates/lib/mutation/report.ts:106:17`, static Regex mutants). Three later runs had 0, and the reviewer could not
  reproduce it; main's config was not run on a cold start. CI passed on `d8238ff` and `a7e2381`. Under this mission's
  rule (no follow-up issues), how is L2-01 handled?
- Options offered: "Drop it, recorded"; "Check cold start first".
- Answer: **"Drop it, recorded"**: L2-01 stays a dropped note in `round-2.md` and the PR body. No fold, no issue.
