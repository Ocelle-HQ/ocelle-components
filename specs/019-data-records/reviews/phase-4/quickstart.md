# Quickstart run on the whole mission (T078)

Run on 2026-11-23 on this branch at 4106d7d with phase 4's CHANGELOG edits (T075) and, for the plant and visual steps,
commit 6f97540 (the empty-index plant's two stubs, `plants.md`). One heavy job at a time, `OCELLE_VISUAL_ENGINE=docker`
for every container step (#10's pinned container; podman is absent), dockerd checked before each docker step.

**Scope: the operator's standing CI-first decision** (`reviews/operator-ci-first-decision.md`, relayed 2026-11-20,
confirmed "Confirm both"). It post-dates T078 and overrides its full local runs: locally only the fast gates, the
affected plants and the browser or visual tests the phase changes; the multi-hour full plant and visual runs are left to
CI's required checks, which decide them before any merge. Within it, this run also made `gate:storybook-build`,
`gate:axe`, the mission's mutation run, 009's tests and a `visual:update` under docker. **Left to CI:** the full
`gate:visual` run (step 3), the full plant run (step 4, `plants.md`) and `gate:unit-tests` as the whole suite (step 1).
Step 5 is by hand in Storybook and is the reviewer's.

## Summary

| Step | Command | Exit | Summary line |
|---|---|---|---|
| 1 | `pnpm exec vitest run` on 009's 18 test files, unedited (below) | 0 | `Test Files  18 passed (18)`, `Tests  315 passed (315)` |
| 1 | `pnpm exec vitest run --project elements-browser packages/elements/test/browser/data-table-scrollbar.test.ts` | 0 | `Tests  3 passed (3)` (the classic-scrollbar suite) |
| 1 | `gate:unit-tests` (whole suite) | CI | left to CI's required check |
| 2 | `gate:typecheck` | 0 | `typecheck: no type error in the files of tsconfig.json` |
| 2 | `gate:lint` | 0 | `lint: 458 files checked, no finding` |
| 2 | `gate:style-lint` | 0 | `style-lint: 43 files checked, no finding` |
| 2 | `gate:test-lint` | 0 | `test-lint: 337 files checked, no finding` |
| 2 | `gate:csp` | 0 | `csp: 41 files checked, no finding` |
| 2 | `gate:prefix` | 0 | `prefix: 477 files checked, no finding` |
| 2 | `gate:manifest` | 0 | `manifest: 23 elements checked, no finding` |
| 2 | `gate:contrast` | 0 | `contrast: 169 pairs checked in light, 177 in dark (158 required per theme)` |
| 2 | `gate:brand-rules` | 0 | `brand-rules: 7 rules checked` |
| 2 | `gate:config-copies` | 0 | `config-copies: .specify/extensions/story/story-config.yml and tooling/speckit/extensions/story/story-config.yml are identical` |
| 2 | `gate:signoff -- --range 4106d7d..HEAD` | 0 | on phase 4's commits (the line is in the phase's commit record) |
| 3 | `gate:storybook-build` | 0 | `storybook-build: built 191 stories` (the mission's 48 among them: 21 data-table, 13 timeline, 14 chain) |
| 3 | `gate:axe` | 0 | `axe: 382 story-theme runs, 0 serious or critical; 84 notes (0 incomplete, 84 excepted)` (4 min 27 s) |
| 3 | `visual:update` under docker | 0 | `baselines: wrote 0 files (0 added, 0 changed, 0 removed), 0 bytes in total` (7 min 54 s) |
| 3 | `gate:visual` (full run) | CI | left to CI's required Visual check |
| 4 | `gate:plants -- --affected 8d104af… --list`, then the scoped run | 0 | `plants: affected since 8d104af23ce177ec4acbbfaba59bf433f9520d6d: 22 of 314 plants judged, every plant as expected; not the Plants check` (`plants.md`; the full run left to CI's Plants check) |
| 6 | `gate:mutation -- --base 8d104af… --files …`, three batches (below) | 0, 0, 0 | 781 mutants on the changed lines of the mission's 10 changed source files, none survived |

The manifest lists the five elements with empty event lists (step 2): `ocelle-data-table`, `ocelle-event-timeline`,
`ocelle-timeline-event`, `ocelle-evidence-chain` and `ocelle-evidence-step` each have `events: []` in
`packages/elements/custom-elements.json`.

**No earlier baseline changes (SC-007).** `visual:update` under #10's pinned container wrote no file: every baseline
in `storybook/baselines/`, 013's and 009's among them, is what the current stories render, and the mission's 96
baselines (42, 26 and 28) are unchanged since their phases. `git diff --stat 8d104af HEAD -- storybook/baselines`
lists 96 files, exactly the mission's added ones: no earlier baseline is modified or removed. CI's Visual check compares them with fresh captures.

## Step 1: 009's tests, unedited (SC-007)

The 18 test files under `packages/elements/test/` that exist at the mission's base (8d104af) and test 009's work: the
overflow-region module (`overflow-region.test.ts`, `overflow-host.test.ts`), `ocelle-scroller` (`scroller.test.ts`,
`scroller-lifecycle.test.ts`, `entry-scroller.test.ts`, `browser/scroller.test.ts`, `browser/scrollbar.test.ts`), the
workflow board and lane (`workflow-board.test.ts`, `workflow-lane.test.ts`, `entry-workflow-board.test.ts`,
`entry-workflow-lane.test.ts`, `browser/workflow-board.test.ts`) and `ocelle-list-detail` (`list-detail.test.ts`,
`list-detail-first-render.test.ts`, `list-detail-pass.test.ts`, `list-detail-upgrade.test.ts`,
`entry-list-detail.test.ts`, `browser/list-detail.test.ts`). `git diff 8d104af HEAD` on these files and on their
fixtures and scenarios (`fixtures/overflow-host.ts`, `fixtures/list-detail-controls.ts`, `scenarios/scroller.ts`,
`scenarios/list-detail.ts`, `browser/fixtures/scroller.html`, `browser/fixtures/list-detail*.html`) is empty. The
block-axis option's own bodies are in the mission's new files (`overflow-region-block.test.ts`,
`browser/overflow-region-block.test.ts`, `scenarios/overflow-block.ts`, `fixtures/overflow-host-block.ts`).

```text
 Test Files  18 passed (18)
      Tests  315 passed (315)
```

## Step 6: mutation of the mission's changed source

`gate:mutation -- --base 8d104af23ce177ec4acbbfaba59bf433f9520d6d --plan` cuts the mission's changed source into 43
shards (42 cuts within files), more than one run fits well inside the two-hour limit on a background command (phases 1
to 3 took 48, 43 and 42 minutes). So the run is three batches with `--files`, one per phase's files, each whole file
named once (its changed lines since the mission's base; whole-file entries cut nothing, so no mutant spans a cut):

| Batch | `--files` | Time | Summary line |
|---|---|---|---|
| A | `gates/bin/mutation.ts`, `gates/lib/mutation/report.ts`, `packages/elements/src/index.ts`, `packages/elements/src/ocelle-data-table.ts`, `packages/elements/src/overflow-region.ts` | 56 min 32 s | `mutation: 533 mutants on the changed lines of 5 files, none survived; 2 timeouts, 131 compile errors, 2 zero-mutant entries; 32 equivalent records` |
| B | `packages/elements/src/ocelle-event-timeline.ts`, `packages/elements/src/ocelle-timeline-event.ts`, `packages/elements/src/timeline-time.ts` | 23 min 26 s | `mutation: 149 mutants on the changed lines of 3 files, none survived; 4 timeouts, 19 compile errors, 0 zero-mutant entries; 10 equivalent records` |
| C | `packages/elements/src/ocelle-evidence-chain.ts`, `packages/elements/src/ocelle-evidence-step.ts` | 22 min 27 s | `mutation: 99 mutants on the changed lines of 2 files, none survived; 2 timeouts, 15 compile errors, 0 zero-mutant entries; 5 equivalent records` |

Every exit is 0: no mutant survives, and the equivalent records are those the phases' reviews accepted
(`reviews/phase-<N>/mutation.md`). The 8 timeouts (a timeout counts as killed): `ocelle-data-table.ts:258` (two
mutants), and the `disconnectedCallback` and `observe()` lines of the timeline (146, 147), the event (125, 126) and the
chain (189, 190), as phase 3's record explains for the chain. `gates/bin/mutation.ts` (a comment) and
`packages/elements/src/index.ts` (export lines) have no mutant on their changed lines. During batch A the kernel killed
one process for lack of memory (Stryker's concurrency on 4 cores, as in phase 2's run 1); Stryker replaced the worker
and the run completed with every mutant classified.
