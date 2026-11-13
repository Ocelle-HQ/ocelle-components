# Research: Action Controls, `ocelle-button` and `ocelle-action-row`

**Feature**: [spec.md](spec.md) | **Plan**: [plan.md](plan.md) | **Date**: 2026-11-13 (squad rounds 1, 2 and 3 fixes,
and the merge of feature 006 into this branch, applied the same day)

Measurements were taken on 2026-11-13 in this container with Chromium 153.0.8010.12
(`/opt/pw-browsers/chromium-1243/chrome-linux64/chrome`, the build `OCELLE_CHROMIUM_PATH` points at here; the pinned
Playwright 1.64.1 expects build 1248, which CI installs) through the CDP Accessibility domain, and axe-core on the same
pages. The experiment scripts are not part of the repository; each finding below states what was measured. WebKit is
not available here and is not measured (an open limitation, as in mission 005); WebKit release figures come from
MDN's browser-compat-data 8.1.9 (read 2026-11-13). Squad findings are cited by id (`reviews/plan/round-1/refute.md`,
`reviews/plan/round-2/refute.md`, `reviews/plan/round-3/refute.md`).

## R-01 Element structure: one inner control, with `delegatesFocus`

**Decision**: each element renders, in an open shadow root attached with `delegatesFocus: true`, exactly one native
`<button type="button">` (button mode) or `<a>` (link mode) with the CSS part `control`, laid out by mission 005's slot
convention (`icon-row`, `iconSlotStyles`). The host is `display: inline-grid` (button) or `display: grid` (row, with
`min-inline-size: min-content`, R-10), and the inner control is its single grid item, stretched in both axes (the
default `justify-self` and `align-self` of a grid item), so the inner control always fills the host's box
(PLAN-FRESH-2-001 (a)). The host gets no tabindex and no role. `ocelle-button.focus()` and `ocelle-action-row.focus()` focus the inner control (a host,
and #16's dialog returning focus to its opener, call it). Each element overrides `click()` to call the inner control's
`click()` (R-06, PLAN-FRESH-1-003).

**Rationale**: measured: the host is never in the tab order and never marked focusable in the AX tree whether or not
`delegatesFocus` is set; `document.activeElement` is the host while the inner control has focus in both cases (normal
shadow DOM retargeting), so a host's `focusout` and `:focus-within` work either way. `delegatesFocus` adds that
`host.focus()` and clicks on the host's padding move focus to the inner control; measured, `host.focus()` focuses the
inner control, `:focus-visible` follows the last interaction mode, and it does nothing when the inner button is
disabled, which is the wanted result (a disabled control takes no focus).

**The host fills, measured (PLAN-FRESH-2-001)**: with an `inline-block` host around a flex `<button>`, a `display:
flex` row beside a 120 px sibling stretches the host to 120 px while the inner button keeps 44 px; a pointer click 5 px
above the host's bottom edge reached a `document` listener with the host as target, so the guard on the inner control
never ran and a disabled button delivered a click. Two `display: block` row hosts in a two-column grid behave the
same way in the block axis (the stretched host's lower area dispatched nothing). With the host a grid container and
the inner control its stretched item, the inner control takes the host's size in both axes, so no point of the host
lies outside the control. A button stretched by a flex row therefore grows to the row's height (its content stays
centred, R-09); a host that does not want that sets `align-self` on the element. The scenarios US1-15, US3-10,
US4-15 and US5-6 (stretched case) click 4 px inside the host's bottom edge, each with a plant restoring
`inline-block` or `block`.

**A restyled host, measured (PLAN-FRESH-3-001 (a))**: `:host { display: ... }` is the lowest-priority rule for the
host's own box; any author rule on the element in the page wins. With `:host { display: inline-grid }`, a disabled
flex inner `<button>` (min 44 px) in a 400 px container and a `document` click listener: no page rule, host and inner
44 × 44, nothing clicked; page rule `display: block`, host 400 × 44, inner 44 × 44 (46 × 44 in the lens's probe), a
click 4 px inside the host's inline-end edge reached `document` with the host as target; `display: flex; width:
100%` the same; `width: 100%` alone, inner 400 × 44 (the grid stretch holds), no click. Adding `inline-size: 100%` to
the inner control fixes `block` and `flex` but not `display: block; height: 90px` (the click at the bottom reached
`document`). Full-width buttons in dialogs and narrow panes are a common page style, so the grid fill alone cannot
carry FR-001 and FR-003.

**Decision, host guard**: `control.ts` registers, in the element's constructor (so at upgrade, before any host
listener added afterwards), a `click` and an `auxclick` listener on the host itself. Each calls `preventDefault()` and
`stopImmediatePropagation()` when the event's `composedPath()` does not contain the inner control (its first entry is
then the host: the click landed on host area outside the inner control), in every state, and when the control is not
available. A click that passed through the inner control in the available state is left alone, so the button's
`click` and the row's activation are unchanged; in the other states the inner guard (R-06) has already stopped it. The
grid fill stays for looks (cards of equal height, a stretched button that is all control). So a click on host area
outside the inner control never activates the element, available or not, and a host may restyle the element's
`display` and size (README). The scenarios US1-17, US3-11, US5-6 (restyled case) and US5-12 click the outside points
of spec § "Restyled host" under `display: block`, `display: flex; width: 100%` and `display: block; height: 90px`, and
the inner control's centre as the positive case; plant: no host listener. Which points lie outside the inner control
is measured for the button (both, under each rule); for the row, whose link-mode `<a>` may fill a block host's width,
the phase's spike lists them by hand per mode and rule, and the scenario asserts the list from the boxes before
clicking.

**Its limits (stated in the README)**: the host listener sees a click at the host in the at-target phase, so it covers
bubble-phase listeners on ancestors and host listeners added after upgrade. Capture-phase listeners on ancestors see
the click first (as with the inner guard, spec "Not activated"), and so do listeners a host attached to the element
before it was upgraded, which run in registration order before the element's own.

**Alternatives**: the button refusing the stretch with `align-self: center` (round 2 option (b), not chosen); CSS
only, with `inline-size: 100%` on the inner control and a README rule that hosts must not set `display` or a block
size on the element (round 3 option (b), not chosen: it leaves the fixed-height case open); documenting that a
`display` override voids FR-001 and FR-003 (round 3 option (c), not chosen); no
`delegatesFocus` (rejected: `host.focus()` would do nothing); a light-DOM inner control (rejected:
the host page's CSS would style it, against constitution II's token-only rule and mission 005's conventions);
`ElementInternals` with `role="button"` on a focusable host (rejected: link mode needs a real `<a>` for modifier
clicks and drag, which a host role cannot give).

## R-02 Link versus button

**Decision**: link mode exactly when `href` is non-empty after trimming, parses with `new URL(href, document.baseURI)`
(inside a `try`; a parse failure is caught and gives button mode, no error, no `href` rendered; PLAN-A11Y-SECURITY-1-008
(a)), and the parsed `protocol` is not `javascript:`; otherwise button mode. The `href` rendered in link mode is the
value as written. `data:` and `vbscript:` URLs are left to the host: they are link mode, Chromium blocks top-level
`data:` navigation and does not run `vbscript:`; the README states it.

How the inner link is rendered per state (PLAN-A11Y-SECURITY-1-005 (a)):

| State | Inner link |
|---|---|
| available (and a busy row, which is available) | `<a href>` with `target`, `rel`, `download` as set (FR-021) |
| disabled (button) | `<a role="link" aria-disabled="true">`, no `href`, no `tabindex`, no `target`/`rel`/`download` |
| unavailable (busy button, unavailable row) | `<a role="link" tabindex="0" aria-disabled="true">`, no `href`, no `target`/`rel`/`download` |

**Rationale**: measured: an `<a>` without `href` is ignored in the AX tree and not focusable (its `tabIndex` property
still reads 0); with `role="link" aria-disabled="true"` it is one node of role `link`, disabled, not focusable by Tab
or `.focus()`; adding `tabindex="0"` makes it focusable (Tab and `.focus()`) and still one node of role `link`,
`aria-disabled`, named from content (lens probe, PLAN-A11Y-SECURITY-1-005). Removing `href` also turns `draggable`
false and removes the context menu's link items and the status-bar URL, so neither a disabled nor an unavailable link
opens anything by any means, the context menu included (spec FR-003). A `javascript:` URL in an `href` is a script
source the strict CSP blocks anyway; not rendering it keeps the built output free of it (spec edge case). Measured
(lens probe): `new URL("http://[", base)` throws; `java\tscript:alert(1)`, `\u0001javascript:alert(1)`,
` javascript:x` and `JAVASCRIPT:x` all parse to protocol `javascript:`, so the check must use the parser, never a
string prefix. `control.test.ts`'s decision table therefore holds the rows: empty, whitespace, relative, `javascript:`,
`JavaScript:`, `JAVASCRIPT:x`, `java\tscript:x`, `\u0001javascript:x`, ` javascript:x` (all button mode except the
relative), `http://[` (button mode, no error), `data:text/html,x` (link mode, `href` as written).

**Alternatives**: an unparseable `href` as link mode with the `href` as written (rejected by the operator, round 1);
treating `data:` and `vbscript:` like `javascript:` (rejected by the operator, round 1); keeping `href` on an
unavailable link (rejected by the operator, round 1: it leaves the context menu, drag and the status-bar URL as routes
to open an item that cannot be opened now).

## R-03 ARIA passthrough by moving host attributes (operator decision)

**Decision**: the attributes FR-009 and FR-030 list are observed: on the button `aria-expanded`, `aria-controls`,
`aria-current`, `aria-haspopup`, `aria-pressed`, `aria-label`, `aria-labelledby`, `aria-describedby`
(`aria-haspopup` and `aria-pressed` added by PLAN-A11Y-SECURITY-1-004 (a), for #12's menu button and toggle buttons)
and `title`; on the row `aria-label`, `aria-labelledby`, `aria-describedby` and `title` (`title` added by
PLAN-FRESH-2-006 (a)). When one is set on the host, the element stores the
value in a private field, removes the attribute from the host, and renders the stored value onto the inner control
(non-reference attributes as attributes; ID references through element reflection, R-04). A value that is empty or
whitespace only clears the stored value (the inner control loses the attribute; for `aria-label` the name falls back to
`label`, then content). Any other value is stored and applied as written, untrimmed. The element's own removal arrives
as `attributeChangedCallback` with `null` and is ignored; since a host's later `removeAttribute` on an attribute
already moved fires nothing (the attribute is absent), **removal is a no-op**. A value present in the markup before
upgrade is moved at `connectedCallback`. `title` is rendered on the inner control as the `title` attribute: the native
tooltip, and per Accessible Name 1.2 the description when nothing else describes the control (the row's slotted
description and tags, or a moved `aria-describedby`, take precedence) or the name when nothing else names it. `aria-pressed` is applied in button mode only (it is not allowed on role
`link`); it stays stored and is applied when the mode becomes button. Any other `aria-*` on the host is not supported:
it stays on the host, and axe flags it (stated in the README; adding one to the list is a MINOR change a consumer
asks for).

This rule is 012's own (PLAN-CORRECTNESS-1-008). Mission 005's host `aria-label` rule for `ocelle-icon` and
`ocelle-brand-mark` (a blank host `aria-label` leaves the element unlabelled; removal falls back to `label`) is
unchanged; the README says the two families differ.

**Rationale**, measured (operator question at planning, answer "Move to inner control", recorded in the spec header):

- a host that keeps `aria-label` or `aria-labelledby` and has no role is a `generic` node named by it, beside the
  inner button with the same name: two named nodes for one control;
- axe-core gives no violation but two "needs review" (incomplete) results on such a host: `aria-allowed-attr`
  (critical, for `aria-expanded`) and `aria-prohibited-attr` (serious, for `aria-label`/`aria-labelledby`); #10's axe
  gate counts incomplete serious and critical results as failures (006 contracts/gates.md);
- an `ElementInternals` role of `none` or `presentation` does not remove the host from the tree (still `generic`,
  named) and does not clear either axe result; `ariaHidden` on the internals hides the inner control too.

**The cost, corrected (PLAN-CORRECTNESS-1-001 (a))**: `getAttribute` on the host returns `null` after the move, and
`removeAttribute` cannot clear a moved state. Measured (lens probe): set, then `removeAttribute`, then
`host.ariaCurrent = null` gives `attributeChangedCallback` only for the set and the element's own removal; the inner
control keeps the value. So declarative frameworks stay in step for **value changes only**: when a binding becomes
`undefined`, `null` or `nothing`, React, Lit, Svelte and Vue call `removeAttribute`, which changes nothing. Hosts must
bind the off value instead. The README gives one recipe per stack:

| Stack | Bind | Never |
|---|---|---|
| React | `aria-current={active ? "page" : "false"}`, `aria-expanded={open ? "true" : "false"}`, `aria-controls={open ? "panel" : ""}` | `undefined` or `null` |
| Lit | `aria-current=${active ? "page" : "false"}` (an attribute binding with a string) | `nothing`, `ifDefined(undefined)` |
| Svelte | `aria-current={active ? "page" : "false"}` | `undefined`, `null` |
| htmx, Thymeleaf | render the attribute with the off value (`th:attr="aria-current=${active} ? 'page' : 'false'"`); a swap that replaces the element moves the new element's attributes at upgrade; a morphing swap (idiomorph's `morph`) sets the changed attributes on the live element, which moves them, and the element restores the mirrors the morph removes; htmx's history restore keeps the moved values through the mirrors (below) | omitting the attribute on an element that is updated in place; writing a `data-ocelle-moved-*` attribute |

ARIA reflection properties on the host (`host.ariaExpanded = "true"`) set the attribute and are moved the same way;
setting one to `null` removes the (absent) attribute and changes nothing, as `removeAttribute` does.

**Mirrors for copies of the live DOM (PLAN-FRESH-2-002 (a))**: a private field does not survive serialisation.
Measured by the lens: an element that stores a host `aria-label` privately and removes the attribute serialises as
`<x-c></x-c>` through its parent's `innerHTML` and through `cloneNode(true).outerHTML`. htmx's history support (on by
default) snapshots the live `innerHTML` before a boosted navigation and swaps it back on Back, and list templating by
cloning, drag previews and print copies copy the live DOM the same way; each copy would upgrade unnamed and without
its states. So whenever the element stores a moved value it also writes it, as written, to a host attribute it owns:
`data-ocelle-moved-<attribute>` (`data-ocelle-moved-aria-label`, `data-ocelle-moved-aria-current`,
`data-ocelle-moved-title`, and so on, one per moved attribute). Clearing a value (empty or whitespace only) removes
its mirror. At `connectedCallback`, for each listed attribute the host does not set, a mirror present on the host is
read back as the stored value (and applied, and its custom state set); a host attribute present at upgrade wins and
rewrites the mirror. One attribute per moved name was chosen over one attribute holding all pairs: no encoding to
parse, each value readable in the DOM inspector, and the prefix gate's `ocelle` names hold. The mirrors are not ARIA,
so the accessibility tree and axe ignore them; `getAttribute("aria-label")` on the host still returns `null`. Hosts do
not write or remove mirrors (README). The mirrors are
public attributes of the element and are declared in the manifest (R-15; a MINOR addition). US2-13 re-creates a
button from `outerHTML` and from `cloneNode(true)` after moving `aria-label` and `aria-current` (plant: no mirror);
a row case does the same for `aria-label` (phase 5).

**Mirrors restored (PLAN-FRESH-3-002 (a))**: a morphing swap treats the server markup as the whole truth for
attributes, so it removes the mirrors, which the server never renders, on every morph of the element, with no act by
the host. Measured by the refuter on a minimal element built as above: live `<x-m data-ocelle-moved-aria-label="Close">`,
then idiomorph's attribute sync with the same server markup `<x-m aria-label="Close">` (set every differing attribute,
then remove, in reverse order, every live attribute the new node lacks) gives `<x-m></x-m>` with the inner label still
"Close", so the next `innerHTML` copy (htmx's history snapshot) upgrades unnamed. That idiomorph's `syncNodeFrom`
works in this order is its published behaviour and was not checked offline (no idiomorph source in the container);
any morph that removes attributes the server never renders does the same whatever the order. Turbo 8's page-refresh
morph is the same kind of swap. Decision: the mirror names join the element's `observedAttributes`; when a mirror
is removed or set to a value other than the stored one while the element holds a value for that attribute, the
element writes the stored value back (its own writes, which equal the stored value, are ignored, so there is no
loop). In the sync above the set pass re-moves `aria-label` and the removal pass deletes the mirror, which the element
rewrites at once; the removal loop counts down over the live attributes and does not revisit the rewritten one (it
is appended), so one morph leaves the mirror in place. A mirror written while no value is held is not read until the
next upgrade (unsupported, README). US2-13 gains the morph case on the button: the scenario applies the attribute
sync itself (no idiomorph dependency) with the unchanged server markup, asserts the mirrors and the inner control,
then copies through `innerHTML`, and also removes and overwrites a mirror directly (plant: mirror not restored); the
row's mirror case (phase 5) adds the same morph step for `aria-label`.

**Styling hooks (PLAN-FRESH-1-009 (a))**: since a host selector `ocelle-button[aria-expanded="true"]` no longer
matches, the button exposes the moved states as custom states through `ElementInternals.states`: `expanded` while the
moved `aria-expanded` is `"true"`, `pressed` while the moved `aria-pressed` is `"true"`, and `current` while the moved
`aria-current` is set to any value other than `"false"`. A host writes `ocelle-button:state(expanded) ocelle-icon`.
The row keeps its reflected `current` attribute as its hook (it needs no custom state). `:state()` needs Chromium 125
and WebKit 17.4 (MDN browser-compat-data 8.1.9), which raises the README's WebKit floor (R-04).

**Alternatives**: keep on host with recorded axe exceptions (rejected by the operator at planning and again in round 1,
option (d)); element properties instead of host ARIA (rejected by the operator: rewrites #501's ask); clearable
reflected properties beside the moved ARIA, or overriding the ARIAMixin accessors (round 1 options (b) and (c),
not chosen); documenting that live-DOM copies lose moved ARIA and steering hosts to `label` and off the htmx history
cache (round 2 option (b), not chosen); keeping mirrors unobserved and giving morphing hosts a recipe that skips them
(idiomorph `callbacks.beforeAttributeUpdated`, round 3 option (b), not chosen); declaring a host `title` unsupported (round 2 PLAN-FRESH-2-006 option (b), not
chosen: measured, a host `title` names the role-less host, `generic "Close dialog"` beside `button "Save"`, the
second named node the move removes, and axe raises nothing).

## R-04 ID references by element reflection; engine floor

**Decision**: `aria-controls`, `aria-labelledby` and `aria-describedby` values are split on whitespace, each id is
looked up with `this.getRootNode().getElementById(id)` (the document or the shadow root the host is in), found
elements are assigned in order to the inner control's `ariaControlsElements`, `ariaLabelledByElements` and
`ariaDescribedByElements`, and ids not found are skipped. Lookup runs when the attribute is set and on
`connectedCallback`. The row's own description (FR-034) is built the same way: the inner control's
`ariaDescribedByElements` is set to the elements assigned to the `description` slot followed by those of the `tags`
slot that have non-whitespace text (`null` when none has), unless a host `aria-describedby` was moved, which then
wins.

**Empty slotted elements (PLAN-FRESH-3-004)**: measured by the refuter (CDP full AX tree) on an inner `<button
title="Open the mission">` named by its `[part=title]` wrapper: with `ariaDescribedByElements` set to `[]` or `null`
the description is "Open the mission"; with an empty `<span slot="description"></span>` referenced it is undefined
(the `title` fallback is lost); with "Due Friday" slotted it is "Due Friday". Server templates emit such empty spans
(`th:text` of a null value). So a `description` or `tags` slot is *empty* when none of its assigned elements (flattened)
has non-whitespace text (`textContent.trim() !== ""`), and only elements with text are referenced. The emptiness is
recomputed on `slotchange` and, since writing text into a slotted element fires no `slotchange`, on a
`MutationObserver` on the host with `childList`, `characterData` and `subtree` (light children only; no I/O). The
same emptiness drives the slot wrappers' `hidden` (so an empty slot takes no space and adds no gap, FR-031, R-10).
US4-16 adds an empty-span case (the description stays the title; plant: the raw assigned elements referenced) and
US4-6 an empty-span gap case (plant: wrappers hidden from the raw assigned elements), each also writing text into
the span and removing it again (plant: no `MutationObserver`).

**Engine floor** (PLAN-FRESH-1-008 (a)): the README's floor rises to **Chromium 135** (element reflection) and
**WebKit 17.4** (custom states, R-03). MDN browser-compat-data 8.1.9 gives `ariaControlsElements`,
`ariaLabelledByElements` and `ariaDescribedByElements` as Chrome 135, Safari 16.4 (iOS 16.4) and Firefox 136, all
three in the same releases; `ElementInternals.states` and `:state()` as Chrome 125 (the dashed-ident form from 90 is
not used) and Safari 17.4. The engines section lists each feature with its figures. No fallback: below the floor the
references would be dropped silently, which is why the floor, not a fallback, carries it (round 1 option (a)). The
phase 3 spike reads the Chromium 135 release notes and records the release that has all three properties.

**Rationale**, measured: the three properties exist; set on an inner button to light-DOM elements (a
shadow-including ancestor tree) the AX tree shows the controls relation, the name from the labelledby element and the
description from the describedby element; elements in a sibling shadow root are dropped (the getter returns `[]`);
plain id attributes copied into the shadow root do not resolve. Slotted elements are in the host's light tree, so
the row's description and tags elements resolve as light-DOM targets. Elements in the inner control's own shadow root
resolve too (lens probe, PLAN-FRESH-1-001), which R-05 uses for the row's name. `ariaOwnsElements` does not exist and
is not used.

**Alternatives**: copying ids into the shadow root (does not resolve, constitution III forbids); a light-DOM proxy
element carrying `aria-labelledby` (rejected: adds nodes to the host's tree); feature detection with a text fallback,
or leaving the WebKit figure unknown (round 1 options (b) and (c), not chosen).

## R-05 Name precedence

**Decision**: the inner control's name sources are set so Chromium's own name computation gives FR-006's order:

1. a moved `aria-labelledby` (with at least one element found) becomes `ariaLabelledByElements`;
2. else a moved `aria-label` (not blank, R-03) becomes the inner control's `aria-label` and `ariaLabelledByElements`
   is cleared;
3. else a trimmed non-empty `label` becomes the inner control's `aria-label` and `ariaLabelledByElements` is cleared;
4. else content. For the button, content is the inner control's content (the default slot; slotted icons are
   decorative and contribute nothing, mission 005). For the row, whose inner control also holds the description, tags
   and trailing slots, name from content would read all of them (lens probes: "Mission 42 Due Friday Blocked";
   `aria-hidden` on the description wrapper does not remove slotted text from the name), so the row sets the inner
   control's `ariaLabelledByElements` to its own shadow `[part=title]` wrapper (same shadow root), which holds only the
   default slot (measured: name "Mission 42", description "Due Friday Blocked") (PLAN-CORRECTNESS-1-002).

The internal reference is replaced or cleared whenever a higher source is present, so FR-006's order holds. Measured:
with both `ariaLabelledByElements` and `aria-label` on the inner button, labelledby wins (Accessible Name 1.2).
Mission 005's `naming.ts` (`expose`) is image-specific and is not reused; a new internal module `control.ts` holds the
shared control logic (R-12). The control conventions state the general rule: a control whose inner control holds
content that is not its name names itself from its name part.

**Label in name (PLAN-A11Y-SECURITY-1-011)**: a `label` or host `aria-label` wins over visible content. 006's axe rule
set does not run experimental rules, so `label-content-name-mismatch` never checks WCAG 2.5.3 (Level A). The control
conventions (FR-008) and the README therefore state that when content is visible, `label` and a host `aria-label`
contain the visible text, ideally at its start; every story that sets a name on a control with visible text follows
it (as US4-4's "Open mission 42" on "Mission 42").

## R-06 Stopping activation ("not activated")

**Decision**: one capture-free guard on the inner control, in the shadow root: a `click` listener and an `auxclick`
listener that, while the control is in any state that is not available (disabled, busy button, unavailable row;
disabled links included, PLAN-TESTABILITY-1-002), call `preventDefault()` and `stopImmediatePropagation()`. Disabled
button mode also has the native `disabled` attribute; disabled and unavailable link mode also have no `href` (R-02).
A second listener pair on the host itself (R-01, PLAN-FRESH-3-001 (a)) stops a click that did not pass through the
inner control, so host area that a page rule leaves outside the inner control is no bypass.
The row's own activation listener runs after the guard and only when the control is available; in link mode it
ignores clicks with `ctrlKey`, `metaKey`, `shiftKey` or `altKey` and dispatches nothing for `auxclick` (SPEC-1-09;
Alt is treated as a modifier, closing check-3 note SPEC-3-02: Chromium may download on Alt-click, which is the
browser's default the operator chose to leave alone).

**`host.click()`** (PLAN-FRESH-1-003): `HTMLElement.prototype.click()` on the host dispatches a synthetic click at the
host that never passes through the inner control, so neither the native `disabled` check nor the guard would see it,
and a row would neither dispatch its event nor navigate. Both elements override `click()` to call the inner control's
`click()`: a disabled inner button ignores it (measured), the guard stops it while unavailable or on a disabled link,
an available button's click reaches the host's listeners with the host as target, and an available row dispatches its
event (and, in link mode, the inner `<a>`'s `click()` navigates). A synthetic `dispatchEvent(new MouseEvent("click"))`
on the host is outside the guarantee (README).

**Rationale**, measured: `preventDefault()` in a `click` listener stops navigation for plain, Ctrl, Meta, Shift and Alt
clicks and for Enter and Ctrl+Enter on a focused link; a middle click fires no `click`, only `auxclick`, and opens a
new tab unless `auxclick` is prevented; Enter and Space on a focused button fire a `click` the same listener stops;
`stopImmediatePropagation()` on the inner element keeps the composed click from reaching bubble-phase listeners on
the host and the document, while a capture-phase listener on the document still sees it (the spec's stated limit).
A disabled native `<button>` delivers only `pointerdown` to ancestors, no `mousedown`, `mouseup` or `click`, and
`.click()` does nothing. An `<a>` without `href` still receives a forced click, which is composed and reaches host and
document listeners unless the guard stops it (PLAN-TESTABILITY-1-002), so the guard runs on disabled links too.
Playwright refuses to click an `aria-disabled` element without `force: true`, so the tests click with `force: true`
(otherwise the "not activated" tests would pass vacuously, with no click sent at all).

**Context menu**: with no `href` on a disabled or unavailable link (R-02), the context menu has no link items, drag
does nothing and no URL shows; the former README exception ("the browser's context menu is outside it") is dropped
(PLAN-A11Y-SECURITY-1-005 (a)).

## R-07 Busy spinner and reduced motion

**Decision**: the spinner is an inline SVG in the shadow root (one circle arc, `stroke="currentColor"`, no fill), in
a wrapper `span.icon-slot` placed where the `icon` slot wrapper is; while busy the `icon` slot's wrapper gets the
`hidden` attribute and the spinner wrapper loses it. Because the slot convention's `.icon-slot { display: inline-flex }`
is an author rule that beats the user-agent `[hidden] { display: none }`, `controlStyles` adds
`.icon-slot[hidden] { display: none; }` (PLAN-CORRECTNESS-1-013); US3-4's box assertion keeps a plant without it. With
an icon the box keeps its size; without one the spinner takes the icon position with the slot convention's gap
(`--ocelle-space-2` as `margin-inline-end`). The arc is a partial circle drawn by `stroke-dasharray` in the SVG's own
units (presentation attributes, not a `style` attribute), so it is still visibly a busy mark when still. The spinner
SVG has `aria-hidden="true"`.

**Rotation, token-only (PLAN-CORRECTNESS-1-004 (a))**: the style-lint gate rejects any unit other than `%`/`fr`
(`gates/stylelint/token-only.ts:63`), so `1turn` and `360deg` are raw, and any function but `var()`/`calc()` (so
`rotate()` in `transform`). A new public angle token `--ocelle-motion-turn` (`1turn`, group motion,
theme-independent, not changed under reduced motion) carries the angle, and the `rotate` property (not `transform`)
takes it: `@keyframes ocelle-spin { to { rotate: calc(var(--ocelle-motion-turn) * 6); } }`. A bare number inside
`calc()` beside a token passes the gate (`token-only.ts:64`; `icon-slot.ts:25` already ships `/ 2`).

**Limited to under 5 s (PLAN-A11Y-SECURITY-1-009 (a), WCAG 2.2.2)**: the animation runs once:
`animation-duration: calc(var(--ocelle-motion-spin) * 6)` (4.8 s), `animation-timing-function: linear`,
`animation-iteration-count` left at its initial value 1, no `animation-fill-mode`. It turns six times and ends on the
start pose, the same still arc the reduced-motion state shows; a busy state that lasts longer shows the still arc.
No count literal is needed. The README says so, and a host with long-running work that wants continuous motion uses
its own pausable indicator. Since the duration is six times a token a host may override, the limit holds for the
default value only: the README states that an override of `--ocelle-motion-spin` keeps one turn at or below 833 ms
(six turns within 5 s), and `readme.test.ts` asserts the sentence (PLAN-FRESH-2-008).

**Reduced motion**: under `prefers-reduced-motion: reduce` the element sets `animation: none` (measured:
`animation-name` computes `none`), and `--ocelle-motion-spin` is `0ms` there (two independent mechanisms, each tested:
the token's value in the tokens tests, the element's rule in the element tests).

**`--ocelle-motion-spin` on its merits**: R-07's earlier reason (that the lint forbids `calc(var(--ocelle-motion-base)
* 4)`) was false. The token is kept because one turn's duration is a design value a host may tune for every spinner
of the library, and because it is a duration that drops to `0ms` under reduced motion like the other motion
durations. 800 ms, `0ms` under reduced motion. The generator's reduced-motion block is hard-coded to `motion-fast`
and `motion-base` (`packages/tokens/src/generate.ts:281`, asserted "exactly" by `test/generate.test.ts:107`); it is
changed to emit `0ms` for every record of group `motion` whose value is a duration (`ms`), so `motion-spin` gets it
and `motion-turn` and `easing-standard` do not (PLAN-CORRECTNESS-1-007). The `generate.test.ts` assertion becomes
"exactly the motion durations: `motion-fast`, `motion-base`, `motion-spin`", recorded as a stricter replacement
(constitution VIII); `generate.ts` is mutated under the default configuration.

**Rationale**: measured, a border-based spinner (transparent border segment) computes every segment to the system
colour in forced colours, a full ring with no gap; an SVG stroke in `currentColor` keeps its gap and takes the system
colour.

**Alternatives**: a CSS border spinner (fails forced colours, above); `animation-play-state: paused` under reduced
motion (rejected: leaves a moving element if the query flips mid-animation in some engines; `none` is plain); a
style-lint allowance for `1turn`, or a dash-offset animation without rotation (round 1 options (b) and (c), not
chosen); arguing the spinner essential under Understanding 2.2.2 (round 1 option (b), not chosen).

## R-08 Tokens, grounds and contrast

**Decisions**:

1. **`color-ink` on the state grounds and the active surface** (spec FR-018, US1-4, US1-13; check-2 note SPEC-2-05):
   add the five state grounds and `color-active-bg` to `color-ink`'s `contrast.grounds`.
2. **Description ink** (FR-042, PLAN-A11Y-SECURITY-1-010): the row's description and tags wrappers use
   `--ocelle-color-ink-soft` (slotted text inherits it unless the host styles the tag); `color-ink-soft`'s grounds gain
   the five state grounds (its `main` grounds already cover `sheet`, `accent-low` and `hover-bg`). Computed from the
   token values: 8.65 to 9.53:1 light, 9.14 to 10.26:1 dark on the state grounds. The title uses `--ocelle-color-ink`;
   unavailable uses `--ocelle-color-disabled-ink` (exempt).
3. **Hover and active, designed (PLAN-FRESH-1-007 (a))**. The earlier design made the hover border an alias of
   `accent-strong`, which is already the primary's border and every border on `accent-low`, `inset`, `hover-bg` and the
   state grounds, so hover changed nothing there; light `color-inset` and `color-hover-bg` are the same value
   (#E2DDD3), so a hover fill is invisible on those two grounds; and no active state existed. Now:
   - `--ocelle-color-hover-border` (new) is `var(--ocelle-color-ink)` (`ref: ["color-ink"]`), non-text, grounds
     `main`, the state grounds and `color-active-bg`. A hovered bordered control's border therefore changes on every
     ground, whatever its idle border (`control-border` or `accent-strong`). A host overrides it on an ancestor (#525).
   - `--ocelle-color-accent-hover` (new, proposed `#D9A23F` in both themes) is the primary's hover fill;
     `color-on-accent`'s grounds gain it (computed 8.12:1; 6.23:1 on `color-accent`).
   - `--ocelle-color-active-bg` (new, proposed light `#D3CCBF`, dark `#3A342B`) is the pressed surface of `secondary`,
     `quiet` and `flush`; it differs from every main ground (computed 1.14 to 1.6:1 against them, distinct from
     `hover-bg`) and `color-ink` on it is 11.63:1 light, 10.17:1 dark.

   The state table (both themes; colours outside forced colours):

   | Variant | Idle | Hover | Active (pointer down) |
   |---|---|---|---|
   | `primary` | fill `accent`, border `accent-strong`, text `on-accent` | fill `accent-hover`, border `hover-border` | fill `accent`, border `hover-border` |
   | `secondary` | fill `sheet`, border by ground (below), text `ink` | fill `hover-bg`, border `hover-border` | fill `active-bg`, border `hover-border` |
   | `quiet` | no fill, border by ground, text `ink` | fill `hover-bg`, border `hover-border` | fill `active-bg`, border `hover-border` |
   | `flush` (any variant) | no fill, no border, text `ink` | fill `hover-bg` | fill `active-bg` |
   | row `default` | fill `sheet`, border by ground | fill `hover-bg`, border `hover-border` | as hover |
   | row `flush` | no fill, no border | fill `hover-bg` | as hover |

   Each state differs from idle and from the other on every ground, except that a `flush` control's hover fill
   (`hover-bg`) equals the ground on the `hover-bg` ground in both themes (the same token) and on the `inset` ground in
   light (light `inset` and `hover-bg` are both #E2DDD3; dark `inset` #302B23 differs) (PLAN-FRESH-2-004), and, with
   `ground="chrome"`, its fill `chrome-hover` equals the `chrome-hover` ground in both themes; there, hover carries no
   information (FR-019: no hover-only information), the focus ring and the active fill still show, and the README says
   so. US1-14 and US4-8 write this exception list by hand per theme. A current row keeps
   its `accent-low` surface on hover (FR-036). The proposed values are confirmed by `gate:contrast --print` in phase
   2; if any required pair is below threshold the phase stops and asks the operator.
4. **Border by ground (PLAN-TESTABILITY-1-003 (a))**: an element cannot see its ancestor's colour, so both elements
   get a reflected `ground` attribute, as `ocelle-brand-mark` does (`ocelle-brand-mark.ts:22`): absent (or an unknown
   value) means the main grounds `canvas`, `sheet`, `pane`, `panel`, `inspector`, `rail`, and the bordered variants and
   the default row use `--ocelle-color-control-border`; `ground="accent-low"`, `"inset"`, `"hover-bg"` or `"state"`
   selects `--ocelle-color-accent-strong` (#5 rule 1). Tests set the attribute per ground and read the hand-written
   expected token; a plant that ignores the attribute fails them.

   **Changing surfaces (PLAN-FRESH-2-007)**: `ground` is static, but `hover-bg` and `accent-low` are surfaces a host's
   row takes on hover or selection. Computed: `control-border` light #8A8276 on light `hover-bg` is 2.80:1 and on light
   `accent-low` 2.94:1, dark #7A7264 on dark `accent-low` 2.88:1, all below 3:1. The rule (FR-018, README): on a
   container whose surface changes, the host sets `ground` for the changed surface statically (`hover-bg` or
   `accent-low`). It is safe because item 5 declares `accent-strong` on every main ground (computed 4.80:1 on light
   canvas, 8.30:1 on dark canvas), so the border meets 3:1 before and during the change. US1-16 and a story render a
   quiet button with `ground="hover-bg"` on canvas and on `hover-bg`; both pairs are already required rows (item 5 and
   `accent-strong`'s declared grounds), so no new row is added.
4a. **Chrome (PLAN-FRESH-2-003 (a))**: `ground="chrome"` on both elements, for #12's top-bar menu button and any control
   on the chrome grounds (`color-chrome`, `color-chrome-hover`; constitution II puts the top bar, icon rail and personal
   rail on them in both themes). Light `color-ink` on light `color-chrome` is 1.00:1 (both #15130F), so the main look
   cannot be reused. With `ground="chrome"`:

   | Variant | Idle | Hover | Active (pointer down) |
   |---|---|---|---|
   | `primary` | fill `accent`, border `accent-strong`, text `on-accent` | fill `accent-hover`, border `chrome-ink` | fill `accent`, border `chrome-ink` |
   | `secondary`, `quiet` | no fill, border `chrome-muted`, text `chrome-ink` | fill `chrome-hover`, border `chrome-ink` | fill `chrome-active`, border `chrome-ink` |
   | `flush` (any variant) | no fill, no border, text `chrome-ink` | fill `chrome-hover` | fill `chrome-active` |
   | disabled | as on the main grounds for `primary`; otherwise no fill, text and border `disabled-ink` | — | — |
   | row `default` | no fill, border `chrome-muted`, title `chrome-ink`, description and tags `chrome-muted` | fill `chrome-hover`, border `chrome-ink` | as hover |
   | row `flush` | no fill, no border, as above | fill `chrome-hover` | as hover |
   | row `current` | surface `chrome-hover`, bar `current` | unchanged (border `chrome-ink` on a default row) | — |

   `secondary` has no fill on chrome (a `sheet` fill would carry `ink` text, 1.00:1 territory on light chrome), so it
   looks like `quiet` there; the README says so. `color-hover-border` (an alias of `ink`) cannot serve on chrome (light
   1.00:1), and `color-chrome-ink` fits as the hover border (no new hover-border token). The active surface needs a
   new token, `--ocelle-color-chrome-active` (proposed `#3A342B` in both themes, group colour, a ground): computed 1.51
   (light) and 1.59 (dark) against `chrome` and 1.36 and 1.30 against `chrome-hover`, so it differs from both, and
   `chrome-ink` on it is 10.17:1. The current row's surface on chrome is `chrome-hover`, not `accent-low` (a light
   surface in light) or `chrome-active` (the bar, `accent-strong`, falls below 3:1 on it in light); `color-current`
   and `color-focus` are already declared on the chrome grounds. Computed figures: `chrome-ink` 15.32 and 13.84:1 light,
   16.15 and 13.26:1 dark on `chrome` and `chrome-hover`; `chrome-muted` 6.89 and 6.22:1 light, 7.26 and 5.96:1 dark;
   `accent-strong` 3.34 and 3.01:1 light, 8.75 and 7.18:1 dark (the same pairs as the focus ring's, already passing);
   `disabled-ink` 3.37 and 3.04:1 light, 5.35 and 4.39:1 dark (exempt). Declared grounds added: `color-chrome-ink`
   += `color-chrome-active`; `color-accent-strong` += `color-chrome`, `color-chrome-hover`; `color-disabled-ink` +=
   `color-chrome`, `color-chrome-hover` (exempt rows). Focus ring and forced colours are unchanged. US1-4, US1-5,
   US1-13, US1-14, US4-17 and US5-11 cover chrome; the `chrome-active` value is confirmed by `gate:contrast --print`
   in phase 2 under the same stop-and-ask rule as the other proposed values.
5. **Primary border** (check-2 note SPEC-2-06): `primary` fills with `--ocelle-color-accent` and `on-accent` text,
   with an `--ocelle-color-accent-strong` border on every ground. Measured from the token values: the ochre fill
   against the light main grounds is 2.37 (rail) to 2.98 (pane), below 3:1, so in light mode the fill cannot be the
   boundary (and constitution II forbids it as the only mark); `color-accent-strong` measures 4.43 to 5.56 light and
   7.44 to 8.30 dark against canvas, sheet, pane and rail. `color-accent-strong`'s `contrast.grounds` gain
   `color-canvas`, `color-sheet`, `color-pane`, `color-panel`, `color-inspector` and `color-rail`.
6. **Current bar and focus ring**: the bar sits on the row's `accent-low` surface (FR-037), already a declared ground
   of `color-current`. The row's focus ring is drawn inside the row (R-12), on the row's own surface: `sheet`, the
   ground (flush), `accent-low`, `hover-bg`; `color-focus` is declared on main, chrome and state grounds, which cover
   all of them; no new pair.
7. **Row fill**: `default` row surface `--ocelle-color-sheet` (cards and facts, as the token's comment says).
8. **Disabled**: `--ocelle-color-disabled-bg` fill (filled variants) and `--ocelle-color-disabled-ink` text and border,
   exempt.
9. **Title gap** (FR-038): `--ocelle-space-1`, exposed through the part `title`; no new token.
10. **Non-colour tokens**: `--ocelle-motion-spin` (800 ms) and `--ocelle-motion-turn` (`1turn`) (R-07);
    `--ocelle-focus-offset-inset` (R-12).

New required contrast rows, per theme (figures from `gate:contrast --print`): `color-ink` +6, `color-ink-soft` +5,
`color-accent-strong` +8 (six main grounds, two chrome grounds), `color-on-accent` +1, `color-hover-border` +15,
`color-chrome-ink` +1, `color-disabled-ink` +2 (exempt): 38 per theme, 76 in all. The pinned counts change first
(the chrome rows in phase 2, with the button's chrome look).

Every new or changed token goes through `source.ts`, `test/expected.ts` (hand-written), the tokens browser values
test, `pairs.json`, the tokens README and CHANGELOG, as mission 003 did; `motion-spin` also through `generate.ts`
(R-07).

## R-09 Sizes and the minimum target

**Decision**: `size="default"`: `min-block-size` and `min-inline-size` `var(--ocelle-target-min)`, font
`--ocelle-font-size-md`, `padding-inline: var(--ocelle-space-4)`; the inner control is a flex box that centres the
slot convention's `icon-row` (which carries no block padding of its own beyond the convention's), and it fills the
host (R-01), so in a stretched host its content stays centred in the block axis. `size="compact"`:
font `--ocelle-font-size-sm`, line height `--ocelle-line-height-compact`, `padding-inline: var(--ocelle-space-2)`,
`min-block-size` and `min-inline-size` `var(--ocelle-space-6)` (1.5 rem, 24 px). `flush`: `padding-inline: 0`, no
border, transparent background, minimum sizes of its `size` unchanged, and the inner control uses
`justify-content: flex-start` (a logical value, so it mirrors under `dir="rtl"`): content narrower than the minimum
starts at the inline start and the slack falls at the inline end (PLAN-CORRECTNESS-1-003), so FR-012's 0.5 px
alignment holds for an icon-only or one-character flush button too. A row: `min-block-size:
var(--ocelle-target-min)` in every presentation and layout (SPEC-1-08).

**Rationale**: tokens only; 24 px from an existing space token. Centring under `flush` would push a 20 px icon in a
44 px minimum box 12 px inwards.

## R-10 Row layout and width

**Decision**: the row's inner control is a flex container (`row` layout: `flex-wrap: wrap`, the icon/title/description
group `flex: 1 1 auto` with `min-inline-size: min-content`, the tags-and-trailing group `flex: 0 0 auto` wrapping as a
whole, FR-032; `card` layout: a two-row grid, title line with trailing at its end, then description, then tags). Its
inline padding is `--ocelle-space-3` in both presentations and every state (the `flush` row's was `--ocelle-space-2`
before PLAN-FRESH-2-005 (b)): the focus ring's band (2 to 5 px inside the border edge), the gap and the current bar
(7 to 10 px inside the border edge, R-12) all lie in it, so the bar is never behind text and toggling `current`
moves no content box. The flush row's compact density is its block padding (`--ocelle-space-1`) and text scale
(FR-031), which stay. The title wrapper (part `title`) and the description wrapper set `overflow-wrap: anywhere` in both
layouts (PLAN-CORRECTNESS-1-011): a long unbreakable identifier wraps inside the row, and the min-content width stays
at least one character, so FR-040 still holds. The tags slot's container is `display: flex; flex-wrap: wrap; gap:
var(--ocelle-space-1)` and each slotted tag gets `::slotted(*) { overflow-wrap: normal; word-break: normal; }` so a
tag never breaks inside a word, except a tag wider than the card, which gets `max-inline-size: 100%` and
`overflow-wrap: anywhere` (US5-8). The host is `display: grid; min-inline-size: min-content` with the inner control as
its single stretched item (R-01; FR-040): a grid container is block-level, so it stretches inline in a block parent
as `display: block` did, and the inner control follows the host's block size in a grid of cards (US4-15). Each
slot's wrapper (icon, description, tags, trailing) gets the `hidden` attribute while its slot is empty, by FR-031's
definition (for `description` and `tags`: no assigned element with non-whitespace text, R-04), so an empty slot takes
no space and adds no gap.

The slot convention's size rules are scoped to the icon slots (PLAN-A11Y-SECURITY-1-002): `src/icon-slot.ts` has an
unscoped `::slotted(*)` that sets inline and block size to the icon size, `max-inline-size: none` and `flex: none`, all
`!important`, which would make slotted description and tag elements (and a button label given as an element) 20 px
squares. It becomes `slot[name="icon"]::slotted(*), slot[name="trailing"]::slotted(*)`, test-first in phase 2:
`slot.test.ts` gains a case that a non-icon element in the default slot keeps its own box, and US4 a scenario that a
slotted tag's box fits its text. 005's elements slot icons only in those two slots, so their output is unchanged.

**Rationale**, measured: inside a shrink-to-fit parent every display value gives the content width; a block or flex
host collapses to 0 only when its parent is forced narrower than its content, and `min-inline-size: min-content`
prevents that while still stretching in a block parent; `inline-flex` never collapses but does not stretch, which a
list row must. Only `overflow-wrap: anywhere`, not `break-word`, lowers the min-content width (lens measurement,
PLAN-FRESH-1-005). `base.css`'s identifier wrapping (`[data-ocelle-wrap="anywhere"]`, `base.css:230`) does not reach
a shadow wrapper, so the row cannot rely on it.

## R-11 Test harness extensions

**Decision**: extend mission 005's driver (`packages/elements/test/scenarios/driver.ts`), both drivers (in-process
and fixture), and the browser commands, red first in phase 1:

- `focus(id)`, `press(key, modifiers?)` (keyboard through the browser, so Enter and Space reach the native control),
  `click(id, { inner?, modifiers?, button? })` with `force: true` (R-06), `tabOrder({ reverse? })` (Tab, or Shift+Tab
  with `reverse: true`, from the start or the end of the page, collecting `activeElement` paths including the
  shadow-retargeted inner control; FR-052's Shift+Tab), `activeInner(id)`;
- `hover(id, { inner? })`, `pointerDown(id, { inner? })` and `pointerUp(id)` (PLAN-TESTABILITY-1-005) for the hover
  and active states, and `computed(id, property, inner?)`, where `inner` is a selector in the element's shadow root
  (the existing `computed` reads the host only);
- `events(id, types)` and `takeEvents()`: a recorder that adds bubble-phase listeners on the element, its ancestors,
  `document` and `window`; each record carries `type`, `at` (where the listener is), `target` (as seen at that
  listener), `isTrusted`, `bubbles`, `composed`, `cancelable`, `defaultPrevented`, `detail` and a per-dispatch
  `serial` (one number per event object), so "exactly one" is one serial and "target is the host" holds at every
  listener (PLAN-TESTABILITY-1-006); `preventNext(type)` makes a listener call `preventDefault()`;
- **navigation sink, in-process** (PLAN-TESTABILITY-1-001): the in-process driver installs, after all other
  listeners, a last bubble-phase listener on `window` for `click` and `auxclick` that records `defaultPrevented`,
  `button`, the modifier flags and the target link's `href`, then calls `preventDefault()`, so the runner page never
  navigates; `navigations()` returns these records in-process. The link scenarios (US2-1, US2-3, US3-8, US5-1, US5-2,
  US5-6 and decision 13's Alt-click) are written as two bodies each, with no conditional expect (test-lint): an
  in-process body asserting the sink's record (prevented or not, which button, which modifiers, which `href`), which
  is what the mutated `elements` project runs, and a fixture body asserting real navigation (a page with a target
  route recording visits and `context.on("page")` for new tabs). In-process, these bodies cover the modifier test,
  the `auxclick` guard and the cancel path (`preventDefault()` on the activate event → `preventDefault()` on the
  click), so their mutants are not NoCoverage (`gates/lib/mutation/report.ts:71`);
- AX states and relations: `ax(id)` returns `{ role, name, description, disabled, expanded, pressed, hasPopup, busy,
  focusable, controls: [ids] }`; measured, CDP never reports `aria-current`, so `current(id)` reads the inner
  control's `ariaCurrent` reflection plus the attribute (documented as a DOM assertion, not an AX one);
- `emulateReducedMotion("reduce" | "no-preference")` beside `emulateForcedColors`, reset after each test (mission 005
  finding: in-process tests share one page);
- `axe(scope?)`: runs axe-core in the page and returns serious and critical violations and incomplete results. Its
  rule selection is 006's own (PLAN-TESTABILITY-1-008), imported from `gates/lib/axe-rules.ts`, which is on this
  branch since the merge of #10 (37dd501): `ruleMeta` over axe-core's rule objects and `ruleOptions` for `axe.run`, as
  `gates/bin/axe.ts` does (every rule axe enables by default and every rule tagged `wcag2a`, `wcag2aa`, `wcag21a`,
  `wcag21aa` or `wcag22aa`, less the rules tagged `experimental` and the eight harness-document rules `bypass`,
  `document-title`, `html-has-lang`, `html-lang-valid`, `html-xml-lang-mismatch`, `landmark-one-main`,
  `page-has-heading-one`, `region`). The module is pure and imports only `gates/lib/story-checks.ts` (which imports
  nothing), so it loads in the browser-mode tests as `packages/styles/test/browser/*.test.ts` already load
  `gates/bin/prefix.ts`; no test-side copy is written. A phase 1 unit test proves the driver uses it: an unnamed button
  gives `button-name`, and a landmark-less test page gives no `region`. `axe-core` **4.14.0** is already a root
  devDependency, exact (006 added it; `package.json`, `pnpm-lock.yaml`), so this feature adds no dependency; it is
  loaded in-process by import and on the fixture by serving the file under the strict CSP (`script-src 'self'`).

Every new driver method and command gets a unit test against a plain test page, red first (the commands are test
infrastructure but have behaviour): hovered and unhovered, pressed and unpressed native buttons; Tab and Shift+Tab
orders; a recorder test with two dispatches asserting two serials; the sink with a plain and a modified link click.

## R-12 Module layout, focus ring, current bar and forced colours

**Decision**: `src/control.ts` (internal) holds: the mode decision (R-02), the attribute move, custom states and
reference resolution (R-03, R-04), the name source rule (R-05), the activation guard and the `click()` forwarding
(R-06) and the shared control styles (focus ring, forced colours, disabled look, `.icon-slot[hidden]`) as a `css`
export `controlStyles`. `src/spinner.ts` (internal) holds the spinner template and styles. `src/ocelle-button.ts` and
`src/ocelle-action-row.ts` follow mission 005's element conventions (one module each, `define()`, `static
properties`, `@tagname`, `@default`, JSDoc on every public member for the manifest, `:host([hidden])`, variant rules
inside `@media not (forced-colors: active)`).

**Focus ring**: `outline` longhands (mission 005 finding: the shorthand with `var()` fails in Chromium):
`outline-style: solid`, `outline-width: var(--ocelle-focus-width)`, `outline-color: var(--ocelle-color-focus)`, on
`:focus-visible` of the inner control. On the button, `outline-offset: var(--ocelle-focus-offset)` (outside). On the
row the ring is drawn **inside** (PLAN-A11Y-SECURITY-1-006 (a)): `outline-offset: var(--ocelle-focus-offset-inset)`,
a new token `calc(-1 * (var(--ocelle-focus-offset) + var(--ocelle-focus-width)))` (-5 px; `ref: ["focus-offset",
"focus-width"]`, group shape), so the ring is never clipped by a scroll container's edge nor covered by the next row
(measured by the lens: an outer ring in an `overflow: auto` list loses both inline sides, and a positioned next row
covers its block-end side). The ring's band is 2 to 5 px inside the row's border edge. Scenarios place rows in an
`overflow: auto` list, edge to edge and positioned, and read ring pixels on all four sides of a focused row without
`current` (plant: no ring), so no bar pixel can stand in for the ring; the current-row case is below. The former
README padding note is dropped.

**The button's ring and clipping containers (PLAN-FRESH-2-009)**: the button keeps its ring outside; an inside ring is
not viable on a zero-padding flush button (it would cover the label). A flush button sits at its container's
inline-start edge (FR-012), so a container that clips (`overflow` other than `visible`) and has no room there would
cut the ring's inline-start side. The README's flush note and the contract's #12 hand-off state that such a container
keeps at least `--ocelle-focus-offset` + `--ocelle-focus-width` (5 px) of unclipped space around the button (for
example `padding-inline` of that size with a matching negative margin); `readme.test.ts` asserts the sentence.

**Current bar (PLAN-A11Y-SECURITY-1-007)**: in forced colours, backgrounds are forced to `Canvas` and `box-shadow` to
none (lens probe), a border would move the flush row's content (FR-031), and a pseudo-element painted behind text
draws axe's serious `color-contrast` incomplete (006 research). The bar is therefore a shadow `<span class="bar">`
inside the inner control (`position: relative`): `position: absolute; inset-block: 0; inline-size:
var(--ocelle-bar-width); background-color: var(--ocelle-color-current)`, rendered only while `current` is set. It
lies in the row's inline padding (R-10), never behind text, and takes no layout space.

**Bar and ring distinct (PLAN-FRESH-2-005 (b))**: `color-focus` and `color-current` are both `accent-strong`. With the
bar at `inset-inline-start: 0` it occupied 1 to 4 px inside the border edge (0 to 3 px on a flush row), overlapping
the ring's band (2 to 5 px), so on a focused current row the ring's inline-start side merged with the bar. The bar now
starts one focus offset inline-end of the ring's inner edge: 7 px inside the border edge, from
`calc(var(--ocelle-focus-width) + 2 * var(--ocelle-focus-offset))`; since the absolute box is placed from the padding
edge, the default row subtracts its border (`calc(var(--ocelle-focus-width) + 2 * var(--ocelle-focus-offset) -
var(--ocelle-border-width))`) and the flush row (no border) does not. The bar spans 7 to 10 px, the gap of 5 to 7 px
shows the row's surface (`accent-low`, or `chrome-hover` on chrome; `Canvas` in forced colours), and content starts
at 12 px (flush) or 13 px (default, border included) with the row's `--ocelle-space-3` inline padding (R-10). Placing
the bar exactly at the ring's inner edge (round 2's wording) would leave the two same-coloured bands touching, one
6 px band, so the gap is part of keeping them distinct. Scenarios on a focused current row read the ring's
inline-start band, the gap (the surface colour) and the bar band at their own positions, plus the ring on the other
three sides, in left-to-right and `dir="rtl"`; plants: the bar at `inset-inline-start: 0` (overlap), and the bar at
the ring's inner edge (no gap). An unfocused current row shows the bar 7 px in from its edge, the README says so. Under
`@media (forced-colors: active)` it gets `forced-color-adjust: none` and `background-color: Highlight` (`GrayText` when
the row is unavailable, decision 16). Unavailable outside forced colours: `--ocelle-color-disabled-ink`.

**Flush hover in forced colours**: a flush control's hover (and a flush row's) is an outline in `Highlight`,
`outline-style: dashed`, `outline-width: var(--ocelle-focus-width)`, with the control's focus-ring offset; it takes no
layout space. While focused, the solid focus ring replaces it.

**Forced colours, per element and state** (PLAN-TESTABILITY-1-007). Inside `@media (forced-colors: active)` the
elements set these system colours explicitly (Chromium keeps author system colours under forced colours); "text"
covers the label, the title, the description and the spinner (`currentColor`):

| Element, state | Text | Border | Other |
|---|---|---|---|
| button-mode control, enabled (and busy button) | `ButtonText` | `ButtonText` (bordered variants, primary included) | — |
| link-mode control, enabled (and busy link) | `LinkText` | `LinkText` (bordered variants) | — |
| hover, active (bordered variants, default row) | as enabled | `Highlight` | — |
| hover, active (flush button, flush row) | as enabled | none | dashed outline `Highlight` |
| focus (any) | as enabled | as its state | solid outline `Highlight` |
| disabled button, unavailable row | `GrayText` | `GrayText` | — |
| current row | as enabled (`GrayText` if unavailable) | as enabled | bar `Highlight` (`GrayText` if unavailable) |

Scenarios assert `resolveColour(<keyword>)` against the computed value. 005 measured `ButtonText` equal to
`CanvasText` here (`specs/005-icons-brand-mark/reviews/plan/round-1/lens-testability.yaml:94`), so the colour
checks run on a link-mode control (`LinkText`) and a disabled one (`GrayText`) too, where a wrong keyword fails.

## R-13 Stories, baselines and axe against feature 006

**Decision**: stories in `storybook/stories/button.stories.ts` and `storybook/stories/action-row.stories.ts` (title
`Elements/ocelle-button`, `Elements/ocelle-action-row`), one export per variant and state as FR-050 lists, right-to-
left as separate stories with `dir="rtl"` in their markup (006 has no direction axis), hover and press declared with
`parameters.ocelle.pointer` (`{ hover: <selector> }` or `{ press: <selector> }`, one per story, a selector that
matches exactly one element, inside 1280 × 800 at scroll 0, 0), focus by a wrapper that focuses programmatically (006
has no focus parameter; whether `:focus-visible` then shows is measured in phase 2 before the focus story is
written). 006 captures and audits with `reducedMotion: "reduce"` (`gates/lib/capture-plan.ts:48`), so a busy story
shows the still arc and its baseline is deterministic. Inner controls set `font: inherit` (006's `font` check).
Forced colours are not captured by 006; they stay in the element tests. Stories that name a control with visible text
follow R-05's label-in-name rule. Round 2 adds stories for `ground="chrome"` (button and row, on a chrome-ground
wrapper) and for a quiet button with `ground="hover-bg"` on canvas and on `hover-bg` (PLAN-FRESH-2-007): about 31
stories in all. Story tests (operator decision I3) are written in each phase's red commit: the existing
`storybook/test/integration/elements-stories.test.ts` is extended with the new story ids, red first, each story
rendering its elements in light and dark; 006 removed that file's CSP checks (the Storybook is not a CSP target) and
none is added.

**Feature 006 is merged (operator decision, 2026-11-13)**: #10 is on `main` (3828d2f) and `main` is merged into this
branch (37dd501), so this design is checked against 006 as it is here (`specs/006-storybook-workbench`, `storybook/`,
`gates/`), and nothing waits for #10. Round 1's arrangement (PLAN-CORRECTNESS-1-010 (a): land only after #10, with a
phase 7 doing the 006 work) is satisfied and replaced: **each phase that adds stories does the 006 work for them**.

Checked against the merged code, what this design relies on is as the branch design had it: `gates/lib/axe-rules.ts`
(the rule selection, R-11); `axe-core` 4.14.0, exact, in the root `package.json`; `shardSize` 3 and `otherShardSize`
80 (`gates/lib/plant-runner.ts:269`, `:275`); 21 stories and 42 baselines, pinned in
`gates/test/integration/storybook-build.test.ts:55` ("built 21 stories"), `visual.test.ts:116-139` (42
story-themes), `axe.test.ts:52-56` (42 story-theme runs, 10 notes, 10 excepted) and `plant-repo.test.ts:225` (42
baseline files); the `fail-token-changed` plant's list of light story-themes that show `color-ink`; the
`fail-empty-index` plant's tree, which replaces each repository story file by name; the pointer parameter
(`gates/lib/capture-plan.ts:200`); the capture context (1280 × 800, reduced motion, no forced colours). What changed at
006's landing, after the branch design was read: an entry of `storybook/a11y-exceptions.json` must name a feature plan
`specs/<feature>/plan.md` as its `plan` (006 landing review L1-04), the CI `visual` command gained
`--remove-docker-image`, `storybook-build` exits 2 when `storybook/.storybook/main.ts` cannot be evaluated, and the
deferred `@ocelle/elements` CSP row is dropped (005 delivered it). None of these changes this design; this feature
plans no axe exception, and one found would stop the phase and go to the operator as a Complexity Tracking row in
this plan with `plan: specs/012-button-action-row/plan.md`.

**Per phase**: in the red commit, the phase's story test entries and the pinned story counts (the four tests above)
take the new totals, written by hand. In the green commit, the story files; baselines made with `pnpm run
visual:update` under docker in the pinned container (CI confirms the bytes under docker and podman; CI's job artifact
is committed when they differ, 006 decision 7); the `fail-token-changed` plant gains the phase's new light
story-themes that show `color-ink`, measured in the pinned container as 006 decision 29 measured mission 005's; the
`fail-empty-index` tree gains an empty copy of a new story file (`button.stories.ts` in phase 2,
`action-row.stories.ts` in phase 5). The phase's checks run `gate:storybook-build`, `gate:visual` and `gate:axe` on the
repository (one heavy job at a time), with the exact summary lines the tests pin.

**Shard budget**: 006's Complexity Tracking row "Plant roots hold every repository story" approves `size` 3 up to its
split count, **25 stories**, and names as its sunset the change that lowers `size` before the repository holds 25.
`main` has 21 and phase 2's button stories alone pass 25, so **phase 1** lowers `shardSize` to **1**, test-first (the
`plantShards` test of the repository's size, `gates/test/plant-runner.test.ts:732`, and `gates/README.md`'s "80 and 3
are approved"), before any story is added. By 006's measured model (387 + size × 1.377 × (2s + 2) s per `visual`
shard), at s ≈ 52 a shard takes about 825 s at size 3, 679 s at size 2 and 533 s at size 1, so only size 1 stays
under 10 minutes. The cost: the 48 `visual` and 25 `axe` plants go from 25 shards (16 + 9) to 73, plus the 3
non-visual shards, each with the fixed part of about 387 s; the total Plants CI time grows accordingly. At size 1 the
model's split count is **76 stories** (387 + 1.377 × (2s + 2) ≤ 600 s; 72 at the record's slowest 1.457 s). Phase 1
updates 006's row (scope `size` 1, sunset the split count at size 1) and puts that split count to the operator for
approval at phase 1's review, as 006 decision 30 did for 25. Each CI run of the branch shows the Plants shards; phase
6's review records a run at the full story count with every shard's time and the run's total; a shard near 10
minutes is a stop-and-ask.

**Size 1 is the last lever (PLAN-FRESH-3-003 (a))**: `plantShards` keeps each `visual` plant whole, so `size` 1 is its
floor; nothing below it remains, and at size 1 a shard's time still grows with every repository story because each
`visual` plant captures them all. Recomputed from the same model: 533 s at 52 stories and 599 s at 76, so after this
feature (about 52 stories) the headroom is about **24 stories**, fewer than the about 31 this feature alone adds; the
next element mission (the status mission, or #12's breadcrumbs and top bar) will pass the split count with no setting
left to lower, and that mission would be blocked on a gate redesign. The cost accepted here: at 52 stories the 73
`visual` and `axe` shards take about 73 × 533 s ≈ 38,900 s, about **10.8 runner-hours** per CI run (taking the
`visual` model for every shard, an upper bound for the `axe` shards), plus the 3 non-visual shards, against 25 such
shards, about 25 × 569 s ≈ 14,200 s or about 4 runner-hours, at 21 stories and size 3 today. Phase 1 writes these facts into 006's
Complexity Tracking row as it updates it (size 1 the last lever, the headroom, the runner time) and into
`gates/README.md`'s approved sizes, and phase 1's review, besides the split count, asks the operator to open a triage
record for a plant design whose shard time does not grow with the repository's story count (for example `visual`
plants that capture only the story-themes their changed inputs can affect), to be decided before the next element
mission starts. This feature does not change its own story count for it (round 3 option (b), not chosen).

## R-14 Mutation testing

**Decision**: element source (`src/control.ts`, `src/spinner.ts`, `src/ocelle-button.ts`,
`src/ocelle-action-row.ts`, `src/icon-slot.ts`) is mutated in-process under `stryker.elements.config.json`, as
mission 005 routed it. The in-process navigation sink (R-11) is what lets the link-mode lines be covered there.
Verdicts follow mission 007: Survived and NoCoverage on a changed line fail; Killed, Timeout and RuntimeError are
killed; CompileError is invalid; Timeout and CompileError are reported and still pass (007 clarifications,
2026-11-10). The spinner's animation and the activation guard invite Timeout mutants (a removed guard can loop a
click handler); they pass by that decision but are listed in the phase review. Equivalent mutants are recorded inline
with a reason. Entries are at most 30 changed lines (007 FR-014). Token source changes (`packages/tokens/src/source.ts`,
`packages/tokens/src/generate.ts`) are mutated under the default configuration with the tokens tests;
`packages/elements/scripts/manifest.ts` likewise with its tests.

## R-15 Manifest of the moved attributes and states

**Decision** (PLAN-CORRECTNESS-1-006 (a)): `packages/elements/scripts/manifest.ts:38` drops `aria-label` from every
element's attributes (`standardAttributes`), and the manifest gate reports `no-description` for any undescribed
member. The moved attributes are public (FR-009, FR-030, FR-053, constitution I), so each element declares each one
with a JSDoc `@attr` and a description, as it declares `ground`; so are `title` (PLAN-FRESH-2-006) and the
`data-ocelle-moved-*` mirrors (R-03, PLAN-FRESH-2-002): nine mirrors on the button, four on the row, each described as
element-owned (hosts do not write them). The normaliser changes to drop a standard attribute
only when the element does not declare it with a description (005's `ocelle-icon` and `ocelle-brand-mark`, whose
manifest entries stay byte-identical); a declared one is kept. The button's custom states are declared with
`@cssstate` (the manifest's `cssStates`); phase 3 checks that `@custom-elements-manifest/analyzer` 0.11.0 emits them,
and if it does not, the normaliser adds them from the element's JSDoc. `scripts/manifest.ts` and its tests
(`test/node/manifest.test.ts`) are in the plan, test-first: 005's entries unchanged, 012's moved attributes, `title`
and the mirrors present and described, the custom states present.

## R-16 Out of scope reminders

The pill tag (and its tooltip from #16's `ocelle-tooltip`, `specs/008-overlays` on `claude/016-overlays`) moved to
the later status mission; its implementation needs #16 merged first. Nothing in this feature depends on #16.
`ocelle-button`'s public interface (contracts/elements-package.md) is what #12 (flush, compact breadcrumb items, link
mode, `aria-current`; the top-bar menu button's `aria-haspopup`, `aria-expanded` and `ground="chrome"`, R-08 item 4a)
and #14 (a flush Copy control) consume.
