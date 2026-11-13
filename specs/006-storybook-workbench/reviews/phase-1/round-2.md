---
phase: 1
round: 2
verdict: approved
base: de022bb3a92c3616d42ed4bd68f050444d0fbb15
head: 2075c16e47ebc9881cc08c0ff850daa28d981e1d
tdd_check: pass
---

# Phase 1 review, round 2

Scope: `git diff de022bb..2075c16`. The new part since round 1 is the fix commit 2075c16 (`git diff 7874183..2075c16`).
It changes eight files: one comment line in each of gates/bin/axe.ts, baselines.ts, storybook-build.ts and visual.ts
(line 10), two new test files (gates/test/entry-stubs.test.ts, gates/test/integration/entry-stubs.test.ts),
reviews/phase-1/tdd-exempt.md and reviews/phase-1/round-1-fixes.md. The only uncommitted changes are the tdd-check
outputs, and this review commits them.

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| R2-01 | note | reviews/phase-1/check-final-tests-on-base.log (tail); tdd-check.json `final_tests_on_base_exit: 2` | In round 1, the final tests on base exited 1 and showed the two container-pin assertion failures. Now they exit 2 with `gates/test/entry-stubs.test.ts failed to load: Cannot find module '../bin/axe.ts'`. On base the stubs do not exist, so the load error is the missing behaviour. But it stops the run before the container-pin cases run, so this log no longer shows their red. That red is still on record in red-phase.log and check-red-phase.log (red commit cfc043d, exit 1, the two assertion failures), so nothing is lost. | None. |

The round 1 notes R1-02 to R1-04 still apply, and 2075c16 changes none of them.

## Test quality

- **Red evidence:** tdd-check.json at head 2075c16 reports `status: pass`. The phase red commit cfc043d exits 1. The
  final tests on base exit 2 (R2-01), head exits 0, and there are no problems. check-red-phase.log differs from round 1
  only in timing. No scaffold.sha.
- **Fix without a red commit:** acceptable. `red-commits` has no `fix-1` entry. The fix adds no behaviour. Its source
  change is four Stryker record comments. The stubs already behaved as T003 specifies, which round 1 measured (exit 2,
  one line). So no test written for the finding could have been red at the fix's parent 7874183. Constitution VIII
  "Fixes are test-first too" covers findings about wrong behaviour. R1-01 was about missing tests for correct
  behaviour. The tests are instead shown able to fail on mutants, and I measured that (below). This matches the
  003 phase 1 round 2 precedent for a non-behavioural fix.
- **Weakened tests:** `git diff cfc043d..HEAD -- gates/test/container-pin.test.ts` is empty. The two new files are
  additions, and no existing test changed.
- **Vacuous assertions:** none.
  - gates/test/entry-stubs.test.ts:11-25: each case asserts `toThrow(new Error("<exact message>"))` on the real `run()`.
  - gates/test/integration/entry-stubs.test.ts:24-54: each case spawns `node gates/bin/<name>.ts` and asserts the whole
    `{ code: 2, stdout: [], stderr: [<line>] }` with `toEqual`.
  - There are no mocks, conditionals, skip/only or snapshots, and test-lint is clean.
- **Shown able to fail (measured by hand, files restored with `git checkout` afterwards):**
  - I set the visual.ts guard to `if (false)` and changed the axe message to `(axe, phase 5)`. 3 of the 8 cases
    failed, each on its assertion:
    - the visual integration case received `{ code: 0, stdout: [], stderr: [] }`;
    - the axe integration case received the wrong line;
    - the axe unit case reported `expected a thrown error to be Error: not implemented (axe, phase 4)`.
  - The 5 cases of the stubs I left unmutated passed.
- **Mutation:** `pnpm run gate:mutation -- --base de022bb` (with `PLAYWRIGHT_BROWSERS_PATH` aliased, chromium-1248 to
  1243) exits 0: `16 mutants on the changed lines of 4 files, none survived; 4 equivalent records`. I read the four
  records at gates/bin/{axe,baselines,storybook-build,visual}.ts:10. Each is
  `// Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/entry-stubs.test.ts "<case>"`.
  - Each names a case title that exists exactly in that file and spawns that same stub.
  - The guard cannot be reached in Stryker's in-process run, and the named case kills the `false` mutant (measured
    above).
  - The form matches the existing process-boundary records, for example gates/bin/test.ts:79.
- **Acceptance scenarios:** phase 1 is setup and has none (round 1).
- **Exemption (tdd-exempt.md):** now correct. It excludes the stubs from the T003 exemption, says they have behaviour,
  names both tests, and says the tests have no red commit of their own and why. It also describes the mutation records
  accurately.

## Checks run

Node v22.23.4, `OCELLE_CHROMIUM_PATH` set, one at a time at HEAD 2075c16:

- `pnpm test`: exit 0, `unit-tests: 2048 tests passed in 100 files`. That is 2040 from round 1 plus the 8 new cases.
- `gate:mutation -- --base de022bb`: exit 0 (above).
- `gate:typecheck`, `gate:lint` (178 files), `gate:style-lint` (2 files), `gate:test-lint` (115 files),
  `gate:config-copies`, `gate:prefix` (132 files), `gate:pins` (5 manifests), `gate:contrast`, `gate:brand-rules`
  (7 rules), `gate:csp` (22 files): each exits 0 with no finding.
- `gate:signoff -- --range de022bb..HEAD`: exit 0, `7 commits checked, no finding`.
- `gate:plants`: exit 0, `184 plants of 13 gates and the registry judged, every plant as expected`.
- Tasks: T001 to T005 under `## Phase 1:` are ticked, and the fix commit does not touch tasks.md.
- Constitution: no element, story, token or CSP change. VIII is the applicable principle and is now met.

## Earlier findings

- **R1-01 (blocking): resolved.**
  - The four stubs are tested in process (unit) and as processes (gates-integration).
  - Each `import.meta.main` guard carries a process-boundary record naming its integration case.
  - tdd-exempt.md is corrected.
  - `gate:mutation -- --base de022bb` now exits 0, where round 1 had 12 `NoCoverage` findings.
  - round-1-fixes.md describes the change accurately. It also explains why there is no `fix-1` red commit, and that
    reason holds (see Test quality).
