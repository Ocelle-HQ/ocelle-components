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
   `--ocelle-color-canvas` is `#F1EEE8` and `--ocelle-color-scheme` is `light`).
2. **Given** a system that prefers dark and no `data-theme` attribute, **When** the page renders, **Then** every
   colour and elevation token has its dark value (for example `--ocelle-color-canvas` is
   `#15130F`, `--ocelle-elevation-bar` is `none` and `--ocelle-color-scheme` is `dark`).
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
    dark in the Storybook preview (`iframe.html`), the Storybook page, under the Storybook page's CSP (FR-023),
    **Then** it lists exactly that group's tokens with their name and value for that theme, and the preview reports
    zero CSP violations, makes no request outside its origin, and has no rendered element whose computed
    `font-family` names a monospace family; a control element styled monospace is reported (FR-023). The build
    output contains no Storybook manager UI (no manager entry `index.html`, no `sb-manager/`, no `sb-addons/`), so
    the preview is the only Storybook page it ships (operator decision R1-01, 2026-11-04).
12. **Given** the built Storybook (FR-023), **When** the `csp` gate runs with its widened scope, **Then** it scans
    this repository's Storybook inputs, parsing the TypeScript ones as TypeScript, and the HTML entries of the
    output as `externalise.ts` leaves them (not the bundles under `storybook/dist/`, which scenario 11's run-time
    test covers; FR-023) and passes: no inline script, inline style element or style attribute remains in them, in
    markup or in a markup string literal (outside `storybook/scripts/`, FR-023), and no `eval` or `new Function`.
13. **Given** the Storybook UI theme (FR-023), **When** a test imports `.storybook/manager.ts`, **Then** the theme's
    `fontBase` and `fontCode` are the family list of `--ocelle-font-sans`. (The manager is not shipped by this
    feature's build, scenario 11; the theme is kept and tested so that #10 brings the manager back with the token
    fonts.)

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
   renders at weights 400, 500, 600 and 800, **Then** the browser reports Schibsted Grotesk as the platform font
   actually used to render that text (not merely the declared family list), the font file was requested from the
   page's origin, and no request goes outside the page's origin.
4. **Given** text styled with `font-variant-numeric: var(--ocelle-figures)`, **When** it renders in Schibsted
   Grotesk, **Then** its computed `font-variant-numeric` is `tabular-nums` and the digits `0` to `9` all have the
   same advance width.
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
   than zero, equals the number of pairs in the list for that theme (excluded pairs count as checked, FR-016), and is
   at least the number of required pairs (149 per theme with Appendix A, A.8; with the excluded pairs of A.9 the list
   has 158 light and 157 dark entries).
2. **Given** a text token changed so that a pair drops below 4.5:1 in one theme, with the recorded figures of its
   pairs updated to the new value (for example `color-ink-muted` changed so that it is 4.3:1 on `color-inset` in
   light; it is then also 4.3:1 on `color-hover-bg`, which has the same light value, and below 4.5:1 on
   `color-accent-low`), **When** the gate runs, **Then** it fails with a `below-threshold` finding for each pair
   under the threshold (three in the example), each naming the theme, the two tokens, the ratio and the threshold.
3. **Given** a non-text token changed so that a pair drops below 3:1, with the recorded figures of its pairs updated
   to the new value (for example `color-control-border` changed so that it is below 3:1 on `color-rail` in light;
   it is 3.02 with Appendix A's values), **When** the gate runs, **Then** it fails the same way, with a
   `below-threshold` finding for each required pair under the 3:1 threshold.
4. **Given** a pair whose computed ratio differs from the figure recorded for it by more than the rounding of that
   figure (FR-017), **When** the gate runs, **Then** it fails and names the recorded and computed figures, even if
   both are above the threshold. A pair that both mismatches its figure and is below its threshold gives both
   findings, `figure-mismatch` first.
5. **Given** a pair list, **When** the gate runs, **Then** exactly one of these outcomes follows, and the gate never
   passes for any of them:
   - the list is empty or cannot be parsed: exit 2 (could not run), naming the file and the cause;
   - the list names a token that does not exist: exit 1, one finding `unknown-token` naming the pair, the theme and
     the token;
   - the list lacks a pair that FR-016 requires (derived from the intended grounds recorded in the token source):
     exit 1, one finding `missing-required-pair` naming the theme, the foreground and the ground;
   - the list carries a required pair as an excluded pair: exit 1, one finding `required-pair-excluded` naming the
     theme, the foreground and the ground.
6. **Given** a token set in which a brand rule of FR-019 is broken (for example `color-link` set equal to
   `color-accent` in light, a second radius at 4 px, a radius token outside the closed set of FR-019 (c), a
   monospace family in `font-sans`, or the excluded pair `color-accent` on `color-canvas` removed from the pair
   list), **When** the
   `brand-rules` gate runs, **Then** it fails naming the rule and the token.
7. **Given** the plant job, **When** it runs, **Then** both new gates (`contrast` and `brand-rules`) have fail, pass
   and breaking plants that behave as `gates/README.md` requires, and the registry, CI jobs and FR-020 list of 001
   include both gates.
8. **Given** `gates/README.md` after this feature, **When** it is read, **Then** the `contrast` and `brand-rules` gates
   are in "The gates" table and their checks ("Contrast", "Brand rules") in the "Required checks" list, the widened
   scopes of the `csp` and `prefix` gates (FR-023) are recorded, and the "Contrast check" row is gone from "Deferred
   gates".

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
- **Forced-colours mode**: the system replaces the colours; the token values are not used for contrast there. A
  `box-shadow` is not drawn in forced colours, so the rings and shadows of the `elevation-*` tokens vanish there; an element that uses one to mark a state or a boundary also draws a border or outline. See FR-018.
- **Token derived from another** (`gutter` = `space-4`, `color-focus` = `color-accent-strong`, `measure-sheet` =
  `shell-main-max`): changing the source changes the derived token in both the stylesheet and the JSON export.
- **Font file unavailable at build time** (the vendored file is missing or altered): the build or the font test
  fails naming the file; it does not ship without the font or with a different file.
- **Contrast of a translucent colour** (`color-overlay`): it is not a text or UI-component colour and is not in the
  pair list; a pair that needs it is out of scope (dialogs are an element issue).
- **Ratio just below a threshold** (for example 2.995, which prints as 3.0 at one decimal): the gate compares
  unrounded ratios with the threshold, so 2.995 fails 3:1.
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
  real token) under `gates/plants/style-lint/`. Element custom properties (constitution I: public CSS custom
  properties of an element, declared in the custom-elements manifest) are by convention named
  `--ocelle-<element>-<property>`, where `<element>` is the element's tag name without `ocelle-` (`ocelle-button` →
  `--ocelle-button-gap`). The rule exempts exactly the custom property names the manifest declares (the
  `cssProperties[].name` of each declaration), not a name prefix (operator decisions 2026-11-03, squad round 1,
  PLAN-FRESH-1-007, and squad round 2, PLAN-FRESH-2-003 (a)): a misspelt element property such as
  `var(--ocelle-button-gpa)` is an unknown token even when `ocelle-button` exists. Element names are not restricted
  by the token names (`ocelle-icon` and `ocelle-dialog` remain available); only a declared element property whose
  full name equals a token's full name is a clash, which makes the rule fail to load (exit 2). The rule MUST have a
  pass plant referencing a property a fixture manifest declares (`--ocelle-button-gap`) and a fail plant referencing
  a misspelt one (`var(--ocelle-button-gpa)`) against the same manifest. The manifest is a committed file at
  `packages/elements/custom-elements.json` (constitution I treats it as public surface), kept current by the element
  features; an element's CSS can reference a new element property only once the manifest declares it. While the
  file does not exist (no element yet), the declared list is empty (PLAN-FRESH-2-004).

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
  4.5:1; non-text, 3:1) and its recorded figure. The required pairs are those of Appendix A, A.8 (149 per theme with
  the current token set): every foreground token on every ground it is intended for, which includes every pair of
  A.7 that #5 records at or above its threshold. In addition, the pair list MUST carry, in each theme where it
  applies, every excluded pair of A.9 with its reason: `color-control-border` on `color-accent-low` (#5 rule 1);
  `color-control-border` on `color-inset` and on `color-hover-bg` (#5 rule 1 extended to these grounds, operator
  decision 2026-11-03, SPEC-2-01: a control drawn on them uses `color-accent-strong` for its border);
  `color-control-border` on each state `-bg` (`color-danger-bg`, `color-warning-bg`, `color-success-bg`,
  `color-info-bg`, `color-neutral-bg`; #5 rule 1 extended again, operator decision 2026-11-03, squad round 1, plan
  Decisions 7); `color-accent` on `color-canvas` in light ("ochre text never on bone"). The intended grounds are recorded per foreground token in
  the token source (FR-008), and the gate derives the required pair set from them; the pair list cannot shrink it. A
  pair below its threshold that the design does not use MUST be listed as an excluded pair with a non-empty reason,
  not left out; an excluded pair is still computed and must still match its recorded figure, but its threshold is
  not applied. An excluded pair counts among the pairs checked (FR-021). Only a pair outside the required set may be
  excluded: a required pair present in the list as an excluded pair is the finding `required-pair-excluded` (check 3,
  SPEC-3-02); to stop requiring a pair, the intended grounds in the token source must change, which is a visible
  design change. The pairs that are below threshold with Appendix A's values are listed in A.9. The pair list MAY
  hold pairs beyond the required set.
- **FR-017**: The contrast gate MUST compute each pair's ratio with the WCAG 2.x relative-luminance formula from the
  token values (resolving derived tokens with the same resolver as the JSON export, FR-008; `color-focus` and
  `color-current` resolve to `color-accent-strong`'s value per theme, and whether a token is opaque is judged on its
  resolved value), compare the unrounded ratio with the threshold, and compare it with the
  recorded figure at the figure's precision (a figure of `5.3` matches a computed ratio in [5.25, 5.35); `3.02`
  matches [3.015, 3.025)). Disabled ink is exempt from the threshold (WCAG 1.4.3 excludes inactive components) but
  MUST still match its recorded figure. Where #5 gives only a range (the state colours on their own backgrounds,
  5.3 to 9.4 in both themes), each pair's figure is recorded from its first computation and MUST lie in [5.25, 9.45).
- **FR-018**: Forced-colours mode (operator decision, 2026-11-03): this feature MUST check that the token output does
  not defeat forced colours: no `forced-color-adjust: none`, and no `@media (forced-colors: …)` rule that sets a
  colour token (`--ocelle-color-*`) to anything other than a CSS system colour keyword (`Canvas`, `CanvasText`,
  `LinkText`, `ButtonBorder`, `Highlight` and the others of CSS Color 4); mapping a colour token to a system colour is
  allowed (operator decision 2026-11-03, squad round 1, PLAN-A11Y-SECURITY-1-011). This guard is rule (g) of the
  `brand-rules` gate (FR-019); a fail plant with a fixed value MUST fail it and a pass plant mapping a colour token to
  a system colour MUST pass. The behaviour of rendered elements in forced-colours mode is checked by the element
  issues with element tests under forced-colours emulation (axe has no forced-colours rule); #5's "including forced
  colours" is met by this guard together with those tests. The package documentation states that `box-shadow` is not
  drawn in forced colours, so the `elevation-*` rings vanish there and an element that uses one for a state or a
  boundary also draws a border or outline.
- **FR-019**: A brand-rule check MUST reject a token set that breaks any of these rules, which hold on token values
  alone: (a) no font token names a monospace family; (b) `color-link` differs from `color-accent` and meets 4.5:1 on
  `color-canvas` and `color-sheet` in both themes, and the pair `color-accent` on `color-canvas` in light is listed as
  an excluded text pair ("ochre text never on bone"); (c) the radius tokens are exactly the closed set `radius-1`
  (2 px), `radius-2` (4 px, the one radius of constitution II), `radius-row` (6 px), `radius-shell` (10 px) and
  `radius-pill` (999 px), each with that value: any other `radius-*` token, a missing one or a different value fails
  (operator decision 2026-11-03, SPEC-2-03; the named use of each is in A.3); (d) `color-rule` and
  `color-rule-strong` are below 3:1 on `canvas` and `sheet` while `color-control-border` is at or above 3:1 on
  them, so the decorative rule cannot serve as a control boundary by mistake; (e) dark chrome, per token:
  `color-chrome` and `color-chrome-hover` each have a WCAG relative luminance of at most 0.05 in both themes (at that bound white text has at least 10.5:1 on them; Appendix A's values are 0.004
  to 0.020), and `color-chrome-ink` and `color-chrome-muted` each have the same value in both themes, their contrast
  being checked by their required pairs (FR-016); (f) the reduced-motion values of FR-007; (g) the forced-colours
  guard of FR-018. Brand rules that only hold in rendered elements (chrome used by the top bar, digests in groups of
  four, ochre fill never the only mark of state) are out of scope (Assumptions).
- **FR-020**: The checks of FR-016 to FR-019 MUST be two gates of the 001 gate framework: **`contrast`** (check
  "Contrast"; FR-016, FR-017, FR-021) and **`brand-rules`** (check "Brand rules"; FR-018, FR-019). Each has
  `pnpm run gate:<id>` with the exit contract of `gates/README.md` (0 checked, 1 findings, 2 could not run), an entry
  in `gates/gates.json`, a CI job, and fail, pass and breaking plants under `gates/plants/<id>/`. The `contrast` fail
  plants MUST include at least: a text pair below 4.5:1, a non-text pair below 3:1, a figure that no longer matches,
  a pair naming a missing token (`unknown-token`), a pair list lacking a required pair (`missing-required-pair`), an
  excluded pair without a reason, and a required pair listed as excluded (`required-pair-excluded`); its breaking
  plants MUST include an empty pair list and an unparsable one. The `brand-rules` fail plants MUST include one per rule (a) to (g) of FR-019, (g) being a forced-colours override, and
  one for (b) with the excluded pair `color-accent` on `color-canvas` removed from the pair list.
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
  group's story lists exactly that group's tokens. Storybook MUST build with one command under the pinned versions,
  and the build MUST make no network request (Storybook's telemetry disabled). Storybook is held to the strict CSP of
  constitution IV (operator decisions 2026-11-03, SPEC-1-05 and SPEC-3-01), with two exceptions to constitution IV the
  operator decided in squad round 1 and ruled exceptions on 2026-11-03 (analysis C1), each recorded in the plan's
  Complexity Tracking with scope, rationale and the sunset "reviewed when #10 extends this Storybook":
  - **Run time** (PLAN-A11Y-SECURITY-1-001; narrowed to the preview by operator decision R1-01, 2026-11-04, phase 3
    review round 1): the token reference under the strict CSP is the Storybook preview (`iframe.html`) alone, and it
    is the Storybook page. The preview loads its story index with `fetch` (`connect-src`). The Storybook page is
    served with the CSP of constitution IV plus the host additions `font-src 'self'` and `connect-src 'self'`, for
    the Storybook page only, recorded in the plan's Complexity Tracking; `frame-src` is not added, because nothing
    frames the preview. Under exactly that header the preview MUST run with zero CSP violations, shown by a browser
    test that also asserts the header served. Storybook's manager UI cannot run under that header (it injects
    `<style>` elements at run time; reviews/phase-3/spike.md), so the build MUST NOT ship it: the build output MUST
    contain no manager entry (`index.html`), no `sb-manager/` and no `sb-addons/`, and a test MUST assert their
    absence. The package output (`packages/*/dist/`) gets no such addition.
  - **Static scope** (PLAN-FRESH-1-001, narrowed again by PLAN-FRESH-2-001 (a), operator decision 2026-11-03,
    squad round 2): the static `csp` and `prefix` gates cover this repository's Storybook inputs before bundling:
    `storybook/stories/`, `storybook/.storybook/` (including its HTML head templates), `storybook/scripts/`,
    `storybook/.generated/` (the generated token and swatch stylesheets), and the HTML entries of the build output
    as `externalise.ts` leaves them (`storybook/dist/*.html`). Every bundle under `storybook/dist/` (the Vite-built
    preview bundle, which compiles in Storybook's own preview runtime, and the scripts and styles `externalise.ts`
    moves out of the HTML; the manager's `sb-addons/` and `sb-manager/` are not shipped, see Run time) is left to the
    run-time test, because Storybook's runtime code is bundled together with this repository's stories and no
    static fence can separate the two. This narrows SPEC-1-05's "no style attribute remains in the built output"
    to this repository's inputs and the HTML entries; the narrowing is recorded in `gates/gates.json` and
    `gates/README.md`. In this scope (operator decision 2026-11-03, squad round 3, PLAN-FRESH-3-001 (a)) the `csp`
    gate parses TypeScript inputs as TypeScript and applies its dynamic-code rules and its markup rules to string
    and template literals; HTML files get the markup rules; CSS files are counted. Markup literals in
    `storybook/scripts/` are exempt, because the externaliser names the tags it moves; the dynamic-code rules still
    apply there. Package source stays outside the `csp` gate.

  In the files in scope, every inline script is stripped or externalised to a same-origin file, and no inline style
  element or style attribute remains. The scope of the `csp` gate MUST be widened from `packages/*/dist/` to the
  Storybook files in scope, and the scope of the `prefix` gate likewise (the Storybook workspace's own source, its
  generated stylesheets and the HTML entries), in `gates/gates.json` and `gates/README.md`; the `csp` gate MUST gain
  a fail plant with an inline script in a Storybook HTML entry and a pass plant with an external script there, fail
  plants with a style attribute in a markup string in a story file and with `new Function` in
  `.storybook/preview.ts`, and a pass plant for the `storybook/scripts/` exception. The
  work starts with a spike that records every CSP violation of the built Storybook by directive under the header
  above; its first output is the `csp` gate's findings on the Vite preview bundle and on `sb-addons/` (recorded
  for the review, not a gate result), and it then runs the widened `csp` and `prefix` gates on the files in scope.
  If Storybook cannot reach zero violations under that header, or its files in scope cannot be freed of inline
  script, the phase stops and asks the operator; no further Complexity Tracking exception is
  taken without the operator's approval. Storybook's own UI theme is set so that it uses the token fonts (`fontBase`
  and `fontCode` set to `--ocelle-font-sans`'s family list, which a unit test MUST check). The run-time test MUST also
  assert that no rendered element of the preview, for each story in each theme, has a computed
  `font-family` naming a family on the `prefix` gate's monospace list, with a control element styled monospace that
  it MUST report (PLAN-FRESH-3-002). If that run-time check finds a monospace family that the theme cannot remove,
  or the token stories draw text on a canvas, the phase likewise stops and asks the operator. The Storybook build gate,
  visual regression and axe stay with #10 (still deferred in `gates/README.md`); #10 builds on this Storybook rather
  than adding a second one.
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
  Appendix A (#5, the operator's console prototype), and the font from its upstream repository. Values read from the
  console prototype's `prototype/css/tokens.css` (SPEC-2-02) are taken as values only; no code is copied from it
  (constitution VI). This requirement has no behaviour a test could fail on (constitution VIII, exemption); it is
  shown by review: every value is traced to Appendix A or to the prototype file the plan records, and the font to
  its upstream checksum (FR-011).

### Key Entities

- **Token**: a named design value. Attributes: full name (`--ocelle-…`), group (one of the eight of FR-001), light
  value, dark value (or one value), source tokens if derived, and for a foreground token its contrast kind and
  intended grounds (A.8). Its use (Appendix A's "Use" column) is recorded as a comment in the token source, not as
  data (operator decision 2026-11-03, squad round 1, PLAN-TESTABILITY-1-003).
- **Theme condition**: one of the six of FR-006; decides which value a theme-dependent token has.
- **Contrast pair**: foreground token, background token, theme, kind (text or non-text), threshold, recorded figure,
  and either "checked" or "excluded" with a reason.
- **Brand rule**: one rule of constitution II that a check can test on token values, with the tokens it reads.
- **Font asset**: the vendored file, its licence, its source repository and commit, and its checksum.
- **Role mapping**: an `--sk-*` role, its `--ocelle-*` replacement or "dropped" with the replacement to use.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of the tokens in Appendix A exist with their Appendix A value in each of the six theme conditions,
  and none of the six excluded tokens exists; checked by browser tests against Appendix A transcribed into the
  tests (not read from the token source). The values the plan supplied (the light `color-chrome-hover`, the light
  shadows and ring width of A.5, the dialog sizes of A.4) are now in Appendix A.
- **SC-002**: The stylesheet and the JSON export agree on 100% of tokens and values.
- **SC-003**: A page under the strict CSP of constitution IV plus `font-src 'self'` renders text in Schibsted Grotesk
  with zero requests outside its own origin and zero CSP violations.
- **SC-004**: The `contrast` gate checks every pair of FR-016 in both themes (the count it reports per theme equals
  the pair list's size for that theme, excluded pairs included, and is at least 149; a test asserts that the
  required set derived from the token source equals A.8), and every fail plant of the
  `contrast` and `brand-rules` gates is caught with exactly its expected findings (every finding its planted
  change gives, listed in its `plant.json`) by the plant job.
- **SC-005**: Changing any one checked token value so that a pair falls below its threshold makes the pull request's
  contrast check fail; restoring it makes it pass.
- **SC-006**: An element author who writes `var(--ocelle-color-canvs)` (misspelt) gets a style-lint failure naming
  the unknown token.
- **SC-007**: `gates/README.md` lists no deferred contrast gate, and every gate of the registry has a CI job and plants.
- **SC-008**: The Storybook files in the `csp` gate's widened scope (FR-023) pass it, the `csp` fail plants with an
  inline script in a Storybook HTML entry, a style attribute in a story file's markup string and `new Function` in
  `.storybook/preview.ts` are caught, the built Storybook preview (`iframe.html`, its bundles included) runs with
  zero CSP violations under the Storybook page's header of FR-023 and with no monospace computed font on any
  rendered element of the preview, and the build output contains no manager UI (`index.html`, `sb-manager/`,
  `sb-addons/`; operator decision R1-01, 2026-11-04).

## Assumptions

- **Values are final for now.** Appendix A, copied from #5 as the operator gave it on 2 November 2026, is the source;
  the contrast figures in #5 are the first expected values (FR-017), corrected with a recorded reason and the
  operator's approval if a computation shows one is wrong.
- **Values #5 describes but does not give.** For five values #5 gives a description, not a value: the light
  `elevation-raised` ("two soft shadows"), the light shadow of `elevation-row` and `elevation-seg`, and
  `dialog-max-inline` and `dialog-max-block` ("viewport minus two gutters"); #5 also gives no ring width for
  `elevation-row` and `elevation-seg`. The plan supplied them (research R-05) and they are now in A.4 and A.5, each
  marked with its source. The tests check these exact values; the dialog sizes are also checked as used sizes at a
  known viewport (1280 × 800: 1248 px and 768 px).
- **Light shadows and ring width from the prototype file** (operator decision 2026-11-03, SPEC-2-02). The exact light
  shadows of `elevation-raised`, `elevation-row` and `elevation-seg` (offsets, blur, spread, colour) and the ring width
  of `elevation-row` and `elevation-seg` are taken from `prototype/css/tokens.css` of the console prototype v2, which
  the operator supplied as a table rendering, kept as `sources/console-v2-tokens.md` (SHA-256 recorded in research
  R-05). Only the values are taken, no code (constitution VI, FR-026). The values are in A.5.
- **Dialog size unit.** #5's "the viewport's inline (block) size" left the viewport unit open. The plan fixed it from
  the prototype file: `100vw` inline and `100dvh` block (A.4).
- **Pairs below threshold with Appendix A's values** (operator decisions 2026-11-03, SPEC-2-01). A.9 lists the required
  or recorded pairs that fall below their threshold. `color-control-border` on `color-inset` and on `color-hover-bg`
  are handled like #5's rule 1: a control drawn on these grounds uses `color-accent-strong` for its border, so those
  pairs are excluded pairs and `color-accent-strong` on them is required instead (A.8). The same holds for a control
  drawn on any state `-bg` (`color-danger-bg`, `color-warning-bg`, `color-success-bg`, `color-info-bg`,
  `color-neutral-bg`), in both themes (operator decision 2026-11-03, squad round 1, plan Decisions 7: "Rule 1
  extended"; `color-control-border` is 2.91 on `color-neutral-bg` in light). `color-focus` on
  `color-chrome-hover` in light is resolved by changing the light `color-chrome-hover` (A.1): the plan computes the
  nearest value to `#2A261F` at which `color-focus` has at least 3:1 (unrounded) on it, and records the new value and
  the reason, which is then added to A.1. The plan states its measure of "nearest" (for example: the same hue and
  saturation as `#2A261F`, the highest lightness that meets 3:1); the new value MUST also keep FR-019 (e) and 4.5:1
  for `color-chrome-ink` and `color-chrome-muted` on it. #5's figure 5.6 for `color-chrome-muted` on
  `color-chrome-hover` in light (A.7) no longer applies to the new value; that pair's light figure is recorded from
  its first computation, approved by this operator decision. The dark `color-chrome-hover` is unchanged.
- **Radius tokens** (operator decision 2026-11-03, SPEC-2-03). `radius-1` and `radius-shell` are kept with a named
  use: `radius-1` for small marks (such as dots and focus corners), `radius-shell` for the outer app shell only.
  Constitution II's "one radius" is read as one general radius (`radius-2`) beside these named-use radii; the plan's
  Constitution Check records this reading. Whether elements use each radius only for its named use holds only in
  rendered elements and is checked there, like the other rendered brand rules; the token check is the closed set of
  FR-019 (c).
- **Theme selectors belong here.** #5 states the theme rule as part of the tokens, so the `prefers-color-scheme` and
  `data-theme` selectors ship in the tokens stylesheet; #6 (base styles) builds on them and does not repeat them.
- **`color-scheme` hand-off** (operator decision 2026-11-03, squad round 1, PLAN-A11Y-SECURITY-1-004). So that native
  controls, scrollbars and system colours follow the token theme, the tokens provide the theme-dependent token
  `color-scheme` (`light` in light, `dark` in dark; A.1), and #6 applies it (`color-scheme:
  var(--ocelle-color-scheme)` on the root). The tokens stylesheet itself sets no `color-scheme` property; until #6
  lands, native controls follow the user agent's default. The token is in the colour group (it changes with the
  theme) but its value is a keyword, not a colour: tests compare it as the keyword, and the rules for colour values
  (hex or `rgb()` form, parsing as RGBA, contrast grounds, swatches) do not apply to it; the token reference shows its
  value as text (squad round 1, verify 1).
- **Element custom properties** (operator decisions 2026-11-03, squad round 1, PLAN-FRESH-1-007, and squad round 2,
  PLAN-FRESH-2-003 (a) and PLAN-FRESH-2-004). Constitution I gives elements the `ocelle-` namespace for their own
  public CSS custom properties, named by convention `--ocelle-<element>-<property>` (FR-010). The unknown-token rule
  exempts exactly the names the custom-elements manifest declares, so element names are not restricted by the
  token set (`ocelle-icon`, `ocelle-dialog` and `ocelle-footer` stay available beside `icon-size`, `dialog-*` and
  `footer-h`); an element property may not have the full name of a token (`ocelle-icon` cannot declare
  `--ocelle-icon-size`, which is the token). The manifest is committed at `packages/elements/custom-elements.json`
  and kept current by the element features (#7 or #10 adds it); an element's CSS can use a new element property only
  after the manifest declares it.
- **Elements read tokens through inheritance.** The host loads the tokens stylesheet once on the document; elements
  do not adopt it per shadow root. How elements and base styles use the tokens is #6 and the element issues.
- **Rendered brand rules are not checked here.** Dark chrome on the top bar and rails, digests in groups of four, and
  "ochre fill never the only mark of state in light mode" depend on how elements use the tokens; the element issues
  and #10 (axe, visual regression) check them. This feature provides the tokens and records those rules in the
  package documentation (`packages/tokens/README.md`), together with the host contract and the forced-colours note
  of FR-018.
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
| `color-chrome-hover` | `#211D18` (changed from #5's `#2A261F`; computed by the plan, research R-04; operator, SPEC-2-01; Assumptions) | `#24211B` | | on chrome |
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
| `color-scheme` | `light` | `dark` | | not a colour: the theme's `color-scheme` keyword, applied by #6 (not in #5; operator decision 2026-11-03, squad round 1; Assumptions, "`color-scheme` hand-off") |

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

Named radius uses (operator decision 2026-11-03, SPEC-2-03): `radius-1` for small marks (such as dots and focus
corners); `radius-2` the one general radius; `radius-row` for rows and cards; `radius-shell` for the outer app shell
only; `radius-pill` for state pills only. These five are the closed set of FR-019 (c).

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
| `dialog-max-inline` | `calc(100vw - 2 * var(--ocelle-gutter))` (#5: "the viewport's inline size minus two `gutter`"; unit from the prototype file, research R-05) | `gutter` |
| `dialog-max-block` | `calc(100dvh - 2 * var(--ocelle-gutter))` (#5: "the viewport's block size minus two `gutter`"; unit from the prototype file, research R-05) | `gutter` |
| `bar-block-narrow` | `calc(2 * target-min + 3 * space-2)` (decision bar) | `target-min`, `space-2` |

At a 1280 × 800 viewport these are 1248 px and 768 px (Assumptions, "Dialog size unit").

### A.5 Elevation and motion (group **elevation**, theme-dependent; group **motion**, theme-independent)

| Token | Group | Light | Dark | Derived from |
|---|---|---|---|---|
| `elevation-sheet` | elevation | `0 0 0 1px` `color-rule` | `0 0 0 1px` `color-rule` | `color-rule` |
| `elevation-raised` | elevation | `0 2px 4px rgb(21 19 15 / 0.10), 0 12px 32px rgb(21 19 15 / 0.16)` (#5: "two soft shadows"; prototype file) | `0 0 0 1px` `color-rule-strong` | `color-rule-strong` (dark only) |
| `elevation-row` | elevation | `0 0 0 1px` `color-control-border`, `0 2px 8px rgb(21 19 15 / 0.08)` (shadow and ring width: prototype file) | `0 0 0 1px` `color-control-border` | `color-control-border` |
| `elevation-seg` | elevation | `0 0 0 1px` `color-control-border`, `0 1px 2px rgb(21 19 15 / 0.08)` (shadow and ring width: prototype file) | `0 0 0 1px` `color-control-border` | `color-control-border` |
| `elevation-bar` | elevation | `0 -6px 16px rgb(21 19 15 / 0.05)` | `none` | |
| `motion-fast` | motion | `120ms` (`0ms` under reduced motion) | same | |
| `motion-base` | motion | `200ms` (`0ms` under reduced motion) | same | |
| `easing-standard` | motion | `cubic-bezier(0.22, 1, 0.36, 1)` | same | |

#5 describes the light shadows and gives no ring width for `elevation-row` and `elevation-seg` (Assumptions, "Values
#5 describes but does not give"). The values marked "prototype file" are taken, as values only, from the console
prototype v2's `prototype/css/tokens.css` (operator decision 2026-11-03, SPEC-2-02; research R-05; Assumptions, "Light
shadows and ring width from the prototype file"). A token written with a colour token is defined by reference to it
(`var(--ocelle-color-control-border)`, FR-002).

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
| `color-chrome-muted` | `color-chrome-hover` | light | text | 5.6 (for #5's `#2A261F`; superseded by the changed light `color-chrome-hover`, recorded from first computation; SPEC-2-01) |
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

Rule 1 extended (operator decision 2026-11-03, SPEC-2-01): a control drawn on `color-inset` or `color-hover-bg` also
uses `color-accent-strong` for its border, in both themes. Extended again (operator decision 2026-11-03, squad round
1, plan Decisions 7): a control drawn on any state `-bg` (`color-danger-bg`, `color-warning-bg`, `color-success-bg`,
`color-info-bg`, `color-neutral-bg`) uses `color-accent-strong` for its border, in both themes.

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
| `color-link` | text | each state `-bg` (`color-danger-bg`, `color-warning-bg`, `color-success-bg`, `color-info-bg`, `color-neutral-bg`) | 5 |
| `color-focus` | non-text | every main ground, `color-chrome`, `color-chrome-hover` | 11 |
| `color-focus` | non-text | each state `-bg` | 5 |
| `color-current` | non-text | `color-chrome`, `color-chrome-hover`, `color-rail`, `color-accent-low` | 4 |
| `color-control-border` | non-text | every main ground except `color-accent-low`, `color-inset` and `color-hover-bg` (#5 rule 1, extended by the operator, SPEC-2-01) | 6 |
| `color-accent-strong` | non-text | `color-accent-low`, `color-inset`, `color-hover-bg` (#5 rule 1, extended by the operator, SPEC-2-01) | 3 |
| `color-accent-strong` | non-text | each state `-bg` (#5 rule 1, extended by the operator, squad round 1, plan Decisions 7) | 5 |
| | | **total** | **149** |

Every pair of A.7 is in this set, except `color-control-border` on `color-accent-low` and `color-accent` on
`color-canvas` in light, which FR-016 requires the pair list to carry as excluded pairs (FR-019 (b)). The pair list
also carries `color-control-border` on `color-inset`, on `color-hover-bg` and on each state `-bg` in both themes as
excluded pairs (A.9). With these excluded pairs the list has 158 entries in light and 157 in dark, all counted as
checked (FR-016, FR-021).

The rows for `color-link` and `color-focus` on the state `-bg` grounds and for `color-current` were added by the
operator's decision of 2026-11-03 (squad round 1, PLAN-A11Y-SECURITY-1-012, option (a)): the current bar is a
non-text indicator (WCAG 1.4.11) and must not pass only because it derives from `color-accent-strong`, and links and
focus rings can sit in state banners and pills. With Appendix A's values all 14 added pairs meet their threshold in
both themes (lowest: `color-current` on `color-chrome-hover` 3.01 light; `color-focus` on `color-neutral-bg` 4.27
light; `color-link` on `color-neutral-bg` 4.86 light).

The second `color-accent-strong` row was added by the operator's answer of 2026-11-03 to the question left open by
that decision (plan, Decisions 7: "Rule 1 extended"). `color-control-border` is 2.91 on `color-neutral-bg` in light
(3.05 to 3.21 on the other state grounds in light, 3.17 to 3.56 in dark), so a control drawn on a state `-bg` uses
`color-accent-strong` for its border, as on `color-accent-low`, `color-inset` and `color-hover-bg`:
`color-control-border` on the five state `-bg` grounds is an excluded pair in both themes (A.9), and
`color-accent-strong` on them is required. With Appendix A's values it is 4.47, 4.50, 4.70, 4.71, 4.27 light and 7.56,
6.83, 7.23, 7.37, 6.74 dark on `color-danger-bg`, `color-warning-bg`, `color-success-bg`, `color-info-bg`,
`color-neutral-bg` (the same figures as `color-focus`, which references it).

### A.9 Required or recorded pairs below threshold with Appendix A's values

Computed for this spec on 2026-11-03 with the WCAG 2.x formula; the gate's own computation decides.

| Pair | Theme | Ratio | Threshold | Status |
|---|---|---|---|---|
| `color-control-border` on `color-accent-low` | light, dark | 2.94, 2.88 | 3:1 | excluded, #5 rule 1 (`color-accent-strong` on it: 4.31, 6.13) |
| `color-accent` on `color-canvas` | light | 2.57 | 4.5:1 | excluded, "ochre text never on bone" |
| `color-control-border` on `color-inset` | light, dark | 2.80, 2.95 | 3:1 | excluded, #5 rule 1 extended (operator, SPEC-2-01; `color-accent-strong` on it: 4.11, 6.28) |
| `color-control-border` on `color-hover-bg` | light, dark | 2.80, 3.17 | 3:1 | excluded in both themes, #5 rule 1 extended (operator, SPEC-2-01; `color-accent-strong` on it: 4.11, 6.74) |
| `color-control-border` on `color-neutral-bg` | light, dark | 2.91, 3.17 | 3:1 | excluded in both themes, #5 rule 1 extended (operator, squad round 1, plan Decisions 7; `color-accent-strong` on it: 4.27, 6.74) |
| `color-control-border` on `color-danger-bg`, `color-warning-bg`, `color-success-bg`, `color-info-bg` | light | 3.05, 3.07, 3.21, 3.21 | 3:1 | at or above threshold; excluded in both themes with `color-neutral-bg`, one rule for all state grounds (operator, squad round 1, plan Decisions 7; `color-accent-strong` on them: 4.47, 4.50, 4.70, 4.71) |
| `color-control-border` on `color-danger-bg`, `color-warning-bg`, `color-success-bg`, `color-info-bg` | dark | 3.56, 3.21, 3.40, 3.46 | 3:1 | as above (`color-accent-strong` on them: 7.56, 6.83, 7.23, 7.37) |
| `color-focus` on `color-chrome-hover` | light | 2.71 (with #5's `#2A261F`) | 3:1 | resolved by changing the light `color-chrome-hover` (operator, SPEC-2-01; Assumptions); at least 3:1 with the plan's value |
| `color-disabled-ink` on `color-rail`, `color-inset`, `color-accent-low`, `color-hover-bg`, `color-disabled-bg` | light | 4.38, 4.07, 4.27, 4.07, 4.23 | none (exempt) | checked against figure only |
| `color-disabled-ink` on `color-inset`, `color-accent-low`, `color-hover-bg`, `color-disabled-bg` | dark | 3.84, 3.75, 4.12, 4.12 | none (exempt) | checked against figure only |
