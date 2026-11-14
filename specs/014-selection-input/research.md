# Research: Selection and Input Elements (014)

Each entry: decision, rationale, alternatives. "Spike" marks a decision that a phase measures before its red commit and
records in `reviews/phase-N/spike.md`; if the measurement contradicts the decision, the phase stops and the operator
decides (the spike never silently changes the design).

Plan squad round 1 (`reviews/plan/round-1/refute.md`) changed R-01 and R-03 to R-14 and added R-15 to R-18; plan squad
round 2 (`reviews/plan/round-2/refute.md`) changed R-02, R-03, R-05 to R-08 and R-15; the finding each change answers
is named where it applies.

## R-01 Roles and states: `ElementInternals` for roles, host attributes for states

**Decision.** Every element sets its own role through `ElementInternals` (`internals.role`), as mission 005's
`naming.ts` does: `listbox` (`ocelle-listbox`), `option`, `tab`, `tabpanel`, `toolbar` with `ariaOrientation`
`"horizontal"` (`ocelle-segmented-choice`, operator decision PLAN-A11Y-SECURITY-1-008 (a)), `button` (segment) and
`group` (copy field). The selection states the paint is keyed on are written by the parent as ARIA attributes on the
child hosts: `aria-selected="true|false"` on options and tabs, `aria-pressed="true|false"` on segments,
`aria-disabled="true"` on a disabled child. Styles key on them (`:host([aria-selected="true"])`,
`:host([aria-pressed="true"])`), so the paint and the exposed state cannot disagree (spec "Selected-state paint",
FR-008), which #14 asks for in words ("paint keyed on `aria-selected`", "paint keyed on `aria-pressed`").

**`ocelle-tabs` is not the tablist** (PLAN-A11Y-SECURITY-1-001). Its panels are light-DOM children of its host, so a
tablist role on the host would put every tabpanel and its content inside the tablist in the flat tree (ARIA: a
tablist owns only tabs; Chromium probe in the lens). The host has no role. The shadow container `part="tablist"`
carries `role="tablist"` and its name: `aria-label` set from `label` (trimmed, blank as none) or from the host's
`aria-label`, which the element observes (`observedAttributes`) so a later change follows; a present host
`aria-label` decides alone (FR-006). The tabs are slotted into that container, so they are its only owned elements,
and the panel container is its sibling. The host keeps no name of its own in the tree: phase 3's spike probes the
host's exposure with a host `aria-label` and requires exactly one named node (the tablist), with the same candidates
and fallback as the link host (R-08). US2-1 reads that no tabpanel has a tablist ancestor; plant: the tablist role on
the host.

**Where internals are kept** (operator decision PLAN-FRESH-1-001 (a)). axe-core 4.14.0, the version #10's `axe` gate
pins, finds an element's internals only through `globalThis._elementInternals`, own properties `_internals`,
`internals`, `internals_` or own symbols described `internals` / `privateInternals` (`_getElementInternals`); mission
005's elements keep internals in an ES private field, which axe cannot see. To axe a focusable child host with no role
carrying `aria-selected` or `aria-pressed` is a critical `aria-allowed-attr` violation, which FR-051 forbids. The new
elements therefore store their internals under an own property keyed by a module-private
`Symbol("internals")` (one symbol in an internal module, `src/internals.ts`, shared by the new elements): axe reads it,
no string-keyed property is added to the element, the manifest does not list it and it is not documented as surface.
Mission 005's elements are unchanged. Phase 2's red commit adds a story test that runs the `axe` gate's rule set on
the listbox stories and asserts no `aria-allowed-attr` finding; plant: the internals in a private field.

**Rationale.** Internals' ARIA properties are not selectable in CSS; an attribute is. A host attribute set by the
element is in the same tree scope as the host, so nothing crosses a shadow root (FR-004). Chromium honours a host
attribute over the internals default, so the attribute is the single source of the exposed state. `toolbar` is the
ARIA composite whose keyboard model is the segmented choice's (one tab stop, arrows between toggle buttons); `group`
implies no keyboard model, so a screen-reader user who tabs in would meet one toggle button with no cue that arrows
reach the others.

**Alternatives.** CustomStateSet states for the paint plus internals for ARIA: two sources that can disagree (the
spec forbids it). Rendering a native `<button>`/`role=option` node inside each child's shadow root: the parent's
listbox would then own children in another tree scope, which is exactly what #521 complains about. For axe: writing a
`role` attribute on child hosts (option (b)) or registering internals in #10's gate (option (c), a change to #10's
final design); not chosen.

**Host ARIA written by a page on a child** (an `aria-selected` the host writes itself) is not supported, as mission
005's Host ARIA rules do not support a host `role`: the parent overwrites the state attributes on every update. The
README says so.

## R-02 Tab-to-panel association: generated ids in the light DOM (spike in phase 3)

**Decision.** `ocelle-tabs` pairs tab *i* with panel *i* and writes, on the child hosts (all in the page's own tree
scope, beside each other), `aria-controls` on every paired tab and `aria-labelledby` on the assigned (selected) panel
only, pointing at ids it generates: `ocelle-tabs-<n>-tab-<i>` and `ocelle-tabs-<n>-panel-<i>` with `n` a per-document
counter. A child that already has an `id` keeps it and that id is used. The ids are rewritten when the pairing changes
(FR-011); `aria-labelledby` is removed from a panel when it is unassigned and written on the panel that is assigned,
in the same batch (R-05).

**Why only the assigned panel is labelled** (PLAN-FRESH-2-002). axe-core 4.14.0, the version #10's `axe` gate pins,
throws in its `color-contrast` matcher for a tab named by the `aria-labelledby` of a panel outside its flat tree (an
unassigned panel under manual slot assignment), and reports a serious `incomplete` on each such tab (round-2 lens
probe tabs7: `TypeError ... reading '_isDisabled'` in `colorContrastMatches`). #10's spec makes a serious or critical
`incomplete` a gate finding with no exception entry, so every tabs story would fail the gate. With `aria-labelledby`
on the assigned panel only and `aria-controls` kept on every paired tab, the probe (tabs6) is clean. An unassigned
panel has no node (FR-024, R-05), so its name is moot and no spec outcome changes; the round-1 manual assignment
(PLAN-CORRECTNESS-1-003) is kept. Assigning every panel and hiding unselected ones with `hidden` would undo that fix
and is not chosen. The axe defect is recorded in `reviews/phase-3/spike.md` for an upstream report to axe-core.
Phase 3's story test runs #10's full rule set on the tabs stories and asserts no violation and no serious or critical
`incomplete`; plant: `aria-labelledby` on every panel. The tab and
panel scenarios give children no `id` unless the scenario is about a host id, so the generated-id path is the one
under test everywhere (PLAN-TESTABILITY-1-006).

**Rationale.** The references stay inside one tree scope, which is what constitution III requires; they work in every
engine of the floor. SC-003 reads the tree of a page whose host wrote no id.

**Alternatives.** ARIA element reflection on `ElementInternals` (`ariaControlsElements`, `ariaLabelledByElements`):
no id at all, but it needs Chromium 135 and is not in the WebKit 16.4 floor; it would raise the engine floor for the
whole package. The spike measures both in Chromium and records whether reflection would have worked, for a later
mission. The panel named by the tab's text through `internals.ariaLabel` copying the tab's text: duplicates the name,
drifts on text changes.

## R-03 Roving tabindex and focus on the child hosts

**Decision.** The focusable unit is the child host: the parent sets `tabIndex` 0 on the tab stop and -1 on every other
child, disabled children included (operator decision PLAN-CORRECTNESS-1-004 (a)): a disabled child stays focusable,
the roving keys skip it (R-04) and Tab does not reach it, so a focused child that becomes disabled keeps focus (US1-18,
SPEC-3-02). A `mousedown` on a disabled child has its default prevented, so a click neither focuses nor selects it.
Focus moves with `child.focus({ focusVisible: true })` (focus ring on keyboard moves) and the ring is drawn from the
focus tokens on a raised `:host(:focus-visible)::after` of the option, tab or segment (R-06, R-15; FR-007).

**Focus record** (PLAN-CORRECTNESS-1-004, PLAN-FRESH-2-001, PLAN-FRESH-3-001). Chromium blurs a focused element
synchronously when it is removed or moved (a move is remove + insert); by the time a batch (R-05) runs,
`document.activeElement` is the body. Measured in Chromium 153 (plan squad round 2), `insertBefore(a, null)` of a
focused child and `a.remove()` both fire `blur` then `focusout` on the parent inside the `remove()` /
`insertBefore()` call, while the target is still connected and still the parent's child (`isConnected === true`,
`parentNode === parent`), and `activeElement` is the body afterwards; a `focusout` fired after detachment could not
reach the parent at all. A user's blur looks the same at the event: while `focusout` is dispatched for a Tab or a
click, `activeElement` is the body and the new element has not received focus yet, and a host that re-renders its
children on blur in a microtask or a `requestAnimationFrame` mutates the parent before the focus change completes
(measured in plan squad round 3: a record scoped to the task of the blur, with a `setTimeout(0)` clear, refocused the
option after a real Tab and a real click on an outside button, so the user could not leave). So the record decides
whether the removal caused the blur, not when the mutation happened. Each parent keeps, from `focusin` / `focusout`
on its host (one capture-phase listener on the host, so it runs before any listener on the child and before bubbling
listeners):

- `focused`: the child that has focus (set on `focusin` on a child, cleared on `focusout`);
- `blurred`: set only by a `focusout` whose target is one of this parent's children and whose `relatedTarget` is
  `null`. A `focusout` with a non-null `relatedTarget` (focus is going to a known element: Tab, Shift+Tab, a click on
  a focusable) records nothing and clears `blurred`. A `focusin` on any child also clears it.

When it sets `blurred`, the `focusout` handler queues a microtask at once. A removal-induced blur runs the handler
inside the `remove()` / `insertBefore()` call, so this microtask is queued before any microtask a host listener or the
host's later code queues, and it runs first. It calls the host observer's `takeRecords()`. Only when those records
list `blurred` in `removedNodes` did the removal cause the blur: it processes those records as the batch with
`blurred` as "had focus at the batch", provided `document.activeElement` is the body or `null` (an element anywhere,
inside the parent or not, means focus went somewhere and is left alone). Otherwise it clears `blurred` and processes
any records it took as an ordinary batch. Then, when the child had focus: a child that is still or again a child
after the batch (a move, the same position included) is refocused; a child that is gone moves focus per FR-011 (and
per FR-011a with the selection for tabs and segments). In every other case focus is left alone. No task
(`setTimeout(0)`) clears the record and no "nothing inside the parent" clause qualifies a batch; both were the round-2
design and both trapped focus (PLAN-FRESH-3-001). The phase-2 spike records, in Chromium, the order of the listener
calls and microtasks for a removal-induced blur (`relatedTarget` null, records found by `takeRecords()`) and for a user
Tab and click followed by a host move or removal in a microtask and in a `requestAnimationFrame`
(`reviews/phase-2/spike.md`).

US1-21 reads `document.activeElement` after `insertBefore` of the focused option; plant: no refocus. Its negative
pairs (contract § Pairings): "a move does not steal focus back" (the user clicks the page to leave the focused option,
then, in a later task, the host moves that option; focus stays on the body) and "Tab out while the host re-renders on
blur" (a host `focusout` listener moves or removes the focused option in a microtask, and in another case in a
`requestAnimationFrame`; a real Tab and a real click on an outside button; `document.activeElement` is the outside
element). Plants: the record scoped only by its task (`setTimeout(0)` clear, no `relatedTarget` or `takeRecords()`
check), the "nothing inside the parent" clause, refocusing after any blur.

**Selected panel.** The selected tab's panel is focusable (`tabIndex` 0) only when it holds no element in the
sequential focus order (PLAN-A11Y-SECURITY-1-009): elements with `tabIndex >= 0` that are not disabled or hidden,
including hosts whose shadow root delegates focus (`ocelle-link`) and focusables reached through open shadow roots.
It is re-measured on each tabs batch and on a subtree `MutationObserver` of the selected panel (`childList`, and the
attributes `tabindex`, `disabled`, `href`, `hidden`, `contenteditable`), so content an htmx swap puts in or takes out
of a panel after render is followed. US2-22: a panel holding only `ocelle-link` is not a stop; a panel whose button is
removed after render becomes one; plant: a light-DOM selector query measured at tabs updates only.

**Listbox scroll container** (PLAN-A11Y-SECURITY-1-007, PLAN-FRESH-1-013). `part="list"` is the scroll container
(FR-017). It has inline and block padding of at least `--ocelle-focus-width` + `--ocelle-focus-offset`, so the ring (the
option's raised `::after`, R-06) of the first, the last and any scrolled-to option lies inside its clip (US1-16 measures
the ring's box against the container's client box; plant: no padding). It carries `tabindex="-1"`, which turns off
Chromium's keyboard-focusable scroller (Chromium 130+ makes an overflowing scroller with no focusable descendant a tab
stop, 008 research): an all-disabled overflowing listbox has no tab stop (US1-22; plant: no tabindex on the scroller). A
`mousedown` on the list part itself (its padding, not an option) has its default prevented so it never takes focus.

**Rationale.** Children in the light DOM keep the composite in one tree scope; no `aria-activedescendant` is needed.
Keeping disabled children at -1 is the only way to keep focus on a child that becomes disabled.

**Alternatives.** `aria-activedescendant` on the parent: an id reference from the parent host to children, which
works in one scope but leaves the screen reader's focus model to the engine and makes "focus is on X" unobservable
through `document.activeElement` (the spec reads focus that way). Removing `tabindex` from disabled children
(fork option (b)): focus on a newly disabled child would move as for a removal; not chosen.

## R-04 One keyboard mechanism: `src/roving.ts`

**Decision.** An internal module (not exported, not in the manifest; FR-005) with:

- a pure function `target(key, { index, enabled, wrap, rtl, axis })` returning the next index or `null` for an
  unhandled key; tested over every key and edge (end, start, all disabled, single child, rtl) in the in-process
  `elements` project (`test/roving.test.ts`, plain cases with no DOM), which the elements Stryker configuration runs,
  so each mutant has a killing test (#23's gate; PLAN-CORRECTNESS-1-001);
- a pure guard `owns(event, children)` deciding whether a keydown is the parent's to handle (below), tested there too;
- a Lit `ReactiveController`, `RovingController`, owned by each parent, that reads the parent's child list, listens
  to `keydown` on the parent host, applies the guard, calls `target`, moves focus, calls `preventDefault()` only for
  handled keys (spec "Handled and unhandled keys"), never `stopPropagation()`, and asks the parent to select when the
  pattern says so (`selectionFollowsFocus` for tabs; Enter/Space for listbox and segments; Enter on the selected
  option activates, R-18).

**Origin filter** (PLAN-CORRECTNESS-1-002). The parent host receives every keydown from its light-DOM descendants:
the tabs' panels, and content inside a child. The controller acts only when the event's target is one of the
parent's own child entries itself (an `ocelle-tab`, `ocelle-option` or `ocelle-segment` host that is a direct child of
this parent; not a panel, not a descendant of a child, not a child of a nested parent), and ignores an event whose
`defaultPrevented` is already true (a nested control handled it). Scenarios: US2-21 (Enter and Space on a button in
the selected panel activate it; ArrowLeft, Home and End in a text input move the caret; ArrowRight in a nested
segmented choice moves only its segments; no tabs change, paired with ArrowRight on a tab); plant: the controller
without the target check.

Key maps: listbox `axis: "block"`, no wrap, ArrowUp/ArrowDown/Home/End; Enter/Space select. Tabs `axis: "inline"`,
wrap, ArrowLeft/ArrowRight (swapped under rtl)/Home/End; Enter/Space select. Segmented choice (toolbar) `axis:
"both"`, wrap, Right/Down forward, Left/Up back (Left/Right swapped under rtl), Home/End; Enter/Space press. `rtl` is
read from `getComputedStyle(parent).direction` at the keydown. Disabled children are skipped (`enabled` false) and
unpaired tabs are not in the list (R-05).

**Rationale.** One tested mechanism, three thin parents (the triage's reason to keep the stories together).

## R-05 Children, value and the remembered value: `src/selection.ts`

**Decision.** An internal `SelectionModel` per parent: the child list, the selected child, the remembered value
(FR-010a), the focus record (R-03) and the rules of FR-009 to FR-011a as pure functions over plain data
(`{ value, disabled }[]`), tested in the in-process `elements` project (`test/selection.test.ts`, plain cases with no
DOM; PLAN-CORRECTNESS-1-001). Default values (FR-009) are computed, not written to attributes.

**Child list** (PLAN-CORRECTNESS-1-003, -004). Every parent takes its child list from a `MutationObserver` on its host
(`childList`, and `attributes` with `subtree` and `attributeFilter: ["value", "disabled"]`), not from `slotchange`: the
observer sees appends, removals and moves (a same-position re-insert included) whatever the slot assignment. The
listbox and the segmented choice slot their children through an ordinary default slot. `ocelle-tabs` uses
`slotAssignment: "manual"`, where slot names and `slot` attributes are ignored, nothing is assigned automatically and
appending a child fires no `slotchange`; on each batch it assigns the paired tabs to the slot inside
`part="tablist"` and only the selected tab's paired panel to the slot inside `part="panels"`, moving the panel's
`aria-labelledby` to the newly assigned panel (R-02). Unselected panels and unpaired tabs and panels are assigned
nowhere and carry no `aria-labelledby`: no box, no node, not focusable, not clickable (FR-019, FR-024,
SPEC-1-25). A host writes no `slot` attribute and the manifest lists no named slot (contract).

**Batching** (operator decision PLAN-CORRECTNESS-1-014 (a)). Records are processed in one batch per microtask
checkpoint (the observer's callback), so children added or enabled synchronously before the next checkpoint are taken
together (FR-010a "Precedence", amended to "one microtask checkpoint"); changes separated by an `await` are separate
batches. The `value` setter first takes the pending records (`MutationObserver.takeRecords()`, processed as a batch)
and reads the live children, so `listbox.append(option); listbox.value = option.value` selects through FR-010's
direct path; plant: the setter deciding on the cached list.

**Batch outcome.** A node present before and after a batch is kept (a move), with its selection; focus follows R-03's
focus record. Batch-driven selection changes emit no event (FR-002). Data model: `data-model.md`.

**Rationale.** The rules of FR-010 to FR-011a are the riskiest part of the spec (three spec checks); as pure functions
they are testable without DOM setup and are killed by the in-process project Stryker runs.

**Alternatives.** Batch per task with a `setTimeout(0)` flush (fork option (b)): selection after child changes would
be asynchronous to the task; not chosen.

## R-06 Joined segmented choice rows: `ResizeObserver` inside the element and custom states (engine floor)

**Decision.** `ocelle-segmented-choice` with `joined` observes its own box and every segment's box with one
`ResizeObserver` (observers of itself and its children, no I/O; FR-029 forbids only a *consumer* observer), and also
regroups after each child batch of R-05 (PLAN-CORRECTNESS-1-006): a label, icon or font-load change that moves the
row break without resizing the group, and a segment added or removed at the same group size, are seen. The grouping
puts segments into rows by their `offsetTop` and sets custom states on each segment: `row-start`, `row-end`,
`first-row`, `last-row`. Segment styles round corners with `:host(:state(row-start))` etc. No `style` attribute is
ever written (constitution IV; US3-10 pairs this with the measured radii).

**Shared lines** (PLAN-FRESH-1-005). Every segment draws a full border of `--ocelle-border-width` and every segment
has the same negative block-start and inline-start margins of one `--ocelle-border-width` (the group pads its own
start sides by the same amount), so neighbours' lines overlap into one line, between rows too. This does not depend
on the row states: the states change only border radii, which do not affect layout, so regrouping cannot move the row
break and cannot start a `ResizeObserver` loop. The pressed segment (and a hovered one) is raised (`position:
relative; z-index: 1`) so its `--ocelle-color-accent-strong` lines (operator decision PLAN-CORRECTNESS-1-010 (a))
lie over its neighbours' `control-border` lines at the same width. The pressed bar is R-15's block-end bar inside the
box.

**Focus ring above the neighbours** (PLAN-FRESH-2-003, PLAN-FRESH-3-002, PLAN-FRESH-3-003). Flex items and
positioned boxes paint atomically in order, and the raised pressed or hovered segment paints above its neighbours:
measured in the round-2 lens probe (Chromium 153, the joined geometry), a focused segment's outline is covered on the
side of a later filled neighbour and on the side of a raised one, so the ring shows on three sides only. A gap is ruled
out (US3-9: the segments touch). Raising the whole focused host (`z-index: 2`, the round-2 design) is wrong too: its
own `control-border` box then covers the pressed or hovered neighbour's `accent-strong` line (measured in round 3:
the shared line is `control-border` grey in both orders), which breaks US3-9, FR-029 and #5 rule 1. The same cut
happens in the listbox: `ocelle-option` is a positioned box (its bar is an absolute `::before`, R-15) and options
stack with no gap, so a later hovered option's `hover-bg` fill covers the block-end side of the focused option's
outline (measured in round 3).

So the ring is not the host's outline. On `ocelle-option`, `ocelle-tab` and `ocelle-segment` (both variants, one
rule) the ring is a `:host(:focus-visible)::after` absolutely positioned at
`inset: calc(-1 * (var(--ocelle-focus-offset) + var(--ocelle-focus-width)))` with a `--ocelle-focus-width` solid
border in `--ocelle-color-focus`, `pointer-events: none` and `z-index: 2`. The focused host itself is
`position: relative` with `z-index: auto`, so it opens no stacking context: the pseudo-element stacks in the parent's
context above the raised neighbours (`z-index: 1`), while the host's own border stays at its own level and never
covers a neighbour's `accent-strong` line. A focused segment that is itself pressed or hovered is already raised
(`z-index: 1`, a stacking context that would hold its ring below a later raised neighbour), so it is raised to
`z-index: 2` instead; its own lines are then `accent-strong`, which may cover a neighbour's line only with the same
colour. Under `@media (forced-colors: active)` the ring pseudo-element has `forced-color-adjust: none` and a
`Highlight` border, as the bar does (R-15). The ring then lies over the neighbour's fill, so its grounds include
`accent-low` and `hover-bg` (R-15's table). Read: R-15 What the tests read; plants: `z-index` on the focused host, the
option's ring not raised.

**Cross-element call** (operator decision PLAN-CORRECTNESS-1-015 (a)). The parent cannot reach a segment's internals.
`ocelle-segment` exposes an internal method under a module-private symbol (`src/internals.ts`) that sets its row
states; the parent calls it only when the segment has it (feature check), so an un-upgraded segment or one from
another copy of the package is left unrounded and nothing throws; the segment's own module is imported by the
parent's (R-16), so in one copy the method is always there.

**Timing** (PLAN-CORRECTNESS-1-005). In HTML's update-the-rendering steps, animation-frame callbacks run before resize
observations are broadcast: a test that resizes in a task and awaits one `requestAnimationFrame` resumes before the
element's callback of that frame and reads the old radii (lens probes, Chromium 153). The rounding is right in the
frame that renders the resize (the observer's state changes restyle before paint). The tests measure as spec US3-10
now says: the resize is done by a driver step that does not settle (R-11 `resize`), then the test waits for a
`ResizeObserver` it registered on the group after the element rendered (its callback runs after the element's in the
same delivery) or for two animation frames, and reads the computed radii. Plant: the state update deferred by one
extra frame (an extra `requestAnimationFrame`), which the measurement must fail. The in-process `settle()`'s hidden
frame is not used by this step.

**Engine floor.** `:state()` needs Chromium 125 and WebKit 17.4. This raises the package floor from Chromium 120 /
WebKit 16.4 to Chromium 125 / WebKit 17.4, recorded in the README's engines section (mission 005's rule) and listed
under the plan's "Decisions the operator should see". The real trade-off (PLAN-FRESH-1-012):

- custom states (chosen here): no host-visible attribute; a cross-element call through the segment (above); the floor
  raised for the whole package;
- element-owned row attributes on segment hosts (`data-ocelle-row-start` etc.): the same model as R-01's state
  attributes and R-03's `tabindex` (written by the parent, documented as element-owned, overwritten on every update),
  read by the segment's own CSS without a cross-element call, and no floor raise.

The earlier claim that the floor raise "touches no consumer today" is withdrawn: Kitty Desktop on Linux runs the
distribution's WebKitGTK and on macOS WKWebView, and their minimum versions are not recorded in this repository
(README § Engines: WebKit is not measured). Before the operator takes plan decision 1, kitty-mission-ui is asked for
its WebKitGTK and WKWebView minimums; the answer is recorded here. **Status** (analysis U1, operator decision Q2 (c),
2026-11-13; stop placement: second analysis U1, operator decision Q3 (b)): decision 1 stays open. The operator asks
kitty-mission-ui for its minimums first. Phase 4 stops for the answer before it starts, before T060 (task T059a), and
the answer is recorded here. If the operator then confirms the floor, phase 4 implements the custom states (T064, T066, T067). If not, phase 4
implements the row attributes instead (T062a, T064a, T066a, T067a), and the package floor stays Chromium 120 / WebKit
16.4. Under the alternative, the parent writes `data-ocelle-row-start`, `data-ocelle-row-end`, `data-ocelle-first-row`
and `data-ocelle-last-row` on segment hosts. These attributes are element-owned and overwritten on every regroup. The
segment's own CSS reads them (`:host([data-ocelle-row-start])` and so on), and no internal method is called on the
segment. The row attributes are internal: they are not manifest attributes, not part of the public surface and not a
styling hook (hosts must not select on them), and their names and values may change in a PATCH release. The README
says so (T064a, T067a; contracts/elements.md § `ocelle-segmented-choice`; second analysis U2). The shared-line,
focus-ring and timing rules above are the same for both designs. Only the selector that rounds
the corners differs. The same request carries R-07's user-activation question (a clipboard write from the deferred copy
request in WKWebView and WebKitGTK; PLAN-FRESH-2-004 (a)), also put to the console owners.

**Alternatives.** CSS only: no selector reaches "first item of a wrapped row". A consumer `ResizeObserver`: what #511
asks to remove.

## R-07 Copy field layout, live region and the Copy control

**Decision.** Shadow DOM: a group (internals role `group`, named by a host `aria-label`; without one, an unnamed group,
SPEC-1-19), inside it `<span part="value">` (the text, `white-space: pre-wrap; overflow-wrap: anywhere;` font from
tokens with `font-variant-numeric: tabular-nums`, `--ocelle-color-inset` ground), `<span role="status"
aria-live="polite" class="status">` (the live region, present and empty from first render, FR-041), and
`<button part="copy-control">` with `<ocelle-icon name="copy">` in an `icon-row` per the slot convention and an
`aria-label` from `copy-label`; the button's shadow rule sets `font: inherit`, as 006's contributor note asks of every
form control in a shadow root (006 FR-025, FR-027; recheck T001). `ocelle-copy-field.ts` imports `ocelle-icon.ts`, so the copy field's entry defines
`ocelle-icon` (R-16). No slot (SPEC-2-10).

**Lines and grounds** (operator decision PLAN-CORRECTNESS-1-010 (a), SPEC-1-14). The field's outer border is
`--ocelle-color-control-border` against the page ground (checked pairs on canvas, sheet, pane, panel, inspector,
rail). The control's fill is `--ocelle-color-sheet`. The one line between the text well (`inset`) and the control is
the control's inline-start border, `--ocelle-border-width` in `--ocelle-color-accent-strong`: #5 rule 1 (extended)
borders a control on `inset` with `accent-strong` (`control-border` on `inset` is 2.80 / 2.95, excluded);
`accent-strong` on `inset` is checked (4.11 / 6.28) and on `sheet` is checked with R-17's new pairs. The well is not
a control; the field's outer border bounds the field against the page ground, not against `inset`.

**Live region written outside Lit** (PLAN-CORRECTNESS-1-012). The region's text node is not part of the Lit template:
the element owns one `Text` node in the region and writes it imperatively and synchronously. The `status` setter
writes it only when the new text differs from the node's current data (so a repeated set mutates nothing, US4-5);
blank text writes `""`. An activation sets `status` to `""` and empties the node at once (FR-035, FR-042), so a
listener reading `field.status` or the region during the event sees `""`, and the host's set of the same text
afterwards writes the node again (a recorded mutation, US4-6). A Lit-rendered region would hold the old text during
the event and see no change on a same-text set.

**Request timing** (operator decision PLAN-TESTABILITY-1-011 (a), SPEC-2-12). The request is dispatched after the
cleared region has reached the accessibility tree, so a host that sets the same status synchronously in its listener
produces a change a screen reader sees: the activation clears, then waits for the next rendering update to complete
(a `requestAnimationFrame` callback followed by a task, i.e. after that frame's style, layout and accessibility
update), then dispatches `ocelle-copy-field-request` with the text captured at activation. Each activation schedules
its own dispatch; a disconnected element dispatches nothing; the README states the timing (FR-035).

**User activation** (PLAN-FRESH-2-004, operator decision (a): the deferred dispatch is kept). The request arrives a
frame and a task after the click, outside the click's task. A browser host (the console, Kitty Dashboard) that writes
the clipboard from the page with `navigator.clipboard.writeText(event.detail.text)` depends on the engine still
counting the user's transient activation then. Chromium probably does; WebKit, a named consumer engine, is not
measured and cannot be probed here. Therefore:

- the phase-5 spike adds a host listener calling `navigator.clipboard.writeText` from the deferred request in
  Chromium, with no clipboard permission granted to the test context (PLAN-FRESH-3-004: in Chromium a granted
  clipboard-write permission replaces the user-activation requirement, so a granted write resolves on a page never
  clicked and the spike could not fail). The same page holds two controls, run first: a write with no prior click
  must reject (the gate is on), and a write made synchronously in a real click's handler must resolve (the setup can
  succeed). Only when both hold does it record the deferred request's write: `navigator.userActivation.isActive` at
  the dispatch and whether the write resolved or rejected, in `reviews/phase-5/spike.md`. If the controls cannot be
  made to hold without a grant, the spike records that it cannot answer the question in Chromium, and the Chromium
  question goes to the owners as open together with the WebKit question and plan decision 1, never as a grant-based
  pass. This listener exists only in the spike page; no scenario of the element calls the clipboard, and the
  clipboard observer's zero-call assertion (R-11) is unchanged;
- the WebKit question (does a clipboard write from the deferred request still count as user-activated in WKWebView
  and WebKitGTK) goes to kitty-mission-ui and the console owners together with plan decision 1's engine question
  (R-06), and the answer is recorded here;
- the README's FR-035 paragraph says that the request is dispatched after the next frame, outside the click's task,
  so a host that writes the clipboard from the page must check its engines' user-activation rules for clipboard
  writes (a desktop bridge is not affected); the documentation test checks the statement.

**What US4-6 observes** (verify 1 of plan round 1, PLAN-TESTABILITY-1-011). A tree read from the listener cannot
test this: `axStates` is an asynchronous CDP command and Chromium builds the tree it returns from the DOM as it is at
the read, so a listener that awaits a read sees the region empty under synchronous dispatch as well (the DOM is
cleared and the host has not set yet), and awaiting makes the host's set asynchronous, which is not the case the
decision is about. US4-6's listener is therefore synchronous: it records `field.status` and the region's text, then
sets the same status text at once, never awaiting. The test observes the timing and the tree's history instead:

- *Frame order* (every run, both harnesses). A capture-phase listener on `document` for the activating event
  (`click`, which Enter and Space on the native button also produce) registers a `requestAnimationFrame` callback in
  the activation's task, before the element's own handler runs. That callback records the region's text and the
  number of requests so far; the request listener records its own entry. Asserted: the record is
  `activation, activation end (0 requests), frame (region "", 0 requests), request (status "", region "")`, where
  *activation end* is a bubble-phase `click` listener on `document`, which runs after the element's handler in the
  activation's task (so no request in that task). Plants: synchronous dispatch (the request
  comes before the frame, and the frame sees the host's text again); dispatch in a microtask (same).
- *Tree history* (the phase-5 spike, then every run if the spike holds). The test enables CDP's `Accessibility`
  domain, fetches the region's node before the activation (`Accessibility.nodesUpdated` reports only nodes already
  requested) and records every `nodesUpdated` event for it until the request has been handled and the page settled.
  Asserted: an update with the region present and empty precedes the update holding the host's text. Under
  synchronous dispatch the DOM is cleared and refilled within one task, the next accessibility serialisation sees the
  same text, and no empty update is recorded, so the plant fails. A second plant, dispatch inside the element's own
  `requestAnimationFrame` callback (before that frame's style, layout and accessibility update), is caught here, not
  by the frame order.

Spike in phase 5, recorded before the red commit: in Chromium, confirm that `Accessibility.nodesUpdated` delivers the
empty and the refilled state for the region under the designed timing and only the refilled (or no) change under
synchronous dispatch. If one frame plus a task is not enough for the empty state to be recorded, the spike measures
what is and R-07's timing follows it. If the events are not delivered for the region, or no bounded wait yields the
empty update, the frame-order observation alone stays and the operator decides whether that is accepted or the
decision is revisited (plan Decisions 7).

**Native button keys.** Enter and Space activate a native `<button>` without the element calling `preventDefault()`
on keydown, so "handled" for the Copy control is the button's own activation, not `defaultPrevented` (spec-check note
SPEC-2-11). The copy field's tests read the request event for Enter and Space and `defaultPrevented` false for Escape
and letters only; the plan reads SC-001 that way for User Story 4, and the analysis after tasks checks it.

**The `copy-control` part** (operator decision PLAN-CORRECTNESS-1-017 (a), SPEC-1-20). The README states that the
part guarantees its box (position, size, the rules a host sets on it), its accessible name and the events its
activation leads to, and not which element carries it: today a native `<button>`, later `ocelle-button` (#7). Rules a
host writes against `:disabled`, `:focus-visible` or the inner border of the native button are outside that surface.
Under that stated surface the swap is a PATCH (FR-038, FR-044); the documentation test checks the sentence.

## R-08 Link: a native anchor in the shadow root, activation intercepted

**Decision.** `ocelle-link` renders `<a part="anchor">` around a default slot, with `delegatesFocus` on the shadow
root. The anchor carries the host's `href` attribute as written whenever the host has an `href` and its resolution
(below) is allowed at that moment, so a modified activation (Ctrl, Meta, Shift click or Enter, middle click) is left
entirely to the browser (new tab or window, FR-046). Without `href`, or with a disallowed one, the anchor has no
`href`, `role="link"` and `tabindex="0"` (so it is still a focusable link in the tree), and modified activations do
nothing.

**Resolution at activation** (PLAN-CORRECTNESS-1-008, SPEC-2-05). `href` is resolved and checked at each activation
against `document.baseURI` and `location.protocol` of that moment, never cached from render. The anchor's `href`
presence is refreshed on each `href` change and at the first event of each activation (`pointerdown`, `keydown`
Enter), before the native click, so the browser's own behaviour for a modified activation follows the current base.

**Decision function** (PLAN-CORRECTNESS-1-009). The resolution and protocol rule live in an internal pure module,
`src/link-target.ts`: `navigationTarget(href, baseURI, documentProtocol)` returns the resolved URL string, or `null`
when `href` is `null`, does not parse, or resolves to a protocol other than `http:`, `https:` or `documentProtocol`.
It is tested in the in-process `elements` project (`test/link-target.test.ts`) on every input of US5-9 to US5-12 and
US5-14 (`javascript:alert(1)`, the padded and tab-split forms, `data:`, protocol-relative, a `kitty-app://app/` base,
a `file:` document, `""`, `#section-2`); plant: deciding on the written string or on the document URL.

**Plain activations.** A plain activation (primary click or Enter; Alt alone counts as plain) is intercepted on the
anchor:

- click (both renderings): the element calls `preventDefault()` on the native click (so Chromium's Alt-click download
  does not happen, SPEC-2-07), dispatches the cancelable `ocelle-link-activate`, and, if it was not cancelled and
  `navigationTarget(…)` is not `null`, calls `location.assign(target)`;
- Enter on the no-`href` rendering (PLAN-CORRECTNESS-1-007): an `<a>` without `href` has no activation behaviour, so
  Enter fires no click. The element handles `keydown` Enter on the anchor: with Ctrl, Meta or Shift held, nothing;
  otherwise (Alt allowed) the same activation as a plain click. That keydown's default is not prevented, as with the
  `href` rendering, where Enter becomes the anchor's own click; the link's keys are not "handled" in the
  `defaultPrevented` sense (SC-001 for User Story 5 reads the event and the navigation). Plant: activation on the
  native click only, which US5-2's and US5-9's Enter cases fail.

Space is not handled (FR-046). An empty `href` is an `href` and resolves to the document's own URL; a fragment `href`
resolves to a same-document URL and `location.assign` navigates within the document (SPEC-2-08, US5-14).

**Host exposure** (PLAN-A11Y-SECURITY-1-006). Host `aria-label` is forwarded to the anchor (constitution III, mission
005 Host ARIA), observed for changes. A role-less host carrying `aria-label` is exposed by Chromium as a named generic
around the link (lens probe), a second named node. Phase 6's spike probes the host's exposure and picks the form that
leaves exactly one named node for the link: candidates are the host itself being the link through its internals (with
the anchor kept as the native activation and focus target) and a form that keeps the name off the host's node; the
spike records the tree of each. US5-8 asserts exactly one named node in the paragraph; plant: the plain forward. If
no form gives one named node, the phase stops and the operator decides.

**Label in name** (PLAN-FRESH-2-005). A forwarded host `aria-label` that does not contain the link's visible text
fails WCAG 2.5.3 (Label in Name, level A) and is axe-core 4.14.0's `label-content-name-mismatch`, impact serious, on
by default and so in #10's rule set (round-2 lens probe: `aria-label="Docs"` on a link reading "here"). The element
does not rewrite the label; the README's link section states that a host `aria-label` must contain the visible text,
best starting with it (e.g. text "the mission log", label "the mission log, opens in the viewer"). US5-8's fixture and
every story with a host label use such a label. Phase 6's story test runs #10's rule set on the link stories and
asserts no `label-content-name-mismatch` finding; plant: a story label without the visible text.

**Focus ring and underline** (PLAN-CORRECTNESS-1-019). The ring is an `outline` of `--ocelle-focus-width` in
`--ocelle-color-focus` at `--ocelle-focus-offset` on the anchor; an inline box's outline is drawn per line fragment by
the engine, so FR-048 holds with no `box-decoration-break` (which does not affect outlines). The underline is
`text-decoration-line: underline` from tokens.

**README** (PLAN-A11Y-SECURITY-1-010). The link section states that `detail.href` is the attribute as written and not
validated (it may be `javascript:` or `data:`), that the element refuses those and foreign schemes only for its own
navigation, and that a host that navigates itself must apply the same resolved-protocol check; it also states the
label-in-name rule above (PLAN-FRESH-2-005). The documentation test checks both statements.

**Alternatives.** No native anchor and `location.assign` only: loses the browser's new-tab behaviour that the
operator's Q2 (a) keeps. Leaving the native navigation for plain clicks and cancelling it when the host cancels:
the event would have to be dispatched synchronously inside the native click and the protocol filter could not apply
to a native navigation already started; interception is simpler and testable.

## R-09 Navigation on a `file:` document (User Story 5 scenario 12; spike in phase 6)

**Decision to measure.** Chromium refuses module scripts from a `file:` document (null origin) unless launched with
`--allow-file-access-from-files`. Scenario 12 runs in its own Vitest project, `elements-browser-file`, a node project
like `elements-browser` whose test launches Chromium itself with that flag in its own `chromium.launch({ args })`,
on a fixture copy that carries the policy in a `<meta http-equiv="Content-Security-Policy">` (spec FR-057). Phase 6
starts with a spike: if the browser build loads and the link navigates to the `file:` target, the project stays; if
not, the phase stops and the operator chooses (per the spec, the case is not dropped silently). A custom-scheme
document through Playwright route interception is the fallback the spike also tries (the document's protocol stays
`http:` there, so it does not prove the case).

**Placement** (PLAN-CORRECTNESS-1-013). The test lives in `packages/elements/test/browser-file/link-file.test.ts`,
outside `test/browser/` (elements-browser's include). The `elements` project's exclude gains
`packages/elements/test/browser-file/**` (its include is `packages/elements/**/*.test.ts`), and
`vitest.mutation.config.ts`'s excluded set gains `elements-browser-file`, so no Stryker run starts Chromium on the
`file:` fixture. `gates/test/vitest-config.test.ts` is extended first (red): the owner of
`packages/elements/test/browser-file/x.test.ts` is exactly `elements-browser-file`, and the excluded list pins the
new name.

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
`page.keyboard` on the fixture. New fixtures: `listbox.html`, `tabs.html`, `segmented-choice.html`,
`copy-field.html`, `link.html`, `link-target.html`, and the `file:` copy (R-09). Navigation is observed as the spec's
"Observing navigation" says, with a `window` marker.

**Driver extensions** (phase 1, each with a unit test that fails before it exists):

- `press(key)`, `click(target, { button, modifiers, count })` (`count: 2` for US1-20's double-click), `keydownRecord()`
  (a `document` bubble listener recording key and `defaultPrevented`);
- child addressing (PLAN-TESTABILITY-1-006): a target is an id or `{ parent, kind, index }` (the parent's id, the
  child tag, the index among the parent's children of that tag), accepted by focus, click, box, computed and tree
  reads; `activeElement()` returns `{ id }` or `{ parent, kind, index }` through shadow roots;
- `mutate(target, steps)`: a list of DOM steps (append markup, remove child n, move child n before m or to the end,
  re-insert child n in place, set or remove an attribute on child n, set a property) applied synchronously in one
  task, then settled; it builds US1-14, US1-19, US1-21, US2-18 to US2-20, US3-15 to US3-18 and R-05's
  `append; value =` case;
- `resize(target, inlineSize)` that does not settle, and `afterResizeDelivery(target)` that resolves from a test
  `ResizeObserver` registered on the target (R-06);
- `computedPart(target, part | pseudo, property)` reading a shadow part's or a pseudo-element's computed style (R-15);
- `scrollOffset()` of the page and `viewportSize(width, height)` (the Space and sideways-scroll pairings);
- `activationRecord(target)`: installs US4-6's capture listener, its `requestAnimationFrame` and microtask entries
  and the request entry (R-07), and returns the ordered record;
- `axUpdates(target)`: enables CDP's `Accessibility` domain, fetches the target's node and records its
  `Accessibility.nodesUpdated` events touching it or its descendants, each as the region's `{ role, live, text }`
  (`text` the concatenated names of its static-text descendants) until stopped (R-07; its unit test is a fixed page
  whose node is emptied in one frame and refilled in the next, against one emptied and refilled in one task);
- the clipboard observer (below) and `axStates` (below).

**Accessibility states** (PLAN-TESTABILITY-1-014). mission 005's `axTree` keeps its `{ role, name }` nodes, so 005's
`toEqual` expectations are untouched. A separate command, `axStates(target)`, returns
`{ role, name, selected?, pressed?, disabled?, orientation?, live?, controls? }` per unignored node, `controls`
mapped to the controlled node's `{ role, name }` (CDP's node ids are not comparable across reads). Its red unit test
runs on a fixed page with a native `<select>`, an `aria-pressed` button and an `aria-controls` pair.

**Clipboard observer** (PLAN-TESTABILITY-1-009, SC-006). It wraps `navigator.clipboard.write`, `writeText`, `read`,
`readText` and `document.execCommand` (recording `copy`, `cut` and `paste`), and records any `copy` or `cut` event
whose `clipboardData` was modified (`setData` wrapped on `DataTransfer.prototype`). It is installed at every in-process
mount and by every fixture page's init script, and every scenario of every element asserts zero calls at its end.
Plants: a `navigator.clipboard.writeText` call and a `document.execCommand("copy")` call in the request path.

**Navigation in process** (PLAN-CORRECTNESS-1-009). In-process link tests use same-document fragment hrefs
(`#nav-1`), whose navigation is read from `location.hash` without unloading the runner frame, plus a
`javascript:` href whose body would set a `window` marker if it ran; with `navigationTarget`'s tests (R-08) they kill
the `defaultPrevented`, protocol and `location.assign` mutants in process. Cross-document navigation (US5-4, 5, 9 to
13) runs on the fixture only. US5-13's kept browser behaviour is observed on the fixture with Playwright's
`context.on("page")` (a new page opened by the modified activation) beside the unchanged URL of the first page.

**US5-11's base** (PLAN-CORRECTNESS-1-008, SPEC-2-05). With `<base href="kitty-app://app/">` in the markup the
module script, styles, font and link target would resolve against it and the element would never load. The fixture
test inserts the `<base>` through the driver after the element has loaded (DOM evaluation is not governed by the
policy and `base-uri` is not in it), asserts `document.baseURI === "kitty-app://app/"`, activates `href="x"`, asserts
the event `{ href: "x" }` and no navigation, then removes the base, asserts `document.baseURI` is the fixture's URL
again, and activates scenario 4's link, whose navigation is observed. Plant: deciding on the written string or the
document URL.

**Pairing plants.** Each "does not" outcome names its planted defect in `contracts/elements.md` § Pairings, with the
setup that makes it falsifiable. Each phase's review runs every plant of the phase and records, per plant, the test
that failed on it in `reviews/phase-N/plants.md` (as 005's phases did).

## R-12 Stories, baselines and axe on #10 (recheck when #10 merges; implementation waits for it; baselines at landing)

**Decision.** One stories file per control, `storybook/stories/<control>.stories.ts` (listbox, tabs,
segmented-choice, copy-field, link), covering its children (FR-050; the files carry no `ocelle-` prefix, like the
existing `icon.stories.ts`); one story per variant and state named in FR-050 (an icon story for option, tab and
segment included), captured in light and dark by #10's `visual` gate; baselines produced with #10's `visual:update` in
the pinned container (006 `contracts/container.md`) and committed under `storybook/baselines/`; the `axe` gate over
every story. Focused states use a story `play` that focuses the target through the story's render (006 renders each
story fresh and captures after the render signal): the focused option, tab and segment, the focused Copy control
(US4-9) and the focused tab panel with no focusable content (US2-6, FR-023). Hover uses 006 FR-031's pointer
parameter: the hovered link, option and tab, and the hovered segment in the default and the joined variant (R-15's
`hover-bg` fill, and the joined segment's `accent-strong` lines). These hover and focus stories give each state of
R-15 that has its own paint a baseline (constitution V; analysis C1, operator decision Q3 (a)). Per operator decision
I3, the stories and the story test (`storybook/test/integration/elements-stories.test.ts`, extended) are written in the
phase's red commit. The baselines are not produced in the green commit: see the amendment below.

**Amendment: baselines at landing** (operator decision 2026-11-14, `reviews/phase-1/operator-decisions.md`; FR-053,
SC-007). The implementing sessions have no docker or podman, so `visual:update` and the `visual` gate cannot run in
#10's pinned container there. No visual baseline (including the shared token-story baselines) is committed during
implementation, and no phase runs the `visual` gate; each phase's review records the gap. At `/ocelle-land` the
baselines of every story named above (and any shared baseline that changes) are produced from CI's pinned-container
captures and committed under `storybook/baselines/`, and the `visual` gate passes before the pull request merges.
Container-engine tests that also fail at the phase base are environment-only, not a red/green or review finding. The
stories, the story test in the red commit and the `axe` gate in every phase are unchanged. Not chosen: capturing
outside the pinned container (pixels would differ from CI's and the baselines would be replaced at landing anyway).

**Recheck.** Phase 1's first task first merges `origin/main` (`3828d2f` or later) into the branch as a recorded merge
commit (analysis I1, operator decision Q1 (a)); the implementer makes it before `base.sh 1`, as an exception to
`/speckit-story-implement`'s step 2 for phase 1 only (second analysis I1, operator decision Q1 (b)). It then compares this plan with #10 as merged: the gate ids, the story id
scheme, the pointer and focus parameters, the baseline command, the contributor note (006 FR-025) and
`contracts/gates.md` / `contracts/container.md`. Differences are fixed in the plan and tasks before phase 2's red commit
(FR-053).

**Recheck result** (T001, `reviews/phase-1/recheck-10.md`; #10 as merged at `3828d2f`, no spec outcome changed):

- *Titles and story ids.* Each stories file is titled `Elements/ocelle-<control>` (`Elements/ocelle-listbox`,
  `Elements/ocelle-tabs`, `Elements/ocelle-segmented-choice`, `Elements/ocelle-copy-field`, `Elements/ocelle-link`),
  as 005's `Elements/ocelle-icon` and `Elements/ocelle-brand-mark` are, so the story ids are
  `elements-ocelle-<control>--<story>` and the baselines `storybook/baselines/elements-ocelle-<control>--<story>.light.png`
  and `.dark.png`. The children's stories (option, tab, tab panel, segment) are stories of their parent's file.
- *Pointer.* A hover story declares `parameters: { ocelle: { pointer: { hover: "<selector>" } } }`, one key, its
  Playwright CSS selector (open shadow roots pierced) matching exactly one element, whose box lies wholly inside the
  1280 × 800 viewport at scroll (0, 0); the gates move the mouse to the centre of that box after the render (006
  FR-031, `pointer-target` otherwise). The scrolling listbox story declares no pointer state.
- *Focus.* #10 has no focus parameter. A focus story focuses its target in a `play` function (or in its render):
  Storybook 10.6.5 emits the render signal `STORY_RENDERED` after `play` has finished, and both gates then scroll the
  page back to (0, 0) before the pointer, the capture and the axe run, so a focused target stays inside the initial
  viewport too.

## R-13 Mutation testing under #23

**Decision.** `packages/elements/src/**` is mutated by the elements Stryker configuration (mission 005), which runs
only the in-process `elements` project (`gates/bin/mutation.ts` routes every `packages/elements/src/` path there;
`vitest.mutation.elements.config.ts`). The pure modules' tests are therefore in that project, not in `elements-node`:
`test/roving.test.ts`, `test/selection.test.ts`, `test/link-target.test.ts` (PLAN-CORRECTNESS-1-001), each mutant of
`roving.ts`, `selection.ts` and `link-target.ts` killed by a fast case with no DOM setup. The element classes'
remaining branches are killed by the in-process scenarios. The fixture projects (`elements-browser`,
`elements-browser-file`) never run under Stryker; nothing that only they observe is left without an in-process kill
(R-11 navigation in process). Under #23, Timeout and CompileError mutants and zero-mutant entries are report lines,
not findings; 30-line entries.

**Alternatives.** Running `elements-node` under the elements configuration as well: a gate change with no benefit
over moving the tests; not chosen.

## R-14 Spec-check notes carried into the plan

Each open note of the spec checks (check-3 SPEC-3-04) with its answer (PLAN-CORRECTNESS-1-016):

- SPEC-3-02 (focus when a focused child becomes disabled): with disabled children kept at `tabindex="-1"` (R-03), a
  focused child that becomes disabled keeps focus; a selected listbox option that becomes disabled stays selected and
  keeps focus until the user moves (US1-18; FR-016 makes it lose the tab stop only). For tabs and segments the
  selection moves per FR-011a and focus moves with it if the child had focus (US2-18, US3-15).
- SPEC-3-03 (reorder of the focused or selected child): a move keeps selection and focus: the host-`childList`
  observer sees the move (R-05), the batch keeps the node, and R-03's focus record refocuses it (US1-21).
- SPEC-1-13 (selected background and bar pair): the selected option and tab have no fill; their bars are
  `color-accent-strong` on the main grounds, made checked pairs by R-17 (operator decision PLAN-CORRECTNESS-1-011
  (b)); every element's fill, bar, border and text tokens per ground are R-15's table.
- SPEC-1-14: R-07. SPEC-1-16: R-10. SPEC-2-07: R-08. SPEC-2-05: R-08 and R-11. SPEC-2-06: R-09. SPEC-2-10: R-07 (no
  slot). SPEC-2-11: R-07. SPEC-1-22: Constitution Check I. SPEC-1-23: R-12.
- SPEC-1-15: long labels wrap inside the child, which grows in block size, never truncated (spec Edge Cases; one
  scenario per parent at 320 px, phases 2 to 4: T014, T042, T062); hover paint is R-15's (`hover-bg` fill; a hovered
  segment's lines in `accent-strong`); there is no parent-level `disabled` (spec Edge Cases); a tablist or segmented
  choice with no children is FR-011a's "no child enabled" (US2-20, US3-17); the `icon` slot has a scenario per child
  (US1-23, US2-23, US3-19: placement and size from 005's slot convention through `scenarios/slot.ts` helpers, nothing
  added to the name, the selected paint unchanged) and an icon story per element (FR-050).
- SPEC-1-19: without a host name the copy field is an unnamed group (FR-034), confirmed by phase 5's tree read; the
  README tells hosts to name it.
- SPEC-1-20: R-07 (the part's stated surface; operator decision PLAN-CORRECTNESS-1-017 (a)).
- SPEC-1-24: the host sets `max-block-size` on `ocelle-listbox`; the scroll container is its `part="list"` (R-03).
- SPEC-1-25: an unpaired tab or panel is assigned to no slot: no box, no node, not focusable, not clickable (R-05,
  US2-9).
- SPEC-1-26: US2-12 keeps the outcome; the mechanism is R-02.
- SPEC-1-27 (no flicker) and SPEC-2-13 (reduced motion): "no flicker" is observed as no mutation: a MutationObserver
  over the parent's subtree records no attribute or child-list mutation for a host set of the current value (US1-18,
  US2-17 and the Edge Case), plant: rewriting `aria-selected` / `aria-pressed` on every set. No element declares a
  transition or an animation (spec Edge Cases "Motion"); one test per element asserts the computed
  `transition-duration` and `animation-name` of each child, the Copy control and the link anchor are `0s` and `none`,
  plant: a `transition` on the selected paint. SC-009 stays a documentation outcome: the README has one example per
  listed use, checked by the documentation test (T110 red, T111 green).
- SPEC-2-08: an empty `href` counts as an `href` and navigates to the document itself; a fragment `href` navigates
  within the document, observed by the URL's fragment with the marker kept (spec "Observing navigation", US5-14).
- SPEC-2-09 (reflection and order): the parents' `value` is an attribute and a property, not reflected (the attribute
  is the host's input; the property reads the selection); the copy field's `value` and `status` are not reflected;
  the link's `href` is an attribute and a property, reflected; children's `value` and `disabled` are reflected
  (FR-009). A parent's `value` already reads the new value when its `-change` event is dispatched (FR-002); the
  contract states both.
- SPEC-2-12: R-07 request timing (operator decision PLAN-TESTABILITY-1-011 (a)).

## R-15 Paint: tokens per ground, drawing techniques and what the tests read

Grounds: the elements sit on the main grounds (`canvas`, `sheet`, `pane`, `panel`, `inspector`, `rail`); placing a
listbox, tabs or segmented choice on `inset`, `accent-low`, `hover-bg` or a state ground is not supported in this
feature and the README says so. Every pair below is a `checked` row of `pairs.json` after R-17, except
`color-disabled-ink`, which is exempt (WCAG 1.4.3 inactive controls).

| Element, state | Fill | Line or bar (token on ground) | Text |
|---|---|---|---|
| option, tab: rest | none (page ground) | none | `ink` on main |
| option, tab: hover | `hover-bg` | none | `ink` on `hover-bg` |
| option: selected | none (or `hover-bg` on hover) | bar `bar-width`, `accent-strong` on main / `hover-bg`, inline-start | `ink` |
| tab: selected | as option | bar `bar-width`, `accent-strong`, block-end | `ink` |
| segment, default variant: rest | none | border `border-width`, `control-border` on main | `ink` |
| segment, default: hover | `hover-bg` | border `border-width`, `accent-strong` (on `hover-bg` and main) | `ink` on `hover-bg` |
| segment, default: pressed | `accent-low` | border `bar-width`, `accent-strong` (on `accent-low` and main) | `ink` on `accent-low` |
| segment, joined: rest | none | shared lines `border-width`, `control-border` on main | `ink` |
| segment, joined: hover / pressed | `hover-bg` / `accent-low` | own lines `border-width`, `accent-strong`; pressed bar `bar-width`, `accent-strong` on `accent-low`, block-end | `ink` |
| disabled child | none | as rest | `disabled-ink` (exempt) |
| copy field | text well `inset`; control `sheet` | outer border `control-border` on main; divider `accent-strong` on `inset` / `sheet` | `ink` on `inset`; icon `ink` on `sheet` |
| link | none | underline (text colour) | `link`, `link-hover` on main |
| focus ring (all) | | ring `focus-width`, `color-focus` at `focus-offset` on main (an outline on the link and the Copy control; a raised `::after` border on option, tab and segment, R-06); for a focused option, tab or segment beside a pressed, selected or hovered neighbour also on `accent-low` and `hover-bg` (the ring pseudo-element raised above the neighbours, R-06), pairs checked as `color-accent-strong`'s (which `color-focus` aliases) on those grounds | |

**Techniques** (PLAN-A11Y-SECURITY-1-005). Outside forced colours, the option's and tab's bar, and the joined pressed
segment's bar, are a `:host::before` pseudo-element positioned inside the host's box (absolute, `bar-width` thick, on
the stated edge), so it changes no size; the default pressed segment's border is a border of `bar-width` with its
padding reduced by `bar-width` minus `border-width`, so the outer box is unchanged. Under
`@media (forced-colors: active)` the bar pseudo-element has `forced-color-adjust: none; background: Highlight` (forced
colours would otherwise replace its background), the default pressed segment's border colour is `Highlight`
(`forced-color-adjust: none` on that rule's element, with text `ButtonText` and fill `ButtonFace` set explicitly),
boundaries (segment borders, the copy field's border and divider, the Copy control) are `ButtonBorder`, the link is
`LinkText`, the link's and the Copy control's focus ring is an outline, which forced colours keep, in `Highlight`,
and the option's, tab's and segment's ring is the raised `:host(:focus-visible)::after` of R-06 (a `focus-width`
border at `focus-offset`, `pointer-events: none`, `z-index: 2`, the focused host `position: relative` and not raised
by focus), which under forced colours has `forced-color-adjust: none` and a `Highlight` border. No bar is a `box-shadow`
(forced colours compute it to `none`). Plant for US1-15, US2-11, US3-11: the bar as an inset `box-shadow` only.

**What the tests read** (PLAN-TESTABILITY-1-010).

- Selected bar: `computedPart(child, "::before", …)`: block or inline size equal to `--ocelle-bar-width`, background
  colour equal to `driver.resolveColour("var(--ocelle-color-accent-strong)")`, or `Highlight`'s resolved colour under
  emulated forced colours; absent (`content: none` or zero size) on unselected children. Plants: the bar drawn by
  colour only (no size), the bar as `box-shadow`.
- Shared lines ("one line, not two", US3-9, US4-9 "no double line"): `driver.pixels` across each boundary (between
  neighbours, between rows, around the pressed segment, between the copy text and the control) counts one run of
  `--ocelle-border-width` device pixels in the expected colour; plants: two borders without overlap (a doubled line),
  the pressed segment's lines in `control-border`.
- Per-fragment ring (US5-6): for each client rect of the link from `driver.lines`, pixels just outside the rect's
  edges are `color-focus`; plant: the ring drawn on the first fragment only (`display: inline-block`).
- Radii (US3-10, US3-18): computed `border-*-radius` of each segment.
- Ring inside the listbox clip (US1-16): the option's ring box (the `::after`'s border box, the option's border box
  grown by width and offset) lies within `part="list"`'s client box.
- Ring on every side of a joined segment (US3-9 with FR-007; PLAN-FRESH-2-003, PLAN-FRESH-3-002): with
  `driver.pixels`, the pixels just outside all four edges of a focused joined segment are `color-focus`, once with the
  pressed segment as its neighbour (keyboard focus moved off the pressed segment, US3-2), once beside a hovered one
  (pointer on the neighbour), and once with the focused segment itself pressed beside a later hovered one; the same
  read for a focused tab beside the selected and a hovered tab. Plants: the ring as the host's outline with no
  raise, the ring pseudo-element without `z-index`.
- Pressed and hovered lines beside a focused neighbour (US3-9, FR-029; PLAN-FRESH-3-002): the "one line" read above,
  taken across the shared line between the pressed segment and a focused neighbour on either side (focused before and
  focused after), and between a hovered segment and a focused neighbour: the pixel run is `accent-strong`, not
  `control-border`. Plant: `z-index` on the focused host.
- Option ring beside a hovered option (FR-007; PLAN-FRESH-3-003): with `driver.pixels`, the pixels just outside all
  four edges of a focused option are `color-focus` with the pointer on the next option and, in a second read, on the
  previous option, inside the US1-16 clip (the option scrolled so its ring box lies within `part="list"`'s client
  box). Plant: the option's ring not raised (an outline on the host, or the `::after` without `z-index`).

## R-16 Entry points: a parent defines its children; the copy field defines `ocelle-icon`

**Decision** (operator decision PLAN-CORRECTNESS-1-015 (a), 2026-11-13: the source stays TypeScript, `src/*.ts`,
strict; the decision is about the built entry points). Each element keeps its own module, `src/<tag>.ts`, ending
with one `define("<tag>", …)`. A parent's module imports its children's modules: `ocelle-listbox.ts` imports
`ocelle-option.ts`; `ocelle-tabs.ts` imports `ocelle-tab.ts` and `ocelle-tab-panel.ts`;
`ocelle-segmented-choice.ts` imports `ocelle-segment.ts`; `ocelle-copy-field.ts` imports `ocelle-icon.ts`. So the
built entry `@ocelle/elements/ocelle-listbox.js` defines `ocelle-listbox` and `ocelle-option`, and one import is
enough for each control. The README's rule "importing the module defines that element and no other" is amended to
"importing the module defines that element and the elements it renders or owns as children"; the entry-point table
lists what each entry defines. Every element still has its own entry, so `ocelle-option.js` alone is importable.

Cross-element calls go through attributes (R-01's states, R-03's `tabindex`) or a feature-checked internal method
under a module-private symbol (R-06's row states), never through another element's private fields, so an
un-upgraded child or one from another copy of the package (README "Two copies on a page") is left alone and nothing
throws.

Tests: `test/entry-<tag>.test.ts` for each new entry (as 005's `entry-icon.test.ts`): importing only the parent's
entry yields defined children (`customElements.get("ocelle-option")`) and a working control (the option exposed with
role `option`); importing only `ocelle-copy-field`'s entry defines `ocelle-icon`; plant: the parent's module not
importing its child. `package.json` `exports` gains the nine entries (contract § Entry points).

## R-17 Contrast pairs for the selected bars (operator decision PLAN-CORRECTNESS-1-011 (b))

**Decision.** The option's and tab's bars, the default pressed and hovered segments' borders and the copy field's
divider are `color-accent-strong` on the main grounds, which `@ocelle/tokens` does not check today. This feature adds
them to `@ocelle/tokens` in phase 2 (the listbox's bar comes first):

- `packages/tokens/src/source.ts`: `color-accent-strong`'s `contrast.grounds` gains `color-canvas`, `color-sheet`,
  `color-pane`, `color-panel`, `color-inspector` and `color-rail`, and its comment names the selected bar;
- `packages/tokens/contrast/pairs.json`: twelve `non-text` entries, status `checked`, source `computed`, with the
  figures the gate computes (the same values as `color-focus`, which aliases `color-accent-strong`: light 4.80, 5.30,
  5.56, 4.80, 4.80, 4.43; dark 8.30, 7.44, 7.78, 8.30, 8.30, 7.78), each at least 3:1;
- tests first: `gates/test/contrast-pairs.test.ts`'s pinned counts (160 light, 168 dark become 166 and 174) and any
  token test pinning `color-accent-strong`'s grounds are updated in the red commit;
- `@ocelle/tokens`' CHANGELOG names the new checked pairs (no token value or name changes: a PATCH-level entry of the
  token package's contract, under its Unreleased section).

**Element pairs check.** A node check in the style of 005's `test/node/brand-pairs-check.ts`:
`test/node/selection-pairs-check.ts` with `test/node/selection-pairs.test.ts` reads each new element's stylesheet text
(source template, and the built module in `elements-build` as 005 does) and lists every colour pair R-15's table names
that is not a `checked` row of `pairs.json` (exempt `disabled-ink` named). The expected pairs are transcribed by hand
from R-15, never read from the source or from `pairs.json`. Plant: the joined pressed segment's lines in
`control-border` (an excluded pair).

## R-18 Listbox activation (operator decision PLAN-CORRECTNESS-1-018 (b))

**Decision.** `ocelle-listbox-activate` with `{ value }`, `bubbles`, `composed`, not cancelable: Enter on the focused
option when it is selected and enabled (the roving controller asks the parent to activate instead of select), and a
`dblclick` on an enabled option (the first click has already selected it under FR-014, so its change event comes
first). Enter on an unselected option selects only; Space never activates; disabled options never activate. A MINOR
addition to the surface, named in the CHANGELOG and the README (the host confirms a choice by listening to it; #16's
Open project dialog opens the folder on it). Scenarios: US1-7, US1-18 and US1-20; plants: activating on every Enter
(also on an unselected option), activating a disabled option on double-click.
