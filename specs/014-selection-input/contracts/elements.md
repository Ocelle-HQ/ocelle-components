# Contract: the nine elements (public surface, manifest)

The manifest (`packages/elements/custom-elements.json`) must declare exactly this per element (FR-055); every list
(properties and attributes, events, slots, parts) is stated, "none" when empty. Events are `CustomEvent`,
`bubbles: true`, `composed: true`; only `ocelle-link-activate` is cancelable. A parent's `value` already reads the new
value when its `-change` event is dispatched (FR-002). "Reflected" means property → attribute; "not reflected" means
the attribute is read as the host's input and the property is never written back to it. Every element has
`:host([hidden]) { display: none; }`. Internals are kept under a module-private symbol (research R-01), which is not
surface and not in the manifest.

## Entry points (`package.json` `exports`)

| Entry | Defines |
|---|---|
| `./ocelle-listbox.js` | `ocelle-listbox`, `ocelle-option` |
| `./ocelle-option.js` | `ocelle-option` |
| `./ocelle-tabs.js` | `ocelle-tabs`, `ocelle-tab`, `ocelle-tab-panel` |
| `./ocelle-tab.js` | `ocelle-tab` |
| `./ocelle-tab-panel.js` | `ocelle-tab-panel` |
| `./ocelle-segmented-choice.js` | `ocelle-segmented-choice`, `ocelle-segment` |
| `./ocelle-segment.js` | `ocelle-segment` |
| `./ocelle-copy-field.js` | `ocelle-copy-field`, `ocelle-icon` |
| `./ocelle-link.js` | `ocelle-link` |

Each maps to `./dist/<tag>.js`; the package root and `./browser.js` define all of them (research R-16; operator
decision PLAN-CORRECTNESS-1-015 (a)). The README's module rule reads "importing the module defines that element and
the elements it renders or owns as children".

## `ocelle-listbox`

| Kind | Name | Type | Default | Notes |
|---|---|---|---|---|
| property / attribute | `value` | string (not reflected) | `""` | FR-010, FR-010a; the property reads the selection |
| property / attribute | `label` | string (not reflected) | `undefined` | name; trimmed (FR-006) |
| event | `ocelle-listbox-change` | `{ value: string }` | | user selection only |
| event | `ocelle-listbox-activate` | `{ value: string }` | | Enter on the selected enabled option; double-click on an enabled option (FR-014a, R-18) |
| slot | (default) | | | `ocelle-option` children |
| part | `list` | | | the scroll container (FR-017); padded by focus width + offset, `tabindex="-1"` (R-03) |

Role `listbox` (internals). Keys: ArrowUp, ArrowDown, Home, End, Enter, Space (handled), only when pressed on an
option itself (R-04); others not.

## `ocelle-option`

| Kind | Name | Type | Default |
|---|---|---|---|
| property / attribute | `value` | string (reflected) | index as string (FR-009), as written otherwise (not trimmed) |
| property / attribute | `disabled` | boolean (reflected) | `false` |
| events | none | | |
| slot | (default), `icon` | | |
| parts | none | | |

Role `option`; `aria-selected`, `aria-disabled`, `tabindex` written by the parent (research R-01, R-03; a disabled
option keeps `tabindex="-1"`). Selected bar on the inline-start edge (FR-018, R-15). Minimum block size
`--ocelle-target-min` (R-10).

## `ocelle-tabs`, `ocelle-tab`, `ocelle-tab-panel`

| Element | Kind | Name | Type | Default |
|---|---|---|---|---|
| `ocelle-tabs` | property / attribute | `value` | string (not reflected) | first enabled tab's value |
| `ocelle-tabs` | property / attribute | `label` | string (not reflected) | `undefined`; the tabs' only name source, trimmed (FR-006's tabs exception) |
| `ocelle-tabs` | event | `ocelle-tabs-change` | `{ value: string }` | |
| `ocelle-tabs` | slot | (default) | | `ocelle-tab` and `ocelle-tab-panel` children, in any interleaving |
| `ocelle-tabs` | parts | `tablist`, `panels` | | |
| `ocelle-tab` | property / attribute | `value` (reflected), `disabled` (reflected) | | FR-009 |
| `ocelle-tab` | events | none | | |
| `ocelle-tab` | slot | (default), `icon` | | |
| `ocelle-tab` | parts | none | | |
| `ocelle-tab-panel` | properties / attributes | none | | |
| `ocelle-tab-panel` | events | none | | |
| `ocelle-tab-panel` | slot | (default) | | |
| `ocelle-tab-panel` | parts | none | | |

`ocelle-tabs`' shadow root uses manual slot assignment (`slotAssignment: "manual"`): `part="tablist"` and
`part="panels"` each hold one slot, and on each child batch the element assigns the paired tabs to the first and only
the selected tab's paired panel to the second (research R-05). A host writes no `slot` attribute (it would be
ignored); the manifest declares only the default slot, as the host sees it. The host has no role; `part="tablist"`
carries `role="tablist"` and its name from `label` only (R-01; FR-006's tabs exception, operator decision during
phase 3). A host `aria-label` on `ocelle-tabs` is not forwarded, not observed and does not name the tablist; the
element writes no attribute on its host. The README's tabs section says to name the tabs with `label` (not a host
`aria-label`), and the documentation test checks it (US2-24). Roles `tab` / `tabpanel` on the
children; `aria-selected`, `aria-disabled`, `tabindex` and generated ids on the children, `aria-controls` on every
paired tab, `aria-labelledby` on the assigned (selected) panel only, removed when a panel is unassigned (R-02, R-03). Selected bar on the tab's block-end edge (FR-025). The tab row wraps (FR-022). Unpaired tabs
and panels are not rendered.

## `ocelle-segmented-choice`, `ocelle-segment`

| Element | Kind | Name | Type | Default |
|---|---|---|---|---|
| `ocelle-segmented-choice` | property / attribute | `value` | string (not reflected) | first enabled segment's value |
| `ocelle-segmented-choice` | property / attribute | `label` | string (not reflected) | `undefined` |
| `ocelle-segmented-choice` | property / attribute | `joined` | boolean (reflected) | `false` |
| `ocelle-segmented-choice` | event | `ocelle-segmented-choice-change` | `{ value: string }` | |
| `ocelle-segmented-choice` | slot | (default) | | `ocelle-segment` children |
| `ocelle-segmented-choice` | parts | none | | |
| `ocelle-segment` | property / attribute | `value` (reflected), `disabled` (reflected) | | FR-009 |
| `ocelle-segment` | events | none | | |
| `ocelle-segment` | slot | (default), `icon` | | |
| `ocelle-segment` | parts | none | | |

Roles `toolbar` (horizontal orientation, operator decision PLAN-A11Y-SECURITY-1-008 (a)) / `button` with
`aria-pressed`. Custom states on segments for joined rows, set through a feature-checked internal method (R-06):
internal, not manifest surface. `:state()` sets the package's engine floor at Chromium 125 / WebKit 17.4. Plan
decision 1 is decided yes (the stop before phase 4, T059a, 2026-11-15; `reviews/phase-4/decision-1.md`; R-06 Status),
so this contract holds. The declined alternative, element-owned `data-ocelle-row-*` attributes on segment hosts with
the floor unchanged (operator decisions Q2 (c) and, second analysis, Q3 (b), U2), is not built: no segment host
carries a row attribute, and T062a, T064a, T066a and T067a are skipped.

## `ocelle-copy-field`

| Kind | Name | Type | Default |
|---|---|---|---|
| property / attribute | `value` | string (not reflected) | `""` |
| property / attribute | `status` | string (not reflected) | `""` |
| property / attribute | `copy-label` / `copyLabel` | string (not reflected) | `"Copy"` |
| event | `ocelle-copy-field-request` | `{ text: string }` | dispatched after the cleared region is rendered (FR-035, R-07), outside the activation's task; the README tells hosts that write the clipboard from the page to check their engines' user-activation rules (PLAN-FRESH-2-004 (a)) |
| slots | none | | |
| parts | `value`, `copy-control` | | FR-038 |

Role `group` (internals), named by a host `aria-label` (unnamed without one). Live region role `status` in the
shadow root (FR-041). `copy-control` guarantees its box, its accessible name and the events its activation leads to,
not the element behind it (operator decision PLAN-CORRECTNESS-1-017 (a)); the README states it.

## `ocelle-link`

| Kind | Name | Type | Default |
|---|---|---|---|
| property / attribute | `href` | string (reflected) | `undefined` |
| event | `ocelle-link-activate` | `{ href: string \| null }`, cancelable | |
| slot | (default) | | |
| part | `anchor` | | |

Host `aria-label` forwarded to the anchor, with exactly one named node in the tree (R-08); it must contain the link's
visible text (WCAG 2.5.3), which the README states (R-08 Label in name). The README states that `detail.href` is the
attribute as written and not validated.

## Pairings: "does not" outcomes and their plants

Each row is tested in the same test as its positive pair; each plant is run by the phase review and the failing test
recorded in `reviews/phase-N/plants.md` (research R-11).

| Outcome (spec) | Paired positive in the same test | Plant that makes it fail | Setup that makes it falsifiable |
|---|---|---|---|
| no event on focus-only moves (US1-2, US3-2) | focus moved | selection follows focus in the listbox / segments | |
| no event on host set (US1-11, US2-8, FR-002) | the set selection is exposed | dispatching change from the `value` setter | |
| no event on re-select (US1-7, US2-15, US3-4) | earlier change event | change emitted without the "already selected" check | |
| no activate on Enter on an unselected option, on Space, or on a disabled option (US1-7, US1-18, US1-20) | activate on Enter on the selected option and on double-click | activating on every Enter; activating a disabled option | |
| unhandled keys `defaultPrevented` false (US1-12, US2-14, US3-13, US4-4) | a handled key moves focus | `preventDefault()` on every keydown | |
| letters move nothing, no typeahead (US1-12) | ArrowDown moves focus | typeahead on letters | options whose first letters differ |
| Space does not scroll the page (US1-6, US2-13, US3-13) | Space selects or presses | no `preventDefault()` on Space | page taller than the viewport, scroll offset read |
| keys inside a panel or a nested control are not the parent's (US2-21) | ArrowRight on a tab moves focus and selection | the controller without the target check | button, text input and nested segmented choice in the selected panel |
| listbox does not wrap (US1-3) | End moves to last | `wrap: true` for the listbox | |
| a click on a disabled child selects, focuses and emits nothing (US1-10, US2-7, US3-7) | a click on an enabled child selects | `disabled` ignored in the click handler | |
| a disabled selected option is not reselected and emits nothing (US1-18) | the option stays selected and focused | the "current value" no-op dropped | |
| no event when the selected child is removed or disabled (US1-14, US2-18, US3-15) | the fallback selection is exposed | change dispatched from the model's fallback | |
| focus is not lost on a move (US1-21) | the moved option is still selected | no refocus after the batch | `insertBefore` of the focused option |
| a move does not steal focus back (R-03, PLAN-FRESH-2-001) | US1-21: focus kept on an in-task move of the focused option | the focus record not scoped to the removal that caused the blur; refocusing after any blur | the user clicks the page to leave the focused option, then in a later task the host moves that option; `document.activeElement` read |
| Tab out while the host re-renders on blur (R-03, PLAN-FRESH-3-001) | US1-21: focus kept on an in-task move of the focused option | the record scoped only by its task (`setTimeout(0)` clear, no `relatedTarget` or `takeRecords()` check); the "nothing inside the parent" clause | a host `focusout` listener moves (`appendChild`) or removes the focused option in a microtask, and in another case in a `requestAnimationFrame`; a real Tab and a real click on an outside button; `document.activeElement` is the outside button |
| remembered value forgotten: the appended child is not selected (US1-19, US2-19, US3-16, second halves) | the first half's selection on append | remembered value never forgotten | |
| unselected panels have no node (US2-1, FR-024) | the selected panel is exposed and named | hiding panels with `visibility` only | |
| no axe violation and no serious or critical `incomplete` on the tabs stories (FR-051, PLAN-FRESH-2-002) | the selected panel is named by its tab | `aria-labelledby` on every panel | #10's full rule set on every tabs story, both themes |
| no tabpanel inside the tablist (US2-1) | tablist with three tabs exposed | the tablist role on the host | |
| a host `aria-label` on `ocelle-tabs` does not name the tablist (US2-24, FR-006's tabs exception) | the tablist named "Mission views" from `label` (US2-1) | forwarding the host `aria-label` to `part="tablist"` (at first render or on a later change) | host `aria-label="Recent views"` beside `label="Mission views"`, then changed after render; and a host `aria-label` with no `label` (tablist unnamed) |
| unpaired tabs and panels not rendered, no error (US2-9) | the paired tabs exposed | assigning every tab to the tablist slot | four tabs, three panels; console read |
| the panel is not a stop when it holds a shadow-delegating focusable (US2-22) | the panel is a stop once its button is removed | a light-DOM selector query at tabs updates only | `ocelle-link` alone in a panel |
| no id reference crosses a shadow root (US2-12, SC-003) | tab controls its panel | the panel id rendered inside the tabs' shadow root | children without ids |
| the tab row and the copy field do not scroll sideways (US2-10, US4-2) | the content wraps onto rows or lines | `white-space: nowrap` / `pre` | 320 px viewport, page scroll width read |
| joined: no `style` attribute (US3-10) | measured radii per row | rounding by writing `style` on segments | |
| joined: rounding not a frame late (US3-10, US3-18, Edge Cases) | radii after the resize delivery | the state update deferred one extra frame | resize by a non-settling step |
| joined: regrouping without a group resize (US3-18) | radii after a label change | observing the group only | same container width and group block size |
| joined: shared line not widened, one line (US3-9) | pressed bar drawn | pressed paint as a 3 px border; two borders without overlap | pixel runs across each boundary |
| joined: pressed and hovered lines not `control-border`, also beside a focused neighbour (US3-9, FR-029; PLAN-FRESH-3-002) | lines drawn | the pressed segment's lines in `control-border`; `z-index` on the focused host | the pressed segment with a focused neighbour before it and after it, a hovered segment with a focused neighbour; pixel run across the shared line is `accent-strong` (R-15) |
| joined: the focus ring is not cut by a neighbour (US3-9, FR-007; PLAN-FRESH-2-003, PLAN-FRESH-3-002) | ring pixels on the free side | the ring as the host's outline with no raise; the ring pseudo-element without `z-index` | focused segment beside the pressed one and beside a hovered one, and a focused pressed segment beside a later hovered one; focused tab beside the selected and a hovered tab; `color-focus` pixels just outside all four edges (R-15) |
| no `ResizeObserver` loop or console error during continuous resize (Edge Cases) | rounding follows each step | row states changing margins or borders | ten resize steps, console and `error` events read |
| no forced-colours paint lost (US1-15, US2-11, US3-11) | the `Highlight` bar present | the bar as an inset `box-shadow` only | emulated forced colours |
| the focus ring not clipped in the listbox (US1-16) | the focused option scrolled into view | no padding on `part="list"` | first, last and scrolled-to option |
| the option's focus ring is not cut by a hovered option (FR-007; PLAN-FRESH-3-003) | ring pixels on the free side | the option's ring not raised (an outline on the host, or the `::after` without `z-index`) | focused option with the pointer on the next option and, separately, on the previous one, inside the US1-16 clip; `color-focus` pixels just outside all four edges (R-15) |
| no tab stop for an all-disabled overflowing listbox (US1-22) | one enabled option takes focus | no `tabindex` on `part="list"` | `max-block-size` below the content |
| no clipboard write (US4-3, SC-006) | the request event | a `navigator.clipboard.writeText` call; a `document.execCommand("copy")` call | observer installed at every mount and fixture page |
| repeated status does not mutate the region (US4-5) | first set mutates it | setting `textContent` unconditionally; the region in the Lit template | |
| no request before the first rendering update after activation, region empty at it (US4-6) | the request after that update; the host's text in the tree after its set | synchronous dispatch; dispatch in a microtask | synchronous listener setting the same text; `activationRecord` (R-07, R-11) |
| the tree records the region empty before the host's text again (US4-6) | the refilled update recorded | synchronous dispatch; dispatch inside the element's own `requestAnimationFrame` callback | synchronous listener; `axUpdates` on the region fetched before activation (phase-5 spike, R-07) |
| disabled Copy control emits nothing (US4-10) | enabled control emits | ignoring `disabled` in the click handler | |
| the field draws no colour or icon of its own (US4-7) | the status text shown | a success colour or icon on status set | computed colours read before and after the set |
| the text is not prevented from selection (US4-12) | the selection holds the text | `user-select: none` | pointer drag across the text |
| a `value` set at first render clears no `status` (Edge Cases) | a later `value` change clears it | clearing `status` on every `value` set | `value` and `status` both in the markup |
| no navigation without `href` / when cancelled / disallowed protocol (US5-2, 5, 9, 11) | a later allowed link navigates | navigating on every activation; deciding on the written string or the document URL | US5-11: base inserted after load, removed before the pair |
| Enter without `href` emits (US5-2, US5-9) | the click emits | activation on the native click only | |
| Space on the link emits nothing, its default not prevented (US5-2) | Enter emits | Space handled on the link | page taller than the viewport |
| modified activation emits nothing (US5-13) | a plain click emits | emitting on every click | |
| modified activation's default not prevented (US5-13) | a plain click's default prevented | `preventDefault()` on every click | `window` bubble listener; `context.on("page")` |
| exactly one named node for the link (US5-8) | the link named by the host `aria-label` | forwarding the label and leaving the host named | label starting with the visible text (R-08) |
| no `label-content-name-mismatch` on the link stories (US5-8, WCAG 2.5.3; PLAN-FRESH-2-005) | the host label is the link's name | a story label without the visible text | #10's rule set on the link stories |
| a cancelled fragment link does not change the fragment (US5-14) | an uncancelled one does | ignoring `defaultPrevented` | in process, `location.hash` read |
| no mutation on a set of the current value (Edge Cases, US1-18, US2-17) | an earlier set mutates the states | rewriting `aria-selected` / `aria-pressed` on every set | MutationObserver over the parent's subtree |
| no transition (Edge Cases "Motion") | the selected paint changes | a `transition` on the selected paint | computed `transition-duration` read |
| internals visible to axe (FR-051) | the stories render | internals in a private field | the `axe` gate's rule set on the listbox stories |
| a child outside its parent has no role and no tab stop (Edge Cases; phases 2 to 4) | the same child inside its parent is exposed with its role and takes the tab stop | the child setting its role and `tabindex` in its own `connectedCallback` regardless of the parent | an `ocelle-option`, `ocelle-tab`, `ocelle-tab-panel` or `ocelle-segment` placed directly in the page beside a parent holding the same child |
| a host `value` set does not select the second of two children with the same value (Edge Cases; phases 2 to 4) | a user selection of the second exposes the second as selected or pressed and reports the same value | selecting the last match; exposing the first after a user selection of the second | two children with the same `value` |
| an empty listbox has no tab stop (Edge Cases) | the empty listbox is exposed as a named listbox; one appended option then takes the tab stop | `tabindex="0"` on the host or `part="list"` with no options | `<ocelle-listbox label="Folders">` with no options, a real Tab from a button before it to a button after it |
| a long child label is not truncated and the page does not scroll sideways (Edge Cases, SPEC-1-15; option, tab, segment) | the child's block size grows and its whole text is in the tree | `white-space: nowrap` or `text-overflow: ellipsis` on the child | 320 px viewport, a label longer than the parent's inline size, page scroll width read |
| host `hidden` leaves no box and no node (Edge Cases; all five controls) | the same element without `hidden` has a box and a node | a `display` rule on `:host` that overrides `:host([hidden])` | `hidden` set on the element, then removed |
| a disabled child shows no hover paint (Edge Cases "Hover", R-15; option, tab, segment; second analysis G1) | an enabled sibling under the pointer shows the `hover-bg` fill (and, for a joined segment, `accent-strong` lines) | a `:host(:hover)` rule with no disabled exclusion | a real pointer move onto a disabled option, tab or segment, then on an enabled sibling; computed background and, for the joined segment, the pixel run across its lines read under each |
| a second definition does not replace the first (Edge Cases, two copies of the package; every new element) | the element defined by the first copy works as specified | `define` without the "already defined" check | a second class registered under the same tag after the first; no exception, the first class's instance still exposed |
| a `status` attribute is not reflected after the element clears `status` (Edge Cases, FR-042) | the property reads `""` after the clear | reflecting `status` | `status` written as an attribute in the markup, then a request |
| joined, row attributes (only if plan decision 1 had been answered no; it was answered yes, so this pairing is not built, T062a skipped): host-written row attributes do not stay (R-06 Status) | the measured radii per row | writing the row attributes only when absent | a host writes `data-ocelle-row-start` on a middle segment; read after the next regroup |
