# Phase 1 (Bootstrap): TDD exemption

Constitution VIII, "Exemption": a unit with no behaviour (scaffolding, configuration, documentation) may skip the
red step only if its review states why no test could fail for it. Plan.md § Complexity Tracking, first row, records
this exception for exactly phase 1.

## Why no test can fail for this phase

- Before this phase the repository has no package manifest, no installed dependency and no test runner, and both
  story configuration values `test_command` and `setup_command` are empty. `red.sh` and `tdd-check.sh` therefore
  report `unavailable` at the phase base: there is nothing that could run a red test, so no test can be shown failing
  for the missing behaviour rather than for a missing runner.
- The phase adds no behaviour of its own. It adds pinned configuration, three empty package skeletons whose
  `src/index.ts` exports nothing, and plain wiring: `pnpm test` is `vitest run`, `setup:online` and `setup:offline`
  are the pnpm and Playwright commands themselves. Every behaviour of the test command, the offline setup and the
  configuration-copies check (exit codes, findings, the Chromium check, the missing-package message) belongs to
  phase 2 (US1) and is written red first there, against this phase as its base.
- The three sample tests pass by design (FR-009 allows passing samples in a package); they show that every Vitest
  project runs, and are not evidence of any behaviour this phase claims.

## What the phase adds (T002 to T014)

- T002 `package.json`: private workspace root, `packageManager` `pnpm@12.16.1`, `engines` (node 26.13.0, pnpm
  12.16.1), every dev dependency of plan.md § Technical Context at its exact version, scripts `test`,
  `setup:online`, `setup:offline`.
- T003 `pnpm-workspace.yaml`: `packages: ["packages/*"]`, `minimumReleaseAge: 10080`,
  `minimumReleaseAgeStrict: true`, `allowBuilds: {}`.
- T004 `.node-version`: `26.13.0`.
- T005 `.gitignore`: `node_modules/`, `packages/*/dist/`, `.stryker-tmp/`, `reports/`, `__screenshots__/`,
  `*.tsbuildinfo` (added to the existing Spec Kit entries).
- T006 `tsconfig.base.json`: the strict compiler options of plan.md § Technical Context and research.md R-02.
- T007 `tsconfig.json`: extends the base, `noEmit`, all repository TypeScript, excluding `gates/plants/**`,
  `gates/test/fixtures/**`, `node_modules` and `packages/*/dist`.
- T008 to T010 `packages/tokens/`, `packages/styles/`, `packages/elements/`: `package.json`, `tsconfig.json`,
  `src/index.ts` (exports nothing).
- T011 `vitest.config.ts`: projects `tokens`, `styles`, `gates`, `elements` (Chromium, headless),
  `gates-integration`, each excluding `gates/plants/**` and `gates/test/fixtures/**`.
- T012 `packages/tokens/test/sample.test.ts`, `packages/styles/test/sample.test.ts`,
  `packages/elements/test/sample.test.ts`: one passing sample test per package.
- T013 `pnpm-lock.yaml`.
- T014 `test_command: "pnpm test"` and `setup_command: "pnpm run setup:offline"` in
  `.specify/extensions/story/story-config.yml` and `tooling/speckit/extensions/story/story-config.yml`
  (byte-identical).
