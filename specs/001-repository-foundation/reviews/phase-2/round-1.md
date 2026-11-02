---
phase: 2
round: 1
verdict: approved
base: 20793235eaca1afa1fa3f37b97a22625a41f76ae
head: fede721ca9c1799768f66d8ce54df3377eede327
tdd_check: pass
---

# Phase 2 review, round 1

Change under review: `git diff 2079323..fede721`. The commits are:
- 243bf4b: scaffold;
- 0f3052c: red;
- 5dca197: green;
- a41609a: the SC-003 fail demo (T031);
- fede721: tdd-check evidence.

The working tree has no uncommitted change. `tdd-check.json` was written at a41609a. The only later commit, fede721, is
that evidence commit and changes no source or test, so the check is current.

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| R1-01 | note | packages/elements/test/chromium.test.ts:1-13 | T029 asks this review to record why this test may arrive in the green commit even though it passes at the phase base. The reasons hold. `tdd-check.sh` judges one exit code for all of the phase's final test files together. That exit code fails at the base (check-final-tests-on-base.log: 8 failed) and at the scaffold (check-final-tests-on-scaffold.log: 56 failed), through the behaviour tests of T016 to T022. This test claims no phase 2 behaviour. It is the evidence for US1 scenario 6 / FR-005, a property the phase 1 bootstrap configured (`vitest.config.ts` elements project). It asserts an observable fact (`userAgentData.brands` contains "Chromium") that fails in a simulated DOM or a non-Chromium engine. So it does not weaken Principle VIII. | None. |
| R1-02 | note | gates/test/integration/test-command.test.ts:69-79; gates/test/fixtures/test-command/passing/ | US1 scenario 10 (a package with no test file, while another package has passing tests, exits 0) is covered, but no test names it. The `passing` fixture has test files only under `packages/tokens/`, and the copied `vitest.config.ts` also declares the `styles` and `elements` projects, which have no files there. The run exits 0. | Optional: name scenario 10 in that test's title the next time the file is touched. |
| R1-03 | note | gates/bin/setup-offline.ts:72-73 (same pattern in gates/bin/test.ts:76-77) | The child's stdout and stderr chunks are appended to one string in arrival order, and that string is then split into ndjson lines. If pnpm ever writes to both streams at once, a chunk can land inside a JSON line. The error record then fails to parse, and the gate falls back to "pnpm install --offline failed (exit N)". That is still exit 2, but it no longer names the package. Nothing observed triggers this: the recorded fixtures and the integration runs all produce a parsed record. | Optional: collect stdout and stderr separately and parse the ndjson stream on its own. |
| R1-04 | note | gates/bin/test.ts:38-45, 49-56; research.md R-03 (phase 2 addition) | Without the override, the Chromium check looks at `chromium.executablePath()`. That is Playwright's full Chromium build, not the headless shell that headless runs launch. A machine with only the headless shell installed (`playwright install --only-shell`) would get exit 2 even though the tests could run. R-03 now documents this, and `pnpm run setup:online` installs both. | None. Recorded so a later report of this behaviour is recognised as intended. |

No blocking findings.

## Test quality

- **TDD check**: `tdd-check.json` has status `pass` and no problems.
  - The red commit 0f3052c has exit 1.
  - The final tests exit 1 on the base and 1 on the scaffold.
  - HEAD exits 0.
- **Red for the right reason**: red-phase.log shows 56 failed tests, all new, and every one fails on an assertion
  against the scaffold's empty return values. Examples:
  - `expected +0 to be 2`;
  - `expected '' to be 'pnpm-lock.yaml'`;
  - `expected [Function] to throw an error`.

  No test fails on an import, syntax or setup error. At the base, the gate tests fail to load because their modules do
  not exist yet. That is expected for the "proven against the old code" run and is not the red evidence.
- **Scaffold** (243bf4b): it adds only the six modules of T015, and nothing else:
  - exported types and signatures;
  - `run()`, `entry()` and `emit()` return 0;
  - the other functions return empty values;
  - no test file and no wiring (package.json, the story config and vitest.config.ts are untouched).

  check-final-tests-on-scaffold.log shows that the final tests fail against it: 56 failed, all on assertions.
- **Red commit is tests only**: 0f3052c touches only `gates/test/**`, which `test_pathspec` matches (`**/test/**`):
  test files, fixtures and the integration helper `workspace.ts`.
- **No weakening**: `git diff 0f3052c..HEAD -- gates/test` is empty. The only test file added after the red commit
  is `packages/elements/test/chromium.test.ts` (R1-01). No test was skipped, deleted or loosened.
- **Assertions**:
  - Every test asserts observable output: exit codes, the exact stdout and stderr lines, parsed contexts, and
    classified results.
  - No test lacks an assertion, and none uses `skip`, `only`, a snapshot or a mock. Fakes are passed in as
    injected `Io` / `ChromiumLookup` values, and the unit's own output is asserted.
  - Expressions like `expect(result.exit === 2 ? result.cause : "").toContain(...)` always run their assertion, and an
    unconditional `expect(result.exit).toBe(2)` precedes each one, so they are not conditional assertions.
  - The integration tests run the real gate as a child process, with `--root` set to a temporary workspace and a
    different working directory.
  - The setup-offline tests count TCP connections to a local registry socket. They would fail if `--offline` were
    dropped.
- **Coverage of the story**:
  - scenario 2: setup-offline integration, exit 0 and the workspace unchanged;
  - scenario 3: missing package, and missing Chromium, each exit 2 naming `pnpm run setup:online`, with no
    connection;
  - scenario 4: `pnpm test` at HEAD runs the tokens, styles, elements (Chromium), gates and gates-integration
    projects;
  - scenario 5: the failing fixture gives exit 1 and the finding line;
  - scenario 6: `chromium.test.ts`;
  - scenario 7: `config-copies.test.ts`, plus tdd-check `pass` here and `fail` in the SC-003 demo;
  - scenario 9: Chromium missing gives exit 2 and runs no test, with the override variant too;
  - scenario 10: R1-02;
  - FR-004 no test file: exit 2;
  - FR-006: the four config-copies cases.

  Scenario 1 (online install) is not testable here because the network blocks cdn.playwright.dev (phase 1 R1-02).
  Scenario 8 belongs to the pins gate in a later phase. Phase 1 R1-03 is decided and red-tested: `chromiumCheck`
  honours `OCELLE_CHROMIUM_PATH`, and R-03 records it.
- **SC-003 second clause**: sc-003-fail-demo.md records a disposable clone, phase 99, a red commit, and a loosened
  rewrite. `tdd-check.sh 99` then reports `fail` with the single problem "the final tests pass against the code from
  before the phase". The demo is consistent with the scripts' JSON output.
- **Mutation**: no run. `mutation_command` is empty in both story-config copies, and it is set in phase 3. Per
  plan.md § Phases item 3 and T049, phase 3 mutation-tests phase 2's gate source against this phase's base. This is
  the planned order (plan.md Constitution Check, VIII), not a gap of this phase.

## Checks run

Environment:
- Node 26.13.0 and pnpm 12.16.1 from /opt/node26/bin;
- `OCELLE_CHROMIUM_PATH=/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell`
  (research.md R-03).

| Check | Result |
|---|---|
| `pnpm run setup:offline` | exit 0: `setup: installed offline; Chromium at /opt/pw-browsers/...`; `git status --porcelain` empty afterwards |
| `pnpm test` (override set) | exit 0: `unit-tests: 60 tests passed in 11 files` |
| Per-project count (`vitest run --reporter verbose`) | tokens 1, styles 1, elements 2 (Chromium), gates 48, gates-integration 8 |
| `pnpm test` without the override | exit 2: `unit-tests: could not run: Chromium not found at /opt/pw-browsers/chromium-1248/chrome-linux64/chrome; run pnpm run setup:online` (the intended behaviour; Playwright's own build is not downloadable here) |
| `node gates/bin/test.ts --project tokens` | exit 0, 1 test: extra arguments reach Vitest |
| `pnpm run gate:config-copies` | exit 0, the two copies are identical |
| Typecheck: `tsc -p tsconfig.json --noEmit` (includes `gates/**`) | exit 0 |
| Typecheck: `tsc -p packages/{tokens,styles,elements}/tsconfig.json --noEmit` | exit 0 each |
| `sk-` / monospace / `.only` / `.skip` / snapshot scan of changed files | no hits in the changed code; the only matches are existing prose in research.md and tasks.md |
| Sign-off | all 5 commits since base carry `Signed-off-by` |
| ESLint, test lint, Stylelint, CSP, axe, visual | not present yet: test lint and mutation come in phase 3 and the other gates in phase 4; Storybook, visual and axe are deferred to #10 (plan Complexity Tracking) |

Tasks: T015 to T031 are all ticked, and their work is present:
- the six modules;
- the seven test files and fixtures;
- `package.json` scripts `test`, `setup:offline`, `gate:unit-tests` and `gate:config-copies` (package.json:10-16);
- `chromium.test.ts`;
- the SC-003 demo file.

Outside the phase tasks, `research.md` gained two paragraphs (R-03: the Chromium check honours the override; R-04:
pnpm 12 reads `pnpm_config_*`). Both are the recording that phase 1's R1-03 asked for and that the R-04 test seam
needed, so they are justified.

Constitution:
- Principles I to V do not apply: no element, token, style or story changed.
- IV: the gates make no network request. The setup-offline test proves zero connections.
- VIII is met as described above.

Plan: the layout `gates/bin`, `gates/lib`, `gates/test`, `gates/test/integration` and `gates/test/fixtures` follows
plan.md § Structure. The exit 0/1/2 contract and the finding format follow contracts/gate-cli.md and data-model.md §
Finding. The `--root` seam is used as R-03, R-04 and R-09 describe.

## Earlier findings

This is the first round for phase 2, so there are no earlier findings of this phase. Phase 1 R1-03, the Chromium
check versus the override, is resolved: it is red-tested in `gates/test/test-command.test.ts:138-154` and
`gates/test/integration/test-command.test.ts:131-142`, and recorded in research.md R-03.
