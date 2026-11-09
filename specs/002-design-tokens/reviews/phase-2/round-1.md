---
phase: 2
round: 1
verdict: changes_requested
base: 98c1dcdaa0731fa7e9b668001eb78dbb7831d1d7
head: 558bffd780bee3a07ec7b30d9708b05d9d709ee6
tdd_check: pass
---

# Phase 2 review, round 1

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| R1-01 | blocking | gates/stylelint/token-lists.ts:31, 36-38, 41, 43-44, 46, 49, 51, 65-66, 72, 86-87, 91, 96 | `pnpm run gate:mutation -- --base 98c1dcd` exits 1. 27 of its 49 findings are in this new file (Survived and NoCoverage). Examples: `isObject` (line 31) replaced by `true` survives. The reason strings of `manifestProperties` (lines 36-38, 51) can be emptied without a test noticing, because the schema tests (gates/test/token-only.test.ts:256-264) check only the message prefix `... is not a custom-elements manifest` and never the reason. No test covers "a module is not an object", "declarations is not a list", "a declaration is not an object" or "cssProperties is not a list" (lines 41, 44, 46, 49: NoCoverage). Object literals at lines 72, 91 and 96 (the `{ cause }` options) survive. The read-error path (line 66) and the load-failure branches (lines 86-87) are NoCoverage. | Add tests that fail first (Principle VIII, fix test-first). They should assert each manifest reason exactly (unit tests on `manifestProperties` are enough), add the missing malformed-manifest cases, and assert the `cause` and the load-failure messages. Any mutant that really is equivalent gets a `Stryker disable` record with its reason. |
| R1-02 | blocking | packages/tokens/src/generate.ts:100, 106, 111-112, 141, 156, 168, 174, 176-177, 179, 191, 234 | The mutation gate reports 17 surviving or uncovered mutants in the generator. Survivors that point to missing test cases: line 191 `themes.every` becomes `themes.some` (no fixture has a colour or ground that is opaque in one theme and translucent in the other); line 156 `\|\|` becomes `false` (the only color-scheme case, validate.test.ts ~line 123, has light wrong and dark right; no case has dark wrong); lines 111-112 (refProblems: a duplicate in `ref`, and the message text); line 141 (ref names collected from a per-theme ref); line 234 (an override that sets `ref` is not checked to keep it); lines 168-179 (cycle detection: the `visited` and `edges.has` guards, and a cycle that does not pass through the start token). Line 100 (the cycle error inside `resolveIn`) and line 174 are NoCoverage. Line 106 (`[]` becomes `["Stryker was here"]`) may be equivalent. | For each one, add a red test that kills it, or record it as an equivalent mutant with the reason (`// Stryker disable next-line <mutator>: <reason>`). Then re-run `gate:mutation` against the phase base. |
| R1-03 | blocking | gates/stylelint/token-only.ts:99, 118, 128, 130 | The mutation gate reports 5 findings on the new unknown-token code. Line 99: `node.type !== "function"` replaced by `false` survives, so no test has a non-function word `var` or similar. Line 118: the per-root cache `loaded.set` removed survives. Line 128: the no-options guard replaced by `false` survives. Line 130: the `?? []` defaults are NoCoverage (2 mutants). | Kill them with red tests, for example options that give only `tokens`, and a value containing a bare `var` word. The cache line may be equivalent; if so, record it with the reason. |
| R1-04 | note | packages/tokens/scripts/build.ts:26-55 | 11 lines carry `Stryker disable next-line all: I/O boundary, covered by <test>`. This follows the thin-boundary convention agreed in plan review PLAN-TESTABILITY-1-003 and research.md R-01. I read each record: every one names a build.test.ts test that exists and exercises that line. Accepted. | None. |
| R1-05 | note | git show 184e213 (scaffold) | The scaffold contains configuration as well as signatures: the `tokens-browser` project in vitest.config.ts and its exclusion in vitest.mutation.config.ts. T008 requires this. Because of it, gates/test/vitest-config.test.ts (3 tests) and the changed vitest-mutation-config test passed in the red run. The red commit body records the reason. I copied both tests onto the phase base and ran them: 3 fail on assertions (`expected [ 'gates-integration' ] to deeply equal [ 'tokens-browser', … ]`, and the project-membership test). The fourth, "keep no test file both in a kept and an excluded project", passes there as a guard. | None for this phase. Later phases can put such configuration in the green commit so that the red run shows the failure. |
| R1-06 | note | packages/tokens/test/browser/serve.ts | T008 asks for `serve.ts` as a scaffold signature and T026 asks for it to be implemented in green. It was written in full in the red commit, because scaffold.sh refuses test-path files; the reason is recorded in both commit bodies. It has not changed since red. | None. |
| R1-07 | note | specs/002-design-tokens/tasks.md:94 (T029) | The green commit lists the checks it ran, but `gate:mutation` is not among them, and T029 does not ask for it. That gap let R1-01 to R1-03 reach review. | Run `gate:mutation -- --base <phase base>` before handing a phase to review. |

## Test quality

- **Red evidence.** red-phase.log and check-red-phase.log show 148 failures against the scaffold (commit 3bf7ffc), each one an `AssertionError` or a promise that resolved where it should have rejected. There is no load, syntax or setup error. They fail because the behaviour is missing: empty lists, empty strings, functions that do not throw. check-final-tests-on-scaffold.log exits 1. check-final-tests-on-base.log exits 2 on a load error (`../scripts/build.ts` does not exist at the base), which is expected for a base without the scaffold.
- **New tests that passed in the red run**, which I found by re-running the red commit with the JSON reporter:
  - The guard tests `validateSource() accepts the fixture/real source`, `applyOverrides() does not change the records it is given` and `declares no theme-independent token under the dark selectors`. Each has a real assertion that a wrong implementation would fail; they are not vacuous.
  - The vitest-config tests (R1-05).
  - The pre-existing tests in plant-repo.test.ts, gates-root.test.ts and token-only*.test.ts that only had substitutions.
- **Tests changed since red** (`git diff 3bf7ffc..HEAD` on test paths): only gates/test/integration/plants.test.ts, which gains the four token files in its `copied` list. That makes it stricter, and the green commit body gives the reason. No test was weakened, skipped or deleted after red.
- **Tests changed in the red commit**:
  - In token-only.test.ts and token-only-parts.test.ts, `--ocelle-x/-y/-font/-w/-c` become real token names one for one. The assertions keep their strength, and the reason is recorded (FR-010 makes `--ocelle-x` an unknown token).
  - sample.test.ts is deleted. It asserted that the package exports nothing, which this phase reverses on purpose; index.test.ts replaces it.
  - gates-root.test.ts adds the token files to the style-lint configuration list.
- **Assertions.** Every test I read asserts observable output: generated text and blocks, resolved values, exact error messages, CSSOM names, computed RGBA, used values, CSP violation records with a control violation, and file contents. I found no conditional assertions, no `skip`/`only`, no snapshots and no swallowed errors. The browser suites compare against expected.ts (transcribed from Appendix A), not against the source. The CSP suite proves its collector works with exactly one control violation. The exceptions are the weak message checks behind R1-01: the manifest-reason assertions check a prefix only.
- **Acceptance scenarios.** US1 scenarios 1-7 and 9 are covered by themes.test.ts, values.test.ts, source-table.test.ts and json.test.ts. They include the six conditions, attribute removal, a switch at run time, ignored `data-theme` values, theme-independence and reduced motion. Scenario 10 is covered at run time by csp.test.ts and statically by gate:csp and gate:prefix, both of which pass on the built package. Scenario 8 (chrome luminance and contrast) belongs to phase 5 (T054 brand rule (e)). Scenarios 11-13 belong to phase 3.
- **Scaffold** (184e213). It has signatures that return empty values and no test file, and the final tests fail against it (tdd-check `final_tests_on_scaffold_exit: 1`). The configuration it also holds is covered in R1-05.
- **Mutation.** `pnpm run gate:mutation -- --base 98c1dcd` exits 1 with 49 findings in 3 files: 27 in token-lists.ts, 17 in generate.ts and 5 in token-only.ts. They are listed in R1-01 to R1-03. There are 11 equivalent and boundary records, all in build.ts, and they are accepted (R1-04). source.ts has no survivors: source-table.test.ts kills its value mutants, as planned.

## Checks run

Browser tests ran with `PLAYWRIGHT_BROWSERS_PATH` set to the scratchpad `pw` alias (phase 1 R1-02).

| Check | Result |
|-------|--------|
| `pnpm test` | pass: 1399 tests in 67 files |
| `gate:typecheck` | pass |
| `gate:lint` | pass: 121 files |
| `gate:test-lint` | pass: 73 files |
| `gate:style-lint` | pass |
| `gate:config-copies` | pass |
| `gate:pins` | pass |
| `pnpm -r build` | pass: dist/tokens.css and dist/tokens.json written |
| `gate:csp` (after build) | pass: 7 files |
| `gate:prefix` (after build) | pass: 47 files |
| `gate:plants` | pass: 141 plants, including the new style-lint plants |
| `gate:mutation -- --base 98c1dcd` | **fail: exit 1, 49 findings** (R1-01 to R1-03) |
| tdd-check.json | `pass`, no problems |

Constitution:
- I and IV: generate.ts is pure. build.ts does I/O only at the build boundary. Nothing in the elements package changed.
- II: the tokens are `--ocelle-*`, A.6 names are rejected by validation and absent from the output, and the README states the rendered brand rules.
- VII: the CHANGELOG names every token under Unreleased.

Plan: the four blocks of R-02, the R-11 exports and files, the R-09 unknown-token rule with the manifest list and clash check, and the configuration set of contracts/gates.md are all followed. Every task T008 to T029 is ticked and its work is present.

## Earlier findings

None: this is round 1.
