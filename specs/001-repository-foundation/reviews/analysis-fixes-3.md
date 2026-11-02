# Analysis 3: fixes 3

<!-- Written by planner-pim; the harness refused the subagent's own write of this note ("Subagents should return
findings as text, not write report files"), so the orchestrator recorded it verbatim from the subagent's hand-back. -->

Resolves the three findings of `analysis-report.md` (analysis 3, head ed3a4bd), as the operator decided at the tasks
gate on 2026-11-02 ("fix the three, then implement; no further analysis"). No task was inserted or removed, so the
numbers T001 to T090 stand. Phase order, the one scaffold and one red commit per phase, and the task format are
unchanged; every changed red test stays in its phase's red commit.

| ID | Resolution | Where |
|----|------------|-------|
| U1 | fixed: each `--root` case copies only the configuration files its gate reads, not the whole R-10 set (`typecheck`: root `package.json`, `tsconfig.base.json`, `tsconfig.json`, each `packages/*/package.json` and `packages/*/tsconfig.json`; `lint`: those plus `eslint.config.ts`; `style-lint`: root `package.json`, `stylelint.config.ts`, `gates/stylelint/`; `csp`, `prefix`: none). Each case asserts that every file it copies exists before any copy, so `lint` and `style-lint` fail on that assertion and `typecheck`, `csp`, `prefix`, `pins` and `signoff` fail on the gate's missing exit code, at the red commit and against the scaffold | tasks.md T062, T063 (records the other cases' failure on the missing exit code); research.md R-09 (the `--root` test copies only the files its gate reads, analysis 3) |
| A1 | fixed: the not-awaited pattern is split into one fixture per rule, eight fixtures, each exit 1 with exactly one finding (`valid-expect` with `alwaysAwait` on an unawaited `.resolves`/`.rejects`; `valid-expect-in-promise` on a promise with an assertion in `.then`, neither returned nor awaited) | tasks.md T035 |
| U2 | fixed: before timing, `pnpm store path` in the clone under the same environment must print the new temporary store directory set through `npm_config_store_dir`, otherwise the store is set another way pnpm 12 reads (research.md R-04) and checked again; the `pnpm store path` output is recorded with the timing | tasks.md T083 |
