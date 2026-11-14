# Phase 2 notes: User Story 1, a modal dialog

## Measurements (T013, T014) and operator decisions

`measure.md` holds T013 (manifest inheritance), T014 (the opaque-content and positive-`tabindex` lists) and the
repeated-Escape investigation. Operator decisions taken during the phase (fixes-4 to fixes-6): the sentinel wrap;
manifest "analyse, then drop it"; Tab inside a nested native modal is the platform's (measured lists); the long-body
story's scroll-edge block; the repeated-Escape row's warm-up.

## Scaffold and red (T020)

- Scaffold `6711652` (`scaffold.sha`): `src/focusable.ts`, `src/overlay.ts`, `src/ocelle-dialog.ts` with their
  signatures and no behaviour, not defined and not exported from the root.
- Red commit `cdc4698` (amended once before green; `red-commits`), test files only; `red.sh 2 phase`: `tests_only`
  true, `red` true. Log: `red-phase.log`, 548 of 3688 tests failed:
  - every row of the shared dialog bodies, in process (234) and on the fixture (235), by assertion or by a bounded
    poll that names the missing event ("2 events not recorded within 1 000 ms"), or the missing close control
    ("no [part="close-button"] in #dlg"): `ocelle-dialog` is not defined;
  - the before-definition case (no definition after the bounded wait), the entry test, the export keys;
  - the manifest tests (no dialog entry, the generator not reading `src/overlay.ts`), the README and CHANGELOG
    fragments (45), the dist and pack lists (3 + 1);
  - the 16 dialog story tests and the gate story counts (`storybook-build` 29 stories, `axe` and `visual` 58
    story-themes, the 58 baseline files);
  - the manifest gate's repository runs (`gates/test/manifest.test.ts` × 2, `gates/test/integration/manifest.test.ts`),
    which were then red because the scaffold's module was not in the committed manifest; their count of checked
    elements is updated to 3 in commit `3c3d275`.
- The first red run (before the amend) showed TypeErrors in ten style rows (an absent part read as `undefined`), a
  15 s hang of the before-definition test (an unbounded `whenDefined`) and two nested-modal rows that passed (they
  asserted only the platform's lists); the amend made the stand-in's `inspect` return empty attributes and styles for an
  absent part, bounded the wait to 1 000 ms, and added the top-layer order to the nested-modal rows.

## Green (T021 to T025)

- `vitest run` of `elements`, `elements-touch`, `elements-node`, `elements-browser`, `elements-build`: 891 passed.
- `gate:typecheck`, `gate:lint`, `gate:style-lint`, `gate:test-lint`, `gate:manifest` (3 elements), `gate:csp`,
  `gate:prefix`, `gate:config-copies`: no finding.
- One red test moved, assertions unchanged (green commit body): the repeated-Escape case runs on a page of its own in
  each harness, since after the other rows of the in-process page the platform's second `cancel` stayed cancelable
  despite the warm-up.
- The empty-heading note of axe on the host-`aria-label` story (minor) made the axe gate test's note count 12; the
  heading is now `hidden` while `label` is empty, and the close control keeps its place (`margin-inline-start: auto`)
  (fix commit after green).
- Two count tests R-16 decision D did not list, updated by hand (count only): the manifest gate's repository runs
  (3 elements) and the axe gate's unlabelled-button plant run (60 story-themes, the repository's 58 and the plant's 2).

## Mutation (T025)

`gate:mutation -- --base cc18f84` (both configurations), report in `mutation.log`: 139 findings in the element
source, 1232 mutants on changed lines, 225 timeouts, 438 compile errors.

| File | Survived | NoCoverage | Timeout (report lines) |
|---|---|---|---|
| `src/overlay.ts` | 61 | 24 | 158 |
| `src/focusable.ts` | 35 | 18 | 67 |
| `scripts/manifest.ts` | 1 | 0 | 0 |

The gate files whose Stryker comments were renamed (58 story-themes) have no mutant on the changed lines. The
findings are blocking (constitution VIII) and are not yet killed; T025 stays open. Causes of the timeouts, by
inspection of the lines: most are mutants that remove or invert a Tab-cycle or Escape decision, so the rows' bounded
polls and per-press settles run long rather than failing at once (each dialog row presses keys up to eight times and
waits up to 1 000 ms for events), plus mutants of the walk's loops (`focusable.ts`). Not yet analysed per line.

## Stories and baselines (T028, T029)

- `storybook/stories/dialog.stories.ts`: eight stories; the long-body story's `dialog-scroll-edge` block, sized by
  `storybook/.storybook/stories-layout.css`. Footer actions are slotted buttons.
- Baselines produced in the pinned container with `pnpm run visual:update` (docker): 16 files added, none changed or
  removed; a second run wrote 0 files. No cross-engine (podman) comparison was possible in this container: only docker
  is available (`gate:visual` reports "docker only: no cross-engine comparison"). CI's captures win over these.
- `gate:visual`: 58 captures match. `gate:axe`: 58 story-theme runs, 0 serious or critical, 10 notes (the excepted
  prose-document ones). `gate:storybook-build`: built 29 stories.
- `fail-token-changed` (`gates/plants/visual/fail-token-changed/plant.json`): measured in the pinned container by
  `gate:plants -- --shard 16` before the lines were added (8 unexpected `differs`, every dialog story in light), then
  the eight lines added; shard 16 then judged every plant as expected. Shards 19 (`visual/pass-repository`) and 27
  (`axe/pass-repository`) also judged every plant as expected. The full `gate:plants` was not run (longer than the
  session limit), so the other shards, among them the manifest plants of the changed generator, are left to CI.
- `storybook` and `storybook-integration` projects: 148 passed. `gates-integration` story-count, axe, visual and
  manifest tests and the `gates`, `tokens`, `styles` unit projects: passed.
