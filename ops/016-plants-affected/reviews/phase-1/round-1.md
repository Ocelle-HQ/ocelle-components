---
phase: 1
round: 1
verdict: changes_requested
base: 80ea82594a0d29800fc692a87041dbadabdd20a2
head: dfdb9a3a41479baa463ccb53664214ae3fc8293e
tdd_check: pass
---

# Phase 1 review, round 1

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| R1-01 | blocking | gates/bin/plants.ts:663, gates/test/integration/plants.test.ts:171-181 | The spec's edge case "untracked files that are not ignored are added" (spec.md *Edge Cases*, OR-003; plan.md *The mode* step 2) has no test. The `git ls-files --others --exclude-standard -z` half of `changed` sits under `Stryker disable next-line all` records that give "covered by gates-integration: ... `--affected HEAD judges only the plant whose plant.json changed since HEAD`" as the reason. That test only modifies a tracked file (`config-copies/pass-equal-copies/plant.json`, committed by `git add -A` before the write). If you drop the `ls-files` run, or the `-z`/NUL split of its output, every test still passes. So the reason in the record does not hold for that part of the line. An untracked path that is missed means the selection is too small, and neither the record nor the review's `--list` comparison would show it. Principle VIII: an equivalent-mutant record needs a valid reason. | Write a red test first (fix-1). In the integration case, or a second one, add an untracked, not-ignored file under one plant's directory (for example a new file in another committed plant's case directory). Assert that `--affected HEAD` selects and judges that plant too, with its `note: affected:` line. If you want the ignored half covered as well, add an ignored file and assert that it selects nothing. The record's claim must then match what the test covers. |
| R1-02 | note | gates/bin/brand-rules.ts:16, gates/lib/plant-runner.ts:397-398 | `gates/bin/brand-rules.ts` imports `monospaceFamilies` from `gates/bin/prefix.ts`. A change to `gates/bin/prefix.ts` therefore also changes how the `brand-rules` gate behaves. Class 3 selects only `prefix/*`, so a local `--affected` run leaves out the `brand-rules` plants. This follows the approved rule (OR-001 class 3, Q1 A), and CI's full Plants check still judges them, so it is not blocking. But the README's "Known limit" (gates/README.md:81) does not name it. | Optional: treat a gate entry that another entry imports (`prefix.ts`, and `test.ts` through `setup-offline.ts`, which is already full-set) as shared gate source, or name the case in the README's known limit. |
| R1-03 | note | gates/test/integration/plants-robustness.test.ts:179 | The test changed after the red commit (35 to 36 plants). It is not in plan.md *Files to change*. The change is forced by the new registry plant `fail-affected-in-plant-check` and keeps the assertion exact, so it is not a weakening. | None. |
| R1-04 | note | gates/bin/plants.ts:663 | The real `changed` adds `--relative` and a trailing `--` to the diff of plan.md *The mode* step 2. Both are harmless with the repository root as cwd. | None. |

## Test quality

- **Red evidence.** The red commit `268b1e4` changes only the four test files. `red-phase.log` and `check-red-phase.log` match (they differ only in timing lines): 33 of 3146 tests fail, each because the behaviour is missing.
  - `affectedPlants` / `affectedInCiFindings` "is not a function"; `repositoryContentPlants` undefined.
  - The plants mode tests see the full single run instead of the affected one.
  - The integration case gets the single run's output.
  - No failure comes from a setup or import error.
- **Final tests on base.** `check-final-tests-on-base.log`: 38 of 3150 fail on base. These include the five tests added after red: the two `affectedPlants` near-miss and same-gate `baselinesOf` cases, the `affected-in-ci` registry plant case, the `baselinesOf`/invalid plant.json case, and the robustness count. `tdd-check.json` is `pass` with no problems. There is no scaffold commit.
- **Weakening.** `git diff 268b1e4..HEAD -- gates/test` only adds tests (three new `it`s, which are stricter and give their reason "Added in the green step for the mutation run") and changes the robustness count (R1-03). No test was skipped, deleted or loosened.
- **Assertions.** Every new test asserts the whole result with `toEqual`: selections with their paths and order, stdout/stderr lines, exit codes, plants run, and bases asked. None has a conditional assertion, `skip`/`only`, a snapshot, or a swallowed error. The `changed` double records its calls (`asked`), and tests assert that, together with the unit's output, not instead of it.
- **Scenarios.** Spec scenarios 1-9 and 10 (the pin) have tests (plant-runner.test.ts, registry.test.ts, plants.test.ts, integration/plants.test.ts). Scenario 11 is the review procedure itself. The deleted-plant, unmapped `gates/plants/` and `--skip-container` edge cases have tests. The untracked-file edge case does not (R1-01).
- **Mutation.** `pnpm run gate:mutation -- --base 80ea825`: 377 mutants on the changed lines of 3 files, none survived; 0 timeouts, 118 compile errors (read: type-invalid mutants), 0 zero-mutant entries, 9 equivalent records, exit 0.
  - I read the 9 records. `gates/lib/registry.ts:187` (ArrayDeclaration on the `?? []` default) is a sound equivalent: no job means no lines, and a placeholder line holds no `--affected`.
  - The 8 process-boundary records on `gates/bin/plants.ts:653-668` name the integration test. That test covers the `rev-parse` failure, the diff of a tracked change and the summary. It does not cover the untracked-file listing (R1-01) or the `git failed` cause (hard to provoke; acceptable as boundary).

## Checks run

- `pnpm test`: 3150 tests passed in 138 files, exit 0 (also `check-head.log` from the tdd check).
- `gate:typecheck`, `gate:lint` (263 files), `gate:test-lint` (173 files), `gate:config-copies`, `gate:style-lint`, `gate:prefix`: all exit 0, no finding.
- `gate:mutation -- --base 80ea825`: exit 0 (see above).
- **Plants.**
  - `plants.md` exists, and its base `80ea82594a0d29800fc692a87041dbadabdd20a2` equals `base.sha`. The recorded exit is 0 for the `--list` run and 0 for the full verdict (302 plants of 17 gates and the registry, every plant as expected).
  - I re-ran `pnpm run gate:plants -- --affected 80ea825… --list`: `note: affected: every plant, by gates/bin/plants.ts (shared gate source)` and `302 of 302 plants selected, none judged (--list)`, exit 0. This is identical to the record. I did not judge the plants again.
- I did not run visual, axe, storybook-build, CSP or manifest separately. The phase changes no package, story, baseline or Storybook file, and the recorded full plant verdict covers the gate plants.
- **Tasks.** T001 to T018 are ticked and their work is present. The installed copies of the implement, review and fix commands (`.specify/extensions/story/commands/`, `.specify-dev/.../SKILL.md`, `.claude/skills/.../SKILL.md`) have bodies identical to their sources. The two `story-config.yml` copies are byte-identical.
- **Unchanged (T018, OR-007).** `git diff 80ea825..HEAD` does not touch `.github/workflows/ci.yml`, `gates/test/ci-workflow.test.ts`, `gates/lib/plant-repo.ts`, `.claude/skills/ocelle-land/SKILL.md` or any existing plant directory. `plantShards`, `shardSize` and `otherShardSize` are untouched. The only plant added is `gates/plants/plants/fail-affected-in-plant-check/`: `gates.json` is identical to `pass-split-plant-jobs/gates.json`, `ci.yml` differs from it only by `--affected HEAD~1` on the plants job's step, and `plant.json` expects `ci.yml` / `affected-in-ci`.
- **Constitution.**
  - Principles I to V and VII are not touched: no element, token, story or package surface changes.
  - VI is met (#41).
  - VIII is met apart from R1-01. The new gate rule has its fail plant, and CI's Plants check stays the full set (`affected-in-ci`).
- **Plan.** The path classes, the order, `repositoryContentPlants` (10 entries, with their reasons), the mode errors, the output table and the story-flow text all follow plan.md.

## Earlier findings

None: this is the first round.
