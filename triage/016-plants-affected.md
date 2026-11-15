---
triage: 016
issues: [41]
decision: op
target: "ops/016-plants-affected"
in_scope: [41]
out_of_scope: [1, 10, 16, 15, 35, 23]
semver: none
spec_prompt: "Op for #41 option 1 (triage/016-plants-affected.md): add `gate:plants --affected <base>`, a local selector that judges only the plants a diff from <base> can change (pure rule in gates/lib/plant-runner.ts, unit-tested red first on hand-written diffs, unknown or unmapped paths falling back to the full set), a registry rule and fail plant that forbid `--affected` in the three CI plant jobs, gates/README.md § plants, and the tasks-template and story-skill text so a phase runs `--affected <phase base>` and records its plant list; CI's required Plants check, `plantShards`, the shard sizes and ci.yml are unchanged; sharing one Storybook build across plants is out of scope; selection rule, input map and review check as the operator picks at approval (Q1 to Q4)."
status: approved
decided_by: "human:jeroennouwsdev"
decided_at: 2026-11-15T17:42:47Z
---

# Triage 016: run only the affected plants in a phase (#41)

## Issues read

- **#41.** This session could not read GitHub. The proxy refuses GraphQL (`gh issue view`), and `gh api` was
  denied. So the body, comments, labels, milestone, parent and linked PRs of #41 are not read here. What this record
  knows of #41 comes from the operator's brief:
  - #41 offers options. The operator chose **option 1**: a `gate:plants --affected <base>` selector, plus changes to
    the task template and the story skills, so that a phase runs only the plants its changes can affect.
  - CI's required **Plants** check stays the full set and is not changed.
  - Sharing one Storybook build across plants is **out of scope**.
  - Seven missions run in parallel and edit `gates/README.md` and plants, so the change must be small and land
    quickly.
- **The cost seen, mission 008** (`origin/claude/016-overlays:specs/008-overlays/tasks.md`):
  - `:49-52`: a full `pnpm test` takes more than 30 minutes.
  - T029 (`:256`), T037 (`:337`) and T052 (`:437`): each phase ends with "run `gate:plants`", and that is only
    workable as "at least shards 16, 19 and 27, as in Phases 2 and 3; the rest is CI's" (`:437`).
  - On main's plan (228 other plants in 3 shards, 48 `visual` plants in shards 4 to 19, 25 `axe` plants in shards 20
    to 28, computed from `gates/plants/` and `plantShards`), those shards are:
    - 16: `visual/fail-token-changed`, whose `differs` lines name repository story-themes, plus `fail-websocket`
      and `fail-xhr`;
    - 19: `visual/pass-repository`, `pass-second-render` and `pass-unused-face`;
    - 27: `axe/pass-excepted-shadow`, `pass-minor-only` and `pass-repository`.
  - The missions already pick plants by hand, by shard number. Shard numbers move whenever a plant is added, and no
    review can check that hand choice. #41 replaces it with a rule the tool applies.

## Related work found

| Ref | Kind | Relation | Reason |
|---|---|---|---|
| #41 | issue | in scope | This op. |
| `gates/lib/plant-runner.ts:269-293` (`shardSize` 3, `otherShardSize` 80, `plantShards`) | gate source (main) | **extended, not changed** | The selector is a new pure function next to `plantShards`. It filters the plant list before the single run. `plantShards`, both sizes and the partition stay as 006 plan decision 30 set them, because `--verdict` recomputes the partition and must keep judging the full set. |
| `gates/bin/plants.ts:238-249` (`modeOf`: plan, shard, verdict, error), `:353-369` | gate CLI (main) | **changed by this op, red first** (`gates/test/plants.test.ts`) | It gains an `affected` mode, beside the existing modes, that runs no registry or structural check, as `--shard` does. Q2 decides whether `--affected` combines with `--shard`; recommended: it does not. |
| `gates/lib/registry.ts`, `gates/plants/plants/fail-shard-in-plant-check/` | registry rule and plant (main) | **changed by this op, red first** | Constitution "Gates are proven, too" (`constitution.md:138-139`): the required check must not be narrowed silently. `--affected` in a step of `plants`, `plants-shard` or `plants-plan` becomes a registry finding (for example `affected-in-ci`), proven by one new fail plant in `gates/plants/plants/`. This follows 006's `shard-in-plant-check`. |
| `gates/lib/plant-repo.ts:35-131` (the configuration set: root files, token files, package dirs, `storybook/baselines`) | gate source (main) | **input to the rule** | Every plant runs on a temporary repository built from the plant and this set. So a change to any file in the set can change any plant whose gate reads that file. This is why the fallback must be the full set. |
| `gates/lib/mutation/ranges.ts:91` (`changedFiles`), `gates/bin/mutation.ts` `--base` | gate source (main) | reuse candidate | The mutation gate already reads `git diff <base>` for its `--base` input. The selector can take the same base semantics (merge-base form) and reuse the parser. The plan decides. |
| `gates/README.md:30-79` (the `plants` row, § The split plant job) | gate docs (main) | **changed by this op** | A paragraph for `--affected` and the new registry rule in the `plants` row. The seven missions edit this file too, so the op adds one paragraph and changes no existing line where it can. |
| `.specify/templates/tasks-template.md` | template | **changed by this op** | Phase checkpoints gain "`gate:plants -- --affected <phase base>`, output kept in `reviews/phase-<N>/`". Today the template does not mention plants at all. |
| `.claude/skills/speckit-story-implement`, `speckit-story-review` (`SKILL.md:46-60`), `speckit-story-fix`; `.specify/extensions/story/story-config.yml` | story skills and config | **changed by this op** | The review's "Checks" step names the affected-plants run and how to verify it (Q4). It could take a `plants_command` key, as `mutation_command` does (Q4). |
| `.claude/skills/ocelle-land/SKILL.md:117-120, 150-153` | landing skill | checked; one line at most | It already says "run `gate:plants` when a gate or plant changed" as a targeted local check. It may name `--affected <merge-base>`. CI still runs the full set. |
| `specs/006-storybook-workbench` (#10, merged `3828d2f`): plan decisions 23, 24, 29, 30; `contracts/plants.md` § Shards; research R-16 "Plant roots hold every repository story" | mission, merged | out of scope (its decisions stand); input | It split CI into shards and approved the sizes. R-16 explains why every `storybook-build`, `visual` and `axe` plant builds all repository stories: plants keep the whole configuration set, so no plant misses a repository input. This op does not touch that design. It only lets a phase skip plants locally. Sharing one Storybook build across plants is the out-of-scope alternative (operator brief). |
| `specs/008-overlays` (#16, branch `origin/claude/016-overlays`), T029, T037, T052 | mission in progress | out of scope; **consumer** | It is the evidence (above). It is not a **fold** target: seven missions need the selector, and 008 should not carry a gate change for all of them. After this op lands and 008 merges main, its remaining phase steps can say `--affected`. Its finished phases stay as recorded. |
| Missions 009 to 014 (#15 for 009; issue numbers of 010 to 014 not identified here) | missions in progress | out of scope; consumers | Same mechanism. They take the change by merging main and do not edit the selector on their branches. |
| #35, `ops/015-mutation-shard-timeout` (merged `ce1d9c7`) | op, merged | out of scope; precedent | A tooling op that the in-flight element missions needed. Like this one, it was decided as an op, with bounded operator choices at approval. |
| #23, `specs/007-mutation-gate-strictness` (merged `e7d7d54`) | mission, merged | out of scope | The mutation gate's `--plan` and `--files`. Its base and diff semantics are a model. Nothing there changes. |
| #1 | epic (open) | out of scope | Parent epic. Whether #41 is its sub-issue was not read. |
| `knowledge/speckit-flows/findings/frontend-missions.md:51, :80` | findings | applies | "One heavy job at a time" and "run plant shards one at a time". The selector reduces how many heavy runs a phase needs. It changes neither rule. |

I could not search GitHub, so other open issues or PRs that touch plant selection may exist. The operator should
check that before approval.

## Decision

**op.** It is one bounded tooling change:
- a pure selection function with unit tests;
- one CLI mode;
- one registry rule with its fail plant;
- one README paragraph;
- text in the task template and the story skills.

It adds no element, attribute, event, slot, part or token, and no package changes (semver `none`). It changes no
gate verdict: CI's required Plants check still judges the full set, so the result of a PR is decided exactly as
today. A wrong selection costs a phase time, because CI finds the missed plant at the PR. It does not let a defect
through. It fits one phase.

Why not the others:
- **Not a mission.** There is a design question: which plants a diff affects. But it is bounded, and the operator has
  already fixed its frame (option 1, CI unchanged, no shared build). What remains are choices among concrete options
  (Q1 to Q4), as in triage 015. It is one story ("a phase judges only the plants its diff can change") and has no
  accessibility or security behaviour. If the operator picks a rule that changes the plant contract (Q1 C), that
  choice is still small. If it grows into import-graph analysis of gate source, see "What would change this decision".
- **Not a fold.** No feature in progress covers the plant runner. 006 is merged, and putting this into 008 would tie
  six other missions to 008's landing.
- **Not none.** On main, `modeOf` (`gates/bin/plants.ts:242-249`) has no selection by diff. Per the operator's brief,
  the choice among #41's options is already made.
- **Not decision-needed.** The operator chose option 1. The remaining questions have recommended answers and can be
  decided at approval.

## Scope

In scope (#41, option 1):
1. **Selector, red first.** A pure function in `gates/lib/plant-runner.ts`, tested on hand-written path lists in
   `gates/test/plant-runner.test.ts` before it exists. It takes the plants and the changed paths and returns the
   affected plants, by the Q1 rule and the Q3 map. Fallback: any changed path the rule does not map selects the
   **full set**. An empty diff selects no plants and prints that.
2. **CLI mode, red first** (`gates/test/plants.test.ts`, recorded runs). `gate:plants -- --affected <base>`:
   - reads `git diff --name-only <base>` (with the base form the plan picks, aligned with `gate:mutation --base`);
   - judges only the selected plants, as the single run would;
   - prints each selected plant and a summary that names the base and counts the plants judged and skipped, so it
     cannot be mistaken for the full run's line;
   - exits 2 for a base that does not resolve.

   One integration case in `gates/test/integration/plants.test.ts` covers the git process boundary.
3. **Registry rule and plant.** `--affected` in any step of the three CI plant jobs is a registry finding, red first
   in `gates/test/registry.test.ts`. It is proven by a new `gates/plants/plants/fail-affected-in-plant-check/`
   (constitution "Gates are proven, too"). The README's `plants` row lists the plant.
4. **Docs and flow.**
   - `gates/README.md` § the split plant job: one added paragraph (local only, never CI, the rule, the fallback).
   - `.specify/templates/tasks-template.md`: the phase checkpoint line.
   - The story skills: implement and fix run it, and review verifies it (Q4).
   - Optionally a `plants_command` key in `story-config.yml` (Q4).
   - A `knowledge/speckit-flows/log.md` entry.
5. **Unchanged, asserted.** `.github/workflows/ci.yml`, `gates/test/ci-workflow.test.ts`, `plantShards`, `shardSize`,
   `otherShardSize` and every existing plant. The op's review checks that the diff leaves them untouched.

Out of scope:
- Sharing one Storybook build across plants, and any change to plant roots, the configuration set, or R-16's
  "every repository story" design (operator brief).
- CI selection of any kind. The required check stays the full set.
- Changing finished phases of missions 008 to 014.

## Risks and open questions

**Q1, the selection rule** (choose one):
- **A (recommended), path classes with a full-set fallback.**
  - A changed plant directory `gates/plants/<gate>/<case>/` selects that plant.
  - A changed gate entry `gates/bin/<gate>.ts` selects all of that gate's plants.
  - A changed shared gate file (`gates/lib/**`, `gates/gates.json`, `plant-runner.ts`, `plant-repo.ts`,
    `plant-judge.ts`) selects the full set.
  - `.github/workflows/ci.yml` selects the registry plants.
  - A changed repository input maps by Q3.
  - Anything else selects the full set.

  Simple and conservative, and testable on hand-written paths.
- **B, A plus the import graph of `gates/lib`.** A `gates/lib/<x>.ts` change selects only the gates whose entry
  imports it. Smaller selections, but the op must compute the graph and test it, which roughly doubles its size.
- **C, inputs declared per plant.** Each `plant.json` gains `inputs` globs. This is precise, but it changes the
  plant contract ("`plant.json` holds only what the plant expects", README `:89-90`). Every plant then needs an entry,
  and the seven missions' new plants would conflict with it. Not recommended for a quick landing.

**Q2, the CLI shape** (choose one):
- **A (recommended).** `--affected <base>` is its own mode. It cannot be combined with `--plan`, `--shard` or
  `--verdict` (exit 2), and it runs no registry or structural check. A phase that changes gate or plant structure
  gets the full set by Q1 anyway.
- **B.** As A, but also runs the registry and structural checks. These are cheap, but the run is then neither a shard
  nor the full run.
- **C.** `--affected <base>` combines with `--shard <k>`, judging the affected plants of one shard. This keeps
  "one heavy job at a time" on long selections. More cases to test.

**Q3, which repository inputs select `visual`, `axe` and `storybook-build` plants** (choose one):
- **A (recommended), the repository-content plants only.** A change under `storybook/**`, `packages/*/src/**`,
  `packages/tokens/**` or `storybook/baselines/**` selects the plants whose expectation names repository content:
  - `visual/pass-repository`, `visual/fail-token-changed` (its `differs` lines) and `axe/pass-repository`;
  - `storybook-build/pass-repository`;
  - the plants named in a fixed list in `plant-runner.ts` beside the rule, with a test that each listed plant
    exists.

  This is what 008 did by hand (shards 16, 19, 27), now made reviewable. Risk: another `visual` or `axe` plant whose
  exact findings shift with a new repository story is missed locally and found by CI.
- **B, every plant of those gates.** About 73 `visual` and `axe` plants plus 9 `storybook-build` plants, close to the
  full browser cost. Safe, but it keeps most of the time #41 complains of.
- **C, A plus a pin.** As A, plus a unit test that pins the full list of `visual` and `axe` plants. A plant added
  without being classified (repository-content or not) fails that test, so the list cannot go stale silently. A
  little more test code than A.

**Q4, how a review verifies the selection** (choose one):
- **A (recommended), recorded output.** The phase keeps `--affected <phase base>`'s output in
  `reviews/phase-<N>/plants.log`, and the reviewer re-runs the selection. The reviewer does not judge the plants
  again: either a cheap `--affected <base> --list`, if Q2 allows it, or by reading the logged base against `base.sha`.
  A missing log, or a base other than the phase base, is a blocking finding. `story-config.yml` gains `plants_command`.
- **B, the reviewer re-runs `--affected`.** A second full browser run per phase, and the strongest check.
- **C, record only.** The log is required and the reviewer checks the base. Nothing is re-run, and CI's full set is
  the backstop.

**Other risks:**
- **Landing.** Seven missions edit `gates/README.md` and add plants. The op adds only one paragraph, one row entry,
  one registry plant and one new function. It should land before the next mission phase that runs plants, so that
  phase uses it.
- **Selection mistaken for proof.** A phase's `--affected` pass is not the Plants verdict. The summary line, the
  skill text and the README must say so, and the registry rule stops it from ever standing in for the required check.
- **Empty selection.** A phase with no mapped change runs no plants. The phase must say so in its log. It must not
  record it as "plants passed".

## What would change this decision

- If the operator picks Q1 B or C and the plan finds it needs an import graph or a plant-contract migration across
  every plant, the decision becomes a **mission** (a design question and a contract change).
- If #41's unread comments or linked PRs show that a selector already exists, or that a mission in progress took it
  on, the decision becomes **none** or a **fold** into that work.
- If the operator wants CI to use the selection too, the decision becomes a **mission**: that changes the required
  check and the constitution's "Gates are proven, too" guarantee.
