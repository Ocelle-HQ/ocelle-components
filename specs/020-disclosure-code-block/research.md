# Research: Disclosure and Code Block

Phase 0 of `/speckit-plan` for `specs/020-disclosure-code-block`. Each entry: decision, rationale, alternatives. The
measures marked **measured** were made on 2026-11-20 in this session's Chromium (157.0.8103.78, headless, Playwright
pre-installed), on throwaway pages outside the repository; each is re-run as a test of the phase that relies on it,
under the repository's pinned browser, before green. A measure that fails there stops the run for the operator (spec
FR-010, FR-031, FR-032).

## R-01 Disclosure structure (spec FR-003 to FR-008; operator clarify 1)

**Decision.** The shadow root (open, without `delegatesFocus`; squad round 1, PLAN-FRESH-1-001 (a)) renders:

```html
<details part="details">
  <summary class="control" part="summary"><span class="icon-row"><span class="icon-slot" aria-hidden="true"><slot name="icon"><ocelle-icon class="chevron" name="chevron-end | chevron-down"></ocelle-icon></slot></span><span class="label"><slot name="summary"></slot></span></span></summary>
  <div class="panel" part="panel"><slot></slot></div>
</details>
```

- The summary is the one inner control. The icon row is a child of the summary, not the summary itself, so the
  summary can carry its own block padding while the row keeps the slot convention's padding (README § Slot convention,
  "Row padding": a control puts further block padding on an element around the row). The row is labelled, never
  `bare` (a disclosure always has a summary label; an empty summary is the host's mistake, Edge Cases).
- The chevron is the `icon` slot's fallback content, so a slotted consumer icon replaces it in both states (FR-005).
  Fallback content is not slotted, so `iconSlotStyles`' `::slotted` size rules do not reach it: the element adds
  `.icon-slot .chevron { inline-size: var(--ocelle-icon-size); block-size: var(--ocelle-icon-size); flex: none;
  margin-inline-end: var(--ocelle-space-2) }`, the same box the convention gives a slotted icon. A plant guards it
  (contracts/checks.md).
- The chevron's `name` is bound to the state; `chevron-end` mirrors under RTL by `ocelle-icon`'s own rule (README §
  Icons). The icon wrapper carries `aria-hidden="true"`, which hides the fallback chevron and any slotted icon in the
  flat tree: a bare `<svg>` (which the slot convention allows, README § Slot convention) otherwise keeps an `image`
  node and adds its `<title>` to the summary's name (squad round 1, PLAN-A11Y-SECURITY-1-003: measured, a slotted
  `<svg><title>Folder</title>` gave the summary the name "Folder Advanced" and an `image` node "Folder"). US1-17's
  body slots a titled bare svg. The README tells consumers never to label a slotted icon (slot convention, Naming).
- **The summary is named from its `.label` wrapper by element reference** (phase 1 spike, T001,
  `reviews/phase-1/spike.md` § 1; operator decision (a), `reviews/phase-1/operator-spike-decisions.md`). The wrapper
  removes the slotted svg's node but not its `<title>` from the name computed from content: under the pinned Chromium
  156.0.8078.4 the summary was still named "Folder Advanced" (cases A, B, D, E of the spike; hidden text written in
  the shadow root itself is left out, slotted text is not). So while the host gives no `aria-labelledby` and no
  `aria-label`, the element sets the summary's `ariaLabelledByElements` to `[.label]`, the wrapper around the
  `summary` slot in the same shadow root (an element reference; no ID crosses a root). A host `aria-labelledby` or
  `aria-label` moved onto the summary takes over and the `.label` reference is cleared (R-03). Measured: the summary
  is named "Advanced settings" from summary text "Advanced <b>settings</b>" with the titled svg slotted (case G), and
  the wrapper still hides the svg's node. The aria-hidden wrapper stays: it keeps the `image` node out of the tree.
  The name order of FR-006 holds (host `aria-labelledby`, host `aria-label`, the `summary` slot's text), and an
  empty summary still has no name: the reference points at an empty wrapper (Edge Cases).
- **Focus without `delegatesFocus`** (squad round 1, PLAN-FRESH-1-001 (a), operator decision). With `delegatesFocus`,
  a pointer click on any non-focusable part of the host's flat tree, the slotted panel content included, focuses the
  shadow root's first focusable element, the summary: measured, a click on the text of a tall open panel moved focus
  to the summary and scrolled the page from 1372 px to 0, and a Space after it closed the panel. The disclosure is
  the first control whose host also holds content, so it attaches its root without `delegatesFocus` and overrides
  `focus(options)` to call the summary's `focus(options)` (as `click()` is overridden, R-03); before the first render
  there is no summary and `focus()` does nothing. The summary is natively focusable and in the tab order inside the
  shadow root, and `document.activeElement` is still the host by retargeting, so US1-4 and US1-19 read the same. This
  is a second departure from control conventions rule 1 (R-03); the README section says so. US1-22's body clicks
  panel text in a scrolled, tall open panel, reads `scrollY` before and after the click, then presses Space; it must
  fail red with `delegatesFocus` restored (a plant, contracts/checks.md). `scrollY` is not read after Space: with focus
  on the body, Space pages the document wherever the page can scroll further (measured, squad round 2,
  PLAN-FRESH-2-004: 60 px after the click, 690 px after Space, the element correct).
- The native marker: `summary { list-style: none }` (Chromium 89+). WebKit draws its marker through
  `::-webkit-details-marker`; whether `style-lint` admits that selector is checked in phase 1. If it does not, WebKit's
  marker is recorded as an open limitation beside the Engines note (WebKit is not measured; the operator decided at
  the spec gate to plan without #470's states).

**Rationale.** Native `details` gives the expanded state, Enter and Space, and find-in-page expansion with no script.
Putting the row inside the summary keeps 012's decision 33 (labelled rows on the baseline) untouched.

**Alternatives.** `summary` as the `icon-row` itself (rejected: block padding on the row is forbidden by the
convention). A button with `aria-expanded` (rejected by the operator at clarify 1).

**Measured.** A `details` in a shadow root with a `summary` slot and a default-slot panel: Chromium's tree has a
`group` named by the summary text (ariaSnapshot `group: S`). Phase 1's spike asserts the summary node's role
(`DisclosureTriangle` in the CDP tree) and its `expanded` property in both states (US1-1, US1-2); a failure goes to the
operator. Phase 1's spike (pinned Chromium 156.0.8078.4, `reviews/phase-1/spike.md` § 1): role, `expanded` and a
moved host `aria-label` hold; the titled bare svg's title leaked into the name under the wrapper alone, which the
`.label` reference above answers (cases G and H give the label text alone).

## R-02 Open state, the event and coalescing (FR-009 to FR-013; operator clarify 2; SPEC-1-06, SPEC-2-04, SPEC-2-05)

**Decision.**

- `open`: `{ type: Boolean, reflect: true }`, `@default undefined`. `undefined` and `false` are the same closed state;
  after a user close the property is `false` and the attribute absent (SPEC-2-04). Setting `false` on a closed
  disclosure changes nothing and fires nothing.
- Render binds `?open=${this.open === true}` on the `details`.
- The element listens to the native `toggle` on the `details` (in the shadow root; it is not composed). The handler:
  1. reads `details.open`; if it differs from `this.open === true`, sets `this.open` to it (a user toggle or find in
     page);
  2. awaits `this.updateComplete`, so the host attribute is reflected;
  3. if the final state differs from the last reported state, records it and dispatches `ocelle-disclosure-toggle`
     (`bubbles`, `composed`, not `cancelable`, `detail: { open }`).
- The last reported state is set at the first `updated()` from the initial `open`, so the upgrade fires nothing
  (US1-9), whatever native `toggle` the first render queues.
- Coalescing is the platform's (FR-012 as amended by the operator, squad round 1, PLAN-CORRECTNESS-1-003 (a)): a
  property changed twice in one task is rendered once by Lit (a microtask), so `details.open` changes at most once
  per render; the native `toggle` is queued as a task and the platform's toggle task tracker merges every change made
  before it runs, which can span tasks (measured: `details.open = false` in a `setTimeout(0)` and `= true` in a
  microtask gave one native `toggle`, `closed` to `closed`; with a MessageChannel task between the two sets, two
  toggles). So there is at most one `ocelle-disclosure-toggle` per native `toggle`, with the final state. A native
  `toggle` whose final state equals the reported state (oldState equal to newState) fires none, which is the spec's
  stricter rule (SPEC-1-06). The three cases of US1-7 give 0, 0 and 1 event. The README says the event count is not
  a count of changes.
- A morph that keeps `open` changes nothing and fires none; one that removes it closes the disclosure and fires one
  event with `open: false` (SPEC-2-05, US1-8). The tests read the count after the element's `updateComplete`, then
  the driver's `settle()` (two animation frames, then every element's `updateComplete`): a `setTimeout(0)` can run
  before the native `toggle` task (measured, squad round 1, PLAN-TESTABILITY-1-004), while the native `toggle` runs
  before the next animation frame (measured order: the set, `toggle`, the frame). Every zero-count body ends with a
  positive control under the same wait (contracts/checks.md).
- **Focus out of a closing panel (FR-013; squad round 1, PLAN-CORRECTNESS-1-002).** In `willUpdate`, when `open` goes
  from true to false, the element notes whether focus is in the panel: the active element of the host's root
  (`(this.getRootNode() as Document | ShadowRoot).activeElement`, retargeted) is a light-DOM descendant of the host
  (`this.contains(active) && active !== this`), as `ocelle-list-detail.ts` does; in `updated` it then focuses the
  summary. Focus on the summary itself retargets to the host and is excluded. `deepActive()` with `this.contains` is
  not used: it returns the innermost element, which `contains` misses when it sits in the shadow root of a control in
  the panel (an `ocelle-button`, a nested disclosure's summary; measured). A close does not always start from the
  summary: `element.click()` from a script, or an assistive technology's default action, can close while focus is in
  the panel. Those close through the native path, and focus is still in the panel when the native `toggle` runs
  (measured: a focused slotted link, then `summary.click()`: the link was still focused in the `toggle` handler), so
  the same `willUpdate` check, run from the handler's property set, sees it. US1-19 has bodies for a light-DOM link,
  a focused `ocelle-button` and a nested disclosure's summary.

**Rationale.** It matches native `details` (the attribute is the state) and htmx: the server's attribute wins on a
morph, which is what the operator chose.

**Alternatives.** A cancellable request event (rejected at clarify 2); dispatching from `updated` (rejected: it would
fire for the initial state and for property sets the native element coalesces).

## R-03 Host ARIA, name and clicks (FR-006, FR-007, FR-004; SPEC-1-13, SPEC-2-09)

**Decision.**

- `MovedAttributes` (`src/control.ts`) with `aria-label`, `aria-labelledby`, `aria-describedby` and `title`: the
  summary gets `aria-label` and `title` as attributes, and `ariaLabelledByElements` and `ariaDescribedByElements` from
  `resolveIds`, re-resolved on connect, as `ocelle-button` does. The mirrors and the manifest's `@attr` entries follow
  the control conventions.
- **The summary's name (FR-006; phase 1 operator decision (a), R-01).** The native name order (labelledby,
  aria-label, content) is kept, but content is replaced by the summary's own `.label` wrapper, because content would
  include a slotted svg's `<title>` (R-01). The element keeps one rule wherever the moved attributes change (upgrade,
  a script, a morph, a restored mirror, connect): while the host gives an `aria-labelledby`, the summary's
  `ariaLabelledByElements` is its resolved list; else while the host gives an `aria-label`, `ariaLabelledByElements`
  is cleared (`null`) so the moved `aria-label` names the summary; else it is `[.label]`. Removing the host attribute
  that took over restores the next one in that order, ending at `[.label]`. The summary text names the control
  alone, with or without a slotted icon; an empty summary has an empty `.label` and so no name (Edge Cases).
- **A host `aria-expanded` is mapped onto `open`** (operator decision, squad round 1, PLAN-CORRECTNESS-1-008 (a);
  constitution III, SPEC-2-09). `aria-expanded` is in `observedAttributes`; when it appears on the host (in the markup
  at upgrade, set by a script, or added by a morph) the element reads it and removes it from the host: `"true"` sets
  `open = true`, `"false"` (README rule 4's off value) sets `open = false`, and any other value changes nothing. There
  is no mirror: the `open` attribute is the persisted state, so a morph keeps the state through `open`. At upgrade
  it is read after `open`, so it wins, and like any initial state fires no event (US1-9). The element's own removal
  is not a change. The summary exposes the expanded state natively, so the state reaches the inner control once and
  no host `aria-expanded` is left for axe to flag (README rule 4). US1-23 is its body. No exception to Principle III
  remains.
- `element.click()` is overridden to click the summary, so it toggles once (FR-004). The element does **not** use
  `guardHost`: the panel holds the consumer's content, whose clicks must reach the page's listeners. A click
  dispatched on the host itself does not pass through the summary and the native element ignores it, so it toggles
  nothing, with no guard. This departs from control conventions rule 1's guard, which assumes the host holds only the
  control; the README section says so. The second departure from rule 1 is the root without `delegatesFocus` (R-01),
  for the same reason: the host holds the panel's content.

## R-04 Look of the disclosure (FR-014 to FR-016; SPEC-1-09)

**Decision.** Host: `:host { display: block }` and `:host([hidden]) { display: none }` (FR-001, FR-003; README §
Element conventions, Styles, wants a `:host` display rule beside the hidden rule). Without it a custom element host is
`display: inline` around the block `details` (measured, squad round 1, PLAN-CORRECTNESS-1-006). A body asserts the
host's computed display is `block` and that its border box contains the summary and the open panel; a plant removes
the rule. Tokens: summary `font-size-md`, `font-weight-medium`, `line-height-normal`, `color-ink`; block padding
`space-1`, inline padding `space-1`, `radius-2`; hover `background-color: var(--ocelle-color-hover-bg)` inside
`@media not (forced-colors: active)`; cursor `pointer`. Panel: `padding-block-start: var(--ocelle-space-2)`,
`padding-inline-start: calc(var(--ocelle-icon-size) + var(--ocelle-space-2) + var(--ocelle-space-1))`, so panel text
starts under the summary label. The focus ring comes from `controlStyles` (`.control`). **Forced colours** (operator
decision, squad round 1, PLAN-A11Y-SECURITY-1-004 (a)): `controlStyles` gives `.control` `ButtonText` and relies on a
native button's `ButtonFace` (`control.ts:169-179`, comment at `control.ts:29`), but a `summary` computes a
transparent background in forced colours (measured), so the element adds, inside `@media (forced-colors: active)`,
`summary.control { color: CanvasText; background-color: Canvas }`, the system pair for content; the chevron follows
through `currentColor`, the ring stays `Highlight`. `controlStyles`' forced-colours hover border has no effect on the
summary, which has no border; no forced-colours hover state is added. US1-15 asserts that the summary's computed
`color` and `background-color` resolve to `CanvasText` and `Canvas` (`resolveColour`). No
`transition` or `animation` anywhere in the element's styles (FR-015), checked by the story test's animation read and
a style assertion. The summary's block size is `1lh` of `line-height-normal` at 16 px plus the row and summary
padding, at least 24 px (FR-014); the test asserts the summary's border box is at least 24 × 24 CSS px. Hover is
asserted as the summary's computed `background-color` equal to `--ocelle-color-hover-bg` while hovered and
transparent otherwise (SPEC-1-09). No new token.

## R-05 Code-block content model (FR-020; operator SPEC-1-01 "copy textContent always")

**Decision.** The element reads `this.textContent ?? ""` in `render()`. A `MutationObserver` on the host (`childList`,
`characterData`, `subtree`), started in `connectedCallback` and stopped in `disconnectedCallback`, calls
`requestUpdate()`. The shadow root has no slot, so the light-DOM children are not rendered: child markup adds no
style, and nothing in the light DOM is focusable through the element. The text is rendered as one text binding inside
`<pre class="code" part="code">` in wrap mode, or as the digest spans (R-07). Templates hold no whitespace inside
the `pre`, because it would be shown. The copy and every digest unit are Lit text bindings (`${text}` inside the `pre`
and inside each span, the units built with `map`), never `unsafeHTML`, `innerHTML` or `DOMParser`, so markup-like text
stays text (squad round 1, PLAN-A11Y-SECURITY-1-005). A wrap body and a digest body hold escaped markup-like text
(`&lt;b&gt;x&lt;/b&gt;` and `&lt;img/src=x/onerror=alert(1)&gt;` in the source) and assert the shadow root has no `b` or
`img` element and the shown text equals those characters.

- **Leading newline.** A newline directly after the opening tag is part of `textContent` and is shown (the HTML
  parser drops it only for `pre`, `listing` and `textarea`). US2's leading-newline body asserts the shown first line
  is empty, and the README tells templates to start the text on the tag's line.
- **Observer options** (squad round 1, PLAN-TESTABILITY-1-008). US2-16 has a body for each trigger: a child-list
  change (an htmx-style swap, `textContent` set), a `characterData` change of the host's text node (the driver's
  `text`), and a `characterData` change of a text node inside a child element (`<b>`, the driver's `textData` on it,
  the `subtree` option); each asserts the shown copy and, in digest mode, the groups follow.
- **Wait rule.** Tests of a text change wait for the mutation record, then `updateComplete`, then the driver's
  `settle()` (two animation frames), as US1-7 does (SPEC-2-05).

**Alternatives.** Slotting the text (rejected by the operator: digest groups and "child markup adds no style" need the
copy).

## R-06 Code-block policies and the overflow region (FR-021 to FR-027; SPEC-2-07)

**Decision.**

- `:host { display: block; max-inline-size: var(--ocelle-measure-reading) }`: a block box that fills its container,
  capped at the measure, as 003's prose `pre` is a block (SPEC-2-07). The short and digest baselines therefore show a
  full-width block up to 68ch.
- Wrap mode renders `<div class="block" part="block"><pre class="code" part="code">…</pre></div>`. `.block` has the
  ground (`color-inset`), `padding: var(--ocelle-space-3)`, `border-radius: var(--ocelle-radius-2)` and a
  `var(--ocelle-border-width) solid transparent` border, which forced colours paint in `CanvasText` (FR-034).
  `.code` has `direction: ltr; unicode-bidi: isolate; text-align: left` (operator decisions, squad round 1,
  PLAN-FRESH-1-002 (a), and squad round 2, PLAN-FRESH-2-001 (a)): each line of code is shown left to right in every
  page direction, because under an inherited `rtl` the bidi algorithm moves leading and trailing neutrals (measured:
  `--force main.` read `.force main--` on screen while it copies as written). The rule is on `.code` only, not on
  `.block`: `.block` and the module's `.region-box` keep the page direction, because the module picks the fade side
  from `:host(:dir(rtl))` while `edgeState` reads the box's own `scrollLeft` and direction (`overflow-region.ts`
  185-193); an `ltr` box under an `rtl` host fades the left edge, where nothing is hidden (measured, squad round 2,
  PLAN-FRESH-2-001). **Opening at the line starts** (operator decision, squad round 3, PLAN-FRESH-3-001 (a)): the
  track is `max-content` wide (`overflow-region.ts` 130-135) and the `ltr`, left-aligned lines start at its left
  edge, while an `rtl` box's scroll origin is its right edge. At rest (`scrollLeft` 0) the box shows only the tails
  of the long lines and none of the short ones (measured, squad round 3: block 300 px, `scrollWidth` 704, box x 972
  to 1272, `cd /srv/app` at 568 to 654 and `ls` at 568 to 583, both wholly outside the box). So in `updated`, in
  scroll mode, when `box()` returns a box other than the one last opened or the shown text differs from the text it
  was last opened for, and `getComputedStyle(box).direction` is `rtl`, the element calls `box.scrollTo({ left:
  -(box.scrollWidth - box.clientWidth), behavior: "instant" })` and records the box and text. Measured, squad round
  3: the write gives `scrollLeft` -404 and puts the first character at the box's left edge (972). The write is
  instant, which is all 009's contract asks of a later element's scroll write (§ What a later element must not do);
  the module's own `scroll` trigger then reads the new position and sets `data-fade` to `start`, which under
  `:host(:dir(rtl))` is the gradient transparent at the right, the side where the line ends are hidden. The element
  sets no `data-fade` itself. Under `ltr` nothing is written, the origin already being the line starts. A resize
  that makes a fitting block overflow is not followed by a write: the platform's position stands (spec Edge Cases).
  If the module's focus fallback suppression is active when the text changes, a write that moves the box more than
  1 px from the module's recorded `scrollLeft` ends it, by the contract's rule; one that does not leaves it. US2-8's
  bodies under an `rtl` ancestor: the visual order of `--force main.` in wrap and in scroll mode, and the line starts
  of an overflowing scroll block at rest (the box's computed direction is `rtl`, the first character of every line
  lies inside the box's rect, `data-fade` is `start`, and the computed `mask-image` is the gradient transparent at
  the right edge), again after a text change, with an `ltr` control body that sees no write (contracts/checks.md).
  A plant removes the write; the write's conditions are JavaScript and Stryker's to mutate.
  `.code` also has `min-block-size: 1lh` (style-lint admits `1lh` as a whole value, `gates/stylelint/token-only.ts:14`),
  so an empty `pre`, which has no line box and is 0 px high (measured, squad round 1, PLAN-CORRECTNESS-1-005), keeps
  one line (US2-19): the oracle is the block size equal to one computed line height of `.code` plus `.block`'s
  padding and border, in both modes; a plant removes the rule. `.code`
  has `margin: 0`, `font-family: var(--ocelle-font-sans)`, `font-variant-numeric: var(--ocelle-figures)`,
  `font-size: var(--ocelle-font-size-md)` (the body size, as 003's prose `pre` inherits it), `line-height: var(--ocelle-line-height-relaxed)`, `white-space: pre-wrap`,
  `overflow-wrap: anywhere`. The `pre` sets its own font family: `base.css`'s rule does not reach a shadow root and the
  user agent gives `pre` monospace. `:host` sets no font: the host shows no text of its own (the shadow root has no
  slot, so its light-DOM text is not rendered, R-05), and every shown character is in `.code`, so the host's computed
  `font-family` is the page's (measured, phase 2 spike, `reviews/phase-2/spike.md` § 4: `"Times New Roman"` on a page
  with no body font, while the `pre` and every unit computed `--ocelle-font-sans`). The no-monospace oracle
  (contracts/checks.md) therefore reads `.code` and every unit, not the host; giving `:host` the font would style a
  box that holds no shown text and is not what plan § Constitution check II states ("the shadow `pre` sets
  `font-sans` and `figures` itself").
- Scroll mode (`overflow` trimmed and lower-cased equals `scroll`) renders the module's structure inside `.block`:
  `.region-frame > .region-box[data-fade] > .region-track > pre.code` with the ring and the two edges, as the contract
  shows, `white-space: pre` on `.code`. The controller is created once in the constructor with `box: () =>
  this.renderRoot.querySelector(".region-box")`; in wrap mode `box()` is null, so the module follows no box and writes
  nothing (its `hostUpdated` releases a box that went away and removes its `tabindex`, `role` and `aria-label`; the
  box node itself is gone with the scroll template), which gives FR-025 on a switch. **Focus on the switch**
  (operator decision, squad round 1, PLAN-CORRECTNESS-1-010 (b)): the module's `#release` only takes off attributes
  and listeners, and its handover runs only when overflow ends (`overflow-region.ts` 392-402), so a focused
  `.region-box` removed by the re-render would drop focus to the body. In `willUpdate`, when the policy leaves
  `scroll` while the shadow root's active element is a node inside `.block` other than `.block` itself, the element
  notes it: the `.region-box`, or the `.region-frame` that the module's handover focuses when overflow ends with the
  box focused (`overflow-region.ts` 433-445, US2-21), which keeps focus until its own `focusout` (squad round 2,
  PLAN-FRESH-2-003). In `updated` it gives `.block` a temporary `tabindex="-1"`, focuses it, and removes the attribute
  on `.block`'s `focusout`. **The block's ring** (operator decision, squad round 2, PLAN-FRESH-2-005 (a)): a scripted
  focus after keyboard use matches `:focus-visible` and would draw the user agent's `outline: auto` (measured), so
  `.block:focus-visible` takes the library ring, as `controlStyles` draws it and as the module's own handover draws it
  on `.region-frame`: `outline-style: solid; outline-width: var(--ocelle-focus-width); outline-offset:
  var(--ocelle-focus-offset)`, `outline-color: var(--ocelle-color-focus)`, and `outline-color: Highlight` inside
  `@media (forced-colors: active)`. Two bodies switch `overflow` to wrap: one with the box focused, one after overflow
  ended with the box focused (focus on `.region-frame`). Each asserts `document.activeElement` is the host, the shadow
  root's active element is `.block`, `.block`'s computed outline is the token ring (style `solid`, width
  `--ocelle-focus-width`, colour `--ocelle-color-focus`; `Highlight` under forced colours), and after focus leaves
  `.block` has no `tabindex`. The module is not changed. The module's per-instance sheet is adopted in both modes; in
  wrap mode its one rule matches nothing.
- `label` passed through `setLabel(this.label)` in `updated()`; `aria-label` in `observedAttributes` with
  `requestUpdate()` on change, exactly as `ocelle-scroller` does.
- The module's `slotchange` trigger never fires (no slot). A text change re-renders the `pre`; the track's size
  changes, and the module's `ResizeObserver` on the track sees it (contract § When the state updates). A change that
  keeps the track's size (same line lengths) changes no overflow state either. The focus handover finds no focusable
  slotted element and focuses `.region-frame` (contract, Focus handover).
- No module option of mission 019 (`blockAxis`, `blockStartBox`) is set, and 019's R-17 is not needed: nothing is
  pinned at the inline start.
- **WebKit** (analysis fixes C2). The scroll block's tab stop while it overflows, its arrow keys, its focus handover
  when overflow ends, the focus move on a switch to wrap and the `rtl` opening write are untested in WebKit, as the
  README's Engines section already says of `ocelle-scroller` and `ocelle-workflow-board` on the same module. The
  README's WebKit line adds `ocelle-code-block`'s scroll mode to that list (T040). No WebKit behaviour is assumed to
  differ; none is measured.

**Measured.** None yet for the module path: it is the scroller's, tested by 009. Phase 2's bodies prove the code
block's use of it (US2-4 to US2-8).

## R-07 Digest rendering (FR-028 to FR-033; operator clarify 4; SPEC-1-03, SPEC-1-04, SPEC-1-12, SPEC-2-03, SPEC-2-08)

**Decision.** In digest mode the trimmed text, when it holds no whitespace, is split into code points
(`Array.from`), the prefix runs to and includes the last `:`, and the rest is cut into groups of four from the start.
They render as inline spans joined by `<wbr>`, each unit a Lit text binding inside its span, the units built with
`map` (never `unsafeHTML` or `innerHTML`, R-05):

```html
<pre class="code digest" part="code"><span class="prefix">sha256:</span><wbr><span class="group">9f86</span><wbr><span class="group">d081</span>…</pre>
```

with `.digest > span:not(:last-child) { margin-inline-end: var(--ocelle-space-1) }`: every unit but the last carries
the gap after it (the test asserts the gap per adjacent pair). The gap is on the unit before each break, not after
it: a `margin-inline-start` on the unit after each `wbr` starts every continuation line `space-1` in (measured at
150 px, squad round 1, PLAN-FRESH-1-005), while a trailing margin is invisible at a line's end, so every line starts
at the `pre`'s content edge and the copied text is unchanged. The trailing margin is invisible in the paint but
counts toward fitting the line (phase 2 spike, below): the prefix's gap decides where the prefix breaks. US2-12
asserts that every line's first unit starts at the content-box inline start. `.digest > .group { white-space: nowrap }`
keeps a group whole; the prefix has no `nowrap`, so a prefix that with its gap is wider than the line still breaks
inside (WCAG 1.4.10). The wrap mode keeps
`white-space: pre-wrap; overflow-wrap: anywhere` on the `pre`; the scroll mode `white-space: pre`.

- **Break positions.** `<wbr>` is the intended break opportunity between groups. Hex has none of its own, but `-`
  and `/` are UAX #14 break opportunities, so a base64url or base64 group can break inside: measured (squad round 1,
  PLAN-CORRECTNESS-1-004), with groups holding `-` or `/`, a group had more than one rect at 45 of 241 `pre` widths
  from 60 to 300 px, and with `white-space: nowrap` on the groups at 0 of 241. So the groups are `nowrap` (four code
  points never exceed a line at any width the block can have), while the prefix keeps `overflow-wrap: anywhere`: a
  long prefix in a very narrow block breaks anywhere, which keeps WCAG 1.4.10 (SPEC-2-08). US2-12 has a base64url body
  swept over those widths; a plant removes the `nowrap`. FR-033's rule is: breaks fall between units; a unit wider
  than the line breaks anywhere inside, as FR-023. The README digest rule says the same, and FR-033 and US2-12 were
  aligned with it by the analysis fixes (C1): the prefix's one-rect assertion holds only where the prefix fits the
  line (with its gap, as restated below). The sweep strings are named in contracts/checks.md (A1).
- **The prefix's fit includes its gap** (phase 2 spike, T021, `reviews/phase-2/spike.md` § 3; operator decision Q2
  (c), `reviews/phase-2/operator-spike-decisions.md`). Under the pinned Chromium 156.0.8078.4, in both harnesses, the
  prefix's `margin-inline-end` counts toward fitting the line: wherever the `pre`'s content box is at least the
  prefix's width but less than the prefix plus `--ocelle-space-1`, `overflow-wrap: anywhere` breaks inside the prefix
  before its `:` (4 of 241 widths in every sweep: 66 to 69 px in the fixture, prefix 66 px; 63 to 66 px in process,
  prefix 62.31 px; with the prefix's margin set to 0 the prefix never split where it fit). The structure is
  unchanged; the oracle is restated. The measure is the prefix's inline size (its rect's width read at 300 px, where
  it is one rect) plus the computed `--ocelle-space-1` in px: the prefix has one rect wherever that sum is at most the
  `pre`'s content-box inline size, and is not asserted elsewhere. With that threshold the sweep had 0 failures in
  both harnesses. FR-033 and US2-12 read "inside the prefix only where the prefix and its gap are wider than the
  line". The wide-prefix body (`ni:sha-256:` at 60 px, 2 rects; one rect at 300 px) held as stated.
- **Which sweep guards the groups' `nowrap`** (phase 2 spike, § 3). Only the base64url string does: with the groups'
  `nowrap` dropped its `L-qg` group split at 60 (fixture) and 70 (in process) of 241 widths. The base64 string cannot
  tell `nowrap` from its absence: its `/` ends the group `FaO/`, where the `<wbr>` already is, and its `+` (`L+qg`)
  is no break opportunity, so without `nowrap` no group split (0 of 241). The base64 body stays as a break-position
  reading of a second alphabet; the `nowrap` plant is guarded by the base64url body (contracts/checks.md § Plants).
- **Copy.** The `wbr` and the margins add no character.
- **Accessibility text.** Adjacent inline spans are one text run. Playwright's `ariaSnapshot` of the host also
  includes the host's unrendered, unslotted light-DOM text (measured, squad round 1, PLAN-TESTABILITY-1-001: a host
  holding `LIGHTTEXT` gave `- text: LIGHTTEXT sha256:9f86d081`), so a host snapshot cannot fail for the grouping and
  is not used. The snapshot is taken of the shadow `pre` (`part="code"`) and asserted equal to `- text: <trimmed
  digest>` (operator decision (a)); the CDP StaticText concatenation under the block's node is the other half of the
  measure.

**Measured** (Chromium 157, a 200 px wide shadow `div` with `pre-wrap` and `overflow-wrap: anywhere`, 16 px sans,
`sha256:` and 16 groups):

| Layout | Copied text (Ctrl+C, clipboard read) | `getClientRects()` per unit | Lines | Playwright `ariaSnapshot` |
|---|---|---|---|---|
| inline spans, `<wbr>` between, margin gap | unbroken, as written | 1 each | 4 | one text run, unbroken |
| `inline-block` spans, margin gap | unbroken | 1 each | 4 | **split into words** with spaces |
| flex row with `gap` | **a newline between every unit** | 1 each | 4 | split |

CDP `Accessibility.getFullAXTree`: the StaticText names under each block, joined in tree order, give the digest as
written in all three; the node count differs and is not asserted (SPEC-1-04). A second run, 60 px wide, with
`ni:sha-256:` and no `nowrap`: the prefix (wider than the line) had 2 rects, every group 1. So the inline-span layout
is chosen; `inline-block` and flex are rejected by the copy and snapshot measures. FR-032's fallback is not needed.

**Copy driver** (squad round 1, PLAN-FRESH-1-004, PLAN-TESTABILITY-1-002 (b)). The existing
`driver.clipboardCopy(id)` selects the host's light-DOM contents (`selectNodeContents`), which under the copy model has
no box: measured, Ctrl+C after it left a clipboard pre-filled with a sentinel unchanged. So US2-10 uses shadow-aware
copy methods (contracts/checks.md § Driver additions), each clearing the clipboard to a sentinel first, pressing the
platform copy shortcut with `clipboard-read` and `clipboard-write` granted, and reading `navigator.clipboard.readText()`
on an `https://` origin (`about:blank` has no `navigator.clipboard`). Measured on the R-07 structure: a triple click on
the shadow `pre`, then Ctrl+C, copies the trimmed digest followed by one `\n` (the platform ends a whole-block
selection with a block newline, which is not an element character); a selection over a run of group spans inside the
`pre` (`setBaseAndExtent` over its children) copies exactly their characters. US2-10 asserts both (operator decision
(b)): the whole-block copy equals the trimmed digest plus one `\n`, and the run copy equals the run exactly.
Re-measured under the pinned Chromium 156.0.8078.4 in both harnesses (phase 2 spike, T021, `reviews/phase-2/spike.md`
§ 1): the platform's newline is added only when the document has content after the block (a following `<p>`, `<div>`
or bare text node); with the block the last content of the page (alone, or with content before it only) the copy is
the trimmed digest with no `\n`, in wrap and scroll mode. The characters before it are the trimmed digest in every
case, and the run copy holds exactly. So US2-10 has two whole-block bodies (operator decision Q1 (c),
`reviews/phase-2/operator-spike-decisions.md`): the block last on the page, copying exactly the trimmed digest; and a
block followed by a `<p>`, copying the trimmed digest plus one `\n`. Neither harness refused the clipboard
permission, so the fallback below is not used. If the
repository's pinned browser or harness refuses the permission, the nearest driver is `document.execCommand("copy")`
with a `copy` listener reading `getData` of the default action, recorded as a gap (FR-052).

## R-08 Find in page (FR-010; SPEC-1-10)

**Decision.** Chromium opens a closed `details` when find in page or a scroll-to-text fragment matches text inside it
(the "auto-expanding details" behaviour, Chromium 97+, inside the engine floor). Playwright cannot drive the browser's
own find bar, so the nearest faithful driver is a navigation to `#:~:text=<word>`, which runs the same find-and-reveal
path (FR-052).

**Measured.** A closed `details` in a shadow root, its panel text slotted from the light DOM, below a 3000 px spacer:
after navigating to `#:~:text=retention`, `details.open` was true and one native `toggle` (`newState: "open"`) had
fired. With the element's handler (R-02) this sets `open`, reflects it and fires one `ocelle-disclosure-toggle`. The
hiding of a closed panel is the platform's (`details` content is skipped, not `display: none`), so the element adds no
`display` rule to `.panel`: a `display: none` there would block the reveal. FR-008's observable is
`checkVisibility()` false for the panel's content, the content absent from the tab order and from the accessibility
tree (SPEC-2-02). The library's own overlay focus walk (`src/focusable.ts`) does not read `checkVisibility()`, so in
an `ocelle-dialog` or `ocelle-drawer` a closed panel's link still counts as a stop; that case is left to a separate op
(§ Repository-wide notes, PLAN-FRESH-2-002 (b)).

## R-09 Stories and baselines (FR-050, FR-051)

**Decision.** `storybook/stories/disclosure.stories.ts`: Closed, Open, Focused (declared focus state), Hovered
(declared hover state), LongSummary (288 px frame), ConsumerIcon, RightToLeft, Nested. `storybook/stories/
code-block.stories.ts`: Short, WrapLongLine (288 px frame), ScrollOverflowing, ScrollFitting, Digest, DigestWrapping
(288 px frame), DigestScroll, RightToLeft (a command with leading and trailing neutrals, shown left to right, R-06),
Empty (one line high by `.code`'s `min-block-size: 1lh`, R-06); added by the analysis fixes (E2), as
`ocelle-scroller` has them on the same module: ScrollMiddle and ScrollEnd (an overflowing scroll block scrolled to
half and to all of its range after render, fades at both ends and at the start only), ScrollFocused (declared focus
state, the module's ring on the scroll box), RightToLeftScroll. Light and dark baselines through `pnpm run visual:update` in #10's
pinned container under docker (`nohup dockerd`; after a container restart `pnpm run setup:online`); no podman
cross-check is possible in this environment, which each phase's review notes. Story-less, test-only: the unnamed
disclosure (axe fails it by design); a code block with a host `aria-label` in wrap mode (advised against,
SPEC-1-14). These are the Complexity Tracking row, approved at the tasks gate.

**The unnamed overflowing scroll block** (analysis D1, operator decision at the tasks gate). The claim that axe fails
it is unproven: `ocelle-scroller`'s `Unlabelled` story (`storybook/stories/scroller.stories.ts`) renders the same
module with no label and has no `storybook/a11y-exceptions.json` entry, and under the module's name rule an unnamed
box has no role. T021a measures it before T028: a scratch element rendering R-06's scroll structure through the
module, overflowing, with no `label` and no host `aria-label`, run through the `axe` gate's runner and rule set in
light and dark. If axe reports no serious or critical finding, T028 adds a `ScrollUnlabelled` story and the state
leaves the Complexity Tracking row. If it reports one, the run stops for the operator, the measured rule (id, impact,
target) is recorded here, and the state keeps the exception. Result: pending T021a.

## R-10 Tokens (FR-040)

**Decision.** No new token. Every value is an existing token: `color-inset`, `color-ink`, `color-hover-bg`,
`font-sans`, `figures`, `font-size-md`, `font-weight-medium`, `line-height-normal`,
`line-height-relaxed`, `measure-reading`, `space-1` to `space-3`, `radius-2`, `border-width`, `icon-size`, the focus
tokens and, through the module, `scroller-fade-size`. Code text is at `font-size-md`, the body size that 003's prose `pre` inherits, so a code block in prose matches a
prose `pre`.

## R-11 kitty-mission-ui inventory (FR-058; SPEC-2-01)

**Decision.** No inventory of disclosure or code-block class uses was supplied (the operator supplied 013's in
`specs/013-data-display/sources/013-inputs.md`, which names neither family). Without one, the README has no mapping
rows for these two and the plan gate asks the operator whether to supply one (Decisions for the plan gate). The
spec's "FR-048" in Consumers means FR-058 (SPEC-2-01); the reference was corrected by the analysis fixes (F3), the
first squad fix having left it.

## R-12 Sequencing against mission 019 (FR-060)

**Decision.** Phase 1 (disclosure) touches none of 019's files except the shared lists (`src/index.ts`,
`src/browser.ts`, `package.json` exports, `custom-elements.json`, README, CHANGELOG), which conflict mechanically.
Phase 2 starts with an operator stop task before its scaffold: the run reports whether 019 is on `main` and how 019
changed `src/overflow-region.ts`, and the operator decides how to proceed. Nothing in this plan merges `main`.

## Repository-wide notes for the orchestrator

A finding of this kind is recorded here and reported for a separate op, not fixed in this mission.

- **`ocelle-button`'s icon slot may expose a bare `<svg>`** (from squad round 1, PLAN-A11Y-SECURITY-1-003; not
  measured on `ocelle-button`). The slot convention allows a bare `<svg>` as a slotted icon (README § Slot convention)
  and `src/icon-slot.ts` adds no `aria-hidden`; in the disclosure probe a titled bare svg kept an `image` node and
  added its title to the control's name. `ocelle-button` (and any other icon-slot user) may have the same gap.
- **An `aria-hidden` wrapper in a shadow root does not keep slotted text out of a control's name** (phase 1 spike,
  T001, `reviews/phase-1/spike.md` § 1; measured in the repository's pinned Chromium 156.0.8078.4, not fixed here). A
  slotted bare `<svg><title>Folder</title>…</svg>` under `<span aria-hidden="true"><slot name="icon"></slot></span>`
  inside a shadow `summary` or `button` has no node of its own, but its title is still in the control's name computed
  from content ("Folder Advanced"); `aria-hidden` on the `slot` element itself, or `role="none"` beside it, changes
  nothing, while hidden text written in the shadow root itself, and the light-DOM equivalent, are left out. So the
  note above holds for `ocelle-button` even if an `aria-hidden` wrapper were added to its icon slot, and any element
  that relies on such a wrapper to keep a slotted icon out of a name (the slot convention's "Naming" rule) has the
  gap. Naming the control from its label wrapper by element reference (`ariaLabelledByElements`) gave the label text
  alone in the same measure.
- **A closed disclosure as the last control of an `ocelle-dialog` or `ocelle-drawer` lets Tab leave the overlay**
  (from squad round 2, PLAN-FRESH-2-002, operator decision (b): mission 008's modules are left unchanged here).
  `src/focusable.ts` `rendered()` (lines 52-53) checks only `getClientRects().length` and `visibility`; Chromium hides
  a closed `details` panel with content-visibility, so a link slotted into a closed panel keeps one client rect and
  `visibility: visible` while `checkVisibility()` is false (measured). The walk then counts it as the overlay's last
  stop, the summary becomes a middle stop, and `overlay.ts` `#tab` (710-744) lets a Tab from it run natively; nothing
  in the modal takes focus and it lands on the body (measured with a `showModal()` dialog). `#onFocusout` (757-761)
  repairs only a focus that leaves opaque content. The same holds today for a plain `details` in an overlay. The
  likely fix is `rendered()` also requiring `element.checkVisibility()` (Chromium 105+, inside the engine floor). The
  op writes, red first, a body in which a disclosure holding a link is the last control of an `ocelle-dialog`
  (closed panel), Tab from its summary wraps to the dialog's first stop, and a plant that removes the check. This
  mission adds no body for it (a known-failing body would need `skip` or an inverted assertion, which Principle VIII
  and the test-quality lint forbid); the README's disclosure section states the limitation.
- **`gate:plants -- --affected` does not map `packages/elements/package.json`** (phase 1, T013; measured, not fixed
  here). An element phase that adds an entry point changes the package's `exports`, and op 016's selection
  (`gates/lib/plant-runner.ts` `pathPlants`) classes that path as "not mapped", so the local run selects every plant
  (`note: affected: every plant, by packages/elements/package.json (not mapped)`), about 250 plants and some hours
  here, where the element source and manifest beside it select only the repository-content and manifest plants. A
  separate op could class `packages/<name>/package.json` with the repository content it describes.
