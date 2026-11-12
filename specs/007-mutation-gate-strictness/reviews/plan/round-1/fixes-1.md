# Squad round 1: fixes 1

Applied to the plan artifacts at `b728e83` from `refute.md` (14 confirmed fixes, 1 fork decided by the operator,
human:jeroennouwsdev, 2026-11-10). Duplicates are covered by the row they fold into; the refuted row needs no change.

| ID | Resolution | Where |
|----|------------|-------|
| PLAN-A11Y-SECURITY-1-001 | fixed | research.md R-03 (10.1.1 source recorded, probe kept as confirmation, the three log strings dropped, fallback only if no report: anchored `with 0 mutant(s)`, exit 0, no ERROR; `No files found for mutation` stays exit 2; red gate tests), R-02 plant table (`error-zero-mutant-failing-test`); plan.md Structure, Constitution Check VIII; quickstart.md US1 2 |
| PLAN-CORRECTNESS-1-001 | fixed | research.md R-05 (sequencer and `groupSpecs` account corrected; lever 1 tokens 1, others 2, none at 0; behavioural red test under Stryker's options; stricter replacement of the `toEqual` assertion); plan.md Summary, Structure, Constitution Check VIII; quickstart.md US2 4 |
| PLAN-CORRECTNESS-1-002 | fixed | research.md R-05 (checker's share from 001's figures, checker/runner split of `concurrency`, lever 2 measured in either direction, straight to lever 3 if the checker share alone exceeds 176 s), R-06 (checker split by 001's method), R-06 README table; plan.md Summary, Structure |
| PLAN-CORRECTNESS-1-003 | fixed | research.md R-07 (alone run: source.ts-only draft pull request based on the mission head, no workflow change, closed unmerged; only when a mixed shard misses 480 s; the operator pushes and opens it, since the orchestrator opens no pull request; "accept the upper bound" dropped; operator decision only for an alone shard over 480 s); plan.md Summary; quickstart.md US2 6 |
| PLAN-CORRECTNESS-1-004 | fixed | research.md R-07 (every line changed, blank lines included; `--plan` against the PR base checked for the four sandbox entries before pushing, its output recorded) |
| PLAN-CORRECTNESS-1-005 | decided: (a) | research.md R-03 (new exit-2 cause for a file named more than once in `--files`, its wording and check order, red test in mutation-shards.test.ts, the "entries of one file joined" assertion replaced), R-08 (001 gate-cli mutation row); contracts/mutation-output.md (header, § New exit-2 cause); data-model.md § Entry (`Selection` variant `repeated`); plan.md Summary, Scale/Scope, Structure, Constitution Check VIII; quickstart.md US1 1 |
| PLAN-CORRECTNESS-1-006 | fixed | duplicate of PLAN-A11Y-SECURITY-1-001 |
| PLAN-CORRECTNESS-1-007 | fixed | research.md R-05 (the runner-size conflict stated; core count recorded by the CI measurement; lever 2 chosen for both cases, 2-core sandbox runs with `taskset`), R-07; plan.md Technical Context |
| PLAN-CORRECTNESS-1-008 | fixed | research.md R-06 (red runs at the phase base before any US1 code, statuses read from the kept `mutation.json`); plan.md Summary, Structure decision |
| PLAN-CORRECTNESS-1-009 | fixed | duplicate of PLAN-TESTABILITY-1-004 |
| PLAN-CORRECTNESS-1-010 | fixed | contracts/mutation-output.md § Lines (rule = status); research.md R-01 |
| PLAN-CORRECTNESS-1-011 | fixed | duplicate of PLAN-TESTABILITY-1-007 |
| PLAN-CORRECTNESS-1-012 | fixed | contracts/mutation-output.md § Readers (story review command, both copies, one sentence); research.md R-08; plan.md Scale/Scope, Project Structure, Structure (US1 records) |
| PLAN-FRESH-1-001 | fixed | duplicate of PLAN-CORRECTNESS-1-001 |
| PLAN-FRESH-1-002 | fixed | duplicate of PLAN-CORRECTNESS-1-003 |
| PLAN-FRESH-1-003 | fixed | duplicate of PLAN-CORRECTNESS-1-004 |
| PLAN-FRESH-1-004 | decided: (a) | duplicate of PLAN-CORRECTNESS-1-005 |
| PLAN-FRESH-1-005 | fixed | duplicate of PLAN-A11Y-SECURITY-1-001 |
| PLAN-FRESH-1-006 | fixed | duplicate of PLAN-TESTABILITY-1-004 (multiset comparison of `reports`) |
| PLAN-FRESH-1-007 | fixed | research.md R-08 (dated 007 amendment of 001 gate-cli.md:8 location rule and 001 data-model.md § Finding for `path:start-end` report lines); contracts/mutation-output.md header; plan.md Scale/Scope, Project Structure |
| PLAN-TESTABILITY-1-001 | fixed | duplicate of PLAN-CORRECTNESS-1-001 (behavioural red test taken in research.md R-05; the former Timeouts' `testsCompleted` is read from the green reports, R-06) |
| PLAN-TESTABILITY-1-002 | fixed | research.md R-06 (FR-011 criteria: `killedBy` in the tokens project, `statusReason` an assertion failure, record or group named; README lists `killedBy` and `statusReason`) |
| PLAN-TESTABILITY-1-003 | fixed | duplicate of PLAN-A11Y-SECURITY-1-001 (failed-dry-run case and `error-zero-mutant-failing-test`) |
| PLAN-TESTABILITY-1-004 | fixed | research.md R-02 (`records` against `record` lines only, `reports` as a multiset, `reports` rejected on non-mutation gates, `parsePlant`, judge red tests, US1 order); data-model.md § Plant; plan.md Structure, Constitution Check VIII |
| PLAN-TESTABILITY-1-005 | decided: (a) | duplicate of PLAN-CORRECTNESS-1-005 |
| PLAN-TESTABILITY-1-006 | disputed: refuted in refute.md, no change | - |
| PLAN-TESTABILITY-1-007 | fixed | contracts/mutation-output.md (tie-break start line, column, numeric id; exact nouns; irregular plural); research.md R-01, R-04 (`plural()` irregular form with its test in findings.test.ts, the existing exact-summary tests named); data-model.md § Undecided mutant, § Mutant verdict |
| PLAN-TESTABILITY-1-008 | fixed | research.md R-06 (reference entries compared per mutant by location and mutator; a Killed → Timeout move triggers one re-run of both, both recorded) |
