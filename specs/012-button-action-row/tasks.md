# Tasks: Action Controls, `ocelle-button` and `ocelle-action-row`

**Input**: design documents in `specs/012-button-action-row/`, as approved at the plan gate on 2026-11-13 after three
plan-squad rounds (`reviews/plan/round-1..3/`), with the analysis fixes of 2026-11-14 (`reviews/analysis/fixes-1.md`;
added tasks carry suffixed IDs, e.g. T031a, and no task is renumbered):
- spec.md (FR-001 to FR-023, FR-030 to FR-042, FR-050 to FR-056, SC-001 to SC-007; US1-1..19, US2-1..14, US3-1..11,
  US4-1..18, US5-1..12; edge cases);
- plan.md, with decisions 1 to 28 and the phase list, decision 29 (operator decision at phase 4: 002's
  brand-rules rule (f) follows the generator; added tasks T042a, T045a) and decision 30 (operator decisions at phase
  5, 2026-11-15: the row's description, tags and trailing content are `aria-hidden` siblings of the inner control,
  whose hit layer fills the host; added task T049a, and T050, T053, T054, T056 to T058, T060, T061, T063 and T064
  revised);
- research.md, R-01 to R-16;
- data-model.md;
- contracts/elements-package.md and contracts/checks.md (§ Edge cases and plan decisions maps every edge case and plan
  decision to a phase, a scenario file and an observable);
- quickstart.md.

**Tests**: required. Constitution Principle VIII applies to every phase. The phase flow is `base.sh`, an optional
`scaffold.sh`, **one red commit of test files only** proven by `red.sh` (one red record per phase; operator decision
I3: the phase's story tests are in that red commit, before green), then green, `tdd-check.sh` and an independent
review. Expected values are written by hand from the spec, the data model and research: colours from
`packages/tokens/test/expected.ts` by token name, forced colours from research R-12's table read as
`resolveColour(<keyword>)`, never from the source under test.

The guard rules:
- A "does not" assertion never stands alone: it shares its test with the positive assertion it guards.
- Each guard is proven able to fail by its named plant (contracts/checks.md), run once by the implementer and
  recorded in `reviews/phase-N/plants.md`.
- A plant that does not make its guard fail stops the phase (stop-and-ask).
- Clicks on `aria-disabled` or disabled controls are sent with `force: true` (R-06), so "not activated" tests always
  send a click.

**Shared scenario bodies** (R-11): every browser scenario is written once in `packages/elements/test/scenarios/*.ts`
against the driver and run by two harnesses: in-process (`elements`, element source, mutated) and on the strict-CSP
fixture (`elements-browser`, the built browser build, not mutated). Link scenarios have two bodies each: an
in-process body on the navigation sink's records and a fixture body on real navigation and new tabs (no conditional
expect). Fixture runs also assert zero CSP violations, only allowed requests and no console message.

**Feature 006 per phase** (006 merged at 37dd501): a phase that adds stories commits their baselines
(`pnpm run visual:update` under docker in the pinned container; CI's artifact committed when local and CI differ),
runs `gate:storybook-build`, `gate:visual` and `gate:axe` (0 serious or critical results), updates the pinned story
counts in `gates/test/integration/{storybook-build,visual,axe,plant-repo}.test.ts` **red first** (exact summary lines
written by hand), and extends the `fail-token-changed` (`gates/plants/visual/fail-token-changed/plant.json`, the
phase's light story-themes that show `color-ink`, measured) and `fail-empty-index` plants.

**Environment**: Node 22 in this container, 26.13.0 in CI. Every browser run sets
`OCELLE_CHROMIUM_PATH=/opt/pw-browsers/chromium-1248/chrome-linux64/chrome` (Chromium 156, the build the pinned
Playwright 1.64.1 expects; phase 3 review R1-04); Stryker and plant runs alias the browsers directory as
`knowledge/speckit-flows/findings/frontend-missions.md` § Browser path describes. One heavy job (browser suites,
mutation, plants, visual) at a time. Never `git stash`.

**Organization**: phase 1 is Setup (test harness and shard size); phases 2 to 6 are User Stories 1 to 5, one review
unit each, folded after approval (`/ocelle-run` step 4.3). Records (README, CHANGELOG, stories, baselines, plants)
belong to the phase whose behaviour they describe. There is no polish phase.

**Stop-and-ask points** (the implementer records the question in the phase review and does not work around it):
- a proposed token value (`color-accent-hover`, `color-active-bg`, `color-chrome-active`) or any new required pair
  below threshold in `gate:contrast --print` (research R-08);
- a needed new `style-lint` allowance;
- a spike outcome that contradicts the plan (T014: only when neither plain `focus()` nor `focus({ focusVisible: true })`
  shows the ring in the pinned capture, decision 27; T030, T049a, T060);
- a plant that does not bite;
- any mutation shard over 10 minutes; any Plants shard at or over 10 minutes (phase 6's CI run; about 588 s is expected at about 72 stories and accepted, operator decision at phase 2).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: can run in parallel (different files, no dependency on an unfinished task)
- **[Story]**: the user story of the task (US1 to US5)
- Paths are relative to the repository root.

---

## Phase 1: Setup — test harness and shard size

**Purpose**: the driver, commands and fixture support every later phase needs (R-11), and the plant shard size that
the new stories require (R-13, decision 15). No element behaviour.

**Independent Test**: the harness unit tests pass in both harnesses on plain pages; `plantShards` gives size 1 for the
repository; `tdd-check.sh 1` reports `pass`.

### Tests (red, one commit)

- [X] T001 [P] `packages/elements/test/harness/interaction.test.ts` (in-process) and `packages/elements/test/browser/harness.test.ts` (fixture): on a plain page with a native `<button>` and `<a href>`: `focus`, `press("Enter"|" ", modifiers?)`, `click(id, { inner?, modifiers?, button? })` with `force: true`, `hover`, `pointerDown`/`pointerUp`, `tabOrder()` and `tabOrder({ reverse: true })` (Shift+Tab), `activeInner(id)`; hovered vs unhovered and pressed vs unpressed native button read through `computed(id, property, inner?)` (R-11)
- [X] T002 [P] `packages/elements/test/harness/events.test.ts` and its fixture twin: the recorder on element, ancestors, `document`, `window` records `type`, `at`, `target`, `isTrusted`, `bubbles`, `composed`, `cancelable`, `defaultPrevented`, `detail` and a per-dispatch `serial`; two dispatches give two serials, one dispatch one serial seen at every listener with its target there; `preventNext(type)` makes the next record `defaultPrevented` true
- [X] T003 [P] `packages/elements/test/harness/navigation.test.ts`: the in-process navigation sink records a plain click and a Ctrl-click on a link with `defaultPrevented` false, a prevented click with `defaultPrevented` true, `auxclick` with `button: 1`, the modifier flags and the `href`, and the runner never navigates; the fixture twin (`test/browser/harness.test.ts`) asserts a real navigation to `link-target.html` and a new tab recorded by `context.on("page")`
- [X] T004 [P] `packages/elements/test/harness/ax.test.ts` and fixture twin: `ax(id)` returns `role`, `name`, `description`, `disabled`, `expanded`, `pressed`, `hasPopup`, `busy`, `focusable` and `controls` (ids) for native controls carrying those states; `current(id)` reads `aria-current` from the DOM (CDP does not report it); `reducedMotion("reduce")` makes `matchMedia("(prefers-reduced-motion: reduce)")` true and `"no-preference"` false again
- [X] T005 [P] `packages/elements/test/harness/axe.test.ts` and fixture twin: the driver's `axe()` uses `ruleMeta` and `ruleOptions` imported from `gates/lib/axe-rules.ts` and returns `button-name` for an unnamed `<button>` and no `region` result on a landmark-less page (006's exclusions apply); on the fixture `axe.min.js` is served same-origin under the strict CSP with zero violations
- [X] T006 [P] `gates/test/plant-runner.test.ts`: `plantShards` of the repository's plant list gives size-1 visual and axe shards (one story per shard) and the other plants at 80 (R-13)

### Implementation

- [X] T007 `packages/elements/test/scenarios/driver.ts`: the `Driver` interface gains the methods of T001 to T005 (contracts/checks.md § Test harness)
- [X] T008 `packages/elements/test/commands.ts`, `packages/elements/test/in-process.ts` (the navigation sink: last bubble-phase `click` and `auxclick` listener on `window` recording, then preventing), `packages/elements/test/browser/driver.ts`, `packages/elements/test/browser/serve.ts` (serve `axe.min.js` from `node_modules/axe-core`; `context.on("page")`), `packages/elements/test/browser/fixtures/{button,action-row,link-target}.html` (`link-target.html` records visits)
- [X] T009 `vitest.config.ts`: the `elements` project's browser commands `press`, `hover`, `pointer`, `emulateReducedMotion`, `axe`
- [X] T010 `gates/lib/plant-runner.ts`: `shardSize` 3 → 1 (`gates/lib/plant-runner.ts:269`)
- [X] T011 `gates/README.md` (approved shard sizes: 1; the split count at size 1, 76 stories by 006's model, for the operator's approval at this phase's review; size 1 is the last lever; about 18 stories of headroom after this feature; about 11.2 Plants runner-hours per CI run at 58 stories against about 4 today) and the Complexity Tracking row of `specs/006-storybook-workbench/plan.md` updated with the same facts (R-13, decision 15)
- [X] T012 Write `specs/012-button-action-row/reviews/phase-1/tdd-exempt.md` for the documentation part (T011) and record in `reviews/phase-1/notes.md` the two operator questions for this phase's review: approval of the split count 76 at size 1, and opening a triage record for a plant design whose shard time does not grow with the story count, before the next element mission (PLAN-FRESH-3-003 (a))
- [X] T013 Run `pnpm run gate:test-lint`, `gate:typecheck`, then `gate:plants` (one at a time) and `gate:mutation -- --base <phase base>` (`gates/lib/plant-runner.ts`)

**Checkpoint**: `tdd-check.sh 1` reports `pass`.

---

## Phase 2: User Story 1 - `ocelle-button` (Priority: P1) 🎯 MVP

**Goal**: US1-1 to US1-19 and this phase's rows of contracts/checks.md § Edge cases and plan decisions; FR-001 to
FR-003 (button mode, disabled), FR-006 (label and content), FR-007, FR-009 to FR-014, FR-018 to FR-020, FR-022,
FR-023 (button mode; decision 26);
the tokens of R-08 items 1, 3, 4, 4a, 5; button stories with baselines and the axe gate. Button mode only (link mode
is phase 3, busy phase 4).

**Independent Test**: `<ocelle-button>Save</ocelle-button>` on the strict-CSP fixture is one `button` node named
"Save", one tab stop, clicked by pointer, Enter and Space with one `ocelle-button-activate` serial and then one `click`
serial at the host; disabled gives neither;
`gate:contrast`, `gate:manifest`, `gate:visual` and `gate:axe` pass.

### Spike (first)

- [X] T014 [US1] Spike, scratch files only, recorded in `specs/012-button-action-row/reviews/phase-2/spike.md`: a story whose wrapper focuses an inner `<button>` from `connectedCallback` captured by 006's harness: does the inner control match `:focus-visible` (a) with plain `focus()` and (b) with `focus({ focusVisible: true })` on the host, forwarded by `delegatesFocus` (both measured true on a scratch page in Chromium 153, decision 27); the focus stories of T021, T054 and T063 use (a) when it shows the ring in the pinned capture and (b) otherwise; neither is a stop-and-ask (research R-13)

### Tests (red, one commit)

- [X] T015 [P] [US1] `packages/elements/test/slot.test.ts`: a non-icon element in the default, `description` or `tags` slot of a control adopting `iconSlotStyles` keeps its own box; `icon` and `trailing` slotted icons keep `--ocelle-icon-size` (plant: unscoped `::slotted(*)`) (R-10)
- [X] T016 [P] [US1] `packages/elements/test/scenarios/button.ts`: US1-1 to US1-19 as shared bodies, with the hand-written expected values of spec and research R-08 (variant × state × ground tables, `ground` absent, `accent-low`, `inset`, `hover-bg`, `state`, `chrome`; sizes default ≥ `target-min` both dimensions and compact ≥ 24 px both dimensions, the 24 written by hand, not read from `space-6`, so a change to that token still fails (WCAG 2.5.8); `flush` alignment within 0.5 px in ltr and rtl, with an icon and a one-character label, at the inline start; the flush-hover exception list per theme (`neutral-bg` in dark included, operator decision at phase 2); US1-1's node count: exactly one node with a role (other than `generic`) or a name, the host's unnamed `generic` node allowed and a named one failing (operator decision at phase 2); focus ring longhands on `:focus-visible`; forced colours per R-12's table; the long-label edge case; unknown `variant`, `size`, `ground` values; empty label and no icon → `axe()` exactly `button-name`; `host.click()` on enabled and disabled; stretched host US1-15; restyled host US1-17 under the three page rules with outside points asserted outside the inner box first; changing-surface US1-16; the activate event of decision 26 in button mode: one `ocelle-button-activate` serial per activation by pointer, Enter, Space and `host.click()`, `bubbles`, `composed`, `cancelable` true, `detail` deep-equal `{}`, target the host at every listener, recorded before the `click` at the host, `document` and `window` (US1-2), none when disabled (US1-3), one with each delivered click in US1-15 and US1-17, US1-18's cancel (`preventNext("ocelle-button-activate")`: the `click` still delivered once with `defaultPrevented` true, focus kept); US1-19's form: the button inside a `<form>` with `submit` and `reset` listeners, activated by pointer, Enter and Space, each paired with its positive `click` and activate serial, no `submit` and no `reset` recorded (plants: no activate event; cancel not forwarded to the `click`; activation calls the enclosing form's `requestSubmit()`)); each "does not" paired and its plant named
- [X] T017 [P] [US1] `packages/elements/test/control.test.ts` (button-mode part): `delegatesFocus` focuses the inner control; `click()` forwarding; the host guard stops a click whose composed path misses the inner control in every state (plant: no host listener); disabled stops activation; name order: `label` (trimmed; whitespace-only is none) then content, slotted icons never contribute
- [X] T018 [P] [US1] `packages/elements/test/button.test.ts` (in-process over T016, light and dark, forced colours, `dir="rtl"`, `axe()` after each page) and `packages/elements/test/browser/button.test.ts` (fixture over T016, CSP, requests, console); `packages/elements/test/entry-button.test.ts` (importing `src/ocelle-button.ts` defines only `ocelle-button`); `entry-root.test.ts` and `exports.test.ts` extended (`OcelleButton`)
- [X] T019 [P] [US1] `packages/tokens/test/expected.ts` (hand-written `color-hover-border` = `var(--ocelle-color-ink)`, `color-accent-hover` `#D9A23F`, `color-active-bg` light `#D3CCBF` dark `#3A342B`, `color-chrome-active` `#3A342B`), `packages/tokens/test/browser/values.test.ts`, the tokens README and CHANGELOG tests; `gates/test/contrast-pairs.test.ts`, `gates/test/contrast.test.ts`, `gates/test/integration/plants-robustness.test.ts`, `gates/test/integration/token-gates.test.ts`: the pinned counts with the new required rows of R-08 items 1, 3, 4a and 5 (`color-ink` += state grounds and `active-bg`; `color-accent-strong` += canvas, sheet, pane, panel, inspector, rail, chrome, chrome-hover; `color-on-accent` += `accent-hover`; `color-chrome-ink` += `chrome-active`; `color-disabled-ink` += chrome grounds, exempt; `color-hover-border` on main, state grounds and `active-bg`)
- [X] T020 [P] [US1] `packages/elements/test/build/build.test.ts`, `test/build/pack.test.ts` (dist and packed `ocelle-button.js`), `packages/elements/test/node/manifest.test.ts` (`ocelle-button` entry: `variant`, `size`, `flush`, `ground` (incl. `chrome`), `label`, `disabled`; slots default and `icon`; part `control`; the event `ocelle-button-activate` with its `detail` type `Record<string, never>` and a description; no attribute named `type`, `name`, `value` or `form` (FR-022), paired with the positive presence of `variant`; 005's entries unchanged), `packages/elements/test/node/readme.test.ts` (control conventions 1 (with the filled host), 3 (disabled half), 5 (label-in-name), 7; the activate event (flags, `detail` `{}`, before the `click`, cancel); form note; flush-hover note with its exception list; flush clipping note (`focus-offset` + `focus-width`); changing-surface `ground` rule; chrome look (`secondary` like `quiet`); a host may restyle `display` and size, with the host guard's limits; the `ocelle-button` section; CHANGELOG lines; no planning IDs)
- [X] T021 [P] [US1] Story tests: `storybook/test/integration/elements-stories.test.ts` gains the button story ids of this phase (variants × states, sizes, flush, icon, icon-only, disabled, `ground` values incl. chrome and the changing surface, rtl, hover and press declared with `parameters.ocelle.pointer`, focus by the method T014 selects (decision 27)), each present and rendering in light and dark; `gates/test/integration/{storybook-build,visual,axe,plant-repo}.test.ts` the new pinned counts

### Implementation (green)

- [X] T022 [US1] `packages/elements/src/icon-slot.ts`: size rules scoped to the `icon` and `trailing` slots; `.icon-slot[hidden] { display: none; }`
- [X] T023 [US1] `packages/tokens/src/source.ts`: the four new colour tokens and the declared grounds of T019 (R-08); `packages/tokens/contrast/pairs.json` rows with figures from `pnpm run gate:contrast --print` (stop-and-ask if any is below threshold); tokens README and CHANGELOG
- [X] T024 [US1] `packages/elements/src/control.ts` (button mode only): one inner `<button type="button">` with part `control` in an open shadow root with `delegatesFocus`; `click()` forwarded to the inner control; the host guard (`click` and `auxclick` listeners registered in the constructor, stopping events whose composed path misses the inner control and every event while not available; R-06, decision 23); `controlStyles` (focus ring longhands, forced colours per R-12's table, disabled look, `.icon-slot[hidden]`)
- [X] T025 [US1] `packages/elements/src/ocelle-button.ts`: `static override properties` (`variant`, `size`, `flush`, `ground` reflected; `label` not reflected; `disabled` reflected), `@tagname`/`@default`/descriptions, `:host { display: inline-grid }` with the inner control the single stretched item, the `ocelle-button-activate` dispatch from a `click` listener on the inner control registered after the guard (`bubbles`, `composed`, `cancelable`, `detail: {}`; a cancelled event → `preventDefault()` on the `click`; decision 26) with its `@fires` JSDoc and `detail` type for the manifest, `:host([hidden])`, variant rules inside `@media not (forced-colors: active)`, the state and ground tables of R-08 items 3, 4, 4a, 5, sizes of R-09, `flush` start alignment, `font: inherit`, the icon slot by mission 005's convention, `define("ocelle-button", …)`, `HTMLElementTagNameMap`; `src/index.ts` re-export
- [X] T026 [US1] `packages/elements/package.json` export `./ocelle-button.js`; regenerate and commit `packages/elements/custom-elements.json`
- [X] T027 [US1] `packages/elements/README.md` and `packages/elements/CHANGELOG.md` with the statements of T020
- [X] T028 [US1] `storybook/stories/button.stories.ts` with the stories of T021; `fail-empty-index` tree gains an empty `button.stories.ts`; `fail-token-changed` extended with the measured light story-themes; baselines `storybook/baselines/elements-ocelle-button--*.{light,dark}.png` by `pnpm run visual:update`
- [X] T029 [US1] Run each plant of T015 to T018 once and record in `specs/012-button-action-row/reviews/phase-2/plants.md`; run `gate:manifest`, `gate:style-lint`, `gate:contrast`, `gate:csp`, `gate:prefix`, `gate:pins`, `gate:test-lint`, `gate:storybook-build`, `gate:visual`, `gate:axe`, then `gate:plants` and `gate:mutation -- --base <phase base>` (one at a time)

**Checkpoint**: `tdd-check.sh 2` reports `pass`; the button alone serves #14's copy control.

---

## Phase 3: User Story 2 - Link mode and ARIA passthrough (Priority: P2)

**Goal**: US2-1 to US2-14 and this phase's rows of § Edge cases and plan decisions; FR-002 (link mode, and the same
look as button mode), FR-003 (disabled link), FR-004 to FR-006, FR-009 (moved attributes, `aria-haspopup`,
`aria-pressed`, `title`, mirrors, custom states), FR-021, FR-023 (link mode), FR-053; US1-11's link-mode half; SC-006
(decision 28); engine floor Chromium 135 and WebKit 17.4; link stories with baselines and axe.

**Independent Test**: `<ocelle-button href="/projects">` on the fixture is one `link` node that navigates on click and
Enter and opens a new tab on Ctrl-click; `aria-expanded="true"` set on the host is gone from the host and reported on
the inner control; `aria-controls` relates to the light-DOM panel; a clone keeps the moved name.

### Spike (first)

- [X] T030 [US2] Spike, recorded in `specs/012-button-action-row/reviews/phase-3/spike.md`: element reflection (`ariaControlsElements`, `ariaLabelledByElements`, `ariaDescribedByElements`) on this Chromium and the README floor claims (Chromium 135, WebKit 16.4 for reflection, 17.4 for custom states, from release notes or compat data); moving an attribute present before upgrade and set later; whether analyzer 0.11.0 emits `cssStates` from JSDoc

### Tests (red, one commit)

- [X] T031 [P] [US2] `packages/elements/test/scenarios/link.ts`: US2-1 to US2-14 as shared bodies; link bodies twice (in-process sink records; fixture navigation and new tabs); clearing by `""`, whitespace-only and `"false"`, `removeAttribute` after a move a no-op; `aria-haspopup`, `aria-pressed`, `title` moved; custom states `:state(expanded)`, `:state(pressed)`, `:state(current)` on the host; mirrors `data-ocelle-moved-*` (US2-13: `outerHTML` and `cloneNode(true)` keep the name; morph case: the test applies idiomorph's attribute sync with the unchanged server markup then copies through `innerHTML`; a removed and an overwritten mirror read their stored values again); several ids in order, missing skipped; referenced element added later; `aria-current` any value with no mark; the `href` edge cases; US2-1's activate event (sink and fixture bodies: one `ocelle-button-activate` before the navigation on click and Enter; `preventNext("ocelle-button-activate")` → the sink records `defaultPrevented` true and the fixture no navigation; Ctrl, Meta, Shift and Alt clicks → the `click` delivered, no activate event, the sink records `defaultPrevented` false and the fixture the browser's own modifier handling (on Chromium on Linux Ctrl, Shift and Alt a new tab, a new window or a download with the page left as it is, Meta a navigation of the current tab; operator decision at phase 3); middle click → no activate event); the link-mode half of US1-11 and FR-002's same look: for each variant, idle, hover, active, focus and disabled, the link-mode control's computed colours, border and padding equal those of its button-mode twin, and in forced colours text and border `LinkText`, hover and focus `Highlight`, disabled `GrayText`; plants: no mirror, mirror not restored, `title` not moved, activate on a modifier click, link mode drops the variant rules
- [X] T031a [US2] `packages/elements/test/scenarios/link.ts` (after T031, same file): the three consumer compositions of SC-006 (decision 28): #12's breadcrumb item (`flush`, `size="compact"`, `href`, `aria-current="page"`), #12's top-bar menu button (`variant="quiet"`, `ground="chrome"`, `aria-haspopup="menu"`, `aria-expanded="false"`, in a container on `--ocelle-color-chrome`) and #14's copy control (a flush button with an icon and `label`), as markup constants that `readme.test.ts` (T033) also reads, rendered with no style that targets the elements: roles, names, `aria-current`, `aria-haspopup`, `aria-expanded` (then `"true"` and `:state(expanded)`), target sizes (compact ≥ 24 px, default ≥ 44 px by hand), the breadcrumb label's inline start within 0.5 px of a heading's, the menu button's `chrome-ink` label and `chrome-muted` border
- [X] T032 [P] [US2] `packages/elements/test/control.test.ts` (link part): the mode table (empty, whitespace, relative, `javascript:`, `JavaScript:`, `JAVASCRIPT:x`, `java\tscript:x`, `\u0001javascript:x`, ` javascript:x` → button; `http://[` → button, no error; `data:text/html,x` → link with `href` as written); disabled link without `href`, `role="link"`, `aria-disabled`, not focusable; `noopener` when `target="_blank"` and no `rel`; the move, references in document and shadow root, other shadow root unresolved, name order `aria-labelledby` > `aria-label` > `label` > content; mirrors restored with own writes ignored
- [X] T033 [P] [US2] `packages/elements/test/button.test.ts` and `test/browser/button.test.ts` run `link.ts`; `packages/elements/test/node/manifest.test.ts`: every moved attribute and `title` declared with a description, each mirror declared, custom states, and the normaliser keeps a declared standard attribute and drops an undeclared one (R-15); `test/node/readme.test.ts`: conventions 2, 4 (per-stack recipes, mirrors, custom states, restore after a morph), 6, the `data:`/`vbscript:` note, 005's elements keep their `aria-label` rule, engines Chromium 135 and WebKit 17.4 with the feature behind each figure, the htmx morph sentence, the link-mode activate event (cancel → no navigation, none on a modifier click), the `ocelle-button` section's markup of the three consumer compositions equal to T031a's constants (plant: a README snippet that differs)
- [X] T034 [P] [US2] Story tests: `elements-stories.test.ts` gains the link stories (link, link disabled, `target="_blank"`, expanded, current, pressed); the four pinned story counts

### Implementation (green)

- [X] T035 [US2] `packages/elements/src/control.ts`: link mode by the URL parser (unparseable → button), `javascript:` rule, inner `<a>`; disabled link without `href`; `noopener`; the attribute move for the lists of FR-009 (with `aria-haspopup`, `aria-pressed`, `title`), clearing, removal a no-op, mirrors `data-ocelle-moved-<attribute>` read at upgrade and restored when removed or changed (own writes ignored), references by element reflection resolved in `getRootNode()`, custom states through `ElementInternals.states`
- [X] T036 [US2] `packages/elements/src/ocelle-button.ts`: `href`, `target`, `rel`, `download` reflected; observed moved attributes and mirrors; in link mode the activate event skips clicks with `ctrlKey`, `metaKey`, `shiftKey` or `altKey`, and its cancel prevents the navigation (decision 26)
- [X] T037 [US2] `packages/elements/scripts/manifest.ts` (normaliser keeps declared standard attributes); JSDoc for the moved attributes, mirrors and custom states; regenerate `custom-elements.json`
- [X] T038 [US2] `packages/elements/README.md` and `CHANGELOG.md` with the statements of T033, including the three consumer compositions' markup (decision 28)
- [X] T039 [US2] `storybook/stories/button.stories.ts` link stories; baselines; `fail-token-changed` extended
- [X] T040 [US2] Plants of T031 to T033 recorded in `reviews/phase-3/plants.md`; gates as T029, then plants and mutation

**Checkpoint**: `tdd-check.sh 3` reports `pass`; with phase 2 this serves #12's `href` crumbs.

---

## Phase 4: User Story 3 - Busy (Priority: P3)

**Goal**: US3-1 to US3-11 and this phase's rows of § Edge cases and plan decisions; FR-003 (unavailable), FR-015 to
FR-017; tokens `motion-spin` and `motion-turn`; 002's brand-rules rule (f) following the generator (plan decision 29);
busy stories with baselines and axe.

**Independent Test**: a focused button set `busy` keeps focus, reports `aria-busy` and `aria-disabled`, shows a spinner
in the icon place without changing size, sends no click by pointer, Enter, Space or a restyled-host click, and the
spinner is still under reduced motion and ends within 4.8 s.

### Tests (red, one commit)

- [X] T041 [P] [US3] `packages/elements/test/scenarios/busy.ts`: US3-1 to US3-11 as shared bodies; spinner box replaces the icon (equal button box) or sits before the label without intersecting it; `animation-name` `none` under reduced motion with the arc still painted; the animation's duration 4.8 s and iteration count giving six turns; forced colours `currentColor` system colour; busy link (no `href`, `tabindex="0"`, focusable, `role="link"`, decision 9) not activated by plain, Ctrl, Meta, Shift, Alt or middle click or Enter (sink and fixture bodies); both `disabled` and `busy`; `busy` removed while the pointer is down; `host.click()` while busy; no `ocelle-button-activate` while busy by any of these paths, and one with the `click` after `busy` is removed (US3-1, decision 26); stretched (US3-10) and restyled (US3-11) busy host; plants: guard limited to unavailable, spinner over the label, `animation: none` rule removed
- [X] T042 [P] [US3] `packages/tokens/test/expected.ts` (`motion-spin` 800 ms, 0 ms under reduced motion; `motion-turn` `1turn`), `test/browser/values.test.ts`, `packages/tokens/test/generate.test.ts` (the reduced-motion block holds exactly `motion-fast`, `motion-base`, `motion-spin`: a stricter replacement of "exactly two", reason recorded in `reviews/phase-4/notes.md`), tokens README and CHANGELOG tests; `gate:brand-rules` accepts this block only after T045a (plan decision 29)
- [X] T042a [P] [US3] `gates/test/brand-rules.test.ts`, rule (f) (plan decision 29, operator decision at phase 4, option (a)): the block must set exactly every `motion` token whose source value is a duration to `0ms`, read from the token source; a source with `motion-spin` and a block with `--ocelle-motion-spin: 0ms` passes; the same source with the `motion-spin` line dropped gives one `reduced-motion` finding at the block's line (`does not set --ocelle-motion-spin to 0ms`); `--ocelle-motion-turn` in the block is reported; the existing (f) cases (`motion-fast` at 60ms, `easing-standard` in the block, `motion-base` missing, spacing, no block) kept with the new message naming the motion durations instead of two names; `gates/test/gates-readme.test.ts` requires `f-motion-spin-missing` in the `brand-rules` row; any pinned brand-rules plant count in `gates/test/integration/` changed first
- [X] T043 [P] [US3] `packages/elements/test/button.test.ts` and `test/browser/button.test.ts` run `busy.ts` (with `reducedMotion`); `test/node/readme.test.ts`: busy on the button is unavailable, the 4.8 s stop, the 833 ms limit for an override of `--ocelle-motion-spin`
- [X] T044 [P] [US3] Story tests: `elements-stories.test.ts` gains the busy stories (busy, busy with icon, busy link, busy compact); the four pinned story counts

### Implementation (green)

- [X] T045 [US3] `packages/tokens/src/source.ts` (`motion-spin`, `motion-turn`) and `packages/tokens/src/generate.ts` (reduced-motion block from the motion durations); tokens README and CHANGELOG
- [X] T045a [US3] `gates/bin/brand-rules.ts` rule (f) over T042a: the expected set is every `motion` record of the token source whose value is a duration (`ms`), not the `reducedMotion` name list, and the messages name the motion durations; new fail plant `gates/plants/brand-rules/f-motion-spin-missing/` (`plant.json`, `delta.json` with `generator: "wrapped"`, a `tree/packages/tokens/src/generate.ts` wrapper as `f-motion-not-zero`'s that drops `    --ocelle-motion-spin: 0ms;\n`; one `reduced-motion` finding at the block); `f-motion-not-zero` kept unchanged; the `gates/README.md` `brand-rules` row records that 012 changed 002's rule (f) to every motion duration at 0ms and lists `f-motion-spin-missing`
- [X] T046 [US3] `packages/elements/src/spinner.ts`: inline SVG arc, `stroke="currentColor"`, `aria-hidden="true"`, rotation `calc(var(--ocelle-motion-turn) * 6)` over `calc(var(--ocelle-motion-spin) * 6)`, ending still; `animation: none` under `prefers-reduced-motion: reduce`
- [X] T047 [US3] `packages/elements/src/control.ts`: the unavailable state (guard on `click` and `auxclick`, `aria-disabled`, unavailable link without `href` and with `tabindex="0"`); `packages/elements/src/ocelle-button.ts`: `busy` reflected, `aria-busy`, the icon wrapper hidden and the spinner in its place, `disabled` wins
- [X] T048 [US3] README, CHANGELOG, busy stories and baselines; `custom-elements.json` regenerated
- [X] T049 [US3] Plants recorded in `reviews/phase-4/plants.md` (with `f-motion-not-zero` and `f-motion-spin-missing` run once each, each giving exactly its finding); gates as T029 (with `gate:contrast` unchanged) and `gate:brand-rules` (0 findings on the phase 4 tree), then plants and mutation, `gates/bin/brand-rules.ts` in the default-config scope beside the tokens source (expect Timeout mutants on the spinner and guard: reported, pass, listed in the review, R-14)

**Checkpoint**: `tdd-check.sh 4` reports `pass`.

---

## Phase 5: User Story 4 - `ocelle-action-row` (Priority: P4)

**Goal**: US4-1 to US4-18 (US4-18 the row-layout wrap, check-3 note SPEC-3-04) and this phase's rows of § Edge cases and plan
decisions; FR-030 to FR-036, FR-038 (row layout part), FR-040 to FR-042; token `focus-offset-inset` and the
`color-ink-soft` grounds; row stories with baselines and axe.

**Independent Test**: a row on the fixture is one `button` node named exactly its title, described by its description
then tags; click, Enter and Space each give one `ocelle-action-row-activate` with `{ rowId }`, bubbling, composed,
cancelable; it is at least `target-min` high, never 0 wide, and wraps its tags-and-trailing group as a whole.

### Spike (first)

- [X] T049a [US4] Spike, scratch files only, recorded in `specs/012-button-action-row/reviews/phase-5/spike.md`, before the red commit (plan decision 30): a scratch row on decision 30's shadow structure (data-model § `ocelle-action-row`, Shadow structure), in button and link mode, each layout, both presentations: (1) the hit layer's box equals the host's box in both axes in a two-column grid of cards and in a stretched `display: flex` row (a `<button>` and an `<a>` whose absolute child takes the layout wrapper as containing block); (2) a pointer click at the centre of the description, of a tag and of the trailing icon has the inner control in its composed path and reaches it, and `:hover` matches the inner control there; (3) the CDP AX tree with the wrappers `aria-hidden`: one node named "Mission 42", description "Due Friday Blocked Design", no node for the description, a tag or the trailing icon; (4) on a flush row (block padding `--ocelle-space-1`) no sibling or title box reaches the focus ring's block bands (2 to 5 px in), and on every row no sibling or title box enters the inline padding that holds the ring's inline bands and the bar; (5) axe (006's rule selection) on the row with all slots, plain and hovered, light and dark, default and `ground="chrome"`: 0 serious or critical violations (no `label-content-name-mismatch`, no `aria-hidden-focus`) and no `color-contrast` incomplete result for the title, description and tag text over the layer's surface (FR-052; US5-4's current row is measured in T060). Any result against decision 30 is a stop-and-ask. Result (spike.md): (1) to (4) hold; (5) failed with the layer at `z-index: -1` (a serious `color-contrast` incomplete, `bgOverlap`, on every title, description and tag text) and holds with the positive stacking (layer `z-index: 0`, content `z-index: 1`) and the forced-colours `Canvas` surface, accepted by the operator (plan decision 30's note of 2026-11-16)

### Tests (red, one commit)

- [X] T050 [P] [US4] `packages/elements/test/scenarios/action-row.ts`: US4-1 to US4-18 as shared bodies; the event's flags, `detail`, one serial per activation from pointer, Enter and Space, `rowId` `""` when absent; name exactly the title with description and tags slotted, from the inner control's content, and `axe()` empty on every row with description or tag text (no `label-content-name-mismatch`; plant: the description wrapper back inside the inner control); the description, tags and trailing content in no AX node of their own (`aria-hidden` siblings, decision 30); description = description then tags text, host `aria-describedby` wins; empty and whitespace-only `<span slot="description">` (description stays the moved `title`, then "Due Friday" after text is written; the empty span takes no space and adds no gap; plants: raw assigned elements referenced, no `MutationObserver`, wrappers hidden from the raw assigned elements); `busy` does not block activation; flush and default presentations; minimum height in each presentation and layout; min-content width in shrink-wrapping containers; long unbreakable title (`overflow-wrap: anywhere`) stays within its container; row-layout wrap of the tags-and-trailing group (US4-18: one line when wide; when narrower, the tags and trailing boxes start below the first line and share one line, the icon, title and description stay on the first); hover tables incl. the flush exception list (`neutral-bg` in dark included); the node count of US4-16 as in US1-1 (one node with a role or a name, an unnamed host `generic` allowed); inside focus ring four sides on a non-current row (plant: no ring); `ground` incl. `chrome` (US4-17: the description and tags colours read on their own wrappers, beside the title's; plant: sibling colours removed); `host.click()`; stretched row US4-15 (the hit layer's box equals the host's box, read from the layer, not the inner control; plant: the layer positioned against the inner control) and US4-15's clicks at the centre of the description, a tag and the trailing icon in each layout, one event each (plant: siblings without `pointer-events: none`); surface, border, hover and ring read from the hit layer; mirrors and `title` on the row (with the morph step); empty title with an icon → `axe()` exactly `button-name`; unknown `layout`, `presentation`
- [X] T051 [P] [US4] `packages/elements/test/action-row.test.ts` and `test/browser/action-row.test.ts` over T050; `packages/elements/test/entry-action-row.test.ts`; `entry-root.test.ts`, `exports.test.ts` extended (`OcelleActionRow`)
- [X] T052 [P] [US4] `packages/tokens/test/expected.ts` (`focus-offset-inset` = `calc(-1 * (var(--ocelle-focus-offset) + var(--ocelle-focus-width)))`, −5 px), browser values test; contrast counts for `color-ink-soft` += state grounds and the row's hover-border and `chrome` rows (R-08 item 2); tokens README and CHANGELOG tests
- [X] T053 [P] [US4] `test/build/build.test.ts`, `test/build/pack.test.ts`, `test/node/manifest.test.ts` (`ocelle-action-row`: properties of FR-030, slots, parts `control`, `title`, `description`, `tags`, event with `detail` type, moved attributes, mirrors), `test/node/readme.test.ts` (the `ocelle-action-row` section, row conventions, CHANGELOG; the sentences of T057 on interactive slotted content, `aria-hidden-focus`, slotted `pointer-events` and `::part(control)`)
- [X] T054 [P] [US4] Story tests: `elements-stories.test.ts` gains the row stories (default, flush, card-free row with all slots, busy, hover default and flush, rtl, chrome; `ground` `accent-low`, `inset`, `hover-bg` and `state` on their grounds, FR-042; a focused non-current row by the method T014 selects, decision 27); the four pinned story counts; every row story with description or tag text (at least "card-free row with all slots", in both themes) gives 0 serious or critical axe results in `gate:axe` (decision 30)

### Implementation (green)

- [X] T055 [US4] `packages/tokens/src/source.ts` (`focus-offset-inset`; `color-ink-soft` grounds) and `pairs.json` rows (figures from `gate:contrast --print`); tokens README and CHANGELOG
- [X] T056 [US4] `packages/elements/src/ocelle-action-row.ts`: properties of data-model § `ocelle-action-row`; the shadow structure of data-model § Shadow structure (plan decision 30): `:host { display: grid; min-inline-size: min-content }` with the layout wrapper (`position: relative; z-index: 0`, a stacking context, no `isolation: isolate`) the single stretched item; the inner control holds the icon and the title only; its hit layer (`position: absolute; inset: 0` against the layout wrapper, `z-index: 0`) draws the surface (`background-color: Canvas` under forced colours), the default row's border, the hover and the inside focus ring, beneath the icon wrapper, the title and the sibling wrappers, which are `position: relative; z-index: 1` (positive stacking: a layer at `z-index: -1` drew axe's `color-contrast` incomplete, `bgOverlap`, in the T049a spike; plan decision 30's note of 2026-11-16); the description, tags and trailing wrappers are siblings of the inner control in the same flex-wrap layout, `aria-hidden="true"` and `pointer-events: none`, each with its own ink keyed on the host's state and the mode (`color-ink-soft` description and tags, `chrome-muted` on chrome, `disabled-ink` when unavailable, R-12's forced-colours text; R-10 § Sibling ink); button mode and link mode from `control.ts`; the activate event dispatched on an available click (Enter and Space through the native button); the name from the inner control's content (no internal reference); description elements from slots with non-whitespace text (`slotchange` and a `MutationObserver` on light children); wrappers hidden when empty; presentations, row layout and wrap, `overflow-wrap: anywhere` on title and description, minimum height on the layout wrapper, inline padding `space-3` (plus the border width on a default row), hover with `color-hover-border`, `ground` incl. `chrome`, inside focus ring with `--ocelle-focus-offset-inset`; `define`, `HTMLElementTagNameMap`; `src/index.ts` re-export
- [X] T057 [US4] `packages/elements/package.json` export `./ocelle-action-row.js`; `custom-elements.json` regenerated; README and CHANGELOG; the README's row section states that the description, tags and trailing content are shown beside the row's control and hidden from assistive technology as content (the description and tags reach it as the accessible description), that interactive content in the `description`, `tags` or `trailing` slot is unsupported and would also draw axe's `aria-hidden-focus`, that slotted content setting its own `pointer-events` takes clicks the row ignores (host guard), and that the part `control` is the icon and title control, not the row's surface (plan decision 30)
- [X] T058 [US4] `storybook/stories/action-row.stories.ts` with the stories of T054, on decision 30's structure (their axe runs, the "card-free row with all slots" story included, at 0 serious or critical findings); `fail-empty-index` tree gains an empty `action-row.stories.ts`; `fail-token-changed` extended; baselines
- [X] T059 [US4] Plants recorded in `reviews/phase-5/plants.md`; gates as T029, then plants and mutation

**Checkpoint**: `tdd-check.sh 5` reports `pass`.

---

## Phase 6: User Story 5 - Row states and the card layout (Priority: P5)

**Goal**: US5-1 to US5-12 and this phase's rows of § Edge cases and plan decisions; FR-033 (link rows), FR-037,
FR-038 (card), FR-039, FR-041; decisions 9, 13, 16, 21, 23 on rows; stories with baselines and axe; the CI run at the
full story count.

**Independent Test**: a link row dispatches its event before navigating and a listener's `preventDefault()` stops the
navigation; modifier, Alt and middle clicks dispatch nothing and keep the browser's default; `current="page"` reports
`aria-current="page"` and draws the bar apart from the focus ring; an unavailable row stays focusable and does
nothing.

### Spike (first)

- [ ] T060 [US5] Spike, recorded in `specs/012-button-action-row/reviews/phase-6/spike.md`: for button-mode and link-mode rows under the page rules `display: block`, `display: flex; width: 100%` and `display: block; height: 90px`, list by hand which test points lie outside the row's hit layer's box (decisions 23 and 30); the bar's measured place (7 to 10 px from the border edge, drawn by the hit layer) on a focused current row in ltr and rtl, clear of the title and every sibling box; the card layout on decision 30's model (hit layer box equals the host's in a grid of cards, a click on the description and on a tag passes through the inner control); axe `color-contrast` on a current row with all slots (plain, hovered, focused, unavailable; light and dark; default and `ground="chrome"`): no violation and no incomplete result for the title, description and tag text over the hit layer, on decision 30's positive stacking with the bar inside the layer (US5-4, FR-052); any result against decision 30 is a stop-and-ask

### Tests (red, one commit)

- [ ] T061 [P] [US5] `packages/elements/test/scenarios/row-states.ts`: US5-1 to US5-12 as shared bodies; US5-1's node count as in US1-1 (one node with a role or a name, an unnamed host `generic` allowed); event before navigation and `preventDefault()` cancelling it (sink and fixture bodies); Ctrl, Meta, Shift, Alt and middle clicks: no event, default kept (decision 13), the fixture asserting the browser's own modifier handling as in T031 (a Meta-click navigates the current tab on Chromium on Linux; operator decision at phase 3); `current` `page`/`true` and other values absent; the current mark with hover precedence, on chrome (`chrome-hover` surface), forced colours (surface and bar read from the hit layer); axe on a current row with description and tags: no `color-contrast` incomplete result (US5-4, decision 30); ring band, gap and bar read apart on a focused current row in ltr and rtl (plants: bar at `inset-inline-start: 0`; bar at the ring's inner edge); `unavailable` on button and link rows (no `href`, `tabindex="0"`, decision 9), not activated by any click or key (a click on the description and on a tag included), disabled ink and `GrayText` on the title and on the description and tags wrappers (US5-7, decision 30; plant: sibling colours removed); `unavailable` with `current` (bar in disabled ink, decision 16); `busy` with `unavailable`; `current` on a button-mode row; card layout on decision 30's model (title line with trailing at its end, description, tags wrapping only between tags, a tag wider than the card may break; one event for a click on the description or a tag), title gap `space-1` and part `title`, `arrow-end` in the trailing slot mirrored under rtl; stretched unavailable row and restyled rows US5-6 and US5-12 from the spike's list, the outside points asserted against the hit layer's box (plant: no host listener)
- [ ] T062 [P] [US5] `packages/elements/test/action-row.test.ts` and `test/browser/action-row.test.ts` run `row-states.ts`; `test/node/manifest.test.ts` and `readme.test.ts` for `current`, `unavailable`, `layout="card"` and the card README lines
- [ ] T063 [P] [US5] Story tests: `elements-stories.test.ts` gains the state stories (current page, current true, current hovered, current focused (by the method T014 selects), unavailable, unavailable current, link row, card, card with many tags, card rtl, chrome current); the four pinned story counts; the current and card stories with description or tag text give 0 serious or critical axe results (decision 30)

### Implementation (green)

- [ ] T064 [US5] `packages/elements/src/ocelle-action-row.ts`: link-row activation order and `preventDefault` on the originating click, modifier and middle clicks ignored, `current` with `aria-current` and the bar (R-12's method: a `span.bar` inside the hit layer, 7 to 10 px from the border edge, in the inline padding clear of every sibling; the current surface on the hit layer), `unavailable` via `control.ts` (disabled ink and `GrayText` on the sibling wrappers too), card layout on decision 30's model (the layout wrapper as a grid, the group elements `display: contents`, the same hit layer, the same positive stacking and `aria-hidden` siblings) and tags wrapping, part `title`
- [ ] T065 [US5] README, CHANGELOG, `custom-elements.json` regenerated; state and card stories of T063 and baselines; `fail-token-changed` extended
- [ ] T066 [US5] Plants recorded in `reviews/phase-6/plants.md`; gates as T029, then plants and mutation
- [ ] T067 [US5] Push the branch and record in `reviews/phase-6/ci-run.md` a CI run at the full story count (about 72) with every Plants shard's time (each under 10 minutes; about 588 s expected by 006's model, accepted by the operator decision at phase 2) and the run's total (R-13); a shard at or over 10 minutes is a stop-and-ask
- [ ] T068 [US5] `gates/README.md` and the Complexity Tracking row of `specs/006-storybook-workbench/plan.md`: correct T011's figures to the story count phase 6 reaches (about 72), the headroom left to the split count of 76 (about 4 stories) and the Plants runner-hours per CI run (about 11.9), and record in `reviews/phase-6/notes.md` the operator's request to open, when this feature lands, a triage record for a plant design whose shard time does not grow with the story count (operator decision at phase 2, plan decision 15, research R-13)

**Checkpoint**: `tdd-check.sh 6` reports `pass`.

---

## Dependencies & Execution Order

- Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5 → Phase 6; each needs the previous (the harness, then
  `control.ts` grows: button mode, link mode and the move, unavailable, the row, row states).
- Within a phase: spike first where there is one; the red commit holds every test task of the phase (one `red.sh`
  record); implementation in the listed order; the plants-and-gates task last.
- Phase 2 alone serves #14's copy control; #12 needs phase 3 as well.

## Parallel Opportunities

- Within each red commit, the test tasks marked [P] touch different files and can be written in parallel.
- Token tasks (T019, T042, T052) are independent of the element test files of their phase.
- Heavy runs (browser suites, visual, mutation, plants) are never parallel in this container.

## Implementation Strategy

MVP is phase 2 (the button) on top of phase 1. Each later phase is a complete, reviewable increment; fold each phase
after approval. The pill tag, status indicator and metric are out of this mission (the later status mission builds the
pill tag's tooltip on #16's `ocelle-tooltip` and needs #16 merged first).
