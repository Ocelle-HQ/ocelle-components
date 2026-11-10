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
`ocelle-brand-mark`, the rosette on main grounds, on the chrome and in one colour. The new `manifest` gate, three
exact-value `token-only` allowances (`scale: -1`/`1`, `aspect-ratio: 1`, `1lh`; not reopened by `calc()`), element-only Stryker routing, thirteen
contrast rows, version-exact install-script approvals for `rs-module-lexer` and `fsevents` and the records (README,
CHANGELOG, NOTICE, Lit notice and banner) complete it. Plan squad round 1 changed the design in the places its
findings named (`reviews/plan/round-1/fixes-1.md`), and round 2 likewise (`reviews/plan/round-2/fixes-1.md`: the
`hidden` attribute, the slot row's block padding, the mark's `max-content` width, the `@ocelle/tokens` peer
dependency and the engine floor), and round 3 (`reviews/plan/round-3/fixes-1.md`: the slotted icons' token pin,
the mark's percentage sizes, `calc()` no longer reopening the lint allowances, the README as the one engine list).
Every decision is in [research.md](research.md); the surface is in
[contracts/elements-package.md](contracts/elements-package.md) and the checks in [contracts/checks.md](contracts/checks.md).

## Technical Context

**Language/Version**: TypeScript 6.0.3 (strict, `erasableSyntaxOnly`), Node 26.13.0 in CI (22.23.4 in this container).

**Primary Dependencies**: `lit` 3.3.3 (runtime, exact; R-01); `@ocelle/tokens` `workspace:0.0.0` as a peer
dependency, as `@ocelle/styles` declares it (R-15). Dev: `@custom-elements-manifest/analyzer` 0.11.0, a
root devDependency like every gate tool (R-06; its tree brings `rs-module-lexer` 2.9.0 and `fsevents` 2.3.3, whose
install scripts are approved by exact version, R-16); already pinned: Vite 8.3.5 (browser build, test bundles; R-05), Vitest 5.0.5 with `@vitest/browser-playwright`,
Playwright 1.64.1, Stryker 10.1.1, Stylelint 17.16.0 with `postcss-lit`, Storybook 10.6.5 (`@storybook/html-vite`).

**Storage**: N/A.

**Testing**: shared scenario bodies run by two harnesses (R-11): Vitest project `elements` (browser mode, in-process
from source, mutated under its own Stryker configuration; two browser commands, `axTree` and `emulateForcedColors`)
and `elements-browser` (Node + Playwright on strict-CSP fixture pages serving the built browser build, with CSP,
request and console recorders; not mutated). Node projects `elements-node` (manifest, pairing, README, Vite config;
mutated under the default configuration) and `elements-build` (build and pack tests that start tools; not mutated).
Mutation of element source under an elements-only Stryker configuration (R-12).

**Target Platform**: evergreen Chromium measured; WebKit (Kitty Desktop) unmeasured, an open limitation in the README.
Engine floor: Chromium 120+ (`:dir()`) and WebKit 16.4+ (`:dir()`, Media Queries 4 `not (…)`, constructable
stylesheets), the newest feature the elements use, stated in the README with the feature behind each figure (R-05).

**Project Type**: library (web components) in a pnpm workspace.

**Performance Goals**: 500 icons on a page share one adopted stylesheet per element class (US1-14).

**Constraints**: strict CSP (`default-src 'none'; script-src 'self'; style-src 'self'`) with no exception for the
elements; fixture pages add only `font-src 'self'` for the tokens' vendored font, as the spec's fixture defines; no
network request; token-only styles; no `sk-` names or monospace; one heavy job at a time in this container.

**Scale/Scope**: 2 elements, 13 icons, 1 internal slot stylesheet, 1 new gate, 13 contrast rows, 1 approved install
script.

## Constitution Check

*Gate: passes before Phase 0; re-checked after Phase 1 design and again after plan squad rounds 1 and 2 — passes,
with the exceptions in Complexity Tracking.*

| Principle | How this plan meets it |
|---|---|
| I. `ocelle-` names, no I/O, small interface, manifest | Tags `ocelle-icon`, `ocelle-brand-mark`; the test host is `ocelle-test-host` and ships nowhere. No events (nothing to emit). No I/O: drawings are inline templates, no `fetch`, no `<use href>`, no `<image>` (R-04). Interface: `name`, `label`; `ground`, `tone`, `label`. The manifest declares every property and attribute with its tag name (JSDoc `@tagname`) and default (`@default`), drops the observed `aria-label`, and states empty slots, events, parts and CSS properties; tokens read are documented, not declared (FR-007, R-02, R-06). The new `manifest` gate enforces it (R-06). |
| II. Tokens only, brand rules | All element CSS is in `css` templates linted by `ocelle/token-only`. Three exact-value allowances, each with unit tests and pass and fail plants (R-03): `scale` only `-1` and `1` (mirroring, R-08), `aspect-ratio` only `1` (the mark's square box, R-09) and the unit `lh` only as `1lh`, on its own and inside `calc()` only as a `+`/`-` operand, once per expression, beside an `--ocelle-*` token (the slot wrapper's one line box and the row's block padding, `calc((var(--ocelle-icon-size) - 1lh) / 2)`, R-10); `calc()` does not reopen them: any function in a `scale` or `aspect-ratio` value is raw (decided, PLAN-FRESH-3-002 (a), plants `fail-scale-calc`, `fail-aspect-calc`, `fail-lh-calc-factor`, `fail-lh-calc-twice`). None is a size literal (a flip, "as wide as high", the inherited line height), and every other value stays a finding; the one spelling the lint still admits, a factor on a parenthesised `calc()` group holding `1lh` beside a token (the padding rule's own `/ 2`), is named in R-03 and left to review. Colours: `currentColor`, `color-ink`, `color-chrome-ink`, `color-accent`; no new token. The mark's light-ground ochre spot is not text and not a state, so "ochre text never on bone" and "ochre fill never the only state mark" do not apply (spec Assumptions); `tone="mono"` exists for hosts that need every part at 3:1. No monospace. |
| III. Accessible by construction | Decorative by default with the host itself hidden through `ElementInternals` (a host with an `id` is otherwise an empty `generic` node, spec check 2); labelled elements are one `img` node; a present host `aria-label` decides naming alone (a blank one leaves the element unlabelled), hosts pass it trimmed because Chromium keeps its spaces (measured), and host `aria-hidden="true"` hides (FR-034, R-13); a host `hidden` removes the box and every node, because each element's styles hold `:host([hidden]) { display: none; }` (its `:host` display rule would otherwise beat the user-agent rule; US1-19, US4-15, R-04). No ID reference crosses a shadow root (none used). Forced colours: `currentColor` everywhere; the mark's variant rules sit inside `@media not (forced-colors: active)`, so its forced-colours rules reach every variant (measured on all variants, both palettes, R-09); tested in text, a link, a button and a disabled button, since `ButtonText` equals `CanvasText` in Chromium (R-09). The slot convention adds nothing to a control's name (no generated content; US3-11). Contrast: 13 new non-text rows plus a pairing test tied to the shipped stylesheet (R-09). The accessibility tree is read from Chromium's full AX tree in both harnesses (R-11). Axe is not run on the new stories: see Complexity Tracking. |
| IV. Strict CSP, offline | Adopted stylesheets only; no `style` attribute or `<style>` in templates (presentation attributes on SVG shapes are not `style`). The engine floor is Chromium 120+ and WebKit 16.4+, the newest feature used (`:dir()`; constructable stylesheets need only Chromium 73), where Lit's `<style>` fallback is unreachable (R-05, README). The browser build passes the `csp` gate with Lit inside (measured, R-05) and loads with one `<script type="module" src>` and no import map. Every browser scenario of the spec also runs on fixture pages served under the strict header plus `font-src 'self'` for `tokens.css`'s font, with a violation collector installed by `addInitScript` (no page script, no request), a request recorder and a console recorder, asserting zero violations, only the allowed requests and no console message together with the positive outcome (R-11). |
| V. Storybook, behaviour tests | One story per icon and per mark variant and state, light and dark (R-14). No events exist, so no event assertions; no keyboard model (neither element is focusable). Baselines: see Complexity Tracking. |
| VI. Consumer-driven, own code | Needs from spec-kitty-design #496 and #504, kitty-mission-ui's Projects and Artifact Viewer screens, #7, #12 to #16. Drawings are our own (operator decision); the mark is Ocelle's own reference, redrawn onto tokens. Nothing copied from Spec Kitty. |
| VII. Semver | All additions (MINOR): two elements, thirteen icon names, entry points, the browser build's file path in the tarball (`dist/browser/ocelle-elements.js`, which hosts without a bundler serve by path), the manifest. The `@ocelle/elements` CHANGELOG names them (FR-031). |
| VIII. Test-first, non-vacuous | Each phase starts red; "does not" outcomes are paired with positive ones and each pairing has a named plant (spec table). Element source is mutation-tested under the elements-only Stryker config (measured working, R-12); Stryker runs the in-process tests only, so every scenario body is shared by the in-process and the fixture harness (R-11). The drawing data is plain data checked against an independent expected table, never `as const` (R-07); `define`'s guard and each entry point's registrations have in-process tests (R-02); the Vite config and the manifest script have in-process node tests (R-05, R-12). The mirroring "equal" rule is a count rule measured before the red step (R-08). New gate code (`manifest.ts`, the mutation split, the lint changes, the pins rule, the plant-repo set) is mutation-tested with its unit tests, and the gates have fail, pass and breaking plants, including element-source survivor, NoCoverage and mixed plants for the split (R-12). Documentation-only items take the exemption with the reason stated. |
| Licence and supply chain | Lit (BSD-3-Clause) is bundled into the browser build: entry in `THIRD_PARTY_NOTICES` with the licence text beside it (operator decision SPEC-2-02), and a licence banner at the top of the file that the build test asserts (operator decision, PLAN-A11Y-SECURITY-1-008, R-05). New pins exact, release age respected. **Install scripts** (operator decision, PLAN-A11Y-SECURITY-1-005 (c), scope confirmed after verify 1, R-16): the analyzer's tree holds `rs-module-lexer` 2.9.0 with a `postinstall` and `fsevents` 2.3.3 (macOS only, also Vite's optional dependency) with `install: node-gyp rebuild`; both are approved by exact version (`allowBuilds: "rs-module-lexer@2.9.0": true, "fsevents@2.3.3": true`), the `pins` gate admits exactly those two entries and still rejects any other `true` entry, with plants, and 001's R-04 record gets an amendment note; the residual risks (a fetch outside the lockfile on a platform without a lexer binding; a native compile that may fetch Node headers on macOS, unverified here for lack of a macOS runner) are in the README's `pins` row. This touches no constitution rule: the constitution requires exact pins and a committed lockfile, which still hold; the empty allow-list was 001's policy (FR-027, R-04), which the operator amends for these two entries. So it needs no Complexity Tracking row. `NOTICE` added with the trademark note. |
| Workflow gates | One gate added (`manifest`), which the constitution already lists; registry, CI job, README row and plants follow 001's contract. The "Custom-elements manifest" check blocks merges only once the operator adds it to the ruleset on `main` (operator ruleset change, as 002's contrast and brand-rules checks); `gates/README.md` § Required checks and the `gates/lib/registry.ts` comment go from fourteen to fifteen checks (R-06). |

## Decisions the operator should see at the plan gate

Items marked "decided" were operator fork decisions at plan squad round 1 (`reviews/plan/round-1/refute.md`).

1. **Entry points** (R-02): `@ocelle/elements`, `@ocelle/elements/ocelle-icon.js`,
   `@ocelle/elements/ocelle-brand-mark.js`, `@ocelle/elements/browser.js` (the browser build), and
   `@ocelle/elements/custom-elements.json`; and the browser build's tarball path `dist/browser/ocelle-elements.js`,
   which hosts without a bundler copy. Public surface.
2. **No decorators** (R-01): elements use `static properties`; later missions follow. Each class carries `@tagname`
   and each property `@default` JSDoc tags, which the manifest needs (R-02, R-06).
3. **Manifest generator** (R-06): `@custom-elements-manifest/analyzer` 0.11.0, a root devDependency, plus our
   normalising script; the gate compares against a regeneration. The analyzer parses with its own TypeScript 5.4.5
   and brings 82 packages, a native `rs-module-lexer` and `fsevents` among them.
4. **Install-script approval** (decided, PLAN-A11Y-SECURITY-1-005 (c), scope confirmed after verify 1 as both
   packages; R-16): `rs-module-lexer@2.9.0` may run its `postinstall` (which only checks its native binding on the
   platforms this repository runs on) and `fsevents@2.3.3` its `install` (`node-gyp rebuild`, run only on macOS,
   where pnpm installs it). This changes the supply-chain policy for exactly those packages and versions:
   `pnpm-workspace.yaml` `allowBuilds`, the `pins` gate's `allow-builds` rule (an approved list of two), its plants,
   and an amendment note in 001's R-04. No constitution rule is touched.
5. **Slot convention mechanism** (decided, PLAN-CORRECTNESS-1-004 (a); R-10): `!important` in the control's
   `::slotted()` rules, so a slotted icon's size cannot be changed by the page except through `--ocelle-icon-size`
   (measured), with `--ocelle-icon-size: inherit !important` on the slotted element so the token set on a slotted
   icon itself cannot resize it past the row's padding (PLAN-FRESH-3-001, measured); first-line centring by a wrapper of `block-size: 1lh` with the icon centred in it (no strut, so no
   character in the control's name), empty slots by margins rather than `gap`; the row (`icon-row`) has block
   padding `calc((var(--ocelle-icon-size) - 1lh) / 2)`, clamped to 0, so an icon taller than the line stays inside
   the control's box (decided, PLAN-FRESH-2-002 (a), measured). The shared rules are an internal
   module that #7 and #12 import; it is not an entry point.
6. **`token-only` allowances** (R-03): `scale` only `-1`/`1` (decided, PLAN-TESTABILITY-1-011 (a)), `aspect-ratio`
   only `1` (from PLAN-FRESH-1-006 (a)) and `1lh`, on its own and inside `calc()` as one `+`/`-` operand beside a
   token (from PLAN-CORRECTNESS-1-004 (a) and PLAN-FRESH-2-002 (a)), each with plants; `calc()` does not reopen
   them (decided, PLAN-FRESH-3-002 (a)).
7. **Host `aria-label`** (decided, PLAN-A11Y-SECURITY-1-002 (a) and 1-003 (a); FR-034, R-13): a present host
   `aria-label` decides naming alone, a blank one leaves the element unlabelled even with `label`, and hosts pass it
   trimmed because Chromium keeps its spaces (measured); the element never rewrites it. The spike no longer decides
   this, and phase 2 has no conditional stop.
8. **Mutation routing** (R-12): element source runs under an elements-only Stryker config; a mixed config made Stryker
   run the whole suite for every mutant (612 tests per mutant, measured). The default config drops `elements`,
   `elements-build` and `elements-browser`.
9. **Fixture runs of every scenario** (decided, PLAN-CORRECTNESS-1-002 (a); R-11): every browser scenario runs on the
   strict-CSP fixture with the browser build as well as in-process, through shared scenario bodies; US1-8's console
   check and US1-14's request half run on the fixture.
10. **Drawings under mutation** (decided, PLAN-TESTABILITY-1-005 (a); R-07): an independent expected table per icon in
    the tests, no `as const`, `IconName` an explicit union checked by the type checker against the table's keys.
11. **Pixel rule for mirroring** (R-08): "equal" is at most 1 % of pixels over 32/255 and none over 96/255, measured on
    all thirteen drawings before phase 3's red commit; "differs" is more than 5 % of pixels over 64/255; at 4× (80 px)
    in boxes at whole-pixel coordinates.
12. **Brand mark** (R-09): the spot stays `--ocelle-color-accent` (#C68A1E) on the chrome (FR-025), as the spec
    records; the drawing uses the rosette's own coordinates in `viewBox="4 4 92 92"`, chosen from its painted extent so
    it fills its box as the icons do (decided, PLAN-CORRECTNESS-1-011 (a)); its width follows its height (decided,
    PLAN-FRESH-1-006 (a)), through `inline-size: max-content` so a column flex container does not stretch it
    (PLAN-FRESH-2-003); a host percentage height needs a container of definite height, else the mark falls back to
    the SVG default size, documented and tested with a 48 px bar (PLAN-FRESH-3-003); variant rules inside `@media not (forced-colors: active)`.
13. **Licence banner** on the browser build (decided, PLAN-A11Y-SECURITY-1-008 (a); R-05).
14. **Required check**: the operator adds "Custom-elements manifest" to the ruleset on `main` (R-06).
15. **Tokens and engines** (PLAN-FRESH-2-004, 2-005; R-05, R-15): `@ocelle/elements` declares `@ocelle/tokens` as a
    peer dependency and its README says to link `tokens.css` first; the stated engine floor is Chromium 120+ and
    WebKit 16.4+; the README's engines section is the one list of the floor features (PLAN-FRESH-3-004).

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
├── package.json            # lit 3.3.3; @ocelle/tokens peer; exports; files; customElements; build, manifest scripts
├── vite.browser.config.ts  # browser build with licence banner (R-05)
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
    ├── *.test.ts           # elements project (browser mode, mutated): scenario runs, define, entry-icon, entry-root
    ├── scenarios/*.ts      # shared scenario bodies and the driver interface (R-11)
    ├── icons-expected.ts   # the independent expected drawing table (R-07)
    ├── fixtures/test-host.ts
    ├── node/*.test.ts      # elements-node: manifest, brand-pairs, readme, vite-config (mutated)
    ├── build/*.test.ts     # elements-build: build, pack (start tools; not mutated)
    └── browser/            # elements-browser: global-setup.ts, serve.ts, fixtures/*.html, *.test.ts
gates/
├── bin/manifest.ts, bin/mutation.ts (split by config)
├── stylelint/token-only.ts (scale -1/1, aspect-ratio 1, whole value; 1lh alone and once as a +/- operand in calc())
├── lib/pins-rules.ts (approved build list), lib/plant-repo.ts (configuration set, package node_modules)
├── plants/manifest/**, plants/style-lint/{pass-scale-mirror,fail-scale-factor,fail-scale-length,fail-scale-calc,
│   pass-aspect-square,fail-aspect-ratio-other,fail-aspect-calc,pass-one-line,pass-one-line-calc,fail-lh-multiple,
│   fail-lh-multiple-calc,fail-lh-calc-factor,fail-lh-calc-twice},
│   plants/mutation/{pass-element-source,
│   fail-element-source-survivor,fail-element-source-no-coverage,fail-mixed-survivors},
│   plants/pins/{pass-approved-build,fail-allow-builds-unpinned-approval,fail-allow-builds-other-version}
├── gates.json, lib/registry.ts (comment: fifteen checks), README.md (manifest row, fifteen required checks, pins row)
└── test/ (manifest, mutation split, token-only, pins, plant-repo, vitest-config, the five pinned contrast counts)
package.json (+ analyzer devDependency), pnpm-workspace.yaml (allowBuilds approval), pnpm-lock.yaml
stryker.elements.config.json, vitest.mutation.elements.config.ts, vitest.config.ts (projects, commands), vitest.mutation.config.ts
packages/tokens/contrast/pairs.json (13 rows)
storybook/package.json (+ @ocelle/elements), storybook/stories/{icon,brand-mark}.stories.ts
NOTICE (new), THIRD_PARTY_NOTICES (Lit), .github/workflows/ci.yml (manifest job), .gitignore (packed copies)
specs/001-repository-foundation/research.md (R-04 amendment note citing 005 R-16)
```

**Structure Decision**: everything for elements lives in `packages/elements`; the gate, lint, pins, plant and mutation
changes in `gates/` and the root configs, as 001 to 003 did.

## Phases (user stories) for `/speckit-tasks`

1. **Setup** (no behaviour unless named):
   - not exempt: `gates/test/vitest-config.test.ts` first (red): the projects `elements-node`, `elements-build` and
     `elements-browser` and their includes, the `elements` project's exclusion of `test/node/**`, `test/build/**` and
     `test/browser/**`, and `elements`, `elements-build` and `elements-browser` in the default mutation config's
     exclusions; then `vitest.config.ts` and `vitest.mutation.config.ts` (R-11, R-12);
   - not exempt: the install-script approval (R-16), tests first: `gates/test/pins-rules.test.ts` and
     `gates/test/pins.test.ts` (the two approved entries pass; `rs-module-lexer: true`, `fsevents: true`, another
     version and other `true` entries fail), then `gates/lib/pins-rules.ts`, the four pins plants,
     `pnpm-workspace.yaml`'s entries and comment, the `gates/README.md` pins row, and the amendment note in
     `specs/001-repository-foundation/research.md` R-04;
   - not exempt: the plant-repository change (R-12), tests first: `gates/test/plant-repo.test.ts` and the
     gates-integration plant-repo test (the two elements configs in the set and in `configurationName`, the element
     files in the set, each package's `node_modules` linked), then `gates/lib/plant-repo.ts`;
   - exempt: the `lit` pin in `packages/elements/package.json`, the analyzer pin in the root `package.json`, and the
     lockfile, checked by `gate:pins`; then the verification of R-16 (binding loads, no `npm install` by the script,
     `fsevents` absent, `setup:offline` succeeds) in this container, recorded in `reviews/phase-1/`; `.gitignore` for packed copies.
2. **US1 Conventions and `ocelle-icon`** (P1):
   - **spike** (recorded in `reviews/phase-2/spike.md`): the analyzer on a scratch element written exactly as the
     elements will be (the real `define` helper, `static properties`, `declare` fields, `observedAttributes` with
     `aria-label`, `@tagname` and `@default`), its API or CLI choice, and its schema version (R-06), in this container
     and on CI's Node; the `axTree` command reading an element with an `id` hidden through internals and named as
     `img` (R-13); the browser build under the strict CSP with zero violations;
   - the browser commands `axTree` and `emulateForcedColors` in the `elements` project, with a unit test each;
   - the driver interface and the in-process driver (`test/scenarios/`), and the fixture harness
     (`test/browser/global-setup.ts` building into a temporary directory with `tokens.css` from `css(source)`,
     `serve.ts`, the `addInitScript` violation collector, the request and console recorders, the control page)
     (R-11);
   - `define.ts`, `naming.ts`, `ocelle-icon.ts` with one icon (`close`) and the `icons.ts` structure, tests first:
     US1 scenarios 1 to 9, 14, 16, 18 and 19 as shared scenario bodies run by both harnesses (US1-19 with the plant
     "`:host([hidden])` rule removed"), `define.test.ts`,
     `entry-icon.test.ts` and `entry-root.test.ts` in-process (R-02); `index.ts`, `browser.ts`;
   - the module and browser builds (`vite.browser.config.ts` with the banner, `build` script),
     `test/node/vite-config.test.ts`, and `test/build/build.test.ts` (US1-17's import rules, FR-001, FR-002, FR-016,
     FR-029's banner);
   - fixture-only tests for US1 scenarios 10 and 15, US1-8's console check on the built file and US1-14's request
     half, with their pairing plants (US1-17 has no fixture case: its runtime half is the in-process entry tests, R-11);
   - the manifest: `scripts/manifest.ts` with `test/node/manifest.test.ts`, the committed manifest, and the
     `manifest` gate with unit tests, its plants, the gates-integration expectation that `pass-repository` exits 0 in
     a built plant tree, registry, CI job, README row and the fourteen-to-fifteen change (US1-11, US1-12);
   - the mutation split (R-12) with its unit tests and plants (`pass-element-source`, `fail-element-source-survivor`,
     `fail-element-source-no-coverage`, `fail-mixed-survivors`), red first;
   - the `ocelle-icon` story (close, labelled, unknown name) and the README's conventions section (with the `hidden`
     rule, the token rule and the engine-floor rule), its tokens section (link `tokens.css` first, and what an icon
     does without it) and engines section (Chromium 120+, WebKit 16.4+, the feature behind each figure), the
     `@ocelle/tokens` peer dependency in `package.json`, the CHANGELOG entry, and the readme test's US1 statements
     (SC-008), red first;
   - `test/sample.test.ts` replaced (FR-032).
3. **US2 Icon set** (P2): first, the measurement of R-08's "equal" rule on all thirteen drawings, recorded in
   `reviews/phase-3/spike.md` before the red commit; the other twelve drawings in `icons.ts`; tests first for US2
   scenarios 1 to 4 as shared bodies (data rules, painted area, distinct drawings, the expected-table test per icon,
   mirroring by pixels in whole-pixel 80 × 80 boxes with the "mirror every icon" plant) and the manifest union
   (US2-1); the `token-only` `scale` change (`-1` and `1` only) with its unit test and plants
   (`pass-scale-mirror`, `fail-scale-factor`, `fail-scale-length`, `fail-scale-calc`; R-03), before the mirroring rule; the story grid of
   all thirteen; the README icon table with consumer needs and the licence sentence (US2-5, exempt part stated);
   manifest regenerated.
4. **US3 Slot convention** (P3): the `token-only` `1lh` change, on its own and inside `calc()`, with its unit test
   and plants (`pass-one-line`, `pass-one-line-calc`, `fail-lh-multiple`, `fail-lh-multiple-calc`,
   `fail-lh-calc-factor`, `fail-lh-calc-twice`; R-03) first; `icon-slot.ts` and `test/fixtures/test-host.ts`; tests first for US3 scenarios 1
   to 6 and 8 to 11 as shared bodies with and without `base.css` (adopted from `packages/styles/src/base.css`
   in-process, linked on the fixture), US3-1 and US3-10 at the four type and size cases of R-10, centring and the
   icon inside the control's border box (plant: the `.icon-row` padding rule removed), each "does not" with its pair
   and plant (empty slot gap, host rule loses, the token pin removed for US3-9's token-on-the-slotted-icon case, the strut for centring, the strut without alt text for US3-11's name), the forced-colours case enabled and disabled (US3-8); the README slot-convention and naming
   sections (SC-007), red first.
5. **US4 Brand mark** (P4): the `token-only` `aspect-ratio: 1` change with its unit test and plants
   (`pass-aspect-square`, `fail-aspect-ratio-other`, `fail-aspect-calc`; R-03) first; `rosette.ts` and `ocelle-brand-mark.ts`; tests first
   for US4 scenarios 1 to 3, 5 to 9 and 13 to 15 as shared bodies, the Independent Test and SC-001 on the fixture, with
   US4-5's four contexts on all three variants and its two plants (the pre-round-1 sheet, `fill: CanvasText`) and
   US4-7's height-only host, column flex case (plant: `inline-size: auto`) and 48 px bar with `block-size: 100%`, US4-15 (plant: `:host([hidden])`
   removed); the 13 contrast rows in `pairs.json` with every pinned count changed first
   (`gates/test/contrast-pairs.test.ts`, `gates/test/contrast.test.ts`,
   `gates/test/integration/plants-robustness.test.ts`, `gates/test/integration/token-gates.test.ts` and the comment
   in `gates/bin/contrast.ts`: 160 light, 168 dark, 328 entries; R-09), and `test/node/brand-pairs.test.ts` with its
   plant (US4-4); manifest regenerated (US4-12); the brand-mark stories (US4-11); `NOTICE`, the README mark and
   trademark sections (with the mark's behaviour without `tokens.css`), the Lit entry in `THIRD_PARTY_NOTICES` with `licenses/lit-BSD-3-Clause.txt`, `files` and
   `test/build/pack.test.ts` (FR-029, FR-030), and the CHANGELOG's final surface list with the browser build's path
   (FR-031).

Each phase is folded after its approval (`/ocelle-run` step 4.3). Element source changes of each phase are
mutation-tested by the gate with the phase base.

## Complexity Tracking

| Exception | Scope | Rationale | Sunset |
|---|---|---|---|
| No visual baselines and no axe run for the new `ocelle-icon` and `ocelle-brand-mark` stories (constitution III, V) | the stories of this feature | 001's recorded exception "Storybook build, visual regression and axe gates absent" applies; #10 adds both (spec FR-019) | the merge of #10 |
| Mutation of element behaviour proven only through in-process tests; the fixture suites on the built files and the build and pack tests are not mutated | `packages/elements/test/browser/**`, `packages/elements/test/build/**` | Stryker instruments only modules a test imports in-process; every fixture scenario shares its body with an in-process run of the same source, and the build configuration is covered by an in-process import (R-05, R-11, R-12) | none (structural, as `styles-browser` in 003) |

002's Storybook exceptions 1 and 2 apply unchanged to the new stories. The install-script approval of R-16 is not an
exception to a constitution principle (see Constitution Check, Licence and supply chain) and so has no row here.
