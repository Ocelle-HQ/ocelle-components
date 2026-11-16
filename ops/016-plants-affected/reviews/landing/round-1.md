---
scope: landing
round: 1
verdict: changes_requested
base: ce1d9c72b7f9e028565e61684465cf8df448ac1d
head: cecdef5ff80182eb645700521db0c8080d4fe435
tdd_check: pass
---

# Landing review, round 1: PR #45 (op 016, issue #41)

I reviewed the integrated diff `origin/main...HEAD`. Its merge base is `ce1d9c7`, the tip of `origin/main`, so the
branch is up to date. The behaviour-bearing changes:

- `gates/lib/plant-runner.ts:304-418`: `repositoryContentPlants`, `noPlantPath`, `repositoryContentPath` and
  `affectedPlants`.
- `gates/bin/plants.ts`: the `--affected` / `--list` mode, `selection`, `affectedSummary`, and the real `changed`
  tool (`:653-670`).
- `gates/lib/registry.ts:181-192`: `affectedInCiFindings`.
- The new registry plant `gates/plants/plants/fail-affected-in-plant-check/`.

The rest is records:
- the story-flow text (three commands, their installed copies, `tasks-template.md`, both `story-config.yml` copies);
- the 001 `story-config.md` amendment and the `gates/README.md` paragraph;
- the op, triage and flow records.

I read the phase 1 reviews (rounds 1 and 2) and the fix note as input. I checked every claim below again on HEAD.
CI run 43772148801 on `cecdef5`: I have no local evidence of its result, so this review does not rely on it.

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| L1-01 | blocking | `gates/lib/plant-runner.ts:310-331`, `:355-366`, `:400`; `gates/lib/plant-repo.ts:56-73,96-107`; `gates/README.md:81-84`; spec.md OR-002, *Assumptions* | **`repositoryContentPlants` misses many plants whose expectation names repository content, so element and token changes under-select.** The configuration set copies the repository's element source, its committed manifest, its token source and its pair list into every repo-tree plant. Many plants are built as "that repository content plus a delta or one overlaid file", and their expectation depends on it. The list holds only one plant of each of these gates:<br>- **manifest.** 10 of the 12 plants (`pass-reordered`, `fail-lost-attribute`, `fail-stale-property`, the six `fail-undescribed-*`, `break-not-json`) overlay their own `custom-elements.json` or one element file on the repository's element source.<br>- **contrast and brand-rules.** 24 of the 28 plants are a delta over the repository's `source.ts` and `pairs.json`. 17 have keyed locations into the repository's `source.ts`, for example `packages/tokens/src/source.ts#color-link`, and their recorded figures are computed against the repository's ground tokens (`contrast/exempt-disabled-ink/delta.json`).<br>- **style-lint.** 15 tree files use `var(--ocelle-…)`, which the unknown-token check judges against the repository's token source.<br><br>**Reproduction** (a scratch worktree at `cecdef5`, not committed). I changed one JSDoc sentence of `OcelleBrandMark` and regenerated the manifest.<br>- `gate:plants -- --affected HEAD --list` selects exactly the 10 listed plants. `manifest/pass-reordered` is not among them.<br>- That plant's build (the configuration set plus its `tree/packages/elements/custom-elements.json`), run through `node gates/bin/manifest.ts --root <tree>`, ends with `manifest: stale: the committed manifest differs from the generated manifest`, exit 1.<br>- The same build on unchanged source gives `2 elements checked, no finding`, exit 0.<br><br>So any element mission phase that changes a documented surface records "every plant as expected; not the Plants check" while a pass plant it broke stays unjudged until CI. Token value changes, the SC-001 case, leave out contrast and brand-rules plants whose figures move. The README's *Known limit* (`:81-84`) and spec *Assumptions* name only the visual plants' own stories, `unit-tests` and `mutation` (and, since R1-02, `prefix` → `brand-rules`), so neither a reader nor the reviewer's `--list` comparison can see this gap. By its own definition in OR-002 and op.md ("plants whose expectation names repository content"), the list is incomplete. | This needs an operator round, because OR-001/OR-002 and the accepted limit change. One option keeps SC-001's speed for stories and baselines: element paths (`packages/elements/src/**`, `packages/elements/custom-elements.json`) select every `manifest` plant, and token paths (`packages/tokens/src/**`, `packages/tokens/contrast/**`) select every `contrast`, `brand-rules` and `style-lint` plant, each in addition to `repositoryContentPlants`. Another option sends those paths to the full set. Either way: a red test in `plant-runner.test.ts` for the new mapping, and the pin extended to the `manifest`, `contrast` and `brand-rules` case lists, so that a new delta plant is classified as the visual and axe plants are. If the operator instead accepts the gap, correct the *Known limit* in the README and in spec *Assumptions* so they name these gates. |
| L1-02 | blocking | `gates/bin/plants.ts:664-667`; `gates/test/integration/plants.test.ts:170-258` | **No test shows that a failing `git diff` or `git ls-files` ends the run with exit 2, and the equivalent records on those lines claim one does.** The `Stryker disable next-line all` records on `failed` (`:665`) and on its `return { cause }` (`:667`) say "covered by gates-integration: … `--affected HEAD judges only the plant whose plant.json changed since HEAD …`". That test provokes only a `rev-parse` failure (`:207-208`). A mutant `ran.exitCode !== 0` → `false` would therefore take a failed diff's empty stdout as "no path changed": exit 0, "no plant selected". That is the fail-open this landing pass must exclude, and every test would still pass. Phase round 1 called this case "hard to provoke; acceptable as boundary". It is not hard. With `GIT_INDEX_FILE` pointing at a junk file, `rev-parse HEAD^{commit}` succeeds and `git diff HEAD` exits 128 ("index file smaller than expected"). On HEAD the real gate then prints `plants: could not run: git failed (fatal: …index file smaller than expected)`, exit 2, so the behaviour is right today. Phase round 1 made the same kind of gap, a record naming a test that does not cover the line, blocking (R1-01, untracked files). This is the same case. | Add an integration case, in the existing test or a new one: commit `plantsRoot()`, run `--affected HEAD` with `GIT_INDEX_FILE` set to a junk file in `env`, and assert `{ code: 2, stdout: [], stderr: ["plants: could not run: git failed (<first stderr line>)"] }` (match the path-free part). Then name that test in the records on `:665` and `:667`. As in R1-01, this is a missing test for present behaviour, so the fix procedure's step 3 applies, with no `fix-N` red commit. |
| L1-03 | note | `gates/bin/brand-rules.ts:16`; `gates/lib/plant-runner.ts:397-398` | Class 3 assumes that `gates/bin/<id>.ts` is read only by `<id>`'s plants. Since R1-02 the README names the one exception today (`prefix.ts` → `brand-rules`), but nothing checks for a new one. | Cheap fold, optional: a unit test that reads the imports in `gates/bin/*.ts` and fails when one registered gate entry imports another, unless the pair is listed. Or route `prefix.ts` to shared gate source. |
| L1-04 | note | `specs/006-storybook-workbench/contracts/plants.md:135-136`, `:180-184`; `specs/006-storybook-workbench/contracts/gates.md:164` | The 006 plant contract is the one that defines `gate:plants`'s modes, their stdout and their exit-2 causes. Its modes table still lists only the single run, `--plan`, `--shard` and `--verdict`, and its lists of registry plants and rules do not name `fail-affected-in-plant-check` / `affected-in-ci`. OR-006 did not list these files, so this is within the approved scope. Still, the new mode's exit contract lives only in the op's plan.md and the README. | Optional: one dated amendment line in each, pointing to `ops/016-plants-affected/plan.md` *The mode* and *Output*. |
| L1-05 | note | `tooling/speckit/bin/fold-history.sh:100,113`; `tooling/speckit/extensions/story/commands/speckit.story.review.md:56-60` | `fold-history.sh` remaps `base.sha` but not the `- base:` line of `plants.md`, and its own outside-evidence check would refuse a change to `plants.md`. When a fold rewrites a phase's base commit (a fold whose base lies before that phase's `base.sha`), the review step's "another base" check becomes a false blocking finding in any later round. With per-phase folds the base is never rewritten, so this does not bite today. | Follow-up: either the fold remaps `plants.md`'s base line (and the check allows it), or the review step resolves the recorded base through `reviews/history-map.txt`. |
| L1-06 | note | `gates/lib/registry.ts:188` | `affected-in-ci` is a substring test on a job's lines, as `skip-container-in-ci` and `shard-in-plant-check` are. A comment that mentions `--affected` trips it, which is the strict side. An argument passed in through a workflow-level `env:` would get past it, as it would get past the existing rules. The rule is consistent with its siblings. The plant covers the `plants` job, and the unit tests cover `plants-plan` and `plants-shard` (`registry.test.ts`). | None. |

## Correctness and fail-closed behaviour at the gate boundaries

- **Unmapped paths.** Anything that matches no class falls to `"not mapped"` and the full set. That includes a file directly in `gates/plants/<g>/`, an unknown gate directory, `.github/` other than `ci.yml`, `storybook/visual/container.json`, `packages/elements/scripts/**`, package manifests and the lock file. I probed `affectedPlants` directly (`gates/lib/plant-runner.ts`) with these and with near misses (`./gates/bin/lint.ts`, `gates/bin/Lint.ts`, `gates/plants/visual/pass-x` without a trailing path). Each gave the full set. `gates/eslint/` and `gates/stylelint/` are shared gate source. Paths holding `..` would be misclassified (`gates/test/../lib/x.ts` gives nothing), but git never prints such paths, so I record no finding.
- **No-plant class.** I checked it against `configurationSet` (`gates/lib/plant-repo.ts:96-107`): none of `specs/**` (other than plans), `ops/`, `triage/`, `knowledge/`, `.claude/`, `.specify/`, `tooling/`, `gates/test/`, the test directories or the top-level `*.md` files is copied into a plant. The axe gate accepts only `specs/<feature>/plan.md` as an exception plan (`gates/lib/a11y-exceptions.ts:60-61`), so the `specs/` carve-out is exact.
- **Plant directories.** No plant reads another plant's files except through `baselinesOf`. I found no stray file directly under `gates/plants/<g>/` and no case directory without `plant.json`.
- **Unreadable inputs.** A `plant.json` that is missing or invalid gives no `baselinesOf`, but the structural checks still report it, with exit 1, also under `--list` (`plants.test.ts`, "reads past a case without a valid plant.json"). A missing `changed` tool exits 2.
- **Git boundary.** Verified on HEAD:
  - an unresolvable base exits 2;
  - a `git diff` failure (provoked with a junk `GIT_INDEX_FILE`) exits 2, `git failed (…)`, untested (L1-02);
  - `-z` output, untracked files that are not ignored, and `--no-renames` are as planned.
- **Under-selection on mapped paths.** This is L1-01 (blocking) and L1-03 (documented). I put both to the stated standard: the selection is what a phase records as its plant evidence.

## Exit 0/1/2 contract of the new mode

Run on HEAD with Node 24 (the pinned 26.13.0 is not installed here):

| Arguments | Exit | Cause / summary |
|-----------|------|-----------------|
| `--affected` | 2 | `--affected needs a base commit` |
| `--affected --list` | 2 | same |
| `--affected nope` | 2 | `--affected nope does not resolve to a commit; pass the phase's base.sha` |
| `--list` | 2 | `--list needs --affected <base>` |
| `--affected HEAD --plan` | 2 | `--affected is a mode of its own; …` |
| `--affected ce1d9c7 --list` | 0 | `note: affected: every plant, by gates/bin/plants.ts (shared gate source)`; `302 of 302 plants selected, none judged (--list)` |
| `--affected 80ea825 --list` | 0 | identical to `reviews/phase-1/plants.md` |

The unit tests (`gates/test/plants.test.ts`) pin these cases:
- exit 1 when a selected plant is not as expected;
- exit 1 for registry or structural problems, under `--list` too;
- exit 0 with the "no plant selected … not the Plants check" line;
- the full-set summary.

No `--affected` summary reuses the single run's "plants of N gates and the registry judged" line.

## Overlap with existing gates and completeness

- **No new gate or check name.** `gates.json`, `.github/workflows/ci.yml`, the ruleset, the README check list and `contracts/ci-checks.md` need no change. `ci.yml`, `gates/test/ci-workflow.test.ts`, `plant-repo.ts`, `plantShards`, `shardSize` and `otherShardSize` are untouched (OR-007).
- **The new rule.** `affectedInCiFindings` runs in both `judgeRun` and `registryRun` (`plants.ts:81`, `:491`).
- **The new plant.** It is in the README's `plants` row (`gates/README.md:41`). Its `gates.json` is identical to `pass-split-plant-jobs`'s, and its `ci.yml` differs only by ` --affected HEAD~1` on the verdict step. The robustness count was raised 35 → 36 (exact, not loosened). The 006 contract lists are stale (L1-04).
- **Story copies.** The three story commands are byte-identical to their `.specify/` copies, and their bodies to the installed `SKILL.md` copies. The two `story-config.yml` copies are identical (`gate:config-copies` exit 0).

## Design lens

- **The seam.** `affectedPlants` is pure and takes the plants, the gate ids and the paths. `changed` is a narrow tool that returns paths or a cause. The mode is kept apart from `--plan`, `--shard` and `--verdict`. This is a clean, testable split, and the first-path notes make the selection auditable. The weak point is the data, not the code: `repositoryContentPlants` encodes "what reads repository content" by hand, and the pin guards only `visual` and `axe` (L1-01). The configuration set in `plant-repo.ts` is where the truth sits. A pin that ties every `repo-tree` plant without its own copy of a content path to the list would make the class self-checking.
- **Flow text.** The implement, fix and review steps, `plants_command` and the 001 amendment agree with each other and with OR-006. Each says that `--affected` is a local aid and not the Plants verdict. The review step compares only the `note: affected:` lines, which is cheap and deterministic on a clean tree. Two caveats:
  - a reviewer with a stray untracked file gets a different selection;
  - L1-05.

## Test quality

- **Red evidence.**
  - The red commit `2d4c9a4` (pre-fold `268b1e4`, `reviews/history-map.txt`) touches only the four test files. Its three deleted lines are import lines that were widened.
  - In `check-red-phase.log`, every new test fails because the behaviour is missing: `affectedPlants`/`affectedInCiFindings` "is not a function", `repositoryContentPlants` undefined, and the CLI and integration cases receive the single run's output. None fails on a setup error.
  - `tdd-check.json`: `status: pass`, `final_tests_on_base_exit: 1`, `head_exit: 0`, no problems.
- **Weakening.** `git diff 2d4c9a4..HEAD -- gates/test` only adds tests, apart from the robustness count (R1-03, exact). Nothing was skipped or loosened.
- **Assertions.** Every new case asserts the whole outcome with `toEqual`: the selection and its paths, the stdout and stderr lines, the exit code, the plants run and the bases asked. There are no conditionals, no `skip`/`only` and no snapshots.
- **Coverage gaps.**
  - The git-failure branch (L1-02).
  - No test exercises a realistic element or token diff against the plants that depend on it (L1-01). The unit tests use hand-written plant lists, so they confirm the rule as specified but cannot expose a wrong rule.
- **Mutation.** `pnpm run gate:mutation -- --base ce1d9c7` gave exit 0: 377 mutants on the changed lines of 3 files, none survived; 0 timeouts; 118 compile errors (read: type-invalid mutants, mostly on narrowed `RegExpExecArray` access and the `Affected` union); 0 zero-mutant entries; 9 equivalent records. I read the records:
  - `registry.ts:187` (ArrayDeclaration on `?? []`) is sound.
  - Of the 8 process-boundary records in `plants.ts:653-668`, 6 name tests that cover their lines: the `rev-parse` failure, a tracked change, and untracked and ignored files. The 2 on `:665` and `:667` do not (L1-02). Under R-08 a record must give a true reason, so those two are not acceptable as written.

## Checks run

All on HEAD `cecdef5`, Node 24.22.1 on `PATH`:
- `vitest run gates/test/plant-runner.test.ts gates/test/plants.test.ts gates/test/registry.test.ts`: 214 passed.
- `vitest run --project gates-integration gates/test/integration/plants.test.ts -t affected`: 2 passed.
- `gate:typecheck`, `gate:lint` (263 files), `gate:test-lint` (173 files), `gate:config-copies`: all exit 0, no finding.
- `gate:mutation -- --base ce1d9c7`: exit 0 (above).
- `gate:plants -- --affected <sha> --list` and the argument errors: table above.
- The L1-01 and L1-02 reproductions, in a scratch worktree and a scratch repository, both removed afterwards.

I did not run the full `gate:plants` or the full `pnpm test`. The phase record holds a full verdict (302 plants, exit 0), and CI judges the full set.

## Earlier findings

This is the first landing round. Phase 1 round 1's blocking R1-01 (untracked files untested) is resolved by
`gates/test/integration/plants.test.ts:217-258`. I confirmed that the test exists and passes. R1-02 is documented in the README
(L1-03). Round 2 approved with one cosmetic note.
