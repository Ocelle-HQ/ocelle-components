---
phase: 2
round: 1
verdict: approved
base: aafeb283818b7f81633f443b744fc02993fc994a
head: 4647d64c9db8f3f808ae55945d42decbb3528565
tdd_check: pass
---

# Phase 2 review, round 1

Scope: `git diff aafeb28..4647d64` (red `8b3a311`, green `317f0d3`, evidence commits `35894ca` and `4647d64`); no
uncommitted change. Phase: tasks.md "Phase 2: User Story 1 - The gate shows every changed-line mutant that no test was
seen killing" (T004 to T018).

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| R1-01 | note | gates/lib/plant-judge.ts:250-255 | `judgeReports` assigns each expected `message` to the first free line of its key that contains it (greedy). When two `reports` entries share location and rule and one message is a substring of the other, it can report a false "lacks": expected `[{a.ts:3, timeout, "String"}, {a.ts:3, timeout, "StringLiteral"}]` against the lines `a.ts:3: mutation: timeout: StringLiteral: replaced by ""` and `a.ts:3: mutation: timeout: BooleanLiteral: replaced by String(x)` returns `report a.ts:3 timeout lacks "StringLiteral"`, though a valid assignment exists (reproduced with a scratch script against HEAD). contracts/plants.md (007 amendment) says "each given `message` substring in a line of its own". The error is fail-closed (a spurious plant failure, never a vacuous pass), and no plant has such entries today. | None required for this phase. If kept as is, it can be handled by writing non-overlapping messages in plants; otherwise dropped for the operator (no follow-up issue, operator rule). |
| R1-02 | note | gates/lib/mutation/report.ts:115-116 | Equivalent-mutant record on `return a > b ? 1 : 0` (ConditionalExpression, EqualityOperator). Read and accepted: the line is reached only for two non-decimal ids at equal line and column with `a >= b`, and V8's TimSort decides only on `order < 0`, so 0 and 1 order a pair the same. The equivalence rests on the engine (ECMAScript leaves the order of an inconsistent comparator implementation-defined); the gate runs on Node only and Stryker ids are decimal in practice. | None. |
| R1-03 | note | gates/test/mutation-report.test.ts:433-440; gates/test/plant-judge.test.ts:262-272 | Three tests were added in the green commit (not in the red commit), to kill survivors of the implementer's first gate run; the green commit message says so. They are additions only (no test of the red commit changed after `8b3a311`), they assert behaviour, and tdd-check shows the final tests fail on base. Accepted as hardening, not a weakening. | None. |
| R1-04 | note | evidence/us1-gate.log; gates/lib/plant-judge.ts:96-98, 132-136; gates/lib/mutation/shards.ts:159-171 | 82 of the 305 mutants on the changed lines are CompileError (the TypeScript checker rejects them, mostly narrowing and unreachable-code effects), so those branches are decided by the checker, not by a test. Read as report lines, as the review command now says; the branches also have direct tests (e.g. `parsePlant` rejects `message: 3`, `reports` on an error plant). | None. |

No blocking finding.

## Test quality

- **Red evidence.** `red-phase.log` (red commit `8b3a311`, tests T005 to T009 only): 87 of 2094 tests fail, every one
  an `AssertionError` on the missing behaviour (missing `timeouts`/`compileErrors`/`zeroEntries`, missing report lines
  and counts, missing `reports` key handling, missing repeated-file cause). No import, syntax or setup error.
  `check-final-tests-on-base.log`: the final tests fail on base (90 of 2097). `check-head.log`: 2097 pass.
- **Weakened tests.** `git diff 8b3a311..HEAD -- '**/*.test.ts' '**/test/**'`: only additions (R1-03) and the four new
  plant fixture test files (plants are committed in green by tasks.md). Nothing weakened, skipped or loosened.
- **Replacements (T008, stated here as the task asks).** By operator decision PLAN-CORRECTNESS-1-005 (a) (a `--files`
  list naming one file more than once is exit 2), four existing tests that named one file several times were replaced,
  each with an in-file comment and listed in the red commit message:
  - `gates/test/mutation-shards.test.ts:631-650`, "entries of one file joined": its first half (`b.ts:121-130`) is
    kept; its second half (the plan's joined value passing) is replaced by the stricter exit-2 case with the exact
    cause naming `b.ts:1-60, b.ts:61-120, b.ts:121-130` and `mutated: []`.
  - `selectFiles` "joins entries of one file … in diff order" → "selects the files of the list in diff order, each
    with its entry as given" (diff order still asserted, plus the trimmed entry).
  - `:325` "reads the last :start-end as the range": each entry read on its own, both results asserted exactly.
  - `:342` "names every entry whose range holds no changed line": empty ranges now of different files.
  The old behaviour these tests asserted is now an error by decision, so the replacements are not loosening; each
  is at least as strict and gains the `entry` field.
- **Assertions.** Every new test asserts exact output (`toEqual` on whole verdicts, whole stdout/stderr arrays,
  exact causes). The `toMatchObject` + `toHaveProperty` + cast pattern in the ordering tests is unconditional. No
  `skip`/`only`, no conditional assertions, no snapshots, no assertions on doubles instead of the unit (the Stryker
  double only supplies a report; the gate's output is asserted). `gate:test-lint` clean.
- **Scenario coverage.** US1 AS1 (Timeout line and count), AS2 (CompileError, plus the `pass-compile-error` plant with
  `reports`), AS3 (zero-mutant entry, plus the real-Stryker `pass-zero-mutant` plant), AS4 (`pass-fully-checked`
  with `reports: []` and the all-killed gate test), AS5 (survivor + Timeout, exit 1), AS6 (range entry named as given;
  undecided mutants limited to the shard's entries). Edge cases: unchanged-line Timeout/CompileError not counted,
  file with mutants only off its changed lines, a run with no mutant at all, test-file change beside source, exit 2
  prints no report line, 121 Timeouts untruncated, unknown status still exit 2. FR-007 status table and the
  RuntimeError/Ignored verdicts covered in `mutation-report.test.ts`. The judge tests cover multiset counting,
  missing/unexpected/duplicated lines, message mismatch, fail plants, other gates and the parse rules (T005).
- **Scaffold.** No `scaffold.sha` in this phase.
- **Mutation.** `pnpm run gate:mutation -- --base aafeb283818b7f81633f443b744fc02993fc994a` (alone, 3 min 23 s):
  exit 0, `305 mutants on the changed lines of 5 files, none survived; 0 timeouts, 82 compile errors, 0 zero-mutant
  entries; 1 equivalent record`, matching `evidence/us1-gate.log`. No survivor. The one equivalent record
  (report.ts:115) is read and accepted (R1-02). The 82 `compile-error` lines are reports, read (R1-04); no `timeout`
  or `zero-mutants` line.

## Tasks, plan and constitution

- **Tasks.** T004 to T018 are ticked and present: the probe note (`evidence/us1-zero-mutant-probe.md`, report written
  with `files: {}`, so the R-03 fallback was correctly dropped, no stop-and-ask); judge (`plant-judge.ts`); plants
  (`pass-compile-error`, `pass-fully-checked`, new `pass-zero-mutant` without `base`, new
  `error-zero-mutant-failing-test`); the plants' red run (`evidence/us1-plants-red.txt`: exactly `pass-compile-error`
  and `pass-zero-mutant` fail on their missing report lines); `plural`, `selectFiles` `entry` and the repeated cause
  checked after malformed and before missing/empty (`shards.ts:159-161`); `classifyMutants` (`report.ts`); gate output
  in contract order (`mutation.ts:168-186`); the dated 007 amendments in 001 `spec.md` FR-011, `gate-cli.md`,
  `plants.md`, `data-model.md` and `gates/README.md`, earlier text kept; the reader sentence in the three review-command
  copies (identical text in source and both installed copies) and in `ocelle-land/SKILL.md`; the `log.md` Update.
  Nothing outside the phase changed.
- **Plan / contract.** Output lines, order (records, timeout, compile-error, zero-mutants, findings, summary), both
  summary forms and nouns, and the new exit-2 cause match `contracts/mutation-output.md` exactly. `cut` was reduced to
  one window per file (`shards.ts:142-147`), which is sound now that a file has one entry and the ranges from
  `changedFiles` are sorted and apart (one hunk each).
- **Constitution.** Principle VIII holds (red first, no weakening, final tests fail on base, mutation clean, gate
  plants updated and passing). The UI principles (names, tokens, accessibility, CSP, stories) do not apply to gate
  code. Commits are signed off (`gate:signoff`).

## Checks run

All with `OCELLE_CHROMIUM_PATH` and `PLAYWRIGHT_BROWSERS_PATH` set, one heavy job at a time, at HEAD `4647d64`:

| Check | Result |
|---|---|
| `pnpm run gate:typecheck` | exit 0, no type error |
| `pnpm run gate:lint` | exit 0, 171 files, no finding |
| `pnpm run gate:test-lint` | exit 0, 112 files, no finding |
| `pnpm run gate:style-lint` | exit 0 |
| `pnpm run gate:prefix` | exit 0 |
| `pnpm run gate:config-copies` | exit 0, copies identical |
| `pnpm run gate:pins` | exit 0 |
| `pnpm run gate:signoff -- --range aafeb28..HEAD` | exit 0, 4 commits |
| `pnpm test` | exit 0, 2097 tests passed in 97 files |
| `pnpm run gate:plants` (alone) | exit 0, 186 plants of 13 gates, every plant as expected |
| `pnpm run gate:mutation -- --base aafeb28…` (alone) | exit 0, none survived (above) |
| `tdd-check.json` | `pass`, no problems (red exit 1, final tests on base exit 1, head exit 0) |

Not run: `gate:csp`, `gate:contrast`, `gate:brand-rules` and the visual/axe checks need a package build and test
nothing this phase changed (gate code and specs only); CI runs them.

## Earlier findings

None: this is the first round of phase 2.
