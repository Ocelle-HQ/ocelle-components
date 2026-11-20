# Feature Specification: Disclosure and Code Block (the last of #13)

**Feature Branch**: `020-disclosure-code-block` (work happens on `claude/013-disclosure-code-block`)

**Created**: 2026-11-20

**Status**: Draft

**Input**: User description: "Mission for the last two elements of #13 (triage/020-disclosure-code-block.md;
triage/019-data-display-follow-on.md option B, approved 2026-11-15), spec directory specs/020-disclosure-code-block:
in @ocelle/elements, following README § Element conventions, § Control conventions, § Slot convention (with 012's
plan decision 33: the .label wrapper and the bare modifier) and § Host ARIA as on main, no monospace, Schibsted
Grotesk with --ocelle-figures, and no element of missions 013 or 019 changed; (P1) ocelle-disclosure, the Desktop V2
disclosure (#470) on native details/summary semantics in the shadow root or an equivalent button with aria-expanded,
an open state settable by attribute and property that survives htmx swaps, one ocelle-disclosure-* toggle event with
its payload (the native toggle event is not composed), host ARIA reaching the inner control, the chevron icons of #17
(chevron-end collapsed, chevron-down expanded) through the icon slot convention, inline with no overlay, no animation
under reduced motion; (P2) ocelle-code-block, a preformatted block on --ocelle-color-inset in the sans with tabular
figures, --ocelle-line-height-relaxed and a --ocelle-measure-reading cap, a wrap policy by default (003's pre-wrap,
WCAG 1.4.10 at 320 px) and a sideways-scroll policy that uses 009's overflow-region module exactly as its contract
states (pre inside .region-track, role group, setLabel, inline axis only; neither 019's block-axis option nor 019's
R-17 mask-exclusion request is needed or built), and a digest display mode in groups of four whose copied text and
screen-reader reading stay the unbroken digest, recorded as a README convention #14's copy field can reuse; no
clipboard I/O, no syntax highlighting; new tokens only where none fits; done when #7's checklist holds for each
element (a story per variant and state with light and dark baselines through #10's gates, interaction tests for every
event and payload, keyboard and screen-reader tests, axe with no serious or critical finding, manifest entries,
strict-CSP check) plus a 320 px reflow test for the code block; settle at clarify the questions this record lists
(disclosure basis and whether it follows the control conventions, open-state ownership, code-block content model,
default policy, digest rendering), and order the phases as the operator's answer to Q1 says (P1 disclosure is
implemented on main as it is; before P2's red step the run stops and asks the operator how to proceed against mission
019; main is never merged during the run)."

**Issues**: #13, items 6 to 8 (triage record `triage/020-disclosure-code-block.md`, approved by the operator on
2026-11-20). Items 1 and 2 are mission 013's (on `main`), items 3 to 5 mission 019's (`specs/019-data-records`, in
progress on `claude/013-data-display-2`). #13 closes when 019 and this mission have both landed. GitHub could not be
read from the triage session: #13's text is the copy recorded on 2026-11-13, and the spec-kitty-design issues #470
(Desktop V2 disclosure) and #520 (code block scroll region) were not read. A requirement they add, read later, goes to
the operator. The operator chose to plan on the recorded copy as it is (SPEC-1-05, below).

**Consumers** (constitution VI): kitty-mission-ui (Kitty Desktop and Kitty Dashboard) and the Ocelle web console, in
server-rendered pages under a strict CSP with htmx swaps. No kitty-mission-ui inventory of disclosure or code-block
class uses was supplied for this mission; the plan's research records whether one exists (see FR-058).

**Operator decisions while specifying** (2026-11-20, human:jeroennouwsdev):

- Sequencing against mission 019 (triage Q1, reworded): design both elements now; P1 (`ocelle-disclosure`) is
  implemented on `main` as it is; before P2's red step the run stops and asks the operator how to proceed against 019,
  landed or not. `main` is not merged during the run.
- Disclosure basis (clarify 1), "details/summary": native `<details>` and `<summary>` in the shadow root, with the
  README's control conventions applied to the summary (delegated focus, host ARIA moved with mirrors, name order); the
  chevron is the element's and the native marker is removed (FR-003 to FR-008). Amended by the operator at plan squad
  round 1 (PLAN-FRESH-1-001 (a)): the shadow root is attached without `delegatesFocus`, because the host also holds
  the panel's content; `element.focus()` is overridden to focus the summary (FR-003, FR-004).
- Open-state ownership (clarify 2), "reflect, notify after": a user toggle sets `open` and reflects it to the host
  attribute; `ocelle-disclosure-toggle` fires after the change with `{ open }` and cannot be cancelled, as native
  `details` behaves (FR-009 to FR-012).
- Code-block content model (clarify 3), "slotted text": the code is the element's light-DOM text content, shown in a
  preformatted box in the shadow root; a newline directly after the opening tag is kept, unlike a native `pre`, and the
  README says so (FR-020).
- Code-block content model refined (spec check 1, SPEC-1-01, 2026-11-20), "Copy textContent always": the code is
  still the element's light-DOM text content as the consumer writes it, but the shadow root renders a copy of
  `textContent` in every mode and has no default slot. Child markup adds no style; digest groups render from the copy;
  a mutation observer, not `slotchange`, follows light-DOM text changes; in scroll mode the overflow-region module's
  focus handover finds no focusable slotted element, so focus goes to the frame by the module's rule (FR-020, FR-024,
  FR-035).
- Unread issues (spec check 1, SPEC-1-05, 2026-11-20), "Go ahead on recorded copy": planning goes ahead on #13's copy
  recorded on 2026-11-13, without #470, #520 or later #13 comments; a disabled disclosure and an exclusive accordion
  group stay out of scope; any requirement read from those issues later goes back to the operator (Assumptions).
- Digest rendering and default policy (clarify 4), "gap spans, wrap default": groups of four are adjacent boxes
  separated by a gap with no space characters, so copied text and the screen-reader reading are the unbroken digest
  (the plan measures both in Chromium); a prefix up to the last colon stays ungrouped; wrap is the default policy and
  scroll is opt-in (FR-023, FR-028 to FR-033).
- Tasks gate (2026-11-20, `reviews/analysis/operator-decisions.md`), "approve + fix all": the analysis findings are
  resolved in the design artifacts before phase 1 (`reviews/analysis/fixes-1.md`). The Principle V exception for
  story-less states is approved, subject to a measure: the unnamed overflowing scroll block keeps its exception only
  if axe fails it; if axe passes, it gets a story (FR-050).

## Scope

**In scope:** two new custom elements in `@ocelle/elements`, `ocelle-disclosure` and `ocelle-code-block`, with their
stories, tests, manifest entries, README sections and changelog entries; a README § Element conventions entry for the
digest grouping (FR-033) that #14's copy field can reuse; tokens in `@ocelle/tokens` only where no existing token
fits (FR-040).

**Out of scope:**

- every element of missions 013 and 019, which this mission does not change;
- copying to the clipboard, and any copy control (constitution I; #14 and the host);
- syntax highlighting, line numbers, a title bar or any part pinned at the inline start of the code block (a pinned
  part would need 019's R-17 mask exclusion, which is not built);
- vertical scrolling or a height cap for the code block (would need 019's block-axis option, which is not used): a
  tall code block grows and the page scrolls;
- changes to 009's overflow-region module or its contract (`specs/009-workflow-layouts/contracts/overflow-region.md`):
  the code block uses it exactly as written; a need for a change goes to the operator as a separate op;
- an exclusive accordion group (the `details` `name` attribute) and a disabled disclosure: #13 asks for neither, and
  the operator kept both out of scope while #470 is unread (SPEC-1-05; Assumptions);
- animation of the disclosure's opening or of its chevron;
- the `storybook-build`, `visual` and `axe` gates themselves and the pinned container (#10's, on `main`); this mission
  writes the stories they read and commits their baselines (FR-051).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - A disclosure that keeps its state through server swaps (Priority: P1)

A Kitty Desktop inspector shows "Advanced settings" or a mission's raw event payload behind a disclosure, closed by
default. The developer writes `<ocelle-disclosure><span slot="summary">Advanced settings</span>…</ocelle-disclosure>`
instead of a styled `<details class="…">`. A keyboard user tabs to the summary, presses Enter or Space and the panel
opens below it, inline, pushing the content after it down; the chevron turns from pointing to the inline end to
pointing down. A screen-reader user hears the summary as a button-like control with its expanded state. The server
renders a disclosure open with the `open` attribute; when the user opens one and htmx swaps the region around it with
a morph, the disclosure stays open. A page script listens for one `ocelle-disclosure-toggle` event to remember the
state.

**Why this priority**: the disclosure is a Desktop V2 primitive family (#470), has the only keyboard model and event
of the two elements, and has no dependency on mission 019, so it is implemented first, on `main` as it is (operator
decision Q1).

**Independent Test**: render a closed and an open disclosure with a summary and a panel holding a link. Toggle with
the mouse, Enter, Space and the `open` property and attribute; read the accessibility tree, the host attribute, the
focus order and the events.

**Acceptance Scenarios**:

1. **Given** an `ocelle-disclosure` without `open`, with a summary and a panel holding a link, **When** it renders,
   **Then** the summary is shown with the `chevron-end` icon before it, the panel is not shown, the panel's link is not
   in the tab order, and the accessibility tree has one control named by the summary text with its expanded state
   false and no node for the panel's content.
2. **Given** that closed disclosure, **When** the user clicks the summary, **Then** the panel is shown directly below
   the summary in the flow (no overlay), the icon is `chevron-down`, the host has the `open` attribute, the `open`
   property is `true`, the expanded state is true, and exactly one `ocelle-disclosure-toggle` event has reached a
   listener on `document` with `detail.open === true`.
3. **Given** the open disclosure, **When** the user clicks the summary again, **Then** the panel is hidden, the host
   has no `open` attribute, the icon is `chevron-end`, and one more `ocelle-disclosure-toggle` with
   `detail.open === false` has fired.
4. **Given** a closed disclosure, **When** the user tabs to it, **Then** focus is on the summary (the host is
   `document.activeElement`, the shadow root's active element is the summary) with the library's focus ring, and
   **When** the user presses Enter, and then Space, **Then** each key toggles the disclosure once, with one event each.
5. **Given** an open disclosure whose panel holds a link, **When** the user tabs from the summary, **Then** focus goes
   to the link in the panel, and Shift+Tab returns to the summary.
6. **Given** a disclosure, **When** a script sets `open = true`, or sets the `open` attribute, **Then** it opens as in
   scenario 2 (attribute and property agree) and one `ocelle-disclosure-toggle` with `detail.open === true` fires;
   **When** the script sets `open = true` again, **Then** nothing changes and no event fires.
7. **Given** a script that sets `open` several times in one task, with events counted by a listener on `document`
   after the element's `updateComplete` has resolved and then two animation frames have run and every element's
   `updateComplete` has resolved (the driver's `settle()`), **Then**: (a) for a closed disclosure
   set to true then false, it is closed and exactly 0 `ocelle-disclosure-toggle` events have fired; (b) for an open
   disclosure set to false then true, it is open and exactly 0 have fired; (c) for a closed disclosure set to true,
   false and true, it is open and exactly 1 has fired, with `detail.open === true`.
8. **Given** a disclosure opened by the user, **When** htmx morphs the region with server markup that also has `open`,
   **Then** it stays open; **When** the server markup lacks `open`, **Then** it closes, as the server said (the
   attribute is the state).
9. **Given** server markup `<ocelle-disclosure open>`, **When** the element upgrades, **Then** it renders open with no
   `ocelle-disclosure-toggle` event for the initial state.
10. **Given** a closed disclosure whose panel holds the text "retention", **When** the user searches the page for
    "retention" with the browser's find in page (Chromium), **Then** the disclosure opens, `open` is reflected and
    one `ocelle-disclosure-toggle` with `detail.open === true` fires.
11. **Given** `dir="rtl"` on an ancestor, **When** a closed disclosure renders, **Then** the `chevron-end` icon is
    mirrored (points to the inline end, to the left) and sits on the summary's inline-start side.
12. **Given** a host `aria-label="Show advanced settings"`, **When** the element renders, **Then** the summary control
    is named "Show advanced settings", the host has no `aria-label` and has `data-ocelle-moved-aria-label`; **When** a
    `cloneNode(true)` copy of the host is attached, **Then** the copy's summary has the same name.
13. **Given** a host `aria-describedby` naming a hint element in the same document, **When** the element renders,
    **Then** the summary control's description is the hint's text, by element reference, with no id copied into the
    shadow root.
14. **Given** prefers-reduced-motion set or not, **When** the disclosure is toggled, **Then** no animation or
    transition runs on the element, its panel or its icon (the change is immediate in both cases).
15. **Given** forced colours, **When** the disclosure renders closed and open, focused and not, **Then** the summary
    text, the icon and the focus ring are visible in system colours: the summary's computed `color` and
    `background-color` are one system pair, `CanvasText` on `Canvas`, and the focus ring is `Highlight`.
16. **Given** a summary longer than one line in a 320 px wide container, **When** it renders, **Then** the summary
    wraps inside the element, the icon stays centred on its first line (slot convention), and the page's scroll width
    equals the viewport width.
17. **Given** a consumer icon slotted into the `icon` slot, a bare `<svg>` holding a `<title>`, **When** the
    disclosure renders closed and then open, **Then** the consumer icon is shown in both states, no `chevron-end` or
    `chevron-down` is shown, the icon has no node in the accessibility tree, and the summary control's name is the
    summary text alone (the svg's title adds nothing).
18. **Given** a disclosure, **When** it is open, **Then** the host matches `:state(open)`; **When** it is closed,
    **Then** it does not.
19. **Given** an open disclosure with focus on a link in its panel, or on a library control in its panel whose focus
    is in its own shadow root (an `ocelle-button`, a nested disclosure's summary), **When** a script sets
    `open = false`, **Then** the summary is focused (the shadow root's active element is the summary) and
    `document.activeElement` is the host, not the body.
20. **Given** a closed disclosure, **When** a script calls `element.click()`, **Then** it opens with one
    `ocelle-disclosure-toggle` (`detail.open === true`); **When** a script dispatches a `click` event on the host
    itself with `dispatchEvent`, **Then** the state does not change and no event fires.
21. **Given** a disclosure, **When** the pointer hovers the summary, **Then** the summary's background colour differs
    from its colour without hover (the computed value comes from the token the plan names), and the cursor is
    `pointer`.
22. **Given** an open disclosure whose panel holds plain text taller than the viewport, scrolled so that text near the
    panel's end is in view, **When** the user clicks that text with the pointer and then presses Space, **Then** the
    click moves no focus to the summary (the shadow root's active element is not the summary) and does not change the
    page's scroll position, and the disclosure stays open with no `ocelle-disclosure-toggle` event.
23. **Given** a closed disclosure, **When** a script sets the host's `aria-expanded="true"`, **Then** it opens as in
    scenario 6 (one event) and the host has no `aria-expanded` attribute; **When** it sets `aria-expanded="false"`,
    **Then** it closes with one event and the attribute is removed again; **When** it sets any other value, **Then**
    the state does not change, no event fires and the attribute is removed. **Given** the markup
    `<ocelle-disclosure open aria-expanded="false">`, **When** it upgrades, **Then** it is closed (the mapped
    attribute is read after `open` and wins), no event fires and the host has no `aria-expanded` attribute (FR-007).

---

### User Story 2 - A code block in the sans that wraps or scrolls, and shows digests in groups (Priority: P2)

A Kitty Desktop screen shows a command to run, a log excerpt or a configuration snippet in a preformatted block, and a
mission's commit digest. The developer writes `<ocelle-code-block>git push origin main</ocelle-code-block>`. The block
sits on the inset ground in the library's sans with tabular figures, never monospace, with relaxed line height, and is
never wider than the reading measure. By default long lines wrap inside the block, so nothing scrolls sideways at
320 px. For a log where line breaks matter, the developer sets `overflow="scroll"`: long lines stay on one line and
the block scrolls sideways; only while it overflows is it a tab stop, named by its `label`, so a keyboard user can
scroll it with the arrow keys. For a digest, the developer sets `digest`: the hex string is shown in groups of four
with a small gap between groups, while a user who selects and copies it, or a screen reader that reads it, gets the
unbroken digest.

**Why this priority**: it closes #1's #520 gap row and is the overflow-region module's next user, but it depends on
how mission 019 leaves that module, so it is implemented second, after the operator decides how to proceed against
019 (operator decision Q1).

**Independent Test**: render a short block, a block with a 200-character line in wrap and in scroll mode at 320 px and
1280 px, and a `sha256:` digest in digest mode. Check the computed type, the page scroll width, the tab stop and name
while overflowing and not, the arrow keys, the selection's copied text and the accessibility tree's text.

**Acceptance Scenarios**:

1. **Given** an `ocelle-code-block` holding three lines of text, **When** it renders, **Then** the text is shown with
   its line breaks and runs of spaces as written, on `--ocelle-color-inset`, in `--ocelle-font-sans` with
   `--ocelle-figures`, at `--ocelle-line-height-relaxed`, and no computed font family of the block or its text is a
   monospace family.
2. **Given** a code block in a container wider than `--ocelle-measure-reading`, **When** it renders, **Then** its inline
   size is at most `--ocelle-measure-reading` (computed in px on the element).
3. **Given** a code block in wrap mode (no `overflow` attribute) holding a 200-character line with no spaces, **When**
   the element is 288 px wide in a 320 px viewport, **Then** the line wraps inside the block, the block's scroll width
   equals its client width, the page's scroll width equals the viewport width, the block is not a tab stop and has no
   role.
4. **Given** the same text with `overflow="scroll"` and `label="Build log"`, **When** the block is narrower than the
   line, **Then** the line stays on one line, the block scrolls in the inline direction only, its scroll box is a tab
   stop with role `group` named "Build log", and the inline end shows the module's fade.
5. **Given** that overflowing scroll block focused, **When** the user presses ArrowRight, **Then** it scrolls 40 px with
   no animation, and the start fade appears; ArrowLeft scrolls back (the module's keyboard model, unchanged).
6. **Given** a scroll block whose text fits, **When** it renders, **Then** it is not a tab stop and has no role and no
   name; **When** its container narrows until the text overflows, **Then** it becomes a tab stop named by its label,
   and **When** it widens again while focused, **Then** focus is handed over as scenario 21 states (its oracle).
7. **Given** a scroll block with no `label` and no host `aria-label`, **When** it overflows, **Then** it is a tab stop
   with no role and no name (the module's rule), and the README tells consumers to always give a scroll block a label.
8. **Given** `dir="rtl"` on an ancestor, **When** a code block holding `--force main.` renders, **Then** the code is
   shown left to right (the characters' visual order is `--force main.`, as copied); **When** an overflowing scroll
   block renders under it, **Then** the block keeps the page direction and opens at the line starts: the first
   character of every line is inside the box, the fade is at the right edge, where the hidden line ends are, and each
   line still reads left to right (FR-021; operator decision, plan squad round 3, PLAN-FRESH-3-001 (a)).
9. **Given** `digest` and the content `sha256:9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08`,
   **When** it renders, **Then** `sha256:` is shown as written, followed by 16 groups of four characters with a gap of
   `--ocelle-space-1` between groups and no gap inside a group, and the element's light-DOM text is unchanged.
10. **Given** that digest block, **When** the user selects the whole block (a triple click) and copies it (the
    browser's own copy), **Then** the copied plain text is exactly the trimmed content (leading and trailing whitespace
    removed, FR-029) followed by the one newline the platform adds at the end of a whole-block selection, with no
    space, tab or newline added between groups; **When** a run of groups inside the block is selected and copied,
    **Then** the copied text is exactly those groups' characters.
11. **Given** that digest block, **When** Chromium's full accessibility tree is read through CDP
    `Accessibility.getFullAXTree`, **Then** the concatenation, in tree order, of the `name` values of the StaticText
    nodes that descend from the block's node equals the trimmed digest exactly (no space or other character between
    groups), and no node between those StaticText nodes contributes a separator; and Playwright's `ariaSnapshot` of the
    shadow `pre` (`part="code"`) equals one text run holding the trimmed digest (the host's snapshot also reads its
    unslotted light-DOM text and is not used). The number of StaticText nodes is not asserted.
12. **Given** a digest block in wrap mode at 288 px, **When** the digest does not fit on one line, **Then** every line
    break falls between two units: between the prefix and the first group, or between two groups; never inside a
    group, and inside the prefix only where the prefix alone is wider than the line (FR-033, WCAG 1.4.10). Measured
    from line boxes: each group has exactly one rect in `getClientRects()`, the prefix has exactly one rect wherever
    its own inline size fits the `pre`'s content box, the block holds more than one line wherever the digest's
    inline size is wider than that content box, and every line's first unit starts at the `pre`'s content-box inline
    start (no gap at a line's start). The page's scroll width equals the viewport width. The same holds for a digest
    whose groups hold `-` or `/` (base64url or base64), at every `pre` width from 60 to 300 px; the sweep strings are
    named in contracts/checks.md.
13. **Given** a digest block with `overflow="scroll"`, **When** it is narrower than the digest, **Then** the digest stays
    on one line and scrolls as in scenario 4.
14. **Given** `digest` and content whose length after the prefix is not a multiple of four (for example 10 characters),
    **When** it renders, **Then** the groups are four, four and two, counted from the start.
15. **Given** `digest` and content that holds whitespace inside it (after trimming leading and trailing whitespace),
    **When** it renders, **Then** it is shown as in the default mode with no groups, so a non-digest is never
    regrouped.
16. **Given** a code block whose light-DOM text is replaced (an htmx swap of its content, or `textContent` set by a
    script), or whose light-DOM text node's data changes, or the data of a text node inside one of its child elements
    changes, **When** the change is done, **Then** the shown text, the digest groups and the overflow state follow the
    new text.
17. **Given** forced colours, **When** a code block renders in each mode, **Then** its text and edges are visible in
    system colours, and an overflowing scroll block shows the module's forced-colours edge lines.
18. **Given** prefers-reduced-motion, **When** a scroll block is scrolled with the arrow keys, **Then** nothing
    animates (the module's writes are instant in every case).
19. **Given** an empty code block, in wrap mode and with `overflow="scroll"`, **When** it renders, **Then** its block
    size is one line's height of the block's type (plus its padding) and it is not a tab stop.
20. **Given** a code block holding `a <b>bold</b> c`, **When** it renders, **Then** the shown text is `a bold c`, the
    shadow root has no `slot` element, and the computed `font-weight` of the shown
    word "bold" equals that of "a".
21. **Given** an overflowing scroll block that is focused, **When** its container widens until the text fits, **Then**
    focus moves to the block's `.region-frame` (the module's rule when no focusable slotted element exists) and
    `document.activeElement` is the host.

---

### Edge Cases

- **Disclosure without a summary.** A disclosure with nothing in its `summary` slot renders the icon alone with an
  empty summary control and no fallback text; with no host `aria-label` or `aria-labelledby` the control has no name,
  which axe reports as the host's mistake. No story shows it; a browser test proves it (FR-050).
- **Disclosure with an empty panel.** Opening it shows nothing below the summary and still fires the event.
- **Focus inside a closing panel.** When a script closes a disclosure while focus is inside its panel, focus moves to
  the summary, so it is never lost to the body (US1 scenario 19).
- **Interactive content in the summary.** A link or button slotted into the summary is not supported (a control
  inside a control); the README says so, and the element does not guard against it.
- **Nested disclosures.** A disclosure inside another's panel works independently; a toggle of the inner one fires one
  event that bubbles through the outer one, whose own state does not change. Listeners tell them apart by
  `event.target`.
- **`hidden` host.** A disclosure or code block with `hidden` has no box and no node (`:host([hidden])`).
- **Disclosure before upgrade.** Until the element is defined its content is plain light DOM: the summary and panel
  are both shown, as unstyled text. The README states it; no pre-upgrade rule is added.
- **Empty code block.** A code block with no text renders an empty inset box of one line's height; it is never a tab
  stop (US2 scenario 19).
- **Leading newline.** A newline directly after `<ocelle-code-block>` is shown as an empty first line (unlike a native
  `pre`, which drops it); the README tells server templates to start the text on the same line.
- **Markup inside a code block.** Child elements of a code block are not rendered as markup: the shadow root shows a
  copy of the host's `textContent` and slots nothing (FR-020), so a `<b>` or a `<code>` inside it adds no style. Text
  inside them is included (US2 scenario 20).
- **Right-to-left pages.** Each line of code is shown left to right in every page direction, so bidi neutrals
  (option dashes, punctuation, a leading `/`) stay where they are written; the block itself keeps the page direction.
  Because the lines start at the left of a scroll box whose scroll origin is its right edge, an overflowing scroll
  block at the platform's rest position would show only the tails of its long lines and none of its short ones
  (measured, plan squad round 3, PLAN-FRESH-3-001). So the element opens an `rtl` scroll block at the line starts with
  one instant scroll write when the box first appears and when the text changes, and the fade is at the right, where
  the line ends are hidden (US2 scenario 8). A block that only starts to overflow after a later resize keeps the
  scroll position the platform gives it; no write follows a resize.
- **Policy switch with focus.** When `overflow` changes from `scroll` to wrap while focus is in the scroll block (the
  scroll box, or the frame the module's handover focused when overflow ended), focus moves to the block, which shows
  the library's focus ring, and `document.activeElement` stays the host (FR-025).
- **Disclosure last in an overlay.** A closed disclosure as the last control of an `ocelle-dialog` or `ocelle-drawer`
  lets Tab from its summary leave the overlay: mission 008's focus walk counts a closed panel's controls as stops.
  This mission leaves 008's modules unchanged; the case is recorded for a separate op and the README states the
  limitation (operator decision, plan squad round 2, PLAN-FRESH-2-002 (b)).
- **Astral characters in a digest.** Groups count code points: `x:ab😀cdef` gives the prefix `x:` and the groups
  `ab😀c` and `def`, with no lone surrogate (FR-029).
- **Tabs.** A tab character is shown at the browser's default tab size; the element sets none.
- **Digest prefix only.** `digest` with content `sha256:` (nothing after the colon) shows the prefix with no groups.
- **Digest with several colons.** The prefix runs to the last colon (`ni:sha-256:` stays whole).
- **Code block in a shrink-to-fit host.** In a flex item, a dialog or a table cell, a scroll block takes its content's
  size and may not overflow (the module's Sizing rule); the README repeats the scroller's advice to give it a definite
  or maximum inline size there.
- **Print.** A wrap block prints wrapped; a scroll block prints what is laid out, and text off-screen is not printed,
  as for `ocelle-scroller`. The README states it.
- **Before upgrade.** An un-upgraded `ocelle-code-block` shows its text as an inline run, without line breaks; the
  README advises nothing further, and no base-style rule is added (FR-021).

## Requirements *(mandatory)*

### Common to the two elements

- **FR-001**: Each element MUST follow the README's § Element conventions: its own module `src/<tag>.ts` with one
  `define` call, `static properties` with `declare` fields, a `@tagname` JSDoc tag, a description and
  `@default undefined` for every public property, one shared `static styles` built only from `--ocelle-*` tokens and
  values the `style-lint` gate allows, `:host([hidden]) { display: none; }`, colour and ground rules inside
  `@media not (forced-colors: active)`, an entry in the committed `custom-elements.json`, an export from
  `src/index.ts`, and a README section.
- **FR-002**: Neither element MAY require or document a `class` attribute for its look; every variant is a property or
  attribute. No `sk-` name and no monospace family MAY appear in source, styles, stories or build output (`prefix`
  gate). No template has a `style` attribute or a `<style>` element (constitution IV).

### `ocelle-disclosure` (P1)

- **FR-003**: `ocelle-disclosure` MUST render, in an open shadow root attached without `delegatesFocus` (the host also
  holds the panel's content, and a click on it must not move focus to the summary, US1 scenario 22), one native
  `<details>` whose `<summary>` holds an icon row by the README's slot convention as amended by 012's plan decision 33
  (`.icon-row`, an icon wrapper, the `.label` wrapper around a `summary` slot) and whose remaining content is a panel
  wrapper around the default slot. The host has no role and no tabindex and is a block box (`:host { display: block }`).
  The native disclosure marker is not shown.
- **FR-004**: The summary MUST be the element's one inner control: `element.focus()` focuses it (the element overrides
  `focus(options)` to focus the summary, a departure from the control conventions' rule 1, which uses
  `delegatesFocus`); it is in the tab order; Enter and Space on it toggle the disclosure once each (the native
  behaviour); a click on it toggles once. A click on the panel does not toggle and does not move focus. As the control
  conventions' rule 1 says, `element.click()` clicks the summary and so toggles once. A `click` dispatched on the host itself with `dispatchEvent` does not pass through the summary and
  does not toggle; unlike rule 1, the element stops no click on the host, because clicks from the panel's content
  must reach the page's listeners (US1 scenario 20).
- **FR-005**: The icon wrapper MUST show `ocelle-icon` `chevron-end` while closed and `chevron-down` while open
  (README § Icons), decorative (no name, hidden from assistive technology), with `chevron-end` mirrored under a
  right-to-left inline direction. A consumer MAY slot its own icon into the `icon` slot, which then replaces the
  chevron in both states (the same icon open and closed) and stays decorative: hidden from assistive technology, a
  bare `<svg>` with a `<title>` included, and adding nothing to the summary's name (US1 scenario 17). The icon is on the summary text's first line (slot convention, Alignment).
- **FR-006**: The summary control's accessible name MUST follow the control conventions' name order: the host's
  `aria-labelledby`, then the host's `aria-label`, then the `summary` slot's text. The control exposes its expanded
  state (true while open, false while closed) in the Chromium accessibility tree.
- **FR-007**: The host attributes `aria-label`, `aria-labelledby`, `aria-describedby` and `title` MUST be moved onto
  the summary as the README's control conventions, rule 4, says: applied there, removed from the host, mirrored in
  `data-ocelle-moved-<attribute>`, read back at upgrade, restored when a morph removes the mirror, ID references
  resolved in the host's own tree and related by element reference. The README's off-value table applies. A host
  `aria-expanded` is mapped onto `open`, not moved: `"true"` opens, `"false"` closes, any other value changes nothing,
  and the attribute is removed from the host in every case, with no mirror (the `open` attribute is the persisted
  state; US1 scenario 23). At upgrade a host `aria-expanded` is read after `open` and wins, so
  `<ocelle-disclosure open aria-expanded="false">` upgrades closed and fires no event. Any other `aria-*` attribute on
  the host is not supported.
- **FR-008**: The panel MUST be laid out inline, directly after the summary in the element's own box, with no overlay,
  top layer or positioning outside the element. While closed, the panel's content is not rendered, is not in the tab
  order and is not in the accessibility tree, except that the browser's find in page may open it (FR-010). The
  observable is the platform's: `checkVisibility()` is false for the panel's content. Chromium skips a closed
  `details` panel by content-visibility, so slotted content may keep a client rect and `visibility: visible`
  (research R-08); `getClientRects()` and `visibility` are not the measure.

**Open state**

- **FR-009**: `open` (boolean attribute and property, reflected, `@default undefined`) MUST be the disclosure's state:
  setting the property, adding or removing the attribute, and a user toggle all change the same state, and the
  attribute always matches it after the change. A user toggle (click, Enter, Space, find in page) sets the property and
  reflects the attribute.
- **FR-010**: When the browser's find in page matches text in a closed panel (Chromium), the disclosure MUST open and
  behave as after a user toggle (FR-009, FR-012). The plan measures this under the engine floor (Assumptions); if
  the measure shows that Chromium does not open the closed panel for slotted light-DOM text, the run stops and the
  operator decides whether FR-010 and US1 scenario 10 are dropped or another design is planned.
- **FR-011**: The element MUST expose `:state(open)` while open, and only then, so consumers can style an open
  disclosure without a host attribute selector they might morph away (US1 scenario 18). It exposes no other custom
  state.
- **FR-012**: The element MUST dispatch `ocelle-disclosure-toggle` (a `CustomEvent`, `bubbles: true`,
  `composed: true`, `cancelable: false`) after each change of the open state, whatever caused it, with
  `detail: { open: boolean }` holding the new state. Changes are coalesced by the platform's rule (operator decision,
  plan squad round 1, PLAN-CORRECTNESS-1-003 (a)): every change made before the native `toggle` of the inner
  `details` runs is coalesced into it, so there is at most one event per native `toggle`, carrying the final state,
  and none when the final state equals the state the last event reported (stricter than native `details`, which still
  fires a `toggle` when the final state equals the old one). Changes within one task are always coalesced; changes in
  different tasks are coalesced when no native `toggle` ran between them, so the event count is not a count of
  changes. The event is dispatched in a later task than the change, after the host's `open` attribute and property
  reflect the final state (US1 scenario 7). The initial state at upgrade fires no event. The native `toggle` event is not re-dispatched and
  does not leave the shadow root.
- **FR-013**: When the disclosure closes while focus is inside its panel, focus MUST move to the summary, including
  when the focused element is inside the shadow root of a control in the panel (US1 scenario 19).

**Look**

- **FR-014**: The summary MUST take the library's focus ring (`--ocelle-color-focus`, `--ocelle-focus-width`,
  `--ocelle-focus-offset`) on keyboard focus, a hover state that changes the summary's background colour to an
  existing token the plan names (US1 scenario 21), and a pointer cursor; its
  target size is at least 24 × 24 CSS px (WCAG 2.5.8). The plan names the tokens for type, colour, gap and padding.
- **FR-015**: The disclosure MUST NOT animate: no transition or animation on the element, the panel or the icon, with or
  without reduced motion.
- **FR-016**: In forced colours, the summary text, the icon (`currentColor`) and the focus ring (`Highlight`) MUST be
  visible, the summary's text and ground being one system pair (`CanvasText` on `Canvas`, operator decision, plan
  squad round 1, PLAN-A11Y-SECURITY-1-004 (a)).
- **FR-017**: `ocelle-disclosure` MUST list in its manifest entry: `open`; the moved attributes and their mirrors
  (FR-007); the mapped `aria-expanded`; the `summary`, `icon` and default slots; the event `ocelle-disclosure-toggle` with its detail; and the CSS
  parts the plan names (at least `summary` and `panel`), each list stated even when empty.

### `ocelle-code-block` (P2)

- **FR-020**: The code MUST be the element's light-DOM text content (its `textContent`) as the consumer writes it.
  The shadow root renders a copy of that text, in every mode (wrap, scroll, digest), as preformatted text: line breaks
  and runs of spaces as written, including a newline directly after the opening tag. The shadow root has no default
  slot and slots no light-DOM node, so child elements add no markup or style; their text is included in the copy. The
  element follows light-DOM text changes with a mutation observer on the host (child nodes and character data, at any
  depth; `slotchange` cannot see them, as nothing is slotted): a change updates the shown copy, the digest groups and
  the overflow state (US2 scenario 16).
- **FR-021**: The block MUST be on `--ocelle-color-inset`, in `--ocelle-font-sans` with `--ocelle-figures`, at
  `--ocelle-line-height-relaxed`, with padding and radius from existing tokens that match 003's prose `pre` rule
  (`--ocelle-space-3`, `--ocelle-radius-2`), and an inline size capped at `--ocelle-measure-reading`. No base-style
  rule is added or changed: 003's `pre` and `code` rules stand for un-upgraded and prose content. Each line of code
  is shown left to right in every page direction (operator decision, plan squad round 1, PLAN-FRESH-1-002 (a)), while
  the block and its scroll box keep the page direction, so the module's fade falls on the side where text is hidden
  (operator decision, plan squad round 2, PLAN-FRESH-2-001 (a); US2 scenario 8). When the scroll box computes
  `direction: rtl`, the element MUST open it at the line starts: when the box first appears and when the shown text
  changes, it writes `scrollLeft = -(scrollWidth - clientWidth)` with `behavior: "instant"`, so each line's first
  character is inside the box and the module's fade (`data-fade` `start`) is at the right (operator decision, plan
  squad round 3, PLAN-FRESH-3-001 (a)). Under `ltr` it writes nothing. The write is instant, as 009's contract
  requires of every scroll write (FR-024).
- **FR-022**: `overflow` (attribute and property, reflected, `@default undefined`) MUST choose the policy. Absent, or
  any value other than `scroll` (ASCII case-insensitive, trimmed), is the wrap policy; `scroll` is the scroll policy.
- **FR-023**: The wrap policy MUST be 003's: `white-space: pre-wrap` and `overflow-wrap: anywhere`, no scroll box, no
  tab stop, no role, so the block meets WCAG 1.4.10 at 320 px.
- **FR-024**: The scroll policy MUST use 009's overflow-region module exactly as its contract
  (`specs/009-workflow-layouts/contracts/overflow-region.md`) and the README's § Element conventions, Overflow region,
  state: the `.region-frame` structure with the preformatted text inside `.region-track`, `overflowRegionStyles` in
  the element's styles, the default role `group` and the default step, the `label` passed through `setLabel` after each
  update, `aria-label` in `observedAttributes`, `data-fade` bound through `ifDefined`; the text does not wrap
  (`white-space: pre`); inline axis only. The element sets none of what the contract's "What a later element must not
  do" forbids, sets no option mission 019 adds to the module, and needs no change to the module. Under the copy model
  (FR-020) the track holds no slot, so the module's `slotchange` trigger never fires for the code block: a text change
  reaches the module through the re-render of the copy, whose new size its `ResizeObserver` on the track sees. The
  module's focus handover finds no focusable slotted element, so when overflow ends while the box has focus, focus
  goes to `.region-frame` by the module's rule and `document.activeElement` is the host (US2 scenario 21).
- **FR-025**: In wrap mode the element MUST NOT render the overflow-region structure or create the module's effects on
  any node (no tab stop, role or name can appear). Switching `overflow` between the two values at run time MUST give
  the other policy's full behaviour, with no tab stop, role or name left behind on a node. When the switch from
  scroll to wrap happens while focus is in the scroll structure (the scroll box, or the `.region-frame` the module's
  handover focused, US2 scenario 21), focus MUST move to the block, so `document.activeElement` stays the host
  (operator decision, plan squad round 1, PLAN-CORRECTNESS-1-010 (b); squad round 2, PLAN-FRESH-2-003), and the
  focused block MUST show the library's focus ring (`--ocelle-color-focus`, `--ocelle-focus-width`,
  `--ocelle-focus-offset`; `Highlight` in forced colours), never the user agent's (operator decision, plan squad
  round 2, PLAN-FRESH-2-005 (a)).
- **FR-026**: `label` (attribute and property, not reflected, `@default undefined`) MUST name the scroll box while it
  overflows, as the module's name rule says (a non-blank host `aria-label` wins; blank counts as absent). In wrap mode
  `label` has no effect, and a host `aria-label` is left on the host as written (Host ARIA). Because the host has no
  role in either mode, the README advises against a host `aria-label` on a code block and tells consumers to use
  `label`; no story sets a host `aria-label` on a code block.
- **FR-027**: In the scroll policy, the README's `ocelle-scroller` statements on keyboard, focus, fades, scrollbar,
  motion, naming and sizing MUST hold for the code block, and the README section says so by reference.

**Digest mode**

- **FR-028**: `digest` (boolean attribute and property, reflected, `@default undefined`) MUST turn on digest mode.
- **FR-029**: In digest mode, the element MUST take the light-DOM text with leading and trailing whitespace trimmed;
  when it holds no other whitespace, the prefix is everything up to and including its last colon (none when there is
  no colon), and the rest is split into groups of four characters counted from the start, the last group holding the
  remainder. A character here is a Unicode code point (a digest is ASCII in practice, where code points and UTF-16
  code units agree; a body with an astral code point proves the rule, Edge Cases). The groups render from the shadow root's copy (FR-020); the light DOM is not changed. When the trimmed text holds whitespace, digest mode shows it as the default mode does, with no groups.
- **FR-030**: The prefix and each group MUST be shown as adjacent boxes with a gap of `--ocelle-space-1` between the
  prefix and the first group and between groups, no gap within a group, and no gap at the start of a line. No space,
  tab, newline or other character is added to the shown text: the gap is layout only.
- **FR-031**: A selection of any run of groups, copied with the browser's own copy, MUST give exactly those
  characters, and a selection of the whole block MUST give the characters of the trimmed text (FR-029) followed by the
  one newline the platform adds at the end of a whole-block selection, which is not an element character; nothing is
  added between groups (measured in Chromium; operator decision, plan squad round 1, PLAN-TESTABILITY-1-002 (b)).
  The element reads and writes no clipboard.
- **FR-032**: The Chromium accessibility tree MUST expose the digest as one unbroken string, equal to the trimmed
  text. The measure is US2 scenario 11's: in CDP `Accessibility.getFullAXTree`, the `name` values of the StaticText
  nodes under the block's node, concatenated in tree order, equal the trimmed digest with no separator, and
  Playwright's `ariaSnapshot` of the shadow `pre` (`part="code"`) equals one text run holding it (operator decision,
  plan squad round 1, PLAN-TESTABILITY-1-001 (a)); the count of StaticText nodes is not part of the
  measure. Only if that measure fails does the fallback apply: the element exposes the unbroken text to assistive
  technology and hides the groups from it, the fallback MUST still meet FR-031 (a copy gives the trimmed text once,
  with no second copy of it and nothing added), and the plan records the measure.
- **FR-033**: In wrap mode, a line break in a digest MUST fall only between two units (the prefix and the first
  group, or two groups) and never inside a group. A unit wider than the line breaks inside, as FR-023 wraps any text,
  which keeps WCAG 1.4.10: in practice only a prefix wider than the line, in a very narrow block, since four code
  points never exceed a line (research R-07; measured as US2 scenario 12 says). In the scroll mode it stays on one
  line. The README MUST record, in § Element conventions, the library's digest rule for later elements (#14's copy
  field among them): the prefix up to the last colon, groups of four code points from the start, a `--ocelle-space-1`
  gap with no added characters, copied and read text unbroken, breaks only between units, a prefix wider than the
  line breaking inside.

**Look and surface**

- **FR-034**: In forced colours the block MUST show its text in `CanvasText` with a visible edge (a border or outline
  in a system colour), and the scroll mode keeps the module's forced-colours edge lines.
- **FR-035**: `ocelle-code-block` MUST list in its manifest entry: `overflow`, `label`, `digest`; no slot (the slot
  list stated empty, the description saying the text is read from the light DOM's `textContent`); no event; the CSS
  parts the plan names; each list stated even when empty.

### Tokens

- **FR-040**: A new token MAY be added to `@ocelle/tokens` only where no existing token gives the value. Each new token
  goes through the token package's validation (records, generator, contrast declaration for a foreground colour,
  tests) and is listed in the plan with the reason no existing token fits. The two elements are expected to need none.

### Evidence (#7's checklist)

- **FR-050**: Each element MUST have a story per variant and per state in `storybook/stories/<element>.stories.ts`,
  rendered in light and dark, following #10's contributor note: for the disclosure at least closed, open, focused,
  hovered, a long wrapping summary, a consumer icon and right-to-left; for the code block at least short, wrap with a
  long line, scroll overflowing, scroll overflowing in the middle and at the end, a focused scroll block, scroll
  fitting, digest, digest wrapping at 288 px and right-to-left. The unnamed disclosure (Edge Cases) has no story,
  because axe fails it by design; browser tests prove it. The unnamed overflowing scroll block (US2 scenario 7) has
  no story only if a measure before its phase's stories shows that axe fails it (`ocelle-scroller`'s unlabelled story,
  on the same module, passes axe); if axe passes, it gets a story. The plan records the story-less states as an
  exception to constitution V with scope, rationale and a sunset, approved by the operator at the tasks gate.
- **FR-051**: Visual baselines and the `axe` run follow #10 on `main`. Each phase that adds stories MUST commit their
  light and dark baselines, produced in #10's pinned container by its baseline command under docker, and its stories
  MUST pass #10's `storybook-build`, `visual` and `axe` gates, `axe` with no serious or critical finding and no
  `storybook/a11y-exceptions.json` entry unless the operator approves one. The run records that no podman cross-check
  was possible.
- **FR-052**: Browser tests MUST cover every acceptance scenario, written once in `test/scenarios/` and run on the
  element source in process and on the built browser build on strict-CSP fixture pages (README § Files and tests).
  Find in page (US1 scenario 10) and copy (US2 scenario 10) are driven through the browser where Playwright allows it;
  where it does not, the plan names the nearest faithful driver and the gap.
- **FR-053**: The code block MUST have a reflow test at 320 px CSS width (US2 scenarios 3 and 12), and the disclosure
  one for its long summary (US1 scenario 16).
- **FR-054**: Every event and payload MUST have an interaction test: `ocelle-disclosure-toggle` for click, Enter,
  Space, property, attribute and find in page, with its `detail`, `bubbles`, `composed` and `cancelable`, and its
  coalescing (US1 scenarios 2 to 10), `element.click()` (US1 scenario 20) and a host `aria-expanded` (US1 scenario
  23).
- **FR-055**: The built output MUST pass the strict-CSP check; the only per-instance stylesheet is the module's
  (README § Element conventions, Styles).
- **FR-056**: Each changed package gets a changelog entry naming the two added elements, their attributes, slots,
  parts, the event and states, and any added token (constitution VII, MINOR).
- **FR-057**: Mutation testing under #23's rules and op 015's shard limit MUST leave no surviving mutant in the
  phase's changed source, except mutants the review records as equivalent with the reason.
- **FR-058**: The README MUST map each kitty-mission-ui disclosure and code-block class variant the plan's research
  finds to the element and variant that replaces it, role names only, no code copied (constitution VI); a variant no
  element covers goes to the operator. If no inventory is available, the plan says so and the README has no mapping
  rows for these two.

**Phase order (operator decision Q1)**

- **FR-060**: P1 (`ocelle-disclosure`) MUST be implemented on the branch as cut from `main` (4911fd0b), with no
  merge of `main`. Before P2's red commit, the run stops and asks the operator how to proceed against mission 019
  (landed or not); P2 is built only after that answer. No task merges `main`.

### Key Entities

- **Disclosure**: a summary (slotted content, optionally an icon), a panel (slotted content), an open state, moved
  host ARIA with its mirrors.
- **Toggle event**: `ocelle-disclosure-toggle`, detail `{ open }`.
- **Code block**: its text (light-DOM text content, rendered in the shadow root as a copy), a policy (wrap or
  scroll), a label for the scroll box, a digest mode.
- **Digest**: a prefix (up to the last colon, may be empty) and groups of four characters, the last holding the
  remainder.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Every acceptance scenario of US1 and US2 has at least one test that fails against the code before its
  phase (the red/green check) and passes after.
- **SC-002**: At 320 px CSS width, every code-block story in wrap mode and the long-summary disclosure story have a
  page scroll width equal to the viewport width.
- **SC-003**: Every story of the two elements reports no serious or critical axe finding through #10's `axe` gate, in
  light and dark, with no new `a11y-exceptions.json` entry.
- **SC-004**: A copy of a digest block's whole text gives exactly the trimmed characters followed by the platform's
  one block-end newline (0 characters added by the element), a copy of a run of groups gives exactly its characters,
  and the concatenated StaticText names under the block in CDP `Accessibility.getFullAXTree` are the trimmed digest
  (US2 scenario 11's measure).
- **SC-005**: A keyboard-only user can open, close and pass through a disclosure, and scroll an overflowing scroll
  block end to end, with no pointer, in every story that has them.
- **SC-006**: Under reduced motion and without it, no story of the two elements has a running animation or transition.
- **SC-007**: The manifest, strict-CSP, prefix, style-lint and mutation gates pass with the two elements added;
  `src/overflow-region.ts` and its contract are unchanged by this mission (`git diff` against the branch base shows no
  change to either). The branch base is 4911fd0b for phase 1 and, for phases 2 and 3, the base the phase 2 operator
  stop records (FR-060), so changes an integration brings in are not counted as this mission's.
- **SC-008**: No file of mission 013's or 019's elements changes (`git diff` against the branch base, as SC-007
  defines it per phase, lists none of their element sources, stories or tests).

## Assumptions

- #470's required states for the disclosure were not read; the stories cover default, hover, focus and both themes,
  and the narrow width, which are the states the triage record lists for every Desktop V2 family. Disabled does not
  apply: native `details` has no disabled state, and #13 asks for none. A state #470 adds, read later, goes to the
  operator. The operator chose on 2026-11-20 to plan on #13's recorded copy with #470, #520 and #13's later comments
  unread, keeping a disabled disclosure and an exclusive accordion group out of scope (SPEC-1-05).
- #520 was not read; the code block's scroll region is #13's description of it ("a tab stop only while it overflows,
  the `ocelle-scroller` pattern"), which 009's module implements. A requirement #520 adds, read later, goes to the
  operator (SPEC-1-05).
- The overflow-region module on `main` (009) serves the code block as it is. Mission 019's amendments are opt-in and,
  by 009's contract, leave the option-off path unchanged; the operator decides before P2's red step how to proceed
  (FR-060).
- Chromium's find in page opens a closed `details` (the `beforematch`-free native behaviour since Chromium 97); the
  plan confirms it under the engine floor, for text slotted through the element's shadow root; if it does not hold,
  FR-010 goes to the operator. WebKit is not measured, the same as the library's Engines note.
- `--ocelle-space-1` is the digest group gap; the plan confirms it is legible at the block's type size.
- No new token is expected; the plan names every token each element reads.
