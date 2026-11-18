# Tasks: Action Controls, `ocelle-button` and `ocelle-action-row`

**Input**: design documents in `specs/012-button-action-row/`, as approved at the plan gate on 2026-11-13 after three
plan-squad rounds (`reviews/plan/round-1..3/`), with the analysis fixes of 2026-11-14 (`reviews/analysis/fixes-1.md`;
added tasks carry suffixed IDs, e.g. T031a, and no task is renumbered):
- spec.md (FR-001 to FR-023, FR-030 to FR-042, FR-050 to FR-056, SC-001 to SC-007; US1-1..19, US2-1..14, US3-1..11,
  US4-1..18, US5-1..12; edge cases);
- plan.md, with decisions 1 to 28 and the phase list, decision 29 (operator decision at phase 4: 002's
  brand-rules rule (f) follows the generator; added tasks T042a, T045a; amended at landing by the operator rounds of
  2026-11-17, phase 4 round 2: only a `-delay` motion token may carry `delay: true`, every other motion duration a
  literal `ms` value; added tasks T049b to T049f, and phase 6 round 2's T069 to T072) and decision 30 (operator decisions at phase
  5, 2026-11-15: the row's description, tags and trailing content are `aria-hidden` siblings of the inner control,
  whose hit layer fills the host; added task T049a, and T050, T053, T054, T056 to T058, T060, T061, T063 and T064
  revised) and decision 31 (operator decisions at phase 6, 2026-11-16: the sibling wrappers carry `aria-disabled`
  while the row is unavailable, and an unavailable current row keeps its current surface; T060, T061, T063 and T064
  revised) and decision 32 (operator decision at phase 6, 2026-11-16: `:state(pressed)` is button mode only; added
  tasks T061a and T064a, T066 revised) and decision 33 (operator decision at landing, 2026-11-18, phase 2 round 5:
  the slot convention's label wrapper takes part in baseline alignment; added tasks T029a to T029e);
- research.md, R-01 to R-16 (R-10 § Label baseline added by decision 33);
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

### Fix round 4 (operator round from the landing pass: O3-01)

On 2026-11-16 mission 018 reported, through the orchestrator, that 005's `.icon-row { align-items: flex-start }` may
put a one-line `ocelle-button` above the surrounding text baseline; the operator chose to measure it at landing. The
/ocelle-land pass measured it on 2026-11-18 (4.6 to 6.2 px above the baseline; a native `<button>` sits on it), and
the operator folded the fix into this pull request, recorded as phase 2 round 5 (`reviews/phase-2/round-5.md`; the
question's "phase 1" was the orchestrator's slip for the button's phase, corrected there). Verbatim "Fold the fix now
(Recommended)": "Record an operator round on phase 1 (the button). The planner adds the task, implementer-ivan writes
a failing baseline test and adds the rule to the shared convention in icon-slot.ts, regenerating any visual baseline
that moves under docker. Then a review round and a landing check. That's one more CI run, and 018 starts from the
fixed convention." The code it changes is 005's convention as this phase amended it (T022, T025; R-10). The rule, as
plan decision 33 states it: the convention's label wrapper, `<span class="label">` around the default slot, is part of
the convention, and `iconSlotStyles` sets `.icon-row > .label { align-self: baseline; }`, so the row's (and the
host's) baseline is the label's first line while every position inside the control stays where it is. This is a
behaviour fix, so it is test-first; phase 2 already has fix-1 to fix-3, so the label is fix-4, reviewed as phase 2
round 6, then a landing check. Round 5's `size="sm"` row is the default size measured again (the sizes are `default`
and `compact`); the tests use `compact`.

**Red (one commit)**

- [ ] T029a [P] [US1] O3-01, test-first, the button: in `packages/elements/test/scenarios/button.ts` (shared bodies, run in-process by `packages/elements/test/button.test.ts` and on the strict-CSP fixture by `packages/elements/test/browser/button.test.ts`), a scenario "a one-line button in a line of text sits on the text's baseline": body text at 16 px, a `<p>` holding the text "Text", a zero-size `inline-block` marker on the paragraph's baseline, an `ocelle-button` labelled "Save" whose light-DOM label ends with a second zero-size `inline-block` marker, and the text "after" (round 5's method); the label marker's block-start equals the paragraph marker's within 0.5 px (read with `box()`), for each of: the default button; `size="compact"`; an `ocelle-icon` in the `icon` slot; `flush`; `variant="quiet" flush`; link mode (`href`); and busy. In the same test, for each case (the positive it guards): the icon wrapper's (`.icon-slot`, or the spinner while busy) and the label's (`.label`) block-starts inside the host are equal within 0.5 px, so the fix may not move the items inside the row (plant: `.icon-row { align-items: baseline }` in place of the label rule). Expected values are the markers' and wrappers' own positions, never a figure read from the rule under test.
- [ ] T029b [P] [US1] O3-01, test-first, the convention and its text:
  - `packages/elements/test/scenarios/slot.ts` (run by `packages/elements/test/slot.test.ts` and `packages/elements/test/browser/slot.test.ts`): the convention's test host (`test/fixtures/test-host.ts`, which already renders `<span class="label">`) in a line of text, with and without a slotted icon, has its label marker on the paragraph's baseline within 0.5 px, paired with the same block-start check as T029a. Only test files change; if the test host needs a change to hold the case, that change is in this commit.
  - `packages/elements/test/node/readme.test.ts`: the § Slot convention text names the label wrapper (`<span class="label">` around the default slot) as part of the convention and says that the label takes part in baseline alignment, so a one-line control in a line of text sits on the text's baseline (lines written by hand); `packages/elements/test/node/changelog.test.ts`: one CHANGELOG line that a one-line control on the slot convention, such as `ocelle-button`, now sits on the surrounding text's baseline.
- [ ] T029c [US1] Commit T029a and T029b alone (`test(012-button-action-row): phase 2 fix-4 red — O3-01`), signed off. Then run `.specify/extensions/story/scripts/red.sh 2 fix-4`. Confirm every new failure is an assertion failure against the current code (the label marker 4.6 to 6.2 px above the paragraph's, the README and CHANGELOG lines missing), not a load error. The block-start check passes at once (positions are already equal); report that in the round's notes, not forced red; its plant proves it.

**Green**

- [ ] T029d [US1] O3-01, over T029a and T029b:
  - `packages/elements/src/icon-slot.ts`: `iconSlotStyles` gains `.icon-row > .label { align-self: baseline; }`, nothing else in it changes; the header comment names the label wrapper (`<span class="label">` around the default slot, between the icon and trailing wrappers) as part of the convention and says why the rule is there (the row is aligned to the start, so without it no item takes part in baseline alignment and the row's baseline would be the icon wrapper's; with it the row's, and the host's, baseline is the label's first line and no position inside the row moves; 012 plan decision 33, `reviews/phase-2/round-5.md` O3-01).
  - `packages/elements/src/ocelle-button.ts`: no change expected (it renders `<span class="label">` inside `.icon-row`); if it needs one, it is stated in the notes.
  - `packages/elements/README.md` § Slot convention: the opening paragraph names the label wrapper, `<span class="label">` around the default slot, as part of the markup, and the **Alignment** bullet adds that the label takes part in baseline alignment, so the control's baseline is its label's first line and a one-line control in a line of text sits on the text's baseline; `packages/elements/CHANGELOG.md` the line of T029b. T029a and T029b now pass.
  - `ocelle-action-row` shares the convention's stylesheet but does not render `.icon-row` (its inner control has its own flex rules, its label wrapper is `.title`, and the host is block-level), so the rule does not reach it: check that in `packages/elements/src/ocelle-action-row.ts` and state it in the notes; the row's scenarios (`action-row.ts`, `row-states.ts`, both harnesses) pass unchanged and no row baseline moves. A row change, or a row baseline that moves, is a stop-and-ask.
- [ ] T029e [US1] Run the checks:
  - the plant of T029a and T029b once (`.icon-row { align-items: baseline }` in place of the label rule: the block-start checks fail, the baseline checks pass), recorded in `reviews/phase-2/plants.md` under "Fix round 4";
  - `pnpm run gate:visual` in the pinned container (docker); every story-theme reported `differs` must differ only by the whole control's offset within its line (no pixel inside a control changes); a change inside a control is a stop-and-ask. Then regenerate only those with `pnpm run visual:update` in the same container (it writes only new or changed baselines), and any visual plant whose own baselines move (for example `fail-token-changed`'s button story-themes) with `pnpm run visual:update -- --plant visual/<name>`; run `gate:visual` again (no finding). List every baseline that moved, and that none of `elements-ocelle-action-row--*` did, in `reviews/phase-2/notes.md`, with the reason for the pull request's description (constitution V);
  - `pnpm test`, the `elements` and `elements-browser` projects (button, link, busy, slot, action-row and row-states included), `pnpm run gate:typecheck`, `gate:lint`, `gate:style-lint`, `gate:test-lint`, `gate:csp`, `gate:prefix`, `gate:manifest` (no change), `gate:storybook-build` and `gate:axe`;
  - `pnpm run gate:mutation -- --base <T029c red commit> --files packages/elements/src/icon-slot.ts`, alone, before the commit: no survivor on the changed lines (each record reasoned, R-14).

  Record T029a to T029d in `reviews/phase-2/notes.md` under "Fix round 4" and in a new `reviews/phase-2/round-5-fixes.md` (as `reviews/phase-4/round-2-fixes.md`: the finding, its resolution, the red test and where). Commit green (`fix(012-button-action-row): phase 2 fix-4 — O3-01`), signed off. Then run `.specify/extensions/story/scripts/tdd-check.sh 2` (`pass`; a base sub-check that exits 2 "could not run" because of the landing merges is as phase 6 round 3 R3-03 recorded). Reviewed as phase 2 round 6, then the landing check.

**Checkpoint**: a one-line `ocelle-button` in a line of text, with or without an icon, has its label on the text's
baseline within 0.5 px; nothing inside the control moves; `ocelle-action-row` and its baselines are unchanged; only
the baselines that moved are regenerated and listed; `tdd-check.sh 2` reports `pass`.

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

### Fix round 2 (operator round from the landing review: O2-01, O2-02)

On 2026-11-17 the operator folded landing review R1-04 (`reviews/landing/round-1.md`) into this pull request
("Fold all including R1-04"), recorded as phase 4 round 2 (`reviews/phase-4/round-2.md`). O2-01, verbatim "Names
ending in -delay (Recommended)": "The generator and rule (f) accept `delay: true` only on a motion token whose name
ends in `-delay` (tooltip-delay today), and fail with a finding otherwise. Future delays need no list edit." O2-02,
verbatim "Fail on non-ms motion (Recommended)": "Rule (f) (and a generator check) reports a finding for any
motion-group duration that isn't a literal `<number>ms`, unless it is a valid delay. That forces one unit and keeps
every motion duration zeroable." The rule, as plan decision 29 now states it: every motion-group duration is a
literal `<number>ms` value and is `0ms` under reduced motion, except a token whose name ends in `-delay` and that
carries `delay: true`; anything else in the motion group is a finding. A motion-group value that is a literal angle
(a number with `deg`, `grad`, `rad` or `turn`) or an easing function (`cubic-bezier(...)`, `steps(...)`,
`linear(...)`, or the keywords `linear`, `ease`, `ease-in`, `ease-out`, `ease-in-out`, `step-start`, `step-end`) is
not a duration and stays out of scope; every other motion-group value counts as a duration (fail closed). Both
findings are test-first. The gate validates the source with the root's `validateSource` before the rules run, so the
fail plants use a wrapped generator whose `validateSource` lets the planted record through (plan decision 29).

**Red (one commit)**

- [X] T049b [P] [US3] O2-01, test-first:
  - `gates/test/brand-rules.test.ts`, beside the C1 case ("does not require a motion duration marked as a delay ..."), with a generator whose `validateSource` lets the record through: a source with `{ name: "motion-pause", group: "motion", value: "300ms", delay: true }` gives exactly one `reduced-motion` finding at that record's line, naming the token and that `delay: true` is accepted only on a motion token whose name ends in `-delay` (message written by hand in the test); the same finding for a record outside group `motion` (`{ name: "shell-delay", group: "shell", value: "50ms", delay: true }`); and for `motion-base` with `delay: true`, that finding plus, since a misplaced marker exempts nothing, the existing "does not set --ocelle-motion-base to 0ms" finding when the block leaves it out (both lines written by hand); `tooltip-delay` (500ms, `delay: true`) still gives no finding and stays out of the block (the C1 case kept); a `-delay` name without the marker (`{ name: "fade-delay", group: "motion", value: "300ms" }`) is an ordinary motion duration, required at `0ms` in the block.
  - `packages/tokens/test/validate.test.ts`, under "validateSource() names the token and the rule": `validateSource` throws `invalid token source: ...` naming `motion-pause` and the rule for each of the three misplaced markers above; it accepts the real source (with `tooltip-delay`) and a fixture source with a `fade-delay` marked `delay: true`.
- [X] T049c [P] [US3] O2-02, test-first, and the pins of the two new plants:
  - `gates/test/brand-rules.test.ts`, with the same kind of generator: each of `{ name: "motion-slow", group: "motion", value: "1s" }`, `value: "var(--ocelle-motion-base)"` and `value: "calc(2 * 100ms)"` gives exactly one `reduced-motion` finding at that record's line, naming the token, its value and that a motion duration must be a literal `<number>ms` (message written by hand); and in the same tests the non-durations stay out of scope: `motion-turn` (`1turn`), a `90deg` value, `easing-standard` (`cubic-bezier(...)`), a `steps(4)` value and an `ease-in` value give no finding and are not required in the block; a `-delay` token with `delay: true` and a value that is not `ms` gives no finding (O2-02: "unless it is a valid delay").
  - `packages/tokens/test/validate.test.ts`: `validateSource` throws naming the token for each of `1s`, `var(...)` and `calc(...)` above, and accepts the non-durations above.
  - Pins changed first, by design (as T042a did): `gates/test/plant-runner.test.ts` `brandRulesPin` gains `f-delay-marker-misplaced` and `f-motion-not-ms` and its count goes from 15 to 17; `gates/test/integration/plants-robustness.test.ts` `plants: 37` becomes 39; `gates/test/gates-readme.test.ts` requires both new plants in the `brand-rules` row's plants cell, beside `f-motion-not-zero` and `f-motion-spin-missing`. Any other pinned plant or shard count that two more brand-rules plants change (the other-plant shards are ⌈n / 80⌉, 3 today) is changed here too, measured, not guessed.
- [X] T049d [US3] Commit T049b and T049c alone (`test(012-button-action-row): phase 4 fix-2 red — O2-01, O2-02`), signed off. Then run `.specify/extensions/story/scripts/red.sh 4 fix-2`. Confirm every new failure is an assertion failure against the current code (no finding where one is expected, `validateSource` not throwing, a pin of 15 or 37, a missing plant name), not a load error. A case that passes at once because the behaviour already exists (for example `tooltip-delay` passing, the non-durations out of scope) is reported in the round's notes, not forced red.

**Green**

- [X] T049e [US3] O2-01 and O2-02, over T049b and T049c:
  - `packages/tokens/src/generate.ts`: `recordProblems` (so `validateSource`) reports `delay: true` on a record that is not of group `motion` or whose name does not end in `-delay`, and a motion-group value that is neither a valid delay, a literal `<number>ms`, an angle nor an easing function (the closed list of plan decision 29); `motionDurations` keeps reading the literal `ms` durations less the valid delays; the `delay` field's doc comment and the header comment of `motionDurations` state the rule.
  - `gates/bin/brand-rules.ts`: rule (f) (`motionDurations`, `reducedMotionBlock`) reports both findings at the record's location (`inputs.locate(name)`), rule `reduced-motion`, with the same classification, its own copy; the existing (f) findings and messages unchanged.
  - New fail plants, each with `plant.json` (one `reduced-motion` finding, location `packages/tokens/src/overrides.ts#<name>`, the message), `delta.json` (`generator: "wrapped"` and a `tokens` `add`) and a `tree/packages/tokens/src/generate.ts` wrapper as `f-motion-spin-missing`'s whose `validateSource` lets the planted record through: `gates/plants/brand-rules/f-delay-marker-misplaced/` (adds `motion-pause`, `300ms`, `delay: true`) and `gates/plants/brand-rules/f-motion-not-ms/` (adds `motion-slow`, `1s`).
  - `gates/README.md`: the `brand-rules` row's plants cell lists `f-delay-marker-misplaced` and `f-motion-not-ms` (the row's rule text is T071); `specs/002-design-tokens/contracts/gates.md` § Plants: the `brand-rules` Fail cell lists both new plants with a one-line description each (as amended by 012 phase 4 round 2).
  - Tokens README and CHANGELOG: one line each that the token build refuses a misplaced `delay: true` and a motion duration that is not a literal `ms` value. T049b and T049c now pass.
- [X] T049f [US3] Run the checks:
  - each new plant once, alone (`pnpm run gate:plants -- --shard <k>` for its shard, or the affected-plants run), each giving exactly its one finding; record them in `reviews/phase-4/plants.md` under a "Fix round 2" heading, with `f-motion-not-zero` and `f-motion-spin-missing` still as expected;
  - `pnpm test`, `pnpm vitest run --project tokens --project tokens-browser`, `pnpm run gate:typecheck`, `gate:lint`, `gate:test-lint`, `gate:contrast` (unchanged) and `gate:brand-rules` (0 findings on the repository: `tooltip-delay` valid, every other motion duration literal `ms`);
  - `pnpm run gate:mutation -- --base <T049d red commit> --files packages/tokens/src/generate.ts,gates/bin/brand-rules.ts`, alone, before the commit: no survivor on the changed lines (every record reasoned, R-14).

  Commit green (`fix(012-button-action-row): phase 4 fix-2 — O2-01, O2-02`), signed off. Then run `.specify/extensions/story/scripts/tdd-check.sh 4` (`pass`). Reviewed as phase 4 round 3.

**Checkpoint**: a `delay: true` marker outside a motion token named `-delay`, or a motion duration that is not a
literal `ms` value, is refused by the token build and reported by `gate:brand-rules` rule (f); `tooltip-delay` keeps
its value under reduced motion; `tdd-check.sh 4` reports `pass`.

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
FR-038 (card), FR-039, FR-041; decisions 9, 13, 16, 21, 23 on rows, 31, and 32 on the button (`:state(pressed)`
button mode only); stories with baselines and axe; the CI run at the full story count.

**Independent Test**: a link row dispatches its event before navigating and a listener's `preventDefault()` stops the
navigation; modifier, Alt and middle clicks dispatch nothing and keep the browser's default; `current="page"` reports
`aria-current="page"` and draws the bar apart from the focus ring; an unavailable row stays focusable and does
nothing.

### Spike (first)

- [X] T060 [US5] Spike, recorded in `specs/012-button-action-row/reviews/phase-6/spike.md`: for button-mode and link-mode rows under the page rules `display: block`, `display: flex; width: 100%` and `display: block; height: 90px`, list by hand which test points lie outside the row's hit layer's box (decisions 23 and 30); the bar's measured place (7 to 10 px from the border edge, drawn by the hit layer) on a focused current row in ltr and rtl, clear of the title and every sibling box; the card layout on decision 30's model (hit layer box equals the host's in a grid of cards, a click on the description and on a tag passes through the inner control); axe `color-contrast` on a current row with all slots (plain, hovered, focused, unavailable; light and dark; default and `ground="chrome"`): no violation and no incomplete result for the title, description and tag text over the hit layer, on decision 30's positive stacking with the bar inside the layer (US5-4, FR-052); any result against decision 30 is a stop-and-ask. Result (spike.md): (1) to (3) hold (outside points: none under `display: block`, end and bottom under the other two rules, both modes, for a title-only row; bar 7 to 10 px in ltr and rtl, content from 12 or 13 px; card hit layers equal their hosts, one event per click on the description and on a tag); (4) plain, hovered and focused current rows give 0 results of any impact, but every unavailable current row, and 52 of 72 unavailable pages in a wider probe, gave a serious `color-contrast` violation on the description and tags (axe skips only text under an `aria-disabled` ancestor, and since decision 30 the siblings are outside the inner control); with `aria-disabled="true"` on the sibling wrappers while unavailable, all 72 pages give 0 results and the AX tree is unchanged, accepted by the operator (plan decision 31, which also confirms decision 16's reading (i))

### Tests (red, one commit)

- [X] T061 [P] [US5] `packages/elements/test/scenarios/row-states.ts`: US5-1 to US5-12 as shared bodies; US5-1's node count as in US1-1 (one node with a role or a name, an unnamed host `generic` allowed); event before navigation and `preventDefault()` cancelling it (sink and fixture bodies); Ctrl, Meta, Shift, Alt and middle clicks: no event, default kept (decision 13), the fixture asserting the browser's own modifier handling as in T031 (a Meta-click navigates the current tab on Chromium on Linux; operator decision at phase 3); `current` `page`/`true` and other values absent; the current mark with hover precedence, on chrome (`chrome-hover` surface), forced colours (surface and bar read from the hit layer); axe on a current row with description and tags: no `color-contrast` incomplete result (US5-4, decision 30); ring band, gap and bar read apart on a focused current row in ltr and rtl (plants: bar at `inset-inline-start: 0`; bar at the ring's inner edge); `unavailable` on button and link rows (no `href`, `tabindex="0"`, decision 9), not activated by any click or key (a click on the description and on a tag included), disabled ink and `GrayText` on the title and on the description and tags wrappers (US5-7, decision 30; plant: sibling colours removed); axe on unavailable rows with description and tags (with and without `current`, default and flush, on canvas, `ground="accent-low"` and `ground="chrome"`, light and dark): 0 results of any impact, the description, tags and trailing wrappers `aria-disabled="true"` while unavailable and without it once cleared (decision 31; plant: wrappers without `aria-disabled`); `unavailable` with `current` (bar in disabled ink, current surface kept, `accent-low` or `chrome-hover` on chrome, unchanged on hover, decisions 16 and 31); `busy` with `unavailable`; `current` on a button-mode row; card layout on decision 30's model (title line with trailing at its end, description, tags wrapping only between tags, a tag wider than the card may break; one event for a click on the description or a tag), title gap `space-1` and part `title`, `arrow-end` in the trailing slot mirrored under rtl; stretched unavailable row and restyled rows US5-6 and US5-12 from the spike's list, the outside points asserted against the hit layer's box (plant: no host listener)
- [X] T061a [P] [US5] `packages/elements/test/scenarios/link.ts` (US2-12, plan decision 32): the link-mode expectation is replaced by a stricter one, the reason recorded in the red record (a link has no pressed state; constitution VIII): host `lp` (`href="#here" aria-pressed="true"`) matches no `:state(pressed)` in `set`, `off`, `again` and `empty`, beside the button-mode `p` that matches; a new step: a button-mode host with `aria-pressed="true"` matches `:state(pressed)`, stops matching once `href="#here"` is set (link mode, inner `<a>` without `aria-pressed`), and matches again once `href` is cleared (inner `<button aria-pressed="true">`); `packages/elements/test/node/readme.test.ts`: the custom-states sentence reads `:state(pressed)` while the moved `aria-pressed` is `"true"` in button mode (plant: `pressed` state in any mode)
- [X] T062 [P] [US5] `packages/elements/test/action-row.test.ts` and `test/browser/action-row.test.ts` run `row-states.ts`; `test/node/manifest.test.ts` and `readme.test.ts` for `current`, `unavailable`, `layout="card"` and the card README lines
- [X] T063 [P] [US5] Story tests: `elements-stories.test.ts` gains the state stories (current page, current true, current hovered, current focused (by the method T014 selects), unavailable, unavailable current, link row, card, card with many tags, card rtl, chrome current); the four pinned story counts; the current and card stories with description or tag text give 0 serious or critical axe results (decision 30), and so do the unavailable and unavailable current stories with description and tags (decision 31)

### Implementation (green)

- [X] T064 [US5] `packages/elements/src/ocelle-action-row.ts`: link-row activation order and `preventDefault` on the originating click, modifier and middle clicks ignored, `current` with `aria-current` and the bar (R-12's method: a `span.bar` inside the hit layer, 7 to 10 px from the border edge, in the inline padding clear of every sibling; the current surface on the hit layer), `unavailable` via `control.ts` (disabled ink and `GrayText` on the sibling wrappers too, and `aria-disabled="true"` on the description, tags and trailing wrappers while unavailable, decision 31; an unavailable current row keeps the current surface with no hover, decisions 16 and 31), card layout on decision 30's model (the layout wrapper as a grid, the group elements `display: contents`, the same hit layer, the same positive stacking and `aria-hidden` siblings) and tags wrapping, part `title`
- [X] T064a [US5] `packages/elements/src/ocelle-button.ts` (plan decision 32): the `pressed` custom state only in button mode (`mode === "button"` and the moved `aria-pressed` is `"true"`), recomputed when the mode changes; the `@cssstate pressed` description says "in button mode only"; the README's custom-states sentence and a CHANGELOG line say the same
- [X] T065 [US5] README, CHANGELOG, `custom-elements.json` regenerated; state and card stories of T063 and baselines; `fail-token-changed` extended
- [X] T066 [US5] Plants recorded in `reviews/phase-6/plants.md` (with `pressed` state in any mode, decision 32); gates as T029, then plants and mutation (`ocelle-button.ts` included)
- [X] T067 [US5] Push the branch and record in `reviews/phase-6/ci-run.md` a CI run at the full story count (about 72) with every Plants shard's time (each under 10 minutes; about 588 s expected by 006's model, accepted by the operator decision at phase 2) and the run's total (R-13); a shard at or over 10 minutes is a stop-and-ask (ticked on the gate-step figure, all under 570 s: operator, 2026-11-17, phase 6 round 2 O2-01; `reviews/phase-6/ci-run.md`)
- [X] T068 [US5] `gates/README.md` and the Complexity Tracking row of `specs/006-storybook-workbench/plan.md`: correct T011's figures to the story count phase 6 reaches (about 72), the headroom left to the split count of 76 (about 4 stories) and the Plants runner-hours per CI run (about 11.9), and record in `reviews/phase-6/notes.md` the operator's request to open, when this feature lands, a triage record for a plant design whose shard time does not grow with the story count (operator decision at phase 2, plan decision 15, research R-13)

**Checkpoint**: `tdd-check.sh 6` reports `pass`.

### Fix round 2 (operator round from the landing review: O2-01, O2-02, O2-03)

On 2026-11-17 the operator settled landing review R1-01 and folded R1-02 and R1-03 into this pull request ("Fold all
including R1-04"), recorded as phase 6 round 2 (`reviews/phase-6/round-2.md`; landing review
`reviews/landing/round-1.md`). O2-01, verbatim "Accept, file plant triage (Recommended)": "Record both measures (gate
step and job wall time, per shard and total) in reviews/phase-6/ci-run.md once shard 23 is in, and tick T067 on the
gate-step figure (all under 570 s). Your plant-design triage record (decision 15, R1-09), with the visual test's
519/600 s (R1-06), is offered as a follow-up issue." All three findings are records and documentation and change no
behaviour, so they need no red commit (constitution VIII: no behaviour); the label is fix-2, reviewed as phase 6
round 3. T071 waits for phase 4 fix-2 (T049e) for its plant names.

- [X] T069 [US5] O2-01, `specs/012-button-action-row/reviews/phase-6/ci-run.md` (new): record CI run 44098238937 (497b05f) from the figures the orchestrator supplies, without measuring or estimating any: per Plants shard, the plant gate step's time and the whole job's wall time (attempt 1 for 75 of 76 shards, attempt 2 for shard 23, whose attempt 1 failed in setup, landing review R1-05), and the totals of both measures (runner-hours); the slowest shard by each measure; that every gate-step time is under 570 s (the peak 516 s, shard 40, as round 2 states) while 16 job wall times exceed 570 s (up to 862 s) because of slow runner setup that day (disk cleanup up to 324 s, pnpm setup up to 373 s); the story count of the run (171) against the split count of 76; and the operator's answer above, verbatim, with the follow-up issue it offers (plant-design triage record, decision 15, R1-09; the visual test's 519/600 s, R1-06). Then tick T067 (`[X]`) and append to it "(ticked on the gate-step figure, all under 570 s: operator, 2026-11-17, phase 6 round 2 O2-01; `reviews/phase-6/ci-run.md`)". A supplied figure that contradicts round 2 (a gate step at or over 570 s) is a stop-and-ask. No code change.
- [X] T070 [US5] O2-02 (landing review R1-02), after T069: correct the sizing figures, which the merges made false (171 stories, not about 72), in `gates/README.md` (the plant-sharding paragraph, lines 58-66 at round 2), the `shardSize` comment of `gates/lib/plant-runner.ts` (lines 266-268 at round 2; comment only, no code) and the Complexity Tracking row "Plant roots hold every repository story" of `specs/006-storybook-workbench/plan.md` (line 637 at round 2). Each states the merged state: the story count (171) and the shard count, the measured figures of T069's `ci-run.md` (the gate step's peak and total, and the job wall time's peak and total, each with run 44098238937 named), that the split count of 76 stories at size 1 is exceeded (so 006's model figures of about 588 s, "about 4 stories of headroom" and about 11.9 runner-hours no longer hold and are removed, not kept beside the measures), and that the plant-design triage record is pending (operator, 2026-11-17, phase 6 round 2 O2-01: offered as a follow-up issue). No test pins these figures today (`gates/test/gates-readme.test.ts` checked); if a wording that a test pins changes, that test changes in the same commit.
- [X] T071 [US5] O2-03 (landing review R1-03), after phase 4 fix-2 (T049e): in `gates/README.md`, the `brand-rules` row's rule text (line 36 at round 2) keeps "reduced motion at 0ms for every motion duration of the token source (012 changed 002's rule (f), which named two)" (pinned by `gates/test/gates-readme.test.ts`) and adds the exception as phase 4 round 2 amended it: except a token whose name ends in `-delay` and that carries `delay: true`, every motion duration being a literal `<number>ms` value; a misplaced marker or a non-`ms` motion duration is a finding (plan decision 29). In `specs/002-design-tokens/contracts/gates.md` § Plants (line 232 at round 2), the `brand-rules` Fail cell lists `f-motion-spin-missing` (012 phase 4) and, if T049e has not already listed them, phase 4 fix-2's `f-delay-marker-misplaced` and `f-motion-not-ms`, each with a one-line description, marked as added by 012.
- [X] T072 [US5] Run `pnpm test` (the gates-readme test included), `pnpm run gate:typecheck` and `gate:lint` (T070's comment edit); record T069 to T071 in `reviews/phase-6/notes.md` under "Fix round 2"; commit (`docs(012-button-action-row): phase 6 fix-2 — O2-01, O2-02, O2-03`), signed off. Then run `.specify/extensions/story/scripts/tdd-check.sh 6` (`pass`). Reviewed as phase 6 round 3.

**Checkpoint**: T067 is ticked on the recorded gate-step figures, and the gate docs state the measured sizing and
rule (f) as amended; `tdd-check.sh 6` reports `pass`.

### Fix round 3 (operator round from landing round 2: O4-01 to O4-05)

On 2026-11-18 the operator folded landing review round 2's R2-01 (blocking: the merge of main b594b7e, mission 009, at
feac2fa made phase 6 O2-02's sizing figures stale again) and the notes on the same text (phase 6 round 3 R3-01,
R3-02; landing round 2 R2-02; phase 4 round 4 R4-01) into this pull request, recorded as phase 6 round 4
(`reviews/phase-6/round-4.md`; landing review `reviews/landing/round-2.md`). Verbatim "Fold R2-01 + notes
(Recommended)": "Record a phase 6 operator round. The planner adds the task, implementer-ivan fixes all the figures
and wording, and a phase 6 round 4 review plus landing round 3 check them. All of it is docs and comments." All five
findings are documentation and comments and change no behaviour, so they need no red commit (constitution VIII: no
behaviour); the label is fix-3, reviewed as phase 6 round 5 and landing round 3. The records of what was decided at
171 stories (`reviews/phase-6/ci-run.md`, T067's tick) stay as they are (landing round 2 R2-01). Figures are taken
from round 4 and the orchestrator, never measured or estimated here.

- [X] T073 [US5] O4-01 (landing round 2 R2-01) and O4-02 (phase 6 round 3 R3-01), both on the plant-sizing text: in `gates/README.md` (the plant-sharding paragraph, lines 61-67 at round 4) and the `shardSize` comment of `gates/lib/plant-runner.ts` (lines 266-269 at round 4; comment only, no code), state the state after merging 009: **194 stories** and **77 shards (4 + 48 + 25)** (as `pnpm run gate:plants -- --plan`, the `storybook-build` pin in `gates/test/integration/storybook-build.test.ts` and `gates/test/plant-runner.test.ts` show), and cite CI run 44298568583 (ac2d73a, attempt 1, 148/148 jobs) with round 4's figures: the longest plant gate step 524 s (shard 39), none over 570 s; the longest job wall time 692 s (shard 21), 29 shards over 570 s; 9.71 runner-hours of Plants job wall time. A gate-step total the orchestrator does not supply is said to be not recorded, not estimated. Run 44098238937 (171 stories, 76 shards) may stay, labelled as before 009's merge. Keep "split count of 76 exceeded" and "triage record pending". O4-02: in the same paragraph (line 61 at round 4) replace "approved by the operator at 012 phase 1's review" with 8dc8147's wording in specs/006-storybook-workbench/plan.md: put to the operator at 012 phase 1's review and accepted at phase 2 (012 tasks.md T067; 012 reviews/phase-2/notes.md, "Story count", "decided by the operator: proceed"). The same correction to `specs/006-storybook-workbench/plan.md` (the Complexity Tracking intro, line 634 at round 4, and the row "Plant roots hold every repository story", line 639 at round 4) is planner territory: hand its replacement text to the orchestrator to route, as T070's was, and do not edit that file here. If `gates/test/gates-readme.test.ts` pins a wording that changes, that test changes in the same commit.
- [X] T074 [US5] O4-04 (landing round 2 R2-02): the `otherShardSize` comment of `gates/lib/plant-runner.ts` (lines 278-279 at round 4; comment only, no code) says 80 "deals the repository's 232 into 3 shards"; correct it to 244 into 4 shards, as pinned in `gates/test/plant-runner.test.ts` (`others: 244`, `4 + 48 + 25`). The 232 figures in specs/006-storybook-workbench/plan.md's decision 30 text (lines 324-396) record the measurement of 2026-11-12 and are not changed.
- [X] T075 [US5] O4-03 (phase 6 round 3 R3-02): in `specs/012-button-action-row/reviews/phase-6/round-2-fixes.md` (the O2-02 row, line 9) and `reviews/phase-6/notes.md` (§ Fix round 2, the T070 bullet, line 253), which say the 006 plan.md row is "not edited here / in this commit" and hand its text to the orchestrator, add that the routed edits to `specs/006-storybook-workbench/plan.md` landed in 904e5cf (the row) and 226e29e (the Complexity Tracking intro), and the approval wording in 8dc8147 (also named by R3-02). Leave the existing sentences; add to them.
- [X] T076 [US5] O4-05 (phase 4 round 4 R4-01): in `specs/012-button-action-row/reviews/phase-4/plants.md` § "Operator decision on the fix-2 plants record", correct the bullet at line 67 ("`--affected 55ec410` selects all 312 plants") to 317 plants (`--affected 55ec410 --list` prints "317 of 317 plants selected" after 009's merge: 244 + 48 + 25), saying that 312 held before 009's merge. The operator's answer at line 62 ("all 312 plants") is a verbatim quote and is not altered; add after it a bracketed note that the total was 312 before 009's merge and is 317 after it.
- [X] T077 [US5] Run `pnpm test` (the gates-readme and plant-runner tests included), `pnpm run gate:typecheck` and `gate:lint` (the comment edits of T073 and T074); record T073 to T076 in `reviews/phase-6/notes.md` under "Fix round 3" and in a new `reviews/phase-6/round-4-fixes.md` (as `round-2-fixes.md`: each finding, its resolution, "none (docs only)" as the red test, and where), the handed-over 006 plan.md text noted there; commit (`docs(012-button-action-row): phase 6 fix-3 — O4-01 to O4-05`), signed off. Then run `.specify/extensions/story/scripts/tdd-check.sh 6` (`pass`; a base sub-check that exits 2 "could not run" because of the landing merges is as phase 6 round 3 R3-03 recorded). Reviewed as phase 6 round 5, then landing round 3.

**Checkpoint**: the gate docs, the plant-runner comments and 006's Complexity Tracking text state 194 stories,
77 shards and run 44298568583; the split-count wording and the plant totals match the record; `tdd-check.sh 6`
reports `pass`.

---

## Dependencies & Execution Order

- Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5 → Phase 6; each needs the previous (the harness, then
  `control.ts` grows: button mode, link mode and the move, unavailable, the row, row states).
- Within a phase: spike first where there is one; the red commit holds every test task of the phase (one `red.sh`
  record); implementation in the listed order; the plants-and-gates task last.
- Phase 2 alone serves #14's copy control; #12 needs phase 3 as well.
- Landing operator rounds (2026-11-17): phase 4 fix-2 (T049b to T049f) is one unit (red under `red.sh 4 fix-2`,
  green, check), reviewed as phase 4 round 3; phase 6 fix-2 (T069 to T072) is a documentation unit with no red commit,
  reviewed as phase 6 round 3. T071 needs T049e's plant names, so phase 4 fix-2 goes first; T069 needs the
  orchestrator's CI figures (shard 23's attempt 2 included), and T070 needs T069's figures.
- Landing operator round of 2026-11-18 (phase 6 round 4): phase 6 fix-3 (T073 to T077) is a documentation unit with
  no red commit, reviewed as phase 6 round 5 and landing round 3; T073 to T076 are independent, T077 last. T073's
  edit to specs/006-storybook-workbench/plan.md is routed by the orchestrator to the planner.
- Landing operator round of 2026-11-18 (phase 2 round 5): phase 2 fix-4 (T029a to T029e) is one unit (red under
  `red.sh 2 fix-4`, green, check), reviewed as phase 2 round 6, then the landing check; it is independent of the other
  fix rounds. T029e's visual run needs the pinned container (docker).

## Parallel Opportunities

- Within each red commit, the test tasks marked [P] touch different files and can be written in parallel.
- Token tasks (T019, T042, T052) are independent of the element test files of their phase.
- Heavy runs (browser suites, visual, mutation, plants) are never parallel in this container.

## Implementation Strategy

MVP is phase 2 (the button) on top of phase 1. Each later phase is a complete, reviewable increment; fold each phase
after approval. The pill tag, status indicator and metric are out of this mission (the later status mission builds the
pill tag's tooltip on #16's `ocelle-tooltip` and needs #16 merged first).
