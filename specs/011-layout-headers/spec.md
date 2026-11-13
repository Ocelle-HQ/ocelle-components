# Feature Specification: Layout and Headers

**Feature Branch**: `011-layout-headers` (work happens on `claude/008-layout-headers`)

**Created**: 2026-11-12

**Status**: Draft

**Input**: User description: "Build the layout and header elements of issue #8 (triage/011-layout-headers.md) in
@ocelle/elements, following the element conventions of mission 005: ocelle-card (inset, slotted content, a compact
density with a 1 px border, md radius, smaller padding and a tighter section header, spec-kitty-design#516),
ocelle-section-header (with an eyebrow-only mode on eyebrow tokens, #497), ocelle-context-sidebar (label names the
landmark; dividers between sections and a footer area, no padding or gap for empty parts, #497), ocelle-page-header
(a compact size with a 24 px display title and a 12 px uppercase tracked subtle eyebrow in Schibsted Grotesk, since
constitution II forbids monospace, #529; the consumer's heading level kept, no fixed h1), and ocelle-personal-rail
(label names the landmark; no hard-coded 720 px flip: the consumer sets the tier through an orientation property or
a consumer-set threshold with an exclusive bound, #492, an interface #12's personal drawer can drive later); add the
eyebrow tokens to @ocelle/tokens if none fit; each element with stories per variant and state in light and dark,
interaction, keyboard and accessibility-tree tests, manifest entries, the strict-CSP check, and a 320 px reflow test
with no horizontal scroll; baselines and axe through #10's gates when they are on main; the app shell, its tiers and
the personal drawer itself stay with #12 and #16."

**Issues**: #8 (triage record `triage/011-layout-headers.md`, approved by the operator on 2026-11-12). The body of
#8, the "Done when" checklist of #7 it inherits, and the spec-kitty-design issues it cites (#450, #492, #497, #516,
#529) are the sources of the requirements below; what was read, and from where, is in `sources/README.md`. Their
`--sk-*` and `sk-*` names are kitty-mission-ui roles, not names of this library.

**Operator decisions while specifying** (2026-11-12, human:jeroennouwsdev):

- Card `inset`, "Well ground (Recommended)": an inset card is drawn sunken on `--ocelle-color-inset`, for a card
  nested inside another surface; its padding and density are unchanged (FR-004).
- Context sidebar landmark, "navigation (Recommended)": the sidebar is one navigation landmark named by `label`; its
  head and footer sit inside it (FR-020).
- Upstream values against the token set, "Existing tokens (Recommended)": the compact card takes
  `--ocelle-radius-row` (6 px), not spec-kitty-design#516's 12 px "md" radius, because constitution II fixes the card
  radius; the compact page-header title takes `--ocelle-tracking-display` and `--ocelle-line-height-tight`, not
  #529's `-0.01em` and `1.2`. The only new tokens are the eyebrow tokens (FR-030). Each deviation is listed in
  "Deviations from the upstream issues" below.

**Operator decisions at the spec gate** (2026-11-12 and 2026-11-13, human:jeroennouwsdev):

- Upper-case accessible name (spec check 1, SPEC-1-05), "Accept upper-case": the eyebrow-styled heading's accessible
  name may be upper case as Chromium exposes it; its DOM text stays as the page wrote it; tests compare the name with
  the written text ignoring case (see "Upper-case text in the accessibility tree", FR-013, FR-031, US1-5).
- Host `aria-label` on the landmarks (spec check 1, SPEC-1-09), "Keep FR-028": a host `aria-label` on
  `ocelle-context-sidebar` and `ocelle-personal-rail` names their navigation landmark (FR-028).
- Precedence of host `aria-label` and `label` (spec check 2, SPEC-2-02), "Follow convention": the library's Host ARIA
  rule (`packages/elements/README.md`) applies. A present host `aria-label` decides the landmark's name alone, and a
  blank one leaves the landmark unnamed even with a `label`; `label` names it only when the host has no `aria-label`
  (FR-028, US3-12, US4-11).
- Context-sidebar spacing (spec check 2, SPEC-2-03), confirmed at the gate after spec check 3: each part (the head,
  each section and the footer) has its own `--ocelle-space-4` padding, there is no gap between parts, each divider
  lies between two padded parts across the sidebar's whole inline size, and text loose in the default slot gets
  inline padding only (FR-021, FR-022, US3-3, US3-11, US3-13).
- Spec gate after spec check 3 (2026-11-13), "Approve after a final fix": the spec is approved once the findings of
  spec check 3 (`reviews/spec/check-3.md`) are fixed, as `reviews/spec/check-3-fixes.md` records. No further spec
  check follows; the plan squad reads the spec next. Check 3 had no operator questions.

**Constitution decision recorded by triage**: #8 and spec-kitty-design#529 ask for a "12 px mono uppercase" eyebrow.
Constitution II says "No monospace anywhere", so the eyebrow is set in Schibsted Grotesk, uppercase and tracked
(FR-030, FR-031).

**Upper-case text in the accessibility tree** (probe for spec check 1, 2026-11-12, Google Chrome for Testing
153.0.8010.12, headless, CDP `Accessibility.getFullAXTree`, ignored nodes filtered out): an `<h3 slot="heading">Recent
runs</h3>` slotted into a shadow root whose adopted stylesheet sets `::slotted([slot=heading]) { text-transform:
uppercase }` is exposed as a heading named "RECENT RUNS", and its static text and inline text boxes are "RECENT RUNS"
too; a light-DOM `h3` upper-cased by an inline style gives the same. Chromium therefore names a CSS upper-cased heading
by its drawn, upper-cased text. This feature accepts that (operator decision "Accept upper-case", above): the eyebrow is drawn upper-cased, its accessible name in
Chromium is the drawn text, and its DOM text stays as the page wrote it (FR-031, US1-5). The name and the visible text
then agree; no other technique, which would change the page's own DOM or the eyebrow's look, is used. Tests compare the
name with the written text ignoring case, so they hold in an engine that exposes the written text instead.

**Design stage**: the visual and axe gates come from #10 (`specs/006-storybook-workbench`, final on branch
`claude/010-storybook-workbench`, not yet on `main`). The operator has decided that this feature is implemented only
after #10 is merged, so its stories are captured and audited by those gates (FR-037, FR-038). The plan states the
#10 design it was written against and is rechecked when #10 lands.

## Consumer need

- kitty-mission-ui uses the Spec Kitty card 4 times, the section header 9 times, the context sidebar 3 times, the
  page header 8 times and the personal rail twice (#8). Each of the five falls short in Kitty Desktop today:
  - **Card** (spec-kitty-design#516): the only density is a roomy panel (2 px border, 16 px radius, 32 px padding,
    20 px title); dense detail screens need a compact density (1 px border, smaller padding, an 18 px title, a 16 px
    title-to-body gap). No Kitty Desktop workaround for the card is recorded, so SC-006 does not count one.
  - **Section header and context sidebar** (#497): the sidebar applies padding and gaps to empty parts and has no
    dividers or footer, while the prototype separates head, navigation and footer with rules and pins a footer (a
    progress summary) to the bottom; the section header keeps gaps for empty areas and has no flat, eyebrow-only mode
    (an uppercase label used as a section heading above a list); eyebrow letter spacing has no token.
  - **Page header** (#529): the header draws a 32 px title and a plain eyebrow; the prototype uses a 24 px display
    title and a 12 px uppercase, tracked, subtle eyebrow, a band with a 1 px rule under it, and no gap between title
    and subtitle.
  - **Personal rail** (#492): the rail flips to a horizontal strip at an inclusive `max-width: 720px` viewport query,
    so at exactly 720 px it flips while the consumer's tier is still collapsed, and a consumer cannot keep it vertical
    in a narrow column or make it horizontal inside a drawer. The consumer asks for an orientation it sets itself.
- `ocelle-app-shell` (#12) places the context sidebar and the personal rail, and its personal drawer (#450, on #16's
  `ocelle-drawer`) must be able to hold or replace the rail. The shell's layouts, tiers, thresholds and the drawer
  are #12's; this feature gives the rail and sidebar an interface the shell can drive without changing them
  (FR-026).
- Expected outcomes in other repositories and later missions, which this feature makes possible but cannot show
  itself: kitty-mission-ui deletes its part-level padding and gap overrides, its token-painted dividers, its pinned
  page-header font rules and its personal-rail `::part` overrides when it moves to these elements; #12 builds the
  shell from them. What this feature checks for them is SC-006.

## User Scenarios & Testing *(mandatory)*

The users of this feature are host pages that lay out screens with these elements (Kitty Desktop's webview, Kitty
Dashboard, the Ocelle console's server-rendered pages under the strict CSP, which load the browser build), the
authors of #12's app shell, assistive technology users of those hosts, and the operator who reviews pull requests.

**Engines.** Behaviour is measured in Chromium, the only engine available to this repository's test runs, as in
mission 005. WebKit is not measured; the README already names that as an open limitation.

**Fixtures.** Every browser scenario below runs on the strict-CSP fixture pages of mission 005 (the built
`tokens.css`, the browser build of `@ocelle/elements` loaded by one same-origin module script, served under
`default-src 'none'; script-src 'self'; style-src 'self'; font-src 'self'`), with `base.css` linked unless a scenario
says otherwise, and in process on the element source, as the README's "Files and tests" convention says. The CSP and
request checks run on the same page as the measurements. Unless a scenario says otherwise, the page is in light theme
with a viewport of 1280 × 800 px; "in both themes" means the scenario runs with `data-theme="light"` and with
`data-theme="dark"` on `<html>`.

**Slotted headings.** The section header and the page header never create a heading. The host page slots its own
heading element (`<h1>` to `<h6>`) into the `heading` slot, so the heading's level is the one the page chose and the
page's outline, styles and links to it keep working. The elements style the slotted heading's font, colour and
margins; a rule of the host page's own stylesheet that targets the heading still wins over those styles (Shadow DOM's
cascade order), and the README says so.

**Empty slot.** A slot is empty when no element is assigned to it and every text node assigned to it is empty or
whitespace only. An assigned element is content even when it is `hidden` or has no box; the README says to remove
such an element from the slot rather than hide it. Emptiness follows the slot's content as it changes: adding or
removing content updates the layout without the host page doing anything else.

**Reading the accessibility tree.** As in mission 005, every accessibility-tree outcome is read from Chromium's full
accessibility tree with ignored nodes filtered out, and every element whose tree is read carries an `id`.

**Reflow.** "Reflows at 320 px" means: at a viewport of 320 × 800 px, with the stated content, the document's
scrolling width is at most 320 px (no horizontal scroll), no text is clipped (every slotted text node's box lies
inside its element's box), and the stated parts stack in the stated order.

**"Does not" outcomes are paired.** An outcome that says something does not happen (no gap, no divider, no
landmark, no heading, no request, no horizontal scroll) already holds when no element is defined, so a test of it
alone passes at red (constitution VIII). Each one is tested together with a positive outcome on the same page in the
same test (for example, an empty slot's missing gap beside a filled slot's gap), and the plan names, for each, a
planted defect that makes it fail.

### User Story 1 - Section header, card and the eyebrow tokens (Priority: P1)

A Kitty Desktop detail screen groups its content into cards, each with a section header: a heading the page chose,
an optional eyebrow above it, optional supporting text under it and optional actions at its inline end. Dense
screens use the compact card, whose padding is smaller and whose section header is tighter. Lists are introduced by
an eyebrow-only section header: the heading drawn as a small uppercase tracked label. The eyebrow tokens are added so
every eyebrow in the library has one look.

**Why this priority**: the section header is the most used of the five (9 uses), the card holds it, and the eyebrow
tokens are needed by the page header and by #7. Card and section header together are a usable screen section.

**Independent Test**: on a fixture page, place `ocelle-card` with an `ocelle-section-header` in its `header` slot, in
each density and with and without `inset`, and an eyebrow-only section header above a list; measure the boxes,
gaps, fonts and colours, and read the accessibility tree.

**Acceptance Scenarios**:

1. **Given** `<ocelle-section-header><h2 slot="heading">Runs</h2></ocelle-section-header>`, **When** the
   accessibility tree is read, **Then** it holds exactly one heading node, level 2, named "Runs", the slotted `h2`
   itself, and the element adds no heading, landmark or group node of its own; the same with an `h4` gives level 4.
   After upgrade the section header carries no `size` or `variant` attribute that the page did not write (FR-006).
2. **Given** a section header with a heading, an eyebrow (`<span slot="eyebrow">Mission</span>`), a description
   and two buttons in `actions`, **When** it is laid out at 1280 px in left-to-right and in right-to-left, **Then** the
   eyebrow is above the heading, the description under it, the actions at the inline end on the heading's first line,
   and the eyebrow is drawn with the eyebrow tokens (FR-031) in both themes.
3. **Given** two section headers on one page, one with only a heading and one with heading, eyebrow, description and
   actions, **When** both are laid out, **Then** the first one's block size equals its heading's block size (no
   padding, gap or margin for its empty eyebrow, description and actions), while the second has the gaps of FR-011
   between its parts.
4. **Given** a section header whose empty `actions` slot is then filled by script, and a second one whose filled
   `eyebrow` slot is then emptied, **When** each is measured before and after, **Then** the first gains the actions
   gap and the second loses the eyebrow gap, and the border boxes of every other element on the page (the other
   section header, its slotted children and the page's own elements) are the same before and after.
5. **Given** `<ocelle-section-header variant="eyebrow"><h3 slot="heading">Recent</h3></ocelle-section-header>` above a
   list, **When** it is laid out and the tree is read, **Then** the heading text is drawn with the eyebrow tokens
   (uppercase, tracked, 12 px, `--ocelle-color-eyebrow`) in both themes, the tree still holds one level-3 heading
   whose name equals "Recent" ignoring case (Chromium exposes the drawn "RECENT"; see "Upper-case text in the
   accessibility tree" above), the slotted `h3`'s text content is still "Recent", and an `eyebrow` or `description`
   slotted into it is not rendered. Three such eyebrow-variant headers with two actions each, one with no `size`
   outside a card, one with `size="compact"` and one with no `size` in a compact card's `header` slot, are drawn
   with the same heading style, the same gap to their actions and the same block size (FR-013).
6. **Given** a section header with `size="compact"`, and one at the default size, **When** both are measured,
   **Then** the compact heading is drawn at `--ocelle-font-size-subhead` and the default at `--ocelle-font-size-lg`,
   both at `--ocelle-font-weight-strong` in `--ocelle-font-display`, and the compact one's gaps are those of FR-011.
7. **Given** `<ocelle-card><ocelle-section-header slot="header">…</ocelle-section-header><p>Body</p></ocelle-card>` at
   the default density, **When** it is measured in both themes, **Then** the card has a `--ocelle-border-width`
   border in `--ocelle-color-rule`, `--ocelle-radius-row` corners, the `--ocelle-color-sheet` ground, padding
   `--ocelle-space-7` on every side and a `--ocelle-space-2` gap between header and body.
8. **Given** the same card with `density="compact"`, **When** it is measured, **Then** its padding is
   `--ocelle-space-5`, its header-to-body gap `--ocelle-space-4`, its border and radius as in scenario 7, and the
   slotted section header is drawn at the compact size of scenario 6 without the page setting `size` on it.
9. **Given** a compact card whose slotted section header has `size="regular"` set by the page, **When** it is
   measured, **Then** the section header is drawn at the default size: the header's own `size` wins over the card's
   density. The same with `size="compact"` on a section header in a regular card draws it compact.
10. **Given** a card with `inset` written as `<ocelle-card inset>` (empty value), a second with `inset="inset"`, a
    third whose page sets `card.inset = true` from script, each in each density, and a card without `inset`, **When**
    they are measured in both themes, **Then** the three inset cards' ground is `--ocelle-color-inset` and their
    padding, gap, border and radius are those of their density, while the card without `inset` is on
    `--ocelle-color-sheet`; the third carries a reflected `inset` attribute, and removing the attribute from any of
    them draws it on `--ocelle-color-sheet` (FR-006, FR-016).
11. **Given** a card with no header (nothing in the `header` slot) and one with a header, **When** both are measured,
    **Then** the first one's body starts at its padding edge with no header gap, while the second has the gap of
    scenario 7 or 8.
12. **Given** a card holding a link and a button, **When** the page is tabbed through, **Then** focus moves through
    the link and the button in document order and the card, the section header and their shadow roots add no tab
    stop.
13. **Given** a regular card, an inset card and a section header with an eyebrow in forced-colours mode, **When** they
    are drawn, **Then** both cards' borders are drawn in a system colour that differs from their ground,
    the slotted heading, eyebrow and description are drawn in a system text colour on a system background, and the
    inset card draws with the same ground, border and text colours as the regular card. That last outcome is accepted:
    `inset` marks only that a card is nested, which the nesting itself already shows, so losing the sunken ground in
    forced colours loses no information (FR-016).
14. **Given** a compact card with a section header whose heading is a 60-character run with no break opportunity and
    two actions, **When** the page reflows at 320 px, **Then** there is no horizontal scroll, the heading wraps inside
    the card, and the actions move under the heading column, `--ocelle-space-2` below it, at its inline start, rather
    than overflow (FR-010).
15. **Given** `tokens.css` as built, **When** it is read, **Then** it defines the eyebrow tokens of FR-030, and the
    contrast check covers `--ocelle-color-eyebrow` as text on every main ground in both themes and passes.
16. **Given** a section header with an eyebrow, a description and actions but an empty `heading` slot, beside one with
    all four filled, **When** both are measured, **Then** the first has no box, gap or margin for the heading (its
    eyebrow and description are `--ocelle-space-1` apart, the single gap of FR-011) while the second has both gaps; the
    first's accessibility tree holds no heading.
17. **Given** a compact card whose slotted section header has `size=""`, a second whose header has `size="bogus"`, and
    the same two section headers outside any card, **When** they are measured, **Then** the two in the compact card are
    drawn at the compact size (an empty or invalid `size` is no `size`, so the card decides) and the two outside a card
    at the default size; each keeps the attribute value the page wrote.
18. **Given** a compact card whose body holds a card with no `density` whose `header` slot holds a section header, a
    section header in the compact card's body, and a section header inside a `div` assigned to the compact card's
    `header` slot, none with `size`, **When** they are measured, **Then** all three section headers are drawn at the
    default size: only a section header assigned to a compact card's own `header` slot takes the compact size
    (FR-017), and the inner card draws at its own (regular) density.

---

### User Story 2 - Page header (Priority: P2)

A screen starts with a page header: an eyebrow naming the area, the screen's title (a heading the page chose,
usually its `h1`), an optional subtitle and the screen's actions. Kitty Desktop's dense screens use the compact
size: a 24 px display title and a 12 px uppercase tracked eyebrow, in a band ruled off below.

**Why this priority**: 8 uses, and it shares the eyebrow tokens of User Story 1; it needs nothing from Stories 3 and 4.

**Independent Test**: place `ocelle-page-header` in both sizes with and without each slot; measure the band, fonts,
rule and gaps, read the accessibility tree, and reflow at 320 px.

**Acceptance Scenarios**:

1. **Given** `<ocelle-page-header><h1 slot="heading">Missions</h1></ocelle-page-header>`, **When** the tree is read,
   **Then** it holds one level-1 heading named "Missions", the slotted `h1`, and no heading, banner or other landmark
   from the element; the same with an `h2` gives level 2 and still no `h1` anywhere on the page.
2. **Given** a page header with eyebrow, heading, description and actions at the default size, **When** it is measured
   in both themes in left-to-right and right-to-left, **Then** the eyebrow is above the heading with the eyebrow tokens,
   the heading is drawn at `--ocelle-font-size-2xl` in `--ocelle-font-display`, `--ocelle-font-weight-display`,
   `--ocelle-tracking-display` and `--ocelle-line-height-tight`, the description follows with a `--ocelle-space-1` gap
   and no other gap between heading and description, the actions sit at the inline end with their block start at the
   heading's block start, the band has block padding `--ocelle-space-4` and inline padding `--ocelle-space-6`, and a
   `--ocelle-border-width` rule in `--ocelle-color-rule` runs along its block end.
3. **Given** the same header with `size="compact"`, **When** it is measured, **Then** the heading is drawn at
   `--ocelle-font-size-xl` (24 px) with the same face, weight, tracking and line height, and everything else is as in
   scenario 2.
4. **Given** a page header with only a heading and one with every slot filled, **When** both are measured, **Then**
   the first adds no gap or space for its empty eyebrow, description and actions, while the second has the gaps of
   scenario 2.
5. **Given** a page header with a 60-character unbroken heading, a description and three actions, **When** the page
   reflows at 320 px, **Then** there is no horizontal scroll, the heading wraps, and the actions move under the
   description, `--ocelle-space-2` below it, at the inline start (FR-019).
6. **Given** a page header whose actions hold a button, **When** the page is tabbed through, **Then** focus reaches
   the button in document order and the element adds no tab stop.
7. **Given** a page header in forced-colours mode, **When** it is drawn, **Then** the rule under the band is visible
   in a system colour.

---

### User Story 3 - Context sidebar (Priority: P3)

A team screen has a context sidebar beside its content: a head (the team or project name), sections of navigation,
and a footer pinned to the bottom (a progress summary). Rules separate head, sections and footer. A sidebar without
a footer, or without a head, leaves no empty band or stray rule.

**Why this priority**: 3 uses, and #12's shell places it; it uses section headers for its sections but needs
nothing from Stories 2 and 4.

**Independent Test**: place `ocelle-context-sidebar` with `label`, a head, three sections and a footer in a
fixed-height container, and variants with each part empty; measure dividers, gaps and the footer position, read the
landmark, and reflow at 320 px.

**Acceptance Scenarios**:

1. **Given** `<ocelle-context-sidebar label="Team navigation">` holding a head, sections and a footer, **When** the
   tree is read, **Then** it holds exactly one navigation landmark named "Team navigation", and the head, sections
   and footer are inside it; two sidebars with different labels on one page give two navigation landmarks with
   those two names.
2. **Given** a sidebar whose `label` is changed by script, **When** the tree is read again, **Then** the landmark's
   name is the new label.
3. **Given** a sidebar with a head, three sections (each an element in the default slot) and a footer, in a container
   600 px tall, **When** it is measured in both themes, **Then** its ground is `--ocelle-color-rail`, a
   `--ocelle-border-width` divider in `--ocelle-color-rule` lies between the head and the first section, between each
   two sections and between the last section and the footer (four dividers), each divider spans the sidebar's whole
   inline size, the head, each section and the footer each have `--ocelle-space-4` between their content and every
   side of their part (so each divider has `--ocelle-space-4` of padding on both sides and there is no other gap
   between parts), and the footer's block end is at the container's block end (FR-021, FR-022).
4. **Given** the same sidebar in a container shorter than its content, **When** it is measured, **Then** the footer
   follows the last section (it does not overlap it) and the sidebar's block size is its content's.
5. **Given** sidebars on one page with no footer, with no head, and with both, **When** they are measured, **Then**
   a sidebar with an empty footer has no footer padding, gap or divider after its last section, one with an empty
   head has none before its first section, and the full sidebar has all of them.
6. **Given** a sidebar whose footer is filled by script after it renders, and one whose head is emptied, **When**
   each is measured before and after, **Then** the divider and padding of that part appear and disappear with its
   content.
7. **Given** a sidebar with one section, **When** it is measured, **Then** it has no divider between sections.
8. **Given** a sidebar holding links in head, sections and footer, **When** the page is tabbed through, **Then**
   focus follows document order through head, sections and footer, and the sidebar adds no tab stop.
9. **Given** the sidebar in forced-colours mode, **When** it is drawn, **Then** every divider is visible in a system
   colour.
10. **Given** the sidebar at 320 px wide (its container the full viewport), **When** the page reflows, **Then** there
    is no horizontal scroll and no section's text is clipped.
11. **Given** a sidebar whose default slot holds a text node ("Loose text") between two section elements, **When** it
    is measured, **Then** the text is rendered between the two sections in document order with `--ocelle-space-4`
    inline padding on both sides and no block padding of its own, and the text adds no divider of its own: there is
    exactly one divider between the two sections, at the second section's block start, so between the text and the
    second section, and none between the first section and the text (FR-021, FR-022). A sidebar with a head, a
    default slot holding only non-empty text, and a footer has two dividers: the default slot is non-empty, so the
    head-to-default-slot divider lies between the head and the text and the default-slot-to-footer divider between
    the text and the footer.
12. **Given** a sidebar with no `label` but `aria-label="Team"` on its host, a second with `label="Projects"` and
    `aria-label="Other"`, a third with `label="Projects"` and a blank `aria-label=""`, and a fourth with neither,
    **When** the tree is read and axe runs on the page, **Then** the first's landmark is named "Team", the second's
    "Other" (the host `aria-label` decides alone), the third's landmark has no name (a blank host `aria-label` leaves
    it unnamed even with a `label`), the fourth's has no name, the page holds exactly one navigation landmark per
    sidebar, and axe reports no serious or critical finding caused by the host's `aria-label`; **When** script then
    removes `aria-label` from the second and third, **Then** both landmarks are named "Projects" (FR-028).
13. **Given** a sidebar with a head and a footer and an empty default slot, beside one with a head, one section and
    a footer, **When** both are measured, **Then** the first has exactly one divider, between head and footer, and no
    padding for the empty sections (head and footer padding meet at that divider), while the second has two and its
    section has `--ocelle-space-4` padding on every side.

---

### User Story 4 - Personal rail (Priority: P4)

The personal rail is the narrow dark column of personal navigation (icon links, with an account link at the
bottom). The page decides its orientation: vertical in a column, horizontal as a strip, for example inside #12's
narrow-width personal drawer. The rail never changes orientation on its own, so a consumer's tier and the rail always
agree.

**Why this priority**: 2 uses; #12 needs it, but it is the most independent of the five and can be split off
(triage 011).

**Independent Test**: place `ocelle-personal-rail` with `label`, primary items and bottom items, in each
orientation, at several viewport widths including exactly 720 px; measure the layout, read the landmark, change the
orientation with focus inside, and reflow at 320 px.

**Acceptance Scenarios**:

1. **Given** `<ocelle-personal-rail label="Personal">` with three links in the default slot and one in `bottom`,
   **When** the tree is read, **Then** it holds one navigation landmark named "Personal" with the four links inside
   it in document order.
2. **Given** the rail without `orientation` and with `orientation="vertical"`, each in a container 600 px tall,
   **When** each is measured in both themes, **Then** both are 600 px tall and lay the primary items out in a column
   from the block start, the bottom items in a column at the block end (the last bottom item's block end at the
   rail's content-box block end), with one `--ocelle-border-width` divider between the groups, on the `--ocelle-color-chrome` ground
   with `--ocelle-color-chrome-ink` text, `--ocelle-shell-rail-width` (52 px) wide. With square items of
   `--ocelle-size-rail-item` (40 px) in both groups, each item lies inside the rail's content box with no overflow,
   is centred in the inline direction, and, when it has keyboard focus, its focus ring (`--ocelle-focus-width` drawn
   `--ocelle-focus-offset` outside the item) lies wholly inside the rail's border box and is not clipped.
3. **Given** the rail with `orientation="horizontal"`, **When** it is measured in left-to-right and right-to-left,
   **Then** the primary items run in a row from the inline start, the bottom items at the inline end, with the
   divider between the groups running in the block direction over the rail's content block size, and the rail fills
   its container's inline size. With `--ocelle-size-rail-item` items, each item is centred in the block direction and
   its focus ring is not clipped, as in scenario 2.
4. **Given** a vertical rail and a horizontal rail, **When** the viewport is resized through 721, 720, 719 and 320 px
   (and the rail's container through the same widths), **Then** each rail keeps its orientation at every width: the
   element itself has no viewport or container threshold.
5. **Given** a rail with focus on its second link, **When** script changes `orientation` from vertical to horizontal
   and back, **Then** focus stays on that link, the links keep their document and tab order, and the landmark and its
   name are unchanged.
6. **Given** a rail with an empty `bottom` slot, one with bottom items and primary items, and one with bottom items
   and an empty default slot, in each orientation, **When** they are measured, **Then** the first has no divider and
   no space for the bottom group; the second has both; the third has no divider and no space for the primary group,
   and its bottom group sits at the block end (vertical) or the inline end (horizontal).
7. **Given** a horizontal rail with eight `--ocelle-size-rail-item` links in the default slot and two in `bottom`, at
   320 px in left-to-right and right-to-left, **When** the page reflows, **Then** there is no horizontal scroll and
   no link is clipped; the two bottom links sit on one row at the inline end of the first row; the primary links fill
   the remaining inline size from the inline start and wrap onto further rows below the first; and the divider runs
   in the block direction between the primary and bottom groups from the block start of the first row to the block
   end of the last row (FR-025).
8. **Given** `orientation="sideways"` (a value outside the list), **When** the rail is measured, **Then** it is laid
   out vertically, as with no `orientation`.
9. **Given** the rail in forced-colours mode, **When** it is drawn, **Then** the divider is visible in a system
   colour.
10. **Given** a page that sets `orientation` from its own query with an exclusive bound, as the README shows
    (vertical while its column is at least the bound, horizontal below), **When** the column is exactly at the bound,
    **Then** the rail is vertical, and 1 px below it horizontal.
11. **Given** a rail with no `label` but `aria-label="Personal"` on its host, one with both `label="Me"` and
    `aria-label="Other"`, and one with `label="Me"` and a blank `aria-label=""`, **When** the tree is read and axe runs
    on the page, **Then** the landmarks are named "Personal" and "Other" and the third is unnamed, the page holds one
    navigation landmark per rail, and axe reports no serious or critical finding caused by the host's `aria-label`;
    **When** script then removes `aria-label` from the second and third, **Then** both are named "Me" (FR-028).

### Edge Cases

- A heading slot that holds no heading element (for example a `span slot="heading"`): the element draws it with the
  heading styles but adds no heading node; the tree has no heading, as the page wrote it. The README says to slot a
  heading element. Text written directly in a section header or page header is not rendered, since neither has a
  default slot.
- Two elements in one `heading` slot: both are rendered in order; the README says to slot one.
- An eyebrow-only section header with actions: the actions are rendered at the inline end; the eyebrow and
  description slots are not rendered (US1-5).
- A card nested in a card: the inner card's ground and density are its own, so a card with no `density` inside a
  compact card is regular and its section header is drawn at the default size (US1-18); `inset` is the way to mark
  the nesting.
- A section header in a compact card's body, or nested inside another element in its `header` slot: not assigned to
  the card's `header` slot, so drawn at its own size, regular when `size` is not set (FR-017, US1-18).
- A section header outside a card, with `size="compact"`: drawn compact (US1-6).
- A compact card whose header slot holds something other than a section header: the card's density changes only its
  own padding and gap.
- A context sidebar or personal rail without `label`, or with an empty or whitespace-only `label`, and no host
  `aria-label`: the navigation landmark is present with no name. A host `aria-label` decides the name alone when
  present, so a non-empty one names the landmark and a blank one leaves it unnamed even with a `label` (FR-028,
  US3-12, US4-11); the README says to always set a distinct `label`, since axe's landmark rules flag two unnamed
  navigation landmarks.
- A personal rail with no primary items but bottom items: the bottom group sits at the block end (vertical) or the
  inline end (horizontal), with no divider (US4-6).
- A context sidebar whose default slot is empty but whose head and footer are filled: one divider, between head and
  footer (US3-13). Text nodes in the sidebar's default slot are rendered but are not sections: they make the default
  slot non-empty but add no divider of their own, so text between two sections leaves one divider, at the second
  section's block start, and a slot of text alone sits between the head and footer dividers (US3-11, FR-022); the
  README says to wrap each section in an element.
- A section header or page header with an empty `heading` slot: the heading part adds no box or gap (US1-16, FR-005).
- A section header or page header inside a `[data-ocelle-prose=""]` region of `@ocelle/styles`: the prose rules of
  `base.css` for `h1` to `h6` (margins, size, weight) are host-page rules, so they win over the element's slotted
  heading styles (Slotted headings, above) and the heading is drawn at the prose sizes and margins. This feature
  accepts that and does not change `base.css`; the README says to place these elements outside a prose region.
- Right-to-left: every inline position (actions, horizontal rail groups) follows the inline direction (US1-2, US2-2,
  US4-3).
- `hidden` on any of the five hosts: no box and no node, by the element conventions' `:host([hidden])` rule.
- An assigned element that is `hidden` counts as content (Empty slot, above).
- Very long words and identifiers in any slot wrap inside the element and never cause horizontal scroll (US1-14,
  US2-5).

## Requirements *(mandatory)*

### Functional Requirements

**Common to all five elements**

- **FR-001**: The feature MUST add five elements to `@ocelle/elements`, `ocelle-card`, `ocelle-section-header`,
  `ocelle-page-header`, `ocelle-context-sidebar` and `ocelle-personal-rail`, each written by the README's element
  conventions (module and registration, `static properties` with descriptions and defaults, token-only static styles
  with `:host([hidden])`, variant rules inside `@media not (forced-colors: active)`), each with its own entry point
  beside the existing ones and defined by the package root and the browser build.
- **FR-002**: None of the five elements emits an event, performs I/O, creates a heading, or adds a tab stop; their
  content is the page's slotted light DOM, in the order the page wrote it.
- **FR-003**: Every layout position MUST use logical directions (inline start and end, block start and end), so
  right-to-left pages mirror it, and every border, divider and rule MUST be drawn as a border (not a background or a
  shadow), so it stays visible in forced-colours mode.
- **FR-004**: Every element MUST reflow at 320 px as its user story states: no horizontal scroll, slotted text that
  wraps (long words and identifiers included) rather than overflows, and parts that stack rather than overflow.
- **FR-005**: An empty slot (as defined above) MUST add no box, padding, gap, margin or divider; the layout MUST
  follow changes of a slot's content without the page doing anything else.
- **FR-006**: Attributes that select a variant (`density`, `inset`, `size`, `variant`, `orientation`) MUST reflect
  between property and attribute once the page sets them; `label` MUST NOT be reflected. A property's default is
  "not set" (the README convention's `@default undefined`): the element gives it no initial value, writes no
  attribute on upgrade, and draws the look the requirements below name as the default. For the enumerated
  attributes (`density`, `size`, `variant`, `orientation`), an absent, empty or invalid attribute value (one outside
  the property's list) MUST behave as "not set"; the element keeps the value the page wrote and does not rewrite it.
  `inset` is a boolean attribute: present, with any value (the empty string included, as in `<ocelle-card inset>` and
  as reflection writes it), means inset; absent means not inset (FR-016, US1-10).
- **FR-007**: The five elements MUST declare no CSS parts and no element CSS custom properties in this release; the
  manifest states each list empty. They read the tokens named in FR-010 to FR-031 by inheritance, and the README names
  them.

**Section header**

- **FR-010**: `ocelle-section-header` MUST have the slots `heading`, `eyebrow`, `description` and `actions`, laid out
  as US1-2: eyebrow above the heading, description below it (together, the heading column), and the actions at the
  inline end with their block start at the heading's block start. When the heading column, at the inline size of
  its longest word, and the actions do not fit side by side, the actions move under the heading column, at its
  inline start, `--ocelle-space-2` below it; a word longer than the line then wraps within itself (US1-14).
- **FR-011**: Between non-empty parts the section header MUST use a `--ocelle-space-1` gap between eyebrow and
  heading and between heading and description, and a `--ocelle-space-4` gap between the heading column and the
  actions; at `size="compact"` the gaps are the same and only the heading's size changes (FR-012). It MUST have no
  padding of its own.
- **FR-012**: `size` MUST take `"regular"` or `"compact"`; not set (FR-006) it draws regular, or compact inside a
  compact card (FR-017). The slotted heading is drawn in
  `--ocelle-font-display` at `--ocelle-font-weight-strong`, `--ocelle-line-height-tight` and `--ocelle-color-ink`, at
  `--ocelle-font-size-lg` (regular) or `--ocelle-font-size-subhead` (compact), with no margin. The description is
  drawn at `--ocelle-font-size-sm` in `--ocelle-color-ink-muted`.
- **FR-013**: `variant` MUST take `"default"` or `"eyebrow"`; not set (FR-006) it draws as `"default"`. In the eyebrow
  variant the slotted heading is drawn with the eyebrow style (FR-031) instead of FR-012's heading style, and the
  `eyebrow` and `description` slots are not rendered; `actions` are. Since the eyebrow style replaces the heading
  style and FR-011's gaps do not depend on size, `size` and a compact card's density change nothing in the eyebrow
  variant (US1-5). The heading's DOM text is left as the page wrote
  it; its accessible name is whatever the engine derives from it (the drawn, upper-cased text in Chromium, see
  "Upper-case text in the accessibility tree"), and tests compare it with the written text ignoring case.

**Card**

- **FR-014**: `ocelle-card` MUST have a `header` slot and a default slot (the body), laid out header above body.
- **FR-015**: `density` MUST take `"regular"` or `"compact"`; not set (FR-006) it draws regular. Both have a
  `--ocelle-border-width` border in `--ocelle-color-rule`, `--ocelle-radius-row` corners and the `--ocelle-color-sheet`
  ground. Regular has padding `--ocelle-space-7` and a header-to-body gap of `--ocelle-space-2`; compact has padding
  `--ocelle-space-5` and a gap of `--ocelle-space-4`.
- **FR-016**: `inset` (boolean, FR-006: present with any value is inset) MUST draw the card on `--ocelle-color-inset` instead of `--ocelle-color-sheet`,
  changing nothing else. In forced-colours mode both grounds become the system background, so an inset card draws
  like a regular one; this is accepted, because `inset` carries no information the nesting does not (US1-13).
- **FR-017**: In a compact card, a section header assigned to the `header` slot MUST be drawn at its compact size
  unless the section header has its own valid `size` attribute (`"regular"` or `"compact"`), which wins; a section
  header with an absent, empty or invalid `size` takes the card's density (US1-8, US1-9, US1-17). A section header
  that is not itself assigned to a compact card's `header` slot (in its body, nested inside another element in the
  `header` slot, or in a card nested in it) is drawn at its own size, regular when `size` is not set (US1-18).
- **FR-018**: The card MUST expose no role or landmark of its own; a page that needs a region or an article wraps or
  labels its content itself, as the README says.

**Page header**

- **FR-019**: `ocelle-page-header` MUST have the slots `heading`, `eyebrow`, `description` and `actions`, and `size`
  with `"regular"` and `"compact"` (not set, FR-006, it draws regular), laid out and drawn as US2-2 and US2-3: the
  eyebrow with the eyebrow style (FR-031) at both sizes; the heading in `--ocelle-font-display`,
  `--ocelle-font-weight-display`, `--ocelle-tracking-display`, `--ocelle-line-height-tight` and `--ocelle-color-ink`, at
  `--ocelle-font-size-2xl` (regular) or `--ocelle-font-size-xl` (compact), with no margin; the description at
  `--ocelle-font-size-md` in `--ocelle-color-ink-soft` with a `--ocelle-space-1` gap above it; a `--ocelle-space-1` gap
  between eyebrow and heading; the actions at the inline end with a `--ocelle-space-4` gap and their block start at the
  heading's block start, moving under the description (or the heading when there is none), at the inline start,
  `--ocelle-space-2` below it, by the rule of FR-010 (US2-5); block padding `--ocelle-space-4`, inline padding
  `--ocelle-space-6`; a `--ocelle-border-width` rule in `--ocelle-color-rule` along the block end. The page header
  exposes no heading, banner or other landmark of its own (US2-1).

**Context sidebar**

- **FR-020**: `ocelle-context-sidebar` MUST expose one navigation landmark named by `label` or a host `aria-label`
  (FR-028; US3-1, US3-2), holding
  everything the page slots into it, on `--ocelle-color-rail`.
- **FR-021**: It MUST have the slots `head`, a default slot (each assigned element is one section) and `footer`,
  stacked in that order. The parts that are padded are the head, each section (each element assigned to the default
  slot, not the default slot's region as a whole) and the footer: each non-empty one has padding `--ocelle-space-4`
  on every side. There is no gap between parts: two adjacent padded parts meet at the divider between them (FR-022).
  Text assigned to the default slot is rendered in document order but is not a section: it makes the default slot
  non-empty, gets `--ocelle-space-4` inline padding and no block padding, and gets no divider of its own (US3-11).
- **FR-022**: A `--ocelle-border-width` divider in `--ocelle-color-rule` MUST lie between each two adjacent non-empty
  parts, where the parts are the head, the default slot (its sections and its text together) and the footer: one
  between the head and the default slot, at the default slot's block start, and one between the default slot and the
  footer, at its block end. Inside the default slot a divider lies at the block start of every section except the
  first, whatever text lies before it, so there is one divider between each two consecutive sections. The default
  slot's text counts toward the slot being non-empty but is never itself separated from a neighbouring section: it
  adds no divider of its own, and a divider before a section that follows text lies between that text and the section
  (US3-11). When the default slot is empty, one divider lies between a non-empty head and a non-empty footer (US3-13).
  Each divider lies outside the padding of the parts on either side of it and spans the sidebar's whole inline size.
  An empty part has no padding and no divider (US3-3, US3-5, US3-13).
- **FR-023**: The sidebar MUST fill its container's block size when its content is shorter, with the footer at the
  block end; when its content is taller, it MUST grow with its content and the footer follows the last section
  (US3-3, US3-4). Scrolling, and the sidebar's inline size, are the container's (the shell's) concern.

**Personal rail**

- **FR-024**: `ocelle-personal-rail` MUST expose one navigation landmark named by `label` or a host `aria-label`
  (FR-028), with its items inside it in
  document order, on `--ocelle-color-chrome` with `--ocelle-color-chrome-ink` text in both themes (constitution II).
- **FR-025**: It MUST have a default slot (primary items) and a `bottom` slot, and `orientation` with `"vertical"`
  (not set, FR-006, it is vertical) and `"horizontal"`, laid out as US4-2 and US4-3, with a `--ocelle-space-1` gap
  between items and between rows, padding `--ocelle-space-2` except a vertical rail's inline padding, which is
  `--ocelle-space-1`, and a `--ocelle-border-width` divider in `--ocelle-color-chrome-muted` between the groups only
  when both are non-empty. Items are centred across the rail. A vertical rail is
  `--ocelle-shell-rail-width` wide (52 px, leaving a 44 px content box, `--ocelle-target-min`, so a
  `--ocelle-size-rail-item` item fits with room for its focus ring, US4-2) and fills its container's block size; its
  divider runs in the inline direction across the content box. A horizontal rail fills its container's inline size;
  its bottom group sits at the inline end of the first row and is as wide as its items on one row, up to half the
  rail's content inline size, beyond which its own items wrap; the primary group takes the rest of the inline size
  from the inline start and wraps its items onto further rows; the divider runs in the block direction between the
  two groups over the rail's whole content block size, every row included (US4-3, US4-7).
- **FR-026**: The rail MUST change orientation only when `orientation` changes: it has no viewport or container query
  of its own (US4-4). Changing it MUST keep focus, document order, tab order and the landmark (US4-5). This is the
  whole interface #12's shell and personal drawer use to drive it; the README shows a page setting it from its own
  query with an exclusive bound (`width < N`, never `max-width: N`) (US4-10).
- **FR-027**: The rail MUST NOT size or style its items beyond the gap, their centring across the rail and the
  chrome ink colour they inherit; item size and density are the items' own (#12's `ocelle-nav-item`, expected at
  `--ocelle-size-rail-item`).
- **FR-028**: For the sidebar and the rail, the landmark's name MUST follow the README's Host ARIA rule (operator
  decisions "Keep FR-028" and "Follow convention"; constitution III: a name set on the host reaches the landmark). A
  host `aria-label`, when present, decides the name alone: a non-empty one is the name even when `label` is set, and
  a blank one leaves the landmark unnamed even with a `label`. `label` names the landmark only when the host has no
  `aria-label`; removing the host `aria-label` falls back to `label`. The page still holds one navigation landmark
  per element, and the host's `aria-label` MUST NOT cause an axe serious or critical finding (US3-12, US4-11). The
  README recommends `label`.

**Tokens**

- **FR-030**: `@ocelle/tokens` MUST add the eyebrow tokens: `--ocelle-font-size-eyebrow` (an alias of
  `--ocelle-font-size-xs`, 12 px), `--ocelle-font-weight-eyebrow` (an alias of `--ocelle-font-weight-strong`),
  `--ocelle-tracking-eyebrow` (`0.08em`, theme-independent) and `--ocelle-color-eyebrow` (an alias of
  `--ocelle-color-ink-muted` in both themes, with a text contrast entry on every main ground), generated into
  `tokens.css` like every other token.
- **FR-031**: The eyebrow style MUST be: `--ocelle-font-sans` (Schibsted Grotesk, never a monospace family),
  `--ocelle-font-size-eyebrow`, `--ocelle-font-weight-eyebrow`, `--ocelle-tracking-eyebrow`,
  `--ocelle-line-height-normal`, `--ocelle-color-eyebrow`, upper case, with tabular figures (`--ocelle-figures`), and
  no margin. The page header's eyebrow and the section header's eyebrow and eyebrow variant use it. Upper case is a
  drawing of the text only: the slotted DOM text is unchanged.
- **FR-032**: The contrast check MUST cover `--ocelle-color-eyebrow` on every main ground in both themes and pass
  (US1-15).

**Evidence and documentation**

- **FR-033**: Every element MUST have a story per variant and state in `storybook/stories/<element>.stories.ts`, as
  the element conventions and #10's contributor note say: at least the variants and the empty and filled states each
  user story's scenarios name, in light and dark.
- **FR-034**: The manifest MUST list each element with every public property and attribute (type, default,
  description), its slots, and its empty event, part and CSS custom property lists; the `manifest` gate MUST pass.
- **FR-035**: The browser build and the module build MUST pass the `csp` gate; the fixture pages of every scenario
  MUST record no CSP violation and no request outside the allowed list, each paired with the positive outcome of its
  scenario.
- **FR-036**: The package README MUST gain a section per element, and the `@ocelle/elements` and `@ocelle/tokens`
  changelogs MUST name the new elements and tokens as MINOR additions. A documentation test asserts that each
  element's section contains these statements, each a test of its own:
  - every element: a usage example; each of its slots by name; each of its properties and attributes with its values
    and its "not set" look; each token it reads (FR-007); the empty-slot rule, including "remove an element from the
    slot rather than hide it"; for every element but the card, the Consumer-need workaround it replaces (SC-006;
    "Consumer need" records no Kitty Desktop workaround for the card, only its missing compact density);
  - section header and page header: the slotted-heading rule (slot one heading element; the page's own heading rules
    win) and "place outside a `[data-ocelle-prose]` region";
  - section header: the eyebrow variant draws the heading upper case while its DOM text stays as written;
  - card: the compact card sets a slotted section header's size unless the header has a valid `size`; the card has
    no role, and a page that needs a region or article adds it;
  - sidebar and rail: "set a distinct `label`", and that a host `aria-label` decides the landmark's name alone when
    present (a blank one leaves it unnamed even with a `label`), with `label` used only when the host has none;
  - sidebar: wrap each section in an element;
  - rail: the orientation example of US4-10 with an exclusive bound (`width < N`), and that items are sized by
    themselves (`--ocelle-size-rail-item`).
- **FR-037**: Every story of these elements MUST have committed visual baselines in light and dark, produced as #10's
  contributor note says, and the `visual` gate MUST pass.
- **FR-038**: The `axe` gate MUST report no serious or critical finding on any story of these elements in either
  theme.
- **FR-039**: The engine floor MUST NOT be raised by this feature unless the plan records the feature that raises it
  and the README's "Engines" list is updated.

### Key Entities

- **Slot part**: a named region of an element (heading, eyebrow, description, actions, header, body, head, section,
  footer, bottom) that holds the page's own light-DOM content; it is empty or filled (Empty slot, above).
- **Variant attribute**: a reflected attribute that selects one look (`density`, `inset`, `size`, `variant`,
  `orientation`); not set by default. For the enumerated ones an absent, empty or invalid value draws the default
  look; `inset` is a boolean, present with any value meaning inset (FR-006).
- **Landmark label**: the `label` property of the sidebar and rail, the accessible name of their navigation landmark
  when the host has no `aria-label` (FR-028).
- **Eyebrow tokens**: the four tokens of FR-030 that make up the eyebrow style of FR-031.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All acceptance scenarios of the four user stories pass on the strict-CSP fixture pages of the browser
  build and in process on the element source.
- **SC-002**: At 320 px, every story of the five elements has no horizontal scroll and no clipped text (FR-004).
- **SC-003**: The accessibility tree of every scenario holds exactly the headings the page slotted (with their
  levels) and exactly the navigation landmarks of the sidebar and rail (with their labels), and no other heading or
  landmark from the five elements.
- **SC-004**: The `manifest`, `csp`, `prefix`, `style-lint`, `brand-rules`, `contrast`, `visual` and `axe` gates pass, with stories
  for every variant and state in light and dark and their baselines committed.
- **SC-005**: Changed source has no surviving mutant that the review has not recorded as equivalent (constitution
  VIII, mission 007's mutation gate).
- **SC-006**: Each of the four Kitty Desktop workarounds named in "Consumer need" (part-level padding and gap
  overrides, token-painted dividers, pinned page-header font rules, personal-rail `::part` overrides) has a matching element property, slot or default in this feature, named in the README's per-element
  sections as FR-036 lists and asserted by its documentation test.

## Deviations from the upstream issues

| Upstream ask | This feature | Why |
|---|---|---|
| #529, #497: a monospace eyebrow | Schibsted Grotesk, uppercase, tracked, tabular figures | Constitution II, no monospace |
| #516: compact card radius 12 px ("md") | `--ocelle-radius-row` (6 px) in both densities | Constitution II's radius rule; operator decision |
| #516: regular card radius 16 px | `--ocelle-radius-row` (6 px) in both densities | Constitution II's radius rule; operator decision |
| #516: 2 px border on the regular card | `--ocelle-border-width` (1 px) in both densities | The token set has one border width |
| #516: 18 px / 700 compact title | `--ocelle-font-size-subhead` (18 px) at `--ocelle-font-weight-strong` (600) | No 700 weight token; operator decision on existing tokens |
| #529: title tracking `-0.01em`, line height 1.2 | `--ocelle-tracking-display`, `--ocelle-line-height-tight` | Operator decision on existing tokens |
| #492: `orientation="auto"` and a rail item density | Only `vertical` and `horizontal`; item size is the items' own | An automatic flip needs a threshold inside the element, which a token cannot set (a custom property is not allowed in a query condition) and which #492 is about removing; items are #12's |

## Assumptions

- The heading level is kept by slotting the page's own heading (no `level` property): this needs no ID reference
  across a shadow root (constitution III) and keeps the page's heading styles and anchors.
- The eyebrow tracking `0.08em` is this library's choice: #497 and #529 ask for a tracked eyebrow and give no value.
- The regular page header's 30 px title (`--ocelle-font-size-2xl`) stands in for the Spec Kitty 32 px title; the
  token scale has no 32 px step.
- The context sidebar's and the rail's inline sizes in a shell, the collapsed icon-column sidebar, scrolling, and
  the personal drawer are #12's (with #16's `ocelle-drawer`); if #12 needs more from these elements, it adds it as a
  MINOR change.
- The eyebrow tokens are added here; #7's metric eyebrow (#509) uses them.
- The visual and axe gates are those of #10's final design (`specs/006-storybook-workbench` on
  `claude/010-storybook-workbench`), on `main` before this feature is implemented.
- Node 22 here against the pinned 26.13.0 in CI, `OCELLE_CHROMIUM_PATH` for browser runs and no WebKit, as in earlier
  missions.
