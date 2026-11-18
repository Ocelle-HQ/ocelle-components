# Contract: tests and checks for 012

No new gate. The existing gates take the new elements and tokens; the test harness gains interaction, AX-state,
reduced-motion, navigation-sink and axe support. One existing rule changes: 002's `brand-rules` rule (f) follows the generator's
reduced-motion block in phase 4 (§ Gates touched, plan decision 29).

## Test harness (phase 1, red first)

| File | Change |
|---|---|
| `packages/elements/test/scenarios/driver.ts` | `Driver` gains `focus`, `press(key, modifiers?)`, `click(id, { inner?, modifiers?, button? })` (always `force: true`, R-06), `hover(id, { inner? })`, `pointerDown(id, { inner? })`, `pointerUp(id)`, `tabOrder({ reverse? })` (Tab, or Shift+Tab), `activeInner(id)`, `events(id, types)` / `takeEvents()`, `preventNext(type)`, `navigations()`, `reducedMotion(mode)`, `axe(scope?)`; `computed(id, property, inner?)` reads a shadow element by selector when `inner` is given; `ax(id)` returns role, name, description, disabled, expanded, pressed, hasPopup, busy, focusable and `controls` (ids); `current(id)` reads the inner control's `aria-current` (CDP does not report it, measured) |
| event recorder | bubble-phase listeners on the element, its ancestors, `document` and `window`; each record: `type`, `at`, `target` (as seen at that listener), `isTrusted`, `bubbles`, `composed`, `cancelable`, `defaultPrevented`, `detail`, and a per-dispatch `serial` (R-11) |
| `packages/elements/test/in-process.ts` | the **navigation sink**: a last bubble-phase listener on `window` for `click` and `auxclick` that records `defaultPrevented`, `button`, the modifier flags and the link's `href`, then prevents, so the runner never navigates; `navigations()` returns its records (R-11) |
| axe rule selection | imported from `gates/lib/axe-rules.ts` (006, on this branch since 37dd501): `ruleMeta` and `ruleOptions`, as `gates/bin/axe.ts` uses them; no test-side copy (R-11) |
| `packages/elements/test/commands.ts`, `test/browser/driver.ts` | the commands and both drivers for the methods above; in-process `axe` imports `axe-core`; the fixture serves `axe.min.js` from `node_modules/axe-core` same-origin under the strict CSP |
| `packages/elements/test/browser/serve.ts`, `fixtures/*.html` | new pages `button.html`, `action-row.html`, `link-target.html` (records visits), `axe.js` served; `context.on("page")` records new tabs |
| `vitest.config.ts` | `elements` project commands gain `press`, `hover`, `pointer`, `emulateReducedMotion`, `axe` (Vitest browser commands) |
| `packages/elements/test/harness/*.test.ts` | unit tests of each new driver method on plain test pages (a native button and link), in both harnesses, each "does not" result paired with a positive one: hovered and unhovered, pressed and unpressed native buttons (`computed` with `inner`); Tab and Shift+Tab orders; two dispatches give two serials and one dispatch one serial with its target at each listener; the sink records a plain and a Ctrl-click with `defaultPrevented` false and a prevented one true; the driver's `axe` (006's selection) gives `button-name` for an unnamed button and no `region` on a landmark-less page |
| root `package.json`, lockfile | unchanged: `axe-core` 4.14.0 is already an exact root devDependency (006) |
| `gates/lib/plant-runner.ts`, `gates/test/plant-runner.test.ts`, `gates/README.md` | `shardSize` 3 → 1, red first in the `plantShards` test of the repository's size; the README's approved sizes; 006's Complexity Tracking row updated (size 1, split count 76 for the operator's approval; size 1 the last lever, about 18 stories of headroom after this feature, about 11.2 Plants runner-hours per CI run at 58 stories); phase 1's review asks the operator to open a triage record for a plant design whose shard time does not grow with the story count, before the next element mission (R-13, PLAN-FRESH-3-003) |

Navigation itself is observable only on the fixture harness; in-process, the sink's records are the observable.

## Package tests (`@ocelle/elements`)

| File | Project | Proves |
|---|---|---|
| `test/scenarios/button.ts`, `link.ts`, `busy.ts`, `action-row.ts`, `row-states.ts` | (shared bodies) | every acceptance scenario of US1 to US5 once, and every row of § Edge cases and plan decisions, with expected values written by hand (colours from `packages/tokens/test/expected.ts`; forced colours from research R-12's table, read as `resolveColour(<keyword>)`) |
| link scenario bodies (US2-1 with decision 26's cancel path and modifier clicks, US2-3, US3-8, US5-1, US5-2, US5-6, decision 13) | two bodies each | an in-process body asserting the sink's record (prevented or not, button, modifiers, `href`), and a fixture body asserting real navigation and new tabs; no conditional expect |
| `test/button.test.ts`, `test/action-row.test.ts` | `elements` (browser mode, mutated) | the scenario bodies and the in-process link bodies on source, light and dark, forced colours, reduced motion, `dir="rtl"`; axe after each scenario page (no serious, critical or incomplete serious/critical result, except a scenario that expects one by name) |
| `test/browser/button.test.ts`, `test/browser/action-row.test.ts` | `elements-browser` | the same bodies on the built browser build under the strict CSP with zero violations, allowed requests only, no console message; the fixture link bodies (navigation, new tab, modifier clicks) |
| `test/control.test.ts` | `elements` | the internal module: the mode decision table (empty, whitespace, relative, `javascript:`, `JavaScript:`, `JAVASCRIPT:x`, `java\tscript:x`, `\u0001javascript:x`, ` javascript:x` → button; `http://[` → button, no error; `data:text/html,x` → link, `href` as written), the attribute move, clearing by empty, whitespace-only and off values, removal as a no-op, the custom states, reference resolution (document, shadow root, missing ids, order), the name order (the row's name, exactly the title with description and tags slotted, is asserted from content in phase 5's `action-row.ts`, plan decision 30; plant: the description wrapper back inside the inner control), the guard in every non-available state (plant: "guard limited to unavailable"), the host guard on a click whose composed path misses the inner control, in every state (plant: no host listener), mirrors restored after removal or change while a value is held and the element's own writes ignored (plant: mirror not restored), `click()` forwarding |
| `test/slot.test.ts` | `elements` | a non-icon element in the default slot of a control that adopts `iconSlotStyles` keeps its own box (plant: the unscoped `::slotted(*)`) |
| `test/entry-button.test.ts`, `test/entry-action-row.test.ts` | `elements` | each module defines only its tag; `entry-root.test.ts` and `exports.test.ts` extended |
| `test/build/build.test.ts`, `test/build/pack.test.ts`, `test/node/manifest.test.ts`, `test/node/readme.test.ts` | as before | the new files, imports, manifest entries (every moved attribute and `title` declared with a description, each `data-ocelle-moved-*` mirror declared, `ground` with `chrome`, the custom states, the event `ocelle-button-activate` with its `detail` type, no `type`, `name`, `value` or `form` attribute on `ocelle-button` (FR-022); 005's entries unchanged), README sections (control conventions, the button's activate event, the markup of the three consumer compositions equal to the markup `link.ts` renders (plant: a README snippet that differs; decision 28), the two elements, engines floor Chromium 135 and WebKit 17.4, moved-ARIA note with the per-stack recipes, custom states, the mirrors (hosts do not write them; copies keep moved values; the element restores them after a morphing swap),
a host may restyle `display` and size (the host guard and its limits: capture-phase listeners and listeners added
before upgrade), `title` moved, label-in-name rule, `data:`/`vbscript:` note, the spinner's 4.8 s and the 833 ms limit for an override of `--ocelle-motion-spin`, the flush-hover note with its exception list (`hover-bg` both themes, `inset` light, `neutral-bg` dark, `chrome-hover` both themes), the flush note's clipping-container space (`focus-offset` + `focus-width`), the changing-surface `ground` rule, the chrome look (`secondary` like `quiet`), the current bar's place inside the ring, a stretched button growing to its row, the synthetic-dispatch note, form note, 005's elements keep their `aria-label` rule) and CHANGELOG lines |
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
| Interactive content slotted | — | documentation only | README sentence (in a row's `description`, `tags` or `trailing` slot also `aria-hidden`, so axe would report `aria-hidden-focus`; decision 30) |
| `href=""`, `javascript:`, unparseable, `data:` | 3 | `control.test.ts`, `link.ts` | mode and rendered `href` per the decision table; no error logged |
| Several ids in a reference | 3 | `control.test.ts`, `link.ts` | `controls` and name in id order, missing ids skipped |
| Referenced element added later | 3 | `link.ts` | no relation until the attribute is set again, then the relation |
| Referenced element in another shadow root | 3 | `control.test.ts` | no relation, no error |
| `current` on a button-mode row | 6 | `row-states.ts` | inner button `aria-current`, the mark drawn |
| `aria-current` on a button, any value | 3 | `link.ts` | each value on the inner control; no mark (box and colours unchanged) |
| Long button label, narrow container | 2 | `button.ts` | label wraps, block size grows, minimum size holds, no overflow |
| Row with an icon and an empty title | 5 | `action-row.ts` | `axe()` returns `button-name`; block size at least `target-min` |
| `unavailable` and `current` (decisions 16 and 31) | 6 | `row-states.ts` | `aria-current` and `aria-disabled`; title and bar in disabled ink (`GrayText` in forced colours); current surface kept (`accent-low`, `chrome-hover` on chrome), unchanged on hover |
| `busy` and `unavailable` on a row | 6 | `row-states.ts` | `aria-busy` and `aria-disabled`; no event |
| Very long titles and unbreakable identifiers | 5 | `action-row.ts` | US4-13 |
| Unknown `variant`, `size`, `ground` / `layout`, `presentation` | 2 / 5 | `button.ts` / `action-row.ts` | the default's computed values, reflected as written, no error |
| Host `role`, two package copies, no tokens stylesheet | — | documentation only | README sentences |
| Decision 9: unavailable link has no `href` | 4, 6 | `busy.ts`, `row-states.ts` | no `href` attribute, `tabindex="0"`, focusable, role `link`, `aria-disabled` |
| Decision 13: Alt-click on an available link row | 6 | `row-states.ts` | no event; the sink records `defaultPrevented` false with `altKey` (in-process); no navigation in the current tab (fixture) |
| Decision 26: the button's activate event | 2, 3, 4 | `button.ts`, `link.ts`, `busy.ts` | US1-2 (one activate serial with every flag and `detail` `{}`, recorded before the `click` at the host and every ancestor), US1-18 (cancel in button mode: `click` delivered with `defaultPrevented` true), US1-3, US3-1 (none while disabled or busy; one after `busy` is removed), US2-1 (link mode: cancel → no navigation; Ctrl, Meta, Shift, Alt click: `click` delivered, no activate event, default kept); plants: no activate event, activate on a modifier click, cancel not forwarded to the `click` |
| FR-022: not a form control | 2 | `button.ts` | US1-19: inside a `<form>`, pointer, Enter and Space each give one `click` and one activate serial and no `submit` or `reset` event; plant: activation calls the enclosing form's `requestSubmit()` (a `type="submit"` inner button would not bite, since a control in a shadow root has no form owner outside it) |
| Link look equals button look (FR-002, US1-11 link half) | 3 | `link.ts` | for each variant, idle, hover, active, focus and disabled: computed colours, border and padding of the link-mode control equal the button-mode twin's; in forced colours `LinkText` (text, border), `Highlight` (hover, focus), `GrayText` (disabled); plant: link mode drops the variant rules |
| Consumer compositions (decision 28, SC-006) | 3 | `link.ts` | the README's markup for #12's breadcrumb item, #12's top-bar menu button and #14's copy control, with no style that targets the elements: roles, names, `aria-current`, `aria-haspopup`, `aria-expanded`, target sizes, the breadcrumb's flush alignment, the menu button's chrome colours |
| Decision 16: disabled-ink bar | 6 | `row-states.ts` | bar computed colour `disabled-ink` |
| `host.click()` | 2, 4, 5 | `button.ts`, `busy.ts`, `action-row.ts` | US1-2, US1-3, US3-1, US4-1 |
| Stretched host (decision 18) | 2, 4, 5, 6 | `button.ts`, `busy.ts`, `action-row.ts`, `row-states.ts` | US1-15 (available: one click serial; disabled: none), US3-10, US4-15 (the row's hit-layer boxes equal their grid cells and hosts; one activate event; plant: the layer positioned against the inner control), US5-6 (unavailable stretched row: none); each with the plant restoring `inline-block` (button) or `block` (row) |
| Restyled host (decision 23) | 2, 4, 6 | `button.ts`, `busy.ts`, `row-states.ts` | US1-17 (available and disabled button), US3-11 (busy), US5-6 restyled case (unavailable row) and US5-12 (available row, button and link mode), each under page rules `display: block`, `display: flex; width: 100%` and `display: block; height: 90px`: the outside points (asserted outside the inner box first, the row's hit layer's box for the row; the row's listed by hand per mode and rule from the phase's spike) give no click serial and no event or navigation, and the inner centre gives one click serial or one activate event on an available control; plant: no host listener |
| Mirrors of moved values (decision 19) | 3, 5 | `link.ts`, `action-row.ts` | US2-13 (button, `outerHTML` and `cloneNode(true)`); the row re-created the same way keeps its `aria-label` name; plant: no mirror |
| Mirrors restored (decision 24) | 3, 5 | `link.ts`, `action-row.ts` | US2-13 morph case (the test applies idiomorph's attribute sync with the unchanged server markup, then copies through `innerHTML`; a mirror removed and one overwritten directly read their stored values again); the row's mirror case with the same morph step for `aria-label`; plant: mirror not restored |
| Empty description and tags elements (PLAN-FRESH-3-004) | 5 | `action-row.ts` | US4-16 empty `<span slot="description">` (and whitespace only): description stays the moved `title`, then "Due Friday" after text is written, then the title again (plant: the raw assigned elements referenced; plant: no `MutationObserver`); US4-6 the empty span takes no space and adds no gap, then takes space after text is written (plant: wrappers hidden from the raw assigned elements) |
| Host `title` moved (decision 22) | 3, 5 | `link.ts`, `action-row.ts` | US2-14, US4-16: one AX node, host without `title`, description (or name) from it; plant: `title` not moved |
| `ground="chrome"` (decision 20) | 2, 5, 6 | `button.ts`, `action-row.ts`, `row-states.ts` | US1-4, US1-5, US1-13, US1-14 on `chrome` and `chrome-hover`; US4-17; US5-11; plant: `chrome` treated as unknown |
| Changing surface (decision 7) | 2 | `button.ts` | US1-16: border `accent-strong` on canvas and on `hover-bg`; plant: `hover-bg` ground ignored |
| Flush hover exception (decision 6) | 2, 5 | `button.ts`, `action-row.ts` | US1-14 and US4-8 with the hand-written per-theme list; plant: the flush hover token changed (fails on every other ground) |
| Ring and bar distinct (decision 21) | 5, 6 | `action-row.ts`, `row-states.ts` | US4-9 four sides on a non-current row (plant: no ring); US5-4 focused current row: ring band, gap and bar band read apart, in ltr and rtl (plants: bar at `inset-inline-start: 0`; bar at the ring's inner edge) |
| Decision 29: 002's brand-rules rule (f) follows the generator | 4 | `gates/test/brand-rules.test.ts` | the phase 4 stylesheet passes (`motion-spin: 0ms` accepted); a block without `motion-spin` gives one `reduced-motion` finding at the block's line; `motion-turn` in the block and `motion-fast` at 60ms each give one finding; plants `f-motion-not-zero`, `f-motion-spin-missing` |
| Decision 30: row content beside the inner control, hit layer | 5, 6 | `action-row.ts`, `row-states.ts` | US4-3 (one AX node named exactly the title, description "Due Friday Blocked Design", no AX node for the description, a tag or the trailing icon; `axe()` empty on every row with description or tag text, no `label-content-name-mismatch`; plant: the description wrapper back inside the inner control); US4-15 sibling clicks (one event each for the description, a tag and the trailing icon, both layouts; plant: siblings without `pointer-events: none`); US4-17, US5-7 and forced colours read on the description and tags wrappers (plant: sibling colours removed); US5-4 no `color-contrast` incomplete result on a current row with description and tags; README sentences on interactive slotted content and `::part(control)` (`readme.test.ts`) |
| Decision 31: unavailable sibling wrappers `aria-disabled`; unavailable current surface | 6 | `row-states.ts`, `elements-stories.test.ts` | axe on unavailable rows with description and tags (with and without `current`, default and flush, canvas, `accent-low` and chrome, light and dark): 0 results of any impact; the description, tags and trailing wrappers `aria-disabled="true"` while unavailable, none once cleared (plant: wrappers without `aria-disabled`); the unavailable and unavailable current stories give 0 serious or critical axe results; an unavailable current row's surface `accent-low` (`chrome-hover` on chrome), unchanged on hover |
| Decision 32: `:state(pressed)` button mode only | 6 | `link.ts` (US2-12), `readme.test.ts` | a link-mode button with `aria-pressed="true"` does not match `:state(pressed)` at mount, after `"false"` then `"true"` again, or after `""`, while a button-mode twin does; a button-mode button with `aria-pressed="true"` matches, stops matching when an `href` switches it to link mode, and matches again when the `href` is cleared; the README's custom-states sentence says "in button mode" (plant: `pressed` state in any mode) |
| Decision 33: the slot convention's label on the text baseline, labelled rows only (amended by phase 2 round 6) | 2 (fix round 4: red `fix-4`, red `fix-5`, one green) | `button.ts`, `slot.ts`, `readme.test.ts` | a one-line `ocelle-button` in a line of text (default, `compact`, with an icon, `flush`, `quiet` `flush`, link mode, busy) and the convention's test host: the label's baseline on the text's within 0.5 px (red without the rule), and in the same test the icon wrapper's and the label's block-start equal within 0.5 px (plant: `.icon-row { align-items: baseline }` in place of the label rule); an icon-only `ocelle-button` (`bare` row: default, `compact`, busy) in a line of text: the icon's centre within 0.5 px of a native `<button>` holding an svg in the same line (plant: the unscoped rule `.icon-row > .label { align-self: baseline }`), and the same for the test host's bare row if it has one; the README's slot convention names the label wrapper, its baseline, and the `bare` modifier for a row with no label |
| Flush button in a clipping container; spinner token override | — | documentation only | README sentences (`readme.test.ts`) |

## Tokens tests (`@ocelle/tokens`)

`test/expected.ts` (hand-written entries for `color-hover-border`, `color-accent-hover`, `color-active-bg`,
`color-chrome-active`, `motion-spin`, `motion-turn`, `focus-offset-inset`, and `motion-spin` 0 ms under reduced
motion),
`test/browser/values.test.ts`, `test/generate.test.ts` (the reduced-motion block: exactly the motion durations
`motion-fast`, `motion-base`, `motion-spin`, none marked `delay: true` (operator decision C1, 2026-11-17; at landing, phase 4 round 2, O2-01 and O2-02: the marker only on a motion token whose name ends in `-delay`, and every other motion duration a literal `<number>ms` value, or `validateSource` refuses the source, `test/validate.test.ts`, fix-2), a stricter replacement of "exactly two", recorded with its reason;
`motion-turn` unchanged), the README and CHANGELOG tests; `contrast/pairs.json` gains the rows of research.md R-08
(38 per theme, the chrome rows included) with figures from `gate:contrast --print`; the pinned contrast counts in `gates/test/contrast-pairs.test.ts`,
`gates/test/contrast.test.ts`, `gates/test/integration/plants-robustness.test.ts` and
`gates/test/integration/token-gates.test.ts` change first.

## Story test (operator decision I3)

`storybook/test/integration/elements-stories.test.ts` is extended **in each phase's red commit** with that phase's
story ids, each present in the built Storybook and rendering its elements in light and dark; the story files follow
in the green commit. No CSP-violation assertion is added for the new stories (006 removed them).

Focus stories (decision 27): the button's (phase 2), a focused non-current row (phase 5) and a focused current row
(phase 6), each focused by its wrapper with plain `focus()` or, where the phase 2 spike found that it does not show
`:focus-visible` in the pinned capture, `focus({ focusVisible: true })`. The row's `ground` stories (`accent-low`,
`inset`, `hover-bg`, `state`; phase 5) and a `current="true"` row (phase 6) complete FR-050's enumerated values.

## Gates touched

| Gate | Effect |
|---|---|
| `manifest` | two new elements in `custom-elements.json` (regenerated, committed), moved attributes, `title` and the mirrors declared and described |
| `style-lint` | new element CSS, tokens only; no new allowance (the spinner's angle is a token, its factor a number inside `calc()`; the bar's offset a `calc()` of tokens); a needed one stops the phase and goes to the squad |
| `contrast` | new rows (R-08) |
| `brand-rules` | phase 4 changes 002's rule (f) (002 FR-007, FR-019 (f); plan decision 29, operator decision at phase 4, option (a)): the reduced-motion block sets exactly every `motion` token whose source value is a duration to `0ms`, except those marked `delay: true` (operator decision C1, 2026-11-17, landing of PR #50; d4a56ea red, 558c560 fix) (today `motion-fast`, `motion-base`, `motion-spin`; not `motion-turn`, not `easing-standard`, not `tooltip-delay`), read from the token source, so a later duration token needs no gate edit; red first in `gates/test/brand-rules.test.ts` in phase 4's red commit (the existing (f) cases with the new message; a block without `motion-spin` reported at the block's line; `motion-turn` in the block reported); `gates/bin/brand-rules.ts` mutated (§ Mutation scope); plant `f-motion-not-zero` kept and still bites, new fail plant `gates/plants/brand-rules/f-motion-spin-missing` (wrapped generator without `--ocelle-motion-spin: 0ms;`, one `reduced-motion` finding at the block); the `gates/README.md` `brand-rules` row records the change and lists the plant; `gate:brand-rules` passes on the phase 4 tree. *Amended at landing, round 2* (operator, 2026-11-17, phase 4 round 2, O2-01 "Names ending in -delay (Recommended)", O2-02 "Fail on non-ms motion (Recommended)"; plan decision 29): every motion-group duration is a literal `<number>ms` value and is `0ms` under reduced motion, except a token whose name ends in `-delay` and that carries `delay: true`; anything else in the motion group is a finding (angles and easing functions are not durations, plan decision 29); red first under `red.sh 4 fix-2` in `gates/test/brand-rules.test.ts` (a misplaced `delay: true`; `1s`, `var()`, `calc()` motion durations) and `packages/tokens/test/validate.test.ts` (the generator's refusal of each); new fail plants `gates/plants/brand-rules/f-delay-marker-misplaced` and `gates/plants/brand-rules/f-motion-not-ms` (wrapped generator, one `reduced-motion` finding at the record each); the brand-rules plant pins (15 to 17), the `gates/README.md` row and 002's contracts/gates.md plant table updated (tasks.md T049b to T049f) |
| `csp`, `prefix` | new built files and stories |
| `storybook-build`, `visual`, `axe` | every phase that adds stories: the new stories built, captured against their committed baselines and audited with 0 serious or critical results; the pinned counts in their integration tests and `plant-repo.test.ts` updated red first |
| `plants` | `shardSize` 1 (phase 1); `fail-token-changed` and `fail-empty-index` extended per phase |
| `mutation` | `src/control.ts`, `src/spinner.ts`, `src/ocelle-button.ts`, `src/ocelle-action-row.ts`, `src/icon-slot.ts` under `stryker.elements.config.json`; `packages/tokens/src/source.ts`, `packages/tokens/src/generate.ts` and `packages/elements/scripts/manifest.ts` under the default config; `gates/lib/plant-runner.ts` (the `shardSize` constant, phase 1) and `gates/bin/brand-rules.ts` (rule (f), phase 4) under the default config; 007 verdicts (Timeout and CompileError reported, pass) |
| `test-lint` | all new tests |

## Feature 006 work, per phase (006 merged into this branch at 37dd501)

Each phase that adds stories (2 to 6): `storybook/baselines/elements-ocelle-button--*.{light,dark}.png` or
`elements-ocelle-action-row--*` for its stories, made with `pnpm run visual:update` under docker in the pinned
container (CI confirms under docker and podman; CI's artifact committed when they differ); `gate:axe` with 0 serious
or critical results on every new story; the story counts in the `storybook-build`, `visual`, `axe` and `plant-repo`
integration tests (exact summary lines, written by hand); `fail-token-changed` extended with the phase's measured
light story-themes that show `color-ink`; `fail-empty-index`'s tree gains an empty `button.stories.ts` (phase 2) and
`action-row.stories.ts` (phase 5). Phase 1: `shardSize` lowered to 1, test-first, before any story is added (research
R-13); size 1 is the last lever, so phase 1's review also asks the operator to open a triage record for a plant
design whose shard time does not grow with the story count, before the next element mission (PLAN-FRESH-3-003). Phase 6's review records a CI run at the full story count with every Plants shard under 10 minutes and the
run's total time; a shard at or over 10 minutes is a stop-and-ask (about 588 s per shard is expected at about 72
stories and accepted, operator decision at phase 2; research R-13). Phase 6 corrects `gates/README.md`'s and 006's
row's figures to about 72 stories, about 4 stories of headroom and about 11.9 runner-hours (T068); the operator
opens the plant-design triage record when this feature lands.

## Mutation scope

As mission 005 decision 16: changed source is `packages/elements/src/**` (in-process, elements config),
`packages/tokens/src/**`, `packages/elements/scripts/**`, in phase 1 `gates/lib/plant-runner.ts` and in phase 4
`gates/bin/brand-rules.ts` (default config), as § Gates touched lists. Test code, fixture suites, build and
pack tests and stories are not source.
