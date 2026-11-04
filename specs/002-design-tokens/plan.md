# Implementation Plan: Design Tokens

**Branch**: `002-design-tokens` (work on `claude/kitty-ui-speckit-decouple-x3prkx`) | **Date**: 2026-11-03 |
**Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/002-design-tokens/spec.md` (approved at gate "spec" after three checks),
with the operator's answers of 2026-11-03: SPEC-1-05 and SPEC-3-01 (Storybook held to the strict CSP, statically and
at run time), SPEC-2-01, SPEC-2-02 (the prototype file, supplied as `sources/console-v2-tokens.md`) and SPEC-2-03;
and the squad round 1, 2 and 3 fixes and the operator's fork decisions (`reviews/plan/round-1/refute.md`,
`fixes-1.md`; `reviews/plan/round-2/refute.md`, `fixes-1.md` there; `reviews/plan/round-3/refute.md`, `fixes-1.md`
there).

## Summary

`@ocelle/tokens` gets one typed token source (`src/source.ts`) from which a pure generator produces the stylesheet
(`dist/tokens.css`: light in `:root`, dark under `prefers-color-scheme: dark` unless `data-theme="light"`, and under
`data-theme="dark"`; reduced motion; `@font-face`), the JSON export and the typed name list; a `color-scheme` token
hands the theme keyword to #6. The Schibsted Grotesk variable font and its OFL licence are vendored with a checksum
record; a package README states the host contract. Two new gates, `contrast` (149 required pairs per theme derived
from the intended grounds in the source, pinned to A.8 by a test, plus a pair list with recorded figures and
exclusions) and `brand-rules` (FR-019 (a)–(g)), join the 001 gate framework with plants; style-lint learns to reject
unknown token names (the element custom properties the custom-elements manifest declares exempt by exact name),
with the token source added to the plant configuration set and plants stating their changes as structured deltas
by key over it, their expected locations resolved by key; `csp` and `prefix` widen to this repository's Storybook
inputs and the built HTML entries, `csp` reading the TypeScript inputs as TypeScript; Storybook's fonts are checked by
a theme unit test and a run-time monospace check. A minimal
Storybook (one story per token group) is added and must run with zero violations under the constitution's CSP plus
the Storybook page's host additions (`font-src`, `connect-src` `'self'`), proven by a browser test; the Storybook page
is the preview (`iframe.html`) alone and the build ships no manager UI (operator decision R1-01, 2026-11-04); a
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
served from generator output written in each suite's `beforeAll` inside the test worker, in a `tokens-browser`
project; a `storybook` project (node unit tests, no build) and a `storybook-integration` project whose global setup
builds Storybook into a temporary directory; expected values transcribed from Appendix A in the tests, and a node
test comparing the generator output from the real source with that table; gate tests in the `gates` project; plants
through `gate:plants`; Stryker on changed source, now including `storybook/scripts/`, `storybook/.storybook/` and the story render code
under `storybook/stories/` (story files, tests and `.d.ts` out; R1-02),
with `tokens-browser` and `storybook-integration` excluded from mutation runs like `gates-integration` (the `tokens`
project excluding `test/browser/`, so no test file sits in both a mutated and an excluded project) and
`ignoreStatic` off (research R-03, *Mutation path*).

**Target Platform**: evergreen browsers; Chromium in tests; hosts under the strict CSP of constitution IV plus
`font-src 'self'`.

**Project Type**: library (pnpm workspace) plus repository gates.

**Performance Goals**: none beyond CI time: each new gate under 10 s; the browser tests under 60 s; a mutation shard
with a 120-line `source.ts` entry under the 10-minute `mutation-shard` limit, measured by the US1 spike (stop and
ask above it).

**Constraints**: strict CSP with no exception for the package output; the Storybook page with the host additions
taken as a constitution IV exception (Complexity Tracking); no network at build (Storybook telemetry disabled) or run time; no `sk-` names or monospace in
package source or output or in the Storybook files in scope; every gate proven by plants; test-first (VIII).

**Scale/Scope**: about 130 tokens in 8 groups; 149 required contrast pairs per theme (158/157 entries with
exclusions); 7 brand rules; 4 user stories.

## Constitution Check

*Pre-design and post-design: PASS, with the readings below recorded and two constitution IV exceptions taken with
the operator's approval, each in Complexity Tracking with scope, rationale and sunset (operator ruling 2026-11-03 on
analysis C1, "Exceptions + sunset").*

| Principle | How this plan meets it |
|---|---|
| I. `ocelle-` names, no `sk-` | Every token is `--ocelle-*`. The `--sk-*` mapping table (FR-024) is **documentation, not source**: it lives in `specs/002-design-tokens/sk-mapping.md`, is never built, imported or published, and the prefix gate's scope (package source, test code, built output) does not include it. Its test refers to columns by position and contains no `sk-` literal (research R-13). |
| II. Tokens only, brand rules enforced | All values in `@ocelle/tokens`; no monospace in the Storybook either, checked where the prefix gate cannot see it: a unit test of the Storybook UI theme's `fontBase` and `fontCode`, and a run-time check with a control element that no rendered element of the preview has a monospace computed `font-family` (PLAN-FRESH-3-002; the manager is not shipped, operator decision R1-01, 2026-11-04); brand rules (a)–(g) as the `brand-rules` gate (rule (b) also reads the pair list); unknown token names rejected by style-lint; element custom properties (constitution I) exempt by exact name as the committed custom-elements manifest declares them, with an exact-name clash against a token as exit 2 (FR-010; operator decision 2026-11-03, squad round 2, PLAN-FRESH-2-003 (a); PLAN-FRESH-2-004). **Radius reading** (SPEC-2-03): "one radius" is read as one general radius (`radius-2`, 4 px) beside named-use radii `radius-1` (small marks), `radius-row` (rows, cards), `radius-shell` (outer app shell), `radius-pill` (state pills); the gate enforces that closed set. Rendered brand rules (chrome use, digest grouping, ochre fill never alone) stay with the elements and #10. |
| III. Accessible by construction | Automated text and non-text contrast check (`contrast` gate) over 149 required pairs per theme, including the current bar, links and focus rings on state grounds, and `color-accent-strong` control borders on state grounds (#5 rule 1 extended); `--ocelle-target-min` 2.75rem; focus ring tokens; reduced motion; forced colours not overridden (rule (g), system-colour mappings allowed); forced-colours behaviour of elements tested by element tests under forced-colours emulation (axe has no such rule), and the README tells elements that `elevation-*` rings vanish there; `color-scheme` token for #6. |
| IV. Strict CSP, offline | Tokens ship as an external stylesheet; font vendored, relative URL. **Font CSP reading**: constitution IV's CSP has no `font-src`, so a host that wants the brand font adds `font-src 'self'`; this is a host setting, not an exception in the library's output, and without it the fallback fonts apply with the font file as the only violation (US2 scenario 6). No amendment needed. **Storybook page exception** (Complexity Tracking, exception 1; operator decision 2026-11-03, squad round 1, PLAN-A11Y-SECURITY-1-001 (a); taken as an exception by the operator's ruling on analysis C1): Storybook's preview fetches its story index, so the Storybook page, and only that page, is served with the host additions `connect-src 'self'` and `font-src 'self'`; the Storybook page is the preview (`iframe.html`) alone, `frame-src` is not added, and the build ships no manager UI (no `index.html`, `sb-manager/` or `sb-addons/`, asserted by a test), because the manager cannot run under the header (operator decision R1-01, 2026-11-04, phase 3 review round 1); this departs from "built output runs under `default-src 'none'; script-src 'self'; style-src 'self'` with no exception" for the Storybook build, not for the package output; the run-time test asserts that exact header and zero violations (R-10). **Static scope exception** (Complexity Tracking, exception 2; operator decisions 2026-11-03, squad round 1, PLAN-FRESH-1-001 (a), narrowed further in squad round 2, PLAN-FRESH-2-001 (a); taken as an exception by the operator's ruling on analysis C1): the static `csp` and `prefix` gates cover this repository's Storybook inputs before bundling (`storybook/stories`, `.storybook`, `scripts`, `.generated`) and the HTML entries as `externalise.ts` leaves them; `csp` parses the `.ts` inputs as TypeScript and applies the dynamic-code and markup-literal rules, with markup literals in `storybook/scripts/` exempt (the externaliser names the tags it moves), and plants a defect in a story and in `preview.ts` (squad round 3, PLAN-FRESH-3-001 (a)); every bundle under `storybook/dist/` (the Vite preview bundle, into which Vite compiles Storybook's preview runtime; the manager's `sb-addons/` and `sb-manager/` are not shipped, R1-01) is left to the run-time test, which serves the whole build under the page's header (R-10, FR-023). This narrows SPEC-1-05's "no style attribute remains in the built output"; recorded in `gates.json` and `gates/README.md`. Both exceptions are reviewed when #10 extends this Storybook. No build-time network: Storybook telemetry disabled and tested. |
| V. Storybook is the visual source | Token stories per group in light and dark; baselines and visual regression stay with #10, which builds on this Storybook. |
| VI. Consumer-driven, own code | Consumers named in the spec; values from #5 and the operator's prototype table as values only (R-05); font from upstream. |
| VII. Semver | Token names are new surface: MINOR, changelog entry (R-11); pre-1.0. |
| VIII. Test-first, non-vacuous | Each phase red first; generator, `build.ts` (thin I/O boundary) and gates mutation-tested, and `storybook/scripts/` and `.storybook/` brought into the mutation and typecheck scope, with the story render code under `storybook/stories/` (not the `*.stories.ts` files, tests or `.d.ts`) in the mutation scope too (phase 3 review round 1, R1-02); expected values transcribed from Appendix A (not read from the source), a node test comparing the generator output from the real source with them, and the required pair set pinned to A.8, so source mutants are killed without browser suites or a Storybook build in the mutation path (those projects excluded, no test file in both a mutated and an excluded project, `ignoreStatic` off, shard time measured; PLAN-FRESH-2-002); one resolver (`resolve()`) shared by the JSON export, validation and the contrast gate, with unit tests (PLAN-FRESH-2-005); browser tests serve current generator output, observe used values and the platform font, and their CSP collector has a control violation; every new gate and rule has fail, pass and breaking plants, each fail plant listing every finding its change gives (PLAN-FRESH-2-006); the token source is in the plant configuration set, plants change it, the generator and the pair list only by structured `delta.json` deltas by key (token overrides, pair keys, a generator wrapper) with expected locations resolved by key, proven to survive a neighbour's value change, an inserted token and pair, and an unrelated value change (PLAN-FRESH-2-007, PLAN-FRESH-3-003 (a)); the `csp` gate's `.ts` scope has fail plants, and the Storybook monospace check has a control element (PLAN-FRESH-3-001, -002); and plants and tests using `--ocelle-x` move to real names with the reason recorded; the contrast gate exits 2 on zero pairs. |
| Workflow gates | `contrast` and `brand-rules` become required checks (operator ruleset change); the "Contrast check" deferral ends. |

## Decisions the operator should see at the plan gate

1. **Light `color-chrome-hover` = `#211D18`** (research R-04): focus 3.01:1 on it, chrome-ink 13.84, chrome-muted
   6.22, luminance 0.0127. **It is only 1.107:1 against `color-chrome`** (was 1.233:1), so hover on the chrome is
   barely visible (check 3, SPEC-3-03). Applied as decided at SPEC-2-01.
2. **Prototype values** (R-05): light shadows of `elevation-raised`, `-row`, `-seg`; ring width 1px; dialog units
   `vw`/`dvh`. Source hashed in `sources/`.
3. **Excluding a required pair is a finding** (`required-pair-excluded`, R-07; check 3, SPEC-3-02). FR-016 and
   FR-020 were aligned in squad round 1.
4. **Storybook run-time CSP spike first** (R-10): its first output is the `csp` gate's findings on the Vite preview
   bundle and on `sb-addons/` (recorded, outside the static scope); it records every violation by directive under
   the Storybook page's header, runs the widened `csp` and `prefix` gates on the files in scope, and measures a
   mutation shard with a 120-line `source.ts` entry (R-03); it also runs the run-time monospace check and records
   whether the token stories draw canvas text; stop and ask if the run-time test (CSP or monospace) or a gate fails,
   the stories draw canvas text, or the shard exceeds 10 minutes.
5. Check 3 note SPEC-3-04: the light shadows and ring width are tested against the exact values of R-05, now in
   Appendix A (squad round 1); the dialog sizes are also tested as used sizes at a known viewport.
6. **Fork decisions of squad round 1** (operator, 2026-11-03; `reviews/plan/round-1/refute.md`):
   - PLAN-A11Y-SECURITY-1-001 (a): Storybook page host additions `connect-src 'self'`, `frame-src 'self'` (Constitution
     Check IV, R-10); `frame-src` dropped with the manager by item 11 (R1-01).
   - PLAN-A11Y-SECURITY-1-004 (b): theme-dependent token `color-scheme` (`light`/`dark`), applied by #6 (R-02, A.1).
   - PLAN-A11Y-SECURITY-1-011 (a): rule (g) allows mapping colour tokens to system colours (FR-018, R-08).
   - PLAN-A11Y-SECURITY-1-012 (a): `color-current` on four grounds and `color-link`, `color-focus` on the five state
     `-bg` grounds added to A.8; with item 7, 149 required pairs per theme, all passing (R-07).
   - PLAN-FRESH-1-001 (a): static Storybook scope narrowed to the files this repository produces; this loosens
     SPEC-1-05's "no style attribute remains in the built output" (FR-023, R-10); narrowed further in round 2
     (item 8).
   - PLAN-FRESH-1-007 (a): element custom properties named `--ocelle-<element>-<property>`, exempt from the
     unknown-token rule (FR-010, R-09); the exemption is by exact declared name since round 2 (item 8).
   - PLAN-TESTABILITY-1-003 (a): `use` dropped from the source records, kept as comments (R-01).
7. **Controls on state grounds** (question left open by PLAN-A11Y-SECURITY-1-012 (a); operator answer 2026-11-03:
   "Rule 1 extended"). `color-control-border` is 2.91:1 on `color-neutral-bg` in light (3.05 to 3.21 on the other
   state grounds in light, 3.17 to 3.56 in dark). As with `color-inset` and `color-hover-bg`, a control drawn on any
   state `-bg` (`danger`, `warning`, `success`, `info`, `neutral`) uses `color-accent-strong` for its border, in both
   themes: `color-control-border` on those five grounds is an excluded pair (A.9), and `color-accent-strong` on them
   is a required pair (A.8; 4.27 to 4.71 light, 6.74 to 7.56 dark). Required pairs: 149 per theme; pair list: 158
   entries in light, 157 in dark (R-07). The README's rendered brand rules name the state grounds.
8. **Fork decisions of squad round 2** (operator, 2026-11-03; `reviews/plan/round-2/refute.md`):
   - PLAN-FRESH-2-001 (a): the static `csp`/`prefix` scope is this repository's Storybook inputs before bundling
     (`storybook/stories`, `.storybook`, `scripts`, `.generated`) and the HTML entries after `externalise.ts`; every
     bundle in `storybook/dist/` is left to the run-time CSP test, because Vite compiles Storybook's preview runtime
     into the preview bundle and esbuild builds `sb-addons/` from Storybook's code. A further narrowing of SPEC-1-05
     (FR-023, R-10); the byte-identity fence of round 1 is dropped.
   - PLAN-FRESH-2-003 (a): the unknown-token rule exempts exactly the `cssProperties[].name` the custom-elements
     manifest declares; the prefix-overlap load failure becomes an exact-name clash check, so element names such as
     `ocelle-icon` and `ocelle-dialog` stay available; a fail plant `var(--ocelle-button-gpa)` (FR-010, R-09).
9. **Fork decisions of squad round 3** (operator, 2026-11-03; `reviews/plan/round-3/refute.md`):
   - PLAN-FRESH-3-001 (a): the `csp` gate parses the `.ts` inputs of its static scope as TypeScript and applies the
     dynamic-code rules and the markup rules to string and template literals; markup literals in
     `storybook/scripts/` are exempt (stated and planted); fail plants in a story file, `.storybook/preview.ts` and
     `storybook/scripts/` (FR-023, R-10, contracts/gates.md). This extends the gate to these source files on purpose;
     package source stays outside it.
   - PLAN-FRESH-3-003 (a): `contrast` and `brand-rules` plants state their changes as `delta.json` by key (token
     overrides through an empty committed `overrides.ts`, pair entries by `(theme, fg, bg)`, a generator wrapper),
     and their expected locations by key, resolved to lines in the plant's tree; replaces round 2's `tree.patch`
     (R-08, data-model § Token overrides, contracts/gates.md § Configuration set). Phase 5 review round 1, R1-01 (c)
     (operator, 2026-11-04): a fourth, closed part `"pairsList": "empty" | "not-json"` replaces the whole pair list
     with `[]` or a fixed text that is not JSON, for the `empty-list` and `unparsable-list` breaking plants; it
     excludes `pairs`, and no free-text form of the list exists.
10. **Analysis ruling C1** (operator, 2026-11-03, "Exceptions + sunset"; `analysis-report.md`): the Storybook page's
    host additions and the narrowed static `csp`/`prefix` scope (items 6 and 8) are constitution IV exceptions, not
    readings. Each is a Complexity Tracking row with scope, rationale, approval and the sunset "reviewed when #10
    extends this Storybook"; the Constitution Check row IV refers to them.
11. **Phase 3 review round 1, R1-01** (operator, 2026-11-04, "preview only, amend the spec";
    `reviews/phase-3/operator-decisions.md`): the token reference under the strict CSP is the Storybook preview
    (`iframe.html`) alone. The manager UI cannot run under the Storybook page's header (spike step 2, technique 1), so
    the run-time CSP and monospace checks cover the preview only, `frame-src` is not added, and the build stops
    shipping the manager: `storybook build --preview-only` (an option of the pinned Storybook 10.6.5's `build`
    command that skips the manager build; checked by a trial build at the planner step, whose output had no
    `index.html`, `sb-manager/` or `sb-addons/`), with a test that the output holds none of the three (R-10, FR-023,
    US1 scenario 11, SC-008). The phase 3 fix round implements this test-first.

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
├── src/source.ts            # the token source (data-model § Token), records with overrides applied
├── src/overrides.ts         # empty token override list; plants fill it (data-model § Token overrides)
├── src/generate.ts          # pure: css(), json(), names(), resolve(), validateSource(), applyOverrides()
├── src/index.ts             # TokenName, tokenNames, tokens, cssName
├── scripts/build.ts         # writes dist/tokens.css, dist/tokens.json, copies fonts/
├── contrast/pairs.json      # contrast pair list (data-model § Contrast pair)
├── fonts/SchibstedGrotesk-wght.woff2  fonts/OFL.txt  fonts/SOURCE.json
├── README.md                # host contract, CSP allowance, forced colours, rendered brand rules (R-15)
├── CHANGELOG.md
└── test/                    # source, source-table (real source vs Appendix A), generate and resolve (fixture
                             # sources), json, build, font, readme, sk-mapping;
                             # test/browser/ (tokens-browser project, not mutated; serve.ts: each suite's
                             # beforeAll writes generator output to a temp dir inside the worker)
gates/
├── bin/contrast.ts  bin/brand-rules.ts
├── lib/wcag.ts  lib/token-source.ts
├── lib/plant-repo.ts        # configurationSet + token source, overrides, generator, pair list; delta.json
│                            # deltas by key, keyed plant locations
├── lib/mutation/ranges.ts   # scope + storybook/scripts, storybook/.storybook, storybook/stories
│                            # (no *.stories.ts, tests or .d.ts; R1-02)
├── stylelint/token-only.ts  (unknown-token rule, exact-name element-property exemption from the manifest)
├── bin/csp.ts  bin/prefix.ts (scope widened to the Storybook inputs and HTML entries; csp parses .ts as
│                            TypeScript; prefix exports monospaceFamilies)
├── test/contrast-required.test.ts  # required set equals A.8
├── gates.json  lib/registry.ts  README.md
└── plants/contrast/…  plants/brand-rules/…  plants/style-lint/…  plants/csp/…  plants/prefix/…
storybook/                   # private workspace package
├── .storybook/ (main.ts with telemetry disabled, preview.ts, manager.ts exporting its theme)
├── stories/tokens.stories.ts
├── scripts/externalise.ts   scripts/swatches.ts  (pre-build: token and swatch stylesheets and fonts from the
│                            token source into .generated/, R-10)
├── test/unit/ (externalise, swatches, telemetry, theme font, scope tests; `storybook` project)
└── test/integration/csp.test.ts  (`storybook-integration` project, global setup builds Storybook; CSP and
                                   monospace checks)
vitest.config.ts             # + tokens-browser, storybook, storybook-integration projects; tokens project
                             # excludes packages/tokens/test/browser/**
vitest.mutation.config.ts    # also excludes tokens-browser, storybook-integration (test: no test file in both a
                             # mutated and an excluded project)
tsconfig.json                # + storybook/.storybook/**/*.ts
.gitignore                   # + storybook/dist/, storybook/.generated/
.github/workflows/ci.yml     # jobs contrast, brand-rules
THIRD_PARTY_NOTICES          # font entry
pnpm-workspace.yaml          # + storybook
```

**Structure Decision**: tokens stay in `packages/tokens`; gates in the 001 framework; Storybook as a separate private
workspace so that #10 can extend it and nothing of it is published.

## Phases (user stories) for `/speckit-tasks`

1. **US1 Tokens and themes** (P1): source (with `color-scheme`), generator with `resolve()`, thin build, exports,
   JSON, source-table node test on the real source, `tokens-browser` project (and the `tokens` project's browser
   exclude) and mutation exclusion with the project-overlap test, browser test
   setup in the worker (`serve.ts`) and violation collector, theme, value and motion tests against the transcribed
   table, README (host contract, brand rules, forced colours), configuration set change with `delta.json` plants
   and keyed locations (`overrides.ts`, `applyOverrides`),
   unknown-token style-lint rule (with exact-name element exemption from the manifest) and plants, `--ocelle-x`
   plants and tests moved; Storybook spike (`csp` findings on the preview bundle and `sb-addons/`, violations by
   directive, widened gates, mutation shard time) then telemetry off, token stories, `storybook` and
   `storybook-integration` Vitest projects, scopes (mutation, typecheck, prefix source), theme font test, run-time
   CSP and monospace test, widened `csp`/`prefix` (`csp` reading `.ts` as TypeScript, with its plants).
2. **US2 Font** (P2): vendoring, SOURCE.json and checksum test, `@font-face`, font-use (platform font), tabular-figure,
   request and CSP (with and without `font-src`) tests, README CSP allowance and its test, notices.
3. **US3 Gates** (P3): `wcag.ts`, `token-source.ts`, `contrast` and `brand-rules` gates, pair list, A.8 test, plants,
   registry, CI, README.
4. **US4 Mapping** (P4): `sk-mapping.md` and its test (needs kitty-mission-ui access).

US1's Storybook work may be split into its own phase by the tasks step if it grows; the spike is its first task.

## Complexity Tracking

**Closed from 001**: "Contrast gate absent — sunset when #5 merges" (001 plan), closed by this feature's `contrast`
gate (FR-022).

| Exception | Scope | Rationale | Operator approval | Sunset |
|---|---|---|---|---|
| 1. Storybook page CSP host additions (constitution IV: built output under `default-src 'none'; script-src 'self'; style-src 'self'` with no exception) | The page serving the built Storybook (`storybook/dist/`) only, run time: constitution IV's CSP plus `connect-src 'self'` and `font-src 'self'`, exactly that header, asserted by the run-time test with zero violations (FR-023, R-10). The Storybook page is the preview (`iframe.html`) alone; no `frame-src`; the build ships no manager UI (`index.html`, `sb-manager/`, `sb-addons/`), asserted by a test (operator decision R1-01, 2026-11-04). Package output (`packages/*/dist/`) gets no addition. | The preview loads its story index with `fetch` (`connect-src`); the token stories use the vendored font (`font-src`). The manager UI cannot run under the header (run-time `<style>` elements, reviews/phase-3/spike.md), so it is not shipped rather than given a further exception. Without them the pinned Storybook cannot run at all (reproduced, squad round 1). | Squad round 1 fork PLAN-A11Y-SECURITY-1-001 (a), 2026-11-03; ruled an exception on analysis C1, 2026-11-03 ("Exceptions + sunset"). | Reviewed when #10 extends this Storybook. |
| 2. Narrowed static `csp`/`prefix` scope for the Storybook build (constitution IV: no inline script, style element or attribute, `eval` or `new Function` in built output) | The static gates cover this repository's Storybook inputs before bundling (`storybook/stories/`, `.storybook/`, `scripts/`, `.generated/`) and the HTML entries after `externalise.ts` (`storybook/dist/*.html`); every bundle under `storybook/dist/` (Vite preview bundle, files `externalise.ts` moves out; `sb-addons/` and `sb-manager/` are not shipped, R1-01) is checked only by the run-time CSP test. Narrows SPEC-1-05's "no style attribute remains in the built output"; recorded in `gates/gates.json` and `gates/README.md`. | Vite compiles Storybook's preview runtime into the preview bundle and esbuild builds `sb-addons/` from Storybook's code, which contains `Function("return this")` and style-attribute strings; no static fence separates them from this repository's stories (reproduced, squad rounds 1 and 2). The run-time test under exception 1's header still catches any violation they cause. | Squad round 1 fork PLAN-FRESH-1-001 (a) and squad round 2 fork PLAN-FRESH-2-001 (a), 2026-11-03; ruled an exception on analysis C1, 2026-11-03 ("Exceptions + sunset"). | Reviewed when #10 extends this Storybook. |

No other exception is taken. If the Storybook spike cannot reach zero CSP violations under exception 1's header, or
the files in scope cannot be freed of inline script, the phase stops and the operator decides (FR-023); any further
exception is added here only with that approval.
