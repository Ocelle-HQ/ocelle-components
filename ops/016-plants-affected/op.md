---
op: 016
triage: triage/016-plants-affected.md
issues: [41]
mode_of_work: task_execution
accountable: "human:jeroennouwsdev"
semver: none
status: started
---

# Op 016: A phase judges only the plants its diff can affect

## Intent

Today every phase of a mission ends with "run `gate:plants`". On mission 008 a full local run takes far too long
(a full `pnpm test` alone takes more than 30 minutes), so the missions pick plant shards by hand, by shard number
("at least shards 16, 19 and 27"). Shard numbers move whenever a plant is added, and no review can check that choice.

Issue #41, option 1, replaces the hand choice with a rule the tool applies:

- `pnpm run gate:plants -- --affected <base>` reads the paths changed since `<base>`, selects the plants those paths
  can affect by a fixed, tested rule, and judges only those. It always runs the registry check and the structural
  checks of the whole set.
- `--affected <base> --list` prints the same selection and judges no plant, so a reviewer can re-run the selection
  cheaply.
- A phase records its run in `reviews/phase-<N>/plants.md`, and the reviewer checks it.
- A new registry rule, `affected-in-ci`, forbids `--affected` in the three CI plant jobs, so the required **Plants**
  check can never be narrowed to a selection. One new registry fail plant proves the rule.

CI does not change: the required **Plants** check still judges the full set, and `plantShards`, `shardSize`,
`otherShardSize` and `.github/workflows/ci.yml` stay as they are. A wrong local selection costs a phase time,
because CI finds the missed plant at the pull request. It cannot let a defect through. Sharing one Storybook build
across plants is out of scope (operator brief).

No element, attribute, event, slot, part, token or package changes (semver `none`).

**Issue text.** The triage session could not read #41. The coordinator relayed its body on 2026-11-15: it has no
comments and no linked pull requests. It names the record file `reviews/phase-N/plants.md`, and asks that a gate
change selects that gate's plants and a story change selects the visual and axe plants, proven test-first.

### Operator decisions at approval (2026-11-15, operator jeroennouwsdev)

- **Q1: A, path classes with a full-set fallback.** A changed plant selects that plant. A changed gate entry selects
  that gate's plants. Shared gate source selects the full set. `ci.yml` selects the registry plants. Repository
  content maps by Q3. Any path the rule does not map selects the full set.
- **Q2: B.** `--affected <base>` is a mode of its own. It cannot be combined with `--plan`, `--shard` or
  `--verdict`, and it always runs the registry check and the structural checks.
- **Q3: C.** A story, element, token, baseline or Storybook configuration change selects only the plants whose
  expectation names repository content (the `pass-repository` plants and `fail-token-changed`), kept as a fixed,
  tested list. A test also pins the full `visual` and `axe` plant lists, so a new plant that nobody classified fails
  that test.
- **Q4: A.** The phase saves the `--affected` output in `reviews/phase-<N>/plants.md`, the file name #41 asks for.
  The reviewer checks the recorded base against `base.sha` and re-runs only the selection, not the plants.

### How the plan reads the decisions

These readings follow from the decisions. They are not new choices, and `plan.md` gives the reasons:

- **Paths no plant reads select nothing.** Without this class, every phase would select the full set, because every
  phase changes its own `tasks.md` and `reviews/`. This follows Q1's own logic: a plant only sees its own files,
  the configuration set (`gates/lib/plant-repo.ts`) and the gate source. The class is a fixed list of path patterns,
  and it is tested.
- **Q3's list is the class "expectation names repository content".** It holds every plant whose expectation names
  repository content, not only the four the triage named. In `visual`, `fail-one-pixel`, `fail-missing-baseline` and
  `fail-same-pixels-other-bytes` name the repository's `tokens--colour` story. In other gates,
  `manifest/pass-repository`, `contrast/repository-values` and `brand-rules/repository-values` judge the repository's
  element source and token source.
- **A plant named in another plant's `baselinesOf` also selects that plant.** For example, `visual/pass-below-fold`
  selects `visual/fail-below-fold`. Its baselines are an input of the other plant.

## Acceptance

Checks 1 to 4 are tests. Each one fails before the change.

1. **The selection rule (red, `gates/test/plant-runner.test.ts`).** `affectedPlants` is tested on hand-written plant
   lists and path lists. It gives:
   - no plant for an empty list, and none for paths only in the no-plant class;
   - the plant itself, and the plants whose `baselinesOf` names it, for a path in `gates/plants/<gate>/<case>/`;
   - every plant of `<gate>` for `gates/bin/<gate>.ts`;
   - every registry plant for `.github/workflows/ci.yml`;
   - exactly the repository-content list for each repository-content path class;
   - the full set, naming the path that caused it, for shared gate source, configuration and any unmapped path,
     whatever else changed.

   On main the function does not exist, so the tests fail.
2. **The plant lists (red, `gates/test/plant-runner.test.ts`).** One test compares the `visual` and `axe` case
   directories under `gates/plants/` with a literal list in the test. Another checks that every entry of
   `repositoryContentPlants` is an existing plant directory. On main `repositoryContentPlants` does not exist.
3. **The CLI mode (red, `gates/test/plants.test.ts` on recorded runs; one case in
   `gates/test/integration/plants.test.ts`).**
   - `--affected <base>` judges only the selected plants. It runs the registry check and the structural checks of
     the whole set, and prints the selection and a summary that names the base and the counts.
   - `--affected <base> --list` judges no plant.
   - An empty selection exits 0 with a line saying no plant was selected. That line never says "every plant as
     expected".
   - Exit 2 for each of these: a base that does not resolve, `--affected` without a base, `--affected` combined
     with `--plan`, `--shard` or `--verdict`, and `--list` without `--affected`.

   On main `--affected` is ignored and the full single run starts, so the tests fail.
4. **The registry rule (red, `gates/test/registry.test.ts`).** `affectedInCiFindings` reports one `affected-in-ci`
   finding for each of `plants-plan`, `plants-shard` and `plants` that has a step passing `--affected`, and none
   for a workflow without it. The plant job runs the rule in its registry check. The new registry plant
   `gates/plants/plants/fail-affected-in-plant-check/` (a `plants` job that runs `--affected`) is caught with exactly
   that finding. On main the function does not exist.
5. **Docs and flow (records, no test).**
   - `gates/README.md`: one added paragraph under "The split plant job", and the new plant in the `plants` row.
   - `.specify/templates/tasks-template.md`: the phase checkpoint line.
   - The story commands: implement, review and fix, in the source and in the installed copies.
   - `plants_command` in both `story-config.yml` copies.
   - An entry in `knowledge/speckit-flows/log.md`.
6. **Unchanged (checked in review).** The op's diff does not touch these: `.github/workflows/ci.yml`,
   `gates/test/ci-workflow.test.ts`, `plantShards`, `shardSize`, `otherShardSize`, and every existing plant
   directory.

## Constitution principles touched

- **VIII Test-first, proven non-vacuous.** The selector, the CLI mode and the registry rule are written red first.
  "Gates are proven, too": the new rule has a fail plant, and `--affected` can never stand in for the required
  check. Mutation testing covers the changed gate source.
- **Development workflow, merge gates.** The required **Plants** check is unchanged and still judges every plant.
  `--affected` is a local aid only. Its pass is not the Plants verdict, and its summary line, the README and the
  skill text say so.
- **I to VII.** Not touched: no element, token, story, baseline or package surface changes.
