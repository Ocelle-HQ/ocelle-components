# Implementation Plan: Icons and Brand Mark

**Branch**: `005-icons-brand-mark` (work on `claude/017-icons-brand-mark`) | **Date**: 2026-11-10 | **Spec**:
[spec.md](spec.md)

**Input**: Feature specification from `specs/005-icons-brand-mark/spec.md` (approved at the spec gate after a final fix,
2026-11-10).

## Summary

The first `@ocelle/elements` feature. It pins Lit 3.3.3 and sets the conventions later element missions follow: one
module per element with a guarded `define`, shared token-only `static styles`, a generated and gated
custom-elements manifest, stories in the existing Storybook, and two builds of one source — the module build (bare
`lit` imports, for bundler hosts) and a self-contained browser build (Lit inside, for strict-CSP hosts without a
bundler). On those conventions it ships `ocelle-icon` with thirteen own-drawn icons (inline SVG, `currentColor`,
`--ocelle-icon-size`, decorative unless labelled, mirrored where directional), a slot convention for icons in controls
proven on a test host (sizes enforced by `!important` `::slotted()` rules, which the page cannot undo), and
`ocelle-brand-mark`, the rosette on main grounds, on the chrome and in one colour. The new `manifest` gate, a
`token-only` allowance for `scale`, element-only Stryker routing, thirteen contrast rows and the records (README,
CHANGELOG, NOTICE, Lit notice) complete it. Every decision is in [research.md](research.md); the surface is in
[contracts/elements-package.md](contracts/elements-package.md) and the checks in [contracts/checks.md](contracts/checks.md).

## Technical Context

**Language/Version**: TypeScript 6.0.3 (strict, `erasableSyntaxOnly`), Node 26.13.0 in CI (22.23.4 in this container).

**Primary Dependencies**: `lit` 3.3.3 (runtime, exact; R-01). Dev: `@custom-elements-manifest/analyzer` 0.11.0
(R-06); already pinned: Vite 8.3.5 (browser build, test bundles; R-05), Vitest 5.0.5 with `@vitest/browser-playwright`,
Playwright 1.64.1, Stryker 10.1.1, Stylelint 17.16.0 with `postcss-lit`, Storybook 10.6.5 (`@storybook/html-vite`).

**Storage**: N/A.

**Testing**: Vitest projects `elements` (browser mode, in-process, mutated; with two browser commands, `axTree` and
`emulateForcedColors`), `elements-node` (node: build, manifest, pairing, README, pack) and `elements-browser` (Node +
Playwright on strict-CSP fixture pages serving the built browser build; not mutated) (R-11). Mutation of element
source under an elements-only Stryker configuration (R-12).

**Target Platform**: evergreen Chromium measured; WebKit (Kitty Desktop) unmeasured, an open limitation in the README.

**Project Type**: library (web components) in a pnpm workspace.

**Performance Goals**: 500 icons on a page share one adopted stylesheet per element class (US1-14).

**Constraints**: strict CSP (`default-src 'none'; script-src 'self'; style-src 'self'`) with no exception; no
network request; token-only styles; no `sk-` names or monospace; one heavy job at a time in this container.

**Scale/Scope**: 2 elements, 13 icons, 1 internal slot stylesheet, 1 new gate, 13 contrast rows.

## Constitution Check

*Gate: passes before Phase 0; re-checked after Phase 1 design — passes, with the exceptions in Complexity Tracking.*

| Principle | How this plan meets it |
|---|---|
| I. `ocelle-` names, no I/O, small interface, manifest | Tags `ocelle-icon`, `ocelle-brand-mark`; the test host is `ocelle-test-host` and ships nowhere. No events (nothing to emit). No I/O: drawings are inline templates, no `fetch`, no `<use href>`, no `<image>` (R-04). Interface: `name`, `label`; `ground`, `tone`, `label`. The manifest declares every property and attribute and states empty slots, events, parts and CSS properties; tokens read are documented, not declared (FR-007). The new `manifest` gate enforces it (R-06). |
| II. Tokens only, brand rules | All element CSS is in `css` templates linted by `ocelle/token-only`; the one change allows unitless `scale` for mirroring, with plants (R-03, R-08). Colours: `currentColor`, `color-ink`, `color-chrome-ink`, `color-accent`; no new token. The mark's light-ground ochre spot is not text and not a state, so "ochre text never on bone" and "ochre fill never the only state mark" do not apply (spec Assumptions); `tone="mono"` exists for hosts that need every part at 3:1. No monospace. |
| III. Accessible by construction | Decorative by default with the host itself hidden through `ElementInternals` (a host with an `id` is otherwise an empty `generic` node, spec check 2); labelled elements are one `img` node; host `aria-label` names and host `aria-hidden="true"` hides (FR-034, R-13). No ID reference crosses a shadow root (none used). Forced colours: `currentColor` everywhere, and an explicit forced-colours rule for the mark's token paints (R-09). Contrast: 13 new non-text rows plus a pairing test tied to the shipped stylesheet (R-09). The accessibility tree is read from Chromium's full AX tree in tests (R-11). Axe is not run on the new stories: see Complexity Tracking. |
| IV. Strict CSP, offline | Adopted stylesheets only; no `style` attribute or `<style>` in templates (presentation attributes on SVG shapes are not `style`). The browser build passes the `csp` gate with Lit inside (measured, R-05) and loads with one `<script type="module" src>` and no import map. Fixture pages are served under the strict header plus `font-src 'self'` for `tokens.css`'s font, and assert zero violations and only the allowed requests together with the positive outcome (R-11). |
| V. Storybook, behaviour tests | One story per icon and per mark variant and state, light and dark (R-14). No events exist, so no event assertions; no keyboard model (neither element is focusable). Baselines: see Complexity Tracking. |
| VI. Consumer-driven, own code | Needs from spec-kitty-design #496 and #504, kitty-mission-ui's Projects and Artifact Viewer screens, #7, #12 to #16. Drawings are our own (operator decision); the mark is Ocelle's own reference, redrawn onto tokens. Nothing copied from Spec Kitty. |
| VII. Semver | All additions (MINOR): two elements, thirteen icon names, entry points, the manifest. The `@ocelle/elements` CHANGELOG names them (FR-031). |
| VIII. Test-first, non-vacuous | Each phase starts red; "does not" outcomes are paired with positive ones and each pairing has a named plant (spec table). Element source is mutation-tested under the elements-only Stryker config (measured working, R-12); Stryker runs the in-process `elements` tests only, so every behaviour that matters is asserted there as well as on the built file. New gate code (`manifest.ts`, the mutation split, the lint change) is mutation-tested with its unit tests, and the gate has fail, pass and breaking plants. Documentation-only items take the exemption with the reason stated. |
| Licence and supply chain | Lit (BSD-3-Clause) is bundled into the browser build: entry in `THIRD_PARTY_NOTICES` with the licence text beside it (operator decision SPEC-2-02). New pins exact, release age respected, no install script (to be confirmed by `gate:pins` for the analyzer's dependency tree in phase 1). `NOTICE` added with the trademark note. |
| Workflow gates | One gate added (`manifest`), which the constitution already lists; registry, CI job, README row and plants follow 001's contract. |

## Decisions the operator should see at the plan gate

1. **Entry points** (R-02): `@ocelle/elements`, `@ocelle/elements/ocelle-icon.js`,
   `@ocelle/elements/ocelle-brand-mark.js`, `@ocelle/elements/browser.js` (the browser build), and
   `@ocelle/elements/custom-elements.json`. Public surface.
2. **No decorators** (R-01): elements use `static properties`; later missions follow.
3. **Manifest generator** (R-06): `@custom-elements-manifest/analyzer` 0.11.0 plus our normalising script; the gate
   compares against a regeneration. The analyzer parses with its own TypeScript ~5.4.
4. **Slot convention mechanism** (R-10): `!important` in the control's `::slotted()` rules, so a slotted icon's size
   cannot be changed by the page except through `--ocelle-icon-size` (measured); first-line centring by a
   zero-width-space strut, empty slots by margins rather than `gap`. The shared rules are an internal module that #7
   and #12 import; it is not an entry point.
5. **`token-only` allows `scale`** (R-03, R-08): for `scale: -1 1` mirroring.
6. **Host `aria-label` wins over `label`** (FR-034, from the spec fix): R-13's spike also checks whether Chromium
   trims a host `aria-label`; if it does not, phase 2 stops for an operator fork on US1-18.
7. **Mutation routing** (R-12): element source runs under an elements-only Stryker config; a mixed config made Stryker
   run the whole suite for every mutant (612 tests per mutant, measured).
8. **Pixel tolerance for mirroring** (R-08): per channel ≤ 8/255 for "equal", > 5 % of pixels differing by > 64 for
   "differs", at 4× (80 px).
9. **Brand mark spot** stays `--ocelle-color-accent` (#C68A1E) on the chrome (FR-025), as the spec records.

## Project Structure

### Documentation (this feature)

```text
specs/005-icons-brand-mark/
├── spec.md, plan.md, research.md, data-model.md, quickstart.md
├── contracts/elements-package.md, contracts/checks.md
├── sources/ (reference material, not shipped)
├── checklists/requirements.md
└── reviews/ (spec checks; plan squad rounds; phase reviews)
```

### Source Code (repository root)

```text
packages/elements/
├── package.json            # lit 3.3.3; analyzer (dev); exports; files; customElements; build, manifest scripts
├── vite.browser.config.ts  # browser build (R-05)
├── custom-elements-manifest.config.mjs
├── custom-elements.json    # generated, committed
├── scripts/manifest.ts     # generate + normalise (R-06)
├── licenses/lit-BSD-3-Clause.txt
├── README.md, CHANGELOG.md
├── src/
│   ├── index.ts            # defines and exports both elements
│   ├── browser.ts          # browser build entry
│   ├── define.ts           # guarded registration (internal)
│   ├── naming.ts           # label / aria-label / internals (internal)
│   ├── icons.ts            # the thirteen drawings + IconName (internal module, type exported via ocelle-icon)
│   ├── icon-slot.ts        # iconSlotStyles (internal)
│   ├── rosette.ts          # the mark's drawing (internal)
│   ├── ocelle-icon.ts
│   └── ocelle-brand-mark.ts
└── test/
    ├── *.test.ts           # elements project (browser mode, mutated)
    ├── fixtures/test-host.ts
    ├── node/*.test.ts      # elements-node project
    └── browser/            # elements-browser project: global-setup.ts, serve.ts, fixtures/*.html|*.js|*.css, *.test.ts
gates/
├── bin/manifest.ts, bin/mutation.ts (split by config)
├── stylelint/token-only.ts (scale)
├── plants/manifest/**, plants/style-lint/{pass-scale-mirror,fail-scale-length}, plants/mutation/pass-element-source
├── gates.json, lib/registry.ts, README.md
└── test/ (manifest, mutation split, token-only, vitest-config, token-gates counts)
stryker.elements.config.json, vitest.mutation.elements.config.ts, vitest.config.ts (projects, commands), vitest.mutation.config.ts
packages/tokens/contrast/pairs.json (13 rows)
storybook/package.json (+ @ocelle/elements), storybook/stories/{icon,brand-mark}.stories.ts
NOTICE (new), THIRD_PARTY_NOTICES (Lit), .github/workflows/ci.yml (manifest job), .gitignore (packed copies)
```

**Structure Decision**: everything for elements lives in `packages/elements`; the gate, lint and mutation changes in
`gates/` and the root configs, as 001 to 003 did.

## Phases (user stories) for `/speckit-tasks`

1. **Setup** (no behaviour unless named):
   - not exempt: `gates/test/vitest-config.test.ts` first (red): the projects `elements-node` and `elements-browser`,
     the `elements` project's exclusions of `test/node/**` and `test/browser/**`, `elements-browser` in the mutation
     exclusions; then `vitest.config.ts` and `vitest.mutation.config.ts` (R-11);
   - exempt: `lit` and analyzer pins in `packages/elements/package.json` and the lockfile, checked by `gate:pins`
     (and the analyzer's tree has no install script); `.gitignore` for packed copies.
2. **US1 Conventions and `ocelle-icon`** (P1):
   - **spike** (recorded in `reviews/phase-2/spike.md`): the analyzer on a scratch element (R-06 risk); the `axTree`
     command reading an element with an `id` hidden through internals and named as `img`, and a host
     `aria-label=" Close "` (R-13); the browser build under the strict CSP with zero violations;
   - the browser commands `axTree` and `emulateForcedColors` in the `elements` project, with a unit test each;
   - `define.ts`, `naming.ts`, `ocelle-icon.ts` with one icon (`close`) and the `icons.ts` structure, tests first:
     US1 scenarios 2 to 9, 11, 14, 16, 18 in-process; `index.ts`, `browser.ts`;
   - the module and browser builds (`vite.browser.config.ts`, `build` script) and `test/node/build.test.ts` (US1-17,
     FR-001, FR-016);
   - the fixture harness (`test/browser/global-setup.ts`, `serve.ts`, the CSP and request recorders) and fixture
     tests for US1 scenarios 1, 10 and 15 with their pairing plants;
   - the manifest: `scripts/manifest.ts` with `test/node/manifest.test.ts`, the committed manifest, and the
     `manifest` gate with unit tests, its plants, registry, CI job and README row (US1-11, US1-12);
   - the mutation split (R-12) with its unit tests and pass plant, red first;
   - the `ocelle-icon` story (close, labelled, unknown name) and the README's conventions section, the CHANGELOG
     entry, and the readme test's US1 statements (SC-008), red first;
   - `test/sample.test.ts` replaced (FR-032).
3. **US2 Icon set** (P2): the other twelve drawings in `icons.ts`; tests first for US2 scenarios 1 to 4 (data rules,
   painted area, distinct drawings, mirroring by pixels with the "mirror every icon" plant) and the manifest union
   (US2-1); the `token-only` `scale` change with its unit test and plants (R-03), before the mirroring rule; the
   story grid of all thirteen; the README icon table with consumer needs and the licence sentence (US2-5, exempt
   part stated); manifest regenerated.
4. **US3 Slot convention** (P3): `icon-slot.ts` and `test/fixtures/test-host.ts`; in-process tests for US3 scenarios
   1 to 10 with and without `base.css` (adopted from `packages/styles/src/base.css`), each "does not" with its pair
   and plant (empty slot gap, host rule loses); the test-host bundle in the fixture setup and fixture tests for US3
   scenarios 1, 2, 6 and 9 on the built files; the README slot-convention and naming sections (SC-007), red first.
5. **US4 Brand mark** (P4): `rosette.ts` and `ocelle-brand-mark.ts`; tests first for US4 scenarios 1 to 3, 5 to 9,
   13, 14 in-process, fixture tests for the Independent Test and SC-001; the 13 contrast rows in `pairs.json` with the
   token-gates count test changed first, and `test/node/brand-pairs.test.ts` with its plant (US4-4); manifest
   regenerated (US4-12); the brand-mark stories (US4-11); `NOTICE`, the README mark and trademark sections, the Lit
   entry in `THIRD_PARTY_NOTICES` with `licenses/lit-BSD-3-Clause.txt`, `files` and `test/node/pack.test.ts`
   (FR-029, FR-030), and the CHANGELOG's final surface list (FR-031).

Each phase is folded after its approval (`/ocelle-run` step 4.3). Element source changes of each phase are
mutation-tested by the gate with the phase base.

## Complexity Tracking

| Exception | Scope | Rationale | Sunset |
|---|---|---|---|
| No visual baselines and no axe run for the new `ocelle-icon` and `ocelle-brand-mark` stories (constitution III, V) | the stories of this feature | 001's recorded exception "Storybook build, visual regression and axe gates absent" applies; #10 adds both (spec FR-019) | the merge of #10 |
| Mutation of element behaviour proven only through in-process tests; the fixture suites on the built files are not mutated | `packages/elements/test/browser/**` | Stryker instruments only modules a test imports in-process; the built files are covered by the in-process tests of the same source and by the build test (R-11, R-12) | none (structural, as `styles-browser` in 003) |

002's Storybook exceptions 1 and 2 apply unchanged to the new stories.
