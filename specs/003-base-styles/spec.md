# Feature Specification: Base Styles

**Feature Branch**: `003-base-styles` (work happens on `claude/006-base-styles`)

**Created**: 2026-11-09

**Status**: Draft

**Input**: User description: "Build the @ocelle/styles base stylesheet from issue #6 (triage/003-base-styles.md): an
external, CSP-safe stylesheet built only on --ocelle-* tokens with reset (applying color-scheme:
var(--ocelle-color-scheme) on the root, the 002 hand-off), the regular and compact type scales
(spec-kitty-design#531), the token focus ring, reduced motion and forced colours; classless prose for rendered
Markdown keyed on element selectors (spec-kitty-design#519: line height 1.65, h1 30 px, h2 18 px, a reading measure
token of about 68ch, tables with 12 px tabular-figure Schibsted Grotesk headers in a scroll box, no monospace per
constitution II); and one documented identifier-wrap hook with overflow-wrap: anywhere semantics
(spec-kitty-design#535); any new token goes into @ocelle/tokens under the 002 contrast and brand-rule gates; element
parts or properties for identifier wrapping stay with the element issues, stories beyond the minimal Storybook and
axe with #10, no utility classes."

**Issues**: #6 (triage record `triage/003-base-styles.md`, approved by the operator on 2026-11-09). The body of #6
and the three spec-kitty-design issues it cites (#519, #531, #535) are the sources of the requirements below. The
three issues are copied verbatim in `sources/spec-kitty-design-issues.md` as read on 2026-11-09; that copy, not the
live issues, is the reference. Their `--sk-*` names are kitty-mission-ui roles, not names of this library.

**Operator decision at the triage gate** (2026-11-09, human:jeroennouwsdev, "Tabular figures"): no monospace
anywhere. Where #6, #519 or #531 ask for a "mono" face, this feature uses Schibsted Grotesk with tabular figures
(`--ocelle-figures`); the constitution is not changed.

## Consumer need

Hosts that load `@ocelle/tokens` still style the page itself: margins, the body font, headings, focus, rendered
Markdown documents and long identifiers. Each consumer repeats that CSS with local exceptions that sunset on these
issues:

- kitty-mission-ui's Artifact Viewer styles rendered Markdown itself, with pinned literals for the 68ch measure, the
  1.65 line height and a 12ch cell floor (spec-kitty-design#519, exception E-23).
- kitty-mission-ui's Drift screen sets a 14 px / 1.5 screen scale and a muted value style in its part files
  (spec-kitty-design#531, E-37).
- The same screen puts `overflow-wrap: anywhere` on slugs in three part files (spec-kitty-design#535, E-39).
- A Thymeleaf page of the Ocelle console runs under the strict CSP and can load only an external stylesheet.

Mission 002 also handed the root `color-scheme` declaration to this feature: `--ocelle-color-scheme` exists, but no
stylesheet applies it yet. The release (#11) is blocked by this feature.

## User Scenarios & Testing *(mandatory)*

The users of this feature are the host pages that load the base styles (the Ocelle console's Thymeleaf pages, Kitty
Desktop's webview, Kitty Dashboard), the Markdown renderers of those hosts, the authors of the elements of this
library (people and agents), and the operator who reviews pull requests.

### User Story 1 - A host page gets the base layer from one external stylesheet (Priority: P1)

A host page links the tokens stylesheet and then the base stylesheet, both from `'self'`, and gets a consistent page:
a minimal reset, the body set in Schibsted Grotesk at the regular scale in ink on canvas, the theme's
`color-scheme` on the root (so form controls and scroll bars follow the theme), the token focus ring on every
keyboard-focused element, no motion under reduced motion, and a visible focus ring and borders in forced-colours
mode. It works under `default-src 'none'; script-src 'self'; style-src 'self'; font-src 'self'` with no violation.

**Why this priority**: it is the first thing every host needs, it closes the 002 `color-scheme` hand-off, and the
prose, compact and identifier families build on it.

**Independent Test**: load a test page that links both stylesheets under the strict CSP in a real browser, in each
theme condition of 002 (system light, system dark, `data-theme` overrides), with and without reduced motion and
forced colours, and read computed styles and CSP violation reports.

**Acceptance Scenarios**:

1. **Given** a page that links `tokens.css` and the base stylesheet, **When** it renders in the light theme and then
   the dark theme, **Then** the root's computed `color-scheme` is `light` and `dark` respectively, the body text is
   `--ocelle-color-ink` on `--ocelle-color-canvas`, its font family begins with Schibsted Grotesk, and its size and
   line height are the regular scale's tokens.
2. **Given** the same page, **When** a link, a button, an input and an element with `tabindex="0"` are each focused
   from the keyboard, **Then** each shows an outline of `--ocelle-focus-width` in `--ocelle-color-focus` at
   `--ocelle-focus-offset`; **and When** the same controls are clicked with a pointer, **Then** the ring follows the
   browser's `:focus-visible` rule and is not forced on.
3. **Given** reduced motion is requested, **When** the page renders, **Then** smooth scrolling is off and no
   transition or animation the base stylesheet declares runs (the motion tokens are already `0ms` from 002).
4. **Given** forced-colours mode, **When** a control is keyboard-focused, **Then** its focus outline is visible in a
   system colour, and the base stylesheet does not remove borders that mark control boundaries.
5. **Given** the strict CSP above, **When** the page loads both stylesheets and renders, **Then** the browser reports
   no CSP violation, and the base stylesheet contains no `@import` of a remote URL and no `url()` outside `'self'`.
6. **Given** the base stylesheet, **When** it is linked without `tokens.css`, **Then** the page still renders without
   errors (every token reference has a safe fallback or none is needed) and the README says the tokens stylesheet
   must come first.

---

### User Story 2 - A dense screen opts into the compact scale (Priority: P2)

A dense operational screen (Kitty Desktop's Drift screen, list and fact screens) marks its root with the documented
compact hook. Everything inside inherits the compact scale (14 px base size, line height 1.5) without restating size
or line height per part. Identifiers, timestamps, commands and fact values inside it can use the documented value
text style: small size, tabular figures, muted or body colour, Schibsted Grotesk.

**Why this priority**: it removes the E-37 exception and keeps titles, slugs and explanations at the prototype's
heights, but a host can ship without it.

**Independent Test**: render a page with a compact root and a regular root side by side and compare computed
`font-size` and `line-height` of the root, a paragraph and a nested element; render text with the value style and
check its family, `font-variant-numeric` and colour.

**Acceptance Scenarios**:

1. **Given** an element with the compact hook, **When** it renders, **Then** its computed font size is
   `--ocelle-font-size-sm` (14 px at the default root size) and its line height is the compact line-height token
   (1.5), and every descendant that does not set its own size inherits both.
2. **Given** a compact region nested inside a regular page, **When** the page renders, **Then** only the region and
   its descendants use the compact scale.
3. **Given** text with the value style, **When** it renders, **Then** its font family begins with Schibsted Grotesk,
   its `font-variant-numeric` includes tabular figures, its colour is `--ocelle-color-ink-muted` (or
   `--ocelle-color-ink` in the documented variant), and no rule of the base stylesheet sets a monospace family.
4. **Given** the compact hook is set on the root element, **When** the page renders, **Then** the whole page is
   compact and the focus ring of User Story 1 is unchanged.

---

### User Story 3 - A rendered Markdown document reads at the prototype's rhythm (Priority: P3)

A host's Markdown renderer emits plain HTML (headings, paragraphs, lists, block quotes, inline and block code,
horizontal rules, tables) with no classes into a container marked with the documented prose hook. The document reads
at the Kitty Desktop V2 prototype's rhythm: line height 1.65, `h1` 30 px, `h2` 18 px, paragraphs and lists held to a
reading measure of about 68ch, while tables and code blocks may use the full width of the container. A table with many
columns scrolls inside its own box instead of squeezing every cell; its header cells are 12 px Schibsted Grotesk with
tabular figures; each cell keeps a readable floor of about 12ch.

**Why this priority**: it removes the E-23 exception for the Artifact Viewer, but needs the base layer first.

**Independent Test**: render a fixture Markdown document (every element above, a wide many-column table, a long code
block) inside a prose container and outside it, at 1280 px and 320 px viewport widths and at 200% zoom, and read
computed styles and box sizes.

**Acceptance Scenarios**:

1. **Given** the fixture inside a prose container, **When** it renders, **Then** paragraph and list line height is
   the prose line-height token (1.65), `h1` is `--ocelle-font-size-2xl` (30 px), `h2` is the 18 px size token, and
   headings, lists, block quotes, inline code, code blocks and rules each have a style from tokens only.
2. **Given** the same container wider than the measure, **When** it renders, **Then** paragraphs and list items are no
   wider than the reading-measure token (about 68ch), and a table and a code block may be as wide as the container.
3. **Given** a table with more columns than fit, **When** it renders at 320 px, **Then** the table scrolls
   horizontally inside its own scroll box, the page does not scroll horizontally, every cell is at least the cell-floor
   token wide (about 12ch), and the scroll box is reachable and scrollable from the keyboard.
4. **Given** table header cells, **When** they render, **Then** they are `--ocelle-font-size-xs` (12 px) Schibsted
   Grotesk with tabular figures, not monospace.
5. **Given** the same fixture outside any prose container, **When** it renders, **Then** none of the prose rules
   apply: the host's own headings and tables are not restyled by the prose family.
6. **Given** a link in prose, **When** it renders, **Then** it uses `--ocelle-color-link` (brand rule: ochre text is
   never on bone), and the contrast gate covers every new colour pairing the prose family introduces.

---

### User Story 4 - Long identifiers stay readable and copyable (Priority: P4)

A host or element marks text that holds a machine identifier (a mission slug, an id, a path) with the one documented
identifier-wrap hook. The identifier breaks anywhere when it would overflow, so it never widens its grid column or
row, never overflows at 200% zoom, and is never cut by an ellipsis; selecting and copying it gives the full,
unchanged identifier.

**Why this priority**: it removes the E-39 exception, but it is the smallest family and elements expose it through
their own parts later (#7 to #17).

**Independent Test**: render a 120-character unbroken slug with the hook in a narrow grid cell, a header subtitle and
a fact value, at 320 px and 200% zoom; measure the cell widths and read the copied text.

**Acceptance Scenarios**:

1. **Given** an unbroken identifier longer than its container, **When** it has the hook, **Then** it wraps within the
   container (computed `overflow-wrap` is `anywhere`), its grid column keeps its size, and no ellipsis is shown.
2. **Given** the same identifier without the hook, **When** it renders, **Then** the base stylesheet does not change
   its wrapping (the hook is opt-in).
3. **Given** a wrapped identifier, **When** it is selected and copied, **Then** the copied text equals the identifier
   exactly (no inserted characters or hyphens).
4. **Given** the hook on text inside prose or inside a compact region, **When** it renders, **Then** it wraps the same
   way and keeps its family's other styles.

---

### Edge Cases

- **Order of stylesheets**: the base stylesheet linked before `tokens.css`. It must still work once both are loaded,
  since custom properties resolve at computed-value time; the README states the recommended order.
- **Base stylesheet without tokens**: see User Story 1 scenario 6.
- **Host CSS of higher specificity**: base rules should be easy to override, so the reset and element defaults use
  low specificity (for example `:where()`), and the hooks use one attribute each.
- **Nested hooks**: a prose container inside a compact region uses the prose rhythm for the document's text; a
  compact region inside a prose container uses the compact scale. The innermost hook wins for size and line height.
- **Root font size changed by the user**: all sizes are relative (`rem`, `ch`), so 14 px and 30 px are the values at
  the default 16 px root and scale with the user's setting.
- **Zoom to 200% and 320 px width (WCAG 1.4.10 reflow)**: prose and identifiers reflow without horizontal page scroll;
  only a table's own scroll box scrolls.
- **Forced colours inside prose**: table borders and rules stay visible as system colours.
- **Right-to-left text**: the base stylesheet uses logical properties (`margin-block`, `padding-inline`), so it works
  unchanged under `dir="rtl"`.
- **Shadow DOM**: the base stylesheet styles the light DOM of the host page; it does not reach into elements' shadow
  roots. Elements adopt their own stylesheets (constitution IV).

## Requirements *(mandatory)*

### Functional Requirements

**Package and delivery**

- **FR-001**: `@ocelle/styles` MUST ship one external stylesheet, `base.css`, exported by the package and built from
  source in the repository. It MUST contain no inline style, `@import` of a remote URL, or `url()` outside the
  package. A host loads it with a `<link>` after `@ocelle/tokens/tokens.css`.
- **FR-002**: every value in the stylesheet MUST be a `--ocelle-*` token reference. Only keywords, `0`, unitless
  numbers that are not lengths, and selectors are exempt, under the same token-only style lint that mission 002
  added (constitution II). `packages/styles/**/*.css` is already in that lint's scope.
- **FR-003**: the stylesheet MUST set no monospace family (constitution II, operator decision at triage); the Prefix
  gate MUST cover the built stylesheet.
- **FR-004**: the README of `@ocelle/styles` MUST document, as public surface (constitution VII):
  - the link order and the CSP the host needs;
  - each hook (compact, value, prose and identifier-wrap) with its exact attribute name and allowed values;
  - what each family styles and the tokens it uses.
- **FR-005**: the hooks MUST be attributes in the `data-ocelle-` namespace, one per family, not classes; the library
  ships no utility classes (#6 "Out of scope"). Their names are part of the public surface and change only under
  semver.

**Base layer (User Story 1)**

- **FR-006**: the root element MUST get `color-scheme: var(--ocelle-color-scheme)`, so the computed value follows the
  theme of 002 in every theme condition (system light, system dark, no preference, `data-theme` overrides).
- **FR-007**: the reset MUST be minimal and low-specificity: `box-sizing: border-box` for every element and
  pseudo-element; no default body margin; media elements no wider than their container; form controls inherit the
  font. It MUST NOT remove list semantics, focus outlines or form control borders.
- **FR-008**: the body MUST use `--ocelle-font-sans`, the regular scale (`--ocelle-font-size-md` and
  `--ocelle-line-height-normal`), `--ocelle-color-ink` on `--ocelle-color-canvas`.
- **FR-009**: every element that matches `:focus-visible` MUST show an outline of `--ocelle-focus-width` solid
  `--ocelle-color-focus` at `--ocelle-focus-offset`. The base stylesheet MUST NOT set `outline: none` on any
  element.
- **FR-010**: under `prefers-reduced-motion: reduce`, `scroll-behavior` MUST be `auto`, and every transition or
  animation the stylesheet declares MUST take its duration from the motion tokens, so it is `0ms` under reduced
  motion.
- **FR-011**: under `forced-colors: active`, the focus outline MUST use a system colour (`Highlight` or
  `CanvasText`), and no rule of the stylesheet may set `forced-color-adjust: none`.

**Compact scale (User Story 2)**

- **FR-012**: the compact hook on an element MUST set its font size to `--ocelle-font-size-sm` and its line height to
  a new compact line-height token of 1.5. Descendants inherit both. Only the hooked element and its descendants
  change.
- **FR-013**: the value hook MUST set the font to `--ocelle-font-sans`, the size to `--ocelle-font-size-sm` (or the
  surrounding size in compact regions), `font-variant-numeric: var(--ocelle-figures)` and the colour to
  `--ocelle-color-ink-muted`. A documented variant value of the same hook uses `--ocelle-color-ink`.

**Prose (User Story 3)**

- **FR-014**: the prose family MUST apply only inside an element with the prose hook. It MUST style these by element
  selector, with no class: `h1` to `h4`, `p`, `ul`, `ol`, `li`, `blockquote`, `code`, `pre`, `hr`, `a`, `table`,
  `thead`, `th`, `td`.
- **FR-015**: inside prose:
  - running text MUST use a new prose line-height token of 1.65;
  - `h1` MUST use `--ocelle-font-size-2xl` (30 px);
  - `h2` MUST use a new 18 px size token, `1.125rem`;
  - `h3` and `h4` use existing size tokens chosen in the plan;
  - headings use `--ocelle-font-weight-display` or `--ocelle-font-weight-strong` and `--ocelle-line-height-tight`.
- **FR-016**: paragraphs, list items and block quotes inside prose MUST be no wider than a new reading-measure token
  of `68ch`. Tables and code blocks MAY use the full width of the prose container.
- **FR-017**: a table inside prose MUST sit in a scroll box that scrolls horizontally when the table is wider than the
  container. The box needs no wrapper element from the renderer, so a renderer that emits only `<table>` works. The
  page MUST NOT scroll horizontally because of it, and the scroll box MUST be keyboard-reachable (WCAG 2.1.1).
  Each cell MUST be at least a new cell-floor token of `12ch` wide.
- **FR-018**: table header cells inside prose MUST use `--ocelle-font-size-xs` (12 px), `--ocelle-font-sans` and
  `font-variant-numeric: var(--ocelle-figures)`. Table borders and rules MUST use `--ocelle-color-rule` or
  `--ocelle-color-rule-strong` (decorative only, brand rule).
- **FR-019**: links inside prose MUST use `--ocelle-color-link` and `--ocelle-color-link-hover`. Inline and block code
  MUST use Schibsted Grotesk with tabular figures (constitution II), on a token ground.

**Identifier wrap (User Story 4)**

- **FR-020**: the identifier-wrap hook MUST set `overflow-wrap: anywhere` and MUST NOT set `text-overflow: ellipsis`,
  `hyphens: auto`, a `word-break` that changes selection, or anything that alters the copied text. It MUST work in
  any container, inside prose and compact regions included.

**New tokens**

- **FR-021**: the new tokens are added to `@ocelle/tokens` (source, generator, JSON export, typed names, CHANGELOG)
  and validated by its 002 gates:
  - the compact line height (1.5);
  - the prose line height (1.65);
  - the 18 px size (`1.125rem`);
  - the reading measure (`68ch`);
  - the cell floor (`12ch`);
  - any colour pairing the prose family introduces, as contrast pairs.

  Token names follow the 002 naming rules and are fixed in the plan. No new colour token is expected. If one is
  needed, it MUST get its required contrast pairs.

**Checks and stories**

- **FR-022**: browser tests MUST cover every acceptance scenario above in a real browser, under the strict CSP, in
  both themes, with reduced motion and forced colours emulated where the scenario needs them. They are written first
  and shown failing (constitution VIII).
- **FR-023**: the minimal Storybook of 002 MUST gain one story per family (base page, compact screen, prose document,
  identifier wrap). The stories run under the same strict CSP with no violation (constitution V). Further stories,
  visual regression and axe stay with #10.

### Key Entities

- **Base stylesheet** (`base.css` of `@ocelle/styles`): the base layer, compact scale, value style, prose family and
  identifier-wrap hook, all from tokens.
- **Hook**: a documented `data-ocelle-*` attribute that opts an element and its descendants into a family (compact,
  value, prose, identifier wrap). Public surface.
- **New token**: a token added to `@ocelle/tokens` for a value the base styles need and 002 did not provide (FR-021).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: a host page that links `tokens.css` and `base.css` under `default-src 'none'; script-src 'self';
  style-src 'self'; font-src 'self'` renders with 0 CSP violations in both themes.
- **SC-002**: every acceptance scenario of User Stories 1 to 4 has a browser test, and each test was shown failing
  before its implementation.
- **SC-003**: the token-only style lint, the Prefix gate, the Contrast gate and the Brand rules gate report 0
  findings on the merged result, and each new token appears in the JSON export and the typed names.
- **SC-004**: a rendered Markdown fixture with a 12-column table shows no horizontal page scroll at 320 px width and
  at 200% zoom, while the table scrolls inside its own box.
- **SC-005**: a 120-character unbroken identifier with the hook never widens its grid column, and its copied text is
  identical to the source text.
- **SC-006**: kitty-mission-ui could remove its local stand-ins E-23, E-37 and E-39 by using the documented hooks and
  tokens. The README maps each stand-in to its replacement.

## Assumptions

- **Hook form**: the hooks are attributes, not classes: `data-ocelle-density="compact"`, `data-ocelle-value`
  (with an `ink` variant), `data-ocelle-prose` and `data-ocelle-wrap="anywhere"`. The exact names are fixed in the
  plan and the README. Attributes keep the "no utility classes" line of #6 and need one rule each. The plan may
  propose classes instead if the squad finds a strong reason, as a fork for the operator.
- **One stylesheet**: all four families ship in one `base.css`. The families are opt-in by hook, so loading them
  costs a host nothing it does not mark. A split into several files can come later without breaking the hooks.
- **Table scroll box without a wrapper**: a renderer that emits only `<table>` cannot add a wrapper, so the scroll box
  is the table itself (`display: block; overflow-x: auto` with a nested table layout) or an equivalent the plan picks.
  The plan must show that table semantics stay intact for assistive technology. If that is impossible, the fallback
  is a documented optional wrapper, as a fork for the operator.
- **h3 and h4 sizes** are not in #519; the plan picks existing size tokens (for example `--ocelle-font-size-lg` and
  `--ocelle-font-size-md`) close to the prototype.
- **Code in prose** uses Schibsted Grotesk with tabular figures on `--ocelle-color-inset`, as constitution II requires
  for code; #519 does not ask for a monospace code face.
- **Storybook**: the stories of FR-023 use the 002 Storybook under its strict CSP and preview-only build. Anything
  beyond one story per family is #10's.
- **Elements**: elements (#7 to #17) expose identifier wrapping through their own parts or properties. This feature
  delivers only the shared hook and its semantics.
- **#20** (drop `as const` in the token source) is independent. If it lands first, the new tokens follow its form.
- **Browsers**: the same evergreen Chromium-based browsers as 002, with `overflow-wrap: anywhere`, `:focus-visible`,
  `:where()` and `forced-colors` support.
