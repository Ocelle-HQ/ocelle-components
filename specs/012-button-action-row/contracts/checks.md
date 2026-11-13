# Contract: tests and checks for 012

No new gate. The existing gates take the new elements and tokens; the test harness gains interaction, AX-state,
reduced-motion and axe support.

## Test harness (phase 1, red first)

| File | Change |
|---|---|
| `packages/elements/test/scenarios/driver.ts` | `Driver` gains `focus`, `press(key, modifiers?)`, `click(id, { inner?, modifiers?, button? })` (always `force: true`, R-06), `tabOrder()`, `activeInner(id)`, `events(id, types)` / `takeEvents()` (bubble-phase recorder on element, ancestors, `document`, `window`: type, bubbles, composed, cancelable, defaultPrevented, detail), `preventNext(type)`, `reducedMotion(mode)`, `axe(scope?)`; `ax(id)` returns role, name, description, disabled, expanded, busy, focusable and `controls` (ids); `current(id)` reads the inner control's `aria-current` (CDP does not report it, measured) |
| `packages/elements/test/commands.ts`, `test/in-process.ts`, `test/browser/driver.ts` | the commands and both drivers for the methods above; in-process `axe` imports `axe-core`; the fixture serves `axe.min.js` from `node_modules/axe-core` same-origin under the strict CSP |
| `packages/elements/test/browser/serve.ts`, `fixtures/*.html` | new pages `button.html`, `action-row.html`, `link-target.html` (records visits), `axe.js` served; `context.on("page")` records new tabs |
| `vitest.config.ts` | `elements` project commands gain `press`, `emulateReducedMotion`, `axe` (Vitest browser commands) |
| `packages/elements/test/harness/*.test.ts` | unit tests of each new driver method on plain test pages (a native button and link), in both harnesses; each "does not" result paired with a positive one |
| root `package.json`, lockfile | `axe-core` 4.14.0 (devDependency, exact; the version #10 pins; release age satisfied) |

Navigation is observable only on the fixture harness; in-process link scenarios assert the click's
`defaultPrevented` instead (R-11).

## Package tests (`@ocelle/elements`)

| File | Project | Proves |
|---|---|---|
| `test/scenarios/button.ts`, `link.ts`, `busy.ts`, `action-row.ts`, `row-states.ts` | (shared bodies) | every acceptance scenario of US1 to US5 once, with expected values written by hand (colours from `packages/tokens/test/expected.ts`) |
| `test/button.test.ts`, `test/action-row.test.ts` | `elements` (browser mode, mutated) | the scenario bodies in-process on source, light and dark, forced colours, reduced motion, `dir="rtl"`; axe after each scenario page (no serious, critical or incomplete serious/critical result) |
| `test/browser/button.test.ts`, `test/browser/action-row.test.ts` | `elements-browser` | the same bodies on the built browser build under the strict CSP with zero violations, allowed requests only, no console message; navigation, new-tab and modifier-click scenarios |
| `test/control.test.ts` | `elements` | the internal module: mode decision table (empty, whitespace, `javascript:`, `JavaScript:`, relative), attribute move and clearing, reference resolution (document, shadow root, missing ids, order), name order, guard |
| `test/entry-button.test.ts`, `test/entry-action-row.test.ts` | `elements` | each module defines only its tag; `entry-root.test.ts` and `exports.test.ts` extended |
| `test/build/build.test.ts`, `test/build/pack.test.ts`, `test/node/manifest.test.ts`, `test/node/readme.test.ts` | as before | the new files, imports, manifest entries, README sections (control conventions, the two elements, engines floor 135, moved-ARIA note, form note, context-menu note) and CHANGELOG lines |

Each "does not" assertion (no event, no click, no navigation, no new tab, no gap, no border, not moved) has a paired
positive assertion in the same scenario and a named plant in `reviews/phase-N/plants.md`, run once to show the test
fails when the behaviour is removed (mission 005 practice).

## Tokens tests (`@ocelle/tokens`)

`test/expected.ts` (hand-written entries for `color-hover-border` and `motion-spin`, and `motion-spin` 0 ms under
reduced motion), `test/browser/values.test.ts`, the README and CHANGELOG tests; `contrast/pairs.json` gains the rows
of research.md R-08 with figures from `gate:contrast --print`; the pinned contrast counts in
`gates/test/contrast-pairs.test.ts`, `gates/test/contrast.test.ts`,
`gates/test/integration/plants-robustness.test.ts` and `gates/test/integration/token-gates.test.ts` change first.

## Story test (operator decision I3)

`storybook/test/integration/elements-stories.test.ts` is extended **in each phase's red commit** with that phase's
story ids, each present in the built Storybook and rendering its elements in light and dark; the story files follow
in the green commit. No CSP-violation assertion is added for the new stories (006 removes them).

## Gates touched

| Gate | Effect |
|---|---|
| `manifest` | two new elements in `custom-elements.json` (regenerated, committed) |
| `style-lint` | new element CSS, tokens only; no new allowance planned (a needed one stops the phase and goes to the squad) |
| `contrast` | new rows (R-08) |
| `csp`, `prefix` | new built files and stories |
| `pins` | `axe-core` 4.14.0 exact |
| `mutation` | `src/control.ts`, `src/spinner.ts`, `src/ocelle-button.ts`, `src/ocelle-action-row.ts` under `stryker.elements.config.json`; token source under the default config; 007 verdicts (Timeout and CompileError reported, pass) |
| `test-lint` | all new tests |

## With #10 (phase 7; recheck when #10 lands)

`storybook/baselines/elements-ocelle-button--*.{light,dark}.png` and `elements-ocelle-action-row--*`, produced in the
pinned container; the axe gate on every new story; the story counts in `storybook-build`, `visual`, `axe` and
`plant-repo` integration tests; `fail-token-changed` and `fail-empty-index` plants extended; `shardSize` lowered in
`gates/lib/plant-runner.ts`, test-first, with a CI run showing every Plants shard under 10 minutes (006's Complexity
Tracking condition at 25 stories).

## Mutation scope

As mission 005 decision 16: changed source is `packages/elements/src/**` (in-process, elements config) and
`packages/tokens/src/**` (default config). Test code, fixture suites, build and pack tests and stories are not source.
