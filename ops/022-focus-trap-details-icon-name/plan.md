# Implementation Plan: The focus trap skips a closed `<details>`, and a button's icon adds nothing to its name

**Op**: `ops/022-focus-trap-details-icon-name` | **Date**: 2026-11-20 | **Spec**: [spec.md](spec.md) | **Record**: [op.md](op.md)
**Branch**: `claude/057-focus-trap-icon-a11y`

## Summary

Two small source fixes, each proven red first by browser scenario rows: `rendered()` in `focusable.ts` also
requires `checkVisibility()` (and, after the operator round from the landing review, `reviews/phase-1/round-2.md`,
drops its implied `getClientRects()` test and also gates the walk's opaque candidates, O2-01 and O2-04); `ocelle-button`'s icon wrapper gets `aria-hidden="true"`, and its inner control, when
an icon is slotted and nothing on the host names it, is named from its label wrapper by `aria-labelledby` inside its
shadow root (widened by the operator's phase-1 decision 1 and narrowed to slotted icons by decision 7,
`operator-decisions.md`). Then README sentences, a CHANGELOG `### Fixed` entry
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
| `packages/elements/test/scenarios/button.ts` | Red: rows for scenarios 6, 7 and 8 in `buttonScenarios`, each ending with axe on its page, as the file's other rows do (red commit `d820f00`: scenario 6 in both modes, scenario 7 in the button mode). Second test-only commit (`f5b0bdf`): scenario 7 in the link mode (`<ocelle-button id="k" href="#x" label="Open project">` with the svg and no text), in a new row beside scenario 7's, with the same assertions; the rows of `d820f00` are not changed. Third test-only commit (phase-1 decision 7): new rows for scenarios 9 and 10, in both modes; no existing row is changed. |
| `packages/elements/src/focusable.ts` | Green: `rendered()` becomes `getClientRects().length > 0 && getComputedStyle(element).visibility === "visible" && element.checkVisibility()`. Its JSDoc says that the content of a closed `details` and of a `content-visibility: hidden` subtree is not rendered (op 022). Round 2 (O2-01, O2-04): `rendered()` becomes `getComputedStyle(element).visibility === "visible" && element.checkVisibility()`, with the Stryker disable comment of the dropped test removed; the opaque branch of `walk()` counts an opaque host only when it is rendered, by the check of *Approach*, *Opaque content*. The JSDoc of `rendered()` and of the branch say so. |
| `packages/elements/test/scenarios/dialog.ts` (round 2) | Red (`red.sh 1 fix-2`): rows for spec.md scenarios 11 and 12 in `detailsRows`, so the drawer inherits them; a pin row for a rendered `display: contents` opaque host (see *Test approach*, *Round 2*). |
| `packages/elements/README.md` (round 2) | O2-02: the **Name order** item's "slotted icons never contribute to `ocelle-button`'s name" is scoped to a button named by its label (the default slot's text), `label` or the host. The `readme.test.ts` pin (`… and otherwise the element's content; slotted icons never contribute`) stays contiguous and unchanged; the condition goes after it. |
| `packages/elements/src/ocelle-button.ts` | Green: `<span class="icon-slot" aria-hidden="true" ?hidden=${busy}>` in `content` (`:504`), the one template both modes share, and a `@slotchange` listener on its `<slot name="icon">` that reads whether the slot has assigned content into a private field and requests an update, as `#readLabel` does for the default slot. In `updated()`, the inner control's `ariaLabelledByElements` is the resolved host references when there are any, otherwise the label wrapper (`.label`) when the icon slot has assigned content and `#name()` gives no name, otherwise `null` (see *Approach*, *Icon name*). The header comment's name order (`:8`) and `#name()`'s JSDoc say that the content step is the label wrapper when an icon is slotted. |
| `packages/elements/src/icon-slot.ts` | The header comment's "No generated content, so the control's name is its label's" is corrected: the convention adds no generated content, but a slotted icon can still add to a name computed from the control's content; a control keeps its icon out of its name itself, as `ocelle-button` does (icon wrapper `aria-hidden="true"`, inner control named from its label wrapper). Comment only, no style change. |
| `packages/elements/README.md` | One sentence each (two in the icon-slot bullet, the second the known limitation of *Approach*, *Icon name*) in: the dialog's **Focus** paragraph (`:207-216`), after "elements that are not rendered are skipped": the content of a closed `<details>`, apart from its summary, is not rendered; the `ocelle-button` icon-slot bullet (`:786-790`): a slotted icon is decorative and adds nothing to the button's name, which comes from the default slot's text when nothing on the host names it, so name an icon-only button with `label`; the controls' **Name order** item (`:1031-1036`): for `ocelle-button`, "the element's content" is its default slot's text, and "slotted icons never contribute" is stated for `ocelle-button` only; § Slot convention **Naming** (`:1348-1350`): the convention adds no generated content, and `ocelle-button` keeps a slotted icon out of its name, without a promise for the other controls (Q1 A, phase-1 decision 2). |
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
`visibilityProperty: true` ignores `visibility`. Phase 1 first kept the `getClientRects()` test in front as a cheap short-circuit. Round 2 (O2-04) drops it: `getClientRects().length > 0` is implied by `checkVisibility()` (false for an element with no box,
the only element whose client rects are empty, CSSOM), and its equivalent-mutant record also disabled the line's
non-equivalent mutants. It is dropped, at the cost of one style read per element with no box; `rendered()` is the
`visibility` test and `checkVisibility()`. `overlay.ts` is not touched: once the walk is right, `#tab` wraps at the
real ends (triage § Related work).

### Opaque content (round 2, O2-01)

`walk()` pushes an opaque host (`isOpaque`: a custom element whose `shadowRoot` reads null) as a candidate with no
rendering check. Inside a closed `details` it is then the cycle's last candidate, `overlay.ts` treats it as opaque
content and lets Tab run natively, the engine skips the hidden content and focus lands on the page body: the defect
of #57 (landing review L1-01, measured with a closed-shadow host and with `<x-probe><a href="#x">L</a></x-probe>`).
The opaque branch therefore requires the host to be rendered before it pushes the candidate. `overlay.ts` stays
unchanged (FR-002).

`checkVisibility()` on the host alone is wrong for a `display: contents` host: it has no box but is legitimate, and
its content renders. So the check is:

- a host whose computed `display` is not `contents`: `rendered(host)`;
- a host whose computed `display` is `contents`: its own computed `visibility` is `visible`, and the box-dependent part
  (`checkVisibility()`) is read where its content is rendered, for example on the nearest flat-tree ancestor that has
  a box. The implementer measures, in Chromium, that the chosen reading is false for such a host inside a closed
  `details` and true for one in an open `details` and in an ordinary body; if no reading gives both, stop (see *Stop
  conditions*).

Opaque content that is not a host (`<iframe>`, media with `controls`) already goes through `rendered()` as a stop, so
it is unchanged. The scroller branch keeps `!isOpaque(html)`.

### Icon name

`aria-hidden="true"` on the wrapper removes the slotted icon, and anything slotted beside it, from the accessibility
tree: the `image` node goes. In Chromium 153 that is not enough. Phase 1 measured that a slotted bare svg's `<title>`
still adds to a name computed from the inner control's content (`Folder Open`), with `aria-hidden` on the wrapper, on
the slot or on both, while the same svg written inside the shadow root under `aria-hidden` is excluded
(`reviews/phase-1/notes.md`). Chromium 156 gives the same name with `aria-hidden` alone (re-measured at
T008, phase-1 decision 6). So, when an icon is slotted, the content step of the name no longer reads the whole
control: it reads the label wrapper only (operator, phase-1 decisions 1 and 7).

Relating every content-named control to its label wrapper (the first plan) keeps every name but turns 14 existing
button rows red, 7 per suite (US1-6/US1-7, the four US1-12 rows, link.ts US2-12 and the href-values edge case), each
only on axe's `label-content-name-mismatch` (incomplete, serious) for a one-character content (`S`, `P`): axe checks
that rule only on a control named by `aria-label` or `aria-labelledby`, and asks for review when the text is one
character. A probe that relates only when the icon slot has assigned content passes all 227 button rows
(`reviews/phase-1/notes.md`). The operator chose that condition and keeps every existing row as it is (decision 7).

The name order stays: host `aria-labelledby`, host `aria-label`, `label`, then the content, now the label wrapper.
`updated()` already sets `ariaLabelledByElements` on the inner control from the resolved host references, and setting
it to `null` removes any `aria-labelledby` attribute, so the relation is set there and not in the template:

- resolved host `aria-labelledby` references: those elements (unchanged);
- none, the icon slot has assigned content, and `#name()` returns no name (no host `aria-label`, no non-blank
  `label`): `[label wrapper]`, the `<span class="label">` of the same render;
- otherwise `null` (unchanged). With `#name()` giving a name, the `aria-label` of `#name()` names the control: a
  relation to the label wrapper there would override `aria-label` (accname step 2B before 2C) and give a `label`-only
  button an empty name. With no icon, the control is named from its content as on main, so no axe
  `label-content-name-mismatch` check applies to it.

**Following the icon slot.** Whether the icon slot has assigned content is read in a `slotchange` listener on
`<slot name="icon">` (`assignedElements({ flatten: true }).length > 0`; only elements can be assigned to a named slot),
kept in a private field, and followed by `requestUpdate()`, so `updated()` sets or clears the relation. `slotchange`
fires when the slot first gets its assigned nodes after the first render, and again whenever an icon is slotted or
removed later (scenarios 9 and 10), as `#readLabel` relies on for the default slot. The first render therefore has no
relation for a moment, which is the same as main; the update that follows the first `slotchange` sets it. While busy,
the icon stays assigned (only its wrapper is hidden), so the relation stays.

The label wrapper and the inner control are in one shadow root, so no ID reference crosses a shadow root
(constitution III), and element reflection needs no `id`. Chromium computes the referenced wrapper's text from its
flat-tree content, so default-slot text and a slotted element's text and name keep naming the control, as the
existing button rows pin. No attribute, property, slot, part or event is added, so `custom-elements.json` does not
change (patch).

`#name()` reads only the host's `aria-label` and `label`, never the icon slot, so no name a host can rely on is lost.
An icon-only button with no `label` and nothing on the host is related to an empty label wrapper; Chromium 156 still
names it from its content (for example `Folder`), and axe reports `button-name` (critical). Its name is not
guaranteed (spec.md § Edge Cases), the README says to name it with `label`, and no row asserts its name.

**Known limitation** (decision 7). A slotted icon beside a one-character text label, with nothing on the host naming
the button, gives the correct name, but axe reports `label-content-name-mismatch` as incomplete (serious) for it, the
same result as the 14 rows above. No row and no story has this combination (the stories slot an icon beside
`Projects`, `Open project` or with `label="Close"`), so constitution III's "no serious or critical finding on any
story" still holds. The README's `ocelle-button` icon-slot bullet and the CHANGELOG entry say so; no row asserts it. The spinner (`spinner(busy)`) sits outside the label wrapper; its drawing is
`aria-hidden`, so a busy button's name is unchanged.

### CHANGELOG entries

```markdown
### Fixed

- `ocelle-dialog` and `ocelle-drawer`: a link or other focusable element inside a closed `<details>` is no longer
  counted as a Tab stop, so Tab from the summary of a closed `<details>` at the end of the panel wraps to the panel's
  first stop instead of leaving the dialog (op 022, #57).
- `ocelle-button`: an icon in the `icon` slot is hidden from the accessibility tree, and a button with a slotted icon
  that is not named by `aria-labelledby`, `aria-label` or `label` is named by its default slot's text alone, so a
  bare `<svg>` with a `<title>` no longer adds its title to the button's name, in the button and the link mode. Name
  an icon-only button with `label`. Known limitation: with a slotted icon and a one-character text label, axe reports
  `label-content-name-mismatch` as needing review; the button's name is correct (op 022, #57).
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
- **Scenarios 9 and 10** (phase-1 decision 7): added in a third commit that changes only `test/scenarios/button.ts`,
  before the `ocelle-button.ts` change, with the uncommitted source work left out of it. Each row mounts the button with
  the svg (with an `id`) out of or in the icon slot, then moves it in (scenario 9) or out (scenario 10) with
  `driver.setAttribute(<svg id>, "slot", …)`, as US1-7/US1-8's icon-only row moves its label, before reading. No new
  driver command is needed. Run the button suite at that commit in a clean worktree and save the output as
  `reviews/phase-1/red-slot.log`: scenario 9's rows fail on the `image` node (and the `Folder` node), the missing
  behaviour; scenario 10's rows pass. Do not rerun `red.sh 1 phase`.
- **Round 2** (O2-01; operator round, `reviews/phase-1/round-2.md`): the rows of spec.md scenarios 11 and 12 go in
  `detailsRows` (dialog; the drawer inherits them through `inheritedRows`): the closed `details` holding
  `<ocelle-test-closed id="xc">` and holding `<x-probe><a href="#x">L</a></x-probe>`, Tab from the summary (expected
  `dlg[button] b1 s dlg[button] b1`; the landing review measured `body dlg[button] b1 s body`), and the same with the
  `details` open, Tab from the summary entering the opaque content. Add a pin row with a rendered `display: contents`
  opaque host (in an ordinary body or an open `details`) that keeps it a candidate; it passes on main, and it kills
  the mutant that drops the `display: contents` case. They go in one test-only commit
  (`test(op-022): phase 1 review round 2 red`, signed off), run with `red.sh 1 fix-2`, which must report
  `"recorded": true`; the closed-`details` Tab rows fail on the focus path (`body` in it), not on setup. If either
  opaque case already passes on main, record the measurement and tell the operator.
- **Round 2 mutation** (O2-04): with the `getClientRects()` test and its Stryker disable comment gone, `gate:mutation`
  on the changed lines leaves no survivor and no new equivalent record in `rendered()` or the opaque branch. The
  mutants that replace the opaque rendering check with `true` are killed by scenario 11's rows; with `false`, by the
  existing opaque rows (`opaqueRows`, `opaquePairRows`, `opaqueMoreRows`) and scenario 12; the `display: contents`
  case by the pin row. The `notes.md` equivalent-mutant record for the dropped line is marked superseded.
- In WebKit, rows 1 and 2 may already pass on main (see spec.md § Edge Cases). The run is red because of Chromium.
  That is enough for `red.sh`, which checks the run's exit code, and the log must show the Chromium failure.

No row may fail because of a setup error: a selector that matches nothing, a missing export or a fixture that does
not load. Rows use the existing `cycleRows`, `presses`, `state`, `ax`, `axState` and `severe` helpers. No new driver
command is needed. If one is needed after all, it is a test file and goes in the same commit.

Green: the `rendered()` condition, the `aria-hidden` attribute, the icon-slot listener and the `updated()` relation,
then the full `pnpm test`, `gate:typecheck`, `gate:lint`, `gate:test-lint` and
`gate:mutation -- --base <phase base>`. The mutant that removes `&& element.checkVisibility()` (or replaces it with
`true`) is killed by row 1. A Stryker mutant of the `aria-hidden` string, if Stryker generates one inside a Lit
template, is killed by rows 6 and 7. In `updated()` and the icon-slot listener:

- dropping the fallback to the label wrapper, negating the icon condition or replacing it with `false`: row 6 (the
  name gains `Folder`);
- dropping the icon condition or replacing it with `true` (relate whenever `#name()` gives no name): the existing
  US1-6/US1-7, US1-12, link.ts US2-12 and href-values rows (axe `label-content-name-mismatch` on `S` and `P`);
- setting the relation even when `#name()` gives a name: row 7 in both modes (the name loses `Open project`);
- removing the icon slot's `@slotchange` listener, emptying it or dropping its `requestUpdate()`: row 9 (the icon
  slotted later adds `Folder`), and row 6 too if nothing else reads the slot;
- a listener that only ever sets the field (`||`, `true`): row 10 (the stale relation gives axe's result for `S`);
- `flatten: true` to `false`: observable only for an icon slot fed by another slot with nothing assigned; kill it
  with a stricter row or record it as equivalent with that reason.

A survivor is killed with a stricter row, or recorded as equivalent with a true
reason in `notes.md`. Plants: `pnpm run gate:plants -- --affected $(cat ops/022-focus-trap-details-icon-name/reviews/phase-1/base.sha)`,
saved in `reviews/phase-1/plants.md`. No visual change is expected, so no baselines are produced. If a visual plant
or story shows a change, stop: baselines are made only in #10's pinned container under docker, and only with the
operator's say.

## Constitution Check

| Principle | Status |
|---|---|
| I Framework-free elements | Pass. No new name, event, slot or part. The manifest is unchanged. |
| II Tokens only | Pass. No style change. |
| III Accessible by construction | Pass, and this is the point of the op. The modal Tab cycle wraps at its real ends, also when a closed `details` holds opaque content (round 2), and the button's name is its label. The new `aria-labelledby` relation joins two nodes of one shadow root by element reflection, so no ID reference crosses a shadow root, and it is set only when an icon is slotted, so no existing row or story gains an axe result. axe runs on every new button row. The icon and one-character label case is a recorded known limitation (axe `incomplete`, no story has it; decision 7). |
| IV Strict CSP | Pass. One attribute and one listener in a template, one call in a function and one element-reflection assignment. No inline style or script. |
| V Storybook and tests | Pass. No visual change, so no story or baseline changes. Behaviour is proven by browser rows for every keyboard path the op touches. |
| VI Consumer needs | Pass. #57 comes from mission 020's consumer work, and the fixes restore documented behaviour. |
| VII Semver | Patch. No surface change. The CHANGELOG gets `### Fixed`. |
| VIII Test-first | Pass. One test-only red commit, recorded by `red.sh`, and two later test-only commits before the source they test (`f5b0bdf`; scenarios 9 and 10, `3f86a0c`), each run logged in a clean worktree. Both were folded into `55b77a6` and live only on `archive/claude/057-focus-trap-icon-a11y-prefold-phase-1` (O2-05). Round 2's opaque rows get their own test-only red commit, recorded by `red.sh 1 fix-2`. Each red row fails on main for the missing behaviour. Mutation testing covers the changed lines. |

No Complexity Tracking entry.

## Stop conditions

- The red rows show that `overlay.ts` must change, or that `inert`, `hidden="until-found"` or a closed `ocelle-*`
  disclosure need their own behaviour. Then write this in `op.md` and tell the operator it is a mission.
- The button rows pass on main. Then the icon half is **none** (see *Test approach*).
- With the conditional `updated()` relation in place, Chromium still adds the slotted svg's title to the name, default-
  slot text no longer names the control, or an existing button row turns red (the probe at T008 kept all 227 green).
  Then do not loosen a row: record the measurement in `notes.md` and tell the operator.
- A story or an existing row turns out to have an icon beside a one-character label, so the known limitation shows
  on it. Then do not loosen it: record it and tell the operator.
- Round 2: no reading of the rendering check keeps a rendered `display: contents` opaque host a candidate while
  dropping one inside a closed `details`, or an existing opaque, iframe or media row turns red. Then do not loosen a
  row and do not narrow the README or the CHANGELOG: record the measurement in `notes.md` and tell the operator
  (landing review L1-01 option (b) is the operator's to choose).
- #49 or #54 already fix either defect when the op rebases. Then that half is **none** or a fold, citing the commit.
