---

description: "Task list for op 022: the focus trap skips a closed <details>, and a button's icon adds nothing to its name"
---

# Tasks: The focus trap skips a closed `<details>`, and a button's icon adds nothing to its name

**Input**: `ops/022-focus-trap-details-icon-name/` (op.md, spec.md, plan.md)

**Tests**: Required. Write them test-first, per constitution VIII and plan.md *Test approach*. The story's tests go
in the phase's red commit.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: US1, the op's one story

---

## Phase 1: The focus trap skips a closed `<details>`, and a button's icon adds nothing to its name

**Goal**: in `ocelle-dialog` and `ocelle-drawer`, Tab from the summary of a closed `<details>` at the panel's end
wraps to the first stop. A titled bare `<svg>` in `ocelle-button`'s `icon` slot has no accessibility node and adds
nothing to the button's name, in the button and the link mode, with a text label and with `label` alone: the icon
wrapper is `aria-hidden` and, when an icon is slotted and nothing on the host names it, the inner control is named
from its label wrapper, following the icon slot after the first render (operator, phase-1 decisions 1 and 7). An
icon beside a one-character label is a recorded known limitation (axe `label-content-name-mismatch`, incomplete).
`ocelle-action-row`'s icon wrapper was measured and is reported as a follow-up issue (phase-1 decision 2). Nothing
on the public surface changes (patch).

**Independent Test**: the new rows (spec.md scenarios 1 to 10) in `packages/elements/test/scenarios/dialog.ts` (and the drawer, which inherits
them) and `packages/elements/test/scenarios/button.ts` pass after being seen red. Every existing dialog, drawer and
button row still passes.

### Tests (red first, one test-only commit)

- [x] T001 [P] [US1] In `packages/elements/test/scenarios/dialog.ts`, add the row group `detailsRows` with `cycleRows`, for spec.md scenarios 1, 2, 4 and 5: a body of `b1` and then a closed `<details id="d"><summary id="s">More</summary><a id="l" href="#x">Hidden link</a></details>`, started on the summary (Tab path `dlg[button] b1 …`) and on the close control (Shift+Tab path `s b1 …`); the same `details` opened (`<details open>`), where Tab from the summary reaches `l` and then wraps; and the closed `details` followed by footer `f1`, where Tab from the summary reaches `f1`. Return `detailsRows` from the builder next to `tabCycleRows` (`:2846`), and add it to the dialog's own list (`:3051`).
- [x] T002 [P] [US1] In `packages/elements/test/scenarios/drawer.ts`, add `...built.detailsRows` to `inheritedRows`, after `...built.tabCycleRows` (spec.md scenario 3).
- [x] T003 [P] [US1] In `packages/elements/test/scenarios/button.ts`, add three rows to `buttonScenarios`: a titled bare svg (`<svg slot="icon" viewBox="0 0 16 16"><title>Folder</title><path d="M2 2h12v12H2z"/></svg>`) with default-slot text `Open` (scenario 6), and the same svg with `label="Open project"` and no text (scenario 7). Each asserts the whole result: `axState("b", control)` role and name, and `axSubtree("b")` with no `image` node and no node named `Folder`. Add `<ocelle-icon slot="icon" name="folder">` with the text `Open project` (scenario 8), named `Open project`. Each row ends with `severe(driver)` expected `[]`.
- [x] T004 [US1] Measure the action row (op.md Acceptance 5, plan.md *Action-row measurement*): run a temporary probe with the titled svg in `ocelle-action-row`'s `icon` slot. Read the inner control's name and the row's `axSubtree`, write the command and the raw output to `ops/022-focus-trap-details-icon-name/reviews/phase-1/notes.md`, and remove the probe. Never commit it.
- [x] T005 [US1] Commit T001 to T003 alone (`test(op-022): phase 1 red — closed details in the Tab cycle, icon in the button's name`, signed off). Run `.specify/extensions/story/scripts/red.sh 1 phase`. It must report `"recorded": true`. Check in `red-phase.log` that the rows of spec.md scenarios 1 and 2 fail in Chromium on the focus path, and that those of scenarios 6 and 7 fail on the `image` node or name. No row may fail on a setup error. If the row of scenario 6 or 7 passes on main, follow plan.md *Test approach* (remove it, amend the red commit, record the icon half as **none**, skip T007 and T008).

### Implementation

- [x] T006 [US1] In `packages/elements/src/focusable.ts`, make `rendered()` also require `element.checkVisibility()` after its two existing conditions, and extend its JSDoc (plan.md *Files to change*). Change nothing else in the file, and leave `overlay.ts` unchanged (spec.md FR-002).
### Tests (widened red, one test-only commit; phase-1 decision 1)

- [x] T007 [US1] (commit `f5b0bdf`) Widened red (phase-1 decision 1; plan.md *Test approach*, "Scenario 7, link mode"). In `packages/elements/test/scenarios/button.ts`, add scenario 7 in the link mode: `<ocelle-button id="k" href="#x" label="Open project">` holding the titled svg and no text, asserting `axState("k", control)` role `link` and name `Open project`, no `image` node and no node named `Folder`, and `severe(driver)` `[]` in a new row beside scenario 7's. Do not change the rows of `d820f00`. Commit this file alone (`test(op-022): phase 1 red, widened — label= in the link mode`, signed off), leaving the uncommitted source work out of the commit. Run the button suite at that commit in a clean worktree and save the output as `ops/022-focus-trap-details-icon-name/reviews/phase-1/red-widen.log`; the new row must fail on the `image` node, not on setup. Do not rerun `red.sh 1 phase`.

### Tests (slot red, one test-only commit; phase-1 decision 7)

- [x] T008 [US1] (commit `3f86a0c`) Slot red (phase-1 decision 7; spec.md scenarios 9 and 10; plan.md *Test approach*, "Scenarios 9 and 10"). In `packages/elements/test/scenarios/button.ts`, add new rows, in the button mode and in the link mode (`href="#x"`): scenario 9, the titled svg (with an `id`) mounted with `slot="aside"` beside the text `Open`, then moved into the icon slot with `driver.setAttribute(<svg id>, "slot", "icon")`, asserting `axState` role and name `Open`, no `image` node and no node named `Folder`, and `severe(driver)` `[]`; scenario 10, the svg in the icon slot beside the text `S`, then moved out with `driver.setAttribute(<svg id>, "slot", "aside")`, asserting the name `S` and `severe(driver)` `[]` (read only after the move). Change no existing row. Commit this file alone (`test(op-022): phase 1 red, slot — icon slotted or removed after render`, signed off), leaving the uncommitted source work out of the commit. Run the button suite at that commit in a clean worktree and save the output as `ops/022-focus-trap-details-icon-name/reviews/phase-1/red-slot.log`: scenario 9's rows must fail on the `image` node, not on setup; scenario 10's rows pass. Do not rerun `red.sh 1 phase`.

### Implementation

- [x] T009 [US1] In `packages/elements/src/ocelle-button.ts` (spec.md FR-003, plan.md *Approach*, *Icon name*): add `aria-hidden="true"` to the `<span class="icon-slot">` in `content` (`:504`); add a `@slotchange` listener on `<slot name="icon">` that stores whether the slot has assigned content (`assignedElements({ flatten: true }).length > 0`) in a private field and calls `requestUpdate()`; in `updated()`, set the inner control's `ariaLabelledByElements` to the resolved host `aria-labelledby` references when there are any, else to the `.label` wrapper when the icon slot has assigned content and `#name()` returns `undefined`, else `null`. Update the header comment's name order (`:8`) and `#name()`'s JSDoc to say the content step is the label wrapper when an icon is slotted. Add no attribute, property, slot, part or event. Leave `ocelle-action-row.ts` unchanged (FR-004). Change no existing row (phase-1 decision 7).
- [x] T010 [P] [US1] In `packages/elements/src/icon-slot.ts`, correct the header comment's sentence on the control's name (plan.md *Files to change*): no generated content, but a control keeps a slotted icon out of its name itself, as `ocelle-button` does. Comment only.
- [x] T011 [P] [US1] In `packages/elements/README.md`, make the edits of plan.md *Files to change*: one sentence in the dialog **Focus** paragraph; the `ocelle-button` icon-slot bullet (the icon adds nothing to the name, which comes from the default slot's text when nothing on the host names it; name an icon-only button with `label`; known limitation: with a slotted icon and a one-character text label, axe reports `label-content-name-mismatch` as needing review, while the name is correct); the controls' **Name order** item, so "slotted icons never contribute" is stated for `ocelle-button` only; and § Slot convention **Naming**. Make no promise for `ocelle-action-row`. Change no other line.
- [x] T012 [P] [US1] In `packages/elements/CHANGELOG.md` § Unreleased, add `### Fixed` with the two entries of plan.md *CHANGELOG entries* (the `ocelle-button` entry ends with the known limitation).

### Checks

- [x] T013 [US1] Run `pnpm test`, `gate:typecheck`, `gate:lint`, `gate:test-lint` and `pnpm run manifest` (`custom-elements.json` must not change), then `pnpm run gate:mutation -- --base $(cat ops/022-focus-trap-details-icon-name/reviews/phase-1/base.sha)`. Every existing button row must stay green and unchanged (host `aria-labelledby`, host `aria-label`, `label`, content names, and the one-character rows US1-6/US1-7, US1-12, link.ts US2-12 and href-values). Check the mutants of plan.md *Test approach* (icon condition dropped, negated, `true` or `false`; relation with a `#name()`; slot listener removed or emptied; field only ever set; `flatten`) and kill each survivor in the changed lines with a stricter row, or record it as equivalent in `notes.md` with a true reason. Record in `notes.md` the T008 stop measurement (Chromium 156, `aria-hidden` alone gives `Folder Open`; the unconditional relation's 14 red rows; the probe's 227 green rows; the icon-only `button-name` result). If Chromium still adds `Folder` to the name, or an existing row turns red, follow plan.md *Stop conditions*.
- [x] T014 [US1] Start dockerd first (`nohup dockerd > /tmp/dockerd.log 2>&1 &`, then `pnpm run setup:online`; phase-1 decision 4), so the visual integration rows run. Run `pnpm run gate:plants -- --affected $(cat ops/022-focus-trap-details-icon-name/reviews/phase-1/base.sha)` and save its output as `ops/022-focus-trap-details-icon-name/reviews/phase-1/plants.md`. The exit must be 0. If a visual plant or story shows a change, or a story shows the known limitation's axe result, stop and tell the operator: baselines are produced only in #10's pinned container under docker.
- [x] T015 [US1] Check that the diff leaves these untouched: `packages/elements/src/overlay.ts`, `packages/elements/src/ocelle-action-row.ts`, `packages/elements/custom-elements.json`, `storybook/` and `gates/` (`git diff --stat <base> -- …`). Commit the implementation, docs and records (`fix(op-022): closed details in the Tab cycle, icon in the button's name (#57)`, signed off). In the phase report, give the action-row measurement from `notes.md` (`Folder Open project`, both modes) to the orchestrator as a follow-up issue (phase-1 decision 2), and name the known limitation (phase-1 decision 7).

**Checkpoint**: Tab wraps past a closed `<details>` in both overlays. A titled icon adds nothing to
`ocelle-button`'s name in either mode, also when slotted after render; no existing row is loosened. The known
limitation is in the README and the CHANGELOG. The action-row gap is reported as a follow-up issue.
