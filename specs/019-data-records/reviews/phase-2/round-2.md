---
phase: 2
round: 2
verdict: approved
base: 385dfe6bc917e77c57a42b8c5c05942bbc5ad09e
head: 81305bb1fe40b6555e514317d2016bff6326a574
tdd_check: pass
---

# Phase 2 review, round 2

Scope: `git diff 385dfe6..81305bb`. What is new since round 1 (86f467b) is the fix commit 131c589 and the
tdd-check record 81305bb. The tree was clean. The decisions in force are those of round 1. The operator's CI-first
rule applies (`reviews/operator-ci-first-decision.md`).

What changed since round 1 (`git diff 86f467b..HEAD`):

- Source: two lines in `packages/elements/`, both `// Stryker disable next-line CallExpression` comments. Only
  their reason text changed (`ocelle-event-timeline.ts:152`, `ocelle-timeline-event.ts:132`). There is no change
  under `gates/` or `storybook/`, and no test file changed.
- Documents: `tasks.md` (the T028 check box), `spec.md` US2-4, the two contracts, and `mutation.md`.
- Records: `round-1-fixes.md`, `tdd-check.json` and the four `check-*.log` files.

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| R2-01 | note | specs/019-data-records/contracts/ocelle-timeline-event.md:27 | The shadow-structure sketch still labels the time box `<!-- only when hasTime(this) -->`. The module paragraph above it (lines 4-7), as fixed, says the event applies `hasTime`'s rule to the `time` property and not `hasTime(this)` itself. Read with that paragraph, the sketch gives the same condition, so the contract does not contradict the code (`ocelle-timeline-event.ts:140-141`). Only the comment's wording lags. | Optional: the next time the contract is touched, word it as "only when the event has a time (`hasTime`'s rule, on the property)". |

## Test quality

- **Red evidence.** `tdd-check.json`: `pass`. It was run on 131c589, whose source is the source of HEAD, because
  81305bb changes only records. Red commit 5a2ab3a exits 1. The final tests exit 2 on the base and 1 on the
  scaffold. The head exits 0. The rerun `check-red-phase.log` reports `190 of 7596 tests failed`, against 189 in
  the run before. The one extra failure is a `plant-repo.test.ts` body (`:263`) that times out at 5 000 ms. It is
  the same kind of load timeout round 1 saw on that file. It is not a missing-behaviour failure and does not bear
  on the phase. The other failures are the same `AssertionError`s on the missing behaviour. The logs hold no
  sandbox path.
- **Third run.** The commit message of 81305bb records the operator's third run: a mission-008 tooltip timing test
  in the first run, and a lost dockerd in the second. Neither touches this phase's files, and the recorded pass is
  on the reviewed source. It does not bear on the phase.
- **Weakened tests.** No test file changed since round 1, so round 1's judgement stands: nothing was skipped,
  focused, deleted or loosened after the red commit.
- **Mutation.** I ran `pnpm run gate:mutation -- --base 385dfe6bc917e77c57a42b8c5c05942bbc5ad09e` at HEAD. Exit
  0: `148 mutants on the changed lines of 4 files, none survived; 4 timeouts, 19 compile errors, 1 zero-mutant
  entry; 10 equivalent records`. These are the same 10 records as round 1. The two `super.disconnectedCallback()`
  records now carry the completed reason. I accept it: `setConnected(false)` reaches only async directives, the
  event renders none, and the timeline's `classMap` and `ifDefined` are synchronous. The timeouts and compile
  errors are reports, not findings.

## Checks run

On HEAD, under the operator's CI-first rule:

| Check | Result |
|---|---|
| `gate:typecheck` | exit 0, `typecheck: no type error in the files of tsconfig.json` |
| `gate:lint` | exit 0, `lint: 449 files checked, no finding` |
| `gate:style-lint` | exit 0, `style-lint: 41 files checked, no finding` |
| `gate:test-lint` | exit 0, `test-lint: 330 files checked, no finding` |
| `gate:manifest` | exit 0, `manifest: 21 elements checked, no finding` |
| `gate:config-copies` | exit 0 |
| `gate:csp` | exit 0, `csp: 39 files checked, no finding` |
| `gate:prefix` | exit 0, `prefix: 463 files checked, no finding` |
| `gate:signoff -- --range 385dfe6..HEAD` | exit 0, `signoff: 15 commits checked, no finding` |
| `gate:plants -- --affected 385dfe6 --list` | exit 0, `note: affected: every plant, by packages/elements/package.json (not mapped)`, `315 of 315 plants selected`. This matches `plants.md`, whose base equals `base.sha` and whose recorded exit is 0. The fix's two comment lines are on lines no plant edits, so the record stands. |
| `gate:mutation -- --base 385dfe6…` | exit 0 (above) |

Round 1's unit, browser, build, axe and Storybook runs were not repeated. Since round 1 the source has changed in
two comment texts only, and no test, story or style changed. Under the operator's rule, CI decides the full suite
and the visual, contrast, brand-rules and full plant runs.

**Tasks.** Every task of `## Phase 2:` is ticked (`tasks.md`, T027 to T051, with T028 now `[X]` at :535).
Round 1 confirmed that each task's work is present.

**Contract and spec against the code.**
- `contracts/ocelle-timeline-event.md:4-7` now says that the event imports only `hasSlottedTime`
  (`ocelle-timeline-event.ts:19`). It also says the event applies `hasTime`'s rule to the `time` property, because
  Lit reflects after `render()` (`:140-141`). Both match the code. The sketch's comment is R2-01.
- `contracts/ocelle-event-timeline.md:81-83` now says that the timeline's `hasTime(event)`
  (`ocelle-event-timeline.ts:30`, `:174`) is the rule the event applies to its property, and that the two agree once
  `time` is reflected. This matches the code and round 1's analysis.
- `spec.md:503-507` (US2-4) now says the identifier stays inside on one line at 320 px, and wraps in a 200 px
  column. This matches the body at `test/scenarios/event-timeline.ts:182-195` (`wide.lines: 1`, `narrow.lines: 2`,
  both `inside`, `scrollWidth: 320`, copied unchanged).

**Constitution and plan.** Round 1's assessment holds. The only source change is comment text.

## Earlier findings

- **R1-01 (blocking): resolved.** 131c589 ticks T028 at `tasks.md:535`. The rest of the line is unchanged, and
  T028's work is recorded as round 1 found. This is a documentation fix, so it needs no red test and no `fix-1`
  entry in `red-commits`, as round 1 said.
- R1-02 (note): resolved by the two contract edits above. One residual comment wording remains (R2-01).
- R1-03 (note): resolved by the US2-4 rewording above.
- R1-07 (note): resolved. The two source comments and `mutation.md` § "Recorded as equivalent" give the complete
  reason. The run outputs in `mutation.md` are left as they were run, which is correct.
- R1-04, R1-05, R1-06, R1-08, R1-09 and R1-10 (notes, no change required): no change, and none was needed.
