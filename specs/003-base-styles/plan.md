# Implementation Plan: Base Styles

**Branch**: `003-base-styles` (work on `claude/006-base-styles`) | **Date**: 2026-11-09 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/003-base-styles/spec.md`. The operator approved it at gate "spec" after
three checks and a final fix (`8905627`).

## Summary

`@ocelle/styles` ships one hand-written external stylesheet, `base.css`. It is copied from `src/` to `dist/` by a
thin build script, and every value in it is an `--ocelle-*` token. It has four families:

- **Base layer** (no hook): the reset, the body, the root `color-scheme` (the 002 hand-off), the focus ring in
  longhands, `code`/`pre`/`kbd`/`samp` in Schibsted Grotesk with tabular figures, and forced colours. It declares
  no motion.
- **Compact scale**: the `data-ocelle-density` attribute, which never changes the root font size, and the
  `data-ocelle-value` attribute.
- **Prose**: the `data-ocelle-prose` attribute. Tables become their own scroll box without a wrapper.
- **Identifier wrap**: the `data-ocelle-wrap="anywhere"` attribute.

Base selectors sit entirely in `:where()`, so their specificity is (0,0,0). Hook selectors are one attribute plus
`:where()`, so (0,1,0). The file order makes prose win over compact on one element (research R-03).

Five tokens are added to `@ocelle/tokens`: `line-height-compact`, `line-height-prose`, `font-size-subhead`,
`measure-reading` and `measure-cell`. The style lint is tightened for `packages/styles` so that line heights must be
tokens.

The behaviour is proven in a new `styles-browser` project: Playwright against fixture pages, served under the
strict CSP, in both themes and forced colours, with keyboard focus and the accessibility tree read through CDP. The
file's own properties are proven by source-level checks, and every guard has a planted defect. Storybook gains one
story per family.

## Technical Context

**Language/Version**: CSS (the stylesheet); TypeScript 6.0.3 strict on Node 26.13.0 (build script, tests).

**Primary Dependencies**:
- existing: Vitest 5.0.5, Playwright 1.64.1, PostCSS 8.5.31, postcss-value-parser 4.2.0, Stylelint 17.16.0,
  Storybook 10.6.5;
- new explicit pin: `postcss-selector-parser`, at the version already in the lockfile, as a root devDependency for
  the specificity check (research R-11).

**Storage**: files: `src/base.css`, the generated `dist/base.css`, test fixtures.

**Testing**:
- `styles` (node; in mutation runs): build, source-level and readme tests.
- `styles-browser` (node and Playwright; excluded from mutation): every browser scenario (research R-09).
- `tokens`: the new tokens.
- `storybook` and `storybook-integration`: the four stories.

**Target Platform**: evergreen browsers; Chromium in tests. Hosts under constitution IV's CSP, plus `font-src 'self'`
for the font (as in 002).

**Project Type**: library (pnpm workspace) plus repository gates.

**Performance Goals**: none beyond CI time. The `styles-browser` suite should take under 60 s. Every mutation shard
stays within the 60-line entries of the mutation gate.

**Constraints**:
- No `@import`, no `url()`.
- No class selectors, and selector specificity within the bounds of FR-025.
- Line heights only as tokens.
- No monospace.
- The root font size is never set.

**Scale/Scope**: about 45 rules in one file, 4 hooks, 5 new tokens (109 to 114), about 40 browser scenarios plus
the guard plants.

## Constitution Check

*Pre-design and post-design: PASS. No new exception is taken. The two Storybook exceptions of 002 are unchanged and
cover the new stories, because they live in the same preview.*

| Principle | How this plan meets it |
|---|---|
| I. `ocelle-` names, no `sk-` | Hook attributes are `data-ocelle-*` and tokens `--ocelle-*`. The E-23/E-37/E-39 table in the README names kitty-mission-ui's exceptions by their ids, with no `sk-` names. The Prefix gate scans `packages/styles/**` and `dist/base.css` after the build. |
| II. Tokens only, brand rules | Every value is a token under `ocelle/token-only`. Line heights must be tokens in `packages/styles` (R-07, with a plant). There is no monospace anywhere: `code`, `pre`, `kbd` and `samp` are set page-wide (FR-026), checked by the Prefix gate and by computed style. Links use `--ocelle-color-link`. Rules use `color-rule` and `color-rule-strong` only for decorative lines, never a control boundary. The one radius is `radius-2`. |
| III. Accessible by construction | The token focus ring is on every `:focus-visible` element, survives a missing `tokens.css` (longhands, R-05) and uses `Highlight` in forced colours. No motion. `--ocelle-target-min` is kept under compact on `<html>`. Prose links are underlined (WCAG 1.4.1). Code, inline code and URLs reflow (1.4.10). Overflowing tables are keyboard-scrollable (2.1.1). Table semantics in the accessibility tree are tested (R-06). Contrast pairs are all existing required pairs (R-08). Axe stays with #10, as in 002. |
| IV. Strict CSP, offline | An external stylesheet with no `@import`, `url()` or inline style. Fixtures and stories have no style attribute. The browser suite asserts zero violations under the strict header, with a control violation. |
| V. Storybook | One story per family under the 002 Storybook and its CSP test (R-12). Baselines and visual regression stay with #10. |
| VI. Consumer-driven, own code | #6, spec-kitty-design #519, #531 and #535, and kitty-mission-ui's E-23, E-37 and E-39. The CSS is our own; no reset library is copied. |
| VII. Semver | `base.css`, the four hook attributes and their values, and five new tokens are additions: MINOR. Both CHANGELOGs get entries, and the README documents the hooks (R-14). |
| VIII. Test-first, non-vacuous | Each phase starts red. The build script is mutation-tested. CSS has no mutation tool, so the source-level checks and browser tests carry it, and every guard is proven able to fail by a named plant (R-10). The new style-lint rule option has a fail plant. |
| Workflow gates | No gate added or renamed; the registry is unchanged. |

## Decisions the operator should see at the plan gate

1. **Hook names** (R-02): `data-ocelle-density` (`compact`, `regular`), `data-ocelle-value` (empty, `ink`),
   `data-ocelle-prose`, `data-ocelle-wrap` (`anywhere`). These are public surface.
2. **Token names** (R-08): `line-height-compact`, `line-height-prose`, `font-size-subhead` (18 px; not `font-size-h2`,
   so elements can use it), `measure-reading` and `measure-cell` in the shell group.
3. **Specificity by `:where()` rather than `@layer`** (R-03), so any host rule wins whether or not the host uses
   layers.
4. **Heading weights and sizes** (data-model): `h1` 30 px display weight (800); `h2` 18 px strong (600); `h3` 17 px
   strong; `h4` to `h6` 16 px strong.
5. **Table mechanism to be measured in a spike** (R-06): `display: block; overflow-x: auto` on the table, with cells
   at a 12ch floor. If Chromium drops table semantics or ignores the floor, the phase stops and the operator decides
   on the wrapper fork of FR-017.
6. **New pin** `postcss-selector-parser` for the specificity check (R-11).

## Project Structure

### Documentation (this feature)

```text
specs/003-base-styles/
├── spec.md, plan.md, research.md, data-model.md, quickstart.md
├── contracts/styles-package.md, contracts/checks.md
├── sources/spec-kitty-design-issues.md
├── checklists/requirements.md
└── reviews/ (spec checks, squad rounds, phase reviews)
```

### Source Code (repository root)

```text
packages/styles/
├── src/base.css                 # new: the stylesheet
├── src/index.ts                 # unchanged (exports nothing)
├── scripts/build.ts             # new: buildPlan + build (copy to dist/base.css)
├── package.json                 # build script, ./base.css export, files
├── README.md, CHANGELOG.md      # new
└── test/
    ├── sample.test.ts           # unchanged
    ├── build.test.ts, source.test.ts, readme.test.ts     # new (styles project)
    ├── browser/serve.ts + *.test.ts                      # new (styles-browser project)
    └── fixtures/*.html, fixtures/plants/*.css            # new
packages/tokens/
├── src/source.ts                # five new records
├── test/expected.ts             # five transcribed entries
└── README.md, CHANGELOG.md      # new tokens; color-scheme sentence names base.css
gates/stylelint/token-only.ts    # lineHeight: "token" option
gates/plants/style-lint/fail-styles-literal-line-height/
stylelint.config.ts              # override for packages/styles/**/*.css
vitest.config.ts, vitest.mutation.config.ts   # styles-browser project, excluded from mutation
package.json, pnpm-lock.yaml     # postcss-selector-parser pin
storybook/scripts/swatches.ts, .storybook/preview-head.html, stories/render.ts, stories/base.stories.ts, test/**
```

**Structure Decision**: the styles stay in `packages/styles`, the existing workspace package. There is no new
package and no new gate.

## Phases (user stories) for `/speckit-tasks`

1. **Setup** (exempt, no behaviour):
   - the `styles-browser` Vitest project and its mutation exclusion;
   - the `postcss-selector-parser` pin;
   - `packages/styles/package.json` (build script, export and files);
   - empty `src/base.css`;
   - a `scripts/build.ts` stub.
2. **US1 Base layer** (P1):
   - **spike**: measure the table mechanism of R-06 and the CDP accessibility tree access, and record them;
   - `buildPlan` and build with tests, and the source-level checks with their plants;
   - the line-height lint option and its plant;
   - `serve.ts` and the base fixture, then the browser tests for US1 scenarios 1 to 10 with their guard plants;
   - the base layer in `base.css`;
   - the README and CHANGELOG of styles, with the readme test, and the tokens README `color-scheme` sentence;
   - the Storybook "Base page" story, with `writeGenerated` and the preview-head link.
3. **US2 Compact** (P2): the token `line-height-compact` (source, expected, CHANGELOG, README); the compact and value
   rules; browser tests for US2 scenarios 1 to 5 (scenario 5 needs prose, so phase 4 extends it); the "Compact
   screen" story; the README hooks.
4. **US3 Prose** (P3): the tokens `line-height-prose`, `font-size-subhead`, `measure-reading` and `measure-cell`; the
   prose rules; browser tests for US3 scenarios 1 to 12 and the nested cases of US2 scenario 5; the "Prose document"
   story; the README.
5. **US4 Identifier wrap** (P4): the wrap rule; browser tests for US4 scenarios 1 to 4 and the FR-020 source check;
   the "Identifier wrap" story; the README, including the SC-006 stand-in table.

Each phase is folded after its approval (`/ocelle-run` step 4.3).

## Complexity Tracking

No new exception. 002's exceptions 1 (Storybook page CSP host additions) and 2 (narrowed static scope of the
Storybook build) apply unchanged to the four new stories. They are still reviewed when #10 extends this Storybook.
