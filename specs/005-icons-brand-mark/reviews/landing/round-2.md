---
scope: landing
phase: landing
round: 2
verdict: approved
base: e7d7d54
head: e11be27
tdd_check: pass
---

# Landing review, round 2 (PR #26, mission 005-icons-brand-mark)

The scope follows the landing stop rule. Round 2 covers only the merge of `main` (mission 007, #25, "mutation gate
strictness", `e7d7d54`) into the branch and the work done after it:

- `6af3c82`: the merge (parents `9d9b315`, `e7d7d54`).
- `c1cc7d5`: red.
- `54f009b`: fix.
- `e11be27`: records (`merge-007.md`, `merge-007-mutation.log`).

It checks that round 1's blocking finding is still resolved and that the merge regressed neither feature. It does
not search beyond the merge.

Outside the files the record names, the merge result matches one of its parents. Every file 007 touched is equal to
`e7d7d54`, and every file 005 touched is equal to `9d9b315`, except for these: `gates/README.md`,
`gates/bin/mutation.ts`, `vitest.mutation.config.ts`, the two Vitest-config tests, `gates/test/mutation-split.test.ts`,
`knowledge/speckit-flows/log.md`, `runs/index.md`, and two auto-merged texts. Those two are
`knowledge/speckit-flows/findings/frontend-missions.md` and `specs/001-repository-foundation/research.md`, and each
holds both sides' added lines. No conflict marker is left in the tree.

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| L2-01 | note | gates/lib/plant-repo.ts:98, :240; packages/elements/scripts/manifest.ts:27, :36; gates/stylelint/token-only.ts:121 | **The number of Timeouts changes from run to run, and the merge did not cause them.** The implementer's whole-diff run lists 5 timeouts. Mine, at the same HEAD and base, lists 9: four more Regex mutants at plant-repo.ts:98. A run of shard 7 alone (`plant-repo.ts:95-406`) lists 9 in that file, including three StringLiteral mutants at :240. These are static mutants (a module-level regex or constant), and each one runs every test file of the default configuration, so they finish close to Stryker's limit. I compared the statuses with the same `--mutate` set at `9d9b315`, 005 before the merge, which has no `groupOrder` (`round-2-timeouts.log`). The same mutants were Timeout there: manifest.ts:27, both :36 Regex mutants, token-only.ts:121's BlockStatement (a loop body removed, so the loop never ends) and the anchor-dropping Regex at plant-repo.ts:98. One more :98 Regex mutant was Timeout there that was Killed at HEAD. So the merged start order (`tokens-source-table` first) did not turn kills into Timeouts. Under 007 the Timeouts are acceptable: FR-007 counts a Timeout as killed, FR-001/FR-005 make it a report line and not a finding, and FR-009's zero-Timeout bound covers only `packages/tokens/src/source.ts`. | None for this PR. A reader should not take a change in the timeout count of these files as a signal. If that matters, a follow-up could time the static mutants of gate source the way 007 did for `source.ts`. |
| L2-02 | note | CI `mutation-shard` jobs; `--plan` at base `e7d7d54` | **Shard time.** With 007's 30-line entry bound, the plan for this PR is 28 shards with 27 cuts (it was 12). Two shards mix the configurations and run Stryker twice: shard 15 (`manifest.ts:121-130`, `browser.ts`, `define.ts`, `icon-slot.ts:1-30`) and shard 27 (`ocelle-icon.ts:121`, `rosette.ts`, `vite.browser.config.ts`). I timed three shards in this container: shard 7 took 186 s, shard 12 (`manifest.ts:31-60`, with the :36 Timeouts) 200 s, and mixed shard 15 171 s. 007 measured CI at about 2.3 times the sandbox time. On that ratio the slowest of these takes about 7.7 min on CI, under the 10-minute limit but not by much. 005's earlier CI run, with larger shards, finished every shard within 6:42. | Watch the shard times in the first CI run on the merge. Nothing to change before then. |

## The merged gate (`gates/bin/mutation.ts`)

- **Every verdict field is merged.** One Stryker run per configuration with changed files, as in 005 R-12. For each
  run the gate deletes that run's own report, runs Stryker, and calls `classifyMutants` on that run's group only. It
  then appends `findings`, adds up `mutants`, and appends `timeouts`, `compileErrors` and `zeroEntries`. No field of
  `MutantVerdict` is dropped.
- **Fail-closed.** `if (!verdict.ok) return emit({ exit: 2, … })` sits inside the loop, before any line is printed.
  I tested a report that is not JSON from each configuration in turn, on a mixed change where the other run
  reports Timeouts (an in-process probe with the test doubles). Both cases give exit 2, nothing on stdout, and the
  cause on stderr. That matches 007 contract item 7: no report lines on exit 2. The 005 case "deletes the elements
  report before its run" still holds.
- **007's output contract.** Lines are printed in this order: the records, then the timeouts, then the compile
  errors, then the zero-mutant entries, then the findings, then the summary. The `undecided` lines go through
  `oneLine`, as 007's O2-01 amendment requires. Both summaries are 007's text and count the merged lists, including
  counts of zero.
- **Order across configurations.** `inChangedOrder` stable-sorts each list by the index of its changed file in
  `selected`. That index is the diff order, also for a `--files` run, whose entries are matched by `file.entry ??
  file.path`. Since 007, a file appears only once in `selected` (one file named twice is exit 2) and belongs to one
  configuration. So the stable sort keeps `classifyMutants`' order within a file (line, column, id) and puts the
  files in changed order, which is what the contract asks for. Findings keep run order, which is what
  `fail-mixed-survivors` expects. The contract orders only groups 2-4.
- **Red/green.** I checked out `c1cc7d5` in a worktree and ran `mutation-split.test.ts`: 4 failed and 6 passed. All
  four fail on `toEqual`, and the diff shows the run-order lines (`round-2-red-c1cc7d5.log`). That is the missing
  behaviour, not a setup error. `git diff c1cc7d5..HEAD -- gates/test/` is empty, so nothing was loosened after the
  red commit.

## Configurations

- **`vitest.mutation.config.ts`** has 005's seven excluded projects and 007's split: `tokens-source-table` at
  `groupOrder` 1 and every other kept project at 2. Its header holds both sides' text.
- **`vitest.mutation.elements.config.ts` is unchanged, and I accept that.** It holds one project, `elements`, and
  mutates only `packages/elements/src/**`. 007's R-05 problem was token tests running last behind other projects'
  files for static `source.ts` mutants. That cannot happen with one project, and no token source is mutated under
  this configuration. `stryker.elements.config.json` still equals `stryker.config.json` apart from its Vitest config
  and its report file, and `vitest-config.test.ts` pins that. 007 did not change `stryker.config.json`.

## Test quality

- **007 integration cases (`vitest-mutation-config.test.ts`).** In the collect case, the excluded list for the
  expected side gains `"elements (chromium)"`, the name Vitest gives the browser-mode project's modules. The mutation
  side is still compared unfiltered, as an exact sorted list. So the case still fails if any excluded module is
  collected or any kept one is missing. This is not a weakening. In the start-order case, the allowed set swaps
  `elements (chromium)` for `elements-node`. It still has four names, and `elements (chromium)` is no longer a
  project of this configuration. Both name lists are exact. Both pass here (21 of 21 with `vitest-config.test.ts` and
  `mutation-split.test.ts`).
- **005 cases in `mutation-split.test.ts`.** The diff from `9d9b315` only appends 007's counts to the expected
  summaries. Every expectation is still a whole `toEqual` on code, out and err, so they are stricter, not looser.
  The four new cases assert whole outputs too.
- **`vitest-config.test.ts`** keeps 005's exact excluded list, the `elements-node` check and both elements-config
  cases. It also keeps 007's equality with the tokens split, now with `environment` compared as well.
- **Mutation.** I ran `pnpm run gate:mutation -- --base e7d7d54` at HEAD: exit 0 (560 s), 881 mutants on the changed
  lines of 18 files, none survived. The report lines were 9 timeouts (see L2-01), 315 compile errors and 3
  zero-mutant entries (`gates/bin/contrast.ts`, then `packages/elements/src/browser.ts` and `index.ts`, in changed
  order). There were 15 equivalent records, the same 15 lines round 1 read, and the merge adds none
  (`round-2-mutation.log`). Every changed line of the merged `mutation.ts` is killed. Its compile-error lines are the
  type checker rejecting mutants.

## Records

- **`gates/README.md`** has one mutation row with 005's split, its four plants and `pass-element-source`. It also
  has 007's report-line text and plants, and the fix's phrase "the lines of both runs in the changed files' order".
  007's paragraphs on the report lines and the 30-line amendment are kept.
- **`knowledge/speckit-flows/log.md`** keeps both sides' 2026-11-12 entries under one heading, with 005's first, and
  007's 2026-11-10 Update lines unchanged. **`runs/index.md`** lists 001, 002, 003, 005, 007 and op-004, one line per
  `runs/*.md` file.
- **`merge-007.md`** matches what I found. Its one inexact point is the count of 5 timeouts, which is one run's count
  (L2-01).

## Checks run

HEAD `e11be27`, Node 22.23.4 (CI pins 26.13.0), with `OCELLE_CHROMIUM_PATH` set for every run and the scratchpad
`PLAYWRIGHT_BROWSERS_PATH` set for the Stryker and plant runs. I ran one heavy job at a time.

| Check | Result |
|---|---|
| `gate:typecheck` | exit 0, no type error |
| `gate:lint` | exit 0, 226 files |
| `gate:test-lint` | exit 0, 155 files |
| `gate:style-lint` | exit 0, 12 files |
| `gate:config-copies` | exit 0 |
| `gate:manifest` | exit 0, 2 elements |
| `pnpm test` | exit 0, 2601 tests in 120 files |
| `gates-integration` `vitest-mutation-config.test.ts` + `vitest-config.test.ts` + `mutation-split.test.ts` | 21 of 21 passed |
| `gate:plants` | exit 0, 220 plants of 14 gates and the registry, every plant as expected (207 s) |
| `gate:mutation -- --base e7d7d54` | exit 0, 881 mutants, none survived; 9 timeouts, 315 compile errors, 3 zero-mutant entries; 15 records |
| `gate:mutation --plan` | 28 shards, 27 cuts |
| Shards 7, 12, 15 with `--files` | exit 0 each; 186 s, 200 s, 171 s |
| Red `c1cc7d5`, `mutation-split.test.ts` | 4 failed on assertions, 6 passed |
| Fail-closed probe (broken report from each configuration) | exit 2, empty stdout, both ways |
| Timeout comparison HEAD against `9d9b315` (same `--mutate` set) | same Timeouts before the merge (L2-01) |

CI has not run on the merge. The push waits for this review.

## Earlier findings

- **L1-01 (blocking): still resolved.** `specs/001-repository-foundation/contracts/ci-checks.md` has the
  `Custom-elements manifest` row (line 27), "fourteen in all" naming 005 FR-009's `manifest`, "fifteen check names",
  and the 005 operator paragraph. The merge does not touch this file. `git diff 9d9b315 HEAD` over it is empty, and
  007 did not change it.
- L1-02 to L1-04 were notes. The merge touches none of their files (`token-only.ts`, `custom-elements.json`, the
  package README are equal to `9d9b315`).
