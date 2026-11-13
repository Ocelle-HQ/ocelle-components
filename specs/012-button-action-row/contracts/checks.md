# Contract: tests and checks for 012

No new gate. The existing gates take the new elements and tokens; the test harness gains interaction, AX-state,
reduced-motion, navigation-sink and axe support.

## Test harness (phase 1, red first)

| File | Change |
|---|---|
| `packages/elements/test/scenarios/driver.ts` | `Driver` gains `focus`, `press(key, modifiers?)`, `click(id, { inner?, modifiers?, button? })` (always `force: true`, R-06), `hover(id, { inner? })`, `pointerDown(id, { inner? })`, `pointerUp(id)`, `tabOrder({ reverse? })` (Tab, or Shift+Tab), `activeInner(id)`, `events(id, types)` / `takeEvents()`, `preventNext(type)`, `navigations()`, `reducedMotion(mode)`, `axe(scope?)`; `computed(id, property, inner?)` reads a shadow element by selector when `inner` is given; `ax(id)` returns role, name, description, disabled, expanded, pressed, hasPopup, busy, focusable and `controls` (ids); `current(id)` reads the inner control's `aria-current` (CDP does not report it, measured) |
| event recorder | bubble-phase listeners on the element, its ancestors, `document` and `window`; each record: `type`, `at`, `target` (as seen at that listener), `isTrusted`, `bubbles`, `composed`, `cancelable`, `defaultPrevented`, `detail`, and a per-dispatch `serial` (R-11) |
| `packages/elements/test/in-process.ts` | the **navigation sink**: a last bubble-phase listener on `window` for `click` and `auxclick` that records `defaultPrevented`, `button`, the modifier flags and the link's `href`, then prevents, so the runner never navigates; `navigations()` returns its records (R-11) |
| `packages/elements/test/axe-rules.ts` | 006's rule selection, test-side: default rules plus `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`, `wcag22aa`, less `experimental` and the eight harness-document rules; replaced in phase 7 by the import from `gates/lib/axe-rules.ts` |
| `packages/elements/test/commands.ts`, `test/browser/driver.ts` | the commands and both drivers for the methods above; in-process `axe` imports `axe-core`; the fixture serves `axe.min.js` from `node_modules/axe-core` same-origin under the strict CSP |
| `packages/elements/test/browser/serve.ts`, `fixtures/*.html` | new pages `button.html`, `action-row.html`, `link-target.html` (records visits), `axe.js` served; `context.on("page")` records new tabs |
| `vitest.config.ts` | `elements` project commands gain `press`, `hover`, `pointer`, `emulateReducedMotion`, `axe` (Vitest browser commands) |
| `packages/elements/test/harness/*.test.ts` | unit tests of each new driver method on plain test pages (a native button and link), in both harnesses, each "does not" result paired with a positive one: hovered and unhovered, pressed and unpressed native buttons (`computed` with `inner`); Tab and Shift+Tab orders; two dispatches give two serials and one dispatch one serial with its target at each listener; the sink records a plain and a Ctrl-click with `defaultPrevented` false and a prevented one true; the axe module gives `button-name` for an unnamed button and no `region` on a landmark-less page |
| root `package.json`, lockfile | `axe-core` 4.14.0 (devDependency, exact; the version #10 pins; release age satisfied) |

Navigation itself is observable only on the fixture harness; in-process, the sink's records are the observable.

## Package tests (`@ocelle/elements`)

| File | Project | Proves |
|---|---|---|
| `test/scenarios/button.ts`, `link.ts`, `busy.ts`, `action-row.ts`, `row-states.ts` | (shared bodies) | every acceptance scenario of US1 to US5 once, and every row of § Edge cases and plan decisions, with expected values written by hand (colours from `packages/tokens/test/expected.ts`; forced colours from research R-12's table, read as `resolveColour(<keyword>)`) |
| link scenario bodies (US2-1, US2-3, US3-8, US5-1, US5-2, US5-6, decision 13) | two bodies each | an in-process body asserting the sink's record (prevented or not, button, modifiers, `href`), and a fixture body asserting real navigation and new tabs; no conditional expect |
| `test/button.test.ts`, `test/action-row.test.ts` | `elements` (browser mode, mutated) | the scenario bodies and the in-process link bodies on source, light and dark, forced colours, reduced motion, `dir="rtl"`; axe after each scenario page (no serious, critical or incomplete serious/critical result, except a scenario that expects one by name) |
| `test/browser/button.test.ts`, `test/browser/action-row.test.ts` | `elements-browser` | the same bodies on the built browser build under the strict CSP with zero violations, allowed requests only, no console message; the fixture link bodies (navigation, new tab, modifier clicks) |
| `test/control.test.ts` | `elements` | the internal module: the mode decision table (empty, whitespace, relative, `javascript:`, `JavaScript:`, `JAVASCRIPT:x`, `java\tscript:x`, `\u0001javascript:x`, ` javascript:x` → button; `http://[` → button, no error; `data:text/html,x` → link, `href` as written), the attribute move, clearing by empty, whitespace-only and off values, removal as a no-op, the custom states, reference resolution (document, shadow root, missing ids, order), the name order including the row's internal title reference (name exactly the title with description and tags slotted; plant: name from content), the guard in every non-available state (plant: "guard limited to unavailable"), `click()` forwarding |
| `test/slot.test.ts` | `elements` | a non-icon element in the default slot of a control that adopts `iconSlotStyles` keeps its own box (plant: the unscoped `::slotted(*)`) |
| `test/entry-button.test.ts`, `test/entry-action-row.test.ts` | `elements` | each module defines only its tag; `entry-root.test.ts` and `exports.test.ts` extended |
| `test/build/build.test.ts`, `test/build/pack.test.ts`, `test/node/manifest.test.ts`, `test/node/readme.test.ts` | as before | the new files, imports, manifest entries (every moved attribute declared with a description, `ground`, the custom states; 005's entries unchanged), README sections (control conventions, the two elements, engines floor Chromium 135 and WebKit 17.4, moved-ARIA note with the per-stack recipes, custom states, label-in-name rule, `data:`/`vbscript:` note, the spinner's 4.8 s, the flush-hover note, the synthetic-dispatch note, form note, 005's elements keep their `aria-label` rule) and CHANGELOG lines |
| `scripts/manifest.ts` tests (`test/node/manifest.test.ts`) | node | the normaliser keeps a standard attribute an element declares with a description and drops an undeclared one (R-15) |

Each "does not" assertion (no event, no click, no navigation, no new tab, no gap, no border, not moved, no `href`) has
a paired positive assertion in the same scenario and a named plant in `reviews/phase-N/plants.md`, run once to show
the test fails when the behaviour is removed (mission 005 practice).

## Edge cases and plan decisions

Each row is written in its phase's red commit, with a plant; a documentation-only row is proven by `readme.test.ts`.
"axe reports it" is asserted as an explicit expected violation.

| Item | Phase | Scenario file | Observable |
|---|---|---|---|
| Both `disabled` and `busy` | 4 | `busy.ts` | not in `tabOrder()`, AX disabled, no spinner box, no click recorded |
| `busy` removed while the pointer is down | 4 | `busy.ts` | `pointerDown`, remove `busy`, `pointerUp`: one click serial; `pointerDown`, set `busy`, `pointerUp`: none |
| Empty label and no icon (button; button-mode and link-mode row) | 2, 5 | `button.ts`, `action-row.ts` | `axe()` returns exactly `button-name` (button mode) or `link-name` (link mode) for the element |
| Interactive content slotted | — | documentation only | README sentence |
| `href=""`, `javascript:`, unparseable, `data:` | 3 | `control.test.ts`, `link.ts` | mode and rendered `href` per the decision table; no error logged |
| Several ids in a reference | 3 | `control.test.ts`, `link.ts` | `controls` and name in id order, missing ids skipped |
| Referenced element added later | 3 | `link.ts` | no relation until the attribute is set again, then the relation |
| Referenced element in another shadow root | 3 | `control.test.ts` | no relation, no error |
| `current` on a button-mode row | 6 | `row-states.ts` | inner button `aria-current`, the mark drawn |
| `aria-current` on a button, any value | 3 | `link.ts` | each value on the inner control; no mark (box and colours unchanged) |
| Long button label, narrow container | 2 | `button.ts` | label wraps, block size grows, minimum size holds, no overflow |
| Row with an icon and an empty title | 5 | `action-row.ts` | `axe()` returns `button-name`; block size at least `target-min` |
| `unavailable` and `current` (decision 16) | 6 | `row-states.ts` | `aria-current` and `aria-disabled`; title and bar in disabled ink (`GrayText` in forced colours) |
| `busy` and `unavailable` on a row | 6 | `row-states.ts` | `aria-busy` and `aria-disabled`; no event |
| Very long titles and unbreakable identifiers | 5 | `action-row.ts` | US4-13 |
| Unknown `variant`, `size`, `ground` / `layout`, `presentation` | 2 / 5 | `button.ts` / `action-row.ts` | the default's computed values, reflected as written, no error |
| Host `role`, two package copies, no tokens stylesheet | — | documentation only | README sentences |
| Decision 9: unavailable link has no `href` | 4, 6 | `busy.ts`, `row-states.ts` | no `href` attribute, `tabindex="0"`, focusable, role `link`, `aria-disabled` |
| Decision 13: Alt-click on an available link row | 6 | `row-states.ts` | no event; the sink records `defaultPrevented` false with `altKey` (in-process); no navigation in the current tab (fixture) |
| Decision 16: disabled-ink bar | 6 | `row-states.ts` | bar computed colour `disabled-ink` |
| `host.click()` | 2, 4, 5 | `button.ts`, `busy.ts`, `action-row.ts` | US1-2, US1-3, US3-1, US4-1 |

## Tokens tests (`@ocelle/tokens`)

`test/expected.ts` (hand-written entries for `color-hover-border`, `color-accent-hover`, `color-active-bg`,
`motion-spin`, `motion-turn`, `focus-offset-inset`, and `motion-spin` 0 ms under reduced motion),
`test/browser/values.test.ts`, `test/generate.test.ts` (the reduced-motion block: exactly the motion durations
`motion-fast`, `motion-base`, `motion-spin`, a stricter replacement of "exactly two", recorded with its reason;
`motion-turn` unchanged), the README and CHANGELOG tests; `contrast/pairs.json` gains the rows of research.md R-08
with figures from `gate:contrast --print`; the pinned contrast counts in `gates/test/contrast-pairs.test.ts`,
`gates/test/contrast.test.ts`, `gates/test/integration/plants-robustness.test.ts` and
`gates/test/integration/token-gates.test.ts` change first.

## Story test (operator decision I3)

`storybook/test/integration/elements-stories.test.ts` is extended **in each phase's red commit** with that phase's
story ids, each present in the built Storybook and rendering its elements in light and dark; the story files follow
in the green commit. No CSP-violation assertion is added for the new stories (006 removes them).

## Gates touched

| Gate | Effect |
|---|---|
| `manifest` | two new elements in `custom-elements.json` (regenerated, committed), moved attributes declared and described |
| `style-lint` | new element CSS, tokens only; no new allowance (the spinner's angle is a token, its factor a number inside `calc()`); a needed one stops the phase and goes to the squad |
| `contrast` | new rows (R-08) |
| `csp`, `prefix` | new built files and stories |
| `pins` | `axe-core` 4.14.0 exact |
| `mutation` | `src/control.ts`, `src/spinner.ts`, `src/ocelle-button.ts`, `src/ocelle-action-row.ts`, `src/icon-slot.ts` under `stryker.elements.config.json`; `packages/tokens/src/source.ts`, `packages/tokens/src/generate.ts` and `packages/elements/scripts/manifest.ts` under the default config; 007 verdicts (Timeout and CompileError reported, pass) |
| `test-lint` | all new tests |

## With #10 (phase 7, blocking for landing; recheck when #10 lands)

`storybook/baselines/elements-ocelle-button--*.{light,dark}.png` and `elements-ocelle-action-row--*`, produced in the
pinned container; the axe gate on every new story; the story counts in `storybook-build`, `visual`, `axe` and
`plant-repo` integration tests; `fail-token-changed` and `fail-empty-index` plants extended;
`packages/elements/test/axe-rules.ts` replaced by the import from `gates/lib/axe-rules.ts`; `shardSize` lowered to 1
in `gates/lib/plant-runner.ts`, test-first, with a CI run showing every Plants shard under 10 minutes and the run's
total time recorded (research R-13).

## Mutation scope

As mission 005 decision 16: changed source is `packages/elements/src/**` (in-process, elements config),
`packages/tokens/src/**` and `packages/elements/scripts/**` (default config). Test code, fixture suites, build and
pack tests and stories are not source.
