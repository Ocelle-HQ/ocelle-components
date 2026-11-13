---
phase: 2
round: 1
verdict: approved
base: 3e499a9e9514bffcb443ab0a4aaa29eb5729e48e
head: 09592ccc34b96d5c71e1f3b0e2395da4062df193
tdd_check: pass
---

# Phase 2 review, round 1

Change under review: `git diff 3e499a9..09592cc` (scaffold b704a82, red 15e67cd, green 09592cc), plus the uncommitted
red/green check outputs in this directory. User Story 1: the Storybook build is a merge gate.

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| R1-01 | note | gates/test/integration/storybook-build.test.ts:27 | After the red commit, the before/after listing of the repository's root `node_modules` leaves out `.vitest-cache`, `.vite` and `.vite-temp`. That loosens the check. The green commit message gives the reason: the test run's own Vitest and Vite processes write those caches. The build's own default Vite cache would sit below `storybook/node_modules`, which is still listed in full. The commit also adds a stricter assertion (lines 61-63: no `.bin` shim names the plant root) and records that the test fails with the flag removed from `buildCommand`. I accept the change as justified. | None. |
| R1-02 | note | gates/test/entry-stubs.test.ts, gates/test/integration/entry-stubs.test.ts | The red commit removes the `storybook-build` stub cases. The stub is replaced by the gate, whose unit and integration tests cover the same entry with real behaviour. This is not a weakened test. | None. |
| R1-03 | note | gates/lib/plant-repo.ts:408, :416 | Two small decisions sit inside lines recorded as process-boundary equivalents: the optional `storybook/baselines` copy, and the real-path target of the `storybook/node_modules` link. The integration tests named in the records cover both: "copies storybook/baselines when the repository holds it" and "links storybook/node_modules to the real path of the repository's". | None. A later phase that adds more optional parts could move the choice into a pure function. |

No blocking finding.

## Test quality

- **Red evidence.** `red-phase.log` (red.sh 2 phase at 15e67cd): 155 of 2164 tests fail, each on missing behaviour.
  The failures are the scaffold's `not implemented` throws (storybook-build, storybook-index, plant-repo
  moduleLinks/exceptionPlans/rootExceptions, plant-judge gateKeysProblem) and assertion failures on absent behaviour:
  `unknown key unlinked`, `delta.json: unknown key exceptions`, the configuration set without the Storybook inputs,
  no `storybook/node_modules` link, the registry and ci.yml without `storybook-build`, the plant order, and main.ts
  without `viteFinal`. None is a setup error. `tdd-check.json`: status `pass`, final tests on base exit 2 (modules
  absent), on scaffold exit 1, at head exit 0, no problems.
- **Scaffold.** `git show b704a82` adds signatures only: the two new modules and four exports that throw
  `not implemented`, nothing wired in, no test file. The final tests fail against it
  (`final_tests_on_scaffold_exit: 1`).
- **Changes after red** (`git diff 15e67cd..HEAD -- gates/test storybook/test`):
  - plant-repo, storybook-index and storybook-build: JSON-error cause assertions, a trimmed-line and blank-line
    Vite-message case, and an indexer line with no error. All stricter.
  - plants.test.ts: visual and axe placed in the middle of the registry, plus an overlap assertion for a
    non-Storybook gate's own plants. Stricter.
  - The integration listing exclusion is R1-01.
  - Nothing is skipped and nothing is marked `only`.
- **Assertions.** Every new test asserts printed lines, exit codes, call sequences, file states or link targets with
  exact equality. I found no assertion-free test, no conditional assertion and no snapshot-only test. The `error?.cause`
  forms fail when nothing is thrown.
- **Acceptance scenarios.**
  - Scenario 1: integration test (exit 0, `storybook-build: built 12 stories`) and `pass-repository`.
  - Scenario 2: syntax error in the integration test, `fail-syntax-error` and unit fixtures; unresolved import in
    `fail-unresolved-import` and a unit fixture; type error only in `pass-type-error-only` and a unit test.
  - Scenario 3: `fail-not-csf` and a unit test.
  - Scenario 4: `fail-empty-index` and unit tests, including an index with docs entries only.
  - Scenario 5: integration test and `error-missing-dependencies`, from the CLI check.
  - Scenario 6: ci-workflow.test.ts and registry.test.ts.
  - Also tested: `error-no-build-script`, pnpm not startable, an unreadable index, and `unlinked` on a gate it does
    not belong to.
- **Mutation.** I ran `pnpm run gate:mutation -- --base 3e499a9e9514bffcb443ab0a4aaa29eb5729e48e` with
  `PLAYWRIGHT_BROWSERS_PATH` aliased (1248 to 1243) and `OCELLE_CHROMIUM_PATH` unset. Result: 481 mutants on the
  changed lines of 9 files, none survived, 29 equivalent records (gates/bin/storybook-build.ts 9, gates/lib/plant-repo.ts
  19, gates/bin/plants.ts 1), in 308 s. I read each record. Each one marks process-boundary code (file system, symlink,
  spawn) and names an integration test that exists and passes. See R1-03.

## Checks run

All run at 09592cc, one at a time, in the sandbox on Node 22.

| Check | Result | Time |
|---|---|---|
| `pnpm test` (OCELLE_CHROMIUM_PATH set) | 2167 tests passed in 103 files | 119 s |
| `gate:typecheck` | no type error | 5 s |
| `gate:lint` | 183 files, no finding | 16 s |
| `gate:test-lint` | 118 files, no finding | 3 s |
| `gate:style-lint` | no finding | 1 s |
| `gate:config-copies` | identical | 0 s |
| `gate:pins` | no finding | 0 s |
| `gate:prefix` | no finding | 1 s |
| `gate:csp` | 23 files, no finding | 1 s |
| `gate:contrast` | pass | 0 s |
| `gate:brand-rules` | pass | 1 s |
| `gate:signoff -- --range 3e499a9..HEAD` | 3 commits, no finding | 0 s |
| `gate:storybook-build` | `storybook-build: built 12 stories` | 3 s |
| `gate:plants` (no `--skip-container`: no visual gate is registered yet) | 192 plants of 14 gates and the registry, every plant as expected | 180 s |
| `gate:mutation -- --base 3e499a9…` | none survived | 308 s |

- After the plant and mutation runs, no `.bin` shim in `node_modules`, `storybook/node_modules` or
  `packages/*/node_modules` names a scratch, temp or plant path.
- `pnpm-workspace.yaml` and `.npmrc` are unchanged, as T015 requires.

**Tasks.** T006 to T018 are ticked and their work is present. The Storybook inputs, `unlinked`, the exceptions file
rule and `exceptions: "repository"` are in plant-repo.ts and plant-judge.ts. plants.ts runs the Storybook gates'
plants serially, after the others. The changed files are:

- storybook-index.ts
- storybook-build.ts and its bin
- main.ts `cacheDir`
- the 8 plants of contracts/plants.md § `storybook-build`
- the gates.json entry
- the FR-020 list
- the ci.yml job `storybook-build` ("Storybook build")

Outside this phase's own paths, only the registry plants under `gates/plants/plants/` changed, because they must carry
the new gate. **Constitution.** No element code is touched. The build command is the workspace's own, so the existing
no-network and telemetry tests apply (FR-002). The gate follows the CLI contract. Every gate has plants. **Plan.** The
change follows contracts/gates.md § `storybook-build` (command, environment, rules, exit-2 order) and research R-09 and
R-16.

## Earlier findings

None: this is round 1.
