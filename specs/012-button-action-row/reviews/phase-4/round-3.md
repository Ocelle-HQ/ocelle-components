---
phase: 4
round: 3
verdict: changes_requested
base: 55ec4105f5ad82f7efbbab81d478b36b75ef98b3
head: 8dc8147e2742a076c765c06dba75e3c21edbb039
tdd_check: pass
---

# Phase 4 review, round 3

Review of the fix for the operator round 2 (O2-01, O2-02; tasks.md T049b to T049f): red 2041399, green bd9aaca,
tdd-check record 60c20af, and the decision 29 amendment 56f0e4f. Reviewed at 8dc8147. Between bd9aaca and HEAD only
phase 6 and landing commits landed; they touch none of the phase 4 files. One of them changes
`gates/lib/plant-runner.ts`, so I ran `tdd-check.sh 4` again at HEAD.

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| R3-01 | blocking | specs/012-button-action-row/reviews/phase-4/plants.md:1, :38 | `plants_command` is set (`pnpm run gate:plants`), and op 016 reached this branch in 8cd1f45, before the fix. The fix procedure therefore required plants.md to be replaced by a `gate:plants -- --affected <base.sha>` run, in the form with `- base:`, `- command:`, `- exit:` and the verbatim output (`.specify/extensions/story/commands/speckit.story.fix.md` step 5, already in that form at bd9aaca). plants.md has no base, command or exit line. Its "Fix round 2" section judges shards 1 to 3 (239 other plants) plus four rows. My run of `pnpm run gate:plants -- --affected 55ec4105… --list` at HEAD prints `note: affected: every plant, by gates/bin/plants.ts (shared gate source)` and `312 of 312 plants selected`. So the record has no base, and its selection (239) differs from the affected one (312). | Run `pnpm run gate:plants -- --affected 55ec4105f5ad82f7efbbab81d478b36b75ef98b3` on the fixed tree. Record it in plants.md in the prescribed form, with exit 0, and move the element-plant and shard history to notes.md. Alternatively, the operator records that the shard run stands for this landing-folded round. That would rest on three facts: the base predates op 016; every plant is selected only because shared gate source changed; and the real source's stylesheet is byte-identical before and after the fix (notes.md § Fix round 2), so the 73 visual and axe plants see no change. |
| R3-02 | note | specs/012-button-action-row/reviews/phase-4/tdd-check.json; check-final-tests-on-base.log | The final-tests-on-base sub-check exits 2 ("unit-tests: could not run: no test file found"), not 1. The 60c20af record shows this, and so does my rerun at HEAD. `tdd-check.sh` accepts any non-zero exit, so `pass` holds as a status. At this HEAD, however, this sub-check proves nothing. I reproduced the run on base with the same overlay: Vitest stops with a startup error (`TypeError: code.charCodeAt is not a function` in vite's module-runner source-map code), and every project then reports "No test files found". The cause is the size of base..HEAD. It now spans missions 008, 011 and 013, ops 015 and 016, and phases 5 and 6, so about 170 later test and harness files are overlaid on the phase 4 base, and those files cannot start there. The record at 64fd771 (cf52eb1) still exited 1, because it predates those merges. The vacuity guard's purpose is still met, on other evidence (Test quality). | None for this phase. For the story extension, outside this phase: `tdd-check.sh` could report a base run that exits 2 as "could not run" rather than counting it as red. |
| R3-03 | note | gates/bin/brand-rules.ts:37; packages/tokens/src/generate.ts:85 | `notDuration` matches easing functions with `(?:cubic-bezier\|steps\|linear)\(.*\)`. The `.*` spans parentheses, so `steps(1) calc(2s)` and `linear(0, 1) var(--ocelle-motion-base)` count as easing (checked with node). Plan decision 29 calls the list "closed" and "fail closed", and this is a small gap in that. It does not reopen O2-02: such a value is not a valid `<time>`, so it cannot be a motion duration that escapes zeroing. No test pins it either way. | None required. A later change could use `\([^()]*\)` and add one test that a compound value is a finding. |
| R3-04 | note | gates/bin/brand-rules.ts:37; packages/tokens/src/generate.ts:80, :85, :100 | There are 13 timeouts in the mutation run, which R-14 counts as killed. Twelve are anchor-drop and fraction mutants on the `ms` regex and on `notDuration`, the same kind as R1-01: no test gives a prefixed, suffixed or fractional angle or duration. The thirteenth is `isDelay` returning `true`, which makes every record a delay. "sets exactly every motion duration of the source to 0ms …" in generate.test.ts asserts against that outcome, so the timeout hides a kill rather than a survivor. notes.md reasons all 13. | None (as R1-01). |

One blocking finding.

## Test quality

**Red evidence.** The `red-commits` file has `fix-2 2041399`. That commit changes six test files and nothing else. Five of them carry the new cases: `gates/test/brand-rules.test.ts`, `packages/tokens/test/validate.test.ts` and `packages/tokens/test/generate.test.ts`, plus the pins in `plant-runner.test.ts` and `plants-robustness.test.ts`. The sixth is `gates-readme.test.ts`, which carries the README row.

red-fix-2.log reports 18 of 7061 tests failed, all `AssertionError`, with no load or setup error. I checked each group:
- rule (f) gives exit 0 or no finding where one is expected (7 cases: the three misplaced markers, `1s`, `var()`, `calc()` and a per-theme value);
- `validateSource` does not throw (6 cases);
- `css()` leaves a misplaced marker out of the block (1 case);
- the pins: 17 cases, 39 and 239 plants, and the two plant names in the README row (4 cases).

My `tdd-check.sh 4` rerun at 8dc8147 gives the same: the red phase fails 121 of 3579, fix-2 fails 18 of 7061, and HEAD passes 7061 tests in 208 files.

The cases that passed at once are reported in notes.md and were not forced red. They are the C1 `tooltip-delay` case, the `-delay` name without the marker, and the out-of-scope angles, easings and valid delay. Their behaviour already existed.

**No weakening.** `git diff 2041399..HEAD` on the six test files is empty. Between the earlier base record (64fd771) and the fix-2 red, the phase 4 test files changed only by:
- the C1 cases (landing, d4a56ea);
- a stricter `description` in three expected AX nodes of `scenarios/busy.ts`;
- a reduced-motion reset in `afterEach` (landing, 497b05f).

None of these loosens an assertion.

**Base check replaced by direct evidence (R3-02).** I made a worktree at base 55ec410 with HEAD's test files overlaid, as `tdd-check.sh` does, and ran the phase 4 suites directly:
- `vitest run --project tokens`: 28 of 161 fail (the delay, `ms`, block, README and source-table cases);
- `vitest run --project gates gates/test/brand-rules.test.ts gates/test/gates-readme.test.ts`: 19 of 65 fail, including every O2-01 and O2-02 rule (f) case.

All 47 failures are `AssertionError` ("expected function to throw", deep-equal mismatches). So the final tests fail against the code from before the phase, and they fail for missing behaviour. That is what sub-check 2 exists to show. I removed the worktree.

**Vacuity.** The new cases compare the full `{ code, out, err }` or the exact finding list with `toEqual`, and the validate cases compare the exact problem messages. The "keeps … out of scope" case asserts exit 0 with "7 rules checked". It is a pass-case paired with the fail-cases on the same records. I found no `skip`/`only`, no conditional expect and no mocks. `gate:test-lint` reports 291 files with no finding.

The two plants each pin exactly one finding at the record, with the message (`plant.json`). Together with the wrapped `validateSource`, that proves rule (f) itself reports. Without the wrapper, the gate's own `validateSource` would exit 2 first.

**Mutation.** I ran `pnpm run gate:mutation -- --base 2041399 --files packages/tokens/src/generate.ts,gates/bin/brand-rules.ts` at HEAD: "121 mutants on the changed lines of 2 files, none survived; 13 timeouts, 30 compile errors, 0 zero-mutant entries; 0 equivalent records". This matches notes.md; the timeouts are discussed in R3-04.

The phase-base form (`--base 55ec410`) would now mutate the source of missions 008, 011 and 013 and of phases 5 and 6. Round 1 already ran it on the phase's own source. bd9aaca changes only these two source files, so the scoped run covers every changed line of this round.

## Checks run

At 8dc8147, with a clean tree apart from the evidence files below:

| Check | Result |
|---|---|
| `tdd-check.sh 4` (rerun, HEAD newer than the record) | `pass`: red phase exit 1 (121 of 3579), fix-2 exit 1 (18 of 7061), final tests on base exit 2 (R3-02), HEAD exit 0 (7061 tests passed in 208 files) |
| `gate:typecheck` | no type error |
| `gate:lint` | 402 files, no finding |
| `gate:test-lint` | 291 files, no finding |
| `gate:style-lint` | 33 files, no finding |
| `gate:brand-rules` | 7 rules checked, 0 findings (`tooltip-delay` is the only `delay: true`, source.ts:280; every other motion duration is a literal `ms` value, source.ts:273-277) |
| `gate:contrast` | 207 pairs in light, 215 in dark (196 required per theme), unchanged |
| `gate:manifest` | 16 elements, no finding |
| `gate:prefix`, `gate:pins`, `gate:csp`, `gate:config-copies` | no finding |
| `gate:signoff -- --range 70f2936..HEAD` | 12 commits, no finding |
| `gate:mutation -- --base 2041399 --files …` | exit 0, see Test quality |
| `gate:plants -- --affected 55ec410 --list` | 312 of 312 selected, every plant (R3-01) |

I did not run the plants. notes.md and plants.md record shards 1 to 3 as "every plant as expected", and both new plants as expected (55.6 s and 128.1 s). The visual and axe shards were not rerun, for the reason given in R3-01.

**Tasks.** T049b to T049f are ticked, and their work is present:
- the red cases and pins;
- `isDelay` and `notDuration` in `generate.ts`, and `recordProblems` refusing both cases;
- rule (f) reporting at the record before the block's findings, with `motionDurations` evaluated even when the block is missing;
- the plants `f-delay-marker-misplaced` (motion-pause at 300ms) and `f-motion-not-ms` (motion-slow at 1s), each with a wrapped `validateSource`;
- the `gates/README.md` plants cell, 002 contracts/gates.md, and the tokens README and CHANGELOG;
- the notes and plants records.

**Plan and docs (56f0e4f).** Decision 29 in plan.md quotes O2-01 and O2-02 verbatim. It defines the valid delay, the misplaced marker, the closed list of non-durations and the non-`ms` duration, and it states that both readers keep their own copy of the classification. spec.md, research.md R-07, contracts/checks.md, data-model.md and quickstart.md say the same thing, and the code follows it: both copies use the same two regexes, and `isDelay` matches the rule (f) predicate.

**Constitution.** Tokens and the brand rules follow the amended decision 29, and no element source changed. Reduced motion is stricter than before, not relaxed.

## Judgements asked for

**(1) Does tdd-check's `pass` still hold as evidence?** As a status, yes: the procedure reads the status, and sub-checks 1 and 4 hold with real assertion failures and a full pass. As evidence for sub-check 2, no: exit 2 is a run that could not start, not a red run (R3-02).

What is needed is direct evidence that the final phase 4 tests fail against base for missing behaviour. I supplied it with the targeted runs above: 47 assertion failures, no setup error. Together with the red-fix-2 log and the unchanged tests since 2041399, it is sufficient. No change to the phase is needed for this. The tooling gap belongs to the story extension.

**(2) The planner's reading of the operator's answers.** O2-02 says verbatim "reports a finding for any motion-group duration that isn't a literal `<number>ms`, unless it is a valid delay". Exempting a valid delay from the `ms` requirement is therefore the literal reading, not a loosening. The consequence is that a valid delay's value is not checked by rule (f) or `validateSource` (validate.test.ts accepts `hover-delay` at `1s`). That is acceptable, because a delay is never zeroed, and the operator chose exactly this.

O2-01 says "accept `delay: true` only on a motion token whose name ends in `-delay` … and fail with a finding otherwise". A record outside group `motion`, even one named `-delay`, is not a motion token, so a finding is required. The code does this (`shell-delay` in both test files). Both readings are correct.

## Earlier findings

- **O2-01: resolved.**
  - `validateSource` refuses `delay: true` unless the record is of group `motion` and named `-delay` (generate.ts:98-100, :180). Rule (f) reports it at the record (brand-rules.ts, `motionDurations`).
  - A misplaced marker exempts nothing. The generator's block keeps `motion-pause` (generate.test.ts), and rule (f) also requires `motion-base` at 0ms when it carries the marker.
  - `tooltip-delay` still passes (`gate:brand-rules` 0 findings).
  - Red came first (fix-2), there is a unit test in each reader, and the fail plant `f-delay-marker-misplaced` is in place.
- **O2-02: resolved.**
  - A motion value that is not a literal `ms` value, an angle or an easing function, and is not a valid delay, is a finding at the record and is not required in the block. Covered: `1s`, `var()`, `calc()`, and a per-theme value (rule (f); the generator refuses it through its existing theme rule, which is pinned).
  - `validateSource` refuses it.
  - Fail plant `f-motion-not-ms`.
  - The way non-durations are told apart is stated in notes.md and plan decision 29 (see R3-03 for a minor gap).
  - Pins: 15 to 17, 37 to 39 and 237 to 239. The `gates/README.md` row and 002's plant table are updated.
- The fixes record's plant evidence is not in the op 016 form; that is R3-01.

Evidence files under `reviews/phase-4/` that my rerun rewrote: `tdd-check.json` and `check-red-phase.log`, `check-red-fix-2.log`, `check-final-tests-on-base.log` and `check-head.log`. The four logs now carry the local pnpm store path rather than the `<pnpm store>` placeholder of 60c20af. As instructed for this round, nothing is committed.
