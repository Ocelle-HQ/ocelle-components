# Feature Specification: Action Controls, `ocelle-button` and `ocelle-action-row`

**Feature Branch**: `012-button-action-row` (work happens on `claude/007-actions-status`)

**Created**: 2026-11-13

**Status**: Draft

**Input**: User description: "Build the action controls of issue #7 (triage/012-button-action-row.md) in
@ocelle/elements on mission 005's element conventions and slot convention, spec directory specs/012-button-action-row:
ocelle-button (variant, size, label, disabled, busy, href rendering a link, click; ARIA passthrough of aria-expanded,
aria-controls and aria-current to the inner control with no ID reference crossing a shadow root
(spec-kitty-design#501); slotted icons through the icon slot (#496, #509); a compact inline padding for breadcrumb
items that #12 consumes (#518); a compact text scale, a quiet bordered variant, a 44 px minimum target from
--ocelle-target-min and a busy spinner that does not overlap the label and respects reduced motion (#532)) and
ocelle-action-row (row-id, layout, presentation, ocelle-action-row-activate carrying the row id, aria-busy; flush
presentation, compact navigation density, no zero width when shrink-wrapped (#493); route mode with aria-current page
or true (#495); an unavailable state with a visual and assistive-technology cue (#504); card layout with word wrapping
only in tags, a title gap, a trailing slot for the arrow-end icon (#508); hover border and surface from tokens (#525);
a label property or forwarded aria-labelledby (#528)); one shared answer for link versus button, disabled versus
unavailable and name passthrough that later controls (#12, #14) follow; each element meeting #7's Done-when
checklist; ocelle-pill-tag, ocelle-status-indicator and ocelle-metric stay in #7 for a later status mission."

**Operator decisions while specifying** (2026-11-13, human:jeroennouwsdev):

- Variants, "primary/secondary/quiet": three variants; `danger` waits for a consumer (FR-010).
- Minimum target, "Default meets 44 px": `size="default"` is at least `--ocelle-target-min` in both dimensions;
  `size="compact"` at least 24 px (FR-011).
- Forms, "Non-submitting, documented": `ocelle-button` never submits or resets a form; form association may come with
  #9's convention (FR-022).

**Operator decisions after spec check 1** (2026-11-13, human:jeroennouwsdev):

- Flush look (SPEC-1-07), "(a) flush is borderless": `flush` also removes the border and the fill; a flush button is a
  text-like control with only its hover and focus states (FR-012).
- Row target (SPEC-1-08), "(a) every row": every `ocelle-action-row`, in every presentation and layout, is at least
  `--ocelle-target-min` high; the flush density reduces padding but not the minimum height (FR-031).
- Modifier clicks on a link row (SPEC-1-09), "(a)": no `ocelle-action-row-activate` is dispatched on a modifier click
  (Ctrl, Meta, Shift) or a middle click; the browser's default (new tab or window) happens (FR-033).
- Current (SPEC-1-10), "(a) keep both as specified": the button passes through any host `aria-current` with no visual
  mark; the row has a `current` property (`page` or `true`) with a mark (FR-009, FR-037).

**Operator decision after spec check 2** (2026-11-13, human:jeroennouwsdev):

- Row tags (SPEC-2-04), "(a) in the description": the text of the `tags` slot joins the row's accessible
  description, after the `description` slot's text, unless the host sets `aria-describedby` (FR-034).

**Operator decision at planning** (2026-11-13, human:jeroennouwsdev):

- Host ARIA, "Move to inner control": measured in Chromium 153, a host that keeps `aria-label`, `aria-labelledby` or
  `aria-expanded` shows as a second named `generic` node and draws axe "needs review" results (`aria-allowed-attr`,
  `aria-prohibited-attr`) that #10's axe gate fails, and an `ElementInternals` role of `none` or `presentation` does
  not help; so each element moves the listed host attributes onto its inner control (FR-004, plan research R-03).

**Issues**: #7, in part (triage record `triage/012-button-action-row.md`, approved by the operator on 2026-11-13).
This feature builds the two action controls of #7. `ocelle-pill-tag`, `ocelle-status-indicator` and `ocelle-metric`
stay in #7 for a later status mission. The body of #7 (read on 2026-11-13) is the source of the requirements below.
The spec-kitty-design issues it cites were not read in full for this spec, except #496 and #504 as quoted in
`specs/005-icons-brand-mark/sources/README.md`; their one-line summaries in #7 are the requirement. Their `sk-*`
names are kitty-mission-ui roles, not names of this library (constitution I, VI).

## Consumer need

| Consumer | Need | Source |
|---|---|---|
| kitty-mission-ui (Kitty Desktop, Kitty Dashboard) | A button with variants, sizes, a label, a disabled and a busy state, and a link mode (`href`): 37 uses of the `sk-*` equivalent today | #7 |
| kitty-mission-ui | ARIA state set on the button (`aria-expanded`, `aria-controls`, `aria-current`) reaches the real control | spec-kitty-design#501 |
| kitty-mission-ui | Slotted SVG icons are sized; an `icon` slot before the label | spec-kitty-design#496, #509 |
| `ocelle-breadcrumbs` (#12) | A compact inline padding so the breadcrumb trail's first label aligns with the page title under it | spec-kitty-design#518 |
| kitty-mission-ui | A compact text scale, a quiet bordered variant, a 44 px minimum target, a busy spinner that does not overlap the label | spec-kitty-design#532 |
| kitty-mission-ui | An activatable row (9 uses today): row id, layout, presentation, an activate event carrying the row id, a busy state | #7 |
| kitty-mission-ui | A flush presentation where empty parts take no space, a compact navigation density, no zero width when shrink-wrapped | spec-kitty-design#493 |
| kitty-mission-ui | A route mode that marks the current row with `aria-current="page"` or `"true"` (its ancestors) | spec-kitty-design#495 |
| kitty-mission-ui | An unavailable row state with a visual and an assistive-technology cue | spec-kitty-design#504 |
| kitty-mission-ui | A card layout: wrapping only between words in the tags, a title gap, a trailing slot for an arrow | spec-kitty-design#508 |
| kitty-mission-ui | Hover border and surface from tokens | spec-kitty-design#525 |
| kitty-mission-ui | An accessible-name passthrough on the row: a `label` property or a forwarded `aria-labelledby` | spec-kitty-design#528 |
| `ocelle-copy-field` (#14) | May use `ocelle-button` as its flush Copy control | triage 012 |

The two elements are the library's first interactive controls. Besides their own surface, they settle four rules
that later controls (#12's navigation items and menu button, #14's copy control, #9's form controls) follow: link
versus button, disabled versus unavailable, ARIA passthrough without an ID reference crossing a shadow root, and
accessible-name passthrough. These are the **control conventions** (FR-001 to FR-006), documented in the package
README beside mission 005's element conventions.

## User Scenarios & Testing *(mandatory)*

Throughout, "the host" is the page or application that uses the element, and "the inner control" is the native
`<button>` or `<a>` the element renders in its shadow root. Every scenario holds in light and dark, under
`dir="rtl"` where direction matters, and in forced-colours mode where colour matters.

**Not activated.** Where a scenario or requirement says a control "is not activated", the observable outcome is all
of: no navigation, no `ocelle-*` event dispatched, and no `click` event reaching a bubble-phase listener on the
element or any of its ancestors (up to `document` and `window`). In link mode this holds for every kind of click: a
plain click, a click with a modifier key (Ctrl, Meta, Shift or Alt) held and a middle click; none of them opens the
target in the current tab, a new tab or a new window. Capture-phase listeners are outside this guarantee:
for a link with no target and for a control with `aria-disabled="true"`, the browser dispatches the click and
capture-phase listeners on ancestors run before the element can stop it. The README states this.

**Grounds.** The *main grounds* are the tokens `--ocelle-color-canvas`, `-sheet`, `-pane`, `-panel`, `-inspector`,
`-rail`, `-inset`, `-accent-low` and `-hover-bg` (the `main` group of the token source); the *state grounds* are
`--ocelle-color-danger-bg`, `-warning-bg`, `-success-bg`, `-info-bg` and `-neutral-bg`.

### User Story 1 - `ocelle-button` (Priority: P1)

A host developer places `<ocelle-button>Save</ocelle-button>` in a page and gets a native-behaving button in the
Ocelle look: a choice of variants and sizes, a disabled state, a slotted icon before the label, the token focus ring,
and a click that reaches the host as an ordinary `click` event. A keyboard user and a screen-reader user meet a
normal button.

**Why this priority**: the button is the most used primitive (37 uses), it blocks #12 (breadcrumb padding) and may
be used by #14, and it carries the control conventions the action row and later controls follow. Landing it alone is
already a usable release.

**Independent Test**: render each variant and size in a page, with and without an icon, enabled and disabled;
activate it by pointer, Enter and Space; read its accessibility-tree node and its computed styles.

**Acceptance Scenarios**:

1. **Given** `<ocelle-button>Save</ocelle-button>`, **When** the accessibility tree is read, **Then** there is exactly
   one node for it, role `button`, name "Save", and it is in the tab order once.
2. **Given** the button, **When** it is clicked, or focused and Enter or Space is pressed, **Then** the host receives
   one `click` event whose target is the `ocelle-button` element, and no `ocelle-*` event is dispatched.
3. **Given** `disabled`, **When** it is clicked or Enter or Space is pressed on it, **Then** it is not activated (no
   `click` reaches a bubble-phase listener on the element or its ancestors), the button is not in the tab order, and
   the accessibility tree reports it disabled.
4. **Given** each `variant` value (FR-010), **When** rendered on each main ground and each state ground, **Then** its
   colours come only from `--ocelle-*` tokens, its label meets text contrast and its boundary meets non-text contrast
   (where it has a boundary) in both themes, as the contrast check proves.
5. **Given** `variant="quiet"`, **When** rendered, **Then** it has a visible border from `--ocelle-color-control-border`
   (or `--ocelle-color-accent-strong` on `accent-low`, `inset`, `hover-bg` and the state grounds) and no fill.
6. **Given** each `size` value (FR-011), **When** rendered, **Then** its minimum size and text scale are those
   of FR-011; `size="compact"` uses the compact text scale.
7. **Given** `size="default"` with a one-character label or an icon only, **When** rendered, **Then** both its block
   and inline size are at least `--ocelle-target-min`; **Given** `size="compact"`, **Then** both are at least 24 CSS
   px (FR-011).
8. **Given** `<ocelle-button><ocelle-icon slot="icon" name="folder"></ocelle-icon>Open project</ocelle-button>`,
   **When** rendered, **Then** the icon is `--ocelle-icon-size` square, centred on the label's first line, separated
   from the label by `--ocelle-space-2`, before the label in left-to-right text and after it under `dir="rtl"`, and
   the accessible name is "Open project" (mission 005's slot convention).
9. **Given** an icon-only button with `label="Close"`, **When** the accessibility tree is read, **Then** the button is
   named "Close" and the icon contributes nothing.
10. **Given** focus on the button by keyboard, **When** rendered, **Then** the token focus ring
    (`--ocelle-color-focus`, `--ocelle-focus-width`, `--ocelle-focus-offset`) is drawn around it; a pointer click
    does not show the ring (`:focus-visible`).
11. **Given** forced-colours mode, **When** each variant is rendered enabled, disabled, focused and hovered, **Then**
    the label, the border (where it has one) and the focus ring are visible in system colours and the disabled state
    is told apart (`GrayText`).
12. **Given** `flush` (FR-012) with or without an icon, in each `size`, **When** the button is placed at the start of
    a line of text or under a heading that starts at the same inline position, **Then** the inline-start edge of its
    label (or, with an icon, of its icon) equals the inline-start edge of that text within 0.5 CSS px, in
    left-to-right text and under `dir="rtl"`; and its block size and minimum target are those of its `size`.
13. **Given** `flush` on each `variant`, **When** rendered, **Then** it has no border and no fill (its computed border
    width is 0 and its background is transparent), its label uses `--ocelle-color-ink` and meets text contrast on
    each main ground; on hover its surface becomes `--ocelle-color-hover-bg`, and keyboard focus shows the token focus
    ring.

---

### User Story 2 - Link mode and ARIA passthrough (Priority: P2)

A host developer sets `href` on an `ocelle-button` and gets a link that looks like a button: it navigates like a link,
opens in a new tab with the usual modifiers, and is announced as a link. The developer sets `aria-expanded`,
`aria-controls` or `aria-current` on the host element and an assistive technology reads that state on the real
control, without the developer knowing about the shadow root.

**Why this priority**: link-styled buttons and disclosure buttons are common in kitty-mission-ui, and #501 is a gap
consumers work around today. It also fixes the passthrough rule every later control inherits.

**Independent Test**: render a button with `href`, with and without `disabled`; set each passthrough attribute on the
host, change and remove it; read the accessibility tree and the navigation result.

**Acceptance Scenarios**:

1. **Given** `<ocelle-button href="/projects">Projects</ocelle-button>`, **When** the accessibility tree is read,
   **Then** there is one node, role `link`, name "Projects", and activating it with a click or Enter navigates to
   `/projects`; Space does not activate it (native link behaviour).
2. **Given** a link-mode button, **When** `target` or `rel` or `download` is set on the host (FR-021), **Then** the
   inner link has the same value.
3. **Given** a link-mode button with `disabled`, **When** rendered, **Then** it has no navigable target, is not in the
   tab order, is reported disabled (`aria-disabled="true"`) on a node of role `link`, and a click is not activated
   (no navigation, no `click` reaching a bubble-phase listener on the element or its ancestors).
4. **Given** `aria-expanded="true"` on the host, **When** the accessibility tree is read, **Then** the inner control
   reports expanded; changing it to `"false"` reports collapsed; removing it reports no expanded state.
5. **Given** `aria-current="page"` on the host, **When** the tree is read, **Then** the inner control reports current
   page; `"true"`, `"step"`, `"location"`, `"date"` and `"time"` pass through likewise; removing it removes it.
6. **Given** `aria-controls="panel-1"` on the host and an element `id="panel-1"` in the same tree as the host, **When**
   the tree is read, **Then** the inner control's controls relation points at that element; changing the attribute to
   another id follows it; an id with no element in that tree gives no relation and no error (FR-005).
7. **Given** any passthrough attribute on the host, **When** axe runs on the page, **Then** it reports no serious or
   critical finding for the host or the inner control (no duplicate or misplaced ARIA on the host).
8. **Given** `aria-label` on the host, **When** the tree is read, **Then** it names the inner control and wins over
   `label` and the content, as mission 005's host ARIA rule says.
9. **Given** both `aria-labelledby` (naming an element with text "Archive") and `aria-label="Remove"` on the host,
   **When** the tree is read, **Then** the inner control is named "Archive" (`aria-labelledby` wins, as in Accessible
   Name 1.2); removing `aria-labelledby` names it "Remove".

---

### User Story 3 - Busy (Priority: P3)

While a host waits for the result of an action, it sets `busy` on the button. The button shows a spinner that never
covers the label, cannot be activated again, keeps focus if it had it, and tells an assistive technology that it is
busy. A user who asks for reduced motion sees a still busy mark.

**Why this priority**: #532's overlapping spinner is a visible defect in kitty-mission-ui today, and double submission
is a real risk; but the button is useful without it.

**Independent Test**: toggle `busy` on a focused and an unfocused button, with and without an icon; activate it by
pointer and keyboard; read the tree, the layout boxes and the animation under each motion preference.

**Acceptance Scenarios**:

1. **Given** a button with `busy`, **When** it is clicked or Enter or Space is pressed, **Then** it is not activated
   (no `click` reaches a bubble-phase listener on the element or its ancestors).
2. **Given** a focused button, **When** `busy` is set and later removed, **Then** focus stays on it throughout and it
   stays in the tab order.
3. **Given** `busy`, **When** the tree is read, **Then** the inner control reports busy (`aria-busy="true"`) and
   unavailable (`aria-disabled="true"`), keeps its accessible name, and the spinner adds nothing to the tree.
4. **Given** `busy` on a button with a slotted icon, **When** rendered, **Then** the spinner takes the icon's place
   (the icon is not shown), and the button's box does not change size.
5. **Given** `busy` on a button without an icon, **When** rendered, **Then** the spinner is placed before the label
   (after it under `dir="rtl"`) with the slot convention's gap, and the boxes of the spinner and the label do not
   intersect.
6. **Given** `prefers-reduced-motion: reduce`, **When** `busy` is set, **Then** the spinner does not move and is still
   visible.
7. **Given** forced-colours mode, **When** `busy` is set, **Then** the spinner is visible in the control's system text
   colour.
8. **Given** `busy` on a link-mode button, **When** it is clicked, clicked with Ctrl, Meta or Shift held,
   middle-clicked, or Enter is pressed, **Then** it is not activated (no navigation in the current tab, no new tab or
   window, no `click` reaching a bubble-phase listener), stays focusable, and reports busy and unavailable as in
   scenario 3.

---

### User Story 4 - `ocelle-action-row` (Priority: P4)

A host lists items (missions, projects, artifacts) as rows the user activates. Each row has a leading icon, a title,
an optional description, tags and a trailing slot. Activating a row by pointer or keyboard sends one
`ocelle-action-row-activate` event carrying the row's id, so the host does not attach a listener per row. In a
navigation list the rows are flush and compact; a row that is waiting for data shows it is busy.

**Why this priority**: the row is the second most used interactive primitive in this mission (9 uses) and builds on
the conventions of stories 1 to 3.

**Independent Test**: render rows in each layout and presentation, activate them by pointer, Enter and Space, read
the event and its payload, the accessibility tree and the boxes in a shrink-wrapping container.

**Acceptance Scenarios**:

1. **Given** `<ocelle-action-row row-id="m-42">Mission 42</ocelle-action-row>`, **When** it is clicked, or focused
   and Enter or Space is pressed, **Then** exactly one `ocelle-action-row-activate` event is dispatched from the
   element with `bubbles: true`, `composed: true`, `cancelable: true` and `detail` `{ rowId: "m-42" }`.
2. **Given** a row without `row-id`, **When** it is activated, **Then** the event's `detail.rowId` is `""`.
3. **Given** a row, **When** the tree is read, **Then** it is one node, role `button`, in the tab order once, named by
   its title (or by FR-034's name passthrough when set), and its accessible description is the slotted description's
   text followed by the slotted tags' text (FR-034).
4. **Given** `label="Open mission 42"` on the row, **When** the tree is read, **Then** the row is named "Open mission
   42"; the host's `aria-label` wins over `label`; a host `aria-labelledby` naming an element in the host's tree names
   the row with that element's text (FR-005, FR-034); with both `aria-labelledby` and `aria-label` set,
   `aria-labelledby` wins (FR-006).
5. **Given** `busy` on the row, **When** the tree is read, **Then** the row reports `aria-busy="true"`; activation
   still dispatches the event (busy means "content updating", not "unavailable").
6. **Given** `presentation="flush"` with no `current` and no hover, **When** rendered, **Then** the row has no border, no surface fill and no block
   padding beyond the compact navigation density (FR-031), and every empty slot (icon, description, tags, trailing)
   takes no space and adds no gap.
7. **Given** a row in a shrink-wrapping container (an `inline-block`, `inline-flex`, `float` or `max-content` grid
   track), **When** rendered, **Then** its inline size is at least the min-content inline size of its content, never
   0.
8. **Given** a `default`-presentation row, **When** a pointer hovers it, **Then** its surface and its border change to
   the hover tokens (FR-036); in forced-colours mode the hover keeps a visible system-colour border. **Given** a
   `flush` row, **When** a pointer hovers it, **Then** only its surface changes, to `--ocelle-color-hover-bg`; no
   border appears and no part of the row moves or changes size; in forced-colours mode the hover is visible in a
   system colour, again without moving or resizing any part of the row. **Given** a row with `current` set (either
   presentation), **When** a pointer hovers it, **Then** its surface stays `--ocelle-color-accent-low` and the
   current bar stays drawn (FR-036, FR-037); a `default` current row's border changes to the hover-border token, and
   a `flush` current row shows no hover change.
9. **Given** focus on a row by keyboard, **Then** the token focus ring is drawn around the whole row.
10. **Given** a host listener that calls `preventDefault()` on the event, **When** a focused button-mode row is
    activated by click, Enter or Space, **Then** the listener sees `event.defaultPrevented` become `true`, the event is
    dispatched exactly once, there is no navigation, no other `ocelle-*` event is dispatched, and focus stays on the
    row.
11. **Given** a row in each presentation (`default`, `flush`) and each layout (`row`, `card`), with a one-line title
    and no other content, **When** rendered, **Then** its block size is at least `--ocelle-target-min` (FR-031).
12. **Given** a row with slotted description text "Due Friday" and two slotted tags "Blocked" and "Design", **When**
    the tree is read, **Then** its accessible description is "Due Friday Blocked Design" (description first, then the
    tags in slot order); with tags and no description it is "Blocked Design"; **Given** also a host
    `aria-describedby` naming an element in the host's tree with text "Owner: Ana", **Then** the description is
    "Owner: Ana" and neither the slotted description nor the tags contribute (FR-034, FR-005); removing
    `aria-describedby` restores "Due Friday Blocked Design".

---

### User Story 5 - Row states and the card layout (Priority: P5)

In a navigation list, the row for the current page is marked so that an assistive technology announces it as current,
and rows that are ancestors of the current page are marked too. A row for an item the user cannot open right now stays
in the list, looks unavailable and is announced as unavailable, and the user can still reach it by keyboard to learn
why. On a dashboard the rows are cards whose tags wrap only between tags and whose trailing slot holds the end arrow.

**Why this priority**: these are the remaining #7 gaps on the row (#495, #504, #508); they refine story 4.

**Independent Test**: render rows with `href`, `current`, `unavailable` and `layout="card"`; activate them; read the
tree, the navigation result and the line boxes of the tags.

**Acceptance Scenarios**:

1. **Given** `<ocelle-action-row href="/missions/42" row-id="m-42">`, **When** the tree is read, **Then** the row is
   one node of role `link`; **When** it is clicked or Enter is pressed, **Then** `ocelle-action-row-activate` is
   dispatched first with `{ rowId: "m-42" }` and, unless a listener called `preventDefault()`, the browser navigates to
   `/missions/42`; when a listener prevented it, it does not navigate. Space does not activate a link row.
2. **Given** a link row, **When** it is clicked with Ctrl, Meta or Shift held, or middle-clicked, **Then** no
   `ocelle-action-row-activate` event is dispatched and the browser's default for that click (a new tab or window)
   is not prevented (FR-033).
3. **Given** a link row with `current="page"`, **When** the tree is read, **Then** the inner link reports
   `aria-current="page"`; with `current="true"` it reports `aria-current="true"`; with no `current` it reports none.
4. **Given** `current` set, **When** rendered, **Then** the row shows the current mark: an `--ocelle-color-accent-low`
   surface and a bar at the row's inline start (the left edge in left-to-right text, the right edge under
   `dir="rtl"`), `--ocelle-bar-width` wide, the row's full block size, in `--ocelle-color-current`; never ochre fill
   alone on a light ground (constitution II); in forced colours the bar stays visible in a system colour. The full
   mark (surface and bar) is drawn in both presentations; on a `flush` row it adds no border. **When** a pointer
   hovers the current row, **Then** the full mark stays: the surface stays `--ocelle-color-accent-low`, not
   `--ocelle-color-hover-bg` (FR-036).
5. **Given** `unavailable` on a row (button or link mode), **When** the tree is read, **Then** the row reports
   `aria-disabled="true"`, stays in the tab order, and its accessible description (the description and tags text of
   FR-034, if any) is unchanged.
6. **Given** an unavailable row, **When** it is clicked or Enter or Space is pressed, or (a link row) it is clicked
   with Ctrl, Meta or Shift held or middle-clicked, **Then** it is not activated: no `ocelle-action-row-activate` event
   is dispatched, a link row navigates nowhere (not in the current tab, not in a new tab or window), and no `click`
   reaches a bubble-phase listener on the element or its ancestors.
7. **Given** an unavailable row, **When** rendered, **Then** its title and description use the disabled ink token,
   its hover does not change the surface, and in forced colours it uses `GrayText`.
8. **Given** `layout="card"` with several slotted tags, **When** the card is narrower than the tags' total width,
   **Then** the tags wrap onto new lines only between tags, and within the tags region no tag's text is broken inside
   a word, except a single tag longer than the card's width, which may break inside a word. (The title's wrapping is
   the edge case "Very long titles and unbreakable identifiers".)
9. **Given** `layout="card"`, **When** rendered, **Then** the gap between the title and the content below it is the
   title-gap value of FR-038, and the title is exposed as the CSS part `title`.
10. **Given** `<ocelle-icon slot="trailing" name="arrow-end">` in a row, **When** rendered, **Then** the arrow follows
    the slot convention's `trailing` slot (end side, `--ocelle-icon-size`, mirrored under `dir="rtl"`), stays
    decorative, and in card layout sits at the inline end of the title line.

---

### Edge Cases

- **Both `disabled` and `busy`** on a button: disabled wins; the button is not focusable and shows no spinner.
- **`busy` removed while the pointer is down**: a click completing after `busy` is removed is delivered normally; one
  completing while `busy` is set is not.
- **Empty label and no icon**: a button or row with no text, no `label` and no host name has no accessible name; axe
  reports it (a host mistake, documented; the element adds no fallback text).
- **Interactive content slotted into a row or a button** (a link, a button, an input): invalid nesting; documented as
  unsupported; the element does not detect it.
- **`href=""`** on a button or row: treated as no `href` (button mode). An `href` with a `javascript:` scheme is not
  rendered as a navigable target (the inner link gets no `href`) so built output stays CSP-clean.
- **`aria-controls` or `aria-labelledby` naming several ids** (space-separated): each id found in the host's tree is
  related, in order; ids not found are skipped.
- **The referenced element is added after the host's attribute was set**: the relation is resolved again when the
  attribute changes; an element added later without an attribute change is not picked up (documented limitation,
  FR-005).
- **The referenced element is in another shadow root than the host's tree**: not resolved; documented.
- **`current` on a button-mode row** (no `href`): the inner button reports `aria-current` as well; a button can be
  current in a step list.
- **`aria-current` on an `ocelle-button`**: passed through to the inner control with any value (FR-009); the button
  draws no current mark. A host that wants a visible mark on a button styles it through token overrides or uses a
  row (operator decision, SPEC-1-10).
- **Long button label or narrow container**: the label wraps between words onto further lines inside the button and
  is never truncated or clipped; the block size grows with it; the minimum size of the button's `size` (FR-011) still
  holds. A single word longer than the available inline size may break inside the word rather than overflow.
- **Row with an icon and an empty title**: named by `label` or the host's name passthrough (FR-034); with neither it
  has no accessible name and axe reports it, as in "Empty label and no icon". The row keeps its minimum block size
  (FR-031).
- **`unavailable` and `current` together**: both are reported; the unavailable look wins visually.
- **A row with `busy` and `unavailable`**: both reported; no event.
- **Very long titles and unbreakable identifiers** in a row title: wrap per `base.css`'s identifier wrapping (#535)
  in card layout; in row layout the title wraps, never overflows the row.
- **Unknown `variant`, `size`, `layout` or `presentation` value**: gives the default value's rendering, no error.
- **Host `role` on either element**: not supported (as in mission 005); documented.
- **Two copies of the package on one page**: mission 005's rule applies (first definition wins).
- **The host page has no `@ocelle/tokens` stylesheet**: documented, as for mission 005's elements; the controls are
  then unstyled but still operable.

## Requirements *(mandatory)*

### Functional Requirements

**Control conventions (shared by both elements and by later controls)**

- **FR-001**: Each element renders exactly one focusable inner control in its open shadow root: a native `<button
  type="button">` in button mode and a native `<a>` in link mode. The host element itself is never focusable and
  never carries a role.
- **FR-002**: **Link versus button.** An element is in link mode exactly when it has a non-empty `href` that is not a
  `javascript:` URL; otherwise it is in button mode. Link mode exposes role `link` and the native link behaviour
  (Enter activates, Space does not, modifier clicks open new tabs or windows). Button mode exposes role `button`
  (Enter and Space activate). The two modes have the same look for the same variant.
- **FR-003**: **Disabled versus unavailable.** `disabled` means "cannot be used here at all": the inner control is
  removed from the tab order, reported disabled, is not activated (as defined under User Scenarios: no navigation, no
  `ocelle-*` event, no `click` reaching a bubble-phase listener on the element or its ancestors), and in link mode has
  no navigable target. *Unavailable* means "exists but cannot be used right now": the inner control stays in the tab
  order, reports `aria-disabled="true"`, is not activated (same definition), and keeps its accessible name and
  description so a user can learn why. Capture-phase listeners on ancestors may see the browser's click in both
  states; the element gives no guarantee about them. The button's `busy` and the row's `unavailable` are unavailable
  states. In link mode "not activated" covers modifier clicks and the middle click too, so a disabled or unavailable
  link opens no new tab or window either.
- **FR-004**: **ARIA passthrough.** The ARIA attributes this spec lists for an element, set on the host, reach the
  inner control and update whenever the host sets them again. The element **moves** each one: it applies the value to
  the inner control and removes the attribute from the host, so an accessibility tree shows the state once, on the
  inner control, and axe reports no serious or critical finding (and no "needs review" result) caused by them
  (operator decision at planning, 2026-11-13). Reading the attribute back from the host gives `null` after the move.
  To clear a moved state a host sets an empty value (`aria-controls=""`, `aria-labelledby=""`,
  `aria-describedby=""`, `aria-label=""`) or the ARIA "off" value (`aria-expanded="false"` reports collapsed; `aria-current="false"`
  clears the current state); `removeAttribute` on an attribute already moved changes nothing. The README states this.
  Mission 005's host `aria-label` rule for `ocelle-icon` and `ocelle-brand-mark` is unchanged.
- **FR-005**: **ID references never cross a shadow root.** An ID-reference attribute set on the host
  (`aria-controls`, `aria-labelledby`, `aria-describedby`) is resolved by id in the host's own tree (its document or
  the shadow root it is in) and related to the inner control by element reference, not by copying the id into the
  shadow root. It is resolved again whenever the attribute changes. Behaviour is proven in Chromium; WebKit is not
  measured here and is a stated limitation (as in mission 005).
- **FR-006**: **Name passthrough.** The inner control's accessible name is, in order of precedence (the order of
  Accessible Name 1.2): the host's `aria-labelledby` (FR-005), the host's `aria-label` (mission 005's host ARIA
  rule), the element's `label` property, and otherwise the element's content. Slotted icons never contribute (mission 005 slot convention).
- **FR-007**: Both elements follow mission 005's element conventions (module and registration, properties, styles,
  manifest, stories, files and tests) and slot convention, and their styles use only `--ocelle-*` tokens and the
  values the `style-lint` gate allows.
- **FR-008**: The package README gains a "Control conventions" section stating FR-001 to FR-006 as rules later
  controls follow, and a section per element with its public interface (FR-009 for the button, FR-030 for the row).
  The conventions section also states: what "not activated" guarantees and that capture-phase listeners are outside
  it; what `busy` means on each element (unavailable on the button, FR-015; "content updating" without blocking
  activation on the row, FR-035); the two surfaces for "current" (the button's `aria-current` passthrough with no
  mark, the row's `current` property with a mark; operator decision, SPEC-1-10); and that a primary action uses
  `size="default"`, so "primary action" in constitution III is not read as `variant="primary"`.

**`ocelle-button`**

- **FR-009**: The public interface of `ocelle-button` is exactly: the properties and attributes `variant`, `size`,
  `flush`, `label`, `disabled`, `busy`, `href`, `target`, `rel`, `download` (FR-010 to FR-021); the passthrough
  attributes `aria-expanded`, `aria-controls`, `aria-current`, `aria-label`, `aria-labelledby`, `aria-describedby`;
  the default slot (the label) and the `icon` slot; the native `click` event; and the CSS part `control` (the inner
  control). It emits no `ocelle-*` event. `aria-current` is passed through with any value and draws no visual mark
  (operator decision, SPEC-1-10). This interface is what #12 and #14 consume; changing it after release is a
  MAJOR change (constitution VII).
- **FR-010**: `variant` (attribute and property, reflected) is one of `primary` (filled), `secondary` (the default;
  bordered on a surface) and `quiet` (bordered, no fill). A `danger` variant waits for a consumer to name it (operator
  decision, 2026-11-13). An unknown value renders the default.
- **FR-011**: `size` (attribute and property, reflected) is one of `compact` (the compact text scale:
  `--ocelle-font-size-sm`, `--ocelle-line-height-compact`), and `default` (the default). A `default` button's block
  and inline size are each at least `--ocelle-target-min` (44 px), so every primary action meets constitution III's
  minimum target. A `compact` button is smaller, for dense toolbars and breadcrumbs, but its block and inline size are
  each at least 24 CSS px (WCAG 2.5.8) (operator decision, 2026-11-13). An unknown value renders `default`.
- **FR-012**: `flush` (boolean attribute and property, reflected) removes the inline padding on both inline sides and,
  for every variant, the border and the fill: a flush button is a text-like control whose label uses
  `--ocelle-color-ink` (the disabled ink when disabled) and whose only visual states are the hover surface (FR-019)
  and the focus ring (FR-020) (operator decision, SPEC-1-07). Its content starts at the box's inline start, so the
  inline-start edge of the label (or, with an icon, of the icon) equals that of surrounding text within 0.5 CSS px
  (US1 scenario 12). It changes neither the block size nor the minimum size of its `size`. This is the compact
  breadcrumb padding #12 consumes (#518).
- **FR-013**: `label` (attribute and property, not reflected) names the inner control (FR-006), trimmed; empty or
  whitespace-only counts as none.
- **FR-014**: `disabled` (boolean, reflected) applies FR-003's disabled behaviour.
- **FR-015**: `busy` (boolean, reflected) applies FR-003's unavailable behaviour and sets `aria-busy="true"` on the
  inner control; `disabled` wins over `busy`.
- **FR-016**: While busy, a spinner is shown that takes the place of a slotted icon, or, without an icon, sits in the
  icon position with the slot convention's gap; the spinner and the label never overlap; with an icon the button's box
  does not change size when `busy` toggles.
- **FR-017**: The spinner is decorative (hidden from the accessibility tree), painted in the control's text colour
  (`currentColor`; the system colour in forced colours), animated with a duration from a motion token, and still and
  visible under `prefers-reduced-motion: reduce`.
- **FR-018**: Variant colours come from tokens; a bordered variant's border uses `--ocelle-color-control-border` on
  the grounds `canvas`, `sheet`, `pane`, `panel`, `inspector` and `rail`, and `--ocelle-color-accent-strong` on
  `accent-low`, `inset`, `hover-bg` and the state grounds (#5 rule 1); `--ocelle-color-rule` is never a control
  boundary (constitution II). On each main ground and state ground, every variant (and `flush`) and state pair
  (enabled, hover, active, focus, disabled, busy) meets WCAG 2.2 AA text and non-text contrast in both themes, except
  disabled text, which is exempt (WCAG 1.4.3), and the contrast check covers each pair.
- **FR-019**: Hover and active states change surface and border through tokens (`--ocelle-color-hover-bg` and the
  control-border tokens; a `flush` button changes its surface only); there is no hover-only information.
- **FR-020**: Keyboard focus shows the token focus ring on the inner control (`:focus-visible`), visible in both themes
  and forced colours.
- **FR-021**: In link mode `href`, `target`, `rel` and `download` (attributes and properties, reflected) are set on
  the inner link; in button mode they have no effect. With `target="_blank"` and no `rel`, the inner link gets
  `rel="noopener"`; the same rule applies to link-mode rows (FR-030).
- **FR-022**: The button does not take part in forms: its inner control is always `type="button"`, activating it
  inside a `<form>` neither submits nor resets that form, and it has no `type`, `name`, `value` or `form` attribute.
  The README states this and shows a host submitting from its click handler with `form.requestSubmit()`.
  Form-associated buttons may come later with #9's form-control convention as a MINOR addition (operator decision,
  2026-11-13).

**`ocelle-action-row`**

- **FR-030**: The public interface of `ocelle-action-row` is exactly: the properties and attributes `row-id`
  (`rowId`), `label`, `layout`, `presentation`, `href`, `target`, `rel`, `current`, `unavailable`, `busy` (FR-031 to
  FR-040); the passthrough attributes `aria-label`, `aria-labelledby`, `aria-describedby`; the slots default (title),
  `icon`, `description`, `tags`, `trailing`; the event `ocelle-action-row-activate`; and the CSS parts `control`,
  `title`, `description`, `tags`. Changing it after release is a MAJOR change. `row-id`, `layout`, `presentation`,
  `href`, `target`, `rel`, `current`, `unavailable` and `busy` are reflected; `label` is not (trimmed, empty or
  whitespace-only counts as none, as FR-013). `href`, `target` and `rel` apply to the inner link in link mode only,
  with FR-021's `noopener` rule; the row has no `download`.
- **FR-031**: `presentation` (reflected) is `default` (bordered row on a surface, `--ocelle-radius-row`) or `flush`
  (no border, no surface, compact navigation density: block padding `--ocelle-space-1` and the compact text scale). A
  flush row stays borderless in every state: on hover only its surface changes (FR-036), as on a flush button
  (FR-019), except that a current flush row does not change on hover; the current mark (FR-037) is drawn in full, its `--ocelle-color-accent-low` surface and its bar, with
  no border. No state of a flush row moves or resizes its content.
  Every row, in every presentation and layout, has a block size of at least `--ocelle-target-min`; the flush density
  reduces padding but not this minimum (operator decision, SPEC-1-08). In every presentation an empty slot takes no
  space and adds no gap.
- **FR-032**: `layout` (reflected) is `row` (the default: icon, title and description, tags and trailing on one line;
  when the line cannot hold its content, the tags and trailing group moves as a whole to a second line, and the icon,
  title and description stay on the first) or `card` (icon and title on the first line with trailing at its
  end; description, then tags below).
- **FR-033**: Activation (click, Enter, and Space in button mode) dispatches one `ocelle-action-row-activate`
  `CustomEvent` from the host with `bubbles: true`, `composed: true`, `cancelable: true` and `detail: { rowId: string
  }` (the current `row-id`, `""` when absent). In link mode the event is dispatched before navigation, and calling
  `preventDefault()` on it cancels the navigation. In link mode a click with Ctrl, Meta or Shift held, or a middle
  click, dispatches no event and the browser's default (a new tab or window) happens (operator decision, SPEC-1-09);
  this applies only to a row that is not unavailable. An unavailable row is not activated by any click or key (FR-003)
  and dispatches nothing; a modifier click or middle click on an unavailable link row opens no new tab or window.
- **FR-034**: The row's accessible name follows FR-006 (the title slot as content). Its accessible description is the
  text of the `description` slot followed by the text of the `tags` slot (in slot order), so a screen-reader user hears
  the status and labels a sighted user sees; an empty slot contributes nothing. When the host sets
  `aria-describedby`, that wins (FR-005) and neither slot contributes (operator decision, SPEC-2-04).
- **FR-035**: `busy` (boolean, reflected) sets `aria-busy="true"` on the inner control and does not block activation.
- **FR-036**: On hover (and not when unavailable) the row's surface becomes `--ocelle-color-hover-bg` and, on a
  `default`-presentation row, its border becomes a hover-border token; a `flush` row gets no border on hover
  (FR-031). The current mark takes precedence over the hover surface: a row with `current` set keeps its
  `--ocelle-color-accent-low` surface and its bar on hover, so only a `default` current row's border changes and a
  `flush` current row shows no hover change. Both are `--ocelle-*` tokens a host can override on an ancestor (#525). If no fitting hover-border token
  exists, it is added to `@ocelle/tokens` with its contrast pair in the contrast check.
- **FR-037**: `current` (reflected) is `page` or `true`; it sets `aria-current` with that value on the inner control
  and shows the current mark of story 5 scenario 4 (an `--ocelle-color-accent-low` surface and an inline-start bar of
  `--ocelle-bar-width` in `--ocelle-color-current`), which stays on hover (FR-036). Any other value is treated as
  absent.
- **FR-038**: In card layout, the gap between the title line and what follows is a token-based value (an existing
  `--ocelle-space-*` token or a new `--ocelle-*` token), and the title is the CSS part `title` so a host can adjust it.
  Tags wrap only between slotted tags; text inside a tag is not broken inside a word.
- **FR-039**: `unavailable` (boolean, reflected) applies FR-003's unavailable behaviour, the disabled-ink look and
  `GrayText` in forced colours.
- **FR-040**: The row's inline size in a shrink-wrapping context is at least the min-content inline size of its
  content; it is never 0 because of the element's own styles.
- **FR-041**: Hover, focus, current and unavailable are visible in forced colours by system colours, and the focus
  ring is drawn around the whole row.
- **FR-042**: **Row contrast.** A `default`-presentation row's border is a control boundary: it uses
  `--ocelle-color-control-border` on `canvas`, `sheet`, `pane`, `panel`, `inspector` and `rail`, and
  `--ocelle-color-accent-strong` on `accent-low`, `inset`, `hover-bg` and the state grounds (#5 rule 1); it is never
  `--ocelle-color-rule` (constitution II). In both themes, and on each main ground and state ground the row is placed
  on, these pairs meet WCAG 2.2 AA non-text contrast (3:1), and the contrast check covers each: the default border
  against the ground; the hover border (FR-036, `default` presentation only) against `--ocelle-color-hover-bg`,
  `--ocelle-color-accent-low` (a hovered current row) and the ground; the current bar (`--ocelle-color-current`, both presentations) against `--ocelle-color-accent-low`; the
  focus ring (`--ocelle-color-focus`) against the ground, `--ocelle-color-accent-low` and `--ocelle-color-hover-bg`.
  Title and description text meet text contrast
  on the row's surface in every state, except the unavailable state's disabled ink and border, which are exempt as
  an inactive component (WCAG 1.4.3, 1.4.11); the focus ring of an unavailable row still meets 3:1.

**Done when, for each element (#7)**

- **FR-050**: Each element has a Storybook story per variant and per state (every value of every enumerated property,
  disabled, busy, unavailable, current, link mode, with and without icon and trailing, `dir="rtl"`), in light and
  dark, with a committed visual baseline produced in the pinned container, in the harness of feature 006 (#10). If
  #10 has not merged when this feature lands, the baselines and the story-level axe run follow feature 001's "gates
  absent" exception as mission 005 did, recorded in the plan's Complexity Tracking with the sunset "when #10 lands".
- **FR-051**: Interaction tests assert every event each element emits and its payload: the button's `click` (and its
  absence when disabled or busy) and the row's `ocelle-action-row-activate` with `bubbles`, `composed`, `cancelable`
  and `detail`, from pointer and every keyboard path.
- **FR-052**: Keyboard paths (Tab, Shift+Tab, Enter, Space) and the accessibility tree (role, name, description,
  states) are tested for every state, and axe reports no serious or critical finding on any story or test page.
- **FR-053**: The custom-elements manifest lists every public property, attribute, event (with its `detail` type),
  slot and CSS part of both elements, and the `manifest` gate passes.
- **FR-054**: The built output (module build and browser build) passes the strict-CSP check, and the browser build
  defines both elements.
- **FR-055**: `@ocelle/elements` gets a changelog entry naming the two new elements and their surface; if a token is
  added, `@ocelle/tokens` gets one naming it.
- **FR-056**: Changed source is mutation-tested under the gate's current rules (mission 007).

### Key Entities

- **Inner control**: the one native `<button>` or `<a>` an element renders; carries role, name, description, states
  and focus.
- **Control state**: enabled, disabled, unavailable (busy button, unavailable row), busy (row), current.
- **Activate event** (`ocelle-action-row-activate`): payload `{ rowId: string }`; bubbling, composed, cancelable.
- **Row parts**: title (default slot; the accessible name), icon, description and tags (together the accessible
  description, FR-034), trailing.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Every acceptance scenario of the five user stories passes in the automated tests, in light and dark.
- **SC-002**: In every test page and story of both elements, axe reports 0 serious and 0 critical findings.
- **SC-003**: Every variant, size, presentation and state of both elements (FR-018, FR-042) passes the contrast check
  in both themes, on each main ground and state ground (disabled and unavailable text and borders exempt).
- **SC-004**: Each element shows exactly one accessibility-tree node and one tab stop per instance (zero tab stops when
  disabled) in every story.
- **SC-005**: Activating an available row (busy or not) by pointer or keyboard produces exactly one event with the
  row's id, 100% of the time across the interaction tests; activating a disabled or busy `ocelle-button`, or an
  unavailable `ocelle-action-row`, produces no `click` reaching a bubble-phase listener and no event, and in link mode
  no navigation by any click (plain, modifier or middle).
- **SC-006**: A host can build #12's breadcrumb item (flush, compact) and #14's copy control from `ocelle-button`'s
  documented interface alone, with no style of its own beyond token overrides.
- **SC-007**: The manifest, strict-CSP, prefix, style-lint and mutation gates pass with the two elements added.

## Assumptions

- The control conventions (FR-001 to FR-006) are this library's rule from now on; later controls follow them or
  change them through a spec of their own.
- ARIA element reflection (relating the inner control to elements in the host's tree by reference) is available in
  the engine floor's Chromium; if research finds it is not, the plan raises the engine floor in the README's single
  list or proposes a fallback, and states the WebKit gap.
- The library ships no visible or announced text of its own (no "Loading…" string): the busy state is conveyed by
  `aria-busy` and `aria-disabled`, and a host that wants an announcement makes it.
- "Wraps between words only in `tags`" (#508) is read as: tags wrap as whole items between tags, never inside a word;
  the source issue was not read in full.
- The compact navigation density's exact values (padding, line height) come from existing tokens; source issue #493's
  exact figures were not read.
- `ocelle-pill-tag`, `ocelle-status-indicator` and `ocelle-metric` (and their dependency on #16's `ocelle-tooltip`)
  are out of scope; `ocelle-breadcrumbs` itself (#12), `ocelle-link` (#14), form fields (#9) and the Storybook
  harness (#10) are out of scope.
- `ocelle-link` (#14) is a text-styled link; `ocelle-button` with `href` is a link styled as a button. They do not
  overlap: use `ocelle-link` inside running text, `ocelle-button href` where an action-shaped link is wanted.
- The Storybook workbench of feature 006 (branch `claude/010-storybook-workbench`) is the harness stories target; its
  design is final but not merged, and the stories, baselines and axe plan must be rechecked when it lands.
- Development runs on Node 22 with `OCELLE_CHROMIUM_PATH` set; only Chromium is measured.
