---
phase: 3
round: 3
verdict: approved
base: 4100cdcf42433c4ed73aa2b5f155f120d326bf96
head: a670dd64377516014d7f3d7164ac136df6d67f4c
tdd_check: pass
---

# Phase 3 review, round 3

Scope: fix round 2 (tasks T043 to T052), which answers the operator round `round-2.md`. O2-01 is landing L1-01:
lever 1 turned gate-source static-mutant kills into Timeouts, against FR-013, and the operator chose "Only source-table
first". O2-02 is landing L1-04: dated notes in 001 research.md R-08 and plan.md. Fix range
`7686530..a670dd6`: 22 commits. The code and test change is limited to `vitest.mutation.config.ts` (one value, 3 → 2,
and the header comment) and `gates/test/integration/vitest-mutation-config.test.ts`. Everything else is evidence and
records. The tree has no uncommitted change. `git diff 4100cdc..HEAD -- packages/ vitest.config.ts` is empty.

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| R3-01 | note | gates/test/integration/vitest-mutation-config.test.ts:152-155 (commits `1a269c5`, `de22a4a`) | **The red-step assertion was changed twice after red `907039f`.** (1) Green `1a269c5` touched the test even though T046 said "config only". It changed only the expected name, `elements` → `elements (chromium)`, which is the name Vitest gives the browser project at run time. The meaning did not change. (2) `de22a4a` replaced `started[1].project === "elements (chromium)"` with: `started.length > 1`, and every module that starts after `source-table.test.ts` and before the cancel belongs to `elements (chromium)`, `gates`, `storybook` or `styles`. This is not stricter in every respect. It no longer names which of the four starts first. But the earlier assertion was wrong: it raced against Chromium start-up and failed on correct code. In my three helper runs at HEAD, `gates` (`mutation-shards.test.ts`) started second every time. The replacement still pins the behaviour O2-01 is about: `source-table.test.ts` first, and no `tokens` module ahead of the other projects. It also checks every module started before the cancel, not just the second one. The config test pins `{1},{2},{2},{2},{2},{2}` exactly. I re-proved the red myself: a scratch worktree of HEAD with only `vitest.mutation.config.ts` taken from `907039f` fails both tests on assertions (`expected [ { groupOrder: 1 }, …(5) ] to deeply equal …` and `expected [ Array(4) ] to include 'tokens'`). The reason is recorded in the commit body, `round-2-fixes.md`, evidence/README.md § Fix round 2 and research.md R-05. I accept this as the Principle VIII case "a test that turns out wrong is replaced, with the reason recorded". The test title still says "in Vitest's default order", and only the config test backs that part. | None. |

No blocking finding.

## Test quality

- **Red evidence.** `red-fix-2.log` (`907039f`, `red.sh 3 fix-2`) shows exactly two failures, both `AssertionError`s on
  the missing behaviour:
  - `:69`, the sequence list: 1, 2, 3, 3, 3, 3 against 1, 2, 2, 2, 2, 2;
  - `:129`: `expected 'tokens' to be 'elements'`.

  There is no load or setup error. `tdd-check.json` is `pass`:
  - red commits `phase`, `lever-3` and `fix-2` all exit 1;
  - the final tests exit 1 on base;
  - head exits 0.

  The json was written at `09c50b5`. HEAD `a670dd6` differs from it only in the `reviews/phase-3/` check logs, so I
  did not rerun it.
- **Final tests against the old split.** `tdd-check`'s base run (`4100cdc`) only proves the test fails on the phase
  base. I checked the fix-2 behaviour directly, with the narrowed test against the `907039f` configuration in a
  scratch worktree: 2 failed, 1 passed, on the assertions quoted in R3-01. The worktree was removed afterwards.
- **Weakened tests.** `git diff 907039f..HEAD -- gates/test/` touches only the order assertion; see R3-01. Removing
  `tokenProjects` and the `firstOther`/`sorted(...)` checks belongs to the replacement the operator asked for (the
  rest of `tokens` no longer runs first). The checks that `build.test.ts`, `validate.test.ts` and `generate.test.ts`
  are `tokens` modules are kept. The collect test is unchanged.
- **Vacuous assertions.**
  - The `for` loop runs at least once, because `started.length > 1` is asserted before it.
  - The order test failed on the old split, as shown above.
  - It would also fail if `source-table.test.ts` were not first, through `started[0]`.
  - `gate:test-lint` is clean.
- **Mutation.**
  - Phase base run: `pnpm run gate:mutation -- --base 4100cdc` (alone, 43 s) exited 0 with
    `1 mutant on the changed lines of 2 files, none survived; 0 timeouts, 0 compile errors, 1 zero-mutant entry; 0
    equivalent records`. The zero-mutant line, `gates/lib/mutation/shards.ts`, is a report.
  - `vitest.mutation.config.ts` is not in the mutation plan. It is configuration whose behaviour the integration test
    and the evidence pin.
  - Landing whole-diff run: `evidence/fix-2/whole-diff.log` (`--base 3a247ef`, 211.45 s, exit 0) gives 305 mutants,
    none survived, **0 timeouts** (landing L1-01: 8), 82 compile errors and 1 equivalent record (report.ts:115,
    accepted at landing).

## FR checks on the evidence

- **FR-013 on gate source.** I re-ran `evidence/compare.mjs` on `fix-2/gate-source/main-config` against `narrowed`,
  for each path.
  - `report.ts`: 69 mutants, and every one keeps its status (49 Killed, 16 CompileError, 4 Ignored).
  - `plant-judge.ts`: 166 mutants, and every one keeps its status (114 Killed, 52 CompileError).
  - The 13 static mutants of the narrowed run are 11 Killed and 2 CompileError, with no Timeout.
  - `lever1` against `narrowed`: the only moves are the two L1-01 Timeouts, both now Killed (`report.ts:106:17` Regex
    and `plant-judge.ts:51:63` StringLiteral).
  - Summaries: `main-config` 0 timeouts, `lever1` 2, `narrowed` 0.
- **FR-009, FR-010 (sandbox half) and FR-011.**
  - Each of the eight 30-line `source.ts` entries in `evidence/fix-2/source-*/` ends exit 0 with
    `0 timeouts … none survived`. The times are 72.49, 163.14, 123.93, 173.46, 168.86, 168.05, 131.29 and 87.51 s, so
    every entry is within 176 s; the slowest, `91-120`, is 2.54 s under.
  - The README table shows NoCoverage 0 for each entry.
  - `compare-source-lever3.txt`: every mutant keeps its status against lever 3 in all eight entries.
  - FR-011: 122 of 122, as recorded in evidence/README.md § Fix round 2: 65 end CompileError, and 57 end Killed by
    `source-table.test.ts` with `expect` mismatches. I did not re-derive this from the reports.
- **FR-013 reference entries.** `compare-reference.txt`: `generate.ts:1-60` and `wcag.ts` keep every status against
  red, and `wcag.ts`'s 2 Timeouts were Timeouts in red.
- **FR-012.**
  - `git diff --stat bfd31fe..HEAD -- packages/tokens/src stryker.config.json` is empty.
  - The only `Stryker disable` under `packages/tokens/src` is `generate.ts:180`, already there at the phase-1 base.
  - The fix range adds no `Stryker disable`.
- **Records.**
  - The config header (`vitest.mutation.config.ts:7-21`) states the narrowed order, why `source-table.test.ts` stays
    first, and L1-01.
  - research.md R-05 has the dated note on the measured start order.
  - evidence/README.md has § Fix round 2 and the dated notes at § Open for landing; the CI half of FR-010 is still
    open there for landing (L1-02).
  - `frontend-missions.md` (Lever 1) has a dated note with the T048 and T049 figures.
  - O2-02: 001 research.md R-08 (both places) and plan.md (both places) each have one dated 2026-11-11 note pointing to
    the FR-013 amendment, and the 60-line text is kept.
  - Tasks T043 to T052 are all ticked, and their work is present.

## Checks run

At HEAD `a670dd6`: Node 22.23.4, with `OCELLE_CHROMIUM_PATH` and `PLAYWRIGHT_BROWSERS_PATH` set, one heavy job at a
time.

| Check | Result |
|---|---|
| `gate:typecheck` | exit 0 |
| `gate:lint` | exit 0, 173 files |
| `gate:test-lint` | exit 0, 114 files |
| `gate:config-copies` | exit 0 |
| `gate:signoff -- --range 7686530..HEAD` | 22 commits, no finding |
| `pnpm test` | exit 0, 2102 tests passed in 97 files (114 s) |
| `vitest run --project gates-integration gates/test/integration/vitest-mutation-config.test.ts`, 3 times | 3 passed each time |
| helper `vitest-order.ts order vitest.mutation.config.ts tokens-source-table`, 3 times | `tokens-source-table` then `gates` each time |
| same test file, scratch worktree, `vitest.mutation.config.ts` from `907039f` | 2 failed (assertions), 1 passed |
| `gate:mutation -- --base 4100cdc --plan` / run | 1 shard; exit 0, none survived |

The `prose.test.ts:859` failure the implementer reported (US3-12, a browser keyboard test) did not happen in my
`pnpm test` run. Nothing under `packages/` changed in this phase. I did not rerun `gate:plants` or the Stryker sandbox
measurements. `evidence/fix-2/plants.txt` records 186 plants, every one as expected, and the measurement figures above
come from the committed reports.

## Earlier findings

- **O2-01 (blocking, operator round 2): resolved.**
  - The red test came first: `907039f`, `red-commits` has `fix-2`, and `red-fix-2.log` shows assertion failures.
  - Then the config change in `1a269c5`: `tokens-source-table` is at 1, and every other project is at 2.
  - The FR-013 gate-source comparison shows no Killed → Timeout against `main`'s configuration, and the two L1-01
    Timeouts are now Killed.
  - The `source.ts` entries and the reference entries were re-measured, as listed above.
  - The whole-diff run has 0 timeouts.
- **O2-02 (note): resolved**, as described under Records.
