# Tasks: Design Tokens

**Input**: Design documents from `specs/002-design-tokens/` (spec.md with Appendix A, plan.md, research.md R-01 to
R-15, data-model.md, contracts/token-package.md, contracts/gates.md, quickstart.md), as approved at the plan gate on
2026-11-03 after three plan-squad rounds.

**Tests**: required. Constitution Principle VIII applies to every phase except the exempt setup: each phase runs
through the story workflow (`base.sh`, optional `scaffold.sh`, one red commit with `red.sh`, green, `tdd-check.sh`,
independent review). Expected values in tests are transcribed from Appendix A (data-model.md § Expected tables),
never read from `packages/tokens/src/source.ts`.

**Organization**: Phase 1 is the exempt setup. User Story 1 is split in two review units: phase 2 (the token package,
themes, style-lint) and phase 3 (the token Storybook under strict CSP, starting with the spike). Phases 4 to 6 are
user stories 2 to 4. Cross-cutting records (gates/README.md, registry, CI) belong to the phase whose gate or scope they
describe; there is no separate polish phase.

**Stop-and-ask points** (the phase stops and the implementer asks the operator, records the question in the phase
review and does not work around it): T030 spike outcomes (R-10, contracts/gates.md: any network access during the
Storybook build, any run-time CSP violation under the Storybook page's header, any run-time monospace finding, canvas
text in the token stories, a `csp` or `prefix` finding on the in-scope files when the spike runs the gates on them by
hand (T030 step 6), a mutation shard over 10 minutes); T047 the font commit `d485f61f` not resolving to exactly one
commit or no variable `wght` WOFF2 at it (FR-011); T066 kitty-mission-ui unreadable or a role count other than 55
(FR-024); any correction of a `#5`-sourced contrast figure (spec edge case "Recorded figure wrong in #5").

## Format: `[ID] [P?] [Story] Description`

- **[P]**: can run in parallel (different files, no dependency on an unfinished task)
- **[Story]**: the user story of the task (US1 to US4)
- Paths are relative to the repository root.

---

## Phase 1: Setup (exempt)

**Purpose**: dependencies, workspace and configuration wiring with no behaviour of its own. No red commit: write
`specs/002-design-tokens/reviews/phase-1/tdd-exempt.md`.

- [X] T001 Write `specs/002-design-tokens/reviews/phase-1/tdd-exempt.md` stating why no test can fail for this phase (it adds dependencies, an empty workspace package and ignore entries only) and listing the files of T002 to T007
- [X] T002 Add `storybook` to `pnpm-workspace.yaml` `packages` (keep `minimumReleaseAge: 10080`, strict, empty `allowBuilds`)
- [X] T003 Create `storybook/package.json`: name `@ocelle/storybook`, `"private": true`, version `0.0.0`, `type: module`, dev dependencies `storybook` and `@storybook/html-vite` pinned exactly at the newest release at least seven days old on the day of install (10.6.4 at plan time, R-10), `@ocelle/tokens` as `workspace:0.0.0`; no scripts yet
- [X] T004 [P] Add `storybook/dist/` and `storybook/.generated/` to `.gitignore`
- [X] T005 [P] Add `storybook/.storybook/**/*.ts` explicitly to the root `tsconfig.json` include (`**/*.ts` skips dot-directories, contracts/gates.md § Mutation, typecheck and test scope)
- [X] T006 Run a non-frozen `pnpm install` to update `pnpm-lock.yaml`, commit it, then `pnpm run setup:online` and `pnpm run gate:pins` (exit 0) and `pnpm test` (exit 0)
- [X] T007 [P] Confirm `specs/002-design-tokens/sources/console-v2-tokens.md` has SHA-256 `7b0a5d0c4af7d1c7fa83f2a4af130e76097f6e6283e980da704c424395d9e61a` (R-05) and record the check in the exempt note

**Checkpoint**: `pnpm test`, `pnpm run gate:pins`, `pnpm run gate:typecheck` exit 0; `tdd-check.sh 1` reports `exempt`.

---

## Phase 2: User Story 1 - A host page gets every token, in the right theme (Priority: P1) 🎯 MVP

**Goal**: `@ocelle/tokens` publishes every Appendix A token as `--ocelle-*` with the theme rule, reduced motion, the
JSON export and typed names; style-lint rejects unknown token names (spec US1 scenarios 1 to 10, FR-001 to FR-010,
FR-025; research R-01 to R-05, R-09, R-11, R-12, R-15; contracts/token-package.md; contracts/gates.md § Configuration
set, § `style-lint`, § Mutation).

**Independent Test**: `pnpm test` passes the `tokens` and `tokens-browser` projects (six theme conditions, attribute
removal, reduced motion, used values, JSON agreement); `pnpm run gate:style-lint` rejects `var(--ocelle-color-canvs)`
and accepts real tokens; `pnpm run gate:plants` passes with the new style-lint plants; `tdd-check.sh 2` reports
`pass`.

### Scaffold

- [X] T008 [US1] Scaffold commit: `packages/tokens/src/source.ts` (exported empty `records` typed `readonly TokenRecord[]`), `packages/tokens/src/overrides.ts` (exported empty `overrides`), `packages/tokens/src/generate.ts` with exported signatures `css()`, `json()`, `names()`, `resolve()`, `validateSource()`, `applyOverrides()` returning empty values, `packages/tokens/scripts/build.ts` (no-op), `packages/tokens/test/browser/serve.ts` (signature only), `packages/tokens/contrast/pairs.json` as `[]` (analysis F1, option (a): created here so that the phase 2 configuration set of T021/T028 copies an existing file in every `repo-tree` plant; T059 fills it in phase 5); add the `tokens-browser` project to `vitest.config.ts` (node, include `packages/tokens/test/browser/**/*.test.ts`) and `packages/tokens/test/browser/**` to the `tokens` project's exclude; add `tokens-browser` to the excluded projects of `vitest.mutation.config.ts`; commit `chore(002-design-tokens): phase 2 scaffold`; run `.specify/extensions/story/scripts/scaffold.sh 2`

### Tests (red, one commit)

- [X] T009 [P] [US1] `packages/tokens/test/expected.ts` (test data, no assertions): the token table of data-model.md § Expected tables transcribed by hand from spec Appendix A A.1 to A.5 (every name, its group, light and dark or single value, comparison kind `colour` / `keyword` (only `color-scheme`) / probe, and for derived tokens the expected reference form), and the six A.6 names; includes the plan-supplied values: light `color-chrome-hover` `#211D18` (R-04), the light shadows, 1px ring and `vw`/`dvh` dialog values (R-05)
- [X] T010 [P] [US1] `packages/tokens/test/source-table.test.ts`: runs the generator on the real `source.ts` and compares, token by token, the stylesheet's declarations and `json()`'s resolved values with `expected.ts` (token stream for colours, exact text for the others); no A.6 name exists; the name set is exactly the table's (kills `source.ts` value mutants, R-03 *Mutation path*)
- [X] T011 [P] [US1] `packages/tokens/test/generate.test.ts` on fixture sources: `css()` emits the four blocks of R-02 in order (light and theme-independent in `:root`; dark under `@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) }`; dark under `:root[data-theme="dark"]`; `@media (prefers-reduced-motion: reduce)` setting exactly `--ocelle-motion-fast` and `--ocelle-motion-base` to `0ms`); light values only in the unconditioned block and dark only in the two dark blocks (no-preference coverage, FR-006); a derived token's declaration is `var(--ocelle-<ref>)` or contains exactly its refs' `var()`s, and changing the source token in the fixture changes the derived value in both `css()` (as a reference) and `json()` (resolved) (FR-002, R-12); `color-scheme` is emitted as `light`/`dark`
- [X] T012 [P] [US1] `packages/tokens/test/resolve.test.ts` and `validate.test.ts` on fixture sources: `resolve()` resolves single `var()` colour references and nested references, per theme; `validateSource` fails naming the token and rule for each data-model.md § Token validation rule: duplicate name, A.6 name, unknown `ref` name or ground, `ref` not equal to the set of `var(--ocelle-…)` names in the value of the same theme, reference cycle, colour value not a 6-digit hex, `rgb(… / α)` (only `color-overlay`), exactly one colour `var()` reference, or `light`/`dark` for `color-scheme`; a ground or `contrast` on a token whose resolved value is not opaque; a theme-independent token with a `{light, dark}` value
- [X] T013 [P] [US1] `packages/tokens/test/overrides.test.ts`: `applyOverrides` sets a token's value by name per theme, adds a record, removes a record, and fails naming an unknown name; the committed `overrides` in `src/overrides.ts` is empty (data-model § Token overrides)
- [X] T014 [P] [US1] `packages/tokens/test/json.test.ts`: `json()` output has `version: 1`, one entry per token in source order with full `--ocelle-` names, `group`, `light`/`dark` or `value` resolved, `ref` in full-name form and in the value's shape (`["--ocelle-space-4"]`; `{ "light": [], "dark": ["--ocelle-color-rule-strong"] }`), no `use` field (contracts/token-package.md, data-model § JSON export); every stylesheet token is in the JSON and vice versa (SC-002)
- [X] T015 [P] [US1] `packages/tokens/test/index.test.ts`: `tokenNames` equals the table's names; `cssName("color-canvas")` is `--ocelle-color-canvas`; `tokens` equals `json()` of the source; a `// @ts-expect-error` line proves `cssName("color-canvs")` does not typecheck (FR-009)
- [X] T016 [P] [US1] `packages/tokens/test/build.test.ts`: running `scripts/build.ts` with an output directory writes exactly `css()` to `tokens.css` and `JSON.stringify(json())` to `tokens.json`, and copies `fonts/` when present (a fixture `fonts/` with one file lands in `dist/fonts/`), and with no `fonts/` directory (as before phase 4, since git keeps no empty directory) skips the copy without error and writes no `dist/fonts/` (analysis U1; from phase 4 a missing font file fails the font test of T043, spec edge case "Font file unavailable at build time"); `package.json` `exports` and `files` are those of R-11
- [X] T017 [P] [US1] `packages/tokens/test/browser/themes.test.ts` (`tokens-browser`): with `serve.ts` (generator output written in `beforeAll` to a temp dir inside the worker, R-03), for each of the six theme conditions of FR-006 (`page.emulateMedia`, `colorScheme: 'no-preference'` for no preference) the run-time removal of `data-theme`, and a run-time switch of `data-theme` on `<html>` from `light` to `dark` and back to `light` without reload (values checked after each switch; spec edge case "Theme attribute changed at run time", analysis E3): the set of `--ocelle-*` names on `:root` read through CSSOM equals the table's; each colour token's computed value parsed as RGBA equals the expected theme's value; `color-scheme` compared as the trimmed keyword; `data-theme="sepia"`, empty, or on `<body>` follows the system (spec edge cases)
- [X] T018 [P] [US1] `packages/tokens/test/browser/values.test.ts` (`tokens-browser`): non-colour tokens observed through probe elements as used values, per theme where theme-dependent: sizes via `width` (dialog sizes at 1280 × 800: 1248 px and 768 px), elevations via `box-shadow` (exact R-05 values in light, rings in dark, `none` for dark `elevation-bar`), motion via `transition-duration` (120 ms / 200 ms, and 0 ms under `reducedMotion: 'reduce'` with `easing-standard` unchanged, FR-007); theme-independent tokens equal in all six conditions (US1 scenario 6)
- [X] T019 [P] [US1] `packages/tokens/test/browser/csp.test.ts` (`tokens-browser`): page served with the constitution IV CSP plus `font-src 'self'` loading `tokens.css` by `<link>`: the `addInitScript` violation collector (R-03 *CSP violations*) reports exactly one violation on the control fixture (inline `<style>`), then zero on the token page (US1 scenario 10's runtime half)
- [X] T020 [P] [US1] `packages/tokens/test/readme.test.ts`: `packages/tokens/README.md` states the host contract of contracts/token-package.md (load once; the theme rule; `--ocelle-color-scheme` applied by #6; forced colours and the `box-shadow` caveat; the rendered brand rules including controls on `color-accent-low`, `color-inset`, `color-hover-bg` and the five state `-bg` grounds bordered with `color-accent-strong`) by asserting each required sentence fragment of R-15; `CHANGELOG.md` has an "Unreleased — Added" entry naming every token (FR-025)
- [X] T021 [P] [US1] `gates/test/plant-repo.test.ts` additions: `configurationSet` copies `packages/tokens/src/source.ts`, `overrides.ts`, `generate.ts` (and modules they import) and `packages/tokens/contrast/pairs.json` into a `repo-tree` plant root (contracts/gates.md § Configuration set, first paragraph); `gates/test/integration/plant-repo.test.ts`: a built plant root holds these files
- [X] T022 [P] [US1] `gates/test/token-only.test.ts` additions (rule options with fixture lists): `var(--ocelle-color-canvs)` gives `ocelle/token-only: unknown token --ocelle-color-canvs`, also inside `calc()` and as a `var()` fallback; a real token passes; a name declared as `cssProperties[].name` in a fixture manifest passes and a misspelling of it fails (exact name, no prefix rule); the plugin exits 2 (throws a cause) when the token source fails validation, when the manifest exists but is not JSON or not the schema, or when a declared element property equals a token's full name (contracts/gates.md § `style-lint`)
- [X] T023 [P] [US1] `gates/test/vitest-config.test.ts`: `vitest.mutation.config.ts` excludes exactly `gates-integration`, `tokens-browser` (and, from phase 3, `storybook-integration`); resolving every project's `include`/`exclude` against the repository's test files, no test file is in both a kept and an excluded project, and each test file is in exactly one project (contracts/gates.md § Mutation)
- [X] T024 [US1] Commit T009 to T023 alone (`test(002-design-tokens): phase 2 red — US1 tokens`), run `.specify/extensions/story/scripts/red.sh 2 phase`, and confirm every new test fails on an assertion against the scaffold, not on a load error

### Implementation (green)

- [X] T025 [US1] Implement `packages/tokens/src/generate.ts` (`resolve`, `validateSource`, `applyOverrides`, `css`, `json`, `names`; pure, no I/O; R-01, R-02, R-12) and `packages/tokens/src/source.ts` with every Appendix A token as a record (`as const satisfies readonly TokenRecord[]`, `ref`/`grounds` typed `string`, use as a comment beside each record, `contrast` with A.8 kinds and grounds including the round-1 and round-2 additions: 149 required pairs per theme), applying `overrides` through `applyOverrides`; `packages/tokens/src/index.ts` (`TokenName`, `tokenNames`, `tokens`, `cssName`)
- [X] T026 [US1] Implement `packages/tokens/scripts/build.ts` as a thin boundary (writes `css()`, `json()`, copies `fonts/` if the directory exists and skips it otherwise, T016), update `packages/tokens/package.json` `exports`, `files` and `build` per R-11, and `packages/tokens/test/browser/serve.ts` (temp dir per suite, Node `http` server with a configurable `Content-Security-Policy` header, fixture pages, violation collector via `addInitScript`)
- [X] T027 [P] [US1] Write `packages/tokens/README.md` (host contract, theme rule, `color-scheme` hand-off, forced colours, rendered brand rules; R-15) and `packages/tokens/CHANGELOG.md` (Unreleased — Added: every token name)
- [X] T028 [US1] Extend `gates/lib/plant-repo.ts` `configurationSet` with the token files (T021); extend `gates/stylelint/token-only.ts` with the unknown-token check, reading the token list from `packages/tokens/src/source.ts` and the element property list from `packages/elements/custom-elements.json` (empty while absent) under `--root`, accepting both as rule options (R-09); move the plants `pass-var-token`, `pass-var-keyword-fallback`, `fail-var-fallback` and the tests `gates/test/token-only.test.ts`, `token-only-parts.test.ts` from `--ocelle-x` to real tokens (for example `--ocelle-space-2`), recording in the commit body that under the new rule `--ocelle-x` is an unknown token (constitution VIII: a red-step test replaced by a stricter one with the reason); add plants under `gates/plants/style-lint/`: `fail-unknown-token`, `fail-element-property-misspelt`, `pass-known-token`, `pass-element-property` (fixture `packages/elements/custom-elements.json` declaring `ocelle-button` with `cssProperties` `--ocelle-button-gap`), breaking `element-property-clash` (a manifest declaring `--ocelle-space-2`)
- [X] T029 [US1] Update `gates/README.md`: style-lint row (unknown-token rule, plants), the configuration set change, and the custom-elements-manifest deferral row (committed file at `packages/elements/custom-elements.json`, read by style-lint; PLAN-FRESH-2-004); run `pnpm test`, `pnpm run gate:style-lint`, `pnpm run gate:typecheck`, `pnpm run gate:lint`, `pnpm run gate:test-lint`, `pnpm run gate:plants`, `pnpm -r build && pnpm run gate:csp && pnpm run gate:prefix`, then `.specify/extensions/story/scripts/tdd-check.sh 2` (`pass`), and commit green

**Checkpoint**: tokens available to any host page; style-lint guards token names.

---

## Phase 3: User Story 1 (part 2) - Token stories under the strict CSP (Priority: P1)

**Goal**: the minimal Storybook of FR-023 with one story per group, its preview (`iframe.html`, the Storybook page)
running under the Storybook page's CSP (constitution IV plus `font-src`, `connect-src` `'self'`) with zero violations
and no monospace, and no manager UI in the build (operator decision R1-01, 2026-11-04); the
`csp` and `prefix` gates widened to the Storybook inputs (spec US1 scenarios 11 to 13, FR-023, SC-008; research R-03
*Mutation path* shard time, R-10; contracts/gates.md § `csp`, `prefix`, § Monospace in Storybook, § Mutation).

**Independent Test**: `pnpm test` passes the `storybook` and `storybook-integration` projects (stories list exactly
their group's tokens in light and dark, zero CSP violations and zero monospace elements after the controls are
reported); `pnpm run gate:csp` and `gate:prefix` pass on the Storybook inputs and their new plants fail as listed;
`tdd-check.sh 3` reports `pass`.

### Spike (first; findings recorded, stop-and-ask)

- [X] T030 [US1] Spike, recorded in `specs/002-design-tokens/reviews/phase-3/spike.md` before any phase 3 test: build the pinned Storybook with a throwaway story under `storybook/` (not committed), with the no-network preload of T036 (or the equivalent by hand) recording every outbound connection and DNS lookup of the build, and record them (analysis E2); (1) run `node gates/bin/csp.ts` by hand on the Vite preview bundle and on `sb-addons/` and record the findings (not a gate result); (2) serve the build with the Storybook page's CSP header and record every `securitypolicyviolation` by directive with the R-03 collector, trying the R-10 techniques in order; (3) record whether the token stories draw canvas text; (4) run the run-time monospace check of contracts/gates.md; (5) measure one mutation shard holding a 120-line `packages/tokens/src/source.ts` entry against the 10-minute `mutation-shard` limit; (6) run `node gates/bin/csp.ts` and `node gates/bin/prefix.ts` by hand on the files in scope of FR-023 (the throwaway story, `storybook/.storybook/`, `storybook/.generated/` and the `storybook/dist/*.html` entries after the R-10 externalisation technique tried in step 2) and record the findings; the gates are not yet widened (T041), so `.ts` files get only the rules the current `csp` gate applies to them, and the record says so (FR-023 "then runs the widened `csp` and `prefix` gates on the files in scope", analysis I1). **Stop and ask the operator** if the build makes any network access, any run-time CSP violation or monospace element remains, canvas text is drawn, step 6 gives any finding on the in-scope files (in particular an inline script left in an HTML entry), or the shard exceeds 10 minutes; otherwise record the configuration that reaches zero and continue

### Scaffold

- [X] T031 [US1] Scaffold commit: `storybook/.storybook/main.ts` (framework `@storybook/html-vite`, `core.disableTelemetry: true`), `preview.ts`, `manager.ts` exporting `theme` (empty values), `storybook/stories/tokens.stories.ts` (one export per group, empty render), `storybook/scripts/externalise.ts` and `storybook/scripts/swatches.ts` (signatures only), `storybook/package.json` scripts `prebuild` (swatches and token stylesheet into `.generated/`) and `build`; add the `storybook` (node, `storybook/test/unit/**/*.test.ts`) and `storybook-integration` (node, `storybook/test/integration/**/*.test.ts`, global setup building into a per-run temp dir) projects to `vitest.config.ts` and `storybook-integration` to `vitest.mutation.config.ts`'s excludes; commit `chore(002-design-tokens): phase 3 scaffold`; run `scaffold.sh 3`

### Tests (red, one commit)

- [X] T032 [P] [US1] `storybook/test/unit/swatches.test.ts`: `swatches.ts` generates from the token source one rule `.ocelle-swatch[data-token="<name>"] { background: var(--ocelle-<name>) }` per opaque colour token, none for `color-scheme` (shown as text) and none for `color-overlay` (not opaque); writes the token stylesheet (`css()`), the swatch stylesheet and the fonts into `.generated/`, copying `packages/tokens/fonts/` when present and, when it is missing (before phase 4), skipping the fonts without error (analysis U1)
- [X] T033 [P] [US1] `storybook/test/unit/externalise.test.ts`: on fixture HTML, every inline `<script>` and `<style>` moves to a same-origin file with a hashed name referenced by `src`/`<link>`, no `style` attribute remains, and an already external script is unchanged
- [X] T034 [P] [US1] `storybook/test/unit/telemetry.test.ts`: `main.ts` sets `core.disableTelemetry: true`; `storybook/test/unit/theme.test.ts`: `manager.ts`'s exported `theme.fontBase` and `fontCode` equal `"Schibsted Grotesk", "Helvetica Neue", Arial, system-ui, sans-serif` (transcribed from Appendix A, not imported)
- [X] T035 [P] [US1] `storybook/test/unit/stories.test.ts`: rendering each group story's render function into a DOM fixture lists exactly the table's tokens of that group (from `packages/tokens/test/expected.ts`), names and values, and no element carries a `style` attribute (FR-023)
- [ ] T036 [P] [US1] `storybook/test/integration/csp.test.ts` (`storybook-integration`): the global setup builds Storybook in a child process under a no-network Node preload (`storybook/test/integration/no-network.ts`, loaded with `--import`) that records every outbound `net`/`tls` connection and DNS lookup to a non-loopback host; the test asserts the recorded list of the build is empty, with a control: a one-line script run under the same preload that connects to a non-loopback address is recorded exactly once (FR-023 "the build MUST make no network request", analysis E2); the build output holds no `index.html`, no `sb-manager/` and no `sb-addons/` (the manager UI is not shipped, operator decision R1-01; green: the Storybook build script passes `storybook build --preview-only`, research R-10 *Preview only*, and `gates/README.md` § The Storybook scope of `csp` and `prefix` stops listing `sb-addons/` and `sb-manager/` among the bundles in the build); the built Storybook served with the Storybook page's header (`default-src 'none'; script-src 'self'; style-src 'self'; font-src 'self'; connect-src 'self'`, no `frame-src`), and the `Content-Security-Policy` header served asserted equal to that header (analysis E4); every page the test opens is the preview (`iframe.html`); the violation control is reported once, then for each group story in light and dark (toolbar global sets `data-theme` on the preview's `<html>`) zero violations, zero requests outside the origin, the story lists exactly its group's tokens (US1 scenario 11); the monospace control element (`element.style.fontFamily = "Menlo, monospace"` via `page.evaluate`) is reported exactly once, removed, then no element of the preview (open shadow roots included) has a computed `font-family` on `monospaceFamilies` (US1 scenario 11, SC-008; the scenario 13 theme test is T034)
- [X] T037 [P] [US1] `gates/test/csp.test.ts` additions: `checkOutput` on a `.ts` file in scope gives `style-attribute` for a markup string with `style=`, `new-function` for `new Function`; a `.ts` file with type annotations and `as const` parses; an unparsable `.ts` is exit 2; a `"<script>"` literal in `storybook/scripts/x.ts` gives no finding and `eval` there gives one; `isBuiltOutput` (scope) lists the Storybook inputs and `storybook/dist/*.html` in scope and the bundles out (contracts/gates.md § `csp`, `prefix`)
- [X] T038 [P] [US1] `gates/test/prefix.test.ts` additions: the scope covers `storybook/**` source and `storybook/.generated/`, not `node_modules` or the bundles; `monospaceFamilies` is exported and lists the FR-022 (001) families; `gates/test/mutation-ranges.test.ts` additions: `scopePathspecs` and the `source` regex include `storybook/scripts/**` and `storybook/.storybook/**`
- [X] T039 [US1] Commit T032 to T038 alone (`test(002-design-tokens): phase 3 red — US1 stories`), run `red.sh 3 phase`, confirm assertion failures

### Implementation (green)

- [X] T040 [US1] Implement `storybook/scripts/swatches.ts` (fonts copied when `packages/tokens/fonts/` exists, skipped otherwise, T032), `storybook/scripts/externalise.ts`, `.storybook/main.ts` (telemetry off, the configuration recorded by the spike), `preview.ts` (links the `.generated/` stylesheets, theme toolbar global setting `data-theme`), `manager.ts` (theme fonts), `storybook/stories/tokens.stories.ts` (plain-DOM render from the token source by relative import, swatches by class, no style attributes; R-10)
- [X] T041 [US1] Widen `gates/bin/csp.ts` (`isBuiltOutput` scope, `.ts` parsed as `ScriptKind.TS`, the `storybook/scripts/` markup exception) and `gates/bin/prefix.ts` (scope, export `monospaceFamilies`); `gates/lib/mutation/ranges.ts`; `gates/gates.json` scope texts; plants under `gates/plants/csp/`: `fail-storybook-inline-script`, `fail-storybook-story-style-attribute`, `fail-storybook-preview-new-function`, `fail-storybook-scripts-eval`, `pass-storybook-external-script`, `pass-storybook-scripts-tag-names`, breaking unparsable `.ts`; `gates/plants/prefix/fail-storybook-monospace` (`storybook/.generated/swatches.css`, rule `monospace`)
- [X] T042 [US1] Update `gates/README.md` (widened and narrowed scopes, SPEC-1-05 narrowing, the `.ts` rules and the `storybook/scripts/` exception, the Storybook page header); run `pnpm test`, `pnpm -r build`, `pnpm run gate:csp`, `gate:prefix`, `gate:typecheck`, `gate:lint`, `gate:test-lint`, `gate:plants`, then `tdd-check.sh 3` (`pass`), and commit green

**Checkpoint**: token reference stories run under the strict CSP; #10 can extend this Storybook.

---

## Phase 4: User Story 2 - The brand font ships with the tokens, offline (Priority: P2)

**Goal**: Schibsted Grotesk vendored with its licence, provenance and checksum, declared by `@font-face`, used with
no outside request, falling back under a CSP without `font-src` (spec US2 scenarios 1 to 6, FR-011 to FR-015; R-06,
R-03 *Font observables*).

**Independent Test**: `pnpm test` passes the font tests in `tokens` and `tokens-browser`, including the
`THIRD_PARTY_NOTICES` check of T043; `tdd-check.sh 4` reports `pass`.

### Tests (red, one commit)

- [ ] T043 [P] [US2] `packages/tokens/test/font.test.ts`: `fonts/SOURCE.json` has `repository` `schibsted/schibsted-grotesk`, a 40-hex `commit` starting `d485f61f`, and per file `path`, `upstreamPath`, `sha256`; recomputed SHA-256 of `fonts/SchibstedGrotesk-wght.woff2` and `fonts/OFL.txt` match; `OFL.txt` contains "SIL OPEN FONT LICENSE Version 1.1"; `package.json` `files` publishes `dist` (which the build fills with `fonts/`), and the build test of T016 now finds both files in `dist/fonts/`; `THIRD_PARTY_NOTICES` has a font entry whose licence (SIL Open Font License 1.1), repository, full 40-hex commit and package paths (`fonts/SchibstedGrotesk-wght.woff2`, `fonts/OFL.txt`) equal those of `fonts/SOURCE.json`, and no longer contains "No third-party asset ships yet." (FR-014, US2 scenario 2, analysis E1)
- [ ] T044 [P] [US2] `packages/tokens/test/generate.test.ts` additions: `css()` starts with exactly the `@font-face` of R-06 (family "Schibsted Grotesk", `src: url("./fonts/SchibstedGrotesk-wght.woff2") format("woff2")`, `font-weight: 400 900`, `font-display: swap`); no absolute URL anywhere in the output (US2 scenario 5); `font-sans`/`font-display` values and `figures` `tabular-nums` (FR-013) are covered by the source table
- [ ] T045 [P] [US2] `packages/tokens/test/browser/font.test.ts` (`tokens-browser`): under constitution IV CSP plus `font-src 'self'`: CDP `CSS.getPlatformFontsForNode` reports Schibsted Grotesk for text at weights 400, 500, 600, 800 (with a positive control: before the face loads, or with the font file removed, it reports a fallback); digits `0`–`9` with `var(--ocelle-figures)` have equal advance widths while a control without it does not (R-03); every request is same-origin (FR-015); zero violations after the control. Under exactly constitution IV CSP (no `font-src`): the only violation is the font file, a fallback family of `--ocelle-font-sans` is used, and every token still has its value (US2 scenario 6); `readme.test.ts` addition: README states `font-src 'self'` (FR-012)
- [ ] T046 [US2] Commit T043 to T045 alone (`test(002-design-tokens): phase 4 red — US2 font`), run `red.sh 4 phase`, confirm assertion failures

### Implementation (green)

- [ ] T047 [US2] Fetch `SchibstedGrotesk-wght.woff2` and the OFL licence from `https://github.com/schibsted/schibsted-grotesk` at the commit `d485f61f` resolves to; **stop and ask the operator** if it does not resolve to exactly one commit or the variable `wght` WOFF2 is absent there (FR-011); commit `packages/tokens/fonts/SchibstedGrotesk-wght.woff2`, `packages/tokens/fonts/OFL.txt` and `packages/tokens/fonts/SOURCE.json` (full commit id, upstream paths, SHA-256)
- [ ] T048 [US2] Add the `@font-face` to `css()` in `packages/tokens/src/generate.ts`; README CSP allowance sentence; `THIRD_PARTY_NOTICES` entry (licence, repository, full commit, paths in the package; replace "No third-party asset ships yet."; FR-014)
- [ ] T049 [US2] Run `pnpm test`, `pnpm -r build && pnpm run gate:csp && pnpm run gate:prefix`, `gate:plants`, then `tdd-check.sh 4` (`pass`), and commit green

**Checkpoint**: brand font offline, with provenance.

---

## Phase 5: User Story 3 - Contrast and brand rules are checked on every pull request (Priority: P3)

**Goal**: the `contrast` and `brand-rules` gates with the pair list, keyed-delta plants, registry, CI and README; the
"Contrast check" deferral ends (spec US3 scenarios 1 to 8, FR-016 to FR-022, SC-004 to SC-007; R-07, R-08;
contracts/gates.md § Configuration set *Plant deltas* and *Keyed locations*, § `contrast`, § `brand-rules`, § Plants).

**Independent Test**: `pnpm run gate:contrast` prints `contrast: 158 pairs checked in light, 157 in dark (149
required per theme)`; `pnpm run gate:brand-rules` prints `brand-rules: 7 rules checked`; `pnpm run gate:plants`
passes with every new plant; `tdd-check.sh 5` reports `pass`.

### Scaffold

- [ ] T050 [US3] Scaffold commit: `gates/lib/wcag.ts`, `gates/lib/token-source.ts`, `gates/bin/contrast.ts`, `gates/bin/brand-rules.ts` with exported signatures (gates' `run()` returns 0) (`packages/tokens/contrast/pairs.json` exists as `[]` since T008, analysis F1); root `package.json` scripts `gate:contrast`, `gate:brand-rules`; commit `chore(002-design-tokens): phase 5 scaffold`; run `scaffold.sh 5`

### Tests (red, one commit)

- [ ] T051 [P] [US3] `gates/test/wcag.test.ts`: relative luminance with the 0.04045 threshold; ratios of known pairs from spec A.7 and A.9 (`#15130F` on `#F1EEE8` 16.0 at one decimal; `#8F5E0F` on `#211D18` ≥ 3 unrounded, 3.012 at three decimals); `#FFFFFF`/`#000000` 21
- [ ] T052 [P] [US3] `gates/test/contrast-required.test.ts`: the required pair set derived from the real source equals the 149 `(fg, bg, kind)` triples per theme of A.8, transcribed by hand from the spec in the test (data-model § Expected tables), so removing a ground from `source.ts` fails it (PLAN-TESTABILITY-1-002)
- [ ] T053 [P] [US3] `gates/test/contrast.test.ts` (fixture sources and lists via `--root` on fixture trees): each finding rule of data-model § Gate findings and its order (`figure-mismatch` then `below-threshold` on one entry); figure precision intervals (`5.3` matches [5.25, 5.35); `3.02` [3.015, 3.025)); unrounded threshold (2.995 fails 3:1); disabled ink exempt from threshold but not from figure; `required-pair-excluded`, `excluded-without-reason`, `not-opaque`, `unknown-token`, `missing-required-pair` located at the foreground token's line; exit 2 for missing, unparsable, schema-invalid or empty list, a theme with zero entries, a source that fails validation; success line counts; `--print` lists required pairs with four-decimal ratios, exit 0
- [ ] T054 [P] [US3] `gates/test/brand-rules.test.ts`: one fixture per rule (a) to (g) of FR-019 with its rule id (`monospace-font`, `link-accent`, `radius-set`, `rule-boundary`, `dark-chrome`, `reduced-motion`, `forced-colours`); (b) also fails when the `color-accent` on `color-canvas` light entry is not listed as excluded; (c) the closed set `radius-1` 2px, `radius-2` 4px, `radius-row` 6px, `radius-shell` 10px, `radius-pill` 999px; (e) luminance ≤ 0.05 for `color-chrome` and `color-chrome-hover` in both themes, `color-chrome-ink` and `color-chrome-muted` equal across themes; (g) a forced-colours block mapping to `CanvasText` passes, to a hex fails, `forced-color-adjust: none` fails; exit 2 cases of contracts/gates.md § `brand-rules`; success line
- [ ] T055 [P] [US3] `gates/test/plant-repo.test.ts` and `plant-runner.test.ts` additions: each `delta.json` part (`tokens` set/add/remove, `pairs` set/remove/add by `(theme, fg, bg)`, `generator: "wrapped"`) is applied over the configuration set; an unknown token name or pair key fails naming the plant and key; a wrapper not re-exporting `./generate.real.ts` is rejected; a `tree/` holding a forbidden file is rejected; each keyed location form (`pairs.json#<theme>/<fg>/<bg>`, `source.ts#<name>`, `overrides.ts#<name>`, `dist/tokens.css#<text>`) resolves to the right line and an unresolvable or ambiguous key fails naming it; `gates/test/integration/plants-robustness.test.ts`: the three changes of contracts/gates.md (neighbouring `color-ink-soft` value with figures; a token inserted before `color-ink-soft` and a pair entry inserted first; light `color-danger`) leave every `contrast` and `brand-rules` plant's outcome unchanged
- [ ] T056 [P] [US3] `gates/test/registry.test.ts` additions: `fr020` includes `contrast` and `brand-rules`; `gates/gates.json` and `.github/workflows/ci.yml` jobs match (the plant job's registry check)
- [ ] T057 [US3] Commit T051 to T056 alone (`test(002-design-tokens): phase 5 red — US3 gates`), run `red.sh 5 phase`, confirm assertion failures

### Implementation (green)

- [ ] T058 [US3] Implement `gates/lib/wcag.ts`, `gates/lib/token-source.ts` (dynamic import of `source.ts` and `generate.ts` under `--root`, `validateSource`), `gates/bin/contrast.ts` (R-07, contracts/gates.md § `contrast`) and `gates/bin/brand-rules.ts` (R-08; rule (g) parses the generated stylesheet with PostCSS)
- [ ] T059 [US3] Write `packages/tokens/contrast/pairs.json`, one entry per line: the 149 required pairs per theme plus the excluded pairs of A.9 (158 light, 157 dark entries); `#5` figures from A.7 entered by hand with `source: "#5"`, all others from `node gates/bin/contrast.ts --print` with `source: "computed"` (light `color-chrome-muted` on `color-chrome-hover` 6.22, computed, per SPEC-2-01); any `#5` figure that does not match: **stop and ask the operator** (spec edge case)
- [ ] T060 [US3] Implement `delta.json` application and keyed locations in `gates/lib/plant-repo.ts` and `gates/lib/plant-runner.ts` (contracts/gates.md § Configuration set *Plant deltas*, *Keyed locations*)
- [ ] T061 [US3] Write the plants of contracts/gates.md § Plants under `gates/plants/contrast/` and `gates/plants/brand-rules/` (`delta.json`, keyed `plant.json` findings; the threshold plants list every finding computed with `--print`); add `contrast` and `brand-rules` to `gates/gates.json`, `fr020` in `gates/lib/registry.ts` and jobs in `.github/workflows/ci.yml` (same shape as the existing gate jobs)
- [ ] T062 [US3] Update `gates/README.md`: both gates in "The gates" with their plants, "Contrast" and "Brand rules" in "Required checks on `main`" (14 checks), the `delta.json` plant form and keyed locations, and remove the "Contrast check" row from "Deferred gates" (FR-022); note in `specs/002-design-tokens/reviews/phase-5/` that the operator must add the two checks to the `main` ruleset
- [ ] T063 [US3] Run `pnpm test`, `pnpm run gate:contrast`, `gate:brand-rules`, `gate:plants`, `gate:typecheck`, `gate:lint`, `gate:test-lint`, then `tdd-check.sh 5` (`pass`), and commit green

**Checkpoint**: token changes are guarded by contrast and brand-rule gates; SC-005 holds.

---

## Phase 6: User Story 4 - Consumers can map their `--sk-*` roles to `--ocelle-*` tokens (Priority: P4)

**Goal**: the mapping table of FR-024 as documentation (R-13).

**Independent Test**: `pnpm test` passes `sk-mapping.test.ts` (55 rows, every `--ocelle-*` name a token);
`pnpm run gate:prefix` passes; `tdd-check.sh 6` reports `pass`.

### Tests (red, one commit)

- [ ] T064 [US4] `packages/tokens/test/sk-mapping.test.ts`: parses `specs/002-design-tokens/sk-mapping.md`; the header records a kitty-mission-ui commit (40 hex); the table has exactly 55 rows; column 2 is an `--ocelle-*` name in `tokenNames` (via `cssName`) or `dropped`, and a `dropped` row names its replacement in column 3; refers to columns by position and holds no `sk-` literal (R-13)
- [ ] T065 [US4] Commit T064 alone (`test(002-design-tokens): phase 6 red — US4 mapping`), run `red.sh 6 phase`, confirm it fails on the missing table

### Implementation (green)

- [ ] T066 [US4] Read the `--sk-*` role names used by kitty-mission-ui (needs read access; **stop and ask the operator** if the repository cannot be read or the count is not 55, FR-024); write `specs/002-design-tokens/sk-mapping.md` with the commit read, one row per role (role, replacement token or `dropped`, replacement for dropped or merged roles, note); role names only, no code or values (constitution VI)
- [ ] T067 [US4] Run `pnpm test`, `pnpm run gate:prefix`, then `tdd-check.sh 6` (`pass`), and commit green

**Checkpoint**: kitty-mission-ui can plan its switch.

---

## Dependencies & Execution Order

- Phase 1 → Phase 2 (US1 tokens) → Phase 3 (US1 Storybook; needs the token source and generator) and Phase 4 (US2
  font; needs `css()` and `serve.ts`) → Phase 5 (US3 gates; needs the full source including the font-free tokens, the
  configuration set change of phase 2) → Phase 6 (US4; needs `tokenNames`).
- Phases 3 and 4 are independent of each other; the story workflow runs units in order (`units.sh`), so phase 3
  runs first. Phase 6 depends only on phase 2 and on kitty-mission-ui access.
- Within each phase: scaffold → red commit → green → `tdd-check.sh` → review.

## Parallel Opportunities

- Phase 2: T009 to T023 (separate test files) in parallel; T027 beside T025/T026.
- Phase 3: T032 to T038 in parallel after the spike.
- Phase 4: T043 to T045 in parallel.
- Phase 5: T051 to T056 in parallel.

## Implementation Strategy

- **MVP**: phases 1 and 2: hosts and the element issues (#6 to #17) can use the tokens.
- Then phase 3 (stories under strict CSP), phase 4 (font), phase 5 (gates), phase 6 (mapping), each a separate
  review unit with its own red/green proof.
- The stop-and-ask points above are not failures to work around: the phase pauses and the operator decides.
