# Analysis 1: fixes 1

<!-- Written by planner-pim; the harness refused the subagent's own write of this note ("Subagents should return
findings as text, not write report files"), so the orchestrator recorded it verbatim from the subagent's hand-back. -->

Resolves every finding of `analysis-report.md` (head 3a60b7f), as the operator decided at the tasks gate on
2026-11-02 ("fix all, then re-analyze"). Tasks were inserted in phases 2, 3 and 4 and one removed (old T064, `--root`
added after the red commit; `--root` is now in each phase's scaffold and red tests), so tasks are renumbered T001 to
T090. Phase order, the one scaffold and one red commit per phase, and the task format are unchanged. Task IDs below
are the new numbers.

| ID | Resolution | Where |
|----|------------|-------|
| C1 | fixed | tasks.md T032 (scaffold adds `gates/lib/eslint-report.ts` and `gates/bin/test-lint.ts`), T034 (red: `gates/test/eslint-report.test.ts` on recorded ESLint JSON in `gates/test/fixtures/eslint/`, exit 0/1/2), T035 (red: `gates/test/integration/test-lint.test.ts`, entry exit 0/1/2 with `--root`), T042, T043 (green implements both, `gate:test-lint` = `node gates/bin/test-lint.ts`); research.md R-06 (gate entry); plan.md Constitution Check VIII, re-check after analysis 1, Phases item 3, Source Code |
| C2 | fixed | (a) tasks.md T015 (scaffold names the entry wrapper), T017 (red: `gates/test/cli.test.ts`, a throwing `run()` gives exit 2 and one line naming the cause; `--root` sets root and working directory only), T023, T024. (b) tasks.md T032 and T051 (scaffold signatures take `--root`), T035 and T041 (phase 3 gates run with `--root`), T062 (red: `gates/test/integration/gates-root.test.ts`, every phase 4 gate with `--root` on a temporary repository from another working directory), T063, note above T064; old T064 removed. research.md R-09; plan.md Constitution Check VIII, re-check after analysis 1, Phases items 2 and 4 |
| G1 | fixed | tasks.md T058 (`~` range, `workspace:~`, differing `workspace:` version, `.node-version` and `packageManager` missing or not exact, `minimumReleaseAgeStrict` missing or false, `minimumReleaseAgeExclude` entry, `allowBuilds` missing, `dangerouslyAllowAllBuilds`, `shamefullyHoist`, `publicHoistPattern`, `nodeLinker`), T077; contracts/plants.md pins row |
| I1 | fixed | tasks.md T013 (non-frozen `pnpm install` creates the lockfile, commit, then `setup:online` with no tracked change, then `pnpm test`) |
| G2 | fixed | tasks.md T031 (phase 2 closing task: throwaway phase in a disposable clone, `tdd-check.sh` must report `fail`, recorded in `reviews/phase-2/sc-003-fail-demo.md`), phase 2 Independent Test and Checkpoint; plan.md Phases item 2 |
| G3 | fixed | tasks.md T041 (red, phase 3: `gates/test/integration/mutation.test.ts` on a fixture repository, a mutant covered only by a `gates-integration` test is `NoCoverage`; also `--files` and an unresolvable base end to end, as R-08 promised); research.md R-08 |
| I2 | fixed | tasks.md T020 (in-process translation of recorded pnpm output, `gates` project), T021 (`gates-integration`: empty store, empty browser path, zero socket connections, filled-store exit 0, all with `--root` on a temporary workspace), T026; research.md R-04 test seam (`--root`, never the repository's own `node_modules`) |
| I3 | fixed | tasks.md T066 (`allowEmptyInput` on, as research.md R-07 decides) |
| I4 | fixed | tasks.md T066 (R-07's whole-package globs with the plant, fixture, `dist` and test-code ignores), T076; contracts/plants.md style-lint row (plant form covers package source outside `src/`; new fail plant `packages/styles/x.css`) |
| I5 | fixed | tasks.md phase 4 Independent Test, T060, T073 ("breaking (`error`) plant"); data-model.md § Plant already maps `error` to "a breaking plant", so the spec's term stands |
| I6 | fixed | spec.md FR-022 (name rule is case-insensitive, with the `<SK-Button>` reason); tasks.md T056 |
| A1 | fixed | spec.md FR-025 style-lint plants ("a unitless number outside the properties FR-024 allows them in") |
| D1 | fixed | spec.md FR-003 (keeps the fresh-clone frozen install; the lockfile-mismatch rule is FR-027's) |
| U1 | fixed | tasks.md T029 (the phase 2 review records that `tdd-check.sh` judges the final test files as a whole by one exit code, and that the Chromium sample claims no phase 2 behaviour: it is US1 scenario 6 evidence for what the bootstrap configured) |
