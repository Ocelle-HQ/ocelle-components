# Feature Specification: Design Tokens

**Feature Branch**: `002-design-tokens` (work happens on `claude/kitty-ui-speckit-decouple-x3prkx`)

**Created**: 2026-11-03

**Status**: Draft

**Input**: User description: "Build the @ocelle/tokens package from issue #5 (triage/002-design-tokens.md): every --ocelle-* token for light and dark themes (system preference, light by default, data-theme on <html> overrides) including the dark chrome, link, rule, radius and target-size tokens, the vendored Schibsted Grotesk font with its OFL licence and THIRD_PARTY_NOTICES entry, the brand rules of constitution II enforced as checks, and the automated text and non-text contrast check as a CI gate with a planted defect under gates/plants/ (the gate deferred to #5 in gates/README.md); base styles stay with #6, Storybook and axe with #10."

**Issues**: #5 (triage record `triage/002-design-tokens.md`, approved by the operator). The body of #5 was read for
this spec on 2026-11-03; its token tables, brand rules, contrast figures, Coverage item and "Done when" list are the
source of the requirements below and are referred to as "the #5 token table".

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

A host page loads the tokens stylesheet from `@ocelle/tokens`. Every `--ocelle-*` token of the #5 token table is then
defined on the document. The values follow the user's system colour-scheme setting, are the light values when the
system states no preference, and follow `data-theme="light"` or `data-theme="dark"` on `<html>` when it is set,
whatever the system says. Tools that cannot read CSS (for example a design tool or a contrast script) read the same
tokens and values, per theme, from a JSON export in the same package.

**Why this priority**: every other issue of the library needs the tokens; without them nothing can be styled.

**Independent Test**: load the built stylesheet into a page in a real browser and read every token's computed value
under each of the five theme conditions (FR-006); compare with the #5 token table. Read the JSON export and compare
it with the same table and with the stylesheet.

**Acceptance Scenarios**:

1. **Given** a page that loads the tokens stylesheet and a system with no colour-scheme preference, **When** the page
   renders, **Then** every colour token of the #5 token table has its light value (for example
   `--ocelle-color-canvas` is `#F1EEE8`).
2. **Given** a system that prefers dark and no `data-theme` attribute, **When** the page renders, **Then** every
   colour, elevation and other theme-dependent token has its dark value (for example `--ocelle-color-canvas` is
   `#15130F` and `--ocelle-elevation-bar` is `none`).
3. **Given** a system that prefers light, **When** the page renders, **Then** every token has its light value.
4. **Given** a system that prefers dark and `data-theme="light"` on `<html>`, **When** the page renders, **Then**
   every token has its light value; **and given** a system that prefers light (or states no preference) and
   `data-theme="dark"`, **Then** every token has its dark value.
5. **Given** a page that sets `data-theme` on `<html>` and later removes it, **When** the page re-renders, **Then**
   the tokens follow the system setting again.
6. **Given** a token that does not depend on the theme (space, size, radius, type scale, shell, motion), **When** it
   is read under each of the five theme conditions, **Then** its value is the same in all of them.
7. **Given** a system that requests reduced motion, **When** the page renders, **Then** `--ocelle-motion-fast` and
   `--ocelle-motion-base` are `0ms`; without that request they are `120ms` and `200ms`.
8. **Given** the dark-chrome tokens (`color-chrome`, `color-chrome-ink`, `color-chrome-muted`, `color-chrome-hover`),
   **When** they are read in the light theme, **Then** they are dark values (the #5 token table's light column), so
   the chrome is dark in both themes.
9. **Given** the JSON export, **When** a tool reads it, **Then** it lists every token of the stylesheet with its
   light and dark value (one value where the token does not depend on the theme), and no token that the stylesheet
   lacks.
10. **Given** the built package, **When** the strict-CSP and prefix gates run on it, **Then** both pass: the tokens
    ship as an external stylesheet with no inline style, and no `sk-` name or monospace family appears in it.
11. **Given** the token stories (FR-023), **When** Storybook is built and a group's story is rendered in light and in
    dark, **Then** it lists exactly that group's tokens with their name and value for that theme.

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

---

### User Story 3 - Contrast and brand rules are checked on every pull request (Priority: P3)

When a pull request changes a token value, CI recomputes the WCAG 2.x contrast of every text and non-text pair the
library relies on, in both themes, and fails when a pair falls below its threshold or no longer matches the figure
recorded for it. Further checks reject a token set that breaks a brand rule that can be checked on the tokens alone.
Each check has planted defects that prove it can fail, and the "Contrast check" row leaves the deferred gates.

**Why this priority**: the tokens must exist before they can be checked; the gates keep them right afterwards.

**Independent Test**: run the contrast gate and the brand-rule checks on the repository (they pass and report how
many pairs and rules they checked); run the plant job, whose new plants (a text pair below 4.5:1, a non-text pair
below 3:1, a figure that no longer matches, a broken brand rule, an empty pair list) each fail the gate with exactly
their expected finding.

**Acceptance Scenarios**:

1. **Given** the tokens and the contrast pair list (FR-016), **When** the contrast gate runs, **Then** it computes the
   ratio of every pair in both themes, passes, and reports the number of pairs checked per theme, which is greater
   than zero and equals the number of pairs in the list.
2. **Given** a text pair whose ratio drops below 4.5:1 in one theme (for example `color-ink-muted` changed so that it
   is 4.3:1 on `color-inset`), **When** the gate runs, **Then** it fails with one finding naming the theme, the two
   tokens, the ratio and the threshold.
3. **Given** a non-text pair below 3:1 (for example `color-control-border` on `color-rail` in light), **When** the
   gate runs, **Then** it fails the same way with the 3:1 threshold.
4. **Given** a pair whose computed ratio differs from the figure recorded for it by more than the rounding of that
   figure (FR-017), **When** the gate runs, **Then** it fails and names the recorded and computed figures, even if
   both are above the threshold.
5. **Given** a pair list that is empty, names a token that does not exist, or lacks a pair that FR-016 requires,
   **When** the gate runs, **Then** it exits "could not run" (2) or fails, naming the cause; it never passes.
6. **Given** a token set in which a brand rule of FR-019 is broken (for example `color-link` set equal to
   `color-accent` in light, a second radius at 4 px, or a monospace family in `font-sans`), **When** the brand-rule
   check runs, **Then** it fails naming the rule and the token.
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

**Independent Test**: check that the table has exactly 55 rows, one per role in the consumer's list, and that every
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
- **Recorded figure wrong in #5**: if a figure recorded from #5 does not match the computed ratio, the implementer
  corrects the recorded figure in the pair list with the reason in the commit and the review; the threshold check
  still decides the pair.

## Requirements *(mandatory)*

### Functional Requirements

**Tokens and themes (User Story 1)**

- **FR-001**: `@ocelle/tokens` MUST define every token of the #5 token table (colour, type, space, shape, size, shell,
  measure, elevation, motion) as a CSS custom property named `--ocelle-<name>`, where `<name>` is the table's name
  (`color-canvas` → `--ocelle-color-canvas`); each `/`-joined pair in the table is two tokens and each `-bg` suffix
  expands to the full name (`color-danger-bg`).
- **FR-002**: Token values MUST equal the #5 token table's values for each theme. Tokens the table gives as derived
  (`=` or `same`) MUST be defined by reference to their source token, so they cannot drift apart.
- **FR-003**: Tokens the #5 table excludes MUST NOT exist: `color-proto`, `color-proto-bg`, `font-size-ui`,
  `font-size-body`, `font-size-title`, `radius-3`.
- **FR-004**: The tokens MUST ship as an external stylesheet in the package's published files (constitution IV); no
  part of the token output is an inline style, a style attribute or script that writes styles.
- **FR-005**: The theme MUST be selected as constitution II states: the system setting (`prefers-color-scheme`); light
  when the system states no preference; `data-theme="light"` or `"dark"` on `<html>` overrides the system. Any other
  value, or the attribute elsewhere, has no effect.
- **FR-006**: Theme selection MUST be tested in a real browser under five conditions: system light, system dark, no
  preference, system dark with `data-theme="light"`, system light with `data-theme="dark"`; plus removal of the
  attribute at run time.
- **FR-007**: Under `prefers-reduced-motion: reduce`, `--ocelle-motion-fast` and `--ocelle-motion-base` MUST be `0ms`.
- **FR-008**: The package MUST publish a JSON export of the same tokens: per token its full name, its group (colour,
  type, space, shape, size, shell, elevation, motion) and its value in light and dark (or one value when it does not
  depend on the theme), with derived tokens resolved to their value. The stylesheet and the JSON export MUST come
  from one source of truth in the repository, and a test MUST prove they agree token for token.
- **FR-009**: The package's TypeScript entry MUST export the list of token names (and the JSON data), so elements and
  tests can refer to tokens by a typed name rather than a string literal.
- **FR-010**: The token-only style lint of 001 (FR-024 there) MUST also reject a `var(--ocelle-…)` reference in
  element and base-style CSS to a name that is not a token of this package, so a misspelt token cannot fall back
  silently. The token definitions themselves stay exempt from the token-only rule.

**Font (User Story 2)**

- **FR-011**: The package MUST contain `SchibstedGrotesk-wght.woff2` from `schibsted/schibsted-grotesk` at commit
  `d485f61f`, unmodified (its checksum recorded in the repository and checked by a test), and the font's SIL OFL 1.1
  licence text in the same directory, both in the published files.
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
  4.5:1; non-text, 3:1) and its recorded figure. It MUST contain at least every pair whose figure #5 records
  ("Contrast" section: the text pairs, the state colours on their own backgrounds, chrome-ink on chrome, chrome-muted
  on chrome-hover, on-accent on accent; the non-text pairs focus on sheet and on chrome, control-border on sheet and
  on rail), and in addition: every text-colour token (`ink`, `ink-soft`, `ink-muted`, `link`, `link-hover`,
  `disabled-ink`, each state colour) on every ground it is intended for per the #5 "Use" column (`canvas`, `sheet`,
  `pane`, `panel`, `inspector`, `rail`, `inset`, `accent-low`, `hover-bg`), `color-focus` on every ground, and
  `color-control-border` on every ground except `accent-low`, where rule 1 of #5 applies (`color-accent-strong` on
  `accent-low` is checked instead). A pair below its threshold that the design intends not to use MUST be listed as
  an excluded pair with the reason, not left out silently.
- **FR-017**: The contrast gate MUST compute each pair's ratio with the WCAG 2.x relative-luminance formula from the
  token values (resolving derived tokens), compare the unrounded ratio with the threshold, and compare it with the
  recorded figure at the figure's precision (a figure of `5.3` matches a computed ratio in [5.25, 5.35)). Disabled
  ink is exempt from the threshold (WCAG 1.4.3 excludes inactive components) but MUST still match its recorded
  figure.
- **FR-018**: Forced-colours mode (operator decision, 2026-11-03): this feature MUST check that the token output does
  not defeat forced colours: no `forced-color-adjust: none`, and no `@media (forced-colors: active)` rule that sets
  colour tokens to fixed values. A plant with such a rule MUST fail the check. Contrast of rendered elements in
  forced-colours mode is checked by the element issues and by axe in #10; #5's "including forced colours" is met by
  this guard together with that later check.
- **FR-019**: A brand-rule check MUST reject a token set that breaks any of these rules, which hold on token values
  alone: (a) no font token names a monospace family; (b) `color-link` differs from `color-accent` and the pair
  `color-accent` on `color-canvas` is listed as an excluded text pair ("ochre text never on bone"); (c) exactly one
  radius token is 4 px (`radius-2`), `radius-row` is 6 px and `radius-pill` is 999 px; (d) `color-rule` and
  `color-rule-strong` are below 3:1 on `canvas` and `sheet` while `color-control-border` is at or above 3:1 on them,
  so the decorative rule cannot serve as a control boundary by mistake; (e) the four chrome tokens are identical or
  dark in both themes (chrome luminance below that of `color-ink-soft` in light); (f) the reduced-motion values of
  FR-007. Brand rules that only hold in rendered elements (chrome used by the top bar, digests in groups of four,
  ochre fill never the only mark of state) are out of scope (Assumptions).
- **FR-020**: Each check of FR-016 to FR-019 MUST be a gate of the 001 gate framework: `pnpm run gate:<id>` with the
  exit contract of `gates/README.md` (0 checked, 1 findings, 2 could not run), an entry in `gates/gates.json`, a CI
  job, and fail, pass and breaking plants under `gates/plants/<id>/`. The fail plants MUST include at least: a text
  pair below 4.5:1, a non-text pair below 3:1, a figure that no longer matches, a pair naming a missing token, and one
  per brand rule of FR-019. The breaking plants MUST include an empty or unparsable pair list.
- **FR-021**: The gate MUST report, on success, the number of pairs checked per theme; a run that checks zero pairs
  MUST exit 2, never 0.
- **FR-022**: `gates/README.md` MUST list the new gates in "The gates" and "Required checks on `main`", remove the
  "Contrast check" row from "Deferred gates", and the FR-020 list of 001 (`gates/lib/registry.ts`) MUST include them.
  The 001 plan's Complexity Tracking item "Contrast gate absent" is closed by a note in this feature's plan. Making
  the new check required on `main` is the operator's change to the ruleset.

**Stories and mapping (User Stories 1 and 4)**

- **FR-023**: Token reference stories (operator decision, 2026-11-03): this feature MUST add a minimal Storybook to
  the workspace with one story per token group (colour, type, space, shape, size, shell, elevation, motion), each
  showing every token of its group with its name and value, in light and dark. The stories are generated from the
  token source of FR-008, so a token cannot be missing from them, and a test MUST prove each group's story lists
  exactly that group's tokens. Storybook MUST build with one command under the pinned versions, and its built output
  MUST pass the strict-CSP and prefix gates. The Storybook build gate, visual regression and axe stay with #10 (still
  deferred in `gates/README.md`); #10 builds on this Storybook rather than adding a second one.
- **FR-024**: A mapping table MUST map each of the 55 `--sk-*` roles kitty-mission-ui uses to its `--ocelle-*`
  token, listing each dropped or merged role with its replacement. It MUST live outside the three packages (for
  example in this feature's directory or the repository's docs) so no `sk-` name enters package source or output
  (constitution I), and a test MUST check that every `--ocelle-*` name in it is a token. The 55 roles are read from the kitty-mission-ui repository (operator
  decision, 2026-11-03), which the operator gives this session read access to; the table records the commit of
  kitty-mission-ui it was read from, and only role names are taken from it (no code or values, constitution VI).
  If that repository cannot be read when User Story 4 is implemented, the phase stops and asks the operator.

**Versioning and records**

- **FR-025**: The package's changelog MUST record the token names as added public surface (constitution VII, MINOR;
  pre-1.0, so the version may stay below 1.0.0).
- **FR-026**: No value, name or asset is copied from the Spec Kitty design library (constitution VI): values come from
  the #5 token table (the operator's console prototype), and the font from its upstream repository.

### Key Entities

- **Token**: a named design value. Attributes: full name (`--ocelle-…`), group, light value, dark value (or one value),
  source token if derived, description of its use.
- **Theme condition**: one of system light, system dark, no preference, and each `data-theme` override; decides which
  value a theme-dependent token has.
- **Contrast pair**: foreground token, background token, theme, kind (text or non-text), threshold, recorded figure,
  and either "checked" or "excluded" with a reason.
- **Brand rule**: one rule of constitution II that a check can test on token values, with the tokens it reads.
- **Font asset**: the vendored file, its licence, its source repository and commit, and its checksum.
- **Role mapping**: an `--sk-*` role, its `--ocelle-*` replacement or "dropped" with the replacement to use.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of the tokens in the #5 token table exist with their table value in each of the five theme
  conditions, and none of the six excluded tokens exists; checked by browser tests.
- **SC-002**: The stylesheet and the JSON export agree on 100% of tokens and values.
- **SC-003**: A page under the strict CSP of constitution IV plus `font-src 'self'` renders text in Schibsted Grotesk
  with zero requests outside its own origin and zero CSP violations.
- **SC-004**: The contrast gate checks every pair of FR-016 in both themes (the count it reports equals the pair list's
  size, and is greater than zero), and every one of its fail plants and every brand-rule fail plant is caught with
  exactly its expected finding by the plant job.
- **SC-005**: Changing any one checked token value so that a pair falls below its threshold makes the pull request's
  contrast check fail; restoring it makes it pass.
- **SC-006**: An element author who writes `var(--ocelle-color-canvs)` (misspelt) gets a style-lint failure naming
  the unknown token.
- **SC-007**: `gates/README.md` lists no deferred contrast gate, and every gate of the registry has a CI job and plants.

## Assumptions

- **Values are final for now.** The #5 token table, as the operator gave it on 2 November 2026, is the source; the
  contrast figures in #5 are the first expected values (FR-017), corrected with a recorded reason if a computation
  shows one is wrong.
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
- **kitty-mission-ui access.** The operator chose to read the 55 `--sk-*` roles from kitty-mission-ui; the session
  that implements User Story 4 needs read access to that repository.
- **Out of scope:** base styles, reset and typography classes (#6); the Storybook build gate, visual regression and
  axe (#10; the minimal Storybook of FR-023 ships here);
  elements (#7 to #9, #12 to #17); the release (#11).
- **#3** is done on `main` (triage 002) and is not part of this feature.
