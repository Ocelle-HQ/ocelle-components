# Feature Specification: Icons and Brand Mark

**Feature Branch**: `005-icons-brand-mark` (work happens on `claude/017-icons-brand-mark`)

**Created**: 2026-11-10

**Status**: Draft

**Input**: User description: "Build the first @ocelle/elements feature from issue #17 (triage/005-icons-brand-mark.md):
the element conventions later element missions follow (Lit 3 pinned, registration, token-only static styles, a
generated custom-elements manifest at packages/elements/custom-elements.json checked by a new manifest gate with
plants, element stories in the existing Storybook, CSP-safe built output); ocelle-icon rendering a shared SVG icon set
for navigation and actions (spec-kitty-design#496: back chevron, menu, close, folder, arrow and the icons #7, #12 to
#16 name) inline in its shadow root with no network request, sized by --ocelle-icon-size, painted with currentColor,
decorative by default (aria-hidden) and visible in forced colours; a documented slot convention that ocelle-button,
ocelle-nav-item and ocelle-action-row follow to size slotted icons, proven on a test host; the Ocelle rosette brand
mark (Ocelle-HQ/docs src/theme/assets/logo.svg) as SVG for ocelle-top-bar with variants for the dark chrome and light
grounds, from tokens only (spec-kitty-design#504); the icon licence recorded (own drawings, or a permissively licensed
set in THIRD_PARTY_NOTICES with the operator's approval); the controls themselves, their accessible names and visual
baselines and axe stay with #7, #12 and #10."

**Issues**: #17 (triage record `triage/005-icons-brand-mark.md`, approved by the operator on 2026-11-10). The body
of #17, the two spec-kitty-design issues it cites (#496, #504) and the Ocelle brand mark in `Ocelle-HQ/docs` are the
sources of the requirements below; what was read, and from where, is in `sources/README.md`. Their `--sk-*` and
`sk-*` names are kitty-mission-ui roles, not names of this library.

**Operator decisions while specifying** (2026-11-10, human:jeroennouwsdev):

- Brand mark terms, "Apache-2.0 + trademark note (Recommended)": the mark's drawing ships under Apache-2.0 with the
  code. The package README and the repository `NOTICE` state that the Ocelle name and mark are trademarks, that
  Apache-2.0 grants no trademark rights (its section 6), and that they may be used only to refer to Ocelle (FR-030).
- Icon source, "Own drawings (Recommended)": every icon is drawn from scratch for this library on one grid and one
  stroke style, licensed Apache-2.0 with the code. No third-party icon set is used, so `THIRD_PARTY_NOTICES` does not
  change (FR-029).

## Consumer need

- kitty-mission-ui puts local `inline-size` and `block-size` rules on every SVG it slots into a button, because the
  Spec Kitty button renders a slotted icon at 0 px or at its native size; its Projects screen dropped the folder icon
  from "Open project" for the same reason, and its Artifact Viewer drew its own magnifier and table glyphs because no
  shared set exists (spec-kitty-design#496).
- The Spec Kitty brand mark ships only as a raster PNG on a cream ground, so consumers trace or redraw it
  (spec-kitty-design#504). Kitty Desktop's top bar (#12, `ocelle-top-bar`) needs the Ocelle mark as SVG on the dark
  chrome; other hosts need it on the light and dark main grounds.
- `ocelle-button` and `ocelle-action-row` (#7), `ocelle-top-bar` and `ocelle-nav-item` (#12), the disclosure (#13),
  the copy field (#14) and the dialog and drawer (#16) all need icons. They are blocked on a shared set and on one
  agreed way to size an icon inside a control.
- No element exists yet. This feature is the first, so the way an element is written, registered, styled, declared
  in the custom-elements manifest, documented and shown in Storybook is settled here, and every later element
  mission follows it (triage 005, "Element conventions").

## User Scenarios & Testing *(mandatory)*

The users of this feature are host pages that place icons and the brand mark (Kitty Desktop's webview, Kitty
Dashboard, the Ocelle console's server-rendered pages under the strict CSP), the authors of later elements of this
library (people and agents) who slot icons into their controls and follow the element conventions, assistive
technology users of those hosts, and the operator who reviews pull requests.

**Engines.** Behaviour is measured in Chromium, the only engine available to this repository's test runs. WebKit
(Kitty Desktop on macOS and Linux) is not measured; the README names that as an open limitation.

### User Story 1 - The element conventions and `ocelle-icon` (Priority: P1)

A host page imports `@ocelle/elements` (or only the `ocelle-icon` module), writes `<ocelle-icon name="close">`, and
sees the close glyph at the library's icon size in the colour of the surrounding text, in both themes and in forced
colours, under the strict CSP, without any network request. Assistive technology ignores the icon unless the host
gives it a label. A later element author finds, in the package README, the one way elements in this library are
written, registered, styled, declared in the manifest and shown in Storybook, and a manifest gate that fails when the
committed manifest does not match the source.

**Why this priority**: Every other story, and every later element mission, depends on an element existing and on
the conventions it proves. `ocelle-icon` is the smallest element that exercises all of them.

**Independent Test**: Load the built package in a page served under the strict CSP, place `ocelle-icon` with one
icon name, and check its rendered drawing, size, colour, accessibility tree and the absence of requests and CSP
violations; run the manifest gate and its plants.

**Acceptance Scenarios**:

1. **Given** a page that loads the built `ocelle-icon` module under `default-src 'none'; script-src 'self';
   style-src 'self'`, **When** it renders `<ocelle-icon name="close">`, **Then** the element's shadow root holds one
   SVG drawing of the close glyph, the page records zero CSP violations and makes no request other than the page and
   its scripts (FR-004, FR-005, FR-010).
2. **Given** the same element with no size set by the host, **When** it is measured, **Then** its box is
   `--ocelle-icon-size` wide and high (20 px at the default root font size), and the drawing fills it (FR-011).
3. **Given** the host sets the element's `inline-size` and `block-size` (for example to 32 px) or changes
   `--ocelle-icon-size` on an ancestor, **When** it is measured, **Then** the element and its drawing take that size,
   keeping the square aspect (FR-011).
4. **Given** the element inside text whose colour is `--ocelle-color-ink`, **When** the host changes the text colour
   (for example to `--ocelle-color-chrome-ink` on the chrome), **Then** every stroke and fill of the drawing takes the
   inherited text colour; the drawing contains no colour of its own (FR-012).
5. **Given** `<ocelle-icon name="close">` with no `label`, **When** the accessibility tree is read in Chromium,
   **Then** the icon contributes no node and no name to the tree, and the text around it reads unchanged (FR-013).
6. **Given** `<ocelle-icon name="search" label="Search">`, **When** the accessibility tree is read, **Then** it holds
   exactly one image node named "Search" for the icon; **When** `label` is removed again, **Then** the node is gone
   (FR-014).
7. **Given** forced-colours mode is emulated with a dark and with a light system palette, **When** the icon is
   rendered in body text and inside a native button, **Then** its strokes take the system colour of the surrounding
   text (`CanvasText` in text, `ButtonText` in the button) and stay visible against `Canvas` and `ButtonFace`
   (FR-015).
8. **Given** a name that is not in the set, an empty name or no name, **When** the element renders, **Then** it
   draws nothing, keeps its icon-size box so the layout does not shift, adds nothing to the accessibility tree even
   with a `label`, throws no error and makes no request; **When** the name is then changed to a known icon, **Then**
   that icon is drawn (FR-016).
9. **Given** `name` is changed from `close` to `menu` on a rendered element, **When** it updates, **Then** the
   drawing is the menu glyph and nothing of the close glyph remains (FR-016).
10. **Given** the `ocelle-icon` module is imported twice (two bundles of the same version, or the module evaluated
    again), **When** the second import runs, **Then** no error is thrown and the first definition stays in place
    (FR-006).
11. **Given** the committed `packages/elements/custom-elements.json`, **When** the manifest gate runs, **Then** it
    passes, and the manifest declares `ocelle-icon` with its tag name, its `name` and `label` properties and their
    attributes, and states that it has no slot, no event and no CSS part (FR-007, FR-008).
12. **Given** a source change that adds a public property to an element without regenerating the manifest, or a
    manifest whose `ocelle-icon` entry has lost its `label` attribute, **When** the manifest gate runs, **Then** it
    fails with one finding naming the element and the member; a malformed manifest makes it report "could not run"
    (FR-009).
13. **Given** the Storybook, **When** it is built, **Then** it holds `ocelle-icon` stories for every icon in the set
    in light and dark and for the labelled and unknown-name states, and the stories render with the base stylesheet
    as every story does (FR-019).

---

### User Story 2 - The icon set (Priority: P2)

A host or an element author picks an icon by name from a documented list that covers the navigation and action
icons Kitty Desktop and the planned elements need, and every icon has the same visual weight, grid and stroke style.
Icons that point along the line of text point the right way in right-to-left text.

**Why this priority**: The element is only useful with the glyphs consumers ask for; the set is what lets
kitty-mission-ui delete its stand-in glyphs.

**Independent Test**: For every name in the set, render it, check that a drawing appears, that it follows the shared
grid and stroke rules, and that the direction-dependent icons mirror under `dir="rtl"`.

**Acceptance Scenarios**:

1. **Given** the set, **When** its names are listed from the package (README and manifest documentation of `name`),
   **Then** they are exactly: `chevron-start`, `chevron-end`, `chevron-up`, `chevron-down`, `arrow-start`,
   `arrow-end`, `menu`, `close`, `folder`, `search`, `table`, `copy`, and the README names the consumer need each one
   meets (FR-017, FR-018).
2. **Given** each name, **When** `<ocelle-icon name="…">` renders, **Then** a non-empty drawing appears whose painted
   area stays inside the icon box, and no two names produce the same drawing (FR-017).
3. **Given** each drawing, **When** its source is read, **Then** it uses the shared 24-unit grid, one stroke width,
   round caps and joins, `currentColor` only, and no `style` attribute, `id`, `href`, `<use>`, `<image>`,
   `<foreignObject>`, `<script>` or event-handler attribute (FR-018, FR-010).
4. **Given** `dir="rtl"` on an ancestor, **When** `chevron-start`, `chevron-end`, `arrow-start` and `arrow-end`
   render, **Then** each points the opposite physical way from its left-to-right rendering (start points right, end
   points left); `chevron-up`, `chevron-down`, `menu`, `close`, `folder`, `search`, `table` and `copy` are not mirrored
   (FR-017).
5. **Given** the README, **When** the licence section is read, **Then** it states that every icon is the project's
   own drawing under Apache-2.0, and `THIRD_PARTY_NOTICES` lists no icon set (FR-029).

---

### User Story 3 - The slot convention for icons in controls (Priority: P3)

An element author building `ocelle-button`, `ocelle-nav-item` or `ocelle-action-row` follows one documented slot
convention, and an icon a host slots into such a control, whether an `ocelle-icon` or a bare `<svg>`, renders at the
icon size, in the control's text colour, centred on the label's line, with no size set by the host, even on a page
that loads the base stylesheet. An icon-only control takes its accessible name from the control, never from the icon.

**Why this priority**: It closes the sizing gap of #496 for every future control. It is proven on a test host here,
because the real controls arrive with #7 and #12.

**Independent Test**: A test-only host element that follows the convention is rendered with an `ocelle-icon`, a bare
`<svg>` with and without `width` and `height` attributes, and an empty slot, on a page with and without the base
stylesheet; sizes, alignment, colour and the accessibility tree are measured.

**Acceptance Scenarios**:

1. **Given** the test host with `<ocelle-icon slot="icon" name="folder">` and the label "Open project", **When** it
   is measured, **Then** the icon box is `--ocelle-icon-size` square, sits before the label in the inline direction,
   is centred on the label's first line, is separated from the label by the gap the convention names, and does not
   shrink when the host is narrow (FR-020, FR-021).
2. **Given** a bare `<svg slot="icon" viewBox="0 0 24 24">` with no `width` or `height`, and another with
   `width="100" height="100"`, **When** they are measured with and without `base.css` linked, **Then** both render at
   `--ocelle-icon-size` square, not at 0 px, 100 px or the 300 × 150 default (FR-021, FR-022).
3. **Given** the test host's text colour changes, **When** the slotted icon is measured, **Then** an `ocelle-icon`
   and a bare `<svg>` whose drawing uses `currentColor` take that colour (FR-021).
4. **Given** the test host with nothing in its icon slot, **When** it is measured, **Then** the label starts at the
   host's content edge with no gap or empty box before it (FR-021).
5. **Given** an icon-only test host named "Close" through the control's own label (for example `aria-label` on its
   inner control) with `<ocelle-icon slot="icon" name="close">`, **When** the accessibility tree is read, **Then** the
   control's name is "Close" and the icon adds nothing to it; **Given** the same with a `label` set on the icon,
   **Then** the README's rule says that is wrong and the test documents that the name still comes from the control
   (FR-013, FR-023).
6. **Given** the README, **When** a later element author reads the slot convention, **Then** it names the slot
   (`icon`, and `trailing` for an end icon such as the action-row arrow), the size, alignment, gap and colour rules,
   the base-stylesheet interaction and the naming rule, so #7 and #12 can implement and test it without further
   design (FR-020, FR-023).
7. **Given** forced colours are emulated, **When** the test host shows a slotted icon, **Then** the icon is painted
   in the same system colour as the label (FR-015, FR-021).

---

### User Story 4 - The Ocelle brand mark (Priority: P4)

`ocelle-top-bar` (#12) and any host place the Ocelle rosette, a broken ring around an ochre spot, as an inline SVG
drawn from tokens only: on the dark chrome, on the light and dark main grounds, and as a one-colour mark in the
surrounding text colour. It stays recognisable in forced colours and makes no request.

**Why this priority**: The top bar needs it, but it is one consumer and depends on nothing else in this feature
beyond the element conventions.

**Independent Test**: Render the brand-mark element on each ground in both themes, in its one-colour form and in
forced colours, under the strict CSP; measure the painted colours, the size, the accessibility tree and the
contrast pairs.

**Acceptance Scenarios**:

1. **Given** `<ocelle-brand-mark>` on a main ground (canvas, sheet, pane, panel, rail), **When** it renders in light
   and in dark, **Then** the ring is painted with `--ocelle-color-ink` and the spot with `--ocelle-color-accent`
   (FR-024, FR-025).
2. **Given** `<ocelle-brand-mark ground="chrome">` inside the dark chrome, **When** it renders in light and in dark,
   **Then** the ring is painted with `--ocelle-color-chrome-ink` and the spot with `--ocelle-color-accent`, the same
   in both themes (FR-025).
3. **Given** `<ocelle-brand-mark tone="mono">`, **When** it renders, **Then** ring and spot are both painted in the
   inherited text colour (`currentColor`), whatever the ground (FR-025; spec-kitty-design#504).
4. **Given** the contrast check, **When** it runs, **Then** it verifies at 3:1 or more: the ring colour on each ground
   it is meant for, in both themes, and the spot colour on the chrome in both themes and on the dark-theme main
   grounds (FR-026).
5. **Given** forced colours are emulated, **When** the mark renders in any variant, **Then** ring and spot are both
   painted in the system text colour, and the spot stays visible as a filled shape inside the ring (FR-027).
6. **Given** no `label`, **When** the accessibility tree is read, **Then** the mark contributes nothing (the top bar's
   product name beside it carries the name); **Given** `label="Ocelle"`, **Then** the tree holds one image node named
   "Ocelle" (FR-028).
7. **Given** no size set by the host, **When** the mark is measured, **Then** it is `--ocelle-icon-size` high and its
   width follows the drawing's square aspect; the host can set any other size on the element, and the drawing
   scales with it (FR-024).
8. **Given** an unknown `ground` or `tone` value, **When** the mark renders, **Then** it renders as the default
   main-ground variant (FR-025).
9. **Given** the mark's drawing, **When** its source is compared with `sources/ocelle-docs-logo.reference.svg`,
   **Then** it keeps the rosette's geometry (four open arcs of unequal weight with round caps around a rotated ellipse)
   and contains none of the reference's literal colours, its rounded square, a `style` attribute or an `id` (FR-024,
   FR-010).
10. **Given** the README and `NOTICE`, **When** they are read, **Then** they carry the trademark note of FR-030.
11. **Given** the Storybook, **When** it is built, **Then** it holds brand-mark stories for the main-ground, chrome and
    mono variants in light and dark (FR-019).

---

### Edge Cases

- **Base stylesheet and slotted SVG.** `base.css` gives every light-DOM `svg` `max-inline-size: 100%` and
  `block-size: auto`, and page rules beat a shadow tree's `::slotted()` and `:host` rules whatever their specificity.
  A bare `<svg>` slotted into a control is in the light DOM, so the slot convention must size it in a way those rules
  cannot undo (User Story 3 scenario 2). An `ocelle-icon`'s own drawing is inside its shadow root and is not touched.
- **Host page styles the element.** A host rule such as `ocelle-icon { inline-size: 32px }` is allowed and wins; the
  drawing follows the host box. A host rule that sets only one dimension leaves the other at the icon size.
- **Compact root.** The icon size is a `rem` token, so a host that changes the root font size rescales icons with
  the rest of the library; nothing in this feature sets a root font size.
- **Unknown name, empty name, name with surrounding spaces or different case.** Only exact names from the set draw
  (`Close` and ` close` draw nothing). No warning is written to the console in the built output.
- **Many icons on a page.** A page with 500 `ocelle-icon` elements renders them without a network request and
  without one stylesheet per element instance (styles are shared through adopted stylesheets).
- **Forced colours and `forced-color-adjust`.** The drawings rely on `currentColor` and do not set
  `forced-color-adjust: none`; the system colour reaches them through inheritance.
- **Right-to-left.** Mirroring follows the element's computed direction, so `dir` on any ancestor, or on the element,
  takes effect.
- **Two copies of the package.** Two different versions of `@ocelle/elements` on one page cannot both define
  `ocelle-icon`; the first wins and the second import does not throw. The README says so.
- **Server-rendered pages.** A Thymeleaf page writes `<ocelle-icon name="close">` in its HTML before the script
  loads; until the element is defined the box is empty and has no size guarantee, and once defined it renders. No
  inline script or style is needed to place it.
- **The mark on an unsupported ground.** The main-ground variant on the chrome, or the chrome variant on bone, is a
  host mistake; it is documented, not detected.
- **Light-mode spot.** The ochre spot on bone measures 2.6:1. The mark is a logo: its ring (16:1) carries
  recognition, so the spot on light grounds is not required to reach 3:1, and it is not a state, so the brand rule on
  ochre states does not apply (Assumptions).

## Requirements *(mandatory)*

### Functional Requirements

**Element conventions (for every element of this library)**

- **FR-001**: `@ocelle/elements` depends on Lit 3, pinned to one exact version under the `pins` gate's rules.
- **FR-002**: Each element lives in its own module, exported from the package under its own entry point and from the
  package root; importing an element's module defines it. Importing the package root defines every element.
- **FR-003**: An element's styles are a static, shared stylesheet built only from `--ocelle-*` tokens and the
  allowed values of the `style-lint` gate; they reach the page as adopted stylesheets.
- **FR-004**: Built output contains no inline script, no `<style>` element, no `style` attribute in any rendered
  template, no `eval` or `new Function`, and passes the `csp` gate.
- **FR-005**: Elements perform no I/O and make no network request; no drawing references an external resource.
- **FR-006**: Defining an element whose tag name is already defined does nothing and throws nothing.
- **FR-007**: `packages/elements/custom-elements.json` is generated from the element source and committed. It
  declares, for every element, its tag name, its class, every public property and attribute with type, default and
  description, and its events, slots, CSS parts and CSS custom properties (each list may be empty, and is then stated
  as empty).
- **FR-008**: The README of `@ocelle/elements` documents the conventions of FR-001 to FR-007, FR-019 and the file
  and test layout an element follows, so later element missions apply them without redesign.
- **FR-009**: A new `manifest` merge gate fails when the committed manifest differs from one generated from the
  current source, or when a public member of an element lacks a description; it reports "could not run" when the
  manifest or the source cannot be read or parsed. It has fail, pass and breaking plants, is registered in
  `gates/gates.json`, runs as its own CI check, and is listed in `gates/README.md`.
- **FR-010**: No rendered drawing contains a `style` attribute, an `id`, an `href` or `xlink:href`, `<use>`,
  `<image>`, `<foreignObject>`, `<script>` or an event-handler attribute.

**`ocelle-icon`**

- **FR-011**: `ocelle-icon` renders one square box sized `--ocelle-icon-size` unless the host sizes the element, and
  its drawing scales to the box.
- **FR-012**: Every drawing is painted only with `currentColor`.
- **FR-013**: Without `label`, the icon is hidden from the accessibility tree and contributes no name to an ancestor.
- **FR-014**: With a non-empty `label` (property and attribute), the icon is exposed as one image with that name; an
  empty or whitespace-only `label` counts as none.
- **FR-015**: In forced-colours mode the icon is painted in the system colour of its surrounding text and stays
  visible.
- **FR-016**: `name` (property and attribute, reflected) selects the drawing; an unknown, empty or missing name draws
  nothing, keeps the box, exposes nothing (even with a label) and throws nothing; changing `name` replaces the
  drawing.

**The icon set**

- **FR-017**: The set is exactly the twelve names of User Story 2 scenario 1. `chevron-start`, `chevron-end`,
  `arrow-start` and `arrow-end` follow the inline direction and mirror under right-to-left text; the others never
  mirror. Each name has a distinct drawing.
- **FR-018**: Every drawing is the project's own, on a 24-unit grid with one shared stroke width, round caps and
  joins, and `currentColor` only. The README lists every name with the consumer need it meets. The names are public
  surface (constitution VII): renaming or removing one after 1.0.0 is MAJOR.

**Stories**

- **FR-019**: Every element of this feature has a Storybook story per variant and state, in light and dark, in the
  existing Storybook workspace; the stories pass the `csp` and `prefix` gates' Storybook checks. Visual baselines and
  axe over the stories are added by #10.

**Slot convention**

- **FR-020**: The README documents one slot convention for icons in controls: an `icon` slot before the label and,
  where an element has an end icon, a `trailing` slot after it; the size, alignment, gap and colour rules of FR-021;
  the base-stylesheet interaction of FR-022; and the naming rule of FR-023.
- **FR-021**: A control following the convention renders a slotted `ocelle-icon` or bare `<svg>` at
  `--ocelle-icon-size` square, not shrinking, centred on the label's first line, separated from the label by
  `--ocelle-space-2`, in the control's text colour; an empty slot takes no space and adds no gap.
- **FR-022**: The sizing of FR-021 holds for a bare `<svg>` with or without `width` and `height` attributes, on pages
  with and without the base stylesheet.
- **FR-023**: An icon-only control takes its accessible name from the control itself; a slotted icon stays decorative
  and is not given a `label`. The convention is proven by a test-only host element that ships in no package.

**Brand mark**

- **FR-024**: `ocelle-brand-mark` renders the Ocelle rosette (four open arcs of unequal weight with round caps around
  an elliptical spot), redrawn from the geometry of the reference in `sources/`, as inline SVG in its shadow root,
  `--ocelle-icon-size` high by default with its square aspect, scaling to any size the host sets.
- **FR-025**: Its variants: the default for main grounds (ring `--ocelle-color-ink`, spot `--ocelle-color-accent`);
  `ground="chrome"` for the dark chrome (ring `--ocelle-color-chrome-ink`, spot `--ocelle-color-accent`); and
  `tone="mono"` (ring and spot `currentColor`), which takes precedence over `ground`. Unknown values render the
  default. Its colours come from tokens only; no new token is needed.
- **FR-026**: The contrast check verifies, at 3:1 non-text in both themes: `color-ink` on each main ground,
  `color-chrome-ink` on `color-chrome`, `color-accent` on `color-chrome`, and `color-accent` on the main grounds in
  the dark theme.
- **FR-027**: In forced-colours mode both parts of the mark are painted in the system text colour and the spot stays a
  filled shape inside the ring.
- **FR-028**: Without `label` the mark is hidden from the accessibility tree; with a non-empty `label` it is one image
  with that name.

**Licence and records**

- **FR-029**: The README states that the icons and the mark are the project's own drawings under Apache-2.0;
  `THIRD_PARTY_NOTICES` is unchanged.
- **FR-030**: The README and a new repository `NOTICE` file (none exists yet; Apache-2.0 section 4(d) carries it to
  redistributors) state that "Ocelle" and the rosette mark are trademarks of their
  owner, that Apache-2.0 grants no right to use them (section 6), and that they may be used only to refer to Ocelle.
- **FR-031**: The `@ocelle/elements` changelog names the surface this feature adds: `ocelle-icon`, its icon names,
  `ocelle-brand-mark`, the slot convention and the manifest.
- **FR-032**: The skeleton test that asserts the package "exports nothing yet" is replaced by tests of what it now
  exports.

### Key Entities

- **Icon**: a name from the set and its drawing (24-unit grid, `currentColor` strokes, a flag for inline-direction
  mirroring).
- **Element convention**: the rules every `ocelle-*` element follows (module and registration, styles, manifest,
  stories, tests), written in the package README.
- **Custom-elements manifest**: the generated, committed declaration of each element's public surface, checked by the
  manifest gate.
- **Brand mark variant**: a ground or tone with the token (or `currentColor`) used for the ring and for the spot.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Each of the twelve icons and the three brand-mark variants renders in a page under the strict CSP with
  zero CSP violations and zero network requests beyond the page and its scripts.
- **SC-002**: Every icon, standalone and slotted (as `ocelle-icon` and as a bare SVG, with and without the base
  stylesheet), measures exactly the icon size (20 × 20 px at the default root font size) unless the host sets a size.
- **SC-003**: In the accessibility tree, an unlabelled icon or mark contributes zero nodes and an empty name; a
  labelled one contributes exactly one image node with its label; an icon-only control's name is the control's own.
- **SC-004**: In forced colours, 100% of the painted parts of every icon and mark variant use the system text colour
  of their context.
- **SC-005**: Every brand-mark pair of FR-026 meets 3:1 in both themes, verified by the contrast gate.
- **SC-006**: The manifest gate fails on each of its fail plants, accepts its pass plants and reports "could not run"
  on its breaking plants, and the plants job checks that.
- **SC-007**: kitty-mission-ui can delete its local slotted-SVG size rules and its stand-in folder, magnifier and
  table glyphs once #7 and #12 adopt the convention (no consumer-side size rule is needed, by SC-002).
- **SC-008**: A later element mission (#7 first) builds its first element from the README's conventions without a
  design question about registration, styles, manifest or stories.

## Assumptions

- **Logo contrast.** The brand mark is a logo. The ring carries its recognition and meets 3:1 on every ground it is
  meant for; the ochre spot on light main grounds (2.6:1) is part of the logo's colour and not information, so it is
  not required to reach 3:1. It is not a state, so the brand rule "in light mode the ochre fill is never the only mark
  of a state" does not apply. Hosts that need a mark meeting 3:1 in every part use `tone="mono"`.
- **Rosette, not app icon.** The reference file is the app icon (rosette inside a rounded black square). The element
  draws the bare rosette; the app icon, favicons and standalone SVG files for hosts outside elements are out of scope
  until a consumer names the need.
- **Labels in elements.** The `label` of `ocelle-icon` and `ocelle-brand-mark` is for standalone meaningful use; in
  controls the naming rule of FR-023 applies.
- **Storybook.** The stories use the existing Storybook workspace as 002 and 003 did. #10 (running in parallel) adds
  visual baselines in a pinned container and axe on every story, and may change the Storybook configuration;
  whichever lands second merges the other.
- **Tokens.** No token is added, so `packages/tokens/src/source.ts` (changed by #20) is not touched. If the contrast
  pairs of FR-026 must be declared in the token source to be checked, that change is made after #20 lands.
- **Engines.** Only Chromium is measured. WebKit (Kitty Desktop) behaviour of the accessibility tree, forced colours
  and mirroring is an open limitation recorded in the README.
- **Environment.** The container runs Node 22 while CI pins 26.13.0; browser runs use `OCELLE_CHROMIUM_PATH`.
- **Out of scope.** `ocelle-button`, `ocelle-action-row` (#7), `ocelle-top-bar`, `ocelle-nav-item` (#12) and the
  accessible names of their icon-only modes; a busy spinner (#7); visual baselines and axe (#10); the token change of
  #20; favicons and app icons.
