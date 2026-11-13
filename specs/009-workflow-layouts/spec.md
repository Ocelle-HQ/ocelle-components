# Feature Specification: Workflow and Screen Layouts

**Feature Branch**: `009-workflow-layouts` (work happens on `claude/015-workflow-layouts`)

**Created**: 2026-11-12

**Status**: Draft

**Input**: User description: "Mission for #15 (triage/009-workflow-layouts.md), spec directory
specs/009-workflow-layouts: four layout elements in @ocelle/elements plus the tokens they need in @ocelle/tokens, in
priority order: (P1) ocelle-scroller, a horizontal strip that is a named focusable region (role region, a name,
tabindex 0) only while it overflows, shows the token focus ring, scrolls with the arrow keys and shows an edge fade on
each logical side with content off-screen, its overflow-tab-stop logic built as an internal module that #13's
ocelle-code-block can reuse; (P2) ocelle-workflow-board and ocelle-workflow-lane as elements, not classes, with a lane
minimum width token so five lanes fit a 1280 px window beside a context sidebar, the board scrolling inside itself
(with the P1 pattern) only when narrower, a flat lane variant without nested card chrome whose small uppercase title
uses the sans with tabular figures (constitution II forbids the mono #15 names), and lane titles that carry their
count to assistive technology; (P3) ocelle-list-detail with a list track width token, the selected record's detail
beside it, a decorative border between panes, and a collapse to one column driven by its container width and by a
narrow state the host (later #12's app shell) sets, reusing the existing --ocelle-shell-inspector-width (19rem, which
002 chose over spec-kitty-design#505's 260 px) for the Pipeline inspector; done when #7's checklist holds for each
element (stories per variant and state in light and dark, interaction, keyboard and screen-reader tests, axe clean,
manifest entry, strict-CSP check) plus resize tests at 1280 px and at the narrow tier; settle at clarify the questions
this record lists (the count's wording, the threshold and narrow-state interface shared with #8 and #12, one-column
navigation, the inspector's home, the forced-colours edge cue)."

**Issues**: #15 (triage record `triage/009-workflow-layouts.md`, approved by the operator on 2026-11-12). The body of
#15, the "Done when" checklist of #7 it refers to, and the relevant parts of #1, #8, #9, #12, #13 and #16 are in
`sources/issues.md`, as the orchestrator read them from GitHub on 2026-11-12. The spec-kitty-design issues #505, #506,
#507, #514 and #530 are requirements only (constitution VI); nothing is ported from them.

**Operator decisions while specifying** (2026-11-12, human:jeroennouwsdev; the triage record's open questions):

- **Lane count wording**, "Number, host words (Recommended)": a lane has a numeric `count`, shown beside its title.
  The lane's accessible name is "<title>, <count>", with no built-in words. A host may set `count-label` (for example
  "3 work packages"), which replaces the bare number in that name. No English string is built into an element
  (FR-018, FR-019).
- **Collapse interface**, "Element measures (Recommended)": `ocelle-list-detail` measures its own inline size against
  a `collapse-below` length (default: a new token) and shows one column below it. A boolean `narrow` attribute set by
  the host forces one column. The rule is written into the README's element conventions as the container-tier
  convention, which #8 (sibling 011) and #12 reuse (FR-025, FR-034).
- **One-column behaviour**, "Host state, focus moved (Recommended)": the host sets `detail-open`. In one column the
  detail pane shows while it is set, and the list shows otherwise. When focus was inside the pane that is hidden, the
  element moves it to the start of the pane that is shown. The way back to the list is the host's own control. The
  element emits no event (FR-027 to FR-029).
- **Inspector**, "Slot on list-detail (Recommended)": `ocelle-list-detail` has an optional `inspector` slot, a third
  pane `--ocelle-shell-inspector-width` wide (the existing 19rem token answers #505's width ask). Below its own
  threshold the inspector stacks under the detail (FR-024, FR-026).
- **Scroller edges**, "Fade + forced-colours rule (Recommended)": the edge cue is a fade only, with no chevron
  buttons. In forced colours each side with content off-screen shows a 1 px line in the system text colour instead
  (FR-008).
- **Lane minimum width**, "10rem (Recommended)": `--ocelle-lane-min-width` is `10rem` (FR-015, SC-003).

**Operator decisions at the plan gate** (2026-11-13, plan squad round 1, `reviews/plan/round-1/refute.md`). These
amend the approved text:

- **Scroller role** (PLAN-A11Y-SECURITY-1-006 (b)): an overflowing labelled scroller is a named `group`, not a
  `region` landmark, so per-card chip rows do not flood the landmark list. Only the board keeps `region` (FR-002,
  FR-010, FR-014, US1-1, US1-12, US2-14).
- **Handover target** (PLAN-A11Y-SECURITY-1-007 (a)): when focus is handed to the element itself, an inner node of
  its shadow root takes it and shows the module's inset ring; `document.activeElement` is the host (FR-004, US1-4).
- **Pane widths include their rule** (PLAN-CORRECTNESS-1-003 (a)): the inspector's 19rem includes its 1 px border,
  so US3-12's three-column size is 1073 px (FR-023, US3-12).
- **Host ARIA scope** (PLAN-CORRECTNESS-1-005 (a)): for the scroller, the board and the lane a blank host
  `aria-label` counts as absent; 005's icon and brand mark keep their own rule, and the README scopes each (FR-010).
- **The plan's readings written into the spec** (PLAN-CORRECTNESS-1-006 (a)): focus clearance applies to focus that
  shows a ring (FR-001); upgrade moves focus only out of a pane the first layout hides (FR-028, Edge Cases); FR-011
  lists the fade outputs; SC-001 names the fallback exception; FR-018's and FR-025's grammars are stated exactly.
- **Native scrollbar kept** (PLAN-FRESH-1-003 (a)): the scroller's and the board's block size includes the
  platform's horizontal scrollbar where one is drawn, and the fades never cover it (FR-001, FR-007, US1-13).
- **Overflow inside a lane** (PLAN-FRESH-1-006 (b)): a change inside a lane that changes only a descendant's inline
  size is picked up at the board's next size, slot or scroll event (FR-014).
- **Default lane ground** (PLAN-CORRECTNESS-1-011 (b)): the default lane's ground is `--ocelle-color-sheet`, which
  differs from the canvas, panel and inspector grounds in both themes (US2-4, US2-11).
- **One-frame bound tested directly** (PLAN-TESTABILITY-1-004 (a)): US1-3's bound stays as written and is tested at
  that bound.

## Consumer need

- **Board and pipeline screens.** Kitty Desktop's board and pipeline screens build on the Spec Kitty class families
  `.sk-workflow-board` and `.sk-workflow-lane`, which force `class=` into the consumer. Their lanes have no minimum
  width, so five lanes do not fit a 1280 px window beside the context sidebar, and the page scrolls sideways instead
  of the board (spec-kitty-design#507). The pipeline screen needs a lane without the nested card look: a small
  uppercase title and a count (#506).
- **Lane counts.** Lane counts are visible only. Assistive technology does not hear them with the lane title (#15).
- **List and detail screens.** The record screens put the list and the selected record's detail side by side in
  hand-written grids. They need a fixed list track, a border between the panes, and a collapse to one column driven
  by the space the layout actually has, not the viewport, and by the app shell's narrow state (#530). The pipeline
  inspector needs a fixed width (#505), which `--ocelle-shell-inspector-width` already gives at 19rem (002's decision
  over #505's 260 px).
- **Horizontal strips.** Chip rows and other strips have no shared element (#514). Today they either scroll with no
  way to reach them by keyboard, or are tab stops even when nothing scrolls, and they show no sign that content is
  hidden. 003 measured part of this:
  - Chromium makes an overflowing box a tab stop only when it holds no focusable descendant (003 SPEC-3-01).
  - A stylesheet cannot add `tabindex`, so the fix needs an element (003 FR-017's open "wrapper fork").
- **Code blocks (#13).** #13's `ocelle-code-block` needs the same "tab stop only while it overflows" behaviour. This
  feature builds it once, as an internal module with an explicit interface (FR-011), so #13 reuses it rather than
  writing it again.
- **Expected outcomes elsewhere.** These are outcomes in other repositories and later missions that this feature
  makes possible but cannot show itself:
  - kitty-mission-ui replaces its board, lane and list-detail class uses and its local grids with these elements;
  - #12's app shell sets `narrow` on `ocelle-list-detail` in its narrow tier;
  - #13 builds `ocelle-code-block`'s scroll region on the overflow-region module.

  What this feature checks for them is SC-008 and SC-009.

## User Scenarios & Testing *(mandatory)*

The users of this feature are:

- host pages that lay out board, pipeline and record screens: Kitty Desktop's webview, Kitty Dashboard, and the
  Ocelle console's server-rendered pages under the strict CSP;
- keyboard and assistive-technology users of those hosts;
- the authors of later elements, people and agents, who reuse the overflow-region module and the container-tier
  convention;
- the operator, who reviews pull requests.

The conventions of 005's User Scenarios hold here unchanged, by reference: **Engines**, **The strict-CSP fixture**,
**Reading the accessibility tree** and **"Does not" outcomes are paired** (`specs/005-icons-brand-mark/spec.md`, User
Scenarios). In short:

- **Engines.** Behaviour is measured in Chromium only. WebKit is an open limitation that the README names.
- **Strict-CSP fixture.** Every browser scenario except the Storybook stories runs from the browser build on a
  strict-CSP fixture page. The page links `tokens.css`, and `base.css` too where a scenario says "with `base.css`".
  It is served with `default-src 'none'; script-src 'self'; style-src 'self'; font-src 'self'`, and it allows the
  same requests as in 005.
- **Accessibility tree.** It is read from Chromium's full accessibility tree with ignored nodes filtered out, and
  every element whose tree is read carries an `id`.

The rest of this section adds what 005 does not cover.

**Layout frames.** Several scenarios place an element in a frame that stands for a screen. Each frame is a block box
of a stated inline size on a page whose viewport is wider than the frame, so the element's own measurement is
tested, not the viewport's:

- **Frame W**, the 1280 px window beside a context sidebar. The viewport is 1280 px. The frame is the content cell:
  1280 − `shell-rail-width` (52 px) − `shell-sidebar-width` (320 px) − two `gutter`s (32 px) = **876 px**.
- **Frame R**, the 1280 px window with the rail only. 1280 − 52 − 32 = **1196 px**.
- **Frame N**, the narrow tier. The viewport is `shell-collapse-sidebar` (45rem, 720 px), where the sidebar has
  collapsed. The frame is 720 − 52 − 32 = **636 px**.
- **Frame S**, the 320 px reflow width. The viewport is 320 px. The frame is 320 − 32 = **288 px**.

All px figures assume the default root font size of 16 px. Every element of this feature is block-level and takes
its frame's inline size.

**Overflow.** A box "overflows" while its content's inline size exceeds its own visible inline size by more than
1 px. The 1 px tolerance absorbs sub-pixel rounding, so a box whose content fits exactly does not overflow. "Content
off-screen at the start" means its scroll position is more than 1 px from the inline-start end; "at the end" means
more than 1 px from the inline-end end. Both are measured in the box's inline direction, so under `dir="rtl"` the
start is on the right.

**"Does not" outcomes of this feature, paired.** Each row is tested together with its positive outcome in the same
test, and its plan names a planted defect that makes it fail:

| "Does not" outcome | Paired positive outcome in the same test | Planted defect that makes it fail |
|--------------------|------------------------------------------|-----------------------------------|
| A scroller that fits is not a tab stop, has no group role and no name (US1-1, FR-002) | A twin with more content on the same page is a tab stop and a named group | `tabindex="0"` and the role set whatever the overflow |
| No fade on a side with no content off-screen (US1-6, FR-007) | The other side, with content off-screen, shows its fade in the same test | Both fades always shown |
| No forced-colours line on a side with nothing off-screen (US1-8, FR-008) | The other side shows its line | Both lines always shown |
| A focused slotted control's focus ring is not clipped by the scroll box, at the inline start, the inline end and both block edges, in a fitting and in an overflowing scroller (US1-13, FR-001) | The scroller still does not scroll in the block direction, and its block size is its content's plus the ring room on each side | A scroll box with no room for the ring: no padding, so the ring is cut at its edges |
| A focused slotted control is not left under a fade (US1-13, FR-001) | At every step of the tab walk, each edge with content off-screen still shows its fade | A control scrolled into view with no clearance for the fade |
| Arrow keys on a focused descendant are not taken by the scroller (US1-10, FR-006) | With focus on the scroller itself, the same key scrolls it | A key handler on the host that calls `preventDefault` and scrolls for every arrow key |
| A board that fits Frame W does not scroll, is not a tab stop and has no region (US2-1, FR-016) | The same board in Frame N overflows, is a tab stop and is a named region | A board that always applies its region role and tab stop |
| A lane's visible title and count add no second text to the tree (US2-5, FR-019) | The lane's group is named "<title>, <count>" | The visible title not hidden from the tree, so "Ready 3" is read again inside the group |
| A lane without `count` shows no count and has no comma in its name (US2-6, FR-018) | A twin with `count="0"` shows "0" and is named "<title>, 0" | The count rendered as "0" when absent |
| An untitled lane without a count has no group role and no name, and an untitled lane with a count has no comma in its name (US2-6, FR-019) | A titled twin is a group named "<title>, <count>"; the untitled twin with `count="3"` is a group named "3" | The group role and the ", " separator always applied |
| A lane does not widen for content wider than its share (US2-14, FR-013) | In the same board, the nested overflowing scroller in that lane is a tab stop, and all lanes are equal within 1 px | A lane whose minimum inline size is its content's min-content (the flex default); a lane whose content feeds the board's intrinsic size (no inline-size containment) |
| A focused card in a `flat` lane at the board's edges is not clipped by the board's scroll box (US2-15, FR-014) | The board does not scroll in the block direction, and in Frame W it still does not overflow | A board scroll box with no room for the ring |
| In two columns, `detail-open` hides nothing (US3-4, FR-027) | In one column, the same attribute shows the detail and hides the list | `detail-open` applied in every layout |
| An empty `inspector` slot adds no track, no border and no space (US3-8, FR-024) | A filled slot adds a track `--ocelle-shell-inspector-width` wide with its border | The inspector track always rendered |
| In Frame W, a rejected `collapse-below` value that would give one column if accepted (`120%`, `80vw`, `110cqi`, `700pt`, `900`, `calc(56rem)`, `var(--x)` with `--x: 56rem`, `+56rem`, `5.6e1rem`), or a token override of `120%`, does not move the threshold: two columns (US3-10, FR-025) | On a twin, an accepted value moves it: in Frame W `56rem`, `56REM`, `55.5rem`, `880px`, `55em` and `" 56rem "` give one column; in Frame N `0` and `39rem` give two | Any value the browser can resolve to a length accepted |
| In Frame W, a rejected `inspector-below` value that would give three columns if accepted (`50%`, `40vw`, `50cqi`, `50pt`, `50`, `calc(50rem)`, `var(--y)` with `--y: 50rem`), or a token override of `50%`, keeps the inspector stacked (US3-10, FR-025) | On a twin in Frame W, `50rem` and `0` give three columns | Any value the browser can resolve to a length accepted |
| In a shrink-to-fit host the layout does not alternate between frames (US3-12, FR-025) | It shows the expected column count for its stated content and room | An intrinsic inline size that follows the layout shown |
| Focus is not moved when it was not in the pane that is hidden (US3-6, FR-028) | When focus was in that pane, it moves to the start of the shown pane | Focus moved on every switch |
| The page has no horizontal scroll at 320 px (US2-9, US3-9, SC-006) | Inside the same page, the overflowing board scrolls by itself | A board without its own overflow: the page then scrolls |

---

### User Story 1 - A horizontal strip that is a tab stop only while it overflows (Priority: P1)

A host wraps a row of chips, buttons or cards in `ocelle-scroller` with a `label`. While the row is wider than its
box, a keyboard user reaches the strip with Tab and scrolls it with the arrow keys, sees the focus ring, and sees a
fade on each side where content is hidden. A screen-reader user hears a named group. When the row fits, the strip
is just a row: no extra tab stop, no group, no fade. The overflow logic lives in one internal module that later
elements reuse.

**Why this priority**: the board (P2) scrolls with this pattern, #13 reuses it, and it carries most of the
accessibility risk: a focusable named group that comes and goes with the layout.

**Independent Test**: on the strict-CSP fixture, place one scroller with content wider than its box and a twin whose
content fits. Then:

- Tab to the overflowing scroller, scroll it with the arrow keys, and check its group node, name, focus ring and
  fades.
- Check that the fitting twin has none of them.
- Resize one scroller across the threshold and see the state follow.

**Acceptance Scenarios**:

1. **Given** `<ocelle-scroller label="Filters">` whose content fits, beside a twin whose content overflows, **When**
   the tree and the tab order are read, **Then**:
   - the fitting scroller contributes no group node and no tab stop, and its content is in the tree as it would be
     without the element;
   - the overflowing twin is exactly one tab stop, exposed as one node of role group named "Filters", which holds
     its content. It is not a landmark: no scroller adds a `region` node.
2. **Given** an overflowing scroller that holds links, **When** the user presses Tab from before it, **Then** focus
   lands on the scroller first, then on each link in order. Tab order does not depend on whether the content holds
   focusable elements; this closes 003's SPEC-3-01 gap for this element.
3. **Given** a fitting scroller, **When** its box narrows (a host resize) until the content overflows, **Then** it
   becomes the tab stop and the named group within one animation frame after the resize is observed. **When** it
   widens again until the content fits, **Then** both go. The same holds when the content grows or shrinks (an item
   added or removed, or text changed) while the box stays the same size.
4. **Given** focus on an overflowing scroller, **When** its content shrinks until it fits, **Then** the scroller stops
   being a tab stop and focus does not stay on an element that is no longer focusable. Focus moves to the scroller's
   first focusable descendant if it has one, also when that descendant's focusable part is inside its own shadow
   root (a slotted element whose button is in its open shadow root, or one that delegates focus). Otherwise focus
   moves to the scroller itself: a node inside its shadow root takes focus without being in the tab order, the
   document's active element is the scroller's host, and the token focus ring shows inside the scroller's box, drawn
   inset, in the system highlight colour in forced colours (FR-004).
5. **Given** focus on an overflowing scroller, in `dir="ltr"` and in `dir="rtl"`, **When** the user presses the arrow
   key that points toward the hidden content, **Then** the strip scrolls toward it by at least 40 px per key press.
   ArrowRight moves toward the content on the right and ArrowLeft toward the content on the left, in both
   directions. The page itself does not scroll. **When** an arrow key is pressed with Alt, Ctrl, Meta or Shift held,
   or during text composition, **Then** the scroller does not take it: it does not call `preventDefault` and does
   not change the scroll position, so the browser's own shortcut (Alt+ArrowLeft goes back) applies.
6. **Given** an overflowing scroller at its inline start, **When** it is drawn, **Then** a fade shows at its
   inline-end edge and none at its inline-start edge. **When** it is scrolled to the middle, **Then** both edges fade.
   **When** it is scrolled to the end, **Then** only the inline-start edge fades. Under `dir="rtl"` the sides follow
   the inline direction: at the start the fade is on the left.
7. **Given** the fade, **When** its geometry is measured, **Then** it covers `--ocelle-scroller-fade-size` (FR-007)
   at that edge. It fades the content itself toward transparency rather than painting a colour, so it is correct on
   every main ground and in both themes. It does not cover the scroll box's focus ring (FR-005), the ring of a
   slotted control that has just taken focus with a ring (FR-001, US1-13), or the horizontal scrollbar where the
   platform draws one.
8. **Given** forced-colours mode and an overflowing scroller in the middle, **When** it is drawn, **Then** each side
   with content off-screen shows a 1 px line in `CanvasText` along that edge. A side with nothing off-screen shows no
   line. The content is not faded.
9. **Given** keyboard focus on an overflowing scroller, **When** it is drawn, **Then** it shows the token focus ring
   (`--ocelle-color-focus`, `--ocelle-focus-width`) drawn inside its own box, so no ancestor's overflow clips it
   (003: an outset ring at an edge loses its sides). In forced colours the ring is drawn in the system highlight
   colour. Focus by pointer shows no ring (`:focus-visible`).
10. **Given** focus on a link inside an overflowing scroller, **When** the user presses an arrow key, **Then** the
    scroller does not take the key: the link receives it as it would without the element, and the scroller does not
    call `preventDefault` on it.
11. **Given** `prefers-reduced-motion: reduce`, **When** the fades appear or disappear and the arrow keys scroll,
    **Then** nothing animates. Without that preference, a fade's appearance may transition over `--ocelle-motion-fast`
    at most.
12. **Given** an overflowing scroller with no `label`, or a blank one, **When** the tree and the tab order are read,
    **Then** it is still one tab stop, so its hidden content stays reachable by keyboard (WCAG 2.1.1). It has no
    group role (an unnamed group adds nothing), and it is named by nothing. The README says to always give a
    `label`, and that a scroller repeated per item takes a name that identifies the item ("Tags of WP-12"). A host
    `aria-label` on the element counts as its label (FR-010). A host `aria-label=" "` counts as absent: with
    `label="Filters"` the group is named "Filters", and without a `label` there is no group role.
13. **Given** a scroller whose content is taller than one line, **When** it is drawn, **Then** it scrolls in the
    inline direction only: its block size is its content's block size plus the ring room of FR-001 on each block
    side, plus the horizontal scrollbar's thickness where the platform draws a scrollbar that takes space, and
    nothing is scrollable in the block direction. Where a scrollbar is drawn, the fades do not cover it. **Given** a slotted link and a slotted button, in a
    fitting scroller and in an overflowing one, **When** each is focused by keyboard at the inline start of the strip,
    at its inline end (reached with Tab, so the strip scrolls to it) and in the middle, **Then** the control's whole
    token focus ring is visible on all four sides: `--ocelle-focus-width` of ring at `--ocelle-focus-offset` from the
    control, nothing of it cut off by the scroll box, at the inline edges or at the block edges. A control that takes
    focus while partly off-screen is scrolled fully into view, ring included. **Given** an overflowing scroller
    holding twelve links, each narrower than the box less two fade depths and the ring room, in `dir="ltr"` and in
    `dir="rtl"`, **When** the user tabs through it link by link from the first to the last, and then back with
    Shift+Tab, **Then** at every step, after the focused link has been scrolled into view:
    - the link's ring box (FR-001) lies inside the scroll box and does not intersect the region
      `--ocelle-scroller-fade-size` deep along any inline edge that shows a fade;
    - each edge with content off-screen still shows its fade (US1-6), so no fade is hidden to clear the link.

    **Given** a slotted button whose ring box is wider than the box less two fade depths, in an overflowing scroller
    scrolled to the middle, **When** it takes keyboard focus, **Then** no fade is drawn over its ring box, also over
    the following animation frames, and the fade returns when focus leaves it or when the user scrolls the box.

    **Given** a slotted button and, in a twin scroller, a slotted `<input type="text">`, each half under the end fade
    of an overflowing scroller, **When** each is focused by a pointer click, **Then** the button is not scrolled by
    the scroller (its scroll position after the click is the one the browser gives a plain scroll box with the same
    content), and the text input, which shows its focus ring on pointer focus, is scrolled clear of the fade as for
    keyboard focus (FR-001).
14. **Given** a scroller with the `hidden` attribute, **When** the page is drawn, **Then** it has no box, no node and
    no tab stop, whether its content overflows or not.
15. **Given** the browser build on the strict-CSP fixture with every scroller of these scenarios, **When** the page
    loads and is used, **Then** there are no CSP violations and no requests outside the fixture's allowed list.
16. **Given** a test-only element built on the overflow-region module (FR-011), with a scroll box of its own that is
    not `ocelle-scroller`, **When** scenarios 1, 3, 4 and 12 run against it, **Then** they hold. The module, not the
    scroller element, carries the behaviour.

---

### User Story 2 - A board whose lanes fit a 1280 px window and scroll by themselves when narrower (Priority: P2)

A host lays out a workflow board as `ocelle-workflow-board` holding `ocelle-workflow-lane` elements, each with a
title and a count, and slots its cards into the lanes. At 1280 px beside the context sidebar, five lanes fit side by
side. In a narrower space the board scrolls inside itself, using User Story 1's behaviour, and the page never scrolls
sideways. The pipeline screen uses the `flat` lane variant: no card chrome, a small uppercase title and a count. A
screen-reader user hears each lane's title together with its count.

**Why this priority**: it closes three of the five spec-kitty-design gaps of #15 (#506, #507, and counts for
assistive technology). It needs P1's overflow behaviour.

**Independent Test**: place a board of five lanes, with cards in them, in Frame W and in Frame N. Measure the lanes
and the board's overflow state, read the lane names in the tree, and draw both lane variants.

**Acceptance Scenarios**:

1. **Given** a board of five lanes in Frame W (876 px), each holding cards whose text is a sentence wider on one line
   than the lane (for example "Implement the overflow region module and its tests for the scroller"), **When** it is
   drawn, **Then** all five
   lanes are side by side, each at least `--ocelle-lane-min-width` (10rem, 160 px) wide. The board does not overflow,
   is not a tab stop and has no region node.
2. **Given** the same board in Frame N (636 px), **When** it is drawn, **Then** each lane keeps
   `--ocelle-lane-min-width`. The board overflows and behaves as User Story 1's overflowing scroller, except that its
   role is `region`: one tab stop, a region named by the board's `label`, arrow-key scrolling and the edge fades. The
   page has no horizontal scroll.
3. **Given** a board of three lanes in Frame W, **When** it is drawn, **Then** the lanes share the board's inline size,
   less its ring room on each inline side (FR-014), equally (within 1 px), the gaps between them are `--ocelle-space-3`,
   and the board does not overflow.
4. **Given** a lane in its default variant, **When** it is drawn, **Then** it has the lane chrome: a
   `--ocelle-color-sheet` ground, `--ocelle-radius-row` corners and `--ocelle-space-3` padding. In light and in dark
   its ground differs from `--ocelle-color-canvas`, `--ocelle-color-panel` and `--ocelle-color-inspector` (and from
   `--ocelle-color-pane`), so the chrome is visible on each of those grounds. Its title is in
   `--ocelle-font-size-sm` at `--ocelle-font-weight-strong` in `--ocelle-color-ink`, and its count follows the title
   in `--ocelle-color-ink-muted` with tabular figures.
5. **Given** `<ocelle-workflow-lane label="Ready" count="3">`, **When** the tree is read, **Then** the lane is exactly
   one node of role group named "Ready, 3", which holds the slotted content. The visible title and count add no
   further text node. **Given** the same lane with `count-label="3 work packages"`, **Then** the group is named
   "Ready, 3 work packages", and the visible count still shows "3".
6. **Given** a lane without `count`, or with an attribute value that is not decimal digits alone after trimming
   (`-1`, `2.5`, `abc`, `+3`, `3.0`, `3e0`, empty), **When** it is drawn and the tree is read, **Then** no count is
   shown and the group is named by the title alone, with no comma. **Given** `count="0"`, **Then** "0" shows and the
   group is named "Ready, 0". **Given** `count=" 3 "` or `count="03"`, **Then** "3" shows. **Given** a lane whose
   `label` is absent, empty or whitespace-only (`"  "`), **Then** no title is shown, and:
   - with `count="3"`, "3" shows and the lane is one node of role group named "3", with no comma; with
     `count-label="3 work packages"` as well, the group is named "3 work packages";
   - without a count shown, the lane has no role and no name, and its content is in the tree as it would be without
     the element.

   **Given** `label=" Ready "` and `count="3"`, **Then** the title shows "Ready" and the group is named "Ready, 3".
   **Given** a host `aria-label="Ready column"` on a lane with `label="Ready"` and `count="3"`, and on an untitled lane
   without a count, **Then** each is one node of role group named exactly "Ready column": the host `aria-label`
   decides naming alone, as for the scroller (FR-010). The visible title and count still show. **Given** a host
   `aria-label=" "` on a lane with `label="Ready"` and `count="3"`, and on an untitled lane without a count, **Then**
   it counts as absent: the first is a group named "Ready, 3", and the second has no role and no name.
7. **Given** a lane with `variant="flat"`, **When** it is drawn, **Then**:
   - it has no ground, no corners and no padding of its own, and its cards sit directly on the board's ground;
   - its title is in uppercase (`text-transform: uppercase`, so the accessible name keeps the host's case), in
     `--ocelle-font-size-xs` at `--ocelle-font-weight-strong`, in `--ocelle-color-ink-soft`, spaced by
     `--ocelle-tracking-caps` (FR-021), in the sans with tabular figures, never a monospace face;
   - the count follows it in the same style.

   The tree is the same as for the default variant.
8. **Given** a lane whose title is longer than the lane is wide, **When** it is drawn, **Then** the title wraps
   between words, and a single long word breaks anywhere, inside the lane. The lane never widens beyond its share,
   and the count stays visible.
9. **Given** a board in Frame S (288 px), **When** the page is drawn, **Then** the page has no horizontal scroll. The
   board scrolls inside itself, and each lane keeps `--ocelle-lane-min-width`.
10. **Given** a board or lane with `dir="rtl"`, **When** it is drawn, **Then** the first lane is at the right, the
    count follows the title in the inline direction, and the board's fades and arrow keys follow User Story 1
    scenarios 5 and 6.
11. **Given** forced-colours mode, **When** a default lane is drawn, **Then** its boundary stays visible as a 1 px
    border in `CanvasText` (the sheet ground is removed by forced colours). The flat lane shows no border. The
    board's edge lines follow User Story 1 scenario 8.
12. **Given** a board and a lane with the `hidden` attribute, **When** the page is drawn, **Then** each has no box and
    no node.
13. **Given** the browser build on the strict-CSP fixture with every board and lane of these scenarios, **When** the
    page loads, **Then** there are no CSP violations and no requests outside the allowed list.
14. **Given** a board of five lanes in Frame W where one lane holds a card with a 60-character unbroken identifier and
    an `<img>` 400 px wide, and another holds an `<ocelle-scroller label="Tags">` whose chip row is 400 px wide,
    **When** it is drawn, **Then** the five lanes are equal in inline size within 1 px (as without that content) and
    the board does not overflow. The identifier breaks inside the lane, the image is no wider than the lane's content
    box, and the nested scroller takes the lane's content width, overflows, and is a tab stop and a group named
    "Tags" of its own, not a landmark (Edge Cases, "Nested scrollers").
15. **Given** a board of five `flat` lanes, in Frame W and in Frame N, each lane holding three cards that are each a
    focusable link block as wide as the lane whose text is a sentence wider on one line than the lane, **When** each
    of these cards is focused by keyboard (Tab and
    Shift+Tab): the first card of the first lane, the last card of the last lane, and the first and the last card of
    the middle lane, **Then**:
    - the card's whole token focus ring shows on all four sides, nothing of it cut off by the board's scroll box at
      the inline start of the first lane, the inline end of the last lane, or the block start and block end of a lane;
    - in Frame N, where the board overflows, a card in a lane partly off-screen is scrolled into view with its ring
      box clear of the fades (FR-001, US1-13);
    - the board does not scroll in the block direction, and in Frame W it still does not overflow.

---

### User Story 3 - A list beside its detail that collapses to one column by the space it has (Priority: P3)

A host lays out a record screen as `ocelle-list-detail`, with the list in the `list` slot, the selected record's
detail in the default slot and, optionally, an inspector in the `inspector` slot. With room, the list sits in a fixed
track beside the detail, and the inspector sits beside the detail when there is room for three columns. When the
element is narrower than its threshold, or the host sets `narrow`, it shows one pane at a time. The host chooses which
pane with `detail-open`, and focus follows the pane that is shown.

**Why this priority**: it closes #530 and gives #505's inspector its pane. It depends on nothing in P1 or P2. It
defines the container-tier convention that #8 and #12 reuse.

**Independent Test**: place a list-detail with all three slots filled in Frames R, W and N, and with `narrow`.
Measure the tracks and borders, toggle `detail-open` with focus in each pane, and check what shows and where focus
goes.

**Acceptance Scenarios**:

1. **Given** a list-detail with list, detail and inspector, in Frame R (1196 px = 74.75rem), **When** it is drawn,
   **Then** three columns show in inline order:
   - the list, `--ocelle-list-track-width` (18rem, 288 px) wide;
   - the detail, which takes the rest;
   - the inspector, `--ocelle-shell-inspector-width` (19rem, 304 px) wide, its 1 px border included (FR-023).

   A 1 px `--ocelle-color-rule` border runs between each pair of adjacent panes. The borders are decorative and
   nothing interactive is drawn on them (constitution II).
2. **Given** the same element in Frame W (876 px = 54.75rem), which is below `--ocelle-list-detail-inspector-collapse`
   (60rem) and at or above `--ocelle-list-detail-collapse` (40rem), **When** it is drawn, **Then** two columns show:
   the list track and the detail. The inspector is stacked under the detail, inside the detail column, at the
   column's full width, with a 1 px `--ocelle-color-rule` border between them.
3. **Given** the same element in Frame N (636 px = 39.75rem), which is below `--ocelle-list-detail-collapse`, **When**
   it is drawn without `detail-open`, **Then** only the list shows, at the frame's full width. The detail and the
   inspector have no box and contribute no node. **When** the host sets `detail-open`, **Then** only the detail
   shows, with the inspector stacked under it, and the list has no box and no node.
4. **Given** the element in Frame W with `detail-open` set, **When** it is drawn, **Then** it is the two-column layout
   of scenario 2: in two or three columns `detail-open` hides nothing.
5. **Given** the element in Frame W with the `narrow` attribute, **When** it is drawn, **Then** it is the one-column
   layout of scenario 3, as in Frame N. Removing `narrow` restores two columns.
6. **Given** one column, with keyboard focus on an item in the list, **When** the host sets `detail-open`, **Then**
   focus moves to the start of the detail pane: the pane itself takes focus, without becoming a tab stop, and shows
   the token focus ring drawn inset, inside the element's box, so an ancestor with `overflow: hidden` does not clip
   it (the system highlight colour in forced colours). The next Tab reaches the detail's first focusable element.
   Before any such move, no pane is focusable: a click on text in a pane does not focus the pane. **When** the host removes `detail-open` while focus is in the
   detail, **Then** focus moves to the start of the list pane in the same way. **Given** focus outside the element,
   or in the pane that stays shown, **When** `detail-open` changes, **Then** focus is not moved.
7. **Given** two columns, with focus in the detail, **When** the element narrows into one column without `detail-open`
   (the host resizes it, or sets `narrow`), **Then** the detail is hidden and focus moves to the start of the list
   pane, as in scenario 6. Focus never stays on a node that has no box.
8. **Given** a list-detail with nothing in the `inspector` slot, in Frame R, **When** it is drawn, **Then** there are
   two columns, list and detail, and no inspector track, border or space. Slotting an inspector after the first
   render adds them (scenario 1), and removing it again takes them away.
9. **Given** the element in Frame S (288 px), **When** the page is drawn, **Then** one pane at a time shows at full
   width and the page has no horizontal scroll.
10. **Given** the element with all three slots filled, **When** it is drawn with each `collapse-below` value below,
    **Then** it shows the stated layout. Without the attribute it shows two columns in Frame W (876 px, 54.75rem) and
    one column in Frame N (636 px), against the default 40rem (640 px). Each value is chosen so that its outcome
    differs from the default's:
    - **Accepted forms move the threshold** (FR-025). In Frame W, `56rem` (896 px), `56REM` (units are
      case-insensitive), `55.5rem`, `880px`, `55em` (at the root's 16 px), and `" 56rem "` (trimmed) give one column. With the element's own font size set to 20 px,
      `45em` (900 px at the element's font size, 720 px if read at the root's) gives one column. In Frame N, `0` and
      `39rem` (624 px) give two columns.
    - **Rejected values do not.** In Frame W each of these would give one column if it were accepted, and each gives
      two, as without the attribute: `120%` (1051 px of the element), `80vw` (1024 px of the 1280 px viewport),
      `110cqi` with the frame set as an inline-size query container (964 px), `700pt` (933 px), `900` (a unitless
      number other than 0), `calc(56rem)` (896 px), `var(--x)` with `--x: 56rem` set on the element, `+56rem` (a
      sign) and `5.6e1rem` (an exponent).
    - **Parsing cases.** `-1rem`, `-0`, `.5rem` and `56.rem` (no digit before or after the point), `wide`, `" "` and
      the empty string count as absent: two columns in Frame W.
    - **Exclusive bound.** `collapse-below="876px"` in Frame W, where the element is exactly as wide as its
      threshold, gives two columns: the wider layout applies (#8's "exclusive bound").
    - **Token default.** With no `collapse-below` and a host rule that sets `--ocelle-list-detail-collapse: 56rem` on
      the element, and in a second case on an ancestor, one column shows in Frame W: the default is the token's value
      as computed on the element. With that token set to `120%`, which would give one column if it were accepted,
      the published default (40rem) applies and two columns show.
    - **`inspector-below`.** The same rules hold against the inspector threshold, whose default 60rem (960 px) stacks
      the inspector in Frame W. In Frame W, `50rem` (800 px) and `0` give three columns. Each of `50%` (438 px), `40vw`
      (512 px), `50cqi` with the frame as container (438 px), `50pt`, `50`, `calc(50rem)` and `var(--y)` with `--y:
      50rem` would give three columns if accepted, and each keeps the inspector stacked.
      `--ocelle-list-detail-inspector-collapse: 50rem` on the element gives three columns, and set to `50%` it keeps the
      inspector stacked.
11. **Given** a detail pane that holds an unbroken long identifier or a wide table, **When** it is drawn in two
    columns, **Then** the list track keeps its width and the detail column does not widen past the remaining space.
    The long content wraps or scrolls inside the detail (003's base styles), and the page has no horizontal scroll.
12. **Given** the element with all three slots filled, its list holding short text items and its detail holding one
    block 30rem wide that does not wrap, as a default flex item in a flex row the width of Frame R (1196 px), **When**
    it is drawn, **Then** it does not collapse to 0 px and its panes are visible (003's `container-type` pitfall). Its
    inline size is that of its three-column layout, 18rem + 30rem + 19rem plus the detail's 1 px border (1073 px; the
    inspector's border is inside its 19rem, FR-023), and it shows three columns. **Given** the same element in a flex row the width of Frame N (636 px), **Then** it shrinks
    to 636 px and shows one column. In both cases the column count is the same on each of ten consecutive animation
    frames with no size change: the layout does not alternate. The same holds in a `<dialog>` and a table cell.
13. **Given** `dir="rtl"`, **When** the element is drawn in three columns, **Then** the list is at the right and the
    inspector at the left, with the borders between them.
14. **Given** the element and each pane, **When** the tree is read, **Then** the element adds no landmark or role of
    its own. Each pane's slotted content appears in the tree in pane order (list, detail, inspector) as it would
    without the element. The README says that the host names its own landmarks or headings in the panes.
15. **Given** the element with the `hidden` attribute, **When** the page is drawn, **Then** it has no box and no node.
16. **Given** the browser build on the strict-CSP fixture with every list-detail of these scenarios, **When** the page
    loads and is used, **Then** there are no CSP violations and no requests outside the allowed list.

---

### Edge Cases

- **Scroller without overflow support in the host.** A host rule that sets `overflow` or `inline-size` on the
  scroller's host is allowed. The scroller measures its own scroll box, so the tab stop follows the size the host
  gives it.
- **Scroller or board inside a shrink-to-fit host.** In a default flex item, a dialog or a table cell, a scroller or a
  board takes its content's size (for a board, its lanes' minimum widths and gaps) and does not overflow, so it is
  not a tab stop, and it may make the page scroll sideways. A host that wants it to scroll gives it a definite or
  maximum inline size, and the README says so for both elements. It never collapses to 0 px.
- **Nested scrollers.** A scroller inside a scroller, such as a lane's chip row inside an overflowing board: each
  measures its own box, and each is its own tab stop while it overflows. The nested scroller is a named group, not a
  landmark, so chip rows repeated per card do not add to the landmark list.
- **Content changes while scrolled.** When content is removed so that the scroll position is past the new end, the
  browser clamps it, and the fades and the tab stop follow the clamped position.
- **Zoom and root font size.** The lane width, the list track, the inspector and the thresholds are `rem` tokens, so
  page zoom and a changed root font size move every figure together, the scroller's fade depth and focus clearance
  too. The frames' px figures assume 16 px; each element also has one case at a 20 px root font size.
- **Many lanes.** With twelve lanes in Frame W, each keeps `--ocelle-lane-min-width` and the board scrolls.
- **One lane, or no lanes.** One lane takes the board's full inline size. A board with no lanes draws an empty box,
  does not overflow and adds no node.
- **Lane content.** A lane slots any content. It needs no `ocelle-card` (#8): cards from #8, or the host's own
  markup, sit in the lane's default slot in order.
- **Non-lane children of a board.** A board slots any element. Any child, a lane or not, takes the same minimum
  (`--ocelle-lane-min-width`) and the same equal share as a lane (FR-013). The README says that a board holds lanes.
- **Lane count updates.** Changing `count` or `count-label` updates the visible count and the group's name. An
  announcement of the change is not made: the element is not a live region. A host that needs an announcement uses
  #9's notice.
- **list-detail with an empty list slot.** The list track still shows at its width. An empty detail slot shows an
  empty detail column, because the host's empty state is the host's content.
- **`detail-open` before the element upgrades.** A server-rendered page that writes `detail-open` in its HTML gets
  the detail pane shown once the element is defined. At upgrade focus is moved only when it is inside a pane that
  the first layout hides: it then moves to the start of the shown pane, as in US3-7, because focus never stays on a
  node that has no box. Otherwise upgrading moves no focus.
- **Container tiers and the viewport.** The thresholds are measured on the element, not the viewport. A list-detail
  in a 640 px column of a 1920 px window is in one column below 40rem, whatever the window.
- **Print.** These elements are screen layouts. In print, a board shows its lanes as the browser lays them out, and
  content off-screen in a scroller is not printed. This is noted in the README, not designed (003 FRESH-3-002).
- **Two copies on a page.** As for every element: the first definition wins (005 FR-006).

## Requirements *(mandatory)*

### Functional Requirements

**`ocelle-scroller`**

- **FR-001**: `ocelle-scroller` is a block-level element that lays out its slotted content in one scroll box that
  scrolls in the inline direction only. Nothing scrolls in the block direction. The box keeps room for the token
  focus ring of its slotted controls on all four sides: its block size is its content's block size plus that room on
  each block side, plus the thickness of the platform's horizontal scrollbar where one is drawn that takes space (the
  native scrollbar is kept, operator decision), and its scrollable content has that room before the first and after
  the last item in the inline direction. The ring room is `--ocelle-focus-offset` plus `--ocelle-focus-width` (5 px
  today). The control's "ring box" is its border box grown by the ring room on each side. A slotted control that takes
  focus with a focus ring (it matches `:focus-visible`: keyboard focus, script focus after keyboard use, and any focus
  of a text-entry control, which the browser rings on pointer focus too) is scrolled fully into view, ring included,
  so no part of a focused control's ring is cut off by the scroll box at any edge, whether the box overflows or not.
  It is also never left under a fade (FR-007): once it has been scrolled into view, its ring box is at least
  `--ocelle-scroller-fade-size` from each inline edge that still shows a fade. When the box is too narrow for that
  (the ring box is wider than the box less a fade's depth on each side that fades), the fade is not drawn on a side
  where it would cover the focused control, until focus leaves the control or the user scrolls the box. Focus without
  a ring (a pointer click on a button or link) gets only the browser's own focus scrolling, so the strip does not
  move from under the pointer (operator decision, plan gate). A user's own scrolling may move the focused control under a fade or off-screen, as it may without the element
  (US1-13). For the Overflow rule of User Scenarios the inline ring room counts as part of the content, so content
  fits when it and the room on both inline sides fit. It has one default slot.
- **FR-002**: While the scroll box overflows (User Scenarios, "Overflow"), it is a tab stop (`tabindex="0"`). With a
  non-empty label (FR-010) it is one node of role group with that name; it is not a landmark (operator decision, plan
  gate; the board alone is a region, FR-014). While the box does not overflow, it is not
  focusable, has no role and no name, and its content is exposed as it would be without the element. The state
  follows changes to the box's size and to its content's size or children within one animation frame (US1-1, US1-3).
- **FR-003**: The tab stop is the scroll box, which comes before its slotted content in the tab order whatever that
  content holds (US1-2).
- **FR-004**: When the box stops overflowing while it has focus, focus moves to the first focusable slotted element,
  found in the flat tree: a slotted element's open shadow root is searched, and a host that delegates focus counts as
  focusable. When there is none, focus moves to the element itself: a node in its shadow root takes focus by script
  only (`tabindex="-1"` while it holds focus), so `document.activeElement` is the host, and it shows the token focus
  ring inset inside the element's box, in the system highlight colour in forced colours (operator decision, plan
  gate). Nothing is written to the host. Focus never stays on a node that is no longer focusable (US1-4).
- **FR-005**: The focused scroll box shows the token focus ring (`--ocelle-color-focus`, `--ocelle-focus-width`) on
  `:focus-visible`, drawn inside its own box. The fades never cover it. In forced colours the ring uses the system
  highlight colour (US1-9).
- **FR-006**: While the scroll box has focus, ArrowLeft and ArrowRight scroll it toward the content in that visual
  direction by at least 40 px per press, in both writing directions, and the page does not scroll. The browser's own
  scrolling of a focused scroll box may provide this. Keys pressed while a slotted element has focus are not handled
  by the scroller, nor are arrow keys pressed with Alt, Ctrl, Meta or Shift held or during text composition: those
  get the browser's default (US1-5, US1-10).
- **FR-007**: Each inline edge with content off-screen on its side shows a fade `--ocelle-scroller-fade-size` deep
  (new token, `var(--ocelle-space-7)`, 2rem) that fades the content toward transparency. An edge with nothing
  off-screen shows none, and a fade that would cover a focused slotted control is not drawn as FR-001 says. The fades
  follow the inline direction (US1-6, US1-7). They are styled from tokens, add no node and no name, never take
  pointer events from the content under them, and never cover the horizontal scrollbar where one is drawn.
- **FR-008**: In forced colours the fades are not drawn. Each edge with content off-screen shows a 1 px line in
  `CanvasText`, and an edge with nothing off-screen shows none (operator decision; US1-8).
- **FR-009**: Under `prefers-reduced-motion: reduce` nothing of the scroller animates, and the element never sets
  smooth scrolling. Otherwise a fade may transition over at most `--ocelle-motion-fast` (US1-11).
- **FR-010**: `label` (attribute and property, not reflected, `string | undefined`, default absent) names the group.
  It is trimmed, and empty or whitespace-only counts as none. A host `aria-label` on the element counts as a label and,
  when it holds a non-whitespace character, decides naming alone; an empty or whitespace-only host `aria-label`
  counts as absent, as a blank `label` does. This is the rule for the scroller, the board and the lane; 005's icon and
  brand mark keep theirs (a blank host `aria-label` leaves them unlabelled), and the README's Host ARIA section states
  which rule applies to which element (operator decision, plan gate). Without a label an overflowing scroller is
  still a tab stop, but it has no group role (US1-12). No ID reference crosses the shadow root.

**The overflow-region module (internal, for reuse)**

- **FR-011**: The focus clearance of FR-001, the behaviour of FR-002 to FR-006 and the edge state of FR-007 and
  FR-008 are built as one internal
  module of `@ocelle/elements`, not an entry point and not public surface. Its interface is explicit and documented in
  the README's element conventions, so #13's `ocelle-code-block` and this feature's board use it without changing it:
  - **Inputs.** The host element. The scroll box, an element in the host's shadow root. The current label, or none.
    The role the box takes while named: `group` (the default, the scroller's and #13's) or `region` (the board's).
  - **Outputs.** Read by the host's render: whether the box overflows; whether content is off-screen at the inline
    start and at the inline end; whether each side's fade (and forced-colours line) is drawn, which is "off-screen on
    that side" less the FR-001 suppression; and the name in force (operator decision, plan gate).
  - **Effects.** On the scroll box and the module's own shadow nodes only: the tab stop, the role and the name
    (FR-002, FR-010), focus clearance (FR-001) and the focus handover (FR-004). Nothing is written to the host. The
    host re-renders when an output changes.
  - **Lifecycle.** It starts observing when the host is connected and stops when it is disconnected.

  It emits no event. The plan writes this interface as a contract (`contracts/overflow-region.md`). A test-only
  element built on the module proves that the module, not `ocelle-scroller`, carries the behaviour (US1-16).

**`ocelle-workflow-board` and `ocelle-workflow-lane`**

- **FR-012**: Both are elements, not class families. `ocelle-workflow-board` has one default slot for its lanes.
  `ocelle-workflow-lane` has one default slot for the lane's content. Neither renders cards or items of its own.
- **FR-013**: The board lays its children out in one row in the inline direction, with `--ocelle-space-3` between
  them. Each child, a lane or not, takes at least `--ocelle-lane-min-width`, and the children share any extra inline
  space equally (US2-1, US2-3). A lane's minimum inline size is `--ocelle-lane-min-width`, never its content's
  min-content size, so no content widens a lane past its share. Content wider than the lane is laid out at the lane's
  width:
  - text breaks between words, and inside a word only when the word alone is wider than the lane (as the title does,
    FR-020), unless the host's own styles set otherwise;
  - each slotted child, and an image or other replaced element in it, is at most the lane's content width;
  - a nested `ocelle-scroller` takes the lane's content width and scrolls inside itself;
  - content that still cannot shrink (a descendant with a fixed inline size) is not clipped: it overflows the lane,
    and when it reaches past the board's end, the board overflows and scrolls (FR-014). The README tells hosts to put
    wide content in an `ocelle-scroller`.

  The lanes' shares stay equal within 1 px whatever their content (US2-14).
- **FR-014**: The board scrolls inside itself through the overflow-region module (FR-011), with FR-002 to FR-010 applied
  to it. FR-001 applies to its scroll box as well, for every focusable descendant, whether slotted directly or inside a
  lane: the box scrolls in the inline direction only, it keeps the ring room on all four sides whether it overflows or
  not, that inline room counts as content for the Overflow rule, and a descendant that takes focus is scrolled into view
  with its whole ring and clear of the fades. So a focused card in a `flat` lane, which has no padding of its own, keeps
  its whole ring at the board's edges (US2-15). The board's box takes the role `region`, not `group`: one board per
  screen is a landmark worth listing (operator decision, plan gate). `label` (attribute and property, not reflected,
  `string | undefined`, default absent) names the board's region while it overflows. FR-002's "content's size" is,
  for the board, its lanes' size: a change inside a lane that changes only the inline size of a descendant (and so
  neither the box's nor a lane's size) is picked up at the board's next size, slot or scroll event; a change that
  also changes a lane's block size is picked up within one frame (operator decision, plan gate). In a block container
  of definite inline size, such as the frames of User Scenarios, the board takes that container's inline size and never makes the page scroll in the inline
  direction (US2-2, US2-9, SC-006). In a shrink-to-fit host it takes its lanes' size, as the scroller does (Edge Cases,
  "Scroller or board inside a shrink-to-fit host").
- **FR-015**: A new token `--ocelle-lane-min-width` is `10rem` (operator decision). Five lanes at that width with four
  `--ocelle-space-3` gaps need 848 px, and 858 px with the board's inline ring room (FR-014, 5 px on each side),
  which fits Frame W's 876 px (SC-003).
- **FR-016**: In Frame W a board of five lanes does not overflow, and in Frame N it does. Both are tested (US2-1,
  US2-2).
- **FR-017**: `variant` (attribute and property, reflected, `"flat" | undefined`, default absent) selects the lane's
  look. The default draws the lane chrome of US2-4. `flat` draws none of it, with the title style of US2-7. Any other
  value gives the default. Variant rules sit inside `@media not (forced-colors: active)` (005's conventions), and in
  forced colours the default lane draws a 1 px `CanvasText` border (US2-11).
- **FR-018**: `label` (attribute and property, not reflected, `string | undefined`, default absent) is the lane's
  title, shown and used as its name. It is trimmed, and empty or whitespace-only counts as absent: no title is shown
  (US2-6). `count` (attribute and property, not reflected, `number | undefined`, default absent) is shown
  after the title with tabular figures when it is a whole number of 0 or more, and is otherwise treated as absent
  (US2-5, US2-6). The attribute is such a number exactly when, after trimming, it is decimal digits only (no sign,
  point or exponent) and at most `Number.MAX_SAFE_INTEGER`; the property, when it is a safe integer of 0 or more. The
  count is shown and named as plain digits with no leading zeros ("03" shows "3").
- **FR-019**: The lane is exposed as one node of role group. Its name is the title, followed when a count is shown by
  ", " and then `count-label` if non-empty, or the count otherwise. Without a title, the name is `count-label` or the
  count alone, with no separator; without a title and without a shown count, the lane has no role and no name and
  its content is exposed as it would be without the element. A host `aria-label` on the lane counts as its name and,
  when present, decides naming alone (the lane is then a group with that name), as for the scroller (FR-010). An
  empty or whitespace-only host `aria-label` counts as absent. `count-label` is an attribute and property, not
  reflected, `string | undefined`, default absent, and trimmed. The visible title and count add no further node or
  text to the tree. No built-in word is added to the name in any language (operator decision; US2-5).
- **FR-020**: A lane's title wraps inside the lane between words, and breaks inside a word only when the word alone is
  wider than the lane. The lane does not widen for it (US2-8).
- **FR-021**: A new token `--ocelle-tracking-caps` (`0.06em`) sets the letter spacing of small uppercase labels. It is
  used by the flat lane's title, and #8's eyebrow is expected to reuse it (Assumptions, "Sibling tokens"). The flat
  title is never set in a monospace face: no `font-family` other than `--ocelle-font-sans` (constitution II).

**`ocelle-list-detail`**

- **FR-022**: `ocelle-list-detail` is a block-level element with three slots: `list`, the default slot (the detail)
  and `inspector`. Each slot is shown in its own pane.
- **FR-023**: In the wide layouts the list pane is `--ocelle-list-track-width` wide (new token, `18rem`) and does not
  shrink or grow. The detail pane takes the remaining inline space and never grows past it because of its content
  (US3-11). The inspector pane, when shown beside the detail, is `--ocelle-shell-inspector-width` wide (existing
  token, 19rem), its border included; the detail's border is inside the detail's share (operator decision, plan
  gate). Between adjacent panes, side by side or stacked, runs a 1 px `--ocelle-color-rule` border on the
  logical side, decorative only (US3-1, US3-2, US3-13). In forced colours the borders stay visible in `CanvasText`.
- **FR-024**: When the `inspector` slot has no assigned element, the element renders no inspector pane, track, border
  or space (US3-8).
- **FR-025**: The layout follows the element's own measured inline size (its border box), never the viewport, and
  re-measures on every resize. It does not rely on `container-type` on itself, so it does not collapse in
  shrink-to-fit hosts. Its intrinsic inline sizes, which decide its size in a shrink-to-fit host, do not depend on the
  layout it shows: its max-content size is that of its three-column layout and its min-content size that of its
  one-column layout. A shrink-to-fit host therefore gives it a size from the room available and its content alone,
  it picks its layout from that size as everywhere else, and the layout does not alternate between frames while
  nothing changes (US3-12). Two thresholds apply, each exclusive (the wider layout applies at exactly the
  threshold):
  - **One column** below `collapse-below`. Default: the new token `--ocelle-list-detail-collapse`, `40rem`.
  - **Inspector stacked** under the detail below `inspector-below`. Default: the new token
    `--ocelle-list-detail-inspector-collapse`, `60rem`.

  `collapse-below` and `inspector-below` are attributes and properties, not reflected, `string | undefined`, default
  absent. After trimming ASCII whitespace, each accepts exactly these forms: one or more decimal digits, optionally
  followed by a point and one or more digits, with no sign and no exponent, followed by `px`, `rem` or `em` in any
  letter case (`em` at the element's own computed font size, `rem` at the root's), or a unitless `0`. Every other
  value, including `%`, viewport and container units, other absolute units, `calc()`, `var()`, a unitless number
  other than 0, a signed number (`+56rem`, `-0`), a number without a digit before or after its point (`.5rem`,
  `56.rem`), an exponent (`5.6e1rem`) and an empty string, counts as absent. When absent, the threshold is the token's value as
  computed on the element, so a host that sets `--ocelle-list-detail-collapse` or
  `--ocelle-list-detail-inspector-collapse` on the element or an ancestor moves it, from the next measurement on. A
  token value that is not an accepted form gives the token's published value (40rem, 60rem) (US3-10).
- **FR-026**: In two columns the inspector, when present, is stacked under the detail inside the detail column, at its
  full width, with the border of FR-023 between them. In three columns it is a pane of its own (US3-1, US3-2).
- **FR-027**: `narrow` (boolean attribute and property, reflected, default false) forces the one-column layout whatever
  the measured size (US3-5). `detail-open` (boolean attribute and property, reflected, default false) chooses the
  shown pane in one column. Without it only the list pane shows. With it only the detail pane shows, with the
  inspector stacked under it. Panes that are not shown have no box and contribute no node. In two or three columns
  `detail-open` has no effect (US3-3, US3-4).
- **FR-028**: When a layout or `detail-open` change hides the pane that holds the document's focus, the element moves
  focus to the start of the pane that is shown. That pane container takes focus by script only (`tabindex="-1"`
  only while the element moves focus to it and it holds focus; at rest no pane is focusable), is never a tab stop,
  and shows the token focus ring, drawn inset, when the change came from the keyboard. Focus is not moved when it
  was outside the hidden pane. At upgrade the same rule applies to the first layout: focus is moved only when it is
  inside a pane that layout hides, and otherwise upgrading moves no focus (operator decision, plan gate; US3-6,
  US3-7, Edge Cases).
- **FR-029**: `ocelle-list-detail` emits no event. It adds no role or landmark of its own, and no name (US3-14).

**All four elements**

- **FR-030**: Each element follows the README's element conventions (005): own module and `define`, `static
  properties`, token-only shared `static styles`, `:host([hidden]) { display: none; }`, variant rules inside
  `@media not (forced-colors: active)`, a manifest entry with every property, attribute, slot, part and CSS custom
  property described (none of the elements declares a CSS custom property of its own, and none has a CSS part unless
  the plan names one with its reason), and a module entry point plus inclusion in the package root and the browser
  build.
- **FR-031**: The elements perform no I/O and make no request. Built output passes the `csp` gate, and every browser
  scenario runs on the strict-CSP fixture from the browser build (US1-15, US2-13, US3-16).
- **FR-032**: Every element has a Storybook story per variant and state, in light and dark, in
  `storybook/stories/<element>.stories.ts`:
  - **scroller**: fits; overflowing at start; overflowing in the middle; overflowing at the end; right-to-left;
    unlabelled;
  - **board**: five lanes as in Frame W; five lanes in a narrow frame, overflowing; one lane; no lanes;
  - **lane**: default with count; default without count; flat with count; long title; untitled with count;
  - **list-detail**: three columns; two columns with the inspector stacked; one column with the list; one column
    with the detail; no inspector.

  The frames are sized inside the story, so each story is at a fixed size within #10's 1280 × 800 capture viewport.
  Their visual baselines and axe runs come from #10's `visual` and `axe` gates, as merged (Assumptions, "#10"). A
  story that shows a mid-scroll state sets the scroll position in its render, so its capture is deterministic.
- **FR-033**: The tokens `--ocelle-lane-min-width`, `--ocelle-list-track-width`, `--ocelle-list-detail-collapse`,
  `--ocelle-list-detail-inspector-collapse`, `--ocelle-scroller-fade-size` and `--ocelle-tracking-caps` are added to
  `@ocelle/tokens` through its token source, with their documentation rows. None is a colour, so no contrast pair is
  added. The token gates' pinned counts are updated with them.
- **FR-034**: The README of `@ocelle/elements` documents:
  - each element: its attributes, properties, slots, the tokens it reads, and its keyboard and tree behaviour;
  - the overflow-region module's interface (FR-011), under the element conventions, as the way any element gets a
    tab stop only while it overflows;
  - the **container-tier convention**: a tier is chosen by the element's own measured inline size against a
    `*-below` length attribute whose default is a token. Bounds are exclusive. The attribute accepts the forms of
    FR-025 (`px`, `rem`, `em`, unitless `0`) and treats every other value as absent. The default is the token's
    value as computed on the element, so a host token override applies, with the published value as the fallback for
    an override that is not an accepted form. A boolean attribute set by the host forces the narrow tier. No
    `container-type` is set on a host that may shrink to fit, and the element's intrinsic sizes do not depend on the
    tier it shows (max-content of its widest tier, min-content of its narrowest), so a shrink-to-fit host cannot make
    the tier alternate. #8 and #12 follow it;
  - the frames of User Scenarios as the tested screen sizes;
  - the Host ARIA rule per element: for the scroller, the board and the lane a blank host `aria-label` counts as
    absent; for the icon and the brand mark it leaves the element unlabelled; list-detail takes no name (FR-010);
  - that an overflowing labelled scroller is a named group and the board a region, and that a scroller repeated per
    item takes a name that identifies the item;
  - that WebKit is not measured.

  A documentation test checks each of these items.
- **FR-035**: The changelogs of `@ocelle/elements` and `@ocelle/tokens` name the surface this feature adds: the four
  elements, their attributes, properties and slots, the new entry points, the container-tier convention, and the six
  tokens. The changes are additions (MINOR).

### Key Entities

- **Scroll box**: the element that scrolls. Its state is overflowing or not, and content off-screen at the start, the
  end, both or neither. Its tab stop, role and name follow that state.
- **Overflow-region module**: the internal unit that turns a scroll box's measured state into that tab stop, role,
  name and edge state for any host element (FR-011).
- **Lane**: a column of content with an optional title, an optional count and a variant (default or `flat`). A lane
  with a title or a shown count is exposed as one group named as FR-019 says; one with neither adds no role.
- **Board**: a row of lanes that scrolls inside itself when the lanes' minimum widths exceed its size.
- **Pane**: the list, the detail or the inspector of a list-detail.
- **Container tier**: a layout chosen from the element's own inline size against an exclusive, host-settable
  threshold with a token default, or forced by a host attribute.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In 100% of the measured states of User Story 1 (fits, overflowing at start, middle and end, resized
  across the threshold both ways, content changed both ways, in both writing directions), the scroller is a tab stop
  exactly when it overflows, and a named group exactly when it overflows and is labelled. Its fades or
  forced-colours lines are on exactly the sides with content off-screen, except while FR-001's fallback suppresses
  one for a focused control too wide to clear it (US1-13); the fallback's state is asserted on the lines as on the
  fades.
- **SC-002**: A keyboard user reaches the hidden end of an overflowing scroller, and of an overflowing board, from the
  element's tab stop using only the arrow keys, in both writing directions.
- **SC-003**: Five lanes, with the board's ring room (858 px), fit Frame W (876 px) with no board overflow and no page
  scroll. In Frame N and Frame S the board overflows inside itself and the page has no horizontal scroll.
- **SC-004**: Every titled lane is announced as one group whose name is its title plus its count, or its `count-label`
  (exactly "Ready, 3" or "Ready, 3 work packages" in the scenarios), with no built-in word and no repeated text.
- **SC-005**: list-detail shows three columns in Frame R, two in Frame W and one in Frame N and with `narrow`. In one
  column, focus never stays in a hidden pane in any of the switches of US3-6 and US3-7.
- **SC-006**: At 320 px (Frame S) no element of this feature makes the page scroll horizontally (WCAG 1.4.10).
- **SC-007**: Every story of FR-032 has a baseline in light and dark through #10's `visual` gate, and #10's `axe`
  gate reports no serious or critical finding on any of them. Each element's browser tests show zero CSP violations
  and zero requests outside the allowed list.
- **SC-008**: A test-only element built on the overflow-region module passes US1 scenarios 1, 3, 4 and 12, and the
  README documents the module's interface (FR-011, FR-034), so #13 needs no new design to reuse it.
- **SC-009**: The README's container-tier convention holds every item of FR-034, checked by a documentation test, so
  #8 and #12 adopt it without a design question.

## Assumptions

- **#10.** Implementation starts only after #10 (Storybook workbench, `specs/006-storybook-workbench`) is merged
  (operator wave planning). Its stories therefore get their baselines and axe runs through #10's `visual` and `axe`
  gates, and no 001 exception is needed for them. #10's design as written on its branch is assumed:
  - one 1280 × 800 capture viewport at scale 1;
  - reduced motion;
  - open shadow roots;
  - no forced-colours capture;
  - the FR-025 contributor note;
  - `contracts/gates.md` and `contracts/container.md`.

  The plan is checked again against #10 as merged before implementation.
- **Forced colours and axe.** #10 captures no forced-colours state, so forced-colours outcomes (US1-8, US2-11, FR-023)
  are proven by this feature's own browser tests under emulated forced colours.
- **Sibling tokens.** #8 (sibling 011, in design now) may add eyebrow tokens, including a letter-spacing token for
  uppercase labels. The two features use one token for one need. Whichever lands second adopts the other's name and
  value for `--ocelle-tracking-caps`, and the plan records that. The container-tier convention (FR-034) is in the same
  position: #8's personal rail tier follows it, or the second to land reconciles the two.
- **Shared files.** `packages/elements/src/index.ts`, `src/browser.ts`, `custom-elements.json`, the changelogs, the
  README and the Storybook configuration are also changed by parallel features. Conflicts are resolved by merging
  `main`, never by rebasing.
- **Lane semantics.** A lane is a group, not a landmark: five landmarks on one board would crowd the landmark list. A
  lane does not impose list semantics on its content; a host that has a list of cards slots a list.
- **Scroller semantics.** For the same reason a scroller is a group, not a landmark: chip and tag rows repeat per
  card. The board, one per screen, is the only region of this feature (operator decision, plan gate).
- **Frames.** The frames use the shell tokens as they are today (`shell-rail-width`, `shell-sidebar-width`, `gutter`,
  `shell-collapse-sidebar`). #12's app shell may lay out differently. The tested outcomes are about the elements in
  frames of those sizes, not about the shell.
- **Thresholds.** `--ocelle-list-detail-collapse` (40rem) leaves the detail at least 22rem beside the 18rem list.
  `--ocelle-list-detail-inspector-collapse` (60rem) leaves it at least 23rem beside the list and the inspector. They
  are container thresholds, unlike the viewport-based `shell-collapse-*` tokens, so they are new tokens.
- **Engines.** Only Chromium is measured. Kitty Desktop's webview is WebKit, so the scroller's tab stop, role,
  arrow keys and focus handover are an open limitation in WebKit, which the README records. The element sets
  `tabindex` itself, so it does not rely on Chromium's own rule for scroll boxes.
- **Environment.** The container runs Node 22 while CI pins 26.13.0, and browser runs use `OCELLE_CHROMIUM_PATH`
  (findings).
- **Mutation.** Element source is mutation-tested under the elements-only Stryker configuration and 007's stricter
  gate, with Timeout and CompileError mutants reported, as it applies on `main`.

## Out of Scope

- The app shell, its tiers and its personal drawer (#12).
- Cards, section and page headers, and the context sidebar (#8).
- `ocelle-code-block` (#13), which reuses FR-011.
- Chevron scroll buttons on the scroller. A later addition if a consumer asks (operator decision).
- Moving cards between lanes by drag and drop or keyboard. This would be a new issue if a consumer needs it.
- A built-in back control and any event on list-detail (operator decision).
- A WebKit test project (environment limit).
- The Storybook harness itself (#10).
