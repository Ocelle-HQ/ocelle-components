---
phase: 0
round: 1
verdict: changes_requested
base: 7af6180b2ac3027f565c296db3c03facfea86aaa
head: bf535303a9192ef90ac9965e8b6007dd7969aa5d
tdd_check: exempt
---

# Phase 0 review, round 1

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| R1-01 | blocking | specs/030-release-v1/reviews/phase-0/plants.md:5 | The phase's plant record shows `exit: 2`. The run had no container engine for the 46 visual plants and no Chromium of the pinned Playwright revision for the browser-backed plants: 12 unit-tests plants report "Chromium not found", 22 axe plants "no browser", and 4 element mutation plants "Stryker wrote no report". The review procedure treats any recorded exit other than 0 as blocking. The base (`7af6180b`) and the selection ("every plant, by .github/workflows/evidence-reuse-shadow.yml (not mapped)") do match my own `--list` run. | Run `pnpm run gate:plants -- --affected 7af6180b2ac3027f565c296db3c03facfea86aaa` again in an environment with a running container engine and the pinned Playwright browsers (`pnpm run setup:online`). Replace `plants.md` with a record that exits 0. If no such environment exists for this run, take the question to the operator and record the decision under `reviews/phase-0/`. |
| R1-02 | note | specs/030-release-v1/reviews/recheck.md:229 | Item 11 takes the npm version of the pinned Node (11.20.0) from the Node.js release index. T002 asks for `npm --version` after `pnpm run setup:online`. The record says so openly, and the value meets R-01 and R-02. | None. CI's jobs run on the pinned Node, and phase 4 or 6 may confirm the value from a CI log. |
| R1-03 | note | git range 7af6180b..HEAD | `gate:signoff` over the phase range reports 4 commits with no sign-off: `69add83a`, `64c57578`, `3d090026` and `d45efd57`. All four are squash commits already on `main`, brought in by the merge. Over the range the pull request will check (`d45efd57..HEAD`, 44 commits) the gate finds nothing. Every commit of this phase is signed off. | None. |

## Test quality

- tdd-check: `exempt` (`tdd-check.json`, head `78bdceb1`; HEAD `bf535303` changes only `tdd-check.json` itself). The
  exemption in `tdd-exempt.md` holds. Phase 0's own changes after the merge (`git diff e0dc73f1..HEAD`) touch only
  `specs/030-release-v1/` (plan.md, research.md, tasks.md, and records under reviews/). The merge commit
  `e0dc73f1` (parents `7af6180b` and `d45efd57`, signed off) has tree `1a3ac321`, the same tree
  `git merge-tree --write-tree 7af6180b d45efd57` produces. So the merge was clean and nothing was resolved by hand.
  No test written for this phase could fail before it and pass after it.
- No test file was added or changed by this phase's own commits, so there is no red log or weakened test to check.
  No `scaffold.sha`, no `red-commits`, and no `deferred_ci` in the verdict.
- Mutation: `pnpm run gate:mutation -- --base 7af6180b... --plan` returns 147 shards. All of them are source brought
  in by the merge of `main` (missions 018 and 029, op 023, #101, #102, #103). Each of those landed on `main` through
  a pull request that requires "Mutation testing". This phase writes no source, and against the merged `main`
  commit the plan is empty (`--base d45efd57... --plan`: 0 shards). I did not run the 147 shards here: they include
  element shards that need the pinned Chromium, which this environment lacks. No surviving mutant is attributable
  to this phase.

## Checks run

On HEAD `bf535303`, in this environment (Node 22, no container engine, Chromium of revision 1243 only, the pinned
revision is 1248):

- `gate:typecheck`: no type error. `gate:lint`: 759 files, no finding. `gate:style-lint`: 88 files, no finding.
- `gate:test-lint`: 577 files, no finding. `gate:prefix`: 686 files, no finding. `gate:pins`: 5 manifests, no finding.
- `gate:contrast`: 207 pairs in light and 215 in dark, passed. `gate:brand-rules`: 7 rules, passed.
- `gate:manifest`: 52 elements, no finding. `gate:config-copies`: identical. `gate:sandbox-paths`: 6615 tracked files,
  none holds a sandbox path.
- `gate:signoff --range d45efd57..HEAD`: 44 commits, no finding (see R1-03 for the phase range).
- `gate:storybook-build`: 419 stories built. `gate:csp`: 93 files checked after `pnpm -r run build`, no finding. The
  first run checked 0 files because no built output existed.
- vitest, node projects `gates`, `tokens`, `styles`, `elements-node`: 109 files and 4821 tests passed.
- Not run here (no pinned browser, no container engine): the browser unit and interaction projects, `gate:visual`,
  `gate:axe`, and the full mutation run. The phase changes none of their inputs beyond the merge of `main`, where
  they are required checks. The required CI checks on the pull request must confirm them.
- `gate:plants -- --affected 7af6180b... --list`: exit 0, `note: affected: every plant, by
  .github/workflows/evidence-reuse-shadow.yml (not mapped)`, the same selection as `plants.md`.

Tasks: T001, T002 and T003 are ticked and present (`tasks.md:56`, `:57`, `:72`). I spot-checked the recheck against
the tree and found it accurate:

- `gates/bin/evidence-reuse-shadow.ts:3-9` holds the 19 hard-coded check names.
- The `ci.yml:1-4` header says "eighteen".
- `registry.ts:44` is `sandbox-paths`, and `sandbox-paths.ts:16` is the rule.
- `183b20f` and `69add83a` are ancestors of HEAD.
- The `git grep` over `test_pathspec` gives exactly the four hits listed, none of which reads the file.

Operator decision (a) on item 2b (`operator-recheck-decision.md`) is applied consistently in `plan.md` and in
`tasks.md` T008, T017, T019, T024, T033, T037 and T047 (commit `78bdceb1`). The constitution's principles on elements, tokens,
accessibility and CSP are not engaged by a merge-and-records phase.

## Earlier findings

None: this is round 1.
