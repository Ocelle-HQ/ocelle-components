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

**Checkpoint**: `gate:plants -- --affected <base>` is usable by the next mission phase that merges `main`, and CI's
Plants check is unchanged.
