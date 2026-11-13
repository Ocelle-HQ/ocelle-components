# Feature Specification: Selection and Input Elements

**Feature Branch**: `014-selection-input` (work happens on `claude/014-selection-input`)

**Created**: 2026-11-13

**Status**: Draft

**Input**: User description: "Build issue #14 (triage/014-selection-input.md) in @ocelle/elements, following mission
005's element conventions (packages/elements/README.md § Element conventions, Host ARIA, slot convention, manifest
gate): `ocelle-listbox` and `ocelle-option` (single select, roving tabindex, Arrow, Home and End, selection on Enter or
Space, `aria-selected` paint, forced-colours selected edge, named without an ID reference across a shadow root;
spec-kitty-design#527; first consumer the folder picker in kitty-mission-ui's Open project dialog, #16), `ocelle-tabs`
(a real `role="tablist"` with roving tabindex, wrapping arrows, Home and End, selection follows focus, `aria-selected`
paint, forced-colours selected edge, tab-to-panel association inside the element so no `aria-controls` id crosses a
shadow root; #521), `ocelle-segmented-choice` (an element replacing the class family, paint keyed on `aria-pressed`
distinct from tabs, a joined variant with one shared border between neighbours, outer radius only on the first and last
segment and per-row rounding when it wraps without a consumer ResizeObserver; #511), `ocelle-copy-field` (request-only:
it never writes the clipboard, emits `ocelle-copy-field-request` and lets the host report the outcome in its own words,
long commands wrap instead of scrolling, a flush Copy control using `ocelle-icon name="copy"`, built as the operator
answers Q1 of the record; #534) and `ocelle-link` (inline text-styled link in running text on `--ocelle-color-link`,
emitting `ocelle-link-activate` instead of navigating, keeping link semantics and the token focus ring, optional `href`
for real navigation; #522); one user story per element in that order, shared keyboard machinery internal; events
`ocelle-<element>-<action>`, bubbling and composed, every payload tested; done when #7's checklist holds (a story per
variant and state with light and dark baselines on #10's harness, interaction tests for every event and payload,
keyboard and screen-reader tests, axe with no serious or critical finding, manifest entries, strict-CSP check) plus a
keyboard-model test per element; `ocelle-button` (#7), the dialog (#16) and the Storybook harness (#10) stay in their
issues."

**Issues**: #14 (triage record `triage/014-selection-input.md`, approved by the operator on 2026-11-13). The body of
#14 and the five spec-kitty-design issues it cites (#511, #521, #522, #527, #534) are the requirement sources; the
spec-kitty-design issues are read as requirements only (constitution VI) and were not available to this session, so
every requirement below rests on #14's own text and the triage record. Their `sk-*` names are kitty-mission-ui roles,
not names of this library.

**Operator decisions at triage** (2026-11-13, human:jeroennouwsdev):

- Q1 (c): the copy field's Copy control is a native `<button>` inside the copy field's shadow root, styled from tokens
  and following the icon slot convention. A later op switches it to `ocelle-button` once #7 (mission 012) merges; the
  Copy control's CSS part and accessible name stay stable so that swap is a PATCH with no surface change (FR-044).
- Q2 (a): all of #14 in this one mission, five user stories.
- Q3 (a): the segmented choice is an exclusive toggle group: exactly one segment pressed, one tab stop, arrow keys
  between segments (User Story 3).
- Q4 (b): `ocelle-link` always emits `ocelle-link-activate`, cancelable; with `href` it navigates unless the host
  cancels the event (User Story 5).
- I3, for the whole flow: story tests (the Storybook stories of a phase and the tests that read them) are written in
  each phase's red commit, before green; `red.sh` keeps one red record per phase.

**Operator decisions while specifying** (2026-11-13, human:jeroennouwsdev):

- Child API, "Child elements": tabs and panels are given as `ocelle-tab` and `ocelle-tab-panel` children paired by
  order, and segments as `ocelle-segment` children, beside `ocelle-option` for the listbox. The parent sets every
  role and association itself; a host writes no id (FR-004).
- Copy outcome, "Status property": the host reports the outcome by setting the copy field's `status` text; the field
  shows it beside the Copy control and announces it once, politely; a new request clears it (FR-041, FR-042).
- Tab overflow, "Wrap to rows": tabs wider than their container wrap onto further rows; no scroller and no dependency
  on #15 (FR-022).

**Operator decisions at spec check 1** (2026-11-13, human:jeroennouwsdev; `reviews/spec/check-1.md`):

- Q1 (SPEC-1-07) (b): `ocelle-link` resolves `href` against the document base URL and navigates only when the
  resolved protocol is `http:`, `https:`, or equal to the document's own protocol (so relative links work in Kitty
  Desktop's custom-scheme webview). Any other protocol is never navigated by the element (FR-047, User Story 5
  scenarios 9 to 12).
- Q2 (SPEC-1-08) (a): a modified activation of `ocelle-link` with `href` (Ctrl/Cmd-click, Shift-click, middle-click)
  emits no event and keeps the browser's own behaviour (new tab or window). Only plain activations emit (FR-046,
  User Story 5 scenario 13).
- Q3 (SPEC-1-09) (c): implementation of this feature waits for #10 (Storybook workbench) to merge, as ruled for
  mission 008. The design phases (spec, plan, tasks) proceed now (FR-053, SC-007, "Dependency on #10" below).

**Operator decisions at spec check 2** (2026-11-13, human:jeroennouwsdev; `reviews/spec/check-2.md`):

- Q1 (SPEC-2-03) (b): a parent remembers the last value a host set. When a matching enabled child appears, the
  parent selects it, with no event. Until then the listbox's `value` reads `""`, and tabs and the segmented choice
  show their current or first enabled child. The parent forgets the remembered value on the next user selection or
  host set (FR-010a; User Story 1 scenario 19, User Story 2 scenario 19, User Story 3 scenario 16).
- Q2 (SPEC-2-04) (b): for `ocelle-link` without `href`, every modified activation (Ctrl, Meta or Shift held, or a
  middle click) emits nothing, as with `href`. Only plain activations emit; the host routes only those (FR-046,
  User Story 5 scenario 13).

**Operator decision at spec check 3** (2026-11-13, human:jeroennouwsdev; `reviews/spec/check-3.md`):

- At the spec gate: "approve after a final fix". This is the final spec fix; no further spec check follows, and the
  plan squad reads this spec next. The fix applies the check's suggested resolution of SPEC-3-01: the remembered host
  value (FR-010a) takes precedence in every selection a parent makes without user action, a parent with no children
  counts as "no child is enabled" (FR-011a), and User Story 2 scenario 20 and User Story 3 scenario 17 append all
  children at once. Notes SPEC-3-02 to SPEC-3-04 are left for the plan.

**Dependency on #10 (not merged).** The Storybook workbench of #10 (branch `claude/010-storybook-workbench`,
`specs/006-storybook-workbench`) gives the `visual` gate (baselines in a pinned container, light and dark), the `axe`
gate (axe on every story, serious and critical findings fail) and its contributor note (006 FR-025). Its design is
final but not merged. This spec writes the stories, baselines and axe outcomes against that design (FR-050 to FR-053).
By the operator's decision at spec check 1 (Q3 (c)), the design phases (spec, plan, tasks) proceed now and
implementation of this feature starts only after #10 has merged; the plan's story, baseline and axe tasks are then
rechecked against #10 as merged before the first phase is implemented. No phase lands with its baselines or axe
results pending.

## Consumer need

- **Listbox (spec-kitty-design#527).** kitty-mission-ui's Open project dialog (#16's first consumer) shows a folder
  picker: a single-select list the user moves through with the keyboard and confirms. Spec Kitty offers no listbox, so
  the consumer hand-rolls roles, tabindex and key handling. Mission 008 (#16, `specs/008-overlays`) composes this
  listbox inside `ocelle-dialog`; that integration is the consumer's.
- **Tabs (#521).** Spec Kitty's tabs are not a real tablist: no roving tabindex, no arrow keys, and the tab-to-panel
  `aria-controls` id crosses a shadow root, so assistive technology cannot follow it.
- **Segmented choice (#511).** kitty-mission-ui uses a segmented-choice class family 15 times. Consumers need a joined
  look (touching segments, one shared border, outer radius only at the ends, per-row rounding when the group wraps)
  and today attach their own `ResizeObserver` to get the wrapped rounding. The pressed state must be a toggle group
  (`aria-pressed`), not tabs.
- **Link (#522).** Running text in Kitty Desktop needs a link that looks and behaves like a link but asks the host to
  act (in-app routing, a webview bridge) instead of navigating; real navigation stays possible with an `href`.
- **Copy field (#534).** Kitty Desktop's webview has no clipboard API in the page: the host writes the clipboard
  through its desktop bridge and wants to report the outcome in its own words. Long commands must wrap instead of
  scrolling sideways, and the Copy control sits flush against the field. Constitution I forbids an element to write
  the clipboard, so request-only is the copy field's only behaviour; there is no mode switch.
- Expected outcomes in other repositories, which this feature makes possible but cannot show: kitty-mission-ui
  deletes its hand-rolled listbox roles, its segmented-choice class family and `ResizeObserver`, its tab ARIA wiring
  and its clipboard fallback once it moves to `ocelle-*`.

## User Scenarios & Testing *(mandatory)*

The users of this feature are host pages that place these controls (Kitty Desktop's webview, Kitty Dashboard, the
Ocelle console's server-rendered pages under the strict CSP, which load the browser build), keyboard and assistive
technology users of those hosts, and the operator who reviews pull requests.

**Engines.** Behaviour is measured in Chromium, the only engine available to this repository's test runs. WebKit
(Kitty Desktop on macOS and Linux) is not measured; the README names it as an open limitation, as for every element.

**The strict-CSP fixture.** Every browser scenario below, except the Storybook stories (FR-050), runs on the
strict-CSP fixture page that mission 005 defined (`specs/005-icons-brand-mark/spec.md`, "The strict-CSP fixture"):
`tokens.css` linked, the browser build of `@ocelle/elements` loaded with one same-origin module script and nothing
else, served with `Content-Security-Policy: default-src 'none'; script-src 'self'; style-src 'self'; font-src 'self'`,
and no request outside the page, its script, its stylesheets and the vendored font. For User Story 5 only, the
allowed list also holds the fixture's link target page: a second same-origin page (`link-target.html`, beside the
fixture page) served with the same header, which the navigating link scenarios open. The same scenarios also run in
process on the element source (the `elements` project that Stryker mutates), as mission 005's README describes under
"Files and tests"; outcomes that need a real navigation run on the fixture only.

**Handled and unhandled keys.** A key the element "handles" is one whose `keydown`, read by a listener on `document`
in the bubble phase, has `defaultPrevented` true; its propagation is not stopped. A key the element "does not handle"
reaches that listener with `defaultPrevented` false, and the element changes no focus, selection or state for it (so
a containing dialog still receives Escape, and the page may scroll for an unhandled arrow key). Each unhandled-key
outcome is paired in the same test with a handled key of the same element.

**Real input only.** Every keyboard outcome is driven by real keyboard input through the browser (trusted key events
sent to the focused element), never by dispatching synthetic `KeyboardEvent`s on a host, and every pointer outcome by
a real click. A key is "pressed" on whatever element has focus at that moment; the outcome reads the focused element
(`document.activeElement` through shadow roots) and the accessibility tree, not internal state.

**Reading the accessibility tree.** Accessibility outcomes are read from Chromium's full accessibility tree with
ignored nodes filtered out, as in mission 005. "Exposed as a listbox named X with options A, B, C" means one unignored
node with role `listbox` and name X whose unignored descendants with role `option` are A, B and C in that order, with
the stated `selected` states, and no other interactive descendant.

**Events.** Every event this feature emits is a `CustomEvent` named `ocelle-<element>-<action>` with
`bubbles: true` and `composed: true`, observed by a listener on `document`; its `detail` is exactly the payload
stated, with no other key. "Emits nothing" is measured by a `document` listener over the whole scenario.

**"Does not" outcomes are paired.** An outcome that says something does not happen (no event, no focus move, no
navigation, no clipboard write, no node, no style attribute) already holds when no element is defined, so a test of it
alone passes at red (constitution VIII). Each one is tested in the same test as the positive outcome it guards: the
element has rendered its children and a positive outcome of the same scenario (a focus move, a selected state, an
event) holds. The plan names, for each, a planted defect that makes it fail.

**Selected-state paint.** "The selected paint" of an option, a tab or a segment is: a background or edge from tokens
that differs from the unselected state by more than colour (a bar or edge of `--ocelle-bar-width` in
`--ocelle-color-accent-strong`, never the ochre fill alone on a light ground; constitution II), and in forced-colours
mode an edge of `--ocelle-bar-width` in the system `Highlight` colour (the "forced-colours selected edge"). Each
element states where its bar sits. The paint is keyed on the ARIA state (`aria-selected` or `aria-pressed`) that the
accessibility tree shows, so the two can never disagree.

---

### User Story 1 - Pick one item from a list with the keyboard: `ocelle-listbox` and `ocelle-option` (Priority: P1)

A host shows a list of choices, such as the folders in kitty-mission-ui's Open project dialog, as `ocelle-option`
children of an `ocelle-listbox`. A keyboard user tabs into the list, moves through the options with the arrow keys,
Home and End, and selects one with Enter or Space; a pointer user clicks one. The host learns of each selection through
one event and reads the selected value from the listbox.

**Why this priority**: it has a named first consumer (#16's Open project dialog), and it is the first user of the
shared keyboard mechanism that tabs and the segmented choice reuse.

**Independent Test**: on the strict-CSP fixture, a listbox named "Folders" with five options is tabbed into, walked
with every key of its model and selected; the accessibility tree, the focused element, the paint and the events are
read after each key.

**Acceptance Scenarios**:

1. **Given** `<ocelle-listbox label="Folders">` with options `alpha`, `beta`, `gamma`, `delta`, `epsilon` (each
   `<ocelle-option value="…">` with that text) and none selected, **When** the page loads, **Then** the tree exposes a
   listbox named "Folders" with the five options, none selected, and exactly one of them (the first) is in the tab
   order: pressing Tab from a button before the listbox focuses `alpha`, and pressing Tab again leaves the listbox to
   the button after it.
2. **Given** focus on `alpha`, **When** ArrowDown is pressed three times, **Then** focus is on `delta`; ArrowUp then
   moves it to `gamma`; no option becomes selected and no event is emitted, while focus moved on each key.
3. **Given** focus on `epsilon` (the last), **When** ArrowDown is pressed, **Then** focus stays on `epsilon` (the
   listbox does not wrap); **Given** focus on `alpha`, **When** ArrowUp is pressed, **Then** focus stays on `alpha`.
4. **Given** focus on `gamma`, **When** End is pressed, **Then** focus is on `epsilon`; Home then moves it to `alpha`.
5. **Given** focus on `gamma`, **When** Enter is pressed, **Then** `gamma` is exposed as selected, every other option
   as not selected, the listbox's `value` is `"gamma"`, `gamma` shows the selected paint (a bar on its inline-start
   edge), and exactly one `ocelle-listbox-change` is emitted with `detail` `{ "value": "gamma" }`.
6. **Given** `gamma` selected and focus on `delta`, **When** Space is pressed, **Then** `delta` is selected, `gamma` is
   not, and one `ocelle-listbox-change` with `{ "value": "delta" }` is emitted; the page did not scroll from Space.
7. **Given** `delta` selected and focused, **When** Enter or Space is pressed again, **Then** `delta` stays selected
   and no event is emitted (paired with scenario 6's event in the same test).
8. **Given** the listbox with `beta` selected, **When** the user tabs out and back in, **Then** focus lands on `beta`
   (the selected option is the tab stop); with no selected option, on the option that last had focus, or the first.
9. **Given** the listbox, **When** `epsilon` is clicked, **Then** `epsilon` is selected and focused and one
   `ocelle-listbox-change` with `{ "value": "epsilon" }` is emitted.
10. **Given** `<ocelle-option value="beta" disabled>`, **When** focus is on `alpha` and ArrowDown is pressed, **Then**
    focus skips to `gamma`; clicking `beta` selects nothing and emits nothing; `beta` is exposed as a disabled option.
    Home and End skip disabled options at the ends the same way.
11. **Given** a host sets `listbox.value = "delta"` (property) or `value="delta"` (attribute), **Then** `delta` is
    exposed as selected and becomes the tab stop, and no event is emitted (paired with the exposed selection).
    A `value` that names no enabled option, and `value = ""`, leave every option unselected and `value` reads `""`;
    no event is emitted (paired with the earlier exposed selection of `delta` in the same test). A non-empty such
    value is remembered until a matching option appears (FR-010a, scenario 19).
12. **Given** focus in the listbox, **When** Escape, Tab, ArrowLeft, ArrowRight or a letter key is pressed, **Then**
    the listbox handles none of them ("Handled and unhandled keys" above): Escape's keydown reaches a `document`
    listener with `defaultPrevented` false (so a containing dialog can close), Tab moves focus out, and ArrowLeft,
    ArrowRight and a letter move nothing (no typeahead). Paired with ArrowDown in the same test, whose keydown the
    listbox handles (`defaultPrevented` true) and which moves focus.
13. **Given** a host `aria-label="Recent folders"` on the listbox and also `label="Folders"`, **Then** the listbox is
    named "Recent folders" (host ARIA decides, as in mission 005's Host ARIA rules); without either, it is unnamed,
    and the README says a host must name it. No `aria-labelledby` from outside is needed or supported.
14. **Given** options added, removed or reordered after first render, **Then** the tree and the keyboard order follow
    the new children; if the focused option is removed, focus moves to the next enabled option after it in document
    order, else the nearest enabled option before it (FR-011); if the selected option is removed, `value` becomes
    `""` and no event is emitted. For example, with `alpha`, `beta` (focused), `gamma` (disabled), `delta`, removing
    `beta` moves focus to `delta`.
15. **Given** forced-colours mode, **When** `gamma` is selected, **Then** `gamma` shows a selected edge in the system
    `Highlight` colour on its inline-start edge, and unselected options show none; the focused option shows the focus
    ring in forced colours.
16. **Given** a listbox taller than its container's `max-block-size`, **When** focus moves with ArrowDown or End to an
    option outside the visible part, **Then** the listbox scrolls so the focused option is fully visible.
17. **Given** options `alpha`, `beta`, `gamma` written with no `value` (or `value=""`), **When** `beta` is clicked,
    **Then** one `ocelle-listbox-change` with `{ "value": "1" }` is emitted and the listbox's `value` is `"1"` (each
    option's default value is its zero-based index among the listbox's options, as a string: FR-009); setting
    `listbox.value = "2"` then selects `gamma`, and `listbox.value = ""` clears the selection.
18. **Given** `gamma` selected, **When** `gamma` gains `disabled`, **Then** it stays selected and `value` stays
    `"gamma"`, but it is no longer the tab stop (FR-016) and Enter, Space and clicks cannot select it again once
    another option is selected; no event is emitted. **When** a host then sets `listbox.value = "gamma"` (the current
    value, naming the disabled selected option), **Then** nothing changes: `gamma` stays selected, `value` reads
    `"gamma"`, and no event is emitted (setting the current value is always a no-op on the selection, FR-010).
19. **Given** a listbox with options `alpha` and `beta`, none selected, **When** a host sets `listbox.value = "delta"`
    (no option has that value yet), **Then** no option is selected and `value` reads `""`; **When** the host then
    appends `<ocelle-option value="delta">`, **Then** `delta` is selected and is the tab stop, `value` reads
    `"delta"`, and no event is emitted (paired with the exposed selection; FR-010a). **Given** instead, after the set
    of `"delta"`, the user clicks `alpha` (one event `{ "value": "alpha" }`), or the host sets `value = ""` or
    `value = "beta"`, **When** `delta` is then appended, **Then** `delta` is not selected (the remembered value was
    forgotten) and no further event is emitted. The same holds when the matching option exists but is disabled and
    later loses `disabled`: it is then selected, with no event.

---

### User Story 2 - Switch between panels with real tabs: `ocelle-tabs` (Priority: P2)

A host shows a tab list: `ocelle-tab` children for the tabs and `ocelle-tab-panel` children for the panels, paired by
order, inside `ocelle-tabs`. The element makes a real tablist with selection following focus, shows the selected
tab's panel and associates each tab with its panel itself, so no id reference crosses a shadow root.

**Why this priority**: tabs are the second user of the shared mechanism and close #521, which affects every screen
with tabs.

**Independent Test**: on the strict-CSP fixture, `ocelle-tabs` with three tabs and three panels is tabbed into,
walked with every key of its model, and read in the accessibility tree after each key.

**Acceptance Scenarios**:

1. **Given** `<ocelle-tabs label="Mission views">` with tabs `Spec`, `Plan`, `Tasks` (`value="spec"`, `"plan"`,
   `"tasks"`) and three panels, **When** the page loads, **Then** the tree exposes a tablist named "Mission views"
   with three tabs in order, the first selected, and one tabpanel whose name is "Spec" (named by its tab), holding
   the first panel's content; the other panels are hidden (no box, no node). The selected tab is exposed as
   controlling its panel.
2. **Given** focus on `Spec`, **When** ArrowRight is pressed, **Then** focus and selection move to `Plan`, its panel
   is shown and named "Plan", the `Spec` panel is hidden, and exactly one `ocelle-tabs-change` is emitted with `detail`
   `{ "value": "plan" }`.
3. **Given** focus on `Tasks` (the last), **When** ArrowRight is pressed, **Then** focus and selection wrap to `Spec`;
   **Given** focus on `Spec`, **When** ArrowLeft is pressed, **Then** they wrap to `Tasks`.
4. **Given** focus on `Plan`, **When** Home is pressed, **Then** `Spec` is focused and selected; End selects `Tasks`.
5. **Given** `dir="rtl"` on an ancestor, **When** ArrowLeft is pressed on `Spec`, **Then** focus moves to `Plan` (the
   arrows follow the visual order); paired with the left-to-right case in the same test.
6. **Given** focus on the selected tab, **When** Tab is pressed, **Then** focus moves into the selected panel: to its
   first focusable descendant, or to the panel itself when it has none (the panel is then in the tab order and shows
   the focus ring). Shift+Tab from there returns to the selected tab. Only the selected tab is in the tab order.
7. **Given** a tab with `disabled`, **Then** arrows, Home and End skip it, a click on it does nothing, and it is
   exposed as a disabled tab.
8. **Given** a host sets `tabs.value = "tasks"`, **Then** `Tasks` and its panel are selected and shown and no event is
   emitted (paired with the shown panel).
9. **Given** more tabs than panels or more panels than tabs, **Then** the extra tabs or panels are not exposed and the
   README says the two lists pair by order; no error is thrown.
10. **Given** the tabs are wider than their container, **Then** the tab row wraps onto further rows inside the
    element's box and the page does not scroll sideways at a 320 px viewport; the arrows still follow document order.
11. **Given** each state, **Then** the selected tab shows the selected paint (a bar on its block-end edge), the
    unselected tabs none, and in forced colours the selected tab shows a `Highlight` edge on its block-end edge.
12. **Given** `ocelle-tabs` inside a page whose tabs, panels and their contents carry no `id` and no `aria-*` written
    by the host, **Then** scenario 1's association holds (the element supplies it within the light DOM it owns);
    no `aria-controls` or `aria-labelledby` in the page refers across a shadow root.
13. **Given** focus on the selected tab `Plan`, **When** Enter or Space is pressed, **Then** the tabs handle the key
    ("Handled and unhandled keys"; Space does not scroll the page) and nothing changes: `Plan` stays selected and no
    event is emitted (paired with scenario 2's event in the same test). **Given** focus on `Spec` while a host has
    set `tabs.value = "tasks"` (focus on an unselected tab), **When** Enter or Space is pressed, **Then** `Spec` and
    its panel are selected and shown and one `ocelle-tabs-change` with `{ "value": "spec" }` is emitted.
14. **Given** focus on a tab, **When** ArrowUp, ArrowDown, Escape or a letter key is pressed, **Then** the tabs handle
    none of them: each keydown reaches a `document` listener with `defaultPrevented` false, focus and selection do not
    move, and no event is emitted (so the page may scroll for ArrowUp and ArrowDown, and a containing dialog receives
    Escape). Paired with ArrowRight in the same test, which is handled and moves focus and selection.
15. **Given** focus on the selected tab `Spec`, **When** it is clicked, or Home is pressed, **Then** nothing changes
    and no event is emitted (no event when the selection does not change; paired with scenario 2's event).
16. **Given** tabs written with no `value`, **When** ArrowRight is pressed twice from the first, **Then** the events
    carry `{ "value": "1" }` and then `{ "value": "2" }`, and `tabs.value` reads `"2"` (FR-009's index default).
17. **Given** `Plan` selected and focused, **When** a host sets `tabs.value = "nope"` (no enabled tab has that value)
    or `tabs.value = ""`, **Then** `Plan` stays selected, its panel stays shown, it stays the tab stop, `tabs.value`
    reads `"plan"`, and no event is emitted (FR-010).
18. **Given** `Plan` selected and focused, **When** the host removes the `Plan` tab, **Then** the next enabled tab after
    it (`Tasks`) is selected, its panel is shown, it is the tab stop and has focus, `tabs.value` reads
    `"tasks"`, and no event is emitted; the same holds when `Plan` gains `disabled` instead of being removed (FR-011a).
    **Given** every tab then disabled, **Then** no tab is selected, no panel is shown, `tabs.value` reads `""` and the
    tablist has no tab stop; enabling a tab again selects the first enabled tab (unless a remembered value names an
    enabled tab, FR-010a and scenario 20), with no event. Focus and selection
    land on the same tab: the focus target of FR-011 and the selection target of FR-011a are the same child.
19. **Given** tabs `Spec`, `Plan` (first render, `Spec` selected), **When** a host sets `tabs.value = "tasks"` (no
    tab has that value yet), **Then** `Spec` stays selected and its panel shown, `tabs.value` reads `"spec"`, and no
    event is emitted; **When** the host then appends a `Tasks` tab with `value="tasks"` and its panel, **Then**
    `Tasks` is selected, its panel is shown, it is the tab stop, `tabs.value` reads `"tasks"`, and no event is
    emitted (FR-010a). **Given** instead, after the set, the user selects `Plan` (one event `{ "value": "plan" }`)
    or the host sets another value, **When** `Tasks` is appended, **Then** the selection does not move to it.
20. **Given** an empty `ocelle-tabs` (no tabs, so no tab is enabled, FR-011a), **When** a host sets
    `tabs.value = "tasks"` and then appends the tabs `Spec`, `Plan`, `Tasks` (`value="tasks"`) and their panels in
    one operation, **Then** `Tasks` is selected, its panel is shown, it is the tab stop, `tabs.value` reads `"tasks"`,
    and no event is emitted (the remembered value takes precedence over the first enabled tab, FR-010a
    "Precedence"). **Given** instead the same three tabs all disabled and `tabs.value = "tasks"` set, **When** the host
    removes `disabled` from `Spec` and `Tasks` in one operation, **Then** `Tasks` is selected with no event.

---

### User Story 3 - Choose one of a few options as a toggle group: `ocelle-segmented-choice` (Priority: P3)

A host shows a small set of mutually exclusive options (a filter, a view switch) as `ocelle-segment` children of
`ocelle-segmented-choice`. Exactly one segment is pressed. The group is one tab stop with arrow keys between segments.
A `joined` variant draws the segments touching, with one shared border and rounded outer corners, including per row
when the group wraps, without any work by the host.

**Why this priority**: it replaces a class family with 15 uses and closes #511, and reuses the mechanism proven by the
first two stories.

**Independent Test**: on the strict-CSP fixture, a group of four segments is walked and pressed with the keyboard and
clicked, and the joined variant is measured at widths where it fits on one row and where it wraps to two.

**Acceptance Scenarios**:

1. **Given** `<ocelle-segmented-choice label="Lane filter" value="all">` with segments `All`, `Mine`, `Blocked`,
   `Done` (`value="all"`, `"mine"`, `"blocked"`, `"done"`), **When** the page loads, **Then** the tree exposes a
   group named "Lane filter" holding four toggle buttons, `All` pressed and the others not pressed; only `All` is in
   the tab order. No tab, tablist, option or `aria-selected` is exposed (distinct from tabs).
2. **Given** focus on `All`, **When** ArrowRight is pressed, **Then** focus moves to `Mine` and nothing else changes:
   `All` stays pressed and no event is emitted (paired with the focus move).
3. **Given** focus on `Mine`, **When** Enter or Space is pressed, **Then** `Mine` is pressed, `All` is not, the group's
   `value` is `"mine"`, `Mine` becomes the tab stop, and one `ocelle-segmented-choice-change` is emitted with
   `{ "value": "mine" }`.
4. **Given** `Mine` pressed and focused, **When** Enter or Space is pressed, **Then** `Mine` stays pressed (a pressed
   segment cannot be un-pressed by the user) and no event is emitted.
5. **Given** focus on `Done` (the last), **When** ArrowRight is pressed, **Then** focus wraps to `All`; ArrowLeft on
   `All` wraps to `Done`; ArrowDown and ArrowUp act as ArrowRight and ArrowLeft; Home and End move to the first and last
   enabled segment. Under `dir="rtl"` ArrowLeft moves to the next segment.
6. **Given** a click on `Blocked`, **Then** it is pressed and focused and one event with `{ "value": "blocked" }` is
   emitted.
7. **Given** a disabled segment, **Then** arrows, Home and End skip it, clicks do nothing, and it is exposed as a
   disabled toggle button.
8. **Given** the default (not joined) variant, **Then** segments are separate controls with a gap of `--ocelle-space-2`
   between them, each with its own border in `--ocelle-color-control-border` and the radius `--ocelle-radius-2`; the
   pressed segment shows the selected paint (fill `--ocelle-color-accent-low` and a border of `--ocelle-bar-width` in
   `--ocelle-color-accent-strong`).
9. **Given** `joined`, `All` pressed and a width where all four segments fit on one row, **Then** the segments touch
   with no gap; every boundary line of the group, between neighbours and around the outside, is one
   `--ocelle-border-width` wide in `--ocelle-color-control-border`, including the lines on both sides of the pressed
   `All` (the line between `All` and `Mine` is one line, not two, and not widened); only the first segment has rounded
   start corners and only the last has rounded end corners, and the inner corners are square. The pressed segment's
   paint in the joined variant is its fill `--ocelle-color-accent-low` and a bar of `--ocelle-bar-width` in
   `--ocelle-color-accent-strong` along its block-end edge, drawn inside its box above the shared boundary line, so
   that every segment of the row keeps the same outer block size and the shared lines keep their width. Measured on
   the pressed segment's edges and on the lines away from it, then again after `Blocked` is pressed.
10. **Given** `joined` and a container width at which the group wraps to two rows (`All`, `Mine`, `Blocked` on row 1,
    `Done` on row 2), **Then** each row is rounded on its own: `All` has rounded start corners, `Blocked` rounded end
    corners, and `Done` (alone on row 2) rounded corners on both ends; no host script or observer is involved. The
    rows touch, and the boundary between row 1 and row 2 is one shared line of `--ocelle-border-width`, as between
    neighbours in a row. When the container is widened to fit one row, the rounding returns to scenario 9's: measured
    by awaiting one `requestAnimationFrame` after the resize, then reading the segments' computed corner radii. The
    element's DOM never gains a `style` attribute (constitution IV; paired with the measured radii).
11. **Given** forced-colours mode, **Then** every segment's boundary is visible in a system colour (the `joined` shared
    borders included), and the pressed segment shows a `Highlight` edge of `--ocelle-bar-width` (in the joined
    variant, on its block-end edge inside its box, as in scenario 9).
12. **Given** each segment, **Then** its box is at least `--ocelle-target-min` high (a primary action in filter bars).
13. **Given** focus on a segment, **When** Escape or a letter key is pressed, **Then** the group handles neither:
    each keydown reaches a `document` listener with `defaultPrevented` false, focus and the pressed segment do not
    change, and no event is emitted. Paired with ArrowRight in the same test, which is handled and moves focus. Arrow
    keys, Home, End, Enter and Space are handled (Space never scrolls the page while a segment has focus, also on the
    already pressed segment); Tab leaves the group.
14. **Given** segments written with no `value`, **When** the third is clicked, **Then** one
    `ocelle-segmented-choice-change` with `{ "value": "2" }` is emitted and the group's `value` is `"2"` (FR-009).
15. **Given** `Mine` pressed, **When** a host sets `value = "nope"` (no enabled segment has that value) or
    `value = ""`, **Then** `Mine` stays pressed and the tab stop, `value` reads `"mine"`, and no event is emitted.
    **When** the host removes `Mine`, or sets `disabled` on it, **Then** the next enabled segment after it (`Blocked`)
    is pressed and is the tab stop (and takes focus if `Mine` had it), `value` reads `"blocked"`, and no event is
    emitted (FR-011a). **Given** every segment disabled, **Then** none is pressed, `value` reads `""` and the group
    has no tab stop.
16. **Given** segments `All`, `Mine` with `All` pressed, **When** a host sets `value = "blocked"` (no segment has
    that value yet), **Then** `All` stays pressed, `value` reads `"all"`, and no event is emitted; **When** the host
    then appends `<ocelle-segment value="blocked">`, **Then** `Blocked` is pressed and is the tab stop, `value` reads
    `"blocked"`, and no event is emitted (FR-010a). **Given** instead, after the set, the user presses `Mine` (one
    event `{ "value": "mine" }`) or the host sets another value, **When** `Blocked` is appended, **Then** it is not
    pressed.
17. **Given** an empty `ocelle-segmented-choice` (no segments, so no segment is enabled, FR-011a), **When** a host
    sets `value = "blocked"` and then appends the segments `All`, `Mine`, `Blocked` (`value="blocked"`) in one
    operation, **Then** `Blocked` is pressed and is the tab stop, `value` reads `"blocked"`, and no event is emitted
    (the remembered value takes precedence over the first enabled segment, FR-010a "Precedence").

---

### User Story 4 - Copy a long command through the host: `ocelle-copy-field` (Priority: P4)

A host shows a command or identifier the user may copy. The text wraps instead of scrolling. A Copy control sits flush
at the field's end. Pressing it does not touch the clipboard: the field emits a request with the text, the host writes
the clipboard (through its desktop bridge or the page's API) and sets the field's `status` text to report the outcome
in its own words, which the field shows in a polite live region.

**Why this priority**: it closes #534 for Kitty Desktop's webview and is independent of the roving-focus mechanism.

**Independent Test**: on the strict-CSP fixture, a copy field with a 300-character command is measured at 320 px, its
Copy control activated by click, Enter and Space, the request event read, a `status` set by a test listener, and the
live region read from the accessibility tree and observed for mutations.

**Acceptance Scenarios**:

1. **Given** `<ocelle-copy-field value="pnpm --filter @ocelle/elements run manifest">`, **When** the page loads,
   **Then** the text is shown in the sans (Schibsted Grotesk) with tabular figures, never a monospace face, on
   `--ocelle-color-inset`, and the Copy control is a button named "Copy" showing the `copy` icon (decorative).
2. **Given** a 300-character command with no spaces and a 320 px viewport, **Then** the text wraps onto as many lines
   as needed inside the field, the field has no horizontal scrollbar, and the page does not scroll sideways.
3. **Given** the field, **When** the Copy control is clicked, **Then** exactly one `ocelle-copy-field-request` is
   emitted with `detail` `{ "text": "<the value, exactly>" }`, and no clipboard write occurs (the page's clipboard
   write methods are observed and not called; paired with the event in the same test).
4. **Given** focus on the Copy control, **When** Enter is pressed, and separately Space, **Then** each emits one
   request as in scenario 3. Escape and letter keys are not handled: their keydown reaches a `document` listener with
   `defaultPrevented` false and nothing is emitted (paired with Enter's request in the same test).
5. **Given** a listener that sets `field.status = "Copied to clipboard"` on the request, **Then** the accessibility
   tree holds the text "Copied to clipboard" exactly once, as the content of one node with live `polite` (role
   `status`) inside the field, beside the Copy control; that visible text is itself the live region's content, not a
   second copy. The region is present and empty from first render, and its text goes from empty to the status text
   after the request. **When** the host sets the same `status` again with no new request, **Then** the region's
   content is not mutated (a MutationObserver on the region records no mutation), paired in the same test with the
   recorded mutation of the first set.
6. **Given** a status shown, **When** the Copy control is activated again, **Then** the status is cleared before the
   new request event is emitted (a listener reading `field.status` during the event sees `""`, and the region is
   empty at that moment), and when the listener sets the same text again the region's text goes from empty to that
   text again (a recorded mutation), so a host's new status is a new live-region change.
7. **Given** a host that sets `status` to a failure text ("Could not copy: the bridge is unavailable"), **Then** it is
   shown in the live region the same way (scenario 5); the field draws no colour or icon of its own for success or
   failure (the words are the host's).
8. **Given** `copy-label="Copy command"`, **Then** the Copy control is named "Copy command"; without it, "Copy". A host
   `aria-label` on the copy field names the field's group, not the control.
9. **Given** the Copy control, **Then** its box is at least `--ocelle-target-min` in both dimensions, it shares the
   field's border on its inline-start side (flush: no gap and no double border between text and control), it shows
   the token focus ring when focused, and its CSS part is `copy-control`.
10. **Given** `value` empty or missing, **Then** the Copy control is disabled (exposed as disabled) and activating it
    emits nothing; paired with the enabled case in the same test.
11. **Given** forced-colours mode, **Then** the field's boundary and the Copy control's boundary are visible in system
    colours and the icon is drawn in the control's system text colour.
12. **Given** the user selects the text with the pointer, **Then** the text is selectable as ordinary text (the field
    does not prevent selection), so manual copying still works.

---

### User Story 5 - Follow or act on a link in running text: `ocelle-link` (Priority: P5)

A host writes a link inside a sentence. It looks like the library's links (link colour with an underline, the token
focus ring), is exposed and operated as a link, and always tells the host it was activated. Without `href` it never
navigates; with `href` it navigates unless the host cancels the event.

**Why this priority**: it closes #522 and is the smallest element; it shares no mechanism with the others.

**Independent Test**: on the strict-CSP fixture, links with and without `href` inside a paragraph are activated by
Enter and click, with and without a listener that cancels, and the event, the navigation and the tree are read.

**Observing navigation.** Before an activation the test sets a marker property on `window`. "The page navigates to U"
means: the top-level document's URL becomes U, the marker is gone (a new document was loaded) and the fixture's link
target page's own content is present. "The page does not navigate" means: after the activation's event and the end of
the task that dispatched it, the URL is unchanged, the marker is still present, and no `securitypolicyviolation`
event, dialog or console error occurred; it is paired in the same test with a later activation of scenario 4's link,
whose navigation is then observed (a defect that navigates for every `href` fails the first half).

**Acceptance Scenarios**:

1. **Given** `<p>See <ocelle-link>the mission log</ocelle-link> for details.</p>`, **Then** the tree exposes a link
   named "the mission log" inside the paragraph's text, in the tab order; it is drawn inline in
   `--ocelle-color-link` with an underline (a non-colour cue), and in `--ocelle-color-link-hover` under the pointer.
2. **Given** that link focused, **When** Enter is pressed, **Then** one `ocelle-link-activate` is emitted with `detail`
   `{ "href": null }`, `cancelable` true, and the page does not navigate (paired with the event). Space is not
   handled: it emits no event and its keydown's default (page scroll) is not prevented; paired with Enter's event in
   the same test.
3. **Given** the same link, **When** clicked, **Then** one event as in scenario 2.
4. **Given** `<ocelle-link href="link-target.html">` on the fixture page, **When** activated by Enter or a plain click
   with no listener cancelling, **Then** one `ocelle-link-activate` with `{ "href": "link-target.html" }` is emitted
   first, then the page navigates to the fixture's link target page (the `href` resolved against the document's base
   URL).
5. **Given** the same link and a listener that calls `preventDefault()`, **When** activated, **Then** the event is
   emitted and the page does not navigate (paired with scenario 4's navigation in the same test).
6. **Given** a link that wraps across two lines in a narrow paragraph, **When** focused, **Then** the focus ring
   (`--ocelle-focus-width`, `--ocelle-color-focus`, `--ocelle-focus-offset`) is drawn around each line's fragment.
7. **Given** forced-colours mode, **Then** the link is drawn in the system `LinkText` colour, underlined, and the focus
   ring is visible.
8. **Given** a host `aria-label` on the link, **Then** it is the link's name; the link's own text is the name otherwise.
9. **Given** an `href` whose URL, resolved against the document base, has a protocol other than `http:`, `https:` or
   the document's own protocol: `javascript:alert(1)`, the whitespace-padded `" javascript:alert(1)"`,
   `"java<TAB>script:alert(1)"` (a tab character inside the scheme) and `data:text/html,x`, **When** each is
   activated by Enter and by a plain click, **Then** the event is emitted with the `href` exactly as written, and the
   page does not navigate (paired with scenario 4's navigation); the README says hosts that need other schemes handle
   the event.
10. **Given** a protocol-relative `href` naming the fixture's own host (`//<fixture host>/link-target.html`), **When**
    activated, **Then** the event carries that `href` as written and the page navigates to the link target page (it
    resolves to the document's `http:` protocol).
11. **Given** the fixture page with `<base href="kitty-app://app/">` and `<ocelle-link href="x">`, **When** activated,
    **Then** the event carries `{ "href": "x" }` and the page does not navigate: the resolved protocol `kitty-app:` is
    neither `http:`, `https:` nor the document's own `http:` (paired with scenario 4's navigation).
12. **Given** a copy of the fixture page opened from a `file:` URL, standing in for a webview whose document protocol
    is neither `http:` nor `https:` (Kitty Desktop's custom scheme), with the same policy given by a `<meta>` element
    and a `link-target.html` beside it, **When** `<ocelle-link href="link-target.html">` is activated, **Then** the
    page navigates to that `file:` target, because the resolved protocol equals the document's own. The plan confirms
    that the test runner can open this page; if it cannot, the plan raises it to the operator instead of dropping the
    case.
13. **Given** `<ocelle-link href="link-target.html">`, **When** it is activated with Ctrl, Meta (Cmd) or Shift held
    (click or Enter), or clicked with the middle button, **Then** no `ocelle-link-activate` is emitted, the
    activating event's default is not prevented by the element (read by a `window` listener in the bubble phase),
    and the page itself does not navigate in place; the browser's own behaviour (new tab or window) is kept. Paired
    in the same test with a plain click's event. An activation with only Alt held is a plain activation. **Given**
    `<ocelle-link>` without `href`, **When** it is activated with Ctrl, Meta (Cmd) or Shift held (click or Enter), or
    clicked with the middle button, **Then** no `ocelle-link-activate` is emitted and the page does not navigate,
    as with `href` (operator decision Q2 (b) at spec check 2); paired in the same test with a plain click's event
    `{ "href": null }`.

---

### Edge Cases

- An `ocelle-option`, `ocelle-tab`, `ocelle-tab-panel` or `ocelle-segment` outside its parent renders its content as
  plain content with no role and no tab stop; the README says it is only meaningful inside its parent.
- Two options (or tabs, or segments) with the same `value`: a host `value` set selects the first in document order;
  a user selection of the second exposes the second (the clicked or keyed child) as selected or pressed and reports
  the same value. The README tells hosts to keep values unique.
- A listbox, tablist or segmented choice whose every child is disabled has no tab stop; Tab passes over it. A tablist
  or segmented choice then has nothing selected or pressed and `value` `""` (FR-011a); tabs show no panel. A tablist
  or segmented choice with no children at all is in the same state; when children are appended to it, a remembered
  host value picks among them before the first enabled child does (FR-010a, "Precedence").
- A listbox with no options: it is exposed as an empty named listbox and has no tab stop.
- Setting `value` to the current value is a no-op (no event, no re-render flicker).
- A child's text changes after render: its accessible name follows.
- The copy field's `value` changes while a `status` is shown: the status is cleared.
- `status` set when no request was made (a host reporting proactively): it is shown in the live region like any status.
- First render with both `value` and `status` written: the status is shown in the live region; setting `value` at
  first render is not a change and clears nothing. When the element clears `status` (FR-042), the property reads `""`;
  a `status` attribute the host wrote stays as written (not reflected) and is read again only when it changes.
- The joined segmented choice inside a container that resizes continuously (a drag): rounding follows within one frame
  after each resize, with no layout loop and no console error.
- Reduced motion: none of these elements animates selection or focus changes beyond the token durations, which drop
  to 0 ms under reduced motion.
- Host `hidden` removes any of these elements (no box, no node), as in mission 005's convention.
- Two copies of the package on one page: the first definition wins (mission 005's `define`), for every new element.

## Requirements *(mandatory)*

### Functional Requirements

**Shared (all elements)**

- **FR-001**: The feature adds nine elements to `@ocelle/elements`: `ocelle-listbox`, `ocelle-option`, `ocelle-tabs`,
  `ocelle-tab`, `ocelle-tab-panel`, `ocelle-segmented-choice`, `ocelle-segment`, `ocelle-copy-field` and
  `ocelle-link`, each written to mission 005's element conventions (module per element with its own entry point,
  `define`, `static properties` and `declare` fields, token-only shared static styles, `:host([hidden])`, variant rules
  inside `@media not (forced-colors: active)`) and included in the browser build.
- **FR-002**: Every event is a `CustomEvent` named `ocelle-<element>-<action>`, `bubbles: true`, `composed: true`, with
  exactly the `detail` its user story states. Events fire on user action only, never on a property or attribute set
  by the host. Only `ocelle-link-activate` is cancelable.
- **FR-003**: The elements perform no I/O: no clipboard read or write, no storage, no network request, no navigation
  other than `ocelle-link`'s with an `href` (FR-047).
- **FR-004**: The roles, states, tab order and associations of a parent and its children are set by the elements
  themselves within one tree scope. No `aria-labelledby`, `aria-describedby`, `aria-controls` or `for` reference
  crosses a shadow root, and a host writes no id or `aria-*` on children for the pattern to work (constitution III).
- **FR-005**: The listbox, tabs and segmented choice share one internal keyboard mechanism (roving tabindex, the key
  map of each pattern, skipping disabled children, the tab stop on the selected child); it is not public surface.
- **FR-006**: Every parent takes its accessible name from `label` (attribute and property, not reflected, trimmed;
  blank counts as none) or a host `aria-label`, under mission 005's Host ARIA rules (a present host `aria-label` decides
  alone).
- **FR-007**: Every interactive child shows the token focus ring (`--ocelle-focus-width`, `--ocelle-color-focus`,
  `--ocelle-focus-offset`) when focused by keyboard, in both themes and in forced colours.
- **FR-008**: The selected or pressed state is painted as "Selected-state paint" above defines, keyed on the exposed
  ARIA state, in both themes and in forced colours. No paint uses `--ocelle-color-rule` for a control boundary.
- **FR-009**: Children (`ocelle-option`, `ocelle-tab`, `ocelle-segment`) take `value` (attribute and property,
  reflected) and `disabled` (boolean, reflected). A child whose `value` is missing or blank has a default value: its
  zero-based index among its parent's children of its kind (disabled children counted), as a string. The default is
  what the child's `value` property reads and what events and the parent's `value` report; it is not written to the
  attribute, and it follows the child's current index when children are added, removed or reordered. So no child's
  value is ever `""`. Their content is a default slot; the slot convention's `icon` slot is available on
  `ocelle-option`, `ocelle-tab` and `ocelle-segment` for a leading icon.
- **FR-010**: Each parent has `value` (attribute and property): the selected or pressed child's value, `""` when none.
  Setting it to a value some enabled child has selects the first such child in document order. Setting it to `""` or
  to a value no enabled child has: on the listbox, clears the selection (`value` reads `""`); on tabs and the
  segmented choice, keeps the current selection (`value` reads the selected child's value; on first render with no
  selection yet, the first enabled child is selected, FR-021 and FR-027, subject to FR-010a's precedence). A host set never emits an event. Setting
  the current value (the value `value` reads at that moment) is always a no-op on the selection, and this clause
  wins over the previous ones: even when it names a selected child that is disabled (User Story 1 scenario 18), that
  child stays selected.
- **FR-010a**: A parent remembers the last non-empty value a host set (by attribute or property) that no enabled
  child had at the time of the set (operator decision Q1 (b) at spec check 2). While it is remembered, the listbox's
  `value` reads `""`, and tabs and the segmented choice keep their current selection (or, on first render, the first
  enabled child), as FR-010 states. When a child with that value becomes enabled and present (it is added, its
  `value` changes to it, it moves in, or it loses `disabled`), the parent selects or presses the first such child in
  document order, as a host set would: it becomes the tab stop, for tabs its panel is shown, `value` reads it, and no
  event is emitted. The parent then forgets the remembered value. It also forgets it on the next user selection and
  on the next host set of any value, `""` and the current value included; that host set is then applied by itself
  under FR-010 and may be remembered in turn (User Story 1 scenario 19, User Story 2 scenario 19, User Story 3
  scenario 16). Selection moves under FR-011a do not forget it.
  **Precedence.** Every time tabs or the segmented choice select or press a child without user action (on first
  render under FR-021 and FR-027, after the selected or pressed child is removed or disabled under FR-011a, and when
  a child becomes enabled while none was under FR-011a), a remembered value takes precedence: the parent picks the
  first enabled child in document order that has the remembered value, if one is present, and forgets the value;
  otherwise it picks the rule's own target. Children added or enabled in one operation (the same task) are taken
  together, so the outcome does not depend on the order in which they arrive: when a host sets `value = "tasks"` on
  an empty parent and then appends `Spec`, `Plan` and `Tasks` at once, or enables `Spec` and `Tasks` at once while
  every child was disabled, `Tasks` is selected or pressed (User Story 2 scenario 20, User Story 3 scenario 17).
- **FR-011**: Children added, removed or reordered after render are picked up without host action: the tree and the
  keyboard order follow the new children, and when the focused child is removed, focus moves to the next enabled
  child after it in document order, else the nearest enabled child before it; with none, focus leaves the parent as
  the browser does for a removed element (User Story 1 scenario 14, for all three parents). For tabs and the
  segmented choice, when the removed child was both focused and selected or pressed, this focus target and FR-011a's
  selection target are the same child, so focus and selection land together; when FR-010a's precedence makes the
  selection target a child with the remembered value instead, focus goes to that child with the selection (User Story 2 scenario 18, User Story 3
  scenario 15). The listbox's selection outcome when its selected option is removed is User Story 1 scenario 14's
  (`value` becomes `""`); a selected option that becomes disabled stays selected (User Story 1 scenario 18).
- **FR-011a**: Tabs and the segmented choice keep exactly one child selected or pressed whenever at least one is
  enabled. When the selected or pressed child is removed or becomes disabled, the next enabled child after it in
  document order is selected or pressed, else the nearest enabled child before it; it becomes the tab stop, takes
  focus if the previous child had focus, and for tabs its panel is shown; `value` reads its value; no event is
  emitted. When no child is enabled, none is selected or pressed, `value` reads `""`, tabs show no panel and there is
  no tab stop; a parent with no children at all counts as "no child is enabled". When a child becomes enabled again
  (it loses `disabled`, or it is added, including the first children appended to an empty parent), the first enabled
  child is selected or pressed, with no event. In each of these picks a remembered value takes precedence over the
  target named here (FR-010a, "Precedence") (User Story 2 scenarios 17, 18 and 20, User Story 3 scenarios 15 and
  17).

**Listbox (User Story 1)**

- **FR-012**: `ocelle-listbox` is exposed as a single-select listbox; each `ocelle-option` as an option with
  `selected` true or false and `disabled` when disabled.
- **FR-013**: ArrowDown and ArrowUp move focus to the next and previous enabled option without wrapping; Home and End to
  the first and last enabled option; focus moves only, selection does not follow focus.
- **FR-014**: Enter, Space and a click select the focused or clicked enabled option and emit
  `ocelle-listbox-change` with `{ value }`, unless it was already selected. Space does not scroll the page.
- **FR-015**: The listbox handles ArrowDown, ArrowUp, Home, End, Enter and Space, and no other key: Escape, Tab,
  ArrowLeft, ArrowRight and printable keys (no typeahead) are not handled ("Handled and unhandled keys").
- **FR-016**: The tab stop is the selected option if enabled, else the last focused enabled option, else the first
  enabled option.
- **FR-017**: When the listbox scrolls (a host sets its block size), the focused option is scrolled fully into view
  on every key move.
- **FR-018**: The selected option's bar sits on its inline-start edge.

**Tabs (User Story 2)**

- **FR-019**: `ocelle-tabs` is exposed as a tablist (named by FR-006), each `ocelle-tab` as a tab, and the panel of the
  selected tab as a tabpanel named by that tab; the selected tab is exposed as controlling that panel. Tabs and panels
  pair by order; unpaired extras are not exposed.
- **FR-020**: Each tab's `value` defaults as FR-009 states for every child (its zero-based index as a string).
- **FR-021**: ArrowRight and ArrowLeft move focus and selection to the next and previous enabled tab in visual order
  (reversed under right-to-left), wrapping at the ends; Home and End to the first and last enabled tab. A click on an
  enabled tab, and Enter or Space on a focused unselected tab, select it. Each change of selection by the user emits
  one `ocelle-tabs-change` with `{ value }`; no event when the selection does not change (a click, Home, End, Enter or
  Space on the selected tab). Exactly one tab is selected whenever at least one is enabled (FR-011a): on first render
  with no `value`, or a `value` no enabled tab has, the first enabled tab, unless FR-010a's remembered value names an
  enabled tab ("Precedence").
- **FR-021a**: The tabs handle ArrowRight, ArrowLeft, Home, End, Enter and Space, and no other key: ArrowUp,
  ArrowDown, Escape and printable keys are not handled ("Handled and unhandled keys"); Tab follows FR-023.
- **FR-022**: The tab row wraps onto further rows when wider than its container; it never scrolls sideways.
- **FR-023**: Only the selected tab is in the tab order; from it, Tab moves into the selected panel (its first
  focusable descendant, or the panel itself, which is then focusable and shows the focus ring).
- **FR-024**: Unselected panels have no box and no accessibility node.
- **FR-025**: The selected tab's bar sits on its block-end edge.

**Segmented choice (User Story 3)**

- **FR-026**: `ocelle-segmented-choice` is exposed as a group (named by FR-006) of toggle buttons; each `ocelle-segment`
  as a toggle button with `pressed` true or false. It exposes no tab, tablist, option or `selected` state.
- **FR-027**: Exactly one enabled segment is pressed whenever at least one is enabled (FR-011a): on first render with
  no `value`, or a `value` no enabled segment has, the first enabled segment, unless FR-010a's remembered value names
  an enabled segment ("Precedence"). A user cannot un-press the pressed
  segment.
- **FR-028**: Arrow keys (Right and Down forward, Left and Up back; Left and Right swapped under right-to-left) move
  focus among enabled segments with wrapping, without pressing; Home and End to the first and last. Enter, Space and a
  click press the focused or clicked segment and emit `ocelle-segmented-choice-change` with `{ value }` unless it was
  already pressed. The pressed segment is the tab stop. The group handles the arrow keys, Home, End, Enter and Space
  (Space never scrolls the page), and no other key: Escape and printable keys are not handled ("Handled and unhandled
  keys"); Tab leaves the group.
- **FR-029**: The `joined` attribute (boolean, reflected) gives the joined variant of User Story 3 scenarios 9 and 10:
  touching segments and rows, one shared border line of `--ocelle-border-width` in `--ocelle-color-control-border`
  between neighbours and between rows (the pressed segment's lines included), rounded outer corners only at the start
  of each row's first segment and the end of each row's last segment, recomputed by the element itself when it wraps
  or unwraps, without a `style` attribute and without host code. In the joined variant the pressed segment is painted
  with the fill `--ocelle-color-accent-low` and a bar of `--ocelle-bar-width` in `--ocelle-color-accent-strong` (in
  forced colours, `Highlight`) along its block-end edge inside its box; the bar neither widens a shared line nor
  changes the segment's outer size. The default variant's pressed paint is User Story 3 scenario 8's.
- **FR-030**: Each segment's box is at least `--ocelle-target-min` high.

**Copy field (User Story 4)**

- **FR-031**: `ocelle-copy-field` takes `value` (attribute and property): the text shown and requested.
- **FR-032**: The text wraps at any point when it does not fit (`overflow-wrap: anywhere` semantics, consistent with
  `@ocelle/styles`' identifier wrap policy), never scrolls sideways, keeps its whitespace runs as written, is drawn
  in the sans with tabular figures (no monospace, constitution II), on `--ocelle-color-inset`, and stays selectable.
- **FR-033**: The Copy control is a native button in the field's shadow root (operator decision Q1 (c)), styled from
  tokens, showing `ocelle-icon name="copy"` through the slot convention, decorative.
- **FR-034**: The Copy control is named by `copy-label` (attribute and property, not reflected, trimmed), default
  "Copy"; a host `aria-label` on the field names the field, which is exposed as a group.
- **FR-035**: Activating the Copy control (click, Enter, Space) clears `status`, then emits
  `ocelle-copy-field-request` with `{ text }`, the exact `value`. It never writes or reads the clipboard.
- **FR-036**: With an empty or missing `value`, the Copy control is disabled and emits nothing.
- **FR-037**: The Copy control sits flush at the field's inline end: it shares the field's border, with no gap and no
  double line, and is at least `--ocelle-target-min` in both dimensions.
- **FR-038**: The field's CSS parts are `value` (the text) and `copy-control` (the Copy control); they are public
  surface and stay when the control becomes `ocelle-button` (FR-044).
- **FR-039**: In forced colours the field's and the control's boundaries are drawn in system colours.
- **FR-040**: The field's text is exposed to assistive technology as static text inside the field's group, before the
  Copy control in reading order.
- **FR-041**: `status` (attribute and property, not reflected): the host's outcome text. The field's shadow root holds
  one polite live region (role `status`), present and empty from first render, beside the Copy control. Non-blank
  `status` text is shown as that region's content, and the accessibility tree holds the text exactly once (the visible
  text is the region's content, not a second copy); blank shows nothing and leaves the region empty. Setting `status`
  to the text the region already holds does not mutate the region; after a clear (FR-042), setting a text puts it in
  the empty region again (User Story 4 scenarios 5 and 6).
- **FR-042**: `status` is cleared by the element (the property reads `""` and the region is emptied) when a new
  request starts (FR-035) and when `value` changes after first render; the field draws no success or failure colour or
  icon of its own. A `status` attribute the host wrote stays as written and is read again only when it changes (Edge
  Cases).
- **FR-043**: The field emits nothing and changes no `status` on its own other than FR-042's clearing.
- **FR-044**: The README states that the Copy control will become `ocelle-button` in a later op once #7 merges, and
  that its part name, accessible name and events stay, so the swap is a PATCH.

**Link (User Story 5)**

- **FR-045**: `ocelle-link` is inline in running text, exposed as a link named by its text (or a host `aria-label`),
  in the tab order, drawn in `--ocelle-color-link` with an underline and in `--ocelle-color-link-hover` on hover, and in
  forced colours in `LinkText` with an underline.
- **FR-046**: Enter and a primary-button click activate it; Space does not. Each plain activation emits one cancelable
  `ocelle-link-activate` with `{ href }`: the `href` attribute as written, or `null` without one. With `href`, a
  modified activation (Ctrl, Meta or Shift held on a click or Enter, or a middle-button click) emits no event, and
  the element does not prevent its default, so the browser's own behaviour (new tab or window) is kept (operator
  decision Q2 (a); User Story 5 scenario 13). Without `href`, every modified activation likewise emits no event
  (operator decision Q2 (b) at spec check 2): only plain activations emit, and a host routes only those. An
  activation with only Alt held is a plain activation.
- **FR-047**: Without `href` it never navigates. With `href`, after the event, unless the event's default was
  prevented, it navigates to the `href` resolved against the document base URL, and only when the resolved URL's
  protocol is `http:`, `https:`, or equal to the document's own protocol (operator decision Q1 (b)). The check is on
  the resolved URL, never on the written string, so leading spaces or tabs and newlines inside a scheme do not bypass
  it. Any other protocol (for example `javascript:`, `data:`, or a custom scheme that is not the document's) is never
  navigated by the element (User Story 5 scenarios 4 and 9 to 12).
- **FR-048**: The focus ring follows each line fragment when the link wraps (FR-007).
- **FR-049**: `ocelle-link` has no `target`, `download` or `rel` handling in this feature; the README says that a
  user's modified activation keeps the browser's new tab or window (FR-046), that a modified activation of a link
  without `href` does nothing, and that a host that wants to open a new window itself handles the event.

**Stories, baselines, axe (on #10's design; implementation after #10 merges)**

- **FR-050**: Every element has stories in `storybook/stories/<element>.stories.ts` per variant and state, each
  captured in light and dark by #10's `visual` gate with committed baselines from the pinned container: listbox (no
  selection, a selected option, a disabled option, focused option, a scrolling listbox), tabs (first selected, another
  selected, a disabled tab, wrapped rows, focused tab), segmented choice (default and joined, one row and wrapped,
  pressed, disabled, focused), copy field (short, wrapped long command, with a status, empty/disabled), link (in a
  paragraph, wrapped across lines, focused, with a hover state declared per 006 FR-031).
- **FR-051**: The `axe` gate reports no serious or critical finding on any of these stories in either theme, with no
  new entry in `storybook/a11y-exceptions.json`.
- **FR-052**: The stories and the tests that read them are written in each phase's red commit, before the green
  commit (operator decision I3).
- **FR-053**: Implementation of this feature starts only after #10 has merged (operator decision Q3 (c)); the spec,
  plan and tasks are written before. Before the first phase is implemented, the plan's story, baseline and axe tasks
  are rechecked against #10 as merged (its gates, contributor note 006 FR-025, `contracts/gates.md`,
  `contracts/container.md`). Every phase lands with its stories, committed light and dark baselines and a passing
  `axe` gate; none is recorded as pending #10.
- **FR-054**: If #16 (mission 008) has merged before this feature lands, this feature adds the composed story of an
  `ocelle-dialog` holding an `ocelle-listbox` (008 spec: "the feature that lands second adds the composed story");
  otherwise 008 does.

**Manifest, documentation, CSP**

- **FR-055**: `custom-elements.json` declares, for each of the nine elements, every public property and attribute
  (type, default, description), event (name, `detail` type, description), slot and CSS part, each list stated even
  when empty, and the `manifest` gate passes.
- **FR-056**: The README of `@ocelle/elements` gains a section per element (usage, properties, events and payloads,
  keyboard model, naming, the tokens it reads, what hosts must do) and updates the engine floor if an element uses a
  newer feature; a documentation test checks each section's statements.
- **FR-057**: The built output (module and browser builds) passes the `csp` gate, and every browser scenario runs on
  the strict-CSP fixture with no CSP violation and no request outside the allowed list ("The strict-CSP fixture",
  with the link target page allowed for User Story 5 only; User Story 5 scenario 12 runs on a `file:` copy of the
  fixture with the same policy in a `<meta>` element).
- **FR-058**: `@ocelle/elements`' changelog names the nine new elements as a MINOR change. A new token, if the plan
  needs one, is added through `@ocelle/tokens`' validation and contrast pairs and named in its changelog.
- **FR-059**: Every keyboard path of every element has an interaction test driven by real key input ("Real input
  only" above), and every emitted event and its payload is asserted.

### Key Entities

- **Parent and children**: `ocelle-listbox`/`ocelle-option`, `ocelle-tabs`/`ocelle-tab` + `ocelle-tab-panel`,
  `ocelle-segmented-choice`/`ocelle-segment`; a child has `value`, `disabled`, content; a parent has `value`, `label`,
  and the selection state.
- **Event**: name, `detail` payload (`{ value }`, `{ text }`, `{ href }`), cancelable or not.
- **Copy status**: host-owned text, shown once as the content of the field's polite live region, cleared by a new
  request or a value change.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Every key of each element's keyboard model (User Stories 1 to 3: arrows, Home, End, Enter, Space, Tab;
  User Stories 4 and 5: Enter, Space, Tab), and every unhandled key the stories name (Escape, a letter, and the
  arrows each pattern leaves alone), has at least one test driven by real input whose outcome is read from focus, the
  keydown's `defaultPrevented` and the accessibility tree; 100% of the scenarios above pass in Chromium on the
  strict-CSP fixture.
- **SC-002**: 100% of emitted events (five event names) are asserted with their exact payload, and every "emits
  nothing" outcome is paired with a positive outcome in the same test.
- **SC-003**: No page in this feature's tests or stories has an id reference crossing a shadow root, and none needs a
  host-written id or `aria-*` on a child: checked by reading the accessibility tree of a page whose children carry none.
- **SC-004**: A 300-character command in the copy field at a 320 px viewport produces no horizontal scroll, in both
  themes.
- **SC-005**: The joined segmented choice shows correct end rounding on every row at one-row and two-row widths, with
  zero host code and zero `style` attributes.
- **SC-006**: Zero clipboard calls by any element across all tests; the copy outcome text the host sets appears
  exactly once in the accessibility tree, inside one polite live region, and the region's content changes from empty
  to that text once per request and not on a repeated set of the same text (User Story 4 scenarios 5 and 6).
- **SC-007**: Every story has committed light and dark baselines and the `axe` gate reports 0 serious or critical
  findings on them when each phase lands (implementation starts after #10 has merged, FR-053).
- **SC-008**: The manifest, CSP, prefix, style-lint, contrast and mutation gates pass; every surviving mutant in new
  code is killed or recorded as equivalent with a reason.
- **SC-009**: kitty-mission-ui can build its Open project folder picker, its tabbed screens, its 15 segmented choices,
  its in-text links and its copy fields from these elements with no local ARIA wiring, `ResizeObserver` or clipboard
  code (checked by the README's examples covering each use, not in this repository).

## Assumptions

- The spec-kitty-design issues #511, #521, #522, #527 and #534 were not readable from this session; requirements come
  from #14's text. If the spec check or plan reads them and finds a further need (for example a compact segmented
  size), that need is raised to the operator, not silently added.
- Listbox arrows do not wrap (the WAI-ARIA listbox default); tabs and segmented choice arrows wrap (as #14 states for
  tabs, and the toolbar pattern for segments).
- Selection in the listbox does not follow focus (#14: "selection on Enter or Space"); in tabs it does (#14).
- Horizontal tabs only; a vertical tab orientation is out of scope.
- Out of scope: multi-select listbox, typeahead, option groups, a popup or combobox listbox (#9's select is native),
  a `multiple` segmented choice, `ocelle-button` (#7), the dialog (#16), the Storybook harness (#10), migrating
  consumers.
- The copy field's text is plain text; a host that needs a digest in groups of four formats `value` itself.
- New tokens are not expected: `color-accent-low`, `color-accent-strong`, `bar-width`, `border-width`, `focus-*`,
  `target-min`, `radius-2`, `color-link*`, `color-inset` and `color-control-border` exist. If the plan finds one is
  needed, it spans `@ocelle/tokens` and is a plan decision recorded in Complexity Tracking or the plan.
- Only Chromium is measured; WebKit stays an open limitation.
