# Feature Specification: Design Tokens

**Feature Branch**: `002-design-tokens` (work happens on `claude/kitty-ui-speckit-decouple-x3prkx`)

**Created**: 2026-11-03

**Status**: Draft

**Input**: User description: "Build the @ocelle/tokens package from issue #5 (triage/002-design-tokens.md): every --ocelle-* token for light and dark themes (system preference, light by default, data-theme on <html> overrides) including the dark chrome, link, rule, radius and target-size tokens, the vendored Schibsted Grotesk font with its OFL licence and THIRD_PARTY_NOTICES entry, the brand rules of constitution II enforced as checks, and the automated text and non-text contrast check as a CI gate with a planted defect under gates/plants/ (the gate deferred to #5 in gates/README.md); base styles stay with #6, Storybook and axe with #10."

**Issues**: #5 (triage record `triage/002-design-tokens.md`, approved by the operator). The body of #5 is the source
of the requirements below. Its content is copied into this spec as Appendix A ("the #5 token table"): every token,
group, light and dark value, derived source, use, excluded token and recorded contrast figure, and #5's two contrast
rules (its brand rules are those of constitution II and FR-019). The copy was made from the body of #5 as read
through the GitHub API on 2026-11-03 (issue created 2026-11-02T12:46:57Z, last edited 2026-11-02T13:11:46Z; GitHub
gives no edit id, so the edit time identifies the version). Appendix A, not the live issue, is the reference for
every requirement, test and success criterion of this feature; a later edit of #5 changes this feature only through
a change to this spec.

## Consumer need

Every element issue (#7 to #9, #12 to #17) and the base styles (#6) are blocked by this feature: constitution II
allows element CSS to use only `--ocelle-*` tokens, so no element can be styled, or pass the token-only style lint,
until the tokens exist. The named consumers are Kitty Desktop and Kitty Dashboard (kitty-mission-ui), which today use
55 `--sk-*` roles of the Spec Kitty design library, and the Ocelle web console, whose console prototype v2
(`prototype/css/tokens.css`) is the source of the values (#5, "Source"). The 44 px target size answers
spec-kitty-design#532 and the 19 rem inspector width replaces spec-kitty-design#505's 260 px.

## User Scenarios & Testing *(mandatory)*

The users of this feature are the authors of the base styles and elements of this library (people and agents), the
host pages that load `@ocelle/tokens` (the Ocelle console, Kitty Desktop's webview, Kitty Dashboard), and the
operator who reviews pull requests.

### User Story 1 - A host page gets every token, in the right theme (Priority: P1)

A host page loads the tokens stylesheet from `@ocelle/tokens`. Every `--ocelle-*` token of Appendix A is then
defined on the document. The values follow the user's system colour-scheme setting, are the light values when the
system states no preference, and follow `data-theme="light"` or `data-theme="dark"` on `<html>` when it is set,
whatever the system says. Tools that cannot read CSS (for example a design tool or a contrast script) read the same
tokens and values, per theme, from a JSON export in the same package.

**Why this priority**: every other issue of the library needs the tokens; without them nothing can be styled.

**Independent Test**: load the built stylesheet into a page in a real browser and read every token's computed value
under each of the six theme conditions (FR-006); compare with Appendix A. Read the JSON export and compare
it with the same table and with the stylesheet.

**Acceptance Scenarios**:

1. **Given** a page that loads the tokens stylesheet and a system with no colour-scheme preference, **When** the page
   renders, **Then** every colour token of Appendix A has its light value (for example
   `--ocelle-color-canvas` is `#F1EEE8`).
2. **Given** a system that prefers dark and no `data-theme` attribute, **When** the page renders, **Then** every
   colour, elevation and other theme-dependent token has its dark value (for example `--ocelle-color-canvas` is
   `#15130F` and `--ocelle-elevation-bar` is `none`).
3. **Given** a system that prefers light, **When** the page renders, **Then** every token has its light value.
4. **Given** a system that prefers dark and `data-theme="light"` on `<html>`, **When** the page renders, **Then**
   every token has its light value; **and given** a system that prefers light and `data-theme="dark"`, or no
   preference and `data-theme="dark"`, **Then** every token has its dark value.
5. **Given** a page that sets `data-theme` on `<html>` and later removes it, **When** the page re-renders, **Then**
   the tokens follow the system setting again.
6. **Given** a token of a theme-independent group (type, space, shape, size, shell, motion; FR-001), **When** it is
   read under each of the six theme conditions, **Then** its value is the same in all of them (for example
   `--ocelle-target-min` is `2.75rem` and `--ocelle-radius-2` is `4px` in all six).
7. **Given** a system that requests reduced motion, **When** the page renders, **Then** `--ocelle-motion-fast` and
   `--ocelle-motion-base` are `0ms`; without that request they are `120ms` and `200ms`.
8. **Given** the chrome grounds `color-chrome` and `color-chrome-hover`, **When** they are read in each theme,
   **Then** each has a relative luminance of at most 0.05 in both themes (FR-019 (e)), so the chrome is dark in both
   themes; **and given** the chrome text colours `color-chrome-ink` and `color-chrome-muted`, **Then** each has the
   same value in both themes and meets 4.5:1 on both chrome grounds (FR-016).
9. **Given** the JSON export, **When** a tool reads it, **Then** it lists every token of the stylesheet with its
   light and dark value (one value where the token does not depend on the theme), and no token that the stylesheet
   lacks.
10. **Given** the built package, **When** the strict-CSP and prefix gates run on it, **Then** both pass: the tokens
    ship as an external stylesheet with no inline style, and no `sk-` name or monospace family appears in it.
11. **Given** the token stories (FR-023), **When** Storybook is built and a group's story is rendered in light and in
    dark, **Then** it lists exactly that group's tokens with their name and value for that theme.
12. **Given** the built Storybook output (FR-023), **When** the `csp` gate runs with its widened scope, **Then** it
    scans that output and passes: no inline script, inline style element or style attribute remains in it.

---

### User Story 2 - The brand font ships with the tokens, offline (Priority: P2)

A host page that loads the tokens stylesheet gets Schibsted Grotesk (variable weight 400 to 900) from a font file
inside `@ocelle/tokens`, never from a network font service, with its SIL Open Font License beside the file and an
entry in `THIRD_PARTY_NOTICES`. Text set in `--ocelle-font-sans` renders in Schibsted Grotesk, and
`--ocelle-figures` gives tabular figures for ids and digests.

**Why this priority**: the brand depends on it, and constitution IV forbids loading it from anywhere else; but the
tokens are usable (with the fallback fonts) before the font lands.

**Independent Test**: build the package and check that the font file and its licence are in it and in the files
it publishes; load the stylesheet into a page served with the strict CSP plus the font allowance of FR-012 and no
network beyond the page's own origin, and check that the font is loaded from the package and used.

**Acceptance Scenarios**:

1. **Given** the built package, **When** its published file list is read, **Then** it contains
   `SchibstedGrotesk-wght.woff2`, byte-identical to the file at `schibsted/schibsted-grotesk@d485f61f`, and the OFL
   1.1 licence text of that font beside it.
2. **Given** `THIRD_PARTY_NOTICES`, **When** it is read, **Then** it lists Schibsted Grotesk with its licence, its
   source repository and commit, and where the file sits in the package, and no longer says that no third-party
   asset ships.
3. **Given** a page that loads the tokens stylesheet, **When** text styled with `font-family: var(--ocelle-font-sans)`
   renders at weights 400, 500, 600 and 800, **Then** the browser reports Schibsted Grotesk as the font used and
   makes no request outside the page's origin.
4. **Given** text styled with `font-variant-numeric: var(--ocelle-figures)`, **When** it renders, **Then** the digits
   `0` to `9` all have the same advance width.
5. **Given** the built stylesheet, **When** any `@font-face` source is read, **Then** it is a relative URL into the
   package; no absolute URL, font service or CDN appears.
6. **Given** a page that loads the tokens stylesheet under exactly the CSP of constitution IV
   (`default-src 'none'; script-src 'self'; style-src 'self'`, no `font-src`), **When** text styled with
   `--ocelle-font-sans` renders, **Then** it renders in a fallback family of `--ocelle-font-sans`, the only CSP
   violation reported is the blocked font file, and every token still has its value.

---

### User Story 3 - Contrast and brand rules are checked on every pull request (Priority: P3)

When a pull request changes a token value, CI recomputes the WCAG 2.x contrast of every text and non-text pair the
library relies on, in both themes, and fails when a pair falls below its threshold or no longer matches the figure
recorded for it. Further checks reject a token set that breaks a brand rule that can be checked on the tokens alone.
Each check has planted defects that prove it can fail, and the "Contrast check" row leaves the deferred gates.

**Why this priority**: the tokens must exist before they can be checked; the gates keep them right afterwards.

**Independent Test**: run the `contrast` and `brand-rules` gates on the repository (they pass and report how many
pairs and rules they checked); run the plant job, whose new plants (FR-020) each give exactly their expected outcome.

**Acceptance Scenarios**:

1. **Given** the tokens and the contrast pair list (FR-016), **When** the contrast gate runs, **Then** it computes the
   ratio of every pair in both themes, passes, and reports the number of pairs checked per theme, which is greater
   than zero, equals the number of pairs in the list for that theme, and is at least the number of required pairs
   (130 per theme with Appendix A, A.8).
2. **Given** a text pair whose ratio drops below 4.5:1 in one theme (for example `color-ink-muted` changed so that it
   is 4.3:1 on `color-inset`), **When** the gate runs, **Then** it fails with one finding naming the theme, the two
   tokens, the ratio and the threshold.
3. **Given** a non-text pair below 3:1 (for example `color-control-border` on `color-rail` in light), **When** the
   gate runs, **Then** it fails the same way with the 3:1 threshold.
4. **Given** a pair whose computed ratio differs from the figure recorded for it by more than the rounding of that
   figure (FR-017), **When** the gate runs, **Then** it fails and names the recorded and computed figures, even if
   both are above the threshold.
5. **Given** a pair list, **When** the gate runs, **Then** exactly one of these outcomes follows, and the gate never
   passes for any of them:
   - the list is empty or cannot be parsed: exit 2 (could not run), naming the file and the cause;
   - the list names a token that does not exist: exit 1, one finding `unknown token` naming the pair, the theme and
     the token;
   - the list lacks a pair that FR-016 requires (derived from the intended grounds recorded in the token source):
     exit 1, one finding `missing required pair` naming the theme, the foreground and the ground.
6. **Given** a token set in which a brand rule of FR-019 is broken (for example `color-link` set equal to
   `color-accent` in light, a second radius at 4 px, or a monospace family in `font-sans`), **When** the
   `brand-rules` gate runs, **Then** it fails naming the rule and the token.
7. **Given** the plant job, **When** it runs, **Then** every new gate has fail, pass and breaking plants that behave
   as `gates/README.md` requires, and the registry, CI jobs and FR-020 list of 001 include the new gate.
8. **Given** `gates/README.md` after this feature, **When** it is read, **Then** the contrast gate is in "The gates"
   table and the "Required checks" list, and the "Contrast check" row is gone from "Deferred gates".

---

### User Story 4 - Consumers can map their `--sk-*` roles to `--ocelle-*` tokens (Priority: P4)

The maintainers of kitty-mission-ui read a mapping table from each of the 55 `--sk-*` roles they use to the
`--ocelle-*` token that replaces it, with every dropped or merged role and its replacement listed (#5, "Coverage").

**Why this priority**: it is needed before kitty-mission-ui can switch, but not before the library's own elements
can be built.

**Independent Test**: check that the table has one row per role in the consumer's list (55, per #5), and that every
`--ocelle-*` name in it is a token of the stylesheet.

**Acceptance Scenarios**:

1. **Given** the mapping table, **When** its rows are counted, **Then** there are 55, each naming one `--sk-*` role and
   either an `--ocelle-*` token or "dropped" with the replacement to use.
2. **Given** a token name in the table, **When** it is looked up in the JSON export, **Then** it exists.
3. **Given** the prefix gate, **When** it runs, **Then** it passes: the mapping table sits outside the scanned
   packages, so the `--sk-*` names in it never reach package source or output.

---

### Edge Cases

- **Theme attribute with another value** (`data-theme="sepia"`, empty, or on an element other than `<html>`): the
  tokens follow the system setting as if the attribute were absent.
- **Theme attribute changed at run time**: the tokens follow the new value without a reload (custom properties
  re-resolve).
- **Tokens inside a shadow root**: custom properties inherit through shadow boundaries, so an element reads the
  document's tokens; the stylesheet itself is loaded once by the host, not per element.
- **Forced-colours mode**: the system replaces the colours; the token values are not used for contrast there. See
  FR-018.
- **Token derived from another** (`gutter` = `space-4`, `color-focus` = `color-accent-strong`, `measure-sheet` =
  `shell-main-max`): changing the source changes the derived token in both the stylesheet and the JSON export.
- **Font file unavailable at build time** (the vendored file is missing or altered): the build or the font test
  fails naming the file; it does not ship without the font or with a different file.
- **Contrast of a translucent colour** (`color-overlay`): it is not a text or UI-component colour and is not in the
  pair list; a pair that needs it is out of scope (dialogs are an element issue).
- **Ratio exactly on a threshold** (for example 3.02 rounding to 3.0): the gate compares unrounded ratios with the
  threshold, so 2.995 fails 3:1 even if it prints as 3.0.
- **Recorded figure wrong in #5**: if a figure recorded from #5 (Appendix A, A.7) does not match the computed ratio,
  the implementer corrects the recorded figure in the pair list with the reason in the commit and in the review, and
  the correction needs the operator's approval in that review, since it changes the operator's design data; the
  threshold check still decides the pair. Figures of pairs #5 does not record are recorded from their first
  computation and need no approval.

## Requirements *(mandatory)*

### Functional Requirements

**Tokens and themes (User Story 1)**

- **FR-001**: `@ocelle/tokens` MUST define every token of Appendix A as a CSS custom property named
  `--ocelle-<name>`, where `<name>` is the name in Appendix A (`color-canvas` → `--ocelle-color-canvas`). Every token
  belongs to exactly one of eight groups, the canonical group list used throughout this spec: **colour**, **type**,
  **space**, **shape**, **size**, **shell**, **elevation**, **motion**. Appendix A gives each token's group (the
  `measure-*`, `dialog-*`, `footer-h` and `bar-block-narrow` tokens are in **shell**; `easing-standard` is in
  **motion**). Colour and elevation are theme-dependent; the other six groups are theme-independent.
- **FR-002**: Token values MUST equal Appendix A's values for each theme. Tokens Appendix A gives as derived (its
  "Derived from" column) MUST be defined by reference to their source token, so they cannot drift apart. A value
  given once for both themes (#5's "same") is one value, not a derived token.
- **FR-003**: Tokens Appendix A excludes (A.6) MUST NOT exist: `color-proto`, `color-proto-bg`, `font-size-ui`,
  `font-size-body`, `font-size-title`, `radius-3`.
- **FR-004**: The tokens MUST ship as an external stylesheet in the package's published files (constitution IV); no
  part of the token output is an inline style, a style attribute or script that writes styles.
- **FR-005**: The theme MUST be selected as constitution II states: the system setting (`prefers-color-scheme`); light
  when the system states no preference; `data-theme="light"` or `"dark"` on `<html>` overrides the system. Any other
  value, or the attribute elsewhere, has no effect.
- **FR-006**: Theme selection MUST be tested in a real browser under six conditions: system light, system dark, no
  preference, system dark with `data-theme="light"`, system light with `data-theme="dark"`, no preference with
  `data-theme="dark"`; plus removal of the attribute at run time. Browsers may not expose "no preference" as a state
  distinct from "light"; the plan states how the no-preference condition is produced (browser emulation, or a test
  on the stylesheet that neither colour-scheme query matches).
- **FR-007**: The motion tokens are `motion-fast`, `motion-base` and `easing-standard` (Appendix A, A.5). Under
  `prefers-reduced-motion: reduce`, `--ocelle-motion-fast` and `--ocelle-motion-base` MUST be `0ms`;
  `--ocelle-easing-standard` keeps its value.
- **FR-008**: The package MUST publish a JSON export of the same tokens: per token its full name, its group (the
  canonical list of FR-001) and its value in light and dark (or one value when it does not depend on the theme), with
  derived tokens resolved to their value. The stylesheet and the JSON export MUST come from one source of truth in
  the repository, and a test MUST prove they agree token for token. That token source also records, for each
  foreground token of Appendix A, A.8, its contrast kind and its intended grounds, from which the contrast gate
  derives the required pairs (FR-016). #5 asks for the JSON export "for tools"; its consumers in this feature are the
  `contrast` and `brand-rules` gates and the token stories (FR-023); no external consumer is named yet.
- **FR-009**: The package's TypeScript entry MUST export the list of token names (and the JSON data), so elements and
  tests can refer to tokens by a typed name rather than a string literal.
- **FR-010**: The token-only style lint of 001 (FR-024 there) MUST also reject a `var(--ocelle-…)` reference in
  element and base-style CSS to a name that is not a token of this package, so a misspelt token cannot fall back
  silently. The token definitions themselves stay exempt from the token-only rule. The new rule MUST have a fail
  plant (a reference to a misspelt token, for example `var(--ocelle-color-canvs)`) and a pass plant (a reference to a
  real token) under `gates/plants/style-lint/`.

**Font (User Story 2)**

- **FR-011**: The package MUST contain `SchibstedGrotesk-wght.woff2` from `schibsted/schibsted-grotesk` at commit
  `d485f61f` (as #5 gives it), unmodified (its checksum recorded in the repository and checked by a test), and the
  font's SIL OFL 1.1 licence text in the same directory, both in the published files. The implementer records, next
  to the checksum and in `THIRD_PARTY_NOTICES`, the full 40-character commit id that `d485f61f` resolves to upstream
  and the upstream paths of the font file and of the licence file; if `d485f61f` does not resolve to exactly one
  commit, the phase stops and asks the operator.
- **FR-012**: The stylesheet MUST declare the font with `@font-face` (family "Schibsted Grotesk", weight range 400 to
  900) whose source is a relative URL to the vendored file. The package's documentation MUST state what a host's CSP
  needs to load it: `font-src 'self'` (or the origin that serves the package), the one addition to the constitution's
  `default-src 'none'; script-src 'self'; style-src 'self'`. Without it the fallback fonts apply.
- **FR-013**: `--ocelle-font-sans` and `--ocelle-font-display` MUST be
  `"Schibsted Grotesk", "Helvetica Neue", Arial, system-ui, sans-serif`, and `--ocelle-figures` MUST be
  `tabular-nums`. No token names a monospace family (constitution II; the prefix gate already rejects `monospace`).
- **FR-014**: `THIRD_PARTY_NOTICES` MUST list the font with its licence, source repository and commit, and the path of
  the file and licence in the package, replacing the sentence that no third-party asset ships.
- **FR-015**: Loading the font MUST make no request outside the origin that serves the page (constitution IV), shown
  by a browser test that records every request.

**Contrast and brand-rule gates (User Story 3)**

- **FR-016**: A contrast pair list in the repository MUST name every pair to check, per theme, with its kind (text,
  4.5:1; non-text, 3:1) and its recorded figure. The required pairs are those of Appendix A, A.8 (130 per theme with
  the current token set): every foreground token on every ground it is intended for, which includes every pair of
  A.7 that #5 records at or above its threshold. In addition, the pair list MUST carry the two below-threshold pairs
  #5 records (A.7: `color-control-border` on `color-accent-low`, #5 rule 1; `color-accent` on `color-canvas` in
  light, "ochre text never on bone") as excluded pairs with #5's reason. The intended grounds are recorded per foreground token in the token source (FR-008), and the gate
  derives the required pair set from them; the pair list cannot shrink it. A pair below its threshold that the
  design does not use MUST be listed as an excluded pair with a non-empty reason, not left out; an excluded pair is
  still computed and must still match its recorded figure, but its threshold is not applied. The pairs that are
  below threshold with Appendix A's values are listed in A.9. The pair list MAY hold pairs beyond the required set.
- **FR-017**: The contrast gate MUST compute each pair's ratio with the WCAG 2.x relative-luminance formula from the
  token values (resolving derived tokens), compare the unrounded ratio with the threshold, and compare it with the
  recorded figure at the figure's precision (a figure of `5.3` matches a computed ratio in [5.25, 5.35); `3.02`
  matches [3.015, 3.025)). Disabled ink is exempt from the threshold (WCAG 1.4.3 excludes inactive components) but
  MUST still match its recorded figure. Where #5 gives only a range (the state colours on their own backgrounds,
  5.3 to 9.4 in both themes), each pair's figure is recorded from its first computation and MUST lie in [5.25, 9.45).
- **FR-018**: Forced-colours mode (operator decision, 2026-11-03): this feature MUST check that the token output does
  not defeat forced colours: no `forced-color-adjust: none`, and no `@media (forced-colors: active)` rule that sets
  colour tokens to fixed values. This guard is rule (g) of the `brand-rules` gate (FR-019), and a fail plant with
  such a rule MUST fail it. Contrast of rendered elements in forced-colours mode is checked by the element issues
  and by axe in #10; #5's "including forced colours" is met by this guard together with that later check.
- **FR-019**: A brand-rule check MUST reject a token set that breaks any of these rules, which hold on token values
  alone: (a) no font token names a monospace family; (b) `color-link` differs from `color-accent` and meets 4.5:1 on
  `color-canvas` and `color-sheet` in both themes, and the pair `color-accent` on `color-canvas` in light is listed as
  an excluded text pair ("ochre text never on bone"); (c) exactly one radius token is 4 px (`radius-2`), `radius-row`
  is 6 px and `radius-pill` is 999 px; (d) `color-rule` and `color-rule-strong` are below 3:1 on `canvas` and `sheet`
  while `color-control-border` is at or above 3:1 on them, so the decorative rule cannot serve as a control boundary
  by mistake; (e) dark chrome, per token: `color-chrome` and `color-chrome-hover` each have a WCAG relative luminance
  of at most 0.05 in both themes (at that bound white text has at least 10.5:1 on them; Appendix A's values are 0.004
  to 0.020), and `color-chrome-ink` and `color-chrome-muted` each have the same value in both themes, their contrast
  being checked by their required pairs (FR-016); (f) the reduced-motion values of FR-007; (g) the forced-colours
  guard of FR-018. Brand rules that only hold in rendered elements (chrome used by the top bar, digests in groups of
  four, ochre fill never the only mark of state) are out of scope (Assumptions).
- **FR-020**: The checks of FR-016 to FR-019 MUST be two gates of the 001 gate framework: **`contrast`** (check
  "Contrast"; FR-016, FR-017, FR-021) and **`brand-rules`** (check "Brand rules"; FR-018, FR-019). Each has
  `pnpm run gate:<id>` with the exit contract of `gates/README.md` (0 checked, 1 findings, 2 could not run), an entry
  in `gates/gates.json`, a CI job, and fail, pass and breaking plants under `gates/plants/<id>/`. The `contrast` fail
  plants MUST include at least: a text pair below 4.5:1, a non-text pair below 3:1, a figure that no longer matches,
  a pair naming a missing token (`unknown token`), a pair list lacking a required pair (`missing required pair`), and
  an excluded pair without a reason; its breaking plants MUST include an empty pair list and an unparsable one. The
  `brand-rules` fail plants MUST include one per rule (a) to (g) of FR-019, (g) being a forced-colours override.
- **FR-021**: The `contrast` gate MUST report, on success, the number of pairs checked per theme; a run that checks
  zero pairs MUST exit 2, never 0. The `brand-rules` gate MUST report the number of rules checked.
- **FR-022**: `gates/README.md` MUST list the `contrast` and `brand-rules` gates in "The gates" and their checks
  ("Contrast", "Brand rules") in "Required checks on `main`", record the widened `csp` and `prefix` scopes of FR-023,
  and remove the "Contrast check" row from "Deferred gates"; the FR-020 list of 001 (`gates/lib/registry.ts`) MUST
  include both gates. The 001 plan's Complexity Tracking item "Contrast gate absent" is closed by a note in this
  feature's plan. Making the new checks required on `main` is the operator's change to the ruleset.

**Stories and mapping (User Stories 1 and 4)**

- **FR-023**: Token reference stories (operator decision, 2026-11-03): this feature MUST add a minimal Storybook to
  the workspace with one story per token group of FR-001's canonical list (colour, type, space, shape, size, shell,
  elevation, motion), each showing every token of its group with its name and value, in light and dark. The stories
  are generated from the token source of FR-008, so a token cannot be missing from them, and a test MUST prove each
  group's story lists exactly that group's tokens. Storybook MUST build with one command under the pinned versions.
  Its built output is held to the strict CSP of constitution IV with no exception (operator decision, 2026-11-03,
  SPEC-1-05): every inline script of the Storybook build is stripped or externalised to a same-origin file, and no
  inline style element or style attribute remains in the built output. The scope of the `csp` gate MUST be widened
  from `packages/*/dist/` to also cover the Storybook build output, and the scope of the `prefix` gate likewise, in
  `gates/gates.json` and `gates/README.md`; the `csp` gate MUST gain a fail plant with an inline script in the
  Storybook output and a pass plant with an external script there. If Storybook cannot be built without inline script
  under the pinned versions, the phase stops and asks the operator; no Complexity Tracking exception is taken without
  the operator's approval. The Storybook build gate, visual regression and axe stay with #10 (still deferred in
  `gates/README.md`); #10 builds on this Storybook rather than adding a second one.
- **FR-024**: A mapping table MUST map each of the 55 `--sk-*` roles kitty-mission-ui uses to its `--ocelle-*`
  token, listing each dropped or merged role with its replacement. It MUST live outside the three packages (for
  example in this feature's directory or the repository's docs) so no `sk-` name enters package source or output
  (constitution I), and a test MUST check that every `--ocelle-*` name in it is a token. Under constitution I the
  mapping table is documentation, not source: it is never built, imported or published, and the plan's Constitution
  Check confirms this reading. If kitty-mission-ui at the commit read uses a number of `--sk-*` roles other than 55,
  the phase stops and asks the operator. The 55 roles are read from the kitty-mission-ui repository (operator
  decision, 2026-11-03), which the operator gives this session read access to; the table records the commit of
  kitty-mission-ui it was read from, and only role names are taken from it (no code or values, constitution VI).
  If that repository cannot be read when User Story 4 is implemented, the phase stops and asks the operator.

**Versioning and records**

- **FR-025**: The package's changelog MUST record the token names as added public surface (constitution VII, MINOR;
  pre-1.0, so the version may stay below 1.0.0).
- **FR-026**: No value, name or asset is copied from the Spec Kitty design library (constitution VI): values come from
  Appendix A (#5, the operator's console prototype), and the font from its upstream repository.

### Key Entities

- **Token**: a named design value. Attributes: full name (`--ocelle-…`), group (one of the eight of FR-001), light
  value, dark value (or one value), source token if derived, description of its use, and for a foreground token its
  contrast kind and intended grounds (A.8).
- **Theme condition**: one of the six of FR-006; decides which value a theme-dependent token has.
- **Contrast pair**: foreground token, background token, theme, kind (text or non-text), threshold, recorded figure,
  and either "checked" or "excluded" with a reason.
- **Brand rule**: one rule of constitution II that a check can test on token values, with the tokens it reads.
- **Font asset**: the vendored file, its licence, its source repository and commit, and its checksum.
- **Role mapping**: an `--sk-*` role, its `--ocelle-*` replacement or "dropped" with the replacement to use.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of the tokens in Appendix A exist with their Appendix A value in each of the six theme conditions,
  and none of the six excluded tokens exists; checked by browser tests.
- **SC-002**: The stylesheet and the JSON export agree on 100% of tokens and values.
- **SC-003**: A page under the strict CSP of constitution IV plus `font-src 'self'` renders text in Schibsted Grotesk
  with zero requests outside its own origin and zero CSP violations.
- **SC-004**: The `contrast` gate checks every pair of FR-016 in both themes (the count it reports per theme equals
  the pair list's size for that theme and is at least 130), and every fail plant of the `contrast` and `brand-rules`
  gates is caught with exactly its expected finding by the plant job.
- **SC-005**: Changing any one checked token value so that a pair falls below its threshold makes the pull request's
  contrast check fail; restoring it makes it pass.
- **SC-006**: An element author who writes `var(--ocelle-color-canvs)` (misspelt) gets a style-lint failure naming
  the unknown token.
- **SC-007**: `gates/README.md` lists no deferred contrast gate, and every gate of the registry has a CI job and plants.
- **SC-008**: The built Storybook output passes the `csp` gate with the widened scope, and the `csp` fail plant with an
  inline script in that output is caught.

## Assumptions

- **Values are final for now.** Appendix A, copied from #5 as the operator gave it on 2 November 2026, is the source;
  the contrast figures in #5 are the first expected values (FR-017), corrected with a recorded reason and the
  operator's approval if a computation shows one is wrong.
- **Values #5 describes but does not give.** For five values #5 gives a description, not a value (A.4 and A.5, marked
  "described"): the light `elevation-raised` ("two soft shadows"), the light shadow of `elevation-row` and
  `elevation-seg`, and `dialog-max-inline` and `dialog-max-block` ("viewport minus two gutters"). The tests check the
  described structure (number of shadows, ring colour, dark values; the dialog sizes at a known viewport).
  The geometry and colour of the three light shadows are not in the repository; the plan obtains them from the
  operator before User Story 1 is implemented, and they are then added to Appendix A.
- **Pairs below threshold with Appendix A's values.** A.9 lists the required pairs that fall below their threshold
  with the current values. Two have a reason in #5 (rule 1; "ochre text never on bone"). Three do not:
  `color-control-border` on `color-inset` and on `color-hover-bg`, and `color-focus` on `color-chrome-hover` in light.
  Before the pair list is written, the operator decides for each whether it is an excluded pair (with the reason) or
  a value change; neither is decided by the implementer.
- **Theme selectors belong here.** #5 states the theme rule as part of the tokens, so the `prefers-color-scheme` and
  `data-theme` selectors ship in the tokens stylesheet; #6 (base styles) builds on them and does not repeat them.
- **Elements read tokens through inheritance.** The host loads the tokens stylesheet once on the document; elements
  do not adopt it per shadow root. How elements and base styles use the tokens is #6 and the element issues.
- **Rendered brand rules are not checked here.** Dark chrome on the top bar and rails, digests in groups of four, and
  "ochre fill never the only mark of state in light mode" depend on how elements use the tokens; the element issues
  and #10 (axe, visual regression) check them. This feature provides the tokens and records those rules in the
  package documentation.
- **Font fetch.** The implementer downloads the font file once from its upstream repository at the pinned commit;
  after that it is a committed file, checked by checksum, and no build step fetches anything.
- **CSP font allowance.** Constitution IV's CSP has no `font-src`; under `default-src 'none'` a font file is blocked.
  Hosts that want the brand font add `font-src 'self'` (FR-012). This is a host setting, not an exception in the
  library's output, so no constitution amendment is needed; the plan confirms this in its Constitution Check.
- **Mapping table is documentation.** Constitution I forbids `sk-` names "in source or build output". The mapping
  table of FR-024 names `--sk-*` roles as documentation for consumers; it is not source (FR-024).
- **kitty-mission-ui access.** The operator chose to read the 55 `--sk-*` roles from kitty-mission-ui; the session
  that implements User Story 4 needs read access to that repository.
- **Out of scope:** base styles, reset and typography classes (#6); the Storybook build gate, visual regression and
  axe (#10; the minimal Storybook of FR-023 ships here);
  elements (#7 to #9, #12 to #17); the release (#11).
- **#3** is done on `main` (triage 002) and is not part of this feature.

## Appendix A: the #5 token table

Copied from the body of #5 (read through the GitHub API on 2026-11-03; issue last edited 2026-11-02T13:11:46Z). Names
are given without the `--ocelle-` prefix. Where #5 joins tokens with `/` or `=` or abbreviates a suffix (`-bg`), the
tokens are written out one per row. Where #5 gives only a step of a scale (type sizes, line heights, weights), the
full token name is this spec's, following #5's own `font-size-ui` pattern; those names are marked *(name: spec)*.
"Derived from" means the token is defined by reference to its source (FR-002); "same" in #5 means one value for both
themes and is written as such.

### A.1 Colour (group **colour**, theme-dependent)

| Token | Light | Dark | Derived from | Use (#5) |
|---|---|---|---|---|
| `color-canvas` | `#F1EEE8` | `#15130F` | | bone, the page ground |
| `color-sheet` | `#FBFAF7` | `#211E18` | | facts sheet, cards, inputs |
| `color-pane` | `#FFFFFF` | `#1C1A15` | | detail reading pane |
| `color-panel` | `#F1EEE8` | `#15130F` | | list and inspector panels |
| `color-inspector` | `#F1EEE8` | `#15130F` | | right inspector, ruled off |
| `color-rail` | `#E9E5DD` | `#1C1A15` | | context sidebar |
| `color-inset` | `#E2DDD3` | `#302B23` | | wells, digest backgrounds |
| `color-ink` | `#15130F` | `#EDE9E1` | | |
| `color-ink-soft` | `#3F3A33` | `#CFC9BE` | | secondary headings |
| `color-ink-muted` | `#5E584F` | `#A39D92` | | |
| `color-rule` | `#D9D3C7` | `#3A342B` | | decorative |
| `color-rule-strong` | `#B9B1A2` | `#4D463A` | | decorative |
| `color-control-border` | `#8A8276` | `#7A7264` | | inputs, buttons, chips |
| `color-chrome` | `#15130F` | `#0D0C0A` | | top bar, icon rail, personal rail |
| `color-chrome-ink` | `#EDE9E1` | `#EDE9E1` | | on chrome |
| `color-chrome-muted` | `#A39D92` | `#A39D92` | | on chrome |
| `color-chrome-hover` | `#2A261F` | `#24211B` | | on chrome |
| `color-accent` | `#C68A1E` | `#C68A1E` (same) | | ochre fill |
| `color-on-accent` | `#15130F` | `#15130F` (same) | | black on the ochre fill |
| `color-accent-low` | `#F1E1C0` | `#3A2B10` | | selected rows, current nav |
| `color-accent-strong` | `#8F5E0F` | `#E0A23A` | | current bar, focus ring |
| `color-focus` | (`#8F5E0F`) | (`#E0A23A`) | `color-accent-strong` | focus ring |
| `color-current` | (`#8F5E0F`) | (`#E0A23A`) | `color-accent-strong` | current bar |
| `color-link` | `#84560D` | `#E0A23A` | | |
| `color-link-hover` | `#15130F` | `#F7F4EE` | | |
| `color-hover-bg` | `#E2DDD3` | `#2A261F` | | |
| `color-disabled-ink` | `#6F685D` | `#8C8579` | | |
| `color-disabled-bg` | `#E6E1D8` | `#2A261F` | | |
| `color-overlay` | `rgb(21 19 15 / 0.5)` | `rgb(0 0 0 / 0.65)` | | dialog backdrop |
| `color-danger` | `#A8322C` | `#E97373` | | |
| `color-danger-bg` | `#F6E2E0` | `#2E1616` | | |
| `color-warning` | `#7A5205` | `#E0A23A` | | |
| `color-warning-bg` | `#F4E6C8` | `#2E2410` | | |
| `color-success` | `#2F6B3A` | `#8FCB8F` | | |
| `color-success-bg` | `#E4EFE3` | `#15241A` | | |
| `color-info` | `#2C5E86` | `#A9C7E8` | | |
| `color-info-bg` | `#E6EDF3` | `#14202E` | | |
| `color-neutral` | `#5E584F` | `#A39D92` | | |
| `color-neutral-bg` | `#E6E1D8` | `#2A261F` | | |

### A.2 Type (group **type**, theme-independent)

| Token | Value | Derived from |
|---|---|---|
| `font-sans` | `"Schibsted Grotesk", "Helvetica Neue", Arial, system-ui, sans-serif` | |
| `font-display` | (as `font-sans`) | `font-sans` |
| `figures` | `tabular-nums` | |
| `font-size-xs` | `0.75rem` | |
| `font-size-sm` | `0.875rem` | |
| `font-size-md` | `1rem` | |
| `font-size-fact` | `1.0625rem` | |
| `font-size-lg` | `1.25rem` | |
| `font-size-xl` | `1.5rem` | |
| `font-size-2xl` | `1.875rem` | |
| `line-height-tight` *(name: spec)* | `1.15` | |
| `line-height-normal` *(name: spec)* | `1.45` | |
| `line-height-relaxed` *(name: spec)* | `1.55` | |
| `font-weight-regular` *(name: spec)* | `400` | |
| `font-weight-medium` *(name: spec)* | `500` | |
| `font-weight-strong` *(name: spec)* | `600` | |
| `font-weight-display` *(name: spec)* | `800` | |
| `tracking-display` | `-0.03em` | |

The `font-size-*` names follow #5's excluded `font-size-ui`; the sizes are given in #5 as "Sizes: `xs` 0.75 … rem".

### A.3 Space, shape, size (groups **space**, **shape**, **size**, theme-independent)

| Token | Group | Value | Derived from |
|---|---|---|---|
| `space-1` … `space-10` | space | `0.25`, `0.5`, `0.75`, `1`, `1.25`, `1.5`, `2`, `2.5`, `3`, `4` rem (in order) | |
| `gutter` | space | (`1rem`) | `space-4` |
| `radius-1` | shape | `2px` | |
| `radius-2` | shape | `4px` | |
| `radius-row` | shape | `6px` | |
| `radius-shell` | shape | `10px` | |
| `radius-pill` | shape | `999px` | |
| `border-width` | shape | `1px` | |
| `focus-width` | shape | `3px` | |
| `focus-offset` | shape | `2px` | |
| `bar-width` | shape | `3px` | |
| `ring-step` | shape | `1.5px` | |
| `target-min` | size | `2.75rem` (44 px; spec-kitty-design#532) | |
| `icon-size` | size | `1.25rem` | |
| `size-dot` | size | `0.45rem` | |
| `size-step` | size | `1.4rem` | |
| `size-avatar` | size | `1.6rem` | |
| `size-rail-item` | size | `2.5rem` | |
| `size-visually-hidden` | size | `1px` | |

### A.4 Shell and measure (group **shell**, theme-independent)

| Token | Value | Derived from |
|---|---|---|
| `shell-topbar-height` | `3.25rem` | |
| `shell-rail-width` | `3.25rem` | |
| `shell-sidebar-width` | `20rem` | |
| `shell-inspector-width` | `19rem` (replaces spec-kitty-design#505's 260 px) | |
| `shell-main-max` | `48rem` | |
| `shell-collapse-inspector` | `75rem` | |
| `shell-collapse-sidebar` | `45rem` | |
| `shell-height` | `100dvh` | |
| `footer-h` | `4.5rem` | |
| `measure-sheet` | (`48rem`) | `shell-main-max` |
| `measure-sentence` | (`48rem`) | `shell-main-max` |
| `measure-page` | `100%` | |
| `dialog-max-inline` | described: the viewport's inline size minus two `gutter` | `gutter` |
| `dialog-max-block` | described: the viewport's block size minus two `gutter` | `gutter` |
| `bar-block-narrow` | `calc(2 * target-min + 3 * space-2)` (decision bar) | `target-min`, `space-2` |

### A.5 Elevation and motion (group **elevation**, theme-dependent; group **motion**, theme-independent)

| Token | Group | Light | Dark | Derived from |
|---|---|---|---|---|
| `elevation-sheet` | elevation | `0 0 0 1px` `color-rule` | `0 0 0 1px` `color-rule` | `color-rule` |
| `elevation-raised` | elevation | described: two soft shadows | `0 0 0 1px` `color-rule-strong` | `color-rule-strong` (dark) |
| `elevation-row` | elevation | `color-control-border` ring plus a light shadow (shadow described) | `color-control-border` ring only | `color-control-border` |
| `elevation-seg` | elevation | `color-control-border` ring plus a light shadow (shadow described) | `color-control-border` ring only | `color-control-border` |
| `elevation-bar` | elevation | `0 -6px 16px rgb(21 19 15 / 0.05)` | `none` | |
| `motion-fast` | motion | `120ms` (`0ms` under reduced motion) | same | |
| `motion-base` | motion | `200ms` (`0ms` under reduced motion) | same | |
| `easing-standard` | motion | `cubic-bezier(0.22, 1, 0.36, 1)` | same | |

"Described" values are not given in #5; see Assumptions, "Values #5 describes but does not give". #5 gives no ring
width for `elevation-row` and `elevation-seg`; the plan takes it with the shadow values from the operator.

### A.6 Excluded tokens (MUST NOT exist)

`color-proto`, `color-proto-bg` (the console prototype's "Prototype" badge); `font-size-ui`, `font-size-body`,
`font-size-title` (dropped by the operator; use the scale); `radius-3` (dropped by the operator).

### A.7 Contrast figures recorded in #5 (WCAG 2.x)

#5 names the theme of a figure only where marked "(#5)". The other figures match the light values when computed
(for example `color-ink` on `color-canvas` is 16.0 in light and 15.3 in dark), so they are light figures; the dark
figure of those pairs is recorded from its first computation (FR-017).

| Foreground | Ground | Theme | Kind | #5 figure |
|---|---|---|---|---|
| `color-ink` | `color-canvas` | light | text | 16.0 |
| `color-ink` | `color-sheet` | light | text | 17.8 |
| `color-ink` | `color-accent-low` | light | text | 14.4 |
| `color-ink-soft` | `color-canvas` | light (#5) | text | 9.7 |
| `color-ink-soft` | `color-canvas` | dark (#5) | text | 11.3 |
| `color-ink-muted` | `color-canvas` | light | text | 6.1 |
| `color-ink-muted` | `color-sheet` | light | text | 6.7 |
| `color-ink-muted` | `color-rail` | light | text | 5.6 |
| `color-ink-muted` | `color-inset` | light | text | 5.2 |
| `color-link` | `color-canvas` | light | text | 5.5 |
| `color-link` | `color-sheet` | light | text | 6.1 |
| `color-link` | `color-rail` | light | text | 5.0 |
| each state colour (`danger`, `warning`, `success`, `info`, `neutral`) | its own `-bg` | both (#5) | text | range 5.3 to 9.4 |
| `color-chrome-ink` | `color-chrome` | light | text | 15.3 |
| `color-chrome-muted` | `color-chrome-hover` | light | text | 5.6 |
| `color-on-accent` | `color-accent` | both (same values) | text | 6.2 |
| `color-focus` | `color-sheet` | light | non-text | 5.3 |
| `color-focus` | `color-chrome` | light (#5) | non-text | 3.3 |
| `color-control-border` | `color-sheet` | light | non-text | 3.6 |
| `color-control-border` | `color-rail` | light (#5) | non-text | 3.02 |
| `color-control-border` | `color-accent-low` | light | non-text | 2.9 (below 3:1; #5 rule 1) |
| `color-accent` | `color-canvas` | light | text | 2.6 (below 4.5:1; "ochre text never on bone") |

#5's two contrast rules: (1) a control drawn on `color-accent-low` uses `color-accent-strong` for its border, since
`color-control-border` on `color-accent-low` is 2.9:1; (2) in light mode the ochre fill is never the only mark of
state on a light ground (2.6 to 3.0:1), pair it with `color-accent-strong` or with text.

### A.8 Required contrast pairs (intended grounds)

The **main grounds** are `color-canvas`, `color-sheet`, `color-pane`, `color-panel`, `color-inspector`, `color-rail`,
`color-inset`, `color-accent-low` and `color-hover-bg` (the grounds of #5's "Use" column on which content sits). The
token source records these intended grounds per foreground token (FR-008); each row is required in both themes.

| Foreground | Kind | Intended grounds | Pairs per theme |
|---|---|---|---|
| `color-ink`, `color-ink-soft`, `color-ink-muted`, `color-link`, `color-link-hover`, `color-disabled-ink`, `color-danger`, `color-warning`, `color-success`, `color-info`, `color-neutral` | text | every main ground | 99 |
| `color-danger`, `color-warning`, `color-success`, `color-info`, `color-neutral` | text | its own `-bg` | 5 |
| `color-disabled-ink` | text (threshold exempt, FR-017) | `color-disabled-bg` | 1 |
| `color-chrome-ink`, `color-chrome-muted` | text | `color-chrome`, `color-chrome-hover` | 4 |
| `color-on-accent` | text | `color-accent` | 1 |
| `color-focus` | non-text | every main ground, `color-chrome`, `color-chrome-hover` | 11 |
| `color-control-border` | non-text | every main ground except `color-accent-low` (#5 rule 1) | 8 |
| `color-accent-strong` | non-text | `color-accent-low` (#5 rule 1) | 1 |
| | | **total** | **130** |

Every pair of A.7 is in this set, except `color-control-border` on `color-accent-low` and `color-accent` on
`color-canvas` in light, which FR-016 requires the pair list to carry as excluded pairs (FR-019 (b)).

### A.9 Required or recorded pairs below threshold with Appendix A's values

Computed for this spec on 2026-11-03 with the WCAG 2.x formula; the gate's own computation decides.

| Pair | Theme | Ratio | Threshold | Status |
|---|---|---|---|---|
| `color-control-border` on `color-accent-low` | light, dark | 2.94, 2.88 | 3:1 | excluded, #5 rule 1 (`color-accent-strong` on it: 4.31, 6.13) |
| `color-accent` on `color-canvas` | light | 2.57 | 4.5:1 | excluded, "ochre text never on bone" |
| `color-control-border` on `color-inset` | light, dark | 2.80, 2.96 | 3:1 | open: operator decides (Assumptions) |
| `color-control-border` on `color-hover-bg` | light | 2.80 | 3:1 | open: operator decides (Assumptions) |
| `color-focus` on `color-chrome-hover` | light | 2.71 | 3:1 | open: operator decides (Assumptions) |
| `color-disabled-ink` on `color-rail`, `color-inset`, `color-accent-low`, `color-hover-bg`, `color-disabled-bg` | light | 4.38, 4.07, 4.27, 4.07, 4.23 | none (exempt) | checked against figure only |
| `color-disabled-ink` on `color-inset`, `color-accent-low`, `color-hover-bg`, `color-disabled-bg` | dark | 3.84, 3.75, 4.12, 4.12 | none (exempt) | checked against figure only |
