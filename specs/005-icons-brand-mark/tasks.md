# Tasks: Icons and Brand Mark

**Input**: design documents in `specs/005-icons-brand-mark/`, as approved at the plan gate on 2026-11-10 after three
plan-squad rounds (`reviews/plan/round-1..3/`):
- spec.md (FR-001 to FR-034, SC-001 to SC-008, the pairing table of "does not" outcomes);
- plan.md, with decisions 1 to 15 and the phase list;
- research.md, R-01 to R-16;
- data-model.md;
- contracts/elements-package.md and contracts/checks.md;
- quickstart.md.

The findings of the analysis after tasks (`analysis-report.md`) are resolved in these tasks; each resolution is in
`reviews/analysis/fixes-1.md`. Added tasks carry suffixed IDs (T016a, T020a, T024a, T035a, T056a); no task was
renumbered.

**Tests**: required. Constitution Principle VIII applies to every phase. The phase flow is `base.sh`, an optional
`scaffold.sh`, one red commit of test files only proven by `red.sh`, then green, `tdd-check.sh` and an independent
review. Expected values are written by hand from the spec, the data model and research. They are never read from
the source under test: the icon drawings come from `test/icons-expected.ts` (R-07), the mark's geometry from
`sources/ocelle-docs-logo.reference.svg` (R-09), colours from the token names the spec names.

The guard rules:
- A "does not" assertion never stands alone. It shares its test with the positive assertion it guards (spec pairing
  table).
- Each guard is proven able to fail by its named plant, run once by the implementer and recorded in the phase's
  review notes.
- A plant that does not make its guard fail stops the phase (stop-and-ask).

**Shared scenario bodies** (R-11): every browser scenario of the spec is written once in
`packages/elements/test/scenarios/*.ts` against a driver interface, and run by two harnesses: the in-process
`elements` project (element source, mutated) and the `elements-browser` project (the built browser build on the
strict-CSP fixture, not mutated). Fixture runs also assert zero CSP violations, only allowed requests and no console
message on every page.

**Environment**: Node 22 in this container, 26.13.0 in CI. Every browser run sets
`OCELLE_CHROMIUM_PATH=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome`; Stryker and plant runs also alias the
browsers directory as `knowledge/speckit-flows/findings/frontend-missions.md` § Browser path describes. One heavy
job (browser suites, mutation, plants) at a time. Never `git stash`.

**Organization**:
- Phase 1 is Setup: the Vitest projects, the install-script approval and the plant-repository change carry
  behaviour and go red first; the pins and lockfile are exempt.
- Phases 2 to 5 are User Stories 1 to 4, one review unit each.
- Each phase is folded after its approval (`/ocelle-run` step 4.3).
- Records (README, CHANGELOG, stories, plants) belong to the phase whose behaviour they describe. There is no polish
  phase.

**Stop-and-ask points**: the implementer stops, records the question in the phase review and does not work around
it:
- **T011 spike outcomes**: the analyzer cannot produce `tagName`, `default` and the six member lists from the
  element shape of R-06 even with `@tagname`/`@default`; it fails with builds denied or on Node 26; `axTree` cannot
  read the internals-hidden or `img`-named host; the browser build shows a CSP violation.
- **T031 measurement**: the "equal" rule of R-08 does not hold for a correct mirroring of all thirteen drawings.
- **R-16 verification (T009)**: `rs-module-lexer`'s script loads no native binding here, or runs `npm install`.
- **A plant that does not bite.**
- **Any mutation shard over 10 minutes.**
- **A new colour pairing** not listed in FR-026.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: can run in parallel (different files, no dependency on an unfinished task)
- **[Story]**: the user story of the task (US1 to US4)
- Paths are relative to the repository root.

---

## Phase 1: Setup

**Purpose**: the element test projects, the approved install scripts, the plant-repository configuration set and the
pins.

**Independent Test**: `pnpm test` passes; `packages/elements/test/{node,build,browser}/**` run only in their projects;
`pnpm run gate:pins` accepts the two approved entries and the new pins; `tdd-check.sh 1` reports `pass`.

### Tests (red, one commit)

- [ ] T001 [P] `gates/test/vitest-config.test.ts`: projects `elements-node` (node, include `packages/elements/test/node/**/*.test.ts`), `elements-build` (node, include `packages/elements/test/build/**/*.test.ts`) and `elements-browser` (node, include `packages/elements/test/browser/**/*.test.ts`) exist; the `elements` project excludes `packages/elements/test/node/**`, `test/build/**` and `test/browser/**`; the default mutation config excludes `elements`, `elements-build` and `elements-browser` besides today's set; `vitest.mutation.elements.config.ts` holds exactly the `elements` project (R-11, R-12)
- [ ] T002 [P] `gates/test/pins-rules.test.ts` and `gates/test/pins.test.ts`: `"rs-module-lexer@2.9.0": true` and `"fsevents@2.3.3": true` in `allowBuilds` pass; `rs-module-lexer: true`, `fsevents: true`, `"rs-module-lexer@2.9.1": true` and any other `true` entry are each an `allow-builds` finding naming the entry; `false` entries pass as today (R-16)
- [ ] T003 [P] `gates/test/plant-repo.test.ts` and the gates-integration plant-repo test: the configuration set holds `stryker.elements.config.json`, `vitest.mutation.elements.config.ts` (also matched by `configurationName`), `packages/elements/src/**`, `packages/elements/scripts/manifest.ts`, `packages/elements/custom-elements-manifest.config.mjs`, `packages/elements/custom-elements.json`; a plant tree links each package's own `node_modules` as well as the root's (R-12)

### Implementation

- [ ] T004 `vitest.config.ts`: add the three projects of T001 and the `elements` excludes; `vitest.mutation.config.ts`: extend the excluded set; create `vitest.mutation.elements.config.ts` (elements project only) and `stryker.elements.config.json` (as `stryker.config.json`, its `vitest.configFile` pointing to it, own report file `reports/mutation/mutation-elements.json`)
- [ ] T005 `gates/lib/pins-rules.ts`: an approved-builds list of exactly `rs-module-lexer@2.9.0` and `fsevents@2.3.3`; a `true` entry is a finding unless its key is on the list; plants `gates/plants/pins/pass-approved-build`, `fail-allow-builds-unpinned-approval` (`rs-module-lexer: true`), `fail-allow-builds-unpinned-fsevents` (`fsevents: true`), `fail-allow-builds-other-version` (`"rs-module-lexer@2.9.1": true`); `fail-allow-builds-entry` kept
- [ ] T006 `pnpm-workspace.yaml`: add the two approved `allowBuilds` entries with a comment citing 005 R-16; `gates/README.md` pins row names the approval and its residual risks (macOS `node-gyp` may fetch Node headers; the wasm fallback); add the dated amendment note to `specs/001-repository-foundation/research.md` R-04 citing 005 R-16
- [ ] T007 `gates/lib/plant-repo.ts`: the configuration set and per-package `node_modules` links of T003
- [ ] T008 [P] Exempt: `packages/elements/package.json` `dependencies` `lit` `3.3.3` (exact); root `package.json` devDependency `@custom-elements-manifest/analyzer` `0.11.0` (exact); non-frozen `pnpm install`, lockfile committed; `.gitignore` gains `packages/elements/LICENSE`, `packages/elements/NOTICE`, `packages/elements/THIRD_PARTY_NOTICES` (packed copies, R-15)
- [ ] T009 Verify R-16 in this container and record it in `specs/005-icons-brand-mark/reviews/phase-1/install-scripts.md`: after `pnpm install --frozen-lockfile`, `rs-module-lexer`'s native binding loads, `@xn-sakina/rml-wasm` is absent (no `npm install` ran), `fsevents` is absent on Linux, `pnpm run setup:offline` succeeds, `pnpm run gate:pins` exits 0; macOS is recorded as unverified
- [ ] T010 Write `specs/005-icons-brand-mark/reviews/phase-1/tdd-exempt.md`: T008 has no behaviour (pins, lockfile, ignore list); T001 to T003 are the red commit for T004 to T007

**Checkpoint**: `tdd-check.sh 1` reports `pass`.

---

## Phase 2: User Story 1 - The element conventions and `ocelle-icon` (Priority: P1) 🎯 MVP

**Goal**: US1 scenarios 1 to 19; FR-001 to FR-016, FR-032, FR-033, FR-034 for `ocelle-icon`; the manifest gate;
the mutation split; the README conventions; the Lit records the browser build points to. One icon (`close`) is
drawn; the other twelve come in phase 3. There is no `ocelle-brand-mark` module before phase 5.

**Independent Test**: the browser build loads on the strict-CSP fixture and `<ocelle-icon name="close">` renders at
20 × 20 px in `currentColor`, hidden from the accessibility tree unless labelled, with zero violations, only allowed
requests and no console message; `pnpm run gate:manifest` passes and its plants are judged as expected.

### Spike (first)

- [ ] T011 [US1] Spike, scratch files only, recorded in `specs/005-icons-brand-mark/reviews/phase-2/spike.md`: run the analyzer (API and CLI) on a scratch element written as R-06 says (the real `define` helper, `static override properties`, `declare` fields, `observedAttributes` with `aria-label`, `@tagname` and `@default` JSDoc), with builds denied and on Node 26 (`npx -p node@26.13.0` or CI) and in this container; record its schema version and output; `axTree` over CDP reading an element with an `id` hidden through `ElementInternals.ariaHidden` and one named as `img` (R-13); a scratch browser build under the strict CSP with zero violations (R-05)

### Tests (red, one commit)

- [ ] T012 [P] [US1] `packages/elements/test/commands.test.ts`: `axTree(id)` returns the unignored nodes for an element with that `id` and its shadow subtree (a plain `<button id>` gives one `button` node with its name); `emulateForcedColors("active", "dark"|"light")` makes `matchMedia("(forced-colors: active)")` true and back with `"none"` (R-11)
- [ ] T013 [P] [US1] `packages/elements/test/scenarios/driver.ts` (the driver interface: mount markup, set properties and attributes, read box, computed colour, AX nodes, pixels, emulate forced colours, set `dir`, link `base.css`) and `packages/elements/test/scenarios/icon.ts`: US1 scenarios 1 to 9, 14, 16, 18 and 19 as shared bodies, each "does not" paired as the spec table says (no node vs labelled twin; unknown name vs known name; an unknown name with host `aria-label="Close"` vs a known-name twin with the same `aria-label`, which exposes one image node named "Close" (US1-8, FR-034; plant: `drawable` ignored when the host `aria-label` names it); `label` not reflected vs `name` reflected; blank host `aria-label` vs named twin; `aria-hidden="true"` vs shown twin; `hidden` vs shown twin); US1-7 in text, link, button and disabled button (`GrayText`); host `aria-label` values passed trimmed (operator decision PLAN-A11Y-SECURITY-1-003 (a))
- [ ] T014 [P] [US1] `packages/elements/test/icon.test.ts` (in-process harness over T013, tokens from `css(source)` without font faces), `packages/elements/test/define.test.ts` (FR-006: `define` twice with two classes keeps the first, throws nothing; the first call defines), `entry-icon.test.ts` (importing `../src/ocelle-icon.ts` defines `ocelle-icon` and not `ocelle-brand-mark`), `entry-root.test.ts` (importing `../src/index.ts` defines `ocelle-icon` and exports `OcelleIcon`; phase 2 has no `ocelle-brand-mark` module, not even a stub, and T052 extends this file to both elements)
- [ ] T015 [P] [US1] `packages/elements/test/browser/global-setup.ts`, `serve.ts` (strict-CSP header with `font-src 'self'`, `tokens.css` generated from source into the temporary directory, `base.css` on demand, the `addInitScript` violation collector after `packages/tokens/test/browser/serve.ts:116-129`, request and console recorders), `fixtures/*.html`, and `icon.test.ts` running T013 on the built browser build; fixture-only cases: US1-10 (two module-build bundles then the browser build: no uncaught error, the first bundle's `ocelle-icon` class kept, close drawn; its `ocelle-brand-mark` half is added by T052 in phase 5), US1-15 (server HTML upgrades), US1-8's console check, US1-14's 500-icon request check, and a control page that proves the collector sees an inline-style violation
- [ ] T016 [P] [US1] `packages/elements/test/node/vite-config.test.ts` (entry `src/browser.ts`, format `es`, file `browser/ocelle-elements.js`, `emptyOutDir: false`, no external, no `development` condition, the banner text) and `packages/elements/test/build/build.test.ts` (module build imports only own files and `lit`/`lit/*`, an element module imports neither `index.js` nor the other element; browser build has no `import`, no `lit-html/development`, no `ssr-dom-shim`, no `console.`, and starts with the banner naming Apache-2.0, Lit's copyright and BSD-3-Clause and `THIRD_PARTY_NOTICES`)
- [ ] T016a [P] [US1] `packages/elements/test/build/pack.test.ts`: after a build, `pnpm pack --dry-run --json` lists `LICENSE`, `THIRD_PARTY_NOTICES`, `licenses/lit-BSD-3-Clause.txt`, `custom-elements.json` and `dist/browser/ocelle-elements.js` (FR-029, FR-030; the Lit records land with the browser build that bundles Lit, analysis L9; T055 adds `NOTICE`)
- [ ] T017 [P] [US1] `packages/elements/test/node/manifest.test.ts`: the normaliser adds empty `slots`, `events`, `cssParts`, `cssProperties`, expands `IconName` to the union of the names, drops `aria-label`, sorts keys; the generated `ocelle-icon` entry has `tagName`, `name`/`label` with types `<union> | undefined` and `string | undefined`, default absent, `name` reflects and `label` does not, schema version as the spike recorded (US1-11)
- [ ] T018 [P] [US1] `gates/test/manifest.test.ts`: exit 0 on a matching manifest; `stale` per differing member (`ocelle-icon.attribute.label`), whole-file `stale`; `no-description` per member of each of the six kinds; exit 2 for missing and non-JSON manifests and unanalysable source; plants `gates/plants/manifest/` (fail: `fail-stale-property`, `fail-lost-attribute`, `fail-undescribed-property`, `-attribute`, `-event`, `-slot`, `-css-part`, `-css-property`; pass: `pass-repository`, `pass-reordered`; breaking: `break-not-json`, `break-missing`) and the gates-integration expectation that `pass-repository` exits 0 in a built plant tree; `gates/test/registry.test.ts` (or the existing registry test) expects the `manifest` gate and fifteen checks
- [ ] T019 [P] [US1] `gates/test/mutation.test.ts` (or the split's own test file): selected ranges split into element-source (`packages/elements/src/**`) and other groups; each non-empty group runs under its config; results merged; an element-only change never ends in "nothing to mutate"; plants `gates/plants/mutation/pass-element-source`, `fail-element-source-survivor`, `fail-element-source-no-coverage`, `fail-mixed-survivors` (R-12)
- [ ] T020 [P] [US1] `packages/elements/test/node/readme.test.ts`: the README's conventions (module and registration, `static properties`, `define`, styles, `:host([hidden])`, manifest and the token rule of FR-007, stories, file and test layout, the two builds and which host uses which, the browser build's path), the README's list of entry points (`@ocelle/elements`, `@ocelle/elements/ocelle-icon.js`, `@ocelle/elements/browser.js`, `@ocelle/elements/custom-elements.json`; FR-002), tokens (link `tokens.css` first; an icon without it is 300 × 300 px), engines (Chromium 120+, WebKit 16.4+, the feature behind each figure, the floor rule, WebKit unmeasured as an open limitation), host ARIA (`aria-label` decides alone and is passed trimmed, `aria-hidden="true"`, `role` and `aria-hidden="false"` unsupported), two copies on a page, the CHANGELOG naming `ocelle-icon` and the entry points (SC-008), and the Lit entry in `THIRD_PARTY_NOTICES` naming `lit` 3.3.3, `lit-html` 3.3.3, `lit-element` 4.2.2, `@lit/reactive-element` 2.1.2, BSD-3-Clause, the copyright, repository and published file (FR-029; moved from T056, analysis L9), one assertion per statement
- [ ] T020a [P] [US1] `storybook/test/integration/elements-stories.test.ts` (project `storybook-integration`, which builds the Storybook): the `ocelle-icon` stories close, labelled and unknown name are in the built Storybook and each, opened in light and in dark as 002's `csp.test.ts` opens stories, renders its `ocelle-icon` with the story's `name` (and `label`) and zero CSP violations (US1-13, FR-019; analysis G4)
- [ ] T021 [US1] Replace `packages/elements/test/sample.test.ts` with an assertion of the package root's exports (FR-032), in the red commit

### Implementation (green)

- [ ] T022 [US1] `vitest.config.ts`: the `axTree` and `emulateForcedColors` browser commands in the `elements` project (R-11)
- [ ] T023 [US1] `packages/elements/src/define.ts` (R-02); `packages/elements/src/naming.ts` (R-13: name from host `aria-label` when present, else trimmed `label`; internals `role`, `ariaLabel`, `ariaHidden` per data-model § state table)
- [ ] T024 [US1] `packages/elements/src/icons.ts` with the data form of data-model § Icon and the `close` drawing only (no `as const`; `IconName` an explicit union checked against the table keys); `packages/elements/src/ocelle-icon.ts` (`static override properties` with `name` reflected and `label`, `observedAttributes` + `aria-label`, `static styles` per R-04 with `:host([hidden]) { display: none; }`, `@tagname`/`@default` JSDoc, `define`); `index.ts` (defines and exports `ocelle-icon` only until phase 5), `browser.ts`; `packages/elements/package.json` `exports` (`.`, `./ocelle-icon.js`, `./browser.js`, `./custom-elements.json`; no `./ocelle-brand-mark.js` until T058), `files`, `customElements`, `peerDependencies` `@ocelle/tokens: workspace:0.0.0`, `build` (tsc + vite) and `manifest` scripts; `vite.browser.config.ts` (R-05)
- [ ] T024a [US1] `THIRD_PARTY_NOTICES` Lit entry; `packages/elements/licenses/lit-BSD-3-Clause.txt` copied unchanged from `node_modules/lit/LICENSE`; the elements build copies root `LICENSE` and `THIRD_PARTY_NOTICES` into the package; `files` per R-15 without `NOTICE` (T060 adds it) (FR-029, FR-030; T016a, T020; moved from T060, analysis L9)
- [ ] T025 [US1] `packages/elements/custom-elements-manifest.config.mjs`, `packages/elements/scripts/manifest.ts` (R-06), generate and commit `packages/elements/custom-elements.json`
- [ ] T026 [US1] `gates/bin/manifest.ts`, the plants of T018, `gates/gates.json`, `gates/lib/registry.ts` (fifteen checks), `.github/workflows/ci.yml` job "Custom-elements manifest", `gates/README.md` row and the fourteen-to-fifteen change
- [ ] T027 [US1] `gates/bin/mutation.ts` split by configuration and the plants of T019
- [ ] T028 [US1] `storybook/package.json` devDependency `@ocelle/elements: workspace:0.0.0`; `storybook/stories/icon.stories.ts` (close, labelled, unknown name; light and dark) passing the `csp` and `prefix` gates' Storybook checks and T020a (R-14)
- [ ] T029 [US1] `packages/elements/README.md` and `packages/elements/CHANGELOG.md` with the statements of T020
- [ ] T030 [US1] Run each pairing plant of T013 to T016a once (spec pairing table rows for US1), record in `specs/005-icons-brand-mark/reviews/phase-2/plants.md`; run `pnpm run gate:manifest`, `gate:style-lint`, `gate:csp`, `gate:prefix`, `gate:pins`, then `gate:plants` and `gate:mutation -- --base <phase base>` (one at a time)

**Checkpoint**: `tdd-check.sh 2` reports `pass`; quickstart steps 1 to 5 pass for `ocelle-icon`.

---

## Phase 3: User Story 2 - The icon set (Priority: P2)

**Goal**: US2 scenarios 1 to 5; FR-017, FR-018, FR-029 (icon half); the twelve remaining drawings; mirroring; the
`scale` lint allowance.

**Independent Test**: every one of the thirteen names draws its expected drawing inside the box, no two are equal,
and the four inline-direction icons mirror under `dir="rtl"` while the other nine do not.

### Measurement (first)

- [ ] T031 [US2] Draw the twelve icons in scratch, render all thirteen at 4× (80 px, whole-pixel boxes) under `ltr` and `rtl` with a correct `scale: -1 1`, and measure R-08's "equal" rule (≤ 1 % of pixels over 32/255, none over 96/255) and "differs" rule (> 5 % over 64/255); record in `specs/005-icons-brand-mark/reviews/phase-3/spike.md` (stop-and-ask if it fails)

### Tests (red, one commit)

- [ ] T032 [P] [US2] `packages/elements/test/icons-expected.ts`: the independent expected table, written by hand, one entry per name (shapes and attributes as data-model § Icon), and `packages/elements/test/scenarios/icon-set.ts`: US2 scenarios 1 to 4 as shared bodies — names exactly the thirteen; rendered DOM equals the expected table per icon; painted area within 0 to 24 (geometry grown by 1 unit); no two drawings equal; shared stroke attributes; no `style`, `id`, `href`, `<use>`, `<image>`, `<foreignObject>`, `<script>`, `on*`; mirroring by pixels with the "mirror every icon" plant biting on `folder`, `file`, `search`, `copy`; and, per name of the thirteen, US1-2's box (exactly `--ocelle-icon-size` square, SC-002) and US1-7's forced-colour contexts (dark and light palettes; text, link, button, disabled button; every painted part in the context's system colour, SC-004), run by T033's two harnesses (analysis G1)
- [ ] T033 [P] [US2] `packages/elements/test/icon-set.test.ts` (in-process) and `packages/elements/test/browser/icon-set.test.ts` (fixture) over T032; `packages/elements/test/node/manifest.test.ts` gains the thirteen-name union (US2-1)
- [ ] T034 [P] [US2] `gates/test/token-only.test.ts`: `scale: -1 1` and `scale: 1 -1` pass; `scale: 2`, `scale: 2px 1`, `scale: calc(2)` and `scale: calc(-1) 1` are raw (the whole value of `scale` is checked; any function is raw); plants `gates/plants/style-lint/pass-scale-mirror`, `fail-scale-factor`, `fail-scale-length`, `fail-scale-calc` (R-03)
- [ ] T035 [US2] `packages/elements/test/node/readme.test.ts` gains the icon table (each name with its consumer need, `folder`, `file`, `search` and `table` mapped to the kitty-mission-ui needs) and the licence sentence (own drawings, Apache-2.0); the CHANGELOG names the thirteen names
- [ ] T035a [P] [US2] `storybook/test/integration/elements-stories.test.ts` gains the grid: one `ocelle-icon` per name of the thirteen, in light and dark, zero CSP violations (US1-13, FR-019; analysis G4)

### Implementation (green)

- [ ] T036 [US2] `gates/stylelint/token-only.ts`: `scale` exact values `-1`/`1`, whole value, functions raw; the plants of T034
- [ ] T037 [US2] `packages/elements/src/icons.ts`: the twelve drawings (R-07), `mirror` flags; `ocelle-icon.ts`: the `mirror` class and `:host(:dir(rtl)) .mirror { scale: -1 1; }` (R-08); regenerate `custom-elements.json`
- [ ] T038 [US2] `storybook/stories/icon.stories.ts`: the grid of all thirteen, light and dark, passing T035a
- [ ] T039 [US2] README icon table, licence sentence and CHANGELOG names (T035); `specs/005-icons-brand-mark/reviews/phase-3/tdd-exempt.md` states why "`THIRD_PARTY_NOTICES` lists no icon set" (US2-5) cannot go red
- [ ] T040 [US2] Run the "mirror every icon" plant and the token-only plants once, record in `reviews/phase-3/plants.md`; then `gate:style-lint`, `gate:manifest`, `gate:csp`, `gate:prefix`, `gate:plants`, `gate:mutation -- --base <phase base>` (one at a time; csp and prefix because the stories changed, analysis L6)

**Checkpoint**: `tdd-check.sh 3` reports `pass`.

---

## Phase 4: User Story 3 - The slot convention for icons in controls (Priority: P3)

**Goal**: US3 scenarios 1 to 11; FR-020 to FR-023; the `1lh` lint allowance; the shared `iconSlotStyles` and the
test host.

**Independent Test**: on `ocelle-test-host`, slotted `ocelle-icon` and bare `<svg>` icons are 20 × 20 px whatever
the page sets, centred on the label's first line within 0.5 px, inside the control's border box, `--ocelle-space-2`
from the label, empty slots take no space, and an icon-only host's name is exactly its own.

### Tests (red, one commit)

- [ ] T041 [P] [US3] `gates/test/token-only.test.ts`: `block-size: 1lh` passes; `calc((var(--ocelle-icon-size) - 1lh) / 2)` passes; `2lh`, `calc(2lh)`, `calc(1lh * 2)`, `calc(var(--ocelle-space-1) + 1lh + 1lh)` and `calc(1lh + 1px)` are raw; plants `pass-one-line`, `pass-one-line-calc`, `fail-lh-multiple`, `fail-lh-multiple-calc`, `fail-lh-calc-factor`, `fail-lh-calc-twice` (R-03)
- [ ] T042 [P] [US3] `packages/elements/test/fixtures/test-host.ts` (`ocelle-test-host`, a Lit element: inner `<button class="icon-row">` with the icon wrapper, label and trailing wrapper of R-10, `label` passed as the button's `aria-label` when set, `iconSlotStyles` adopted) — a test fixture, written in the red commit
- [ ] T043 [P] [US3] `packages/elements/test/scenarios/slot.ts`: US3 scenarios 1 to 6 and 8 to 11 as shared bodies, with and without `base.css`; US3-1 and US3-10 at the four type and size cases of R-10 (centring ≤ 0.5 px of the first line box, single and wrapped label, the icon inside the button's border box), RTL placement; the pairs and plants of the spec table (empty slot gap; host rule loses; the `--ocelle-icon-size: inherit !important` pin removed for the token-on-the-slotted-icon case of US3-9; the strut for centring; the strut without alt text for US3-11's name; the `.icon-row` padding removed); US3-8 in forced colours, enabled and disabled
- [ ] T044 [P] [US3] `packages/elements/test/slot.test.ts` (in-process, test host imported from source) and `packages/elements/test/browser/slot.test.ts` (fixture, test host bundle built in `global-setup.ts` with its own Lit, plus the browser build)
- [ ] T045 [US3] `packages/elements/test/node/readme.test.ts` gains the slot convention (slots `icon` and `trailing`, size, alignment, gap, colour, the `1lh` row and padding rule — a control never sets block padding on the row — the base-stylesheet interaction, resizing only through `--ocelle-icon-size` on the control, a slotted SVG needs a `viewBox`) and the naming rule (icon-only controls name their inner control; no `label` on slotted icons) (SC-007)

### Implementation (green)

- [ ] T046 [US3] `gates/stylelint/token-only.ts`: `1lh` alone and once as a `+`/`-` operand beside an `--ocelle-*` token inside `calc()`; the plants of T041
- [ ] T047 [US3] `packages/elements/src/icon-slot.ts`: `iconSlotStyles` per R-10 and data-model § Slot convention (`.icon-row` inline-flex, `align-items: flex-start`, `padding-block: calc((var(--ocelle-icon-size) - 1lh) / 2)`; `.icon-slot` `block-size: 1lh`, centred, `flex: none`; `::slotted(*)` size, `max-inline-size: none`, `flex: none`, `--ocelle-icon-size: inherit` all `!important`, `color: inherit`; margins toward the label)
- [ ] T048 [US3] README slot-convention and naming sections (T045)
- [ ] T049 [US3] Run each US3 plant once, record in `reviews/phase-4/plants.md`; then `gate:style-lint`, `gate:csp`, `gate:prefix`, `gate:plants`, `gate:mutation -- --base <phase base>` (one at a time; csp and prefix because `icon-slot.ts` joins the built output, analysis L6)

**Checkpoint**: `tdd-check.sh 4` reports `pass`.

---

## Phase 5: User Story 4 - The Ocelle brand mark (Priority: P4)

**Goal**: US4 scenarios 1 to 15; FR-024 to FR-031; the `aspect-ratio` lint allowance; the contrast rows; the
records (NOTICE and its packed copy, CHANGELOG; the Lit records came in phase 2).

**Independent Test**: `ocelle-brand-mark` renders the rosette in its three variants on the fixture with the colours
of data-model § Variants, `currentColor` in forced colours, 20 × 20 px by default and square from a height alone;
every FR-026 pair is a checked row; the packed tarball holds `LICENSE`, `NOTICE`, `THIRD_PARTY_NOTICES`.

### Tests (red, one commit)

- [ ] T050 [P] [US4] `gates/test/token-only.test.ts`: `aspect-ratio: 1` passes; `aspect-ratio: 2`, `aspect-ratio: 1 / 1` and `aspect-ratio: calc(2)` are raw; plants `pass-aspect-square`, `fail-aspect-ratio-other`, `fail-aspect-calc` (R-03)
- [ ] T051 [P] [US4] `packages/elements/test/scenarios/brand-mark.ts`: US4 scenarios 1 to 3, 5 to 9 and 13 to 15 as shared bodies — colours per variant on every main ground and both chrome grounds in light and dark; mono wins over chrome; unknown values give the default; forced colours on all three variants in text, link, button and disabled button with the plants (the pre-round-1 sheet without the `@media not (forced-colors: active)` wrapper, `fill: CanvasText`); naming, blank host `aria-label`, `aria-hidden`, `hidden` (plant: `:host([hidden])` removed); US4-7 default 20 × 20, height-only 32 × 32, width-only 32 × 20, column flex and flex row beside other content, each 20 × 20 (plant: `inline-size: auto`; analysis L8), 48 px bar with `block-size: 100%` 48 × 48; geometry vs `sources/ocelle-docs-logo.reference.svg` within 0.5 % (US4-9), and in the same test the rendered drawing holds none of the reference's literal colours, no rounded square, and no `style`, `id`, `href`, `xlink:href`, `<use>`, `<image>`, `<foreignObject>`, `<script>` or event-handler attribute (US4-9, FR-010; analysis G3)
- [ ] T052 [P] [US4] `packages/elements/test/brand-mark.test.ts` (in-process), `packages/elements/test/browser/brand-mark.test.ts` (fixture, SC-001 for the three variants); the US1-10 fixture test of T015 extended to `customElements.get("ocelle-brand-mark")` still being the first bundle's class (analysis F1 (a)); `entry-root.test.ts` now asserts both elements and both export names and `entry-brand-mark.test.ts` that importing `../src/ocelle-brand-mark.ts` defines only it
- [ ] T053 [P] [US4] `gates/test/contrast-pairs.test.ts`, `gates/test/contrast.test.ts`, `gates/test/integration/plants-robustness.test.ts`, `gates/test/integration/token-gates.test.ts`: 160 pairs in light, 168 in dark, 328 entries (R-09)
- [ ] T054 [P] [US4] `packages/elements/test/node/brand-pairs.test.ts` (R-09, FR-026): through the check in `packages/elements/test/node/brand-pairs-check.ts` (a function over a stylesheet text, shared with T055), the tokens painted per variant read from `ocelle-brand-mark.ts`'s style template are exactly `color-ink`/`color-accent` (default) and `color-chrome-ink`/`color-accent` (chrome); every FR-026 pair is a `checked` row of `pairs.json` in its themes; with the fixture `packages/elements/test/node/fixtures/pairs-missing-row.json` (the dark `color-accent` on `color-chrome` row removed) the test reports that pair and theme; `manifest.test.ts` gains the `ocelle-brand-mark` entry (US4-12)
- [ ] T055 [P] [US4] `packages/elements/test/build/pack.test.ts` (T016a) gains `NOTICE` in the packed list (FR-030); `packages/elements/test/build/build.test.ts` gains: the check of `brand-pairs-check.ts` on the `css` template of the built `dist/ocelle-brand-mark.js` finds exactly FR-026's tokens per variant (US4-4, the stylesheet as shipped; analysis L5), and `dist/ocelle-brand-mark.js` imports neither `index.js` nor `ocelle-icon.js`
- [ ] T056 [US4] `packages/elements/test/node/readme.test.ts` gains the mark (variants and grounds, tokens read, behaviour without `tokens.css`, percentage heights need a definite container), the trademark note in the README and in `NOTICE` (FR-030), `@ocelle/elements/ocelle-brand-mark.js` in the README's list of entry points (FR-002; analysis L7), and the CHANGELOG's final surface list with the browser build's path (FR-031); the Lit entry is asserted since T020
- [ ] T056a [P] [US4] `storybook/test/integration/elements-stories.test.ts` gains the brand-mark stories: main ground, chrome, mono and labelled, each in light and dark rendering its `ocelle-brand-mark` with the story's `ground`, `tone` (and `label`), zero CSP violations (US4-11, FR-019; analysis G4)

### Implementation (green)

- [ ] T057 [US4] `gates/stylelint/token-only.ts`: `aspect-ratio` exact value `1`, whole value; the plants of T050
- [ ] T058 [US4] `packages/elements/src/rosette.ts` (`viewBox="4 4 92 92"`, the reference's rosette coordinates, classes `ring` and `spot`; R-09) and `packages/elements/src/ocelle-brand-mark.ts` (properties `ground`, `tone` reflected, `label`; `observedAttributes` + `aria-label`; styles per data-model § Variants inside `@media not (forced-colors: active)`, `currentColor` otherwise, `:host` sizing with `block-size: var(--ocelle-icon-size)`, `inline-size: max-content`, `aspect-ratio: 1`, `:host([hidden])`; `@tagname`/`@default`; `define`); `index.ts` defines and exports it; `package.json` `exports` gains `./ocelle-brand-mark.js` (analysis F1 (a)); regenerate `custom-elements.json`
- [ ] T059 [US4] `packages/tokens/contrast/pairs.json`: the 13 rows of data-model § Contrast rows, figures from `gates/lib/wcag.ts`, `source: "computed"`; the record comment in `gates/bin/contrast.ts`
- [ ] T060 [US4] `NOTICE` (Apache-2.0 notice with the trademark note); the elements build also copies root `NOTICE` into the package; `files` gains `NOTICE` (R-15); the Lit entry, its licence file and the other copies landed in T024a
- [ ] T061 [US4] `storybook/stories/brand-mark.stories.ts`: main ground, chrome, mono, labelled; light and dark (US4-11), passing T056a
- [ ] T062 [US4] README mark and trademark sections, the brand-mark entry point in the README's list, CHANGELOG final surface list (T056)
- [ ] T063 [US4] Run each US4 plant once, record in `reviews/phase-5/plants.md`; then `gate:contrast`, `gate:brand-rules`, `gate:style-lint`, `gate:manifest`, `gate:csp`, `gate:prefix`, `gate:plants`, `gate:mutation -- --base <phase base>` (one at a time); quickstart steps 1 to 6

**Checkpoint**: `tdd-check.sh 5` reports `pass`.

---

## Dependencies & Execution Order

- Phase 1 blocks everything (projects, pins, plant trees).
- Phase 2 (US1) blocks phases 3 to 5: it creates the package, the conventions, the harnesses, the manifest gate and
  the mutation split.
- Phase 4 (US3) depends on phase 3 (US2): its scenarios slot `folder` (US3-1, US3-9, US3-11) and `arrow-end`
  (US3-10, US3-11), which phase 3 draws (T037), and US3-11 asserts that both draw.
- Phase 5 (US4) depends only on phase 2 for behaviour.
- Phases 3, 4 and 5 also share `gates/stylelint/token-only.ts`, `token-only.test.ts`, the README, the readme test,
  the story test and the manifest, so they run in order 3, 4, 5, one review unit at a time.

## Parallel Opportunities

- Within each red commit the test files marked [P] touch different files and can be written in parallel.
- Within phase 2, T025 to T027 (manifest, gate, mutation split) touch disjoint files after T024.
- Heavy runs (browser suites, plants, mutation) never run in parallel.

## Implementation Strategy

- MVP: phases 1 and 2 give a working, gated `ocelle-icon` with the `close` glyph and every element convention.
- Then the icon set (phase 3), the slot convention that #7 and #12 need (phase 4), and the brand mark that #12's top
  bar needs (phase 5), each folded after approval.
