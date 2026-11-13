# Research: Selection and Input Elements (014)

Each entry: decision, rationale, alternatives. "Spike" marks a decision that a phase measures before its red commit and
records in `reviews/phase-N/spike.md`; if the measurement contradicts the decision, the phase stops and the operator
decides (the spike never silently changes the design).

## R-01 Roles and states: `ElementInternals` for roles, host attributes for states

**Decision.** Every parent and child sets its role through `ElementInternals` (`internals.role`), as mission 005's
`naming.ts` does: `listbox`, `option`, `tablist`, `tab`, `tabpanel`, `group` (segmented choice and copy field),
`button` (segment). The selection states the paint is keyed on are written by the parent as ARIA attributes on the
child hosts: `aria-selected="true|false"` on options and tabs, `aria-pressed="true|false"` on segments,
`aria-disabled="true"` on a disabled child. Styles key on them (`:host([aria-selected="true"])`,
`:host([aria-pressed="true"])`), so the paint and the exposed state cannot disagree (spec "Selected-state paint",
FR-008), which #14 asks for in words ("paint keyed on `aria-selected`", "paint keyed on `aria-pressed`").

**Rationale.** Internals' ARIA properties are not selectable in CSS; an attribute is. A host attribute set by the
element is in the same tree scope as the host, so nothing crosses a shadow root (FR-004). Chromium honours a host
attribute over the internals default, so the attribute is the single source of the exposed state.

**Alternatives.** CustomStateSet states for the paint plus internals for ARIA: two sources that can disagree (the
spec forbids it). Rendering a native `<button>`/`role=option` node inside each child's shadow root: the parent's
listbox would then own children in another tree scope, which is exactly what #521 complains about.

**Host ARIA written by a page on a child** (an `aria-selected` the host writes itself) is not supported, as mission
005's Host ARIA rules do not support a host `role`: the parent overwrites the state attributes on every update. The
README says so.

## R-02 Tab-to-panel association: generated ids in the light DOM (spike in phase 3)

**Decision.** `ocelle-tabs` pairs tab *i* with panel *i* and writes, on the child hosts (all in the page's own tree
scope, beside each other), `aria-controls` on the tab and `aria-labelledby` on the panel, pointing at ids it
generates: `ocelle-tabs-<n>-tab-<i>` and `ocelle-tabs-<n>-panel-<i>` with `n` a per-document counter. A child that
already has an `id` keeps it and that id is used. The ids are rewritten when the pairing changes (FR-011).

**Rationale.** The references stay inside one tree scope, which is what constitution III requires; they work in every
engine of the floor. SC-003 reads the tree of a page whose host wrote no id.

**Alternatives.** ARIA element reflection on `ElementInternals` (`ariaControlsElements`, `ariaLabelledByElements`):
no id at all, but it needs Chromium 135 and is not in the WebKit 16.4 floor; it would raise the engine floor for the
whole package. The spike measures both in Chromium and records whether reflection would have worked, for a later
mission. The panel named by the tab's text through `internals.ariaLabel` copying the tab's text: duplicates the name,
drifts on text changes.

## R-03 Roving tabindex and focus on the child hosts

**Decision.** The focusable unit is the child host: the parent sets `tabIndex` 0 on the tab stop and -1 on every other
enabled child, and removes `tabindex` from disabled children (FR-016, FR-023, FR-028). Focus moves with
`child.focus({ focusVisible: true })` (focus ring on keyboard moves) and the ring is drawn by
`:host(:focus-visible)` with the focus tokens (FR-007). The selected tab's panel is focusable (`tabIndex` 0) only when
it holds no focusable descendant, measured on each update with a focusable-selector query on its light-DOM content
(FR-023).

**Rationale.** Children in the light DOM keep the composite in one tree scope; no `aria-activedescendant` is needed.

**Alternatives.** `aria-activedescendant` on the parent: an id reference from the parent host to children, which
works in one scope but leaves the screen reader's focus model to the engine and makes "focus is on X" unobservable
through `document.activeElement` (the spec reads focus that way).

## R-04 One keyboard mechanism: `src/roving.ts`

**Decision.** An internal module (not exported, not in the manifest; FR-005) with:

- a pure function `target(key, { index, enabled, wrap, rtl, axis })` returning the next index or `null` for an
  unhandled key; unit-tested over every key and edge (end, start, all disabled, single child, rtl) so each mutant has a
  killing test (#23's gate);
- a Lit `ReactiveController`, `RovingController`, owned by each parent, that reads the parent's child list, listens
  to `keydown` on the parent host (the child's keydown is composed and bubbles to it), calls `target`, moves focus,
  calls `preventDefault()` only for handled keys (spec "Handled and unhandled keys"), never `stopPropagation()`, and
  asks the parent to select when the pattern says so (`selectionFollowsFocus` for tabs; Enter/Space for listbox and
  segments).

Key maps: listbox `axis: "block"`, no wrap, ArrowUp/ArrowDown/Home/End; Enter/Space select. Tabs `axis: "inline"`,
wrap, ArrowLeft/ArrowRight (swapped under rtl)/Home/End; Enter/Space select. Segmented choice `axis: "both"`, wrap,
Right/Down forward, Left/Up back (Left/Right swapped under rtl), Home/End; Enter/Space press. `rtl` is read from
`getComputedStyle(parent).direction` at the keydown.

**Rationale.** One tested mechanism, three thin parents (the triage's reason to keep the stories together).

## R-05 Children, value and the remembered value: `src/selection.ts`

**Decision.** An internal `SelectionModel` per parent: the child list (from the default slot's `slotchange` plus a
`MutationObserver` on the children's `value` and `disabled` attributes), the selected child, the remembered value
(FR-010a) and the rules of FR-009 to FR-011a as pure functions over plain data (`{ value, disabled }[]`), unit-tested
in node. Updates are batched in one microtask after the last mutation or `slotchange` of a task, so children added or
enabled "in one operation (the same task)" are taken together (FR-010a "Precedence"; `slotchange` and mutation records
are delivered at the same microtask checkpoint). Default values (FR-009) are computed, not written to attributes.

**Rationale.** The rules of FR-010 to FR-011a are the riskiest part of the spec (three spec checks); as pure functions
they are testable without a browser and mutation-tested cheaply.

## R-06 Joined segmented choice rows: `ResizeObserver` inside the element and custom states (engine floor)

**Decision.** `ocelle-segmented-choice` with `joined` observes its own box with a `ResizeObserver` (an observer of
itself, no I/O; FR-029 forbids only a *consumer* observer) and on each callback groups segments into rows by their
`offsetTop`, then sets custom states on each segment through its internals: `row-start`, `row-end`, `first-row`,
`last-row`. Segment styles round corners with `:host(:state(row-start))` etc. No `style` attribute is ever written
(constitution IV; US3-10 pairs this with the measured radii). The callback runs before paint of the next frame, so
the spec's "await one `requestAnimationFrame`" measurement holds.

**Engine floor.** `:state()` needs Chromium 125 and WebKit 17.4. This raises the package floor from Chromium 120 /
WebKit 16.4 to Chromium 125 / WebKit 17.4, recorded in the README's engines section (mission 005's rule) and listed
under "Decisions the operator should see". Alternative without a floor raise: the parent writes
`data-ocelle-row-start` style attributes on segment hosts; rejected because those attributes become de facto public
surface a host can see and set, and the floor raise touches no consumer today (Kitty Desktop's webview and current
Chromium are above it).

**Alternatives.** CSS only: no selector reaches "first item of a wrapped row". A consumer `ResizeObserver`: what #511
asks to remove.

## R-07 Copy field layout, live region and the Copy control

**Decision.** Shadow DOM: a group (internals role `group`, named by `aria-label`), inside it
`<span part="value">` (the text, `white-space: pre-wrap; overflow-wrap: anywhere;` font from tokens with
`font-variant-numeric: tabular-nums`, `--ocelle-color-inset` ground), `<span role="status" aria-live="polite"
class="status">` (the live region, present and empty from first render, FR-041), and
`<button part="copy-control">` with `<ocelle-icon name="copy">` in an `icon-row` per the slot convention and an
`aria-label` from `copy-label`. The field's outer border is `--ocelle-color-control-border` against the page ground
(checked pairs on canvas, sheet, pane, panel, inspector, rail); the control's fill is `--ocelle-color-sheet` and the
line between the text well and the control is the same border, so no control boundary is drawn against
`color-inset`, where control-border measures 2.80:1 and #5 rule 1 (extended) requires `color-accent-strong`
(spec-check note SPEC-1-14). The well is not a control. The live region is updated only when the text differs from
its current content (FR-041), and emptied before the request event is dispatched (FR-035, FR-042).

**Native button keys.** Enter and Space activate a native `<button>` without the element calling `preventDefault()`
on keydown, so "handled" for the Copy control is the button's own activation, not `defaultPrevented` (spec-check note
SPEC-2-11). The copy field's tests read the request event for Enter and Space and `defaultPrevented` false for Escape
and letters only; the plan reads SC-001 that way for User Story 4, and the analysis after tasks checks it.

## R-08 Link: a native anchor in the shadow root, activation intercepted

**Decision.** `ocelle-link` renders `<a part="anchor">` around a default slot, with `delegatesFocus` on the shadow
root. With an allowed `href` (FR-047: resolved protocol `http:`, `https:` or the document's own) the anchor gets
`href` set to the resolved URL, so a modified activation (Ctrl, Meta, Shift click or Enter, middle click) is left
entirely to the browser (new tab or window, FR-046). Without `href`, or with a disallowed one, the anchor has no
`href`, `role="link"` and `tabindex="0"` (so it is still a focusable link in the tree), and modified activations do
nothing. A plain activation (primary click or Enter, Alt alone allowed) is intercepted on the anchor: the element
calls `preventDefault()` on the native click (so Chromium's Alt-click download does not happen, spec-check note
SPEC-2-07), dispatches the cancelable `ocelle-link-activate`, and, if it was not cancelled and the `href` is allowed,
calls `location.assign(resolved)`. Space is not handled (FR-046). Host `aria-label` is forwarded to the anchor
(constitution III, mission 005 Host ARIA). The focus ring uses `box-decoration-break: clone` so each line fragment is
outlined (FR-048); the underline is `text-decoration-line: underline` from tokens.

**Alternatives.** No native anchor and `location.assign` only: loses the browser's new-tab behaviour that the
operator's Q2 (a) keeps. Leaving the native navigation for plain clicks and cancelling it when the host cancels:
the event would have to be dispatched synchronously inside the native click and the protocol filter could not apply
to a native navigation already started; interception is simpler and testable.

## R-09 Navigation on a `file:` document (User Story 5 scenario 12; spike in phase 6)

**Decision to measure.** Chromium refuses module scripts from a `file:` document (null origin) unless launched with
`--allow-file-access-from-files`. The plan runs scenario 12 in its own Vitest browser project
(`elements-browser-file`) whose Playwright launch adds that flag, with a fixture copy that carries the policy in a
`<meta http-equiv="Content-Security-Policy">` (spec FR-057). Phase 6 starts with a spike: if the browser build loads
and the link navigates to the `file:` target, the project stays; if not, the phase stops and the operator chooses
(per the spec, the case is not dropped silently). A custom-scheme document through Playwright route interception is
the fallback the spike also tries (the document's protocol stays `http:` there, so it does not prove the case).

## R-10 Target size and the `axe` gate (spec-check note SPEC-1-16)

**Decision.** Options, tabs and segments have a minimum block size of `--ocelle-target-min` (44 px) and the Copy
control is at least `--ocelle-target-min` square (FR-030, FR-037). The axe rule set of 006 FR-016 includes
`target-size` (tag `wcag22aa`); with 44 px every target passes it without relying on spacing. `ocelle-link` in running
text is exempt from target size (WCAG 2.5.8 inline exception) and axe does not flag inline links in a sentence; its
story keeps it inside a paragraph.

## R-11 Tests: harnesses, real input, accessibility tree

**Decision.** Reuse mission 005's two harnesses: scenario bodies in `test/scenarios/*.ts` against the driver, run in
process (`elements`, mutated by Stryker) and on the strict-CSP fixture (`elements-browser`). Real keyboard input
through the Vitest browser `userEvent.keyboard` (Playwright provider, trusted events) in process and Playwright's
`page.keyboard` on the fixture; the driver gets `press(key)`, `click(target, { button, modifiers })`,
`activeElement()` (through shadow roots) and `keydownRecord()` (a `document` bubble listener recording key and
`defaultPrevented`). The `axTree` command of mission 005 is extended to report `selected`, `pressed`, `disabled`,
`controls` and live-region properties. New fixtures: `listbox.html`, `tabs.html`, `segmented-choice.html`,
`copy-field.html`, `link.html`, `link-target.html`, and the `file:` copy (R-09). Navigation is observed as the spec's
"Observing navigation" says, with a `window` marker.

**Pairing plants.** Each "does not" outcome names its planted defect in `contracts/elements.md` § Pairings; the
review checks that each paired test fails on it.

## R-12 Stories, baselines and axe on #10 (recheck when #10 merges; implementation waits for it)

**Decision.** Stories in `storybook/stories/<element>.stories.ts` (listbox, tabs, segmented-choice, copy-field,
link), one story per variant and state named in FR-050, captured in light and dark by #10's `visual` gate; baselines
produced with #10's `visual:update` in the pinned container (006 `contracts/container.md`) and committed under
`storybook/baselines/`; the `axe` gate over every story. Focused states use a story `play` that focuses the target
through the story's render (006 renders each story fresh and captures after the render signal); hover uses 006
FR-031's pointer parameter (link hover). Per operator decision I3, the stories and the story test
(`storybook/test/integration/elements-stories.test.ts`, extended) are written in the phase's red commit; the
baselines are produced in the green commit (a capture of a story that does not render yet is meaningless).

**Recheck.** Phase 1's first task compares this plan with #10 as merged: the gate ids, the story id scheme, the
pointer and focus parameters, the baseline command, the contributor note (006 FR-025) and `contracts/gates.md` /
`contracts/container.md`. Differences are fixed in the plan and tasks before phase 2's red commit (FR-053).

## R-13 Mutation testing under #23

**Decision.** `packages/elements/src/**` is mutated by the elements Stryker configuration (mission 005). Under #23,
Timeout and CompileError mutants and zero-mutant entries are report lines, not findings; 30-line entries. Keyboard
and selection logic sit in pure functions (R-04, R-05) so each mutant is killed by a fast node test, keeping shards
short. The element classes' remaining branches are killed by the in-process scenarios.

## R-14 Spec-check notes carried into the plan

- SPEC-3-02 (focus when a focused, unselected child becomes disabled): the focus moves as for a removed child
  (FR-011's target), the child leaves the tab order; a selected listbox option that becomes disabled stays selected
  and keeps focus until the user moves (FR-016 makes it lose the tab stop only). Tested in phases 2 to 4 as extra
  scenarios; listed for the analysis.
- SPEC-3-03 (reorder of the focused or selected child): a reorder is a move, not a remove: the moved child keeps
  focus and selection (the `MutationObserver` batch sees the same node removed and re-added in one task, R-05, and
  the model treats a node present before and after the batch as kept). Tested in phase 2.
- SPEC-1-14 and SPEC-1-16: R-07 and R-10. SPEC-2-07: R-08.
