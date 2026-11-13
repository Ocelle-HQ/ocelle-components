---
phase: 4
round: 1
verdict: changes_requested
base: 5f497947ecefee96afcbba751ef3e61ae6b8e518
head: af8d538d48af04183663b2737a3d703aa92b346e
tdd_check: pass
---

# Phase 4 review, round 1

Change under review: `git diff 5f49794..af8d538` (138 files), with scaffold `91e1395`, red `92fdfb7`, green
`af8d538`. No uncommitted change outside this review directory.

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| R1-01 | blocking | gates/lib/plant-judge.ts:189 (no such rule anywhere in gates/); contracts/plants.md:154; research.md:955-956; data-model.md:153; plan.md:170-173 (decision 14) | The contract says "An `axe` plant without `exceptions: "repository"` is invalid", and R-16 says the plant judge makes such a plant invalid ("an axe plant root holds the repository's stories and carries their exceptions"). Plan decision 14 adopts R-16's rule. Nothing implements or tests it. `grep` finds no check of `delta.json` `exceptions` per gate in `plant-judge.ts`, `plant-repo.ts` or `gates/bin/plants.ts`, and no test names it. All 24 plants under `gates/plants/axe/` do set the key today (checked one by one), but nothing enforces it. An axe plant added without the key would not be refused as invalid. Instead it would come out not-caught or not-accepted, because the repository's ten excepted Prose-document nodes would show up as findings. No task (T006, T013, T058) lists this rule. This phase adds the axe gate and its plants, so the rule becomes live in this phase. | Red first: add a test (in `gates/test/plants.test.ts`, with the other `unlinked`, `captureAlone` and `baselinesOf` validity cases) showing that an `axe` plant whose `delta.json` lacks `exceptions: "repository"` (no `delta.json`, or one without the key) is reported `invalid-plant` with the R-16 message, and that the key on a plant of another gate is not refused. Then implement the check where the plant job validates plants. |
| R1-02 | blocking | gates/bin/axe.ts:88, :90, :108-109 | contracts/gates.md § `axe` makes "`axe-core` not found" an exit-2 cause. Its branch (the `catch` of `axeCore()` and `if (core === undefined) return fail("axe-core not found; run pnpm install")`) has no test. The implementer's commit message says the first mutation run reported a NoCoverage mutant on this `catch`. It was closed by moving the catch under a `Stryker disable … all: process boundary, no test: …` record, not by a test. "no test" is not an equivalent-mutant reason: the mutants change observable behaviour (the exit code and the cause line), so under Principle VIII they are surviving mutants. Every other process-boundary record in this phase names the test or plant that covers it; these three name none. | Add a test that fails when the branch is broken. For example, give `axeCore` (or the gate) an injectable resolver, unit-test that a resolver that throws gives exit 2 `axe: could not run: axe-core not found; run pnpm install`, and that this happens before any build. Then drop the three "no test" records, or replace them with records that name that test. |
| R1-03 | note | gates/README.md:192-200 | The implementer raised it, and it is correct: the "Deferred gates (FR-026)" table still lists Accessibility (axe) (and Storybook build, Visual regression) as delivered by #10. tasks.md T071 (phase 5) explicitly rewrites this table ("deferred table without the three gates"), so the change belongs to phase 5 and is not a phase 4 defect. | None in phase 4; T071 must do it. |
| R1-04 | note | storybook/a11y-exceptions.json; plan.md:614-623 | The implementer raised the ten entries; I checked them. They are the ten rows of plan.md § Complexity Tracking (axe exceptions under FR-029), in row order (light × 5, then dark × 5). Story, theme, rule, selector, reason and sunset are as the rows give them, and `plan` is `specs/006-storybook-workbench/plan.md`. My own `gate:axe` run honours all ten (no `unrecorded-exception`, no `stale-exception`). It reports exactly those ten nodes as excepted `color-contrast-incomplete` notes, `0 incomplete`, and no `scrollable-region-focusable`. This matches T057 and the operator decision on spike § 7. | None. |
| R1-05 | note | git history, red commit 92fdfb7 | The green commit's message says the red commit received tests found during the green work (the `isKeyed` plant-runner cases and the a11y-exceptions cases that closed nine mutation survivors). The red log `red-phase.log` (22:46, after the red commit's 22:41) and `tdd-check.json` (final tests exit 1 on the scaffold, 2 on base) show those tests failing for the missing behaviour, so Principle VIII's evidence holds. Still, the red commit no longer records the tests as first written. | None; recorded for the run summary. |
| R1-06 | note | gates/bin/axe.ts:101 | A missing `storybook/a11y-exceptions.json` is read as `[]`. contracts/gates.md does not cover this case. It does no harm, since the repository and every plant root hold the file (plant-repo.ts writes it). | None. |

## Test quality

- **Red evidence.** `red-phase.log` / `check-red-phase.log`: every new test fails in the red step. The new modules fail
  on the scaffold's `not implemented` throws, which are the missing behaviour behind the scaffolded signatures, not
  import or setup errors. The other failures are assertion failures: `render.test.ts` (tabindex markup),
  `ci-workflow.test.ts` (no `axe` job), `plant-runner.test.ts:349, :429` (the a11y-exceptions location taken as a
  002 keyed location), the registry and plant-count tests, and the integration tests (`axe.test.ts`: exit 2 from the
  stub against the expected 0/1/2-with-cause). `axe-rules.test.ts:110` fails on the real axe-core metadata against the
  scaffold's empty harness list, which is a behavioural failure too.
- **Scaffold.** `91e1395` adds signatures, types and `not implemented` bodies only (`axe-rules.ts`, `axe-verdict.ts`,
  `a11y-exceptions.ts`, the `story-checks.ts` additions, `auditStoryTheme` beside the unchanged stub). It adds no test
  file and wires nothing in. `tdd-check.json`: `final_tests_on_scaffold_exit: 1`, `final_tests_on_base_exit: 2`,
  `head_exit: 0`, `status: pass`, head `af8d538` = HEAD.
- **No weakening.** `git diff 92fdfb7..af8d538` on the test pathspecs touches only the new plant stories under
  `gates/plants/axe/*/tree/` (fixtures of T058, an implementation task). No test file changed after red. The red
  commit's edits to existing tests track the new registry entry: plant counts +3 and +1 gate, the fifth (axe) shard,
  `storybookWorld` no longer adding axe itself, and the `captureAlone` case now naming a registered axe gate's
  invalid plant, which is stricter than the old `unknown-gate` line. The removed axe entry-stub tests went with the
  stub they tested. None of these is loosened.
- **Assertions.** The tests use exact `toEqual` on whole verdicts, finding lists, notes and stdout/stderr. I found no
  conditional assertion, `skip`/`only`, snapshot, mock-only assertion or swallowed error. `axe-context.test.ts`
  asserts on what the unit asked the browser for, which is the unit's observable output.
- **Scenario coverage (US3).** 1 and 5: integration `axe.test.ts` (42 runs, from the built index) and `pass-repository`.
  2: `axe-verdict.test.ts` (three nodes give three findings; `-incomplete`), `fail-unlabelled-button`,
  `fail-two-low-contrast`, `fail-incomplete`. 3: verdict test and `pass-minor-only`. 4: `story-checks.test.ts`
  `emptyRoot`, `fail-empty`, `fail-no-box`. 6: `fail-throws-on-load`, `fail-render-throws`, verdict test. 7:
  `ci-workflow.test.ts` and `registry.test.ts`. 8: `fail-outside-root`, `fail-closed-shadow-root`,
  `fail-open-shadow-unlabelled`, verdict test. 9: `a11y-exceptions.test.ts`, verdict exceptions tests, and the plants
  `pass-excepted*`, `fail-excepted-second-node`, `fail-unrecorded-exception`, `fail-stale-exception`. Pointer states:
  `fail-hover-reveals-unlabelled`, `fail-hover-near-fold`, `fail-pointer-target-below-fold`, `pass-second-render`.
  Gaps: the exit-2 cause "axe-core not found" (R1-02) and the R-16 plant rule (R1-01).
- **Mutation.** `pnpm run gate:mutation -- --base 5f49794` printed `525 mutants on the changed lines of 9 files, none
  survived; 15 timeouts, 127 compile errors, 0 zero-mutant entries; 80 equivalent records`, exit 0, 343 s. I read
  the 80 records:
  - 76 are `all: process boundary` records on browser and file code (`gates/bin/axe.ts`, the collectors in
    `gates/lib/story-page.ts`), each naming the integration test or the axe plants that exercise it. I accept them as
    the project's process-boundary convention; the plants and the integration test I ran cover those paths.
  - 1 is `OptionalChaining: equivalent` at `axe-verdict.ts:130` (the `exceptions[entry]?.` access). It is equivalent:
    `matchExceptions` only maps a node to an existing entry index.
  - 3 are `process boundary, no test` at `gates/bin/axe.ts:88, 90, 108`. These are not equivalent (R1-02).
  - The 15 timeouts (the `wcagTags` and `harnessDocumentRules` literals, `axe-rules.ts:17, 20`) and the compile errors
    are reports, not findings.

## Checks run

All from HEAD `af8d538`, one at a time, in this sandbox (Node from the repository, docker 29.9.2, no podman):

| Check | Result |
|---|---|
| `pnpm test` (OCELLE_CHROMIUM_PATH set) | exit 0, `unit-tests: 3073 tests passed in 136 files` (5 min 1 s) |
| `gate:typecheck` | exit 0 |
| `gate:lint` | exit 0, 261 files, no finding |
| `gate:test-lint` | exit 0, 171 files, no finding |
| `gate:style-lint`, `gate:config-copies`, `gate:prefix`, `gate:csp`, `gate:pins` | exit 0 each |
| `gate:axe` (OCELLE_CHROMIUM_PATH set) | exit 0, `axe: 42 story-theme runs, 0 serious or critical; 10 notes (0 incomplete, 10 excepted)` (30 s) |
| `gate:visual` | exit 0, `visual: 42 captures match their baselines (docker only: no cross-engine comparison)` (51 s); the `tabindex` change leaves the baselines matching |
| `gate:plants -- --plan` (OCELLE_VISUAL_ENGINE=auto) | `[1,…,27]`: 3 other shards, 16 `visual` shards, 8 `axe` shards |
| `gate:plants -- --shard k`, k = 1 … 27 | every shard exit 0, "every plant as expected". Shards 4–19 and 25–27: run by me. Shards 1, 2, 3, 20–24: the earlier attempt's logs passed, but my `gate:visual` run removed their reports from `storybook/.visual/`, so I reran them (1: 84 s, 2: 82 s, 3: 109 s, 20: 32 s, 21–24: 90–92 s each). Visual shards: 52–172 s each; axe shards 25–27: 81–82 s each |
| `gate:plants -- --verdict storybook/.visual/plant-shards` | exit 0, `plants: 304 plants of 17 gates and the registry judged, every plant as expected` |
| `gate:mutation -- --base 5f49794` (OCELLE_CHROMIUM_PATH unset) | exit 0, see Test quality |

Not run here: the CI form `gate:visual --engine both` (no podman in this sandbox). CI runs it.

Tasks: T047 to T060 are all ticked, and their work is present. Two exceptions: R1-01 (a contract rule no task carries)
and R1-02 (one untested exit-2 branch of T056). `gates/lib/plant-runner.ts` (`isKeyed`) changed outside the listed
files; the change has a reason (the axe gate's literal `#<index>` locations), and its red tests are at
`plant-runner.test.ts:349, :429`. Constitution: III (axe on every story and theme, serious and critical findings
block, exceptions node by node with their Complexity Tracking rows), IV (the gate makes requests only to
`127.0.0.1`; elements are unchanged) and VIII (apart from R1-02) are met. The plan's structure (the `axe-rules`,
`axe-verdict` and `a11y-exceptions` modules, contextOptions per story-theme, `addScriptTag`, the `axe` CI job named
"Accessibility", `fr020`) is followed.

## Earlier findings

None: this is round 1.
