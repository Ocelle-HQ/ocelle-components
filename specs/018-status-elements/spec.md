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
- Interactive pill activation, "Native click, aria-pressed": activation is reported by the native `click` only, as
  `ocelle-button` does; the host may set `aria-pressed`, which mission 012's passthrough moves to the inner button
  (FR-030, FR-031).
- Compact line height, "Add a 1.2 token": a new token `--ocelle-line-height-snug` with the value 1.2 is added to
  `@ocelle/tokens` and used by the compact pill (FR-025, FR-040).

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
- **On `main`**: mission 005 (element conventions, slot convention, manifest gate), mission 006 (Storybook harness,
  baselines, story axe), mission 007 and op 015 (mutation rules).
- **Not changed here**: `ocelle-button`, `ocelle-action-row`, `ocelle-tooltip` and their interfaces. If one of them
  proves insufficient, the operator is asked; this feature does not change it.

## User Scenarios & Testing *(mandatory)*

Terms used below:

- **Status vocabulary**: the five values `info`, `success`, `warning`, `danger` and `neutral`, the same values and the
  same token mapping (`--ocelle-color-<value>` for the mark or text, `--ocelle-color-<value>-bg` for the ground) as
  #9's `ocelle-notice` `tone`. An absent, empty or unknown value is `neutral`.
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
themes, in forced colours and with reduced motion; read its box, computed styles, animation state and the
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
   dot, while the dot itself stays fully opaque at its full size in every frame; **When** `pulse` is removed,
   **Then** the animation stops.
5. **Given** `pulse` and `prefers-reduced-motion: reduce`, **When** it renders, **Then** no animation runs and the dot
   is shown solid.
6. **Given** forced-colours mode, **When** it renders in any tone, **Then** the dot is drawn in a system colour and
   is visible against the system background.
7. **Given** a `tone` that is not in the vocabulary, **When** it renders, **Then** it looks exactly like `neutral` and
   no error is thrown.

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
3. **Given** `variant="badge"`, **When** it renders, **Then** it has a 1 px-or-token-width border in the status's
   colour, no fill other than the page ground, `--ocelle-radius-pill` corners, and its text in Schibsted Grotesk with
   tabular figures; no monospace family appears in its computed `font-family`.
4. **Given** `density="compact"`, **When** it renders, **Then** its block padding is `--ocelle-space-1` (4 px), its
   inline padding `--ocelle-space-2` (8 px), and its line height `--ocelle-line-height-snug` (1.2).
5. **Given** a pill whose full text is wider than its container, **When** it renders, **Then** the text wraps onto
   further lines inside the pill, every character is visible, and no ellipsis is shown.
6. **Given** an icon in the `icon` slot, **When** it renders, **Then** the icon sits before the text as mission 005's
   slot convention sets out and adds nothing to the accessibility tree.
7. **Given** `title="Blocked since Monday"` on a static pill, **When** it renders, **Then** the attribute stays on the
   host and the element does not move or change it.

---

### User Story 4 - An interactive pill (Priority: P4)

A screen author uses a pill as a filter: `<ocelle-pill-tag interactive status="info" aria-pressed="true">Mine</ocelle-pill-tag>`,
or as a link: `<ocelle-pill-tag href="/missions?state=blocked" status="warning">Blocked</ocelle-pill-tag>`. Keyboard
users reach it with Tab, see the token focus ring, and activate it with Enter (and Space as a button); screen-reader
users hear a button (pressed or not) or a link with the pill's name.

**Why this priority**: it depends on mission 012's control conventions being on `main`.

**Independent Test**: render the interactive pill in button and link mode, enabled and disabled, pressed and not;
drive it by pointer and keyboard; read the accessibility tree, the focus ring and the events that reach the host.

**Acceptance Scenarios**:

1. **Given** `interactive`, **When** it renders, **Then** its shadow root holds exactly one focusable control, a
   native `<button type="button">`, the host itself is not focusable and has no role, and the accessibility tree has
   one node of role `button` named by the pill's full text.
2. **Given** a non-empty `href` that is link mode under 012's FR-002, **When** it renders, **Then** the inner control
   is a native `<a>` with that `href`, of role `link`, whether or not `interactive` is set.
3. **Given** an interactive pill, **When** it is clicked, or focused and Enter is pressed (button and link mode), or
   Space is pressed (button mode), **Then** exactly one native `click` reaches a listener on the host, and no
   `ocelle-*` event is emitted.
4. **Given** `aria-pressed="true"` on the host of a button-mode pill, **When** it renders, **Then** the attribute is
   moved to the inner button as 012's FR-004 sets out, the accessibility tree reports the button pressed, and the
   pressed look is applied; **When** the host sets `aria-pressed="false"`, **Then** it reports not pressed.
5. **Given** `disabled`, **When** it renders, **Then** the pill is disabled as 012's FR-003 defines it (out of the tab
   order, reported disabled, not activated, no navigable target in link mode) and has the disabled look.
6. **Given** keyboard focus on the inner control, **When** focus is visible, **Then** the focus ring is drawn from
   `--ocelle-focus-width` and `--ocelle-focus-offset` and the focus colour token, in both themes and in forced
   colours.
7. **Given** an interactive pill in either density, **When** its target is measured, **Then** the area that takes a
   pointer click is at least 24 px by 24 px.

---

### User Story 5 - The full text of a truncated interactive pill (Priority: P5)

A screen author gives an interactive pill a long name inside a narrow column. The pill shows one line ending in an
ellipsis. A pointer user who hovers it, or a keyboard user who focuses it, sees the full text in a tooltip; the
tooltip can be dismissed with Escape and stays while hovered (WCAG 1.4.13). A pill that is not truncated shows no
tooltip. Screen-reader users hear the full text as the control's name either way.

**Why this priority**: it depends on #16's `ocelle-tooltip` being on `main`.

**Independent Test**: render interactive pills whose full text fits and does not fit; change the container width and
the text; hover, focus and press Escape; read the tooltip state, the visible text and the accessibility tree.

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

---

### Edge Cases

- A pill with no slotted text (only an icon, or nothing): a static pill renders an empty pill without error; an
  interactive pill with no full text and no `aria-label`, `aria-labelledby` or `label` has no accessible name, and the
  README says such a pill must be named (axe reports it; the element does not invent a name).
- An interactive pill named by `aria-label` whose full text differs: the tooltip still shows the full text (the
  visible text), and the name follows 012's FR-006 precedence.
- Slotted text changes after render (a framework re-render, an htmx swap): the full text, the tooltip text and the
  truncation state follow it.
- A tone, status, variant, density or layout set to an unknown value falls back to its default silently.
- `pulse` on a `neutral` indicator: allowed; the vocabulary does not decide which tones pulse, the host does.
- An indicator with an empty or whitespace-only `label`: treated as no label (decorative).
- `interactive` together with `disabled` on a static pill without `interactive` or `href`: `disabled` has no effect
  on a static pill.
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
- **FR-002**: The status vocabulary is one shared definition used by the indicator's `tone` and the pill's `status`,
  with the same five values and token mapping as #9's notice `tone`. An absent, empty or unknown value is `neutral`.
  Nothing in this feature introduces a sixth value.
- **FR-003**: All styling uses `--ocelle-*` tokens only (constitution II); no element uses a monospace family; the
  pill radius is used only by the pill tag.
- **FR-004**: Each element has a story per variant and per state, in light and dark, with committed baselines made in
  mission 006's pinned container, and story-level axe reports no serious or critical finding on any story.
- **FR-005**: The custom-elements manifest declares every public property, attribute, slot, part and CSS custom
  property of the three elements; the interactive pill's activation is documented as the native `click`.
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
  the dot keeps its full opacity and size. Its duration comes from a motion token. Without `pulse`, no animation runs.
- **FR-013**: Under `prefers-reduced-motion: reduce` no animation runs, with or without `pulse`, and the dot is shown
  solid.
- **FR-014**: With a non-empty (after trimming) `label`, the element exposes exactly one accessibility node of role
  `img` named by the label. With no label, the element is hidden from the accessibility tree entirely, and the README
  states that a host must then place text naming the state next to it (state is never shown by colour alone).
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
  (boolean). All reflect. Unknown `variant` and `density` values fall back to their defaults.
- **FR-026**: Content: the default slot holds the pill's text; the `icon` slot follows mission 005's slot convention.
  Slotted icons are decorative and add nothing to the accessibility tree.
- **FR-027**: A static pill (neither `interactive` nor a link-mode `href`) is not focusable, has no role of its own,
  exposes its text as plain text, and wraps a full text that does not fit onto further lines; it never truncates.
  `title` and ARIA attributes on a static pill's host are left where they are.
- **FR-028**: The `pill` variant fills with `--ocelle-color-<status>-bg`, sets its text in `--ocelle-color-<status>`,
  and has `--ocelle-radius-pill` corners. The `badge` variant has no fill of its own, a border in
  `--ocelle-color-<status>` of a token width, `--ocelle-radius-pill` corners, and its text in Schibsted Grotesk with
  tabular figures. Text meets 4.5:1 and the badge border 3:1 on their grounds, in both themes, checked by the contrast
  gate. Forced colours keep a visible border on both variants.
- **FR-029**: `density="compact"` sets block padding `--ocelle-space-1`, inline padding `--ocelle-space-2` and line
  height `--ocelle-line-height-snug`; the default density keeps the spacing the plan sets from tokens.
- **FR-030**: An interactive pill (`interactive`, or a non-empty `href` that is link mode) follows mission 012's
  FR-001 to FR-006 as written: one native inner control (`<button type="button">` in button mode, `<a>` in link
  mode, FR-002 deciding the mode), `disabled` as FR-003 defines it, ARIA passthrough by moving attributes with
  `data-ocelle-moved-*` mirrors (FR-004), no ID reference across the shadow root (FR-005), and name passthrough
  (FR-006). The attributes it moves are `aria-label`, `aria-labelledby`, `aria-describedby`, `aria-controls`,
  `aria-pressed` (button mode), `aria-current` (link mode) and `title`. It reuses 012's helpers rather than
  re-implementing them.
- **FR-031**: An interactive pill reports activation by the native `click` only; it emits no `ocelle-*` event.
  `aria-pressed="true"` (moved to the inner button) gives the pressed look and exposes the custom state
  `:state(pressed)` for host styling, as `ocelle-button` does.
- **FR-032**: An interactive pill shows the token focus ring on keyboard focus, in both themes and forced colours, and
  its pointer target is at least 24 px by 24 px in either density (WCAG 2.5.8). It is not a primary action, so
  `--ocelle-target-min` does not apply.
- **FR-033**: An interactive pill shows its full text on one line; when the full text does not fit, it is truncated
  with an ellipsis at the inline end. Truncation is re-evaluated whenever the pill's inline size or its full text
  changes.
- **FR-034**: An interactive pill wraps its inner control in `ocelle-tooltip` as #16's contract shows for the pill
  (`text` set to the full text, `disabled` while not truncated, no `describes`), so the full text is shown on hover and
  keyboard focus only while truncated, with the tooltip's own WCAG 1.4.13 behaviour. The inner control keeps its own
  accessible name (FR-030); the tooltip adds nothing to the accessibility tree.

**Tokens**

- **FR-040**: `@ocelle/tokens` gains `--ocelle-line-height-snug` with the value 1.2, validated and documented like the
  other line-height tokens.
- **FR-041**: If no existing motion token suits the indicator's pulse, the plan adds one; it follows the token set's
  reduced-motion rule as it stands on `main` when the token is added.
- **FR-042**: If mission 011 has not landed when the metric is built, the four eyebrow tokens are added exactly as
  011's R-12 defines them; if it has, they are used as they are.

### Key Entities

- **Status vocabulary**: five named states with their foreground and ground tokens; shared by the indicator and the
  pill, aligned with #9's notice.
- **Pill**: full text, status, variant, density, mode (static, button, link), disabled, pressed, truncated.
- **Metric**: a label and a display value, laid out stacked or in a row.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Every one of the 36 kitty-mission-ui uses (32 pill, 2 indicator, 2 metric) can be expressed with the
  attributes and slots this feature defines, with no consumer CSS beyond layout.
- **SC-002**: 100 % of the stories of the three elements have light and dark baselines, and axe reports zero serious
  or critical findings on them.
- **SC-003**: Every status-vocabulary pairing of foreground and ground used by these elements passes the automated
  contrast check (4.5:1 for text, 3:1 for the dot and the badge border) in both themes.
- **SC-004**: With reduced motion requested, zero animations run on any indicator; with it not requested, the dot is
  fully visible in 100 % of sampled animation frames.
- **SC-005**: A keyboard-only user can reach, activate and read the full text of every interactive pill, truncated
  or not, without a pointer.
- **SC-006**: Every attribute, slot, part and CSS custom property of the three elements is in the manifest, and the
  manifest, CSP, prefix, lint and mutation gates pass for the changed source.

## Assumptions

- The status vocabulary is exactly #9's notice tone; kitty-mission-ui states such as "running" or "blocked" map onto
  it in the consumer (for example running → `info` with `pulse`). A further value needs its own consumer and a later
  feature.
- `label` on the indicator is the one way to name it; slotted content is not supported on the indicator.
- The metric's display value is a pre-formatted string from the host; the element formats nothing.
- The pill has no `unavailable` state and no `size` beyond `density`; 012's unavailable state is adopted later if a
  consumer asks.
- The pill's `title` (static) keeps the browser's native behaviour, which is the host's choice; the README points to
  the interactive pill and its tooltip for an accessible full text.
- Behaviour is measured in Chromium only, as in missions 005 and 012; WebKit is a stated limitation.
- Implementation waits for missions 012 and 008 (and op 016's affected-plants mode) to be on `main`; user stories 1
  to 3 do not need 012 or 008, but the whole mission is implemented after both land.
- The kitty-mission-ui usage inventory (the 36 uses and their modifiers) is read from #7 as triage 012 recorded it;
  if the operator supplies a fuller inventory, the spec check reads it against these requirements.
