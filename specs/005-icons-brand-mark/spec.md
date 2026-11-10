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
- File glyph (spec check 1, SPEC-1-05), "Add a `file` glyph (Recommended)": the first icon set has thirteen icons.
  A generic `file` (document) glyph for the Artifact Viewer's file tree is added beside the twelve listed before
  (FR-017). Further per-kind icons are left to a later mission, once kitty-mission-ui names them.

## Consumer need

- kitty-mission-ui puts local `inline-size` and `block-size` rules on every SVG it slots into a button, because the
  Spec Kitty button renders a slotted icon at 0 px or at its native size; its Projects screen dropped the folder icon
  from "Open project" for the same reason, and its Artifact Viewer drew its own magnifier and table glyphs because no
  shared set exists and needs per-kind icons in its file tree, starting with a folder and a generic file
  (spec-kitty-design#496 and its comments).
- The Spec Kitty brand mark ships only as a raster PNG on a cream ground, so consumers trace or redraw it
  (spec-kitty-design#504). Kitty Desktop's top bar (#12, `ocelle-top-bar`) needs the Ocelle mark as SVG on the dark
  chrome; other hosts need it on the light and dark main grounds.
- `ocelle-button` and `ocelle-action-row` (#7), `ocelle-top-bar` and `ocelle-nav-item` (#12), the disclosure (#13),
  the copy field (#14) and the dialog and drawer (#16) all need icons. They are blocked on a shared set and on one
  agreed way to size an icon inside a control.
- No element exists yet. This feature is the first, so the way an element is written, registered, styled, declared
  in the custom-elements manifest, documented and shown in Storybook is settled here, and every later element
  mission follows it (triage 005, "Element conventions").
- Expected outcomes in other repositories and later missions, which this feature makes possible but cannot show
  itself: kitty-mission-ui deletes its local slotted-SVG size rules and its stand-in folder, magnifier and table glyphs
  once #7 and #12 adopt the slot convention; #7 builds its first element from the README's conventions without a
  design question about registration, styles, manifest or stories. What this feature checks for them is SC-007 and
  SC-008.

## User Scenarios & Testing *(mandatory)*

The users of this feature are host pages that place icons and the brand mark (Kitty Desktop's webview, Kitty
Dashboard, the Ocelle console's server-rendered pages under the strict CSP), the authors of later elements of this
library (people and agents) who slot icons into their controls and follow the element conventions, assistive
technology users of those hosts, and the operator who reviews pull requests.

**Engines.** Behaviour is measured in Chromium, the only engine available to this repository's test runs. WebKit
(Kitty Desktop on macOS and Linux) is not measured; the README names that as an open limitation.

**The strict-CSP fixture.** Every browser scenario of this feature, except the Storybook stories (FR-019), runs on
one kind of fixture page, served from one origin together with everything it loads:

- It links the built `@ocelle/tokens` stylesheet (`tokens.css`), which defines `--ocelle-icon-size` and the colour
  tokens the elements read by inheritance and loads the vendored Schibsted Grotesk font by a relative URL. It links
  the `@ocelle/styles` base stylesheet (`base.css`) only where a scenario says "with `base.css`"; scenarios that say
  "with and without `base.css`" run on both pages.
- It loads the built element modules as same-origin scripts and nothing else: no inline script or style.
- It is served with the header `Content-Security-Policy: default-src 'none'; script-src 'self'; style-src 'self';
  font-src 'self'`. That is the library's strict policy (constitution IV) plus the `font-src 'self'` the tokens'
  vendored font needs (`packages/tokens/README.md`); the elements themselves need nothing beyond the strict policy.
- The allowed requests are the page, its scripts, its stylesheets and the vendored font, all same-origin. "No other
  request" in a scenario means none outside that list.

The CSP and request checks and the size, colour and accessibility measurements of a scenario run on the same page, so
a page that passes the CSP check is the page whose sizes were measured.

**Main grounds.** "Main grounds" are the nine grounds of the token source's `main` list: `color-canvas`,
`color-sheet`, `color-pane`, `color-panel`, `color-inspector`, `color-rail`, `color-inset`, `color-accent-low` and
`color-hover-bg`. "The chrome" is `color-chrome` and `color-chrome-hover` (the hover ground of a mark that is a home
link).

**Reading the accessibility tree.** Every accessibility-tree outcome is read from Chromium's full accessibility tree
with ignored nodes filtered out. "Contributes no node" means no unignored node for the element or anything in its
shadow root and no name contributed to an ancestor; an ignored generic node for the custom-element host is allowed.
Each such outcome is read in the same way, in the same test, as the labelled case that pairs with it.

**"Does not" outcomes are paired.** An outcome that says something does not happen (no request, no violation, no
node, no name, no mirroring, no gap) already holds when no element is defined, so a test of it alone passes at red
(constitution VIII). Each one is therefore tested together with the positive outcome it guards, in the same test, and
its plan names a planted defect that makes it fail:

| "Does not" outcome | Paired positive outcome in the same test | Planted defect that makes it fail |
|--------------------|------------------------------------------|-----------------------------------|
| No CSP violation and no request outside the allowed list (US1-1, US4 Independent Test, SC-001, FR-005) | The shadow root holds the drawing and the box is `--ocelle-icon-size` | A drawing that loads `<image href>` from the server, and a template with a `style` attribute |
| No node and no name for an unlabelled icon or mark (US1-5, US4-6, SC-003, FR-013, FR-028) | A labelled twin on the same page exposes exactly one image node with its label | An unlabelled icon with `role="img"` and an `aria-label` from its name, and one without `aria-hidden` on the drawing |
| An icon-only control's name is exactly the control's own, and the slotted icon adds nothing (US3-6, SC-003) | The slotted icon's shadow root holds the drawing at the icon size, and a labelled standalone twin on the same page exposes one image node | An icon that exposes `role="img"` named from its `name` when unlabelled (an image node then appears under the control) |
| The non-directional icons are not mirrored (US2-4) | The four inline-direction icons do mirror on the same page | Mirroring applied to every icon |
| An empty slot adds no gap or box (US3-5) | A filled slot on the same page adds the gap of FR-021 | The gap applied whether or not the slot holds an icon |
| Unknown names draw nothing and add nothing to the tree (US1-8) | A known name on the same element then draws, and a labelled known name exposes one image node | Drawing a fallback glyph for an unknown name |

The README and `NOTICE` statements (FR-008, FR-018, FR-020, FR-023, FR-029, FR-030, SC-007, SC-008) are checked by a
documentation test that reads the files; it fails while a statement is missing. "`THIRD_PARTY_NOTICES` lists no icon
set" (US2-5, FR-029) is documentation that already holds and cannot go red: it falls under the constitution VIII
exemption, and the review states why no test could fail for it.

### User Story 1 - The element conventions and `ocelle-icon` (Priority: P1)

A host page imports `@ocelle/elements` (or only the `ocelle-icon` module), writes `<ocelle-icon name="close">`, and
sees the close glyph at the library's icon size in the colour of the surrounding text, in both themes and in forced
colours, under the strict CSP, without any network request. Assistive technology ignores the icon unless the host
gives it a label. A later element author finds, in the package README, the one way elements in this library are
written, registered, styled, declared in the manifest and shown in Storybook, and a manifest gate that fails when the
committed manifest does not match the source.

**Why this priority**: Every other story, and every later element mission, depends on an element existing and on
the conventions it proves. `ocelle-icon` is the smallest element that exercises all of them.

**Independent Test**: Load the built package in the strict-CSP fixture, place `ocelle-icon` with one icon name, and
check, on that one page, its rendered drawing, size, colour, accessibility tree and the absence of requests outside
the allowed list and of CSP violations; run the manifest gate and its plants.

**Acceptance Scenarios**:

1. **Given** the strict-CSP fixture (with `tokens.css`, without `base.css`) loading the built `ocelle-icon` module,
   **When** it renders `<ocelle-icon name="close">`, **Then**, in the same test, the element's shadow root holds one
   SVG drawing of the close glyph, its box is `--ocelle-icon-size` square, the page records zero CSP violations and
   it makes no request outside the fixture's allowed list (FR-004, FR-005, FR-010).
2. **Given** the same element on the same page with no size set by the host, **When** it is measured, **Then** its
   box is `--ocelle-icon-size` wide and high (20 px at the default root font size), and the drawing fills it
   (FR-011).
3. **Given** the host sets the element's `inline-size` and `block-size` (for example to 32 px) or overrides the
   `--ocelle-icon-size` token on an ancestor, **When** it is measured, **Then** the element and its drawing take that
   size, keeping the square aspect; **Given** the host sets only `inline-size: 32px`, **Then** the box is 32 × 20 px
   and the drawing is scaled to the smaller side (20 px), centred in the box, with its aspect kept (FR-011).
4. **Given** the element inside text whose colour is `--ocelle-color-ink`, **When** the host changes the text colour
   (for example to `--ocelle-color-chrome-ink` on the chrome), **Then** every stroke and fill of the drawing takes the
   inherited text colour; the drawing contains no colour of its own (FR-012).
5. **Given** `<ocelle-icon name="close">` with no `label` in a sentence, and on the same page a labelled twin
   `<ocelle-icon name="close" label="Close">`, **When** the accessibility tree is read in Chromium, **Then** the
   unlabelled icon contributes no unignored node and no name, and the text around it reads unchanged, while the twin
   contributes exactly one image node named "Close" (FR-013, FR-014).
6. **Given** `<ocelle-icon name="search" label="Search">`, **When** the accessibility tree is read, **Then** it holds
   exactly one image node named "Search" for the icon; **When** `label` is removed again, **Then** the node is gone;
   **Given** `label=" Search "`, **Then** the name is "Search"; **Given** `label=""` or `label="  "`, **Then** the icon
   is treated as unlabelled (FR-014).
7. **Given** forced-colours mode is emulated with a dark and with a light system palette, **When** the icon is
   rendered in body text and inside a native button, **Then** its strokes take the system colour of the surrounding
   text (`CanvasText` in text, `ButtonText` in the button) and stay visible against `Canvas` and `ButtonFace`
   (FR-015).
8. **Given** a name that is not in the set, an empty name or no name, **When** the element renders, **Then** it
   draws nothing, keeps its icon-size box so the layout does not shift, adds nothing to the accessibility tree even
   with a `label`, throws no error, writes no console message and makes no request; **When** the name is then
   changed to a known icon, **Then** that icon is drawn, and with a `label` it exposes one image node (FR-016). The
   same holds for `Close` and ` close` (exact names only).
9. **Given** `name` is changed from `close` to `menu` on a rendered element, **When** it updates, **Then** the
   drawing is the menu glyph and nothing of the close glyph remains (FR-016).
10. **Given** the `ocelle-icon` module is imported twice (two bundles of the same version, or the module evaluated
    again), **When** the second import runs, **Then** no error is thrown and the first definition stays in place
    (FR-006).
11. **Given** the committed `packages/elements/custom-elements.json`, **When** the manifest gate runs, **Then** it
    passes, and the manifest declares `ocelle-icon` with its tag name, its `name` and `label` properties and their
    attributes, the type of `name` as the union of the thirteen icon names, and states that it has no slot, no event,
    no CSS part and no CSS custom property; the README names `--ocelle-icon-size` as the token the icon reads and
    overriding that token as the way to resize icons in a subtree (FR-007, FR-008).
12. **Given** a source change that adds a public property to an element without regenerating the manifest, a
    manifest whose `ocelle-icon` entry has lost its `label` attribute, or a public member of any kind without a
    description, **When** the manifest gate runs, **Then** it fails with one finding naming the element and the
    member; a malformed manifest makes it report "could not run" (FR-009).
13. **Given** the Storybook, **When** it is built, **Then** it holds `ocelle-icon` stories for every icon in the set
    in light and dark and for the labelled and unknown-name states, and the stories render with the base stylesheet
    as every story does (FR-019).
14. **Given** 500 `ocelle-icon` elements on one page, **When** they render, **Then** every instance's shadow root
    adopts the same stylesheet object (one shared stylesheet, not one per instance), and no request outside the
    allowed list is made (FR-003).
15. **Given** a page whose HTML holds `<ocelle-icon name="close">` before the element module loads, **When** the
    module then loads, **Then** the existing element upgrades and draws the close glyph at the icon size, with no
    inline script or style on the page (FR-002, FR-004).

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
   `arrow-end`, `menu`, `close`, `folder`, `file`, `search`, `table`, `copy` (thirteen), the manifest type of `name` is
   the union of exactly these names, and the README names the consumer need each one meets (FR-017, FR-018).
2. **Given** each name, **When** `<ocelle-icon name="…">` renders, **Then** a non-empty drawing appears whose painted
   area stays inside the icon box, and no two names produce the same drawing (FR-017).
3. **Given** each drawing, **When** its source is read, **Then** it uses the shared 24-unit grid, one stroke width,
   round caps and joins, `currentColor` only, and no `style` attribute, `id`, `href`, `<use>`, `<image>`,
   `<foreignObject>`, `<script>` or event-handler attribute (FR-018, FR-010).
4. **Given** `dir="rtl"` on an ancestor, **When** `chevron-start`, `chevron-end`, `arrow-start` and `arrow-end`
   render, **Then** each points the opposite physical way from its left-to-right rendering (start points right, end
   points left), and, in the same test, `chevron-up`, `chevron-down`, `menu`, `close`, `folder`, `file`, `search`,
   `table` and `copy` render identically to their left-to-right rendering (FR-017).
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
   shrink when the host is narrow; **Given** the same under `dir="rtl"`, **Then** the icon sits before the label in
   the inline direction, which is to its right (FR-020, FR-021).
2. **Given** a bare `<svg slot="icon" viewBox="0 0 24 24">` with no `width` or `height`, and another
   `<svg slot="icon" viewBox="0 0 24 24" width="100" height="100">`, **When** they are measured with and without
   `base.css` linked, **Then** both boxes are `--ocelle-icon-size` square, not 0 px, 100 px or the 300 × 150 default,
   and each drawing is scaled to fill the box (FR-021, FR-022).
3. **Given** a bare `<svg slot="icon" viewBox="0 0 24 16">` and a bare `<svg slot="icon">` with neither `viewBox`
   nor size attributes, **When** they are measured with and without `base.css` linked, **Then** both boxes are
   `--ocelle-icon-size` square; the first drawing is scaled to the box's width and centred, aspect kept; for the
   second the convention promises the box only, and the README says a slotted SVG needs a `viewBox` to scale
   (FR-022).
4. **Given** the test host's text colour changes, **When** the slotted icon is measured, **Then** an `ocelle-icon`
   and a bare `<svg>` whose drawing uses `currentColor` take that colour (FR-021).
5. **Given** the test host with nothing in its icon slot, and on the same page the same host with an icon slotted,
   **When** both are measured, **Then** in the empty host the label starts at the host's content edge with no gap or
   empty box before it, while in the filled host the label starts one icon size plus the convention's gap from that
   edge (FR-021).
6. **Given** an icon-only test host named "Close" through the control's own label (for example `aria-label` on its
   inner control) with `<ocelle-icon slot="icon" name="close">`, **When** the accessibility tree is read, **Then** the
   control's name is exactly "Close" and the icon contributes no unignored node and no name to it (FR-013, FR-023).
   That a slotted icon is never given a `label` is a README rule (FR-023), checked as documentation, not a behaviour
   of this feature.
7. **Given** the README, **When** a later element author reads the slot convention, **Then** it names the slot
   (`icon`, and `trailing` for an end icon such as the action-row arrow), the size, alignment, gap and colour rules,
   the base-stylesheet interaction and the naming rule, so #7 and #12 can implement and test it without further
   design (FR-020, FR-023).
8. **Given** forced colours are emulated, **When** the test host shows a slotted icon, **Then** the icon is painted
   in the same system colour as the label (FR-015, FR-021).

---

### User Story 4 - The Ocelle brand mark (Priority: P4)

`ocelle-top-bar` (#12) and any host place the Ocelle rosette, a broken ring around an ochre spot, as an inline SVG
drawn from tokens only: on the dark chrome, on the light and dark main grounds, and as a one-colour mark in the
surrounding text colour. It stays recognisable in forced colours and makes no request.

**Why this priority**: The top bar needs it, but it is one consumer and depends on nothing else in this feature
beyond the element conventions.

**Independent Test**: Render the brand-mark element on each ground in both themes, in its one-colour form and in
forced colours, in the strict-CSP fixture; on that page, measure the painted colours, the size, the accessibility
tree and the absence of requests outside the allowed list and of CSP violations; run the contrast gate on the pairs.

**Acceptance Scenarios**:

1. **Given** `<ocelle-brand-mark>` on each main ground, **When** it renders in light and in dark, **Then** the ring
   is painted with `--ocelle-color-ink` and the spot with `--ocelle-color-accent` (FR-024, FR-025).
2. **Given** `<ocelle-brand-mark ground="chrome">` on `color-chrome` and on `color-chrome-hover`, **When** it renders
   in light and in dark, **Then** the ring is painted with `--ocelle-color-chrome-ink` and the spot with
   `--ocelle-color-accent`, the same in both themes (FR-025).
3. **Given** `<ocelle-brand-mark tone="mono">`, **When** it renders, **Then** ring and spot are both painted in the
   inherited text colour (`currentColor`), whatever the ground (FR-025; spec-kitty-design#504).
4. **Given** the contrast gate, **When** it runs, **Then** it verifies the pairs of FR-026 in
   `packages/tokens/contrast/pairs.json` (FR-026).
5. **Given** forced colours are emulated with a dark and a light system palette, **When** the mark renders in each
   variant in body text, inside a link and inside a native button, **Then** ring and spot are both painted in the
   context's system colour (`CanvasText` in text, `LinkText` in the link, `ButtonText` in the button), and the spot
   stays visible as a filled shape inside the ring (FR-027).
6. **Given** a mark with no `label` and, on the same page, a twin with `label="Ocelle"`, **When** the accessibility
   tree is read, **Then** the unlabelled mark contributes no unignored node and no name (the top bar's product name
   beside it carries the name), and the twin contributes exactly one image node named "Ocelle"; **Given**
   `label=" Ocelle "`, **Then** the name is "Ocelle"; **Given** `label=""` or `label="  "`, **Then** the mark is
   treated as unlabelled (FR-028).
7. **Given** no size set by the host, **When** the mark is measured, **Then** it is `--ocelle-icon-size` high and its
   width follows the drawing's square aspect; the host can set any other size on the element, and the drawing
   scales with it; in a non-square host box the drawing is scaled to the smaller side and centred, aspect kept
   (FR-024).
8. **Given** an unknown `ground` or `tone` value, **When** the mark renders, **Then** it renders as the default
   main-ground variant (FR-025).
9. **Given** the mark's drawing, **When** its source is compared with `sources/ocelle-docs-logo.reference.svg`,
   **Then** it has four open arcs with round caps and one rotated ellipse, and their arc endpoints, radii, stroke
   widths and the ellipse's centre, radii and rotation equal those of the reference's rosette group (the group inside
   the rounded square) up to one uniform scale and one translation, within 0.5 % of the drawing's width; it contains
   none of the reference's literal colours, its rounded square, a `style` attribute or an `id` (FR-024, FR-010).
10. **Given** the README and `NOTICE`, **When** they are read, **Then** they carry the trademark note of FR-030.
11. **Given** the Storybook, **When** it is built, **Then** it holds brand-mark stories for the main-ground, chrome and
    mono variants in light and dark (FR-019).
12. **Given** the committed manifest, **When** the manifest gate runs, **Then** it passes, and the manifest declares
    `ocelle-brand-mark` with its tag name, its `ground`, `tone` and `label` properties and their attributes (the types
    of `ground` and `tone` as the unions of their known values), and states that it has no slot, no event, no CSS
    part and no CSS custom property; the README names the tokens the mark reads (`--ocelle-icon-size`,
    `--ocelle-color-ink`, `--ocelle-color-chrome-ink`, `--ocelle-color-accent`) (FR-007, FR-008).

---

### Edge Cases

- **Base stylesheet and slotted SVG.** `base.css` gives every light-DOM `svg` `max-inline-size: 100%` and
  `block-size: auto`, and page rules beat a shadow tree's `::slotted()` and `:host` rules whatever their specificity.
  A bare `<svg>` slotted into a control is in the light DOM, so the slot convention must size it in a way those rules
  cannot undo (User Story 3 scenarios 2 and 3). An `ocelle-icon`'s own drawing is inside its shadow root and is not
  touched.
- **Host page styles the element.** A host rule such as `ocelle-icon { inline-size: 32px }` is allowed and wins; the
  drawing follows the host box. A host rule that sets only one dimension leaves the other at the icon size; in such a
  non-square box the drawing is scaled to the smaller side and centred, aspect kept (User Story 1 scenario 3).
- **Compact root.** The icon size is a `rem` token, so a host that changes the root font size rescales icons with
  the rest of the library; nothing in this feature sets a root font size. A host that wants another icon size in one
  subtree overrides the `--ocelle-icon-size` token there; that token is the sizing hook, not a custom property of the
  elements (FR-007).
- **Unknown name, empty name, name with surrounding spaces or different case.** Only exact names from the set draw
  (`Close` and ` close` draw nothing). No message is written to the console in the built output (User Story 1
  scenario 8).
- **Many icons on a page.** A page with 500 `ocelle-icon` elements renders them without a network request and
  without one stylesheet per element instance (styles are shared through adopted stylesheets; User Story 1 scenario
  14).
- **Forced colours and `forced-color-adjust`.** The drawings rely on `currentColor` and do not set
  `forced-color-adjust: none`; the system colour reaches them through inheritance.
- **Right-to-left.** Mirroring follows the element's computed direction, so `dir` on any ancestor, or on the element,
  takes effect. A control's `icon` slot sits before the label in the inline direction, so to its right under
  `dir="rtl"` (User Story 3 scenario 1).
- **Two copies of the package.** Two different versions of `@ocelle/elements` on one page cannot both define
  `ocelle-icon`; the first wins and the second import does not throw. The README says so.
- **Server-rendered pages.** A Thymeleaf page writes `<ocelle-icon name="close">` in its HTML before the script
  loads; until the element is defined the box is empty and has no size guarantee, and once defined it renders. No
  inline script or style is needed to place it (User Story 1 scenario 15).
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
- **FR-005**: Elements perform no I/O and make no network request; no drawing references an external resource. On
  the strict-CSP fixture (User Scenarios), a page with the elements makes no request outside the fixture's allowed
  list (the page, its scripts, its stylesheets and the vendored font, all same-origin).
- **FR-006**: Defining an element whose tag name is already defined does nothing and throws nothing.
- **FR-007**: `packages/elements/custom-elements.json` is generated from the element source and committed. It
  declares, for every element, its tag name, its class, every public property and attribute with type, default and
  description, and its events, slots, CSS parts and CSS custom properties (each list may be empty, and is then stated
  as empty). An `--ocelle-*` token of `@ocelle/tokens` that an element reads by inheritance (for example
  `--ocelle-icon-size`) is not one of the element's CSS custom properties and is not declared in its manifest entry:
  002 forbids an element to declare a custom property whose full name is a token's, and the token is already public
  surface of `@ocelle/tokens` (constitution VII). The README names, for each element, the tokens it reads, and
  overriding a token is the documented way to change what the element takes from it. An element that offers its own
  hook declares it as a CSS custom property in the `--ocelle-<element>-<property>` form that matches no token name.
  Both elements of this feature declare no CSS custom property.
- **FR-008**: The README of `@ocelle/elements` documents the conventions of FR-001 to FR-007, FR-019 and the file
  and test layout an element follows, so later element missions apply them without redesign.
- **FR-009**: A new `manifest` merge gate fails when the committed manifest differs from one generated from the
  current source, or when a public member of an element lacks a description; the public members are properties,
  attributes, events, slots, CSS parts and CSS custom properties. It reports "could not run" when the manifest or the
  source cannot be read or parsed. Its fail plants include one stale manifest and one undescribed member of each of
  those six kinds. It has fail, pass and breaking plants, is registered in
  `gates/gates.json`, runs as its own CI check, and is listed in `gates/README.md`.
- **FR-010**: No rendered drawing contains a `style` attribute, an `id`, an `href` or `xlink:href`, `<use>`,
  `<image>`, `<foreignObject>`, `<script>` or an event-handler attribute.

**`ocelle-icon`**

- **FR-011**: `ocelle-icon` renders one square box sized `--ocelle-icon-size` unless the host sizes the element, and
  its drawing scales to the box. A host may size one or both sides; in a non-square box the drawing is scaled to the
  smaller side and centred, aspect kept.
- **FR-012**: Every drawing is painted only with `currentColor`.
- **FR-013**: Without `label`, the icon is hidden from the accessibility tree and contributes no name to an ancestor.
- **FR-014**: With a non-empty `label` (property and attribute), the icon is exposed as one image with that name; an
  empty or whitespace-only `label` counts as none. The accessible name is the label with surrounding whitespace
  removed. `label` is not reflected.
- **FR-015**: In forced-colours mode the icon is painted in the system colour of its surrounding text and stays
  visible.
- **FR-016**: `name` (property and attribute, reflected) selects the drawing; an unknown, empty or missing name draws
  nothing, keeps the box, exposes nothing (even with a label), throws nothing and writes no console message in the
  built output; changing `name` replaces the drawing.

**The icon set**

- **FR-017**: The set is exactly the thirteen names of User Story 2 scenario 1 (the operator added `file` for the
  Artifact Viewer's file tree, SPEC-1-05). `chevron-start`, `chevron-end`,
  `arrow-start` and `arrow-end` follow the inline direction and mirror under right-to-left text; the others never
  mirror. Each name has a distinct drawing.
- **FR-018**: Every drawing is the project's own, on a 24-unit grid with one shared stroke width, round caps and
  joins, and `currentColor` only. The README lists every name with the consumer need it meets. The manifest type of
  `name` is the union of the thirteen names; the package exports no separate list of names. The names are public
  surface (constitution VII): renaming or removing one after 1.0.0 is MAJOR, adding one is MINOR.

**Stories**

- **FR-019**: Every element of this feature has a Storybook story per variant and state, in light and dark, in the
  existing Storybook workspace; the stories pass the `csp` and `prefix` gates' Storybook checks. Visual baselines and
  axe over the stories are added by #10, as the operator-approved triage 005 records. If this feature merges before
  #10, its stories are without baselines and axe until #10 lands, short of constitution III and V; the plan records
  that in Complexity Tracking with #10's merge as the sunset condition.

**Slot convention**

- **FR-020**: The README documents one slot convention for icons in controls: an `icon` slot before the label and,
  where an element has an end icon, a `trailing` slot after it; the size, alignment, gap and colour rules of FR-021;
  the base-stylesheet interaction of FR-022; and the naming rule of FR-023.
- **FR-021**: A control following the convention renders a slotted `ocelle-icon` or bare `<svg>` at
  `--ocelle-icon-size` square, not shrinking, centred on the label's first line, separated from the label by
  `--ocelle-space-2`, in the control's text colour; an empty slot takes no space and adds no gap.
- **FR-022**: The sizing of FR-021 holds for a bare `<svg>` with or without `width` and `height` attributes, with a
  square or non-square `viewBox` or none, on pages with and without the base stylesheet: the box is always
  `--ocelle-icon-size` square. A drawing with a `viewBox` is scaled into the box, centred, aspect kept. An SVG without
  a `viewBox` gets the box only; the README says a slotted SVG needs a `viewBox` to scale.
- **FR-023**: An icon-only control takes its accessible name from the control itself; a slotted icon stays decorative
  and is not given a `label`. The convention is proven by a test-only host element that ships in no package.

**Brand mark**

- **FR-024**: `ocelle-brand-mark` renders the Ocelle rosette (four open arcs of unequal weight with round caps around
  an elliptical spot), redrawn from the geometry of the reference in `sources/`, as inline SVG in its shadow root,
  `--ocelle-icon-size` high by default with its square aspect, scaling to any size the host sets.
- **FR-025**: Its variants: the default for the main grounds (ring `--ocelle-color-ink`, spot
  `--ocelle-color-accent`); `ground="chrome"` for the chrome, `color-chrome` and `color-chrome-hover` (ring
  `--ocelle-color-chrome-ink`, spot `--ocelle-color-accent`); and `tone="mono"` (ring and spot `currentColor`), which
  takes precedence over `ground`. Unknown values render the default. `ground` (known value `chrome`) and `tone`
  (known value `mono`) are properties and attributes, reflected. Its colours come from tokens only; no new token is
  needed. The spot follows the reference app icon's ochre (`#C68A1E`, `--ocelle-color-accent` in both themes), not
  the brand doc's "light ochre `#E0A23A` (accent on black)": no token has that value in both themes, it would need a
  new token, and the app icon's ochre already meets 3:1 on the chrome.
- **FR-026**: The contrast gate verifies, at 3:1 non-text: `color-ink` on each main ground and `color-chrome-ink` on
  each chrome ground, in both themes; `color-accent` on each chrome ground in both themes; and `color-accent` on each
  main ground in the dark theme. The ink and chrome-ink pairs are already rows of `packages/tokens/contrast/pairs.json`
  as text pairs at 4.5:1, which implies 3:1, so they need no new row. The `color-accent` pairs are added as non-text
  rows to `pairs.json`; the gate checks every listed row. Making their absence fail the gate needs `contrast` grounds
  on `color-accent` in `packages/tokens/src/source.ts`, which this feature does not touch (Assumptions "Tokens").
- **FR-027**: In forced-colours mode both parts of the mark, in every variant, are painted in `currentColor`, so in
  the system colour of their context as for icons (`CanvasText` in text, `LinkText` in a link, `ButtonText` in a
  button), and the spot stays a filled shape inside the ring.
- **FR-028**: Without `label` the mark is hidden from the accessibility tree and contributes no name to an ancestor;
  with a non-empty `label` (property and attribute, not reflected) it is one image with that name. As for the icon,
  an empty or whitespace-only `label` counts as none, and the name is the label with surrounding whitespace
  removed.

**Licence and records**

- **FR-029**: The README states that the icons and the mark are the project's own drawings under Apache-2.0;
  `THIRD_PARTY_NOTICES` is unchanged. Lit stays a runtime dependency of `@ocelle/elements` and is not bundled into
  `packages/elements/dist/`, so no Lit notice is reproduced; if a later change bundles it, its BSD-3-Clause notice is
  added to `THIRD_PARTY_NOTICES`.
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

- **SC-001**: Each of the thirteen icons and the three brand-mark variants renders in the strict-CSP fixture with
  zero CSP violations and zero requests outside the fixture's allowed list (the page, its scripts, its stylesheets
  and the vendored font, all same-origin), on the same page where its drawing is present and measured.
- **SC-002**: Every icon, standalone and slotted (as `ocelle-icon` and as a bare SVG, with and without the base
  stylesheet), measures exactly the icon size (20 × 20 px at the default root font size) unless the host sets a size.
- **SC-003**: In the accessibility tree (read as User Scenarios define), an unlabelled icon or mark contributes zero
  unignored nodes and no name; a labelled one contributes exactly one image node with its label; an icon-only
  control's name is exactly the control's own.
- **SC-004**: In forced colours, 100% of the painted parts of every icon and mark variant use the system colour of
  their context (`CanvasText` in text, `LinkText` in a link, `ButtonText` in a button).
- **SC-005**: Every brand-mark pair of FR-026 meets 3:1 in both themes, verified by the contrast gate.
- **SC-006**: The manifest gate fails on each of its fail plants, accepts its pass plants and reports "could not run"
  on its breaking plants, and the plants job checks that.
- **SC-007**: The README's slot convention names the slots (`icon`, `trailing`), the size, gap, alignment and colour
  rules, the base-stylesheet interaction and the naming rule, and the icon list maps `folder`, `file`, `search` and
  `table` to the kitty-mission-ui needs they replace, checked by a documentation test; with SC-002, no consumer-side
  size rule is needed (the expected outcome in kitty-mission-ui is in Consumer need).
- **SC-008**: The README's element conventions name module and registration, styles, manifest (including the token
  rule of FR-007), stories and the file and test layout, checked by a documentation test (the expected outcome for
  #7 is in Consumer need).

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
- **Tokens.** No token is added, so `packages/tokens/src/source.ts` (changed by #20) is not touched. The new contrast
  pairs of FR-026 are rows in `packages/tokens/contrast/pairs.json`, which the gate checks. Declaring `contrast`
  grounds on `color-accent` in the token source, so that a missing row fails the gate, is left until after #20 lands;
  until then, deleting an accent row is not caught by the gate.
- **Spot colour.** The chrome variant follows the reference app icon's spot (`#C68A1E` on `#15130F`), which is
  `--ocelle-color-accent`, not the brand doc's "light ochre `#E0A23A` (accent on black)" (FR-025).
- **Engines.** Only Chromium is measured. WebKit (Kitty Desktop) behaviour of the accessibility tree, forced colours
  and mirroring is an open limitation recorded in the README.
- **Environment.** The container runs Node 22 while CI pins 26.13.0; browser runs use `OCELLE_CHROMIUM_PATH`.
- **Out of scope.** `ocelle-button`, `ocelle-action-row` (#7), `ocelle-top-bar`, `ocelle-nav-item` (#12) and the
  accessible names of their icon-only modes; a busy spinner (#7); visual baselines and axe (#10); the token change of
  #20; favicons and app icons.
