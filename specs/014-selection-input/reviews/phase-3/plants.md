# Phase 3 plants (T050)

Each named plant of User Story 2 (contracts/elements.md § Pairings; research.md R-01 to R-06, R-11, R-15, R-16, R-17;
the plants named beside each body of `packages/elements/test/scenarios/tabs.ts`) was applied alone to the green
implementation, run once against the test file named, and reverted. Reverting restored the source byte for byte, checked
against a copy taken before the runs. The runs used `pnpm exec vitest run --project <project> <file> -t <scenario>` with
`OCELLE_CHROMIUM_PATH` set, in `elements` (in process, the element source) unless the table says otherwise. A failing
test name is cut at 110 characters. Every plant made at least one test fail; none needed a stop-and-ask.

One plant did not bite on its first run and was corrected:

- *The tab's name read once.* The first form removed the label slot after the first render. It does not produce the
  defect: Lit renders the tab again only on a property change, and a change of the tab's text is not one, so the slot
  stayed. The plant now copies the tab's text into the internals' name at connection, which is the defect "the name
  read once". The name test then fails.

The two story-test plants were run on the built Storybook (`storybook-integration`, the tabs stories, light and dark):

| Plant | Where | Failing tests |
|---|---|---|
| `aria-labelledby` on every panel | `packages/elements/src/ocelle-tabs.ts` | the 16 tabs story tests of `storybook/test/integration/elements-stories.test.ts` (axe-core 4.14.0's `color-contrast` incomplete; 16 failed, 32 skipped) |
| the internals in a private field | `packages/elements/src/internals.ts` | the 16 tabs story tests (axe's `aria-allowed-attr`; 16 failed, 32 skipped) |

The plants run in process:

| Plant | Where | Failing tests |
|---|---|---|
| the tablist role on the host (the tabpanel then inside a tablist) | `packages/elements/src/ocelle-tabs.ts` | US2-1: a tablist named Mission views with three tabs, Spec selected, and one tabpanel named Spec beside the ta (1 failed, 56 skipped of 57) |
| hiding unselected panels with visibility only (every panel assigned) | `packages/elements/src/ocelle-tabs.ts` | US2-1: a tablist named Mission views with three tabs, Spec selected, and one tabpanel named Spec beside the ta (1 failed, 56 skipped of 57) |
| no aria-controls | `packages/elements/src/ocelle-tabs.ts` | US2-1: a tablist named Mission views with three tabs, Spec selected, and one tabpanel named Spec beside the ta; US2-12, SC-003: with no id or aria-* written by the host on any child, the tabs write ids in the page's own sc (2 failed, 55 skipped of 57) |
| selection not following focus on the arrows | `packages/elements/src/ocelle-tabs.ts` | US2-2: ArrowRight on Spec moves focus and selection to Plan, shows Plan's panel named Plan, hides Spec's, and  (1 failed, 56 skipped of 57) |
| wrap: false for the tabs | `packages/elements/src/ocelle-tabs.ts` | US2-3: ArrowRight on the last tab Tasks wraps focus and selection to Spec, ArrowLeft on Spec wraps to Tasks, e (1 failed, 56 skipped of 57) |
| rtl not read | `packages/elements/src/roving.ts` | US2-5: under dir=rtl on an ancestor ArrowLeft on Spec moves to Plan (the visual order), beside the left-to-rig (1 failed, 56 skipped of 57) |
| the panel never focusable | `packages/elements/src/ocelle-tabs.ts` | US2-6: Tab on the selected tab moves into its panel, onto the panel itself when it holds nothing focusable, wh (1 failed, 56 skipped of 57) |
| the panel focusable even when it holds a focusable | `packages/elements/src/ocelle-tabs.ts` | US2-6: Tab on the selected tab moves into its panel, onto the panel itself when it holds nothing focusable, wh (1 failed, 56 skipped of 57) |
| no focus ring on the panel | `packages/elements/src/ocelle-tab-panel.ts` | US2-6: Tab on the selected tab moves into its panel, onto the panel itself when it holds nothing focusable, wh (1 failed, 56 skipped of 57) |
| disabled ignored in the click handler and in the model's user selection | `packages/elements/src/ocelle-tabs.ts`, `packages/elements/src/selection.ts` | US2-7: arrows skip the disabled Plan, a click on it selects, focuses and emits nothing beside a click on Tasks (1 failed, 56 skipped of 57) |
| dispatching change from the value setter | `packages/elements/src/ocelle-tabs.ts` | US2-8: a host set of value tasks, by property or by attribute, selects Tasks and shows its panel with no event (1 failed, 56 skipped of 57) |
| assigning every tab to the tablist slot | `packages/elements/src/ocelle-tabs.ts` | US2-9: with four tabs and three panels the fourth tab has no box and no node and End skips it; with three tabs (1 failed, 56 skipped of 57) |
| flex-wrap: nowrap on the tablist | `packages/elements/src/ocelle-tabs.ts` | US2-10: at a 320 px viewport tabs wider than the row wrap onto further rows inside the element, the page does  (1 failed, 56 skipped of 57) |
| the bar drawn by colour only (no thickness) | `packages/elements/src/ocelle-tab.ts` | US2-11: the selected tab shows a bar of bar-width on its block-end edge in accent-strong, unselected tabs none (1 failed, 56 skipped of 57) |
| the bar as an inset box-shadow only | `packages/elements/src/ocelle-tab.ts` | US2-11: the selected tab shows a bar of bar-width on its block-end edge in accent-strong, unselected tabs none (1 failed, 56 skipped of 57) |
| the panel id rendered inside the tabs' shadow root | `packages/elements/src/ocelle-tabs.ts` | US2-12, SC-003: with no id or aria-* written by the host on any child, the tabs write ids in the page's own sc (1 failed, 56 skipped of 57) |
| aria-labelledby on every panel | `packages/elements/src/ocelle-tabs.ts` | US2-12, SC-003: with no id or aria-* written by the host on any child, the tabs write ids in the page's own sc; R-01, R-02: axe-core reads the internals the tabs' children keep: no aria-allowed-attr, aria-required-parent o (2 failed, 55 skipped of 57) |
| change emitted without the already-selected check | `packages/elements/src/ocelle-tabs.ts` | US2-13: Enter and Space on the selected Plan are handled and change nothing, the page does not scroll; with fo; US2-15: a click on the selected Spec and Home on Spec change nothing and emit nothing, beside ArrowRight's cha (2 failed, 55 skipped of 57) |
| no preventDefault() on Space and Enter | `packages/elements/src/roving.ts` | US2-13: Enter and Space on the selected Plan are handled and change nothing, the page does not scroll; with fo (1 failed, 56 skipped of 57) |
| preventDefault() on every keydown | `packages/elements/src/roving.ts` | US2-14: ArrowUp, ArrowDown, Escape and a letter on a tab are not handled and move nothing, beside ArrowRight,  (1 failed, 56 skipped of 57) |
| the default value written to the attribute | `packages/elements/src/ocelle-tab.ts` | US2-16: tabs with no value report their index: ArrowRight twice from the first emits 1 then 2 and value reads  (1 failed, 56 skipped of 57) |
| clearing the selection on a value no tab has (as the listbox) | `packages/elements/src/selection.ts` | US2-17: with Plan selected and focused, a host set of nope or of the empty value keeps Plan selected, its pane (1 failed, 56 skipped of 57) |
| rewriting the states on every set | `packages/elements/src/ocelle-tabs.ts` | US2-17: with Plan selected and focused, a host set of nope or of the empty value keeps Plan selected, its pane (1 failed, 56 skipped of 57) |
| change dispatched from the model's fallback | `packages/elements/src/ocelle-tabs.ts` | US2-18: removing the selected, focused Plan with its panel selects Tasks, shows its panel, makes it the tab st (1 failed, 56 skipped of 57) |
| focus not moved with the selection | `packages/elements/src/ocelle-tabs.ts` | US2-18: removing the selected, focused Plan with its panel selects Tasks, shows its panel, makes it the tab st (1 failed, 56 skipped of 57) |
| no tab stop check: the first enabled tab kept selected while disabled | `packages/elements/src/selection.ts` | US2-18: with every tab disabled no tab is selected, no panel is shown, value reads the empty value and the tab (1 failed, 56 skipped of 57) |
| the remembered value never forgotten | `packages/elements/src/selection.ts` | US2-19: a value no tab has keeps Spec selected and is remembered: appending Tasks with its panel then selects  (1 failed, 56 skipped of 57) |
| the first enabled tab over the remembered value | `packages/elements/src/selection.ts` | US2-20: on an empty tabs a set of tasks then the three tabs and panels appended at once selects Tasks with no  (1 failed, 56 skipped of 57) |
| the controller without the target check | `packages/elements/src/roving.ts` | US2-21: in the selected Plan panel Enter and Space on a button activate it, ArrowLeft, Home and End in a text  (1 failed, 56 skipped of 57) |
| a light-DOM selector query at tab updates only | `packages/elements/src/ocelle-tabs.ts` | US2-22: a panel holding only an element whose focusable anchor is in its shadow root is no stop, Tab goes to t (1 failed, 56 skipped of 57) |
| forwarding the host aria-label to the tablist | `packages/elements/src/ocelle-tabs.ts` | US2-24: with label Mission views and a host aria-label Recent views the tablist is named Mission views and no  (1 failed, 56 skipped of 57) |
| the value setter taking the pending records without the focus record | `packages/elements/src/selection.ts` | R1-01 for tabs: a host that removes the selected, focused Plan with its panel and sets value to spec by proper; R1-01 for tabs: a host that removes the selected, focused Plan with its panel and sets value to spec by attrib; R1-01 for tabs: a host that moves to the end of the tabs the selected, focused Plan with its panel and sets va; R1-01 for tabs: a host that moves to the end of the tabs the selected, focused Plan with its panel and sets va (4 failed, 53 skipped of 57) |
| the observer's batch ignoring the focus record | `packages/elements/src/selection.ts` | R-03: a host that moves Spec and then the selected, focused Plan to the end of the tabs in one task keeps focu; R-03: a host that removes delta and then the focused beta in one task moves focus to gamma, the next enabled o; R-03: a host that moves alpha and then the focused beta to the end in one task keeps focus on beta, as when th (3 failed, 385 skipped of 388) |
| refocusing after any blur | `packages/elements/src/selection.ts` | R-03, Tab out while the host re-renders on blur: a real Shift+Tab to the button before the tabs leaves the foc; R-03, Tab out while the host re-renders on blur: a real click on the button after the tabs leaves the focused ; R-03, Tab out while the host re-renders on blur: a real Shift+Tab to the button before the tabs leaves the foc; R-03, Tab out while the host re-renders on blur: a real click on the button after the tabs leaves the focused  (4 failed, 53 skipped of 57) |
| the tab's ring as an outline on the host, not raised | `packages/elements/src/ocelle-tab.ts` | the focus ring of a keyboard-focused tab is drawn in color-focus just outside all four edges, beside the selec (1 failed, 56 skipped of 57) |
| the tab's ring pseudo-element without z-index | `packages/elements/src/ocelle-tab.ts` | the focus ring of a keyboard-focused tab is drawn in color-focus just outside all four edges, beside the selec (1 failed, 56 skipped of 57) |
| a :host(:hover) rule with no disabled exclusion | `packages/elements/src/ocelle-tab.ts` | Edge Cases, hover: a disabled tab under the pointer has no hover fill, beside an enabled sibling under the poi (1 failed, 56 skipped of 57) |
| a transition on the selected paint | `packages/elements/src/ocelle-tab.ts` | Edge Cases, motion: a tab declares no transition or animation, so a selection paints at once (transition-durat (1 failed, 56 skipped of 57) |
| the child setting its role and tabindex regardless of the parent | `packages/elements/src/ocelle-tab.ts` | Edge Cases: an ocelle-tab and an ocelle-tab-panel directly in the page have no role and no tab stop, beside th (1 failed, 56 skipped of 57) |
| selecting the last match on a host set | `packages/elements/src/selection.ts` | Edge Cases: with two tabs of the same value a host set selects the first; a click on the second exposes the se (1 failed, 56 skipped of 57) |
| a display rule on :host that overrides :host([hidden]) | `packages/elements/src/ocelle-tabs.ts` | Edge Cases: host hidden removes the tabs, no box and no node; without it the tabs have a box and their nodes 3 (1 failed, 56 skipped of 57) |
| the tab's name read once (its text copied to the internals' name at connection) | `packages/elements/src/ocelle-tab.ts` | Edge Cases: a tab's accessible name and its panel's name follow a change of the tab's text (1 failed, 56 skipped of 57) |
| the value setter deciding on the cached child list | `packages/elements/src/selection.ts` | R-05: a tab and its panel appended and value set to it in the same task are one operation: the tab is selected (1 failed, 56 skipped of 57) |
| a child's own id overwritten | `packages/elements/src/ocelle-tabs.ts` | R-02: a tab's or panel's own id is kept and used for the association; a tab and panel that leave the tabs lose (1 failed, 2 passed, 54 skipped of 57) |
| the generated ids left on a child that leaves | `packages/elements/src/ocelle-tabs.ts` | R-02: a tab's or panel's own id is kept and used for the association; a tab and panel that leave the tabs lose (1 failed, 2 passed, 54 skipped of 57) |
| label not trimmed | `packages/elements/src/ocelle-tabs.ts` | FR-006: the tablist's name is the trimmed label, a blank label leaves it unnamed, and a later label change fol (1 failed, 56 skipped of 57) |
| the tabs module not importing the tab and panel modules | `packages/elements/src/ocelle-tabs.ts` | defines ocelle-tabs as OcelleTabs, ocelle-tab and ocelle-tab-panel, and not ocelle-listbox, ocelle-icon or oce; gives a working control: the tab and its panel are exposed with roles tab and tabpanel beside the named tablis (2 failed of 2) |
| the internals in a private field (not where axe reads them) | `packages/elements/src/internals.ts` | R-01, R-02: axe-core reads the internals the tabs' children keep: no aria-allowed-attr, aria-required-parent o (1 failed, 56 skipped of 57) |
| the tab bar in control-border (an unchecked pair) | `packages/elements/src/ocelle-tab.ts` (`elements-node`) | ocelle-tab paints exactly R-15's tokens per role, every R-15 pair checked in pairs.json, and the planted copy  (1 failed, 4 skipped of 5) |
| driver: ancestors scope that returns the node itself and not its ancestors | `packages/elements/test/commands.ts` | gives a node's unignored ancestors, nearest first, with "ancestors" (014 phase 3): a tab's tablist, and no tab (1 failed, 5 skipped of 6) |
