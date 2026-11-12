# Squad round 2: fixes 1

Applied to the plan artifacts at `d8c24fe` from `refute.md` (2 confirmed fixes, 2 forks decided by the operator,
human:jeroennouwsdev, 2026-11-10). spec.md is unchanged: FR-011 and US2 scenario 4 already ask for "a killing test
whose assertion is on the record's value or group" and the by-hand application, which the decided criterion now
checks. No test changes (PLAN-FRESH-2-001 (a)). The Constitution Check is unchanged: its VIII row already names the
stricter config assertion. No follow-up issues (operator rule for this run).

| ID | Resolution | Where |
|----|------------|-------|
| PLAN-FRESH-2-001 | decided: (a) | research.md R-06 FR-011's per-mutant record (criterion 3 becomes "`killedBy` is one of the named value/group tests of `source-table.test.ts`": light `:39`, dark `:45`, JSON `:76`, list fixed before the green runs; `statusReason` recorded as given and not judged for what it names, with the truncation reason; the tie to the record shown by the by-hand application, whose Vitest diff is kept; message text alone never a criterion failure and never triggers lever 2 or 3); plan.md Structure (US2) |
| PLAN-FRESH-2-002 | decided: (a) | research.md R-05 § The checker's share (split is a diagnostic only), § Lever 2 (the "straight to lever 3" shortcut dropped; decided on measured entry time alone, always before lever 3), § Lever 3 (heading condition), R-06 § The checker split (labelled diagnostic, why the difference is not the checker's share, no lever chosen or skipped on it), README table column; plan.md Summary, Structure (red measurement, US2) |
| PLAN-FRESH-2-003 | fixed | research.md R-06 FR-013 reference entries (key: start and end line/column, mutator, replacement; loud failure on a repeated or unmatched key); quickstart.md US2 3; plan.md Structure (US2) |
| PLAN-FRESH-2-004 | fixed | research.md R-05 Red-first (whole `test.sequence` removed before the deep-equal; `test.sequence` deep-equals exactly `{ groupOrder: 1 }` for tokens and `{ groupOrder: 2 }` for every other project) |
