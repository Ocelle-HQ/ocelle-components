# Op Specification: A phase judges only the plants its diff can affect

**Op**: `ops/016-plants-affected` | **Issue**: #41 (option 1) | **Triage**: `triage/016-plants-affected.md`
**Created**: 2026-11-15 | **Status**: started | **Operator decisions**: Q1 A, Q2 B, Q3 C, Q4 A (`op.md`); operator
round 3 of phase 1, 2026-11-15 (`reviews/phase-1/round-3.md`, from the landing review `reviews/landing/round-1.md`)

## Intent

A phase of a mission or op runs `gate:plants`. Today that means the full set (too slow locally) or shards picked by
hand (not reviewable). This op adds `gate:plants -- --affected <base>`. It judges only the plants that the paths
changed since `<base>` can affect, by a fixed, tested rule. The phase records the run in `reviews/phase-<N>/plants.md`,
and the reviewer verifies it. CI's required **Plants** check is unchanged and judges the full set.

## User Scenarios & Testing

### User Story 1 - A phase judges the plants its diff can change, and the review can check it (Priority: P1)

An implementer finishes a phase. They run `pnpm run gate:plants -- --affected $(cat <FEATURE_DIR>/reviews/phase-<N>/base.sha)`,
which judges only the plants the phase's changes can affect, and they save the output as the phase's plant record.
The reviewer re-runs the selection without judging the plants, and compares it with the record.

**Why this priority**: it is the op's only story. Without it, a phase either takes too long or picks shards by
hand, and no review can check that choice.

**Independent Test**: unit tests on hand-written plant lists and diffs for the selection rule, and tests of the CLI
on recorded runs for the mode. One integration run with a real git repository covers the git boundary.

**Acceptance Scenarios**:

1. **Given** a diff that changes only `gates/plants/visual/pass-below-fold/plant.json`, **When** the selector runs,
   **Then** it selects `visual/pass-below-fold` and `visual/fail-below-fold` (whose `baselinesOf` names it), and no
   other plant.
2. **Given** a diff that changes `gates/bin/contrast.ts`, **When** the selector runs, **Then** it selects every
   `contrast` plant and no other.
3. **Given** a diff that changes `storybook/stories/icon.stories.ts` and `storybook/baselines/<story>.light.png`,
   **When** the selector runs, **Then** it selects exactly the repository-content plants, and no other `visual`,
   `axe` or `storybook-build` plant.
4. **Given** a diff that changes `gates/lib/registry.ts`, or `pnpm-lock.yaml`, or any path the rule does not map,
   together with any other paths, **When** the selector runs, **Then** it selects the full set and names the path
   that caused it.
5. **Given** a diff that changes only `specs/<feature>/tasks.md` and files under `specs/<feature>/reviews/`,
   **When** `gate:plants -- --affected <base>` runs, **Then** it judges no plant. It still runs the registry check
   and the structural checks, and it exits 0 with a line saying no plant was selected. The line does not say "every
   plant as expected".
6. **Given** a selection of three plants, **When** `gate:plants -- --affected <base>` runs, **Then** it runs the
   registry check and the structural checks of the whole set, and judges only those three plants through their
   gates. It prints a note for each selected plant, and a summary line naming the base, the plants judged and the
   plants not selected, saying that this is not the Plants check.
7. **Given** `--affected <base> --list`, **When** it runs, **Then** it prints the same selection notes and a summary
   line of the selection, and it judges no plant.
8. **Given** a base that does not resolve to a commit, or `--affected` without a value, or `--affected` with
   `--plan`, `--shard` or `--verdict`, or `--list` without `--affected`, **When** the plant job runs, **Then** it
   exits 2 naming the cause.
9. **Given** a `ci.yml` whose `plants`, `plants-shard` or `plants-plan` job has a step passing `--affected`, **When**
   the registry check runs, **Then** it reports an `affected-in-ci` finding for that job. The registry plant
   `fail-affected-in-plant-check` proves the rule.
10. **Given** a new `visual`, `axe`, `manifest`, `contrast` or `brand-rules` plant directory that the test's pinned
    list does not hold, **When** the unit tests run, **Then** the pin test fails until someone classifies the plant:
    they add it to the pin, and add it to `repositoryContentPlants` if its expectation names repository content.
11. **Given** a finished phase, **When** it is reviewed, **Then** `reviews/phase-<N>/plants.md` exists, its base is
    the phase's `base.sha`, and its selection equals the one `--affected <base> --list` gives now. A missing record,
    another base, a different selection, or a recorded run that did not exit 0 is a blocking finding.
12. **Given** a diff that changes `packages/elements/src/ocelle-brand-mark.ts` (or
    `packages/elements/custom-elements.json`), **When** the selector runs, **Then** it selects the
    `repositoryContentPlants` and every `manifest` plant, among them `manifest/pass-reordered`, and no other plant.
    (Operator round 3, O3-01.)
13. **Given** a diff that changes `packages/tokens/src/source.ts` (or `packages/tokens/contrast/pairs.json`),
    **When** the selector runs, **Then** it selects the `repositoryContentPlants` and every `contrast`, `brand-rules`
    and `style-lint` plant, and no other plant. `packages/tokens/package.json` still selects the full set. (O3-01.)
14. **Given** a diff that changes `gates/bin/prefix.ts`, which the `brand-rules` entry imports, **When** the selector
    runs, **Then** it selects every `prefix` plant and every `brand-rules` plant, and no other. (O3-05.)
15. **Given** a registered gate entry in `gates/bin/` that imports another registered gate entry, and the pair is not
    in `gateEntryImports`, **When** the unit tests run, **Then** the cross-import test fails until the pair is added
    there, so the selector covers it. (O3-05.)
16. **Given** a base that resolves, and a `git diff` that fails (for example with a junk `GIT_INDEX_FILE`), **When**
    `gate:plants -- --affected <base>` runs, **Then** it exits 2 with `plants: could not run: git failed (<first
    stderr line>)` and judges no plant. (O3-02: the behaviour is present, the test was missing.)
17. **Given** a history fold whose base lies before a phase's `base.sha`, so that the fold rewrites that commit,
    **When** `tooling/speckit/bin/fold-history.sh` remaps the evidence, **Then** the `- base:` line of that phase's
    `reviews/phase-<N>/plants.md` names the new commit, equal to the remapped `base.sha`, and no other line of
    `plants.md` changes. (O3-04.)

### Edge Cases

- A renamed file counts as a deleted path and an added path. A file not yet committed counts too: the diff is taken
  against the working tree, and untracked files that are not ignored are added.
- A deleted plant selects the plants whose `baselinesOf` names it. It does not select itself, because it no longer
  exists. The structural checks of the whole set still run.
- A path in `gates/plants/<dir>/` that is not inside a case directory of a registered gate (or of the registry's
  plants) is unmapped, so it selects the full set.
- `--skip-container` may be used with `--affected`. The partial-run note then applies as in the single run.
- This op's own phase changes `gates/lib/plant-runner.ts`, so its own `--affected` run selects the full set.

## Requirements

### Functional Requirements

- **OR-001 (selector)**: `gates/lib/plant-runner.ts` MUST export a pure function `affectedPlants`. It takes the
  repository's plants (`<gate>/<case>`, each with its `baselinesOf` if it has one), the registered gate ids and the
  changed paths, and returns either the full set together with the path that caused it, or the selected plants,
  each with the first changed path that selected it. Path classes are tried in this order:
  1. No-plant paths (`plan.md` *Path classes* lists them exactly) select nothing.
  2. `gates/plants/<gate>/<case>/**`, for a registered gate or the registry's `plants`, selects that plant if it
     exists, and every plant whose `baselinesOf` names it.
  3. `gates/bin/<id>.ts`, for a registered gate id, selects every plant of `<id>`, and every plant of each gate
     whose entry imports `<id>`'s entry, as `gateEntryImports` lists (today `prefix` imported by `brand-rules`).
  4. `.github/workflows/ci.yml` selects every registry plant (`plants/<case>`).
  5. Repository-content paths select the `repositoryContentPlants` that exist. In addition, an element path
     (`packages/elements/src/**`, `packages/elements/custom-elements.json`) selects every `manifest` plant, and a
     token path (a repository-content path under `packages/tokens/`) selects every `contrast`, `brand-rules` and
     `style-lint` plant (operator round 3, O3-01: "Widen by gate").
  6. Every other path, including `gates/bin/plants.ts`, selects the full set.
- **OR-002 (lists)**: `gates/lib/plant-runner.ts` MUST export `repositoryContentPlants`, a fixed list of the plants
  whose expectation names repository content. A unit test MUST check that each entry exists. A unit test MUST pin
  the full list of `visual`, `axe`, `manifest`, `contrast` and `brand-rules` case directories (the last three added
  by operator round 3, O3-01). It MUST also export `gateEntryImports`, the pairs (imported gate entry, importing
  gate) of registered gate entries in `gates/bin/` that import one another, each with a one-line reason. A unit test
  MUST read the imports of every registered gate entry and pin the full set of such pairs to `gateEntryImports`, so
  a new cross-import fails until it is listed and so selected (O3-05).
- **OR-003 (mode)**: `gates/bin/plants.ts` MUST accept `--affected <base>` as a mode of its own, with an optional
  `--list`. In this mode it:
  - resolves `<base>` as `gate:mutation --base` does;
  - reads the changed paths (`git diff --name-only --no-renames <base>`, plus the untracked files that are not
    ignored);
  - runs the registry check and the structural checks of the whole set;
  - judges only the selected plants, unless `--list` is given;
  - prints the selection and the summary of `plan.md` *Output*.

  It MUST exit 2 for the causes of scenario 8.
- **OR-004 (registry rule)**: `gates/lib/registry.ts` MUST export `affectedInCiFindings`, which gives one
  `affected-in-ci` finding for each of the three plant jobs with a step that passes `--affected`. The plant job's
  registry check (`judgeRun`) and the registry plants' check (`registryRun`) MUST both apply it. A new registry plant
  `gates/plants/plants/fail-affected-in-plant-check/` MUST expect exactly that finding.
- **OR-005 (red first)**: the tests of OR-001 to OR-004 MUST be committed red first, in a test-only commit, before
  the code. The new registry plant belongs with the green code: it is a plant, not a test file, and the plant job
  judges it. The tests of operator round 3 for O3-01, O3-04 and O3-05 (scenarios 10, 12 to 15 and 17) MUST be
  committed red first under the fix procedure's label `fix-3`. The test of O3-02 (scenario 16) covers behaviour
  that is already right, so it has no red commit: the fix procedure's step 3 applies, and the automatic check runs
  it against the code from before the phase.
- **OR-006 (records)**: these MUST say that `--affected` is local only, never CI, and never the Plants verdict, and
  how a phase records it:
  - `gates/README.md` (one added paragraph, and the new plant in the `plants` row);
  - `.specify/templates/tasks-template.md`;
  - the story commands implement, review and fix, in `tooling/speckit/extensions/story/commands/` and their
    installed copies;
  - both `story-config.yml` copies, with a new `plants_command` key;
  - the 006 contracts `specs/006-storybook-workbench/contracts/plants.md` (the modes table and the registry plant
    and rule lists) and `contracts/gates.md` (the registry check's rules), each with a dated amendment that names
    the `--affected` / `--list` mode, the `affected-in-ci` rule and the plant `fail-affected-in-plant-check`
    (operator round 3, O3-03).
- **OR-007 (unchanged)**: the op MUST NOT change any of these: `.github/workflows/ci.yml`,
  `gates/test/ci-workflow.test.ts`, `plantShards`, `shardSize`, `otherShardSize`, the configuration set of
  `gates/lib/plant-repo.ts`, or any existing plant directory.
- **OR-008 (fold)**: `tooling/speckit/bin/fold-history.sh` MUST remap the base SHA on the `- base:` line of each
  phase's `reviews/phase-<N>/plants.md`, as it remaps `base.sha`, and its outside-evidence check MUST allow that
  change and no other change to `plants.md` (operator round 3, O3-04). The command line and the verbatim output of
  `plants.md` keep the SHA they were written with; `reviews/history-map.txt` resolves it.
- **OR-009 (git failure)**: the integration test of scenario 16 MUST exist, and the two process-boundary records on
  the `failed` check and its `return { cause }` in `changed` (`gates/bin/plants.ts`) MUST name it (O3-02).

### Out of scope

- Selection in CI of any kind. The required check stays the full set.
- Sharing one Storybook build across plants, and any change to plant roots or to 006 R-16's "every repository
  story" design.
- An import graph of `gates/lib` (Q1 B) and `inputs` declared per plant (Q1 C).
- Changing finished phases of missions 008 to 014. They adopt the mode by merging `main`.

## Success Criteria

- **SC-001**: A phase whose diff holds only story, baseline and record changes selects exactly the repository-content
  list (10 plants). Element changes add every `manifest` plant (21 plants in all today); token changes add every
  `contrast`, `brand-rules` and `style-lint` plant (90 in all today); both give 101 of 302. Today the missions pick
  shards 16, 19 and 27 by hand (9 plants, 3 of them repository-content). The selection is computed by a rule a
  reviewer can re-run.
- **SC-002**: The full test suite, `gate:typecheck`, `gate:lint`, `gate:test-lint`, `gate:config-copies`,
  `gate:mutation -- --base <op base>` and the full `gate:plants` (this op changes shared gate source) pass.

## Assumptions

- **Known limit (accepted by Q3 C, narrowed by operator round 3).** A change to token values,
  `packages/styles/src/base.css` or the fonts changes the pixels of every visual plant's own stories too. A change
  to element source also reaches the `unit-tests` and `mutation` plants that copy it. The selector does not pick
  those plants, and CI's full Plants check finds any of them that change. The README paragraph names this limit.
  It no longer covers the `manifest`, `contrast`, `brand-rules` and `style-lint` plants that are deltas over the
  repository's element or token source: element and token paths select those gates whole (O3-01). Nor does it cover
  a gate entry that another gate entry imports: `gateEntryImports` selects the importer's plants, and a test pins
  the pairs (O3-05).
- The diff semantics follow `gate:mutation --base`: a commit, compared with the working tree.
