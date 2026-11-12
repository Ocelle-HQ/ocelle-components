# Merge of `main` (mission 007) into 005

PR #26, branch `claude/017-icons-brand-mark`. `main` gained mission 007, "mutation gate strictness" (#25,
`e7d7d54`). It was merged with `git merge --signoff origin/main`, with no rebase and no history rewritten.

| Commit | What |
|--------|------|
| `6af3c82` | The merge commit (parents `9d9b315`, `e7d7d54`), with the conflicts resolved as below |
| `c1cc7d5` | Red: four cases in `gates/test/mutation-split.test.ts` showing that 007's report lines from both configurations come in the changed files' order |
| `54f009b` | Fix: `gates/bin/mutation.ts` sorts the merged report lines by changed file; one phrase added to the README mutation row |

## Conflicts

- **gates/bin/mutation.ts.** The merged gate keeps 005's one Stryker run per configuration (R-12). It merges every
  field of each run's verdict: the findings in run order (the default configuration first, as
  `fail-mixed-survivors` expects), the mutant count summed, and the timeouts, compile errors and zero-mutant entries
  of both runs collected. The output and both summary lines are 007's (contracts/mutation-output.md), counting the
  merged lists.
- **vitest.mutation.config.ts.** Kept 005's seven excluded projects (`elements`, `elements-build` and
  `elements-browser` included) and its header text. After them comes 007's start-order paragraph and its `groupOrder`
  split of tokens: `tokens-source-table` at 1, every other kept project at 2.
- **vitest.mutation.elements.config.ts: no change.** R-05's start order answers one problem. A static mutant runs
  every test file in order with bail, and in the default configuration the token tests ran last, behind every other
  project, so `source.ts` static mutants timed out. Under Stryker, a project at `groupOrder` 0 joins the sequential
  group that runs last. The elements configuration holds one project, `elements`, so no other project's files can run
  ahead of its tests, and "runs last" is the same as "runs alone". No token source is mutated under it either: only
  `packages/elements/src/**` is. With one project there is nothing to order. A split like tokens' would only make
  sense if one elements test file had to start first for kills to be honest, and nothing in R-12 or in this run calls
  for that. The whole-diff run below shows no element-source Timeout.
- **gates/test/vitest-config.test.ts.** Kept both sides' assertions. 005's exact list of seven excluded projects,
  `elements-node` kept, and the `vitest.mutation.elements.config.ts` / `stryker.elements.config.json` cases. 007's
  equality with the tokens split, adapted to 005's `Project` shape, which carries `environment`.
- **gates/test/integration/vitest-mutation-config.test.ts.** Kept both sides. The header text from both. The
  `excluded` list is the seven projects. The name list is 007's with `elements-node` in place of `elements`. 007's
  `withoutSequence` / `groupOrder` assertions are kept. Two adaptations were needed to keep 007's cases correct on
  005's projects:
  - The collect case compares collected modules by project name. Vitest names the browser-mode `elements` project's
    modules `elements (chromium)`, so the case filters with `excluded` plus that name (`excludedCollected`).
  - The start-order case allows `elements-node`, `gates`, `storybook` and `styles` after `tokens-source-table`, in
    place of `elements (chromium)`, which is no longer in the mutation configuration.
- **gates/test/mutation-split.test.ts** (no textual conflict, broken by the merge). The five 005 cases now expect
  007's summary format (`; 0 timeouts, 0 compile errors, 0 zero-mutant entries`). Their findings and verdicts are
  unchanged.
- **gates/README.md.** One mutation row with both sides' text. It has 005's split, its plants and
  `pass-element-source`, plus 007's report-line examples, plants and "Report lines, not findings" sentence. The fix
  commit adds "the lines of both runs in the changed files' order".
- **knowledge/speckit-flows/log.md.** Kept every line of both sides' 2026-11-12 entries under the one date heading:
  005's first, then 007's. 007's 2026-11-10 Update lines come in unchanged.
- **knowledge/speckit-flows/runs/index.md.** Regenerated with `summary.sh`'s loop over `runs/*.md`, so it lists 001,
  002, 003, 005, 007 and op-004.

## 005 split against 007's rules

- 007's rules are report lines, not verdicts: timeout, compile-error, and zero-mutants on any entry. So none of the
  R-12 plants changes outcome. `pass-element-source`, `fail-element-source-survivor`,
  `fail-element-source-no-coverage` and `fail-mixed-survivors` list no `reports`, and the plant judge checks report
  lines only when a plant lists them. All four judged as expected in the plant run below.
- 007's zero-mutant rule on an element-source run: whole-diff entries are named by path, `--files` entries as given.
  This works through the split because `classifyMutants` gets each configuration's own group, with `--files` entries
  intact. The new unit case covers a `--files` run with an entry from each configuration. The real whole-diff run
  below reports `packages/elements/src/browser.ts` and `packages/elements/src/index.ts`, both from the elements run,
  as zero-mutant entries.
- **What the merge broke.** 007's contract orders the timeout, compile-error and zero-mutants lines by the changed
  files. The merge printed them by run, default first, so `packages/tokens/src/x.ts` came before
  `packages/elements/src/x.ts`. Red `c1cc7d5` adds four cases: timeouts and compile errors across three files of two
  configurations, zero-mutant entries in a whole-diff run, zero-mutant `--files` entries named as given, and findings
  alongside report lines with the summary counts. All four failed on assertions with the order shown (4 failed, 6
  passed). Fix `54f009b` adds `inChangedOrder`, a stable sort of each list by the index of its changed file. After it,
  all 10 cases pass.

## Checks

Container: Node 22.23.4 (CI pins 26.13.0). `OCELLE_CHROMIUM_PATH` was set for every run. The scratchpad
`PLAYWRIGHT_BROWSERS_PATH` was set for the plant and Stryker runs. Each run was one at a time at `54f009b`.

| Check | Result |
|-------|--------|
| `pnpm run gate:typecheck` | exit 0: no type error in the files of tsconfig.json |
| `pnpm run gate:lint` | exit 0: 226 files checked, no finding |
| `pnpm run gate:test-lint` | exit 0: 155 files checked, no finding |
| `pnpm run gate:style-lint` | exit 0: 12 files checked, no finding |
| `pnpm test` | exit 0: 2601 tests passed in 120 files |
| `pnpm run gate:plants` | exit 0: 220 plants of 14 gates and the registry judged, every plant as expected (197 s) |
| `pnpm run gate:config-copies` | exit 0: the two story-config.yml copies are identical |
| `gate:registry` | none: there is no such script. The registry is judged within `gate:plants` |
| `pnpm run gate:mutation -- --base origin/main` | exit 0 (568 s), base `e7d7d54`: 881 mutants on the changed lines of 18 files, none survived; 5 timeouts, 315 compile errors, 3 zero-mutant entries; 15 equivalent records. Full output in `merge-007-mutation.log` |

The mutation run's report lines:

- **Timeouts (5).** `gates/lib/plant-repo.ts:98` (Regex), `gates/stylelint/token-only.ts:121` (BlockStatement),
  `packages/elements/scripts/manifest.ts:27` (StringLiteral) and `:36` (two Regex). All are default-configuration
  files, and none is element source.
- **Zero-mutant entries (3).** `gates/bin/contrast.ts` (default configuration), then `packages/elements/src/browser.ts`
  and `packages/elements/src/index.ts` (elements configuration), in the changed files' order.
- The 315 compile errors are the type checker rejecting mutants. Under 007 they are report lines, not findings.
