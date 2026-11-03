# Implementation Plan: Design Tokens

**Branch**: `002-design-tokens` (work on `claude/kitty-ui-speckit-decouple-x3prkx`) | **Date**: 2026-11-03 |
**Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/002-design-tokens/spec.md` (approved at gate "spec" after three checks),
with the operator's answers of 2026-11-03: SPEC-1-05 and SPEC-3-01 (Storybook held to the strict CSP, statically and
at run time), SPEC-2-01, SPEC-2-02 (the prototype file, supplied as `sources/console-v2-tokens.md`) and SPEC-2-03.

## Summary

`@ocelle/tokens` gets one typed token source (`src/source.ts`) from which a pure generator produces the stylesheet
(`dist/tokens.css`: light in `:root`, dark under `prefers-color-scheme: dark` unless `data-theme="light"`, and under
`data-theme="dark"`; reduced motion; `@font-face`), the JSON export and the typed name list. The Schibsted Grotesk
variable font and its OFL licence are vendored with a checksum record. Two new gates, `contrast` (130 required pairs
per theme derived from the intended grounds in the source, plus a pair list with recorded figures and exclusions)
and `brand-rules` (FR-019 (a)–(g)), join the 001 gate framework with plants; style-lint learns to reject unknown
token names; `csp` and `prefix` widen to the Storybook output. A minimal Storybook (one story per token group) is
added and must run under the constitution's CSP with zero violations, proven by a browser test; a spike settles
first whether that is possible under the pinned Storybook, and if not the phase stops and asks the operator. The
`--sk-*` mapping table is written from kitty-mission-ui.

## Technical Context

**Language/Version**: TypeScript 6.0.3 (strict) on Node 26.13.0 (type stripping), CSS.

**Primary Dependencies**: existing: Vitest 5.0.5, Playwright 1.64.1, PostCSS 8.5.31, postcss-value-parser 4.2.0,
Stylelint 17.16.0, parse5 8.0.1, Vite 8.3.5. New (dev, workspace `storybook/` only): `storybook` and
`@storybook/html-vite` 10.6.4 (research R-10; exact version pinned at install, at least seven days old).

**Storage**: files: token source, pair list, font files, generated `dist/`.

**Testing**: Vitest (`tokens` project, node), with Playwright-driven Chromium for browser behaviour (research R-03);
gate tests in the `gates` project; plants through `gate:plants`; Stryker on changed source.

**Target Platform**: evergreen browsers; Chromium in tests; hosts under the strict CSP of constitution IV plus
`font-src 'self'`.

**Project Type**: library (pnpm workspace) plus repository gates.

**Performance Goals**: none beyond CI time: each new gate under 10 s; the browser tests under 60 s.

**Constraints**: strict CSP with no exception (package output and Storybook); no network at build or run time;
no `sk-` names or monospace in package source or output; every gate proven by plants; test-first (VIII).

**Scale/Scope**: about 130 tokens in 8 groups; 130 required contrast pairs per theme (134/133 entries with
exclusions); 7 brand rules; 4 user stories.

## Constitution Check

*Pre-design and post-design: PASS, with the readings below recorded.*

| Principle | How this plan meets it |
|---|---|
| I. `ocelle-` names, no `sk-` | Every token is `--ocelle-*`. The `--sk-*` mapping table (FR-024) is **documentation, not source**: it lives in `specs/002-design-tokens/sk-mapping.md`, is never built, imported or published, and the prefix gate's scope (package source, test code, built output) does not include it. Its test refers to columns by position and contains no `sk-` literal (research R-13). |
| II. Tokens only, brand rules enforced | All values in `@ocelle/tokens`; brand rules (a)–(g) as the `brand-rules` gate; unknown token names rejected by style-lint. **Radius reading** (SPEC-2-03): "one radius" is read as one general radius (`radius-2`, 4 px) beside named-use radii `radius-1` (small marks), `radius-row` (rows, cards), `radius-shell` (outer app shell), `radius-pill` (state pills); the gate enforces that closed set. Rendered brand rules (chrome use, digest grouping, ochre fill never alone) stay with the elements and #10. |
| III. Accessible by construction | Automated text and non-text contrast check (`contrast` gate) over 130 pairs per theme; `--ocelle-target-min` 2.75rem; focus ring tokens; reduced motion; forced colours not overridden (rule (g)). |
| IV. Strict CSP, offline | Tokens ship as an external stylesheet; font vendored, relative URL. **Font CSP reading**: constitution IV's CSP has no `font-src`, so a host that wants the brand font adds `font-src 'self'`; this is a host setting, not an exception in the library's output, and without it the fallback fonts apply with the font file as the only violation (US2 scenario 6). No amendment needed. Storybook output and run time held to the CSP (R-10). |
| V. Storybook is the visual source | Token stories per group in light and dark; baselines and visual regression stay with #10, which builds on this Storybook. |
| VI. Consumer-driven, own code | Consumers named in the spec; values from #5 and the operator's prototype table as values only (R-05); font from upstream. |
| VII. Semver | Token names are new surface: MINOR, changelog entry (R-11); pre-1.0. |
| VIII. Test-first, non-vacuous | Each phase red first; generator and gates mutation-tested; every new gate and rule has fail, pass and breaking plants; the contrast gate exits 2 on zero pairs. |
| Workflow gates | `contrast` and `brand-rules` become required checks (operator ruleset change); the "Contrast check" deferral ends. |

## Decisions the operator should see at the plan gate

1. **Light `color-chrome-hover` = `#211D18`** (research R-04): focus 3.01:1 on it, chrome-ink 13.84, chrome-muted
   6.22, luminance 0.0127. **It is only 1.107:1 against `color-chrome`** (was 1.233:1), so hover on the chrome is
   barely visible (check 3, SPEC-3-03). Applied as decided at SPEC-2-01.
2. **Prototype values** (R-05): light shadows of `elevation-raised`, `-row`, `-seg`; ring width 1px; dialog units
   `vw`/`dvh`. Source hashed in `sources/`.
3. **Excluding a required pair is a finding** (`required-pair-excluded`, R-07; check 3, SPEC-3-02). This tightens
   FR-016's last-but-two sentence; the squad fix should align the spec text.
4. **Storybook run-time CSP spike first** (R-10); stop and ask if it cannot reach zero violations.
5. Check 3 note SPEC-3-04: the light shadows and ring width are tested against the exact values of R-05, not a
   described structure; only the dialog sizes are tested at a known viewport.

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
├── CHANGELOG.md
└── test/                    # source, generate, json, font, sk-mapping; test/browser/ (Playwright)
gates/
├── bin/contrast.ts  bin/brand-rules.ts
├── lib/wcag.ts  lib/token-source.ts
├── stylelint/token-only.ts  (unknown-token rule)
├── bin/csp.ts  bin/prefix.ts (scope widened)
├── gates.json  lib/registry.ts  README.md
└── plants/contrast/…  plants/brand-rules/…  plants/style-lint/…  plants/csp/…  plants/prefix/…
storybook/                   # private workspace package
├── .storybook/ (main.ts, preview.ts, manager.ts, theme)
├── stories/tokens.stories.ts
├── scripts/externalise.ts   scripts/swatches.ts
└── test/csp.test.ts
.github/workflows/ci.yml     # jobs contrast, brand-rules
THIRD_PARTY_NOTICES          # font entry
pnpm-workspace.yaml          # + storybook
```

**Structure Decision**: tokens stay in `packages/tokens`; gates in the 001 framework; Storybook as a separate private
workspace so that #10 can extend it and nothing of it is published.

## Phases (user stories) for `/speckit-tasks`

1. **US1 Tokens and themes** (P1): source, generator, build, exports, JSON, theme and motion tests, unknown-token
   style-lint rule and plants, Storybook spike then token stories and run-time CSP test, widened `csp`/`prefix`.
2. **US2 Font** (P2): vendoring, SOURCE.json and checksum test, `@font-face`, font-use, tabular-figure, request and
   CSP (with and without `font-src`) tests, notices.
3. **US3 Gates** (P3): `wcag.ts`, `token-source.ts`, `contrast` and `brand-rules` gates, pair list, plants, registry,
   CI, README.
4. **US4 Mapping** (P4): `sk-mapping.md` and its test (needs kitty-mission-ui access).

US1's Storybook work may be split into its own phase by the tasks step if it grows; the spike is its first task.

## Complexity Tracking

| Item | Status |
|---|---|
| **Closed from 001**: "Contrast gate absent — sunset when #5 merges" (001 plan) | Closed by this feature's `contrast` gate (FR-022). |
| Exceptions to principles | None taken. If the Storybook spike cannot reach zero CSP violations, the phase stops and the operator decides (FR-023); any exception would be added here only with that approval. |
