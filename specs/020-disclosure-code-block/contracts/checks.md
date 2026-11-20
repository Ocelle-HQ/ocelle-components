# Contract: the checks this feature adds or extends

No gate is added or changed. Every existing gate runs on the new source, stories and built output.

## Scenario bodies and harnesses (FR-052)

| Element | Scenario file | In-process test (mutated) | Fixture test (built browser build, strict CSP) | Fixture page |
|---|---|---|---|---|
| disclosure | `packages/elements/test/scenarios/disclosure.ts` | `test/disclosure.test.ts` | `test/browser/disclosure.test.ts` | `test/browser/fixtures/disclosure.html` |
| code block | `test/scenarios/code-block.ts` | `test/code-block.test.ts` | `test/browser/code-block.test.ts` | `test/browser/fixtures/code-block.html` |

Entry tests `test/entry-disclosure.test.ts` and `test/entry-code-block.test.ts` (importing the module defines that tag
and, for the disclosure, `ocelle-icon`; no other).

- **One body per scenario** (`US1-7a` style for the parts of US1-7), each with an assertion that can fail, plus one
  body per FR or edge case that has no scenario (SPEC-2-06): marker not shown (FR-003), a panel click does not toggle
  (FR-004), the 24 × 24 target (FR-014), the leading newline (FR-020), `overflow` value parsing (FR-022), the run-time
  switch (FR-025), host `aria-label` over `label` (FR-026), prefix only and several colons (FR-029), nested
  disclosures, the empty block, focus out of a closing panel (FR-013), `:state(open)` (FR-011). Added by squad round
  1:
  - the host is a block box: computed `display` `block`, its border box containing the summary and the open panel
    (FR-003, PLAN-CORRECTNESS-1-006);
  - US1-22: a pointer click on plain text near the end of a tall, scrolled, open panel, then Space: the shadow root's
    active element is not the summary, `scrollY` is unchanged, the disclosure is open, 0 events, followed by a summary
    click counted as 1 (FR-003, PLAN-FRESH-1-001 (a)); red with `delegatesFocus`;
  - US1-17 with a bare `<svg slot="icon"><title>Folder</title>…</svg>`: the summary's name is the summary text alone
    and no `image` node exists under it (PLAN-A11Y-SECURITY-1-003);
  - US1-19 in three bodies: focus on a light-DOM link, on an `ocelle-button` in the panel, and on a nested
    disclosure's summary, each closed by `open = false`, asserting the outer summary is the shadow root's active
    element and the host is `document.activeElement` (PLAN-CORRECTNESS-1-002);
  - US1-23: host `aria-expanded` `"true"`, `"false"` and another value, each with the state, the event count and the
    attribute's removal; and at upgrade, `<ocelle-disclosure open aria-expanded="false">` renders closed with no event
    (PLAN-CORRECTNESS-1-008 (a));
  - markup-like text stays text, in wrap and in digest mode: escaped `<b>x</b>` and `<img/src=x/onerror=alert(1)>` in
    the source; the shadow root has no `b` or `img` element and the shown text equals those characters
    (PLAN-A11Y-SECURITY-1-005);
  - US2-16's observer options: a `characterData` change of the host's text node (`driver.text`) and of a text node
    inside a child `<b>` (`driver.textData` on it), each asserting the shown copy and, in digest mode, the groups
    follow (PLAN-TESTABILITY-1-008);
  - FR-029's code points: `x:ab😀cdef` gives the prefix `x:` and the groups `ab😀c`, `def`, with no lone surrogate in
    any group's text (PLAN-TESTABILITY-1-009 (a));
  - FR-025's switch with focus: `overflow` from `scroll` to wrap with the scroll box focused; `document.activeElement`
    is the host, the shadow root's active element is `.block`, and after focus leaves `.block` has no `tabindex`
    (PLAN-CORRECTNESS-1-010 (b));
  - US2-8's visual order: under an `rtl` ancestor, `--force main.` reads `--force main.` in visual order (the text
    boxes sorted by their left edge), in wrap and in scroll mode (PLAN-FRESH-1-002 (a));
  - US2-12 with a base64url digest (groups holding `-`) and a base64 one (`/`), swept over `pre` widths from 60 to
    300 px: every group has one rect and every line's first unit starts at the `pre`'s content-box inline start
    (PLAN-CORRECTNESS-1-004, PLAN-FRESH-1-005).
- **"Does not" outcomes are paired** with a positive outcome in the same body (no event and the state unchanged; not
  a tab stop and the text shown; no toggle on a panel click and the click reaching a `document` listener).
- **Event counts** are read after the element's `updateComplete` and then the driver's `settle()` (two animation
  frames, then every element's `updateComplete`), never immediately and never after a bare `setTimeout(0)`, which can
  run before the native `toggle` task (R-02, PLAN-TESTABILITY-1-004). Every body whose count is 0 ends with a positive
  control under the same wait: one more change, counted as exactly 1.
- **Red per body.** Each phase has a scaffold commit (`scaffold.sh`): the module with `define`, `@tagname`, declared
  properties and an empty `render()`, its exports in `src/index.ts`, `src/browser.ts` and `package.json`; no test file.
  The red log is checked per body.

## Bodies the platform alone could pass

| Body | Outcome the platform gives anyway | Assertion only the element gives |
|---|---|---|
| US1-4 (Enter and Space) | native `summary` keys | the host attribute and the `ocelle-disclosure-toggle` count |
| US1-5 (tab into the panel) | light-DOM link order | the link is laid out below the summary inside the host and is unreachable while closed |
| US1-10 (find in page) | native reveal | `open` reflected on the host and one event |
| US2-10 (copy) | a plain text node copies unbroken | the digest is rendered as units with the gap (rects and margins asserted in the same body) |
| US2-11 (AX text) | one text node reads unbroken | the same, units asserted |
| US2-3 (wrap at 288 px) | `base.css` would wrap a light `pre` | the shadow `pre`'s computed font family is the token's sans, and the ground is `color-inset` |
| US1-7a (closed, true then false: closed, 0 events) | a reflected Boolean with an empty render ends closed and fires nothing | the summary is in the AX tree with `expanded` false; then a summary click counted as exactly 1 |
| US1-7b (open, false then true: open, 0 events) | a reflected Boolean ends open and fires nothing | the summary is in the AX tree with `expanded` true and the panel's link visible and in the tab order; then a summary click counted as exactly 1 |
| US1-6's second set, US1-9 (upgrade), US1-20's dispatched click, US1-22, US1-23's other value, and any body whose only check is "no event" | no element, no event | an element-only reading of the state (summary AX `expanded`, panel visibility) and a final positive toggle counted as exactly 1 (PLAN-TESTABILITY-1-003) |

## Oracles

- **Accessibility tree:** CDP `Accessibility.getFullAXTree` (role, name, `expanded`; the StaticText concatenation
  under the block's node) through the driver's `ax` and `axSubtree`, and `ariaSnapshot(id, inner)` (§ Driver
  additions) of the shadow `pre` (`part="code"`), asserted equal to `- text: <trimmed digest>`, never of the host,
  whose snapshot includes its unslotted light-DOM text (R-07, PLAN-TESTABILITY-1-001 (a)).
- **Copy:** `copyShadow` and `copyShadowRun` (§ Driver additions), never `clipboardCopy`, which selects the unrendered
  light DOM (PLAN-FRESH-1-004). The whole-block copy equals the trimmed digest plus one `\n`; a run of groups equals
  its characters exactly (R-07, PLAN-TESTABILITY-1-002 (b)); fallback named in R-07.
- **Find in page:** `findText(word)`, a navigation to `#:~:text=` in both harnesses (R-08, § Driver additions).
- **Break positions:** `getClientRects().length === 1` per group, distinct line tops, and every line's first unit at
  the `pre`'s content-box inline start (R-07).
- **Forced colours (US1-15; PLAN-TESTABILITY-1-011, PLAN-A11Y-SECURITY-1-004 (a)):** under `forcedColors("active")`,
  the summary's computed `color` equals `resolveColour("CanvasText")` and its `background-color`
  `resolveColour("Canvas")`, the chevron's painted pixels (`paints`) are in that colour, and the focused summary's
  outline colour equals `resolveColour("Highlight")`, closed and open.
- **Right to left (US1-11):** the chevron's painted x-extent (`paints`) under `dir("rtl")` is the mirror of its extent
  under `ltr` about the icon box's centre, and its `box` is at the summary's inline start (the right edge side).
- **First-line icon (US1-16):** the slot convention's existing measure (`test/scenarios/slot.ts`): the icon's box
  centred on the first line box of the summary label (`lines`), with the label wrapped to more than one line.
- **Empty block (US2-19):** the block size equals one computed `line-height` of `.code` plus `.block`'s padding and
  border, in wrap and in scroll mode (R-06).
- **No monospace:** the computed `font-family` of the host, `.code` and every unit equals the computed
  `--ocelle-font-sans` value.
- **Motion:** no running `getAnimations()` on the element's shadow nodes after a toggle, with and without reduced
  motion; no `transition-duration` other than `0s` on the summary, panel and chevron. Each motion body toggles with a
  pointer click on the summary (so a hover transition would start), asserts the toggle's positive outcome (the new
  state and exactly one event) in the same body, and takes the reading one frame after the toggle, inside a 200 ms
  transition's duration (PLAN-TESTABILITY-1-007).
- **Reflow:** page `scrollWidth === innerWidth` at 320 px.

## Plants (CSS-only behaviour Stryker does not mutate)

| Plant | Guards | Test that must fail |
|---|---|---|
| chevron box rule removed | the fallback chevron is `--ocelle-icon-size` square (R-01) | FR-005 size body |
| `list-style: none` removed | marker not shown (FR-003) | FR-003 body |
| hover background removed | hover state (FR-014) | hover body |
| `.code` `font-family` removed | no monospace in the shadow `pre` (FR-021) | US2-1 |
| `pre-wrap` replaced by `pre` in wrap mode | wrap policy (FR-023) | US2-3 |
| `max-inline-size` removed | the reading cap (FR-021) | US2-2 |
| digest gap removed | the gap (FR-030) | US2-9 |
| transparent border removed | forced-colours edge (FR-034) | US2-17 |
| `:host { display: block }` removed (disclosure) | the host is a block box (FR-003) | host display body |
| `delegatesFocus: true` restored on the disclosure's root | a click on panel content moves no focus (FR-003) | US1-22 |
| `aria-hidden="true"` removed from the icon wrapper | a slotted bare svg is decorative (FR-005) | US1-17 (bare svg) |
| forced-colours `summary.control` pair removed | the summary's system pair (FR-016) | US1-15 |
| `ocelle-icon`'s RTL mirror rule removed | the chevron mirrors (FR-005) | US1-11 |
| `transition: background-color 200ms` on the summary | no motion (FR-015) | US1-14 |
| a 200 ms `transition` on the chevron | no motion (FR-015) | US1-14 |
| `white-space: nowrap` removed from the groups | no break inside a group (FR-033) | US2-12 base64url body |
| gap moved back to `margin-inline-start` on the unit after each `wbr` | no gap at a line's start (FR-030) | US2-12 line-start assertion |
| `.code { min-block-size: 1lh }` removed | the empty block's one line (US2-19) | US2-19 |
| `.block { direction: ltr }` removed | code shown left to right (FR-021) | US2-8 visual order |

Plants are run as earlier missions run them (005, 009, 011, 012, 013; 013 `reviews/phase-1/plants.md`): once per
phase, against the green source, each source edit applied in a scratch copy, its guarding body run in process (and in
the fixture harness where the body is fixture-only), the file restored, and the result (bites or not) recorded in
`reviews/phase-N/plants.md` before the phase review. No plant is committed; `gates/plants/` and `gate:plants`, which
judge a gate's own verdict, are not used for them (PLAN-CORRECTNESS-1-007).

## Driver additions (PLAN-FRESH-1-004, PLAN-TESTABILITY-1-005)

`test/scenarios/driver.ts` has none of these. Each is added to the `Driver` interface, implemented in
`test/in-process.ts` and `test/browser/driver.ts`, and tested on its own in the driver tests, in the red commit of the
phase that first uses it, before that phase's element bodies:

| Addition | What it does | Phase |
|---|---|---|
| `findText(word)` | a same-document navigation to a fresh `#:~:text=<word>` per call (the in-process harness's iframe allows it, measured), then waits for every element to render; its test opens a closed shadow `details` with slotted text | 1 |
| `setProperties(id, name, values)` | sets the property to each value in order, all in one task, with no settle between or after (US1-7); its test counts the native `toggle` events of a plain `details` for `[true, false]` | 1 |
| `copyShadow(id, inner)` | clears the clipboard to a sentinel, triple-clicks the first shadow element matching `inner` of the element `id`, presses the platform copy shortcut with clipboard permissions, returns `navigator.clipboard.readText()`; its test copies a shadow `pre` and fails on the sentinel | 2 |
| `copyShadowRun(id, inner, from, to)` | clears the clipboard to a sentinel, selects the child nodes `from` to `to` of the shadow element matching `inner` (`setBaseAndExtent`), copies and returns the clipboard text; its test copies two spans of a shadow `pre` | 2 |
| `ariaSnapshot(id, inner)` | Playwright's `ariaSnapshot` of the first shadow element matching `inner` of the element `id` (in process, the same through the Vitest browser command); its test tells a shadow `pre` from its host's light text | 2 |

## Gates touched

`manifest` (two entries), `csp` (two fixture pages), `prefix`, `style-lint`, `contrast` (no new pair: ink on inset
and on hover-bg are existing rows; the plan's squad checks it), `mutation` (op 015's shards), `storybook-build`,
`visual` (baselines), `axe`. No gate code changes.
