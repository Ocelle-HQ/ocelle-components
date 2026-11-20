# Implementation Plan: The focus trap skips a closed `<details>`, and a button's icon adds nothing to its name

**Op**: `ops/022-focus-trap-details-icon-name` | **Date**: 2026-11-20 | **Spec**: [spec.md](spec.md) | **Record**: [op.md](op.md)
**Branch**: `claude/057-focus-trap-icon-a11y`

## Summary

Two small source fixes, each proven red first by browser scenario rows: `rendered()` in `focusable.ts` also
requires `checkVisibility()`; `ocelle-button`'s icon wrapper gets `aria-hidden="true"`, and its inner control, when
nothing on the host names it, is named from its label wrapper by `aria-labelledby` inside its shadow root (widened
by the operator's phase-1 decision 1, `operator-decisions.md`). Then README sentences, a CHANGELOG `### Fixed` entry
and the icon-slot comment are updated. `ocelle-action-row`'s icon wrapper was measured and has the same gap; it is
reported as a follow-up issue and not changed (phase-1 decision 2).

## Technical Context

- TypeScript (strict), Lit 3.3.3. Engine floor: Chromium 135 and WebKit 17.4. Both engines have
  `Element.checkVisibility()`, so no fallback is needed.
- The browser rows live in `packages/elements/test/scenarios/*.ts` and run through the existing suites (in process
  and on the strict-CSP fixture). `test/scenarios/drawer.ts` re-runs the dialog's row groups through
  `inheritedRows`, so a new dialog row group must be added to that list to cover the drawer.
- Accessibility reads use the driver's `ax`, `axSubtree` and `axState` (Chromium CDP; 012 research.md R-11).
  `meaningful()` in `test/scenarios/button.ts` drops the unnamed `generic` host node.
- Environment: run `pnpm run setup:offline` if `node_modules` is missing. Set
  `OCELLE_CHROMIUM_PATH=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome` for `pnpm test` (op 015). Run one
  heavy browser job at a time (`knowledge/speckit-flows/findings/frontend-missions.md`).
- Landing order: after #49 and #54. Rebase on main once they land. Conflicts in the CHANGELOG § Unreleased and the
  README are expected to be mechanical only.

## Files to change

| File | Change |
|---|---|
| `packages/elements/test/scenarios/dialog.ts` | Red: a new row group `detailsRows`, built with `cycleRows` (spec.md scenarios 1, 2, 4 and 5), returned from the builder with the other groups and added to the dialog's own row list. |
| `packages/elements/test/scenarios/drawer.ts` | Red: `...built.detailsRows` in `inheritedRows` (scenario 3). |
| `packages/elements/test/scenarios/button.ts` | Red: rows for scenarios 6, 7 and 8 in `buttonScenarios`, each ending with axe on its page, as the file's other rows do (red commit `d820f00`: scenario 6 in both modes, scenario 7 in the button mode). Second test-only commit: scenario 7 in the link mode (`<ocelle-button id="k" href="#x" label="Open project">` with the svg and no text), in a new row beside scenario 7's, with the same assertions; the rows of `d820f00` are not changed. |
| `packages/elements/src/focusable.ts` | Green: `rendered()` becomes `getClientRects().length > 0 && getComputedStyle(element).visibility === "visible" && element.checkVisibility()`. Its JSDoc says that the content of a closed `details` and of a `content-visibility: hidden` subtree is not rendered (op 022). |
| `packages/elements/src/ocelle-button.ts` | Green: `<span class="icon-slot" aria-hidden="true" ?hidden=${busy}>` in `content` (`:504`), the one template both modes share. In `updated()`, the inner control's `ariaLabelledByElements` is the resolved host references when there are any, otherwise the label wrapper (`.label`) when `#name()` gives no name, otherwise `null` (see *Approach*, *Icon name*). The header comment's name order (`:8`) and `#name()`'s JSDoc say that the content step is the label wrapper. |
| `packages/elements/src/icon-slot.ts` | The header comment's "No generated content, so the control's name is its label's" is corrected: the convention adds no generated content, but a slotted icon can still add to a name computed from the control's content; a control keeps its icon out of its name itself, as `ocelle-button` does (icon wrapper `aria-hidden="true"`, inner control named from its label wrapper). Comment only, no style change. |
| `packages/elements/README.md` | One sentence each in: the dialog's **Focus** paragraph (`:207-216`), after "elements that are not rendered are skipped": the content of a closed `<details>`, apart from its summary, is not rendered; the `ocelle-button` icon-slot bullet (`:786-790`): a slotted icon is decorative and adds nothing to the button's name, which comes from the default slot's text when nothing on the host names it, so name an icon-only button with `label`; the controls' **Name order** item (`:1031-1036`): for `ocelle-button`, "the element's content" is its default slot's text, and "slotted icons never contribute" is stated for `ocelle-button` only; § Slot convention **Naming** (`:1348-1350`): the convention adds no generated content, and `ocelle-button` keeps a slotted icon out of its name, without a promise for the other controls (Q1 A, phase-1 decision 2). |
| `packages/elements/CHANGELOG.md` | § Unreleased: a `### Fixed` section after `### Added` (or the existing one, if #49 or #54 adds it first), with two entries (below). |
| `ops/022-focus-trap-details-icon-name/reviews/phase-1/notes.md` (new) | The action-row measurement, the red-run reading, mutation results and anything recorded as equivalent. |

Not changed: `overlay.ts`, `ocelle-action-row.ts`, `ocelle-tooltip.ts`, `control.ts`, `spinner.ts`, any story,
baseline, token, `custom-elements.json` and every gate.

## Approach

### Focus trap

`walk()` calls `rendered()` for sequential stops (`focusable.ts:113` on main) and for scroll containers (`:146`).
Both calls get the new condition. `checkVisibility()` with no options returns false for an element that has no box,
or that is in a `content-visibility: hidden` subtree that is not relevant to the user. That is the case for the panel
of a closed `details` in Chromium. The existing `visibility` check stays, because `checkVisibility()` without
`visibilityProperty: true` ignores `visibility`. The two existing conditions stay first, so the cheap
`getClientRects()` test still runs first. `overlay.ts` is not touched: once the walk is right, `#tab` wraps at the
real ends (triage § Related work).

### Icon name

`aria-hidden="true"` on the wrapper removes the slotted icon, and anything slotted beside it, from the accessibility
tree: the `image` node goes. In Chromium 153 that is not enough. Phase 1 measured that a slotted bare svg's `<title>`
still adds to a name computed from the inner control's content (`Folder Open`), with `aria-hidden` on the wrapper, on
the slot or on both, while the same svg written inside the shadow root under `aria-hidden` is excluded
(`reviews/phase-1/notes.md`). So the content step of the name no longer reads the whole control: it reads the label
wrapper only (operator, phase-1 decision 1).

The name order stays: host `aria-labelledby`, host `aria-label`, `label`, then the content, now the label wrapper.
`updated()` already sets `ariaLabelledByElements` on the inner control from the resolved host references, and setting
it to `null` removes any `aria-labelledby` attribute, so the relation is set there and not in the template:

- resolved host `aria-labelledby` references: those elements (unchanged);
- none, and `#name()` returns no name (no host `aria-label`, no non-blank `label`): `[label wrapper]`, the
  `<span class="label">` of the same render;
- otherwise `null` (unchanged), so the `aria-label` of `#name()` names the control. A relation to the label wrapper
  here would override `aria-label` (accname step 2B before 2C) and give a `label`-only button an empty name;
  scenario 7 kills that mutant in both modes.

The label wrapper and the inner control are in one shadow root, so no ID reference crosses a shadow root
(constitution III), and element reflection needs no `id`. Chromium computes the referenced wrapper's text from its
flat-tree content, so default-slot text and a slotted element's text and name keep naming the control, as the
existing button rows pin. No attribute, property, slot, part or event is added, so `custom-elements.json` does not
change (patch).

`#name()` reads only the host's `aria-label` and `label`, never the icon slot, so no name a host can rely on is lost.
An icon-only button with no `label` and nothing on the host has an empty label wrapper as its name source; its name
is not guaranteed (spec.md § Edge Cases), the README says to name it with `label`, and axe's `button-name` rule
reports it. No row asserts its name. The spinner (`spinner(busy)`) sits outside the label wrapper; its drawing is
`aria-hidden`, so a busy button's name is unchanged.

### CHANGELOG entries

```markdown
### Fixed

- `ocelle-dialog` and `ocelle-drawer`: a link or other focusable element inside a closed `<details>` is no longer
  counted as a Tab stop, so Tab from the summary of a closed `<details>` at the end of the panel wraps to the panel's
  first stop instead of leaving the dialog (op 022, #57).
- `ocelle-button`: an icon in the `icon` slot is hidden from the accessibility tree, and a button that is not named
  by `aria-labelledby`, `aria-label` or `label` is named by its default slot's text alone, so a bare `<svg>` with a
  `<title>` no longer adds its title to the button's name, in the button and the link mode. Name an icon-only button
  with `label` (op 022, #57).
```

### Action-row measurement (Q2 A)

During the red step, add a temporary row to `test/scenarios/action-row.ts` (or run a one-off probe through the
driver) with `<ocelle-action-row id="r"><svg slot="icon" viewBox="0 0 16 16"><title>Folder</title><path d="…"/></svg>Open project</ocelle-action-row>`.
Read `axState("r", "[part=control]")` and the row's `axSubtree`. Record the inner control's name, and whether an
`image` node or a node named `Folder` appears, in `reviews/phase-1/notes.md` with the command and the raw output. Then
remove the probe: it is never committed, so it is no failing body and no passing body that would claim a behaviour
this op does not own. Report the result in the phase's report to the operator.

**Result and decision.** The row has the same gap: its inner control is named `Folder Open project` in the button and
the link mode (`reviews/phase-1/notes.md`). The operator decided (phase-1 decision 2) that `ocelle-action-row.ts`
stays unchanged in this op; the phase report gives the measurement to the orchestrator for a separate issue.

## Test approach (red first)

Rows are numbered by spec.md scenario.

All rows go in one test-only commit (`test(op-022): phase 1 red`, signed off). Run `red.sh 1 phase` on it. Read
`red-phase.log` for:

- **Row 1**, spec.md scenario 1 (closed `details` at the end, Tab, dialog and drawer): in Chromium, it fails on the focus path. The body
  (`body`) appears where the close control is expected, which is the missing behaviour.
- **Row 2** (Shift+Tab from the close control): in Chromium on main, the trap moves focus to the last stop of the
  walk, the hidden link. Expected: the summary. The log shows whichever wrong target the engine gives.
- **Rows 6 and 7** (button): they fail on the subtree: an `image` node named `Folder` is present, and row 6's name
  includes `Folder`. If row 6 or row 7 **passes** on main, it does not belong in the red commit: remove it before
  `red.sh`, record the measurement in `notes.md` and in `op.md`, treat the icon half as **none** for this op, and
  tell the operator (triage § What would change this decision). Do not make the source change then.
- **Rows 4, 5 and 8** pass on main. They are in the red commit because they belong to the story (as op 016's pins
  did). They pin that `checkVisibility()` hides no open panel and no stop between real stops, and that the icon fix
  takes no name a host can rely on.
- **Scenario 7, link mode** (phase-1 decision 1): not in the red commit, which stays as it is. It is added in a
  second commit that changes only `test/scenarios/button.ts`, before the `updated()` change. Run the button suite at
  that commit, with no source change on top of it (a clean worktree), and save the output as
  `reviews/phase-1/red-widen.log`: the link-mode row fails on the `image` node (and the `Folder` node), the missing
  behaviour. Do not rerun `red.sh 1 phase`: it would replace the recorded red commit. The pre-review check against the
  phase base covers the row like every other.
- In WebKit, rows 1 and 2 may already pass on main (see spec.md § Edge Cases). The run is red because of Chromium.
  That is enough for `red.sh`, which checks the run's exit code, and the log must show the Chromium failure.

No row may fail because of a setup error: a selector that matches nothing, a missing export or a fixture that does
not load. Rows use the existing `cycleRows`, `presses`, `state`, `ax`, `axState` and `severe` helpers. No new driver
command is needed. If one is needed after all, it is a test file and goes in the same commit.

Green: the `rendered()` condition, the `aria-hidden` attribute and the `updated()` relation, then the full `pnpm test`, `gate:typecheck`, `gate:lint`, `gate:test-lint` and
`gate:mutation -- --base <phase base>`. The mutant that removes `&& element.checkVisibility()` (or replaces it with
`true`) is killed by row 1. A Stryker mutant of the `aria-hidden` string, if Stryker generates one inside a Lit
template, is killed by rows 6 and 7. In `updated()`, a mutant that drops the fallback to the label wrapper is killed
by row 6 (the name gains `Folder`), and one that sets the relation even when `#name()` gives a name is killed by row 7
in both modes (the name loses `Open project`). A survivor is killed with a stricter row, or recorded as equivalent with a true
reason in `notes.md`. Plants: `pnpm run gate:plants -- --affected $(cat ops/022-focus-trap-details-icon-name/reviews/phase-1/base.sha)`,
saved in `reviews/phase-1/plants.md`. No visual change is expected, so no baselines are produced. If a visual plant
or story shows a change, stop: baselines are made only in #10's pinned container under docker, and only with the
operator's say.

## Constitution Check

| Principle | Status |
|---|---|
| I Framework-free elements | Pass. No new name, event, slot or part. The manifest is unchanged. |
| II Tokens only | Pass. No style change. |
| III Accessible by construction | Pass, and this is the point of the op. The modal Tab cycle wraps at its real ends, and the button's name is its label. The new `aria-labelledby` relation joins two nodes of one shadow root by element reflection, so no ID reference crosses a shadow root. axe runs on every new button row. |
| IV Strict CSP | Pass. One attribute in a template, one call in a function and one element-reflection assignment. No inline style or script. |
| V Storybook and tests | Pass. No visual change, so no story or baseline changes. Behaviour is proven by browser rows for every keyboard path the op touches. |
| VI Consumer needs | Pass. #57 comes from mission 020's consumer work, and the fixes restore documented behaviour. |
| VII Semver | Patch. No surface change. The CHANGELOG gets `### Fixed`. |
| VIII Test-first | Pass. One test-only red commit, recorded by `red.sh`. Each red row fails on main for the missing behaviour. Mutation testing covers both changed lines. |

No Complexity Tracking entry.

## Stop conditions

- The red rows show that `overlay.ts` must change, or that `inert`, `hidden="until-found"` or a closed `ocelle-*`
  disclosure need their own behaviour. Then write this in `op.md` and tell the operator it is a mission.
- The button rows pass on main. Then the icon half is **none** (see *Test approach*).
- With the `updated()` relation in place, Chromium still adds the slotted svg's title to the name, or default-slot
  text no longer names the control (an existing button row turns red). Then do not loosen a row: record the
  measurement in `notes.md` and tell the operator.
- #49 or #54 already fix either defect when the op rebases. Then that half is **none** or a fold, citing the commit.
