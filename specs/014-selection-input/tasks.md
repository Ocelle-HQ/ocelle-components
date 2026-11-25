# Tasks: Selection and Input Elements

**Input**: design documents in `specs/014-selection-input/`, as approved at the plan gate on 2026-11-13 after three
plan squad rounds (`reviews/plan/round-1` to `round-3`): `plan.md`, `spec.md`, `research.md` (R-01 to R-18),
`data-model.md`, `contracts/elements.md`, `quickstart.md`.

**Implementation waits for #10.** #10 (Storybook workbench) merged on `main` as `3828d2f` on 2026-11-13. By the
operator's decisions (spec check 1 Q3 (c); 2026-11-13 "defer to phase 1"; analysis Q1 (a)), T001 first merges
`origin/main` (`3828d2f` or later) into `claude/014-selection-input` as one recorded merge commit, then rechecks this
plan against #10 as merged. No phase work starts before any difference has been fixed in plan and tasks. The implementer
makes the merge, before `/speckit-story-implement`'s step 2 (`base.sh 1`), as an exception to that procedure for phase
1 only (second analysis, operator decision Q1 (b); the phase 1 "Delegation note" below). Phase 1's `base.sha` is
therefore the merge commit and every fold base of `/ocelle-run` step 4.3 starts after it. Every fold range then holds
no merge commit, and no fold rewrites the merge (plan.md "The phase folds and the T001 merge"). For this feature,
`/ocelle-run` step 4.3.1's and `/ocelle-land` step 8.1's "no merge commits" checks mean "none in the fold range
`FB..HEAD`" (second analysis, operator decision Q2 (b); plan.md "The phase folds and the T001 merge"). This is the
only merge of `main` during the run. `/ocelle-land` merges `main` again at landing.

**Tests**: required. Constitution Principle VIII applies to every phase. The phase flow is `base.sh`, `scaffold.sh`
(new modules with signatures and no behaviour), one red commit of test-only files proven by `red.sh` (one red record
per phase, operator decision I3), then green, the mutation gate, `tdd-check.sh` and an independent review. **Story
tests are in the red commit** (operator decision I3): the phase's `storybook/stories/*.stories.ts` and the story test
(`storybook/test/integration/elements-stories.test.ts`) are written before green. **Baselines under docker from
phase 2** (operator decision 2026-11-14 during phase 2, `reviews/phase-2/operator-decisions.md`, which replaces the
baseline gap decision in `reviews/phase-1/operator-decisions.md`; FR-053, SC-007, R-12): baselines are produced in
green in #10's pinned container under docker (`pnpm run visual:update`; a capture of a story that does not render yet
is meaningless), the shared token-story baselines that change included, and checked with `pnpm run gate:visual` in
the phase. Phase 2's T027 recorded the earlier gap; T027a produces phase 2's baselines. Each phase records in
`reviews/phase-N/notes.md` that no podman cross-engine check was possible in the session; CI confirms the baselines
at landing. Baseline PNGs that conflict after a merge are regenerated with `pnpm run visual:update`, never
hand-picked. **One axe exception** (operator decision 2026-11-14, option (a); FR-051): the clipped options of
`elements-ocelle-listbox--scrolling-listbox`, light and dark (T027b); no other story adds an entry to
`storybook/a11y-exceptions.json`.

Expected values are written by hand from the spec, the data model and research, never read from the source under
test. Guard rules, as in mission 005:
- A "does not" assertion never stands alone; it shares its test with the positive assertion it guards
  (`contracts/elements.md` § Pairings, including the setup that makes it falsifiable).
- Each guard is proven able to fail by its named plant, run once by the implementer and recorded in
  `reviews/phase-N/plants.md`.
- A plant that does not make its guard fail stops the phase (stop-and-ask).

**Shared scenario bodies** (R-11): every browser scenario is written once in `packages/elements/test/scenarios/*.ts`
against the driver and run by the in-process `elements` project (element source, mutated by Stryker) and the
`elements-browser` project (the built browser build on the strict-CSP fixture). Pure-module tests
(`roving.test.ts`, `selection.test.ts`, `link-target.test.ts`) run in `elements`, so Stryker's elements config runs
them (R-13). Keyboard input is real (`userEvent.keyboard` in process, `page.keyboard` on the fixture), never a
synthetic `KeyboardEvent` (spec "Real input only").

**Environment**: Node 22 here, 26.13.0 in CI. Browser runs set
`OCELLE_CHROMIUM_PATH=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome`. One heavy job (browser suites,
mutation, plants, `gate:visual`) at a time. Never `git stash`. Under #23, Timeout, CompileError and zero-mutant
lines are reports, not findings; entries are at most 30 changed lines.

**Organization**: Phase 1 Setup; phases 2 to 6 are User Stories 1 to 5, one review unit each, folded after approval
(`/ocelle-run` step 4.3); phase 7 Polish holds only cross-element records.

**Stop-and-ask points** (the implementer stops, records the question in the phase review, does not work around it):
- **T001 merge**: `git merge --no-ff --signoff origin/main` conflicts in a file outside
  `specs/014-selection-input/`.
- **T001 recheck**: #10 as merged differs from this plan in a way that changes a spec outcome (not just a name or
  command) — gate ids, story id scheme, the pointer or focus parameters, the axe rule set or exception format.
- **T010 spike (phase 2)**: the Chromium order of `focusout`, the `focusout` microtask and the `childList` records
  contradicts R-03 (the blur of a removal is not found by `takeRecords()` in the microtask, or a user Tab/click blur
  has a null `relatedTarget`).
- **T040 spikes (phase 3)**: the tabs host with a host `aria-label` exposes more or fewer than one named node (R-01,
  plan decision 7); generated ids do not give "tab controls panel" and "panel named by tab" in Chromium's tree (R-02).
  The first held and is decided (`reviews/phase-3/operator-decisions.md`): `ocelle-tabs` is named from `label` only,
  a host `aria-label` is not forwarded (FR-006's tabs exception, US2-24); the second did not hold.
- **T060 measurement (phase 4)**: the joined rounding is not settled after the `ResizeObserver` delivery the driver
  waits for, or a resize loop warning appears (R-06).
- **T075 spike (phase 5)**: `Accessibility.nodesUpdated` does not deliver the empty-region update (only the
  frame-order check remains; plan decision 7); the clipboard controls cannot hold (record the question open with
  decision 1).
- **T090 spikes (phase 6)**: the `file:` page cannot load the browser build or navigate under
  `--allow-file-access-from-files` (R-09, plan decision 6); the link host with a host `aria-label` exposes other than
  one named link (R-08, plan decision 7). The first did not hold; the second held and is decided
  (`reviews/phase-6/operator-decisions.md` decision 1): `ocelle-link` is named from its text or from a new `label`
  set as the anchor's `aria-label`, a host `aria-label` is not forwarded (FR-045, US5-8).
- **The engine-floor raise (T059a, before phase 4 starts)** (plan decision 1; operator decisions Q2 (c) and, second
  analysis, Q3 (b)): **decided yes** at the stop (2026-11-15, `reviews/phase-4/decision-1.md`, recorded in research
  R-06 Status). kitty-mission-ui supports WebKit 17.4 and Chromium 125 or later; the floor is raised to Chromium 125 /
  WebKit 17.4. T064, T066 and T067 apply as written, and T062a, T064a, T066a and T067a are skipped. Since the second
  merge of main the floor is mission 012's higher one, Chromium 135 / WebKit 17.4 (`reviews/landing/merge-notes.md`).
- **A plant that does not bite. Any mutation shard over 10 minutes. A new colour pairing not in R-15/R-17.**

## Format: `[ID] [P?] [Story] Description`

- **[P]**: can run in parallel (different files, no dependency on an unfinished task)
- **[Story]**: the user story of the task (US1 to US5)
- Paths are relative to the repository root.

---

## Phase 1: Setup

**Purpose**: the recheck against #10, the driver extensions every story needs, and the `elements-browser-file`
project.

**Independent Test**: `pnpm test` passes; each new driver command has a unit test that failed before it existed;
`test/browser-file/**` runs only in `elements-browser-file`.

**Delegation note** (for the orchestrator's "implement phase 1" delegation to `implementer-ivan`; second analysis I1,
operator decision Q1 (b)). Pass this text with the delegation:

> Phase 1 only, exception to `/speckit-story-implement` (operator decision Q1 (b), second analysis): do T001 (1), the
> recorded merge of `origin/main` (`git merge --no-ff --signoff origin/main`, `3828d2f` or later), before the
> procedure's step 2. Run `base.sh 1` only after the merge commit exists, so `reviews/phase-1/base.sha` is the merge
> commit. If `reviews/phase-1/base.sha` already exists and is not the merge commit, stop and ask. Then continue with
> the procedure from step 2.

### Recheck (first; documentation, exemption with reason)

- [X] T001 Merge, then recheck. (1) The implementer, before `/speckit-story-implement`'s step 2 (`base.sh 1`), as an exception to that procedure for phase 1 only (second analysis, operator decision Q1 (b); the Delegation note above): `git merge --no-ff --signoff origin/main` (`3828d2f` or later) into `claude/014-selection-input`, as one recorded merge commit (not a rebase or a squash; operator decision Q1 (a)). Check that `storybook/a11y-exceptions.json`, `storybook/baselines/`, `storybook/visual/`, `specs/006-storybook-workbench/` and the `gate:storybook-build`, `gate:visual` and `gate:axe` scripts are present. Then run `base.sh 1` (the procedure's step 2), so the phase base is the merge commit and every fold base starts after it (plan.md "Who merges, and when", "The phase folds and the T001 merge"); if `reviews/phase-1/base.sha` already exists and is not the merge commit, stop and ask. (2) Recheck plan, research R-12, contracts and tasks against #10 as merged (`3828d2f`): `specs/006-storybook-workbench/spec.md` (FR-016 rule set, FR-025 contributor note, FR-027, FR-031), `contracts/gates.md` (`storybook-build`, `visual`, `visual:update`, `axe`, exception format), `contracts/container.md`, `storybook/` layout and story id scheme, the story test's location; record each difference and its fix in `specs/014-selection-input/reviews/phase-1/recheck-10.md`; amend plan/tasks before T010 (stop-and-ask if a spec outcome changes)

### Tests (red, one commit)

- [X] T002 [P] `packages/elements/test/driver-commands.test.ts`: unit tests for `pressKeys(key, modifiers)`, `clickTarget(target, { button, modifiers, count })`, child addressing by `{ parent, kind, index }`, `focusedElement()` through shadow roots returning that identity, `mutate(steps)` (several DOM steps in one task), the non-settling `resize` and `afterResizeDelivery`, `computedPart`, page scroll offset and viewport size (R-11)
- [X] T003 [P] `packages/elements/test/driver-recorders.test.ts`: unit tests for the keydown recorder (key, `defaultPrevented`, document bubble phase), the clipboard observer (`writeText`, `write`, `execCommand('copy')`) installed at every mount and fixture page, `activationRecord` (click, end of click task, first frame, request; R-07) and the `axUpdates` recorder of `Accessibility.nodesUpdated` (R-07)
- [X] T004 [P] `packages/elements/test/ax-states.test.ts`: the separate `axStates` command reports `selected`, `pressed`, `disabled`, `controls`, `live` and names; mission 005's `axTree` output stays exactly `{ role, name }` (PLAN-TESTABILITY-1-014)
- [X] T005 [P] `gates/test/vitest-config.test.ts`: project `elements-browser-file` exists with `--allow-file-access-from-files`, includes only `packages/elements/test/browser-file/**`; `elements` and `elements-browser` exclude it; `vitest.mutation.config.ts` excludes `elements-browser-file` (R-09)
- [X] T005a `red.sh 1`: the red record of the phase. It is the red proof for T002 and T003. Their driver lives under `packages/elements/test/`, a test path (`story-config.yml` `test_pathspec`), so `tdd-check.sh` overlays it onto the base, and the phase-level check fails at base only through T004 and T005 (analysis U2)

### Implementation (green)

- [X] T006 `packages/elements/test/scenarios/driver.ts`, `packages/elements/test/in-process.ts`, `packages/elements/test/browser/driver.ts`: the commands and recorders of T002, T003
- [X] T007 `packages/elements/test/commands.ts` and `vitest.config.ts` (browser commands): `axStates` (T004)
- [X] T008 `vitest.config.ts`, `vitest.mutation.config.ts`: the `elements-browser-file` project and exclusions (T005)
- [X] T008a Run one named plant per driver command and recorder once, and record each with the test that failed in `specs/014-selection-input/reviews/phase-1/plants.md` (analysis U2). The plants: `pressKeys` dropping modifiers; `clickTarget` ignoring `button`, `modifiers` or `count`; child addressing off by one; `focusedElement` stopping at the first shadow host; `mutate` running its steps in separate tasks; `resize` that settles; `afterResizeDelivery` resolving before the delivery; `computedPart` reading the host; a constant page scroll offset or viewport size; the keydown recorder in the capture phase; the clipboard observer not installed on fixture pages, and one per observed call (`writeText`, `write`, `execCommand('copy')`); `activationRecord` without the first frame; `axUpdates` dropping updates; `axStates` without `pressed`; `axTree` with an extra field. Phase 1's review states that `red.sh 1` (T005a), not `tdd-check.sh`'s per-unit base run, is the red proof for T002 and T003

**Checkpoint**: the T001 merge commit is on the branch below phase 1's `base.sha`; `tdd-check.sh 1` reports `pass`;
`recheck-10.md` and `plants.md` committed.

---

## Phase 2: User Story 1 - Pick one item from a list with the keyboard: `ocelle-listbox` and `ocelle-option` (Priority: P1) 🎯 MVP

**Goal**: US1 scenarios 1 to 23; FR-001 to FR-018 with FR-014a; the shared keyboard mechanism, selection model, focus
record and internals symbol; `@ocelle/tokens`' new `accent-strong` pairs (R-17); the activate event (R-18).

**Independent Test**: on the strict-CSP fixture, a listbox named "Folders" with five options is tabbed into, walked
with every key, selected and activated; tree, focus, paint and events are read after each key; axe reports no
`aria-allowed-attr` on the listbox stories.

### Spike (first)

- [X] T010 [US1] Spike R-03 in Chromium, recorded in `specs/014-selection-input/reviews/phase-2/spike.md`: the order of `blur`, `focusout` (with `relatedTarget`), the `focusout`-queued microtask and the `childList` records for (a) a script removal and a script move of a focused option, (b) a user Tab and a user click out followed by a host move or removal in a microtask and in a `requestAnimationFrame`; stop-and-ask on contradiction

### Scaffold

- [X] T011 [US1] `scaffold.sh`: `packages/elements/src/{roving,selection,internals,ocelle-listbox,ocelle-option}.ts` with exported signatures and no behaviour; `src/index.ts`, `src/browser.ts` re-export; `package.json` `exports` for `./ocelle-listbox.js` and `./ocelle-option.js` (contracts § Entry points)

### Tests (red, one commit)

- [X] T012 [P] [US1] `packages/elements/test/roving.test.ts`: `owns(event, children)` (target is a child itself and not `defaultPrevented`) and `target(key, { index, enabled, wrap, rtl, axis })` for every key of the three key maps (R-04), ends, all disabled, single child, rtl, unhandled keys → `null`; "Disabled children stay in the list with `enabled` false (focusable at `tabindex="-1"`, skipped by every move)"
- [X] T013 [P] [US1] `packages/elements/test/selection.test.ts`: every transition of data-model § Transitions for all three kinds, FR-009 defaults ("missing or blank (only whitespace) → index as string", "never `""`; not trimmed"), FR-010 current-value no-op, FR-010a remembered value and Precedence, FR-011/FR-011a targets, batching "one batch per microtask checkpoint" with the `value` setter taking pending records, the focus record (`blurred` set only on a `relatedTarget`-null `focusout`, kept only when its microtask's `takeRecords()` lists the child in `removedNodes`), moves keeping selection (SPEC-3-03), a focused child becoming disabled keeping focus at `tabindex="-1"` (PLAN-CORRECTNESS-1-004 (a))
- [X] T014 [P] [US1] `packages/elements/test/scenarios/listbox.ts`: US1-1 to US1-23 as shared scenario bodies, each "does not" outcome paired as `contracts/elements.md` § Pairings states (including "a move does not steal focus back", "Tab out while the host re-renders on blur", Space does not scroll, disabled click, forgotten remembered value). The spec's Edge Cases for the listbox, by name (analysis G1): an `ocelle-option` outside a listbox (no role, no tab stop); two options with the same value (a host set selects the first; a user selection of the second exposes the second and reports the same value); an empty listbox (named, no tab stop); a long option label at 320 px (wraps, the option grows, nothing truncated, no sideways scroll); host `hidden` on the listbox (no box, no node); a second definition of `ocelle-listbox` and `ocelle-option` (the first wins, nothing thrown); the option's accessible name following a text change; a disabled option under the pointer shows no hover paint (no `hover-bg` fill), paired with an enabled sibling's `hover-bg` fill under the pointer (contracts § Pairings, plant: a `:host(:hover)` rule with no disabled exclusion; second analysis G1)
- [X] T015 [P] [US1] `packages/elements/test/listbox.test.ts` (in-process) and `packages/elements/test/browser/listbox.test.ts` with `packages/elements/test/browser/fixtures/listbox.html` (strict-CSP fixture; zero violations, allowed requests only, no console message)
- [X] T016 [P] [US1] Paint and ring reads in `scenarios/listbox.ts`: selected bar on the inline-start edge in `accent-strong` on the main grounds and `Highlight` in forced colours (R-15), the option's focus ring on a raised `::after` read on all four sides beside a hovered next and previous option inside the US1-16 clip (R-06, R-15)
- [X] T017 [P] [US1] `packages/elements/test/entry-ocelle-listbox.test.ts`, `entry-ocelle-option.test.ts`: importing `ocelle-listbox.js` alone defines `ocelle-listbox` and `ocelle-option` (R-16; plant: parent not importing child); `entry-root.test.ts` gains both
- [X] T018 [P] [US1] `packages/elements/test/node/selection-pairs.test.ts` with `test/node/selection-pairs-check.ts`: every fill, bar, border and text token the listbox's stylesheet paints, per ground, is a checked pair in `packages/tokens/contrast/pairs.json` (R-17); `gates/test/contrast-pairs.test.ts` pinned counts move from 160 light / 168 dark to 166 / 174
- [X] T019 [P] [US1] `storybook/stories/listbox.stories.ts` (no selection, selected, disabled option, focused option, hovered option via #10's pointer parameter, scrolling listbox, option with icon; FR-050) and `storybook/test/integration/elements-stories.test.ts`: each listbox story renders its options in light and dark, and axe reports no `aria-allowed-attr` (R-01; plant: internals in a private field); `packages/elements/test/node/readme.test.ts` gains the listbox statements (usage, properties, events and payloads including `ocelle-listbox-activate`, keyboard model, naming, tokens read, the amended module rule "importing the module defines that element and the elements it renders or owns as children")
- [X] T020 [US1] `red.sh 2`: the red record of the phase

### Implementation (green)

- [X] T021 [US1] `packages/elements/src/roving.ts` (R-04) and `packages/elements/src/selection.ts` (R-05, R-03) passing T012, T013
- [X] T022 [US1] `packages/elements/src/internals.ts`: the internals symbol axe 4.14 reads (PLAN-FRESH-1-001 (a), R-01)
- [X] T023 [US1] `packages/elements/src/ocelle-option.ts` and `packages/elements/src/ocelle-listbox.ts`: roles via internals, state attributes on option hosts, roving tabindex, `part="list"` scroll container with ring padding, `ocelle-listbox-change` and `ocelle-listbox-activate` (R-18), minimum block size `--ocelle-target-min` (R-10), raised `::after` ring, icon slot per the slot convention
- [X] T024 [US1] `packages/tokens/src/source.ts`, `packages/tokens/contrast/pairs.json`, `packages/tokens/CHANGELOG.md`: `color-accent-strong` non-text pairs on the main grounds (R-17), figures from `gates/lib/wcag.ts`
- [X] T025 [US1] `pnpm --filter @ocelle/elements run manifest`: `packages/elements/custom-elements.json` per contracts § `ocelle-listbox`, § `ocelle-option`
- [X] T026 [US1] `packages/elements/README.md` listbox section and amended module rule; `packages/elements/CHANGELOG.md` entry
- [X] T027 [US1] Baselines for the listbox stories: no baseline is produced or committed in this phase, including the shared token-story baselines; record in `reviews/phase-2/` that the stories' light and dark baselines and the `visual` gate are a known gap, to be produced from CI's pinned-container captures during `/ocelle-land` (operator decision 2026-11-14, `reviews/phase-1/operator-decisions.md`; FR-053, SC-007)
- [X] T027a [US1] Baselines for the listbox stories under docker (operator decision 2026-11-14, `reviews/phase-2/operator-decisions.md`, replacing T027's gap; FR-053, SC-007, R-12): `pnpm run visual:update` in #10's pinned container under docker writes the light and dark baselines of the seven listbox stories (`elements-ocelle-listbox--no-selection`, `--selected`, `--disabled-option`, `--focused-option`, `--hovered-option`, `--scrolling-listbox`, `--option-with-icon`) and of any shared story, the token stories included, whose pixels change; inspect and commit them under `storybook/baselines/` with the reason in the commit message. In the same phase: move the story-theme counts `gates/test/integration/visual.test.ts` pins (42) to the repository's count (56 with the listbox stories), and add every light listbox story that shows `color-ink`, as measured in the pinned container, to `gates/plants/visual/fail-token-changed/plant.json`'s findings (and its note), as that plant asks for each new story (`reviews/phase-2/notes.md`); then `pnpm run gate:visual` → exit 0. Record in `reviews/phase-2/notes.md` that no podman cross-engine check was possible in this session and that CI confirms the baselines at landing
- [X] T027b [US1] The one axe exception FR-051 allows (operator decision 2026-11-14, `reviews/phase-2/operator-decisions.md`, option (a)): add to `storybook/a11y-exceptions.json` one entry per serious `color-contrast-incomplete` node `gate:axe` reports on `elements-ocelle-listbox--scrolling-listbox`, the options clipped by the list's `overflow: auto` container (`epsilon` to `kappa`, six per theme), light and dark, in the form of #10's Prose document entries (`story`, `theme`, `rule`, `selector` exactly as the gate prints it, `reason` naming `elmPartiallyObscured` on the clipped option, `sunset` as plan.md Complexity Tracking states it, `plan` `specs/014-selection-input/plan.md`), and in the same commit one row per entry in the table of plan.md Complexity Tracking (story, theme, rule, selector in backticks, reason, sunset), the rows that table reserves; no entry for any other story or node. Then `pnpm run gate:axe` → exit 0 with the twelve nodes excepted and no `stale-exception` or `unrecorded-exception`; `gates/test/integration/axe.test.ts`'s repository runs pass
- [X] T028 [US1] Run each US1 plant once, record in `specs/014-selection-input/reviews/phase-2/plants.md`; then `gate:typecheck`, `gate:lint`, `gate:test-lint`, `gate:style-lint`, `gate:brand-rules`, `gate:unit-tests`, `gate:signoff`, `gate:pins`, `gate:config-copies`, `gate:contrast`, `gate:manifest`, `gate:csp`, `gate:prefix`, `gate:storybook-build`, `gate:visual`, `gate:axe`, `gate:plants`, `gate:mutation -- --base <phase base>` one at a time (the constitution's merge gates as the repository defines them; analysis G4). `gate:visual` runs under docker in the pinned container (T027a); no podman cross-engine check is possible in this session, recorded in the phase's notes, and CI confirms the baselines at landing (operator decision 2026-11-14, `reviews/phase-2/operator-decisions.md`). `gate:axe` passes with only T027b's exception

**Checkpoint**: `tdd-check.sh 2` reports `pass`; quickstart steps 1 to 6 pass for the listbox.

---

## Phase 3: User Story 2 - Switch between panels with real tabs: `ocelle-tabs` (Priority: P2)

**Goal**: US2 scenarios 1 to 24; FR-019 to FR-025 with FR-021a; tablist on the shadow part named from `label` only
(FR-006's tabs exception), manual slot assignment,
generated ids (R-02), `aria-labelledby` on the assigned panel only.

**Independent Test**: on the strict-CSP fixture, three tabs and panels are walked with every key, keys typed in a
panel's text field stay in the field, and the tree shows the tablist, the controlled panel named by its tab, and no
unselected panel node; the tabs stories pass #10's full axe rule set.

### Spikes (first)

- [X] T040 [US2] Spikes recorded in `specs/014-selection-input/reviews/phase-3/spike.md`: R-02 generated ids vs ARIA element reflection in Chromium; the tabs host with a host `aria-label` exposes exactly one named node (R-01); axe 4.14's `color-contrast` incomplete on unassigned panels with `aria-labelledby`, for an upstream report (PLAN-FRESH-2-002); stop-and-ask per the list above

### Scaffold

- [X] T041 [US2] `scaffold.sh`: `packages/elements/src/{ocelle-tabs,ocelle-tab,ocelle-tab-panel}.ts`; `index.ts`, `browser.ts`; `exports` entries

### Tests (red, one commit)

- [X] T042 [P] [US2] `packages/elements/test/scenarios/tabs.ts`: US2-1 to US2-24 with pairings (a host `aria-label` on `ocelle-tabs`, written at first render and changed after, does not name the tablist and stays as the host wrote it, paired with the tablist named from `label`, plant: forwarding the host `aria-label` to `part="tablist"` (US2-24, contracts § Pairings); unselected panels have no node, no id reference across a shadow root, keys from panel content not handled, Enter/Space on the selected tab silent), the selected bar on the block-end edge, the focused tab's raised ring read. The spec's Edge Cases for tabs, by name (analysis G1): an `ocelle-tab` and an `ocelle-tab-panel` outside `ocelle-tabs` (no role, no tab stop); two tabs with the same value (a host set selects the first; a user selection of the second exposes the second and reports the same value); a long tab label at 320 px (wraps, the tab grows, nothing truncated, no sideways scroll); host `hidden` on the tabs (no box, no node); a second definition of each of the three tags (the first wins, nothing thrown); the tab's accessible name and the panel's name following a text change; a disabled tab under the pointer shows no hover paint (no `hover-bg` fill), paired with an enabled sibling's `hover-bg` fill under the pointer (contracts § Pairings, plant: a `:host(:hover)` rule with no disabled exclusion; second analysis G1)
- [X] T043 [P] [US2] `packages/elements/test/tabs.test.ts`, `packages/elements/test/browser/tabs.test.ts`, `packages/elements/test/browser/fixtures/tabs.html` (children with no host-written id or `aria-*`, SC-003)
- [X] T044 [P] [US2] `packages/elements/test/entry-ocelle-tabs.test.ts` (defines tab and panel too), `entry-ocelle-tab.test.ts`, `entry-ocelle-tab-panel.test.ts`; `entry-root.test.ts`
- [X] T045 [P] [US2] `storybook/stories/tabs.stories.ts` (first selected, another selected, disabled tab, wrapped rows, focused tab, hovered tab via #10's pointer parameter, focused tab panel with no focusable content (the panel is the tab stop, US2-6), tab with icon; FR-050) and the story test: #10's full rule set on the tabs stories, no violation and no serious or critical `incomplete` (plant: `aria-labelledby` on every panel); `selection-pairs.test.ts` and `readme.test.ts` gain the tabs, including the statement that the tabs are named with `label` and a host `aria-label` does not name the tablist (FR-006's tabs exception)
- [X] T046 [US2] `red.sh 3`

### Implementation (green)

- [X] T047 [US2] `packages/elements/src/ocelle-tab.ts`, `ocelle-tab-panel.ts`, `ocelle-tabs.ts`: `role="tablist"` on `part="tablist"` named from `label` only (no host `aria-label` read, forwarded or in `observedAttributes`; no host attribute written; FR-006's tabs exception, R-01), manual slot assignment per batch, generated ids, `aria-controls` on every paired tab, `aria-labelledby` on the assigned panel only, panel focusability observer (R-03), wrapped rows (FR-022), raised `::after` ring with the host unraised (R-06)
- [X] T048 [US2] Manifest; README tabs section (name the tabs with `label`; a host `aria-label` does not name the tablist); CHANGELOG
- [X] T049 [US2] Baselines for the tabs stories with `pnpm run visual:update` in #10's pinned container under docker (`storybook/baselines/`), with any shared baseline (the token stories included) that changes, inspected and committed with the reason in the commit message; move the story-theme counts of `gates/test/integration/visual.test.ts` and add the new light stories that show `color-ink` to `gates/plants/visual/fail-token-changed/plant.json`; record in `reviews/phase-3/notes.md` that no podman cross-engine check was possible and CI confirms the baselines at landing (operator decision 2026-11-14, `reviews/phase-2/operator-decisions.md`; FR-053, SC-007)
- [X] T050 [US2] Plants recorded in `reviews/phase-3/plants.md`; the gates of T028 one at a time

**Checkpoint**: `tdd-check.sh 3` reports `pass`.

---

## Phase 4: User Story 3 - Choose one of a few options as a toggle group: `ocelle-segmented-choice` (Priority: P3)

**Goal**: US3 scenarios 1 to 19; FR-026 to FR-030; a toolbar of toggle buttons; the joined variant with its internal
`ResizeObserver`, `accent-strong` lines around the pressed segment; custom states and the engine-floor raise to
Chromium 125 / WebKit 17.4 (plan decision 1, answered yes at the stop before the phase, T059a,
`reviews/phase-4/decision-1.md`; the row-attribute tasks T062a, T064a, T066a and T067a are skipped). Since the second
merge of main the floor is mission 012's Chromium 135 / WebKit 17.4 (`reviews/landing/merge-notes.md`).

**Independent Test**: on the strict-CSP fixture, four segments are walked and pressed; the joined variant is measured
at one-row and two-row widths after the observer's delivery; shared lines beside the pressed and a hovered segment
stay `accent-strong` with a focused neighbour on either side.

### Stop for plan decision 1 (before the phase starts; decided yes)

- [X] T059a [US3] **Stop until plan decision 1 is recorded in research R-06** (done: answered yes, 2026-11-15, recorded in `specs/014-selection-input/reviews/phase-4/decision-1.md` and research R-06 Status; floor raised to Chromium 125 / WebKit 17.4, and since the second merge of main to mission 012's Chromium 135 / WebKit 17.4, `reviews/landing/merge-notes.md`) (engine floor; operator decisions Q2 (c) and, second analysis, Q3 (b)). Phase 4 starts only after the answer: no measurement, scaffold or test of phase 4 before it. Record the answer ("yes": custom states and the raised floor; "no": row attributes, floor unchanged) in `specs/014-selection-input/reviews/phase-4/decision-1.md` (not marked [P]: it blocks every phase 4 task)

### Measurement (first)

- [X] T060 [US3] Measure in Chromium, recorded in `specs/014-selection-input/reviews/phase-4/measure.md`: when the joined group's rounding is settled after a resize relative to `afterResizeDelivery`, re-wrap without a size change (font load, text change), no resize-loop warning (R-06); stop-and-ask per the list above

### Scaffold

- [X] T061 [US3] `scaffold.sh`: `packages/elements/src/{ocelle-segmented-choice,ocelle-segment}.ts`; `index.ts`, `browser.ts`; `exports`. No row mechanism is scaffolded (no row-state method and no row attribute): the red tests read the radii, not the mechanism, and the mechanism follows the answer recorded at T059a (yes: custom states, T066)

### Tests (red, one commit)

- [X] T062 [P] [US3] `packages/elements/test/scenarios/segmented-choice.ts`: US3-1 to US3-19 with pairings (focus-only moves emit nothing, joined: no `style` attribute, shared line not widened, pressed lines not `control-border` also with a focused neighbour), resize measurements, four-sided ring read beside the pressed and a hovered segment, the focused pressed segment beside a later hovered one. The spec's Edge Cases for the segmented choice, by name (analysis G1): an `ocelle-segment` outside a segmented choice (no role, no tab stop); two segments with the same value (a host set presses the first; a user press of the second exposes the second as pressed and reports the same value); a long segment label at 320 px in both variants (wraps, the segment grows, nothing truncated, no sideways scroll); host `hidden` on the segmented choice (no box, no node); a second definition of both tags (the first wins, nothing thrown); the segment's accessible name following a text change; a disabled segment under the pointer shows no hover paint (no `hover-bg` fill and, in the joined variant, no `accent-strong` lines), paired with an enabled sibling's `hover-bg` fill (and joined `accent-strong` lines) under the pointer (contracts § Pairings, plant: a `:host(:hover)` rule with no disabled exclusion; second analysis G1)
- [X] T062a [P] [US3] **Skipped by plan decision 1** (answered yes at the stop, T059a; `specs/014-selection-input/reviews/phase-4/decision-1.md`): ticked as skipped, not done; the text below is kept for the record. Only if decision 1 was answered no at the stop (T059a): in `scenarios/segmented-choice.ts`, a host-written `data-ocelle-row-start` on a middle segment does not survive the next regroup, paired with the measured radii per row (contracts § Pairings, plant: writing the row attributes only when absent)
- [X] T062b [P] [US3] `packages/elements/test/scenarios/tabs.ts`: US2-21's body with the real element, in this phase's red commit (T065), run in both harnesses (`test/tabs.test.ts`, `test/browser/tabs.test.ts`): the selected `Plan` panel holds a `<button>`, a text `<input>` and an `ocelle-segmented-choice`; ArrowRight on a segment moves focus to the next segment only, `Plan` stays selected and its panel shown, no `ocelle-tabs-change` is emitted, paired in the same body with ArrowRight on a tab, which moves focus and selection. The phase 3 stand-in body (a nested `ocelle-tabs` in the Plan panel) stays (phase 3 review R1-04, `reviews/phase-3/notes.md` "Stand-ins")
- [X] T063 [P] [US3] `packages/elements/test/segmented-choice.test.ts`, `packages/elements/test/browser/segmented-choice.test.ts`, `fixtures/segmented-choice.html`; `entry-ocelle-segmented-choice.test.ts`, `entry-ocelle-segment.test.ts`; `entry-root.test.ts`
- [X] T064 [P] [US3] `storybook/stories/segmented-choice.stories.ts` (default, joined one row, joined wrapped, pressed, disabled, focused, hovered segment in the default variant and in the joined variant via #10's pointer parameter, icon; FR-050) and the story test; `selection-pairs.test.ts`; `readme.test.ts` gains the segmented choice and the engine floor Chromium 125 / WebKit 17.4 with `:state()` as the feature (decision 1 answered yes at the stop, T059a; since the second merge of main the floor line is mission 012's Chromium 135 / WebKit 17.4, and the custom-states feature line keeps Chromium 125 / WebKit 17.4, `reviews/landing/merge-notes.md`)
- [X] T064a [P] [US3] **Skipped by plan decision 1** (answered yes at the stop, T059a; `specs/014-selection-input/reviews/phase-4/decision-1.md`): ticked as skipped, not done; the text below is kept for the record. Only if decision 1 was answered no at the stop (T059a), instead of T064's engine-floor statement: `readme.test.ts` asserts the engine floor stays Chromium 120 / WebKit 16.4, and that the README documents `data-ocelle-row-start`, `data-ocelle-row-end`, `data-ocelle-first-row` and `data-ocelle-last-row` as element-owned and overwritten on every regroup, internal (not part of the public surface and not a styling hook: hosts must not style on them) and subject to change in a PATCH release (R-06 Status; contracts § `ocelle-segmented-choice`; second analysis U2); the stories and story test of T064 are unchanged
- [X] T065 [US3] `red.sh 4`

### Implementation (green)

- [X] T066 [US3] `packages/elements/src/ocelle-segment.ts`, `ocelle-segmented-choice.ts`: `toolbar` role, toggle buttons with `aria-pressed`, roving with wrap on both axes, `joined` with the internal `ResizeObserver` on the group and its segments, custom states for rows, `accent-low` fill and block-end bar for the pressed segment, `accent-strong` lines around it, raised `::after` ring, target size
- [X] T066a [US3] **Skipped by plan decision 1** (answered yes at the stop, T059a; `specs/014-selection-input/reviews/phase-4/decision-1.md`): ticked as skipped, not done; the text below is kept for the record. Only if decision 1 was answered no at the stop (T059a), instead of T066's custom states: the parent writes the row attributes on segment hosts at each regroup and overwrites host-written ones, and the segment's CSS rounds with `:host([data-ocelle-row-start])` and so on; no internal row method on the segment, no `:state()` (R-06 Status; passes T062a)
- [X] T067 [US3] Manifest; README segmented-choice section and engines section; CHANGELOG
- [X] T067a [US3] **Skipped by plan decision 1** (answered yes at the stop, T059a; `specs/014-selection-input/reviews/phase-4/decision-1.md`): ticked as skipped, not done; the text below is kept for the record. Only if decision 1 was answered no at the stop (T059a), instead of T067's engines section: README segmented-choice section with the row attributes as element-owned, internal, not a styling hook and subject to change in a PATCH (T064a; second analysis U2), no manifest entry for them, engines section unchanged (Chromium 120 / WebKit 16.4); CHANGELOG without a floor raise
- [X] T068 [US3] Baselines for the segmented-choice stories with `pnpm run visual:update` in #10's pinned container under docker (`storybook/baselines/`), with any shared baseline (the token stories included) that changes, inspected and committed with the reason in the commit message; move the story-theme counts of `gates/test/integration/visual.test.ts` and add the new light stories that show `color-ink` to `gates/plants/visual/fail-token-changed/plant.json`; record in `reviews/phase-4/notes.md` that no podman cross-engine check was possible and CI confirms the baselines at landing (operator decision 2026-11-14, `reviews/phase-2/operator-decisions.md`; FR-053, SC-007)
- [X] T069 [US3] Plants recorded in `reviews/phase-4/plants.md`; the gates of T028

**Checkpoint**: `tdd-check.sh 4` reports `pass`.

---

## Phase 5: User Story 4 - Copy a long command through the host: `ocelle-copy-field` (Priority: P4)

**Goal**: US4 scenarios 1 to 12; FR-031 to FR-044; request-only, deferred past the next rendering update; polite live
region; native Copy control with `copy-control` part.

**Independent Test**: on the strict-CSP fixture, a 300-character command wraps at 320 px with no horizontal scroll;
click, Enter and Space each emit one request after the next frame; no clipboard call; a synchronous listener's status
reaches the tree as empty → text.

### Spike (first)

- [X] T075 [US4] Spike R-07 recorded in `specs/014-selection-input/reviews/phase-5/spike.md`: `Accessibility.nodesUpdated` delivers the empty-region update before the refill for deferred dispatch and not for synchronous dispatch; on a spike page with no clipboard permission granted, the reject control (write with no click) and the resolve control (write in the click handler) hold, then a write from the deferred request is recorded with `navigator.userActivation.isActive`; stop-and-ask per the list above

### Scaffold

- [X] T076 [US4] `scaffold.sh`: `packages/elements/src/ocelle-copy-field.ts`; `index.ts`, `browser.ts`; `exports`

### Tests (red, one commit)

- [X] T077 [P] [US4] `packages/elements/test/scenarios/copy-field.ts`: US4-1 to US4-12 with the clipboard observer, the live-region MutationObserver, US4-6's synchronous listener with `activationRecord` and `axUpdates` (plants: synchronous dispatch, microtask dispatch, dispatch in the element's own frame callback), disabled control emits nothing, flush border and target size, `accent-strong` divider against the inset well. The spec's Edge Cases for the copy field, by name (analysis G1): `status` set with no request (shown in the live region like any status); the `status` attribute not reflected after the element clears `status` (the property reads `""`, the attribute stays as written; contracts § Pairings); host `hidden` (no box, no node); a second definition of `ocelle-copy-field` (the first wins, nothing thrown)
- [X] T078 [P] [US4] `packages/elements/test/copy-field.test.ts`, `packages/elements/test/browser/copy-field.test.ts`, `fixtures/copy-field.html`; `entry-ocelle-copy-field.test.ts` (defines `ocelle-icon` too); `entry-root.test.ts`
- [X] T079 [P] [US4] `storybook/stories/copy-field.stories.ts` (short, wrapped long command, with a status, empty, focused Copy control (US4-9); FR-050) and the story test; `selection-pairs.test.ts`; `readme.test.ts` gains the copy field, the `copy-control` surface (box, name, events), the future `ocelle-button` swap as a PATCH (FR-044), and the request outside the click's task with the user-activation note
- [X] T080 [US4] `red.sh 5`

### Implementation (green)

- [X] T081 [US4] `packages/elements/src/ocelle-copy-field.ts` (R-07): group role, `part="value"` text, imperative live-region text, native button `part="copy-control"` with `ocelle-icon name="copy"`, deferred request with status cleared first
- [X] T082 [US4] Manifest; README copy-field section; CHANGELOG
- [X] T083 [US4] Baselines for the copy-field stories with `pnpm run visual:update` in #10's pinned container under docker (`storybook/baselines/`), with any shared baseline (the token stories included) that changes, inspected and committed with the reason in the commit message; move the story-theme counts of `gates/test/integration/visual.test.ts` and add the new light stories that show `color-ink` to `gates/plants/visual/fail-token-changed/plant.json`; record in `reviews/phase-5/notes.md` that no podman cross-engine check was possible and CI confirms the baselines at landing (operator decision 2026-11-14, `reviews/phase-2/operator-decisions.md`; FR-053, SC-007)
- [X] T084 [US4] Plants recorded in `reviews/phase-5/plants.md`; the gates of T028

**Checkpoint**: `tdd-check.sh 5` reports `pass`.

---

## Phase 6: User Story 5 - Follow or act on a link in running text: `ocelle-link` (Priority: P5)

**Goal**: US5 scenarios 1 to 14; FR-045 to FR-049; native anchor named from its text or `label` (a host `aria-label`
not forwarded; FR-045, operator decision during phase 6), plain activations intercepted, navigation only to
allowed resolved protocols.

**Independent Test**: on the strict-CSP fixture, links with and without `href` are activated by Enter and click,
with and without a cancelling listener, with modifiers; events, navigation (window marker) and the tree are read;
the `file:` copy navigates to its `file:` target.

### Spikes (first)

- [X] T090 [US5] Spikes recorded in `specs/014-selection-input/reviews/phase-6/spike.md`: the `file:` fixture loads the browser build and navigates under `--allow-file-access-from-files` (R-09); the link host with a host `aria-label` exposes exactly one named link (R-08); stop-and-ask per the list above. Done (`f947d58`): R-09 confirmed; the R-08 stop held and the operator chose option (c) (`reviews/phase-6/operator-decisions.md` decision 1): the link is named from its text or `label`, a host `aria-label` is not forwarded (FR-045, US5-8, R-08)

### Scaffold

- [X] T091 [US5] `scaffold.sh`: `packages/elements/src/{link-target,ocelle-link}.ts`; `index.ts`, `browser.ts`; `exports`

### Tests (red, one commit)

- [X] T092 [P] [US5] `packages/elements/test/link-target.test.ts`: `navigationTarget(href, baseURI, documentProtocol)` for `http:`, `https:`, the document's own protocol, `javascript:` padded and tab-split, `data:`, protocol-relative, custom-scheme `<base>`, `""` and fragments (FR-047)
- [X] T093 [P] [US5] `packages/elements/test/scenarios/ocelle-link.ts`: US5-1 to US5-14 with "Observing navigation" (fragments in process; cross-document on the fixture; US5-11's base inserted after load; `context.on("page")` for US5-13's Ctrl, Shift and middle click), modified activations emit nothing (reopened by operator decision 2 during phase 6, R1-01: US5-13's body also presses Meta+Enter on the link with `href`, and for Meta, click and Enter, asserts only no event and the default not prevented, nothing about the navigation that follows), Space not handled, per-fragment focus ring. US5-8 on the `label` path (contracts § Pairings): the link named by a `label` that starts with the visible text and following a later `label` change, exactly one named node in the paragraph (plant: `label` set as the host's `aria-label` instead of the anchor's), named by its text with no or a blank `label`; a host `aria-label` beside `label`, written at first render and changed after, and a host `aria-label` with no `label`, do not name the link and read back as the host wrote them (plant: forwarding the host `aria-label` to `part="anchor"`), paired with the link named from its text alone. The spec's Edge Cases for the link, by name (analysis G1): host `hidden` (no box, no node); a second definition of `ocelle-link` (the first wins, nothing thrown)
- [X] T093a [P] [US5] `packages/elements/test/scenarios/tabs.ts`: US2-22's body with the real element, in this phase's red commit (T096), run in both harnesses (`test/tabs.test.ts`, `test/browser/tabs.test.ts`): the selected panel holds only an `ocelle-link` (its focusable anchor inside its shadow root); Tab on the selected tab focuses the link's anchor and the panel itself is not a tab stop (no `tabindex` on the panel), paired in the same body with the panel holding one `<button>` that the host removes, after which Tab from the selected tab focuses the panel. The phase 3 stand-in body (`x-shadow-link`, an open shadow root with `delegatesFocus`) stays (phase 3 review R1-04, `reviews/phase-3/notes.md` "Stand-ins")
- [X] T094 [P] [US5] `packages/elements/test/link.test.ts`, `packages/elements/test/browser/link.test.ts`, `fixtures/link.html`, `fixtures/link-target.html`; `packages/elements/test/browser-file/link-file.test.ts` with `browser-file/fixtures/` (policy in a `<meta>` element; US5-12); `entry-ocelle-link.test.ts`; `entry-root.test.ts`
- [X] T095 [P] [US5] `storybook/stories/link.stories.ts` (in a paragraph, wrapped across lines, focused, hover via #10's pointer parameter, a `label` containing the visible text) and the story test asserting no `label-content-name-mismatch` (plant: a story `label` without the visible text); `readme.test.ts` gains the link, the statement that the link is named with `label` and a host `aria-label` does not name it (FR-045), the `detail.href` warning, the label-in-name rule for `label`, and these statements (analysis G2): a host that navigates itself applies the same resolved-protocol check (FR-047); hosts that need other schemes handle the event (US5-9); a user's modified activation keeps the browser's new tab or window, and a Meta activation follows the platform's convention (operator decision 2 during phase 6); a modified activation of a link without `href` does nothing; a host that wants to open a new window itself handles the event (FR-049)
- [X] T096 [US5] `red.sh 6`

### Implementation (green)

- [X] T097 [US5] `packages/elements/src/link-target.ts` and `packages/elements/src/ocelle-link.ts` (R-08): `part="anchor"`, `delegatesFocus`, `href` on the anchor only when allowed, `role="link"` and `tabindex="0"` otherwise, plain-activation interception (Alt included) with Enter handled on keydown for anchors without `href`, cancelable event, `location.assign` of the allowed target, `label` (not reflected, trimmed, blank as none) set as the anchor's `aria-label` and removed when blank, following changes; no host `aria-label` read, forwarded or in `observedAttributes`; no host attribute written (FR-045, R-08)
- [X] T098 [US5] Manifest (with `label`, contracts § `ocelle-link`); README link section with every statement T095 checks (name the link with `label`; a host `aria-label` does not name it; the `detail.href` warning, the label-in-name rule for `label`, FR-047's resolved-protocol check for hosts, US5-9's other schemes, FR-049's three statements, the "new tab or window" sentence corrected so a Meta activation follows the platform's convention); CHANGELOG. Reopened by operator decisions 2 and 4 during phase 6 (R1-01, R1-03): the README link section also states the axe-core 4.14.0 limitation (a serious `color-contrast` incomplete, `bgOverlap`, on slotted link text wrapped onto exactly two lines; not a contrast failure; the link's colours are checked pairs; R-08), and the upstream axe-core report to file is recorded in `reviews/phase-6/notes.md` (not filed from the run)
- [X] T099 [US5] Baselines for the link stories with `pnpm run visual:update` in #10's pinned container under docker (`storybook/baselines/`), with any shared baseline (the token stories included) that changes, inspected and committed with the reason in the commit message; move the story-theme counts of `gates/test/integration/visual.test.ts` and add the new light stories that show `color-ink` to `gates/plants/visual/fail-token-changed/plant.json`; record in `reviews/phase-6/notes.md` that no podman cross-engine check was possible and CI confirms the baselines at landing (operator decision 2026-11-14, `reviews/phase-2/operator-decisions.md`; FR-053, SC-007)
- [X] T100 [US5] Plants recorded in `reviews/phase-6/plants.md`, the `label` path's included (contracts § Pairings: `label` set as the host's `aria-label`; forwarding the host `aria-label` to `part="anchor"`; a story `label` without the visible text); the gates of T028 plus `vitest run --project elements-browser-file`

### Landing fold (operator round 3, 2026-11-19)

The landing review (`reviews/landing/round-1.md`, L1-01 and L1-02) found US5-7 failing in CI in both harnesses, and with
it every mutation shard. Diagnosis: CI's Chromium draws text with subpixel (LCD) antialiasing, and the coloured fringe of
the "e" in "See " reaches the left ring sample, 3.5 px outside the link, under the 80%-opaque Highlight ring (red channel
54 against 55). Locally the test passes because the browser draws grayscale text: the headless-shell wrapper passes
`--disable-lcd-text`, and the container's fontconfig is grayscale. Phase 6 built US5-7, so the operator recorded the fold
as phase 6 operator round 3 (`reviews/phase-6/round-3.md`, O3-01): "Space the test link (Recommended)". T093 and T094
stay as written.

- [X] T115 [US5] US5-7 independent of text antialiasing (`reviews/phase-6/round-3.md` O3-01; landing L1-01, L1-02; R-15 "Amendment: text antialiasing under the ring samples"), test first. The fix is a test change, so the red step adds what makes the failure visible here: a fixture test that always runs US5-7 under subpixel text. The assertion, the sample point (3.5 px out) and every other pixel test and baseline stay unchanged.
  1. **Red** (test files only, one commit, `test(014-selection-input): phase 6 fix-3 red — US5-7 with subpixel text`). Two files under `packages/elements/test/browser/`:
     - `subpixel/fonts.conf`: includes `/etc/fonts/fonts.conf` and, in a `<match target="font">`, assigns `rgba` `rgb`, `lcdfilter` `lcddefault` and `hintstyle` `hintslight`. It changes how glyphs are drawn, not which fonts are used.
     - `link-subpixel.test.ts` (in `elements-browser`). In its own `beforeAll`, as `scrollbar.test.ts` does, it serves the fixture and launches its own Chromium: the `OCELLE_CHROMIUM_PATH` executable when that is set, otherwise Playwright's own, with `env: { ...process.env, FONTCONFIG_FILE: <the absolute path of subpixel/fonts.conf, from import.meta.url> }`. The shared `launch()`, `serve.ts`, `vitest.config.ts` and every other suite stay as they are.
     - Its header comment gives the reason (landing L1-01; CI draws subpixel text, the local default draws grayscale).
     - It has two `it`s. (i) A precondition, asserted unconditionally: black text drawn on white on a page of this browser has pixels whose channels differ by more than 8. The failure message must name the cause: the browser draws no subpixel text, for example because `OCELLE_CHROMIUM_PATH` points at a wrapper that passes `--disable-lcd-text`. Use `chrome-linux64/chrome` as quickstart.md says. This keeps (ii) from passing vacuously. (ii) The body whose name starts with `US5-7:`, found in `linkScenarios` and run unchanged on `link.html`, as `browser/link.test.ts` runs it. The assertion is the same single `toEqual` of `{ observed, clipboard, recorded }` against `{ expected, [], clean }`. US5-7 does not navigate, so it gets a `Navigation` whose members throw. Exactly one body may match, and that is asserted.
     - Measured on 2026-11-19, black text on white: `chrome-linux64/chrome` with this fontconfig draws 1276 coloured pixels and without it 0; the `chrome-headless-shell` wrapper draws 0 either way; the unwrapped `chrome-headless-shell.real` with the fontconfig draws 1276.

     Run `.specify/extensions/story/scripts/red.sh 6 fix-3` with `OCELLE_CHROMIUM_PATH=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome`, as for every phase 6 run. Confirm `"tests_only":true`, `"red":true` and `"recorded":true`; `red-commits` then holds `phase` and `fix-3 <sha>`. `red-fix-3.log` must show that:
     - the only failing test is `link-subpixel.test.ts`'s US5-7, and it fails on the `ring` entry of the `toEqual` (the left side `false`);
     - the precondition passes;
     - there is no load, launch or setup error;
     - US5-7 in `link.test.ts` and `browser/link.test.ts` passes, because those still draw grayscale.

     If US5-7 passes under this launch at the red commit, or fails on anything but `ring`, **stop and ask the operator**. Do not move the sample, loosen the colour comparison or add an assertion only to make it red.

     Why not an opt-in fixture behind an environment variable: `tdd-check.sh` re-runs every recorded red commit in a fresh worktree with the environment of whoever runs it. A red that needs the variable reads as "tests pass, so they were not red" for any checker without it. The always-on test is red for every checker. It also keeps a permanent local guard against the antialiasing CI uses.
  2. **Green** (test file only, one commit, `test(014-selection-input): phase 6 fix-3 — space the US5-7 link from its neighbours (O3-01)`). In the US5-7 body of `packages/elements/test/scenarios/ocelle-link.ts`, change only the mount to `await mount(driver, inPage, page(""), "#link { margin-inline: 0.75em; }");`. Add a comment saying why: the neighbouring glyphs sit clear of the ring band, so the ring samples do not depend on how the machine antialiases text (landing L1-01). `expected`, `ringPixels`, `over` and the 3.5 px sample stay unchanged. In the same commit, correct the body's plant comment so it names only the plants that bite (see step 4). Run `link-subpixel.test.ts`, `link.test.ts` and `browser/link.test.ts` green.
  3. **Checks against the operator's required change**. Run each one at a time and record it in `reviews/phase-6/notes.md` under "Landing fold (T115)", with the command and the result.
     - US5-7 in both harnesses (`--project elements packages/elements/test/link.test.ts -t US5-7` and `--project elements-browser packages/elements/test/browser/link.test.ts -t US5-7`):
       - grayscale (the default);
       - CI-like, with `FONTCONFIG_FILE=packages/elements/test/browser/subpixel/fonts.conf` set for the vitest process, which the in-process project's browser inherits too;
       - in the Playwright Docker image of the pinned Playwright (1.64.1), if Docker is available. If it is not, record that, and CI stands in.
     - Also run the CI-like pair at the red commit, so the record shows the in-process harness failing there on `ring` and passing after green. This harness has no committed subpixel test, because changing the `elements` project's launch would change every in-process pixel test.
     - The planted wrong ring still fails US5-7, under both the grayscale and the subpixel launch: plants.md's "the ring removed in forced colours" and "forced-color-adjust: none with the token colour kept", each applied alone to `ocelle-link.ts` and reverted. Record them as new rows in `reviews/phase-6/plants.md` with the launch named.
  4. **Ring-colour plant record**: checked while writing this task, and recorded here.
     - The US5-7 plant comment names "the ring in a token colour … in forced colours".
     - `reviews/phase-6/plants.md` has rows only for the ring removed and for `forced-color-adjust: none` with the token colour (both bite).
     - `reviews/phase-6/mutation.log` has no ring-colour entry. Stryker mutates the `css` template only as a whole, never the colour inside it, so no mutation record is owed.
     - The diagnosis showed that changing only `outline-color: Highlight` to `var(--ocelle-color-focus)` is not killed by US5-7. In forced colours Chromium replaces an author outline colour with the system colour unless `forced-color-adjust: none` is set, and that case is the row that bites. The swap is therefore equivalent in Chromium, not a gap in the test.
     - A record is needed, because the comment claims a plant that does not bite. Add one row to `reviews/phase-6/plants.md`: the colour-only swap, "does not bite: equivalent in Chromium (forced colours force the outline colour)". Step 2's comment correction matches it. Add no test and no source change for it.
  5. **Check, CI and records**. Run each of these one at a time: `pnpm test`, `gate:typecheck`, `gate:lint`, `gate:test-lint`, and `pnpm run gate:plants -- --affected <the fix-3 red sha>^`. `tdd-check.sh 6` must report `pass`.
     - Check the diff of the fold: it touches only the two new test files, `scenarios/ocelle-link.ts` and the phase 6 review records. There must be no baseline, no other pixel or visual test, no `vitest.config.ts` or `serve.ts` change and no element source change.
     - After the push the orchestrator does, CI must be green on the fold's head: Unit tests, every Mutation shard and the Mutation testing aggregate (L1-02). Every surviving mutant in new or changed code is killed or recorded as equivalent with its reason. Record the run id and the job results in `reviews/phase-6/notes.md` under T115.

**Checkpoint**: `tdd-check.sh 6` reports `pass`.

---

## Phase 7: Polish

**Purpose**: cross-element records only.

- [X] T110 `packages/elements/test/node/readme.test.ts` (red first): the README overview names the nine elements and the entry-point table lists every new specifier (contracts § Entry points); the README has one example per SC-009 use: the Open project folder picker (listbox), tabbed screens (tabs), segmented choices (segmented choice), in-text links (link) and copy fields (copy field), each built from the elements' public surface with no ARIA attribute, `ResizeObserver` or clipboard call of the host's own (SC-009, R-14; analysis G3)
- [X] T111 `packages/elements/README.md` overview, entry-point table and the SC-009 examples of T110; `packages/elements/CHANGELOG.md` MINOR entry naming the nine elements, six events and the engine floor raised to Chromium 125 / WebKit 17.4 as decided at the phase 4 stop (T059a, `reviews/phase-4/decision-1.md`). The second merge of main settled the README: the overview says "thirty-two elements" (main's list, then 014's nine) and the floor is mission 012's Chromium 135 / WebKit 17.4 (`reviews/landing/merge-notes.md`)
- [X] T112 If #16 (mission 008) has merged before this feature lands: the composed `ocelle-dialog` + `ocelle-listbox` story with its baselines from the pinned container under docker (FR-054; operator decision 2026-11-14, `reviews/phase-2/operator-decisions.md`); otherwise record in `reviews/phase-7/notes.md` that 008 adds it — #16 merged into main as 13af7a9; the story is deferred to `/ocelle-land` as a test-first landing fold (operator decision 1, `reviews/phase-7/operator-decisions.md`), recorded in `reviews/phase-7/notes.md`
- [X] T113 Full gate run per `specs/014-selection-input/quickstart.md` (`gate:visual` under docker included, quickstart step 4), one heavy job at a time; record in `reviews/phase-7/gates.md`, with the note that no podman cross-engine check was possible and CI confirms the baselines at landing — every gate exit 0, recorded in `reviews/phase-7/gates.md` with the known gaps

### Landing fold (operator round 2, 2026-11-18)

Phase 7 operator decision 1 (`reviews/phase-7/operator-decisions.md`, 2026-11-17) deferred T112's composed story to
`/ocelle-land`, after its merge of `main`. The landing merged `main` (`ac2f991`), which brings #16 (mission 008,
`ocelle-dialog`), and operator round 2 (`reviews/phase-7/round-2.md`, O2-01, blocking) asks for the story now. T112
stays as written: it records the deferral.

- [X] T114 The composed `ocelle-dialog` + `ocelle-listbox` story (FR-054, R-12 "Amendment: the composed story"; `reviews/phase-7/round-2.md` O2-01; phase 7 operator decisions 1 and 2), test first. Where it lives: as 008's composed tooltip story ("Inside an open dialog", `storybook/stories/tooltip.stories.ts`) does, in the inner element's stories file, `storybook/stories/listbox.stories.ts` (title `Elements/ocelle-listbox`), which also imports `../../packages/elements/src/ocelle-dialog.ts`; the export `InsideAnOpenDialog`, name "Inside an open dialog", id `elements-ocelle-listbox--inside-an-open-dialog`. 008's stand-in story `elements-ocelle-dialog--open-project` and its baselines stay unchanged.
  1. **Red** (test files only, one commit, `test(014-selection-input): phase 7 fix-2 red — the composed dialog and listbox story`): in `storybook/test/integration/elements-stories.test.ts`, a describe "the composed ocelle-dialog + ocelle-listbox story in the built Storybook (014 FR-054, O2-01)" that opens `elements-ocelle-listbox--inside-an-open-dialog` in light and dark and asserts, in one `toEqual`: through `observeDialogs`, the theme, base.css applied, `ocelle-dialog` defined and exactly one dialog, `shownDialog("Open project")` (open, shown, modal); through `observeListboxes`, both elements defined and exactly one listbox, value `gamma`, not scrolling, options `folderOptions("gamma", "", "gamma")` (the five folders, `gamma` selected, and focused: on open the dialog moves focus to the first focusable element of its body, 008 FR-007, which is the listbox's single tab stop, the selected option, US1 roving tabindex); that the listbox is a descendant of that `ocelle-dialog` and `document.elementFromPoint` at the centre of the `gamma` option returns that option (inside the modal, not behind it); through `axeResults` with the axe gate's full rule set, no violation and no serious or critical incomplete (no new entry in `storybook/a11y-exceptions.json`; R-12 "No other story adds an exception"); and no request outside the origin. Run `.specify/extensions/story/scripts/red.sh 7 fix-2` and confirm `"red":true` with the failure on these assertions (the story id is not in the built Storybook, so no dialog and no listbox are observed), not a load error of the test file. This red commit, `ea7eca6`, is proven and stays as it is (not amended, not reverted: the docs commits sit on it)
  1a. **Red, the listbox's tab stop at connect** (phase 7 operator decision 2, `reviews/phase-7/operator-decisions.md`: "Fix in listbox (Recommended)"; test files only, one commit on top of `ea7eca6` and the docs commits, before any green commit, `test(014-selection-input): phase 7 fix-2 red — the listbox's tab stop at connect (decision 2)`). Found while building the story: a dialog already open at load picks its initial focus (`#focusInitial`, `packages/elements/src/overlay.ts`, 008 FR-007) before `ocelle-listbox` has written its roving `tabindex`, so focus falls back to the dialog's close control instead of `gamma`. In `packages/elements/test/listbox.test.ts` (in process, on the element source; it also imports `../src/ocelle-dialog.ts`, and its header comment names the case), one `it` under the describe of US1: mount, as the story does, `<ocelle-dialog open label="Open project">` holding `<ocelle-listbox label="Folders" value="gamma">` with five options `alpha` to `epsilon` and a footer button, wait for the dialog's open, and assert in one `toEqual` that `document.activeElement` is the `gamma` option and that `gamma` has `tabindex="0"` and every other option `tabindex="-1"`. It may also check, in the same `it` or a second one, that a listbox with a selected option inserted into the page has `tabindex="0"` on that option synchronously after the insertion, before any `await` (before its first update), but only if that check fails at this commit; a check that passes before the fix proves nothing, so drop it. If the in-process mount does not reproduce the fallback (focus already on `gamma` at this commit), **stop and ask the operator**: do not weaken the test. Recording, with the script as it is: `red.sh` keeps one line per label (it deletes the `fix-2` line and appends the new one) and overwrites `red-fix-2.log`, and its label is only `phase` or `fix-<round>`, so a second line under `fix-2` and a label such as `fix-2b` are both impossible, and `fix-3` would claim a round that did not happen. So the fix-2 red set is the two test-only commits, `ea7eca6` then this one, and the record names its tip: first copy `ea7eca6`'s `red.sh 7 fix-2` output (sha, `"red":true`, exit code, the story assertions that failed) into `reviews/phase-7/notes.md` under T114, then commit this test, then run `.specify/extensions/story/scripts/red.sh 7 fix-2` again and confirm `"tests_only":true`, `"red":true`, `"recorded":true`; `red-commits` then reads `fix-2 <this sha>` (replacing `ea7eca6`), and `red-fix-2.log` must show both the story test (story id not built) and the new listbox test failing, the latter on its assertion (focus on the close control, or `gamma` not at `tabindex="0"`), not on a load error. `tdd-check.sh 7` then re-proves the tip, which holds both tests
  2. **Green** (two commits). First, the listbox fix, `fix(014-selection-input): the listbox writes its tab stop when it connects (decision 2)`: in `packages/elements/src/ocelle-listbox.ts` only, render the listbox at connect (`this.performUpdate()` at the end of `connectedCallback`): the roving `tabindex` and the selection states were already written at connect, but the shadow list and slot came only with the first deferred update, so the options were not slotted or rendered and could not take focus; keep the tab stop correct afterwards (option changes, value changes, upgrades of options defined later); run the new listbox test and the whole listbox suite green. `ocelle-dialog`, `overlay.ts` and every other file of 008 or main stay untouched. Then the story in `storybook/stories/listbox.stories.ts`, markup with no style attribute: `<ocelle-dialog open label="Open project"><p>Choose a folder.</p>` + `<ocelle-listbox label="Folders" value="gamma">` with the five folder options of the file's `listbox()` helper + two footer buttons, Cancel and Open (`slot="footer"`, `type="button"`, as `dialog.stories.ts`'s `actions`) + `</ocelle-dialog>`; update the file's header comment (the composed story, FR-054). Run the story test green. If the red or green run shows focus on another option, or any axe violation or serious or critical incomplete, **stop and ask the operator**: do not change the expectation (focus on `gamma`, unchanged by decision 2), add an exception or change element code beyond the listbox fix above in this fold
  3. **Baselines** (one commit): `pnpm run visual:update` in #10's pinned container under docker, which adds `storybook/baselines/elements-ocelle-listbox--inside-an-open-dialog.light.png` and `.dark.png`; inspect both (the dialog over its backdrop, the listbox in the dialog body, `gamma` selected with the focus ring as the capture shows it, the footer buttons). No other baseline may change; if one does, stop and ask. No podman cross-engine check is possible; CI confirms the baselines at landing (FR-053)
  4. **Union counts** (with the baselines commit; the counts after the merge of `main` are in `reviews/landing/merge-notes.md` § "Counts recomputed for the union", each moved by the one new story, two story-themes): `gates/test/integration/storybook-build.test.ts` 177 → 178 stories; `gates/test/integration/axe.test.ts` the repository run 354 → 356 story-theme runs (still 22 notes, 0 incomplete, 22 excepted) and its test title, and the unlabelled-button plant run 356 → 358; `gates/test/integration/visual.test.ts` 354 → 356 story-themes in the timeout comment, the repository run's title and its "354 captures match", the "2 findings in 354 story-themes" line and the `before.size` check; `gates/test/integration/plant-repo.test.ts` the repository's `storybook/baselines` 354 → 356 files; `gates/plants/visual/fail-token-changed/plant.json`: the light capture shows `color-ink` (the dialog body text), so add the finding `elements-ocelle-listbox--inside-an-open-dialog/light` (`differs`), 149 → 150 findings, and name it in `why` ("one hundred and fifty", with 014's listbox stories), as measured in the pinned container; if the measurement shows it does not differ, leave the plant at 149 and record why in `reviews/phase-7/notes.md`
  5. **Check and records**: `pnpm test`, `pnpm run gate:storybook-build` (178 stories), `pnpm run gate:visual` under docker (356 captures match), `pnpm run gate:axe` (356 story-theme runs, 0 serious or critical, 22 notes all excepted), `gate:csp`, `gate:typecheck`, `gate:lint`, `gate:test-lint`, `pnpm run gate:plants -- --affected ea7eca6^` (the parent of the first fix-2 red commit) (the visual and axe plants pass), one heavy job at a time; `tdd-check.sh 7` reports `pass`. Record in `reviews/phase-7/notes.md` under T112 that the composed story was added as this fold (commits, the measured `fail-token-changed` finding, no podman check), and under T114 the first-open focus finding, operator decision 2, the two fix-2 red commits (`ea7eca6`'s proof and the recorded tip) and the listbox fix commit; and in `reviews/phase-7/gates.md` the gate results

**Checkpoint**: `tdd-check.sh 7` reports `pass` (or the review records the documentation exemption for T111 to T113).

---

## Dependencies & Execution Order

- T001 (merge of `origin/main`, then the recheck against #10) blocks every other task. The implementer makes the
  merge before `base.sh 1`, as an exception to `/speckit-story-implement`'s step 2 for phase 1 only (second analysis,
  operator decision Q1 (b); phase 1 Delegation note).
- Phase 1 blocks phases 2 to 6 (driver commands and recorders, the file project).
- Phase 2 (US1) blocks phases 3 and 4: it creates `roving.ts`, `selection.ts`, `internals.ts`, the pairs check and the
  token pairs.
- Phases 5 (US4) and 6 (US5) depend only on phase 1 and the conventions, but share the README, the readme test, the
  story test, the manifest and `index.ts`, so phases run in order 2 to 7, one review unit at a time.
- T059a blocked every phase 4 task until the operator's answer to plan decision 1 was recorded (operator decisions
  Q2 (c) and, second analysis, Q3 (b)). The answer is yes (`reviews/phase-4/decision-1.md`): T064, T066 and T067
  apply; T062a, T064a, T066a and T067a are skipped.

## Parallel Opportunities

- Within each red commit, the test files marked [P] touch different files and can be written in parallel.
- Heavy runs (browser suites, plants, mutation, `gate:visual`) never run in parallel.

## Implementation Strategy

- MVP: phases 1 and 2 give a gated, keyboard-complete `ocelle-listbox` for #16's Open project dialog.
- Then tabs (phase 3) and the segmented choice (phase 4) on the same mechanism, the copy field (phase 5) and the
  link (phase 6), each folded after approval; phase 7 closes the cross-element records.
