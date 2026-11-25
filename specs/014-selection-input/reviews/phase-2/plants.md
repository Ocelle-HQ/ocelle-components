# Phase 2 plants (T028)

Each named plant of User Story 1 (contracts/elements.md § Pairings; research R-03, R-11, R-15, R-17, R-18; the
plants named beside each body of `packages/elements/test/scenarios/listbox.ts`), applied alone to the green
implementation, run once against the test file named, and reverted (the source restored byte for byte, checked with
`diff -r` against a copy taken before the runs). The runs: `pnpm exec vitest run --project <project> <file> -t
<scenario>` with `OCELLE_CHROMIUM_PATH` set; `elements` (in process, the element source) unless the table says
otherwise. Every plant made at least one test fail; none needed a stop-and-ask.

Four plants did not bite on their first run and were handled before the green commit, each recorded here:

- *Disabled ignored in the click handler.* Removing the element's check alone changes nothing: the model's
  `userSelect` refuses a disabled child too, so the plant removes both checks (the element's guard is the one the
  pointer reaches first; the model's guards every path). With both removed, US1-10 fails.
- *Change dispatched from the model's fallback.* The first plant dispatched from the observer's batch, but the removal
  of the focused, selected option in US1-14 is processed by the focus record's microtask; the plant now dispatches
  from that batch, and US1-14 fails.
- *The value setter deciding on the cached child list.* Outcome-equivalent at the first run: the remembered value
  (FR-010a) selects the appended option in the next batch, so after the settle the selection was the same. R-05's body
  was made stricter (it also reads `value` and the option's `aria-selected` in the task of the append and the set),
  and the plant now fails it. The stricter body replaces the red one; nothing was loosened.
- *The record scoped only by its task.* Dropping the `relatedTarget` check alone did not trap focus (the
  `takeRecords()` check still cleared the record in its microtask). The plant is now the round-2 design as R-03
  describes it: `blurred` set on every `focusout`, not cleared by the microtask, and read by the next batch; all eight
  "Tab out while the host re-renders on blur" bodies fail.

The harnesses were changed from `it.each(...)("$name")` to one `it` per body under its full name: `$name` shortens a
long name to 40 characters, which gave the eight re-render bodies one name and hid most bodies from `-t`.

| Plant | Where | Failing tests |
|---|---|---|
| selection following focus in the listbox | `packages/elements/src/roving.ts` | US1-2: ArrowDown three times moves focus to delta and ArrowUp back to gamma; nothing is…; US1-20: Enter on the selected beta emits one activate and no change; a double-click on …; US1-21: a host moving the selected, focused beta after gamma, or re-inserting it in pla… (3 failed | 11 passed | 29 skipped (43)) |
| dispatching change from the value setter | `packages/elements/src/ocelle-listbox.ts` | US1-11: a host set of value delta, by property or attribute, exposes delta selected as … (1 failed | 42 skipped (43)) |
| change emitted without the already-selected check | `packages/elements/src/ocelle-listbox.ts` | US1-6, US1-7: Space on delta selects it with one change event and the page does not scr… (1 failed | 42 skipped (43)) |
| activating on every Enter | `packages/elements/src/ocelle-listbox.ts` | US1-20: Enter on the selected beta emits one activate and no change; a double-click on … (1 failed | 42 skipped (43)) |
| activating a disabled option on double-click | `packages/elements/src/ocelle-listbox.ts` | US1-20: Enter on the selected beta emits one activate and no change; a double-click on … (1 failed | 42 skipped (43)) |
| preventDefault() on every keydown | `packages/elements/src/roving.ts` | US1-12: Escape, ArrowLeft, ArrowRight and the letter g are not handled and move nothing… (1 failed | 42 skipped (43)) |
| typeahead on letters | `packages/elements/src/roving.ts` | US1-12: Escape, ArrowLeft, ArrowRight and the letter g are not handled and move nothing… (1 failed | 42 skipped (43)) |
| no preventDefault() on Space | `packages/elements/src/roving.ts` | US1-6, US1-7: Space on delta selects it with one change event and the page does not scr… (1 failed | 42 skipped (43)) |
| wrap: true for the listbox | `packages/elements/src/ocelle-listbox.ts` | US1-3: the listbox does not wrap: ArrowUp on alpha stays on alpha, End moves to epsilon… (1 failed | 42 skipped (43)) |
| disabled ignored in the click handler (and in the model's user selection) | `packages/elements/src/ocelle-listbox.ts`, `packages/elements/src/selection.ts` | US1-10: ArrowDown from alpha skips the disabled beta to gamma; a click on beta selects,… (1 failed | 42 skipped (43)) |
| the current-value no-op dropped | `packages/elements/src/selection.ts` | US1-18: a selected, focused gamma that becomes disabled stays selected and focused, los… (1 failed | 42 skipped (43)) |
| change dispatched from the model's fallback (the focus record's batch) | `packages/elements/src/ocelle-listbox.ts` | US1-14: removing the focused beta moves focus to delta past the disabled gamma, removin… (1 failed | 42 skipped (43)) |
| no refocus after the batch | `packages/elements/src/ocelle-listbox.ts` | US1-21: a host moving the selected, focused beta after gamma, or re-inserting it in pla… (1 failed | 42 skipped (43)) |
| refocusing after any blur (the record not scoped to the removal that caused it) | `packages/elements/src/selection.ts` | US1-21, a move does not steal focus back: after an in-task move keeps focus on beta, th… (1 failed | 42 skipped (43)) |
| the record scoped only by its task: no relatedTarget or takeRecords() check, blurred read by the next batch | `packages/elements/src/selection.ts` | US1-21, Tab out while the host re-renders on blur: a real Tab leaves beta for that butt…; US1-21, Tab out while the host re-renders on blur: a real Tab leaves beta for that butt…; US1-21, Tab out while the host re-renders on blur: a real Tab leaves beta for that butt…; US1-21, Tab out while the host re-renders on blur: a real Tab leaves beta for that butt…; US1-21, Tab out while the host re-renders on blur: a real click on the button after the…; US1-21, Tab out while the host re-renders on blur: a real click on the button after the…; US1-21, Tab out while the host re-renders on blur: a real click on the button after the…; US1-21, Tab out while the host re-renders on blur: a real click on the button after the… (8 failed | 35 skipped (43)) |
| the nothing-inside-the-parent clause | `packages/elements/src/ocelle-listbox.ts` | US1-21, Tab out while the host re-renders on blur: a real Tab leaves beta for that butt…; US1-21, Tab out while the host re-renders on blur: a real Tab leaves beta for that butt…; US1-21, Tab out while the host re-renders on blur: a real click on the button after the…; US1-21, Tab out while the host re-renders on blur: a real click on the button after the… (4 failed | 4 passed | 35 skipped (43)) |
| the bar drawn by colour only (no size) | `packages/elements/src/ocelle-option.ts` | US1-5: Enter on gamma selects it: exposed as the only selected option, value gamma (alr… (1 failed | 42 skipped (43)) |
| the bar as an inset box-shadow only | `packages/elements/src/ocelle-option.ts` | US1-15: in forced colours the selected gamma shows a Highlight edge on its inline-start… (1 failed | 42 skipped (43)) |
| no padding on part="list" | `packages/elements/src/ocelle-listbox.ts` | US1-16: in a listbox taller than its max-block-size the focused option scrolls into vie… (1 failed | 42 skipped (43)) |
| the option's ring pseudo-element without z-index | `packages/elements/src/ocelle-option.ts` | the focus ring of a keyboard-focused option is drawn in color-focus just outside all fo… (1 failed | 42 skipped (43)) |
| the option's ring as an outline on the host | `packages/elements/src/ocelle-option.ts` | the focus ring of a keyboard-focused option is drawn in color-focus just outside all fo… (1 failed | 42 skipped (43)) |
| a :host(:hover) rule with no disabled exclusion | `packages/elements/src/ocelle-option.ts` | Edge Cases, hover: a disabled option under the pointer has no hover fill, beside an ena… (1 failed | 42 skipped (43)) |
| a transition on the selected paint | `packages/elements/src/ocelle-option.ts` | Edge Cases, motion: an option declares no transition or animation, so a selection paint… (1 failed | 42 skipped (43)) |
| the child setting its role and tabindex regardless of the parent | `packages/elements/src/ocelle-option.ts` | Edge Cases: an ocelle-option directly in the page has no role and no tab stop, beside t… (1 failed | 42 skipped (43)) |
| selecting the last match | `packages/elements/src/selection.ts` | Edge Cases: with two options of the same value a host set selects the first; a click on… (1 failed | 42 skipped (43)) |
| exposing the first after a user selection of the second | `packages/elements/src/selection.ts` | Edge Cases: with two options of the same value a host set selects the first; a click on… (1 failed | 42 skipped (43)) |
| tabindex="0" on part="list" with no options | `packages/elements/src/ocelle-listbox.ts` | Edge Cases: an empty listbox is exposed as a named listbox with no tab stop, Tab passes… (1 failed | 42 skipped (43)) |
| no tabindex on part="list" | `packages/elements/src/ocelle-listbox.ts` | US1-22: an overflowing listbox whose every option is disabled has no tab stop, Tab goes… (1 failed | 42 skipped (43)) |
| white-space: nowrap on the option | `packages/elements/src/ocelle-option.ts` | Edge Cases: at a 320 px viewport an option label longer than the listbox wraps, the opt… (1 failed | 42 skipped (43)) |
| a display rule on :host that overrides :host([hidden]) | `packages/elements/src/ocelle-listbox.ts` | Edge Cases: host hidden removes the listbox, no box and no node; without it the listbox… (1 failed | 42 skipped (43)) |
| define without the already-defined check | `packages/elements/src/define.ts` | Edge Cases, two copies of the package: a second definition of ocelle-listbox and ocelle… (1 failed | 42 skipped (43)) |
| the value setter deciding on the cached child list | `packages/elements/src/selection.ts` | R-05: an option appended and value set to it in the same task are one operation: the op… (1 failed | 42 skipped (43)) |
| the remembered value never forgotten | `packages/elements/src/selection.ts` | US1-19: a value no option has is remembered: appending delta selects it with no event; … (1 failed | 42 skipped (43)) |
| the listbox module not importing the option module | `packages/elements/src/ocelle-listbox.ts` | defines ocelle-listbox as OcelleListbox and ocelle-option, and not ocelle-icon or ocell…; gives a working control: the option of a listbox is exposed with role option inside the… (2 failed (2)) |
| the option's name read once (the label slot removed after first render) | `packages/elements/src/ocelle-option.ts` | Edge Cases: an option's accessible name follows a change of its text (1 failed | 42 skipped (43)) |
| the default value written to the attribute | `packages/elements/src/ocelle-option.ts` | US1-17: options with no value or value="" take their index as value: a click on beta re… (1 failed | 42 skipped (43)) |
| the bar in control-border (an unchecked pair) | `packages/elements/src/ocelle-option.ts` | ocelle-option paints exactly R-15's tokens per role, every R-15 pair checked in pairs.j… (1 failed | 2 passed (3)) |
| driver: hover that does not move the pointer | `packages/elements/test/in-process.ts` | hover moves the pointer onto the target… (1 failed | 11 skipped (12)) |
| driver: click ignoring force | `packages/elements/test/in-process.ts` | click with force clicks a target Playwr… (1 failed | 11 skipped (12)) |
| driver: hover that does not move the pointer (fixture) | `packages/elements/test/browser/driver.ts` | hover moves the pointer onto the target… (1 failed | 20 skipped (21)) |
| driver: click ignoring force (fixture) | `packages/elements/test/browser/driver.ts` | click with force clicks a target Playwr… (1 failed | 20 skipped (21)) |
| internals in a private field (not where axe reads them) | `packages/elements/src/internals.ts` | the 14 listbox story tests (7 stories, light and dark), e.g. elements-ocelle-listbox--no-selection in light (14 failed | 18 skipped (32)) |
