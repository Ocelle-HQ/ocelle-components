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
  - US1-22: a pointer click on plain text near the end of a tall, scrolled, open panel: `scrollY` read before and
    after the click is unchanged; then Space: the disclosure is open, the shadow root's active element is not the
    summary, 0 events, followed by a summary click counted as 1 (FR-003, PLAN-FRESH-1-001 (a)); `scrollY` is not read
    after Space, which pages the document when focus is on the body (PLAN-FRESH-2-004); red with `delegatesFocus`;
  - US1-17 with a bare `<svg slot="icon"><title>Folder</title>…</svg>`: the summary's name is the summary text alone
    and no `image` node exists under it (PLAN-A11Y-SECURITY-1-003); read from the CDP tree, not `ariaSnapshot`,
    which reads the summary text alone even when the title leaks (phase 1 spike, `reviews/phase-1/spike.md` § 1);
  - the summary's name from `.label` (FR-006; phase 1 operator decision (a), research R-01, R-03): with no host
    label, the summary's `ariaLabelledByElements` is the one `.label` wrapper and the CDP name is the summary text
    alone; a host `aria-label` (at upgrade and set later) clears it (`ariaLabelledByElements` empty or `null`) and
    names the summary; a host `aria-labelledby` set beside it wins (its resolved list, its text the name); removing
    each in turn restores `aria-label`, then the `.label` reference and the summary text; an empty summary with no
    host label has the `.label` reference and an empty CDP name (Edge Cases);
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
  - FR-025's switch with focus, two bodies: `overflow` from `scroll` to wrap with the scroll box focused; and, as
    US2-21, overflow ended while the box was focused (focus on `.region-frame`), then the switch to wrap
    (PLAN-FRESH-2-003). Each asserts `document.activeElement` is the host, the shadow root's active element is
    `.block`, `.block`'s computed `outline-style` is `solid`, its `outline-width` the computed `--ocelle-focus-width`
    and its `outline-color` the computed `--ocelle-color-focus` (`resolveColour("Highlight")` under
    `forcedColors("active")`, PLAN-FRESH-2-005 (a)), and after focus leaves `.block` has no `tabindex`
    (PLAN-CORRECTNESS-1-010 (b));
  - US2-8's visual order: under an `rtl` ancestor, `--force main.` reads `--force main.` in visual order (the text
    boxes sorted by their left edge), in wrap and in scroll mode (PLAN-FRESH-1-002 (a));
  - US2-8's line starts: under an `rtl` ancestor, an overflowing scroll block at rest holding a short line, a line
    longer than the box and a second short line (`cd /srv/app`, a long `docker compose …` command, `ls`): `.block`
    and `.region-box` compute `direction: rtl`; for every line, the rect of its first character (a `Range` over the
    first code point of the line's text in the shadow `pre`) lies inside the box's rect on the inline axis; the box's
    `scrollLeft` is `-(scrollWidth - clientWidth)` within 1 px; `data-fade` is `start`; and the box's computed
    `mask-image` is the gradient transparent at the right edge (`to left, transparent, …`). A second body changes the
    text to new overflowing lines and asserts the same of the new lines; a third, under an `ltr` ancestor, asserts
    `scrollLeft` 0, every first character inside the box and `data-fade` `end` (the write is `rtl` only)
    (PLAN-FRESH-2-001 (a), PLAN-FRESH-3-001 (a));
  - US2-12 with a base64url digest (groups holding `-`) and a base64 one (`/`), swept over `pre` widths from 60 to
    300 px: every group has one rect and every line's first unit starts at the `pre`'s content-box inline start
    (PLAN-CORRECTNESS-1-004, PLAN-FRESH-1-005). The base64url body is the one that guards the groups' `nowrap` (the
    plant below): without `nowrap` its `L-qg` group splits. The base64 body does not guard it (its `/` ends the group
    `FaO/` at a `<wbr>` and `+` is no break opportunity, so no group splits without `nowrap`; phase 2 spike,
    research R-07) and is kept as the second alphabet's break-position reading. The sweep strings (analysis A1) are
    the SHA-256 of `test` with the prefix `sha256:` (7 code points):
    - base64url, 43 code points after the prefix, 11 groups (`L-qg` holds `-`):
      `sha256:n4bQgYhMfWWaL-qgxVrQFaO_TxsrC4Is0V1sFbDwCgg`;
    - base64, 44 code points after the prefix, 11 groups (`FaO/` holds `/`):
      `sha256:n4bQgYhMfWWaL+qgxVrQFaO/TxsrC4Is0V1sFbDwCgg=`.

    At each width the body also asserts: the prefix has one rect where its inline size (its rect's width read at
    300 px, where it fits) plus the computed `--ocelle-space-1` in px (its gap, which counts toward fitting the line)
    is at most the `pre`'s content-box inline size, and is not asserted elsewhere (phase 2 operator decision Q2 (c),
    research R-07); the block
    holds more than one line (distinct line tops) where the digest's inline size (the units' widths at 300 px plus
    one `--ocelle-space-1` gap per adjacent pair) is wider than the content box, and one line elsewhere; and the page
    scroll width equals the viewport width;
  - US2-12's wide prefix (analysis C1): `ni:sha-256:` followed by the base64url string above, at a `pre` width of
    60 px: the prefix is wider than the line and has more than one rect (it breaks inside, WCAG 1.4.10), every group
    has one rect, and the page scroll width equals the viewport width; paired at 300 px with the prefix at one rect;
  - US2-6's handover when the block widens again while focused is asserted with US2-21's oracle (focus on
    `.region-frame`, `document.activeElement` the host); US2-21 is the oracle, US2-6 refers to it (analysis B1);
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
  light DOM (PLAN-FRESH-1-004). The whole-block copy has two bodies (phase 2 operator decision Q1 (c), R-07): with
  the block the last content of the page, it equals the trimmed digest exactly; with a `<p>` after the block, it
  equals the trimmed digest plus one `\n`. A run of groups equals its characters exactly (R-07,
  PLAN-TESTABILITY-1-002 (b)); fallback named in R-07.
- **Find in page:** `findText(word)`, a navigation to `#:~:text=` in both harnesses (R-08, § Driver additions).
- **Break positions:** `getClientRects().length === 1` per group; the same for the prefix only where it and its gap
  fit the line (its inline size plus `--ocelle-space-1` at most the `pre`'s content box; a prefix that with its gap
  is wider than the line breaks inside, FR-033, R-07); distinct line tops where the digest is wider than
  the `pre`'s content box; every line's first unit at the `pre`'s content-box inline start (R-07). US2-12's oracle is
  this one and the sweep above, not a reading of US2-12's prose.
- **Closed panel (FR-008, US1-1, US1-3, US1-5; analysis F2):** for the panel's slotted content, `checkVisibility()`
  is false, the content is absent from the tab order (Tab from the summary leaves the host) and from the CDP tree;
  while open, `checkVisibility()` is true and the content is in both. `getClientRects().length` and `visibility` are
  not used: Chromium skips a closed panel by content-visibility, so its content keeps a rect (R-08).
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
- **No monospace:** the computed `font-family` of `.code` and every unit equals the computed `--ocelle-font-sans`
  value. The host is not read: it shows no text of its own and `:host` sets no font, so its computed family is the
  page's (phase 2 spike § 4, research R-06).
- **Motion:** no running `getAnimations()` on the element's shadow nodes after a toggle, with and without reduced
  motion; no `transition-duration` other than `0s` on the summary, panel and chevron. Each motion body toggles with a
  pointer click on the summary (so a hover transition would start), asserts the toggle's positive outcome (the new
  state and exactly one event) in the same body, and takes the reading one frame after the toggle, inside a 200 ms
  transition's duration (PLAN-TESTABILITY-1-007).
- **Reflow:** page `scrollWidth === innerWidth` at 320 px.

## Story tests (FR-050, SC-002, SC-005, SC-006; analysis E1)

The story-test extension under `storybook/test/` lists each phase's stories, as the existing per-mission extensions
do (`storybook/test/integration/elements-stories.test.ts`), and runs these checks on every story it lists, light and
dark where the check reads the look:

| Check | Stories | Reading |
|---|---|---|
| defined and rendered, no request outside the origin | every story | as the existing extensions |
| named summary | every disclosure story | the summary's CDP node has a non-empty name |
| reflow (SC-002) | `LongSummary`; every wrap-mode code-block story (`Short`, `WrapLongLine`, `Digest`, `DigestWrapping`, `RightToLeft`, `Empty`) | at a 320 px viewport, `document.documentElement.scrollWidth` is 320, beside the element's box wider than 0 |
| keyboard (SC-005) | every disclosure story; every overflowing scroll story (`ScrollOverflowing`, `ScrollMiddle`, `ScrollEnd`, `ScrollFocused`, `DigestScroll`, `RightToLeftScroll`, and `ScrollUnlabelled` if T021a adds it) | with no pointer event: Tab focuses the (first) summary, Enter toggles it (host `open` flips), Space toggles it back; Tab focuses the scroll box, and the arrow key towards the hidden end, pressed until the position stops changing, brings `abs(scrollLeft)` to `scrollWidth - clientWidth` within 1 px, and the opposite key brings it back to its start |
| no animation (SC-006) | every story | on a fresh load, within 1400 ms of the first render, under `prefers-reduced-motion: reduce` and under `no-preference` (`matchMedia` asserted in the same body), `document.getAnimations()` has no running animation; for each disclosure story, also one frame after a pointer click on the summary, paired with the toggled state |

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
| `.code { direction: ltr }` removed | code shown left to right (FR-021) | US2-8 visual order |
| `direction: ltr` moved from `.code` to `.block` | the block keeps the page direction, fade on the hidden side (FR-021, FR-024) | US2-8 line starts |
| the element's `rtl` opening `scrollTo` removed | an `rtl` scroll block opens at the line starts, fade at the right (FR-021) | US2-8 line starts |
| `.block:focus-visible` ring removed | the block's token ring after a switch (FR-025) | FR-025 switch bodies |

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
