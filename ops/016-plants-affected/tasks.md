---

description: "Task list for op 016: a phase judges only the plants its diff can affect"
---

# Tasks: A phase judges only the plants its diff can affect

**Input**: `ops/016-plants-affected/` (op.md, spec.md, plan.md)

**Tests**: Required. Write them test-first, per constitution VIII and plan.md *Test approach*. The story's tests go
in the phase's red commit.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: US1, the op's one story

---

## Phase 1: A phase judges only the plants its diff can affect

**Goal**: `gate:plants -- --affected <base> [--list]` selects plants by the path classes of plan.md and judges only
those. It always runs the registry check and the structural checks. CI cannot pass `--affected`
(`affected-in-ci`). A phase records the run in `reviews/phase-<N>/plants.md`, and the review checks it.

**Independent Test**: these tests pass after being seen red: `gates/test/plant-runner.test.ts`,
`gates/test/registry.test.ts`, `gates/test/plants.test.ts` and `gates/test/integration/plants.test.ts`. The full
`gate:plants` judges the new registry plant `fail-affected-in-plant-check` as caught.

### Tests (red first, one test-only commit)

- [X] T001 [P] [US1] In `gates/test/plant-runner.test.ts`, add the `affectedPlants` cases of plan.md *Test approach*, on hand-written plant, gate and path lists, each asserting the whole result with `toEqual`: spec.md scenarios 1 to 5; each no-plant pattern and its near miss; a deleted plant named by a `baselinesOf`; `gates/bin/plants.ts`; an unknown `gates/plants/<dir>/`; `packages/tokens/package.json`; an empty list; a full-set path after selected paths.
- [X] T002 [P] [US1] In `gates/test/plant-runner.test.ts`, pin the full lists of `gates/plants/visual/` (48 cases) and `gates/plants/axe/` (25 cases) as literals compared with the directory listings, and check that every `repositoryContentPlants` entry is an existing plant directory with a `plant.json`.
- [X] T003 [P] [US1] In `gates/test/registry.test.ts`, test `affectedInCiFindings`: one `affected-in-ci` finding per plant job with `--affected` in a step, in the order `plants-plan`, `plants-shard`, `plants`, with the message of plan.md; none for a workflow without it; none for `--affected` in a job that is not a plant job.
- [X] T004 [P] [US1] In `gates/test/plants.test.ts`, test the mode on recorded runs with a `changed` double: only the selected plants run, with the summary line (scenario 6); an empty selection runs no plant and prints the no-plant line, exit 0 (scenario 5); `--list` runs no plant (scenario 7); `unknown-gate` and `missing-plant` are still reported when nothing is selected; `affected-in-ci` in the repository's `ci.yml` is reported in this mode and in the single run; a full-set selection runs every plant and prints `note: affected: every plant, by …`; each exit-2 cause of scenario 8, with `changed` never called for an argument error.
- [X] T005 [P] [US1] In `gates/test/integration/plants.test.ts`, give the temporary root a git history: `--affected HEAD` after one plant's `plant.json` changes judges only that plant and names `HEAD` in its summary; `--affected no-such-ref` exits 2 naming the cause.
- [X] T006 [US1] Commit T001 to T005 alone (`test(op-016): phase 1 red — …`, signed off). Run `red.sh 1 phase`, and check in `red-phase.log` that every new test fails because the behaviour is missing (an export that does not exist, the full single run starting). If a missing export makes the run fail to load instead, add a scaffold commit first (plan.md *Test approach*).

### Implementation

- [X] T007 [US1] In `gates/lib/plant-runner.ts`, add `repositoryContentPlants` (the ten plants of plan.md, each with its reason), `noPlantPath`, `repositoryContentPath` and `affectedPlants`, with the classes and order of plan.md *Path classes*. Leave `plantShards`, `shardSize` and `otherShardSize` unchanged.
- [X] T008 [US1] In `gates/lib/registry.ts`, add `affectedInCiFindings`, as plan.md *Registry rule* describes.
- [X] T009 [US1] In `gates/bin/plants.ts`, do the following:
  - add the `affected` mode and its argument errors to `Mode` and `modeOf`;
  - add `changed` to `PlantTools`, with its real version in `realTools` (git `rev-parse`, `diff --name-only --no-renames -z` and `ls-files --others --exclude-standard -z`), marked with process-boundary `Stryker disable` comments naming the integration test;
  - read the selection in `plants()` and print the `note: affected:` lines;
  - add `selected` to `PlantSet`, `judgeAll` and `judgeRun` (the whole-set checks, judging only the selected plants);
  - add `affectedInCiFindings` to `judgeRun` and `registryRun`;
  - print the summary lines of plan.md *Output*.
- [X] T010 [US1] Add `gates/plants/plants/fail-affected-in-plant-check/`:
  - `gates.json`: a copy of `pass-split-plant-jobs/gates.json`;
  - `ci.yml`: `pass-split-plant-jobs/ci.yml` with ` --affected HEAD~1` appended to the `plants` job's `gate:plants` step;
  - `plant.json`: `expect: fail`, with one finding (`ci.yml`, `affected-in-ci`) and a `why` that names this op.
- [X] T011 [P] [US1] In `gates/README.md`, add the one paragraph of plan.md *README paragraph* after the mode list in "The split plant job". Add `--affected` in a CI plant job (`fail-affected-in-plant-check`) to the `plants` row. Change no other existing line.
- [X] T012 [P] [US1] Add `plants_command: "pnpm run gate:plants"` and its comment line to `.specify/extensions/story/story-config.yml` and `tooling/speckit/extensions/story/story-config.yml`, keeping the two byte-identical. Add a dated amendment (op 016) to `specs/001-repository-foundation/contracts/story-config.md`.
- [X] T013 [US1] Change the story commands as plan.md *Story flow* describes:
  - `tooling/speckit/extensions/story/commands/speckit.story.implement.md`: the affected run and `plants.md`, before the phase commit;
  - `speckit.story.fix.md`: re-run, and replace `plants.md`;
  - `speckit.story.review.md`: check the base, re-run `--list`, compare, and the blocking cases.

  Then reinstall the copies (`specify extension remove story && specify extension add --dev tooling/speckit/extensions/story`), or edit them by hand to equal their source: `.specify/extensions/story/commands/`, `.specify/extensions/story/.specify-dev/agent-commands/claude/speckit-story-*/SKILL.md` and `.claude/skills/speckit-story-*/SKILL.md`.
- [X] T014 [P] [US1] In `.specify/templates/tasks-template.md`, add the bullet of plan.md *Story flow* to "Format": every phase ends with the affected run of `plants_command`, kept in `reviews/phase-<N>/plants.md`, and lists no plant shards by number.
- [X] T015 [P] [US1] Add an entry under 2026-11-15 to `knowledge/speckit-flows/log.md`: op 016 replaces the missions' hand-picked plant shards with `--affected`, and states the known limit (Q3 C).

### Checks

- [X] T016 [US1] Run `pnpm test`, `gate:typecheck`, `gate:lint`, `gate:test-lint` and `gate:config-copies`, and `gate:mutation -- --base $(cat ops/016-plants-affected/reviews/phase-1/base.sha)`. Kill every surviving mutant in new code with a stricter test, or record it as equivalent with its reason.
- [X] T017 [US1] Run the full `gate:plants`: `--plan`, then `--shard k` for each shard one at a time, then `--verdict storybook/.visual/plant-shards`. Check that `plants/fail-affected-in-plant-check` is judged as caught. Write `ops/016-plants-affected/reviews/phase-1/plants.md` with the `--affected <base> --list` output (the full set, by `gates/lib/plant-runner.ts`) and the verdict run's summary.
- [X] T018 [US1] Check that the op's diff leaves these untouched: `.github/workflows/ci.yml`, `gates/test/ci-workflow.test.ts`, `plantShards`, `shardSize`, `otherShardSize`, `gates/lib/plant-repo.ts` and every existing plant directory (`git diff --stat <base> -- …`).

### Operator round 3 (from the landing review)

Source: `reviews/phase-1/round-3.md` (O3-01 to O3-05, operator answers of 2026-11-15), from
`reviews/landing/round-1.md` (L1-01 to L1-05). Run through the fix procedure (`speckit-story-fix`, phase 1, round 3):
red tests for O3-01, O3-04 and O3-05 first, in one test-only commit recorded as `fix-3`; O3-02 is a missing test for
behaviour that is already right, so it has no red commit; O3-03 is docs only. spec.md scenarios 10 and 12 to 17,
OR-001, OR-002, OR-005, OR-006, OR-008 and OR-009, and plan.md *Files of operator round 3* hold the detail.

#### Tests (red first, one test-only commit, label `fix-3`)

- [ ] T019 [P] [US1] O3-01: in `gates/test/plant-runner.test.ts`, add `affectedPlants` cases on hand-written plant and gate lists, each asserting the whole result with `toEqual` (spec.md scenarios 12 and 13): `packages/elements/src/ocelle-brand-mark.ts` and `packages/elements/custom-elements.json` each select the `repositoryContentPlants` and every `manifest` plant; `packages/tokens/src/source.ts` and `packages/tokens/contrast/pairs.json` each select the `repositoryContentPlants` and every `contrast`, `brand-rules` and `style-lint` plant; an element path and a token path together select the union, each plant with its first path; a story path still selects only the `repositoryContentPlants`; `packages/tokens/package.json` still gives the full set.
- [ ] T020 [P] [US1] O3-01: in `gates/test/plant-runner.test.ts`, grow the pin to the full case lists of `gates/plants/manifest/` (12), `gates/plants/contrast/` (14) and `gates/plants/brand-rules/` (14), as literals compared with the directory listings, as for `visual` and `axe` (spec.md scenario 10). These pass at once; they belong in the red commit with the rest of the round's tests.
- [ ] T021 [P] [US1] O3-05: in `gates/test/plant-runner.test.ts`, add the cross-import pin of plan.md *Cross-imports of gate entries*: read every `gates/bin/<id>.ts` of a registered gate id (from `gates/gates.json`), collect its static, type and dynamic relative imports of another registered gate entry, and compare the sorted pairs with `gateEntryImports` using `toEqual` (scenario 15). Add `affectedPlants` cases: `gates/bin/prefix.ts` selects every `prefix` and every `brand-rules` plant; `gates/bin/brand-rules.ts` selects only `brand-rules` (scenario 14).
- [ ] T022 [P] [US1] O3-04: add `gates/test/integration/fold-history.test.ts`. In a temporary git repository with a feature dir holding `reviews/phase-1/{base.sha,red-commits,plants.md}` (`plants.md` in the form of plan.md *Story flow*) and at least one unkept commit between the fold base and the phase base, run `tooling/speckit/bin/fold-history.sh <fold base> <feature dir> phase-1`. Assert the whole outcome: `ok: true`; `base.sha` names a new commit; `plants.md`'s `- base:` line equals it; every other line of `plants.md` is unchanged (scenario 17).
- [ ] T023 [US1] Commit T019 to T022 alone (`test(op-016): phase 1 review round 3 red`, signed off). Run `.specify/extensions/story/scripts/red.sh 1 fix-3`; it must report `"recorded": true`. Check in its log that T019, T021 and T022 fail because the behaviour is missing: the selection they get today, `gateEntryImports` not exported, the old SHA on `plants.md`'s base line. None may fail on a setup error. The T020 pins pass.

#### Fixes (one fix commit)

- [ ] T024 [US1] O3-01, O3-05: in `gates/lib/plant-runner.ts`, add `gateEntryImports` (one pair today, `{ entry: "prefix", importer: "brand-rules" }`, with its reason), and change class 3 and class 5 of `pathPlants` as plan.md *Path classes* now says. Leave `repositoryContentPlants` at its ten entries, and leave `plantShards`, `shardSize` and `otherShardSize` unchanged. Update the JSDoc of `repositoryContentPlants` and `affectedPlants` to match.
- [ ] T025 [US1] O3-02: in `gates/test/integration/plants.test.ts`, add the case of spec.md scenario 16: commit `plantsRoot()`, run `--affected HEAD` with `GIT_INDEX_FILE` set to a junk file in `env`, and assert `{ code: 2, stdout: [], stderr: ["plants: could not run: git failed (<first stderr line>)"] }`, matching the part without the path. Check it by hand mutation: force the `failed` check in `changed` to false, see the test fail, and revert. In `gates/bin/plants.ts`, make the two `Stryker disable` records on `failed` and on its `return { cause }` name this test. Change nothing else in `gates/bin/plants.ts`. No red commit: the fix note says why (fix procedure step 3).
- [ ] T026 [US1] O3-04: in `tooling/speckit/bin/fold-history.sh`, remap the SHA on the `- base:` line of each `reviews/phase-*/plants.md` with `remap`, rewriting that line only. Let the outside-evidence check allow `reviews/phase-*/plants.md` when the change is that line alone, and nothing else in it. Name `plants.md` in the header comment and in the remap commit's body. In `.claude/skills/ocelle-run/SKILL.md`, add `plants.md`'s base line to the fold step's list of remapped files (one phrase).
- [ ] T027 [P] [US1] O3-01, O3-05: in `gates/README.md`, change the op-016 paragraph as plan.md *README paragraph* now says: element paths also select every `manifest` plant; token paths select every `contrast`, `brand-rules` and `style-lint` plant; a gate entry also selects the plants of the gates that import it (`gateEntryImports`, pinned by a test); the pin covers `visual`, `axe`, `manifest`, `contrast` and `brand-rules`; and the known limit no longer names `gates/bin/prefix.ts`. Rewrap the paragraph to the file's width (R2-01). Change no other line.
- [ ] T028 [P] [US1] O3-03: add a dated amendment (2026-11-15, op 016) to `specs/006-storybook-workbench/contracts/plants.md`, after the modes table and the registry lists, and to `specs/006-storybook-workbench/contracts/gates.md`, after the registry check's rules (`:164`), as plan.md *The 006 contracts* says. Change no existing line of either contract.

#### Checks and record

- [ ] T029 [US1] Run `pnpm test`, `gate:typecheck`, `gate:lint`, `gate:test-lint` and `gate:config-copies`, and `gate:mutation -- --base $(cat ops/016-plants-affected/reviews/phase-1/base.sha)`. Kill every surviving mutant in the new code with a stricter test, or record it as equivalent with a true reason. Run `pnpm run gate:plants -- --affected $(cat ops/016-plants-affected/reviews/phase-1/base.sha)` (it selects the full set, by shared gate source) and replace `reviews/phase-1/plants.md` with that run; the exit must be 0. Run T018's check again.
- [ ] T030 [US1] Write `ops/016-plants-affected/reviews/phase-1/round-3-fixes.md` (`| ID | Resolution | Red test | Where |`, one row for each of O3-01 to O3-05), and commit the fixes, the note and the new evidence together (`fix(op-016): phase 1 review round 3`, signed off). Do not edit `round-3.md` and do not write a verdict: review round 4 decides.

**Checkpoint**: `gate:plants -- --affected <base>` is usable by the next mission phase that merges `main`, and CI's
Plants check is unchanged.
