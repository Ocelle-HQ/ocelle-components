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

**Operator decision at the spec check** (2026-11-09, human:jeroennouwsdev, SPEC-1-11, "Add all five (Recommended)"):
all five new tokens are added to `@ocelle/tokens`: the compact line height 1.5, the prose line height 1.65, the 18 px
size (`1.125rem`), the 68ch reading measure and the 12ch cell floor. None snaps to an existing token
(`line-height-normal` 1.45, `line-height-relaxed` 1.55, `font-size-fact` 17 px, `font-size-lg` 20 px).

**Operator decision at spec check 2** (2026-11-09, human:jeroennouwsdev, SPEC-2-03, "Everywhere (Recommended)"): the
base layer sets `code`, `pre`, `kbd` and `samp` page-wide, not only inside the prose hook, to Schibsted Grotesk with
tabular figures, with low specificity so hosts can override it. A page that loads `base.css` shows no
browser-default monospace (FR-026).

**Operator decisions at the spec gate** (2026-11-09, human:jeroennouwsdev):

- Gate, "Approve after a final fix (Recommended)": the spec is approved once the findings of spec check 3 are fixed;
  no further spec check follows.
- SPEC-3-01, "Natural focus (Recommended)": a prose table with no focusable content is itself a tab stop when it
  overflows. In a table with focusable content (for example a link in a cell), Tab reaches that content and the arrow
  keys scroll the box from it. The test fixtures cover both cases. No wrapper is needed, and no `tabindex` is
  expected from the renderer (FR-017, User Story 3 scenarios 3 and 12).

## Consumer need

Hosts that load `@ocelle/tokens` still style the page itself: margins, the body font, focus, rendered
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
keyboard-focused element, no motion of its own, no browser-default monospace on code, keyboard or sample text, and a
visible focus ring and borders in forced-colours mode. It
works under `default-src 'none'; script-src 'self'; style-src 'self'; font-src 'self'` with no violation.

**Why this priority**: it is the first thing every host needs, it closes the 002 `color-scheme` hand-off, and the
prose, compact and identifier families build on it.

**Independent Test**: load a test page that links both stylesheets under the strict CSP in a real browser, in each
theme condition of 002 (system light, system dark, no stated preference, `data-theme` overrides), with and without
forced colours, and read computed styles, the accessibility tree and CSP violation reports.

**Acceptance Scenarios**:

1. **Given** a page that links `tokens.css` and the base stylesheet, **When** it renders in each theme condition of
   002 (system light, system dark, no stated preference, `data-theme="light"` and `"dark"` overrides), **Then** the
   root's computed `color-scheme` is `dark` under system dark and `data-theme="dark"` and `light` in the other
   conditions, the body text is `--ocelle-color-ink` on `--ocelle-color-canvas`, its font family begins with
   Schibsted Grotesk, and its size and line height are the regular scale's tokens (FR-006, FR-008).
2. **Given** the same page, **When** a link, a button, a text input and an element with `tabindex="0"` are each
   focused from the keyboard, **Then** each shows an outline of `--ocelle-focus-width` solid in
   `--ocelle-color-focus` at `--ocelle-focus-offset`; **and When**, in the same test, each is focused by a pointer
   click, **Then** the text input shows the same ring and the link, the button and the `tabindex="0"` element show no
   ring (Chromium's `:focus-visible` heuristics, the browsers of Assumptions). The pointer half is a guard; its plant
   is named in the plan (SC-002).
3. **Given** the built base stylesheet, **When** it is read by a source-level check, **Then** it declares no property
   whose name is or starts with `transition` or `animation` (shorthands and longhands such as `transition-duration`
   and `animation-name`), no `scroll-behavior` (FR-010) and no `forced-color-adjust: none` (FR-011), so the base
   layer adds no motion with or without reduced motion. The check is proven by a planted `transition` rule, a planted
   `animation-name` longhand and a planted `forced-color-adjust: none`.
4. **Given** forced-colours mode, **When** a button and a text input are keyboard-focused, **Then** the focus outline
   is solid, `--ocelle-focus-width` wide and in a system colour; **and**, in the same test, each control keeps a
   visible border of non-zero width (FR-011, FR-007).
5. **Given** the strict CSP above, **When** the page loads both stylesheets and renders, **Then** the browser reports
   no CSP violation, and the built base stylesheet contains no `@import` and no `url()` (FR-001).
6. **Given** the base stylesheet, **When** it is linked without `tokens.css`, **Then** every element is
   `box-sizing: border-box`, the body margin is `0`, and a keyboard-focused button has an outline style other than
   `none` (the ring stays visible even though the token values are missing); **and** a documentation check finds
   the README statement that the tokens stylesheet must be linked first, and, for each hook (compact, value, prose,
   identifier wrap), its exact attribute name and allowed values as the plan fixes them, and finds a `@ocelle/styles`
   CHANGELOG entry that names `base.css` and each of the four hook attributes (FR-004).
7. **Given** a page that links the base stylesheet before `tokens.css`, **When** both have loaded, **Then** the body's
   computed font size, line height, colour and background and the root's `color-scheme` equal those of scenario 1.
8. **Given** the built base stylesheet, **When** a source-level check computes the specificity of every selector,
   **Then** every hook selector (one that contains a `data-ocelle-*` attribute) has specificity (0,1,1) or lower,
   every other selector has (0,0,1) or lower, and no selector contains a class (FR-025, FR-005). The check is proven
   by a planted selector of higher specificity and a planted class selector.
9. **Given** a page that links both stylesheets, **When** it renders `code`, `pre`, `kbd` and `samp` outside any hook
   and inside a prose container, **Then** each has a font family that begins with Schibsted Grotesk and a
   `font-variant-numeric` that includes tabular figures, and none has the browser's default monospace family
   (FR-026); **and**, in the same test, a host rule `code { font-variant-numeric: normal }` linked after the base
   stylesheet sets `normal` on a `code` outside prose (the rule is easy to override).
10. **Given** a page that links both stylesheets, **When** an `img`, `picture`, `video`, `canvas` and `svg` wider
    than their container and a `button`, `input`, `select` and `textarea` render, **Then** each media element's box
    is no wider than its container and each form control's computed font family and size equal those of its parent
    (FR-007).

---

### User Story 2 - A dense screen opts into the compact scale (Priority: P2)

A dense operational screen (Kitty Desktop's Drift screen, list and fact screens) marks its root with the documented
compact hook. Everything inside inherits the compact scale (14 px base size, line height 1.5) without restating size
or line height per part. Identifiers, timestamps, commands and fact values inside it can use the documented value
text style: small size, tabular figures, muted or body colour, Schibsted Grotesk. The compact hook on the root element
makes the whole page compact without changing the root font size, so every `rem` token keeps its value.

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
   The value style's computed font size is `--ocelle-font-size-sm` (14 px), inside and outside a compact region.
4. **Given** the compact hook is set on the root element, **When** the page renders at the default root size,
   **Then** the root's computed font size is unchanged (16 px), the body and its descendants are compact (14 px,
   line height 1.5), `--ocelle-target-min` resolves to 44 px, an `h1` inside a prose container is 30 px, and the
   focus ring of User Story 1 is unchanged.
5. **Given** a prose container inside a compact region, a compact region inside a prose container, and one element
   that carries both the prose hook and the compact hook, **When** the page renders at the default root size,
   **Then** a `p` in the prose container inside the compact region has `font-size` 16 px and `line-height` 26.4 px
   (1.65), a `p` in the compact region inside the prose container has `font-size` 14 px and `line-height` 21 px
   (1.5), and a `p` in the element with both hooks has `font-size` 16 px and `line-height` 26.4 px (the prose hook
   wins on the same element) (FR-024).

---

### User Story 3 - A rendered Markdown document reads at the prototype's rhythm (Priority: P3)

A host's Markdown renderer emits plain HTML (headings, paragraphs, lists, block quotes, inline and block code,
horizontal rules, tables) with no classes into a container marked with the documented prose hook. The document reads
at the Kitty Desktop V2 prototype's rhythm: line height 1.65, `h1` 30 px, `h2` 18 px, paragraphs and lists held to a
reading measure of about 68ch, while tables and code blocks may use the full width of the container. A table with many
columns scrolls inside its own box instead of squeezing every cell; its header cells are 12 px Schibsted Grotesk with
tabular figures; each cell keeps a readable floor of about 12ch.

**Why this priority**: it removes the E-23 exception for the Artifact Viewer, but needs the base layer first.

**Independent Test**: render a fixture Markdown document inside a prose container and, on the same page, outside it,
at 1280 px and 320 px viewport widths and at 200% zoom, in both themes, with and without forced colours and under
`dir="rtl"`, and read computed styles, box sizes, focus order and the accessibility tree. The fixture holds every
element above plus `h5`, `h6` and a nested list; three wide 12-column tables (one with plain text cells and a
`caption`, one with plain text cells and no `caption`, one with plain text cells and a link in one cell); a table
that fits; a long code block; and a paragraph with a long inline code path and a link whose text is a bare URL. It
holds no task list (FR-014).

**Acceptance Scenarios**:

1. **Given** the fixture inside a prose container, **When** it renders at the default root size, **Then** the
   container's font size is `--ocelle-font-size-md` (16 px); every element in it other than `h1` to `h6` (paragraphs,
   list items, block quotes and the paragraphs in them, code, table cells) has the prose line height (1.65, 26.4 px
   at 16 px); `h1` is `--ocelle-font-size-2xl` (30 px), `h2` is the 18 px size token, and `h1` > `h2` >= `h3` >= `h4`
   >= 16 px in computed size; each heading level from `h1` to `h4` has the weight the plan fixes for it and
   `--ocelle-line-height-tight`; `h5` and `h6` each have the computed font size, weight and line height of `h4`;
   inline `code` and `pre` have a font family that begins with Schibsted Grotesk, a `font-variant-numeric` that
   includes tabular figures and the background `--ocelle-color-inset` (FR-019); lists (the nested list included),
   block quotes and `hr` have the values the plan fixes for them (indent, rule colour and width), and the tests
   assert those values.
2. **Given** the same container wider than the measure, **When** it renders, **Then** paragraphs and list items are no
   wider than the reading-measure token (about 68ch), and a `pre` and a table whose content is wider than the measure
   are each wider than the reading-measure token: the `pre` box is as wide as the container's content box.
3. **Given** the two wide tables with plain text cells (one with a `caption`, one without) and the table that fits,
   **When** they render at 320 px, **Then** each wide table scrolls horizontally inside its own scroll box, the page
   does not scroll horizontally, and every cell is at least the cell-floor token wide (about 12ch); **and**, in the
   same test, Tab moves focus onto each wide `table` itself, which then shows the focus ring of User Story 1, and two
   ArrowRight presses increase its `scrollLeft` above 0; while a wide table has focus, the focused node in the
   accessibility tree has role `table` and an accessible name equal to the `caption` text for the table with a
   caption and no accessible name for the table without one (FR-017); **and** Tab never moves focus onto the table
   that fits (it is not a tab stop).
4. **Given** table header cells, **When** they render, **Then** they are `--ocelle-font-size-xs` (12 px) Schibsted
   Grotesk with tabular figures, not monospace.
5. **Given** the fixture inside a prose container and the same fixture outside it on one page, **When** it renders,
   **Then**, in the same test, the `p`, `h1`, `h2`, `table` and `th` inside the container have the prose values of
   scenarios 1 to 4 and the same elements outside it have none of them (the host's own headings and tables are not
   restyled). The guard half is also proven by a planted prose rule leaked to page level.
6. **Given** a link in prose, **When** it renders at rest, on hover and on keyboard focus, **Then** its colour is
   `--ocelle-color-link` at rest and `--ocelle-color-link-hover` on hover (brand rule: ochre text is never on bone),
   it is underlined (`text-decoration-line: underline`) in every state, and the contrast gate covers every new colour
   pairing the prose family introduces.
7. **Given** a prose table with a header row, **When** its accessibility tree is read, in both themes and whether or
   not it overflows, **Then** it has role `table` with its rows, column headers and cells, and each cell is
   associated with its column header.
8. **Given** a code block with a line of 200 characters and no spaces, **When** it renders at 320 px, **Then** the
   line wraps inside the block (computed `white-space` is `pre-wrap` and `overflow-wrap` is `anywhere`), the block
   does not scroll and the page does not scroll horizontally, and copying the block gives its exact text, line breaks
   and indentation included. The copy half is a guard; its plant is `white-space: normal` on `pre`.
9. **Given** the fixture inside a prose container under `dir="rtl"`, **When** it renders, **Then** the inline-start
   indent of lists and block quotes is on the right, mirroring the `dir="ltr"` rendering.
10. **Given** forced-colours mode, **When** the fixture renders inside a prose container, **Then** table cell borders
    and `hr` are visible (non-zero width, a system colour that differs from the background).
11. **Given** a prose paragraph with an inline `code` path of 120 characters and no spaces and a link whose text is a
    bare URL of 120 characters, **When** it renders at 320 px and at 200% zoom, **Then** the inline `code` and the
    link have computed `overflow-wrap: anywhere`, each wraps inside the paragraph, and the page does not scroll
    horizontally (FR-016, FR-019, WCAG 1.4.10).
12. **Given** the wide table with a link in one cell, **When** it renders at 320 px and focus moves by Tab from the
    last tab stop before the table into it, **Then** focus lands on the link (not on the `table`), the link shows
    the focus ring of User Story 1, and two ArrowRight presses with the link focused increase the table's
    `scrollLeft` above 0 while the page does not scroll horizontally (FR-017, WCAG 2.1.1; operator decision SPEC-3-01).

---

### User Story 4 - Long identifiers stay readable and copyable (Priority: P4)

A host or element marks text that holds a machine identifier (a mission slug, an id, a path) with the one documented
identifier-wrap hook. The identifier breaks anywhere when it would overflow, so it never widens its grid column or
row, never overflows at 200% zoom, and is never cut by an ellipsis; selecting and copying it gives the full,
unchanged identifier.

**Why this priority**: it removes the E-39 exception, but it is the smallest family and elements expose it through
their own parts later (#7 to #17).

**Independent Test**: render a 120-character unbroken slug with the hook in a cell of a two-column grid with `1fr`
tracks (`minmax(auto, 1fr)`), in a paragraph inside a prose container and in a `span` inside a compact region (plain
markup, no element parts), at 320 px and 200% zoom; measure the column widths, read computed styles and read the
copied text.

**Acceptance Scenarios**:

1. **Given** a 300 px grid with two `1fr` tracks (`minmax(auto, 1fr)`), one cell holding an unbroken identifier of
   120 characters and the other a short text, **When** the identifier has the hook, **Then** it wraps within its cell
   (computed `overflow-wrap` is `anywhere`), its column is as wide as the short text's column (within 1 px), and no
   ellipsis is shown; **and**, in the same test, the same grid with the identifier unhooked has an identifier
   column wider than the short text's column (the hook is what keeps the column; measured in headless Chrome:
   150 px hooked against about 852 px unhooked).
2. **Given** the same identifier without the hook next to a hooked copy on the same page, **When** it renders,
   **Then**, in the same test, the hooked copy has `overflow-wrap: anywhere` and the unhooked copy keeps the
   browser's initial `overflow-wrap` (the hook is opt-in). The guard half is also proven by a planted rule that
   applies the wrap to every element.
3. **Given** a wrapped identifier with the hook, **When** it is selected and copied, **Then**, in the same test, its
   computed `overflow-wrap` is `anywhere` and its rendered box spans more than one line, and the copied text equals
   the identifier exactly (no inserted characters or hyphens). The copy half is a guard; where no CSS plant can
   change the copied text, the plan records why (SC-002).
4. **Given** a hooked identifier in a paragraph inside a prose container and a hooked identifier in a `span` inside a
   compact region, **When** they render at the default root size, **Then** each has computed `overflow-wrap:
   anywhere`; the one in prose has the font size and line height of its paragraph (16 px, 26.4 px) and the one in
   the compact region has those of the region (14 px, 21 px). The hook sets no font property, so an id that needs
   tabular figures combines it with the value hook (FR-020).

---

### Edge Cases

- **Order of stylesheets**: the base stylesheet linked before `tokens.css` still works once both are loaded (User
  Story 1 scenario 7, FR-025); the README states the recommended order.
- **Base stylesheet without tokens**: see User Story 1 scenario 6.
- **Host CSS**: a host rule overrides a base rule of lower specificity; the bounds are in FR-025 (User Story 1
  scenario 8), for example by `:where()`.
- **Nested hooks**: the nearest hook wins for size and line height; on an element that carries both the prose and
  the compact hook, the prose hook wins (FR-024, User Story 2 scenario 5).
- **Root font size changed by the user**: all sizes are relative (`rem`, `ch`), so 14 px and 30 px are the values at
  the default 16 px root and scale with the user's setting. The compact hook never changes the root font size, even
  on the root element (FR-012), so it does not rescale `rem` tokens such as `--ocelle-target-min`.
- **Zoom to 200% and 320 px width (WCAG 1.4.10 reflow)**: prose, code blocks in prose, long inline code and URL links
  in prose, and identifiers with the hook reflow without horizontal page scroll; only a table's own scroll box
  scrolls (User Story 3 scenarios 3, 8 and 11, SC-004). A `pre` outside prose keeps the host's wrapping (FR-026) and
  is not covered.
- **Code outside prose**: `code`, `pre`, `kbd` and `samp` anywhere on the page use Schibsted Grotesk with tabular
  figures, not the browser's monospace; a host overrides this with an element rule (FR-026, User Story 1
  scenario 9).
- **Forced colours inside prose**: table borders and rules stay visible as system colours (User Story 3 scenario 10).
- **Right-to-left text**: the base stylesheet uses logical properties, so it mirrors under `dir="rtl"` (User Story 3
  scenario 9, FR-025).
- **Shadow DOM**: the base stylesheet styles the light DOM of the host page; it does not reach into elements' shadow
  roots. Elements adopt their own stylesheets (constitution IV).

## Requirements *(mandatory)*

### Functional Requirements

**Package and delivery**

- **FR-001**: `@ocelle/styles` MUST ship one external stylesheet, `base.css`, exported by the package and built from
  source in the repository. It MUST contain no `@import` and no `url()`. A host loads it with a `<link>` after
  `@ocelle/tokens/tokens.css`. The stories and test fixtures of this feature use no inline style (constitution IV).
- **FR-002**: every value in the stylesheet MUST be a `--ocelle-*` token reference. Only keywords, `0`, unitless
  numbers that are not lengths and not line heights, percentages, `fr` values and selectors are exempt (percentages
  and `fr` as the 002 lint already allows, for example `max-width: 100%` on media in FR-007), under the same
  token-only style lint that mission 002 added (constitution II). `packages/styles/**/*.css` is already in that
  lint's scope. Every `line-height` in `packages/styles` MUST be a token reference: the token-only lint is tightened
  for `packages/styles/**/*.css` to reject a literal line height (unitless numbers stay allowed elsewhere), and a
  planted literal `line-height: 1.65` in that scope makes the lint fail.
- **FR-003**: the stylesheet MUST set no monospace family (constitution II, operator decision at triage); the Prefix
  gate MUST cover the built stylesheet. It also overrides the browser's default monospace on code elements page-wide
  (FR-026).
- **FR-004**: the README of `@ocelle/styles` MUST document, as public surface (constitution VII):
  - the link order and the CSP the host needs;
  - each hook (compact, value, prose and identifier-wrap) with its exact attribute name and allowed values (fixed in
    the plan, including whether a value such as `data-ocelle-density="regular"` returns a nested region to the
    regular scale);
  - what each family styles and the tokens it uses;
  - that the prose hook wins over the compact hook on an element that carries both (FR-024).

  The `@ocelle/styles` CHANGELOG MUST get an entry that names the `base.css` export and each of the four hooks by
  its attribute name (constitution VII), checked by the documentation check of User Story 1 scenario 6.
- **FR-005**: the hooks MUST be attributes in the `data-ocelle-` namespace, one attribute per hook (compact, value,
  prose, identifier wrap; the families they belong to are defined under Key Entities), not classes; the library
  ships no utility classes (#6 "Out of scope"). Their names are part of the public surface and change only under
  semver. Classes instead of attributes need the operator's approval at a plan fork.

**Base layer (User Story 1)**

- **FR-006**: the root element MUST get `color-scheme: var(--ocelle-color-scheme)`, so the computed value follows the
  theme of 002 in every theme condition (system light, system dark, no preference, `data-theme` overrides).
- **FR-007**: the reset MUST be minimal and low-specificity: `box-sizing: border-box` for every element and
  pseudo-element; no default body margin; media elements (`img`, `picture`, `video`, `canvas`, `svg`) no wider than
  their container; form controls (`button`, `input`, `select`, `textarea`) inherit the font (User Story 1
  scenario 10). It MUST NOT remove list semantics, focus outlines or form control borders. Each of these guards is tested
  together with a positive reset assertion in the same test (lists keep role `list` in the accessibility tree next
  to the `box-sizing` assertion; borders in User Story 1 scenario 4) and is proven by a planted rule that removes it.
- **FR-008**: the body MUST use `--ocelle-font-sans` and `--ocelle-color-ink` on `--ocelle-color-canvas`, and the
  regular scale (`--ocelle-font-size-md` and `--ocelle-line-height-normal`) unless the body or an ancestor carries
  the compact hook, in which case FR-012 applies.
- **FR-009**: every element that matches `:focus-visible` MUST show an outline of `--ocelle-focus-width` solid
  `--ocelle-color-focus` at `--ocelle-focus-offset`. The base stylesheet MUST NOT set `outline: none` on any
  element. Without `tokens.css` the outline style MUST still be other than `none` (User Story 1 scenario 6).
- **FR-010**: the base stylesheet MUST NOT declare any property whose name is or starts with `transition` or
  `animation` (shorthands and longhands), nor `scroll-behavior`: the base layer adds no motion, so it is motionless
  with and without `prefers-reduced-motion` (constitution III). Motion stays with the elements, which use the motion
  tokens. A source-level check over the built stylesheet enforces this and is proven by a planted `transition` rule
  and a planted longhand (User Story 1 scenario 3).
- **FR-011**: under `forced-colors: active`, the focus outline MUST use a system colour (`Highlight` or
  `CanvasText`), and no rule of the stylesheet may set `forced-color-adjust: none` (source-level check of User Story
  1 scenario 3).
- **FR-026**: the base layer MUST set `code`, `pre`, `kbd` and `samp` everywhere on the page, not only inside the
  prose hook, to `--ocelle-font-sans` with `font-variant-numeric: var(--ocelle-figures)`, so a page that loads
  `base.css` shows no browser-default monospace (constitution II, operator decision at spec check 2). These rules are
  element defaults under the specificity bound of FR-025, so a host element rule linked later overrides them. They
  set only the family and figures: grounds, padding and wrapping of code stay with the prose family (FR-016,
  FR-019). User Story 1 scenario 9.

**Compact scale (User Story 2)**

- **FR-012**: the compact hook on an element other than the root MUST set its font size to `--ocelle-font-size-sm`
  and its line height to a new compact line-height token of 1.5. Descendants inherit both. Only the hooked element
  and its descendants change. On the root element the hook MUST NOT change the root font size: the body and its
  descendants get the compact size and line height instead, so every `rem` token (for example
  `--ocelle-target-min`, 44 px) keeps its value and the user's root font size setting is respected (User Story 2
  scenario 4).
- **FR-013**: the value hook MUST set the font to `--ocelle-font-sans`, the size to `--ocelle-font-size-sm`,
  `font-variant-numeric: var(--ocelle-figures)` and the colour to `--ocelle-color-ink-muted`. A documented variant
  value of the same hook uses `--ocelle-color-ink`.
- **FR-024**: when the compact and prose hooks are nested, the nearest hooked ancestor decides the size and line
  height of the text inside it. A prose container inside a compact region sets its size to `--ocelle-font-size-md`
  and the prose line height (FR-015), so its paragraphs are 16 px / 26.4 px at the default root size. A compact
  region inside a prose container gets the compact scale, and the prose family MUST NOT override it on the
  region's descendants, so its paragraphs are 14 px / 21 px (User Story 2 scenario 5). The nearest hook decides the
  size and line height of every element that does not set its own size, table cells and code included; prose
  heading sizes still apply. All other prose styles (the reading measure of FR-016, tables, code grounds, links)
  still apply inside a nested compact region. On an element that carries both the prose hook and the compact hook,
  the prose hook decides: the element is a prose container with the size and line height of FR-015, so its
  paragraphs are 16 px / 26.4 px (User Story 2 scenario 5), and the README states this (FR-004).

**Prose (User Story 3)**

- **FR-014**: the prose family MUST apply only inside an element with the prose hook. It MUST style these by element
  selector, with no class: `h1` to `h6`, `p`, `ul`, `ol`, `li`, `blockquote`, `code`, `pre`, `hr`, `a`, `table`,
  `thead`, `th`, `td`. Nested lists get the same list rules. The prose family sets no rule of its own for `img`,
  `strong`, `em`, `del` or the checkbox of a Markdown task list: they inherit the prose size and line height and keep
  the base layer's rules (media and form controls, FR-007). The fixture of User Story 3 holds no task list.
- **FR-015**: inside prose:
  - the prose container MUST set its font size to `--ocelle-font-size-md` (16 px, as #519's 26.4 px line height
    implies);
  - every element in prose other than `h1` to `h6` (paragraphs, list items, block quotes and their paragraphs, code,
    code blocks, table cells) MUST have a new prose line-height token of 1.65, except inside a nested compact region
    (FR-024);
  - `h1` MUST use `--ocelle-font-size-2xl` (30 px);
  - `h2` MUST use a new 18 px size token, `1.125rem`;
  - `h3` and `h4` use existing size tokens chosen in the plan;
  - `h5` and `h6` get the `h4` rule (the same size, weight and line height as `h4`);
  - in computed size, `h1` > `h2` >= `h3` >= `h4` = `h5` = `h6` >= the prose text size;
  - headings use `--ocelle-line-height-tight` and `--ocelle-font-weight-display` or `--ocelle-font-weight-strong`;
    the plan fixes the weight per heading level and the tests assert it per level.
- **FR-016**: paragraphs, list items and block quotes inside prose MUST be no wider than a new reading-measure token
  of `68ch`. Tables and code blocks MUST NOT be held to the measure: a `pre` is as wide as the prose container's
  content box, and a table whose content is wider than the measure is wider than it (User Story 3 scenario 2). A
  code block (`pre`) MUST wrap its long lines inside its own width (`white-space: pre-wrap` and
  `overflow-wrap: anywhere`); it does not scroll, and its copied text is unchanged (User Story 3 scenario 8). Inline
  `code` and links inside prose MUST have `overflow-wrap: anywhere`, so a long unbroken path, slug or URL wraps
  inside its line box and never scrolls the page (WCAG 1.4.10, User Story 3 scenario 11).
- **FR-017**: a table inside prose MUST sit in a scroll box that scrolls horizontally when the table is wider than the
  container. The box needs no wrapper element from the renderer, so a renderer that emits only `<table>` works. The
  page MUST NOT scroll horizontally because of it. Keyboard access follows the browser's natural focus (operator
  decision SPEC-3-01), with no wrapper and no `tabindex` from the renderer:
  - an overflowing table with no focusable content MUST itself be a tab stop that scrolls with the arrow keys
    (WCAG 2.1.1) and shows the focus ring of FR-009 (User Story 3 scenario 3);
  - in an overflowing table with focusable content (for example a link in a cell), Tab MUST reach that content, and
    the arrow keys MUST scroll the box while that content has focus; the table itself is then not required to be a
    tab stop (User Story 3 scenario 12);
  - a table that fits is not a tab stop.

  Each cell MUST be at least a new cell-floor token of `12ch` wide. The table MUST keep its semantics for assistive
  technology: in the accessibility tree it has role `table` with its rows, column headers and cells, and each cell
  is associated with its column header, in both themes and whether or not it overflows (constitution III, User
  Story 3 scenario 7). If no mechanism without a wrapper keeps these semantics, the plan raises the optional wrapper
  as a fork for the operator. When an overflowing table with no focusable content has keyboard focus, the focused
  node exposes role `table` and the accessible name of the table's `caption` if it has one, else no name (User Story
  3 scenario 3); a mechanism that exposes anything else is part of the same fork.
- **FR-018**: table header cells inside prose MUST use `--ocelle-font-size-xs` (12 px), `--ocelle-font-sans` and
  `font-variant-numeric: var(--ocelle-figures)`. Table borders and rules MUST use `--ocelle-color-rule` or
  `--ocelle-color-rule-strong` (decorative only, brand rule).
- **FR-019**: links inside prose MUST use `--ocelle-color-link` at rest and `--ocelle-color-link-hover` on hover, and
  MUST be underlined (`text-decoration-line: underline`) in every state, so a link never differs from the running
  text by colour alone (WCAG 2.2 1.4.1). Inline and block code MUST use Schibsted Grotesk with tabular figures
  (constitution II, FR-026) on `--ocelle-color-inset` (User Story 3 scenario 1).

**Identifier wrap (User Story 4)**

- **FR-020**: the identifier-wrap hook MUST set `overflow-wrap: anywhere` and MUST NOT set `word-break`,
  `hyphens: auto`, `text-overflow: ellipsis` or `white-space: nowrap`; the copy test of User Story 4 scenario 3 is
  the behavioural check that the copied text is unchanged. It MUST work in any container, inside prose and compact
  regions included. It sets no font property: an identifier that needs tabular figures (constitution II) combines it
  with the value hook.

**Robustness**

- **FR-025**: the base stylesheet MUST:
  - give the same computed values whether it is linked before or after `tokens.css`, once both have loaded (User
    Story 1 scenario 7);
  - keep every selector within a specificity bound, so host CSS overrides it easily (User Story 1 scenario 8). The
    bound is decided by syntax: a selector that contains a `data-ocelle-*` attribute is a hook selector and has
    (0,1,1) or lower; every other selector (reset, element defaults, the root rule, `:focus-visible`, rules under
    `forced-colors`) has (0,0,1) or lower. Pseudo-classes such as `:root`, `:focus-visible`, `:hover` and `:not()`
    count toward the bound unless they are inside `:where()`;
  - use logical properties for inline-direction margins, paddings and borders, so the prose family mirrors under
    `dir="rtl"` (User Story 3 scenario 9);
  - keep table borders and `hr` visible in forced-colours mode (User Story 3 scenario 10).

**New tokens**

- **FR-021**: the new tokens are added to `@ocelle/tokens` (source, generator, JSON export, typed names, CHANGELOG)
  and validated by its 002 gates; none of the five values snaps to an existing token (operator decision at the spec
  check, SPEC-1-11):
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
  both themes, with forced colours emulated where the scenario needs it. User Story 1 scenarios 3 and 8 are
  source-level checks over the built stylesheet (they cover FR-005, FR-010, FR-011 and the specificity bound of
  FR-025), and the README statements of User Story 1 scenario 6 (FR-004) and SC-006 are documentation checks. All
  are written first and shown failing (constitution VIII) as SC-002 states.
- **FR-023**: the minimal Storybook of 002 MUST gain one story per family (base page, compact screen, prose document,
  identifier wrap); the compact screen story shows both the compact hook and the value hook. The stories run under
  the same strict CSP with no violation (constitution V). Further stories, visual regression and axe stay with #10.

### Key Entities

- **Base stylesheet** (`base.css` of `@ocelle/styles`): the base layer, compact scale, value style, prose family and
  identifier-wrap hook, all from tokens.
- **Family**: a group of rules of the base stylesheet. There are four: the base layer (no hook, applies to every
  page), the compact scale (the compact hook and the value hook), prose (the prose hook) and identifier wrap (the
  identifier-wrap hook).
- **Hook**: a documented `data-ocelle-*` attribute that opts an element and its descendants into rules of its
  family. There are four hooks: compact, value, prose and identifier wrap. Public surface.
- **New token**: a token added to `@ocelle/tokens` for a value the base styles need and 002 did not provide (FR-021).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: a host page that links `tokens.css` and `base.css` under `default-src 'none'; script-src 'self';
  style-src 'self'; font-src 'self'` renders with 0 CSP violations in both themes.
- **SC-002**: every acceptance scenario of User Stories 1 to 4 has a test (FR-022), and each test was shown failing
  before its implementation. A guard assertion (a "does not" that already held before this feature) never stands
  alone: it shares its test with the positive assertion it guards, so the test fails at red, and it is also shown
  able to fail by its named planted defect: a rule that removes control borders or list semantics (FR-007,
  User Story 1 scenario 4), a planted `transition`, `animation-name` longhand and `forced-color-adjust: none` (User
  Story 1 scenario 3), a selector of too high specificity and a class selector (scenario 8), a prose rule leaked to
  page level (User Story 3 scenario 5), `white-space: normal` on `pre` (the copy half of User Story 3 scenario 8), a
  wrap rule on every element (User Story 4 scenario 2), and a literal line height (FR-002). Every other guard
  assertion (among them the pointer half of User Story 1 scenario 2, the root size, `--ocelle-target-min` and focus
  ring of User Story 2 scenario 4, the table that fits in User Story 3 scenario 3, the absent ellipsis of User Story
  4 scenario 1, the copy half of User Story 4 scenario 3 and the MUST NOT list of FR-020) gets a plant named in the
  plan; where no CSS plant can make a guard fail, the plan records why.
- **SC-003**: the token-only style lint, the Prefix gate, the Contrast gate and the Brand rules gate report 0
  findings on the merged result, and each new token appears in the JSON export and the typed names.
- **SC-004**: a rendered Markdown fixture with a 12-column table, a 120-character inline code path and a
  120-character bare URL link shows no horizontal page scroll at 320 px width and at 200% zoom, while the table
  scrolls inside its own box.
- **SC-005**: in a grid of two `1fr` tracks (`minmax(auto, 1fr)`), a 120-character unbroken identifier with the hook
  leaves its column as wide as the sibling column with a short text (within 1 px), while the same identifier
  without the hook widens its column; its copied text is identical to the source text.
- **SC-006**: the README maps each of kitty-mission-ui's local stand-ins E-23, E-37 and E-39 to the documented hooks
  and tokens that replace it, checked by a documentation test.

## Assumptions

- **Hook form**: the hooks are attributes, not classes: `data-ocelle-density="compact"`, `data-ocelle-value`
  (with an `ink` variant), `data-ocelle-prose` and `data-ocelle-wrap="anywhere"`. The exact names are fixed in the
  plan and the README. Attributes keep the "no utility classes" line of #6 and need one rule each. FR-005 requires
  attributes unless the operator approves classes at a plan fork the squad raises for a strong reason.
- **One stylesheet**: all four families ship in one `base.css`. The families are opt-in by hook, so loading them
  costs a host nothing it does not mark. A split into several files can come later without breaking the hooks.
- **Table scroll box without a wrapper**: a renderer that emits only `<table>` cannot add a wrapper, so the scroll box
  is the table itself (for example `display: block; overflow-x: auto` with a nested table layout) or an equivalent the
  plan picks, subject to the semantics requirement of FR-017. In the browsers below, an overflowing scroll box with
  no focusable descendant is keyboard-focusable without a `tabindex`; one with a focusable descendant is not, and Tab
  lands on the descendant, from which the arrow keys scroll the box. Spec check 3 measured both in Chrome for
  Testing 153 at 320 px (a 12-column table with `display: block; overflow-x: auto`, `scrollLeft` 80 after two
  ArrowRight presses in each case). FR-017 asks for exactly this behaviour (operator decision SPEC-3-01).
- **h3 and h4 sizes** are not in #519; the plan picks existing size tokens at or below 18 px (for example
  `--ocelle-font-size-fact`, 17 px, and `--ocelle-font-size-md`, 16 px) close to the prototype.
- **Link contrast against text**: `--ocelle-color-link` against `--ocelle-color-ink` is below 3:1 in both themes
  (about 2.9:1 light, 1.8:1 dark), so FR-019 uses an underline as the non-colour cue rather than a link-to-text
  contrast pair.
- **Comments of #6**: issue #6 has no comments: the GitHub API returned an empty list on 2026-11-09. Its labels and
  timeline were not read. The plan session has nothing left to confirm about comments.
- **Code in prose** uses Schibsted Grotesk with tabular figures on `--ocelle-color-inset`, as constitution II requires
  for code; #519 does not ask for a monospace code face. The family and figures come from the page-wide base rule
  of FR-026; the prose family adds the ground.
- **Storybook**: the stories of FR-023 use the 002 Storybook under its strict CSP and preview-only build. Anything
  beyond one story per family is #10's.
- **Elements**: elements (#7 to #17) expose identifier wrapping through their own parts or properties. This feature
  delivers only the shared hook and its semantics.
- **#20** (drop `as const` in the token source) is independent. If it lands first, the new tokens follow its form.
- **Browsers**: the same evergreen Chromium-based browsers as 002, with `overflow-wrap: anywhere`, `:focus-visible`,
  `:where()` and `forced-colors` support.
