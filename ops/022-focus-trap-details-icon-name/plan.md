# Implementation Plan: The focus trap skips a closed `<details>`, and a button's icon adds nothing to its name

**Op**: `ops/022-focus-trap-details-icon-name` | **Date**: 2026-11-20 | **Spec**: [spec.md](spec.md) | **Record**: [op.md](op.md)
**Branch**: `claude/057-focus-trap-icon-a11y`

## Summary

Two one-line source fixes, each proven red first by browser scenario rows: `rendered()` in `focusable.ts` also
requires `checkVisibility()`, and `ocelle-button`'s icon wrapper gets `aria-hidden="true"`. Then README sentences,
a CHANGELOG `### Fixed` entry and the icon-slot comment are updated. `ocelle-action-row`'s icon wrapper is measured
and reported, not changed.

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
| `packages/elements/test/scenarios/button.ts` | Red: rows for scenarios 6, 7 and 8 in `buttonScenarios`, each ending with axe on its page, as the file's other rows do. |
| `packages/elements/src/focusable.ts` | Green: `rendered()` becomes `getClientRects().length > 0 && getComputedStyle(element).visibility === "visible" && element.checkVisibility()`. Its JSDoc says that the content of a closed `details` and of a `content-visibility: hidden` subtree is not rendered (op 022). |
| `packages/elements/src/ocelle-button.ts` | Green: `<span class="icon-slot" aria-hidden="true" ?hidden=${busy}>` in `content` (`:504`), the one template both modes share. |
| `packages/elements/src/icon-slot.ts` | The header comment's "No generated content, so the control's name is its label's" also says that the control hides its icon wrapper from the accessibility tree (`aria-hidden="true"`), as `ocelle-button` and the action row's trailing wrapper do. Comment only, no style change. |
| `packages/elements/README.md` | One sentence each in: the dialog's **Focus** paragraph (`:207-216`), after "elements that are not rendered are skipped": the content of a closed `<details>`, apart from its summary, is not rendered; the `ocelle-button` icon-slot bullet (`:786-790`): a slotted icon is decorative and adds nothing to the button's name, so name an icon-only button with `label`; § Slot convention (`:1320-1345`): the same for `ocelle-button`, without a promise for the other controls (Q1 A). |
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
tree. That includes an `ocelle-icon` with a `label`. The README already says to name an icon-only button with
`label`, and `#name()` reads only the host's `aria-label` and `label`, never the icon slot. So no name a host can rely
on is lost. An icon-only button without a `label` was named by its icon's `label` on main, and it now has no name.
The README sentence states this. axe's `button-name` rule reports such a button, and that is the intended contract.
The spinner (`spinner(busy)`) sits outside the wrapper and is unaffected.

### CHANGELOG entries

```markdown
### Fixed

- `ocelle-dialog` and `ocelle-drawer`: a link or other focusable element inside a closed `<details>` is no longer
  counted as a Tab stop, so Tab from the summary of a closed `<details>` at the end of the panel wraps to the panel's
  first stop instead of leaving the dialog (op 022, #57).
- `ocelle-button`: an icon in the `icon` slot is hidden from the accessibility tree, so a bare `<svg>` with a
  `<title>` no longer adds its title to the button's name. Name an icon-only button with `label` (op 022, #57).
```

### Action-row measurement (Q2 A)

During the red step, add a temporary row to `test/scenarios/action-row.ts` (or run a one-off probe through the
driver) with `<ocelle-action-row id="r"><svg slot="icon" viewBox="0 0 16 16"><title>Folder</title><path d="…"/></svg>Open project</ocelle-action-row>`.
Read `axState("r", "[part=control]")` and the row's `axSubtree`. Record the inner control's name, and whether an
`image` node or a node named `Folder` appears, in `reviews/phase-1/notes.md` with the command and the raw output. Then
remove the probe: it is never committed, so it is no failing body and no passing body that would claim a behaviour
this op does not own. Report the result in the phase's report to the operator. If the gap is there, the operator
decides between the same one-attribute fix in this op (still patch, then test-first in a review-round red commit) and
a new issue.

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
- In WebKit, rows 1 and 2 may already pass on main (see spec.md § Edge Cases). The run is red because of Chromium.
  That is enough for `red.sh`, which checks the run's exit code, and the log must show the Chromium failure.

No row may fail because of a setup error: a selector that matches nothing, a missing export or a fixture that does
not load. Rows use the existing `cycleRows`, `presses`, `state`, `ax`, `axState` and `severe` helpers. No new driver
command is needed. If one is needed after all, it is a test file and goes in the same commit.

Green: the two source lines, then the full `pnpm test`, `gate:typecheck`, `gate:lint`, `gate:test-lint` and
`gate:mutation -- --base <phase base>`. The mutant that removes `&& element.checkVisibility()` (or replaces it with
`true`) is killed by row 1. A Stryker mutant of the `aria-hidden` string, if Stryker generates one inside a Lit
template, is killed by rows 6 and 7. A survivor is killed with a stricter row, or recorded as equivalent with a true
reason in `notes.md`. Plants: `pnpm run gate:plants -- --affected $(cat ops/022-focus-trap-details-icon-name/reviews/phase-1/base.sha)`,
saved in `reviews/phase-1/plants.md`. No visual change is expected, so no baselines are produced. If a visual plant
or story shows a change, stop: baselines are made only in #10's pinned container under docker, and only with the
operator's say.

## Constitution Check

| Principle | Status |
|---|---|
| I Framework-free elements | Pass. No new name, event, slot or part. The manifest is unchanged. |
| II Tokens only | Pass. No style change. |
| III Accessible by construction | Pass, and this is the point of the op. The modal Tab cycle wraps at its real ends, and the button's name is its label. axe runs on every new button row. |
| IV Strict CSP | Pass. One attribute in a template and one call in a function. No inline style or script. |
| V Storybook and tests | Pass. No visual change, so no story or baseline changes. Behaviour is proven by browser rows for every keyboard path the op touches. |
| VI Consumer needs | Pass. #57 comes from mission 020's consumer work, and the fixes restore documented behaviour. |
| VII Semver | Patch. No surface change. The CHANGELOG gets `### Fixed`. |
| VIII Test-first | Pass. One test-only red commit, recorded by `red.sh`. Each red row fails on main for the missing behaviour. Mutation testing covers both changed lines. |

No Complexity Tracking entry.

## Stop conditions

- The red rows show that `overlay.ts` must change, or that `inert`, `hidden="until-found"` or a closed `ocelle-*`
  disclosure need their own behaviour. Then write this in `op.md` and tell the operator it is a mission.
- The button rows pass on main. Then the icon half is **none** (see *Test approach*).
- #49 or #54 already fix either defect when the op rebases. Then that half is **none** or a fold, citing the commit.
