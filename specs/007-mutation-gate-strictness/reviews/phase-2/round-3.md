---
phase: 2
round: 3
verdict: approved
base: a4b3222c73d7e0e17194bca1077ae9f2965d91d9
head: 4b8d131ed899600ebb27b5a0ed60550ab5ce9ad6
tdd_check: pass
---

# Phase 2 review, round 3

Scope: fix round 2 (tasks.md Phase 2 "Fix round 2", T038 to T042), answering the operator round
`reviews/phase-2/round-2.md` (O2-01, O2-02), on top of the phase as approved in round 1. Commits reviewed:
`38f8305` (tasks), `e17d9ed` (red), `d3f76b8` (green), `1b43203` and `4b8d131` (check evidence), `f54f1c7` (ticks).

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|

No findings. Every task of fix round 2 is ticked and present; the change is limited to `gates/bin/mutation.ts`
(`:3`, `:19-20` header comment, `:171`), the new tests, the 001 `gate-cli.md:7` note and the 007 records
(`contracts/mutation-output.md:18-21`, research, plan, quickstart, evidence). The unticked tasks in tasks.md (T043 to
T052) belong to phase 3, fix round 2, not to this phase.

## Test quality

- **Red evidence.** `e17d9ed` changes only `gates/test/mutation-shards.test.ts` (+63 lines). `red-fix-2.log` shows
  exactly three failures, the three new tests at `:1014`, `:1030`, `:1049`, each an `AssertionError` on the deep-equal
  of the gate's output (no load or setup error); the other 2099 tests pass. The cause is the one T039 names: before
  `d3f76b8`, `undecided` at `gates/bin/mutation.ts:170` printed `replaced by ${""}`, a trailing space, and only those
  lines differ from the expected output.
- **No weakening.** `git diff e17d9ed..HEAD -- gates/test` is empty: the red tests are unchanged at HEAD. No existing
  test was changed.
- **Assertions.** Each test asserts the whole run result (`code`, `out`, `err`, `mutated`) by exact equality and also
  that no stdout line ends in whitespace. The three runs cover T038's cases: exit 0 with a Timeout and a CompileError
  without replacement; exit 1 beside a Survived finding with a replacement; exit 1 beside a Survived finding without
  replacement (the finding keeps `…: Survived: replaced by`, no trailing space, as `report.ts:175` already gave). No
  conditional assertion, skip, only or mock-only assertion.
- **Fix.** `oneLine` (`gates/lib/findings.ts:28-30`) collapses line breaks and trims, the same treatment as
  `formatFinding` (`findings.ts:38`). The replacement was already one-lined (`report.ts:159`), so the only visible
  change is the trimmed trailing space; lines with a replacement are unchanged (all earlier report-line tests pass).
- **Mutation.** `pnpm run gate:mutation -- --base a4b3222c73d7e0e17194bca1077ae9f2965d91d9`, run alone at HEAD,
  exit 0 in 3 min 49 s: `305 mutants on the changed lines of 5 files, none survived; 8 timeouts, 82 compile errors,
  0 zero-mutant entries; 1 equivalent record`. The same figures as round 1. The equivalent record is
  `gates/lib/mutation/report.ts:115` (ConditionalExpression, EqualityOperator), read and accepted in round 1 (R1-02);
  unchanged. The changed line `gates/bin/mutation.ts:170-171` has one mutant (ArrowFunction → `() => undefined`), a
  compile-error report line, matching the implementer's `evidence/us1-fix-2-gate.log` (base `e17d9ed`, 1 mutant, none
  survived). No output line of this run ends in whitespace (`grep -c ' $'` = 0), 8 `timeout` lines.

## Checks run

All at HEAD `4b8d131`, one at a time:

- `pnpm test`: `unit-tests: 2102 tests passed in 97 files` (with `OCELLE_CHROMIUM_PATH` set as the mission states).
- `pnpm run gate:typecheck`: no type error.
- `pnpm run gate:lint`: 173 files, no finding.
- `pnpm run gate:test-lint`: 114 files, no finding.
- `pnpm run gate:mutation -- --base a4b3222…`: exit 0, as above.
- `gate:plants` not re-run by the reviewer (no change to plants or the judge in this round); the implementer's run
  is in `evidence/us1-fix-2-plants.txt`: 186 plants of 13 gates and the registry, every plant as expected.
- `tdd-check.json`: `pass`, red commits `phase` (`6351832`, exit 1) and `fix-2` (`e17d9ed`, exit 1), final tests on
  base exit 1, head exit 0, no problems.

## Earlier findings

Round 2 (operator round):

- **O2-01 (blocking): resolved.** `gates/bin/mutation.ts:171` wraps the `timeout` and `compile-error` line in
  `oneLine`; red test first (`fix-2` entry in `red-commits`, `e17d9ed`), green in `d3f76b8`. The form is stated in
  `contracts/mutation-output.md:18-21` (amendment 2026-11-11), and the header comment at `mutation.ts:19-20` says so.
- **O2-02 (note): resolved.** `specs/001-repository-foundation/contracts/gate-cli.md:7` keeps "a one-line summary
  (files checked)" and adds the dated note "amendment 2026-11-11, mission 007: the mutation gate also prints record
  and report lines at exit 0, see its row". A record note, no behaviour, so no red test (Principle VIII).

Round 1 had no blocking finding; its notes R1-01 to R1-04 are unaffected by this round. Per the operator rule, R1-01
(greedy message assignment in `judgeReports`) stays dropped for the operator, with no follow-up issue.
