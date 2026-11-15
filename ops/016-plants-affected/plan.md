# Implementation Plan: A phase judges only the plants its diff can affect

**Op**: `ops/016-plants-affected` | **Date**: 2026-11-15 | **Spec**: `spec.md` | **Record**: `op.md`
**Input**: triage `triage/016-plants-affected.md`, operator decisions Q1 A, Q2 B, Q3 C, Q4 A (`op.md`)

## Summary

This op adds a pure selector, `affectedPlants`, and the list `repositoryContentPlants` to `gates/lib/plant-runner.ts`.
It adds an `affected` mode (`--affected <base> [--list]`) to `gates/bin/plants.ts`, and a registry rule,
`affected-in-ci`, with one registry fail plant. Docs and the story flow change so that a phase records the run in
`reviews/phase-<N>/plants.md` and the review checks it. CI, the shard partition and every existing plant stay as
they are.

## Technical Context

- **Language**: TypeScript (strict), run by Node from `gates/bin/*.ts`, as every gate is.
- **Tests**: Vitest, `gates` project (in process) and `gates-integration` (process boundary).
- **Gates that judge this op**:
  - `gate:mutation -- --base <op base>`: gate source changes, so the new lines are mutation-tested.
  - `gate:plants`: the full set, because this op changes shared gate source. Locally it runs as shards one at a
    time, then `--verdict`.
  - `gate:typecheck`, `gate:lint`, `gate:test-lint` and `gate:config-copies`.
- **Constraints**: seven missions edit `gates/README.md` and add plants in parallel. The op adds lines and changes as
  few existing lines as it can, and it lands quickly.

## Files to change

| File | Change |
|---|---|
| `gates/lib/plant-runner.ts` | Add `repositoryContentPlants`, `noPlantPath`, `repositoryContentPath` and `affectedPlants` (pure). `plantShards`, `shardSize` and `otherShardSize` stay unchanged. |
| `gates/lib/registry.ts` | Add `affectedInCiFindings(workflow, workflowPath)`, beside `skipContainerFindings`. |
| `gates/bin/plants.ts` | Add the `affected` mode to `Mode` and `modeOf`, a `changed` tool in `PlantTools`, the selection in `plants()`, and a `selected` set in `PlantSet` and `judgeAll`. Apply `affectedInCiFindings` in `judgeRun` and `registryRun`. Add the real `changed` in `realTools`. |
| `gates/plants/plants/fail-affected-in-plant-check/` | New registry plant: `gates.json` (a copy of `pass-split-plant-jobs/gates.json`), `ci.yml` (`pass-split-plant-jobs/ci.yml` with `--affected HEAD~1` added to the `plants` job's step), and `plant.json` (`expect: fail`, one finding `ci.yml` / `affected-in-ci`). |
| `gates/test/plant-runner.test.ts` | Red: the selector cases and the two list tests. |
| `gates/test/registry.test.ts` | Red: `affectedInCiFindings`. |
| `gates/test/plants.test.ts` | Red: the mode on recorded runs (a `changed` double). |
| `gates/test/integration/plants.test.ts` | Red: one case with a real git repository in the temporary root, plus the exit 2 for a base that does not resolve. |
| `gates/README.md` | One added paragraph after "The split plant job" list, and `fail-affected-in-plant-check` in the `plants` row. |
| `.specify/templates/tasks-template.md` | One rule in the format notes: each phase ends with the affected run, recorded in `reviews/phase-<N>/plants.md`. |
| `tooling/speckit/extensions/story/commands/speckit.story.{implement,review,fix}.md` | The step text of *Story flow* below. |
| `.specify/extensions/story/commands/*.md`, `.specify/extensions/story/.specify-dev/agent-commands/claude/speckit-story-*/SKILL.md`, `.claude/skills/speckit-story-*/SKILL.md` | Installed copies. Reinstall them with `specify extension remove story && specify extension add --dev tooling/speckit/extensions/story` (`tooling/speckit/README.md`). If `specify` is not available, edit them by hand so that each body equals its source. |
| `.specify/extensions/story/story-config.yml`, `tooling/speckit/extensions/story/story-config.yml` | `plants_command: "pnpm run gate:plants"` and its comment line. The two copies stay byte-identical (`gate:config-copies`). |
| `specs/001-repository-foundation/contracts/story-config.md` | A dated amendment (op 016) that adds `plants_command` to the final values. |
| `knowledge/speckit-flows/log.md` | An entry under 2026-11-15. |

Unchanged, and the review checks it: `.github/workflows/ci.yml`, `gates/test/ci-workflow.test.ts`, `plantShards`,
`shardSize`, `otherShardSize`, `gates/lib/plant-repo.ts`, every existing plant directory, and
`.claude/skills/ocelle-land/SKILL.md`.

## Approach

### Path classes (Q1 A, Q3 C)

`affectedPlants(input)` is pure. Its input:
- `plants`: every plant as `{ name: "<gate>/<case>", baselinesOf?: "<case>" }`;
- `gates`: the registered gate ids;
- `changed`: the repository paths, POSIX form, relative to the root.

Its output is one of:
- `{ full: { path, reason } }`, where `reason` is `"shared gate source"` or `"not mapped"`;
- `{ plants: ReadonlyMap<"<gate>/<case>", path> }`, in `plants` order, each with the first changed path that
  selected it.

The CLI asks for the full set as soon as one path maps to it. The rule tries each changed path against the classes
in this order. The first class that matches decides for that path.

1. **No-plant paths: select nothing (`noPlantPath`).** No plant's temporary repository holds these, and no gate
   that a plant runs reads them. The configuration set is `gates/lib/plant-repo.ts` `configurationSet`, and none of
   these is in it:
   - `specs/**`, except `specs/*/plan.md` (class 5);
   - `ops/**`, `triage/**`, `knowledge/**`, `.claude/**`, `.specify/**` and `tooling/**`;
   - `gates/test/**` and `gates/README.md`;
   - `packages/*/test/**`, `storybook/test/**` and `*.md` in the root, in `packages/*/` and in `storybook/`.

   Anything not listed here is not in this class.
2. **A plant directory.** For `gates/plants/<g>/<c>/**`, where `<g>` is a registered gate or `plants`: select
   `<g>/<c>` if it is in `plants`, and every plant `<g>/<x>` whose `baselinesOf` is `<c>`. Any other path under
   `gates/plants/` is unmapped: an unknown gate directory, or a file directly in `gates/plants/` or
   `gates/plants/<g>/`.
3. **A gate entry.** For `gates/bin/<id>.ts`, where `<id>` is a registered gate id: every plant `<id>/*`.
   `gates/bin/plants.ts` is the plant job itself, so it is shared gate source. `plants` is not a registered gate id,
   so this class never matches it. Other files in `gates/bin/` (`baselines.ts`, `setup-offline.ts`) are shared, too.
4. **The workflow.** `.github/workflows/ci.yml`: every plant `plants/*`. The registry check itself always runs (Q2 B).
5. **Repository content: `repositoryContentPlants` (`repositoryContentPath`).** These paths:
   - `storybook/stories/**`, `storybook/.storybook/**`, `storybook/scripts/**` and `storybook/baselines/**`;
   - `storybook/a11y-exceptions.json` and `specs/*/plan.md` (the axe roots carry the repository's exceptions and
     the plans they name);
   - `packages/*/src/**`, `packages/tokens/**` and `packages/elements/custom-elements.json`;
   - but not `packages/*/package.json` and not `packages/*/tsconfig*.json`: these are configuration, class 6.
6. **Everything else selects the full set.**
   - `"shared gate source"`: `gates/lib/**`, `gates/gates.json`, every file in `gates/bin/` that class 3 does not
     match, `gates/eslint/**` and `gates/stylelint/**`.
   - `"not mapped"`: every other path. This includes the root configuration files, `pnpm-lock.yaml`, the package
     manifests, `storybook/package.json`, `storybook/visual/container.json`, `.node-version`, other files in
     `.github/`, `packages/elements/scripts/**`, and any path not named here.

`repositoryContentPlants` is the class "expectation names repository content" (Q3 C, read as `op.md` says). It
holds:
- `visual/pass-repository`, `visual/fail-token-changed`, `visual/fail-one-pixel`, `visual/fail-missing-baseline`
  and `visual/fail-same-pixels-other-bytes`. The last three have no `tree/`, and their findings name the
  repository's `tokens--colour` story.
- `axe/pass-repository`;
- `storybook-build/pass-repository`;
- `manifest/pass-repository`, `contrast/repository-values` and `brand-rules/repository-values`. These judge the
  configuration set's element source and token source.

Each entry carries a one-line reason in a comment. The list keeps the order above. The selector selects only the
entries that are in `plants`.

**The pin (Q3 C).** In `gates/test/plant-runner.test.ts`, `visual` and `axe` each have a literal list of every case
directory of `gates/plants/<gate>/`, written out in the test, 48 and 25 names today. A test compares the directory
listing with it. A new or removed plant fails that test. The author then adds the name to the pin, and to
`repositoryContentPlants` if its expectation names repository content, and the review sees both. A second test
checks that every `repositoryContentPlants` entry is an existing directory with a `plant.json`.

### The mode (Q2 B)

`modeOf` gains `{ kind: "affected", base, list }`, decided in this order:
- `--affected` together with `--plan`, `--shard` or `--verdict`: error `--affected is a mode of its own; it cannot
  be combined with --plan, --shard or --verdict`.
- `--affected` with no value, or with a value that starts with `--`: error `--affected needs a base commit`.
- `--list` without `--affected`: error `--list needs --affected <base>`.

Each error exits 2 through the existing `fail` path, before any plant is read.

`PlantTools` gains `changed?: (base: string) => Promise<{ readonly paths: readonly string[] } | { readonly cause: string }>`.
Its real version in `realTools`:
1. `git rev-parse --verify --quiet <base>^{commit}` in the root. If it fails, the cause is `--affected <base> does
   not resolve to a commit; pass the phase's base.sha`.
2. `git diff --name-only --no-renames --no-ext-diff -z <base>`, plus `git ls-files --others --exclude-standard -z`.
   NUL-separated output, so no path quoting. Deduplicated and sorted.
3. If git fails, the cause names its first stderr line.

The real tool carries the process-boundary `Stryker disable` comments that `realTools` uses, naming the
integration test.

In `plants()`, after the registry parses and before `judgeRun`:
1. Read the changes. A `cause` exits 2: `plants: could not run: <cause>`.
2. List the plants (`listPlants`), and read each plant's `baselinesOf` from its `plant.json`. A `plant.json` that
   is missing or does not parse gives no `baselinesOf`: the structural check reports it anyway.
3. Call `affectedPlants`. On stderr, write either `note: affected: every plant, by <path> (<reason>)` or, for each
   selected plant, `note: affected: <gate>/<case>, by <path>`.

`judgeRun` gets the selection as a new option, `selected`: undefined for the full set, else the set of
`gates/plants/<gate>/<case>` paths. The run is then "whole" for the registry and structural checks:
- the registry findings, now with `affectedInCiFindings`;
- `unknown-gate`;
- every plant's `plant.json`, read by `loadPlant`;
- `missing-plant` for each kind.

Only selected plants are judged. `judgeAll` lists every case, loads every plant (problem lines and kinds seen), and
calls `decide` and `judge`, times and counts only the plants in `selected`. With `--list`, `selected` is the empty
set, so no plant runs. The `only` path of `--shard` is unchanged.

### Output

On stdout: the problem lines (as today), then one summary line. Here `t` is the number of plants of the repository,
`m` the number selected, and `<base>` the value given:

| Case | Summary line | Exit |
|---|---|---|
| run, no problem | `plants: affected since <base>: <m> of <t> plants judged, every plant as expected; not the Plants check` (plus the partial-run suffix with `--skip-container`) | 0 |
| run, problems | `plants: <p> problems in <m> plants (affected since <base>; not the Plants check)` | 1 |
| nothing selected, no problem | `plants: affected since <base>: no plant selected, 0 of <t> plants judged; not the Plants check` | 0 |
| `--list`, no problem | `plants: affected since <base>: <m> of <t> plants selected, none judged (--list)` | 0 |
| `--list` or nothing selected, with registry or structural problems | the problem lines, then `plants: <p> problems in 0 plants (affected since <base>; not the Plants check)` | 1 |

`<m>` counts the selected plants that exist. The counts use `plural` from `gates/lib/findings.ts` ("1 plant",
"2 plants"). No line of this mode says `of <n> gates and the registry judged`, so the full run's line cannot be
confused with it. The no-engine and skipped rules of the single run apply to the selected visual plants unchanged.

### Registry rule (OR-004)

`affectedInCiFindings(workflow, workflowPath)` uses `jobLines`, as `skipContainerFindings` does. For each of
`plants-plan`, `plants-shard` and `plants` (in that order), any line holding `--affected` gives one finding:
- location: the workflow path;
- gate: `plants`;
- rule: `affected-in-ci`;
- message: `the <job> job passes --affected, so CI would judge only the plants a diff selects`.

It is applied in `judgeRun`'s registry findings and in `registryRun`, after `shardInPlantCheckFindings`.

### Story flow (Q4 A)

- **`story-config.yml`:** `plants_command: "pnpm run gate:plants"`, with the comment
  `# plants_command  Plant run of a phase, given -- --affected <phase base>; empty: the phase records no plant run.`
- **implement, a new step before the final commit:** if `plants_command` is set, run
  `<plants_command> -- --affected $(cat FEATURE_DIR/reviews/phase-<N>/base.sha)` and write
  `FEATURE_DIR/reviews/phase-<N>/plants.md` in this form:

  ```markdown
  # Plants of phase <N>

  - base: <sha>
  - command: <the command as run>
  - exit: <code>

  (standard output and standard error, verbatim, in one fenced text block)
  ```

  Commit it with the phase. The phase is not done unless the exit is 0. "No plant selected" is recorded as it is
  printed, never as "plants passed". This run is a local aid, and CI's Plants check still judges every plant.
- **fix, after the fixes:** run the same command again and replace `plants.md` with the new run, in the fix commit.
- **review, in "Checks":** if `plants_command` is set, read `plants.md` and check that its base equals `base.sha`.
  Then run `<plants_command> -- --affected <base.sha> --list`, which judges no plant, and compare its `note:
  affected:` lines with the record. Each of these is a blocking finding: a missing `plants.md`, another base, a
  different selection, or a recorded exit other than 0. The reviewer does not judge the plants again.
- **tasks template:** one bullet in "Format", saying that every phase ends with the affected run of
  `plants_command`, kept in `reviews/phase-<N>/plants.md`, and that a phase never lists plant shards by number.

### README paragraph

Add one paragraph after the list of the three modes in "The split plant job". It says:
- what `--affected <base>` and `--list` do;
- the path classes in one sentence each, the fallback, and `repositoryContentPlants` with its pin;
- the known limit: token values, `base.css`, fonts and element source also reach the visual plants' own stories and
  the plants of `unit-tests` and `mutation`, and only CI's full set judges those;
- that it is local only, and that `affected-in-ci` forbids it in the three plant jobs.

In the `plants` row, add `--affected` in a CI plant job (`fail-affected-in-plant-check`) to the list of registry
plants. No other existing line changes.

## Test approach (red first)

The red commit holds only test files. It adds:

- **`gates/test/plant-runner.test.ts`:**
  - `affectedPlants`: one test per acceptance scenario 1 to 5 of `spec.md`, on a small hand-written plant list and
    gate list. Each test asserts the whole result with `toEqual`: the map with its paths, or the full set with path
    and reason. Also these cases:
    - each no-plant pattern and a near miss of each, for example `specs/x/plan.md` against `specs/x/tasks.md`,
      `packages/elements/test/a.test.ts` against `packages/elements/src/a.ts`, and `gates/README.md` against
      `gates/gates.json`;
    - a deleted plant that another plant's `baselinesOf` names;
    - `gates/bin/plants.ts`;
    - a path under an unknown `gates/plants/<dir>/`;
    - `packages/tokens/package.json`;
    - an empty list;
    - a full-set path given after selected paths, which still gives the full set.
  - The `visual` and `axe` pin, and the existence of every `repositoryContentPlants` entry.
- **`gates/test/registry.test.ts`:** `affectedInCiFindings` gives one finding per job in job order for `--affected`
  in each of the three jobs, none for a workflow without it, and none for `--affected` in a job that is not a plant
  job.
- **`gates/test/plants.test.ts`,** with the existing recorded-run doubles and a `changed` double:
  - scenario 6: only the selected plants run, and the summary;
  - scenario 5: no plant runs, the summary line, exit 0;
  - scenario 7: `--list` runs no plant;
  - the registry and structural checks still run: an `unknown-gate` directory and a gate with no pass plant are
    both reported while nothing is selected;
  - `affected-in-ci` in the repository's own `ci.yml` is reported in this mode and in the single run;
  - each exit-2 cause of scenario 8, with `changed` never called for an argument error;
  - a full-set selection runs every plant and prints `note: affected: every plant, by …`.
- **`gates/test/integration/plants.test.ts`:** in the temporary root the existing cases build:
  - `git init`, commit, change one plant's `plant.json`, then run `--affected HEAD`: that plant is judged and the
    summary names `HEAD`;
  - `--affected no-such-ref` exits 2 naming the cause.

**Why each fails red, for the missing behaviour:**
- `affectedPlants`, `repositoryContentPlants` and `affectedInCiFindings` are not exported, so each case fails on an
  undefined call. That is the missing behaviour, not a syntax error: the test files import the module namespace
  and call members, so the import itself succeeds.
- The plants tests see the full single run start and its summary line, not the affected one.
- The pin test fails because the list it checks does not exist yet.

`red.sh` must show each failing for that reason. If a namespace import does not fit the test-lint rules, a scaffold
commit (`scaffold.sh`) adds the three exports with neutral bodies first.

**Green:**
- The code and the registry plant.
- Then the docs and the flow text.
- Then the checks:
  - `pnpm test`, `gate:typecheck`, `gate:lint`, `gate:test-lint` and `gate:config-copies`;
  - `gate:mutation -- --base <op base>`: every surviving mutant in the new code is killed by a stricter test, or
    recorded as equivalent with its reason;
  - `gate:plants` on the full set, run as `--shard k` for each shard of `--plan`, one at a time (the diary's "one
    heavy job at a time"), then `--verdict storybook/.visual/plant-shards`.
- This op's own `reviews/phase-1/plants.md` records two things: the `--affected <base> --list` output (the full
  set, by `gates/lib/plant-runner.ts`) and the verdict run's summary.

## Constitution Check

| Principle | Status |
|---|---|
| I Framework-free, `ocelle-` names | Not touched. |
| II Tokens only | Not touched. |
| III Accessible by construction | Not touched. The axe plants still run in full in CI. |
| IV Strict CSP, offline | Not touched. |
| V Storybook, tests prove behaviour | Not touched. No story or baseline changes. |
| VI Consumer needs, own code | Pass: #41 is the need (the missions' phase cost). No copied code. |
| VII Semantic versioning | Pass: no public surface. Gate CLI flags are not the public surface. Semver `none`. |
| VIII Test-first, non-vacuous | Pass. The selector, mode and rule are red first, and the rule has a fail plant ("Gates are proven, too"). The changed gate source is mutation-tested. A wrong selection only skips a plant locally, and the required check judges it. |
| Development workflow, merge gates | Pass: **Plants** stays required and judges every plant. `affected-in-ci` stops a CI plant job from passing `--affected`. |

No violation, so there is no Complexity Tracking entry.

## Stop conditions

- If keeping Q2 B's "always runs the registry and structural checks" needs a change to `--shard` or `--verdict`
  behaviour, stop and report to the operator.
- If the selector would need an import graph or a per-plant `inputs` key, stop: per the triage record's "What
  would change this decision", this becomes a mission.
- If a test shows that a no-plant path is in fact read by a plant (for example, a gate reading `specs/**` beyond
  `plan.md`), move that pattern out of the no-plant class (stricter) and record the reason. Do not drop the test.
