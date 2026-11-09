---
phase: 1
round: 1
verdict: changes_requested
base: 9ba3efe7d31e2a6175d5225c807cb29b559c9a07
head: 4c94a44f792d5104df18f9ff8f53d03df52a475b
tdd_check: pass
---

# Phase 1 review, round 1

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| R1-01 | blocking | packages/styles/scripts/build.ts:17 | `pnpm run gate:mutation -- --base 9ba3efe` exits 1 at HEAD with two findings: `ConditionalExpression: NoCoverage: replaced by true` and `... replaced by false` on `if (import.meta.main) await build();`. No test imports build.ts, and the line has no record. The repository's convention is that every `import.meta.main` entry line carries a reasoned `// Stryker disable next-line all:` record, as in packages/tokens/scripts/build.ts:61, gates/bin/prefix.ts:128 and gates/bin/setup-offline.ts:104. research.md R-01 plans that record for this file. Mutation testing is a merge gate (constitution, Development Workflow), and the phase leaves it red. | Put a reasoned `// Stryker disable next-line all:` record above line 17. For the phase-1 stub, give the reason that both mutants are equivalent: `build()` resolves without doing anything, so calling it on import or not calling it from the CLI changes nothing observable. Phase 2 replaces it with the R-01 I/O-boundary record naming `packages/styles/test/build.test.ts`. Then `pnpm run gate:mutation -- --base 9ba3efe` must exit 0. A comment adds no behaviour, so no red test is needed. |
| R1-02 | note | gates/test/integration/vitest-mutation-config.test.ts:25-42 (commit 2d93725) | Was this test weakened after red commit c7de184? No. Both exact-list assertions keep `toEqual` on the full list. Each gains `styles-browser`: in the list of all projects (line 33) and in the excluded list (line 40). The kept-project assertion (line 42) is unchanged. The test is now stricter: it requires one more project, and it fails against base (check-final-tests-on-base.log, `vitest-mutation-config.test.ts:25`). Commit 2d93725 gives the reason. It belonged in red commit c7de184, because it fails against base in its final form, but leaving it out weakened nothing. | None. |
| R1-03 | note | commits 9fd0707..3739463 | From 9fd0707 (T002) until 2d93725, `pnpm test` was red at each commit. The unchanged integration test still pinned the old 8-project list, so T002's "T001 now passes" held for T001 but not for the suite. The HEAD is green. | None. Next time, update a pinned test together with the change that breaks it, or in the red commit. |
| R1-04 | note | packages/styles/scripts/build.ts:12 | The implementer worried that `buildPlan`'s `[]` might leave a mutant alive. It does not. Stryker's TypeScript checker kills both mutants on line 12 as `CompileError`. `["Stryker was here"]` fails TS2322 (string is not `PlanEntry`), and `() => undefined` fails TS2322. Line 15's `() => undefined` is also a `CompileError`. R1-01 covers the only survivors. | None. |
| R1-05 | note | refs/stash (f26e972) | The mission-002 stash ("phase 2 round 1 fix, partial") changes six files: gates/stylelint/token-only.ts, gates/test/token-only.test.ts, packages/tokens/src/generate.ts and packages/tokens/test/{overrides,resolve,validate}.test.ts. None of the 8 phase commits touches any of them: the union of the files of `git diff-tree` over 9ba3efe..4c94a44 is the 18 paths listed under Checks run. f26e972 is not an ancestor of HEAD, and the working tree changes only this phase's review evidence. No commit carries the stash's content. The stash entry still exists, but that is outside this review. | None. |
| R1-06 | note | packages/styles/package.json:8 | `"./base.css": "./dist/base.css"` points at a file the phase-1 build does not write yet (`pnpm run build` in packages/styles exits 0 and writes only index.*). The stub is expected to do this, and phase 2's build.test.ts covers it. | None. |

## Test quality

- **Red evidence:** red commit c7de184 changes only gates/test/vitest-config.test.ts. red-phase.log shows exactly the two intended failures, both `AssertionError`s for the missing project and not setup errors: at :42, the excluded list lacks `styles-browser`; at :68, `packages/styles/test/browser/x.test.ts` is owned by `styles`, not `styles-browser`. tdd-check.json: `status: pass`, red exit 1, final tests on base exit 1 (3 failures, including the updated integration test), head exit 0, no problems.
- **Weakened tests:** `git diff c7de184..HEAD -- '*.test.ts'` touches only the integration test, which is stricter (R1-02). vitest-config.test.ts is unchanged since the red commit.
- **Vacuous assertions:** none. The new test at gates/test/vitest-config.test.ts:68-72 asserts exact owner lists for one browser path and one non-browser path. It has no conditionals and no skip or only, and test-lint is clean.
- **Exemption (tdd-exempt.md):** the exemption is justified. T003 is a manifest checked by gate:pins, T004 is an exact pin checked by gate:pins, and T005 is neutral stubs whose behaviour arrives red-first in phase 2. No test could fail for them in this phase beyond what the gates already check. T002 is not exempt, and red commit c7de184 covers it.
- **Mutation:** in scope is packages/styles/scripts/build.ts (17 lines, 1 shard). The root vitest configs are outside the gate's scope. 5 mutants: 3 `CompileError` (lines 12, 12, 15) and 2 `NoCoverage` survivors on line 17 (R1-01). The changed code has no equivalent-mutant records.
- **Acceptance scenarios:** phase 1 is setup and has none. Its Independent Test is met: `pnpm test` passes, browser tests are routed to `styles-browser` only, gate:pins accepts the peer dependency, and tdd-check reports pass.

## Checks run

Node v22.23.4, PLAYWRIGHT_BROWSERS_PATH set as given, run one at a time at HEAD 4c94a44:

- `pnpm test`: exit 0, 1799 tests passed in 88 files.
- `gate:typecheck`, `gate:lint` (157 files), `gate:test-lint` (98 files), `gate:style-lint`, `gate:pins` (5 manifests), `gate:prefix`, `gate:csp`, `gate:contrast`, `gate:brand-rules`, `gate:config-copies`: each exit 0, no finding.
- `gate:signoff -- --range 9ba3efe..4c94a44`: 8 commits, no finding.
- `pnpm run build` in packages/styles: exit 0.
- `gate:mutation -- --base 9ba3efe`: **exit 1**, 2 findings (R1-01).
- Not run: gate:plants, Storybook build, visual and axe. Phase 1 touches no gate, story, element or stylesheet content.
- Tasks: T001 to T006 are ticked in tasks.md and their work is present. The phase changed these 18 paths: the two gates tests, package.json, packages/styles/{package.json,scripts/build.ts,src/base.css}, pnpm-lock.yaml, vitest.config.ts, vitest.mutation.config.ts, tasks.md and the phase-1 review records. Nothing changed outside the phase.
- Plan: R-01 (manifest fields, build script, `buildPlan`/`build` shape with the `PlanEntry` content entry), R-09 (`styles-browser`, node environment, excluded from mutation), R-11 (exact `postcss-selector-parser` 7.1.7) and decision 11 (exact workspace peer `@ocelle/tokens`, recorded in the lockfile importer) are all followed.

## Earlier findings

None (first round).
