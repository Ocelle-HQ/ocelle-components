---

description: "Task list for mission 007: mutation gate strictness (#23)"
---

# Tasks: Mutation gate strictness

**Input**: design documents in `specs/007-mutation-gate-strictness/`, as approved at the plan gate on 2026-11-10 after
three plan-squad rounds (`reviews/plan/round-1` to `round-3`):
- spec.md (FR-001 to FR-016, SC-001 to SC-005, *Dropped*);
- plan.md;
- research.md, R-01 to R-08;
- data-model.md;
- contracts/mutation-output.md;
- quickstart.md.

**Tests**: required. Constitution Principle VIII applies to every phase. The phase flow is `base.sh`, one red commit
of test files only (test pathspec of `.specify/extensions/story/story-config.yml`: `**/*.test.ts`, `**/test/**`, …)
proven by `.specify/extensions/story/scripts/red.sh <N> phase`, then green, `tdd-check.sh <N>` and an independent
review. Plants (`gates/plants/**`) are not test files: they are committed in green, and their red run against the old
gate is recorded as evidence (research R-02, *Order in User Story 1*).

**Operator decisions that bind these tasks** (all human:jeroennouwsdev, 2026-11-10): report and pass for Timeout,
CompileError and zero-mutant entries (spec § Clarifications); the CI measurement is a commit on the mission's pull
request at landing (SPEC-1-04); mixed shards dropped (SPEC-1-05); a `--files` list naming one file more than once is
exit 2 (PLAN-CORRECTNESS-1-005 (a)); named killer list, `statusReason` judged only for its kind (PLAN-FRESH-2-001 (a)
and its clarification); lever 2 always before lever 3 (PLAN-FRESH-2-002 (a)); `source-table.test.ts` first through a
mutation-only split of `tokens` (PLAN-FRESH-3-001 (a)). No follow-up issue is proposed or filed: anything not done is
listed under spec *Dropped* by the operator's decision.

**Environment** (every phase): `OCELLE_CHROMIUM_PATH=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome`; for
Stryker and plant runs, `PLAYWRIGHT_BROWSERS_PATH` at the alias of `knowledge/speckit-flows/findings/frontend-missions.md`
§ Browser path. One heavy job (browser tests, mutation, plants) at a time; never `gate:plants` during a mutation run.
Never `git stash`: scratch edits are restored with `git checkout -- <file>`.

**Stop-and-ask points**: the implementer stops, records the question in the phase review and does not work around it:
- the T004 probe shows Stryker 10.1.1 writes **no** report for a zero-mutant run (then R-03's fallback tasks apply, and
  the implementer reports that they were needed);
- after lever 2 (T028), any `source.ts` entry still misses 176 s or keeps a Timeout (lever 3, FR-014: an amendment of
  001 FR-013 is the operator's decision);
- `groupOrder` does not reorder the modules under Stryker's options (the T019 test stays red after T021): the custom
  sequencer fallback of R-05 needs the operator's go-ahead before it is written;
- any per-mutant comparison (R-06) fails loudly on a repeated or unmatched key, or a Killed → Timeout move survives its
  re-run;
- any mutation shard over 10 minutes.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: can run in parallel (different files, no dependency on an unfinished task)
- **[Story]**: the user story of the task (US1, US2)
- Paths are relative to the repository root.

---

## Phase 1: Setup - red measurement before any mission code (spec FR-011a)

**Purpose**: the red evidence of User Story 2, taken with the gate and configuration of `main` (research R-06, *When
the red runs are taken*). No code and no test changes: the phase is evidence only (Principle VIII exemption; its
review states that no test could fail for it). Its flow: `base.sh 1`, the evidence commit (T003), then
`tdd-check.sh 1`, which has no red commit and no test change to check and is expected to report `exempt` (the review
records the status as given), then the review.

**Independent Test**: `specs/007-mutation-gate-strictness/evidence/red/` holds, for each of the four `source.ts`
entries and the two FR-013 reference entries, the run's stdout, stderr, wall time and `mutation.json`, and
`evidence/README.md` has the red table.

- [X] T001 Set up the environment above; `B=$(git rev-parse ec0f533~1)`. Run `pnpm --silent run gate:mutation -- --base "$B" --plan` and save stdout and stderr to `specs/007-mutation-gate-strictness/evidence/red/plan.txt`. Confirm the `source.ts` entries are exactly `packages/tokens/src/source.ts:1-60`, `:61-120`, `:121-180`, `:181-230`, and record the cut count from stderr (spec FR-009). Note the first `packages/tokens/src/generate.ts` entry of the plan (the FR-013 reference entry); the other reference entry is `gates/lib/wcag.ts`.
- [X] T002 Red measurement runs, one at a time (research R-06 *Command*): `/usr/bin/time -f '%e s' pnpm --silent run gate:mutation -- --base "$B" --files "<entry>"` for each of the four `source.ts` entries and the two reference entries. For each, write `evidence/red/<entry-slug>/stdout.txt`, `stderr.txt`, `time.txt` and a copy of `reports/mutation/mutation.json`.
- [X] T003 Checker split, a diagnostic (research R-06 *The checker split*): for each `source.ts` entry, run the same command once more with `"checkers": []` as a scratch edit of `stryker.config.json`, then restore it with `git checkout -- stryker.config.json`. Save as `evidence/red/<entry-slug>/no-checker/`. Write `specs/007-mutation-gate-strictness/evidence/README.md` with the red table of research R-06 *Where it is kept* (mutants, Killed, Timeout, Survived, NoCoverage, CompileError, time, checker split labelled "diagnostic, not the checker's share", within 176 s), every Timeout and CompileError of each `source.ts` entry keyed by record name, field, theme and mutator (spec FR-011) and by start and end (line, column), mutator and replacement (R-06), read from the kept `mutation.json`. Commit the evidence alone (`docs(007): red measurement before any change`), signed off.

**Checkpoint**: the red figures exist before any mission code; op 004's numbers are context only.

---

## Phase 2: User Story 1 - The gate shows every changed-line mutant that no test was seen killing (Priority: P1) 🎯 MVP

**Goal**: the report lines and summaries of `contracts/mutation-output.md`, the repeated-file exit-2 cause, the plant
judge's reserved rules and `reports` key, the plants, and the records (spec FR-001 to FR-008, FR-015 for FR-011 of 001,
FR-016 for the zero-mutant candidate).

**Independent Test**:
- `pnpm test` passes, with the red tests of T005 to T009 green.
- `pnpm run gate:plants` passes: every mutation plant keeps its verdict, `pass-compile-error` and `pass-zero-mutant`
  assert their report lines, `pass-fully-checked` asserts none, `error-zero-mutant-failing-test` ends exit 2.
- `tdd-check.sh 2` reports `pass`.

### Probe (first, no commit)

- [X] T004 [US1] Zero-mutant probe (research R-03): build the `pass-zero-mutant` plant's trees in the scratchpad, modelled on `gates/plants/mutation/pass-compile-error/` (`base/`, `head/`): one package source file under `packages/tokens/src/` whose `head` differs from `base` only by a type-only change (an added `type` alias or interface, no runtime code). Run it through the **unchanged** gate the way the plant runner does (`gates/lib/plant-runner.ts`) and record whether Stryker 10.1.1 wrote `reports/mutation/mutation.json`, its `files` content, Stryker's `Instrumented … with … mutant(s)` line and the gate's exit and output, in `specs/007-mutation-gate-strictness/evidence/us1-zero-mutant-probe.md`. If a report was written (as the source shows), T009's fallback cases are dropped from this phase (state it in the probe note). If none was written: stop-and-ask, then T009 includes the fallback cases.

### Tests (red, one commit)

- [X] T005 [P] [US1] `gates/test/plant-judge.test.ts` (research R-02, *Red tests of the judge*): a mutation pass plant with `records` and `timeout`/`compile-error`/`zero-mutants` lines in the run passes; a pass plant with `reports` and no `records` passes on the matching run; a missing report line, an unexpected one, a duplicated one (multiset: two identical lines need two entries) and a message-substring mismatch each fail with their problem; a fail plant with `reports` judges both its findings and its report lines; `reports` on a plant of another gate is rejected; `parsePlant` accepts `reports` (`[{ "location", "rule", "message"? }]`, `rule` one of `timeout`, `compile-error`, `zero-mutants`) and still rejects other unknown keys; the report rules are never counted as findings of a mutation run.
- [X] T006 [P] [US1] `gates/test/findings.test.ts`: `plural(count, noun, pluralNoun)` gives the singular for 1 and the given plural for 0 and 2 (`plural(2, "zero-mutant entry", "zero-mutant entries")` → `2 zero-mutant entries`), and the two-argument form is unchanged (research R-04).
- [X] T007 [P] [US1] `gates/test/mutation-report.test.ts` (data-model § Mutant verdict): `classifyMutants` returns `timeouts`, `compileErrors` and `zeroEntries` besides `findings` and `mutants`, for every status of data-model's status table (Killed, RuntimeError, Timeout, CompileError, Ignored, Survived, NoCoverage, an unknown status → exit-2 cause unchanged), with the verdicts of spec FR-007 unchanged; only mutants whose range overlaps a changed range count, and an undecided mutant is reported at its start line even when that line is unchanged (FR-001); a Timeout or CompileError on an unchanged line is neither reported nor counted; an entry with no mutant on its changed lines is a zero-mutant entry, including a file the report lists with mutants only off its changed lines; the order is changed-file order, then start line, then start column, then mutant id compared as a number (a non-decimal id after every numeric one, by string) (research R-01).
- [X] T008 [P] [US1] `gates/test/mutation-shards.test.ts` (research R-03, operator decision PLAN-CORRECTNESS-1-005 (a)): `selectFiles` carries each selected file's `entry` exactly as given (trimmed as today); `--files a.ts:1-60,a.ts:61-120`, `--files a.ts,a.ts:1-60` and a repeated entry each end exit 2 before Stryker runs, with the cause `mutation: could not run: --files names one file more than once (two entries of one file never share a shard): <entry>, <entry>; run --plan for the shards` naming every entry of each such file in list order; the check runs after the malformed check and before the missing and empty checks. Replace the second half of "entries of one file joined" (`:586-591`, the joined value `a.ts,b.ts:1-60,b.ts:61-120,b.ts:121-130` passing) by that exit-2 case; keep its first half (`:583`). State the replacement and its reason in the phase review.
- [X] T009 [P] [US1] Gate output tests in `gates/test/mutation-shards.test.ts`, `gates/test/mutation-records.test.ts` and `gates/test/mutation-ranges.test.ts`, with the Stryker doubles of `gates/test/mutation-fakes.ts` (contracts/mutation-output.md): the line groups in order (records, `timeout`, `compile-error`, `zero-mutants`, findings at exit 1, summary); `<path>:<start line>: mutation: timeout: <mutator>: replaced by <replacement>` and the `compile-error` form, the replacement through `oneLine`; `<entry>: mutation: zero-mutants: no mutant on the changed lines` with `<entry>` the path in a whole-diff run and the `--files` item as given (`path:start-end`) in a shard run (spec US1 AS6); both summary forms with all counts, also when zero, and the singular forms (`1 timeout`, `1 compile error`, `1 zero-mutant entry`); a survivor plus a Timeout → exit 1 with the finding and the `timeout` line apart (AS5); a run with no mutant at all → every entry zero-mutant, exit 0 (spec edge case); a change to a test file beside a source change → only the source entry can be a zero-mutant entry, the test file never (spec edge case, out-of-scope file); exit 2 prints no report line; the "nothing to mutate" line unchanged; nothing truncated (121 Timeouts all listed). Extend the existing exact summaries with the three counts: `gates/test/mutation-ranges.test.ts:356,374,441`, `gates/test/mutation-records.test.ts:148`, `gates/test/mutation-shards.test.ts:574,583,665,717`, and every other exact `mutation:` summary `grep -rn '"mutation: ' gates/test` finds (not `:589`, which T008 replaces). Only if T004 found no report: the R-03 fallback cases (`with 10 mutant(s)` and no report → exit 2; the zero line with a non-zero exit, and with the dry run's ERROR line → exit 2 with today's cause; the zero line, exit 0, no ERROR → pass, every entry zero-mutant).
- [X] T010 [US1] Commit T005 to T009 alone (`test(007-mutation-gate-strictness): phase 2 red — US1 report`), signed off, and run `.specify/extensions/story/scripts/red.sh 2 phase`. The failures must be the missing behaviour (missing lines, counts, keys, cause), not an import or setup error.

### Implementation (green)

- [X] T011 [US1] `gates/lib/plant-judge.ts` (research R-02): `parsePlant` accepts `reports`; `records` compares only `record` lines; `reports`, when present, compares only the three report rules by location and rule (and message substring when given) as a multiset (a count-aware comparison beside `differ`); `reports` on a non-mutation plant is a problem; the four reserved rules are never findings of a mutation run. T005 green.
- [X] T012 [US1] Plants (research R-02 table), committed in green: `gates/plants/mutation/pass-compile-error/plant.json` gains `reports` with its one `compile-error` line; `gates/plants/mutation/pass-fully-checked/plant.json` gains `"reports": []`; new `gates/plants/mutation/pass-zero-mutant/` (the T004 trees, `reports` with its `zero-mutants` line, no `base` key); new `gates/plants/mutation/error-zero-mutant-failing-test/` (a type-only change plus a test that fails without any mutant; `expect: "error"` with Stryker's dry-run cause as `error-dry-run-fails` names it). Plants are found by directory (no registry lists them by name); `gates/README.md`'s mutation plant column names them in words, and T015 updates it. Run `pnpm run gate:plants` against the gate as it is before T013 and save the output to `specs/007-mutation-gate-strictness/evidence/us1-plants-red.txt`: `pass-compile-error` and `pass-zero-mutant` must fail on their missing report lines (the plants' red run).
- [X] T013 [US1] `gates/lib/findings.ts`: `plural()` with the optional irregular plural (research R-04). `gates/lib/mutation/shards.ts`: `entry` on each selected file and the repeated-file exit-2 cause (research R-03, data-model § Entry). `gates/lib/mutation/report.ts`: `classifyMutants` returns `timeouts`, `compileErrors` and `zeroEntries` in the contract's order (data-model § Mutant verdict); update its header comment. Only if T004 found no report: the R-03 fallback, exactly as research R-03 conditions it.
- [X] T014 [US1] `gates/bin/mutation.ts`: print the report lines and both summaries of `contracts/mutation-output.md`, in its order; the "nothing to mutate" line and every exit-2 cause unchanged; update its header comment. T006 to T009 green.
- [X] T015 [P] [US1] Records (research R-08), each a dated 007 amendment (2026-11-10) that keeps the earlier text: `specs/001-repository-foundation/spec.md` FR-011 (the report of FR-001 to FR-004 and the operator's three answers); `specs/001-repository-foundation/contracts/gate-cli.md` (the general location rule at `:8` and the mutation row: report lines, which may carry `path:start-end`; the new exit-2 cause); `specs/001-repository-foundation/contracts/plants.md` (`plant.json` shape `:4`, mutation row `:49`, plant-job failure rule `:61-65`); `specs/001-repository-foundation/data-model.md` § Finding (`location` row) and § Plant (`reports` row, `records` limited to `record` lines, the caught and accepted rules); `gates/README.md` mutation row (report lines, new plants).
- [X] T016 [P] [US1] The reader sentences (research R-08): one sentence in `tooling/speckit/extensions/story/commands/speckit.story.review.md`, `.specify/extensions/story/commands/speckit.story.review.md` and `.specify/extensions/story/.specify-dev/agent-commands/claude/speckit-story-review/SKILL.md` (front matter unchanged): the `timeout`, `compile-error` and `zero-mutants` lines are reports to read, not blocking findings. Reinstall with `specify` as `tooling/speckit/README.md:9-14` says if it is on the `PATH`, otherwise write the sentence by hand into both installed copies; then `diff` each installed copy against the source shows only what it shows today. One sentence in `.claude/skills/ocelle-land/SKILL.md` near `:117-120`: the report lines are not findings, and `--files` names each changed file once (a file named twice ends exit 2).
- [X] T017 [P] [US1] `knowledge/speckit-flows/log.md`: an Update under 2026-11-10 closing the zero-mutant gate-flag candidate (2026-11-04 and the 2026-11-10 Update): resolved by mission 007 as a report line, not a failure (operator decision, triage 007).
- [X] T018 [US1] Run `pnpm test`, `pnpm run gate:typecheck`, `gate:lint`, `gate:test-lint`, then `pnpm run gate:plants` (alone; save to `evidence/us1-plants-green.txt`: every plant passes) and `pnpm run gate:mutation -- --base <phase base>` (alone; save to `evidence/us1-gate.log`: exit 0, the new code fully killed, its own report lines read). Commit green (`feat(007-mutation-gate-strictness): phase 2 — US1 report`), signed off, then `.specify/extensions/story/scripts/tdd-check.sh 2` (`pass`).

**Checkpoint**: a reviewer sees every Timeout, CompileError and zero-mutant entry on the changed lines from the gate's
output alone (SC-001), and no verdict changed (SC-002).

---

## Phase 3: User Story 2 - A broad edit of the token source gets real kills and fits the CI shard limit (Priority: P2)

**Goal**: with lever 1 (and lever 2 only if needed), every `source.ts` entry's measurement run has 0 Timeout, 0
Survived, 0 NoCoverage and finishes within 176 s; every former Timeout ends as FR-011 allows; FR-013's reference
entries are not worse; `dist` is identical (spec FR-009 to FR-013, SC-003 to SC-005).

**Independent Test**:
- `gates/test/integration/vitest-mutation-config.test.ts` passes (module start order, config assertion).
- `evidence/README.md` has the green table, the per-mutant comparisons and the FR-011 record, all within the bounds.
- `tdd-check.sh 3` reports `pass`.
- The CI half of FR-010 is open for landing (research R-07); it is not a task of this phase.

### Tests (red, one commit)

- [X] T019 [US2] `gates/test/integration/vitest-mutation-config.test.ts` (research R-05, *Red-first*): (1) a behavioural test that creates Vitest through `createVitest` of `vitest/node` with `vitest.mutation.config.ts`, `maxWorkers: 1`, `maxConcurrency: 1`, `bail: 1` (as `@stryker-mutator/vitest-runner` 10.1.1 `vitest-test-runner.js:105-140` passes them), records each test module's start with a reporter, stops once a module of a project other than `tokens-source-table` and `tokens` starts, and asserts that `packages/tokens/test/source-table.test.ts` started before every other module (`build.test.ts`, `validate.test.ts`, `generate.test.ts` included) and that every module under `packages/tokens/test/` outside `browser/` started before any module of another project; (2) replace the deep-equal at `:40` by the stricter assertion of R-05: mutation project names exactly `["tokens-source-table", "tokens", "styles", "elements", "storybook", "gates"]`; each project with its whole `test.sequence` removed deep-equals its `vitest.config.ts` counterpart, with the two stated split exceptions; `test.sequence` exactly `{ groupOrder: 1 }`, `{ groupOrder: 2 }` and `{ groupOrder: 3 }` as R-05 assigns; the collected test modules exactly those of `vitest.config.ts` outside the four excluded projects, each once. State the replacement and its reason in the phase review.
- [X] T020 [US2] Commit T019 alone (`test(007-mutation-gate-strictness): phase 3 red — US2 order`), signed off, and run `.specify/extensions/story/scripts/red.sh 3 phase`: red because the token tests run last today, not because of a setup error.

### Implementation (green)

- [X] T021 [US2] Lever 1 (research R-05, operator decision PLAN-FRESH-3-001 (a)): in `vitest.mutation.config.ts` only, split `tokens` into `tokens-source-table` (`include: ["packages/tokens/test/source-table.test.ts"]`, `sequence: { groupOrder: 1 }`) and `tokens` (that path added to `exclude`, `sequence: { groupOrder: 2 }`); every other mutation project `sequence: { groupOrder: 3 }`; no project at 0. Update the file's header comment (why the split, the child-process mechanism of `build.test.ts`). `vitest.config.ts` and `pnpm test` unchanged. T019 green. If T019 stays red because `groupOrder` does not reorder under these options: stop-and-ask (the custom sequencer fallback of R-05).
- [X] T022 [US2] Run `pnpm run gate:plants` alone: every mutation plant keeps its verdict with lever 1 (save to `evidence/us2-plants.txt`).
- [X] T023 [US2] Green measurement runs, one at a time, with the T002 command and the same base `B`, for the four `source.ts` entries and the two reference entries; save under `evidence/green/<entry-slug>/` (stdout with the US1 report lines, stderr, time, `mutation.json`). For any `source.ts` entry over 176 s, also the checker split of T003 under `no-checker/`.
- [X] T024 [US2] Per-mutant comparisons in `evidence/README.md` (research R-06), keyed by start and end (line, column), mutator and replacement, failing loudly on a repeated or unmatched key. The comparison is one script, `specs/007-mutation-gate-strictness/evidence/compare.mjs` (`node evidence/compare.mjs <red mutation.json> <green mutation.json> <path>`), which exits non-zero and names the key on a repeated key within one run's file or a key present in only one run, and otherwise prints every status move; the command lines and their output are kept verbatim in `evidence/README.md`, so the reviewer can re-run them. It covers the two FR-013 reference entries (no Killed → Timeout, Survived or NoCoverage; no count the wrong way) and the four `source.ts` entries (every Killed → Timeout move listed with its red `killedBy` and green `testsCompleted`). A Killed → Timeout move triggers one re-run of both the red and the green run of that entry, one at a time (the red re-run on a scratch worktree of the phase-1 base, `git worktree add`, removed afterwards); it counts only if the re-run shows it again, and both pairs are recorded.
- [X] T025 [US2] FR-011 record in `evidence/README.md` (research R-06, operator decision PLAN-FRESH-2-001 (a) and its clarification): every mutant T003 recorded as Timeout, by record name, field, theme and mutator, with red and green status; for Killed, `killedBy`, `statusReason` (recorded as given) and `testsCompleted`, and the three criteria checked and noted per row: (1) every `killedBy` test is a token test (`tokens-source-table` or `tokens`); (2) `statusReason` is an `expect` mismatch, not an error at load or setup; (3) `killedBy` is one of "declares each token's light value (or its one value) in the unconditioned :root block" (`source-table.test.ts:39`), "declares each theme-dependent token's dark value under both dark selectors, where it differs from light" (`:45`), "gives each token its group, its resolved value per theme (or its one value) and its references" (`:76`). A CompileError is allowed only where T003 already recorded that mutant as CompileError. Message text alone is never a criterion failure.
- [X] T026 [US2] By hand (spec US2 AS4): one Killed mutant per group that has one (B, C, and A if any) applied to a scratch copy of `packages/tokens/src/source.ts` in the working tree, the token tests run (`pnpm exec vitest run --config vitest.mutation.config.ts --project tokens-source-table --project tokens`), the Vitest diff naming the mutated key saved to `evidence/by-hand/<group>.txt`, and the file restored with `git checkout -- packages/tokens/src/source.ts`.
- [X] T027 [US2] Decide from the T023 to T025 figures alone (FR-010), recorded in `evidence/README.md`: if every `source.ts` entry has 0 Timeout, 0 Survived, 0 NoCoverage, is within 176 s and meets FR-011, and the reference entries pass T024, lever 2 is not needed: say so and mark T028 done with that note. Otherwise T028 applies.
- [X] T028 [US2] Lever 2, only if T027 says so (research R-05, operator decision PLAN-FRESH-2-002 (a)): measure `concurrency` 8 (today), 4 and 12 in `stryker.config.json` on the slowest `source.ts` entry, with the checker split as a diagnostic; if the CI runner may have 2 vCPUs (R-05), also with the gate pinned to two cores (`taskset -c 0,1`). Keep the value that brings the slowest entry within 176 s without making the reference entries slower; rerun T023 to T025 for every entry with it. If no value does: stop-and-ask (lever 3, FR-014). Its review states why no test could fail for it (Principle VIII exemption).
  **Outcome (2026-11-11):** measured on `source.ts:121-180`: concurrency 4 → 358.77 s, 8 → 283.22 s, 12 → 316.27 s (checker off 66.23 s, 76.87 s, 76.13 s; `evidence/README.md` § Lever 2). No value brings it within 176 s, so none is kept and `concurrency` stays 8; the reruns of T023 to T025 with a new value fall away. The two-core (`taskset -c 0,1`) runs were not taken: they only rank candidates for a 2-vCPU runner, and no candidate fit on four cores. Stop-and-ask recorded (`reviews/phase-3/stop-and-ask.md`); the operator decided lever 3, "30-line entries, all files" (`reviews/phase-3/operator-decision-fr014.md`, 2026-11-11), done by T032 to T037.
### Lever 3 (spec FR-014; operator decision 2026-11-11, `reviews/phase-3/operator-decision-fr014.md`)

001 FR-013's entry bound for a split file goes from 60 to 30 changed lines, for every file. The other shard bounds
(10 entries and 250 changed lines per shard; entries of one file never share a shard) are unchanged.

- [X] T032 [US2] Lever 3 red: in `gates/test/mutation-shards.test.ts`, every `planShards`, `countCuts`, `formatPlan` and `--plan` case that states the 60-line split (its entries, line counts, shard and cut counts) is changed to the 30-line bound, with boundary cases at 30 (one entry) and 31 (split), a cut inside a range where the count reaches 30, and the recorded `plant-judge.ts` diff split into entries of 30; the "plan's joined value" case of T008 names the 30-line plan's entries. Find every other test that asserts the 60-line split with `grep -rnE '1-60|61-120|\b60\b' gates/test` (location strings that only name a range, as in `plant-judge.test.ts`, are not the bound). Commit the tests alone (`test(007-mutation-gate-strictness): phase 3 red — lever 3 30-line entries`), signed off, and run `.specify/extensions/story/scripts/red.sh 3 lever-3`: red because the plan still cuts at 60.
- [X] T033 [US2] `gates/lib/mutation/shards.ts`: the entry bound `maxEntryLines` 30, and its header and doc comments (the 007 decision beside the earlier ones); `gates/bin/mutation.ts` header comment. T032 green.
- [X] T034 [P] [US2] Records (spec FR-015), each a dated 007 amendment (2026-11-11) that keeps the earlier text: `specs/001-repository-foundation/spec.md` FR-013 and SC-005 where they state the bound; `specs/001-repository-foundation/contracts/gate-cli.md` mutation row; `gates/README.md` (the `mutation-plan` paragraph); this mission's `spec.md`, `plan.md` and `research.md` where they state 60 as the gate's bound (a dated note, the earlier text kept).
- [ ] T035 [US2] Re-plan (FR-009): `pnpm --silent run gate:mutation -- --base "$B" --plan` with the T001 base, stdout and stderr to `evidence/lever3/plan.txt`; record the `source.ts` entries and the cut count in `evidence/README.md`.
- [ ] T036 [US2] Lever 3 measurement runs, one at a time, with the T002 command for every `source.ts` entry of T035's plan, lever 1 in place, saved under `evidence/lever3/<entry-slug>/` (stdout, stderr, time, `mutation.json`); commit each run's evidence as soon as it is written. Per-mutant comparison with `evidence/compare.mjs` against the red runs (each red 60-line entry against the 30-line entries it covers); the mutants that span the new cuts are absent from the lever 3 runs and are listed as the cut limit (001 FR-013, accepted). FR-011 checked again for the 122 former Timeouts. A green table in `evidence/README.md`.
- [ ] T037 [US2] Decide from T036 alone (FR-009, FR-010, FR-011), recorded in `evidence/README.md`: if every `source.ts` entry has 0 Timeout, 0 Survived, 0 NoCoverage, finishes within 176 s and FR-011 holds, T029 to T031 follow (the "Open for landing" section then expects the 30-line `source.ts` entries of T035, not the four 60-line entries R-07 names). Otherwise stop-and-ask: the question goes back to the operator.

- [X] T029 [US2] `pnpm --filter @ocelle/tokens build` at the phase base (a scratch worktree, removed afterwards) and at HEAD; `cmp` `packages/tokens/dist/tokens.css`, `tokens.json` and `index.d.ts`: identical (spec SC-005). Record in `evidence/README.md`.
- [ ] T030 [P] [US2] `knowledge/speckit-flows/findings/frontend-missions.md` § Mutation shard time: close "the next lever is a bound on mutants per shard" with how it was resolved (lever 1, and lever 2 if used, with the figures), or with the operator's FR-014 decision. Only under lever 3: the dated amendment of 001 FR-013 and SC-005 the operator decided (spec FR-014, FR-015).
- [ ] T031 [US2] Run `pnpm test`, `gate:typecheck`, `gate:lint`, `gate:test-lint`, and `pnpm run gate:mutation -- --base <phase base>` alone (save to `evidence/us2-gate.log`). FR-012 check, recorded in `evidence/README.md`: `git diff --stat <phase-1 base> -- packages/tokens/src stryker.config.json` shows no change (or only lever 2's `concurrency` line), and `grep -rn "Stryker disable" packages/tokens/src` shows nothing new. Landing hand-off (spec FR-010, CI half): an "Open for landing" section in `evidence/README.md` with research R-07's procedure and decision rules (the measurement commit, the local `--plan` check, the times, core count and run link to record, the revert, the draft-pull-request case pushed and opened by the operator, and the operator decision for an alone shard over 480 s), so the landing pass reads it. Commit green (`feat(007-mutation-gate-strictness): phase 3 — US2 token source`), signed off, then `.specify/extensions/story/scripts/tdd-check.sh 3` (`pass`).

**Checkpoint**: a broad edit of `source.ts` gets real kills within Stryker's limit and every entry fits 176 s on the
sandbox; the CI measurement waits for landing.

---

## Dependencies & Execution Order

- Phase 1 (red measurement) before any mission code, then phase 2 (US1), then phase 3 (US2). US2's green runs use the
  US1 gate, so they print the report lines (plan § Structure decision).
- Within a phase: base, the red commit, green, `tdd-check.sh` and review; each phase is folded after approval.
- Within phase 2: T004 (probe) before T009 (it decides the fallback cases); T011 (judge) before T012 (plants), and T012's
  red plant run before T013 and T014.
- Within phase 3: T021 before T022 and T023; T023 before T024 to T027; T028 only if T027 says so; T032 to T037 (lever 3) after T028's stop-and-ask and the operator's FR-014 decision, T032 before T033, T033 before T035 and T036; T029 (rerun at the final HEAD), T030 and T031 after T037.
- **Landing (not a task of this run; research R-07):** the measurement commit on the mission's pull request (a trailing
  space on every line of `source.ts`, `--plan` checked locally first), the `gate:mutation` step time of every
  `source.ts` shard and the runner's core count recorded with the run link, then a revert before merge; a draft pull
  request with only that commit, pushed and opened by the operator, only if a mixed shard misses 480 s.
- One heavy job at a time; never `gate:plants` during a mutation run.

## Parallel Opportunities

- Phase 2: T005 to T009 (different test files; T009 waits for T004's outcome); T015, T016 and T017 after T014.
- Phase 3: T030 beside T029.
- Every heavy run (T002, T003, T004, T012's and T018's plant and gate runs, T022, T023, T024's re-runs, T028) runs alone.

## Implementation Strategy

- **MVP**: phases 1 and 2. The gate shows every undecided mutant and zero-mutant entry, with no verdict change.
- Then phase 3: the token source's mutants are killed within the limit and its entries fit the shard bound on the
  sandbox, with the CI measurement at landing.
