# Analysis 2: fixes 2

<!-- Written by planner-pim; the harness refused the subagent's own write of this note ("Subagents should return
findings as text, not write report files"), so the orchestrator recorded it verbatim from the subagent's hand-back. -->

Resolves every finding of `analysis-report.md` (analysis 2, head 84763aa), as the operator decided at the tasks gate
on 2026-11-02 ("fix all, then one last re-analysis"). No task was inserted or removed, so the numbers T001 to T090
stand. Phase order, the one scaffold and one red commit per phase, and the task format are unchanged; no new module
was added, and every changed red test stays in its phase's red commit.

| ID | Resolution | Where |
|----|------------|-------|
| C1 | fixed | tasks.md T062 (builds each temporary repository in the test itself: fixture tree over the configuration set with `node_modules` linked; for `signoff` `git init`, an empty signed-off base commit and the `commits.txt` records; `gates/lib/plant-repo.ts` not used, T061 stays its red test); research.md R-09 (the `--root` test never builds through a module of the same scaffold); plan.md re-check after analysis 2 |
| G1 | fixed | tasks.md T035 (one fixture per FR-010 pattern, seven, each exit 1 with exactly its rule's finding: `expect-expect`, `no-disabled-tests`, `no-focused-tests`, `no-conditional-expect`, `no-standalone-expect`, `valid-expect` with `alwaysAwait` and `valid-expect-in-promise`, `ocelle/no-snapshot-only`), so phase 3's Independent Test holds as worded |
| U1 | fixed | tasks.md T040 (existence assertion, then a dynamic `import()` inside the test), T042 (phase 3 review records under VIII that `eslint.test.config.ts`, `vitest.mutation.config.ts` and `stryker.config.json` are part of the missing behaviour, red output kept), T063 (the same for T062's `eslint.config.ts` and `stylelint.config.ts`); plan.md re-check after analysis 2 |
| I1 | fixed | tasks.md T019 (temporary workspace from `gates/test/fixtures/test-command/<case>/` with `vitest.config.ts` copied unchanged and `node_modules` linked, run from another working directory, never in place; research.md R-03 test seam) |
| I2 | fixed | tasks.md T031 (export `SPECIFY_FEATURE_DIRECTORY=specs/001-repository-foundation` in the clone and run `pnpm run setup:online` there before the story scripts; both recorded in `sc-003-fail-demo.md`) |
| I3 | fixed | tasks.md T058 (in-process only: rules as pure functions on parsed files, lockfile verdict on recorded pnpm output under `gates/test/fixtures/pins/pnpm/`), T062 (pins case: a mini-workspace with an outdated lockfile runs the real pnpm command end to end in `gates-integration`); research.md R-14 test seam; plan.md re-check after analysis 2 |
| G2 | fixed | tasks.md T083 (cold `setup:online` plus `pnpm test` in a fresh clone with an empty store and browser cache, 2 CPUs where possible, recorded in `reviews/phase-4/sc-001-timing.md`, an overrun reported to the operator); plan.md Phases item 4 |
| G3 | fixed | contracts/plants.md pins row (`workspace:*`, `workspace:~`, `workspace:0.0.1` on a sibling at 0.0.0); T077 already builds every pins fail plant of that row |
| I4 | fixed | contracts/gate-cli.md command column (`typecheck`, `lint`, `style-lint`, `test-lint` now name `gates/bin/<id>.ts` and the tool each runs); research.md R-09 decision wording |
