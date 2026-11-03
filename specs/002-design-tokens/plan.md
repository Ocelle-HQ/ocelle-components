# Implementation Plan: Design Tokens

**Branch**: `002-design-tokens` (work on `claude/kitty-ui-speckit-decouple-x3prkx`) | **Date**: 2026-11-03 |
**Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/002-design-tokens/spec.md` (approved at gate "spec" after three checks),
with the operator's answers of 2026-11-03: SPEC-1-05 and SPEC-3-01 (Storybook held to the strict CSP, statically and
at run time), SPEC-2-01, SPEC-2-02 (the prototype file, supplied as `sources/console-v2-tokens.md`) and SPEC-2-03;
and the squad round 1 fixes and the operator's fork decisions (`reviews/plan/round-1/refute.md`, `fixes-1.md`).

## Summary

`@ocelle/tokens` gets one typed token source (`src/source.ts`) from which a pure generator produces the stylesheet
(`dist/tokens.css`: light in `:root`, dark under `prefers-color-scheme: dark` unless `data-theme="light"`, and under
`data-theme="dark"`; reduced motion; `@font-face`), the JSON export and the typed name list; a `color-scheme` token
hands the theme keyword to #6. The Schibsted Grotesk variable font and its OFL licence are vendored with a checksum
record; a package README states the host contract. Two new gates, `contrast` (149 required pairs per theme derived
from the intended grounds in the source, pinned to A.8 by a test, plus a pair list with recorded figures and
exclusions) and `brand-rules` (FR-019 (a)–(g)), join the 001 gate framework with plants; style-lint learns to reject
unknown token names (element custom properties `--ocelle-<element>-*` exempt), with the token source added to the
plant configuration set; `csp` and `prefix` widen to the Storybook files this repository produces. A minimal
Storybook (one story per token group) is added and must run with zero violations under the constitution's CSP plus
the Storybook page's host additions (`font-src`, `connect-src`, `frame-src` `'self'`), proven by a browser test; a
spike settles first whether that is possible under the pinned Storybook, and if not the phase stops and asks the
operator. Browser tests serve what the generator produces in a per-run directory, never a stale `dist/`. The
`--sk-*` mapping table is written from kitty-mission-ui.

## Technical Context

**Language/Version**: TypeScript 6.0.3 (strict) on Node 26.13.0 (type stripping), CSS.

**Primary Dependencies**: existing: Vitest 5.0.5, Playwright 1.64.1, PostCSS 8.5.31, postcss-value-parser 4.2.0,
Stylelint 17.16.0, parse5 8.0.1, Vite 8.3.5. New (dev, workspace `storybook/` only): `storybook` and
`@storybook/html-vite` 10.6.4 (research R-10; exact version pinned at install, at least seven days old).

**Storage**: files: token source, pair list, font files, generated `dist/`.

**Testing**: Vitest (`tokens` project, node), with Playwright-driven Chromium for browser behaviour (research R-03),
served from generator output written in each suite's `beforeAll` inside the test worker (not a global setup, so
Stryker's active mutant reaches it); a new `storybook` project (node) whose setup builds
Storybook into a temporary directory; expected values transcribed from Appendix A in the tests; gate tests in the
`gates` project; plants through `gate:plants`; Stryker on changed source, now including `storybook/scripts/` and
`storybook/.storybook/`.

**Target Platform**: evergreen browsers; Chromium in tests; hosts under the strict CSP of constitution IV plus
`font-src 'self'`.

**Project Type**: library (pnpm workspace) plus repository gates.

**Performance Goals**: none beyond CI time: each new gate under 10 s; the browser tests under 60 s.

**Constraints**: strict CSP with no exception for the package output; the Storybook page with the host additions of
the Constitution Check; no network at build (Storybook telemetry disabled) or run time; no `sk-` names or monospace in
package source or output or in the Storybook files in scope; every gate proven by plants; test-first (VIII).

**Scale/Scope**: about 130 tokens in 8 groups; 149 required contrast pairs per theme (158/157 entries with
exclusions); 7 brand rules; 4 user stories.

## Constitution Check

*Pre-design and post-design: PASS, with the readings below recorded.*

| Principle | How this plan meets it |
|---|---|
| I. `ocelle-` names, no `sk-` | Every token is `--ocelle-*`. The `--sk-*` mapping table (FR-024) is **documentation, not source**: it lives in `specs/002-design-tokens/sk-mapping.md`, is never built, imported or published, and the prefix gate's scope (package source, test code, built output) does not include it. Its test refers to columns by position and contains no `sk-` literal (research R-13). |
| II. Tokens only, brand rules enforced | All values in `@ocelle/tokens`; brand rules (a)–(g) as the `brand-rules` gate (rule (b) also reads the pair list); unknown token names rejected by style-lint, element custom properties `--ocelle-<element>-*` (constitution I) exempt by naming convention (FR-010). **Radius reading** (SPEC-2-03): "one radius" is read as one general radius (`radius-2`, 4 px) beside named-use radii `radius-1` (small marks), `radius-row` (rows, cards), `radius-shell` (outer app shell), `radius-pill` (state pills); the gate enforces that closed set. Rendered brand rules (chrome use, digest grouping, ochre fill never alone) stay with the elements and #10. |
| III. Accessible by construction | Automated text and non-text contrast check (`contrast` gate) over 149 required pairs per theme, including the current bar, links and focus rings on state grounds, and `color-accent-strong` control borders on state grounds (#5 rule 1 extended); `--ocelle-target-min` 2.75rem; focus ring tokens; reduced motion; forced colours not overridden (rule (g), system-colour mappings allowed); forced-colours behaviour of elements tested by element tests under forced-colours emulation (axe has no such rule), and the README tells elements that `elevation-*` rings vanish there; `color-scheme` token for #6. |
| IV. Strict CSP, offline | Tokens ship as an external stylesheet; font vendored, relative URL. **Font CSP reading**: constitution IV's CSP has no `font-src`, so a host that wants the brand font adds `font-src 'self'`; this is a host setting, not an exception in the library's output, and without it the fallback fonts apply with the font file as the only violation (US2 scenario 6). No amendment needed. **Storybook page reading** (operator decision 2026-11-03, squad round 1, PLAN-A11Y-SECURITY-1-001 (a)): Storybook fetches its story index and frames its preview, so the Storybook page is served with the host additions `connect-src 'self'` and, while the manager UI is used, `frame-src 'self'` (plus `font-src 'self'`), for that page only, like `font-src`; the run-time test asserts that exact header and zero violations (R-10). **Static scope reading** (operator decision 2026-11-03, squad round 1, PLAN-FRESH-1-001 (a)): the static `csp` and `prefix` gates cover the Storybook files this repository's sources produce, not the runtimes Storybook copies verbatim from its package, which the run-time test covers and a byte-identity test fences (R-10, FR-023). No build-time network: Storybook telemetry disabled and tested. |
| V. Storybook is the visual source | Token stories per group in light and dark; baselines and visual regression stay with #10, which builds on this Storybook. |
| VI. Consumer-driven, own code | Consumers named in the spec; values from #5 and the operator's prototype table as values only (R-05); font from upstream. |
| VII. Semver | Token names are new surface: MINOR, changelog entry (R-11); pre-1.0. |
| VIII. Test-first, non-vacuous | Each phase red first; generator, `build.ts` (thin I/O boundary) and gates mutation-tested, and `storybook/scripts/` and `.storybook/` brought into the mutation and typecheck scope; expected values transcribed from Appendix A (not read from the source) and the required pair set pinned to A.8, so source mutants are killed; browser tests serve current generator output, observe used values and the platform font, and their CSP collector has a control violation; every new gate and rule has fail, pass and breaking plants; the token source is in the plant configuration set, and plants and tests using `--ocelle-x` move to real names with the reason recorded; the contrast gate exits 2 on zero pairs. |
| Workflow gates | `contrast` and `brand-rules` become required checks (operator ruleset change); the "Contrast check" deferral ends. |

## Decisions the operator should see at the plan gate

1. **Light `color-chrome-hover` = `#211D18`** (research R-04): focus 3.01:1 on it, chrome-ink 13.84, chrome-muted
   6.22, luminance 0.0127. **It is only 1.107:1 against `color-chrome`** (was 1.233:1), so hover on the chrome is
   barely visible (check 3, SPEC-3-03). Applied as decided at SPEC-2-01.
2. **Prototype values** (R-05): light shadows of `elevation-raised`, `-row`, `-seg`; ring width 1px; dialog units
   `vw`/`dvh`. Source hashed in `sources/`.
3. **Excluding a required pair is a finding** (`required-pair-excluded`, R-07; check 3, SPEC-3-02). FR-016 and
   FR-020 were aligned in squad round 1.
4. **Storybook run-time CSP spike first** (R-10): it records every violation by directive under the Storybook page's
   header and runs the widened `csp` and `prefix` gates on the files in scope; stop and ask if either fails.
5. Check 3 note SPEC-3-04: the light shadows and ring width are tested against the exact values of R-05, now in
   Appendix A (squad round 1); the dialog sizes are also tested as used sizes at a known viewport.
6. **Fork decisions of squad round 1** (operator, 2026-11-03; `reviews/plan/round-1/refute.md`):
   - PLAN-A11Y-SECURITY-1-001 (a): Storybook page host additions `connect-src 'self'`, `frame-src 'self'` (Constitution
     Check IV, R-10).
   - PLAN-A11Y-SECURITY-1-004 (b): theme-dependent token `color-scheme` (`light`/`dark`), applied by #6 (R-02, A.1).
   - PLAN-A11Y-SECURITY-1-011 (a): rule (g) allows mapping colour tokens to system colours (FR-018, R-08).
   - PLAN-A11Y-SECURITY-1-012 (a): `color-current` on four grounds and `color-link`, `color-focus` on the five state
     `-bg` grounds added to A.8; with item 7, 149 required pairs per theme, all passing (R-07).
   - PLAN-FRESH-1-001 (a): static Storybook scope narrowed to the files this repository produces; this loosens
     SPEC-1-05's "no style attribute remains in the built output" (FR-023, R-10).
   - PLAN-FRESH-1-007 (a): element custom properties named `--ocelle-<element>-<property>`, exempt from the
     unknown-token rule (FR-010, R-09).
   - PLAN-TESTABILITY-1-003 (a): `use` dropped from the source records, kept as comments (R-01).
7. **Controls on state grounds** (question left open by PLAN-A11Y-SECURITY-1-012 (a); operator answer 2026-11-03:
   "Rule 1 extended"). `color-control-border` is 2.91:1 on `color-neutral-bg` in light (3.05 to 3.21 on the other
   state grounds in light, 3.17 to 3.56 in dark). As with `color-inset` and `color-hover-bg`, a control drawn on any
   state `-bg` (`danger`, `warning`, `success`, `info`, `neutral`) uses `color-accent-strong` for its border, in both
   themes: `color-control-border` on those five grounds is an excluded pair (A.9), and `color-accent-strong` on them
   is a required pair (A.8; 4.27 to 4.71 light, 6.74 to 7.56 dark). Required pairs: 149 per theme; pair list: 158
   entries in light, 157 in dark (R-07). The README's rendered brand rules name the state grounds.

## Project Structure

### Documentation (this feature)

```text
specs/002-design-tokens/
├── plan.md  research.md  data-model.md  quickstart.md
├── contracts/ (token-package.md, gates.md)
├── sources/console-v2-tokens.md        # operator-supplied prototype values (R-05)
├── sk-mapping.md                       # User Story 4 (documentation)
├── reviews/ checklists/ triage.ref
└── tasks.md                            # /speckit-tasks
```

### Source Code (repository root)

```text
packages/tokens/
├── src/source.ts            # the token source (data-model § Token)
├── src/generate.ts          # pure: css(), json(), names(), validateSource()
├── src/index.ts             # TokenName, tokenNames, tokens, cssName
├── scripts/build.ts         # writes dist/tokens.css, dist/tokens.json, copies fonts/
├── contrast/pairs.json      # contrast pair list (data-model § Contrast pair)
├── fonts/SchibstedGrotesk-wght.woff2  fonts/OFL.txt  fonts/SOURCE.json
├── README.md                # host contract, CSP allowance, forced colours, rendered brand rules (R-15)
├── CHANGELOG.md
└── test/                    # source, generate (fixture sources), json, build, font, readme, sk-mapping;
                             # test/browser/ (Playwright; serve.ts: each suite's beforeAll writes generator
                             # output to a temp dir inside the worker, no globalSetup)
gates/
├── bin/contrast.ts  bin/brand-rules.ts
├── lib/wcag.ts  lib/token-source.ts
├── lib/plant-repo.ts        # configurationSet + token source, generator, pair list
├── lib/mutation/ranges.ts   # scope + storybook/scripts, storybook/.storybook
├── stylelint/token-only.ts  (unknown-token rule, element-property exemption)
├── bin/csp.ts  bin/prefix.ts (scope widened, vendor copies excluded)
├── test/contrast-required.test.ts  # required set equals A.8
├── gates.json  lib/registry.ts  README.md
└── plants/contrast/…  plants/brand-rules/…  plants/style-lint/…  plants/csp/…  plants/prefix/…
storybook/                   # private workspace package
├── .storybook/ (main.ts with telemetry disabled, preview.ts, manager.ts, theme)
├── stories/tokens.stories.ts
├── scripts/externalise.ts   scripts/swatches.ts  (pre-build: token and swatch stylesheets and fonts from the
│                            token source into .generated/, R-10)
└── test/csp.test.ts  test/externalise.test.ts  test/swatches.test.ts  test/telemetry.test.ts  test/vendor-copies.test.ts
vitest.config.ts             # + storybook project
tsconfig.json                # + storybook/.storybook/**/*.ts
.gitignore                   # + storybook/dist/, storybook/.generated/
.github/workflows/ci.yml     # jobs contrast, brand-rules
THIRD_PARTY_NOTICES          # font entry
pnpm-workspace.yaml          # + storybook
```

**Structure Decision**: tokens stay in `packages/tokens`; gates in the 001 framework; Storybook as a separate private
workspace so that #10 can extend it and nothing of it is published.

## Phases (user stories) for `/speckit-tasks`

1. **US1 Tokens and themes** (P1): source (with `color-scheme`), generator, thin build, exports, JSON, browser test
   setup in the worker (`serve.ts`) and violation collector, theme, value and motion tests against the transcribed table, README (host contract,
   brand rules, forced colours), configuration set change, unknown-token style-lint rule (with element exemption) and
   plants, `--ocelle-x` plants and tests moved; Storybook spike (violations by directive, widened gates) then
   telemetry off, token stories, `storybook` Vitest project, scopes (mutation, typecheck, prefix source), vendor-copy
   test and run-time CSP test, widened `csp`/`prefix`.
2. **US2 Font** (P2): vendoring, SOURCE.json and checksum test, `@font-face`, font-use (platform font), tabular-figure,
   request and CSP (with and without `font-src`) tests, README CSP allowance and its test, notices.
3. **US3 Gates** (P3): `wcag.ts`, `token-source.ts`, `contrast` and `brand-rules` gates, pair list, A.8 test, plants,
   registry, CI, README.
4. **US4 Mapping** (P4): `sk-mapping.md` and its test (needs kitty-mission-ui access).

US1's Storybook work may be split into its own phase by the tasks step if it grows; the spike is its first task.

## Complexity Tracking

| Item | Status |
|---|---|
| **Closed from 001**: "Contrast gate absent — sunset when #5 merges" (001 plan) | Closed by this feature's `contrast` gate (FR-022). |
| Exceptions to principles | None taken beyond the operator-decided readings of the Constitution Check (squad round 1): the Storybook page's host additions `connect-src`/`frame-src 'self'` (PLAN-A11Y-SECURITY-1-001 (a)) and the static Storybook scope limited to this repository's files (PLAN-FRESH-1-001 (a)). If the Storybook spike cannot reach zero CSP violations under that header, the phase stops and the operator decides (FR-023); any further exception would be added here only with that approval. |
