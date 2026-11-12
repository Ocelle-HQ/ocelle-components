---
scope: landing
phase: landing
round: 1
verdict: changes_requested
base: 3a247ef5f684a102f95e433e7cf41550839c79e4
head: da7416c
tdd_check: pass
---

# Landing review, round 1 (PR #25, mission 007-mutation-gate-strictness, #23)

This is a fresh second opinion on the integrated diff `origin/main...HEAD` (`3a247ef...da7416c`): 44 commits and 269
files, most of them evidence. The code and records part covers 52 files: `gates/bin/mutation.ts`,
`gates/lib/{findings,plant-judge}.ts`, `gates/lib/mutation/{report,shards}.ts`, `vitest.mutation.config.ts`, two new
and two edited mutation plants, eight test files, a new helper, the 001 amendments, `gates/README.md`, the three
review-command copies and the landing skill. The branch is 0 commits behind `main`, and
`git merge-tree --write-tree origin/main HEAD` is clean.

I used these as input: the phase reviews (phase 1 approved, `tdd-check` exempt with `tdd-exempt.md`; phases 2 and 3
approved, `tdd-check` pass on the folded SHAs), `evidence/README.md` and the CI result the orchestrator gave (all 22
check runs passed on `da7416c`, run 43066207921). This review looks for what they missed.

Settled, so not raised again here:
- the operator's report-and-pass policy for all three kinds;
- the repeated-file exit-2 cause (PLAN-CORRECTNESS-1-005 (a));
- lever 3 (30-line entries for all files, FR-014, 2026-11-11);
- the re-run rule for `source.ts:91-120` and `151-180`;
- phase 2 R1-01 (the greedy `message` match in `judgeReports`: it fails closed and no plant hits it, so it is dropped
  for the operator).

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| L1-01 | blocking | vitest.mutation.config.ts:37-41; spec FR-013; evidence/README.md:710-711 (FR-013 reference rows) | **Lever 1 turns kills of other files' static mutants into Timeouts, which FR-013 forbids.** The order is now `tokens-source-table` (1), then the rest of `tokens` (2), then every other project (3). So a static mutant of gate source runs every token module first, including `build.test.ts`'s two child Node processes, and only then reaches the gate test that kills it. Reproduction: `gate:mutation -- --base 3a247ef --files gates/lib/mutation/report.ts,gates/lib/plant-judge.ts`, Node 22, one job at a time. (1) At HEAD: **2 Timeouts** (plant-judge.ts:51, the `keys` set, StringLiteral `""` ×2), all static mutants. (2) A scratch worktree of HEAD with only `vitest.mutation.config.ts` and `gates/test/vitest-config.test.ts` set back to `origin/main`: **0 Timeouts**. The same mutants were Killed there, after 365 and 934 tests. (3) The worktree again, with the HEAD config restored: **2 Timeouts**, both Killed→Timeout against run (2). (4) The whole-diff run at HEAD (`--base 3a247ef`, 216 s) reported **8 Timeouts**: report.ts:106 `decimal` Regex ×4 and plant-judge.ts:51 StringLiteral ×4. The same code before lever 1 had **0 Timeouts** of the same 305 mutants (phase 2, `evidence/us1-gate.log`). Every status change goes one way, Killed→Timeout, and only on static mutants (13 static mutants in the two files). Which mutants move varies with load, but each HEAD run had some. The FR-013 check measured only `generate.ts:1-60` and `gates/lib/wcag.ts` (its 2 Timeouts were there before), so it could not see this. research.md:258-260 expected "seconds" for other files. No verdict changes, because a Timeout passes. But FR-013's "no more Timeout" does not hold for gate source, and each such mutant now uses its full timeout in every shard that holds it. | The operator decides, through an operator round on phase 3. Either (a) change the order so that other files' static mutants are not delayed, while `source.ts` keeps FR-009/FR-010 (for example `tokens-source-table` first and the other projects before the rest of `tokens`, or `build.test.ts` last). The red test is a FR-013 before/after comparison on a gate-source static mutant such as report.ts:106 or plant-judge.ts:51, and the `source.ts` sandbox runs must be measured again. Or (b) record a dated amendment of FR-013 that accepts Killed→Timeout for static mutants of other files, with this measurement as its evidence. |
| L1-02 | blocking | evidence/README.md:1317-1365 ("Open for landing"); spec FR-010, *Assumptions* "CI measurement" | **FR-010's CI half has not been measured.** CI on `da7416c` mutated only the gate diff, in 7 shards, with no `source.ts` entry. FR-010 is a MUST, and the spec puts its CI half at landing: a temporary commit with a trailing space on every `source.ts` line, a local `--plan` check showing the eight 30-line entries, each `source.ts` shard's `gate:mutation` step at most 480 s with the run link and core count, then a revert before merge. Until that is done, SC-004 is unproven. If L1-01 (a) changes the order, this measurement has to come after that fold. | The landing pass makes the measurement commit as `evidence/README.md` § Open for landing describes, records the result in the evidence, and reverts the commit. No code change. |
| L1-03 | note | gates/bin/mutation.ts:170 | A `timeout` or `compile-error` line for a mutant with no replacement ends in a trailing space (`… replaced by `). report.ts:159 gives `""` for a missing replacement. The finding path runs the whole message through `oneLine`, which trims the end; the report path does not. A reader comparing exact lines would see the difference. The contract does not specify this case. | Optional: trim the line, or print the replacement as the findings do. |
| L1-04 | note | specs/001-repository-foundation/research.md:372-383, :430; specs/001-repository-foundation/plan.md:50-51, :209-210 | 001's research R-08 "CI, sharded" and plan still say 60-line entries and have no dated 2026-11-11 note. The gate-cli.md mutation row sends readers to "research.md R-08". FR-015 does not list these two files, so this is not a requirement gap. | Optional: one dated sentence in each, pointing to the FR-013 amendment of 001 spec.md. |
| L1-05 | note | specs/001-repository-foundation/contracts/gate-cli.md:7 | The general exit-0 row still says "a one-line summary". The mutation gate now prints report lines at exit 0, as it already printed record lines. The mutation row's 007 amendment states this, so the contract is consistent, but the general row reads as if it were not. | Optional: add "(the mutation gate also prints record and report lines, see its row)". |
| L1-06 | note | gates/lib/mutation/shards.ts:43 (`maxEntryLines = 30`); this PR's `--plan` | The 30-line bound roughly doubles the cuts within files: 70 against 27 for the `source.ts` base, and 6 cuts for this PR's own 7 shards. A mutant that spans a cut is mutated in no CI shard. Here that is the plant-judge.ts BlockStatement at 219-237, across the cut at 233/234, and it is a CompileError anyway. The operator accepted this limit (O10-02, FR-014), and `frontend-missions.md` records the cost. The whole-diff run in phase reviews still mutates these mutants. | None; recorded for the operator. |
| L1-07 | note | evidence/** (37 files), reviews/phase-{1,2,3}/ logs and tdd-check.json (11 files) | 48 added evidence files contain absolute sandbox paths (the checkout under the home directory of the generic `user` account, and the pnpm store under the root home directory), which landing rule 8's scan matches. No personal data appears, as in mission 003 (L1-04 there). No source, contract or doc file has such a path. The only other match is the rule text itself in `.claude/skills/ocelle-land/SKILL.md`. | None required; for the operator's awareness. |

Dropped for the operator (no follow-up issue, operator rule):
- phase 2 R1-01 (the greedy `reports` message match);
- the `red.sh` label gap of phase 3 R1-01;
- L1-03 to L1-06, if they are not folded.

## Gate boundaries and the exit contract

- **Classification (report.ts:126-180).**
  - Verdicts are unchanged. `passing` and `surviving` are as on `main`.
  - An unknown status still returns `cannotRun` from inside the loop, so a run that ends in exit 2 prints no report
    line: `mutation.ts` prints the lines only after `verdict.ok`.
  - Only mutants that overlap a changed range are counted or reported. The line is the start line, as for findings.
  - Zero-mutant entries are named `file.entry ?? file.path`.
  - Order: changed-file order, then line, column and numeric id. Non-decimal ids sort last. A missing `column` gives
    `NaN`, which falls through to the id comparison, so the order is still total.
  - I probed `classifyMutants` directly (scratch script): two Timeouts at one position with ids "10" and "9" come out
    9 then 10, a multi-line replacement is joined, and a file with no mutant on its changed lines becomes a
    zero-mutant entry.
- **Equivalent-mutant record (report.ts:115).** This is the only record in the changed code, and the gate lists it.
  The line runs only for two non-decimal ids with `a >= b`. Every mutant of `a > b ? 1 : 0` (ConditionalExpression,
  `>=`, `<=`) returns 0 or 1 there, never a negative number. V8's TimSort only tests `< 0`, in insertion, run
  detection, gallop and merge. So the order is the same, and the gate runs only on Node. The reason is stated on the
  record, as 001 R-08 requires. Accepted.
- **`--files` (shards.ts:151-176).** I probed `selectFiles` directly:
  - `a.ts,a.ts` → `repeated [a.ts, a.ts]`;
  - `a.ts, a.ts:1-30` → `repeated`, with the entries trimmed;
  - `x.ts,x.ts` (not changed) → `repeated`, which comes before `missing`, as the contract orders them;
  - `a.ts:1-30,a.ts:` → `malformed`, which comes first;
  - `./a.ts,a.ts` → `missing [./a.ts]`.

  The cause string in mutation.ts:78 matches the contract word for word. `cut()` now takes one window. That is sound
  because `changedFiles` gives ranges that are sorted and apart, and one entry per file is now enforced. CI's `--plan`
  never puts two entries of one file in a shard, so the new cause cannot fire on CI. An empty `--files ""` still
  selects nothing and exits 0 with "nothing to mutate", as on `main`. That behaviour predates this PR and is not
  raised.
- **Summaries.** Both forms match `contracts/mutation-output.md` and give the counts also when they are zero.
  `plural(n, noun, pluralNoun)` is the only change to the shared helper. Its default keeps every other gate's wording.
- **Plant judge (plant-judge.ts).**
  - `record`, `timeout`, `compile-error` and `zero-mutants` are never findings, and only for gate `mutation`. Another
    gate's finding with such a rule is still a finding.
  - `records` now compares only `record` lines. Before, it took every line of a pass plant, which held only while
    records were the only non-finding lines.
  - `reports` is a multiset compared by location and rule, with message substrings. It is checked after the
    findings on fail plants and after the records on pass plants.
  - `parsePlant` rejects `reports` on an `error` plant. `judgePlant` rejects `reports` on any other gate, so the plant
    job fails as plants.md says.
  - When `reports` is absent, report lines are not checked. This is a stated design choice; `pass-fully-checked`
    pins `reports: []`.
- **Exit 0/1/2.** Report lines go on stdout at exit 0 and 1, after the records and before the findings, and never at
  exit 2. Every exit-2 cause stays on stderr. This matches the amended gate-cli.md mutation row (L1-05 is wording
  only).
- **Overlap with existing gates.** `vitest.mutation.config.ts` is read only by Stryker, so `gate:unit-tests` and
  `pnpm test` keep `vitest.config.ts`. `gates/test/vitest-config.test.ts` and
  `gates/test/integration/vitest-mutation-config.test.ts` pin the split. The second also proves that the same modules
  are collected, each once, and that the start order holds under Stryker's options. `error-zero-mutant-failing-test`
  shows that a zero-mutant change cannot hide a failing test: the dry run still fails closed. No gate, check name or
  registry entry changed (`gates.json`, `registry.ts` and `ci.yml` are not in the diff).

## Design lens

- **`reports` in plant.json.** It is a small, optional seam scoped to the mutation gate, validated at parse and judge
  time, and recorded in 001 plants.md and data-model.md § Plant. Sound.
- **Report-line rules.** They reuse the record-line shape, so readers that split on `: mutation: ` work unchanged.
  The `path:start-end` location is allowed only for these lines, by a dated amendment of the location rule. Sound.
- **Mutation-only Vitest project split.** The seam is clean: it lives in one file, other configurations are
  untouched, and the hard-coded `source-table.test.ts` path is pinned by a test, so a rename fails CI rather than
  silently dropping the order. Its cost to other files is L1-01.

## Test quality

- **Red evidence.**
  - Phase 2, red `6351832`: 87 failures, all `AssertionError`s on the missing behaviour.
  - Phase 3, red `3894d2b`: the start-order and config tests fail on assertions.
  - Lever 3, red `849b5a0`: 23 shard cases fail against the 60-line plan.
  - `tdd-check.json` is pass for phases 2 and 3, with the final tests failing on base. Phase 1 is a justified
    exemption (evidence only).
- **Replaced tests.** Listing the removed `it(` and `describe(` titles in the diff shows only these:
  - the 60-line `planShards` cases, rewritten at 30 with boundaries at 30, 31, 60 and 61;
  - "joins entries of one file …" and "--files … entries of one file joined", replaced by the exit-2 case and its
    exact cause;
  - the two deep-equal config tests, replaced by stricter ones: exact names, everything but `sequence` equal to the
    counterpart with the two stated exceptions, the `sequence` values pinned, modules collected once, and the start
    order.

  Each replacement gives its reason in the file. None is looser. `git diff 849b5a0..HEAD` on the test files is
  empty. `vitest-config.test.ts` was changed after implementation, not in a red commit (phase 3 R1-02, accepted
  there). I agree: the behaviour was proven red first by the integration test.
- **Vacuous assertions.** I found none. The integration tests in `mutation.test.ts` now pin the exact
  `compile-error` lines and summary counts instead of looser regexes. `gate:test-lint` is clean.
- **Coverage of the brief.**
  - Classification and its order, the `--files` causes and entry names, both summaries and `plural`: covered.
  - The judge's `reports` and `records`: covered, including multiset, duplicate, message, fail-plant, other-gate and
    parse cases.
  - The CompileError and zero-mutant lines on real Stryker runs: `pass-compile-error` and `pass-zero-mutant`.
  - A Timeout is tested with the Stryker double only, which FR-008 allows ("a plant or test").
- **Mutation.** The whole-diff run `gate:mutation -- --base 3a247ef` at HEAD exited 0: 305 mutants on the changed
  lines of 5 files, none survived; 8 timeouts, 82 compile errors, 0 zero-mutant entries; 1 equivalent record. No
  survivor. The 82 compile-error lines are reports; I read them, and phase 2 R1-04 covers them. The 8 timeout lines
  are L1-01.

## Records against the code

- **001 spec.md.** FR-011 has the report and the operator's three answers plus the repeated-file cause. FR-013 and
  SC-005 have the 30-line amendments. The earlier text is kept.
- **gate-cli.md.** The exit-1 location rule, the mutation row's 30-line bound, the new exit-2 cause (word for word as
  `mutation.ts:78`) and the report lines and summaries match the code.
- **plants.md and data-model.md § Plant and § Finding.** They match `parsePlant` and `judgePlant`, including the
  error and other-gate rejections and records-only comparison.
- **gates/README.md.** The mutation row and the two amendment paragraphs match: the plant list holds the four
  touched plants. The earlier 60-line text at :144-147 is kept, with the amendment following it.
- **Three review-command copies.** The same sentence is in all three, and `gate:config-copies` is clean.
- **Landing skill (SKILL.md:120-122).** The sentence matches the behaviour.
- **`knowledge/speckit-flows`.** The zero-mutant candidate is closed in `log.md`, and the "next lever" is resolved in
  `frontend-missions.md` with the cut cost. The CI half is marked open (L1-02).
- **Gaps.** 001 research.md and plan.md are stale (L1-04).

## Checks run

All ran at `da7416c`, Node 22.23.4, with `OCELLE_CHROMIUM_PATH` and `PLAYWRIGHT_BROWSERS_PATH` set, one heavy job at a
time.

| Check | Result |
|---|---|
| `gate:typecheck` | exit 0 |
| `gate:lint` | exit 0, 173 files |
| `gate:test-lint` | exit 0, 114 files |
| `gate:config-copies` | exit 0, identical |
| `gate:signoff -- --range 3a247ef..HEAD` | exit 0, 44 commits |
| `vitest run` on the 8 changed test files (incl. `integration/vitest-mutation-config.test.ts`) | 282 passed |
| `gate:mutation -- --base 3a247ef --plan` | 7 shards, 6 cuts |
| `gate:mutation -- --base 3a247ef` (whole diff) | exit 0, 216 s; 8 timeouts (L1-01) |
| `gate:mutation -- --base 3a247ef --files report.ts,plant-judge.ts`, HEAD | exit 0; 2 timeouts |
| same, scratch worktree, `vitest.mutation.config.ts` and its unit test from `origin/main` | exit 0; 0 timeouts |
| same, scratch worktree, HEAD config restored | exit 0; 2 timeouts |

I did not rerun `gate:plants`, `gate:unit-tests` (the full suite), `gate:csp`, `gate:contrast` or `gate:brand-rules`.
CI passed all of them on `da7416c`, and the phase 3 review ran them at its head. The scratch worktree was removed
afterwards.

## Earlier findings

None: this is the first landing round.
