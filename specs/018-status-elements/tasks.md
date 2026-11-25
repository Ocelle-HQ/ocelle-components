# Tasks: Status Elements, `ocelle-status-indicator`, `ocelle-metric` and `ocelle-pill-tag`

**Input**: design documents in `specs/018-status-elements/`, as approved at the plan gate on 2026-11-16 after three
plan-squad rounds (`reviews/plan/round-1..3/`, `reviews/plan/plan-gate.md`), with the analysis fixes of 2026-11-16
(`reviews/analysis/fixes-1.md`, operator decisions in `reviews/analysis/tasks-gate.md`: I1 plan decision 3 confirmed,
the indicator dot a state mark with `--ocelle-radius-pill`; I2 the § US3 interactive twins moved to phase 5; U1, G1,
G2, I3 to I8 and D1 fixed; added tasks carry suffixed IDs, here T013a, and no task is renumbered); amended after the
phase-1 recheck (`reviews/phase-1/recheck.md`, operator decisions of 2026-11-19 in
`reviews/phase-1/operator-decisions.md`, changes listed in `reviews/phase-1/design-amendments.md`: Q1 no
`motion-pulse-count` token, Q2 the pill on the slot convention as merged, Q3 the 21 stories kept, Q4 phase 1 adds only
harness rows 1, 2, 7 and 8; 011's tokens used as merged; the merged driver's names; the environment as found). Amended
tasks keep their IDs; work removed by the amendment is marked "removed at the phase-1 recheck" in the task's text, and
no task is ticked by it:
- spec.md (FR-001 to FR-007, FR-010 to FR-016, FR-020 to FR-024, FR-025 to FR-035, FR-040 to FR-043, SC-001 to SC-006;
  US1-1..8, US2-1..7, US3-1..8, US4-1..12, US5-1..6; edge cases; the operator decisions in its header; FR-012's list
  of the indicator's README rules (i) to (viii), their single source);
- plan.md, with decisions 1 to 16 and the phase list;
- research.md, R-01 to R-15 (facts marked **recheck** are re-read by T001, the measured ones by T002's spikes);
- data-model.md;
- contracts/elements-status.md (the public surface) and contracts/checks.md (§ Test harness, § Scenarios, the § US1 to
  § US5 bodies with their plants, § Edge cases, § Gates per phase);
- quickstart.md.

**Start condition**: no task starts before missions 012 (`specs/012-button-action-row`) and 008 (#16,
`specs/008-overlays`) are on `main` and merged into this branch by `/ocelle-land` (never by a run). Op 016 (#41) is on
`main` at `c4c0af45`; it reaches this branch with the same merge. Implementation never merges `main` itself. Phase 4
source uses 012's `linkHref` only; no element source before phase 5 uses 012's `MovedAttributes`, `guardHost` or
interactive helpers, and none before phase 6 uses 008.

**Tests**: required. Constitution Principle VIII applies to every phase. The phase flow is `base.sh`, an optional
`scaffold.sh`, **one red commit of test files only** proven by `red.sh` (one red record per phase; operator decision
I3: the phase's story tests, its scenario bodies, node tests, token expectations and pinned story counts are in that
red commit, before green), then green, `tdd-check.sh` and an independent review. Expected values are written by hand
from the spec, the data model and research: colours and sizes from `packages/tokens/test/expected.ts` by token name,
system colours read as `resolveColour(<keyword>)` against a probe element in the same mode, never from the source
under test.

The guard rules:
- A "does not" assertion never stands alone: it shares its test with the positive assertion it guards.
- Each guard is proven able to fail by its named plant (contracts/checks.md), run once by the implementer and recorded
  in the phase notes; a plant that does not make its guard fail stops the phase (stop-and-ask).
- Clicks on disabled controls are sent with `force: true`, so "not activated" tests always send a click.

**Shared scenario bodies** (R-11): every browser scenario is written once in `packages/elements/test/scenarios/*.ts`
against the driver and run by two harnesses: in process (`elements`, element source, mutated) and on the strict-CSP
fixture (`elements-browser`, the built browser bundle, not mutated). Fixture runs also assert zero CSP violations,
only allowed requests and no console message. Media emulation (colour scheme, reduced motion, forced colours) is reset
after every test, and file order is shuffled.

**Feature 006 per phase**: a phase that adds stories commits their baselines (`OCELLE_VISUAL_ENGINE=docker pnpm run
visual:update` in 006's pinned container, dockerd started as root with `nohup dockerd > /tmp/dockerd.log 2>&1 &`, and
after a container restart also `pnpm run setup:online`; conflicting baseline PNGs are regenerated, never hand-picked;
no podman cross-check is possible here), runs `gate:storybook-build`, `gate:visual` and `gate:axe` (0 serious or
critical), updates the pinned story counts in `gates/test/integration/{storybook-build,visual,axe,plant-repo}.test.ts`
**red first** (exact summary lines written by hand), and extends the `fail-token-changed` and `fail-empty-index` plants
as 012 did.

**Plants per phase (op 016)**: every phase ends with the affected plant run, `OCELLE_VISUAL_ENGINE=docker pnpm run
gate:plants -- --affected $(cat specs/018-status-elements/reviews/phase-<N>/base.sha)`, kept in
`specs/018-status-elements/reviews/phase-<N>/plants.md` in op 016's form (`# Plants of phase N`, `- base:`,
`- command:`, `- exit:`, the output verbatim in one text block; "no plant selected" recorded as printed). Phase 7 is
the one exception to the base: it runs against phase 2's `base.sha` (`reviews/phase-2/base.sha`), so its run covers the
whole feature's diff rather than its own docs-only diff (plan, phase 7). The full plant set is never run locally and a
phase never lists plant shards by number; CI's Plants check judges every plant.

**Phase-end gates**: each phase-end task (T010, T023, T034, T044, T055, T062, T065) runs the gates of contracts/checks.md
§ Gates per phase for its phase: every phase typecheck, lint, style-lint, test-lint, unit-tests, manifest, csp,
prefix, pins and signoff; contrast and brand-rules in a phase that adds tokens; storybook-build, visual and axe in a
phase that adds stories; then the affected plants and mutation.

**Environment**: Node 26.13.0 and pnpm 12.16.1 as pinned (the container's Node 22 is not used for gates). Every browser
run sets `OCELLE_CHROMIUM_PATH` to the Chromium the pinned Playwright expects, as
`knowledge/speckit-flows/findings/frontend-missions.md` § Browser path describes (T001 records the path). T001 (f)
recorded, in this container: the pinned `playwright-core` 1.64.1 expects Chromium revision 1248, which is not installed
and cannot be downloaded, so every browser run sets
`OCELLE_CHROMIUM_PATH=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome` (Chrome for Testing 153.0.8010.12); and
only Node 22.23.4 is installed, not the pinned 26.13.0 (frontend findings § Node version mismatch), so the gate runs
need the pinned Node provided first. One heavy job
(browser suites, mutation, plants, visual) at a time. Never `git stash`. Commit each step at once (the container
restarts).

**Organization**: phase 1 is Setup (recheck, spikes and test harness); phases 2 to 6 are User Stories 1 to 5, one
review unit each, folded after approval (`/ocelle-run` step 4.3); phase 7 is Polish. Records (README, CHANGELOG,
stories, baselines, plants) belong to the phase whose behaviour they describe.

**Stop-and-ask points** (the implementer records the question in the phase review and does not work around it):
- any interface difference T001 finds between this plan and 012, 008 or op 016 as merged (R-01);
- the plant split count exceeded by this feature's 21 stories with no plant design that does not grow with the story
  count on `main` (plan decision 9, R-12); answered at the phase-1 recheck: proceed with the 21 stories, the shard
  question staying with the pending plant-design triage (operator decision Q3);
- any new required contrast pair below threshold (`gate:contrast --print`) (the eyebrow pairs no longer apply: 011 is
  on `main`, R-10);
- a needed new `style-lint` allowance;
- a spike result that contradicts a scenario as written (R-04 (d), R-05, R-06, R-07, R-08, R-09);
- a plant that its guard does not catch.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: can run in parallel (different files, no dependency on an unfinished task)
- **[Story]**: the user story of the task (US1 to US5)
- Paths are relative to the repository root.

---

## Phase 1: Setup — recheck, spikes and test harness

**Purpose**: confirm every dependency fact against `main` as merged, settle the spikes the plan defers, and add the
driver methods every later phase needs that `main` lacks (contracts/checks.md § Test harness rows 1, 2, 7 and 8; rows 3
to 6 exist on `main` and are used as merged, operator decision Q4 (a)). No element behaviour.

**Independent Test**: `reviews/phase-1/recheck.md` and `reviews/phase-1/spikes.md` exist with every item answered; the
self-tests of harness rows 1, 2, 7 and 8 pass in both harnesses on stand-in pages; `tdd-check.sh 1` reports `pass`.

### Recheck and spikes (no behaviour)

- [X] T001 Recheck, recorded in `specs/018-status-elements/reviews/phase-1/recheck.md` with the commit each fact was read at: (a) 012, 008 and op 016 are merged into this branch (their merge commits); (b) every fact marked **recheck** in research.md R-01 to R-15: 012's `packages/elements/src/control.ts` exports and signatures (`linkHref`, `controlState`, `mirrorOf`, `MovedAttributes` with `observed`, `handle`, `connected`, `get`, the `#upgraded` guard, `resolveIds`, `guardHost`, `controlStyles` and its `.control` selectors), `ocelle-button`'s activate dispatch and custom-state code, 012's README § Control conventions and manifest normaliser (R-15), 008's `ocelle-tooltip` properties, slot, part, `display: contents` host, test delay and focus handling, the two branches' test drivers reconciled into one interface (method names and signatures as merged), rule (f) of `gates/bin/brand-rules.ts` as generalised by 012 and the `tooltip-delay` exemption as merged, `color-disabled-ink` on `color-disabled-bg` declared and passing, the engine floor in `packages/elements/README.md` § Engines; (c) mission 011 on `main` or not (decides T028 and T030); (d) the plant split count and the repository's story total, against this feature's 21 stories (stop-and-ask, plan decision 9); (e) **this task list against op 016 as merged**: `pnpm run gate:plants -- --affected <base>` and `--list` work as `gates/README.md` § A phase's plants (op 016) says, `plants_command` in `.specify/extensions/story/story-config.yml`, the `plants.md` form in `.specify/extensions/story/commands/speckit.story.implement.md`, and every "Plants per phase" step and phase-end task here matches them (a mismatch is corrected in this file before T003, recorded); (f) the Chromium path for `OCELLE_CHROMIUM_PATH`. Any interface difference: stop-and-ask. (Recorded in `reviews/phase-1/recheck.md`, which stopped on Q1 to Q4; the operator's answers are in `reviews/phase-1/operator-decisions.md` and folded into these tasks by `reviews/phase-1/design-amendments.md`.)
- [X] T002 Spikes on scratch pages only (no repository source), recorded in `specs/018-status-elements/reviews/phase-1/spikes.md` with the Chromium version and each measured figure: R-04 (d) a pulsing ring under a `hidden` ancestor and a `display: none` ancestor (a new run on reveal) and inside a `<details>` (closed for less and for more than one run, connected or given `pulse` while closed: the behaviour to pin, no run on opening); R-04 (b) and (d) `moveBefore()` (the same animation continues) and `hidden="until-found"` (as measured); R-05 the metric term's name with the `aria-hidden` uppercase span and the visually hidden written copy, and whether a token-only hiding exists that find-in-page skips; R-07 an author `Highlight` background kept under forced-colours emulation (else `forced-color-adjust: none` on that rule); R-08 `:focus-visible` after a programmatic `focus()` moved from a focus-visible control, and the refocus order relative to `ocelle-tooltip`'s `slotchange`; R-09 the fractional overflow measure under `text-overflow: ellipsis` (0.1 px over reads overflow, an exact fit none, right-to-left the same); R-03 and US1-8 Chromium's resulting tree on a stand-in custom element whose `ElementInternals` sets role `img` and, or not, a name (as `expose` does from a `label`), with a host `aria-label` present and blank, in each of the four combinations (the value T012 pins, written by hand); R-09 a stand-in `ocelle-tooltip` trigger that has focus while the tooltip is disabled and is then enabled (as a pill becoming truncated while focused): whether the tooltip shows then, and whether it shows after a blur and a refocus (the value T057's README rule states); R-06 and R-07 (added at the phase-1 recheck, operator decision Q2 (a)) the pill box on the slot convention as merged (`.pill` > `.icon-row` with `iconSlotStyles` as merged, the text in `.label`, the pill's density padding and `--ocelle-icon-size: 1lh`), static, interactive enabled (`.label` with `white-space: nowrap; overflow: hidden; text-overflow: ellipsis`, fitting) and interactive disabled, with and without an icon, inline in a paragraph and in an `align-items: baseline` flex row: the offset of the first text line from the surrounding baseline, and an icon-only `bare` pill's box (the value § US3 baseline pins, written by hand). A result that contradicts a scenario as written, or a labelled pill off the baseline by more than 0.5 px: stop-and-ask

### Tests (red, one commit)

- [X] T003 [P] `packages/elements/test/harness/animation.test.ts` (in process) and its twin in `packages/elements/test/browser/harness.test.ts` (CSP): the animation record (stable identity and `iterations` added to 013's `animations(id)` `Running` record, or to 008's `ownAnimations(id, inner?)`, additively, or a sibling; `endTime`, `currentTime`, `playState` as merged) and `seek(id, inner, ms)` on a stand-in with a 3-iteration CSS animation, as contracts/checks.md § Test harness rows 1 and 2 state (positive and negative; red against the merged driver, which has neither identity, `iterations` nor `seek`)
- [X] T004 [P] `packages/elements/test/harness/text.test.ts` and its CSP twin: the fractional overflow measure helper on stand-ins, as § Test harness row 8. (`editText(id, data)`, row 3, removed at the phase-1 recheck, operator decision Q4 (a): 013's `text(id, value)` and 011's `textData(id, index, data)` exist on `main` and are used as merged, with no self-test.)
- [X] T005 [P] Removed at the phase-1 recheck (operator decision Q4 (a)); no file is written: the tooltip shown state, § Test harness row 4, is 008's `topLayer()` as merged, used by the scenarios with no new method and no self-test (each "no tooltip" negative paired with a showing twin in its body, § US5 negatives)
- [X] T006 [P] Removed at the phase-1 recheck (operator decision Q4 (a)); no file is written: `focusVisible(id, inner?)` and `focusPath()` (row 5) and the click at a point, 012's `click(id, { position })` and 009's `clickAt(target, point)` (row 6), exist on `main` and are used as merged, with no new method and no self-test (US4-7's corner clicks paired with the 1 px outside click, § US4)
- [X] T007 [P] `packages/elements/test/harness/layout.test.ts` and its CSP twin: `settleLayout()` reads a `ResizeObserver`-set reactive value at its final value, and records that a read after `settle()` alone may be stale, as § Test harness row 7

### Implementation (green)

- [X] T008 `packages/elements/test/scenarios/driver.ts`: the `Driver` interface gains the methods of T003, T004 and T007 (harness rows 1, 2, 7 and 8; amended at the phase-1 recheck, operator decision Q4 (a): T005 and T006 add none), on the interface as merged that T001 recorded (`recheck.md` § The test driver: 008's same-named methods renamed `inputPress`, `inputClick`, `inputHover`, `ownAnimations`; existing methods and their callers unchanged)
- [X] T009 `packages/elements/test/commands.ts`, `packages/elements/test/in-process.ts`, `packages/elements/test/browser/driver.ts` and `vitest.config.ts` (the `elements` project's browser commands for the animation identity and `iterations`, seeking animations, `settleLayout()` and the fractional overflow measure; editing text, top-layer reads and point clicks removed at the phase-1 recheck, being on `main` as merged): the implementations of T008 in both harnesses
- [x] T010 Write `specs/018-status-elements/reviews/phase-1/tdd-exempt.md` for T001 and T002 (records with no behaviour: why no test could fail for them); run `gate:typecheck`, `gate:lint`, `gate:style-lint`, `gate:test-lint`, `gate:unit-tests`, `gate:manifest`, `gate:csp`, `gate:prefix`, `gate:pins`, `gate:signoff` (contracts/checks.md § Gates per phase, every phase), then the affected plants (`OCELLE_VISUAL_ENGINE=docker pnpm run gate:plants -- --affected $(cat specs/018-status-elements/reviews/phase-1/base.sha)`, recorded in `reviews/phase-1/plants.md`) and `gate:mutation` (one at a time)

**Checkpoint**: `tdd-check.sh 1` reports `pass`; every later phase can use the driver methods, the four added here and
those of `main` as merged.

---

## Phase 2: User Story 1 - `ocelle-status-indicator` (Priority: P1) 🎯 MVP

**Goal**: US1-1 to US1-8, contracts/checks.md § US1 bodies and the edge cases mapped to `status-indicator.ts`; FR-001
to FR-007 for this element, FR-002, FR-010 to FR-016, FR-041; the tokens `size-indicator` and `motion-pulse` (no
`motion-pulse-count`: the iteration count is the literal 3, operator decision Q1 (a) at the phase-1 recheck); plan
decision 3 (the dot and its ring with `--ocelle-radius-pill`, the dot a state mark, FR-003);
stories `Tones` (with its `pulse` row) and `Labelled`; SC-001's indicator row and its runner (T013a).

**Independent Test**: `<ocelle-status-indicator tone="success" label="Running" pulse>` on the strict-CSP fixture is one
`img` node named "Running"; its ring runs 3 iterations of 1600 ms and ends by 5000 ms while the dot stays opaque and
full size; under reduced motion no animation runs; `gate:manifest`, `gate:brand-rules`, `gate:visual` and `gate:axe`
pass.

### Tests (red, one commit)

- [X] T011 [P] [US1] `packages/elements/test/status.test.ts`: `statusOf` returns each of `info`, `success`, `warning`, `danger`, `neutral` for itself and `"neutral"` for `"bogus"`, `""`, `null`, `undefined` and `"Success"` (exact, case-sensitive, no trimming; data-model § Status vocabulary); `statuses` lists the five in the order `info`, `success`, `warning`, `danger`, `neutral`
- [X] T012 [P] [US1] `packages/elements/test/scenarios/status-indicator.ts`: US1-1 to US1-8 as shared bodies with hand-written expected values (the dot at least 8 px from `size-indicator` = `0.5rem`, fill `color-<tone>` per tone in both themes, `aria-hidden` without a label, one `img` node named by the trimmed `label`, a blank `label` decorative, unknown `tone` kept in the attribute while the property reads `"neutral"`, forced colours `CanvasText`), and every § US1 body of contracts/checks.md with its plant: each listed change keeps the same animation (identity, current time ≥ the seek), `pulse` set again in a later task starts a new animation, the same-task toggle starts none, `moveBefore()` and `hidden="until-found"` and `<details>` pinned as T002 measured beside their restarting twins, the element's own reduced-motion rule under a host rule restoring `--ocelle-motion-pulse: 1600ms`, US1-8's host `aria-label` ignored in every combination, with Chromium's resulting tree as T002 measured it on the stand-in (`spikes.md`); every "does not" paired and its plant named
- [X] T013 [P] [US1] `packages/elements/test/status-indicator.test.ts` (in process over T012, light and dark, forced colours, `dir="rtl"`, `axe()` after each page) and `packages/elements/test/browser/status-indicator.test.ts` with `packages/elements/test/browser/fixtures/status-indicator.html` (fixture over T012: CSP, requests, console); `packages/elements/test/entry-status-indicator.test.ts` (importing `src/ocelle-status-indicator.ts` defines only `ocelle-status-indicator`); `entry-root.test.ts` and `exports.test.ts` extended (`OcelleStatusIndicator`)
- [X] T013a [P] [US1] `packages/elements/test/consumers.test.ts` (in process, light and dark): the runner of `test/scenarios/consumers.ts`, running each SC-001 body T014 writes, so they are seen failing in this red commit (constitution VIII); T025 and T036 extend it with the metric and pill rows
- [X] T014 [P] [US1] `packages/elements/test/scenarios/consumers.ts` (indicator row of SC-001, run by T013a): `tone` per value with no consumer CSS, the dot's computed fill equal to the token value from `expected.ts` for each tone, an unknown tone the neutral value
- [X] T015 [P] [US1] `packages/tokens/test/expected.ts` (hand-written `size-indicator` `0.5rem` in group size, `motion-pulse` `1600ms` in group motion and `0ms` under reduced motion; the `motion-pulse-count` record removed at the phase-1 recheck, operator decision Q1 (a): no such token), the generator output tests (`packages/tokens/test/generate.test.ts`: `motion-pulse` in the reduced-motion block at `0ms`), `packages/tokens/test/browser/values.test.ts`, the tokens README and CHANGELOG tests; `gates/test/brand-rules.test.ts` or its integration twin: rule (f) as generalised accepts `motion-pulse` at `0ms` and rejects it missing from the block (red against the token source before T019)
- [X] T016 [P] [US1] `packages/elements/test/build/build.test.ts`, `packages/elements/test/build/pack.test.ts` (dist and packed `ocelle-status-indicator.js`), `packages/elements/test/node/manifest.test.ts` (`ocelle-status-indicator`: `tone`, `label`, `pulse` with descriptions and defaults; parts `dot`, `ring`; no event, method, slot or custom state, paired with the positive presence of `tone`; earlier entries unchanged), `packages/elements/test/node/readme.test.ts` (the `ocelle-status-indicator` section and each of the indicator's README rules (i) to (viii) of spec.md FR-012, their single source, one assertion each; CHANGELOG lines in both packages)
- [X] T017 [P] [US1] Story tests: `storybook/test/integration/elements-stories.test.ts` gains `elements-ocelle-status-indicator--tones` (every tone, with a `pulse` row) and `--labelled`, each present and rendering in light and dark; `gates/test/integration/{storybook-build,visual,axe,plant-repo}.test.ts` the new pinned counts written by hand

### Implementation (green)

- [X] T018 [US1] `packages/elements/src/status.ts`: `statuses`, `type Status`, `statusOf(value: string | null | undefined): Status` (R-02)
- [X] T019 [US1] `packages/tokens/src/source.ts`: `size-indicator` (size, `0.5rem`), `motion-pulse` (motion, `1600ms`) (`motion-pulse-count` removed at the phase-1 recheck, operator decision Q1 (a): the generator refuses it and rule (f) reports it); the generator's reduced-motion block covers `motion-pulse` by 012's generalised rule (R-10); tokens README and CHANGELOG
- [X] T020 [US1] `packages/elements/src/ocelle-status-indicator.ts`: attribute-backed `tone` accessor (setter writes the attribute as given, getter `statusOf(attribute)`), reflected `label` and `pulse`, `@tagname`/`@default`/descriptions/`@csspart`; shadow root as R-03 (the dot, the ring rendered only while `pulse`; both with `border-radius: var(--ocelle-radius-pill)`, the dot a state mark under constitution II, plan decision 3, FR-003), `ElementInternals` naming through 005's `expose` from the trimmed `label` only (a host `aria-label` not read, FR-014); the ring's animation as R-04 in longhands (`animation-duration: var(--ocelle-motion-pulse)`, `animation-iteration-count: 3` as a literal, operator decision Q1 (a); no `0s` literal; growth by `inset` from `size-indicator`), `animation: none` under `prefers-reduced-motion: reduce`, no `animation-*` longhand depending on tone or theme; forced colours `CanvasText`; `:host([hidden])`; `define("ocelle-status-indicator", …)`, `HTMLElementTagNameMap`; `src/index.ts` re-export
- [X] T021 [US1] `packages/elements/package.json` export `./ocelle-status-indicator.js`; regenerate and commit `packages/elements/custom-elements.json`; `packages/elements/README.md` § `ocelle-status-indicator` and `packages/elements/CHANGELOG.md` with the statements of T016
- [X] T022 [US1] `storybook/stories/status-indicator.stories.ts` with the stories of T017; `fail-empty-index` gains an empty `status-indicator.stories.ts`; `fail-token-changed` extended with the measured light story-themes; baselines `storybook/baselines/elements-ocelle-status-indicator--*.{light,dark}.png` by `OCELLE_VISUAL_ENGINE=docker pnpm run visual:update`
- [x] T023 [US1] Run each plant of T011 to T016 once and record it in the phase notes; run `gate:typecheck`, `gate:lint`, `gate:style-lint`, `gate:test-lint`, `gate:unit-tests`, `gate:manifest`, `gate:csp`, `gate:prefix`, `gate:pins`, `gate:signoff`, `gate:contrast`, `gate:brand-rules`, `gate:storybook-build`, `gate:visual`, `gate:axe` (contracts/checks.md § Gates per phase); then the affected plants (`OCELLE_VISUAL_ENGINE=docker pnpm run gate:plants -- --affected $(cat specs/018-status-elements/reviews/phase-2/base.sha)`, recorded in `reviews/phase-2/plants.md`) and `gate:mutation` (one at a time)

**Checkpoint**: `tdd-check.sh 2` reports `pass`; the indicator ships alone.

---

## Phase 3: User Story 2 - `ocelle-metric` (Priority: P2)

**Goal**: US2-1 to US2-7, § US2 bodies and the edge cases mapped to `metric.ts`; FR-001 to FR-007 for this element,
FR-020 to FR-024, FR-042; 011's eyebrow tokens used as merged (T001 (c) found 011 on `main` at `bea31300`, so no
token is added); stories `Stack`, `Row`, `EmptyValue`; SC-001's metric row.

**Independent Test**: `<ocelle-metric label="Open missions" display-value="12">` shows an uppercase eyebrow label above
a tabular value, and Chromium's tree holds a term named "Open missions" (as written) followed by its definition "12";
`layout="row"` puts both on one line; `gate:manifest`, `gate:visual` and `gate:axe` pass.

### Tests (red, one commit)

- [X] T024 [P] [US2] `packages/elements/test/scenarios/metric.ts`: US2-1 to US2-7 as shared bodies (the four eyebrow tokens' computed values from `expected.ts`, the visible label uppercase, the term named by the written label, the value in `--ocelle-figures`, `layout="row"` on one line via `.layout-row .pair` and wrapping when too narrow, `<b>12</b>` shown literally, an empty value with no placeholder and the one-line height, unknown `layout` → `stack`, right-to-left, long unbroken words) and the § US2 bodies with their plants (US2-7 flex row and its twins; find in page as T002 settled)
- [X] T025 [P] [US2] `packages/elements/test/metric.test.ts`, `packages/elements/test/browser/metric.test.ts` with `fixtures/metric.html`, `packages/elements/test/entry-metric.test.ts`; `packages/elements/test/consumers.test.ts` (T013a) extended to run T026's metric row; `entry-root.test.ts` and `exports.test.ts` extended (`OcelleMetric`)
- [X] T026 [P] [US2] `packages/elements/test/scenarios/consumers.ts` (metric row of SC-001): `label` and `display-value` with no consumer CSS, the term and its definition in Chromium's tree, both texts visible
- [X] T027 [P] [US2] `packages/elements/test/build/*.test.ts` (dist and packed `ocelle-metric.js`), `test/node/manifest.test.ts` (`ocelle-metric`: `label`, `display-value`/`displayValue`, `layout`; parts `label`, `value`; no event, method, slot or state), `test/node/readme.test.ts` (the `ocelle-metric` section; the find-in-page limitation; the `min-inline-size: 0` host rule for shrinking; CHANGELOG line)
- [X] T028 [P] [US2] Amended at the phase-1 recheck: T001 (c) found 011 on `main` (`bea31300`), so the first branch below is removed and only the "otherwise" branch is done: record in the phase notes that 011's tokens are used as merged and no token test changes. Removed branch, kept for the record: only if T001 (c) found 011 not on `main`: `packages/tokens/test/expected.ts` (the four eyebrow records exactly as 011's R-12), and the pinned contrast counts in `gates/test/contrast-pairs.test.ts`, `contrast-required.test.ts`, `contrast.test.ts`, `integration/plants-robustness.test.ts`, `integration/token-gates.test.ts` recomputed from `main` with `color-eyebrow`'s 9 rows per theme (counts first, written by hand); otherwise record in the phase notes that 011's tokens are used as merged and no token test changes
- [X] T029 [P] [US2] Story tests: `elements-stories.test.ts` gains `elements-ocelle-metric--stack`, `--row`, `--empty-value`; the pinned story counts in the four 006 integration tests

### Implementation (green)

- [X] T030 [US2] Removed at the phase-1 recheck (T001 (c): 011's eyebrow tokens are on `main`; T028's first branch is not taken); no file is changed. Was: only with T028's first branch: `packages/tokens/src/source.ts` the four eyebrow tokens as 011's R-12, `packages/tokens/contrast/pairs.json` rows with figures from `pnpm run gate:contrast --print` (stop-and-ask below threshold), tokens README and CHANGELOG
- [X] T031 [US2] `packages/elements/src/ocelle-metric.ts`: reflected `label` and `display-value`, attribute-backed `layout` (`stack` | `row`, unknown → `stack`); shadow root as R-05 (`dl` > `.pair` > `dt part="label"` with the `aria-hidden` uppercase span and the visually hidden written copy, `dd part="value"`), text bound as Lit text only; eyebrow tokens on the label, `--ocelle-figures` on the value; `overflow-wrap: break-word` on `dt` and `dd`, `min-inline-size: 0` on both in `row`; `dd { min-block-size: 1lh }`; `:host([hidden])`; `define`, `HTMLElementTagNameMap`, `src/index.ts`
- [X] T032 [US2] `packages/elements/package.json` export `./ocelle-metric.js`; `custom-elements.json` regenerated; README § `ocelle-metric` and CHANGELOG with T027's statements
- [X] T033 [US2] `storybook/stories/metric.stories.ts` with T029's stories; `fail-empty-index` and `fail-token-changed` extended; baselines `storybook/baselines/elements-ocelle-metric--*.{light,dark}.png` in the pinned container
- [X] T034 [US2] Plants of T024 to T028 run once and recorded; `gate:typecheck`, `gate:lint`, `gate:style-lint`, `gate:test-lint`, `gate:unit-tests`, `gate:manifest`, `gate:csp`, `gate:prefix`, `gate:pins`, `gate:signoff` (`gate:contrast` and `gate:brand-rules` not run: T030 removed, phase 3 adds no token), `gate:storybook-build`, `gate:visual`, `gate:axe` (contracts/checks.md § Gates per phase); the affected plants against `reviews/phase-3/base.sha`, recorded in `reviews/phase-3/plants.md`; `gate:mutation` (one at a time)

**Checkpoint**: `tdd-check.sh 3` reports `pass`.

---

## Phase 4: User Story 3 - Static `ocelle-pill-tag` and the badge (Priority: P3)

**Goal**: US3-1 to US3-8, § US3 bodies and the edge cases mapped to `pill-tag.ts`; FR-001 to FR-007 for this element,
FR-025 to FR-029 for the static mode, FR-040 (US4-12's static-at-upgrade write-back, FR-035 (e), is phase 5's, with
`adoptMirrors()`); the token `line-height-snug`; plan decisions 5 and 15 (15 as amended at the phase-1 recheck: the
slot convention as merged, operator decision Q2 (a)); static-only checks (the interactive twins of
§ US3's static click, static focus and seven names, and US3-7's "has become static" half, are phase 5's, T046;
analysis finding I2); of 012 only `linkHref`; stories `Statuses`, `Badge`, `Compact`, `WithIcon`, `LongTextWraps`;
SC-001's pill rows.

**Independent Test**: `<ocelle-pill-tag status="warning">Blocked</ocelle-pill-tag>` is not focusable, has no role,
shows "Blocked" on the warning ground with the pill radius, sits on the surrounding baseline, wraps a long text and
lets a click through to an enclosing link; `gate:manifest`, `gate:visual` and `gate:axe` pass.

### Tests (red, one commit)

- [X] T035 [P] [US3] `packages/elements/test/scenarios/pill-tag.ts`: US3-1 to US3-8 as shared bodies (per status and theme the ground `color-<status>-bg` and text `color-<status>` from `expected.ts`; the badge's `border-width` border in the status colour, transparent ground, `--ocelle-figures`, no monospace family; densities as plan decision 5 with the static compact block padding exactly `space-1`, inline `space-2`, line height `line-height-snug` = 1.2, heights pinned per density with and without an icon; wrapping with no ellipsis; the icon decorative before the text; `title` and ARIA left on the host; unknown `status`, `variant`, `density` kept in the attribute with the default look; `label` and `disabled` without effect; an empty pill without error; forced colours with a visible border; right-to-left) and every § US3 body with its plant, static-only as contracts/checks.md § US3 states (static click and static focus each beside a plain `<span>` twin, US3-8 flex row and long-word twins including the `box-sizing` plant, stretched host, baseline (amended at the phase-1 recheck: on the slot convention as merged, the icon-only `bare` pill pinned as T002 measured, its plants in the pill's source as § US3 baseline lists), seven names on a static pill with the `MovedAttributes.handle()` plant); US3-7's first clause only (its "has become static" half is US4-8's, T046); no interactive twin, no use of `MovedAttributes`, `guardHost` or an interactive mode
- [X] T036 [P] [US3] `packages/elements/test/pill-tag.test.ts`, `packages/elements/test/browser/pill-tag.test.ts` with `fixtures/pill-tag.html`, `packages/elements/test/entry-pill-tag.test.ts`; `entry-root.test.ts` and `exports.test.ts` extended (`OcellePillTag`); `packages/elements/test/consumers.test.ts` (T013a) extended to run T037's pill rows
- [X] T037 [P] [US3] `packages/elements/test/scenarios/consumers.ts` (pill rows of SC-001): `status`, badge use, `title` kept as written, slotted content as plain text, with no consumer CSS
- [X] T038 [P] [US3] `packages/tokens/test/expected.ts` (`line-height-snug` `1.2`, group type) and the tokens tests; `packages/elements/test/build/*.test.ts` (dist and packed `ocelle-pill-tag.js`), `test/node/manifest.test.ts` (the static members: `status`, `variant`, `density`, `interactive`, `href`, `disabled`; slots default and `icon`; part `pill`), `test/node/readme.test.ts` (the `ocelle-pill-tag` section: the state-pill radius reading, the static rules, clearing ARIA states from a static pill, the `min-inline-size: 0` host rule; CHANGELOG lines in both packages)
- [X] T039 [P] [US3] Story tests: `elements-stories.test.ts` gains `elements-ocelle-pill-tag--statuses`, `--badge`, `--compact`, `--with-icon`, `--long-text-wraps`; the pinned story counts

### Implementation (green)

- [X] T040 [US3] `packages/tokens/src/source.ts`: `line-height-snug` (type, `1.2`); tokens README and CHANGELOG
- [X] T041 [US3] `packages/elements/src/ocelle-pill-tag.ts` (static mode): attribute-backed `status`, `variant`, `density` accessors; reflected `interactive`, `href`, `disabled`; the `label` attribute and property (not reflected, FR-025); the mode read from the `interactive` and `href` attributes through 012's `linkHref`; static shadow root as R-06 (`.pill` box with `.icon-row` inside it, the slot convention as merged with 012 decision 33: the text in `<span class="label">`, `bare` on the row while the pill has no text, read as `ocelle-button` reads it on `slotchange` and through a lifetime `MutationObserver`; the icon at `1lh`; no row alignment of the pill's own, plan decision 15's `.icon-row { align-items: baseline }` override removed at the phase-1 recheck, operator decision Q2 (a)), the static host `inline-block` with the `.pill:not(.control)` sizing (`inline-size: fit-content; max-inline-size: 100%; box-sizing: border-box`), `overflow-wrap: break-word`; no `delegatesFocus`; the transparent-border idiom for forced colours; `attributeChangedCallback` leaves the seven passthrough names on a static host; `:host([hidden])`; `define`, `HTMLElementTagNameMap`, `src/index.ts`
- [X] T042 [US3] `packages/elements/package.json` export `./ocelle-pill-tag.js`; `custom-elements.json` regenerated; README § `ocelle-pill-tag` (static part) and CHANGELOG with T038's statements
- [X] T043 [US3] `storybook/stories/pill-tag.stories.ts` with T039's stories; `fail-empty-index` and `fail-token-changed` extended; baselines `storybook/baselines/elements-ocelle-pill-tag--*.{light,dark}.png` in the pinned container
- [X] T044 [US3] Plants of T035 to T038 run once and recorded; `gate:typecheck`, `gate:lint`, `gate:style-lint`, `gate:test-lint`, `gate:unit-tests`, `gate:manifest`, `gate:csp`, `gate:prefix`, `gate:pins`, `gate:signoff`, `gate:contrast`, `gate:brand-rules`, `gate:storybook-build`, `gate:visual`, `gate:axe` (contracts/checks.md § Gates per phase); the affected plants against `reviews/phase-4/base.sha`, recorded in `reviews/phase-4/plants.md`; `gate:mutation` (one at a time)

**Checkpoint**: `tdd-check.sh 4` reports `pass`, on static-only checks; phases 2 to 4 use nothing of 008 and, of 012,
only `linkHref` (phase 4); 012's `MovedAttributes`, `guardHost` and the pill's interactive mode are first used by the
element's source in phase 5 (a phase-4 plant may call `MovedAttributes.handle()`, as merged).

---

## Phase 5: User Story 4 - The interactive pill (Priority: P4)

**Goal**: US4-1 to US4-12, § US4 bodies and the edge cases mapped to `pill-tag-interactive.ts`; FR-029 to FR-032,
FR-035, FR-043; the token `target-small`; plan decisions 6, 7, 10, 11, 12 and 15 (12's triage note moot and 15 on the
slot convention as merged, phase-1 recheck); the additive `MovedAttributes`
methods and `guardHost`'s `active` parameter; the interactive twins of § US3's static click, static focus and seven
names, and US3-7's "has become static" half (by US4-8); stories `Button`, `Pressed`, `Link`, `Disabled`, `Focus`,
`PillHovered`, `BadgeHovered`, `PillActive`, `BadgeActive`.

**Independent Test**: `<ocelle-pill-tag interactive aria-pressed="true">Mine</ocelle-pill-tag>` is one pressed `button`
node named "Mine", one tab stop, activated by pointer, Enter, Space and `click()` with one `ocelle-pill-tag-activate`
before one `click`; a link-mode pill navigates and gives no activate event on a modifier click; mode switches keep
every passthrough value and focus; 012's control tests pass unchanged; `gate:visual` and `gate:axe` pass.

### Tests (red, one commit)

- [X] T045 [P] [US4] `packages/elements/test/control.test.ts` (additive cases only; 012's existing cases untouched): on a stand-in host, `MovedAttributes.capture()` moves and mirrors the host's attributes after upgrade (a second call too), `release()` writes each held value back as last set (off values included, cleared values not) and removes the mirrors synchronously, `adoptMirrors()` writes mirrors back unless the host sets the attribute and removes them; `guardHost(…, active)` with `active` false lets a click through untouched and with true guards it as before; each paired with its plant
- [X] T046 [P] [US4] `packages/elements/test/scenarios/pill-tag-interactive.ts`: US4-1 to US4-12 as shared bodies (the event recorder: `click` and `ocelle-pill-tag-activate` with `bubbles`, `composed`, `cancelable` true, `detail` deep-equal `{}`, target the host, the activate serial before the `click` at the host, `document` and `window`, from pointer, Enter, Space (button mode), Enter (link mode) and `click()`; the cancel path in both modes; modifier and middle clicks in link mode; none while disabled or static; `aria-pressed` applied as written in button mode only with `:state(pressed)` only for `"true"` in button mode and none in link mode (plan decision 12, as `ocelle-button` as merged); `:state(current)` in both modes; disabled as 012's FR-003 with the disabled look; the focus ring from the focus tokens in both themes and forced colours; the 24 px target from `target-small` in both axes; mode switches US4-8 to US4-11 with focus and ring; static at upgrade US4-12) and every § US4 body with its plant (the `label` attribute, values as written, equal boxes, resting and pressed looks with the resting `color-accent-strong` border, the disabled look, forced colours and forced colours pressed, the ring with the `control` class, the target corners, 012's stretched host, the baseline on the slot convention as merged (its plants as § US4 baseline lists, phase-1 recheck Q2), US4-8 same task, US4-9 attribute order, US4-10 focus and tooltip; the focus-ring clearance with the ~5 px inline margin, plan decision 11) and the interactive twins moved from phase 4, each beside its static twin (§ US4 "interactive click" with the plant "the guard active while static", "interactive focus", "seven names, interactive" with the plant "the static guard in `attributeChangedCallback` removed"; US3-7's "has become static" half within US4-8) (the corner-click clause of § US4-7 dropped by operator decision Q-P5-1 (a), `reviews/phase-5/operator-decisions.md`: the target is the control's box, at least `target-small` in each axis, proven by the edge-midpoint clicks)
- [X] T047 [P] [US4] `packages/elements/test/pill-tag-interactive.test.ts` (in process, light and dark, forced colours, rtl, `axe()` after each page) and `packages/elements/test/browser/pill-tag-interactive.test.ts` on `fixtures/pill-tag.html` plus a link-target page (real navigation and new tabs)
- [X] T048 [P] [US4] `packages/tokens/test/expected.ts` (`target-small` `1.5rem`, group size) and the tokens tests; `test/node/manifest.test.ts` (the moved attributes and their `data-ocelle-moved-*` mirrors with descriptions, the `label` attribute, `focus()` and `click()`, events `click` and `ocelle-pill-tag-activate` with `detail` type `Record<string, never>`, custom states `pressed` and `current` and no other, part `control`), `test/node/readme.test.ts` (the interactive rules: name a pill with no text, no `title` on an interactive pill, `aria-pressed` has no effect on a link, move focus when making a focused pill static, clear ARIA states from a pill made static, the activate event's terms; CHANGELOG lines)
- [X] T049 [P] [US4] Story tests: `elements-stories.test.ts` gains `elements-ocelle-pill-tag--button`, `--pressed` (pill and badge), `--link`, `--disabled`, `--focus` (focused after `updateComplete`), `--pill-hovered`, `--badge-hovered`, `--pill-active`, `--badge-active` (one pill each, with `parameters.ocelle.pointer`); the pinned story counts

### Implementation (green)

- [X] T050 [US4] `packages/elements/src/control.ts`: the additive `capture()`, `release()`, `adoptMirrors()` on `MovedAttributes` and the defaulted `active` parameter on `guardHost` (R-08); no existing method changes
- [X] T051 [US4] `packages/tokens/src/source.ts`: `target-small` (size, `1.5rem`); tokens README and CHANGELOG
- [X] T052 [US4] `packages/elements/src/ocelle-pill-tag.ts` (interactive modes): the inner `<button type="button" part="pill control" class="pill control …">` or `<a part="pill control">` per 012's `linkHref`, holding the same `.icon-row` with the text in `.label` and `bare` while the pill has no text (the slot convention as merged, phase-1 recheck Q2); `MovedAttributes` for `aria-label`, `aria-labelledby`, `aria-describedby`, `aria-controls`, `aria-current`, `aria-pressed`, `title` with the mode transitions of data-model.md (`capture()` on → interactive, `release()` synchronously on → static, re-apply on button ↔ link with `aria-pressed` applied on the button only, `adoptMirrors()` at upgrade while static for US4-12); `resolveIds`; `guardHost` with `active` following the mode; `focus()` and `click()` forwarding; the activate dispatch on 012's pattern; custom states `pressed` and `current`; the interactive host sheet (`inline-grid`, `min-inline-size: 0`, the control filling the host, the focus-ring cap and ~5 px inline margin, `min-block-size`/`min-inline-size` `target-small`); the looks of plan decision 6 with inset `box-shadow` cues and no border-width change, the resting `color-accent-strong` border on the `pill` variant, the badge's status-ground fill on hover and pressed; the disabled look and `GrayText` in forced colours; the forced-colours pressed rule; the refocus after a button ↔ link switch queued after the tooltip's `slotchange` (R-08)
- [X] T053 [US4] `custom-elements.json` regenerated; README § `ocelle-pill-tag` (interactive part) and CHANGELOG with T048's statements
- [X] T054 [US4] Stories of T049 in `storybook/stories/pill-tag.stories.ts`; `fail-token-changed` extended; baselines in the pinned container
- [X] T055 [US4] Plants of T045 to T048 run once and recorded; 012's `control.test.ts`, `button` and `action-row` suites run unchanged and pass; `gate:typecheck`, `gate:lint`, `gate:style-lint`, `gate:test-lint`, `gate:unit-tests`, `gate:manifest`, `gate:csp`, `gate:prefix`, `gate:pins`, `gate:signoff`, `gate:contrast`, `gate:brand-rules`, `gate:storybook-build`, `gate:visual`, `gate:axe` (contracts/checks.md § Gates per phase); the affected plants against `reviews/phase-5/base.sha`, recorded in `reviews/phase-5/plants.md` (the 116 of 317 judged in review fix 1, every plant as expected: round-1 R1-02); `gate:mutation` (one at a time)

**Checkpoint**: `tdd-check.sh 5` reports `pass`.

---

## Phase 6: User Story 5 - Truncation and the full-text tooltip (Priority: P5)

**Goal**: US5-1 to US5-6, § US5 bodies and the edge cases mapped to `pill-tag-truncation.ts`; FR-033, FR-034; plan
decisions 14 and 16; stories `Truncated` (focused after `updateComplete`, its baseline the ring and no bubble) and
`DisabledWraps`.

**Independent Test**: an enabled interactive pill narrower than its text shows one line with an ellipsis, its name is
still the full text, and hovering or keyboard focus shows the full text in `ocelle-tooltip`; a fitting pill shows no
tooltip; a disabled one wraps; `gate:visual` shows no bubble in either `Truncated` capture.

### Tests (red, one commit)

- [X] T056 [P] [US5] `packages/elements/test/scenarios/pill-tag-truncation.ts`: US5-1 to US5-6 as shared bodies (every step settled by `settleLayout()`; the tooltip state through `ocelle-tooltip`'s public behaviour only; negatives read after the test delay beside a showing twin; the full text from the flattened slot, trimmed and collapsed; a differing `aria-label` or `label` with the tooltip still showing the full text; right-to-left ellipsis at the inline end) and every § US5 body with its plant (the five triggers, sub-pixel, the flex row and grid track with the sibling rules of plan decision 14 and the `flex: 1 1 0` cost, after static → interactive, after a mode switch, the ring in a clipping container, negatives); carried from phase 5 (reviews/phase-5/round-1.md R1-04, notes.md): the tooltip half of contracts/checks.md § US4-10 with its plant "the refocus in `updated()` (not queued)", the `min-inline-size: 0` chain of the interactive host sheet (a truncating pill shrinks in its row), and the disabled text's `overflow-wrap: anywhere`, each with a shared body that observes it
- [X] T057 [P] [US5] `packages/elements/test/pill-tag-truncation.test.ts` and `packages/elements/test/browser/pill-tag-truncation.test.ts`; `test/node/readme.test.ts` (the sibling `flex: none` rule and its `flex: 1 1 0` cost; the touch limitation of 008's tooltip; a pill that becomes truncated while focused shows its tooltip as T002 measured on the stand-in, `spikes.md`: only when focus re-enters if that is what it measured)
- [X] T058 [P] [US5] Story tests: `elements-stories.test.ts` gains `elements-ocelle-pill-tag--truncated` and `--disabled-wraps`; the pinned story counts; a check that neither theme's `Truncated` capture contains an open `ocelle-tooltip` bubble

### Implementation (green)

- [X] T059 [US5] `packages/elements/src/ocelle-pill-tag.ts`: the internal `truncated` state measured with the fractional overflow measure (R-09), re-evaluated by the `ResizeObserver` on the text span (the `.label` wrapper of the slot convention as merged; re-targeted after a mode switch), `slotchange`, the `MutationObserver` (`characterData`, `childList`, `subtree`) and `updated()` on `disabled`, `density`, `variant` and mode changes; observers only while connected and interactive; the enabled text span `nowrap`/`overflow: hidden`/`text-overflow: ellipsis`, the disabled one wrapping; the `ocelle-tooltip` wrapper (`text` the full text, `?disabled=${!truncated}`, no `describes`) and the `./ocelle-tooltip.js` import; carried from phase 5 (reviews/phase-5/round-1.md R1-04): the tooltip half of § US4-10 (the refocus queued after the tooltip's `slotchange`, R-08), the `min-inline-size: 0` chain of the interactive host sheet and the disabled text's `overflow-wrap: anywhere`, written once T056's bodies observe them
- [X] T060 [US5] README and CHANGELOG with T057's statements; `custom-elements.json` regenerated if the manifest changes
- [X] T061 [US5] Stories of T058 in `storybook/stories/pill-tag.stories.ts`; baselines in the pinned container
- [X] T062 [US5] Plants of T056 to T058 run once and recorded; the observer-teardown mutants recorded as equivalent with their reason (contracts/checks.md § US5); `gate:typecheck`, `gate:lint`, `gate:style-lint`, `gate:test-lint`, `gate:unit-tests`, `gate:manifest`, `gate:csp`, `gate:prefix`, `gate:pins`, `gate:signoff`, `gate:storybook-build`, `gate:visual`, `gate:axe` (contracts/checks.md § Gates per phase); the affected plants against `reviews/phase-6/base.sha`, recorded in `reviews/phase-6/plants.md`; `gate:mutation` (one at a time)

**Checkpoint**: `tdd-check.sh 6` reports `pass`; #7's three status elements are complete.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: the feature as a whole against SC-001 to SC-006 and the quickstart. No new behaviour.

- [ ] T063 `packages/elements/README.md`: cross-links between the three sections and § Control conventions; § Engines checked against T001 (b) (no change unless a used feature is newer than the floor, R-14); `packages/elements/CHANGELOG.md` and `packages/tokens/CHANGELOG.md` reviewed so each surface change of contracts/elements-status.md is named once
- [ ] T064 Run quickstart.md end to end and record the outcomes in `specs/018-status-elements/reviews/phase-7/notes.md`, with SC-001 to SC-006 each checked against its test or gate; write `reviews/phase-7/tdd-exempt.md` (documentation only)
- [ ] T065 Run the full local gate set of contracts/checks.md § Gates per phase once more, then the affected plants against phase 2's base (`OCELLE_VISUAL_ENGINE=docker pnpm run gate:plants -- --affected $(cat specs/018-status-elements/reviews/phase-2/base.sha)`, so the run covers the whole feature; recorded in `reviews/phase-7/plants.md` with `- base:` that commit; never the full set locally; plan, phase 7) and `gate:mutation` (one at a time)

**Checkpoint**: `tdd-check.sh 7` reports `pass`; the feature is ready for `/ocelle-land`.

---

## Dependencies & Execution Order

- Start: after 012 and 008 are on `main` and merged into this branch by `/ocelle-land` (op 016 comes with them).
- Phase 1 blocks every other phase (T001's recheck, T002's spikes, the driver methods).
- Phase 2 (US1) adds `status.ts`, which phase 4 uses; phases 3 and 4 depend only on phase 1 and, for phase 4, on
  `status.ts` and 012's `linkHref` as merged.
- Phase 2's T013a creates `test/consumers.test.ts`; phases 3 and 4 extend it (T025, T036).
- Phase 5 (US4) depends on phase 4 (the element) and on 012's `control.ts` as merged.
- Phase 6 (US5) depends on phase 5 (the interactive modes) and on 008's `ocelle-tooltip` as merged.
- Phase 7 depends on phases 1 to 6.
- Within a phase: the red commit (all [P] test tasks) first, then the implementation tasks in order, then the gates.

## Parallel Opportunities

- Within each red commit, every [P] task writes a different file and can be written in parallel.
- Phases 3 and 4 could run in either order after phase 2; they run one at a time here (one review unit each, one
  heavy job at a time).
- Mutation, plants, visual and browser suites never run in parallel with each other.

## Implementation Strategy

- MVP: phases 1 and 2 (the indicator alone).
- Incremental: phase 3 (metric), phase 4 (static pill, the bulk of the 32 pill uses), then phases 5 and 6, which need
  012 and 008.
- Each phase is folded after approval (`/ocelle-run` step 4.3); #7 closes only when this feature and mission 012 have
  both landed.
