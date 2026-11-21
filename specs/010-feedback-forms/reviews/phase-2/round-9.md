---
phase: 2
round: 9
verdict: changes_requested
base: b1be87ade52bbf93335993780acd20c2b69d5da3
head: d20f0d046b1121424a000b3d9894969bd3758b7a
tdd_check: pending
---

# Phase 2 review, round 9

This round reviews the fix rounds since the last approved phase 2 review, round 5. Round 5 was committed as
`473f207`, which the re-sign remapped to `b0be7d07` (`reviews/history-map.txt:139`). The records in scope are:

- operator rounds 6, 7 and 8;
- tasks T025e to T025o, with their withdrawals;
- the fix-5 evidence, committed in `1136ce71`;
- the revert `a0e40aed`;
- the fix-6 red `42539f40` and green `7c26ed19`;
- `round-8-fixes.md` with the unit-test evidence, committed in `d20f0d04`.

`base.sha` holds `b1be87a`, the remap of `6c9400c`. Operator rounds 6 to 8 still name the pre-remap SHA, which is the
same commit.

Outside `specs/`, the whole change since round 7's tasks is `git diff 5c2cd73b HEAD -- . ':!specs/'`. It is three
files: `.github/workflows/ci.yml` (+3 −3), `gates/README.md` (+1 −1) and `gates/test/ci-workflow.test.ts` (+9 −8).
`git diff 7f394172 5c2cd73b -- . ':!specs/'` is empty. So rounds 6 and 7 changed only records, and the revert leaves
nothing of round 7's split in the tree.

The only uncommitted change is `reviews/phase-2/check-red-phase.log`. The detached `tdd-check.sh 2` run, still in
progress, writes that file. I did not touch it or stage it. The `tdd-check.json` in the directory is stale: it holds
pre-fold SHAs, with head `99e2815`. Its result for this head is pending.

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| R9-01 | blocking | specs/010-feedback-forms/tasks.md:206-210 | T025k, T025l, T025m, T025n and T025o are still `[ ]`. Their work is present: T025k in `1136ce71`, T025l (nothing to commit; the tree outside `specs/` checks clean), T025m in `a0e40aed`, T025n in `42539f40` and `7c26ed19`, and T025o in `unit-tests-fix-6.log` (`d20f0d04`). No commit of fix-6 touches `tasks.md`. The last commit that does is `443e8ffc`, which added these tasks. Earlier fix rounds ticked their tasks; round 5, for example, records T025c and T025d as ticked. Step 5 of the review procedure requires every task of `## Phase 2:` to be ticked. | Tick T025k to T025o, `[X]`, with nothing else changed in their text. |
| R9-02 | blocking | specs/001-repository-foundation/spec.md:318-321 (FR-013, amendment of 2026-11-15) and :543-545 (SC-005, amendment of 2026-11-15) | The limit for element shards is now 75 minutes in `ci.yml:90`, `contracts/ci-checks.md:40`, `gates/README.md:207`, the pinned test and `plan.md` decision 11. Feature 001's spec still says 45. FR-013's amendment says a shard with a `packages/elements/src/` entry "runs under 45 minutes" and that one "that exceeds 45 minutes MUST end as a failure". SC-005's amendment says such a shard "finishes in under 45 minutes … and its 45-minute job limit enforces that". The contract row (`ci-checks.md:40`) now gives 75 and cites "FR-013 amendment" as its source, but that amendment states 45. CI as configured no longer meets FR-013 as written: a 50-minute element shard passes. Op 015 changed this limit by amending spec.md, the contract and the docs together. T025n listed only the contract, `gates/README.md` and ci.yml, so the spec was missed at planning. The operator decided the value (rounds 6 and 8), so only the record has to catch up. | Add a dated amendment under FR-013 and under SC-005 in `specs/001-repository-foundation/spec.md`, in the form op 015 used: the limit for a shard with a `packages/elements/src/` entry is 75 minutes, citing mission 010 operator rounds 6 and 8 (2026-11-18) and the measurements (2493–2717 s on run 44354367030, one shard cancelled at 45 minutes; 2748 s on this machine). Add it through a planned task. |
| R9-03 | note | a0e40aed | The revert has git's default subject, `Revert "test(010-feedback-forms): phase 2 review round 7 red"`, and no Co-Authored-By or Claude-Session trailer. T025m required this form (`git revert -s --no-edit`, no amend), and `round-8-fixes.md` discloses it. The commit is signed off, and `gate:signoff -- --range 7f394172..HEAD` reports "12 commits checked, no finding". It is an exact revert: `git diff 636207eb^ a0e40aed -- . ':!specs/'` is empty. It deletes round 7's red tests, but on the operator's withdrawal (O8-01), not as a weakening. The tests it removes pinned a project split that no longer exists. I accept it as it is. | None. |
| R9-04 | note | specs/010-feedback-forms/reviews/phase-2/red-commits:5 | The `fix-5` line still names `636207eb`, whose tests `a0e40aed` reverted. O8-01 and T025k keep the line as the record of the reverted red, and § O7-01 of `mutation.md` states that outcome. The red itself is real: in `red-fix-5.log`, its tests fail on assertions. How `tdd-check.sh` treats a red label whose tests are absent at HEAD will show in the pending run. | None now. If the pending check reports a problem for `fix-5`, that report is a finding for the next round. |
| R9-05 | note | specs/010-feedback-forms/research.md:593 | The text still says CI covers the known gap "since op 015 … with a 45-minute limit". That was true when it was written. `plan.md` decision 11 (:165-175) and the stop list in `tasks.md` (:86-92) now record the change to 75. | Optional: add "(75 minutes after operator round 8)" so the research text agrees with the plan. |
| R9-06 | note | specs/010-feedback-forms/reviews/phase-2/unit-tests-fix-6.log:1-2 | The O8-03 evidence is the gate's summary line only: "7916 tests passed in 239 files". It satisfies T025o's rule ("If no test times out, that run is the evidence and nothing changes"), and an exit 0 with every test passed rules out a timeout. It does not show how close the visual test (`visual.test.ts:115`) came to its 600 s limit. That test was over the limit twice on the merged tree before this round, so CI's Unit tests job on the PR remains the real proof. | None. If CI's Unit tests job times out on that test, go back to T025o's raise rule. |
| R9-07 | note | specs/010-feedback-forms/reviews/phase-2/red-fix-6.log:5 | The red log contains pnpm's store path (`<pnpm store>`), exactly as the tool printed it. `round-8-fixes.md` discloses this. It is the same accepted recurrence as R5-02. | None. |

Two blocking findings.

## Test quality

**Red evidence (fix-6).** `red-fix-6.log` is a full `pnpm test` at `42539f40`, a commit that changes only
`gates/test/ci-workflow.test.ts`. Setup completed ("setup: installed offline"). Exactly two tests fail, both on
assertions, with no import, syntax or setup error:

- `ci-workflow.test.ts:35`, the pinned `mutation-shard` job lines: `AssertionError: expected [ '  mutation-shard:',
  …(9) ] to deeply equal [ … ]`. The only line of that array that changed is the pinned `&& 75 || 10` line.
- `ci-workflow.test.ts:57`: `AssertionError: expected 45 to be 75`.

The summary reads "2 of 7916 tests failed". `red-commits` has `fix-6 42539f40…`. The red is real, and it fails for
the missing behaviour: ci.yml still read `&& 45 ||`.

**No weakening.** `git diff 42539f40 HEAD -- gates/test packages/elements/test` is empty: the green changed no test.
The red's own changes make the test stricter:

- `toBeGreaterThanOrEqual(45)` became `toBe(75)`.
- The literal `|| 10` in the regex became a captured group, now asserted with `toBe(10)`.
- `toHaveLength(1)` and the assertion that the limit exceeds `dryRunTimeoutMinutes` are kept.

The commit message gives the reason the pinned assertions change: the operator decision, under constitution VIII.
The assertions are unconditional and can fail, as the red run shows.

**Withdrawn tests.** Round 7's red tests (`636207eb`) are removed by the exact revert `a0e40aed`, on the operator's
order (O8-01); see R9-03. After the revert, the tests at `5c2cd73b` are back word for word: the diff outside `specs/`
is empty apart from fix-6's three files.

**Mutation.** `pnpm run gate:mutation -- --base a0e40aed…` reports "nothing to mutate: no package or gate source line
changed". This round changes only ci.yml, a test file and documents. I did not run the gate against the phase base
`b1be87a`. Since that base the branch holds the second merge of `main`, so the run would cover every element shard,
for hours, on the same machine as the TDD check now running. No source line in mutation scope changed after the last
mutation evidence (fix-4, R5-03).

## Checks run

| Check | Result |
|-------|--------|
| `pnpm exec vitest run gates/test/ci-workflow.test.ts gates/test/vitest-config.test.ts gates/test/integration/vitest-mutation-config.test.ts packages/elements/test/node/readme.test.ts` | 4 files, 695 tests passed |
| `pnpm run gate:typecheck` | no type error |
| `pnpm run gate:lint` | 477 files, no finding |
| `pnpm run gate:test-lint` | 356 files, no finding |
| `pnpm run gate:signoff -- --range 7f394172..HEAD` | 12 commits, no finding. Over `b0be7d07..HEAD`, 3 findings, all on `main`'s squash merges (`b594b7e9`, `13af7a91`, `bea31300`) brought in by the merge. None is in this round's commits. |
| `pnpm run gate:plants -- --affected a0e40aed… --list` | the same 8 `note: affected:` lines as `plants.md` (all from `.github/workflows/ci.yml`), "8 of 314 plants selected". `plants.md` records exit 0. Its base is the red commit's parent, not `base.sha`. I accept that for the reasons given in R5-01 and in `plants.md`'s own note: since the base, `gates/bin/plants.ts` changed, so `--affected b1be87a` selects every plant. |
| `pnpm run gate:mutation -- --base a0e40aed…` | nothing to mutate |
| `git diff 636207eb^ a0e40aed -- . ':!specs/'` | empty: the revert is exact |
| `git diff 5c2cd73b HEAD -- . ':!specs/'` | only ci.yml, gates/README.md and ci-workflow.test.ts |
| Full `pnpm test` / `gate:unit-tests` | Not rerun. The detached `tdd-check.sh 2` run is running the full suite now. The fix round's runs are `test-fix-6.log` and `unit-tests-fix-6.log`, each 7916 passed in 239 files, exit 0. |
| `tdd-check.sh 2` | pending (a detached run is in progress) |

**The 75-minute limit across the record.** These places agree on 75 minutes for a shard with a
`packages/elements/src/` entry and 10 for the others:

- `.github/workflows/ci.yml:90`: `&& 75 || 10`;
- the ci.yml comment at :65-66;
- `contracts/ci-checks.md:40`;
- `gates/README.md:207`;
- `gates/test/ci-workflow.test.ts:9-12,43,57-68`;
- `plan.md` decision 11;
- the stop list in `tasks.md`.

`grep` finds no other live statement of 45 in these files. The exceptions are feature 001's spec (R9-02) and the
historical sentence in `research.md` (R9-05).

The stop condition of T025n ("a shard measured or estimated on CI over 75 minutes") is not met. CI's element shards
took 2493–2717 s, and this machine took 2748 s, all under 4500 s. The 3515 s figure belongs to the withdrawn split.

## Earlier findings

Round 8 (operator round, `changes_requested`):

- **O8-01: resolved as the operator decided.** The operator's answer was "Revert split, 75-minute limit
  (Recommended)", and each part is done:
  - **Measurement kept.** `1136ce71` commits § O7-01 of `mutation.md` with its "Outcome (operator round 8)" paragraph,
    `red-fix-5.log`, the `fix-5` line of `red-commits`, `mutation-fix-5-before.log` and `mutation-fix-5-after.log`.
    It holds only those 5 files, with no source, test or config file.
  - **Uncommitted split discarded.** `git diff 7f394172 5c2cd73b -- . ':!specs/'` is empty. No trace of
    `elements-timing` remains outside `specs/`, and `vitest.config.ts` keeps `fileParallelism: false` on `elements`.
    `vitest-config.test.ts` and `vitest-mutation-config.test.ts` pass at HEAD.
  - **Red reverted with sign-off.** `a0e40aed` is the signed-off revert; see R9-03.
  - **Withdrawal recorded.** T025e to T025j are marked `[-]` (tasks.md:190-202), each with what was done and what is
    undone, and plan.md decision 11 records it.
- **O8-02: resolved as the operator decided.** It was done test-first:
  - red `42539f40`, a test file only, failing on assertions;
  - then green `7c26ed19`: ci.yml limit and comment, the contract row and gates/README.md, each citing operator
    rounds 6 and 8.

  The value is exactly 75 for element shards and 10 for the others, as round 6 and round 8 decided. One spec record
  is still missing: R9-02.
- **O8-03: resolved as the operator decided.** The full `gate:unit-tests` run on `7c26ed19` exited 0: 7916 passed in
  239 files, 3570 s, no test timed out. T025o's rule therefore applies: that run is the evidence and nothing changes.
  No test limit changed (`git diff 42539f40 HEAD -- gates/test packages/elements/test` is empty). The red run and the
  green `pnpm test` also completed with no timeout. See R9-06 for what the log does not show.

Rounds 6 and 7 were replaced by round 8:

- O6-01 was withdrawn by round 7 and restored as O8-02.
- O7-01 was replaced by O8-01.
- O6-02 and O7-02 were restated as O8-03.

Each is resolved through the round 8 finding that carries it, as above.

## Verdict

changes_requested: two blocking findings, R9-01 (tasks not ticked) and R9-02 (feature 001's spec still states 45
minutes). The TDD check is pending. The code changes of fix-6 are correct and test-first. Neither blocking finding
needs a change to code or tests.
