# Tasks: Base Styles

**Input**: design documents in `specs/003-base-styles/`, as approved at the plan gate on 2026-11-09 after three
plan-squad rounds:
- spec.md;
- plan.md, with decisions 1 to 19 (decision 19 recorded after the analysis);
- research.md, R-01 to R-14;
- data-model.md;
- contracts/styles-package.md and contracts/checks.md;
- quickstart.md;
- analysis-report.md: the findings of the first analysis (at `db9078a`: F1, E1 to E5, U1 to U3, I1 to I5, A1, C1,
  C2) and of its re-run (at `bfdbfd4`: M1, L1 to L5) are resolved here.

**Tests**: required. Constitution Principle VIII applies to every phase. The phase flow is `base.sh`, an optional
`scaffold.sh`, one red commit of test files only proven by `red.sh`, then green, `tdd-check.sh` and an independent
review. Expected values are written by hand from the spec, data-model § Rule table and research R-08. They are never
read from `src/base.css` or `packages/tokens/src/source.ts`.

The guard rules:
- A guard assertion ("does not") never stands alone. It shares its test with the positive assertion it guards
  (SC-002, R-10, R-11).
- Each guard is proven able to fail by its plant from R-10, or by its recorded reason.
- A plant that does not make its guard fail stops the phase (stop-and-ask).

**Organization**:
- Phase 1 is Setup. Only its Vitest configuration change carries behaviour, so that part is red first.
- Phases 2 to 5 are User Stories 1 to 4, one review unit each.
- Each phase is folded after its approval (`/ocelle-run` step 4.3).
- Cross-cutting records (README, CHANGELOG, Storybook, plants) belong to the phase whose family they describe.
- There is no polish phase.

**Stop-and-ask points**: the implementer stops, records the question in the phase review and does not work around
it. The points are:
- **T007 spike outcomes (R-06, R-05, R-10)**, if any of these happens:
  - a `display: block; overflow-x: auto; container-type: inline-size` table loses role `table`, its `row`,
    `columnheader` or `cell` nodes, or its caption name in the CDP accessibility tree (this triggers the wrapper fork
    of FR-017);
  - a cell at `min-inline-size: var(--ocelle-measure-cell)` is narrower than 12ch and the content-floor alternative
    of R-06 also fails;
  - a host layout of `prose-hosts.html` (its scratch copy, T007) scrolls the page sideways;
  - the merged caption line boxes leave the visible box under `ltr` or `rtl`;
  - the forced-colours ring cannot be observed in a `forced-color-adjust: none` region;
  - any R-10 plant does not make its guard fail.
- **Any mutation shard over 10 minutes.**
- **A pins-gate refusal of the `@ocelle/tokens` peer dependency.**
- **A new colour pairing** that is not already a `checked` pair in `packages/tokens/contrast/pairs.json`
  (R-08; FR-021 forbids an unchecked pairing).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: can run in parallel (different files, no dependency on an unfinished task)
- **[Story]**: the user story of the task (US1 to US4)
- Paths are relative to the repository root.

---

## Phase 1: Setup

**Purpose**: the `styles-browser` test project and the package wiring.
- The Vitest configuration change is behaviour (which project runs which tests), so it goes red first through
  `gates/test/vitest-config.test.ts`.
- The rest has no behaviour of its own. It is listed in `specs/003-base-styles/reviews/phase-1/tdd-exempt.md`, which
  states that the phase is partly exempt and names the red commit for the rest.

**Independent Test**:
- `pnpm test` passes.
- `packages/styles/test/browser/*.test.ts` run in `styles-browser` only.
- `pnpm run gate:pins` accepts the peer dependency.
- `tdd-check.sh 1` reports `pass`.

### Tests (red, one commit)

- [X] T001 `gates/test/vitest-config.test.ts`: the mutation-excluded projects are exactly `gates-integration`, `tokens-browser`, `storybook-integration` and `styles-browser`. A file `packages/styles/test/browser/x.test.ts` matches the include of `styles-browser` and of no other project. A file `packages/styles/test/x.test.ts` matches only `styles` (contracts/checks.md § Tests added, research R-09). Commit it alone (`test(003-base-styles): phase 1 red — styles-browser project`) and run `.specify/extensions/story/scripts/red.sh 1 phase`; confirm it fails on these assertions

### Implementation

- [X] T002 `vitest.config.ts`: add the project `styles-browser` (node environment, include `packages/styles/test/browser/**/*.test.ts`, the shared excludes), and add `packages/styles/test/browser/**` to the `styles` project's exclude. In `vitest.mutation.config.ts`, add `styles-browser` to the excluded projects. T001 now passes
- [X] T003 [P] `packages/styles/package.json` (research R-01, contracts/styles-package.md § Files): `"build": "tsc -p tsconfig.json && node scripts/build.ts"`, `"exports": { ".": "./dist/index.js", "./base.css": "./dist/base.css" }`, `"files": ["dist", "CHANGELOG.md", "README.md"]` and `"peerDependencies": { "@ocelle/tokens": "workspace:0.0.0" }` (plan decision 11). Run no install here; T004's install records this peer dependency in the lockfile
- [X] T004 Root `package.json`, after T003: add `postcss-selector-parser` as an exact devDependency at the lockfile's version (7.1.7, research R-11). Run a non-frozen `pnpm install`, which also records T003's peer dependency in the lockfile importer `packages/styles` (pnpm checks peers against the lockfile), then commit `pnpm-lock.yaml`
- [X] T005 [P] Create an empty `packages/styles/src/base.css` and a stub `packages/styles/scripts/build.ts` that exports `buildPlan(css: string)` returning `[]` and a `build()` that writes nothing
- [X] T006 Write `specs/003-base-styles/reviews/phase-1/tdd-exempt.md`. It names T003 to T005 as having no behaviour (a manifest, a pin and empty stubs) and T001 as the red commit for T002. Then run `pnpm install --frozen-lockfile` (the install of `setup_command` and CI, which fails on a stale lockfile), `pnpm run gate:pins`, `pnpm run gate:typecheck` and `pnpm test` (each exit 0), and `.specify/extensions/story/scripts/tdd-check.sh 1`

**Checkpoint**: `tdd-check.sh 1` reports `pass`.

---

## Phase 2: User Story 1 - A host page gets the base layer from one external stylesheet (Priority: P1) 🎯 MVP

**Goal**: everything User Story 1 asks for, covering spec scenarios 1 to 10, FR-001 to FR-011, FR-022, FR-023,
FR-025 and FR-026:
- `base.css` ships the reset, the body, the root `color-scheme`, the longhand focus ring with the forced-colours
  defence, page-wide code fonts and no motion;
- the line-height lint, the source-level checks and the browser harness exist;
- the package has its README and CHANGELOG;
- Storybook has the "Base page" story.

The design sources are research R-01, R-03, R-05, R-07, R-09 to R-12 and R-14, data-model § Rule table (base
layer), and both contracts.

**Independent Test**:
- `pnpm test` passes `styles` (build, source and readme tests), `styles-browser` (US1 scenarios 1 to 10 under the
  strict CSP, with every guard plant) and the Storybook projects.
- `pnpm run gate:style-lint` rejects a literal line height in `packages/styles`.
- `pnpm run gate:plants` passes.
- `tdd-check.sh 2` reports `pass`.

### Spike (first)

- [X] T007 [US1] Spike, recorded in `specs/003-base-styles/reviews/phase-2/spike.md` with each measurement and the Chromium build. A plant can only be shown to bite against the rule it undoes, and in phase 2 most of those rules (the base media rule of T017, the compact and value rules of phase 3, the prose rules of phase 4, the wrap rule of phase 5) and most fixtures (`prose-hosts.html` is written in T033) do not exist yet. So the spike works on scratch files only:
  - **Scratch stylesheet**: one stylesheet, linked after `tokens.css`, that first defines the six R-08 tokens with their data-model § New tokens values (`--ocelle-line-height-compact: 1.5`, `--ocelle-line-height-prose: 1.65`, `--ocelle-font-size-subhead: 1.125rem`, `--ocelle-measure-reading: 68ch`, `--ocelle-measure-cell: 12ch`, `--ocelle-measure-container: 100cqi`) and then holds the whole data-model § Rule table, all four families (base layer, compact scale, prose, identifier wrap) in the table's order, as unlayered author rules with the table's selectors. Each R-10 plant stylesheet is linked after it, as R-10 links plants after `base.css`. The US1-6 plant ("without `tokens.css`") drops only the `tokens.css` link; the six scratch tokens are none of the focus tokens.
  - **Scratch fixture pages**: scratch copies of every fixture layout of data-model § Test fixtures that a measurement or a plant needs, built from that section and the host CSS it gives `layout.css`: the media page (`img`, `video`, `canvas` and `svg` at `width="2000" height="1000"`, the `img` source a 2:1 `media.svg`, served with `img-src 'self'`), the controls and the `forced-color-adjust: none` region of `page.html`, the hosts of `prose-hosts.html` (grid `1fr` beside a 60 px rail, `flex: 1` beside a 60 px rail, nested in the grid item, and the definite-width modal dialog), and the pages of `compact.html` (with its prose cases), `compact-root.html`, `prose.html`, `prose-root.html` and `wrap.html` that the other plants run on. All of them are served under the strict CSP of R-09.
  - `spike.md` records both choices (the scratch stylesheet's contents and order, and which scratch page each measurement and plant used). Neither the scratch stylesheet nor the scratch pages are committed: the shipped rules land in T017, T029, T041 and T049, and the fixtures are written in T011, T024, T033 and T044 from data-model § Test fixtures.

  On those scratch files, measure:
  - Steps 1 to 5 of research R-06 ("Verify in the spike"):
    - the accessibility tree through CDP `Accessibility.getFullAXTree`;
    - the 12ch cell floor;
    - every host layout of the scratch copy of `prose-hosts.html`, the definite-width dialog included;
    - the fitting-table plant;
    - the merged caption line boxes at `scrollLeft` 0 and scrolled, under `ltr` and `rtl`, with a caption ending in a full stop.
  - The forced-colours ring inside a `forced-color-adjust: none` region (R-05).
  - That each plant of R-10 makes its guard fail against the scratch stylesheet's rule it undoes (for each plant, the guard passes without it and its helper reports the expected problem with it), and that list semantics have no CSS plant in Chromium.

  Stop and ask on any stop-and-ask outcome above. The spike changes no source file. Commit the record with `base.sha` (`docs(003-base-styles): phase 2 spike record (T007)`)

### Tests (red, one commit)

- [X] T008 [P] [US1] `packages/styles/test/build.test.ts`: `buildPlan(css)` returns exactly `[{ path: "base.css", content: css }]` for any text. `build(packageDir, outDir)` writes a `dist/base.css` that is byte-identical to `src/base.css` (research R-01, contracts/checks.md)
- [X] T009 [P] [US1] `packages/styles/test/source.test.ts` (research R-11) parses `buildPlan(readFileSync("src/base.css"))[0].content` with PostCSS and `postcss-selector-parser`. Positive assertions: the `:where(:focus-visible)` rule exists with `outline-style: solid` and the width, colour and offset longhands; and the base-layer selectors of data-model § Rule table exist. In the same tests, the guards:
  - no `transition*`, `animation*` or `scroll-behavior` declaration at any depth;
  - no `forced-color-adjust: none`;
  - no `outline: none`, no `outline: 0` and no `outline-style: none`;
  - no `@import` and no `url(`;
  - no class selector;
  - every selector within its bound: (0,1,1) for a selector with a `data-ocelle-*` attribute, (0,0,1) for any other.

  Each check is also run on its plant strings, which must report, and its boundary strings, which must pass. Both are listed in R-10 § Source-level guards
- [X] T010 [P] [US1] `gates/test/token-only.test.ts` (and `token-only-parts.test.ts` if `rawValues` changes) for the `lineHeight: "token"` option of research R-07:
  - with the option, a literal, percentage, `calc()` or `normal` line height is raw, in `line-height` and in the line-height part of `font`;
  - without it they stay allowed;
  - with it, a single `var(--ocelle-*)` or a CSS-wide keyword passes against the repository token lists;
  - an invalid option value is reported;
  - giving the option does not replace the token lists.
- [X] T011 [P] [US1] `packages/styles/test/browser/serve.ts` (test helper; research R-09). It serves a temporary directory under `default-src 'none'; script-src 'self'; style-src 'self'; font-src 'self'` on `127.0.0.1`. Only `page.html` also gets `img-src 'self'` (plan decision 15). The directory holds:
  - `tokens.css` from the token generator;
  - `base.css` copied from `src`;
  - the vendored fonts and `test/fixtures/**`, with content types for `.html`, `.css`, `.woff2` and `.svg` (`image/svg+xml`);
  - `control.html`, written from 002's `controlPage` (one inline `<style>`), the control page whose one `style-src` violation the tests expect (data-model § Test fixtures, SC-001).

  It reuses `launch`, `collectViolations`, `violations` and `controlPage` from `packages/tokens/test/browser/serve.ts`. Also write the fixtures (data-model § Test fixtures): `packages/styles/test/fixtures/page.html` (with its prose container for US1 scenario 9), `layout.css`, `media.svg` (natural 2:1) and `plants/*.css` for the US1 guards of R-10
- [X] T012 [US1] `packages/styles/test/browser/base.test.ts`, spec US1 scenarios 1, 2, 4, 5, 6 (computed half), 7, 9 and 10 in Chromium. Every scenario runs in both themes, under `emulateMedia({ colorScheme })` light and dark (research R-09, FR-022); none is exempt. Each guard is paired with its positive assertion and run once more with its plant stylesheet, where the guard's helper must report the expected problem:
  - the six theme conditions of 002 with root `color-scheme` and body values;
  - keyboard and pointer focus on a link, button, text input and `tabindex="0"`;
  - forced colours: control borders, and the `Highlight` ring inside a `forced-color-adjust: none` region;
  - zero CSP violations on every fixture page, and exactly one `style-src` violation on `control.html`;
  - without `tokens.css`: `border-box`, body margin 0 and an outline style other than `none`;
  - `base.css` linked first gives the same computed values;
  - `code`, `pre`, `kbd` and `samp` in Schibsted Grotesk with tabular figures, inside and outside `page.html`'s prose container, plus the host-override case;
  - media no wider than their container, with the 2:1 ratio held within 1 px after `naturalWidth > 0`, and form controls inheriting the font;
  - list semantics (role `list`) next to the `box-sizing` assertion, with its recorded no-plant reason.
- [X] T013 [P] [US1] `packages/styles/test/readme.test.ts`, phase 2 statements (research R-14):
  - the README states the link order, the CSP, the exact tokens version (and that the `workspace:0.0.0` pin becomes meaningful at the first release, #11, since both packages stay at 0.0.0 until then), the base layer and its specificity, and that `base.css` styles custom-element hosts (plan decision 16);
  - the CHANGELOG has `## Unreleased` / `### Added` naming `base.css`;
  - `packages/tokens/test/readme.test.ts` expects the tokens README sentence naming `@ocelle/styles` `base.css` as the stylesheet that applies `color-scheme`.
- [X] T014 [P] [US1] Storybook tests (research R-12):
  - `storybook/test/unit/swatches.test.ts`: `writeGenerated` also writes `base.css` (the directory listing gains it);
  - `storybook/test/unit/render.test.ts`: `renderFamily("base")` cases (no `style` attribute or `class`, the elements of the Base page story, escaping of `base-content.json` text);
  - `storybook/test/unit/stories.test.ts`: "Base styles" title with the Base page story;
  - `storybook/test/integration/csp.test.ts`: the Base page story with zero violations and no computed monospace, under the narrowed `preview.css`.
- [X] T015 [US1] Commit T008 to T014 alone (`test(003-base-styles): phase 2 red — US1 base layer`) and run `.specify/extensions/story/scripts/red.sh 2 phase`. Confirm every failure is an assertion on missing behaviour, not a load or setup error (the browser path is set with `PLAYWRIGHT_BROWSERS_PATH` or `OCELLE_CHROMIUM_PATH`)

### Implementation (green)

- [X] T016 [US1] `packages/styles/scripts/build.ts`: `buildPlan(css)` and `build()` as R-01, with each I/O line carrying the I/O-boundary Stryker record that names `packages/styles/test/build.test.ts`
- [X] T017 [US1] `packages/styles/src/base.css`: the base-layer rules of data-model § Rule table, in its order:
  - box-sizing as `:where(*), :where(*)::before, :where(*)::after`;
  - `:where(:root)` `color-scheme`;
  - `:where(body)`;
  - media with `max-inline-size: 100%` and `block-size: auto`;
  - form controls `font: inherit`;
  - `code`, `pre`, `kbd` and `samp`;
  - the four `:focus-visible` longhands;
  - the `forced-colors` `Highlight` rule.

  Every value is a token, every line height a token, and there are no classes, no motion, no `@import` and no `url()`
- [X] T018 [US1] `gates/stylelint/token-only.ts` and `stylelint.config.ts`: the `lineHeight: "token"` option (`validateOptions` gains `lineHeight: ["token"]`; `optionLists` uses given lists only when `tokens` or `elementProperties` is present), and the override for `packages/styles/**/*.css` (research R-07)
- [X] T019 [US1] Style-lint plants for T018's option (contracts/checks.md § Gates changed, research R-07). They are not test files under `test_pathspec`, so they land here in green, not in the red commit; T010's unit tests are the option's red evidence:
  - fail plants `gates/plants/style-lint/fail-styles-literal-line-height` (`1.65`), `fail-styles-percent-line-height` (`165%`), `fail-styles-calc-line-height` (`calc(1.65)`) and `fail-styles-normal-line-height` (`normal`), each `tree/packages/styles/src/x.css` expecting one `ocelle/token-only` finding at its line;
  - pass plant `pass-styles-line-height-token` (`var(--ocelle-line-height-normal)`);
  - move `pass-line-height` from `tree/packages/styles/src/x.css` to `tree/packages/elements/src/x.css`, with `why` updated.
- [X] T020 [US1] `packages/styles/README.md` and `packages/styles/CHANGELOG.md` with the phase 2 statements of T013. In `packages/tokens/README.md`, the `color-scheme` sentence names `@ocelle/styles` `base.css`
- [X] T021 [US1] Storybook:
  - `storybook/scripts/swatches.ts` `writeGenerated` copies `packages/styles/src/base.css` to `.generated/base.css`;
  - `storybook/.storybook/preview-head.html` links it after `tokens.css`;
  - `storybook/.storybook/preview.css` is narrowed to the error display;
  - add `storybook/.storybook/stories-layout.css` (layout only, `data-story` selectors), imported by `storybook/.storybook/preview.ts` as `preview.css` is (research R-12);
  - add `storybook/stories/base-content.json`, `renderFamily` in `storybook/stories/render.ts`, and `storybook/stories/base.stories.ts` (title "Base styles", story "Base page").
- [X] T022 [US1] Run:
  - `pnpm -r build` and `pnpm test`;
  - `gate:typecheck`, `gate:lint`, `gate:test-lint`, `gate:style-lint`, `gate:prefix`, `gate:csp`, `gate:contrast`, `gate:brand-rules`, `gate:config-copies`, `gate:pins` (SC-003);
  - `gate:plants` alone, not during a mutation run;
  - then `gate:mutation -- --base <phase base>`, one job at a time.

  Record the `styles-browser` suite time in the phase review against the plan's 60 s goal. Then run `.specify/extensions/story/scripts/tdd-check.sh 2` (`pass`) and commit green (`feat(003-base-styles): phase 2 — US1 base layer`)

**Checkpoint**: a host page linking `tokens.css` and `base.css` gets the base layer under the strict CSP. This is the
MVP.

---

## Phase 3: User Story 2 - A dense screen opts into the compact scale (Priority: P2)

**Goal**: everything User Story 2 asks for that needs no prose, covering spec scenarios 1 to 4 (scenario 4 without its
`h1` half), the nested `regular` value of FR-004, FR-012 and FR-013. Scenario 5 and FR-024's nesting of the compact
and prose hooks need prose and are phase 4's (T035):
- `data-ocelle-density` (`compact`, `regular`) and `data-ocelle-value` (empty, `ink`) work;
- `--ocelle-line-height-compact` exists;
- Storybook has the "Compact screen" story.

The design sources are research R-02, R-04 and R-08, and data-model § Compact scale.

**Independent Test**:
- `styles-browser` passes US2 scenarios 1 to 3 (the undocumented values included), scenario 4 without its `h1` half,
  and the nested `regular` regions of FR-004, in both themes.
- The tokens tests pass with the new token.
- `tdd-check.sh 3` reports `pass`.

### Tests (red, one commit)

- [X] T023 [P] [US2] `packages/tokens/test/expected.ts`: add `line-height-compact`, type group, `1.5`, with its probe (research R-08). The tokens CHANGELOG test expects the new name under Unreleased
- [X] T024 [P] [US2] `packages/styles/test/fixtures/compact.html` (without the prose cases, which T035 adds), `compact-root.html` (the compact hook on `<html>`) and `plants/*.css` for the US2 guards of R-10 (the density presence-form plant included). `packages/styles/test/browser/compact.test.ts`, every scenario in both themes under `emulateMedia({ colorScheme })` light and dark (research R-09, FR-022); none is exempt:
  - scenario 1: 14 px / 21 px, inherited, and in the same test a `data-ocelle-density="true"` region with no compact scale (FR-005), with the density presence-form plant;
  - scenario 2: only the region, with the `body` plant;
  - scenario 3: the value style's family, figures, colour and 14 px, the `ink` variant, and `data-ocelle-value="true"` doing nothing, with the presence-form plant;
  - scenario 4 without `h1`, on `compact-root.html`: the hook on `<html>` keeps the root at 16 px and `--ocelle-target-min` at 44 px, the body compact and the ring unchanged, with the two US2-4 plants;
  - FR-004 `regular` value (nested regions): a `regular` region inside a compact one returns to the regular scale (research R-02). US2 scenario 5 is left to T035.
- [X] T025 [P] [US2] `packages/styles/test/source.test.ts`: the compact and value selectors of data-model § Compact scale exist and are within the (0,1,1) bound. `packages/styles/test/readme.test.ts`: the density and value statements (values, `regular`, that any other value of a hook attribute, `"true"` among them, has no effect, what the compact-scale family styles and the tokens it uses, the main-grounds-only limit of the value hook) and the CHANGELOG naming `data-ocelle-density` and `data-ocelle-value`
- [X] T026 [P] [US2] Storybook tests: `renderFamily("compact")` cases, the "Compact screen" story (compact and value hooks) in `stories.test.ts`, and in `csp.test.ts` with zero violations
- [X] T027 [US2] Commit T023 to T026 alone (`test(003-base-styles): phase 3 red — US2 compact`) and run `.specify/extensions/story/scripts/red.sh 3 phase`

### Implementation (green)

- [X] T028 [US2] `packages/tokens/src/source.ts`: add the `line-height-compact` record. Add it to `packages/tokens/CHANGELOG.md` (Unreleased, type group) and to `packages/tokens/README.md`
- [X] T029 [US2] `packages/styles/src/base.css`: the compact and value rules of data-model § Compact scale, after the base layer (research R-03 order, R-04 root handling)
- [X] T030 [US2] README and CHANGELOG of `@ocelle/styles` with the T025 statements. Add `renderFamily("compact")` and the "Compact screen" story
- [X] T031 [US2] Run the checks of T022 for this phase, then `.specify/extensions/story/scripts/tdd-check.sh 3` (`pass`), and commit green (`feat(003-base-styles): phase 3 — US2 compact`)

**Checkpoint**: a dense screen marked compact gets 14 px / 1.5 without changing `rem` tokens.

---

## Phase 4: User Story 3 - A rendered Markdown document reads at the prototype's rhythm (Priority: P3)

**Goal**: everything User Story 3 asks for, covering spec scenarios 1 to 12, the `h1` half of US2 scenario 4, the
nested cases of US2 scenario 5, FR-014 to FR-019 and FR-024 (the compact and prose hooks nested and on one
element):
- the prose family works under `data-ocelle-prose=""`, with plain-`<table>` scroll boxes, the 12ch floor, the inset
  ring, the capped sticky caption, underlined links, wrapped code and the measure;
- the tokens `line-height-prose`, `font-size-subhead`, `measure-reading`, `measure-cell` and `measure-container`
  exist;
- Storybook has the "Prose document" story.

The design sources are research R-06, R-08, R-10 and R-13, data-model § Prose, and plan decisions 5, 7, 8, 12, 14,
17 and 18.

**Independent Test**:
- `styles-browser` passes US3 scenarios 1 to 12 at 1280 px, 320 px and 200% zoom, in both themes, in forced colours,
  under `rtl` and in every host of `prose-hosts.html`.
- `pairs.test.ts` passes.
- `tdd-check.sh 4` reports `pass`.

### Tests (red, one commit)

- [ ] T032 [P] [US3] `packages/tokens/test/browser/values.test.ts`: give the probe block `container-type: inline-size` (research R-08; red against the unchanged harness, where `measure-container` resolves to 1280px). Add the five tokens of R-08 to `packages/tokens/test/expected.ts`:
  - `line-height-prose` `1.65`;
  - `font-size-subhead` `1.125rem`;
  - `measure-reading` `68ch`;
  - `measure-cell` `12ch`;
  - `measure-container` `100cqi`, with `{ property: "width", used: 1000 }`.

  The tokens CHANGELOG test expects all five
- [ ] T033 [P] [US3] Fixtures (data-model § Test fixtures):
  - `packages/styles/test/fixtures/prose.html`: the US3 fixture of the spec, with three wide 12-column tables, one of them with a caption of at least 80 characters ending in a full stop; a two-column table that fits; an `<a id>` target; `h5`, `h6` and a nested list; and the same content outside the container;
  - `prose-hosts.html`: grid, flex, nested, and a definite-width modal dialog opened with `showModal()`, sized by `--ocelle-dialog-max-inline` in `layout.css`;
  - `prose-root.html`;
  - `plants/*.css` for every US3 guard of R-10.
- [ ] T034 [US3] `packages/styles/test/browser/prose.test.ts`, spec US3 scenarios 1 to 12:
  - computed sizes, weights and line heights per element, with the heading order; each non-heading line height is 1.65 times the element's own computed font size (research R-13): `td` and the body elements 26.4 px at 16 px, `th` 19.8 px at its 12 px;
  - measure and full-width `pre` and tables;
  - the scroll boxes at 320 px:
    - the 12ch floor;
    - Tab onto the plain wide tables, ArrowRight scrolling and the inset ring inside the viewport;
    - the AX name from the caption;
    - the merged caption line boxes inside the box and at its start edge at `scrollLeft` 0, and inside it after scrolling;
    - the fitting table not a tab stop, in every host including the dialog;
  - 12px header cells with tabular figures;
  - scoping outside the container and the undocumented value, with their plants;
  - `prose-root.html`;
  - link colour, hover colour and underline in every state, and the `<a id>` target unstyled;
  - table semantics in both themes (AX structure);
  - `pre` wrapping and copy;
  - `rtl` mirroring and the caption under `rtl` at the most negative `scrollLeft`;
  - forced-colours borders and `hr`;
  - long inline code and URL at 320 px and 200% zoom;
  - the linked table: Tab lands on the link, and ArrowRight scrolls the table.

  Every scenario runs in both themes, under `emulateMedia({ colorScheme })` light and dark (research R-09, FR-022); none is exempt. Each guard is paired with its positive assertion and its plant
- [ ] T035 [P] [US3] Fixture additions (data-model § Test fixtures): a prose container holding an `h1` in `packages/styles/test/fixtures/compact-root.html`, and the prose-in-compact, compact-in-prose and both-hooks cases in `compact.html`. `packages/styles/test/browser/compact.test.ts` additions: the `h1` half of US2 scenario 4 (30 px inside prose under compact on `<html>`, on `compact-root.html`), and US2 scenario 5's prose-in-compact, compact-in-prose and both-hooks cases (FR-024). Every scenario runs in both themes, under `emulateMedia({ colorScheme })` light and dark (research R-09, FR-022); none is exempt
- [ ] T036 [P] [US3] `packages/styles/test/pairs.test.ts` (research R-08): each prose and value colour pairing is a `checked` pair in both themes in `packages/tokens/contrast/pairs.json`. Its plant is a fixture list with `color-link` on `color-chrome`. `packages/styles/test/source.test.ts`: the prose selectors exist within the bound
- [ ] T037 [P] [US3] `packages/styles/test/readme.test.ts` prose statements (research R-14):
  - values and `""` only;
  - what the prose family styles and the tokens it uses;
  - prose over compact;
  - not on `<html>`;
  - the host-width cause sentence ("must not be sized from its content");
  - tables of three or more columns overflow at 320 px;
  - the WebKit `tabindex` limitation;
  - print out of scope;
  - the CHANGELOG naming `data-ocelle-prose`.
- [ ] T038 [P] [US3] Storybook tests: `renderFamily("prose")` cases, and the "Prose document" story in `stories.test.ts` and `csp.test.ts`
- [ ] T039 [US3] Commit T032 to T038 alone (`test(003-base-styles): phase 4 red — US3 prose`) and run `.specify/extensions/story/scripts/red.sh 4 phase`

### Implementation (green)

- [ ] T040 [US3] `packages/tokens/src/source.ts`: add the five records of R-08. Add them to `packages/tokens/CHANGELOG.md` and `packages/tokens/README.md`. Confirm `validateSource` accepts `100cqi`
- [ ] T041 [US3] `packages/styles/src/base.css`: the prose rules of data-model § Prose, after the compact and value rules:
  - the container scoped `[data-ocelle-prose=""]:where(:not(html))`;
  - headings;
  - measure, lists, block quotes and `hr`;
  - `a:any-link` with hover;
  - `code`, `pre` and `pre code`;
  - the table rule: `display: block`, `overflow-x: auto`, `max-inline-size: 100%`, `container-type: inline-size`;
  - the caption rule: `position: sticky`, `inset-inline-start: 0`, `max-inline-size: var(--ocelle-measure-container)`, `text-align: start`;
  - the inset ring on `table:focus-visible`;
  - cells and header cells.
- [ ] T042 [US3] README and CHANGELOG of `@ocelle/styles` with the T037 statements. Add `renderFamily("prose")` and the "Prose document" story (text in `base-content.json`)
- [ ] T043 [US3] Run the checks of T022 for this phase, then `.specify/extensions/story/scripts/tdd-check.sh 4` (`pass`), and commit green (`feat(003-base-styles): phase 4 — US3 prose`)

**Checkpoint**: a renderer's plain HTML in a prose container reads at 1.65 with an 18 px `h2`, and wide tables
scroll in their own box.

---

## Phase 5: User Story 4 - Long identifiers stay readable and copyable (Priority: P4)

**Goal**: everything User Story 4 asks for, covering spec scenarios 1 to 4, FR-020 and SC-005:
- `data-ocelle-wrap="anywhere"` works;
- the README maps kitty-mission-ui's stand-ins (SC-006);
- Storybook has the "Identifier wrap" story.

This phase completes US1 scenario 6's documentation half. The design sources are research R-10 and R-14, and
data-model § Identifier wrap.

**Independent Test**:
- `styles-browser` passes US4 scenarios 1 to 4.
- The FR-020 source check passes.
- The readme test passes in full.
- `tdd-check.sh 5` reports `pass`.

### Tests (red, one commit)

- [ ] T044 [P] [US4] `packages/styles/test/fixtures/wrap.html` (the 300 px two-column `1fr` grid, hooked and unhooked identifiers, a `data-ocelle-wrap="true"` identifier, an identifier in prose and in a compact `span`) and `plants/*.css` for the US4 guards of R-10 (the wrap presence-form plant included). `packages/styles/test/browser/wrap.test.ts`, every scenario in both themes under `emulateMedia({ colorScheme })` light and dark (research R-09, FR-022); none is exempt:
  - scenario 1: the column within 1 px of the short text, with no ellipsis, and the unhooked identifier widening its column in the same test;
  - scenario 2: opt-in, with the `*` plant; in the same test a `data-ocelle-wrap="true"` identifier keeps the initial `overflow-wrap` (FR-005), with the wrap presence-form plant;
  - scenario 3: wraps over more than one line, and the copied text equals the source, with the `text-transform` plant;
  - scenario 4: prose 16/26.4 px and compact 14/21 px.

  Also test 320 px and 200% zoom
- [ ] T045 [P] [US4] `packages/styles/test/source.test.ts`: the wrap rule exists with `overflow-wrap: anywhere`. In the same test, FR-020's list is absent from it (`word-break`, `hyphens: auto`, `text-overflow: ellipsis`, `white-space: nowrap`), with its plant strings
- [ ] T046 [P] [US4] `packages/styles/test/readme.test.ts`: the wrap statements, what the identifier-wrap family styles and the tokens it uses, the SC-006 table mapping E-23, E-37 and E-39, and the CHANGELOG naming `data-ocelle-wrap`. With this, all four hooks are documented (US1 scenario 6)
- [ ] T047 [P] [US4] Storybook tests: `renderFamily("wrap")` cases, and the "Identifier wrap" story in `stories.test.ts` and `csp.test.ts`
- [ ] T048 [US4] Commit T044 to T047 alone (`test(003-base-styles): phase 5 red — US4 identifier wrap`) and run `.specify/extensions/story/scripts/red.sh 5 phase`

### Implementation (green)

- [ ] T049 [US4] `packages/styles/src/base.css`: `[data-ocelle-wrap="anywhere"] { overflow-wrap: anywhere }`, last in the file
- [ ] T050 [US4] README and CHANGELOG of `@ocelle/styles` with the T046 statements. Add `renderFamily("wrap")` and the "Identifier wrap" story
- [ ] T051 [US4] Run the checks of T022 for this phase and the quickstart steps 1 to 4, then `.specify/extensions/story/scripts/tdd-check.sh 5` (`pass`), and commit green (`feat(003-base-styles): phase 5 — US4 identifier wrap`)

**Checkpoint**: every family ships, documented, with its story.

---

## Dependencies & Execution Order

- Phase 1, then phase 2 (US1: the build, the harness, the lint option and the base layer that every family builds
  on), then phase 3 (US2), phase 4 (US3) and phase 5 (US4), in that order:
  - phase 4 completes US2 scenario 4, which phase 3 starts, and tests US2 scenario 5, which needs the prose hook;
  - phase 5's readme test completes the documentation of the four hooks.
- Within a phase: base, then the optional scaffold, the red commit, green, `tdd-check.sh` and review. The phase is
  folded after approval.
- Run one mutation job at a time, and never `gate:plants` during a mutation run.

## Parallel Opportunities

- Phase 1: T003 and T005 (T004's install runs after T003, so the committed lockfile holds the peer dependency).
- Phase 2, after the spike: T008 to T011, T013 and T014 (T012 needs T011's server).
- Phase 3: T023 to T026. Phase 4: T032, T033 and T035 to T038 (T034 needs T033). Phase 5: T044 to T047.

## Implementation Strategy

- **MVP**: phases 1 and 2. A host gets the base layer, the root `color-scheme` and the focus ring from `base.css`.
- Then the compact scale, prose and identifier wrap, one reviewed and folded phase each.
