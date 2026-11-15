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

**Operator decisions at the plan squad, round 1** (2026-11-13, human:jeroennouwsdev; `reviews/plan/round-1/refute.md`,
option (a) each):

- Clearing moved ARIA (PLAN-CORRECTNESS-1-001): keep the move; hosts clear with the empty or off value, and
  `removeAttribute` after a move is a no-op; the README gives a recipe per stack (FR-004).
- Spinner angle (PLAN-CORRECTNESS-1-004): a public angle token, `--ocelle-motion-turn` (FR-017).
- Manifest (PLAN-CORRECTNESS-1-006): the moved attributes are declared in the manifest with descriptions (FR-053).
- Landing (PLAN-CORRECTNESS-1-010): this feature lands only after #10, with the story baselines and axe gate before
  landing (FR-050). Satisfied: #10 is on `main` and merged into this branch (round 2, below).
- Moved list (PLAN-A11Y-SECURITY-1-004): the button also moves `aria-haspopup` and `aria-pressed` (FR-009).
- Unavailable links (PLAN-A11Y-SECURITY-1-005): an unavailable link renders no `href` and stays focusable (FR-003).
- Row focus ring (PLAN-A11Y-SECURITY-1-006): drawn inside the row (FR-041).
- Unparseable `href` (PLAN-A11Y-SECURITY-1-008): button mode, no error; `data:` and `vbscript:` left to the host
  (FR-002).
- Spinner duration (PLAN-A11Y-SECURITY-1-009): the animation stops within 5 s (FR-017, WCAG 2.2.2).
- Hover and active (PLAN-FRESH-1-007): distinct hover and active looks are designed now (FR-019).
- WebKit floor (PLAN-FRESH-1-008): the first WebKit release with the features is stated and the floor raised to it
  (FR-005).
- Styling hooks (PLAN-FRESH-1-009): the button exposes moved states as custom states (FR-004).
- Grounds (PLAN-TESTABILITY-1-003): a reflected `ground` attribute on both elements selects the border colour
  (FR-018, FR-042).

**Operator decisions at the plan squad, round 2** (2026-11-13, human:jeroennouwsdev; `reviews/plan/round-2/refute.md`):

- Stretched hosts (PLAN-FRESH-2-001, (a)): the inner control fills the host in both axes, so a host stretched by a
  flex row or a grid has no area outside the control; a button stretched by a flex row grows tall (FR-001).
- Copies of the live DOM (PLAN-FRESH-2-002, (a)): each moved value is mirrored into an element-owned host attribute
  `data-ocelle-moved-<attribute>` and read back at upgrade, so `cloneNode`, `innerHTML` round trips and htmx's history
  snapshot keep names and states (FR-004).
- Chrome (PLAN-FRESH-2-003, (a)): `ground="chrome"` on both elements, for #12's top-bar menu button and other controls
  on the chrome grounds (FR-018, FR-042).
- Current bar and focus ring (PLAN-FRESH-2-005, (b)): the two marks stay distinct; the bar is drawn inline-end of the
  ring's band with a gap (FR-037, FR-041).
- Host `title` (PLAN-FRESH-2-006, (a)): `title` is moved onto the inner control like the listed ARIA attributes
  (FR-009, FR-030).
- Feature 006 merged (operator decision, 2026-11-13): #10 is on `main` (3828d2f) and `main` is merged into this branch
  (37dd501). Stories, baselines and the story-level axe gate are planned against 006 as it is on this branch and are
  done in each phase that adds stories, not in a later phase; nothing in this feature waits for #10 any more (FR-050).

**Operator decisions at the plan squad, round 3** (2026-11-13, human:jeroennouwsdev; `reviews/plan/round-3/refute.md`,
option (a) each):

- Restyled hosts (PLAN-FRESH-3-001): the guarantee no longer depends on the host's `display`. Each element also
  guards the host itself: a click on the host that did not pass through the inner control (a page rule such as
  `display: block` or a fixed height gives the host area outside it) is stopped, as is any click while the control is
  not available; a host may restyle the element's `display` and size (FR-001, FR-003).
- Morphing swaps (PLAN-FRESH-3-002): the element restores a `data-ocelle-moved-*` mirror that is removed or changed
  while it holds the value, so a morph (htmx's idiomorph `morph` swap, Turbo 8 page-refresh morphs) that deletes the
  mirrors does not lose them (FR-004).
- Plant shards (PLAN-FRESH-3-003): `shardSize` 1 is the last lever; the plan states the headroom it leaves and the
  total Plants runner time, and phase 1's review asks the operator to open a triage record for a plant design whose
  shard time does not grow with the story count, before the next element mission (plan decision 15, research R-13).
- Empty description and tags slots (PLAN-FRESH-3-004, a confirmed fix): a `description` or `tags` slot is empty when
  none of its assigned elements has non-whitespace text; an empty slot neither describes the row nor takes space
  (FR-031, FR-034).

**Operator decision after the analysis** (2026-11-14, human:jeroennouwsdev; `analysis-report.md` C1, recorded in
`reviews/analysis/fixes-1.md`):

- Button event (C1), "(a) add activate event": `ocelle-button` also dispatches `ocelle-button-activate` (`bubbles:
  true`, `composed: true`) on every activation that delivers a `click`, so the button's user intent goes out as an
  `ocelle-*` event (constitution I) beside the native `click` (FR-009, FR-023). Settled with it, to match
  `ocelle-action-row-activate` and the control conventions: the event is `cancelable: true` and `preventDefault()` on
  it cancels the click's default action (in link mode, the navigation); its `detail` is an empty object `{}`, since
  the button carries no value and the event's target identifies it; and in link mode a click with Ctrl, Meta, Shift
  or Alt held dispatches no `ocelle-button-activate`, as on a link row (FR-033).
- Alt-click on a link row (plan decision 13, closing check-3 note SPEC-3-02): Alt counts as a modifier, like Ctrl,
  Meta and Shift in the decision on SPEC-1-09 above (FR-033, US5-2).

**Operator decisions at phase 2** (2026-11-14, human:jeroennouwsdev; the phase 2 implementer's stop-and-ask):

- Flush hover on dark `neutral-bg`, "(a) add to the exception list": dark `--ocelle-color-neutral-bg` is `#2A261F`,
  the same value as dark `--ocelle-color-hover-bg`, so a `flush` control's hover shows no change on it; the
  `neutral-bg` ground in dark joins the hand-written exception list (FR-019, US1-14, US4-8). No token or design
  change.
- Accessibility-tree node count, "reword": Chromium shows the `ocelle-button` host as an unnamed `generic` node next
  to the inner control. A scenario's "one node" means exactly one node that has a role other than `generic` or has a
  name; the host's unnamed `generic` node is allowed, a named `generic` node for the host is not (US1-1, US2-1,
  US3-14, US4-16, US5-1).
- Story count, "proceed and note": phases 2 to 6 bring the repository to about 72 stories, not about 58; the story
  list is kept, the plan's estimate and shard headroom are corrected (plan decision 15, research R-13), and a triage
  record for a plant design whose shard time does not grow with the story count is opened when this feature lands.

**Operator decisions at phase 3** (2026-11-15, human:jeroennouwsdev):

- Modifier clicks on a link, "reword": the browser's own modifier handling applies. On a link-mode `ocelle-button`
  and on a link row, a click with Ctrl, Meta, Shift or Alt held dispatches no activate event and the element prevents
  nothing, so the outcome is the browser's platform behaviour; the element does not intervene. On Chromium on Linux,
  Meta is not a link modifier, so a Meta-click navigates the current tab; Ctrl, Shift and Alt give a new tab, a new
  window or a download and leave the current page as it is. This refines the decision on SPEC-1-09 above (FR-002,
  FR-023, FR-033, US2-1, US5-2). No code or test change: the phase 3 test already asserts this.

**Operator decisions at phase 4** (2026-11-15, operator; the phase 4 implementer's stop-and-ask,
`reviews/phase-4/notes.md`):

- Reduced motion and the brand rules, "(a) the brand rule follows the token source": feature 002's brand rule for
  reduced motion (002 FR-007, FR-019 (f)) accepts only `--ocelle-motion-fast` and `--ocelle-motion-base` at `0ms`, so
  it would reject the new `--ocelle-motion-spin` that this feature sets to `0ms` under reduced motion (FR-017). The
  rule changes: under reduced motion, exactly every motion token whose value is a duration is `0ms`, read from the
  token source. Today that is `motion-fast`, `motion-base` and `motion-spin`; `motion-turn` (an angle) and
  `easing-standard` are not durations and are not set there. A later duration token needs no further rule change.
  The rule keeps rejecting a duration that is not `0ms` under reduced motion and now also rejects a missing
  `motion-spin`. This changes 002's rule (f) for every later feature; the plan records it (plan decision 29).

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
capture-phase listeners on ancestors run before the element can stop it. So are listeners a host adds to the element
before the element is upgraded (defined): for a click on the host outside the inner control (a restyled host, below),
they run before the element's own host listener. The README states this.

**Grounds.** The *main grounds* are the tokens `--ocelle-color-canvas`, `-sheet`, `-pane`, `-panel`, `-inspector`,
`-rail`, `-inset`, `-accent-low` and `-hover-bg` (the `main` group of the token source); the *state grounds* are
`--ocelle-color-danger-bg`, `-warning-bg`, `-success-bg`, `-info-bg` and `-neutral-bg`; the *chrome grounds* are
`--ocelle-color-chrome` and `--ocelle-color-chrome-hover` (the top bar, icon rail and personal rail, dark in both
themes, constitution II).

**Stretched host.** A host is *stretched* when its layout makes it larger than its content: a flex row's items stretch
in the block axis (`align-items` defaults to `stretch`) and grid items stretch in both axes. Scenarios that click
"4 px inside the host's bottom edge" place the element so stretched (in a `display: flex` row beside a taller
sibling, and in a two-column grid whose other cell is taller).

**Restyled host.** A host is *restyled* when a rule of the page sets the element's own `display` or size, which
outranks the element's `:host` styles. Scenarios that say "restyled" place the element in a 400 px wide container
under each of three page rules on the element: `display: block`, `display: flex; width: 100%`, and `display: block;
height: 90px`. Their *outside points* are the points 4 px inside the host's inline-end edge at its block centre and
4 px inside its bottom edge at its inline centre that lie outside the inner control's box under that rule. For the
button both points lie outside under each rule (measured, PLAN-FRESH-3-001); for the row, whose inner control may be
an `<a>` that fills a block host's width, the phase's red commit lists them by hand per mode and rule from a spike, and
under `display: block; height: 90px` the bottom point lies outside for every element and mode. Each scenario first
asserts, from the two boxes, that its listed points lie outside the inner control, then clicks each of them, and
clicks the inner control's centre as the positive case.

### User Story 1 - `ocelle-button` (Priority: P1)

A host developer places `<ocelle-button>Save</ocelle-button>` in a page and gets a native-behaving button in the
Ocelle look: a choice of variants and sizes, a disabled state, a slotted icon before the label, the token focus ring,
and a click that reaches the host as an ordinary `click` event, announced first as an `ocelle-button-activate` event.
A keyboard user and a screen-reader user meet a normal button.

**Why this priority**: the button is the most used primitive (37 uses), it blocks #12 (breadcrumb padding) and may
be used by #14, and it carries the control conventions the action row and later controls follow. Landing it alone is
already a usable release.

**Independent Test**: render each variant and size in a page, with and without an icon, enabled and disabled;
activate it by pointer, Enter and Space; read its accessibility-tree node and its computed styles.

**Acceptance Scenarios**:

1. **Given** `<ocelle-button>Save</ocelle-button>`, **When** the accessibility tree is read, **Then** there is exactly
   one node for it that has a role (other than `generic`) or a name, role `button`, name "Save", and it is in the tab
   order once; the host may show as an unnamed `generic` node beside it (Chromium does), which is allowed, and no
   `generic` node for the host has a name.
2. **Given** the button, **When** it is clicked, or focused and Enter or Space is pressed, or the host calls its
   `click()` method, **Then** the host receives exactly one `click` event (one dispatch) whose target is the
   `ocelle-button` element at every listener, and exactly one `ocelle-button-activate` event (one dispatch, its
   target the element at every listener) with `bubbles: true`, `composed: true`, `cancelable: true` and `detail` `{}`,
   dispatched before that `click` reaches any bubble-phase listener on the element or its ancestors; no other
   `ocelle-*` event is dispatched (FR-023).
3. **Given** `disabled`, **When** it is clicked or Enter or Space is pressed on it, or the host calls its `click()`
   method, **Then** it is not activated (no `click` reaches a bubble-phase listener on the element or its ancestors,
   and no `ocelle-button-activate` is dispatched), the button is not in the tab order (Tab and Shift+Tab), and the
   accessibility tree reports it disabled.
4. **Given** each `variant` value (FR-010), **When** rendered on each main ground and each state ground, and with
   `ground="chrome"` on each chrome ground, **Then** its colours come only from `--ocelle-*` tokens, its label meets
   text contrast and its boundary meets non-text contrast (where it has a boundary) in both themes, as the contrast
   check proves.
5. **Given** `variant="quiet"`, **When** rendered, **Then** it has a visible border from `--ocelle-color-control-border`
   and no fill; **Given** also `ground="accent-low"`, `"inset"`, `"hover-bg"` or `"state"` (FR-018), **Then** the
   border is `--ocelle-color-accent-strong`; **Given** `ground="chrome"` on `--ocelle-color-chrome` and on
   `--ocelle-color-chrome-hover`, **Then** the border is `--ocelle-color-chrome-muted` and the label
   `--ocelle-color-chrome-ink`.
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
11. **Given** forced-colours mode, **When** each variant is rendered enabled, disabled, focused, hovered and pressed,
    in button mode and in link mode, **Then** the label, the border (where it has one) and the focus ring are visible
    in the system colours of the plan's forced-colours table (`ButtonText` in button mode, `LinkText` in link mode,
    `Highlight` for hover and focus, `GrayText` when disabled).
12. **Given** `flush` (FR-012) with a label, with an icon and a label, icon-only, and with a one-character label, in
    each `size`, **When** the button is placed at the start of a line of text or under a heading that starts at the
    same inline position, **Then** the inline-start edge of its label (or, with an icon, of its icon) equals the
    inline-start edge of that text within 0.5 CSS px, in left-to-right text and under `dir="rtl"`; and its block size
    and minimum target are those of its `size`.
13. **Given** `flush` on each `variant`, **When** rendered, **Then** it has no border and no fill (its computed border
    width is 0 and its background is transparent), its label uses `--ocelle-color-ink` and meets text contrast on
    each main ground (with `ground="chrome"`, `--ocelle-color-chrome-ink` on each chrome ground); on hover its surface
    becomes `--ocelle-color-hover-bg` (`--ocelle-color-chrome-hover` with `ground="chrome"`), and keyboard focus shows
    the token focus ring.
14. **Given** each `variant` (and `flush`), **When** a pointer hovers it and then presses it, **Then** its hover look
    and its active look each differ from the idle look and from each other, by the tokens of FR-019 (the computed
    fill and border of each state equal the hand-written token values), on each main ground and, with
    `ground="chrome"`, on each chrome ground, except a `flush` hover on the grounds where the hover fill equals the
    ground: the `hover-bg` ground in both themes, the `inset` ground in light, the `neutral-bg` ground in dark, and
    the `chrome-hover` ground
    (`ground="chrome"`) in both themes (FR-019). The test writes that exception list by hand per theme, so a change to
    the flush hover token still fails on every other ground.
15. **Given** a stretched host (see "Stretched host") of an available button and of a disabled button, **When**
    rendered, **Then** the inner control's box equals the host's box in both axes; **When** a pointer clicks 4 px
    inside the host's bottom edge, **Then** the available button delivers exactly one `click` (one serial) and one
    `ocelle-button-activate`, and the disabled one is not activated (FR-001, FR-003, FR-023).
16. **Given** `variant="quiet"` with `ground="hover-bg"`, **When** placed on `--ocelle-color-canvas` and on
    `--ocelle-color-hover-bg` (a host row whose surface changes on hover), **Then** the border is
    `--ocelle-color-accent-strong` on both and meets 3:1 on both, as the contrast check proves (FR-018).
17. **Given** a restyled host (see "Restyled host") of an available button and of a disabled button, under each of
    the three page rules, **When** a pointer clicks each outside point, **Then** neither button is activated (no `click` reaches a bubble-phase listener on the element or its
    ancestors, and no `ocelle-button-activate`); **When** a pointer clicks the inner control's centre, **Then** the
    available button delivers exactly one `click` (one serial) whose target is the element and one
    `ocelle-button-activate`, and the disabled one is not activated (FR-001, FR-003, FR-023).
18. **Given** a host listener that calls `preventDefault()` on `ocelle-button-activate`, **When** a focused button is
    activated by click, Enter or Space, **Then** the listener sees `event.defaultPrevented` become `true`, the event is
    dispatched exactly once, the `click` is still delivered exactly once with `defaultPrevented` `true` (a button has
    no default action to cancel), and focus stays on the button (FR-023).
19. **Given** the button inside a `<form>` with a `submit` and a `reset` listener on the form, **When** it is clicked,
    or focused and Enter or Space is pressed, **Then** each activation delivers exactly one `click` and one
    `ocelle-button-activate`, and the form receives no `submit` and no `reset` event (FR-022).

---

### User Story 2 - Link mode and ARIA passthrough (Priority: P2)

A host developer sets `href` on an `ocelle-button` and gets a link that looks like a button: it navigates like a link,
leaves modifier clicks to the browser's own handling, and is announced as a link. The developer sets `aria-expanded`,
`aria-controls` or `aria-current` on the host element and an assistive technology reads that state on the real
control, without the developer knowing about the shadow root.

**Why this priority**: link-styled buttons and disclosure buttons are common in kitty-mission-ui, and #501 is a gap
consumers work around today. It also fixes the passthrough rule every later control inherits.

**Independent Test**: render a button with `href`, with and without `disabled`; set each passthrough attribute on the
host, change it, clear it with the empty or off value, remove it from the host after the move (which changes
nothing), copy the element from the live DOM and apply a morph's attribute sync to it; read the accessibility tree,
the host's custom states, the mirrors and the navigation result.

**Acceptance Scenarios**:

1. **Given** `<ocelle-button href="/projects">Projects</ocelle-button>`, **When** the accessibility tree is read,
   **Then** there is one node with a role or a name (as in US1-1), role `link`, name "Projects", and activating it with a click or Enter dispatches one
   `ocelle-button-activate` (as in US1-2) and then, unless a listener called `preventDefault()` on it, navigates to
   `/projects`; when a listener prevented it, it does not navigate. Space does not activate it (native link
   behaviour). **When** it is clicked with Ctrl, Meta, Shift or Alt held, or middle-clicked, **Then** no
   `ocelle-button-activate` is dispatched and the element prevents nothing: the browser's own modifier handling
   applies (on Chromium on Linux, Ctrl, Shift and Alt give a new tab, a new window or a download and leave the page
   as it is, and a Meta-click navigates the current tab, since Meta is not a link modifier there) (FR-023; operator
   decision at phase 3).
2. **Given** a link-mode button, **When** `target` or `rel` or `download` is set on the host (FR-021), **Then** the
   inner link has the same value.
3. **Given** a link-mode button with `disabled`, **When** rendered, **Then** it has no navigable target, is not in the
   tab order, is reported disabled (`aria-disabled="true"`) on a node of role `link`, and a click is not activated
   (no navigation, no `click` reaching a bubble-phase listener on the element or its ancestors).
4. **Given** `aria-expanded="true"` on the host, **When** the accessibility tree is read, **Then** the inner control
   reports expanded and the host has no `aria-expanded` attribute; changing it to `"false"` reports collapsed; setting
   it to `""` reports no expanded state.
5. **Given** `aria-current="page"` on the host, **When** the tree is read, **Then** the inner control reports current
   page; `"true"`, `"step"`, `"location"`, `"date"` and `"time"` pass through likewise; setting `"false"` or `""`
   removes it from the inner control.
6. **Given** `aria-controls="panel-1"` on the host and an element `id="panel-1"` in the same tree as the host, **When**
   the tree is read, **Then** the inner control's controls relation points at that element; changing the attribute to
   another id follows it; an id with no element in that tree gives no relation and no error (FR-005).
7. **Given** any passthrough attribute on the host, **When** axe runs on the page, **Then** it reports no serious or
   critical finding for the host or the inner control (no duplicate or misplaced ARIA on the host).
8. **Given** `aria-label` on the host, **When** the tree is read, **Then** it names the inner control and wins over
   `label` and the content (FR-006); setting it to `""` or to whitespace only names the inner control by `label`, or
   by its content when there is no `label` (FR-004).
9. **Given** both `aria-labelledby` (naming an element with text "Archive") and `aria-label="Remove"` on the host,
   **When** the tree is read, **Then** the inner control is named "Archive" (`aria-labelledby` wins, as in Accessible
   Name 1.2); setting `aria-labelledby=""` names it "Remove".
10. **Given** a passthrough attribute that was moved (for example `aria-current="page"`), **When** the host calls
    `removeAttribute` on it (or sets the matching reflection property to `null`), **Then** nothing changes: the inner
    control still reports the moved value; setting the off value afterwards clears it (FR-004).
11. **Given** `aria-haspopup="menu"` and `aria-expanded="false"` on the host, **When** the tree is read, **Then** the
    inner button reports a menu popup and collapsed; **Given** `aria-pressed="true"`, **Then** it reports pressed, and
    `"false"` reports not pressed (button mode; FR-009).
12. **Given** `aria-expanded="true"`, `aria-pressed="true"` or `aria-current="page"` moved from the host, **When** a host
    style rule uses `ocelle-button:state(expanded)`, `:state(pressed)` or `:state(current)`, **Then** it matches;
    after the off value or `""` is set, it no longer matches (FR-004).
13. **Given** `aria-label="Close"` and `aria-current="page"` moved from the host, **When** a copy is made from the live
    DOM, by parsing the host's `outerHTML` into a new container and by `cloneNode(true)`, **Then** each copy's inner
    control is named "Close" and reports `aria-current="page"`, the copy matches `:state(current)`, and neither copy
    has an `aria-label` or `aria-current` host attribute; the original host carries
    `data-ocelle-moved-aria-label="Close"` and `data-ocelle-moved-aria-current="page"`; after `aria-current="false"`
    the mirror reads `"false"`, and after `aria-label=""` the `aria-label` mirror is gone (FR-004). **Given** the same
    moved values, **When** a morph applies the unchanged server markup `<ocelle-button aria-label="Close"
    aria-current="page">` to the live element (idiomorph's attribute sync: set each attribute of the new markup that
    differs, then remove, in reverse order, each live attribute the new markup lacks), **Then** both mirrors are on
    the host afterwards with their values, the inner control is still named "Close" and reports `aria-current="page"`,
    and a copy made afterwards from the container's `innerHTML` is named "Close" and reports `aria-current="page"`;
    **When** the host removes a mirror or writes another value into it, **Then** the mirror reads its stored value
    again (FR-004).
14. **Given** `title="Close dialog"` on the host of `<ocelle-button>Save</ocelle-button>`, **When** the tree is read,
    **Then** there is one node with a role or a name (as in US1-1), the button named "Save" with the description
    "Close dialog", no named `generic` node for the host (an unnamed one is allowed), and the host has no `title` attribute; **Given** an icon-only button with `title="Close"` and no other
    name, **Then** it is named "Close" (Accessible Name 1.2); setting `title=""` removes it from the inner control
    (FR-004, FR-009).

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

1. **Given** a button with `busy`, **When** it is clicked or Enter or Space is pressed, or the host calls its `click()`
   method, **Then** it is not activated (no `click` reaches a bubble-phase listener on the element or its ancestors,
   and no `ocelle-button-activate` is dispatched); after `busy` is removed, the same activation delivers one `click`
   and one `ocelle-button-activate`.
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
   window, no `click` reaching a bubble-phase listener), has no `href` on its inner link, stays focusable as a node of
   role `link`, and reports busy and unavailable as in scenario 3.
9. **Given** `busy` with motion allowed, **When** the spinner's animation is read, **Then** it runs once for at most
   5 s (six turns of `--ocelle-motion-spin`) and then shows the same still arc as under reduced motion (FR-017).
10. **Given** a busy button with a stretched host, **When** a pointer clicks 4 px inside the host's bottom edge,
    **Then** it is not activated (FR-001, FR-003).
11. **Given** a busy button with a restyled host (see "Restyled host"), under each of the three page rules, **When** a
    pointer clicks each outside point or the inner control's centre, **Then** it is not activated (FR-001, FR-003).

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
   and Enter or Space is pressed, or the host calls its `click()` method, **Then** exactly one
   `ocelle-action-row-activate` event is dispatched (one dispatch, its target the element at every listener) from the
   element with `bubbles: true`, `composed: true`, `cancelable: true` and `detail` `{ rowId: "m-42" }`.
2. **Given** a row without `row-id`, **When** it is activated, **Then** the event's `detail.rowId` is `""`.
3. **Given** a row with a title, a slotted description and slotted tags, **When** the tree is read, **Then** it is one
   node, role `button`, in the tab order once, named exactly by its title text (the description and tags text are not
   in the name), or by FR-034's name passthrough when set, and its accessible description is the slotted
   description's text followed by the slotted tags' text (FR-034).
4. **Given** `label="Open mission 42"` on the row, **When** the tree is read, **Then** the row is named "Open mission
   42"; the host's `aria-label` wins over `label`; a host `aria-labelledby` naming an element in the host's tree names
   the row with that element's text (FR-005, FR-034); with both `aria-labelledby` and `aria-label` set,
   `aria-labelledby` wins (FR-006).
5. **Given** `busy` on the row, **When** the tree is read, **Then** the row reports `aria-busy="true"`; activation
   still dispatches the event (busy means "content updating", not "unavailable").
6. **Given** `presentation="flush"` with no `current` and no hover, **When** rendered, **Then** the row has no border, no surface fill and no block
   padding beyond the compact navigation density (FR-031), and every empty slot (icon, description, tags, trailing)
   takes no space and adds no gap; **Given** also an empty `<span slot="description"></span>` (or one holding only
   whitespace), **Then** the description slot still takes no space and adds no gap, and after text is written into
   that span its region takes space and the gap returns, and after the text is removed again it takes none (FR-031).
7. **Given** a row in a shrink-wrapping container (an `inline-block`, `inline-flex`, `float` or `max-content` grid
   track), **When** rendered, **Then** its inline size is at least the min-content inline size of its content, never
   0.
8. **Given** a `default`-presentation row, **When** a pointer hovers it, **Then** its surface and its border change to
   the hover tokens (FR-036); in forced-colours mode the hover keeps a visible system-colour border. **Given** a
   `flush` row, **When** a pointer hovers it, **Then** only its surface changes, to `--ocelle-color-hover-bg`
   (`--ocelle-color-chrome-hover` with `ground="chrome"`), except on the grounds where that fill equals the ground
   (the `hover-bg` ground in both themes, the `inset` ground in light, the `neutral-bg` ground in dark, the
   `chrome-hover` ground in both themes;
   FR-019), where it shows no change; no
   border appears and no part of the row moves or changes size; in forced-colours mode the hover is visible in a
   system colour, again without moving or resizing any part of the row. **Given** a row with `current` set (either
   presentation), **When** a pointer hovers it, **Then** its surface stays `--ocelle-color-accent-low` and the
   current bar stays drawn (FR-036, FR-037); a `default` current row's border changes to the hover-border token, and
   a `flush` current row shows no hover change.
9. **Given** focus on a row by keyboard, **Then** the token focus ring is drawn inside the row's edge around the whole
   row, and it is visible on all four sides also when the rows sit edge to edge (static or positioned) in a container
   with `overflow: auto` (FR-041). The four-side check runs on a row without `current` (so no bar can supply ring
   pixels) and again on a row with `current`, where the ring's inline-start band and the bar are read separately
   (US5-4).
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
    "Owner: Ana" and neither the slotted description nor the tags contribute (FR-034, FR-005); setting
    `aria-describedby=""` restores "Due Friday Blocked Design".
13. **Given** a row whose title is a 60-character identifier with no break opportunity, in a 200 px wide container,
    in each layout, **When** rendered, **Then** the title wraps inside the row and the row's inline size is at most
    the container's (FR-040).
14. **Given** a row with slotted description and tag elements, **When** rendered, **Then** each slotted element's box
    fits its text (it is not sized as an icon); only the `icon` and `trailing` slots size their elements as icons.
15. **Given** two `layout="card"` rows in a two-column grid, the second with a title that wraps so its cell is taller,
    and a row stretched in a `display: flex` row beside a taller sibling, **When** rendered, **Then** each row's inner
    control is as tall as its host (both cards' inner boxes as tall as their grid cells); **When** a pointer clicks 4 px
    inside the shorter card's host bottom edge, **Then** exactly one `ocelle-action-row-activate` event is dispatched
    (FR-001).
16. **Given** `title="Open the mission"` on a row's host, **When** the tree is read, **Then** the row is one node with a
    role or a name (as in US1-1), the host has no `title` attribute and no named `generic` node appears for it (an
    unnamed one is allowed); with no slotted description or tags the row's
    description is "Open the mission"; with a slotted description the description stays the slots' text (Accessible
    Name 1.2 uses `title` for the description only when nothing else describes the control) (FR-030); with an empty
    `<span slot="description"></span>` (or one holding only whitespace) and no tags the description is still "Open the
    mission"; after "Due Friday" is written into that span it is "Due Friday", and after the text is removed it is
    "Open the mission" again (FR-034).
17. **Given** `ground="chrome"` on a `default` row on `--ocelle-color-chrome`, **When** rendered and hovered, **Then**
    its title uses `--ocelle-color-chrome-ink`, its description and tags `--ocelle-color-chrome-muted`, it has no fill
    and a `--ocelle-color-chrome-muted` border; on hover its surface becomes `--ocelle-color-chrome-hover` and its
    border `--ocelle-color-chrome-ink` (FR-036, FR-042).
18. **Given** a `layout="row"` row with an icon, a title, a description, two tags and a trailing icon, **When** its
    container is wide enough for all of them on one line, **Then** they share one line; **When** the container is
    narrower than that line but wider than the icon, title and description together, **Then** the tags and the
    trailing icon move together to a second line (both start below the first line's boxes and share one line), and
    the icon, title and description stay on the first line (FR-032).

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
   one node with a role or a name (as in US1-1), of role `link`; **When** it is clicked or Enter is pressed, **Then** `ocelle-action-row-activate` is
   dispatched first with `{ rowId: "m-42" }` and, unless a listener called `preventDefault()`, the browser navigates to
   `/missions/42`; when a listener prevented it, it does not navigate. Space does not activate a link row.
2. **Given** a link row, **When** it is clicked with Ctrl, Meta, Shift or Alt held, or middle-clicked, **Then** no
   `ocelle-action-row-activate` event is dispatched and the element prevents nothing: the browser's own modifier
   handling applies, as in US2-1 (on Chromium on Linux a Meta-click navigates the current tab) (FR-033; operator
   decision at phase 3).
3. **Given** a link row with `current="page"`, **When** the tree is read, **Then** the inner link reports
   `aria-current="page"`; with `current="true"` it reports `aria-current="true"`; with no `current` it reports none.
4. **Given** `current` set, **When** rendered, **Then** the row shows the current mark: an `--ocelle-color-accent-low`
   surface and a bar at the row's inline start (the left side in left-to-right text, the right side under
   `dir="rtl"`), `--ocelle-bar-width` wide, the row's full block size, in `--ocelle-color-current`, drawn inline-end
   of the focus ring's band with a gap of `--ocelle-focus-offset` (FR-037); never ochre fill alone on a light ground
   (constitution II); in forced colours the bar stays visible in `Highlight`. **Given** also keyboard focus on that
   row, **Then** the ring's inline-start band, the gap (the row's surface colour) and the bar are each read at their
   own position, so the ring shows on all four sides and the bar stays a separate mark. The full
   mark (surface and bar) is drawn in both presentations; on a `flush` row it adds no border. Setting or removing
   `current` moves and resizes no content box, and axe reports no `color-contrast` incomplete result on a current
   row. **When** a pointer
   hovers the current row, **Then** the full mark stays: the surface stays `--ocelle-color-accent-low`, not
   `--ocelle-color-hover-bg` (FR-036).
5. **Given** `unavailable` on a row (button or link mode), **When** the tree is read, **Then** the row reports
   `aria-disabled="true"`, stays in the tab order, and its accessible description (the description and tags text of
   FR-034, if any) is unchanged; a link row's inner link has no `href` and is still a focusable node of role `link`.
6. **Given** an unavailable row, **When** it is clicked or Enter or Space is pressed, or (a link row) it is clicked
   with Ctrl, Meta, Shift or Alt held or middle-clicked, or the host calls its `click()` method, or (a stretched host)
   a pointer clicks 4 px inside the host's bottom edge, or (a restyled host, under each of the three page rules) a
   pointer clicks each outside point or the inner control's centre,
   **Then** it is not
   activated: no `ocelle-action-row-activate` event
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
11. **Given** `current="page"` and `ground="chrome"` on a row on `--ocelle-color-chrome`, **When** rendered and
    hovered, **Then** its surface is `--ocelle-color-chrome-hover` (not `--ocelle-color-accent-low`, a light surface in
    light), the bar is drawn as in scenario 4, and hovering changes neither (FR-037).
12. **Given** an available row with a restyled host (see "Restyled host"), under each of the three page rules, in
    button mode and in link mode, **When** a pointer clicks each outside point, **Then** it is not activated (no event, no navigation, no `click` reaching a bubble-phase listener);
    **When** a pointer clicks the inner control's centre, **Then** exactly one `ocelle-action-row-activate` event is
    dispatched (FR-001, FR-003).

---

### Edge Cases

- **Both `disabled` and `busy`** on a button: disabled wins; the button is not focusable and shows no spinner.
- **`busy` removed while the pointer is down**: a click completing after `busy` is removed is delivered normally; one
  completing while `busy` is set is not.
- **Empty label and no icon**: a button or row with no text, no `label` and no host name has no accessible name; axe
  reports it as `button-name` (or `link-name` in link mode) (a host mistake, documented; the element adds no fallback
  text).
- **Interactive content slotted into a row or a button** (a link, a button, an input): invalid nesting; documented as
  unsupported; the element does not detect it.
- **`href=""`** on a button or row: treated as no `href` (button mode). An `href` with a `javascript:` scheme (as the
  URL parser reads it, so `JAVASCRIPT:`, `java\tscript:` and a leading space or control character count) is not
  rendered as a navigable target (button mode, no `href`) so built output stays CSP-clean. An `href` that is not a
  valid URL (for example `http://[`) is button mode too, with no error. `data:` and `vbscript:` URLs are link mode and
  left to the host (Chromium blocks top-level `data:` navigation); the README states it.
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
- **Very long titles and unbreakable identifiers** in a row title or description: the row's own styles wrap them
  anywhere when needed (they do not rely on `base.css`'s identifier wrapping, which does not reach the shadow root),
  in both layouts, so the row never grows wider than its container (US4-13).
- **Unknown `variant`, `size`, `layout` or `presentation` value**: gives the default value's rendering, no error.
- **Host `role` on either element**: not supported (as in mission 005); documented.
- **An ARIA attribute the element does not list** (for example `aria-pressed` on a row): not supported; it stays on the
  host and axe flags it; documented.
- **A synthetic click dispatched on the host** (`dispatchEvent(new MouseEvent("click"))`): outside the guarantees;
  `click()` is the supported way (documented). Since such a click does not pass through the inner control, the
  element's host listener stops it in every state (FR-001), so bubble-phase listeners on ancestors and host listeners
  added after upgrade do not see it.
- **A container whose surface changes** (a host's list or table row that takes `hover-bg` on hover, or `accent-low`
  when selected) holding a bordered button: the host sets `ground` for the changed surface statically (`hover-bg` or
  `accent-low`); `--ocelle-color-accent-strong` meets 3:1 on every main ground, so the border holds in both states
  (FR-018, US1-16). The README states the rule.
- **Copies of the live DOM** (`cloneNode(true)`, `innerHTML` or `outerHTML` round trips, htmx's history snapshot): the
  moved values travel in the element's `data-ocelle-moved-*` mirror attributes and are read back at upgrade (FR-004,
  US2-13). The element restores a mirror that is removed or changed while it holds the value, so a morphing swap
  (htmx's idiomorph `morph` swap, Turbo 8 page-refresh morphs), which removes every attribute the server markup lacks,
  keeps them (FR-004, US2-13). A mirror a host writes while the element holds no value for it is unsupported
  (documented).
- **A host stretched by its layout** (a flex row, a grid cell): the inner control fills it, so every point of the host
  is the control; a button stretched by a flex row grows to the row's height (FR-001; a host that does not want that
  sets `align-self` on the element).
- **A host restyled by a page rule** (`ocelle-button { display: block }`, a full-width utility class,
  `display: flex; width: 100%`, a fixed `height`): supported; FR-001 states the rule (US1-17, US3-11, US5-6, US5-12).
- **An empty `description` or `tags` element** (`<span slot="description"></span>`, as a server template renders a
  null value, or one holding only whitespace): the slot counts as empty (FR-034): it contributes nothing to the
  description, so a moved `title` still describes the row, and it takes no space and adds no gap (FR-031); writing
  text into the element later makes the slot non-empty without a `slotchange` (US4-6, US4-16).
- **A flush button at the edge of a clipping container** (`overflow` other than `visible`, as a breadcrumb trail may
  be): FR-012 states the space the container keeps for the focus ring.
- **A host override of `--ocelle-motion-spin`**: FR-017 states the limit an override keeps.
- **Two copies of the package on one page**: mission 005's rule applies (first definition wins).
- **The host page has no `@ocelle/tokens` stylesheet**: documented, as for mission 005's elements; the controls are
  then unstyled but still operable.

## Requirements *(mandatory)*

### Functional Requirements

**Control conventions (shared by both elements and by later controls)**

- **FR-001**: Each element renders exactly one focusable inner control in its open shadow root: a native `<button
  type="button">` in button mode and a native `<a>` in link mode. The host element itself is never focusable and
  never carries a role. The element's `focus()` focuses the inner control and its `click()` clicks the inner control,
  so a click started by `click()` gets the same guarantees as any other click (FR-003). The inner control fills the
  host's box in both axes, so a host stretched by its layout (a flex row, a grid cell) has no area outside the inner
  control and every pointer click on the host reaches the inner control (operator decision, PLAN-FRESH-2-001). The
  guarantee does not rest on that layout alone: a page rule on the element (its `display`, `width` or `height`)
  outranks the element's `:host` styles and can leave host area outside the inner control, so each element also
  listens for `click` and `auxclick` on the host itself, registered when the element is constructed (before any host
  listener added after upgrade), and stops (`preventDefault()` and `stopImmediatePropagation()`) every such event whose
  composed path does not pass through the inner control, in every state, and every such event while the control is
  not available. A click outside the inner control therefore never activates the element, and a host may restyle the
  element's `display` and size (operator decision, PLAN-FRESH-3-001).
- **FR-002**: **Link versus button.** An element is in link mode exactly when it has a non-empty `href` that parses as
  a URL (against the document's base URL) whose scheme, as the URL parser reads it, is not `javascript:`; otherwise it
  is in button mode, with no error for an `href` that does not parse. `data:` and `vbscript:` URLs are link mode and
  left to the host (the README states it). Link mode exposes role `link` and the native link behaviour
  (Enter activates, Space does not, modifier clicks get the browser's own modifier handling). Button mode exposes role `button`
  (Enter and Space activate). The two modes have the same look for the same variant.
- **FR-003**: **Disabled versus unavailable.** `disabled` means "cannot be used here at all": the inner control is
  removed from the tab order, reported disabled, is not activated (as defined under User Scenarios: no navigation, no
  `ocelle-*` event, no `click` reaching a bubble-phase listener on the element or its ancestors), and in link mode has
  no navigable target. *Unavailable* means "exists but cannot be used right now": the inner control stays in the tab
  order, reports `aria-disabled="true"`, is not activated (same definition), and keeps its accessible name and
  description so a user can learn why; in link mode it has no navigable target either (no `href`, so the context
  menu, drag and the status bar offer no URL) and stays a focusable node of role `link`. Capture-phase listeners on ancestors may see the browser's click in both
  states, and listeners a host added to the element before upgrade see a click on the host outside the inner control
  (FR-001) before the element's host listener; the element gives no guarantee about them. The button's `busy` and the row's `unavailable` are unavailable
  states. In link mode "not activated" covers modifier clicks and the middle click too, so a disabled or unavailable
  link opens no new tab or window either.
- **FR-004**: **ARIA passthrough.** The ARIA attributes (and `title`) this spec lists for an element, set on the host,
  reach the inner control and update whenever the host sets them again. The element **moves** each one: it applies the value to
  the inner control and removes the attribute from the host, so an accessibility tree shows the state once, on the
  inner control, and axe reports no serious or critical finding (and no "needs review" result) caused by them
  (operator decision at planning, 2026-11-13). Reading the attribute back from the host gives `null` after the move.
  To clear a moved state a host sets an empty or whitespace-only value (`aria-controls=""`, `aria-labelledby=""`,
  `aria-describedby=""`, `aria-label=""`, `title=""`; an empty or whitespace-only `aria-label` clears it, and the name
  falls back to `label`, then content) or the ARIA "off" value (`aria-expanded="false"` reports collapsed; `aria-current="false"`
  clears the current state; `aria-pressed="false"` reports not pressed). Any other value is applied as written.
  `removeAttribute` on an attribute already moved, and so a framework binding that becomes `undefined` or `null`,
  changes nothing (operator decision, PLAN-CORRECTNESS-1-001); the README states this and gives one recipe per stack
  (React, Lit, Svelte, htmx and Thymeleaf) that binds the off value. Because host attribute selectors no longer match
  a moved state, the button exposes custom states (`:state(expanded)`, `:state(pressed)`, `:state(current)`) a host
  styles from (operator decision, PLAN-FRESH-1-009). So that a copy made from the live DOM (`cloneNode(true)`,
  `innerHTML` or `outerHTML`, htmx's history snapshot) keeps the moved values, the element mirrors each stored value
  into a host attribute it owns, `data-ocelle-moved-<attribute>` (for example `data-ocelle-moved-aria-label`), removes
  the mirror when the value is cleared, and at upgrade reads a mirror back as the stored value of an attribute the
  host does not set; a host attribute set at upgrade wins over its mirror. The mirrors are not ARIA, so they add
  nothing to the accessibility tree; hosts do not write or remove them (README) (operator decision,
  PLAN-FRESH-2-002). The element observes its mirrors: one removed or changed while the element holds a value for it
  is written back from the stored value, so a morphing swap (htmx's idiomorph `morph` swap, Turbo 8 page-refresh
  morphs), which removes every attribute the server markup lacks, leaves the mirrors in place (operator decision,
  PLAN-FRESH-3-002). A mirror written while no value is held is not read until the next upgrade (unsupported,
  README). This rule is this feature's own; mission 005's host `aria-label`
  rule for `ocelle-icon` and `ocelle-brand-mark` is unchanged, and the README says the two differ.
- **FR-005**: **ID references never cross a shadow root.** An ID-reference attribute set on the host
  (`aria-controls`, `aria-labelledby`, `aria-describedby`) is resolved by id in the host's own tree (its document or
  the shadow root it is in) and related to the inner control by element reference, not by copying the id into the
  shadow root. It is resolved again whenever the attribute changes. Behaviour is proven in Chromium; WebKit is not
  measured here and is a stated limitation (as in mission 005); the README's engine floor names the first Chromium
  and WebKit releases with the features used (operator decision, PLAN-FRESH-1-008).
- **FR-006**: **Name passthrough.** The inner control's accessible name is, in order of precedence (the order of
  Accessible Name 1.2): the host's `aria-labelledby` (FR-005), the host's `aria-label` (FR-004), the element's `label`
  property, and otherwise the element's content, which for a control that holds more than its name is its name part
  only (the row's title, FR-034). Slotted icons never contribute (mission 005 slot convention).
- **FR-007**: Both elements follow mission 005's element conventions (module and registration, properties, styles,
  manifest, stories, files and tests) and slot convention, and their styles use only `--ocelle-*` tokens and the
  values the `style-lint` gate allows.
- **FR-008**: The package README gains a "Control conventions" section stating FR-001 to FR-006 as rules later
  controls follow, and a section per element with its public interface (FR-009 for the button, FR-030 for the row);
  the button's section also gives the markup of the three consumer controls of SC-006.
  The conventions section also states: what "not activated" guarantees and that capture-phase listeners (and
  listeners added to the element before upgrade) are outside it; that a host may restyle an element's `display` and
  size without losing it (FR-001); what `busy` means on each element (unavailable on the button, FR-015; "content updating" without blocking
  activation on the row, FR-035); the two surfaces for "current" (the button's `aria-current` passthrough with no
  mark, the row's `current` property with a mark; operator decision, SPEC-1-10); that a primary action uses
  `size="default"`, so "primary action" in constitution III is not read as `variant="primary"`; and that when a
  control's content is visible, `label` and a host `aria-label` contain the visible text, ideally at its start (WCAG
  2.5.3, label in name).

**`ocelle-button`**

- **FR-009**: The public interface of `ocelle-button` is exactly: the properties and attributes `variant`, `size`,
  `flush`, `ground`, `label`, `disabled`, `busy`, `href`, `target`, `rel`, `download` (FR-010 to FR-021); the
  passthrough attributes `aria-expanded`, `aria-controls`, `aria-current`, `aria-haspopup`, `aria-pressed` (button
  mode only; not allowed on a link), `aria-label`, `aria-labelledby`, `aria-describedby` (operator decision,
  PLAN-A11Y-SECURITY-1-004) and `title` (the native tooltip, and the description or name fallback of Accessible Name
  1.2, on the inner control; operator decision, PLAN-FRESH-2-006), with their `data-ocelle-moved-*` mirror attributes
  (FR-004); the custom states `expanded`, `pressed`, `current` (FR-004); the `focus()` and `click()`
  methods (FR-001); the default slot (the label) and the `icon` slot; the native `click` event and the event
  `ocelle-button-activate` (FR-023; operator decision C1 (a), 2026-11-14); and the CSS part `control` (the inner
  control). `aria-current` is passed through with any value and draws no visual mark
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
  and the focus ring (FR-020) (operator decision, SPEC-1-07). Its content starts at the box's inline start, also when
  the content is narrower than the minimum size (the free space falls at the inline end), so the
  inline-start edge of the label (or, with an icon, of the icon) equals that of surrounding text within 0.5 CSS px
  (US1 scenario 12). It changes neither the block size nor the minimum size of its `size`. This is the compact
  breadcrumb padding #12 consumes (#518). The button's focus ring is drawn outside it (FR-020), so a container that
  clips (`overflow` other than `visible`) and holds a flush button at its edge keeps at least `--ocelle-focus-offset`
  + `--ocelle-focus-width` of unclipped space around it (for example `padding-inline` of that size with a matching
  negative margin); the README's flush note and the #12 hand-off state it.
- **FR-013**: `label` (attribute and property, not reflected) names the inner control (FR-006), trimmed; empty or
  whitespace-only counts as none.
- **FR-014**: `disabled` (boolean, reflected) applies FR-003's disabled behaviour.
- **FR-015**: `busy` (boolean, reflected) applies FR-003's unavailable behaviour and sets `aria-busy="true"` on the
  inner control; `disabled` wins over `busy`.
- **FR-016**: While busy, a spinner is shown that takes the place of a slotted icon, or, without an icon, sits in the
  icon position with the slot convention's gap; the spinner and the label never overlap; with an icon the button's box
  does not change size when `busy` toggles.
- **FR-017**: The spinner is decorative (hidden from the accessibility tree), painted in the control's text colour
  (`currentColor`; the system colour in forced colours), animated with a duration and an angle from motion tokens,
  and still and visible under `prefers-reduced-motion: reduce`. Its animation stops within 5 seconds and then shows
  the same still mark (WCAG 2.2.2; operator decision, PLAN-A11Y-SECURITY-1-009); a host with long-running work that
  wants continuous motion uses its own pausable indicator (README). The 5 s limit holds for the default value of the
  turn-duration token; a host that overrides it keeps one turn at or below 833 ms (six turns within 5 s), which the
  README states.
- **FR-018**: Variant colours come from tokens; a bordered variant's border uses `--ocelle-color-control-border` on
  the grounds `canvas`, `sheet`, `pane`, `panel`, `inspector` and `rail`, and `--ocelle-color-accent-strong` on
  `accent-low`, `inset`, `hover-bg` and the state grounds (#5 rule 1). Since an element cannot see its ancestor's
  colour, the host states the ground with the reflected `ground` attribute (`accent-low`, `inset`, `hover-bg`,
  `state`, or `chrome` below; absent or unknown means the six other main grounds) (operator decision, PLAN-TESTABILITY-1-003); `--ocelle-color-rule` is never a control
  boundary (constitution II). On a container whose surface changes (a host row that takes `hover-bg` on hover or
  `accent-low` when selected), the host sets `ground` for the changed surface statically, which is safe because
  `--ocelle-color-accent-strong` meets 3:1 on every main ground; the README states it. `ground="chrome"` places the
  control on the chrome grounds (operator decision, PLAN-FRESH-2-003): label `--ocelle-color-chrome-ink`, the
  bordered variants' idle border `--ocelle-color-chrome-muted` and no fill (so `secondary` looks like `quiet` there),
  the primary as on every ground (`accent` fill, `accent-strong` border), hover surface
  `--ocelle-color-chrome-hover`, active surface a chrome active-surface token, and hover and active border
  `--ocelle-color-chrome-ink`. On each main ground and state ground, and with `ground="chrome"` on each chrome ground,
  every variant (and `flush`) and state pair
  (enabled, hover, active, focus, disabled, busy) meets WCAG 2.2 AA text and non-text contrast in both themes, except
  disabled text, which is exempt (WCAG 1.4.3), and the contrast check covers each pair.
- **FR-019**: Hover and active states change surface and border through tokens, and each differs from the idle state
  and from the other (operator decision, PLAN-FRESH-1-007): a hovered or pressed bordered variant's border becomes a
  hover-border token; the primary's fill changes to a hover fill token on hover and back to the accent fill when
  pressed; `secondary` and `quiet` fill with `--ocelle-color-hover-bg` on hover and an active-surface token when
  pressed; a `flush` button changes its surface only (hover, then active surface); with `ground="chrome"` the chrome
  tokens of FR-018 take these roles. Where the hover surface equals the ground, a `flush` control's hover shows no
  change: on the `hover-bg` ground in both themes, on the `inset` ground in light (where `inset` and `hover-bg` are
  the same value), on the `neutral-bg` ground in dark (where `neutral-bg` and `hover-bg` are the same value), and on
  the `chrome-hover` ground with `ground="chrome"` in both themes; the README states it;
  there is no hover-only information.
- **FR-020**: Keyboard focus shows the token focus ring on the inner control (`:focus-visible`), visible in both themes
  and forced colours.
- **FR-021**: In link mode `href`, `target`, `rel` and `download` (attributes and properties, reflected) are set on
  the inner link while it is available; in button mode, and on a disabled or unavailable link (no `href`, FR-003), they
  have no effect. With `target="_blank"` and no `rel`, the inner link gets `rel="noopener"`; the same rule applies to
  link-mode rows (FR-030).
- **FR-022**: The button does not take part in forms: its inner control is always `type="button"`, activating it
  inside a `<form>` neither submits nor resets that form (US1-19), and it has no `type`, `name`, `value` or `form`
  attribute.
  The README states this and shows a host submitting from its click handler with `form.requestSubmit()`.
  Form-associated buttons may come later with #9's form-control convention as a MINOR addition (operator decision,
  2026-11-13).
- **FR-023**: **Activate event.** Each activation of an available button that delivers a `click` to the host (a
  pointer click, Enter or Space in button mode, Enter in link mode, the element's `click()`) also dispatches one
  `ocelle-button-activate` `CustomEvent` from the host with `bubbles: true`, `composed: true`, `cancelable: true` and
  `detail` `{}` (an empty object: the button carries no value, and the event's target identifies it). It is dispatched
  before that `click` reaches any bubble-phase listener on the host or its ancestors (capture-phase listeners see the
  `click` first, as under "Not activated"). Calling `preventDefault()` on it cancels the `click`'s default action: in
  link mode there is no navigation; in button mode the `click` is still delivered, with `defaultPrevented` `true`. In
  link mode, as on a link row (FR-033), a click with Ctrl, Meta, Shift or Alt held dispatches no
  `ocelle-button-activate`: its `click` is delivered, the element prevents nothing and the browser's own modifier
  handling applies (on Chromium on Linux, Ctrl, Shift and Alt give a new tab, a new window or a download; Meta is not a
  link modifier there and navigates the current tab; operator decision at phase 3); a middle click delivers no `click` and dispatches nothing. A button that is not activated (FR-003)
  dispatches neither event (operator decision C1 (a), 2026-11-14).

**`ocelle-action-row`**

- **FR-030**: The public interface of `ocelle-action-row` is exactly: the properties and attributes `row-id`
  (`rowId`), `label`, `layout`, `presentation`, `ground`, `href`, `target`, `rel`, `current`, `unavailable`, `busy`
  (FR-031 to FR-040, FR-042); the passthrough attributes `aria-label`, `aria-labelledby`, `aria-describedby` and
  `title` (operator decision, PLAN-FRESH-2-006), with their `data-ocelle-moved-*` mirror attributes (FR-004); the
  `focus()` and `click()` methods (FR-001); the slots default (title), `icon`, `description`, `tags`, `trailing`; the
  event `ocelle-action-row-activate`; and the CSS parts `control`, `title`, `description`, `tags`. Changing it after
  release is a MAJOR change. `row-id`, `layout`, `presentation`, `ground`, `href`, `target`, `rel`, `current`,
  `unavailable` and `busy` are reflected; `label` is not (trimmed, empty or
  whitespace-only counts as none, as FR-013). `href`, `target` and `rel` apply to the inner link in link mode only,
  with FR-021's `noopener` rule; the row has no `download`.
- **FR-031**: `presentation` (reflected) is `default` (bordered row on a surface, `--ocelle-radius-row`) or `flush`
  (no border, no surface, compact navigation density: block padding `--ocelle-space-1` and the compact text scale). A
  flush row stays borderless in every state: on hover only its surface changes (FR-036), as on a flush button
  (FR-019), except that a current flush row does not change on hover; the current mark (FR-037) is drawn in full, its `--ocelle-color-accent-low` surface and its bar, with
  no border. No state of a flush row moves or resizes its content.
  Every row, in every presentation and layout, has a block size of at least `--ocelle-target-min`; the flush density
  reduces padding but not this minimum (operator decision, SPEC-1-08). In every presentation an empty slot takes no
  space and adds no gap. The `icon` and `trailing` slots are empty when no element is assigned to them; the
  `description` and `tags` slots are empty when none of their assigned elements has non-whitespace text, recomputed
  when the assignment changes and when text or children inside an assigned element change (PLAN-FRESH-3-004).
- **FR-032**: `layout` (reflected) is `row` (the default: icon, title and description, tags and trailing on one line;
  when the line cannot hold its content, the tags and trailing group moves as a whole to a second line, and the icon,
  title and description stay on the first) or `card` (icon and title on the first line with trailing at its
  end; description, then tags below) (US4-18).
- **FR-033**: Activation (click, Enter, and Space in button mode) dispatches one `ocelle-action-row-activate`
  `CustomEvent` from the host with `bubbles: true`, `composed: true`, `cancelable: true` and `detail: { rowId: string
  }` (the current `row-id`, `""` when absent). In link mode the event is dispatched before navigation, and calling
  `preventDefault()` on it cancels the navigation. In link mode a click with Ctrl, Meta, Shift or Alt held, or a
  middle click, dispatches no event, the element prevents nothing and the browser's own modifier handling applies (on
  Chromium on Linux a Meta-click navigates the current tab) (operator decision, SPEC-1-09; Alt, plan decision 13;
  platform behaviour, operator decision at phase 3);
  this applies only to a row that is not unavailable. An unavailable row is not activated by any click or key (FR-003)
  and dispatches nothing; a modifier click or middle click on an unavailable link row opens no new tab or window.
- **FR-034**: The row's accessible name follows FR-006 (the title slot as content: with no host name and no `label`,
  the name is exactly the title's text; the description, tags and trailing content never join it). Its accessible
  description is the
  text of the `description` slot followed by the text of the `tags` slot (in slot order), so a screen-reader user hears
  the status and labels a sighted user sees; an empty slot (FR-031: no assigned element with non-whitespace text)
  contributes nothing, and within a non-empty slot an assigned element without non-whitespace text contributes
  nothing either, so with both slots empty the row has no slot description and a moved `title` describes it
  (PLAN-FRESH-3-004). When the host sets
  `aria-describedby`, that wins (FR-005) and neither slot contributes (operator decision, SPEC-2-04).
- **FR-035**: `busy` (boolean, reflected) sets `aria-busy="true"` on the inner control and does not block activation.
- **FR-036**: On hover (and not when unavailable) the row's surface becomes `--ocelle-color-hover-bg` and, on a
  `default`-presentation row, its border becomes a hover-border token; a `flush` row gets no border on hover
  (FR-031). The current mark takes precedence over the hover surface: a row with `current` set keeps its
  `--ocelle-color-accent-low` surface and its bar on hover, so only a `default` current row's border changes and a
  `flush` current row shows no hover change. Both are `--ocelle-*` tokens a host can override on an ancestor (#525). If no fitting hover-border token
  exists, it is added to `@ocelle/tokens` with its contrast pair in the contrast check. With `ground="chrome"` the
  hover surface is `--ocelle-color-chrome-hover` and the hover border `--ocelle-color-chrome-ink` (FR-018).
- **FR-037**: `current` (reflected) is `page` or `true`; it sets `aria-current` with that value on the inner control
  and shows the current mark of story 5 scenario 4 (an `--ocelle-color-accent-low` surface and an inline-start bar of
  `--ocelle-bar-width` in `--ocelle-color-current`), which stays on hover (FR-036). The bar is drawn inline-end of the
  focus ring's band (FR-041) with a gap of `--ocelle-focus-offset`, so on a focused current row the ring and the bar
  stay two distinct marks (operator decision, PLAN-FRESH-2-005). With `ground="chrome"` the current surface is
  `--ocelle-color-chrome-hover` (US5-11). Any other value is treated as absent.
- **FR-038**: In card layout, the gap between the title line and what follows is a token-based value (an existing
  `--ocelle-space-*` token or a new `--ocelle-*` token), and the title is the CSS part `title` so a host can adjust it.
  Tags wrap only between slotted tags; text inside a tag is not broken inside a word. Slotted description and tag
  elements keep their own box (only the `icon` and `trailing` slots size their elements as icons).
- **FR-039**: `unavailable` (boolean, reflected) applies FR-003's unavailable behaviour, the disabled-ink look and
  `GrayText` in forced colours.
- **FR-040**: The row's inline size in a shrink-wrapping context is at least the min-content inline size of its
  content; it is never 0 because of the element's own styles. The title and description wrap anywhere when a word does
  not fit, so a long unbreakable identifier never makes the row wider than its container.
- **FR-041**: Hover, focus, current and unavailable are visible in forced colours by system colours, without moving or
  resizing any part of the row, and the focus ring is drawn inside the row's edge around the whole row, so a scroll
  container's edge or an adjacent row never clips or covers it (operator decision, PLAN-A11Y-SECURITY-1-006); the
  current bar never overlaps the ring (FR-037).
- **FR-042**: **Row contrast.** A `default`-presentation row's border is a control boundary: it uses
  `--ocelle-color-control-border` on `canvas`, `sheet`, `pane`, `panel`, `inspector` and `rail`, and
  `--ocelle-color-accent-strong` on `accent-low`, `inset`, `hover-bg` and the state grounds (#5 rule 1), selected by the
  `ground` attribute as for the button (FR-018); it is never `--ocelle-color-rule` (constitution II). With
  `ground="chrome"` the default row has no fill (the chrome shows), a `--ocelle-color-chrome-muted` border, its title
  in `--ocelle-color-chrome-ink` and its description and tags in `--ocelle-color-chrome-muted` (US4-17). In both
  themes, and on each main ground and state ground (and each chrome ground with `ground="chrome"`) the row is placed
  on, these pairs meet WCAG 2.2 AA non-text contrast (3:1), and the contrast check covers each: the default border
  against the ground; the hover border (FR-036, `default` presentation only) against `--ocelle-color-hover-bg`,
  `--ocelle-color-accent-low` (a hovered current row) and the ground; the current bar (`--ocelle-color-current`, both presentations) against `--ocelle-color-accent-low`; the
  focus ring (`--ocelle-color-focus`) against the row's own surface (`--ocelle-color-sheet`, or the ground for a flush
  row), `--ocelle-color-accent-low` and `--ocelle-color-hover-bg`, since it is drawn inside the row (FR-041).
  Title and description text (the description and tags in a named description ink token) meet text contrast
  on the row's surface in every state, on each main ground and state ground, except the unavailable state's disabled ink and border, which are exempt as
  an inactive component (WCAG 1.4.3, 1.4.11); the focus ring of an unavailable row still meets 3:1.

**Done when, for each element (#7)**

- **FR-050**: Each element has a Storybook story per variant and per state (every value of every enumerated property,
  disabled, busy, unavailable, current, link mode, with and without icon and trailing, `dir="rtl"`), in light and
  dark, with a committed visual baseline produced in the pinned container, in the harness of feature 006 (#10), which
  is on `main` (3828d2f) and merged into this branch (37dd501). Each phase that adds stories commits their baselines
  and passes the `storybook-build`, `visual` and `axe` gates on them in that phase (operator decision, 2026-11-13;
  round 1's "lands only after #10", PLAN-CORRECTNESS-1-010, is satisfied). No story of this feature is ever without a
  baseline or an axe run, so no exception is recorded for them.
- **FR-051**: Interaction tests assert every event each element emits and its payload: the button's `click` and
  `ocelle-button-activate` (the latter with `bubbles`, `composed`, `cancelable` and `detail`, its order before the
  `click` and its cancel path; both absent when disabled or busy, and the activate event absent on a modifier click of
  a link-mode button) and the row's `ocelle-action-row-activate` with `bubbles`, `composed`, `cancelable` and
  `detail`, from pointer and every keyboard path.
- **FR-052**: Keyboard paths (Tab, Shift+Tab, Enter, Space) and the accessibility tree (role, name, description,
  states) are tested for every state, and axe reports no serious or critical finding on any story or test page.
- **FR-053**: The custom-elements manifest lists every public property, attribute (the passthrough attributes
  and `title` and their `data-ocelle-moved-*` mirrors included, each with a description; operator decisions,
  PLAN-CORRECTNESS-1-006, PLAN-FRESH-2-002, PLAN-FRESH-2-006), event (with its `detail` type),
  slot, CSS part and custom state of both elements, and the `manifest` gate passes.
- **FR-054**: The built output (module build and browser build) passes the strict-CSP check, and the browser build
  defines both elements.
- **FR-055**: `@ocelle/elements` gets a changelog entry naming the two new elements, their surface and the raised
  engine floor; if a token is added, `@ocelle/tokens` gets one naming it.
- **FR-056**: Changed source is mutation-tested under the gate's current rules (mission 007).

### Key Entities

- **Inner control**: the one native `<button>` or `<a>` an element renders; carries role, name, description, states
  and focus.
- **Control state**: enabled, disabled, unavailable (busy button, unavailable row), busy (row), current.
- **Activate events**: `ocelle-action-row-activate`, payload `{ rowId: string }`, and `ocelle-button-activate`, payload
  `{}`; each bubbling, composed, cancelable.
- **Row parts**: title (default slot; the accessible name), icon, description and tags (together the accessible
  description, FR-034), trailing.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Every acceptance scenario of the five user stories passes in the automated tests, in light and dark.
- **SC-002**: In every test page and story of both elements, axe reports 0 serious and 0 critical findings.
- **SC-003**: Every variant, size, presentation and state of both elements (FR-018, FR-042) passes the contrast check
  in both themes, on each main ground and state ground, and with `ground="chrome"` on each chrome ground (disabled and
  unavailable text and borders exempt).
- **SC-004**: Each element shows exactly one accessibility-tree node and one tab stop per instance (zero tab stops when
  disabled) on every scenario page of the interaction tests.
- **SC-005**: Activating an available row (busy or not) by pointer or keyboard produces exactly one event with the
  row's id, and activating an available `ocelle-button` by a plain click or a key produces exactly one `click` and one
  `ocelle-button-activate`, 100% of the time across the interaction tests; activating a disabled or busy `ocelle-button`, or an unavailable
  `ocelle-action-row`, produces no `click` reaching a bubble-phase listener and no event, and in link mode no
  navigation by any click (plain, modifier or middle).
- **SC-006**: A host can build #12's breadcrumb item (flush, compact, link mode, `aria-current`), #12's top-bar menu
  button (`ground="chrome"`, `aria-haspopup`, `aria-expanded`) and #14's copy control from `ocelle-button`'s
  documented interface alone, with no style of its own beyond token overrides: the package README gives each of the
  three as markup, and an interaction test renders exactly that markup on a page with no style that targets the
  elements (the menu button's container takes the chrome ground) and finds each one's role, name and states, its
  target size, and its look (the breadcrumb item's flush alignment, the menu button's chrome colours) as FR-009 to
  FR-023 state.
- **SC-007**: The manifest, strict-CSP, prefix, style-lint and mutation gates pass with the two elements added.

## Assumptions

- The control conventions (FR-001 to FR-006) are this library's rule from now on; later controls follow them or
  change them through a spec of their own.
- ARIA element reflection (relating the inner control to elements in the host's tree by reference) is available in
  the engine floor's Chromium; research found it is not in the old floor, so the plan raises the engine floor in the
  README's single list (Chromium 135, and WebKit 17.4 for custom states; figures from MDN's compatibility data) and
  states that WebKit is not measured.
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
- The Storybook workbench of feature 006 (#10) is the harness stories target. It is on `main` (3828d2f) and merged
  into this branch (37dd501); the stories, baselines and the story-level axe gate are planned against it as it is on
  this branch (`specs/006-storybook-workbench`, `storybook/`, `gates/`), and nothing in this feature waits for it any
  more (FR-050).
- Development runs on Node 22 with `OCELLE_CHROMIUM_PATH` set; only Chromium is measured.
