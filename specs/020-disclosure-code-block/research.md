# Research: Disclosure and Code Block

Phase 0 of `/speckit-plan` for `specs/020-disclosure-code-block`. Each entry: decision, rationale, alternatives. The
measures marked **measured** were made on 2026-11-20 in this session's Chromium (157.0.8103.78, headless, Playwright
pre-installed), on throwaway pages outside the repository; each is re-run as a test of the phase that relies on it,
under the repository's pinned browser, before green. A measure that fails there stops the run for the operator (spec
FR-010, FR-031, FR-032).

## R-01 Disclosure structure (spec FR-003 to FR-008; operator clarify 1)

**Decision.** The shadow root (open, `delegatesFocus`) renders:

```html
<details part="details">
  <summary class="control" part="summary"><span class="icon-row"><span class="icon-slot"><slot name="icon"><ocelle-icon class="chevron" name="chevron-end | chevron-down"></ocelle-icon></slot></span><span class="label"><slot name="summary"></slot></span></span></summary>
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
  Icons). Unlabelled, `ocelle-icon` is hidden from assistive technology (`aria-hidden="true"` on its svg, no name), so
  the chevron and a consumer `ocelle-icon` without `label` are decorative. The README tells consumers never to label
  a slotted icon (slot convention, Naming).
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
operator.

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
- Coalescing follows from the platform: a property changed twice in one task is rendered once by Lit (a microtask),
  so `details.open` changes at most once; the native `toggle` is queued as a task and merged by the platform's toggle
  task tracker. A native `toggle` whose final state equals the reported state (oldState equal to newState) fires no
  `ocelle-disclosure-toggle`, which is the spec's stricter rule (SPEC-1-06). The three cases of US1-7 give 0, 0 and 1
  event.
- A morph that keeps `open` changes nothing and fires none; one that removes it closes the disclosure and fires one
  event with `open: false` (SPEC-2-05, US1-8). The tests count after the next task and `updateComplete`.
- **Focus out of a closing panel (FR-013).** In `willUpdate`, when `open` goes from true to false, the element notes
  whether the deep active element (`focusable.ts`'s `deepActive()`) is inside the host but not in the summary; in
  `updated` it then focuses the summary. A user close always starts from the summary, so this only acts on script and
  morph closes.

**Rationale.** It matches native `details` (the attribute is the state) and htmx: the server's attribute wins on a
morph, which is what the operator chose.

**Alternatives.** A cancellable request event (rejected at clarify 2); dispatching from `updated` (rejected: it would
fire for the initial state and for property sets the native element coalesces).

## R-03 Host ARIA, name and clicks (FR-006, FR-007, FR-004; SPEC-1-13, SPEC-2-09)

**Decision.**

- `MovedAttributes` (`src/control.ts`) with `aria-label`, `aria-labelledby`, `aria-describedby` and `title`: the
  summary gets `aria-label` and `title` as attributes, and `ariaLabelledByElements` and `ariaDescribedByElements` from
  `resolveIds`, re-resolved on connect, as `ocelle-button` does. The mirrors and the manifest's `@attr` entries follow
  the control conventions. The native name order (labelledby, aria-label, content) gives FR-006 with no code of ours.
- A host `aria-expanded` is not moved: `open` is the state and the summary exposes it natively. A host
  `aria-expanded` stays on the host, unsupported, as any unlisted `aria-*`; the README tells consumers to use `open`.
  This departs from constitution III's list ("aria-expanded … reaches the real inner control"); it is recorded in
  Complexity Tracking for the operator (SPEC-2-09).
- `element.click()` is overridden to click the summary, so it toggles once (FR-004). The element does **not** use
  `guardHost`: the panel holds the consumer's content, whose clicks must reach the page's listeners. A click
  dispatched on the host itself does not pass through the summary and the native element ignores it, so it toggles
  nothing, with no guard. This departs from control conventions rule 1's guard, which assumes the host holds only the
  control; the README section says so.

## R-04 Look of the disclosure (FR-014 to FR-016; SPEC-1-09)

**Decision.** Tokens: summary `font-size-md`, `font-weight-medium`, `line-height-normal`, `color-ink`; block padding
`space-1`, inline padding `space-1`, `radius-2`; hover `background-color: var(--ocelle-color-hover-bg)` inside
`@media not (forced-colors: active)`; cursor `pointer`. Panel: `padding-block-start: var(--ocelle-space-2)`,
`padding-inline-start: calc(var(--ocelle-icon-size) + var(--ocelle-space-2) + var(--ocelle-space-1))`, so panel text
starts under the summary label. The focus ring and forced colours come from `controlStyles` (`.control`). No
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
the `pre`, because it would be shown.

- **Leading newline.** A newline directly after the opening tag is part of `textContent` and is shown (the HTML
  parser drops it only for `pre`, `listing` and `textarea`). US2's leading-newline body asserts the shown first line
  is empty, and the README tells templates to start the text on the tag's line.
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
  `var(--ocelle-border-width) solid transparent` border, which forced colours paint in `CanvasText` (FR-034). `.code`
  has `margin: 0`, `font-family: var(--ocelle-font-sans)`, `font-variant-numeric: var(--ocelle-figures)`,
  `font-size: var(--ocelle-font-size-md)` (the body size, as 003's prose `pre` inherits it), `line-height: var(--ocelle-line-height-relaxed)`, `white-space: pre-wrap`,
  `overflow-wrap: anywhere`. The `pre` sets its own font family: `base.css`'s rule does not reach a shadow root and the
  user agent gives `pre` monospace.
- Scroll mode (`overflow` trimmed and lower-cased equals `scroll`) renders the module's structure inside `.block`:
  `.region-frame > .region-box[data-fade] > .region-track > pre.code` with the ring and the two edges, as the contract
  shows, `white-space: pre` on `.code`. The controller is created once in the constructor with `box: () =>
  this.renderRoot.querySelector(".region-box")`; in wrap mode `box()` is null, so the module follows no box and writes
  nothing (its `hostUpdated` releases a box that went away and removes its `tabindex`, `role` and `aria-label`; the
  box node itself is gone with the scroll template), which gives FR-025 on a switch. The module's per-instance sheet is
  adopted in both modes; in wrap mode its one rule matches nothing.
- `label` passed through `setLabel(this.label)` in `updated()`; `aria-label` in `observedAttributes` with
  `requestUpdate()` on change, exactly as `ocelle-scroller` does.
- The module's `slotchange` trigger never fires (no slot). A text change re-renders the `pre`; the track's size
  changes, and the module's `ResizeObserver` on the track sees it (contract § When the state updates). A change that
  keeps the track's size (same line lengths) changes no overflow state either. The focus handover finds no focusable
  slotted element and focuses `.region-frame` (contract, Focus handover).
- No module option of mission 019 (`blockAxis`, `blockStartBox`) is set, and 019's R-17 is not needed: nothing is
  pinned at the inline start.

**Measured.** None yet for the module path: it is the scroller's, tested by 009. Phase 2's bodies prove the code
block's use of it (US2-4 to US2-8).

## R-07 Digest rendering (FR-028 to FR-033; operator clarify 4; SPEC-1-03, SPEC-1-04, SPEC-1-12, SPEC-2-03, SPEC-2-08)

**Decision.** In digest mode the trimmed text, when it holds no whitespace, is split into code points
(`Array.from`), the prefix runs to and includes the last `:`, and the rest is cut into groups of four from the start.
They render as inline spans joined by `<wbr>`:

```html
<pre class="code digest" part="code"><span class="prefix">sha256:</span><wbr><span class="group">9f86</span><wbr><span class="group">d081</span>…</pre>
```

with `.digest > wbr + span { margin-inline-start: var(--ocelle-space-1) }`: every unit after a `wbr` gets the gap, so
the first unit, prefix or group, has none (the test asserts the gap per adjacent pair). The wrap
mode keeps `white-space: pre-wrap; overflow-wrap: anywhere`; the scroll mode `white-space: pre`.

- **Break positions.** `<wbr>` is the only break opportunity between groups (hex has none of its own). With
  `overflow-wrap: anywhere`, a unit breaks inside only when it alone is wider than the line, so a group (four
  characters) never breaks at any width the block can have, and a long prefix in a very narrow block breaks anywhere,
  which keeps WCAG 1.4.10 (SPEC-2-08). FR-033's rule becomes: breaks fall between units; a unit wider than the line
  breaks anywhere inside, as FR-023. The README digest rule says the same.
- **Copy.** The `wbr` and the margins add no character.
- **Accessibility text.** Adjacent inline spans are one text run.

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

**Copy driver.** Ctrl+C with `clipboard-read` and `clipboard-write` granted, then `navigator.clipboard.readText()`,
works in headless Chromium. If the repository's pinned browser or harness refuses the permission, the nearest driver
is `document.execCommand("copy")` with a `copy` listener reading `getData` of the default action, recorded as a gap
(FR-052).

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
tree (SPEC-2-02).

## R-09 Stories and baselines (FR-050, FR-051)

**Decision.** `storybook/stories/disclosure.stories.ts`: Closed, Open, Focused (declared focus state), Hovered
(declared hover state), LongSummary (288 px frame), ConsumerIcon, RightToLeft, Nested. `storybook/stories/
code-block.stories.ts`: Short, WrapLongLine (288 px frame), ScrollOverflowing, ScrollFitting, Digest, DigestWrapping
(288 px frame), DigestScroll, RightToLeft, Empty. Light and dark baselines through `pnpm run visual:update` in #10's
pinned container under docker (`nohup dockerd`; after a container restart `pnpm run setup:online`); no podman
cross-check is possible in this environment, which each phase's review notes. Story-less, test-only: the unnamed
disclosure and the unnamed overflowing scroll block (axe fails both by design); a code block with a host `aria-label`
in wrap mode (advised against, SPEC-1-14). These are the Complexity Tracking row.

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
spec's "FR-048" in Consumers means FR-058 (SPEC-2-01); the planner corrects the reference at the first squad fix.

## R-12 Sequencing against mission 019 (FR-060)

**Decision.** Phase 1 (disclosure) touches none of 019's files except the shared lists (`src/index.ts`,
`src/browser.ts`, `package.json` exports, `custom-elements.json`, README, CHANGELOG), which conflict mechanically.
Phase 2 starts with an operator stop task before its scaffold: the run reports whether 019 is on `main` and how 019
changed `src/overflow-region.ts`, and the operator decides how to proceed. Nothing in this plan merges `main`.

## Repository-wide notes for the orchestrator

None found so far. A finding of this kind is recorded here and reported for a separate op, not fixed in this mission.
