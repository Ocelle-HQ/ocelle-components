---
phase: 1
round: 1
verdict: approved
base: 706b5a1a2d767bda3c7d2b1b52f23d7962b6069c
head: ddef36b11896b94f27f934aa9665d6a40564d9cf
tdd_check: exempt
---

# Phase 1 review, round 1

Change under review: `git diff 706b5a1..ddef36b` (commits f42ad72, fb4732f, ddef36b) plus the uncommitted refresh of
`reviews/phase-1/tdd-check.json` (now `head` = ddef36b, status `exempt`).

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| R1-01 | note | specs/001-repository-foundation/reviews/phase-1/tdd-exempt.md:35-36 | T001 asks the exemption to list exactly what the phase adds. The T011 entry describes `vitest.config.ts` without the `OCELLE_CHROMIUM_PATH` override that ddef36b added (vitest.config.ts:8-11, :40). The override is configuration read from the environment, there is still no runner at the base, and it is recorded in research.md R-03, so the exemption still holds. | None for this phase. If tdd-exempt.md is touched again, add the override to the T011 entry. |
| R1-02 | note | specs/001-repository-foundation/tasks.md:42-43 | T013 is ticked, but `pnpm run setup:online` was not completed: `pnpm exec playwright install chromium` cannot reach cdn.playwright.dev in this environment. The note on the task records the operator decision. So `git status --porcelain` being empty after `setup:online`, and the download of Playwright's own Chromium build 1248, are unverified here. The frozen install part is covered: `pnpm run setup:offline` ran with exit 0 and left `git status --porcelain` empty. | None for this phase. The first run of `cache.yml` / CI (phase 4) exercises `setup:online` without the override. |
| R1-03 | note | specs/001-repository-foundation/research.md:81-86 vs :62-64 | R-03 says phase 2's `gates/bin/test.ts` first checks that Playwright's Chromium executable exists, read from `PLAYWRIGHT_BROWSERS_PATH`, and otherwise exits 2. The new override lets `vitest.config.ts` launch another executable, but R-03 does not say whether that check honours `OCELLE_CHROMIUM_PATH`. If it does not, `pnpm test` exits 2 in any environment that needs the override (this one included) from phase 2 on. | Phase 2 has to decide this and record it in R-03, red first if it is behaviour of `test.ts`. Nothing to change in phase 1. |

No blocking findings.

## Test quality

- **TDD check**: `tdd-check.json` has status `exempt` for `head` ddef36b (current HEAD). The reason file is
  `tdd-exempt.md`.
- **Exemption justified**: the base (706b5a1) has no `package.json`, no installed dependency and no test runner, and
  `test_command` and `setup_command` were empty, so no test could run red at the base. The phase adds only:
  - pinned configuration;
  - three skeletons whose `src/index.ts` is `export {};`;
  - plain wiring (`test` = `vitest run`, and `setup:online` / `setup:offline` are the literal pnpm and Playwright
    commands, package.json:10-14);
  - the two story-config values.

  This matches plan.md § Complexity Tracking, first row (plan.md:287), which limits the exemption to exactly phase 1.
  Every behaviour of the test and setup commands is assigned to phase 2, red first (research.md R-03, R-04). No
  test could have failed for this phase, so the exemption is not a finding.
- **Red evidence, weakened tests, scaffold**: none apply. There is no red commit, no `red-commits` file and no
  `scaffold.sha` for this phase, and no test was changed after being added.
- **Sample tests** (`packages/{tokens,styles,elements}/test/sample.test.ts`):
  - each one asserts an observable property of its package: `Object.keys(await import("../src/index.ts"))` equals
    `[]`;
  - each can fail: any export added to `src/index.ts` fails it;
  - none has a conditional assertion, `skip` or `only`, a snapshot or a mock.

  FR-009 allows passing samples. They prove that every package project runs, and the elements one runs in Chromium
  (verbose run: `|elements (chromium)|`).
- **Mutation**: `mutation_command` is empty in `.specify/extensions/story/story-config.yml` (it is set in phase 3),
  so there was no mutation run. The changed source is three `export {};` lines, so there is nothing to mutate.

## Checks run

Environment: Node 26.13.0 and pnpm 12.16.1 from /opt/node26/bin; Chromium override
`OCELLE_CHROMIUM_PATH=/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell`
(research.md R-03).

| Check | Result |
|---|---|
| `pnpm run setup:offline` (frozen, offline) | exit 0; "Lockfile passes supply-chain policies"; `git status --porcelain` shows only the pre-existing tdd-check.json change |
| `pnpm test` with the override | exit 0; 3 files and 3 tests passed (tokens, styles, elements in Chromium) |
| `pnpm exec vitest run --reporter verbose` | elements test reported as `|elements (chromium)|` |
| Typecheck, root: `pnpm exec tsc -p tsconfig.json` | exit 0 (includes `vitest.config.ts` and the sample tests) |
| Typecheck, packages: `tsc -p packages/{tokens,styles,elements}/tsconfig.json --noEmit` | exit 0 each |
| pnpm policy: `pnpm config get` | `minimumReleaseAge` 10080, `minimumReleaseAgeStrict` true, `allowBuilds` {}; pnpm 12.16.1 reads these names, as R-04 asked phase 1 to verify |
| Hoisting | top-level `node_modules` holds only the direct devDependencies (no transitive package is hoisted); `shamefullyHoist`, `publicHoistPattern` and `nodeLinker` are unset (pnpm defaults) |
| Story-config copies | `diff` of `.specify/extensions/story/story-config.yml` and `tooling/speckit/extensions/story/story-config.yml`: identical; values match contracts/story-config.md for phase 1 |
| Prefix (`sk-`) in added files | none |
| ESLint, Stylelint, CSP, axe, visual | not present yet (phases 3 and 4; Complexity Tracking defers the Storybook, visual and axe gates to #10) |

Tasks:
- T001 to T014 are all ticked, and their work is present as tdd-exempt.md lists it. T013 has the operator note
  (R1-02).
- The package.json dev dependencies match plan.md § Technical Context exactly (pins with no range), and the lockfile
  importer specifiers match them.
- `.gitignore` matches plan.md:144, and `packages/*/dist/` is anchored, as contracts/plants.md:42 needs.
- The tsconfig options match R-02.
- `vitest.config.ts` has the five projects of R-03, each excluding `gates/plants/**` and `gates/test/fixtures/**`.

Files outside the phase's task list that changed, each with a reason:
- `research.md` R-03: the Chromium override, operator decision recorded in the text and in commit ddef36b.
- `tasks.md`: checkboxes and the T013 note.

Constitution: no element, CSS, event or I/O exists yet, so I to V do not apply beyond the `@ocelle/` names (correct).
For Technology and supply chain: exact pins, committed lockfile, `private` packages with no runtime dependency, and
commits signed off. VIII: the exemption is covered above.

## Earlier findings

None. This is round 1.
