# Feature Specification: Status Elements, `ocelle-status-indicator`, `ocelle-metric` and `ocelle-pill-tag`

**Feature Branch**: `018-status-elements` (work happens on `claude/007-status-elements`)

**Created**: 2026-11-15

**Status**: Draft

**Input**: User description: "Build the status elements of issue #7 that mission 012 left open
(triage/018-status-elements.md), spec directory specs/018-status-elements, in @ocelle/elements on mission 005's element
conventions and slot convention: ocelle-status-indicator (tone; a visible marker that never pulses an empty box, the
pulse stopped under prefers-reduced-motion, state never shown by colour alone, spec-kitty-design#498), ocelle-metric
(label, display-value; layout="row" and the eyebrow label style on #8's eyebrow tokens as specs/011-layout-headers R-12
defines them, #509) and ocelle-pill-tag (status, title, slotted content, badge use; compact density with line height
1.2 and padding 4/8 and an outlined badge variant set in Schibsted Grotesk with tabular figures because the
constitution forbids monospace, #526; an interactive variant with a native button inside that follows mission 012's
control conventions FR-001 to FR-006 in specs/012-button-action-row, and a shared ellipsis that shows the full text
through #16's ocelle-tooltip exactly as specs/008-overlays/contracts/elements-overlays.md § #7 and #12 specifies, with
the token focus ring, #524); one status vocabulary shared with #9's notice tone; without redesigning ocelle-button,
ocelle-action-row or ocelle-tooltip; each element meeting #7's Done-when checklist."

**Operator decisions while specifying** (2026-11-15, human:jeroennouwsdev):

- Static pill ellipsis, "Ellipsis interactive only": only the interactive pill truncates its text and shows the full
  text through `ocelle-tooltip`. A static pill never truncates; it wraps onto further lines (FR-027, FR-033).
- Interactive pill activation, "Native click, aria-pressed": superseded by the decision on SPEC-1-01 below; the part
  that stands is that the host may set `aria-pressed`, which mission 012's passthrough moves to the inner button
  (FR-030, FR-031).
- Compact line height, "Add a 1.2 token": a new token `--ocelle-line-height-snug` with the value 1.2 is added to
  `@ocelle/tokens` and used by the compact pill (FR-025, FR-040).

**Operator decisions after spec check 1** (2026-11-15, human:jeroennouwsdev; `reviews/spec/check-1.md`, recorded in
`reviews/spec/check-1-fixes.md`):

- Activate event (SPEC-1-01), "(a)": the interactive pill dispatches `ocelle-pill-tag-activate` on the same terms as
  012's `ocelle-button-activate` (beside the native `click`, `bubbles`, `composed`, `cancelable`, `detail` `{}`, none
  on a modifier click in link mode), in both button and link mode. This supersedes the earlier "native click only"
  decision; the `aria-pressed` passthrough stays (US4-3, FR-005, FR-031).
- Pulse duration (SPEC-1-02), "(a)": the pulse stops after at most 5 s (a fixed iteration count from a motion token)
  and the dot stays solid; it restarts only when `pulse` is set again (US1-4, FR-012, FR-041, SC-004; WCAG 2.2.2).
- Compact interactive target (SPEC-1-03), "(a)": the interactive compact pill takes a minimum block size of 24 px
  from a token, so its block padding is at least 4 px rather than exactly 4 px; US3-4's exact 4 px holds for the
  static pill only (US3-4, US4-7, FR-029, FR-032, FR-043).
- Pill radius (SPEC-1-04), "(a)": every `ocelle-pill-tag` variant (the `pill` and the `badge`, static or interactive,
  filter toggles included) counts as a "state pill" for constitution II's pill-radius rule; FR-003 stays as written.
- Success criterion 1 (SPEC-1-05), "(b)": SC-001 reads "every attribute and slot listed under Consumers has an
  equivalent", which a test can check; the full inventory of kitty-mission-ui's uses is left to its migration.

**Operator decisions after spec check 3** (2026-11-15, human:jeroennouwsdev; `reviews/spec/check-3.md`, recorded in
`reviews/spec/check-3-fixes.md`):

- `aria-pressed` on the pill (SPEC-3-03), "(b) match `ocelle-button`": in link mode `aria-pressed` is moved and
  mirrored but not applied, so it gives no `:state(pressed)`; `aria-pressed="mixed"` reaches the inner button as
  written, with no pressed look and no `:state(pressed)` (FR-030, FR-031, FR-035; US4-4, US4-10).
- Reconnection (FR-012 (b), the reading the check-2 fix asked to confirm): confirmed. A reconnected indicator starts
  a new pulse run as a fresh render and keeps no state across a disconnection; the README warns that a host that
  re-inserts or re-renders an indicator more often than every 5 s keeps it pulsing (SPEC-3-08).
- Spec gate: approved after this final fix.

**Operator decisions at plan squad round 1** (human:jeroennouwsdev; `reviews/plan/round-1/refute.md`, applied in
`reviews/plan/round-1/fixes-1.md`):

- Indicator naming (PLAN-CORRECTNESS-1-005), "(b)": `label` is the only name source; a host `aria-label` is
  unsupported and not read, the README says so, and a scenario pins what Chromium then exposes (FR-014, US1-8).
- `aria-pressed` in link mode (PLAN-CORRECTNESS-1-007), "(a)": the pill gives no `:state(pressed)` in link mode as its
  own rule; `ocelle-button` as merged sets the state from the held value in link mode too, a difference recorded for
  mission 012 and not changed here (FR-031, US4-10, Edge Cases). The SPEC-3-03 premise "match `ocelle-button`" holds
  for applying `aria-pressed` (not on a link), not for the state.
- Start cases of the pulse (PLAN-CORRECTNESS-1-013), "(a)": a state-preserving move (`moveBefore()`) and a reveal from
  `hidden="until-found"` are not start cases; their behaviour is pinned by tests after the setup spike (FR-012 (b),
  (d); US1-4).
- Same-task `pulse` toggles (PLAN-CORRECTNESS-1-014), "(b)": FR-012 (a) counts rendered changes only; a removal and
  re-addition within one task coalesce and start no run, the README says so and a test pins it (FR-012 (a); US1-4).
- The metric label's name (PLAN-A11Y-SECURITY-1-001), "(a)": FR-022 and US2-2 stand; the plan draws the uppercase
  label `aria-hidden` and names the term by a visually hidden copy as written.

**Consumers** (constitution VI): kitty-mission-ui's Kitty Desktop and Kitty Dashboard screens, which today use the
`sk-pill-tag` (32 uses: `status`, `title`, slotted content, badge use), `sk-status-indicator` (2 uses: `tone`) and
`sk-metric` (2 uses: `label`, `display-value`) equivalents; spec-kitty-design #498, #509, #524 and #526 name the gaps
this feature closes. The `sk-*` library is read as requirements only; nothing is copied from it.

## Dependencies

- **Mission 012** (`specs/012-button-action-row`, not merged): its FR-001 to FR-006, the *control conventions*, are
  used here as written for the interactive pill (one native inner control, link versus button, disabled versus
  unavailable, ARIA passthrough by moving attributes, no ID reference across a shadow root, name passthrough). Its
  helpers and README section are reused, not re-implemented. User story 4 cannot start until 012 is on `main`.
- **Mission 008 / #16** (`specs/008-overlays`, not merged): `ocelle-tooltip` is used inside the pill's shadow root as
  its contract (§ "#7 and #12") shows, without `describes`. User story 5 cannot start until 008 is on `main`.
- **Mission 011 / #8** (`specs/011-layout-headers`): the eyebrow tokens of its R-12 (`font-size-eyebrow`,
  `font-weight-eyebrow`, `tracking-eyebrow`, `color-eyebrow`). If 011 has not landed when user story 2 starts, this
  feature adds those four tokens exactly as R-12 defines them.
- **Op 016 / #41** (`ops/016-plants-affected`, branch `origin/claude/041-plants-affected`, approved, not merged):
  supplies `pnpm run gate:plants -- --affected <base>` (and `--list`), which judges only the plants a phase's diff can
  affect, and the record file `reviews/phase-<N>/plants.md` each phase writes and its reviewer checks. It changes no
  element, attribute, token or package and nothing in this spec's behaviour; this feature's phases run their local
  plant check with it once it is on `main` (Assumptions). CI's required Plants check is unchanged by it.
- **On `main`**: mission 005 (element conventions, slot convention, manifest gate), mission 006 (Storybook harness,
  baselines, story axe), mission 007 and op 015 (mutation rules).
- **Not changed here**: `ocelle-button`, `ocelle-action-row`, `ocelle-tooltip` and their interfaces. If one of them
  proves insufficient, the operator is asked; this feature does not change it.

## User Scenarios & Testing *(mandatory)*

Terms used below:

- **Status vocabulary**: the five values `info`, `success`, `warning`, `danger` and `neutral`, each with its token
  pair `--ocelle-color-<value>` (for the mark, the border or the text) and `--ocelle-color-<value>-bg` (for the
  ground). The five values and the token pairs are what this feature shares with #9's `ocelle-notice` `tone`. The
  default and the fallback are per element, deliberately: on the indicator and the pill an absent, empty or unknown
  value is `neutral`; the notice keeps its own default and fallback, `info`. How each element uses the pair is its
  own too (the notice sets its text in `--ocelle-color-ink`; the pill sets its text in `--ocelle-color-<value>`). An
  unknown value is kept in the attribute as written, as on the notice and under mission 005's conventions; the element
  never rewrites it, and only the property reads the default (`status="bogus"` stays in the attribute while `status`
  reads `"neutral"`).
- **State pill** (constitution II, "the pill radius is for state pills only"): every `ocelle-pill-tag`, whatever its
  variant (`pill` or `badge`) and mode (static, button or link), a count badge and a filter toggle included
  (operator decision, SPEC-1-04).
- **Full text** of a pill: the text content of its default slot, with leading and trailing whitespace removed and
  runs of whitespace collapsed to one space.
- **Truncated**: an interactive pill whose full text does not fit on its one line in the inline size it is given, so
  part of it is replaced by an ellipsis.

### User Story 1 - A status marker that is always visible (Priority: P1)

A dashboard author places `<ocelle-status-indicator tone="success" label="Running" pulse>` next to a mission's name.
Sighted users see a solid coloured dot with a gentle pulse around it; screen-reader users hear "Running"; users who
ask for reduced motion see the same dot without any animation; users in forced-colours mode still see the dot. The
state is never carried by colour alone: the indicator has a name, or it sits next to text that names the state.

**Why this priority**: it has no dependency and is the smallest independently shippable element; #498 is a visible
defect today (a pulse over an empty box).

**Independent Test**: render the indicator in every tone, with and without `label`, with and without `pulse`, in both
themes, in forced colours and with reduced motion; move it in the document, hide and show it (a `hidden` ancestor, a closed
and opened `<details>`) and change the motion preference while `pulse` is set; read its box, computed styles, animation state and the
accessibility tree.

**Acceptance Scenarios**:

1. **Given** `<ocelle-status-indicator>` with no attributes, **When** it renders, **Then** it shows a solid dot in
   `--ocelle-color-neutral`, at least 8 px in each dimension, and is hidden from the accessibility tree.
2. **Given** each tone of the status vocabulary, **When** it renders, **Then** the dot's fill is
   `--ocelle-color-<tone>` in both themes, and the dot against the page ground meets the non-text contrast of WCAG
   1.4.11 (3:1), checked by the contrast gate.
3. **Given** `label="Running"`, **When** it renders, **Then** the accessibility tree has exactly one node of role
   `img` named "Running", and nothing else from the element.
4. **Given** `pulse`, **When** it renders with no motion preference, **Then** an animation runs on a ring around the
   dot, while the dot itself stays fully opaque at its full size in every frame; the animation runs a fixed number of
   iterations taken from a motion token, ends no later than 5 s after it started, and afterwards no animation runs and
   the dot is shown solid while `pulse` is still set; **When** `pulse` is removed before then, **Then** the animation
   stops; **When** `pulse` is set again (removed and rendered, then added in a later task), **Then** the animation runs
   again on the same terms, while a removal and re-addition within one task start no run; **When** the element is
   removed from the document and inserted again (a move, a re-sort, a keyed re-render) with `pulse` set, **Then** one
   run starts on the same terms, while a state-preserving move (`moveBefore()`) keeps the run under way; **When** the
   motion preference changes from `reduce` to no preference while `pulse` is set, **Then** one run starts at that moment
   on the same terms; **When** a connected indicator with `pulse` set that was not rendered (it or an ancestor `display:
   none`, the `hidden` attribute in its hidden state included, or inside a closed `<details>`) starts being rendered (a
   tab panel shown, a `<details>` opened), **Then** one run starts at that moment on the same terms; and no other change
   starts or restarts it, whatever it is (FR-012 lists the four cases in full; WCAG 2.2.2). The 5 s limit holds for the
   default values of the pulse's motion tokens (FR-041).
5. **Given** `pulse` and `prefers-reduced-motion: reduce`, **When** it renders, **Then** no animation runs and the dot
   is shown solid; **When** the preference changes to `reduce` while a run is under way, **Then** the run stops at
   once and the dot is shown solid.
6. **Given** forced-colours mode, **When** it renders in any tone, **Then** the dot is drawn in a system colour and
   is visible against the system background.
7. **Given** a `tone` that is not in the vocabulary, **When** it renders, **Then** it looks exactly like `neutral` and
   no error is thrown.
8. **Given** a host `aria-label` on the indicator, present or blank, with and without `label`, **When** it renders,
   **Then** the element's own accessibility semantics (role `img` with the label's name, or hidden) follow `label`
   alone exactly as without the attribute, and what Chromium's accessibility tree then shows for the attribute is
   pinned by a test; the README says a host `aria-label` is unsupported (FR-014; operator decision,
   PLAN-CORRECTNESS-1-005).

---

### User Story 2 - A metric with a label and a value (Priority: P2)

A dashboard author shows `<ocelle-metric label="Open missions" display-value="12">`. The label is set in the eyebrow
style (small, uppercase, tracked) and the value in tabular figures below it; in a dense list the author sets
`layout="row"` and the label and value share one line. Screen-reader users hear the label, then the value, in both
layouts.

**Why this priority**: two uses, one dependency (the eyebrow tokens), no interaction; #509 asks for the row layout and
the eyebrow label.

**Independent Test**: render the metric in both layouts and themes with short, long and empty values; read the
boxes, the computed label and value styles, and the accessibility tree.

**Acceptance Scenarios**:

1. **Given** `label="Open missions"` and `display-value="12"`, **When** it renders with no `layout`, **Then** the
   label is above the value, the label uses the four eyebrow tokens and is shown uppercase, and the value uses tabular
   figures in Schibsted Grotesk.
2. **Given** the same metric, **When** the accessibility tree is read, **Then** it contains a term "Open missions"
   followed by its definition "12", in that order, and the label's text is reported as written, not uppercased.
3. **Given** `layout="row"`, **When** it renders, **Then** the label and the value are on one line with the label
   first in reading order, and they wrap onto two lines, not overflow, when the inline size is too small for both.
4. **Given** `display-value="<b>12</b>"`, **When** it renders, **Then** the value shows those characters literally;
   nothing is parsed as markup.
5. **Given** no `display-value` or an empty one, **When** it renders, **Then** the label is shown, the value is empty,
   no placeholder text is added, and the element keeps the height it has with a one-line value.
6. **Given** an unknown `layout` value, **When** it renders, **Then** it uses the stacked layout.

---

### User Story 3 - A static pill and a badge (Priority: P3)

A screen author marks a mission's state with `<ocelle-pill-tag status="warning">Blocked</ocelle-pill-tag>`, a count
with `<ocelle-pill-tag variant="badge">3</ocelle-pill-tag>`, and a dense table with `density="compact"`. The pill has
the pill radius and the status colours; the badge is outlined, in Schibsted Grotesk with tabular figures. A long
label wraps onto further lines inside the pill; it is never cut off.

**Why this priority**: 32 uses, no dependency; the static pill is the bulk of the use and can land before 012 and
008.

**Independent Test**: render every status in each variant and density, with and without a leading icon, short and
long text, both themes and forced colours; read boxes, computed styles, the accessibility tree and the focus order.

**Acceptance Scenarios**:

1. **Given** `<ocelle-pill-tag>Draft</ocelle-pill-tag>`, **When** it renders, **Then** it shows "Draft" on
   `--ocelle-color-neutral-bg` with `--ocelle-color-neutral` text and `--ocelle-radius-pill` corners, is not focusable,
   and exposes its text to the accessibility tree as plain text (no role of its own).
2. **Given** each status of the vocabulary, **When** it renders in both themes, **Then** the ground and text use that
   status's tokens and the text contrast meets WCAG 1.4.3 (4.5:1), checked by the contrast gate.
3. **Given** `variant="badge"`, **When** it renders, **Then** it has a border of `--ocelle-border-width` in the
   status's colour, no fill other than the page ground, `--ocelle-radius-pill` corners, and its text in Schibsted
   Grotesk with tabular figures; no monospace family appears in its computed `font-family`.
4. **Given** `density="compact"` on a static pill, **When** it renders, **Then** its block padding is
   `--ocelle-space-1` (4 px), its inline padding `--ocelle-space-2` (8 px), and its line height
   `--ocelle-line-height-snug` (1.2). (An interactive compact pill keeps the inline padding and line height but its
   block padding is at least 4 px, US4-7, FR-029.)
5. **Given** a pill whose full text is wider than its container, **When** it renders, **Then** the text wraps onto
   further lines inside the pill, every character is visible, and no ellipsis is shown.
6. **Given** an icon in the `icon` slot, **When** it renders, **Then** the icon sits before the text as mission 005's
   slot convention sets out and adds nothing to the accessibility tree.
7. **Given** `title="Blocked since Monday"` on a static pill, **When** it renders, **Then** the attribute stays on the
   host and the element does not move or change it; this also holds for a pill that was interactive before and has
   become static (US4-8, FR-035).

---

### User Story 4 - An interactive pill (Priority: P4)

A screen author uses a pill as a filter: `<ocelle-pill-tag interactive status="info" aria-pressed="true">Mine</ocelle-pill-tag>`,
or as a link: `<ocelle-pill-tag href="/missions?state=blocked" status="warning">Blocked</ocelle-pill-tag>`. Keyboard
users reach it with Tab, see the token focus ring, and activate it with Enter (and Space as a button); screen-reader
users hear a button (pressed or not) or a link with the pill's name.

**Why this priority**: it depends on mission 012's control conventions being on `main`.

**Independent Test**: render the interactive pill in button and link mode, enabled and disabled, pressed and not;
switch its mode after render (static, button, link, in each direction), with and without focus on it; drive it by pointer and keyboard; read the accessibility tree, the focus ring and the events that reach the host.

**Acceptance Scenarios**:

1. **Given** `interactive`, **When** it renders, **Then** its shadow root holds exactly one focusable control, a
   native `<button type="button">`, the host itself is not focusable and has no role, and the accessibility tree has
   one node of role `button` named by the pill's full text.
2. **Given** a non-empty `href` that is link mode under 012's FR-002, **When** it renders, **Then** the inner control
   is a native `<a>` with that `href`, of role `link`, whether or not `interactive` is set.
3. **Given** an enabled interactive pill, in button mode and in link mode, **When** it is clicked, or focused and
   Enter is pressed (button and link mode), or Space is pressed (button mode), or its `click()` method is called,
   **Then** exactly one native `click` reaches a listener on the host, and exactly one `ocelle-pill-tag-activate`
   (`bubbles`, `composed`, `cancelable`, `detail` `{}`) is dispatched from the host before that `click` reaches any
   bubble-phase listener; **When** a listener calls `preventDefault()` on the activate event, **Then** in link mode
   there is no navigation and in button mode the `click` is still delivered with `defaultPrevented` `true`; **When**
   a link-mode pill is clicked with Ctrl, Meta, Shift or Alt held, **Then** its `click` is delivered, no
   `ocelle-pill-tag-activate` is dispatched and the browser's own modifier handling applies (FR-031).
4. **Given** `aria-pressed="true"` on the host of a button-mode pill, **When** it renders, **Then** the attribute is
   moved to the inner button as 012's FR-004 sets out, the accessibility tree reports the button pressed, and the
   pressed look is applied and `:state(pressed)` matches; **When** the host sets `aria-pressed="false"`, **Then** it
   reports not pressed, without the pressed look or the state; **When** the host sets `aria-pressed="mixed"`, **Then**
   the inner button reports mixed (applied as written, 012 FR-004), and neither the pressed look nor
   `:state(pressed)` applies, as on `ocelle-button` (FR-031; operator decision, SPEC-3-03).
5. **Given** `disabled`, **When** it renders, **Then** the pill is disabled as 012's FR-003 defines it (out of the tab
   order, reported disabled, not activated, no navigable target in link mode), dispatches neither a `click` to a
   bubble-phase listener nor `ocelle-pill-tag-activate`, and has the disabled look.
6. **Given** keyboard focus on the inner control, **When** focus is visible, **Then** the focus ring is drawn from
   `--ocelle-focus-width` and `--ocelle-focus-offset` and the focus colour token, in both themes and in forced
   colours.
7. **Given** an interactive pill in either density, with a one-character text (for example a compact badge reading
   "3") and with a long one, **When** its target is measured, **Then** the area that takes a pointer click is at
   least 24 px by 24 px; its block size and its inline size are each at least the 24 px minimum-target-size token
   (FR-043), and in `compact` density its block padding is at least `--ocelle-space-1`.
8. **Given** an interactive pill (button or link mode) whose host had `title="Blocked since Monday"`,
   `aria-describedby="hint"` and `aria-pressed="true"` (button mode) moved to the inner control, **When** the pill
   becomes static (`interactive` removed and `href` removed or set to a value that is not link mode, such as `""`),
   **Then** each moved value is back on the host as an attribute with the value it last had, the matching
   `data-ocelle-moved-*` mirrors are gone, no custom state matches, and the static pill shows the `title` natively
   (FR-035).
9. **Given** a static pill with `title`, `aria-label` and `aria-current="page"` on the host, **When** it becomes
   interactive (`interactive` set, or a link-mode `href` set), **Then** those attributes are moved to the inner
   control and mirrored exactly as at upgrade (FR-030, 012 FR-004), and `:state(current)` matches (FR-035).
10. **Given** a button-mode pill with `aria-pressed="true"` and `aria-current="true"` moved, **When** a link-mode
    `href` is set, **Then** `aria-current` is on the inner link and `:state(current)` still matches, while
    `aria-pressed` stays moved: it is not on the host, its mirror `data-ocelle-moved-aria-pressed="true"` stays, it is
    not applied to the inner link, and `:state(pressed)` no longer matches (a link cannot be pressed, 012 FR-009; the
    state rule is the pill's own, FR-031);
    **When** the `href` is removed again, **Then** the stored `aria-pressed="true"` is applied to the inner button
    again and `:state(pressed)` matches; **When** the inner control had keyboard focus at either switch, **Then** the
    new inner control has focus afterwards and the focus ring shows on it (it shows only if it showed before the
    switch) (FR-030, FR-035; operator decision, SPEC-3-03).
11. **Given** an interactive pill whose inner control has focus, **When** the pill becomes static, **Then** focus is
    lost as for a removed node (the pill does not move it), and the README tells hosts that make a focused pill static
    to move focus themselves (FR-035).
12. **Given** a pill that is static at upgrade and carries a `data-ocelle-moved-title` mirror (a copy of an
    interactive pill's markup with `interactive` dropped) and no `title`, **When** it upgrades, **Then** `title` is on
    the host with the mirror's value and the mirror is gone; **When** the host also has its own `title`, **Then** the
    host's value stays and the mirror is removed (FR-035).

---

### User Story 5 - The full text of a truncated interactive pill (Priority: P5)

A screen author gives an interactive pill a long name inside a narrow column. The pill shows one line ending in an
ellipsis. A pointer user who hovers it, or a keyboard user who focuses it, sees the full text in a tooltip; the
tooltip can be dismissed with Escape and stays while hovered (WCAG 1.4.13). A pill that is not truncated shows no
tooltip. Screen-reader users hear the full text as the control's name either way.

**Why this priority**: it depends on #16's `ocelle-tooltip` being on `main`.

**Independent Test**: render enabled and disabled interactive pills whose full text fits and does not fit; change the
container width, the text and `disabled`; hover, focus and press Escape; read the tooltip state, the visible text and the accessibility tree.

**Acceptance Scenarios**:

1. **Given** an interactive pill whose full text fits its inline size, **When** it is hovered or focused, **Then** no
   tooltip is shown.
2. **Given** an interactive pill whose full text does not fit, **When** it renders, **Then** it shows a single line
   ending in an ellipsis, and the inner control's accessible name is still the full text.
3. **Given** that truncated pill, **When** it is hovered or receives keyboard focus, **Then** `ocelle-tooltip` shows
   the full text, as its contract defines for a trigger without `describes`, and the tooltip adds nothing to the
   accessibility tree.
4. **Given** a shown tooltip, **When** Escape is pressed, or pointer and focus leave, **Then** the tooltip hides as
   `ocelle-tooltip` defines it; the pill itself does not change.
5. **Given** a truncated pill, **When** its container grows until the text fits (or its text is shortened until it
   fits), **Then** it stops being truncated and the tooltip is disabled without a reload; and the reverse change
   enables it.
6. **Given** a disabled interactive pill (button or link mode) whose full text does not fit on one line, **When** it
   renders, **Then** it is not truncated: its text wraps onto further lines inside the pill as a static pill's does
   (FR-027), every character is visible, no ellipsis is shown, and the tooltip stays disabled, so no pointer or
   keyboard path is needed to read the full text; **When** `disabled` is removed, **Then** it shows one line again and
   is truncated (with the tooltip enabled) if the full text does not fit.

---

### Edge Cases

- A pill with no slotted text (only an icon, or nothing): a static pill renders an empty pill without error; an
  interactive pill with no full text and no `aria-label`, `aria-labelledby` or `label` (FR-025) has no accessible
  name, and the README says such a pill must be named (axe reports it; the element does not invent a name).
- An interactive pill named by `aria-label` or `label` whose full text differs: the tooltip still shows the full text
  (the visible text), and the name follows 012's FR-006 precedence.
- `label` on a static pill: it has no effect; a static pill has no control to name and exposes its text as plain
  text (FR-027).
- Slotted text changes after render (a framework re-render, an htmx swap): the full text, the tooltip text and the
  truncation state follow it.
- A tone, status, variant, density or layout set to an unknown value falls back to its default silently.
- `pulse` on a `neutral` indicator: allowed; the vocabulary does not decide which tones pulse, the host does.
- An indicator with an empty or whitespace-only `label`: treated as no label (decorative).
- A host `aria-label` on an indicator: unsupported and not read; `label` alone decides its semantics, and the README
  says so (US1-8, FR-014).
- `pulse` removed and set again within one task (a framework writing both in one render): the changes coalesce and no
  new run starts; the README tells hosts to set it again in a later task (FR-012 (a)).
- `disabled` on a static pill (neither `interactive` nor a link-mode `href`) has no effect.
- `aria-pressed` on a link-mode pill: moved and mirrored and, as on `ocelle-button`, not applied to the link (a link
  cannot be pressed, 012 FR-009); by the pill's own rule it gives no `:state(pressed)` (`ocelle-button` as merged
  does; operator decision, PLAN-CORRECTNESS-1-007); it is applied again if the pill returns to button
  mode, and the README says it has no effect on a link (FR-030, FR-035; operator decision, SPEC-3-03).
- A pill whose mode changes after render (a filter that becomes a link, a framework binding `href` to `""`): moved
  values follow the mode as FR-035 sets out; none is lost. If the inner control had focus at a switch between button
  and link mode, the new inner control has it afterwards; if the pill becomes static while focused, focus is lost as
  for a removed node and the README tells hosts to move it (US4-10, US4-11).
- ARIA states on a static pill, including those FR-035 (a) writes back (for example `aria-pressed="false"`), stay on
  the host, where axe may flag them (`aria-pressed`, or `aria-label` / `aria-labelledby` on an element with no role).
  They are the host's to clear: the README tells hosts to remove them (`removeAttribute`) once the pill is static, or
  to clear them before making it static, and no story shows that state (FR-004, FR-035).
- A pill that is static at upgrade but carries `data-ocelle-moved-*` mirrors (copied markup, server markup that
  dropped `interactive`): each mirror is written back as its host attribute unless the host already sets that
  attribute, and removed (US4-12, FR-035).
- A disabled interactive pill with a full text that does not fit: it wraps rather than truncates (US5-6, FR-033).
- Forced colours: status colours are replaced by system colours; the pill keeps a visible border so its extent is
  still seen; the badge keeps its outline.
- Right-to-left documents: the icon slot, the row layout and the ellipsis follow the inline direction.
- Very long unbroken words in a static pill or a metric value: they break inside the box rather than overflow it.

## Requirements *(mandatory)*

### Functional Requirements

**Shared**

- **FR-001**: The three elements follow mission 005's element conventions (module and registration, naming, property
  and attribute reflection, adopted stylesheets, no I/O) and register as `ocelle-status-indicator`, `ocelle-metric`
  and `ocelle-pill-tag`.
- **FR-002**: The status vocabulary (Terms) is used by the indicator's `tone` and the pill's `status`. What is shared
  with #9's notice `tone` is the five values and their `--ocelle-color-<value>` / `--ocelle-color-<value>-bg` pairs
  only; the default and the fallback are per element. On the indicator and the pill an absent, empty or unknown value
  is `neutral` (the notice's `info` default is its own and is not changed here). An unknown value stays in the
  attribute as written and the property reads `"neutral"`. Nothing in this feature introduces a sixth value.
- **FR-003**: All styling uses `--ocelle-*` tokens only (constitution II); no element uses a monospace family; the
  pill radius is used only by the pill tag, every variant and mode of which is a state pill (Terms; operator
  decision, SPEC-1-04).
- **FR-004**: Each element has a story per variant and per state, in light and dark, with committed baselines made in
  mission 006's pinned container, and story-level axe reports no serious or critical finding on any story.
- **FR-005**: The custom-elements manifest declares every public property, attribute, event (with its `detail`
  type), method, slot, part, custom state and CSS custom property of the three elements, each with a description. For
  the pill this includes: the passthrough attributes it moves (FR-030) and each one's `data-ocelle-moved-*` mirror
  attribute, as 012's FR-053 declares them; the methods `focus()` and `click()` (012 FR-001); the events `click` (the
  native click, documented) and `ocelle-pill-tag-activate` (`detail` `{}`, FR-031); and the custom states `pressed`
  (button mode, `aria-pressed="true"`) and `current` (button and link mode) (FR-031). The indicator and the metric have no events, no methods of their
  own and no custom states, and the manifest declares none for them.
- **FR-006**: The built output of the three elements passes the strict-CSP check.
- **FR-007**: The elements README gains a section per element (usage, attributes, accessibility notes, the
  consumer-facing rules stated in this spec), and `@ocelle/elements` and `@ocelle/tokens` each gain a changelog entry
  naming the surface added.

**`ocelle-status-indicator`**

- **FR-010**: Attributes and properties: `tone` (status vocabulary, default `neutral`), `label` (string, default
  empty), `pulse` (boolean, default false). All reflect.
- **FR-011**: The element renders a dot: a solid, fully opaque circle filled with `--ocelle-color-<tone>`, at least
  8 px in each dimension and sized from tokens. The dot is shown in every state; it is never transparent, empty or
  outlined only.
- **FR-012**: With `pulse`, an animation runs on a ring drawn around the dot, never on the dot itself; in every frame
  the dot keeps its full opacity and size. Its duration and its iteration count come from motion tokens (FR-041), and
  the whole animation ends at most 5 s after it starts (WCAG 2.2.2); afterwards no animation runs and the dot is
  shown solid while `pulse` stays set. A run starts in exactly these four cases, and this list is complete: (a) when
  `pulse` goes from absent to present while the element is connected and rendered, as a rendered change (a removal
  and re-addition within one task coalesce into no change and start no run, which the README states; operator
  decision, PLAN-CORRECTNESS-1-014); (b) each time the element is connected to a document with `pulse` set (its first
  render, and every reconnection after a removal or a move, which is a fresh render: the element keeps no pulse state
  across a disconnection; operator decision after check 3); a state-preserving move (`moveBefore()`) is not a
  reconnection here and keeps the run under way (operator decision, PLAN-CORRECTNESS-1-013); (c)
  when the motion preference changes from `reduce` to no preference while the element is connected with `pulse` set;
  and (d) each time the element starts being rendered while connected with `pulse` set, having not been rendered
  because it or an ancestor was `display: none` (the `hidden` attribute in its hidden state included) or inside a closed
  `<details>` (a hidden tab panel shown, a `<details>` opened, a `hidden` ancestor revealed); a reveal from
  `hidden="until-found"` is not a start case (operator decision, PLAN-CORRECTNESS-1-013). What a `moveBefore()` move
  and an `until-found` reveal do is pinned by tests. Each case keeps no state from earlier
  runs. A case that occurs while the element is not rendered starts no run of its own; the run starts when (d) occurs.
  No other change starts or restarts a run: not a change of `tone`, `label` or any other attribute, the theme, the
  element's size or position, `visibility` or opacity, or scrolling it out of view and back. Without `pulse`, no
  animation runs (operator decision, SPEC-1-02). The 5 s limit holds for the default values of the pulse's motion
  tokens, per run; a host that overrides them keeps their product at or below 5 s, which the README states (as 012
  FR-017 does for its spinner). The README also states that each connection, and each time the indicator is shown
  again, starts a run, so a host that re-inserts, moves, re-renders or re-shows an indicator more often than every
  5 s (a polled swap, a live re-sort) keeps it pulsing, and should keep `pulse` off between changes or keep the
  element in place (SPEC-3-08).
- **FR-013**: Under `prefers-reduced-motion: reduce` no animation runs, with or without `pulse`, and the dot is shown
  solid; a change of the preference to `reduce` stops a run under way at once (and a change back starts one, FR-012
  (c)).
- **FR-014**: With a non-empty (after trimming) `label`, the element exposes exactly one accessibility node of role
  `img` named by the label. With no label, the element is hidden from the accessibility tree entirely, and the README
  states that a host must then place text naming the state next to it (state is never shown by colour alone). `label`
  is the only name source: the element does not read a host `aria-label`, which is unsupported (the README says so);
  what Chromium exposes for one is pinned by US1-8 (operator decision, PLAN-CORRECTNESS-1-005).
- **FR-015**: In forced-colours mode the dot is drawn in a system colour and stays visible against the system
  background.
- **FR-016**: The indicator does not signal loading or busy state to assistive technology (no `aria-busy`, no live
  region); a busy region is the host's, and #13's `ocelle-progress` is the element for progress. The README says so.

**`ocelle-metric`**

- **FR-020**: Attributes and properties: `label` (string), `display-value` / `displayValue` (string), `layout`
  (`stack`, the default, or `row`). All reflect. Unknown `layout` values are `stack`.
- **FR-021**: Both strings are rendered as text, never parsed as markup, and shown as given (no number formatting,
  no unit added).
- **FR-022**: The label uses the eyebrow style: `--ocelle-font-size-eyebrow`, `--ocelle-font-weight-eyebrow`,
  `--ocelle-tracking-eyebrow` and `--ocelle-color-eyebrow`, shown uppercase by style only, so assistive technology
  reads the label as written.
- **FR-023**: The value uses Schibsted Grotesk with tabular figures (`--ocelle-figures`).
- **FR-024**: The label and value are exposed as one term and its definition, in that order, in both layouts. In
  `stack` the label is above the value; in `row` they share one line, label first in reading order, and wrap rather
  than overflow when there is not room for both. An empty value adds no placeholder and keeps the one-line value
  height.

**`ocelle-pill-tag`**

- **FR-025**: Attributes and properties: `status` (status vocabulary, default `neutral`), `variant` (`pill`, the
  default, or `badge`), `density` (`default` or `compact`), `interactive` (boolean), `href` (string), `disabled`
  (boolean), all reflected; and `label` (attribute and property, string, not reflected), which names the inner control
  of an interactive pill in 012's FR-006 precedence, trimmed, empty or whitespace-only counting as none (as 012's FR-013
  defines it). `label` changes only the accessible name: the visible text and the tooltip text stay the full text
  (FR-034). On a static pill `label` has no effect. Unknown `variant` and `density` values fall back to their defaults
  and stay in the attribute as written.
- **FR-026**: Content: the default slot holds the pill's text; the `icon` slot follows mission 005's slot convention.
  Slotted icons are decorative and add nothing to the accessibility tree.
- **FR-027**: A static pill (neither `interactive` nor a link-mode `href`) is not focusable, has no role of its own,
  exposes its text as plain text, and wraps a full text that does not fit onto further lines; it never truncates.
  `title` and ARIA attributes on a static pill's host are left where they are.
- **FR-028**: The `pill` variant fills with `--ocelle-color-<status>-bg`, sets its text in `--ocelle-color-<status>`,
  and has `--ocelle-radius-pill` corners. The `badge` variant has no fill of its own, a border in
  `--ocelle-color-<status>` of `--ocelle-border-width`, `--ocelle-radius-pill` corners, and its text in Schibsted Grotesk with
  tabular figures. Text meets 4.5:1 and the badge border 3:1 on their grounds, in both themes, checked by the contrast
  gate. Forced colours keep a visible border on both variants.
- **FR-029**: `density="compact"` sets inline padding `--ocelle-space-2` and line height `--ocelle-line-height-snug`.
  On a static pill its block padding is exactly `--ocelle-space-1`. On an interactive pill its block padding is at
  least `--ocelle-space-1` (operator decision, SPEC-1-03). An interactive pill, in either density, has a block size
  and an inline size each at least the 24 px minimum-target-size token (FR-043), so its pointer target meets FR-032
  whatever its font size and however short its text (a one-character compact badge included). The default density keeps the spacing
  the plan sets from tokens.
- **FR-030**: An interactive pill (`interactive`, or a non-empty `href` that is link mode) follows mission 012's
  FR-001 to FR-006 as written: one native inner control (`<button type="button">` in button mode, `<a>` in link
  mode, FR-002 deciding the mode), `disabled` as FR-003 defines it, ARIA passthrough by moving attributes with
  `data-ocelle-moved-*` mirrors (FR-004), no ID reference across the shadow root (FR-005), and name passthrough
  (FR-006). The attributes it moves, in both button and link mode, are `aria-label`, `aria-labelledby`,
  `aria-describedby`, `aria-controls`, `aria-current` (with any value, as 012 FR-009 passes it on `ocelle-button`) and
  `title`, and `aria-pressed`, which, as on `ocelle-button` (012 FR-009 and its data model), is moved and mirrored in
  both modes but applied to the inner control in button mode only (a link cannot be pressed; operator decision,
  SPEC-3-03). What happens to them when the mode changes is FR-035. It reuses 012's helpers rather than
  re-implementing them; where FR-035 needs more of them (writing held values back to the host of a static pill), the
  plan extends them so that `ocelle-button` and `ocelle-action-row` keep their behaviour and their passthrough tests
  pass unchanged (SPEC-3-05).
- **FR-031**: **Activate event.** Each activation of an enabled interactive pill that delivers a `click` to the host (a
  pointer click, Enter or Space in button mode, Enter in link mode, the element's `click()`), in button mode and in link
  mode, also dispatches one `ocelle-pill-tag-activate` `CustomEvent` from the host with `bubbles: true`, `composed:
  true`, `cancelable: true` and `detail` `{}`, on the same terms as 012's `ocelle-button-activate` (012 FR-023): it is
  dispatched before that `click` reaches any bubble-phase listener on the host or its ancestors; `preventDefault()` on
  it cancels the `click`'s default action (in link mode no navigation; in button mode the `click` is still delivered
  with `defaultPrevented` `true`); in link mode a click with Ctrl, Meta, Shift or Alt held dispatches no
  `ocelle-pill-tag-activate`, its `click` is delivered and the browser's own modifier handling applies; a middle click
  dispatches nothing. A disabled pill, or a static pill, dispatches no `ocelle-pill-tag-activate` (operator decision,
  SPEC-1-01). In button mode a moved `aria-pressed` of `true` gives the pressed look and exposes the custom state
  `:state(pressed)`; any other value (`false`, `mixed`, which reaches the inner button as written and is reported mixed,
  or a cleared value) gives neither, as on `ocelle-button` (012's data model; operator decision, SPEC-3-03). In link
  mode no `aria-pressed` value gives the pressed look or `:state(pressed)`: this is the pill's own rule (`ocelle-button`
  as merged sets its state from the held value in link mode too; operator decision, PLAN-CORRECTNESS-1-007). In button
  and link mode a moved `aria-current` present and other than `false` exposes `:state(current)`, with no visual mark of
  its own, as `ocelle-button` does (012 FR-004, FR-009). A custom state follows the value applied to the inner control
  only: an attribute on the host of a static pill, or an `aria-pressed` held but not applied in link mode, gives no
  custom state. The pill has no other custom state.
- **FR-032**: An interactive pill shows the token focus ring on keyboard focus, in both themes and forced colours, and
  its pointer target is at least 24 px by 24 px in either density (WCAG 2.5.8; in compact density by FR-029's
  minimum block size). It is not a primary action, so
  `--ocelle-target-min` does not apply.
- **FR-033**: An enabled interactive pill shows its full text on one line; when the full text does not fit, it is
  truncated with an ellipsis at the inline end. A disabled interactive pill is never truncated: it wraps a full text
  that does not fit onto further lines, as a static pill does (FR-027), because a disabled control is no tooltip
  trigger (012 FR-003; #16's contract, "Triggers are buttons and links") and its full text must stay readable
  without one. Truncation is re-evaluated whenever the pill's inline size, its full text or its `disabled` state
  changes.
- **FR-034**: An interactive pill wraps its inner control in `ocelle-tooltip` as #16's contract shows for the pill
  (`text` set to the full text, `disabled` while not truncated, no `describes`), so the full text is shown on hover and
  keyboard focus only while truncated, with the tooltip's own WCAG 1.4.13 behaviour. The inner control keeps its own
  accessible name (FR-030); the tooltip adds nothing to the accessibility tree.
- **FR-035**: **Mode changes.** The pill's mode (static, button, link) follows `interactive` and `href` (FR-002) and
  is re-evaluated whenever either changes. A passthrough attribute (FR-030) lives in exactly one place at a time:
  moved to the inner control, with its `data-ocelle-moved-*` mirror, while the current mode moves it; on the host,
  with no mirror, while it does not. So: (a) when the pill becomes static, each value it holds as moved is written
  back to the host as that attribute with the value it last had (an off value such as `aria-pressed="false"`
  included; a value that was cleared is not written back), and its mirror is removed; (b) when it becomes interactive,
  the host's passthrough attributes are moved and mirrored as at upgrade (012 FR-004); (c) on a switch between button
  and link mode, every moved value stays moved and mirrored and is applied to the new inner control as FR-030 sets
  out for its mode (so `aria-pressed` is held but not applied on the link, and applied again on the button; operator
  decision, SPEC-3-03). Custom states follow the applied values only (FR-031). No passthrough value is lost or
  duplicated by a mode change. (d) **Focus**: if the inner control had focus at a switch between button and link
  mode, the new inner control has focus afterwards, and the focus ring shows on it if, and only if, it showed before
  the switch (WCAG 2.4.3); when the pill becomes static while its inner control has focus, focus is lost as for a
  removed node and the pill does not move it, and the README tells hosts that do this to move focus themselves; a
  pill that becomes interactive does not take focus. (e) **Static at upgrade**: a pill that is static when it
  upgrades and carries `data-ocelle-moved-*` mirrors writes each mirror back to the host as its attribute, unless the
  host already sets that attribute (the host's value then wins), and removes the mirror, as in (a) (SPEC-3-07). ARIA
  states left on a static pill's host, written back by (a) or (e) or set by the host, are the host's to clear (Edge
  Cases; README).

**Tokens**

- **FR-040**: `@ocelle/tokens` gains `--ocelle-line-height-snug` with the value 1.2, validated and documented like the
  other line-height tokens.
- **FR-041**: The indicator's pulse takes its duration and its iteration count from motion tokens (FR-012); where no
  existing token suits, the plan adds one, and with their default values their product is at most 5 s (FR-012). A
  token added here follows the token set's reduced-motion rule as it stands on `main` when the token is added; the
  plan confirms that the token validator accepts an iteration-count (unitless) token in the motion group, or states
  the change it needs.
- **FR-042**: If mission 011 has not landed when the metric is built, the four eyebrow tokens are added exactly as
  011's R-12 defines them; if it has, they are used as they are.
- **FR-043**: The interactive pill's minimum block size and minimum inline size (FR-029) come from one token whose
  value is 24 px (WCAG 2.5.8's minimum); if no existing token has that meaning, the plan adds one to
  `@ocelle/tokens`, validated and documented like the other size tokens (FR-029; operator decision, SPEC-1-03).

### Key Entities

- **Status vocabulary**: five named states with their foreground and ground tokens; used by the indicator and the
  pill; the values and token pairs are shared with #9's notice, the default (`neutral` here, `info` on the notice) is
  per element.
- **Pill**: full text, label, status, variant, density, mode (static, button, link; re-evaluated on every change of
  `interactive` or `href`, with the passthrough values following it, FR-035), disabled, pressed, current, truncated; activation reported by the native `click` and `ocelle-pill-tag-activate` (payload `{}`, bubbling,
  composed, cancelable).
- **Metric**: a label and a display value, laid out stacked or in a row.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Every attribute and slot listed under Consumers (the pill's `status`, `title`, slotted content and badge
  use; the indicator's `tone`; the metric's `label` and `display-value`) has an equivalent in the interface this
  feature defines, and a test renders each equivalent with no consumer CSS. The full inventory of kitty-mission-ui's
  36 uses is checked at kitty-mission-ui's migration, outside this feature (operator decision, SPEC-1-05).
- **SC-002**: 100 % of the stories of the three elements have light and dark baselines, and axe reports zero serious
  or critical findings on them.
- **SC-003**: Every status-vocabulary pairing of foreground and ground used by these elements passes the automated
  contrast check (4.5:1 for text, 3:1 for the dot and the badge border) in both themes.
- **SC-004**: With reduced motion requested, zero animations run on any indicator; with it not requested, the dot is
  fully visible in 100 % of sampled animation frames, and with the default token values no pulse run lasts longer
  than 5 s from its start, whether it started by setting `pulse`, by connecting the element, by a change of the
  motion preference or by the element starting to be rendered (FR-012 (d)).
- **SC-005**: A keyboard-only user can reach, activate and read the full text of every enabled interactive pill,
  truncated or not, without a pointer; every activation produces exactly one `click` and one
  `ocelle-pill-tag-activate` (none on a modifier click in link mode); the full text of every disabled interactive
  pill is visible without any interaction.
- **SC-006**: Every property, attribute (the passthrough attributes and their `data-ocelle-moved-*` mirrors
  included), event with its `detail` type, method, slot, part, custom state and CSS custom property of the three
  elements is in the manifest, and the manifest, CSP, prefix, lint and mutation gates pass for the changed source.

## Assumptions

- The status vocabulary has exactly the values and token pairs of #9's notice tone (its default is this feature's
  own, FR-002); kitty-mission-ui states such as "running" or "blocked" map onto
  it in the consumer (for example running → `info` with `pulse`). A further value needs its own consumer and a later
  feature.
- `label` on the indicator is the one way to name it; a host `aria-label` and slotted content are not supported on the
  indicator (US1-8).
- The metric's display value is a pre-formatted string from the host; the element formats nothing.
- The pill has no `unavailable` state and no `size` beyond `density`; 012's unavailable state is adopted later if a
  consumer asks.
- The pill's `title` (static) keeps the browser's native behaviour, which is the host's choice; the README points to
  the interactive pill and its tooltip for an accessible full text.
- Behaviour is measured in Chromium only, as in missions 005 and 012; WebKit is a stated limitation.
- Implementation waits for missions 012 and 008 (and op 016's affected-plants mode, Dependencies) to be on `main`; user stories 1
  to 3 do not need 012 or 008, but the whole mission is implemented after both land.
- The kitty-mission-ui usage inventory is read from #7 as triage 012 recorded it (counts and attribute names only);
  the spec-kitty-design issues #498, #509, #524 and #526 were not read in full. SC-001 is checked against the
  recorded attributes and slots; the full inventory of the 36 uses and their modifiers is kitty-mission-ui's
  migration's to check (operator decision, SPEC-1-05).
